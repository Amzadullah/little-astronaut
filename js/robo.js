// R.O.B.O. on Mars — a Talking-Tom style robot friend.
// Talk to him (he repeats in a robot voice), touch him, feed him, put him to sleep,
// and help him with Mars missions that come from NASA rover data (dust, storms,
// solar flares, freezing nights…). Missions give XP → levels → gifts (emotes, skins, outfits).
import { getLang, tr } from './i18n.js';
import * as store from './store.js';
import { askAstro } from './advisor.js';
import { getMarsData } from './nasa.js';

const L = (en, bn) => ({ en, bn });
const isBn = () => getLang() === 'bn';
const T = o => (typeof o === 'function' ? T(o()) : tr(o));
const bnNum = n => (isBn() ? String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).replace('-', '−') : String(n).replace('-', '−'));

// ================= state =================
const DEFAULT = { energy: 80, fun: 70, clean: 85, sleep: 80, xp: 0, level: 1, sol: 1, solDone: [], unlocked: ['wave', 'silver'],
  wear: { head: null, face: null, neck: null, color: 'silver' }, last: Date.now(), asleep: false, missionsDone: 0 };
export function roboState() {
  const r = store.getProgress().robo;
  if (!r) return structuredClone(DEFAULT);
  return { ...structuredClone(DEFAULT), ...r, wear: { ...DEFAULT.wear, ...(r.wear || {}) }, unlocked: r.unlocked || [...DEFAULT.unlocked] };
}
function saveRobo(r) { store.save({ robo: { ...r, last: Date.now() } }); }
const xpNeed = lvl => 40 + lvl * 20;

// Gifts: one per level
export const GIFTS = [
  { id: 'wave', level: 1, kind: 'emote', icon: '👋', name: L('Wave', 'হাত নাড়া') },
  { id: 'silver', level: 1, kind: 'skin', icon: '⚪', name: L('Silver', 'রুপালি'), color: '#d9e2f2' },
  { id: 'dance', level: 2, kind: 'emote', icon: '💃', name: L('Robot dance', 'রোবট নাচ') },
  { id: 'cap', level: 3, kind: 'head', icon: '🧢', name: L('Space cap', 'স্পেস ক্যাপ') },
  { id: 'orange', level: 4, kind: 'skin', icon: '🟠', name: L('Mars orange skin', 'মঙ্গল কমলা স্কিন'), color: '#ffab6b' },
  { id: 'flip', level: 5, kind: 'emote', icon: '🤸', name: L('Backflip', 'ডিগবাজি') },
  { id: 'shades', level: 6, kind: 'face', icon: '😎', name: L('Cool shades', 'কুল সানগ্লাস') },
  { id: 'mint', level: 7, kind: 'skin', icon: '🟢', name: L('Mint skin', 'পুদিনা স্কিন'), color: '#84e3c6' },
  { id: 'moonwalk', level: 8, kind: 'emote', icon: '🕺', name: L('Moonwalk', 'মুনওয়াক') },
  { id: 'helmet', level: 9, kind: 'head', icon: '🫧', name: L('Space helmet', 'স্পেস হেলমেট') },
  { id: 'gold', level: 10, kind: 'skin', icon: '🟡', name: L('Golden skin', 'সোনালি স্কিন'), color: '#ffd75e' },
  { id: 'love', level: 11, kind: 'emote', icon: '💖', name: L('Love burst', 'ভালোবাসার ঝড়') },
  { id: 'crown', level: 12, kind: 'head', icon: '👑', name: L('Crown', 'মুকুট') },
  { id: 'pink', level: 13, kind: 'skin', icon: '🩷', name: L('Pink skin', 'গোলাপি স্কিন'), color: '#ffa8d6' },
  { id: 'bowtie', level: 14, kind: 'neck', icon: '🎀', name: L('Bow tie', 'বো টাই') },
  { id: 'salute', level: 15, kind: 'emote', icon: '🫡', name: L('Astronaut salute', 'নভোচারী স্যালুট') },
  { id: 'scarf', level: 16, kind: 'neck', icon: '🧣', name: L('Scarf', 'মাফলার') },
  { id: 'blue', level: 17, kind: 'skin', icon: '🔵', name: L('Sky-blue skin', 'আকাশি স্কিন'), color: '#9cc3ff' },
  { id: 'party', level: 18, kind: 'head', icon: '🥳', name: L('Party hat', 'পার্টি টুপি') },
  { id: 'specs', level: 19, kind: 'face', icon: '🤓', name: L('Smart glasses', 'স্মার্ট চশমা') },
  { id: 'rocket', level: 20, kind: 'emote', icon: '🚀', name: L('Rocket jump', 'রকেট লাফ') },
];
const giftById = id => GIFTS.find(g => g.id === id);

export function addXP(n) { const r = roboState(); r.xp += n; levelCheck(r); saveRobo(r); }
let pendingGifts = [];
function levelCheck(r) {
  while (r.xp >= xpNeed(r.level)) {
    r.xp -= xpNeed(r.level); r.level++;
    GIFTS.filter(g => g.level === r.level && !r.unlocked.includes(g.id)).forEach(g => { r.unlocked.push(g.id); pendingGifts.push(g); });
  }
}

const clamp = v => Math.max(0, Math.min(100, v));
function decay(r) {
  const hrs = Math.min(48, (Date.now() - (r.last || Date.now())) / 3.6e6);
  r.energy = clamp(r.energy - hrs * 6); r.fun = clamp(r.fun - hrs * 8); r.clean = clamp(r.clean - hrs * 4);
  r.sleep = r.asleep ? clamp(r.sleep + hrs * 25) : clamp(r.sleep - hrs * 5);
  r.last = Date.now(); return r;
}

const FOODS = [
  { id: 'battery', icon: '🔋', energy: 25, fun: 0, line: L('Yum! Full charge! ⚡', 'মজা! পুরো চার্জ! ⚡') },
  { id: 'pizza', icon: '🍕', energy: 20, fun: 8, line: L('Space pizza! Astronauts have made pizza on the ISS!', 'স্পেস পিৎজা! নভোচারীরা ISS-এ পিৎজা বানিয়েছেন!') },
  { id: 'potato', icon: '🥔', energy: 15, fun: 4, line: L('A Mars potato from the greenhouse!', 'গ্রিনহাউসের মঙ্গল-আলু!') },
  { id: 'icecream', icon: '🍦', energy: 10, fun: 15, line: L('Freeze-dried astronaut ice cream! Crunchy!', 'নভোচারীদের শুকনো আইসক্রিম! মচমচে!') },
  { id: 'bolt', icon: '🔩', energy: 8, fun: -5, line: L('Crunch… a bolt? Not my favourite!', 'কচমচ… নাট-বল্টু? এটা আমার পছন্দ না!') },
];

const LINES = {
  hello: [L('Beep boop! Hi friend! Welcome to Mars!', 'বিপ বুপ! হাই বন্ধু! মঙ্গলে স্বাগতম!'), L('Hello, little astronaut! I\'m R.O.B.O. and I live on Mars!', 'হ্যালো, ছোট্ট নভোচারী! আমি রোবো, আমি মঙ্গলে থাকি!')],
  head: [L('Hee hee! That tickles my circuits!', 'হি হি! আমার সার্কিটে কাতুকুতু লাগছে!'), L('Boop! You found my head button!', 'বুপ! তুমি আমার মাথার বোতাম খুঁজে পেয়েছ!'), L('Ouchie… gently, please!', 'উফ… আস্তে, প্লিজ!')],
  belly: [L('Wheee! I\'m spinning like Mars!', 'উইইই! আমি মঙ্গলের মতো ঘুরছি!'), L('Ha ha ha! Not my belly!', 'হা হা হা! পেটে না!')],
  antenna: [L('Zzzap! Message received from Earth!', 'জ্যাপ! পৃথিবী থেকে বার্তা এসেছে!'), L('Bzzt! My antenna talks to NASA satellites!', 'বিজ্জ! আমার অ্যান্টেনা নাসার স্যাটেলাইটের সাথে কথা বলে!')],
  hand: [L('High five! 🙌', 'হাই ফাইভ! 🙌'), L('Hello! *waves*', 'হ্যালো! *হাত নাড়ে*')],
  hungry: L('My battery is low… can I have a snack? 🔋', 'আমার ব্যাটারি কম… একটু খাবার দেবে? 🔋'),
  bored: L('I\'m bored! Let\'s play a game! 🎮', 'আমার বোরিং লাগছে! চলো একটা খেলা খেলি! 🎮'),
  tired: L('Yaaawn… I need to recharge. Lights off? 💡', 'হাআআই… আমার একটু ঘুম দরকার। লাইট বন্ধ করবে? 💡'),
  wake: L('Good morning! I dreamed about Saturn\'s rings!', 'শুভ সকাল! আমি শনির বলয়ের স্বপ্ন দেখেছি!'),
  listen: L('Talk to me! I\'ll copy you! 🦜', 'আমার সাথে কথা বলো! আমি নকল করব! 🦜'),
  ask: L('Ask me anything! 🎤', 'যা খুশি জিজ্ঞেস করো! 🎤'),
  thinking: L('Hmm… computing… 🤔', 'হুমম… হিসাব করছি… 🤔'),
  noMic: L('I can\'t hear you. Please allow the microphone (Chrome works best).', 'আমি শুনতে পাচ্ছি না। মাইক্রোফোন চালু করতে দাও (Chrome-এ সবচেয়ে ভালো চলে)।'),
  locked: L('That one is still locked! Help me with Mars missions to level up! ⭐', 'ওটা এখনো তালা দেওয়া! মঙ্গলের মিশনে সাহায্য করো, লেভেল বাড়বে! ⭐'),
  nice: [L('You did it! You\'re a real astronaut! 🎉', 'তুমি পেরেছ! তুমি সত্যিকারের নভোচারী! 🎉'), L('Mission complete! Beep boop hooray! 🎉', 'মিশন শেষ! বিপ বুপ হুররে! 🎉'), L('Wow, thank you, friend! 💖', 'ওয়াও, ধন্যবাদ বন্ধু! 💖')],
};
const pick = a => a[Math.floor(Math.random() * a.length)];

