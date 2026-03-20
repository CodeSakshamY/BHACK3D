/**
 * Lightweight inline OrbitControls
 * Compatible with Three.js r134 global build
 */
export class OrbitControls {
  constructor(cam, el) {
    this.cam    = cam;
    this.el     = el;
    this.enabled = true;
    this.target  = new THREE.Vector3();
    this.minDist = 0.3;
    this.maxDist = 80;
    this.dampF   = 0.1;

    this._state  = -1;
    this._sc     = 1;
    this._sph    = new THREE.Spherical();
    this._dSph   = new THREE.Spherical();
    this._panV   = new THREE.Vector3();
    this._off    = new THREE.Vector3();
    this._rs = new THREE.Vector2(); this._re = new THREE.Vector2(); this._rd = new THREE.Vector2();
    this._ps = new THREE.Vector2(); this._pe = new THREE.Vector2(); this._pd = new THREE.Vector2();

    this._q  = new THREE.Quaternion().setFromUnitVectors(cam.up, new THREE.Vector3(0, 1, 0));
    this._qi = this._q.clone().invert();

    this._off.copy(cam.position).sub(this.target);
    this._off.applyQuaternion(this._q);
    this._sph.setFromVector3(this._off);

    this._bindEvents();
  }

  update() {
    const { cam, target, _sph: sph, _dSph: dSph, _panV: panV, _off: off, _q: q, _qi: qi, dampF } = this;
    off.copy(cam.position).sub(target); off.applyQuaternion(q); sph.setFromVector3(off);
    sph.theta += dSph.theta * dampF;
    sph.phi   += dSph.phi   * dampF;
    sph.phi    = Math.max(0.001, Math.min(Math.PI - 0.001, sph.phi));
    sph.radius = Math.max(this.minDist, Math.min(this.maxDist, sph.radius * this._sc));
    target.addScaledVector(panV, dampF);
    off.setFromSpherical(sph); off.applyQuaternion(qi);
    cam.position.copy(target).add(off); cam.lookAt(target);
    dSph.theta *= (1 - dampF); dSph.phi *= (1 - dampF);
    this._sc = 1;
    panV.multiplyScalar(1 - dampF);
  }

  _rot(dx, dy) {
    this._dSph.theta -= dx * 0.8 * (2 * Math.PI / this.el.clientHeight);
    this._dSph.phi   -= dy * 0.8 * (2 * Math.PI / this.el.clientHeight);
  }

  _pan(dx, dy) {
    const v    = new THREE.Vector3();
    const dist = Math.max(this._off.length(), 0.1) * Math.tan(this.cam.fov / 2 * Math.PI / 180);
    v.setFromMatrixColumn(this.cam.matrix, 0); v.multiplyScalar(-2 * dx * dist / this.el.clientHeight); this._panV.add(v);
    v.setFromMatrixColumn(this.cam.matrix, 1); v.multiplyScalar( 2 * dy * dist / this.el.clientHeight); this._panV.add(v);
  }

  _bindEvents() {
    const el = this.el;
    const onMD = (e) => {
      if (!this.enabled) return; e.preventDefault();
      if      (e.button === 0) { this._state = 0; this._rs.set(e.clientX, e.clientY); }
      else if (e.button === 2) { this._state = 2; this._ps.set(e.clientX, e.clientY); }
      window.addEventListener('mousemove', onMM);
      window.addEventListener('mouseup',   onMU);
    };
    const onMM = (e) => {
      if (!this.enabled) return;
      if (this._state === 0) {
        this._re.set(e.clientX, e.clientY); this._rd.subVectors(this._re, this._rs);
        this._rot(this._rd.x, this._rd.y); this._rs.copy(this._re);
      } else if (this._state === 2) {
        this._pe.set(e.clientX, e.clientY); this._pd.subVectors(this._pe, this._ps);
        this._pan(this._pd.x, this._pd.y); this._ps.copy(this._pe);
      }
    };
    const onMU = () => { this._state = -1; window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); };
    const onMW = (e) => { if (!this.enabled) return; e.preventDefault(); this._sc = e.deltaY < 0 ? this._sc * 1.08 : this._sc / 1.08; };

    let _tp = 0;
    const onTS = (e) => {
      if (!this.enabled) return;
      if (e.touches.length === 1) { this._state = 0; this._rs.set(e.touches[0].clientX, e.touches[0].clientY); }
      else if (e.touches.length === 2) { this._state = 1; _tp = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
    };
    const onTM = (e) => {
      if (!this.enabled) return; e.preventDefault();
      if (e.touches.length === 1 && this._state === 0) {
        this._re.set(e.touches[0].clientX, e.touches[0].clientY); this._rd.subVectors(this._re, this._rs);
        this._rot(this._rd.x, this._rd.y); this._rs.copy(this._re);
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        this._sc *= d > _tp ? 1.04 : 1 / 1.04; _tp = d;
      }
    };

    el.addEventListener('mousedown',   onMD);
    el.addEventListener('wheel',       onMW, { passive: false });
    el.addEventListener('contextmenu', (e) => { if (this.enabled) e.preventDefault(); });
    el.addEventListener('touchstart',  onTS, { passive: false });
    el.addEventListener('touchmove',   onTM, { passive: false });
    el.addEventListener('touchend',    () => { this._state = -1; });
  }
}
