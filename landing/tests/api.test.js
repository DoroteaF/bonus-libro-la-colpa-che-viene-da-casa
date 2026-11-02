const test = require('node:test');
const assert = require('node:assert');
const { fakeReq, fakeRes, mockScript } = require('./helpers');

process.env.GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/TEST/exec';
process.env.APPS_SCRIPT_SECRET = 'segreto-di-prova';
process.env.BONUS_DRIVE_URL = 'https://drive.google.com/drive/folders/X';

const subscribe = require('../api/subscribe');
const info = require('../api/info');
const OK = { ok: true, nome: 'Anna', bonusUrl: 'https://drive.google.com/drive/folders/X' };
const valid = { nome: ' Anna ', cognome: ' Rossi ', email: 'Anna@Example.IT ', privacy: true };

test('subscribe: salva tramite lo script e restituisce subito il link dei bonus', async () => {
  const calls = mockScript(() => OK);
  const res = fakeRes();
  await subscribe(fakeReq({ method: 'POST', body: { ...valid, newsletter: true } }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), OK);
  assert.equal(calls.length, 1);
  const p = calls[0].payload;
  assert.equal(p.secret, 'segreto-di-prova');
  assert.equal(p.action, 'subscribe');
  assert.equal(p.nome, 'Anna'); assert.equal(p.cognome, 'Rossi'); assert.equal(p.email, 'anna@example.it');
  assert.equal(p.newsletter, true);
});

test('subscribe: dati mancanti o errati non arrivano allo script', async () => {
  const calls = mockScript(() => OK);
  for (const [patch, err] of [
    [{ nome: '' }, 'nome_required'],
    [{ cognome: '' }, 'cognome_required'],
    [{ email: 'non-una-email' }, 'email_invalid'],
    [{ privacy: false }, 'privacy_required']
  ]) {
    const res = fakeRes();
    await subscribe(fakeReq({ method: 'POST', body: { ...valid, ...patch } }), res);
    assert.equal(res.statusCode, 400, err);
    assert.equal(res.json().error, err);
  }
  assert.equal(calls.length, 0);
});

test('subscribe: il campo trappola ferma i bot senza salvare e senza dare il link', async () => {
  const calls = mockScript(() => OK);
  const res = fakeRes();
  await subscribe(fakeReq({ method: 'POST', body: { ...valid, website: 'http://spam' } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().bonusUrl, undefined);
  assert.equal(calls.length, 0);
});

test('subscribe: solo POST, e errore chiaro senza variabili su Vercel', async () => {
  let res = fakeRes();
  await subscribe(fakeReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
  const saved = process.env.GOOGLE_SCRIPT_URL; delete process.env.GOOGLE_SCRIPT_URL;
  res = fakeRes();
  await subscribe(fakeReq({ method: 'POST', body: valid }), res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.json().error, 'server_not_configured');
  process.env.GOOGLE_SCRIPT_URL = saved;
});

test('subscribe: se lo script risponde male non si mostra nessun link', async () => {
  mockScript(() => ({ ok: false, error: 'unauthorized' }));
  const res = fakeRes();
  await subscribe(fakeReq({ method: 'POST', body: valid }), res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.json().error, 'unauthorized');
});

test('info: dati del titolare senza la chiave segreta', async () => {
  mockScript(() => ({ ok: true, controller: 'Bianca Fiorentini', contactEmail: 'x@gmail.com', privacyVersion: 'v' }));
  const res = fakeRes();
  await info(fakeReq(), res);
  assert.equal(res.json().controller, 'Bianca Fiorentini');
  assert.equal(res.json().secret, undefined);
});

test('subscribe: il link mostrato è quello di BONUS_DRIVE_URL su Vercel', async () => {
  process.env.BONUS_DRIVE_URL = 'https://drive.google.com/drive/folders/DA-VERCEL?usp=sharing';
  mockScript(() => ({ ok: true, nome: 'Anna', bonusUrl: 'https://drive.google.com/drive/folders/DALLO-SCRIPT' }));
  const res = fakeRes();
  await subscribe(fakeReq({ method: 'POST', body: valid }), res);
  assert.equal(res.json().bonusUrl, 'https://drive.google.com/drive/folders/DA-VERCEL?usp=sharing');
  process.env.BONUS_DRIVE_URL = 'https://drive.google.com/drive/folders/X';
});