// ================= sound effects (synthesised) =================
let actx;
const ac = () => { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; };
function tone(f, d = 0.12, type = 'sine', vol = 0.12, to = null, delay = 0) {
  try {
    const c = ac(); const t = c.currentTime + delay; const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) {}
}
function noise(d = 1, vol = 0.1, freq = 800, sweepTo = null) {
  try {
    const c = ac(); const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate); const ch = b.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, c.currentTime + d);
    const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d);
    s.connect(f).connect(g).connect(c.destination); s.start();
  } catch (e) {}
}
const SFX = {
  giggle: () => [780, 980, 820, 1080, 860, 1200].forEach((f, i) => tone(f, 0.07, 'square', 0.05, null, i * 0.07)),
  boop: () => tone(520, 0.18, 'sine', 0.15, 260), zap: () => tone(1800, 0.3, 'sawtooth', 0.05, 120),
  spin: () => tone(300, 0.6, 'triangle', 0.1, 1200), chomp: () => [0, 0.14, 0.28].forEach(d => tone(140, 0.08, 'square', 0.12, 70, d)),
  coin: () => { tone(988, 0.07, 'square', 0.06); tone(1319, 0.18, 'square', 0.06, null, 0.07); },
  snore: () => tone(110, 0.9, 'sine', 0.08, 70), bubble: () => tone(600 + Math.random() * 500, 0.08, 'sine', 0.05, 1400),
  ow: () => tone(400, 0.3, 'sawtooth', 0.06, 180),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, null, i * 0.12)),
  alarm: () => [0, 0.25, 0.5].forEach(d => { tone(880, 0.12, 'square', 0.07, null, d); tone(660, 0.12, 'square', 0.07, null, d + 0.12); }),
  geiger: () => { for (let i = 0; i < 12; i++) tone(3000, 0.01, 'square', 0.08, null, Math.random() * 0.8); },
  wind: () => noise(2.5, 0.12, 400, 1200), flush: () => { noise(1.4, 0.18, 1500, 200); tone(300, 0.6, 'sine', 0.06, 900, 0.9); },
  dig: () => noise(0.12, 0.15, 300), heli: () => { for (let i = 0; i < 10; i++) tone(90, 0.05, 'sawtooth', 0.06, null, i * 0.08); },
  click: () => tone(1500, 0.03, 'square', 0.06), levelup: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, null, i * 0.1)),
};

// ================= the robot (SVG) =================
function roboSVG() {
  const eye = cx => `
    <g class="eye-normal"><rect x="${cx - 12}" y="102" width="24" height="32" rx="12" fill="#5ce1ff"/><circle cx="${cx - 4}" cy="111" r="4" fill="#fff"/></g>
    <g class="eye-happy"><path d="M${cx - 14} 124 Q${cx} 104 ${cx + 14} 124" stroke="#5ce1ff" stroke-width="6" fill="none" stroke-linecap="round"/></g>
    <g class="eye-laugh"><polyline points="${cx < 150 ? `${cx - 12},106 ${cx + 10},118 ${cx - 12},130` : `${cx + 12},106 ${cx - 10},118 ${cx + 12},130`}" stroke="#5ce1ff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="eye-sleep"><path d="M${cx - 13} 120 Q${cx} 128 ${cx + 13} 120" stroke="#5ce1ff" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <g class="eye-love"><path d="M${cx} 132 l-13 -13 a7 7 0 0 1 13 -8 a7 7 0 0 1 13 8 z" fill="#ff6b9d"/></g>
    <g class="eye-wow"><circle cx="${cx}" cy="118" r="14" fill="none" stroke="#5ce1ff" stroke-width="5"/><circle cx="${cx}" cy="118" r="5" fill="#5ce1ff"/></g>
    <g class="eye-sad"><rect x="${cx - 9}" y="110" width="18" height="22" rx="9" fill="#5ce1ff"/><line x1="${cx - 13}" y1="${cx < 150 ? 104 : 98}" x2="${cx + 13}" y2="${cx < 150 ? 98 : 104}" stroke="#5ce1ff" stroke-width="4" stroke-linecap="round"/></g>
    <g class="eye-star"><path d="M${cx} 104 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1z" fill="#ffd75e"/></g>`;
  return `
  <svg id="robo" viewBox="0 0 300 420" data-mood="normal" aria-label="R.O.B.O.">
    <ellipse class="shadow" cx="150" cy="408" rx="60" ry="9" fill="#000" opacity=".28"/>
    <g class="bot">
      <g class="flame"><path d="M132 352 Q150 412 168 352 Z" fill="#ffb347"/><path d="M140 352 Q150 392 160 352 Z" fill="#fff3a8"/></g>
      <ellipse cx="150" cy="350" rx="40" ry="11" fill="#7d8aa8"/>
      <g class="arm arm-l" data-zone="hand"><rect x="50" y="228" width="24" height="70" rx="12" class="paint"/><circle cx="62" cy="304" r="15" class="paint2"/></g>
      <g class="arm arm-r" data-zone="hand"><rect x="226" y="228" width="24" height="70" rx="12" class="paint"/><circle cx="238" cy="304" r="15" class="paint2"/></g>
      <g data-zone="belly">
        <rect x="80" y="212" width="140" height="135" rx="40" class="paint"/>
        <ellipse cx="120" cy="240" rx="26" ry="12" fill="#fff" opacity=".35"/>
        <rect x="108" y="245" width="84" height="56" rx="14" fill="#0b1240"/>
        <rect class="ebar e1" x="118" y="285" width="64" height="8" rx="4" fill="#7be495"/>
        <rect class="ebar e2" x="118" y="272" width="64" height="8" rx="4" fill="#7be495"/>
        <rect class="ebar e3" x="118" y="259" width="64" height="8" rx="4" fill="#7be495"/>
        <circle cx="150" cy="322" r="7" fill="#ff6b9d" class="heart"/>
      </g>
      <g class="dirt" pointer-events="none"><ellipse cx="105" cy="300" rx="14" ry="8" fill="#8a4b2a"/><ellipse cx="190" cy="230" rx="10" ry="6" fill="#8a4b2a"/><ellipse cx="200" cy="80" rx="12" ry="7" fill="#8a4b2a"/><circle cx="85" cy="170" r="6" fill="#8a4b2a"/><circle cx="215" cy="320" r="7" fill="#8a4b2a"/></g>
      <g class="frost" pointer-events="none"><path d="M70 70 l10 8 m-5 -10 v14 M220 90 l-8 8 m4 -10 v12 M90 320 l8 6 m-4 -8 v10 M205 270 l-8 6 m4 -8 v10" stroke="#e8f8ff" stroke-width="3" stroke-linecap="round"/><rect x="65" y="55" width="170" height="40" rx="20" fill="#e8f8ff" opacity=".45"/></g>
      <rect x="132" y="198" width="36" height="18" rx="6" fill="#9aa6c0"/>
      <g class="head" data-zone="head">
        <g data-zone="antenna" class="antenna"><line x1="150" y1="60" x2="150" y2="22" stroke="#9aa6c0" stroke-width="6" stroke-linecap="round"/><circle class="bulb" cx="150" cy="18" r="12" fill="#ff5d5d"/></g>
        <circle cx="62" cy="132" r="18" class="paint2"/><circle cx="238" cy="132" r="18" class="paint2"/>
        <rect x="65" y="55" width="170" height="150" rx="52" class="paint"/>
        <ellipse cx="110" cy="75" rx="30" ry="10" fill="#fff" opacity=".4"/>
        <rect x="88" y="80" width="124" height="98" rx="30" fill="#0b1240"/>
        <g class="eyes">${eye(122)}${eye(178)}</g>
        <g class="cheeks"><circle cx="102" cy="152" r="7" fill="#ff6b9d" opacity=".7"/><circle cx="198" cy="152" r="7" fill="#ff6b9d" opacity=".7"/></g>
        <path class="smile" d="M134 150 Q150 164 166 150" stroke="#5ce1ff" stroke-width="5" fill="none" stroke-linecap="round"/>
        <g class="talkbars">${[0, 1, 2, 3, 4].map(i => `<rect class="tb" x="${129 + i * 9}" y="150" width="6" height="6" rx="3" fill="#5ce1ff"/>`).join('')}</g>
        <g class="zzz"><text x="215" y="70" font-size="22" fill="#fff">z</text><text x="232" y="50" font-size="28" fill="#fff">Z</text></g>
      </g>
      <g class="acc acc-cap"><path d="M78 72 Q150 0 222 72 Z" fill="#2f5bd9"/><path d="M200 66 Q250 62 262 76 L210 78 Z" fill="#1f3fa8"/><circle cx="150" cy="30" r="6" fill="#ffd75e"/></g>
      <g class="acc acc-party"><path d="M150 -10 L118 62 L182 62 Z" fill="#ff6b9d"/><path d="M134 26 L166 26 M126 44 L174 44" stroke="#ffd75e" stroke-width="5"/><circle cx="150" cy="-12" r="9" fill="#5ce1ff"/></g>
      <g class="acc acc-crown"><path d="M100 64 L104 22 L128 46 L150 14 L172 46 L196 22 L200 64 Z" fill="#ffd75e" stroke="#c9a12c" stroke-width="3"/><circle cx="150" cy="44" r="6" fill="#ff5d5d"/></g>
      <g class="acc acc-helmet" pointer-events="none"><circle cx="150" cy="130" r="112" fill="rgba(170,215,255,.14)" stroke="#e8f4ff" stroke-width="5"/><path d="M80 90 Q100 50 150 40" stroke="#fff" stroke-width="6" fill="none" opacity=".6" stroke-linecap="round"/></g>
      <g class="acc acc-shades" pointer-events="none"><rect x="98" y="100" width="46" height="32" rx="10" fill="#111"/><rect x="156" y="100" width="46" height="32" rx="10" fill="#111"/><rect x="142" y="110" width="16" height="5" fill="#111"/><path d="M104 108 L118 108" stroke="#fff" stroke-width="3" opacity=".6"/></g>
      <g class="acc acc-specs" pointer-events="none"><circle cx="122" cy="118" r="22" fill="none" stroke="#ffd75e" stroke-width="4"/><circle cx="178" cy="118" r="22" fill="none" stroke="#ffd75e" stroke-width="4"/><path d="M144 118 L156 118" stroke="#ffd75e" stroke-width="4"/></g>
      <g class="acc acc-bowtie" pointer-events="none"><path d="M150 214 L118 198 L118 230 Z" fill="#ff5d5d"/><path d="M150 214 L182 198 L182 230 Z" fill="#ff5d5d"/><circle cx="150" cy="214" r="8" fill="#c43a3a"/></g>
      <g class="acc acc-scarf" pointer-events="none"><rect x="110" y="200" width="80" height="22" rx="11" fill="#ff9a3c"/><rect x="164" y="212" width="20" height="50" rx="8" fill="#ff9a3c"/><path d="M118 211 H182" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/></g>
    </g>
  </svg>`;
}

