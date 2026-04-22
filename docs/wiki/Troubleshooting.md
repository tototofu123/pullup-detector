# Troubleshooting

Solutions to the most common issues encountered when running PULL·UP COUNTER.

---

## Camera Issues

### Camera permission denied / blocked

**Symptoms:** Status badge shows *CAMERA ACCESS BLOCKED*; the **FIX PERMISSIONS** button appears.

**Fix:**
1. Click the **lock / camera icon** in the browser address bar (left side of the URL bar).
2. Find the **Camera** permission and change it from **Block** to **Allow**.
3. Refresh the page.

If the lock icon does not appear, look for a camera icon on the right side of the address bar.

---

### "Camera API not available" alert

**Cause:** The page is served over a plain `file://` URL, or the browser does not support `navigator.mediaDevices.getUserMedia`.

**Fix:**
- Serve the files via a local HTTP server (`python -m http.server 8080`) or the VS Code Live Server extension.
- See [Getting Started — Run Locally](Getting-Started.md#run-locally) for step-by-step instructions.

---

### Black or frozen camera feed

**Symptoms:** The canvas is visible but shows a static or black image.

**Fixes:**
- Check that no other browser tab or application is using the same camera simultaneously.
- Refresh the page and try again.
- On some laptops, toggling the camera hardware switch (if present) and refreshing can help.

---

### Camera works but skeleton is not drawn

**Symptom:** Video feed is live but no keypoints or bones appear.

**Cause:** MoveNet confidence scores for all visible joints are below the 0.30 drawing threshold.

**Fixes:**
- Improve lighting — avoid strong backlighting and ensure your face and upper body are well lit.
- Move closer to or farther from the camera so your upper body fills more of the frame.
- Check the **CONFIDENCE SCORE** field in the debug panel — values above ~30 % are needed for reliable tracking.

---

## AI Model Issues

### "Error: Could not load AI model" on the loading screen

**Causes:**
- No internet connection (CDN scripts could not load).
- Browser does not support WebGL.

**Fixes:**
- Confirm you have an active internet connection.
- In Chrome, navigate to `chrome://gpu` and check that **WebGL** is listed as *Hardware accelerated*. In Firefox, check `about:support`.
- Try a different browser (Chrome or Edge typically have the best WebGL support).
- Disable browser extensions that may block CDN scripts (uBlock Origin, privacy badger, etc.) or add an exception for `cdn.jsdelivr.net`.

---

## Rep Counting Issues

### Reps not counting at all

**Checks:**
1. Make sure **AUTO-REP** mode is selected (not **MANUAL**).
2. Verify the debug panel shows `ROBUST TRACKING` in the **DETECTOR** field — if it shows `SEARCHING`, the model cannot see you.
3. Check **CONFIDENCE SCORE** — below ~30 % the pose is too uncertain to fire reliably.
4. Confirm your full upper body and both hands are visible in the frame, especially at the top of the rep.

---

### Reps counting too early or too often

**Cause:** The bar reference Y is being computed incorrectly, or the subject is swaying across the threshold.

**Fixes:**
- Ensure the camera is stable (not moving with you).
- Move the camera further back so there is more vertical travel between the HANGING and TOP positions.
- Check the **WRIST Y** and **CHIN Y** values in the debug panel — CHIN Y should be clearly above WRIST Y at the top of the rep and clearly below at the bottom.

---

### Reps counting during the descent (double-counting)

**Cause:** The 500 ms debounce window is shorter than your descent time.

**Note:** This is a known edge case for very slow or deliberate reps. The debounce is hardcoded at 500 ms and cannot currently be changed via the UI.

---

### Rep counter does not reset to zero after RESET SESSION

**Cause:** This should not happen. If it does, click **CLEAR STORAGE** to wipe `localStorage` and reload.

---

## UI / Display Issues

### Tutorial modal keeps appearing

**Cause:** `sessionStorage` is being cleared between visits, or you are in a private/incognito window.

**Note:** In private browsing mode, `sessionStorage` is wiped when all private tabs are closed, so the tutorial reappears on the next session. This is by design — the tutorial is only permanently suppressed within a single browser session.

---

### Progress bar does not move

**Cause:** The rep goal may be set to a very high value, or the count display and goal value are out of sync.

**Fix:** Update the **REP GOAL** input to a lower value and confirm the **GOAL: N** label updates.

---

### Page layout is broken on mobile

**Cause:** The responsive breakpoint switches to a single-column layout at viewport widths below 900 px. If you are on a very narrow screen with browser chrome reducing the effective viewport, the layout may look cramped.

**Fix:** Use landscape orientation on mobile for the best experience.

---

## Storage and Privacy

### How do I erase all app data?

Click **CLEAR STORAGE** (bottom of the sidebar) or **RESET SITE DATA** (header). Both clear `localStorage` and `sessionStorage` and reload the page.

To also reset camera permissions, click the lock icon in your browser address bar and reset the camera permission for the site.

### What data does the app store?

| Key | Storage | Value |
|---|---|---|
| `pullup_count` | `localStorage` | Integer — current rep count |
| `pullup_tutorial_dismissed` | `sessionStorage` | `"true"` if tutorial has been closed |

No data is sent to any server. Everything stays in your browser.
