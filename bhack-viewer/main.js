import { OrbitControls } from './OrbitControls.js';

// ── DOM refs ──────────────────────────────────────────────────────────────
const lf    = document.getElementById('lf');
const lp    = document.getElementById('lp');
const LE    = document.getElementById('L');
const anEl  = document.getElementById('an');
const ppEl  = document.getElementById('pp');
const ctEl  = document.getElementById('ct');
const pb    = document.getElementById('pb');
const pw    = document.getElementById('pw');
const sh    = document.getElementById('sh');
const oh    = document.getElementById('oh');
const cv    = document.getElementById('cv');

// ── Renderer ──────────────────────────────────────────────────────────────
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.setSize(innerWidth, innerHeight);
R.outputEncoding     = THREE.sRGBEncoding;
R.toneMapping        = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 1.25;
R.shadowMap.enabled  = true;

// ── Scene ─────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog   = new THREE.FogExp2(0x06060a, 0.014);

const cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.01, 500);
cam.position.set(0, 1.4, 4.8);

// ── Lights ────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const kl = new THREE.DirectionalLight(0x00ffe0, 2.6);
kl.position.set(4, 6, 4); kl.castShadow = true; scene.add(kl);

const fl = new THREE.DirectionalLight(0xff2d6b, 1.3);
fl.position.set(-5, 2, -3); scene.add(fl);

const tl = new THREE.DirectionalLight(0xffffff, 0.7);
tl.position.set(0, 8, 0); scene.add(tl);

// ── Ground + Grid ─────────────────────────────────────────────────────────
const gnd = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x07070f, roughness: 1 })
);
gnd.rotation.x = -Math.PI / 2;
gnd.receiveShadow = true;
scene.add(gnd);
scene.add(new THREE.GridHelper(40, 50, 0x0e0e0e, 0x0e0e0e));

// ── Orbit Controls ────────────────────────────────────────────────────────
const OC = new OrbitControls(cam, cv);
OC.target.set(0, 0.6, 0);
OC.enabled = false;

// ── Mode ──────────────────────────────────────────────────────────────────
let mode     = 'scroll';
let savedSY  = 0;

window.setMode = function (m) {
  if (mode === m) return;
  mode = m;
  document.getElementById('bsc').classList.toggle('on', m === 'scroll');
  document.getElementById('bor').classList.toggle('on', m === 'orbit');
  OC.enabled = (m === 'orbit');

  if (m === 'orbit') {
    savedSY = window.scrollY;
    document.documentElement.classList.add('lock');
    sh.style.display  = 'none';
    oh.style.display  = 'flex';
    pw.style.opacity  = '0';
  } else {
    document.documentElement.classList.remove('lock');
    window.scrollTo(0, savedSY);
    sh.style.display  = 'flex';
    oh.style.display  = 'none';
    pw.style.opacity  = '1';
  }
};

// ── Animation state ───────────────────────────────────────────────────────
let mixer   = null;
let actions = [];   // [{ action, duration }]
let maxDur  = 0;
const SPX   = 500;  // px of scroll per second of animation

let tgt = 0;
let cur = 0;

function buildScroll() {
  document.body.style.height = (Math.ceil(maxDur * SPX) + window.innerHeight) + 'px';
}

window.addEventListener('scroll', () => {
  if (mode !== 'scroll') return;
  const max = document.body.scrollHeight - window.innerHeight;
  if (max <= 0) return;
  tgt = Math.min(Math.max((window.scrollY || window.pageYOffset || 0) / max, 0), 1);
  sh.style.opacity = tgt > 0.03 ? '0' : '1';
}, { passive: true });

// ── Load model ────────────────────────────────────────────────────────────
async function loadModel() {
  lf.style.width = '20%';
  lp.textContent = 'Fetching model…';

  // Fetch with progress
  const response = await fetch('./public/BHACKfinal.glb');
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength) : 0;
  let loaded = 0;

  const reader  = response.body.getReader();
  const chunks  = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (total) {
      const pct = Math.round((loaded / total) * 60) + 20; // 20–80%
      lf.style.width = pct + '%';
      lp.textContent = Math.round(loaded / total * 100) + '%';
    }
  }

  lf.style.width = '80%';
  lp.textContent = 'Parsing scene…';

  // Combine chunks into ArrayBuffer
  const buf = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.length; }

  return buf.buffer;
}

async function init() {
  try {
    const buf = await loadModel();

    await new Promise((resolve, reject) => {
      new THREE.GLTFLoader().parse(buf, '', (gltf) => {
        const mdl = gltf.scene;

        // Auto-centre and scale
        const box = new THREE.Box3().setFromObject(mdl);
        const sz  = new THREE.Vector3();
        const ctr = new THREE.Vector3();
        box.getSize(sz); box.getCenter(ctr);
        const s = 2.4 / Math.max(sz.x, sz.y, sz.z);
        mdl.scale.setScalar(s);
        mdl.position.copy(ctr.multiplyScalar(-s));
        mdl.position.y = Math.max(0, mdl.position.y);
        mdl.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        scene.add(mdl);

        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(mdl);
          gltf.animations.forEach(clip => {
            if (clip.duration > maxDur) maxDur = clip.duration;
            const a = mixer.clipAction(clip);
            a.clampWhenFinished = true;
            a.loop  = THREE.LoopOnce;
            a.play();
            a.paused = true;
            a.time   = 0;
            actions.push({ action: a, duration: clip.duration });
          });
          buildScroll();
          anEl.textContent = gltf.animations.length + ' CLIPS';
        } else {
          anEl.textContent = 'NO ANIM';
          document.body.style.height = '300vh';
        }

        lf.style.width = '100%';
        setTimeout(() => LE.classList.add('hide'), 400);
        resolve();
      }, reject);
    });
  } catch (err) {
    lp.textContent = 'Load failed — see console';
    console.error(err);
  }
}

init();

// ── Render loop ───────────────────────────────────────────────────────────
(function loop() {
  requestAnimationFrame(loop);

  if (mode === 'scroll') {
    cur += (tgt - cur) * 0.08;

    if (mixer && maxDur > 0) {
      const globalT = cur * maxDur;
      actions.forEach(({ action, duration }) => {
        action.paused = true;
        action.time   = Math.min(globalT, duration);
      });
      mixer.update(0);

      pb.style.width      = Math.round(cur * 100) + '%';
      ppEl.textContent    = Math.round(cur * 100) + '%';
      ctEl.textContent    = globalT.toFixed(2) + 's';
    }

    cam.position.y = 1.4 + Math.sin(Date.now() * 0.0004) * 0.08;
    cam.lookAt(0, 0.6, 0);

  } else {
    OC.update();
    ppEl.textContent = 'FREE';
    ctEl.textContent = '–';
  }

  R.render(scene, cam);
})();

// ── Resize ────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  R.setSize(innerWidth, innerHeight);
});
