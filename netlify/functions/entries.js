const { getStore } = require('@netlify/blobs');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'duc123';

function isAuthorized(event) {
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  if (!auth.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return false;
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    return user === ADMIN_USER && pass === ADMIN_PASS;
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const store = getStore({ name: 'health-entries', consistency: 'strong' });
  const headers = { 'Content-Type': 'application/json' };

  try {
    if (event.httpMethod === 'GET') {
      if (!isAuthorized(event)) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
      const { blobs } = await store.list();
      const entries = [];
      for (const b of blobs) {
        const val = await store.get(b.key, { type: 'json' });
        if (val) entries.push(val);
      }
      entries.sort((a, b) => b.ts - a.ts);
      return { statusCode: 200, headers, body: JSON.stringify(entries) };
    }

    if (event.httpMethod === 'POST') {
      const entry = JSON.parse(event.body || '{}');
      if (!entry.ts || !entry.code) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Thiếu dữ liệu bắt buộc' }) };
      }
      await store.setJSON(`entry:${entry.ts}`, entry);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === 'DELETE') {
      if (!isAuthorized(event)) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
      const ts = event.queryStringParameters && event.queryStringParameters.ts;
      if (!ts) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Thiếu ts' }) };
      }
      await store.delete(`entry:${ts}`);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
