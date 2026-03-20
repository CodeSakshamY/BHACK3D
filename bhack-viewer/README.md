# BHACK 3D Viewer

Scroll-driven 3D model viewer with simultaneous animation playback and free orbit mode.

## Stack
- **Three.js r134** (CDN) — 3D rendering
- **Vanilla JS ES Modules** — zero build step
- **Vercel** — static hosting

## Project Structure
```
bhack-viewer/
├── index.html          # Entry point
├── style.css           # All styles
├── main.js             # App logic (ES module)
├── OrbitControls.js    # Inline orbit controls
├── vercel.json         # Vercel config (GLB MIME + cache headers)
├── .gitignore
└── public/
    └── BHACKfinal.glb  # 3D model
```

## Deploy to Vercel via GitHub

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bhack-viewer.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework Preset: **Other**
4. Root Directory: `.` (leave as default)
5. Click **Deploy** — done, no build step needed

## Run Locally
```bash
# Python
python -m http.server 8080

# Node
npx serve .
```
Then open `http://localhost:8080`

> ⚠️ Must use a local server — browsers block `fetch()` on `file://` URLs.

## Controls
| Mode | Input | Action |
|------|-------|--------|
| Scroll Anim | Mouse wheel / trackpad | Scrubs all animations simultaneously |
| Free Orbit | Left drag | Rotate |
| Free Orbit | Right drag | Pan |
| Free Orbit | Scroll | Zoom |
| Free Orbit | Pinch | Zoom (touch) |

## Swapping the Model
Replace `public/BHACKfinal.glb` with your own `.glb` file, then update the fetch path in `main.js`:
```js
const response = await fetch('./public/YOUR_MODEL.glb');
```
