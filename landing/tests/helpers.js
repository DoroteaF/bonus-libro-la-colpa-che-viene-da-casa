// Strumenti per i test: richieste/risposte finte per le funzioni Vercel.
function fakeReq({ method = 'GET', body, query = {}, headers = {} } = {}) {
  return { method, body, query, headers: { host: 'bonus.example.vercel.app', ...headers }, url: '/' };
}
function fakeRes() {
  const res = { statusCode: 200, headers: {}, body: '' };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.end = (b) => { res.body = b || ''; res.ended = true; };
  res.json = () => JSON.parse(res.body);
  return res;
}
function mockScript(handler) {
  const calls = [];
  global.fetch = async (url, opts) => {
    const payload = JSON.parse(opts.body);
    calls.push({ url, payload });
    const out = await handler(payload);
    return { text: async () => JSON.stringify(out) };
  };
  return calls;
}
module.exports = { fakeReq, fakeRes, mockScript };
