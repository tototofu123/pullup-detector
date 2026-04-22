# Controls and Settings

A complete reference for every interactive element in the PULL·UP COUNTER UI.

---

## Header Bar

| Element | Action |
|---|---|
| **CAM** status dot | Green/blinking = camera live; grey = camera off |
| **MODEL** status dot | Green = MoveNet loaded; grey = loading or failed |
| **RESET SITE DATA** | Clears `localStorage` and `sessionStorage`, then reloads the page (same as **CLEAR STORAGE** below) |

---

## Camera / Start Screen

This overlay is shown in the camera panel before the camera is activated.

| Element | Description |
|---|---|
| **ACTIVATE CAMERA** | Requests camera permission and starts the video stream |
| **ALLOW & START CAMERA** | Appears when permission state is `prompt` — same action as above |
| **FIX PERMISSIONS** | Appears when permission is `denied`; shows step-by-step instructions for unblocking the camera in your browser |
| **HOW TO UNBLOCK CAMERA?** | Secondary button shown alongside **FIX PERMISSIONS** |

---

## Settings Card

### REP GOAL

An integer input (`1`–`100`, default `10`). Change the value to update the goal displayed below the counter and the progress bar calculation. The new goal takes effect immediately.

### MODE SELECT

| Button | Behaviour |
|---|---|
| **AUTO-REP** *(default)* | AI detection is active; reps are counted automatically when the state machine fires |
| **MANUAL** | AI detection is paused; use the **+1 REP** button to record reps manually |

Switching modes does **not** reset the rep count.

### +1 REP *(Manual mode only)*

Increments the rep count by one, plays the rep beep, logs the entry (tagged `MANUAL`), and checks the goal.

---

## Debug Panel *(AUTO mode only)*

The debug grid is visible only when **AUTO-REP** mode is selected.

| Field | Description |
|---|---|
| **DETECTOR** | Internal tracking state — `ROBUST TRACKING` when a pose is detected, `SEARCHING` when no pose is found |
| **WRIST Y** | Pixel Y coordinate of the highest detected wrist (or computed shoulder fallback), used as the bar reference |
| **CHIN Y** | Pixel Y coordinate of the nose keypoint, used as the chin proxy |
| **PHASE** | Position classification: `TOP` (chin at/above bar), `MID` (between thresholds), or `BOTTOM` (hanging) |
| **CONFIDENCE SCORE** | MoveNet confidence score for the nose keypoint, as a percentage. Values below ~30 % may lead to unreliable detection |

---

## Counter Card

| Element | Description |
|---|---|
| Large number display | Current rep count for the session; animates with a brief scale-up on each new rep |
| **Progress bar** | Fills from 0 to 100 % as reps approach the goal; overflows are clamped at 100 % |
| **GOAL: N** label | Shows the current rep goal value |

---

## Session Log Card

A scrollable list of every rep recorded in the current session (most recent first).

Each log entry contains:

| Column | Description |
|---|---|
| **#N** (blue) | Rep number |
| **AUTO** or **MANUAL** | How the rep was recorded |
| **HH:MM:SS** | Timestamp (24-hour local time) |

The log is cleared when **RESET SESSION** is pressed and is **not** persisted across page reloads.

---

## Action Buttons

| Button | Behaviour |
|---|---|
| **RESET SESSION** | Zeroes the rep counter, saves `0` to `localStorage`, clears the session log, and resets the state machine to `NONE` |
| **CLEAR STORAGE** | Prompts for confirmation, then clears all `localStorage` and `sessionStorage` and reloads the page (also resets the tutorial) |

---

## State Badge (Camera Overlay)

The badge in the centre of the camera panel reflects the current detection state:

| Text | Style | Meaning |
|---|---|---|
| SEARCHING SUBJECT... | Grey / inactive | No pose detected |
| NO SUBJECT | Grey / inactive | Detection loop running but no person in frame |
| READY: BELOW BAR | Blue / active | Subject is hanging below the bar — ready to start a rep |
| REACHED TOP ✓ | Orange / highlighted | Rep just counted; subject chinned the bar |
| SESSION RESET | Grey / inactive | Displayed briefly after **RESET SESSION** |
| CAMERA ACCESS BLOCKED | Red | Camera permission denied |
