# 🚀 Little Astronauts

**A junior astronaut mission trainer game for kids aged 7–14.**
Kids help a robot friend survive on Mars, with missions built from NASA data, and learn the engineering trade-offs that real missions face.

🏆 **NASA Space Apps Challenge 2026** · Challenge: **Build a Junior Astronaut Mission Trainer** · 👩‍🚀 **Team Astro Squad** (Bangladesh)

### ▶️ [Play now: little-astronaut.vercel.app](https://little-astronaut.vercel.app)
### 🎬 [Watch the 30-second demo](PASTE_YOUR_YOUTUBE_LINK_HERE)

---

## 🌍 The problem

Space lessons for kids are mostly facts, pictures and videos. Kids watch, but they never make the hard choices that real missions depend on: power or oxygen, go outside or stay safe, repair now or later. Space-themed STEM content often oversimplifies these engineering trade-offs.

## 💡 Our solution

Little Astronauts turns those choices into a game kids already know how to play: a **talking pet**, but one that lives on Mars.

| Feature | What kids do |
|---|---|
| 🦜 **Talk** | The robot repeats what the child says, in a funny robot voice |
| 👆 **Touch & care** | Tap him for giggles and spins, feed him space food, put him to sleep |
| 🔴 **Mars missions** | Missions come from NASA data and appear inside the game world, not as a numbered list |
| ⭐ **Level up** | Missions give XP; every level unlocks a gift: 7 emotes, 6 skins, 8 outfits |
| 🎤 **AI voice help** | Stuck? Ask out loud, and the helper explains in Bangla or English |
| 🎮 **Star Catcher** | A quick mini-game: catch stars, dodge asteroids |
| 📚 **Learn mode** | 21 levels of 3D space lessons with quizzes |
| 🧭 **Mission design + 30 sols** | Plan a Mars mission, then keep a 4-person outpost alive for 30 sols |

## 🛰️ NASA data → game conditions → player decisions

| NASA data | What happens in the game | What the child does |
|---|---|---|
| ☀️ **NASA DONKI** solar flares & particle storms (live, last 30 days) | Radiation alert | Runs to the shelter |
| 🌪️ Dust opacity τ (**Curiosity REMS, Perseverance MEDA** ranges) | Dusty solar panels, dust storms | Cleans the panels, closes the habitat |
| 🥶 Night temperature & pressure (**REMS, MEDA** ranges) | Freezing nights below −78 °C | Holds the heater, reads the weather station |
| ☢️ Surface radiation (**Curiosity RAD**) | Radiation dose in the 30-sol outpost | Limits time outside, uses shelter mode |
| 🔬 **InSight, Opportunity, Perseverance, Phoenix, Ingenuity** | A real NASA fact after every mission | Learns why it matters |
| 🌙 **NASA LRO** | Moon level facts | Learns about lunar light and ice |

> Solar events are **live** from NASA DONKI (refreshed hourly). Mars surface weather is not available live today, so temperature, pressure and dust follow **published rover ranges**. The in-game **NASA Data** page shows which data is in use.

## 🛠️ How it's built

```
Phone / computer browser  ──►  Vercel serverless functions  ──►  NASA DONKI API
(HTML, CSS, JavaScript,         /api/nasa  (solar events)        Google Gemini API
 Three.js, Web Speech API)      /api/ask   (AI helper)
          │
          └──►  Firebase (Google sign-in + Firestore progress sync)
```

- ⚡ **No build step:** plain HTML, CSS and JavaScript, so it loads fast on low-cost phones
- 📱 **Installable (PWA):** "Add to Home screen" works like an app
- 🔐 **API keys stay on the server:** the browser never sees them
- 🔄 **Data pipeline:** NASA data → Python (`scripts/build_data.py`) → `data/mars_sols.json` → game engine

### 📁 Project structure

```
index.html            app shell
css/style.css         all styles
js/robo.js            robot friend, Mars missions, levels and gifts, Star Catcher
js/levels.js          21 learning levels (English + Bangla)
js/scenes.js          Three.js 3D scenes (drawn in code, no image files)
js/sim.js             mission design + 30-sol outpost simulation
js/nasa.js            merges live NASA DONKI events into the Mars data
js/advisor.js         AI chat, voice input and speech output
js/store.js           progress (localStorage + Firebase)
api/nasa.js           serverless: NASA DONKI (FLR, SEP, CME)
api/ask.js            serverless: Google Gemini with child-safety instructions
data/mars_sols.json   30 sols of Mars conditions (Gale + Jezero)
scripts/build_data.py NASA data → JSON pipeline
```

## ▶️ Run it yourself

```bash
git clone <this repo>
cd <repo>
npx vercel dev
```

Environment variables (Vercel → Settings → Environment Variables):

| Name | What it is |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key for the AI helper |
| `NASA_API_KEY` | Free key from https://api.nasa.gov (falls back to `DEMO_KEY`) |

The Firebase web config goes in `js/firebase-config.js`. Without it, progress is saved on the device only.

## 🧒 Made safe for kids

- 🛡️ The AI helper gives short, simple answers, stays on space and science, and never asks for personal details
- 🚫 No ads. Google sign-in is optional and only saves game progress. Questions asked to the AI helper are sent to Google Gemini to get an answer
- 🌐 Works in **Bangla and English**

## 🤖 Use of AI

- Our team created the idea, the challenge plan, the game concept and our first presentation and prototype. We decided every feature.
- We used **Claude (Anthropic)** as an AI coding assistant to help build and improve the code, write game text and make our slides. We gave the directions, tested everything on phones and computers, and made all final decisions.
- **Google Gemini** is part of the game as the in-app helper.
- The demo video narration uses an **AI voice clone (Cartesia)** of a team member's voice, labeled "Voice: AI-generated".
- No AI-generated images or video are used.

## 📚 Credits & licenses

- NASA DONKI, NASA rover and mission data and facts: NASA (public)
- [Three.js](https://threejs.org) (MIT License)
- Google Gemini API, Firebase (Google), Vercel
- Baloo Da 2 font (Google Fonts, SIL Open Font License)
- Cartesia (demo video voice)

## 👩‍🚀 Team Astro Squad

Department of CIS, Daffodil International University, Bangladesh 🇧🇩

| Name | ID |
|---|---|
| Atul Paul | 252-16-052 |
| Md. Amzadullah Ratul | 252-16-048 |
| MD. Shams-Ibne-Mohsin | 252-16-025 |
| MD. Nuruzzaman Nirob | 252-16-021 |
| Mosrat Zahan Jabin | 252-16-040 |
| Shakila Akter | 252-16-034 |

## 📄 License

MIT © 2026 Team Astro Squad
