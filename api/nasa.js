// Vercel serverless function: GET /api/nasa
// Fetches REAL space-weather events from NASA DONKI for the last 30 days
// (solar flares = FLR, solar energetic particle events = SEP, CMEs) and returns them.
// Set NASA_API_KEY in Vercel → Settings → Environment Variables (free key: https://api.nasa.gov).
// Without a key it falls back to NASA's DEMO_KEY (works, but has a low rate limit).

const DAYS = 30;
const iso = d => d.toISOString().slice(0, 10);

async function donki(kind, start, end, key) {
  const url = `https://api.nasa.gov/DONKI/${kind}?startDate=${start}&endDate=${end}&api_key=${key}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'little-astronauts-app' } });
  if (!r.ok) throw new Error(`DONKI ${kind}: HTTP ${r.status}`);
  const t = await r.text();
  return t.trim() ? JSON.parse(t) : [];
}

export default async function handler(req, res) {
  const key = process.env.hpmGBcnw8QBRPWzcHRKCkF6thdbpgTdb8L66R8hC || 'DEMO_KEY';
  const endD = new Date();
  const startD = new Date(endD.getTime() - (DAYS - 1) * 864e5);
  const start = iso(startD), end = iso(endD);
  try {
    const [flr, sep, cme] = await Promise.all([
      donki('FLR', start, end, key),
      donki('SEP', start, end, key).catch(() => []),
      donki('CME', start, end, key).catch(() => []),
    ]);
    const dayOf = t => Math.floor((Date.parse(t.slice(0, 10)) - Date.parse(start)) / 864e5) + 1; // 1..30
    const events = [];
    for (const f of flr || []) {
      if (!f.beginTime) continue;
      events.push({ day: dayOf(f.beginTime), date: f.beginTime.slice(0, 10), type: 'flare', classType: f.classType || '', id: f.flrID });
    }
    for (const s of sep || []) {
      if (!s.eventTime) continue;
      events.push({ day: dayOf(s.eventTime), date: s.eventTime.slice(0, 10), type: 'sep', id: s.sepID });
    }
    const cmes = (cme || []).filter(c => c.startTime).map(c => ({ day: dayOf(c.startTime), date: c.startTime.slice(0, 10), type: 'cme', id: c.activityID }));
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400'); // cache 1 hour on Vercel
    return res.status(200).json({
      source: 'NASA DONKI (api.nasa.gov)', start, end, days: DAYS, demoKey: key === 'DEMO_KEY',
      events: events.filter(e => e.day >= 1 && e.day <= DAYS), cmeCount: cmes.length,
    });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