// ================= Mars scene props =================
const PROPS = `
  <div class="prop dome" data-prop="dome"><svg viewBox="0 0 200 120">
    <path d="M10 110 A90 90 0 0 1 190 110 Z" fill="#eef2fa"/><path d="M40 110 A60 60 0 0 1 160 110" fill="none" stroke="#c7d0e6" stroke-width="4"/>
    <path class="door" d="M82 110 V78 A18 18 0 0 1 118 78 V110 Z" fill="#5b7cff"/><path class="shutter" d="M82 110 V78 A18 18 0 0 1 118 78 V110 Z" fill="#8a93b8"/>
    <rect x="0" y="106" width="200" height="8" rx="4" fill="#9aa6c0"/><circle cx="150" cy="60" r="10" fill="#7fd3e6"/><circle cx="55" cy="70" r="8" fill="#7fd3e6"/></svg></div>
  <div class="prop recycler" data-prop="recycler"><svg viewBox="0 0 70 90"><rect x="5" y="10" width="60" height="78" rx="12" fill="#c7d0e6"/><rect x="15" y="22" width="40" height="52" rx="8" fill="#5b7cff" class="rdoor"/><text x="35" y="56" text-anchor="middle" font-size="26">♻️</text><rect x="25" y="2" width="20" height="10" rx="4" fill="#9aa6c0"/></svg></div>
  <div class="prop panels" data-prop="panels"><svg viewBox="0 0 220 120">
    ${[0, 1, 2].map(i => `<g transform="translate(${10 + i * 70} 0)"><line x1="30" y1="60" x2="30" y2="115" stroke="#9aa6c0" stroke-width="5"/><g transform="skewX(-12)"><rect x="12" y="18" width="56" height="44" rx="4" fill="#1f3fa8" stroke="#c7d0e6" stroke-width="3"/><path d="M12 33 H68 M12 47 H68 M31 18 V62 M50 18 V62" stroke="#5b7cff" stroke-width="2"/></g></g>`).join('')}
    <g class="pdust">${[0, 1, 2].map(i => `<g transform="translate(${10 + i * 70} 0) skewX(-12)"><rect x="12" y="18" width="56" height="44" rx="4" fill="#b8673d"/><circle cx="30" cy="30" r="8" fill="#9c5530"/><circle cx="52" cy="48" r="10" fill="#9c5530"/></g>`).join('')}</g>
    <g class="sparkle">${[0, 1, 2].map(i => `<text x="${40 + i * 70}" y="30" font-size="18">✨</text>`).join('')}</g></svg></div>
  <div class="prop station" data-prop="station"><svg viewBox="0 0 60 140"><line x1="30" y1="40" x2="30" y2="138" stroke="#c7d0e6" stroke-width="5"/><g class="anemo"><line x1="10" y1="30" x2="50" y2="30" stroke="#c7d0e6" stroke-width="4"/><circle cx="10" cy="30" r="6" fill="#ffd75e"/><circle cx="50" cy="30" r="6" fill="#ffd75e"/></g><rect x="14" y="70" width="32" height="24" rx="5" fill="#2f5bd9"/><text x="30" y="88" text-anchor="middle" font-size="14">🌡️</text></svg></div>
  <div class="prop heli" data-prop="heli"><svg viewBox="0 0 90 90"><g class="rotor"><ellipse cx="45" cy="14" rx="40" ry="4" fill="#5c6390"/><ellipse cx="45" cy="22" rx="40" ry="4" fill="#5c6390"/></g><line x1="45" y1="10" x2="45" y2="40" stroke="#9aa6c0" stroke-width="4"/><rect x="30" y="38" width="30" height="24" rx="6" fill="#d4a017"/><rect x="34" y="42" width="22" height="12" rx="3" fill="#1f3fa8"/><path d="M33 62 L18 86 M57 62 L72 86 M45 62 V86" stroke="#9aa6c0" stroke-width="3"/></svg></div>`;

