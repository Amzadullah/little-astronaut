// 30-sol Mars outpost simulation: engine + UI.
// Read (NASA weather) -> Plan (assign crew) -> Act (end sol) -> consequences.
import { s, tr, num, getLang } from './i18n.js';

const L = (en, bn) => ({ en, bn });

export const SITES = {
  gale: { name: L('Gale Crater', 'গেল ক্রেটার'), rover: 'Curiosity · REMS + RAD', desc: L('Curiosity\'s home. A bit warmer, higher air pressure.', 'কিউরিওসিটির বাড়ি। একটু গরম, বাতাসের চাপ বেশি।') },
  jezero: { name: L('Jezero Crater', 'জেজেরো ক্রেটার'), rover: 'Perseverance · MEDA', desc: L('Perseverance\'s home, an old lake bed. Colder, dustier: more science!', 'পারসিভিয়ারেন্সের বাড়ি, পুরোনো এক হ্রদের তলা। বেশি ঠান্ডা, বেশি ধুলো: কিন্তু বেশি বিজ্ঞান!') },
};

export const CREW = [
  { id: 'cmd', icon: '👩‍✈️', name: L('Nadia', 'নাদিয়া'), role: L('Commander', 'কমান্ডার'), perk: L('Team time counts double. Crew morale stays steadier.', 'টিম টাইম দ্বিগুণ কাজ করে। ক্রুর মনোবল স্থির থাকে।') },
  { id: 'eng', icon: '👨‍🔧', name: L('Rafi', 'রাফি'), role: L('Engineer', 'ইঞ্জিনিয়ার'), perk: L('Repairs always work. Cleans panels better.', 'মেরামত সবসময় সফল। প্যানেল ভালো পরিষ্কার করে।') },
  { id: 'sci', icon: '👩‍🔬', name: L('Mim', 'মিম'), role: L('Scientist', 'বিজ্ঞানী'), perk: L('More science points. Grows more food.', 'বেশি বিজ্ঞান পয়েন্ট। বেশি খাবার ফলায়।') },
  { id: 'med', icon: '🧑‍⚕️', name: L('Tanvir', 'তানভীর'), role: L('Medic', 'চিকিৎসক'), perk: L('Resting heals the team more. Crew health slowly improves.', 'বিশ্রামে দল বেশি সুস্থ হয়। ক্রুর স্বাস্থ্য ধীরে ধীরে ভালো হয়।') },
];

export const SUPPLIES = [
  { id: 'battery', icon: '🔋', name: L('Batteries', 'ব্যাটারি'), help: L('+8 kWh storage each', 'প্রতিটিতে +৮ kWh সংরক্ষণ') },
  { id: 'o2', icon: '🫧', name: L('Oxygen tanks', 'অক্সিজেন ট্যাংক'), help: L('+1.5 sols of air each', 'প্রতিটিতে +১.৫ সলের বাতাস') },
  { id: 'water', icon: '💧', name: L('Water', 'পানি'), help: L('+1.5 sols of water each', 'প্রতিটিতে +১.৫ সলের পানি') },
  { id: 'food', icon: '🥫', name: L('Food packs', 'খাবারের প্যাকেট'), help: L('+1.5 sols of food each', 'প্রতিটিতে +১.৫ সলের খাবার') },
  { id: 'parts', icon: '🔩', name: L('Spare parts', 'খুচরা যন্ত্রাংশ'), help: L('+1 repair kit each', 'প্রতিটিতে +১ মেরামত কিট') },
  { id: 'shield', icon: '🛡️', name: L('Radiation shield', 'বিকিরণ ঢাল'), help: L('−8% radiation each (max 5)', 'প্রতিটিতে −৮% বিকিরণ (সর্বোচ্চ ৫)') },
];
export const CARGO_POINTS = 20;

