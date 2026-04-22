# Getting Started

This page covers everything you need to run PULL·UP COUNTER locally and deploy it to the web.

---

## Requirements

| Requirement | Notes |
|---|---|
| Modern browser | Chrome 90+, Firefox 90+, Edge 90+, or Safari 15+ |
| Webcam | Built-in or USB; facing camera on mobile |
| HTTPS or `localhost` | Browsers block camera access on plain `file://` URLs |
| Internet connection (first load) | TensorFlow.js and MoveNet are loaded from the jsDelivr CDN |

> **Note:** After the first load the browser may cache the model scripts. The app itself has no server-side component.

---

## Run Locally

### Option 1 — VS Code Live Server (recommended)

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code.
2. Open the project folder in VS Code.
3. Right-click `index.html` → **Open with Live Server**.
4. The page opens at `http://127.0.0.1:5500` and camera access works immediately.

### Option 2 — Python built-in server

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

### Option 3 — Node.js `serve`

```bash
npx serve .
# then open the printed localhost URL
```

> Any static file server on `localhost` will work. The only hard requirement is that the origin is either `localhost` or served over HTTPS.

---

## Deploy to the Web

The project is three files with no build step — drop them anywhere that serves static files.

### Netlify Drop (easiest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the project folder (containing `index.html`, `app.js`, `styles.css`) onto the page.
3. Netlify assigns a public HTTPS URL instantly.

### GitHub Pages

1. Push the three files to a GitHub repository.
2. Go to **Settings → Pages** and set the source to the branch and root folder.
3. GitHub Pages serves the site over HTTPS automatically.

### Vercel

```bash
npx vercel --prod
```

Vercel detects a static site with no framework and deploys it in seconds.

### Any static host

Upload `index.html`, `app.js`, and `styles.css` to the root of any static hosting service (S3 + CloudFront, Cloudflare Pages, Firebase Hosting, etc.).

---

## First Launch Walkthrough

1. The loading screen appears while TensorFlow.js initialises (progress bar 0 → 100 %).
2. A **Getting Started** tutorial modal pops up on the very first visit — read through the four steps and click **GOT IT, LET'S GO**.
3. Depending on your browser's camera permission state you will see one of three prompts:
   - **READY TO DETECT REPS** — permission not yet asked; click **ALLOW & START CAMERA**.
   - **PERMISSION GRANTED** — camera was previously allowed; click **ACTIVATE CAMERA**.
   - **CAMERA ACCESS BLOCKED** — camera was previously denied; click **FIX PERMISSIONS** and follow the on-screen instructions.
4. After camera access is granted, position yourself so your entire upper body and the pull-up bar are visible.
5. Once the state badge reads **READY: BELOW BAR**, hang from the bar and start pulling!

---

## Camera Positioning Tips

- **Distance:** 5–8 feet (1.5–2.5 m) from the camera so your head and both hands are always in frame.
- **Height:** Mount the camera at roughly mid-chest height for the best keypoint visibility.
- **Lighting:** Avoid strong backlighting (e.g. a bright window behind you). Frontal or overhead lighting works best.
- **Framing:** The pull-up bar itself does not need to be visible — only your wrists (or shoulders if wrists go out of frame) and nose matter to the detection algorithm.
