import { s, tr, num, getLang, setLang } from './i18n.js';
import { LEVELS, STAGES } from './levels.js';
import { mountScene, disposeScene } from './scenes.js';
import * as store from './store.js';
import { initAdvisor, openChat, refreshChatLang, setAdvisorContext, speak, askAstro } from './advisor.js';
import * as sim from './sim.js';
import { viewRobo, addXP } from './robo.js';
import { getMarsData } from './nasa.js';

const app = document.getElementById('app');
let marsData = null;
let game = null;
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const P = () => store.getProgress();
const unlocked = id => id === 0 || P().completed[id - 1] > 0;
const go = h => { if (location.hash === '#' + h) route(); else location.hash = h; };

async function loadData() {
  if (marsData) return marsData;
  marsData = await getMarsData();
  return marsData;
}

// ---------- header ----------
function renderHeader() {
  const u = store.getUser();
  const acct = store.cloudEnabled()
    ? (u ? `<button class="chip" id="signOut" title="${esc(u.email || '')}">☁️ ${esc((u.displayName || '').split(' ')[0])} · ${s('signOut')}</button>`
         : `<button class="chip" id="signIn">🔐 ${s('signIn')}</button>`)
    : `<span class="chip muted">💾 ${s('localOnly')}</span>`;
  document.getElementById('top').innerHTML = `
    <a href="#home" class="brand">🚀 <b>${s('appName')}</b></a>
    <nav>
      <a href="#home" class="chip">🤖 R.O.B.O.</a>
      <a href="#map" class="chip">🗺️ ${s('levels')}</a>
      <a href="#data" class="chip">🛰️ ${s('dataPage')}</a>
      ${acct}
      <button class="chip" id="langBtn">${getLang() === 'bn' ? 'EN' : 'বাং'}</button>
      <button class="chip hidden" id="installBtn">📲 ${s('install')}</button>
    </nav>`;
  document.getElementById('langBtn').onclick = () => { setLang(getLang() === 'bn' ? 'en' : 'bn'); refreshChatLang(); renderHeader(); route(); };
  document.getElementById('signIn')?.addEventListener('click', () => store.signIn().catch(e => toast(e.message)));
  document.getElementById('signOut')?.addEventListener('click', () => store.signOut());
  if (deferredInstall) showInstall();
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; showInstall(); });
function showInstall() {
  const b = document.getElementById('installBtn'); if (!b) return;
  b.classList.remove('hidden');
  b.onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; b.classList.add('hidden'); };
}

export function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}

// ---------- views ----------
function viewHome() {
  const done = Object.keys(P().completed).length;
  app.innerHTML = `
  <section class="hero">
    <div class="scene" id="scene"></div>
    <div class="hero-text">
      <p class="kicker">ASTRO SQUAD · MISSION TRAINER</p>
      <h1>${s('appName')}</h1>
      <p class="tag">${s('tagline')}</p>
      <label class="lbl">${s('yourName')}</label>
      <input id="nameIn" maxlength="24" placeholder="${s('namePh')}" value="${esc(P().name)}">
      <div class="row">
        <button class="btn big" id="startBtn">${done ? s('continue') : s('start')} 🚀</button>
        <button class="btn ghost" id="askBtn">🤖 ${s('askAI')}</button>
      </div>
      <div class="progressline"><div style="width:${(done / 21) * 100}%"></div></div>
      <p class="muted small">${num(done)} / ${num(21)} ${s('level')}</p>
    </div>
  </section>`;
  mountScene(document.getElementById('scene'), 'mars');
  document.getElementById('startBtn').onclick = () => { store.save({ name: document.getElementById('nameIn').value.trim() }); go('map'); };
  document.getElementById('askBtn').onclick = () => openChat();
  setAdvisorContext(() => 'Child is on the home screen.');
}

