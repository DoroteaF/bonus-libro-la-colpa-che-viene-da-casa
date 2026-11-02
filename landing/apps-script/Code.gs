/**
 * Landing bonus · "La Colpa che Viene da Casa" · Bianca Fiorentini
 *
 * Da incollare nel foglio "lead libro la colpa che viene da casa"
 * (Estensioni > Apps Script) e pubblicare come Applicazione web:
 *   Esegui come: Io   ·   Chi ha accesso: Chiunque
 *
 * Lo chiamano solo le funzioni della landing su Vercel (cartella api/), che
 * conoscono la chiave segreta qui sotto: l'indirizzo dello script e il link
 * dei bonus non compaiono mai nel codice della pagina.
 * Nessuna email viene inviata: lo script salva i dati e restituisce il link.
 */

var CONFIG = {
  // Deve essere identica alla variabile SHARED_SECRET impostata su Vercel.
  SECRET: 'vhrbUfvYpOKwhSAkVpFn8P8DIGP90fOCbt3PGzX3sEE',

  BOOK_TITLE: 'La Colpa che Viene da Casa',
  CONTROLLER: 'Bianca Fiorentini',

  // Cartella Drive con i due bonus (condivisa con "Chiunque abbia il link").
  BONUS_URL: 'https://drive.google.com/drive/folders/1VxvDNPHyHzNCba4GioD55jyGcd-QhqPd?usp=sharing',

  // Scheda del foglio dove salvare i contatti (creata se non esiste).
  SHEET_NAME: 'Lead',

  // Versione dell'informativa privacy mostrata sulla landing.
  PRIVACY_VERSION: '2026-11-02'
};

var HEADERS = ['Data primo invio', 'Nome', 'Cognome', 'Email', 'Libro', 'Consenso', 'Newsletter',
  'Ultimo invio', 'Invii', 'Fonte', 'Versione informativa'];
var COL = {};
HEADERS.forEach(function (h, i) { COL[h] = i + 1; });

/* ------------------------------------------------------------------ */

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }
  return json_(handle_(body));
}

function doGet() {
  return json_({ ok: true, service: 'landing-bonus' });
}

function handle_(body) {
  if (!body || body.secret !== CONFIG.SECRET) return { ok: false, error: 'unauthorized' };
  if (body.action === 'info') return info_();
  if (body.action !== 'subscribe') return { ok: false, error: 'unknown_action' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return subscribe_(body);
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ */

function subscribe_(b) {
  var nome = clean_(b.nome, 60);
  var cognome = clean_(b.cognome, 60);
  var email = String(b.email || '').trim().toLowerCase();
  if (!nome) return { ok: false, error: 'nome_required' };
  if (!cognome) return { ok: false, error: 'cognome_required' };
  if (!isEmail_(email)) return { ok: false, error: 'email_invalid' };
  if (b.privacy !== true) return { ok: false, error: 'privacy_required' };

  var sh = sheet_();
  var row = findEmail_(sh, email);
  var now = new Date();
  var newsletter = b.newsletter === true;

  if (row) {
    // Stessa email: aggiorna nome, ultimo invio e numero di invii, senza righe doppie.
    var invii = Number(sh.getRange(row, COL['Invii']).getValue()) || 1;
    sh.getRange(row, COL['Nome']).setValue(nome);
    sh.getRange(row, COL['Cognome']).setValue(cognome);
    sh.getRange(row, COL['Ultimo invio']).setValue(now);
    sh.getRange(row, COL['Invii']).setValue(invii + 1);
    if (newsletter) sh.getRange(row, COL['Newsletter']).setValue('sì');
  } else {
    var v = {};
    v['Data primo invio'] = now;
    v['Nome'] = nome;
    v['Cognome'] = cognome;
    v['Email'] = email;
    v['Libro'] = CONFIG.BOOK_TITLE;
    v['Consenso'] = 'sì';
    v['Newsletter'] = newsletter ? 'sì' : 'no';
    v['Ultimo invio'] = now;
    v['Invii'] = 1;
    v['Fonte'] = clean_(b.source, 40) || 'landing';
    v['Versione informativa'] = CONFIG.PRIVACY_VERSION;
    sh.appendRow(HEADERS.map(function (h) { return v[h]; }));
  }
  return { ok: true, nome: nome, bonusUrl: CONFIG.BONUS_URL };
}

function info_() {
  return {
    ok: true,
    controller: CONFIG.CONTROLLER,
    contactEmail: Session.getEffectiveUser().getEmail(),
    privacyVersion: CONFIG.PRIVACY_VERSION
  };
}

/* ------------------------------------------------------------------ */

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    var first = ss.getSheets()[0];
    if (first && first.getLastRow() === 0) { first.setName(CONFIG.SHEET_NAME); sh = first; }
    else sh = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function findEmail_(sh, email) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var vals = sh.getRange(2, COL['Email'], last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function clean_(s, max) {
  // Toglie caratteri di controllo e quelli che il foglio leggerebbe come formula.
  return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().replace(/^[=+\-@]+/, '').trim().slice(0, max);
}
function isEmail_(s) {
  return s.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(s);
}

/** Da eseguire una volta dall'editor (▶ Esegui) per autorizzare l'accesso al foglio e creare le intestazioni. */
function setup() {
  sheet_();
  Logger.log('Foglio pronto. Account: ' + Session.getEffectiveUser().getEmail());
}
