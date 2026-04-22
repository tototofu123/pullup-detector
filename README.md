# PULL·UP COUNTER — AI Trainer

> 📖 **Full documentation is available in the [project wiki](docs/wiki/Home.md).**

An AI-powered pull-up counter that runs entirely in the browser. It uses your webcam and TensorFlow.js MoveNet pose detection to automatically count reps in real time — no app install, no server, no wearables required.

---

## Features

- **Automatic rep counting** — MoveNet tracks your nose and wrist positions to detect each pull-up and counts the rep the moment your chin clears the bar.
- **Live skeleton overlay** — Keypoints and bones are drawn on a canvas over the camera feed so you can confirm the AI is tracking you correctly.
- **Rep goal & progress bar** — Set a target rep count (default 10). A progress bar fills as you complete reps and a sound plays when you hit your goal.
- **Session log** — Every rep is time-stamped and logged in a scrollable sidebar panel.
- **Manual mode** — Switch from AUTO-REP to MANUAL and tap **+1 REP** to count reps yourself.
- **Audio feedback** — A short beep sounds on each rep; a longer tone plays when the goal is reached (uses the Web Audio API, no audio files needed).
- **Session persistence** — Your current rep count is saved to `localStorage` so it survives a page refresh.
- **First-run tutorial** — A modal walkthrough appears on first visit and is dismissed permanently via `sessionStorage`.
- **Camera permission handling** — The UI detects `granted`, `prompt`, and `denied` permission states and provides step-by-step guidance for unblocking the camera.
- **Dark bento-grid UI** — Fully responsive layout (desktop two-column, mobile single-column) with an electric-blue / orange accent palette.

---

## How It Works

The detection pipeline runs on every animation frame:

1. **TensorFlow.js** (`tf.ready()`) initialises the WebGL/WASM backend.
2. **MoveNet SINGLEPOSE_LIGHTNING** estimates 17 body keypoints from the live video element.
3. **`analyze(pose)`** reads the nose (keypoint 0), left/right wrists (9, 10) and shoulders (5, 6):
   - A *bar reference Y* is computed from the highest visible wrist (or shoulders + offset if wrists are out of frame).
   - **HANGING** — nose Y is more than 15 % of frame height below the bar reference → the user is hanging.
   - **TOP** — nose Y is within 6 % of the bar reference → the user has chinned the bar.
4. A rep is counted on the **HANGING → TOP** transition with a 500 ms debounce to prevent double-counts.

### State machine

```
NONE ──(head below bar)──▶ HANGING ──(head above bar)──▶ TOP
 ▲                                                         │
 └─────────────────(head below bar again)──────────────────┘
```

---

## Getting Started

### Requirements

- A modern browser (Chrome, Firefox, Edge, Safari 15+)
- A webcam
- **HTTPS or `localhost`** — browsers block camera access on plain `file://` URLs

### Run locally

The easiest way is the VS Code **Live Server** extension:

1. Open the project folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.
3. The page opens at `http://127.0.0.1:5500` and camera access works.

Alternatively, use any static file server:

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

### Deploy

Drag-and-drop the three files (`index.html`, `app.js`, `styles.css`) into [Netlify Drop](https://app.netlify.com/drop) or any static host (Vercel, GitHub Pages). The site needs no build step.

---

## Usage

1. Open the site. The loading screen shows TensorFlow.js initialising.
2. A **Getting Started** tutorial modal appears on the first visit — read the four steps and click **GOT IT, LET'S GO**.
3. Click **ACTIVATE CAMERA** and allow browser camera permissions.
4. Position the camera **5–8 feet away** so your full upper body (including the pull-up bar) is visible.
5. Wait for the status badge to say **READY: BELOW BAR**.
6. Do pull-ups — the counter increments automatically each time your chin clears the bar.

### Controls

| Control | Description |
|---|---|
| **REP GOAL** input | Set your target rep count (1–100) |
| **AUTO-REP** mode | AI counts reps automatically (default) |
| **MANUAL** mode | Disables AI counting; use **+1 REP** button instead |
| **RESET SESSION** | Zeroes the rep counter and clears the session log |
| **CLEAR STORAGE** | Wipes `localStorage` / `sessionStorage` and reloads |
| **RESET SITE DATA** (header) | Same as Clear Storage |

### Debug panel (AUTO mode only)

| Field | Description |
|---|---|
| DETECTOR | Current tracking state |
| WRIST Y | Pixel Y of the highest detected wrist |
| CHIN Y | Pixel Y of the nose keypoint |
| PHASE | TOP / MID / BOTTOM classification |
| CONFIDENCE SCORE | MoveNet confidence for the nose keypoint |

---

## File Structure

```
pullup-detector/
├── index.html   # App shell, bento-grid layout, tutorial modal
├── app.js       # TensorFlow/MoveNet init, detection loop, rep logic
└── styles.css   # Dark theme, responsive grid, animations
```

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [TensorFlow.js](https://www.tensorflow.org/js) | 4.15.0 | ML runtime (WebGL/WASM) |
| [@tensorflow-models/pose-detection](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection) | 2.1.3 | MoveNet pose estimation |
| [Barlow / Barlow Condensed](https://fonts.google.com/specimen/Barlow) | — | UI typography (Google Fonts) |

Everything else is plain HTML, CSS, and vanilla JavaScript — no build tools, no frameworks.

---

## Browser Compatibility

| Browser | Status |
|---|---|
| Chrome / Edge 90+ | ✅ Full support |
| Firefox 90+ | ✅ Full support |
| Safari 15+ | ✅ Full support |
| `file://` protocol | ❌ Camera blocked by browser security |

---

## Troubleshooting

**Camera blocked / permission denied**
1. Click the lock icon in the browser address bar.
2. Set **Camera** to **Allow**.
3. Refresh the page.

**AI model fails to load**
- Check your internet connection (CDN scripts load from jsDelivr).
- Ensure your browser supports WebGL (`chrome://gpu` or `about:support`).

**Reps not counting / counting too early**
- Make sure the **full bar and your upper body** are in frame.
- Ensure lighting is adequate for pose detection.
- Check the debug panel — CONFIDENCE SCORE should be above ~30 % for reliable tracking.