function viewMap() {
  disposeScene();
  app.innerHTML = `<h2 class="pagetitle">${s('levels')}${P().name ? ` · ${esc(P().name)}` : ''}</h2>` + STAGES.map(st => `
    <section class="stage">
      <h3><span class="num">${num(st.id)}</span> ${tr(st.name)} <small>${s('level')} ${num(st.range[0])}–${num(st.range[1])}</small></h3>
      <div class="grid">
        ${LEVELS.filter(l => l.id >= st.range[0] && l.id <= st.range[1]).map(l => {
          const ok = unlocked(l.id); const st = P().completed[l.id] || 0;
          return `<a class="lvl ${ok ? '' : 'locked'} ${st ? 'done' : ''}" ${ok ? `href="#level-${l.id}"` : ''}>
            <span class="ico">${ok ? l.icon : '🔒'}</span>
            <span class="n">${s('level')} ${num(l.id)}</span>
            <span class="t">${tr(l.title)}</span>
            <span class="stars">${'★'.repeat(st)}${'☆'.repeat(st ? 3 - st : 0)}</span>
          </a>`;
        }).join('')}
      </div>
    </section>`).join('');
  setAdvisorContext(() => 'Child is looking at the level map.');
}

function viewLevel(id) {
  const l = LEVELS[id];
  if (!l || !unlocked(id)) return go('map');
  if (l.kind === 'design') return viewDesign();
  if (l.kind === 'sim') return viewMission();
  app.innerHTML = `
    <div class="levelhead"><a href="#map" class="chip">← ${s('back')}</a><h2>${l.icon} ${s('level')} ${num(id)}: ${tr(l.title)}</h2></div>
    <div class="scene tall" id="scene"><span class="hint">👆 drag · pinch</span></div>
    <div class="facts">
      ${l.facts.map((f, i) => `<div class="fact"><span class="fnum">${num(i + 1)}</span><p>${tr(f)}</p><button class="say" data-i="${i}" title="Listen">🔊</button></div>`).join('')}
    </div>
    <div class="row center">
      <button class="btn ghost" id="askMore">🤖 ${s('askAI')}</button>
      <button class="btn big" id="quizBtn">${s('takeQuiz')} ✏️</button>
    </div>`;
  mountScene(document.getElementById('scene'), l.scene);
  app.querySelectorAll('.fact .say').forEach(b => b.onclick = () => speak(tr(l.facts[+b.dataset.i]), true));
  document.getElementById('quizBtn').onclick = () => viewQuiz(id);
  document.getElementById('askMore').onclick = () => openChat(getLang() === 'bn' ? `"${tr(l.title)}" নিয়ে আরেকটা মজার তথ্য বলো!` : `Tell me one more fun fact about "${tr(l.title)}"!`);
  setAdvisorContext(() => `Child is studying level ${id}: "${l.title.en}". Facts shown: ${l.facts.map(f => f.en).join(' ')}`);
}

