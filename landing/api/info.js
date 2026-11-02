const { callScript, send } = require('./_lib');

// Dati del titolare per l'informativa privacy (nome ed email dell'account Google che invia i bonus).
let cache = null;
module.exports = async (req, res) => {
  if (!cache) {
    const out = await callScript({ action: 'info' });
    if (out.ok) cache = { controller: out.controller, contactEmail: out.contactEmail, privacyVersion: out.privacyVersion };
    else return send(res, 502, { ok: false, error: out.error });
  }
  return send(res, 200, { ok: true, ...cache });
};
