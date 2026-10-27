const { getJson, setJson } = require('../lib/redis');
const { authorized } = require('../lib/auth');
const KEY = 'vt:state';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    if (req.method === 'GET') return res.status(200).json({ state: await getJson(KEY) });
    if (req.method === 'PUT') {
      const s = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!s || s.v !== 1 || !s.account || !Array.isArray(s.log)) return res.status(400).json({ error: 'bad state' });
      await setJson(KEY, s);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
