/* main.js — plain script, no ES modules */
(function () {

  /* ── DOM ── */
  var lf   = document.getElementById('lf');
  var lp   = document.getElementById('lp');
  var LE   = document.getElementById('L');
  var anEl = document.getElementById('an');
  var ppEl = document.getElementById('pp');
  var ctEl = document.getElementById('ct');
  var pb   = document.getElementById('pb');
  var pw   = document.getElementById('pw');
  var sh   = document.getElementById('sh');
  var oh   = document.getElementById('oh');
  var cv   = document.getElementById('cv');

  /* ── Renderer ── */
  var R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.setSize(innerWidth, innerHeight);
  R.outputEncoding      = THREE.sRGBEncoding;
  R.toneMapping         = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.25;
  R.shadowMap.enabled   = true;

  /* ── Scene ── */
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06060a, 0.014);

  var cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.01, 500);
  cam.position.set(0, 1.4, 4.8);

  /* ── Lights ── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  var kl = new THREE.DirectionalLight(0x00ffe0, 2.6);
  kl.position.set(4, 6, 4); kl.castShadow = true; scene.add(kl);

  var fl = new THREE.DirectionalLight(0xff2d6b, 1.3);
  fl.position.set(-5, 2, -3); scene.add(fl);

  var tl = new THREE.DirectionalLight(0xffffff, 0.7);
  tl.position.set(0, 8, 0); scene.add(tl);

  /* ── Ground + Grid ── */
  var gnd = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x07070f, roughness: 1 })
  );
  gnd.rotation.x = -Math.PI / 2;
  gnd.receiveShadow = true;
  scene.add(gnd);
  scene.add(new THREE.GridHelper(40, 50, 0x0e0e0e, 0x0e0e0e));

  /* ── Orbit Controls ── */
  var OC = new OrbitControls(cam, cv);
  OC.target.set(0, 0.6, 0);
  OC.enabled = false;

  /* ── Mode ── */
  var mode    = 'scroll';
  var savedSY = 0;

  window.setMode = function (m) {
    if (mode === m) return;
    mode = m;
    document.getElementById('bsc').classList.toggle('on', m === 'scroll');
    document.getElementById('bor').classList.toggle('on', m === 'orbit');
    OC.enabled = (m === 'orbit');
    if (m === 'orbit') {
      savedSY = window.scrollY;
      document.documentElement.classList.add('lock');
      sh.style.display = 'none';
      oh.style.display = 'flex';
      pw.style.opacity = '0';
    } else {
      document.documentElement.classList.remove('lock');
      window.scrollTo(0, savedSY);
      sh.style.display = 'flex';
      oh.style.display = 'none';
      pw.style.opacity = '1';
    }
  };

  /* ── Animation state ── */
  var mixer   = null;
  var actions = [];
  var maxDur  = 0;
  var SPX     = 500; /* px of scroll per second */
  var tgt     = 0;
  var cur     = 0;

  function buildScroll() {
    document.body.style.height = (Math.ceil(maxDur * SPX) + window.innerHeight) + 'px';
  }

  window.addEventListener('scroll', function () {
    if (mode !== 'scroll') return;
    var max = document.body.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    tgt = Math.min(Math.max((window.scrollY || window.pageYOffset || 0) / max, 0), 1);
    sh.style.opacity = tgt > 0.03 ? '0' : '1';
  }, { passive: true });

  /* ── Load GLB ── */
  lf.style.width = '10%';
  lp.textContent = 'Fetching model…';

  fetch('/BHACKfinal.glb')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + res.url);

      var total  = parseInt(res.headers.get('content-length') || '0');
      var loaded = 0;
      var reader = res.body.getReader();
      var chunks = [];

      function pump() {
        return reader.read().then(function (ref) {
          if (ref.done) return;
          chunks.push(ref.value);
          loaded += ref.value.length;
          if (total) {
            var pct = Math.round(loaded / total * 70) + 10;
            lf.style.width  = pct + '%';
            lp.textContent  = Math.round(loaded / total * 100) + '%';
          }
          return pump();
        });
      }

      return pump().then(function () {
        lf.style.width = '85%';
        lp.textContent = 'Parsing scene…';
        var buf = new Uint8Array(loaded);
        var off = 0;
        chunks.forEach(function (c) { buf.set(c, off); off += c.length; });
        return buf.buffer;
      });
    })
    .then(function (buf) {
      return new Promise(function (resolve, reject) {
        new THREE.GLTFLoader().parse(buf, '', resolve, reject);
      });
    })
    .then(function (gltf) {
      var mdl = gltf.scene;

      /* Centre + scale */
      var box = new THREE.Box3().setFromObject(mdl);
      var sz  = new THREE.Vector3();
      var ctr = new THREE.Vector3();
      box.getSize(sz); box.getCenter(ctr);
      var s = 2.4 / Math.max(sz.x, sz.y, sz.z);
      mdl.scale.setScalar(s);
      mdl.position.copy(ctr.multiplyScalar(-s));
      mdl.position.y = Math.max(0, mdl.position.y);
      mdl.traverse(function (n) { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
      scene.add(mdl);

      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(mdl);
        gltf.animations.forEach(function (clip) {
          if (clip.duration > maxDur) maxDur = clip.duration;
          var a = mixer.clipAction(clip);
          a.clampWhenFinished = true;
          a.loop   = THREE.LoopOnce;
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
      setTimeout(function () { LE.classList.add('hide'); }, 400);
    })
    .catch(function (err) {
      lp.textContent = 'Load failed: ' + err.message;
      console.error(err);
    });

  /* ── Render loop ── */
  (function loop() {
    requestAnimationFrame(loop);

    if (mode === 'scroll') {
      cur += (tgt - cur) * 0.08;

      if (mixer && maxDur > 0) {
        var globalT = cur * maxDur;
        actions.forEach(function (obj) {
          obj.action.paused = true;
          obj.action.time   = Math.min(globalT, obj.duration);
        });
        mixer.update(0);

        pb.style.width   = Math.round(cur * 100) + '%';
        ppEl.textContent = Math.round(cur * 100) + '%';
        ctEl.textContent = globalT.toFixed(2) + 's';
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

  /* ── Resize ── */
  window.addEventListener('resize', function () {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    R.setSize(innerWidth, innerHeight);
  });

})();
