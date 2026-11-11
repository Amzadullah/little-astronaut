#!/usr/bin/env python3
"""
Little Astronauts: NASA data pipeline
NASA data -> Python processing -> JSON (data/mars_sols.json) -> game

Usage
-----
1) Default (no internet needed): builds a 30-sol dataset whose values follow the
   typical ranges measured by Curiosity REMS/RAD (Gale Crater) and
   Perseverance MEDA (Jezero Crater).
       python3 scripts/build_data.py

2) With REAL rover weather data:
   Download a REMS or MEDA table as CSV from NASA PDS
   (https://pds-atmospheres.nmsu.edu/) or the Mars weather pages, then:
       python3 scripts/build_data.py --gale-csv rems.csv --jezero-csv meda.csv
   The CSV needs columns (names are matched loosely):
       sol, min_temp, max_temp, pressure        (opacity / tau optional)

3) With REAL space-weather events from NASA DONKI:
       NASA_API_KEY=your_key python3 scripts/build_data.py --donki 2024-05-01 2024-06-15
   Get a free key at https://api.nasa.gov (DEMO_KEY also works, slowly).
   Each solar flare / SEP day found is mapped onto a game sol.
"""
import argparse, csv, json, math, os, random, sys, urllib.request
from datetime import date, timedelta

SOLS = 30
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'mars_sols.json')

# Typical ranges (published mission results):
#  Gale (REMS): max ~ -5..+5 C, min ~ -80..-70 C, pressure ~ 750..900 Pa
#  Jezero (MEDA): max ~ -20..0 C, min ~ -85..-75 C, pressure ~ 700..760 Pa
#  RAD surface dose equivalent ~0.64 mSv/sol (Hassler et al., Science 2014)
SITES = {
    'gale':   dict(name='Gale Crater', rover='Curiosity (REMS + RAD)', tmax=(-5, 5), tmin=(-80, -70), p=(780, 880), tau=(0.4, 0.7)),
    'jezero': dict(name='Jezero Crater', rover='Perseverance (MEDA)', tmax=(-20, 0), tmin=(-85, -75), p=(700, 760), tau=(0.5, 0.8)),
}
# Scripted mission events (sol numbers). Replaced/extended by --donki.
EVENTS = {7: 'flare', 12: 'dust_storm', 13: 'dust_storm', 14: 'dust_storm', 15: 'dust_storm', 22: 'sep', 26: 'flare'}


def modeled(site, seed):
    rnd = random.Random(seed)
    s = SITES[site]
    sols = []
    for i in range(1, SOLS + 1):
        wave = math.sin(i / SOLS * math.pi * 2)
        ev = EVENTS.get(i)
        tau = rnd.uniform(*s['tau'])
        if ev == 'dust_storm':
            tau = rnd.uniform(1.8, 3.0)
        tmax = rnd.uniform(*s['tmax']) + wave * 2 - (8 if ev == 'dust_storm' else 0)
        tmin = rnd.uniform(*s['tmin']) + wave * 2 + (6 if ev == 'dust_storm' else 0)  # dust keeps nights warmer
        p = rnd.uniform(*s['p']) + wave * 15
        rad = round(rnd.uniform(0.58, 0.70), 2)
        if ev == 'flare':
            rad += round(rnd.uniform(0.3, 0.8), 2)
        if ev == 'sep':
            rad += round(rnd.uniform(2.0, 4.0), 2)
        sols.append(dict(sol=i, tMax=round(tmax), tMin=round(tmin), pressure=round(p), tau=round(tau, 2),
                         radiation=round(rad, 2), event=ev))
    return sols


def norm(h):
    return ''.join(c for c in h.lower() if c.isalnum())


