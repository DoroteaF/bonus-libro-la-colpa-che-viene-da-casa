const { callScript, send, readBody } = require('./_lib');

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i;

// Riceve il modulo, salva i dati nel foglio Google e restituisce il link della cartella dei bonus.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' });
  const b = await readBody(req);

  // Campo trappola per i bot: invisibile alle persone. Se è pieno non salviamo niente.
  if (b.website) return send(res, 400, { ok: false, error: 'rejected' });

  const nome = String(b.nome || '').trim().slice(0, 60);
  const cognome = String(b.cognome || '').trim().slice(0, 60);
  const email = String(b.email || '').trim().toLowerCase();
  if (!nome) return send(res, 400, { ok: false, error: 'nome_required' });
  if (!cognome) return send(res, 400, { ok: false, error: 'cognome_required' });
  if (email.length > 254 || !EMAIL.test(email)) return send(res, 400, { ok: false, error: 'email_invalid' });
  if (b.privacy !== true) return send(res, 400, { ok: false, error: 'privacy_required' });

  const out = await callScript({
    action: 'subscribe',
    nome,
    cognome,
    email,
    privacy: true,
    newsletter: b.newsletter === true,
    source: String(b.source || 'landing').slice(0, 40)
  });
  if (!out.ok || !out.bonusUrl) return send(res, 502, { ok: false, error: out.error || 'error' });
  return send(res, 200, { ok: true, nome: out.nome, bonusUrl: out.bonusUrl });
};
