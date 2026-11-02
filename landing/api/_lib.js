// Funzioni comuni per le API della landing (i file che iniziano con _ non diventano endpoint su Vercel).

async function callScript(payload) {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.SHARED_SECRET;
  if (!url || !secret) return { ok: false, error: 'server_not_configured' };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, secret }),
      redirect: 'follow'
    });
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { ok: false, error: 'bad_script_response' }; }
  } catch (e) {
    return { ok: false, error: 'script_unreachable' };
  }
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

module.exports = { callScript, send, readBody };
