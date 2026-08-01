import { getStore } from "@netlify/blobs";

const STORE_NAME = "health-vitals-records";

// Tài khoản admin mặc định (đổi tại đây nếu muốn)
const ADMIN_USER = "admin";
const ADMIN_PASS = "duc123";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

function respond(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function checkAuth(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Basic ")) return false;

  try {
    const decoded = atob(auth.slice(6));
    const [user, pass] = decoded.split(":");
    return user === ADMIN_USER && pass === ADMIN_PASS;
  } catch {
    return false;
  }
}

function validate(payload) {
  const errors = [];

  const code = String(payload.code || "").trim();
  if (!/^\d{4}$/.test(code)) {
    errors.push("Mã code phải gồm đúng 4 chữ số.");
  }

  const numericFields = [
    ["height", "Chiều cao"],
    ["weightNow", "Cân nặng hiện tại"],
    ["weightPrev", "Cân nặng 1 năm trước"],
    ["waist", "Vòng bụng"],
    ["pulse", "Mạch"],
    ["bpSys", "Huyết áp tâm thu"],
    ["bpDia", "Huyết áp tâm trương"],
    ["resp", "Nhịp thở"],
  ];

  for (const [key, label] of numericFields) {
    const value = Number(payload[key]);
    if (payload[key] === undefined || payload[key] === "" || Number.isNaN(value) || value <= 0) {
      errors.push(`${label} không hợp lệ.`);
    }
  }

  return errors;
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return respond(200, {});
  }

  const store = getStore(STORE_NAME);

  try {
    // ========== GET (cần đăng nhập) ==========
    if (req.method === "GET") {
      if (!checkAuth(req)) {
        return respond(401, { errors: ["Unauthorized"] });
      }

      const { blobs } = await store.list();
      const records = await Promise.all(
        blobs.map((b) => store.get(b.key, { type: "json" }))
      );
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return respond(200, records);
    }

    // ========== POST (không cần đăng nhập) ==========
    if (req.method === "POST") {
      const payload = await req.json();
      const errors = validate(payload);
      if (errors.length) {
        return respond(400, { errors });
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record = {
        id,
        code: String(payload.code).trim(),
        date: payload.date || new Date().toISOString().slice(0, 10),
        height: Number(payload.height),
        weightNow: Number(payload.weightNow),
        weightPrev: Number(payload.weightPrev),
        waist: Number(payload.waist),
        pulse: Number(payload.pulse),
        bpSys: Number(payload.bpSys),
        bpDia: Number(payload.bpDia),
        resp: Number(payload.resp),
        createdAt: new Date().toISOString(),
      };

      await store.setJSON(id, record);
      return respond(200, { record });
    }

    // ========== DELETE (cần đăng nhập) ==========
    if (req.method === "DELETE") {
      if (!checkAuth(req)) {
        return respond(401, { errors: ["Unauthorized"] });
      }

      let id = null;

      try {
        const body = await req.json();
        id = body.id || body.ts;
      } catch {}

      if (!id) {
        const url = new URL(req.url);
        id = url.searchParams.get("id") || url.searchParams.get("ts");
      }

      if (!id) {
        return respond(400, { errors: ["Thiếu id bản ghi cần xoá."] });
      }

      await store.delete(id);
      return respond(200, { success: true });
    }

    return respond(405, { errors: ["Phương thức không được hỗ trợ."] });
  } catch (err) {
    return respond(500, { errors: [`Lỗi máy chủ: ${err.message}`] });
  }
};