def from_csv(path, site):
    rows = list(csv.DictReader(open(path, newline='', encoding='utf-8-sig')))
    if not rows:
        sys.exit(f'{path}: empty CSV')
    keys = {norm(k): k for k in rows[0]}
    def pick(*names):
        for n in names:
            for k, orig in keys.items():
                if n in k:
                    return orig
        return None
    ksol, kmin, kmax, kp, ktau = pick('sol'), pick('mintemp', 'tmin', 'minairtemp'), pick('maxtemp', 'tmax', 'maxairtemp'), pick('pressure'), pick('opacity', 'tau')
    if not all([ksol, kmin, kmax, kp]):
        sys.exit(f'{path}: need sol / min_temp / max_temp / pressure columns. Found: {list(rows[0])}')
    good = []
    for r in rows:
        try:
            good.append((int(float(r[ksol])), float(r[kmin]), float(r[kmax]), float(r[kp]), r.get(ktau) if ktau else None))
        except (ValueError, TypeError):
            continue
    good.sort()
    good = good[-SOLS:]
    base = modeled(site, 1)
    out = []
    for i, (sol, tmin, tmax, p, tau) in enumerate(good):
        b = base[i]
        try:
            tauv = float(tau) if tau not in (None, '') else b['tau']
        except ValueError:
            tauv = b['tau']
        out.append(dict(b, tMin=round(tmin), tMax=round(tmax), pressure=round(p), tau=round(tauv, 2), realSol=sol))
    return out


def donki(start, end):
    key = os.environ.get('NASA_API_KEY', 'DEMO_KEY')
    events = {}
    for kind, tag in (('FLR', 'flare'), ('SEP', 'sep')):
        url = f'https://api.nasa.gov/DONKI/{kind}?startDate={start}&endDate={end}&api_key={key}'
        with urllib.request.urlopen(url, timeout=30) as r:
            data = json.load(r) or []
        for e in data:
            t = e.get('beginTime') or e.get('eventTime')
            if not t:
                continue
            d = date.fromisoformat(t[:10])
            sol = (d - date.fromisoformat(start)).days + 1
            if 1 <= sol <= SOLS and events.get(sol) != 'sep':
                events[sol] = tag
                events.setdefault('_ids', []).append(e.get('flrID') or e.get('sepID'))
    return events


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--gale-csv'); ap.add_argument('--jezero-csv')
    ap.add_argument('--donki', nargs=2, metavar=('START', 'END'))
    a = ap.parse_args()

    sources = ['Value ranges from Curiosity REMS & RAD and Perseverance MEDA published results']
    sites = {}
    for site, seed, path in (('gale', 42, a.gale_csv), ('jezero', 7, a.jezero_csv)):
        sols = from_csv(path, site) if path else modeled(site, seed)
        if path:
            sources.append(f'{SITES[site]["rover"]}: real data from {os.path.basename(path)}')
        sites[site] = dict(name=SITES[site]['name'], rover=SITES[site]['rover'], sols=sols)

    if a.donki:
        ev = donki(*a.donki)
        ids = ev.pop('_ids', [])
        for s in sites.values():
            for row in s['sols']:
                if row['event'] in ('flare', 'sep'):
                    row['event'] = None
                if row['sol'] in ev:
                    row['event'] = ev[row['sol']]
                    row['radiation'] = round(row['radiation'] + (3.0 if ev[row['sol']] == 'sep' else 0.5), 2)
        sources.append(f'NASA DONKI {a.donki[0]}..{a.donki[1]}: {len(ids)} events')

    meta = dict(
        generated=str(date.today()),
        realData=bool(a.gale_csv or a.jezero_csv or a.donki),
        sources=sources,
        note='Modeled on real NASA rover measurements. Run scripts/build_data.py with CSV/DONKI options to load real sol-by-sol data.'
        if not (a.gale_csv or a.jezero_csv or a.donki) else 'Includes real NASA data (see sources).',
    )
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(dict(meta=meta, sites=sites), open(OUT, 'w'), indent=1)
    print('wrote', os.path.abspath(OUT))


if __name__ == '__main__':
    main()