// ================= missions (from NASA data) =================
// type: rub (rub the target), tap (tap the target N times), hold (press and hold), collect (tap N spawned items)
function missionDefs(w, siteName) {
  const t = n => bnNum(n);
  return {
    weather: { icon: '🌡️', type: 'tap', target: 'station', need: 1, xp: 15,
      intro: L('Good morning! Can you tap my weather station? Let\'s read today\'s Mars weather!', 'শুভ সকাল! আমার আবহাওয়া স্টেশনে ট্যাপ করবে? চলো আজকের মঙ্গলের আবহাওয়া দেখি!'),
      hint: L('Tap the weather station', 'আবহাওয়া স্টেশনে ট্যাপ করো'),
      done: L(`Today at ${siteName.en}: daytime ${t(w.tMax)}°C, night ${t(w.tMin)}°C, air pressure ${w.pressure} Pa. That's real NASA rover-style data! Brrr!`,
        `আজ ${siteName.bn}-এ: দিনে ${t(w.tMax)}°C, রাতে ${t(w.tMin)}°C, বাতাসের চাপ ${t(w.pressure)} Pa। এটা নাসার রোভারের মতো ডেটা! ব্রর্‌!`) },
    panels: { icon: '☀️', type: 'rub', target: 'panels', need: 100, xp: 25,
      intro: L('Oh no! Mars dust covered my solar panels! No sunlight means no power. Rub them clean! 🧽', 'ওহ না! মঙ্গলের ধুলো আমার সোলার প্যানেল ঢেকে দিয়েছে! আলো না পেলে বিদ্যুৎ নেই। ঘষে পরিষ্কার করো! 🧽'),
      hint: L('Rub the solar panels', 'সোলার প্যানেল ঘষে পরিষ্কার করো'),
      done: L(`Sparkly clean! NASA's InSight lander had to stop working in 2022 because dust covered its panels. Today's dust level here is ${w.tau}.`,
        `ঝকঝকে! নাসার InSight ল্যান্ডার ২০২২ সালে থেমে গিয়েছিল, কারণ ধুলো তার প্যানেল ঢেকে দিয়েছিল। আজ এখানে ধুলোর মাত্রা ${t(w.tau)}।`) },
    storm: { icon: '🌪️', type: 'tap', target: 'dome', need: 3, xp: 30,
      intro: L('A big dust storm is coming! Tap the habitat 3 times to close the doors! 🌪️', 'বড় ধুলিঝড় আসছে! দরজা বন্ধ করতে ঘাঁটিতে ৩ বার ট্যাপ করো! 🌪️'),
      hint: L('Tap the habitat to close the doors', 'দরজা বন্ধ করতে ঘাঁটিতে ট্যাপ করো'),
      done: L('Phew, we\'re safe! In 2018 a dust storm covered all of Mars, and the Opportunity rover went to sleep forever.', 'উফ, আমরা নিরাপদ! ২০১৮ সালে এক ধুলিঝড় পুরো মঙ্গল ঢেকে দিয়েছিল, আর Opportunity রোভার চিরদিনের জন্য ঘুমিয়ে পড়েছিল।') },
    radiation: { icon: '☢️', type: 'tap', target: 'dome', need: 1, xp: 30, alarm: true,
      intro: w.nasa
        ? L(`Beep beep! NASA alert: a real solar ${w.nasa.type === 'sep' ? 'particle storm' : `flare (class ${w.nasa.classType})`}! Quick, tap the shelter! ☢️`, `বিপ বিপ! নাসার সতর্কবার্তা: সত্যিকারের ${w.nasa.type === 'sep' ? 'সৌর কণাঝড়' : `সৌর শিখা (${w.nasa.classType} শ্রেণি)`}! তাড়াতাড়ি শেল্টারে ট্যাপ করো! ☢️`)
        : L('Beep beep! Solar flare! Space radiation is coming! Quick, tap the shelter! ☢️', 'বিপ বিপ! সৌর শিখা! মহাকাশের বিকিরণ আসছে! তাড়াতাড়ি শেল্টারে ট্যাপ করো! ☢️'),
      hint: L('Quick! Tap the shelter', 'তাড়াতাড়ি! শেল্টারে ট্যাপ করো'),
      done: w.nasa
        ? L(`Safe inside! This was a REAL ${w.nasa.type === 'sep' ? 'solar particle storm' : `class ${w.nasa.classType} solar flare`} that NASA recorded on ${w.nasa.date}! Radiation today: ${w.radiation} mSv.`,
            `ভিতরে নিরাপদ! এটা ছিল সত্যিকারের ${w.nasa.type === 'sep' ? 'সৌর কণাঝড়' : `${w.nasa.classType} শ্রেণির সৌর শিখা`}, নাসা যেটা ${w.nasa.date} তারিখে রেকর্ড করেছে! আজকের বিকিরণ: ${t(w.radiation)} mSv।`)
        : L(`Safe inside! Today's radiation is ${w.radiation} mSv. Curiosity's RAD instrument measures Mars radiation every day.`, `ভিতরে নিরাপদ! আজকের বিকিরণ ${t(w.radiation)} mSv। কিউরিওসিটির RAD যন্ত্র প্রতিদিন মঙ্গলের বিকিরণ মাপে।`) },
    cold: { icon: '🥶', type: 'hold', target: 'heater', need: 100, xp: 25,
      intro: L(`Brrr! Tonight it will be ${t(w.tMin)}°C! I'm freezing! Press and hold the heater! 🔥`, `ব্রর্‌! আজ রাতে ${t(w.tMin)}°C হবে! আমি জমে যাচ্ছি! হিটারটা চেপে ধরে রাখো! 🔥`),
      hint: L('Press and hold the heater', 'হিটার চেপে ধরে রাখো'),
      done: L('Ahh, warm and cozy! Mars nights are colder than Antarctica. Rovers have heaters to keep their parts safe.', 'আহ, গরম আর আরাম! মঙ্গলের রাত অ্যান্টার্কটিকার চেয়েও ঠান্ডা। রোভারের যন্ত্রাংশ বাঁচাতে হিটার থাকে।') },
    rocks: { icon: '🪨', type: 'collect', item: '🪨', need: 3, xp: 25,
      intro: L('Let\'s be scientists like Perseverance! Tap 3 interesting rocks to collect samples! 🔬', 'চলো পারসিভিয়ারেন্সের মতো বিজ্ঞানী হই! নমুনা নিতে ৩টা মজার পাথরে ট্যাপ করো! 🔬'),
      hint: L('Tap the rocks to collect them', 'পাথরগুলোতে ট্যাপ করে সংগ্রহ করো'),
      done: L('Great samples! Perseverance keeps rock samples in special tubes, so scientists may study them on Earth one day.', 'দারুণ নমুনা! পারসিভিয়ারেন্স পাথরের নমুনা বিশেষ টিউবে রাখে, যাতে একদিন পৃথিবীতে বিজ্ঞানীরা পরীক্ষা করতে পারেন।') },
    ice: { icon: '🧊', type: 'rub', target: 'icespot', need: 100, xp: 25,
      intro: L('Beep! My scanner found something under the ground! Rub the spot to dig! ⛏️', 'বিপ! আমার স্ক্যানার মাটির নিচে কিছু পেয়েছে! জায়গাটা ঘষে খোঁড়ো! ⛏️'),
      hint: L('Rub the spot to dig', 'জায়গাটা ঘষে খোঁড়ো'),
      done: L('Water ice! NASA\'s Phoenix lander found ice like this under the Mars soil in 2008. Astronauts could use it for water!', 'পানির বরফ! নাসার ফিনিক্স ল্যান্ডার ২০০৮ সালে মঙ্গলের মাটির নিচে এমন বরফ পেয়েছিল। নভোচারীরা এটা থেকে পানি পেতে পারবে!') },
    heli: { icon: '🚁', type: 'hold', target: 'heli', need: 100, xp: 25,
      intro: L('Let\'s fly my little helicopter! Press and hold it to fly! 🚁', 'চলো আমার ছোট্ট হেলিকপ্টার ওড়াই! চেপে ধরে রাখো, উড়বে! 🚁'),
      hint: L('Press and hold the helicopter', 'হেলিকপ্টার চেপে ধরে রাখো'),
      done: L('It flew! NASA\'s Ingenuity became the first aircraft to fly on another planet, in 2021. Mars air is very thin, so its blades spin super fast!', 'উড়েছে! ২০২১ সালে নাসার ইনজেনুইটি প্রথম আকাশযান হিসেবে অন্য গ্রহে উড়েছিল। মঙ্গলের বাতাস খুব পাতলা, তাই এর পাখা খুব জোরে ঘোরে!') },
    recycler: { icon: '🚽', type: 'tap', target: 'recycler', need: 1, xp: 20,
      intro: L('Uh-oh… beep… I really need the recycler! 🙈 Tap the recycler door, quick!', 'উফ… বিপ… আমার এখনই রিসাইক্লারে যেতে হবে! 🙈 রিসাইক্লারের দরজায় ট্যাপ করো, তাড়াতাড়ি!'),
      hint: L('Tap the recycler', 'রিসাইক্লারে ট্যাপ করো'),
      done: L('Ahhh, much better! 😌 On the space station, astronauts recycle almost all their water, even sweat!', 'আহ্‌, অনেক ভালো! 😌 মহাকাশ স্টেশনে নভোচারীরা প্রায় সব পানি রিসাইকেল করেন, এমনকি ঘামও!') },
    dusty: { icon: '🧽', type: 'rub', target: 'robo', need: 100, xp: 20,
      intro: L('A-a-achoo! Mars dust got in my joints! Rub me clean, please! 🧽', 'হা-হা-হাঁচ্চু! আমার গায়ে মঙ্গলের ধুলো ঢুকে গেছে! আমাকে ঘষে পরিষ্কার করো, প্লিজ! 🧽'),
      hint: L('Rub R.O.B.O. to clean him', 'রোবোকে ঘষে পরিষ্কার করো'),
      done: L('Squeaky clean! Mars dust is finer than flour and sticks to everything!', 'একদম ঝকঝকে! মঙ্গলের ধুলো ময়দার চেয়েও মিহি, সবকিছুতে লেগে যায়!') },
  };
}
function planSol(w, sol) {
  const list = ['weather'];
  if (w.event === 'dust_storm') list.push('storm', 'panels');
  else if (w.tau >= 0.6) list.push('panels');
  if (w.event === 'flare' || w.event === 'sep') list.push('radiation');
  if (w.tMin <= -78) list.push('cold');
  const pool = ['rocks', 'recycler', 'heli', 'ice'];
  for (let i = 0; list.length < 3; i++) list.push(pool[(sol + i) % pool.length]);
  return [...new Set(list)];
}

