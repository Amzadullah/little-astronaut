// Progress storage: localStorage always, plus Firebase (Google login + Firestore) when configured,
// so the same progress shows on phone and computer.
import { firebaseConfig } from './firebase-config.js';

const KEY = 'la_progress_v1';
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const blank = () => ({ name: '', completed: {}, design: null, best: null, updated: 0 });

let progress = load();
let fb = null; // { auth, db, mod }
let user = null;
let listeners = [];

function load() { try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return blank(); } }
function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) {} }
const emit = () => listeners.forEach(f => f({ progress, user, cloud: !!fb }));

export const cloudEnabled = () => !!firebaseConfig.apiKey;
export const getProgress = () => progress;
export const getUser = () => user;
export function onStoreChange(fn) { listeners.push(fn); }

function merge(a, b) {
  const out = { ...blank(), ...a, ...b };
  out.completed = { ...(a.completed || {}) };
  for (const [k, v] of Object.entries(b.completed || {})) out.completed[k] = Math.max(out.completed[k] || 0, v);
  out.name = b.name || a.name;
  out.design = (b.updated || 0) > (a.updated || 0) ? (b.design || a.design) : (a.design || b.design);
  const sa = a.best?.score || 0, sb = b.best?.score || 0;
  out.best = sb > sa ? b.best : a.best;
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  return out;
}

export async function initStore() {
  if (!cloudEnabled()) { emit(); return; }
  try {
    const [appM, authM, dbM] = await Promise.all([
      import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js'),
    ]);
    const app = appM.initializeApp(firebaseConfig);
    const auth = authM.getAuth(app);
    const db = dbM.getFirestore(app);
    fb = { auth, db, authM, dbM };
    authM.getRedirectResult(auth).catch(() => {});
    authM.onAuthStateChanged(auth, async u => {
      user = u;
      if (u) {
        try {
          const snap = await dbM.getDoc(dbM.doc(db, 'users', u.uid));
          if (snap.exists()) progress = merge(progress, snap.data().progress || {});
          if (!progress.name && u.displayName) progress.name = u.displayName.split(' ')[0];
          saveLocal(); await pushCloud();
        } catch (e) { console.warn('cloud load failed', e); }
      }
      emit();
    });
  } catch (e) { console.warn('Firebase init failed', e); fb = null; emit(); }
}

async function pushCloud() {
  if (!fb || !user) return;
  try {
    await fb.dbM.setDoc(fb.dbM.doc(fb.db, 'users', user.uid), { progress, name: progress.name || '', updatedAt: fb.dbM.serverTimestamp() }, { merge: true });
  } catch (e) { console.warn('cloud save failed', e); }
}

let timer;
export function save(patch) {
  progress = { ...progress, ...patch, updated: Date.now() };
  saveLocal(); emit();
  clearTimeout(timer); timer = setTimeout(pushCloud, 600);
}
export function completeLevel(id, stars) {
  const completed = { ...progress.completed, [id]: Math.max(progress.completed[id] || 0, stars) };
  save({ completed });
}

export async function signIn() {
  if (!fb) return;
  const provider = new fb.authM.GoogleAuthProvider();
  try { await fb.authM.signInWithPopup(fb.auth, provider); }
  catch (e) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) await fb.authM.signInWithRedirect(fb.auth, provider);
    else throw e;
  }
}
export async function signOut() { if (fb) await fb.authM.signOut(fb.auth); }
export function resetProgress() { progress = blank(); saveLocal(); pushCloud(); emit(); }
