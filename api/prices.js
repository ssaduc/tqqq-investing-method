const { getJson, setJson } = require('../lib/redis');
const { authorized } = require('../lib/auth');
const { fetchHistory, fetchFx } = require('../lib/history');
const KEY = 'vt:prices', FXKEY = 'vt:fx';

// GET: 저장된 TQQQ 종가와 원/달러 환율. ?refresh=1: 둘 다 새로 가져와 저장 (Vercel Cron도 이 경로를 부릅니다)
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const refresh = (req.query && req.query.refresh) || /[?&]refresh=1/.test(req.url || '');
    let doc = (await getJson(KEY)) || { series: [], src: '', updatedAt: '' };
    let fx = await getJson(FXKEY);
    const out = {};
    if (refresh) {
      const now = new Date().toISOString();
      try { const h = await fetchHistory('TQQQ'); doc = { series: h.series, src: h.src, updatedAt: now }; await setJson(KEY, doc); }
      catch (e) { out.error = String(e.message || e); }
      try { const f = await fetchFx(); fx = { series: f.series, src: f.src, updatedAt: now }; await setJson(FXKEY, fx); }
      catch (e) { out.fxError = String(e.message || e); }
    }
    return res.status(200).json(Object.assign({}, doc, { fx: fx || null }, out));
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
