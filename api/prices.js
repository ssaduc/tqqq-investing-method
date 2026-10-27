const { getJson, setJson } = require('../lib/redis');
const { authorized } = require('../lib/auth');
const { fetchHistory } = require('../lib/history');
const KEY = 'vt:prices';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const refresh = (req.query && req.query.refresh) || /[?&]refresh=1/.test(req.url || '');
    let doc = (await getJson(KEY)) || { series: [], src: '', updatedAt: '' };
    if (refresh) {
      try {
        const h = await fetchHistory('TQQQ');
        doc = { series: h.series, src: h.src, updatedAt: new Date().toISOString() };
        await setJson(KEY, doc);
      } catch (e) {
        return res.status(200).json(Object.assign({}, doc, { error: String(e.message || e) }));
      }
    }
    return res.status(200).json(doc);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
