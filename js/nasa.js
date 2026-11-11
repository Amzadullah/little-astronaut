// Loads the 30-sol Mars dataset and, when online, replaces its solar events with
// REAL ones from NASA DONKI (via our /api/nasa function). Day 1 = 30 days ago, day 30 = today.
let cache = null;

function strongest(list) {
  // X > M > C > B > A; SEP is the strongest kind of event for radiation
  const rank = e => (e.type === 'sep' ? 100 : ({ X: 50, M: 40, C: 30, B: 20, A: 10 }[e.classType?.[0]] || 0) + parseFloat(e.classType?.slice(1) || 0) / 10);
  return list.slice().sort((a, b) => rank(b) - rank(a))[0];
}

export async function getMarsData() {
  if (cache) return cache;
  const data = await (await fetch('data/mars_sols.json')).json();
  data.live = null;
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch('/api/nasa', { signal: ctl.signal }); clearTimeout(tm);
    const live = await r.json();
    if (r.ok && Array.isArray(live.events)) {
      data.live = live;
      for (const site of Object.values(data.sites)) {
        for (const s of site.sols) {
          // drop the built-in example flares; keep the dust storms (Mars weather)
          if (s.event === 'flare' || s.event === 'sep') { s.event = null; s.radiation = Math.min(s.radiation, 0.7); }
          const today = live.events.filter(e => e.day === s.sol && (e.type === 'flare' || e.type === 'sep'));
          if (!today.length) continue;
          const top = strongest(today);
          const big = top.type === 'sep' || /^X/.test(top.classType);
          if (s.event !== 'dust_storm' || big) s.event = top.type === 'sep' ? 'sep' : 'flare';
          s.radiation = +(s.radiation + (top.type === 'sep' ? 3 : /^X/.test(top.classType) ? 1.2 : /^M/.test(top.classType) ? 0.6 : 0.2)).toFixed(2);
          s.nasa = { type: top.type, classType: top.classType || '', date: top.date, count: today.length };
        }
      }
      data.meta.sources = [...data.meta.sources, `NASA DONKI live: ${live.events.length} solar events, ${live.start} → ${live.end}`];
      data.meta.note = `Solar flares and particle storms are REAL NASA DONKI events from ${live.start} to ${live.end} (sol 1 = ${live.start}). Mars temperature, pressure and dust follow Curiosity REMS / Perseverance MEDA ranges.`;
    }
  } catch (e) { /* offline or no API: use the built-in data */ }
  cache = data;
  return data;
}