export const TASKS = {
  oxygen: { icon: '🫧', name: L('Make oxygen', 'অক্সিজেন বানাও'), power: 6, sys: 'oxygen' },
  water: { icon: '💧', name: L('Recycle water', 'পানি রিসাইকেল'), power: 4, sys: 'water' },
  food: { icon: '🌱', name: L('Greenhouse', 'গ্রিনহাউস'), power: 3, sys: 'greenhouse' },
  clean: { icon: '🧹', name: L('Clean solar panels (EVA)', 'সোলার প্যানেল পরিষ্কার (বাইরে)'), power: 0, eva: true },
  repair: { icon: '🔧', name: L('Repair', 'মেরামত'), power: 0 },
  science: { icon: '🔬', name: L('Science walk (EVA)', 'বিজ্ঞান অভিযান (বাইরে)'), power: 1, eva: true },
  rest: { icon: '😴', name: L('Rest', 'বিশ্রাম'), power: 0 },
  team: { icon: '🎲', name: L('Team time', 'টিম টাইম'), power: 0 },
};

export const SYS_NAME = { oxygen: L('Oxygen maker', 'অক্সিজেন মেশিন'), water: L('Water recycler', 'পানি রিসাইক্লার'), greenhouse: L('Greenhouse lights', 'গ্রিনহাউসের আলো'), solar: L('Solar controller', 'সোলার কন্ট্রোলার') };

function rng(seed) { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => (x = (x * 16807) % 2147483647) / 2147483647; }

export function newGame(design, data) {
  const sup = design.supplies;
  const cap = 40 + 8 * sup.battery;
  return {
    site: design.site, sol: 1, over: false, won: false, reason: null,
    battery: cap, cap,
    o2: 4 + 1.5 * sup.o2, water: 4 + 1.5 * sup.water, food: 4 + 1.5 * sup.food,
    parts: 1 + sup.parts, shield: Math.min(5, sup.shield) * 0.08,
    health: 90, morale: 85, dust: 0.05, dose: 0, science: 0,
    broken: {}, shelter: false,
    assign: { cmd: 'team', eng: 'oxygen', sci: 'food', med: 'water' },
    seed: 1234 + (design.site === 'jezero' ? 99 : 0),
    log: [{ sol: 0, msg: L('Landing successful! Welcome to Mars.', 'নিরাপদে অবতরণ! মঙ্গলে স্বাগতম।'), kind: 'good' }],
    history: [],
    sols: data.sites[design.site].sols,
  };
}

export const weatherOf = (g, sol = g.sol) => g.sols[Math.min(sol, g.sols.length) - 1];

export function solarOutput(g, w) {
  if (g.broken.solar) return 8;
  return 42 * (1 - g.dust) * Math.exp(-w.tau * 0.5);
}

export function preview(g) {
  const w = weatherOf(g);
  const heat = 2 + Math.max(0, -60 - w.tMin) * 0.15;
  let use = 12 + heat;
  Object.values(g.assign).forEach(t => { use += TASKS[t].power; });
  return { prod: solarOutput(g, w), use };
}

