# 🚀 Little Astronauts — Junior Astronaut Mission Trainer
**NASA Space Apps Challenge 2026 · Astro Squad (DIU, CIS)**

Learn space in 3D → design a Mars mission → keep a 4-person crew alive for 30 sols, with NASA-based weather & radiation and an AI robot friend (R.O.B.O.) that answers by chat or voice in Bangla or English.

## Features
- **🤖 R.O.B.O. on Mars (home screen):** a Talking-Tom style robot friend who lives at Gale Crater
  - 🦜 **Talk:** whatever the child says, R.O.B.O. repeats it in a funny robot voice
  - Tap his head, belly, antenna or hands and he reacts. 🍕 Feed him (drag food), 💡 put him to sleep
  - **Mars missions come up inside the game**, not as a numbered list, and are driven by the sol's NASA-style data:
    tap the weather station (temperature and pressure), rub dusty solar panels (dust τ), close the habitat in a dust storm,
    run to the shelter during a solar flare (radiation), hold the heater on freezing nights (min temp), collect rock samples,
    dig for water ice, fly the Ingenuity-style helicopter, use the recycler, and rub the dust off R.O.B.O.
  - Every mission ends with a real NASA fact (InSight, Opportunity, Curiosity RAD, Perseverance, Phoenix, Ingenuity)
  - 🎤 **Help** on every mission: the child asks by voice and Gemini explains how to do it
  - Missions → XP → **levels** → a 🎁 **gift every level** (new emotes: dance, backflip, moonwalk… and new skins and outfits)
  - 💬 Ask anything by voice, 🎮 Star Catcher mini-game, 🚀 Learn (3D levels and the Mars mission)
- **21 levels (0–20)** in 4 stages: Explore, Discover, Understand, Lead. Every level has a 3D scene (Three.js), facts with read-aloud, and a quiz with stars
- **Mission Design (Level 19):** choose Gale or Jezero Crater, meet the crew (Commander, Engineer, Scientist, Medic), pack 20 cargo points
- **Mars Outpost (Level 20):** 30 sols of Read → Plan → Act: power, oxygen, water, food, health, morale, radiation, dust storms, solar storms, breakdowns
- **R.O.B.O. AI chat (Google Gemini):** chat + 🎤 voice question + 🔊 spoken answer, explained for kids. It knows which level or game state the child is on
- **Rule-based advisor:** gives tips even without internet or an AI key
- **Firebase:** Google sign-in, so the same progress shows on phone and computer
- **PWA:** can be installed on a phone like an app
- **Bangla / English** toggle

## Project structure
```
index.html, css/, js/          ← the app (no build step)
api/ask.js                     ← Vercel serverless function → Gemini (keeps the key secret)
data/mars_sols.json            ← game weather/radiation data
scripts/build_data.py          ← NASA data → JSON pipeline
js/firebase-config.js          ← paste the Firebase config here
firestore.rules                ← database security rules
manifest.json, sw.js, icons/   ← phone install (PWA)
```

## Setup (step by step)

### 1. Gemini API key
1. Go to https://aistudio.google.com/apikey and click **Create API key**
2. **Never put this key in any file or on GitHub.** Only put it in Vercel (step 4)

### 2. Firebase (login + database)
1. https://console.firebase.google.com → **Add project** (Google Analytics can stay off)
2. **Build → Authentication → Get started → Sign-in method → Google → Enable**
3. **Build → Firestore Database → Create database** (Production mode, location `asia-south1`)
4. On the Firestore **Rules** tab, paste the contents of `firestore.rules` and click **Publish**
5. **Project settings (⚙️) → Your apps → Web (</>)** → register the app → copy the `firebaseConfig` values into `js/firebase-config.js`
6. After deploying: **Authentication → Settings → Authorized domains** → add your `xxxx.vercel.app` domain

### 3. GitHub
1. Make a new repository on https://github.com/new (e.g. `little-astronauts`)
2. **Add file → Upload files** → drag in everything from this folder → **Commit**

### 4. Vercel
1. https://vercel.com → sign in with GitHub → **Add New → Project** → import the repo
2. Framework Preset: **Other**. Build command: empty
3. **Environment Variables** → `GEMINI_API_KEY` = your key (optional: `GEMINI_MODEL`)
4. **Deploy** → you get a link like `https://little-astronauts.vercel.app`
5. Open it on a phone in Chrome → menu → **Add to Home screen / Install app**

### 5. Real NASA data (optional, recommended for judging)
```bash
# real solar flares / SEP events from NASA DONKI (free key: https://api.nasa.gov)
NASA_API_KEY=your_key python3 scripts/build_data.py --donki 2024-05-01 2024-05-30
# real rover weather (CSV from NASA PDS: REMS for Gale, MEDA for Jezero)
python3 scripts/build_data.py --gale-csv rems.csv --jezero-csv meda.csv
```
Then upload the new `data/mars_sols.json` to GitHub, and Vercel redeploys automatically.
The default data follows the value ranges published from Curiosity REMS/RAD and Perseverance MEDA. The **NASA Data** page in the app says which data is being used.

## Notes
- Voice input works best in **Chrome / Edge** (Android and desktop). On iPhone, Safari support is limited
- Whether Bangla speech output works depends on the phone or computer having a Bangla voice installed. Android Chrome usually has one
- Without `GEMINI_API_KEY`, the app still works; only the AI chat shows an error
- Without a Firebase config, progress is saved on the device only
