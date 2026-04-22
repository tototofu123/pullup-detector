# Architecture

An overview of the project's file structure, tech stack, and code organisation.

---

## File Structure

```
pullup-detector/
├── index.html      # App shell — HTML structure, bento-grid layout, tutorial modal
├── app.js          # All JavaScript — TF/MoveNet init, detection loop, rep logic, UI helpers
├── styles.css      # All CSS — dark theme, responsive grid, animations, component styles
└── docs/
    └── wiki/       # Project wiki pages
        ├── Home.md
        ├── Getting-Started.md
        ├── How-It-Works.md
        ├── Controls-and-Settings.md
        ├── Architecture.md   ← you are here
        └── Troubleshooting.md
```

There is **no build step, no package.json, no node_modules**. All external dependencies are loaded from CDN `<script>` tags in `index.html`.

---

## Tech Stack

| Library / Technology | Version | Purpose |
|---|---|---|
| [TensorFlow.js](https://www.tensorflow.org/js) | 4.15.0 | ML runtime — WebGL / WASM backend |
| [@tensorflow-models/pose-detection](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection) | 2.1.3 | MoveNet SINGLEPOSE_LIGHTNING model |
| [Barlow / Barlow Condensed](https://fonts.google.com/specimen/Barlow) | — | UI typography (loaded from Google Fonts) |
| Web Audio API | Browser built-in | Synthesised rep / goal audio — no audio files |
| Web Animations API | Browser built-in | CSS keyframe animations for the flash, pop, and slide-in effects |

Everything else is plain HTML5, CSS3, and vanilla ES2020 JavaScript.

---

## `index.html` — Structure

```
<head>
  styles.css
  TensorFlow.js CDN script
  pose-detection CDN script

<body>
  #loading          — Full-screen splash with progress bar
  #flash            — Full-viewport flash overlay (rep feedback)
  #tutorial         — First-run modal overlay

  <header>          — Logo, status dots, RESET SITE DATA
  <main.main>       — Bento grid (CSS Grid, two columns on desktop)
    <section.cam-container>
      <video>       — Hidden; srcObject set by getUserMedia
      <canvas>      — Pose skeleton drawn here; shown to user
      .cam-overlay  — State badge + cam-label (pointer-events: none)
      #splash       — Camera activation / permission UI

    <aside.dashboard>
      .counter-card — Rep count + progress bar
      .bento-card   — Settings (goal, mode toggle, debug grid)
      .log-card     — Session log list
      .bento-card   — Reset / Clear buttons

  <script src="app.js">
```

---

## `app.js` — Code Sections

The file is divided into clearly labelled sections:

| Section | Key items |
|---|---|
| **STATE & CONFIG** | Global variables: `count`, `repGoal`, `mode`, `detector`, `camLive`, `currentState`, `lastRepTime`; DOM element references |
| **INIT** | `init()` — entry point called on `window.onload`; loads session, checks file:// security, shows tutorial, initialises TF and MoveNet |
| **CAMERA** | `startCamera()` — `getUserMedia` call, video setup, kicks off `requestAnimationFrame` loop |
| **DETECTION LOOP** | `loop()` — called every frame; runs `detector.estimatePoses`, draws pose, calls `analyze` |
| **PULL-UP LOGIC** | `analyze(pose)` — bar reference calculation, `isAbove`/`isBelow` flags, state machine transitions, debounce |
| **RESET & CLEAR** | `resetAll()`, `clearAllData()` |
| **REPS & FEEDBACK** | `completeRep()`, `updateGoal()`, `checkGoal()`, `updateDisplay()`, `triggerFlash()`, `logEntry()`, `setBadge()`, `updateDebug()` |
| **HELPERS** | `dot()`, `txt()`, `saveSession()`, `loadSession()` |
| **AUDIO** | `playAudio(type)` — Web Audio API oscillator synthesis for `rep`, `top`, and `goal` events |
| **SKELETON** | `drawPose(pose)` — draws bones and keypoint circles on the canvas |
| **TUTORIAL** | `closeTutorial()` — hides modal and sets `sessionStorage` flag |

---

## `styles.css` — Structure

| Section (comment) | Contents |
|---|---|
| Reset & Tokens | CSS custom properties (colour palette, fonts), universal box-sizing reset |
| Header | Logo, status row, status dots and blink animation |
| Main Bento Layout | CSS Grid, responsive breakpoint at 900 px |
| Camera Panel | Video/canvas positioning, cam-overlay, state badge variants, splash screen |
| Dashboard | Bento card base styles, counter card, progress bar, settings card |
| Mode Toggle | Pill-style two-button toggle |
| Debug Info | 2-column debug grid |
| Log Card | Flex layout, log-item rows, slide-in animation |
| Buttons | `.btn-secondary`, `.btn-danger` with hover states |
| Loading Overlay | Full-screen loader with progress bar |
| Modal & Tutorial | `.modal-overlay` fade/slide transition, step layout |
| Flash Effect | Full-viewport flash animation on rep count |
| Scrollbar | Custom thin scrollbar for WebKit |

---

## Data Flow

```
window.onload
    └─ init()
         ├─ loadSession()          ← localStorage
         ├─ checkCameraPermission() ← Permissions API
         ├─ tf.ready()             ← TensorFlow.js CDN
         └─ createDetector()       ← MoveNet CDN model

User clicks ACTIVATE CAMERA
    └─ startCamera()
         └─ getUserMedia()
              └─ requestAnimationFrame(loop)
                   └─ loop() [every frame]
                        ├─ ctx.drawImage(video)
                        ├─ detector.estimatePoses(video)
                        ├─ drawPose(pose)
                        └─ analyze(pose)
                             └─ [HANGING → TOP transition]
                                  └─ completeRep()
                                       ├─ count++
                                       ├─ saveSession() → localStorage
                                       ├─ updateDisplay()
                                       ├─ playAudio('rep')
                                       ├─ triggerFlash()
                                       ├─ logEntry('AUTO')
                                       └─ checkGoal()
```