export function endSol(g) {
  const w = weatherOf(g);
  const r = rng(g.seed + g.sol * 7919);
  const log = [];
  const add = (msg, kind = 'info') => log.push({ sol: g.sol, msg, kind });
  const { prod, use } = preview(g);

  // --- crew actions
  let o2 = 0, water = 0, food = 0, morale = -2, health = -1.5, science = 0, evaCount = 0;
  for (const c of CREW) {
    let t = g.assign[c.id];
    const task = TASKS[t];
    if (task.eva && g.shelter) { add(L(`${c.name.en} stayed in the shelter (no EVA).`, `${c.name.bn} শেল্টারে ছিল (বাইরে যাওয়া বন্ধ)।`)); continue; }
    if (task.eva) evaCount++;
    if (task.sys && g.broken[task.sys]) { add(L(`${tr(SYS_NAME[task.sys])} is broken. ${c.name.en} could not work.`, `${SYS_NAME[task.sys].bn} নষ্ট। ${c.name.bn} কাজ করতে পারল না।`), 'bad'); continue; }
    switch (t) {
      case 'oxygen': o2 += 1.6; break;
      case 'water': water += 1.5; break;
      case 'food': food += (c.id === 'sci' ? 1.8 : 1.3) * (w.tau > 1.5 ? 0.6 : 1); break;
      case 'clean': g.dust = Math.max(0, g.dust - (c.id === 'eng' ? 0.7 : 0.5)); add(L('Solar panels cleaned ✨', 'সোলার প্যানেল পরিষ্কার হয়েছে ✨'), 'good'); break;
      case 'repair': {
        const brokenList = Object.keys(g.broken);
        if (!brokenList.length) { add(L(`${c.name.en} checked all systems. All good!`, `${c.name.bn} সব যন্ত্র পরীক্ষা করল। সব ঠিক আছে!`)); break; }
        if (g.parts <= 0) { add(L('No spare parts left to repair!', 'মেরামতের জন্য আর কোনো যন্ত্রাংশ নেই!'), 'bad'); break; }
        const sys = brokenList[0];
        if (c.id === 'eng' || r() < 0.6) { delete g.broken[sys]; g.parts--; add(L(`${tr(SYS_NAME[sys])} repaired by ${c.name.en} 🔧`, `${c.name.bn} ${SYS_NAME[sys].bn} মেরামত করল 🔧`), 'good'); }
        else add(L(`${c.name.en} tried to repair, but it needs another try.`, `${c.name.bn} মেরামতের চেষ্টা করল, আরেকবার চেষ্টা লাগবে।`), 'bad');
        break;
      }
      case 'science': science += (c.id === 'sci' ? 18 : 10) * (g.site === 'jezero' ? 1.2 : 1); morale += 2; break;
      case 'rest': health += c.id === 'med' ? 10 : 6; morale += 4; break;
      case 'team': morale += c.id === 'cmd' ? 14 : 7; break;
    }
  }
  if (g.assign.med !== undefined) health += 1; // medic passive
  morale += 1; // commander passive

  // --- power
  g.battery += prod - use;
  if (g.battery < 0) {
    add(L('⚡ Power ran out! Life support struggled.', '⚡ বিদ্যুৎ শেষ! লাইফ সাপোর্ট সমস্যায় পড়ল।'), 'bad');
    g.battery = 0; health -= 10; morale -= 8; o2 -= 0.5;
  }
  g.battery = Math.min(g.cap, g.battery);

  // --- consumption
  g.o2 += o2 - 1; g.water += water - 1; g.food += food - 1;

  // --- radiation
  let dose = w.radiation * (1 - g.shield) * (g.shelter ? 0.3 : 1);
  dose += evaCount * w.radiation * 0.15;
  g.dose += dose;
  health -= dose * 2 + (dose > 1.5 ? dose * 4 : 0);
  if (w.event === 'sep') add(g.shelter ? L('☢️ Solar storm! The shelter protected the crew.', '☢️ সৌরঝড়! শেল্টার ক্রুকে রক্ষা করল।') : L('☢️ Solar storm hit and the crew was not in the shelter!', '☢️ সৌরঝড় আঘাত হানল, ক্রু শেল্টারে ছিল না!'), g.shelter ? 'good' : 'bad');
  if (w.event === 'flare') add(L('🌞 A solar flare raised radiation a little.', '🌞 একটি সৌর শিখায় বিকিরণ একটু বাড়ল।'));
  if (w.event === 'dust_storm') add(L('🌪️ Dust storm! Less sunlight reached the panels.', '🌪️ ধুলিঝড়! প্যানেলে কম আলো পৌঁছাল।'), 'bad');

  // --- dust & failures
  g.dust = Math.min(0.85, g.dust + (w.tau > 1.5 ? 0.12 : 0.04));
  if (g.sol > 2 && r() < 0.13) {
    const opts = ['oxygen', 'water', 'greenhouse', 'solar'].filter(x => !g.broken[x]);
    if (opts.length) { const sys = opts[Math.floor(r() * opts.length)]; g.broken[sys] = true; add(L(`⚠️ ${tr(SYS_NAME[sys])} broke down!`, `⚠️ ${SYS_NAME[sys].bn} নষ্ট হয়ে গেছে!`), 'bad'); }
  }

  // --- needs
  ['o2', 'water', 'food'].forEach(k => { if (g[k] < 2 && g[k] > 0) morale -= 3; });
  g.science += Math.round(science);
  g.health = Math.max(0, Math.min(100, g.health + health));
  g.morale = Math.max(0, Math.min(100, g.morale + morale));

  g.history.push({ sol: g.sol, battery: Math.round(g.battery), o2: g.o2, water: g.water, food: g.food, health: g.health, dose });
  const fail = g.o2 <= 0 ? 'o2' : g.water <= 0 ? 'water' : g.food <= 0 ? 'food' : g.health <= 0 ? 'health' : g.morale <= 0 ? 'morale' : null;
  if (fail) { g.over = true; g.reason = fail; }
  else if (g.sol >= 30) { g.over = true; g.won = true; }
  else g.sol++;
  g.shelter = false;
  g.log = [...log.reverse(), ...g.log].slice(0, 40);
  return g;
}