function viewQuiz(id) {
  const l = LEVELS[id]; let qi = 0, mistakes = 0;
  const draw = () => {
    const q0 = l.quiz[qi];
    const order = q0.options.map((_, i) => i).sort(() => Math.random() - 0.5);
    const q = { q: q0.q, options: order.map(i => q0.options[i]), answer: order.indexOf(q0.answer) };
    app.innerHTML = `
      <div class="levelhead"><a href="#level-${id}" class="chip">← ${s('back')}</a><h2>✏️ ${s('quiz')} · ${tr(l.title)}</h2></div>
      <div class="quiz card">
        <p class="muted">${num(qi + 1)} / ${num(l.quiz.length)}</p>
        <h3>${tr(q.q)}</h3>
        <div class="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${tr(o)}</button>`).join('')}</div>
        <p id="fb" class="fb"></p>
      </div>`;
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (+b.dataset.i === q.answer) {
        b.classList.add('right'); document.getElementById('fb').textContent = s('correct');
        app.querySelectorAll('.opt').forEach(x => x.disabled = true);
        setTimeout(() => { qi++; qi < l.quiz.length ? draw() : finish(); }, 900);
      } else { mistakes++; b.classList.add('wrong'); b.disabled = true; document.getElementById('fb').textContent = s('wrong'); }
    });
  };
  const finish = () => {
    const stars = Math.max(1, 3 - mistakes);
    store.completeLevel(id, stars);
    addXP(stars * 5);
    app.innerHTML = `<div class="card done-card">
      <div class="bigstars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <h2>${s('levelDone')}</h2>
      <p>${tr(l.title)}</p>
      <p class="coinwin">⭐ +${stars * 5} XP · R.O.B.O.</p>
      <div class="row center"><a class="btn ghost" href="#home">🤖 R.O.B.O.</a><a class="btn ghost" href="#map">🗺️ ${s('toMap')}</a><a class="btn big" href="#level-${id + 1}">${s('nextLevel')} →</a></div>
    </div>`;
    confetti();
  };
  disposeScene(); draw();
}

// ---------- mission design (level 19) ----------
function viewDesign() {
  const d = P().design || { site: 'gale', supplies: { battery: 4, o2: 3, water: 3, food: 4, parts: 3, shield: 3 } };
  const sup = { ...d.supplies }; let site = d.site;
  const used = () => Object.values(sup).reduce((a, b) => a + b, 0);
  const draw = () => {
    app.innerHTML = `
      <div class="levelhead"><a href="#map" class="chip">← ${s('back')}</a><h2>🧭 ${s('level')} ${num(19)}: ${s('designTitle')}</h2></div>
      <h3 class="sub">${s('chooseSite')}</h3>
      <div class="grid two">${Object.entries(sim.SITES).map(([k, v]) => `
        <button class="card pick ${site === k ? 'sel' : ''}" data-site="${k}">
          <b>📍 ${tr(v.name)}</b><span class="muted small">${v.rover}</span><span>${tr(v.desc)}</span>
        </button>`).join('')}</div>
      <h3 class="sub">${s('meetCrew')}</h3>
      <div class="grid four">${sim.CREW.map(c => `<div class="card crew"><span class="ico">${c.icon}</span><b>${tr(c.name)}</b><span class="role">${tr(c.role)}</span><span class="small">${tr(c.perk)}</span></div>`).join('')}</div>
      <h3 class="sub">${s('packSupplies')} · <span class="${used() === sim.CARGO_POINTS ? 'ok' : 'warn'}">${s('pointsLeft')}: ${num(sim.CARGO_POINTS - used())}</span></h3>
      <div class="supplies">${sim.SUPPLIES.map(x => `
        <div class="supply"><span class="ico">${x.icon}</span><div><b>${tr(x.name)}</b><span class="small muted">${tr(x.help)}</span></div>
          <div class="stepper"><button data-dec="${x.id}">−</button><span>${num(sup[x.id])}</span><button data-inc="${x.id}">+</button></div></div>`).join('')}</div>
      <div class="row center"><button class="btn ghost" id="askPlan">🤖 ${s('askAI')}</button><button class="btn big" id="launch">${s('launch')}</button></div>`;
    app.querySelectorAll('[data-site]').forEach(b => b.onclick = () => { site = b.dataset.site; draw(); });
    app.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => { const k = b.dataset.inc; if (used() < sim.CARGO_POINTS && !(k === 'shield' && sup[k] >= 5)) { sup[k]++; draw(); } });
    app.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => { const k = b.dataset.dec; if (sup[k] > 0) { sup[k]--; draw(); } });
    document.getElementById('askPlan').onclick = () => openChat(getLang() === 'bn' ? 'আমার মঙ্গল মিশনের রসদ পরিকল্পনা কি ভালো হয়েছে? একটা পরামর্শ দাও।' : 'Is my Mars supply plan good? Give me one tip.');
    document.getElementById('launch').onclick = () => {
      if (used() !== sim.CARGO_POINTS) return toast(s('useAllPoints'));
      store.save({ design: { site, supplies: sup } }); store.completeLevel(19, 3); game = null; go('mission');
    };
  };
  disposeScene(); draw();
  setAdvisorContext(() => `Child is designing the Mars mission. Site: ${site}. Supplies (20 points total): ${JSON.stringify(sup)}. Each battery point = +8 kWh, o2/water/food point = +1.5 sols, parts = repair kits, shield = -8% radiation each. Daily needs: 1 sol each of oxygen/water/food; dust storms cut solar power.`);
}

// ---------- mission sim (level 20) ----------
async function viewMission() {
  if (!P().design) { toast(s('needDesign')); return go('level-19'); }
  const data = await loadData();
  if (!game || game.over) game = sim.newGame(P().design, data);
  disposeScene();
  app.innerHTML = `<div class="levelhead"><a href="#map" class="chip">← ${s('back')}</a><h2>🏕️ ${tr(LEVELS[20].title)}</h2></div>
    <div class="scene short" id="scene"></div><div id="simUI"></div>`;
  mountScene(document.getElementById('scene'), 'outpost');
  setAdvisorContext(() => sim.stateSummary(game));
  drawSim();
}

function bar(label, icon, val, max, unit, cls = '') {
  const pct = Math.max(0, Math.min(100, (val / max) * 100));
  const lvl = pct < 20 ? 'low' : pct < 45 ? 'mid' : 'ok';
  return `<div class="res ${cls}"><div class="rl"><span>${icon} ${label}</span><b>${unit}</b></div><div class="rb ${lvl}"><div style="width:${pct}%"></div></div></div>`;
}

function drawSim() {
  const g = game; const ui = document.getElementById('simUI'); if (!ui) return;
  if (g.over) return drawEnd();
  const w = sim.weatherOf(g); const pv = sim.preview(g); const net = pv.prod - pv.use;
  const L = getLang() === 'bn';
  const evName = { dust_storm: L ? '🌪️ ধুলিঝড়' : '🌪️ Dust storm', flare: L ? '🌞 সৌর শিখা' : '🌞 Solar flare', sep: L ? '☢️ সৌরঝড় (SEP)' : '☢️ Solar storm (SEP)' };
  const tips = sim.advisorTips(g);
  ui.innerHTML = `
    <div class="solbar"><span class="solnum">${s('sol')} ${num(g.sol)} <small>${s('of30')}</small></span><div class="progressline"><div style="width:${(g.sol - 1) / 30 * 100}%"></div></div><span class="chip">🔬 ${s('science')}: ${num(g.science)}</span></div>
    <div class="simgrid">
      <div class="card weather">
        <h4>${s('weather')} · ${tr(sim.SITES[g.site].name)}</h4>
        ${w.event ? `<div class="event">${evName[w.event]}</div>` : ''}
        <div class="wgrid">
          <div>🌡️ <b>${num(w.tMax)}°C</b><small>${L ? 'সর্বোচ্চ' : 'max'}</small></div>
          <div>❄️ <b>${num(w.tMin)}°C</b><small>${L ? 'সর্বনিম্ন' : 'min'}</small></div>
          <div>🎈 <b>${num(w.pressure)} Pa</b><small>${L ? 'চাপ' : 'pressure'}</small></div>
          <div>🌫️ <b>${num(w.tau)}</b><small>${L ? 'ধুলো (τ)' : 'dust τ'}</small></div>
          <div>☢️ <b>${num(w.radiation)}</b><small>mSv/${s('sol')}</small></div>
          <div>☀️ <b>${num(Math.round(pv.prod))}</b><small>kWh ${L ? 'সৌরবিদ্যুৎ' : 'solar'}</small></div>
        </div>
        <p class="small muted">${s('dataSource')}: ${sim.SITES[g.site].rover} ${w.realSol ? `· sol ${w.realSol}` : ''}</p>
      </div>
      <div class="card">
        ${bar(L ? 'ব্যাটারি' : 'Battery', '🔋', g.battery, g.cap, `${num(Math.round(g.battery))}/${num(g.cap)} kWh`)}
        ${bar(L ? 'অক্সিজেন' : 'Oxygen', '🫧', g.o2, 15, `${num(g.o2.toFixed(1))} ${s('sol')}`)}
        ${bar(L ? 'পানি' : 'Water', '💧', g.water, 15, `${num(g.water.toFixed(1))} ${s('sol')}`)}
        ${bar(L ? 'খাবার' : 'Food', '🥫', g.food, 15, `${num(g.food.toFixed(1))} ${s('sol')}`)}
        ${bar(L ? 'স্বাস্থ্য' : 'Health', '❤️', g.health, 100, `${num(Math.round(g.health))}%`)}
        ${bar(L ? 'মনোবল' : 'Morale', '😊', g.morale, 100, `${num(Math.round(g.morale))}%`)}
        <div class="mini"><span>🧹 ${L ? 'প্যানেলে ধুলো' : 'Panel dust'}: ${num(Math.round(g.dust * 100))}%</span><span>🔩 ${num(g.parts)}</span><span>☢️ ${num(g.dose.toFixed(1))} mSv</span></div>
        ${Object.keys(g.broken).length ? `<div class="broken">⚠️ ${Object.keys(g.broken).map(k => tr(sim.SYS_NAME[k])).join(', ')}</div>` : ''}
      </div>
    </div>
    <div class="card">
      <h4>${s('assign')}</h4>
      <div class="crewgrid">${sim.CREW.map(c => `
        <label class="crewsel"><span>${c.icon} <b>${tr(c.name)}</b> <small>${tr(c.role)}</small></span>
          <select data-crew="${c.id}">${Object.entries(sim.TASKS).map(([k, t]) => `<option value="${k}" ${g.assign[c.id] === k ? 'selected' : ''} ${t.eva && g.shelter ? 'disabled' : ''}>${t.icon} ${tr(t.name)}${t.power ? ` (−${t.power} kWh)` : ''}</option>`).join('')}</select></label>`).join('')}
      </div>
      <div class="row between">
        <label class="toggle"><input type="checkbox" id="shelter" ${g.shelter ? 'checked' : ''}> 🛡️ ${L ? 'শেল্টার মোড (বিকিরণ −৭০%, বাইরের কাজ বন্ধ)' : 'Shelter mode (−70% radiation, no EVA)'}</label>
        <span class="power ${net < 0 ? 'neg' : 'pos'}">⚡ ${L ? 'আজকের হিসাব' : 'Today'}: ${net >= 0 ? '+' : ''}${num(Math.round(net))} kWh</span>
      </div>
    </div>
    <div class="card advisor">
      <h4>🤖 ${s('advisorTip')}</h4>
      <ul>${tips.slice(0, 3).map(t => `<li>${tr(t)}</li>`).join('')}</ul>
      <div id="aiTip" class="aitip"></div>
      <div class="row"><button class="btn ghost" id="aiAdvice">✨ ${s('askAdvisor')}</button><button class="btn big" id="endSol">${s('endSol')}</button></div>
    </div>
    <details class="card log" open><summary>${s('log')}</summary>${g.log.slice(0, 10).map(e => `<p class="${e.kind}"><small>${s('sol')} ${num(e.sol)}</small> ${tr(e.msg)}</p>`).join('')}</details>`;

  ui.querySelectorAll('[data-crew]').forEach(sel => sel.onchange = () => { g.assign[sel.dataset.crew] = sel.value; drawSim(); });
  document.getElementById('shelter').onchange = e => {
    g.shelter = e.target.checked;
    if (g.shelter) sim.CREW.forEach(c => { if (sim.TASKS[g.assign[c.id]].eva) g.assign[c.id] = 'rest'; });
    drawSim();
  };
  document.getElementById('endSol').onclick = () => { sim.endSol(g); drawSim(); window.scrollTo({ top: document.getElementById('simUI').offsetTop - 70, behavior: 'smooth' }); };
  document.getElementById('aiAdvice').onclick = async () => {
    const box = document.getElementById('aiTip'); box.textContent = s('thinking');
    try {
      const a = await askAstro(getLang() === 'bn' ? 'আজ এই সলে আমার কী করা উচিত? একটি পরামর্শ দাও।' : 'What should I do this sol? Give me one tip.', sim.stateSummary(g));
      box.textContent = a; speak(a);
    } catch (e) { box.textContent = s('aiError'); }
  };
}

function drawEnd() {
  const g = game; const ui = document.getElementById('simUI');
  if (g.won) {
    const tt = sim.title(g); const score = g.science + Math.round(g.health) + Math.round(g.morale);
    addXP(50);
    if (!P().best || score > P().best.score) store.save({ best: { score, title: tt, site: g.site } });
    store.completeLevel(20, g.health > 60 ? 3 : g.health > 30 ? 2 : 1);
    ui.innerHTML = `<div class="cert">
      <p class="kicker">NASA SPACE APPS CHALLENGE 2026 · ASTRO SQUAD</p>
      <h2>🏅 ${s('certificate')}</h2>
      <p class="certname">${esc(P().name || 'Astronaut')}</p>
      <p>${s('certText')}</p>
      <p class="certtitle">${tr(tt)}</p>
      <p>⭐ +50 XP · R.O.B.O.</p>
      <p class="small">${tr(sim.SITES[g.site].name)} · ${s('science')} ${num(g.science)} · ❤️ ${num(Math.round(g.health))}% · ☢️ ${num(g.dose.toFixed(1))} mSv</p>
      <div class="row center"><button class="btn ghost" id="again">${s('tryAgain')}</button><a class="btn big" href="#map">${s('toMap')}</a></div>
    </div>`;
    confetti();
  } else {
    ui.innerHTML = `<div class="card fail"><h2>💥 ${s('lost')} · ${s('sol')} ${num(g.sol)}</h2><p>${tr(sim.FAIL_TEXT[g.reason])}</p>
      <div class="row center"><a class="btn ghost" href="#level-19">🧭 ${s('designTitle')}</a><button class="btn big" id="again">${s('tryAgain')}</button></div></div>`;
  }
  document.getElementById('again').onclick = () => { game = null; viewMission(); };
}

// ---------- NASA data page ----------
async function viewData() {
  disposeScene();
  const d = await loadData(); const L = getLang() === 'bn';
  const chart = (key, label, color, site) => {
    const sols = d.sites[site].sols; const vals = sols.map(x => x[key]);
    const min = Math.min(...vals), max = Math.max(...vals); const W = 600, H = 140, pad = 24;
    const pts = vals.map((v, i) => `${pad + i * (W - 2 * pad) / (vals.length - 1)},${H - pad - (v - min) / (max - min || 1) * (H - 2 * pad)}`).join(' ');
    return `<figure class="card"><figcaption>${label} · ${tr(sim.SITES[site].name)}</figcaption>
      <svg viewBox="0 0 ${W} ${H}" class="chart"><polyline fill="none" stroke="${color}" stroke-width="3" points="${pts}"/>
      <text x="4" y="${pad}" class="ax">${max}</text><text x="4" y="${H - pad + 4}" class="ax">${min}</text>
      <text x="${pad}" y="${H - 4}" class="ax">${s('sol')} 1</text><text x="${W - pad - 40}" y="${H - 4}" class="ax">${s('sol')} 30</text></svg></figure>`;
  };
  app.innerHTML = `<h2 class="pagetitle">🛰️ ${s('dataPage')}</h2>
    <div class="card"><p><b>NASA DATA → ${L ? 'গেমের অবস্থা' : 'GAME CONDITIONS'} → ${L ? 'খেলোয়াড়ের সিদ্ধান্ত' : 'PLAYER DECISIONS'}</b></p>
    <ul>
      <li>${L ? 'Perseverance MEDA, Curiosity REMS ও InSight: মঙ্গলের তাপমাত্রা, চাপ আর ধুলো' : 'Perseverance MEDA, Curiosity REMS & InSight: Mars temperature, pressure and dust'}</li>
      <li>${L ? 'Curiosity RAD ও NASA DONKI (Space Weather): বিকিরণ আর সৌর ঘটনা' : 'Curiosity RAD & NASA DONKI (Space Weather): radiation and solar events'}</li>
      <li>${L ? 'NASA LRO: চাঁদের আলোর তথ্য (লেভেল ১৩)' : 'NASA LRO: lunar illumination (Level 13)'}</li>
    </ul>
    <p class="small muted">${esc(d.meta.note)}<br>${d.meta.sources.map(esc).join(' · ')} · ${esc(d.meta.generated)}</p>
    ${d.live ? `<p><b>☀️ ${L ? 'নাসা DONKI থেকে আসল সৌর ঘটনা (গত ৩০ দিন)' : 'Real solar events from NASA DONKI (last 30 days)'}:</b> ${d.live.events.length ? d.live.events.slice(0, 14).map(e => `<span class="chip">${e.type === 'sep' ? '☢️ SEP' : '🌞 ' + esc(e.classType)} · ${esc(e.date)}</span>`).join(' ') : (L ? 'এই ৩০ দিনে কোনো বড় ঘটনা নেই' : 'none in these 30 days')}</p>` : `<p class="small warn">${L ? 'লাইভ নাসা ডেটা পাওয়া যায়নি, ভিতরের ডেটা দেখানো হচ্ছে।' : 'Live NASA data unavailable, showing built-in data.'}</p>`}</div>
    <div class="grid two">
      ${chart('tMin', L ? 'রাতের তাপমাত্রা °C' : 'Night temperature °C', '#7ab8ff', 'gale')}
      ${chart('tau', L ? 'ধুলোর ঘনত্ব (τ)' : 'Dust opacity (τ)', '#e8a15a', 'gale')}
      ${chart('radiation', L ? 'বিকিরণ mSv/সল' : 'Radiation mSv/sol', '#f25f5c', 'jezero')}
      ${chart('pressure', L ? 'বায়ুচাপ Pa' : 'Air pressure Pa', '#9fe870', 'jezero')}
    </div>`;
  setAdvisorContext(() => 'Child is looking at the NASA data page (Mars temperature, dust, radiation, pressure charts).');
}

function confetti() {
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('i'); c.className = 'conf';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = ['#f5c542', '#ff7a1a', '#5b7cff', '#9fe870', '#f25f5c'][i % 5];
    c.style.animationDelay = Math.random() * 0.6 + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 3000);
  }
}

// ---------- router ----------
let cleanup = null;
function route() {
  const h = location.hash.slice(1) || 'home';
  window.scrollTo(0, 0);
  if (cleanup) { cleanup(); cleanup = null; }
  document.body.classList.toggle('home-robo', h === 'home');
  if (h === 'home') { disposeScene(); cleanup = viewRobo(app, { go }); }
  else if (h === 'start') viewHome();
  else if (h === 'map') viewMap();
  else if (h === 'design' || h === 'level-19') viewLevel(19);
  else if (h === 'mission' || h === 'level-20') viewLevel(20);
  else if (h === 'data') viewData();
  else if (h.startsWith('level-')) viewLevel(parseInt(h.slice(6), 10));
  else { disposeScene(); cleanup = viewRobo(app, { go }); document.body.classList.add('home-robo'); }
}

setLang(getLang());
initAdvisor();
renderHeader();
let lastUid = null;
store.onStoreChange(({ user }) => {
  renderHeader();
  const uid = user?.uid || null;
  if (uid !== lastUid) { lastUid = uid; if (['#map', '#start'].includes(location.hash)) route(); }
});
store.initStore();
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
