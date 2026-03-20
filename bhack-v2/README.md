# BHACK 3D Viewer

Scroll-driven 3D viewer — all animations play simultaneously, scrubbed by scroll. Free orbit mode included.

## File structure
```
bhack-viewer/
├── index.html          ← entry point
├── style.css           ← styles
├── main.js             ← app logic
├── OrbitControls.js    ← orbit controls
├── BHACKfinal.glb      ← 3D model (at root — required for Vercel)
├── vercel.json         ← GLB MIME + CORS headers
└── .gitignore
```

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bhack-viewer.git
git push -u origin main
```

### 2. Import on Vercel
1. [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework Preset: **Other**
4. Leave all other settings as default
5. **Deploy**

## Run locally
```bash
npx serve .
# or
python -m http.server 8080
```
Open `http://localhost:8080`

> Must run via a server — `file://` URLs block fetch requests.

## Swap the model
Replace `BHACKfinal.glb` with your file, then update the fetch path in `main.js`:
```js
fetch('/YOUR_MODEL.glb')
```