export const FAIL_TEXT = {
  o2: L('The outpost ran out of oxygen. Tip: keep someone making oxygen, and repair the oxygen maker quickly.', 'আউটপোস্টে অক্সিজেন শেষ হয়ে গেছে। টিপ: সবসময় কাউকে অক্সিজেন বানাতে দাও, আর মেশিন নষ্ট হলে দ্রুত মেরামত করো।'),
  water: L('The outpost ran out of water. Tip: recycle water often. On the ISS, most water is recycled!', 'আউটপোস্টে পানি শেষ হয়ে গেছে। টিপ: নিয়মিত পানি রিসাইকেল করো। ISS-এও বেশিরভাগ পানি রিসাইকেল হয়!'),
  food: L('The crew ran out of food. Tip: the greenhouse grows less in dust storms, so plan ahead.', 'ক্রুর খাবার শেষ। টিপ: ধুলিঝড়ে গ্রিনহাউস কম ফলায়, তাই আগে থেকে পরিকল্পনা করো।'),
  health: L('The crew became too sick. Tip: rest, and use the shelter during solar storms.', 'ক্রু খুব অসুস্থ হয়ে পড়েছে। টিপ: বিশ্রাম দাও, আর সৌরঝড়ে শেল্টার ব্যবহার করো।'),
  morale: L('The crew lost hope. Tip: team time and rest keep spirits high.', 'ক্রু আশা হারিয়ে ফেলেছে। টিপ: টিম টাইম আর বিশ্রাম মনোবল ভালো রাখে।'),
};

export function title(g) {
  const sc = g.science + Math.round(g.health) + Math.round(g.morale);
  if (sc > 420) return L('Mars Commander', 'মঙ্গল কমান্ডার');
  if (sc > 300) return L('Mission Specialist', 'মিশন বিশেষজ্ঞ');
  return L('Junior Astronaut', 'জুনিয়র নভোচারী');
}

