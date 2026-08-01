import { getStore } from "@netlify/blobs";

const STORE_NAME = "health-vitals-records";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

function respond(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
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
    ["weightLastYear", "Cân nặng 1 năm trước"],
    ["waist", "Vòng bụng"],
    ["pulse", "Mạch"],
    ["bpSystolic", "Huyết áp tâm thu"],
    ["bpDiastolic", "Huyết áp tâm trương"],
    ["respRate", "Nhịp thở"],
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
  // Xử lý preflight CORS
  if (req.method === "OPTIONS") {
    return respond(200, {});
  }

  const store = getStore(STORE_NAME);

  try {
    if (req.method === "GET") {
      const { blobs } = await store.list();
      const records = await Promise.all(
        blobs.map((b) => store.get(b.key, { type: "json" }))
      );
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return respond(200, { records });
    }

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
        height: Number(payload.height),
        weightNow: Number(payload.weightNow),
        weightLastYear: Number(payload.weightLastYear),
        waist: Number(payload.waist),
        pulse: Number(payload.pulse),
        bpSystolic: Number(payload.bpSystolic),
        bpDiastolic: Number(payload.bpDiastolic),
        respRate: Number(payload.respRate),
        createdAt: new Date().toISOString(),
      };

      await store.setJSON(id, record);
      return respond(200, { record });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      if (!id) return respond(400, { errors: ["Thiếu id bản ghi cần xoá."] });
      await store.delete(id);
      return respond(200, { success: true });
    }

    return respond(405, { errors: ["Phương thức không được hỗ trợ."] });
  } catch (err) {
    return respond(500, { errors: [`Lỗi máy chủ: ${err.message}`] });
  }
};
