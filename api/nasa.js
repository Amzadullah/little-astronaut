// Vercel serverless function: GET /api/nasa
// REAL space-weather events from NASA DONKI (last 30 days): solar flares (FLR),
// solar energetic particles (SEP) and CMEs. Tries api.nasa.gov first, then
// NASA CCMC's own DONKI server (no key needed).
// Set NASA_API_KEY in Vercel → Settings → Environment Variables.

const DAYS = 30;
const VERSION = 2;
const iso = d => d.toISOString().slice(0, 10);

async function donki(kind, start, end, key) {
  const urls = [
    `https://api.nasa.gov/DONKI/${kind}?startDate=${start}&endDate=${end}&api_key=${key}`,
    `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${kind}?startDate=${start}&endDate=${end}`,
  ];
  const errors = [];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'little-astronauts-app' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const t = await r.text();
      return { data: t.trim() ? JSON.parse(t) : [], from: new URL(url).hostname };
    } catch (e) {
      errors.push(`${new URL(url).hostname}: ${e.message}`);
    }
  }
  return { data: [], from: null, errors };
}

export default async function handler(req, res) {
  const key = process.env.NASA_API_KEY || 'DEMO_KEY';
  const endD = new Date();
  const startD = new Date(endD.getTime() - (DAYS - 1) * 864e5);
  const start = iso(startD), end = iso(endD);

  const [flr, sep, cme] = await Promise.all([
    donki('FLR', start, end, key),
    donki('SEP', start, end, key),
    donki('CME', start, end, key),
  ]);

  const dayOf = t => Math.floor((Date.parse(t.slice(0, 10)) - Date.parse(start)) / 864e5) + 1;
  const events = [];
  for (const f of flr.data) {
    if (!f.beginTime) continue;
    events.push({ day: dayOf(f.beginTime), date: f.beginTime.slice(0, 10), type: 'flare', classType: f.classType || '', id: f.flrID });
  }
  for (const s of sep.data) {
    if (!s.eventTime) continue;
    events.push({ day: dayOf(s.eventTime), date: s.eventTime.slice(0, 10), type: 'sep', id: s.sepID });
  }
  const cmeCount = cme.data.filter(c => c.startTime).length;

  const live = Boolean(flr.from || sep.from || cme.from);
  if (live) res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  return res.status(200).json({
    version: VERSION,
    source: 'NASA DONKI',
    live,
    servers: { flr: flr.from, sep: sep.from, cme: cme.from },
    errors: [...(flr.errors || []), ...(sep.errors || []), ...(cme.errors || [])],
    start, end, days: DAYS, demoKey: key === 'DEMO_KEY',
    events: events.filter(e => e.day >= 1 && e.day <= DAYS),
    cmeCount,
  });
}
