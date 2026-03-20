/* Lightweight OrbitControls — plain script, no ES module syntax */
window.OrbitControls = function (cam, el) {
  var S = this, state = -1, sc = 1;
  S.enabled = true;
  S.target  = new THREE.Vector3();
  S.minDist = 0.3;
  S.maxDist = 80;
  S.dampF   = 0.1;

  var sph  = new THREE.Spherical();
  var dSph = new THREE.Spherical();
  var panV = new THREE.Vector3();
  var off  = new THREE.Vector3();
  var rs = new THREE.Vector2(), re = new THREE.Vector2(), rd = new THREE.Vector2();
  var ps = new THREE.Vector2(), pe = new THREE.Vector2(), pd = new THREE.Vector2();
  var q  = new THREE.Quaternion().setFromUnitVectors(cam.up, new THREE.Vector3(0, 1, 0));
  var qi = q.clone().invert();

  off.copy(cam.position).sub(S.target);
  off.applyQuaternion(q);
  sph.setFromVector3(off);

  S.update = function () {
    off.copy(cam.position).sub(S.target); off.applyQuaternion(q); sph.setFromVector3(off);
    sph.theta += dSph.theta * S.dampF;
    sph.phi   += dSph.phi   * S.dampF;
    sph.phi    = Math.max(0.001, Math.min(Math.PI - 0.001, sph.phi));
    sph.radius = Math.max(S.minDist, Math.min(S.maxDist, sph.radius * sc));
    S.target.addScaledVector(panV, S.dampF);
    off.setFromSpherical(sph); off.applyQuaternion(qi);
    cam.position.copy(S.target).add(off); cam.lookAt(S.target);
    dSph.theta *= (1 - S.dampF); dSph.phi *= (1 - S.dampF);
    sc = 1;
    panV.multiplyScalar(1 - S.dampF);
  };

  function rot(dx, dy) {
    dSph.theta -= dx * 0.8 * (2 * Math.PI / el.clientHeight);
    dSph.phi   -= dy * 0.8 * (2 * Math.PI / el.clientHeight);
  }

  function doPan(dx, dy) {
    var v    = new THREE.Vector3();
    var dist = Math.max(off.length(), 0.1) * Math.tan(cam.fov / 2 * Math.PI / 180);
    v.setFromMatrixColumn(cam.matrix, 0); v.multiplyScalar(-2 * dx * dist / el.clientHeight); panV.add(v);
    v.setFromMatrixColumn(cam.matrix, 1); v.multiplyScalar( 2 * dy * dist / el.clientHeight); panV.add(v);
  }

  function onMD(e) {
    if (!S.enabled) return; e.preventDefault();
    if      (e.button === 0) { state = 0; rs.set(e.clientX, e.clientY); }
    else if (e.button === 2) { state = 2; ps.set(e.clientX, e.clientY); }
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup',   onMU);
  }
  function onMM(e) {
    if (!S.enabled) return;
    if (state === 0) { re.set(e.clientX, e.clientY); rd.subVectors(re, rs); rot(rd.x, rd.y); rs.copy(re); }
    else if (state === 2) { pe.set(e.clientX, e.clientY); pd.subVectors(pe, ps); doPan(pd.x, pd.y); ps.copy(pe); }
  }
  function onMU() { state = -1; window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); }
  function onMW(e) { if (!S.enabled) return; e.preventDefault(); sc = e.deltaY < 0 ? sc * 1.08 : sc / 1.08; }

  var tp = 0;
  function onTS(e) {
    if (!S.enabled) return;
    if (e.touches.length === 1) { state = 0; rs.set(e.touches[0].clientX, e.touches[0].clientY); }
    else if (e.touches.length === 2) { state = 1; tp = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
  }
  function onTM(e) {
    if (!S.enabled) return; e.preventDefault();
    if (e.touches.length === 1 && state === 0) {
      re.set(e.touches[0].clientX, e.touches[0].clientY); rd.subVectors(re, rs); rot(rd.x, rd.y); rs.copy(re);
    } else if (e.touches.length === 2) {
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      sc *= d > tp ? 1.04 : 1 / 1.04; tp = d;
    }
  }

  el.addEventListener('mousedown',   onMD);
  el.addEventListener('wheel',       onMW, { passive: false });
  el.addEventListener('contextmenu', function (e) { if (S.enabled) e.preventDefault(); });
  el.addEventListener('touchstart',  onTS, { passive: false });
  el.addEventListener('touchmove',   onTM, { passive: false });
  el.addEventListener('touchend',    function () { state = -1; });
};
