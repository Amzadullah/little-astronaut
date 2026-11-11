// "Astro" AI helper: chat + voice (speech-to-text and text-to-speech), answers for kids.
import { s, getLang } from './i18n.js';

let history = [];
let contextFn = () => '';
let speakOn = true;
try { speakOn = localStorage.getItem('la_voice') !== '0'; } catch (e) {}
let recog = null, listening = false;

const $ = sel => document.querySelector(sel);

export function setAdvisorContext(fn) { contextFn = fn; }

export async function askAstro(question, extra = '') {
  const res = await fetch('/api/ask', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, lang: getLang(), context: [contextFn(), extra].filter(Boolean).join('\n'), history: history.slice(-6) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.answer) throw new Error(data.error || 'AI error');
  return data.answer;
}

function bubble(text, who) {
  const el = document.createElement('div');
  el.className = 'msg ' + who;
  el.textContent = text;
  if (who === 'bot') {
    const b = document.createElement('button'); b.className = 'say'; b.textContent = '🔊'; b.title = 'Listen';
    b.onclick = () => speak(text, true); el.appendChild(b);
  }
  $('#chatLog').appendChild(el);
  $('#chatLog').scrollTop = 1e9;
  return el;
}

export function speak(text, force = false) {
  if ((!speakOn && !force) || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}*#_`]/gu, '');
    const u = new SpeechSynthesisUtterance(clean);
    const want = getLang() === 'bn' ? 'bn' : 'en';
    const voices = speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.toLowerCase().startsWith(want + '-bd')) || voices.find(v => v.lang.toLowerCase().startsWith(want)) || null;
    if (v) u.voice = v;
    u.lang = want === 'bn' ? 'bn-BD' : 'en-US';
    u.rate = want === 'bn' ? 0.95 : 1; u.pitch = 1.1;
    speechSynthesis.speak(u);
  } catch (e) {}
}

async function send(text) {
  text = (text || '').trim();
  if (!text) return;
  $('#chatInput').value = '';
  bubble(text, 'me');
  const wait = bubble(s('thinking'), 'bot wait');
  try {
    const answer = await askAstro(text);
    wait.remove();
    bubble(answer, 'bot');
    history.push({ role: 'user', text }, { role: 'model', text: answer });
    speak(answer);
  } catch (e) {
    wait.remove(); bubble(s('aiError') + (e.message && e.message !== 'AI error' ? ` (${e.message})` : ''), 'bot err');
  }
}

function toggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { bubble(s('noMic'), 'bot err'); return; }
  if (listening) { recog?.stop(); return; }
  recog = new SR();
  recog.lang = getLang() === 'bn' ? 'bn-BD' : 'en-US';
  recog.interimResults = true; recog.maxAlternatives = 1;
  const mic = $('#micBtn');
  recog.onstart = () => { listening = true; mic.classList.add('on'); $('#chatInput').placeholder = s('listening'); };
  recog.onresult = e => {
    const r = e.results[e.results.length - 1];
    $('#chatInput').value = Array.from(e.results).map(x => x[0].transcript).join(' ');
    if (r.isFinal) { recog.stop(); send($('#chatInput').value); }
  };
  recog.onerror = e => { if (e.error === 'not-allowed') bubble(s('noMic'), 'bot err'); };
  recog.onend = () => { listening = false; mic.classList.remove('on'); $('#chatInput').placeholder = s('typeQ'); };
  try { speechSynthesis?.cancel(); recog.start(); } catch (e) {}
}

export function openChat(prefill) {
  $('#chat').classList.add('open');
  if (!$('#chatLog').children.length) bubble(s('aiHello'), 'bot');
  if (prefill) send(prefill); else setTimeout(() => $('#chatInput').focus(), 100);
}

export function refreshChatLang() {
  $('#chatTitle').textContent = s('aiName');
  $('#chatInput').placeholder = s('typeQ');
  $('#sendBtn').textContent = s('send');
  $('#voiceToggle').textContent = speakOn ? '🔊' : '🔇';
  $('#voiceToggle').title = speakOn ? s('speakOn') : s('speakOff');
  $('#astroFab span').textContent = s('askAI');
}

export function initAdvisor() {
  $('#astroFab').onclick = () => openChat();
  $('#chatClose').onclick = () => { $('#chat').classList.remove('open'); try { speechSynthesis.cancel(); } catch (e) {} };
  $('#chatForm').onsubmit = e => { e.preventDefault(); send($('#chatInput').value); };
  $('#micBtn').onclick = toggleMic;
  $('#voiceToggle').onclick = () => {
    speakOn = !speakOn; try { localStorage.setItem('la_voice', speakOn ? '1' : '0'); } catch (e) {}
    if (!speakOn) try { speechSynthesis.cancel(); } catch (e) {}
    refreshChatLang();
  };
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
  refreshChatLang();
}
