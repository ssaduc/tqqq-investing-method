// TQQQ 일봉 종가 조회: Yahoo 차트 JSON → 실패 시 Stooq CSV. 아직 마감 전인 오늘 봉은 제외.
const NY = 'America/New_York';
function nyParts(ms) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: NY, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const o = {}; f.formatToParts(new Date(ms)).forEach(p => { o[p.type] = p.value; });
  return { date: o.year + '-' + o.month + '-' + o.day, mins: +o.hour * 60 + +o.minute };
}
function completed(bars, nowMs) {
  const ny = nyParts(nowMs);
  return bars.filter(b => b.c > 0 && (b.d < ny.date || (b.d === ny.date && ny.mins >= 16 * 60 + 15)));
}
function parseYahoo(j) {
  const r = j && j.chart && j.chart.result && j.chart.result[0];
  if (!r || !r.timestamp) throw new Error('yahoo 형식 오류');
  const cl = r.indicators.quote[0].close;
  return r.timestamp.map((t, i) => ({ d: nyParts(t * 1000).date, c: cl[i] == null ? null : Math.round(cl[i] * 10000) / 10000 })).filter(b => b.c != null);
}
function parseStooq(csv) {
  const bars = csv.trim().split(/\r?\n/).slice(1).map(l => l.split(',')).map(a => ({ d: a[0], c: parseFloat(a[4]) })).filter(b => /^\d{4}-\d\d-\d\d$/.test(b.d) && b.c > 0);
  if (!bars.length) throw new Error('stooq 형식 오류');
  return bars;
}
async function fetchHistory(ticker, nowMs) {
  const errs = [];
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + ticker + '?range=2y&interval=1d', { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error('yahoo http ' + r.status);
    return { series: completed(parseYahoo(await r.json()), nowMs || Date.now()).slice(-520), src: 'Yahoo Finance' };
  } catch (e) { errs.push(e.message); }
  try {
    const r = await fetch('https://stooq.com/q/d/l/?s=' + ticker.toLowerCase() + '.us&i=d');
    if (!r.ok) throw new Error('stooq http ' + r.status);
    return { series: completed(parseStooq(await r.text()), nowMs || Date.now()).slice(-520), src: 'Stooq' };
  } catch (e) { errs.push(e.message); }
  throw new Error(errs.join(', '));
}
// 원/달러 환율 일봉: Yahoo(KRW=X, 거래소 현지 날짜) → 실패 시 Stooq(usdkrw). 양도세 원화 환산용.
function parseYahooFx(j) {
  const r = j && j.chart && j.chart.result && j.chart.result[0];
  if (!r || !r.timestamp) throw new Error('yahoo fx 형식 오류');
  const meta = r.meta || {}, cl = r.indicators.quote[0].close, m = new Map();
  let day = t => new Date((t + (meta.gmtoffset || 0)) * 1000).toISOString().slice(0, 10);
  if (meta.exchangeTimezoneName) { try { const f = new Intl.DateTimeFormat('en-CA', { timeZone: meta.exchangeTimezoneName, year: 'numeric', month: '2-digit', day: '2-digit' }); day = t => f.format(new Date(t * 1000)); } catch (e) {} }
  r.timestamp.forEach((t, i) => { const c = cl[i]; if (c > 0) m.set(day(t), Math.round(c * 100) / 100); });
  return [...m.entries()].map(([d, c]) => ({ d, c })).sort((a, b) => (a.d < b.d ? -1 : 1));
}
async function fetchFx() {
  const errs = [];
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?range=2y&interval=1d', { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error('yahoo fx http ' + r.status);
    const s = parseYahooFx(await r.json()).filter(b => b.c > 500 && b.c < 3000);
    if (!s.length) throw new Error('yahoo fx 빈 자료');
    return { series: s.slice(-520), src: 'Yahoo Finance USD/KRW' };
  } catch (e) { errs.push(e.message); }
  try {
    const r = await fetch('https://stooq.com/q/d/l/?s=usdkrw&i=d');
    if (!r.ok) throw new Error('stooq fx http ' + r.status);
    return { series: parseStooq(await r.text()).slice(-520), src: 'Stooq USD/KRW' };
  } catch (e) { errs.push(e.message); }
  throw new Error(errs.join(', '));
}
module.exports = { fetchHistory, fetchFx, completed, parseYahoo, parseYahooFx, parseStooq, nyParts };
