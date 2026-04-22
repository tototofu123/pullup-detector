# How It Works

A technical explanation of the pose detection pipeline and rep-counting logic.

---

## Overview

Every animation frame, the app:

1. Draws the current video frame onto a `<canvas>` element.
2. Feeds the canvas to MoveNet, which returns 17 body keypoints with `(x, y, score)` values.
3. Draws the skeleton overlay.
4. Runs the pull-up analysis function (`analyze`) to update the state machine and (if appropriate) count a rep.

---

## MoveNet and TensorFlow.js

The app uses **MoveNet SINGLEPOSE_LIGHTNING** — the fastest single-person pose model from Google. It is loaded from the jsDelivr CDN via the `@tensorflow-models/pose-detection` package.

```
TensorFlow.js  →  WebGL / WASM backend
                    ↓
             MoveNet SINGLEPOSE_LIGHTNING
                    ↓
             17 keypoints × {x, y, score}
```

TensorFlow.js automatically picks the best available backend (WebGL for GPU acceleration, falling back to WASM or CPU). The initialisation sequence is:

```javascript
await tf.ready();                         // backend ready
detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
);
```

---

## Keypoints Used

MoveNet returns 17 keypoints (indices 0–16). The pull-up logic uses four of them:

| Index | Name | Role |
|---|---|---|
| 0 | `nose` | Proxy for chin height |
| 5 | `left_shoulder` | Fallback bar reference if wrists leave frame |
| 6 | `right_shoulder` | Fallback bar reference if wrists leave frame |
| 9 | `left_wrist` | Primary bar reference |
| 10 | `right_wrist` | Primary bar reference |

The skeleton overlay additionally draws bones between indices `[5,6], [5,7], [7,9], [6,8], [8,10], [5,11], [6,12], [11,12]` (upper body).

---

## Bar Reference Calculation

The app does not require a fixed camera position or a calibration step. Instead it infers a **dynamic bar reference Y** on every frame:

```
if one or both wrists are visible (score > 0.10):
    barRefY = min(left_wrist.y, right_wrist.y) / canvas.height

else (wrists are above frame, hands on bar out of view):
    barRefY = min(left_shoulder.y, right_shoulder.y) / canvas.height − 0.10
```

All Y values are normalised to `[0, 1]` where `0` is the top of the frame and `1` is the bottom. This means a *lower* normalised value means *higher* in the real world.

---

## Position Classification

Two boolean flags are derived from the normalised nose and bar reference positions:

| Flag | Condition | Meaning |
|---|---|---|
| `isAbove` | `nose_y < barRefY + 0.06` | Chin is at or above bar level |
| `isBelow` | `nose_y > barRefY + 0.15` | Head is significantly below bar level |

The `0.06` and `0.15` thresholds are expressed as fractions of frame height, providing ~30 px of hysteresis on a 480 px tall frame.

---

## State Machine

The rep counter uses a three-state finite state machine:

```
NONE ──(isBelow)──▶ HANGING ──(isAbove)──▶ TOP
  ▲                                          │
  └──────────────(isBelow)───────────────────┘
```

| State | Description |
|---|---|
| `NONE` | Initial state; no subject in frame or session just reset |
| `HANGING` | Subject detected hanging below the bar — ready to start a rep |
| `TOP` | Subject has chinned the bar — rep just counted |

A **rep is counted** on the `HANGING → TOP` transition. A 500 ms debounce (`lastRepTime` timestamp check) prevents the same rep being double-counted if the subject oscillates around the threshold.

```javascript
if (currentState === PS.HANGING && isAbove) {
    const now = Date.now();
    if (now - lastRepTime > 500) {
        completeRep();
        lastRepTime = now;
        currentState = PS.TOP;
    }
}
```

---

## Confidence Filtering

All keypoints are filtered by a minimum confidence score of **0.10** (`MIN_CONF`). If neither the nose nor any hand/shoulder is above this threshold, `handleNoPose()` is called, the state resets to `NONE`, and the debug panel shows `—` values.

The skeleton overlay uses a higher threshold of **0.30** for drawing bones, so only well-detected joints appear in the overlay.

---

## Audio Feedback

Audio is synthesised on the fly using the **Web Audio API** — no audio files are needed.

| Event | Waveform | Description |
|---|---|---|
| Rep counted | 880 Hz → 440 Hz, 100 ms | Short descending tone |
| Top position (internal) | 660 Hz, 50 ms | Very brief click/tick |
| Goal reached | 523 → 1046 Hz, 500 ms | Rising celebratory sweep |

The `AudioContext` is created once at module load and resumed on first user interaction (required by browser autoplay policies).

---

## Session Persistence

- **`localStorage.pullup_count`** — stores the current rep count; restored on every page load.
- **`sessionStorage.pullup_tutorial_dismissed`** — set when the user dismisses the tutorial; prevents the modal from reappearing in the same browser session.
