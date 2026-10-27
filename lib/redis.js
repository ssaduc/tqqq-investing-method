// Upstash Redis REST (Vercel Marketplace 연동 시 환경변수가 자동으로 들어옵니다). 별도 npm 패키지 없음.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function cmd(args) {
  if (!URL_ || !TOKEN) throw new Error('Redis 환경변수가 없습니다 (KV_REST_API_URL / KV_REST_API_TOKEN)');
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'redis http ' + r.status);
  return j.result;
}
async function getJson(key) { const v = await cmd(['GET', key]); return v ? JSON.parse(v) : null; }
async function setJson(key, val) { await cmd(['SET', key, JSON.stringify(val)]); }

module.exports = { getJson, setJson };
