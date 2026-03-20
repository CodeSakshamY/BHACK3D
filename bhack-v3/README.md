# BHACK 3D Viewer

Scroll-driven 3D viewer. All animations play simultaneously scrubbed by scroll. Free orbit mode included.

## Structure
```
bhack-viewer/
├── vercel.json       ← tells Vercel to serve from /public
├── .gitignore
└── public/           ← ALL site files live here
    ├── index.html
    ├── style.css
    ├── main.js
    ├── OrbitControls.js
    └── BHACKfinal.glb
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
4. Leave all other settings as default — vercel.json handles the rest
5. **Deploy**

## Run locally
```bash
npx serve public
# or
cd public && python -m http.server 8080
```
Open `http://localhost:8080`