// Rule-based Mission Advisor (works without AI / internet)
export function advisorTips(g) {
  const tips = [];
  const next = g.sol < 30 ? weatherOf(g, g.sol + 1) : null;
  const w = weatherOf(g);
  const { prod, use } = preview(g);
  if (w.event === 'sep') tips.push(L('☢️ Solar storm TODAY! Turn on Shelter mode now.', '☢️ আজ সৌরঝড়! এখনই শেল্টার মোড চালু করো।'));
  if (next?.event === 'sep') tips.push(L('NASA space-weather watch: a solar storm is coming tomorrow. Plan to use the shelter.', 'নাসার মহাকাশ-আবহাওয়া সতর্কতা: কাল সৌরঝড় আসছে। শেল্টার ব্যবহারের পরিকল্পনা করো।'));
  if (next?.event === 'dust_storm' && w.event !== 'dust_storm') tips.push(L('A dust storm is coming tomorrow. Clean the panels and save battery today!', 'কাল ধুলিঝড় আসছে। আজই প্যানেল পরিষ্কার করো আর ব্যাটারি বাঁচাও!'));
  if (g.battery + prod - use < 0) tips.push(L('⚡ This plan uses more power than you have. Give someone Rest or Team time instead of a machine job.', '⚡ এই পরিকল্পনায় যত বিদ্যুৎ লাগবে তত নেই। কাউকে মেশিনের কাজের বদলে বিশ্রাম বা টিম টাইম দাও।'));
  Object.keys(g.broken).forEach(k => tips.push(L(`🔧 ${tr(SYS_NAME[k])} is broken. Send Rafi (Engineer) to repair it.`, `🔧 ${SYS_NAME[k].bn} নষ্ট। রাফিকে (ইঞ্জিনিয়ার) মেরামতে পাঠাও।`)));
  [['o2', L('oxygen', 'অক্সিজেন')], ['water', L('water', 'পানি')], ['food', L('food', 'খাবার')]].forEach(([k, n]) => {
    if (g[k] < 3) tips.push(L(`Only ${g[k].toFixed(1)} sols of ${n.en} left! Make more today.`, `মাত্র ${num(g[k].toFixed(1))} সলের ${n.bn} বাকি! আজই আরও বানাও।`));
  });
  if (g.dust > 0.4) tips.push(L('The panels are dusty, so they make less power. Time to clean!', 'প্যানেলে ধুলো জমেছে, তাই কম বিদ্যুৎ হচ্ছে। পরিষ্কারের সময়!'));
  if (g.health < 45) tips.push(L('Crew health is low. Let someone rest; Tanvir (Medic) heals best.', 'ক্রুর স্বাস্থ্য কম। কাউকে বিশ্রাম দাও; তানভীর (চিকিৎসক) সবচেয়ে ভালো সারিয়ে তোলে।'));
  if (g.morale < 45) tips.push(L('The crew feels sad. Team time with Nadia (Commander) helps a lot.', 'ক্রুর মন খারাপ। নাদিয়ার (কমান্ডার) সাথে টিম টাইম অনেক সাহায্য করে।'));
  if (!tips.length) tips.push(L('Everything looks stable. A science walk with Mim earns lots of points!', 'সবকিছু স্থির আছে। মিমের সাথে বিজ্ঞান অভিযানে অনেক পয়েন্ট পাবে!'));
  return tips;
}

export function stateSummary(g) {
  const w = weatherOf(g);
  return `Mars sim, ${SITES[g.site].name.en}, sol ${g.sol}/30. Weather: max ${w.tMax}C, min ${w.tMin}C, pressure ${w.pressure} Pa, dust opacity ${w.tau}, radiation ${w.radiation} mSv/sol, event ${w.event || 'none'}. ` +
    `Battery ${Math.round(g.battery)}/${g.cap} kWh, oxygen ${g.o2.toFixed(1)} sols, water ${g.water.toFixed(1)} sols, food ${g.food.toFixed(1)} sols, health ${Math.round(g.health)}%, morale ${Math.round(g.morale)}%, panel dust ${Math.round(g.dust * 100)}%, spare parts ${g.parts}, broken: ${Object.keys(g.broken).join(', ') || 'none'}. ` +
    `Plan: ${CREW.map(c => `${c.role.en} -> ${g.assign[c.id]}`).join('; ')}. Shelter ${g.shelter ? 'on' : 'off'}.`;
}
