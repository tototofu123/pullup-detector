# PULL·UP COUNTER — Wiki Home

Welcome to the wiki for **PULL·UP COUNTER — AI Trainer**, a browser-based pull-up rep counter powered by TensorFlow.js and MoveNet pose detection.

---

## What Is It?

PULL·UP COUNTER uses your device's webcam to automatically count pull-up repetitions in real time — no app to install, no server required, no wearables needed. Everything runs entirely inside your browser using WebGL-accelerated machine learning.

---

## Key Features

| Feature | Description |
|---|---|
| **Automatic rep counting** | MoveNet tracks your nose and wrist positions; a rep is counted each time your chin clears the bar |
| **Live skeleton overlay** | Body keypoints and bones are drawn over the camera feed so you can confirm tracking is working |
| **Rep goal & progress bar** | Set a target rep count (1–100); a progress bar fills as you complete reps |
| **Session log** | Every rep is time-stamped and shown in a scrollable sidebar panel |
| **Manual mode** | Disable AI counting and tap **+1 REP** yourself |
| **Audio feedback** | Web Audio API beep on each rep; celebratory tone on goal completion — no audio files needed |
| **Session persistence** | Rep count is saved to `localStorage` and survives page refreshes |
| **First-run tutorial** | Step-by-step modal on the first visit, permanently dismissed via `sessionStorage` |
| **Camera permission handling** | Detects `granted`, `prompt`, and `denied` states and guides you through unblocking |
| **Dark bento-grid UI** | Fully responsive layout with an electric-blue / orange accent palette |

---

## Wiki Pages

| Page | Description |
|---|---|
| [Getting Started](Getting-Started.md) | Requirements, running locally, and deploying to a static host |
| [How It Works](How-It-Works.md) | Detection algorithm, state machine, and MoveNet keypoints |
| [Controls and Settings](Controls-and-Settings.md) | Full reference for every button, input, and debug field |
| [Architecture](Architecture.md) | File structure, tech stack, and code organisation |
| [Troubleshooting](Troubleshooting.md) | Solutions to the most common problems |

---

## Quick Start (TL;DR)

1. Open the site in Chrome, Firefox, Edge, or Safari 15+ (HTTPS or `localhost` required).
2. Click **ACTIVATE CAMERA** and grant permission.
3. Position the camera **5–8 feet away** so your full upper body and the bar are visible.
4. Wait for the badge to show **READY: BELOW BAR**.
5. Do pull-ups — the counter increments automatically.

---

## Tech Stack

- **TensorFlow.js 4.15.0** — ML runtime (WebGL / WASM backend)
- **@tensorflow-models/pose-detection 2.1.3** — MoveNet SINGLEPOSE_LIGHTNING
- **Vanilla HTML / CSS / JavaScript** — no build tools, no frameworks
