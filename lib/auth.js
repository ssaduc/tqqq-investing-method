const crypto = require('crypto');

function safeEq(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
// 사용자: x-app-key 헤더 == APP_PASSWORD. Vercel Cron: Authorization: Bearer CRON_SECRET.
function authorized(req) {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return false; // 비밀번호를 설정하지 않으면 모두 거부 (공개 노출 방지)
  if (safeEq(req.headers['x-app-key'], pw)) return true;
  const cs = process.env.CRON_SECRET;
  if (cs && safeEq(req.headers['authorization'], 'Bearer ' + cs)) return true;
  return false;
}
module.exports = { authorized };