// ================= view =================
export function viewRobo(app, { go }) {
  let r = decay(roboState());
  let data = null, w = null, siteName = { en: 'Gale Crater', bn: 'গেল ক্রেটার' };
  let mission = null; // { id, def, progress }
  let bubbleTimer, talkAnim, nextMissionTimer;
  let mode = null; // 'parrot' | null
  let busy = false;
  const timers = [], intervals = [];

  app.innerHTML = `
  <div class="room mars" id="room">
    <div class="sky"></div><div class="sun"></div><div class="hills"></div><div class="ground"></div><div class="duststorm"></div><div class="radglow"></div>
    <div class="world" id="world">${PROPS}</div>
    <div class="hud">
      <div class="stats" id="stats"></div>
      <div class="hudr"><div class="lvl" id="lvl"></div><div class="solchip" id="solchip"></div></div>
    </div>
    <div class="stage" id="stage">
      <div class="bubble hidden" id="bubble"></div>
      <div class="robowrap" id="robowrap">${roboSVG()}</div>
      <div class="hearts" id="fx"></div>
    </div>
    <div class="mhint hidden" id="mhint"></div>
    <div class="modebar hidden" id="modebar"></div>
    <div class="tray hidden" id="tray"></div>
    <nav class="toolbar" id="toolbar">
      ${[['parrot', '🦜', L('Talk', 'কথা')], ['ask', '💬', L('Ask', 'প্রশ্ন')], ['feed', '🍕', L('Feed', 'খাওয়াও')], ['sleep', '💡', L('Sleep', 'ঘুম')],
        ['emote', '😄', L('Emotes', 'ইমোট')], ['play', '🎮', L('Play', 'খেলা')], ['dress', '👕', L('Skins', 'স্কিন')], ['learn', '🚀', L('Learn', 'শিখি')]]
        .map(([id, ic, lb]) => `<button data-act="${id}"><span>${ic}</span><small>${T(lb)}</small></button>`).join('')}
    </nav>
  </div>`;

  const $ = id => document.getElementById(id);
  const svg = $('robo'); const room = $('room'); const world = $('world');
  const prop = name => world.querySelector(`[data-prop="${name}"]`);

  // ---------- rendering ----------
  function render() {
    const bars = [['⚡', 'energy'], ['😊', 'fun'], ['✨', 'clean'], ['😴', 'sleep']];
    $('stats').innerHTML = bars.map(([ic, k]) => `<div class="stat ${r[k] < 30 ? 'low' : ''}"><span>${ic}</span><div><i style="width:${r[k]}%"></i></div></div>`).join('');
    $('lvl').innerHTML = `⭐ ${isBn() ? 'লেভেল' : 'Lv'} ${bnNum(r.level)}<div class="xpbar"><i style="width:${Math.min(100, r.xp / xpNeed(r.level) * 100)}%"></i></div>`;
    if (w) $('solchip').innerHTML = `🔴 ${isBn() ? 'সল' : 'Sol'} ${bnNum(r.sol)} · ${bnNum(w.tMin)}°C${w.event === 'dust_storm' ? ' · 🌪️' : w.event ? ' · ☢️' : ''}`;
    const color = giftById(r.wear.color)?.color || '#d9e2f2';
    svg.style.setProperty('--paint', color);
    ['cap', 'party', 'crown', 'helmet', 'shades', 'specs', 'bowtie', 'scarf'].forEach(id => svg.querySelector('.acc-' + id).style.display = Object.values(r.wear).includes(id) ? 'inline' : 'none');
    svg.querySelector('.dirt').style.opacity = mission?.id === 'dusty' ? (1 - mission.progress / 100).toFixed(2) : Math.max(0, (50 - r.clean) / 50).toFixed(2);
    ['e1', 'e2', 'e3'].forEach((e, i) => svg.querySelector('.' + e).style.opacity = r.energy > i * 33 ? 1 : 0.15);
    room.classList.toggle('dark', !!r.asleep);
    if (r.asleep) setMood('sleep');
  }
  const persist = () => { saveRobo(r); render(); };

  function setMood(m, ms) {
    svg.dataset.mood = m;
    if (ms) timers.push(setTimeout(() => { if (svg.dataset.mood === m) svg.dataset.mood = r.asleep ? 'sleep' : 'normal'; }, ms));
  }
  function anim(cls, ms = 900) {
    const el = $('robowrap'); el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    timers.push(setTimeout(() => el.classList.remove(cls), ms));
  }
  function fx(emoji, n = 5) {
    const box = $('fx');
    for (let i = 0; i < n; i++) {
      const e = document.createElement('span'); e.textContent = emoji;
      e.style.left = 30 + Math.random() * 40 + '%'; e.style.animationDelay = i * 0.08 + 's';
      box.appendChild(e); setTimeout(() => e.remove(), 1600);
    }
  }
  function say(text, { speak = true, ms } = {}) {
    const b = $('bubble'); b.textContent = text; b.classList.remove('hidden');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => b.classList.add('hidden'), ms || Math.max(3000, text.length * 75));
    if (speak) robotSpeak(text);
  }
  const sayL = (o, opts) => say(T(o), opts);

  function mouthTalk(on, levelFn) {
    cancelAnimationFrame(talkAnim);
    svg.classList.toggle('talking', on);
    if (!on) return;
    const bars = svg.querySelectorAll('.tb');
    const loop = () => {
      const lv = levelFn ? levelFn() : Math.random();
      bars.forEach((b, i) => { const h = 4 + Math.abs(Math.sin(i * 1.7 + performance.now() / 90)) * lv * 22; b.setAttribute('height', h); b.setAttribute('y', 153 - h / 2); });
      talkAnim = requestAnimationFrame(loop);
    };
    loop();
  }
  function robotSpeak(text) {
    if (!('speechSynthesis' in window) || mode === 'parrot') return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}*]/gu, ''));
      const want = isBn() ? 'bn' : 'en';
      const v = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(want));
      if (v) u.voice = v;
      u.lang = isBn() ? 'bn-BD' : 'en-US'; u.pitch = 1.9; u.rate = isBn() ? 1 : 1.05;
      u.onstart = () => mouthTalk(true); u.onend = u.onerror = () => mouthTalk(false);
      speechSynthesis.speak(u);
      setTimeout(() => { if (!speechSynthesis.speaking) { mouthTalk(true); setTimeout(() => mouthTalk(false), Math.min(4000, text.length * 60)); } }, 400);
    } catch (e) {}
  }
  const bump = (k, v) => { r[k] = clamp(r[k] + v); };

  // ---------- weather / sky ----------
  async function loadWeather() {
    try {
      data = data || await getMarsData();
      const site = store.getProgress().design?.site || 'gale';
      const s = data.sites[site] || data.sites.gale;
      siteName = site === 'jezero' ? { en: 'Jezero Crater', bn: 'জেজেরো ক্রেটার' } : { en: 'Gale Crater', bn: 'গেল ক্রেটার' };
      w = s.sols[(r.sol - 1) % s.sols.length];
    } catch (e) { w = { sol: 1, tMax: -5, tMin: -78, pressure: 820, tau: 0.6, radiation: 0.65, event: null }; }
    room.classList.toggle('storm', w.event === 'dust_storm');
    render();
  }

  // ---------- touching R.O.B.O. ----------
  svg.addEventListener('pointerdown', e => {
    if (mission?.def.type === 'rub' && mission.def.target === 'robo') return;
    const zone = e.target.closest('[data-zone]')?.dataset.zone;
    if (!zone) return;
    if (r.asleep) { wake(); return; }
    ac();
    if (zone === 'antenna') { SFX.zap(); setMood('wow', 1200); anim('zap'); fx('⚡', 4); sayL(pick(LINES.antenna)); }
    else if (zone === 'head') { SFX.giggle(); setMood(Math.random() < 0.2 ? 'sad' : 'laugh', 1400); anim('wobble'); sayL(pick(LINES.head)); }
    else if (zone === 'belly') { SFX.spin(); setMood('laugh', 1400); anim('spin', 1000); sayL(pick(LINES.belly)); }
    else if (zone === 'hand') { SFX.boop(); setMood('happy', 1400); anim(e.target.closest('.arm-l') ? 'wave-l' : 'wave-r', 1200); fx('✋', 2); sayL(pick(LINES.hand)); }
    bump('fun', 3); persist();
  });

  // ================= missions =================
  function startNextMission() {
    clearTimeout(nextMissionTimer);
    if (mission || r.asleep || busy || mode === 'parrot' || !w) return;
    if (r.clean < 35 && !r.solDone.includes('dusty')) return startMission('dusty');
    const plan = planSol(w, r.sol).filter(id => !r.solDone.includes(id));
    if (!plan.length) return finishSol();
    startMission(plan[0]);
  }
  function scheduleMission(ms = 14000) { clearTimeout(nextMissionTimer); nextMissionTimer = setTimeout(startNextMission, ms); }

  function startMission(id) {
    const def = missionDefs(w, siteName)[id];
    mission = { id, def, progress: 0 };
    const tgt = targetEl();
    // scene setup
    if (id === 'panels') { prop('panels').style.setProperty('--dust', 1); prop('panels').classList.add('dusty'); }
    if (id === 'heli') prop('heli').style.setProperty('--lift', 0);
    if (id === 'storm') prop('dome').style.setProperty('--shut', 0);
    if (id === 'cold') svg.querySelector('.frost').style.opacity = 1;
    if (id === 'storm') { room.classList.add('storm-coming'); SFX.wind(); }
    if (id === 'radiation') { room.classList.add('radiation'); SFX.alarm(); intervals.push(setInterval(() => mission?.id === 'radiation' && SFX.geiger(), 900)); }
    if (id === 'cold') { room.classList.add('cold'); svg.classList.add('shiver'); }
    if (id === 'rocks') spawnRocks(def.need);
    tgt?.classList.add('target');
    setMood(def.alarm || id === 'cold' || id === 'dusty' || id === 'recycler' ? 'wow' : 'happy', 2500);
    anim('jump', 800);
    sayL(def.intro);
    drawHint();
  }
  function targetEl() {
    if (!mission) return null;
    const t = mission.def.target;
    if (t === 'robo') return $('robowrap');
    if (t === 'heater') return prop('heater') || spawnProp('heater', `<svg viewBox="0 0 80 80"><rect x="8" y="16" width="64" height="56" rx="12" fill="#ff7a1a"/><path d="M20 30 H60 M20 42 H60 M20 54 H60" stroke="#ffd2a8" stroke-width="5" stroke-linecap="round"/><text x="40" y="14" text-anchor="middle" font-size="16">🔥</text></svg>`);
    if (t === 'icespot') return prop('icespot') || spawnProp('icespot', `<svg viewBox="0 0 100 50"><ellipse cx="50" cy="30" rx="46" ry="18" fill="#7c3a1d"/><text x="50" y="38" text-anchor="middle" font-size="26" class="ice">🧊</text><ellipse class="soil" cx="50" cy="28" rx="44" ry="17" fill="#a0522d"/><text x="50" y="20" text-anchor="middle" font-size="16">❓</text></svg>`);
    return t ? prop(t) : null;
  }
  function spawnProp(name, inner) {
    const d = document.createElement('div'); d.className = `prop ${name} spawned`; d.dataset.prop = name; d.innerHTML = inner;
    world.appendChild(d); return d;
  }
  function spawnRocks(n) {
    for (let i = 0; i < n; i++) {
      const d = spawnProp('rock', `<span>🪨</span>`);
      d.style.left = [3, 15, 74, 87][i % 4] + Math.random() * 3 + '%'; d.style.bottom = (3 + Math.random() * 12) + '%';
      d.classList.add('target');
    }
  }
  function drawHint() {
    const h = $('mhint');
    if (!mission) { h.classList.add('hidden'); return; }
    const m = mission, pct = Math.min(100, m.def.type === 'collect' || m.def.type === 'tap' ? m.progress / m.def.need * 100 : m.progress);
    h.classList.remove('hidden');
    h.innerHTML = `<span class="mic">${m.def.icon}</span><div class="mtext"><b>${T(m.def.hint)}</b><div class="mbar"><i style="width:${pct}%"></i></div></div>
      <button class="help" id="mhelp" title="Help">🎤 ${isBn() ? 'সাহায্য' : 'Help'}</button>`;
    $('mhelp').onclick = () => talk(true);
  }
  function addProgress(v) {
    if (!mission) return;
    mission.progress = Math.min(mission.def.type === 'tap' || mission.def.type === 'collect' ? mission.def.need : 100, mission.progress + v);
    const p = mission.def.type === 'tap' || mission.def.type === 'collect' ? mission.progress / mission.def.need : mission.progress / 100;
    // visual feedback per mission
    if (mission.id === 'panels') prop('panels').style.setProperty('--dust', (1 - p).toFixed(2));
    if (mission.id === 'ice') { const s = prop('icespot')?.querySelector('.soil'); if (s) s.style.opacity = (1 - p).toFixed(2); }
    if (mission.id === 'cold') svg.querySelector('.frost').style.opacity = (1 - p).toFixed(2);
    if (mission.id === 'heli') prop('heli').style.setProperty('--lift', p.toFixed(2));
    if (mission.id === 'dusty') { r.clean = clamp(Math.max(r.clean, p * 100)); }
    if (mission.id === 'storm') prop('dome').style.setProperty('--shut', p.toFixed(2));
    drawHint(); render();
    if (p >= 1) completeMission();
  }
  function completeMission() {
    const m = mission; mission = null;
    world.querySelectorAll('.target').forEach(el => el.classList.remove('target'));
    $('mhint').classList.add('hidden');
    room.classList.remove('storm-coming', 'radiation', 'cold');
    svg.classList.remove('shiver');
    if (m.id === 'panels') { const pn = prop('panels'); pn.classList.remove('dusty'); pn.classList.add('shine'); timers.push(setTimeout(() => pn.classList.remove('shine'), 2500)); }
    if (m.id === 'storm') { room.classList.add('storm-inside'); timers.push(setTimeout(() => { room.classList.remove('storm-inside'); prop('dome').style.setProperty('--shut', 0); }, 6000)); }
    if (m.id === 'heli') { prop('heli').classList.add('flying'); timers.push(setTimeout(() => { prop('heli').classList.remove('flying'); prop('heli').style.setProperty('--lift', 0); }, 4000)); }
    if (m.id === 'recycler') SFX.flush();
    ['heater', 'icespot'].forEach(n => { const el = prop(n); if (el) timers.push(setTimeout(() => el.remove(), m.id === 'ice' ? 3000 : 300)); });
    r.solDone = [...r.solDone, m.id]; r.missionsDone++;
    bump('fun', 10);
    SFX.win(); setMood('star', 2600); anim('jump', 800); fx('⭐', 6);
    const before = r.level; r.xp += m.def.xp; levelCheck(r); persist();
    say(`${T(pick(LINES.nice))} +${bnNum(m.def.xp)} XP\n${T(m.def.done)}`, { ms: 9000 });
    if (r.level > before) timers.push(setTimeout(showGifts, 3500));
    scheduleMission(r.level > before ? 22000 : 16000);
  }
  function finishSol() {
    r.sol = r.sol % 30 + 1; r.solDone = []; r.xp += 20; const before = r.level; levelCheck(r); persist();
    SFX.levelup(); setMood('love', 2500); anim('jump'); fx('🌅', 3);
    say(isBn() ? `দারুণ! আজকের সব কাজ শেষ! একটা নতুন সল শুরু হলো: সল ${bnNum(r.sol)}। +২০ XP` : `Amazing! All of today's jobs are done! A new sol begins: Sol ${r.sol}. +20 XP`, { ms: 5000 });
    loadWeather().then(() => { if (r.level > before) timers.push(setTimeout(showGifts, 3000)); scheduleMission(r.level > before ? 20000 : 12000); });
  }

  // mission interactions: tap / hold / rub / collect
  world.addEventListener('pointerdown', e => {
    const el = e.target.closest('.prop'); if (!el || !mission) return;
    ac();
    const name = el.dataset.prop, d = mission.def;
    if (name === 'rock' && d.type === 'collect') {
      el.classList.add('picked'); SFX.coin(); fx('🔬', 1); setTimeout(() => el.remove(), 500); addProgress(1); return;
    }
    if (name !== d.target) { el.classList.add('nope'); setTimeout(() => el.classList.remove('nope'), 400); return; }
    if (d.type === 'tap') {
      SFX.click(); el.classList.add('tapped'); setTimeout(() => el.classList.remove('tapped'), 200);
      if (mission.id === 'storm') SFX.boop();
      addProgress(1);
    } else if (d.type === 'hold') {
      el.setPointerCapture?.(e.pointerId);
      const id = mission.id;
      const iv = setInterval(() => { if (!mission || mission.id !== id) return clearInterval(iv); addProgress(4); if (id === 'heli') SFX.heli(); else if (Math.random() < 0.3) tone(200, 0.1, 'sine', 0.05); }, 120);
      const up = () => { clearInterval(iv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('pointerleave', up); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    }
  });
  let lastRub = 0;
  room.addEventListener('pointermove', e => {
    if (!mission || mission.def.type !== 'rub' || (e.pointerType === 'mouse' && !e.buttons)) return;
    const now = Date.now(); if (now - lastRub < 50) return; lastRub = now;
    const tgt = targetEl(); if (!tgt) return;
    const b = (mission.def.target === 'robo' ? svg : tgt).getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) return;
    const rr = room.getBoundingClientRect();
    const s = document.createElement('i'); s.className = mission.id === 'ice' ? 'dirtbit' : 'soap'; s.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    s.style.left = e.clientX - rr.left + 'px'; s.style.top = e.clientY - rr.top + 'px'; room.appendChild(s); setTimeout(() => s.remove(), 900);
    if (Math.random() < 0.35) (mission.id === 'ice' ? SFX.dig : SFX.bubble)();
    addProgress(mission.id === 'ice' ? 2.2 : 1.8);
  });

  // ================= level-up gifts =================
  function showGifts() {
    const g = pendingGifts.shift(); if (!g) return;
    const ov = document.createElement('div'); ov.className = 'giftov';
    ov.innerHTML = `<div class="giftcard"><p class="kicker">⭐ ${isBn() ? 'লেভেল আপ!' : 'LEVEL UP!'} ${isBn() ? 'লেভেল' : 'Level'} ${bnNum(g.level)}</p>
      <div class="giftbox" id="gbox">🎁</div><p class="gtap">${isBn() ? 'উপহারে ট্যাপ করো!' : 'Tap the gift!'}</p>
      <div class="greveal hidden" id="grev"><div class="gicon">${g.icon}</div><h3>${T(g.name)}</h3>
      <p>${g.kind === 'emote' ? (isBn() ? 'নতুন ইমোট! 😄 বোতাম চাপো।' : 'New emote! Press the 😄 button.') : (isBn() ? 'নতুন সাজ!' : 'New look!')}</p>
      <button class="btn big" id="guse">${g.kind === 'emote' ? (isBn() ? 'দেখাও!' : 'Show me!') : (isBn() ? 'পরিয়ে দাও!' : 'Wear it!')}</button></div></div>`;
    document.body.appendChild(ov); SFX.levelup();
    ov.querySelector('#gbox').onclick = () => { SFX.coin(); ov.querySelector('#gbox').classList.add('open'); ov.querySelector('.gtap').remove(); setTimeout(() => ov.querySelector('#grev').classList.remove('hidden'), 400); };
    ov.querySelector('#guse').onclick = () => {
      ov.remove();
      if (g.kind === 'emote') doEmote(g.id);
      else { r.wear = { ...r.wear, [g.kind === 'skin' ? 'color' : g.kind]: g.id }; persist(); setMood('love', 2000); anim('jump'); fx('✨', 5); sayL(L('Do I look cool? Thank you! 😎', 'আমাকে কি দারুণ লাগছে? ধন্যবাদ! 😎')); }
      if (pendingGifts.length) setTimeout(showGifts, 1500);
    };
  }

  // ================= emotes =================
  const EMOTES = {
    wave: () => { SFX.boop(); setMood('happy', 1500); anim('wave-r', 1200); sayL(L('Hi hi hi! 👋', 'হাই হাই হাই! 👋')); },
    dance: () => { [0, 1, 2, 3].forEach(i => tone([523, 659, 784, 659][i], 0.2, 'square', 0.06, null, i * 0.25)); setMood('happy', 2600); anim('dance', 2600); fx('🎵', 5); },
    flip: () => { SFX.spin(); setMood('laugh', 1500); anim('flip', 1100); sayL(L('Ta-daa! 🤸', 'টা-ডা! 🤸')); },
    moonwalk: () => { tone(220, 1.6, 'triangle', 0.06, 440); setMood('happy', 2600); anim('moonwalk', 2600); sayL(L('Moonwalk… on Mars! 🕺', 'মুনওয়াক… মঙ্গলে! 🕺')); },
    love: () => { SFX.giggle(); setMood('love', 2600); anim('jump', 800); fx('💖', 10); sayL(L('I love you, friend! 💖', 'তোমাকে অনেক ভালোবাসি, বন্ধু! 💖')); },
    salute: () => { SFX.win(); setMood('star', 2000); anim('salute', 2000); sayL(L('Junior Astronaut, reporting for duty! 🫡', 'জুনিয়র নভোচারী, কাজের জন্য হাজির! 🫡')); },
    rocket: () => { SFX.zap(); tone(200, 1.2, 'sawtooth', 0.06, 1200); setMood('wow', 2200); anim('rocketjump', 2200); fx('🔥', 4); sayL(L('3… 2… 1… LIFTOFF! 🚀', '৩… ২… ১… উড়ে যাও! 🚀')); },
  };
  function doEmote(id) { if (r.asleep) wake(); EMOTES[id]?.(); bump('fun', 4); persist(); }
  function emotes() {
    openTray(`<div class="trayhead">😄 ${isBn() ? 'ইমোট' : 'Emotes'}<button class="x" data-close>✕</button></div>
      <div class="items">${GIFTS.filter(g => g.kind === 'emote').map(g => {
        const ok = r.unlocked.includes(g.id);
        return `<button class="item ${ok ? '' : 'lockd'}" data-emote="${g.id}"><span>${ok ? g.icon : '🔒'}</span><small>${ok ? T(g.name) : (isBn() ? 'লেভেল ' : 'Lv ') + bnNum(g.level)}</small></button>`;
      }).join('')}</div>`);
    $('tray').querySelectorAll('[data-emote]').forEach(b => b.onclick = () => {
      if (!r.unlocked.includes(b.dataset.emote)) { setMood('sad', 1500); sayL(LINES.locked); return; }
      closeTray(); doEmote(b.dataset.emote);
    });
  }

  // ================= wardrobe =================
  function dress() {
    const slots = [['color', L('Skins', 'স্কিন')], ['head', L('Hats', 'টুপি')], ['face', L('Glasses', 'চশমা')], ['neck', L('Neck', 'গলা')]];
    const slotOf = g => (g.kind === 'skin' ? 'color' : g.kind);
    openTray(`<div class="trayhead">👕 ${isBn() ? 'রোবোর স্কিন ও সাজ' : 'Skins & outfits'}<button class="x" data-close>✕</button></div>
      <div class="shop">${slots.map(([slot, lb]) => `<div class="slot"><b>${T(lb)}</b><div class="items">
        ${GIFTS.filter(g => slotOf(g) === slot).map(g => {
          const own = r.unlocked.includes(g.id), on = r.wear[slot] === g.id;
          return `<button class="item ${on ? 'on' : ''} ${own ? '' : 'lockd'}" data-item="${g.id}"><span>${own ? g.icon : '🔒'}</span><small>${on ? '✓' : own ? T(g.name) : (isBn() ? 'লেভেল ' : 'Lv ') + bnNum(g.level)}</small></button>`;
        }).join('')}</div></div>`).join('')}</div>`);
    $('tray').querySelectorAll('[data-item]').forEach(b => b.onclick = () => {
      const g = giftById(b.dataset.item); const slot = slotOf(g);
      if (!r.unlocked.includes(g.id)) { setMood('sad', 1500); sayL(LINES.locked); return; }
      if (r.wear[slot] === g.id && slot !== 'color') r.wear = { ...r.wear, [slot]: null };
      else { r.wear = { ...r.wear, [slot]: g.id }; setMood('love', 1600); anim('jump', 800); fx('✨', 4); }
      persist(); dress();
    });
  }

  // ================= feed / sleep =================
  function openTray(html) { const t = $('tray'); t.innerHTML = html; t.classList.remove('hidden'); }
  function closeTray() { $('tray').classList.add('hidden'); }
  $('tray').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeTray(); });
  function feed() {
    openTray(`<div class="trayhead">${isBn() ? 'খাবারটা টেনে রোবোর মুখে দাও (বা ট্যাপ করো)' : 'Drag food to R.O.B.O.\'s mouth (or tap it)'}<button class="x" data-close>✕</button></div>
      <div class="foods">${FOODS.map(f => `<button class="food" data-food="${f.id}">${f.icon}</button>`).join('')}</div>`);
    $('tray').querySelectorAll('[data-food]').forEach(btn => btn.addEventListener('pointerdown', ev => dragFood(ev, FOODS.find(f => f.id === btn.dataset.food))));
  }
  function overMouth(e) { const m = svg.getBoundingClientRect(); const x = (e.clientX - m.left) / m.width, y = (e.clientY - m.top) / m.height; return x > 0.2 && x < 0.8 && y > 0.1 && y < 0.55; }
  function dragFood(ev, food) {
    ev.preventDefault();
    const ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.textContent = food.icon; document.body.appendChild(ghost);
    const start = { x: ev.clientX, y: ev.clientY, t: Date.now() };
    const move = e => { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; if (!r.asleep) svg.dataset.mood = overMouth(e) ? 'wow' : 'normal'; };
    move(ev);
    const up = e => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      const tap = Math.hypot(e.clientX - start.x, e.clientY - start.y) < 10 && Date.now() - start.t < 400;
      if (tap || overMouth(e)) {
        const m = svg.getBoundingClientRect();
        ghost.style.transition = 'all .35s ease-in'; ghost.style.left = m.left + m.width / 2 + 'px'; ghost.style.top = m.top + m.height * 0.37 + 'px'; ghost.style.transform = 'translate(-50%,-50%) scale(.3)';
        setTimeout(() => { ghost.remove(); eat(food); }, 350);
      } else { ghost.remove(); if (!r.asleep) svg.dataset.mood = 'normal'; }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }
  function eat(food) {
    if (r.asleep) wake();
    SFX.chomp(); setMood(food.fun < 0 ? 'sad' : 'happy', 1500); anim('chomp', 700);
    bump('energy', food.energy); bump('fun', food.fun);
    if (r.energy >= 100) { sayL(L('I\'m full! No more, please! 😵', 'পেট ভরে গেছে! আর না, প্লিজ! 😵')); setMood('wow', 1200); } else sayL(food.line);
    fx(food.fun < 0 ? '💢' : '💖', 3); persist();
  }
  function sleep() {
    if (r.asleep) return wake();
    r.asleep = true; stopParrot(); SFX.snore(); setMood('sleep'); persist(); $('mhint').classList.add('hidden');
    say(isBn() ? 'শুভ রাত্রি… ঘুমিয়ে চার্জ হচ্ছি… 😴' : 'Good night… recharging… 😴', { ms: 2500 });
  }
  function wake() { r.asleep = false; setMood('happy', 2000); anim('jump', 800); sayL(LINES.wake); persist(); if (mission) drawHint(); else scheduleMission(8000); }

  // ================= Talk: repeat in robot voice (Talking-Tom style) =================
  let stream, rec, chunks = [], loopTimer, playing = false;
  async function startParrot() {
    if (r.asleep) wake();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { sayL(LINES.noMic); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { sayL(LINES.noMic); return; }
    try { speechSynthesis.cancel(); } catch (e) {}
    mode = 'parrot'; $('modebar').classList.remove('hidden');
    $('modebar').innerHTML = `<span class="recdot"></span> 🦜 ${isBn() ? 'কিছু বলো, রোবো নকল করবে!' : 'Say something, R.O.B.O. will copy you!'} <button data-done>${isBn() ? 'থামাও' : 'Stop'}</button>`;
    $('modebar').querySelector('[data-done]').onclick = stopParrot;
    document.querySelector('[data-act=parrot]').classList.add('on');
    say(T(LINES.listen), { speak: false, ms: 2500 });
    const c = ac(); const src = c.createMediaStreamSource(stream); const an = c.createAnalyser(); an.fftSize = 1024; src.connect(an);
    const buf = new Float32Array(an.fftSize);
    let state = 'idle', lastLoud = 0, recStart = 0, floor = 0.01, calib = []; const t0 = Date.now();
    loopTimer = setInterval(() => {
      an.getFloatTimeDomainData(buf);
      let sum = 0; for (const v of buf) sum += v * v; const rms = Math.sqrt(sum / buf.length);
      if (Date.now() - t0 < 500) { calib.push(rms); return; }
      if (calib.length) { calib.sort((a, b) => a - b); floor = calib[Math.floor(calib.length / 2)]; calib = []; }
      if (playing) return;
      if (state === 'idle' && rms < floor * 1.5) floor = floor * 0.98 + rms * 0.02;
      const startTh = Math.min(0.08, Math.max(0.025, floor * 3)), stopTh = startTh * 0.55;
      if (state === 'idle' && rms > startTh) {
        chunks = []; rec = new MediaRecorder(stream);
        rec.ondataavailable = e => e.data.size && chunks.push(e.data);
        rec.onstop = () => replay(Date.now() - recStart);
        rec.start(); state = 'rec'; lastLoud = recStart = Date.now();
        setMood('wow'); svg.classList.add('listening');
      } else if (state === 'rec') {
        if (rms > stopTh) lastLoud = Date.now();
        if (Date.now() - lastLoud > 800 || Date.now() - recStart > 7000) { state = 'busy'; rec.stop(); svg.classList.remove('listening'); }
      }
    }, 50);
    async function replay(len) {
      if (len < 450 || !chunks.length) { state = 'idle'; setMood('normal'); return; }
      try {
        const c = ac();
        const audio = await c.decodeAudioData(await new Blob(chunks, { type: rec.mimeType }).arrayBuffer());
        playing = true; setMood('happy');
        const s = c.createBufferSource(); s.buffer = audio; s.playbackRate.value = 1.55;
        const out = c.createAnalyser(); out.fftSize = 256; out.connect(c.destination);
        const dry = c.createGain(); dry.gain.value = 0.7;
        const ring = c.createGain(); ring.gain.value = 0;
        const osc = c.createOscillator(); osc.frequency.value = 55; const depth = c.createGain(); depth.gain.value = 0.8;
        osc.connect(depth).connect(ring.gain);
        s.connect(dry).connect(out); s.connect(ring).connect(out);
        const lv = new Uint8Array(out.frequencyBinCount);
        mouthTalk(true, () => { out.getByteFrequencyData(lv); return Math.min(1, lv.reduce((a, b) => a + b, 0) / lv.length / 60); });
        osc.start(); s.start();
        s.onended = () => { osc.stop(); mouthTalk(false); playing = false; state = 'idle'; setMood('normal'); bump('fun', 4); persist(); };
      } catch (e) { playing = false; state = 'idle'; }
    }
  }
  function stopParrot() {
    clearInterval(loopTimer); loopTimer = null;
    try { rec?.state === 'recording' && rec.stop(); } catch (e) {}
    stream?.getTracks().forEach(t => t.stop()); stream = null;
    svg.classList.remove('listening'); mouthTalk(false);
    if (mode === 'parrot') { mode = null; $('modebar').classList.add('hidden'); if (!mission) scheduleMission(10000); }
    document.querySelector('[data-act=parrot]')?.classList.remove('on');
  }

  // ================= Ask: voice question → Gemini (also mission help) =================
  function talk(forMission = false) {
    if (r.asleep) wake();
    stopParrot();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const ctx = () => {
      let c = `You are R.O.B.O., the child's robot friend who lives on Mars at ${siteName.en}. Today is sol ${r.sol}: max ${w?.tMax}C, min ${w?.tMin}C, dust ${w?.tau}, radiation ${w?.radiation} mSv, event ${w?.event || 'none'}. Answer as R.O.B.O. in first person, playful, short (2-4 sentences).`;
      if (mission) c += ` The child is doing a mission right now: "${T(mission.def.intro)}". What to do: ${mission.def.hint.en} (${mission.def.type === 'rub' ? 'move a finger back and forth over it' : mission.def.type === 'hold' ? 'press it and keep the finger down' : 'tap it'}). If they ask for help, explain simply how to do it and why it matters on Mars.`;
      return c;
    };
    const ask = async q => {
      if (!q) return;
      busy = true; say(`🧒 “${q}”`, { speak: false, ms: 2000 });
      setTimeout(() => say(T(LINES.thinking), { speak: false, ms: 20000 }), 700); setMood('wow');
      try {
        const a = await askAstro(q, ctx());
        setMood('happy', 3000); say(a, { ms: Math.max(6000, a.length * 85) }); bump('fun', 5); persist();
      } catch (e) {
        setMood('sad', 2000);
        if (mission) say(`${isBn() ? 'আমার অ্যান্টেনায় সিগন্যাল নেই! তবে শোনো:' : 'No signal! But here\'s a tip:'} ${T(mission.def.hint)}!`);
        else say(isBn() ? 'আমার অ্যান্টেনায় সিগন্যাল নেই! পরে আবার জিজ্ঞেস করো।' : 'No signal on my antenna! Ask me again later.');
      }
      busy = false;
    };
    const quickHelp = forMission && mission ? (isBn() ? 'এই মিশনটা কীভাবে করব?' : 'How do I do this mission?') : null;
    if (!SR) {
      if (quickHelp) return ask(quickHelp);
      openTray(`<div class="trayhead">💬 ${T(LINES.ask)}<button class="x" data-close>✕</button></div>
        <form class="askform"><input maxlength="300" placeholder="${isBn() ? 'যেমন: মঙ্গল লাল কেন?' : 'e.g. Why is Mars red?'}"><button class="btn">➤</button></form>`);
      const f = $('tray').querySelector('form'); f.querySelector('input').focus();
      f.onsubmit = e => { e.preventDefault(); const q = f.querySelector('input').value.trim(); closeTray(); ask(q); };
      return;
    }
    const recog = new SR(); recog.lang = isBn() ? 'bn-BD' : 'en-US'; recog.interimResults = false;
    let got = false;
    recog.onstart = () => { say(quickHelp ? (isBn() ? 'কী জানতে চাও? বলো! 🎤' : 'What do you want to know? Tell me! 🎤') : T(LINES.ask), { speak: false, ms: 6000 }); svg.classList.add('listening'); setMood('wow'); };
    recog.onresult = e => { got = true; ask(e.results[0][0].transcript); };
    recog.onerror = e => { if (e.error === 'not-allowed') sayL(LINES.noMic); };
    recog.onend = () => { svg.classList.remove('listening'); if (!got && quickHelp) ask(quickHelp); };
    try { speechSynthesis.cancel(); recog.start(); } catch (e) { if (quickHelp) ask(quickHelp); }
  }

  // ================= play =================
  function play() {
    if (r.asleep) wake();
    if (r.energy < 15) { setMood('sad', 1500); sayL(LINES.hungry); return; }
    stopParrot();
    starCatcher(stars => {
      const xp = Math.min(30, stars); const before = r.level;
      r.xp += xp; levelCheck(r); bump('fun', 25); bump('energy', -12); bump('sleep', -6); persist();
      setMood('love', 2500); anim('jump'); fx('⭐', Math.min(8, stars));
      sayL(L(`We caught ${stars} stars! +${xp} XP! Again, again!`, `আমরা ${bnNum(stars)}টা তারা ধরেছি! +${bnNum(xp)} XP! আবার খেলি!`));
      if (r.level > before) timers.push(setTimeout(showGifts, 2500));
    });
  }

  // ================= first visit: name =================
  function askName() {
    openTray(`<div class="trayhead">👋 ${isBn() ? 'তোমার নাম কী, নভোচারী?' : 'What\'s your name, astronaut?'}<button class="x" data-close>✕</button></div>
      <form class="nameform"><input maxlength="24" placeholder="${isBn() ? 'যেমন: রিয়া' : 'e.g. Riya'}"><button class="btn big">OK</button></form>`);
    const f = $('tray').querySelector('form');
    f.onsubmit = e => {
      e.preventDefault(); const n = f.querySelector('input').value.trim(); if (!n) return;
      store.save({ name: n }); closeTray(); setMood('love', 2500); anim('jump'); fx('💖', 4);
      say(isBn() ? `${n}! কী সুন্দর নাম! চলো বন্ধু হই!` : `${n}! What a cool name! Let's be friends!`);
      scheduleMission(5000);
    };
  }

  // ================= toolbar =================
  $('toolbar').addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
    ac();
    if (act !== 'parrot' && mode === 'parrot') stopParrot();
    closeTray();
    ({ feed, sleep, dress, play, emote: emotes, ask: () => talk(false),
      parrot: () => (mode === 'parrot' ? stopParrot() : startParrot()),
      learn: () => go('map') })[act]?.();
  });

  // ================= life loop =================
  function checkNeeds() {
    if (r.asleep || busy || mode || mission) return;
    if (r.energy < 25) { setMood('sad', 3000); sayL(LINES.hungry); }
    else if (r.sleep < 20) { setMood('sleep', 3000); sayL(LINES.tired); }
    else if (r.fun < 30) { setMood('sad', 3000); sayL(LINES.bored); }
  }
  intervals.push(setInterval(() => {
    if (r.asleep) { bump('sleep', 2); bump('energy', 0.3); if (r.sleep >= 100) wake(); else if (Math.random() < 0.15) SFX.snore(); }
    else { bump('energy', -0.25); bump('fun', -0.3); bump('sleep', -0.15); bump('clean', -0.1); }
    render();
  }, 5000));
  intervals.push(setInterval(checkNeeds, 30000));
  intervals.push(setInterval(() => { if (!r.asleep && !mode && Math.random() < 0.4) anim(pick(['look', 'bob2']), 1600); }, 7000));
  intervals.push(setInterval(() => { if (mission && !r.asleep && !mode && !busy && $('bubble').classList.contains('hidden')) { sayL(mission.def.intro, { speak: false }); anim('jump', 700); } }, 20000));
  intervals.push(setInterval(() => saveRobo(r), 30000));

  render();
  loadWeather().then(() => {
    if (r.asleep) return;
    const name = store.getProgress().name;
    const hi = pick(LINES.hello);
    say(name ? `${T(hi)} ${name}! 👋` : T(hi), { speak: false, ms: 3500 });
    setMood('happy', 2500); anim('jump', 800);
    if (!name) askName(); else scheduleMission(4500);
    if (pendingGifts.length) timers.push(setTimeout(showGifts, 1500));
  });

  return () => {
    intervals.forEach(clearInterval); timers.forEach(clearTimeout); clearTimeout(bubbleTimer); clearTimeout(nextMissionTimer);
    stopParrot(); cancelAnimationFrame(talkAnim); try { speechSynthesis.cancel(); } catch (e) {}
    saveRobo(r);
  };
}

