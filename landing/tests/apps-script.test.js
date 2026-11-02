// Esegue Code.gs in Node con un foglio Google simulato in memoria.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadScript() {
  const rows = [];
  const range = (r, c, nr = 1, nc = 1) => ({
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (rows[r - 1 + i] || [])[c - 1 + j] ?? '')),
    getValue: () => (rows[r - 1] || [])[c - 1] ?? '',
    setValue: (v) => { rows[r - 1][c - 1] = v; },
    setFontWeight: () => {}
  });
  const sheet = { name: 'Foglio1', getLastRow: () => rows.length, appendRow: (v) => rows.push([...v]), getRange: range,
    setFrozenRows: () => {}, setName: (n) => { sheet.name = n; } };
  const ss = { getSheetByName: (n) => (sheet.name === n ? sheet : null), getSheets: () => [sheet], insertSheet: () => sheet };
  const mails = [];
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    MailApp: { sendEmail: (m) => mails.push(m) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ text: t, setMimeType() { return this; } }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'bianca.autrice@gmail.com' }) },
    Logger: { log: () => {} },
    Date, JSON, String, Number, Math, Array, Object
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx);
  const post = (body, secret = ctx.CONFIG.SECRET) =>
    JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ secret, ...body }) } }).text);
  return { ctx, rows, sheet, mails, post };
}
const ok = { action: 'subscribe', nome: 'Anna', cognome: 'Rossi', email: 'Anna@Example.it', privacy: true };

test('senza la chiave segreta non salva niente e non dà il link', () => {
  const s = loadScript();
  const out = s.post(ok, 'sbagliata');
  assert.equal(out.ok, false);
  assert.equal(out.bonusUrl, undefined);
  assert.equal(s.rows.length, 0);
});

test('salva la riga con le colonne del foglio e restituisce il link della cartella', () => {
  const s = loadScript();
  const out = s.post({ ...ok, source: 'qr-libro' });
  assert.equal(out.ok, true);
  assert.equal(out.nome, 'Anna');
  assert.match(out.bonusUrl, /drive\.google\.com\/drive\/folders\/1VxvDNPHyHzNCba4GioD55jyGcd-QhqPd/);
  assert.equal(s.sheet.name, 'Lead');
  assert.deepEqual(s.rows[0], ['Data primo invio', 'Nome', 'Cognome', 'Email', 'Libro', 'Consenso', 'Newsletter', 'Ultimo invio', 'Invii', 'Fonte', 'Versione informativa']);
  const r = s.rows[1];
  assert.ok(r[0] instanceof Date);
  assert.deepEqual(r.slice(1, 7), ['Anna', 'Rossi', 'anna@example.it', 'La Colpa che Viene da Casa', 'sì', 'no']);
  assert.equal(r[8], 1);
  assert.equal(r[9], 'qr-libro');
  assert.equal(s.mails.length, 0, 'nessuna email inviata');
});

test('stessa email: nessuna riga doppia, aumenta il contatore Invii', () => {
  const s = loadScript();
  s.post(ok);
  const first = s.rows[1][0];
  s.post({ ...ok, email: 'ANNA@example.it ', nome: 'Annalisa', newsletter: true });
  s.post(ok);
  assert.equal(s.rows.length, 2);
  assert.equal(s.rows[1][0], first, 'la data del primo invio non cambia');
  assert.equal(s.rows[1][8], 3);
  assert.equal(s.rows[1][6], 'sì', 'il consenso newsletter dato una volta resta');
  assert.equal(s.rows[1][1], 'Anna');
});

test('dati non validi e protezione dalle formule', () => {
  const s = loadScript();
  assert.equal(s.post({ ...ok, email: 'x' }).error, 'email_invalid');
  assert.equal(s.post({ ...ok, cognome: '' }).error, 'cognome_required');
  assert.equal(s.post({ ...ok, privacy: false }).error, 'privacy_required');
  s.post({ ...ok, email: 'f@b.it', nome: '=IMPORTXML("http://x";"//a")', cognome: '+SUM(1)' });
  assert.ok(!/^[=+\-@]/.test(String(s.rows[1][1])));
  assert.ok(!/^[=+\-@]/.test(String(s.rows[1][2])));
});

test('info restituisce titolare ed email di contatto', () => {
  const s = loadScript();
  const out = s.post({ action: 'info' });
  assert.equal(out.controller, 'Bianca Fiorentini');
  assert.equal(out.contactEmail, 'bianca.autrice@gmail.com');
});