// ================= mini-game: Star Catcher =================
function starCatcher(onDone) {
  const ov = document.createElement('div'); ov.className = 'gameov';
  ov.innerHTML = `<canvas></canvas><div class="ghud"><span id="gScore">⭐ 0</span><span id="gTime">⏱ 40</span><span id="gLives">❤️❤️❤️</span><button id="gQuit">✕</button></div>
    <div class="gmsg" id="gMsg"><h2>⭐ Star Catcher</h2><p>${isBn() ? 'রোবোকে ডানে-বামে সরাও। তারা ধরো ⭐, গ্রহাণু এড়িয়ে চলো 🪨!' : 'Move R.O.B.O. left and right. Catch stars ⭐, dodge asteroids 🪨!'}</p><button class="btn big" id="gGo">${isBn() ? 'শুরু!' : 'Start!'}</button></div>`;
  document.body.appendChild(ov);
  const cv = ov.querySelector('canvas'); const g = cv.getContext('2d');
  let W, H;
  const size = () => { const dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  let x = W / 2, tx = W / 2, items = [], score = 0, lives = 3, time = 40, running = false, raf, last = 0, spawn = 0, hurt = 0, total = 0;
  const bg = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 2 + 0.5 }));
  const setX = e => { tx = e.clientX; };
  cv.addEventListener('pointermove', setX); cv.addEventListener('pointerdown', setX);
  const key = e => { if (e.key === 'ArrowLeft') tx = x - 80; if (e.key === 'ArrowRight') tx = x + 80; };
  addEventListener('keydown', key);
  function drawBot(px, py) {
    g.save(); g.translate(px, py);
    g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(-10, 30); g.lineTo(0, 52 + Math.random() * 8); g.lineTo(10, 30); g.fill();
    g.fillStyle = hurt > 0 && Math.floor(hurt * 10) % 2 ? '#ff7b7b' : '#d9e2f2';
    g.beginPath(); g.roundRect(-30, -30, 60, 56, 20); g.fill();
    g.fillStyle = '#0b1240'; g.beginPath(); g.roundRect(-21, -20, 42, 32, 12); g.fill();
    g.fillStyle = '#5ce1ff'; g.beginPath(); g.roundRect(-14, -13, 8, 13, 4); g.roundRect(6, -13, 8, 13, 4); g.fill();
    g.strokeStyle = '#9aa6c0'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -30); g.lineTo(0, -42); g.stroke();
    g.fillStyle = '#ff5d5d'; g.beginPath(); g.arc(0, -44, 5, 0, 7); g.fill();
    g.restore();
  }
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    g.fillStyle = '#0b0930'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; bg.forEach(s => { s.y = (s.y + dt * 0.05 * s.s) % 1; g.globalAlpha = 0.6; g.fillRect(s.x * W, s.y * H, s.s, s.s); }); g.globalAlpha = 1;
    const py = H - 110;
    if (running) {
      time -= dt; hurt = Math.max(0, hurt - dt);
      x += (tx - x) * Math.min(1, dt * 10); x = Math.max(35, Math.min(W - 35, x));
      spawn -= dt;
      const level = 1 + (40 - time) / 20;
      if (spawn <= 0) { spawn = 0.55 / level; const rock = Math.random() < 0.28 + level * 0.05; items.push({ x: 20 + Math.random() * (W - 40), y: -30, v: (140 + Math.random() * 90) * level, rock, gold: !rock && Math.random() < 0.12 }); }
      items.forEach(it => { it.y += it.v * dt; });
      items = items.filter(it => {
        if (Math.abs(it.x - x) < 42 && Math.abs(it.y - py) < 40) {
          if (it.rock) { lives--; hurt = 1; SFX.ow(); if (navigator.vibrate) navigator.vibrate(120); } else { score += it.gold ? 5 : 1; SFX.coin(); }
          return false;
        }
        return it.y < H + 40;
      });
      if (time <= 0 || lives <= 0) end();
      ov.querySelector('#gScore').textContent = `⭐ ${score}`; ov.querySelector('#gTime').textContent = `⏱ ${Math.max(0, Math.ceil(time))}`;
      ov.querySelector('#gLives').textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives));
    }
    g.font = '34px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    items.forEach(it => g.fillText(it.rock ? '🪨' : it.gold ? '🌟' : '⭐', it.x, it.y));
    drawBot(x, py);
    raf = requestAnimationFrame(frame);
  }
  function end() {
    running = false; total += score;
    if (score > 0) SFX.win();
    const m = ov.querySelector('#gMsg'); m.classList.remove('hidden');
    m.innerHTML = `<h2>${lives > 0 ? '🎉' : '💥'} ⭐ ${score}</h2><div class="row center"><button class="btn ghost" id="gBack">${isBn() ? 'রোবোর কাছে ফেরো' : 'Back to R.O.B.O.'}</button><button class="btn big" id="gAgain">${isBn() ? 'আবার খেলো' : 'Play again'}</button></div>`;
    m.querySelector('#gBack').onclick = close;
    m.querySelector('#gAgain').onclick = start;
  }
  function start() { items = []; score = 0; lives = 3; time = 40; spawn = 0.5; running = true; ov.querySelector('#gMsg').classList.add('hidden'); }
  function close() { cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('keydown', key); ov.remove(); onDone(total); }
  ov.querySelector('#gGo').onclick = start;
  ov.querySelector('#gQuit').onclick = () => { if (running) { running = false; } close(); };
  raf = requestAnimationFrame(frame);
}
