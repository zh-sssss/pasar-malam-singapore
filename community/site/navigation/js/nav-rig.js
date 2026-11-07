// Camera rig: first-person walking, top view, and every move between them as one unbroken eased flight
// (cubic Bézier placed by arc length, a single minimum-jerk easing, orientation and field of view on the same clock).
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const RADIUS = 0.28;

  class Rig {
    constructor(camera, dom, world) {
      this.cam = camera; this.dom = dom; this.grid = world.grid;
      this.fp = { x: 2, z: 0, yaw: -Math.PI / 2, pitch: -0.02 };
      this.top = { x: 58, z: 0, h: 150 };
      this.topGoal = { ...this.top };
      this.vel = { x: 0, z: 0 }; this.wheelV = 0;
      this.keys = new Set(); this.joy = { x: 0, y: 0, on: false };
      this.mode = 'walk'; this.fly = null; this.auto = null;
      this.fovWalk = 62; this.fovTop = 30;
      this.onClick = null;         // set by main: (clientX, clientY, kind) where kind is 'mouse', 'touch', 'pen' or 'locked'
      this.locked = false;         // pointer lock: the mouse turns the camera and a crosshair picks
      this.canLock = 'requestPointerLock' in dom && !matchMedia('(pointer: coarse)').matches;
      this.lookAcc = 0;
      this._dummy = new THREE.PerspectiveCamera();
      this.bindInput();
      this.applyWalk();
    }

    // ---- poses ------------------------------------------------------------------------------------------------
    walkPose(fp = this.fp) {
      return { p: V(fp.x, NAV.EYE, fp.z), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(fp.pitch, fp.yaw, 0, 'YXZ')), fov: this.fovWalk };
    }
    topPose(t = this.top) {
      const d = this._dummy; d.position.set(t.x, t.h, t.z); d.up.set(0, 0, -1); d.lookAt(t.x, 0, t.z);
      return { p: V(t.x, t.h, t.z), q: d.quaternion.clone(), fov: this.fovTop };
    }
    fitTopHeight() {
      // frame the lane and both mouths (about 150 m) at the current aspect
      const a = this.cam.aspect, half = Math.tan(THREE.MathUtils.degToRad(this.fovTop) / 2);
      return NAV.clamp(Math.max(150 / (2 * half * a), 46 / (2 * half)), 40, 260);
    }
    applyWalk() { const w = this.walkPose(); this.cam.position.copy(w.p); this.cam.quaternion.copy(w.q); this.setFov(w.fov); }
    setFov(f) { if (Math.abs(this.cam.fov - f) > 1e-4) { this.cam.fov = f; this.cam.updateProjectionMatrix(); } }

    // ---- one continuous flight ---------------------------------------------------------------------------------
    // endSpeed (m/s) lets a flight hand over to walking without stopping: the easing ends at that speed instead of at rest
    flyTo(target, { v0 = V(0, 0, 0), v1 = V(0, 0, 0), duration = 1.3, then = 'walk', done, endSpeed = 0 } = {}) {
      this.auto = null;
      const P0 = this.cam.position.clone(), P3 = target.p.clone();
      const P1 = P0.clone().add(v0), P2 = P3.clone().sub(v1);
      const lut = [0]; let prev = P0.clone(), total = 0;
      const bez = (u, out = V(0, 0, 0)) => {
        const a = 1 - u;
        return out.set(0, 0, 0).addScaledVector(P0, a * a * a).addScaledVector(P1, 3 * a * a * u).addScaledVector(P2, 3 * a * u * u).addScaledVector(P3, u * u * u);
      };
      for (let k = 1; k <= 96; k++) { const p = bez(k / 96); total += p.distanceTo(prev); lut.push(total); prev = p; }
      const dur = NAV.state.reducedMotion ? 0.001 : duration;
      // quintic with zero speed and acceleration at the start and slope m at the end (m = 0 is the minimum-jerk curve)
      const m = NAV.clamp((endSpeed * dur) / Math.max(total, 1e-3), 0, 1.2);
      const ease = (t) => t * t * t * ((10 - 4 * m) + t * ((7 * m - 15) + t * (6 - 3 * m)));
      this.fly = { t: 0, dur, bez, lut, total, ease, q0: this.cam.quaternion.clone(), q1: target.q, f0: this.cam.fov, f1: target.fov, then, done };
      this.mode = 'fly';
      NAV.emit('mode', 'fly');
    }
    // returns the part of dt left over after the flight ends, so whatever follows can use it in the same frame
    updateFly(dt) {
      const f = this.fly, step = Math.min(dt, (1 - f.t) * f.dur);
      f.t = f.t + step / f.dur > 1 - 1e-6 ? 1 : f.t + step / f.dur;
      const s = f.ease(f.t), want = s * f.total;
      let k = 1; while (k < f.lut.length - 1 && f.lut[k] < want) k++;
      const seg = f.lut[k] - f.lut[k - 1] || 1, u = (k - 1 + (want - f.lut[k - 1]) / seg) / (f.lut.length - 1);
      f.bez(NAV.clamp(u, 0, 1), this.cam.position);
      this.cam.quaternion.slerpQuaternions(f.q0, f.q1, s);
      this.setFov(NAV.lerp(f.f0, f.f1, s));
      if (f.t >= 1) {
        this.fly = null; this.mode = f.then;
        if (this.mode === 'top') this.topGoal = { ...this.top };
        NAV.emit('mode', this.mode);
        if (f.done) f.done();
        return dt - step;
      }
      return 0;
    }

    toTop() {
      if (this.mode === 'top') return;
      this.syncFpFromCamera();
      this.top = { x: 58, z: 0, h: this.fitTopHeight() };
      const t = this.topPose(), rise = t.p.y - this.cam.position.y;
      const fwd = V(-Math.sin(this.fp.yaw), 0, -Math.cos(this.fp.yaw));
      this.flyTo(t, { v0: V(0, rise * 0.42, 0).addScaledVector(fwd, 4), v1: V(0, rise * 0.25, 0), duration: 1.5, then: 'top' });
    }
    // come down at (x, z), or back to where the walk left off
    toWalk(x, z, yaw) {
      if (x !== undefined) {
        const [i, j] = this.grid.nearestFree(x, z, this.grid.clear) || [this.grid.i(x), this.grid.j(z)];
        this.fp = { x: this.grid.cx(i), z: this.grid.cz(j), yaw: yaw ?? (x < 58 ? -Math.PI / 2 : Math.PI / 2), pitch: -0.02 };
      }
      const w = this.walkPose(), drop = this.cam.position.y - w.p.y;
      const fwd = V(-Math.sin(this.fp.yaw), 0, -Math.cos(this.fp.yaw));
      this.flyTo(w, { v0: V(0, -drop * 0.4, 0), v1: fwd.clone().multiplyScalar(7).add(V(0, -2.5, 0)), duration: 1.6, then: 'walk' });
    }
    // from the top view straight into a walk along `path`: the flight comes down onto the route's first leg, already
    // moving along it at walking speed, and the walk carries on from that speed with no stop in between
    landOnto(path, opts = {}) {
      const speed = opts.speed || NAV.WALK * 1.25;
      const [x0, z0] = path[0];
      let k = 1; while (k < path.length - 1 && Math.hypot(path[k][0] - x0, path[k][1] - z0) < 2) k++;
      const dx = path[k][0] - x0, dz = path[k][1] - z0, l = Math.hypot(dx, dz) || 1;
      this.fp = { x: x0, z: z0, yaw: Math.atan2(-dx / l, -dz / l), pitch: -0.04 };
      const w = this.walkPose(), drop = this.cam.position.y - w.p.y, dir = V(dx / l, 0, dz / l);
      this.flyTo(w, {
        v0: V(0, -drop * 0.42, 0), v1: dir.clone().multiplyScalar(Math.min(9, drop * 0.25)), duration: 1.7, then: 'walk', endSpeed: speed,
        done: () => this.follow(path, { ...opts, speed, startSpeed: speed }),
      });
    }
    arrive() {
      const start = { x: -9, z: 0.4, yaw: -Math.PI / 2, pitch: -0.1 };
      this.cam.position.set(start.x, 3.1, start.z);
      this.cam.quaternion.copy(this.walkPose(start).q); this.setFov(this.fovWalk + 8);
      this.fp = { x: 2.5, z: 0, yaw: -Math.PI / 2, pitch: -0.02 };
      const w = this.walkPose();
      this.flyTo(w, { v0: V(4.5, -0.4, 0), v1: V(3.5, -0.3, 0), duration: 1.8, then: 'walk' });
    }
    syncFpFromCamera() {
      if (this.mode !== 'walk' && this.mode !== 'auto') return;
      const e = new THREE.Euler().setFromQuaternion(this.cam.quaternion, 'YXZ');
      this.fp.yaw = e.y; this.fp.pitch = e.x;
    }

    // ---- following a path (click-to-walk and "Go") --------------------------------------------------------------
    follow(path, { face = null, speed = NAV.WALK * 1.25, startSpeed = null, done } = {}) {
      if (!path || path.length < 2) return false;
      // round the corners a little (Chaikin, two passes) so the walk turns smoothly
      let pts = path;
      for (let pass = 0; pass < 2; pass++) {
        const out = [pts[0]];
        for (let k = 0; k < pts.length - 1; k++) {
          const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
          if (k > 0) out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
          if (k < pts.length - 2) out.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
        }
        out.push(pts[pts.length - 1]); pts = out;
      }
      const cum = [0];
      for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      this.syncFpFromCamera();
      this.auto = { pts, cum, L: cum[cum.length - 1], s: 0, speed, face, done, v: startSpeed ?? Math.hypot(this.vel.x, this.vel.z) };
      this.mode = 'auto'; NAV.emit('mode', 'auto');
      return true;
    }
    sample(s) {
      const a = this.auto; s = NAV.clamp(s, 0, a.L);
      let k = 1; while (k < a.cum.length - 1 && a.cum[k] < s) k++;
      const t = (s - a.cum[k - 1]) / ((a.cum[k] - a.cum[k - 1]) || 1);
      return [NAV.lerp(a.pts[k - 1][0], a.pts[k][0], t), NAV.lerp(a.pts[k - 1][1], a.pts[k][1], t)];
    }
    updateAuto(dt) {
      const a = this.auto, left = a.L - a.s;
      // one speed profile for the whole walk: picks up from the current speed, cruises, settles to a stop
      const cruise = Math.min(a.speed, Math.sqrt(2 * 1.9 * Math.max(left, 0)) + 0.05);
      a.v += (cruise - a.v) * (1 - Math.exp(-dt * 3.2));
      a.s = Math.min(a.L, a.s + a.v * dt);
      const [x, z] = this.sample(a.s), [lx, lz] = this.sample(a.s + 3.0);
      this.fp.x = x; this.fp.z = z;
      let want = Math.hypot(lx - x, lz - z) > 0.05 ? Math.atan2(-(lx - x), -(lz - z)) : this.fp.yaw;
      if (a.face) {
        const toFace = Math.atan2(-(a.face[0] - x), -(a.face[1] - z));
        const w = NAV.smoothstep(3.2, 0.2, left);
        want = this.fp.yaw + NAV.wrapAngle(NAV.lerp(want, want + NAV.wrapAngle(toFace - want), w) - this.fp.yaw);
      }
      this.fp.yaw += NAV.wrapAngle(want - this.fp.yaw) * (1 - Math.exp(-dt * 5.5));
      // look down a touch towards the counter as the walk settles in front of a stall
      const pitchWant = a.face ? NAV.lerp(-0.04, -0.13, NAV.smoothstep(2.6, 0.3, left)) : -0.04;
      this.fp.pitch += (pitchWant - this.fp.pitch) * (1 - Math.exp(-dt * 3));
      this.applyWalk();
      if (a.s >= a.L - 1e-3 && a.v < 0.08) {
        this.auto = null; this.mode = 'walk'; this.vel = { x: 0, z: 0 };
        NAV.emit('mode', 'walk'); if (a.done) a.done();
      }
    }
    stopAuto() { if (this.mode === 'auto') { this.auto = null; this.mode = 'walk'; NAV.emit('mode', 'walk'); NAV.emit('autoStopped'); } }

    // ---- per frame ---------------------------------------------------------------------------------------------
    update(dt) {
      if (this.mode === 'fly') {
        const left = this.updateFly(dt);
        if (left > 0 && this.mode === 'auto') this.updateAuto(left);
        return;
      }
      if (this.mode === 'auto') {
        if (this.inputActive()) this.stopAuto(); else return this.updateAuto(dt);
      }
      if (this.mode === 'top') {
        const g = this.topGoal, k = 1 - Math.exp(-dt * 9);
        this.top.x += (g.x - this.top.x) * k; this.top.z += (g.z - this.top.z) * k; this.top.h += (g.h - this.top.h) * k;
        const t = this.topPose(); this.cam.position.copy(t.p); this.cam.quaternion.copy(t.q); this.setFov(t.fov);
        return;
      }
      // walking
      let ix = 0, iy = 0;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iy += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iy -= 1;
      if (this.keys.has('KeyD')) ix += 1;
      if (this.keys.has('KeyA')) ix -= 1;
      if (this.keys.has('ArrowLeft')) this.fp.yaw += dt * 2.2;
      if (this.keys.has('ArrowRight')) this.fp.yaw -= dt * 2.2;
      if (this.joy.on) { ix += this.joy.x; iy += -this.joy.y; }
      const mag = Math.hypot(ix, iy); if (mag > 1) { ix /= mag; iy /= mag; }
      const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? NAV.RUN : NAV.WALK;
      const fx = -Math.sin(this.fp.yaw), fz = -Math.cos(this.fp.yaw), rx = Math.cos(this.fp.yaw), rz = -Math.sin(this.fp.yaw);
      const wantX = (fx * iy + rx * ix) * speed + fx * this.wheelV, wantZ = (fz * iy + rz * ix) * speed + fz * this.wheelV;
      const k = 1 - Math.exp(-dt * 9);
      this.vel.x += (wantX - this.vel.x) * k; this.vel.z += (wantZ - this.vel.z) * k;
      this.wheelV *= Math.exp(-dt * 4);
      if (Math.abs(this.vel.x) + Math.abs(this.vel.z) > 1e-4) {
        [this.fp.x, this.fp.z] = this.grid.slide(this.fp.x, this.fp.z, this.vel.x * dt, this.vel.z * dt, RADIUS);
      }
      this.applyWalk();
    }
    inputActive() {
      return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].some((c) => this.keys.has(c)) || this.joy.on || this.dragging;
    }

    // ---- mouse look under pointer lock -------------------------------------------------------------------------
    lock() {
      const walking = this.mode === 'walk' || this.mode === 'auto' || (this.mode === 'fly' && this.fly && this.fly.then === 'walk');
      if (!this.canLock || this.locked || !walking) return;
      try {
        const p = this.dom.requestPointerLock({ unadjustedMovement: true });
        if (p && p.catch) p.catch(() => { try { this.dom.requestPointerLock(); } catch (e) { /* stays unlocked */ } });
      } catch (e) { try { this.dom.requestPointerLock(); } catch (e2) { /* stays unlocked */ } }
    }
    unlock() { if (this.locked) document.exitPointerLock(); }
    mouseLook(dx, dy) {
      if (this.mode === 'auto') {
        // a deliberate turn takes the walk back from the route; small hand tremor doesn't
        this.lookAcc += Math.abs(dx) + Math.abs(dy);
        if (this.lookAcc < 40) return;
        this.stopAuto();
      }
      if (this.mode !== 'walk') return;
      const s = 0.0022 * (this.cam.fov / 62);
      this.fp.yaw -= dx * s; this.fp.pitch = NAV.clamp(this.fp.pitch - dy * s, -1.15, 1.15);
    }

    // ---- input -------------------------------------------------------------------------------------------------
    bindInput() {
      const dom = this.dom, pointers = new Map();
      let down = null, pinch = null, lockDown = null;
      document.addEventListener('pointerlockchange', () => {
        this.locked = document.pointerLockElement === dom; this.lookAcc = 0;
        NAV.emit('lock', this.locked);
      });
      document.addEventListener('pointerlockerror', () => { this.locked = false; NAV.emit('lockError'); });
      setInterval(() => { this.lookAcc *= 0.5; }, 300);
      dom.addEventListener('pointerdown', (ev) => {
        if (this.locked) { lockDown = performance.now(); return; }
        dom.setPointerCapture(ev.pointerId);
        pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), h: this.topGoal.h }; down = null; return; }
        down = { x: ev.clientX, y: ev.clientY, lx: ev.clientX, ly: ev.clientY, t: performance.now(), moved: false };
      });
      dom.addEventListener('pointermove', (ev) => {
        if (this.locked) { this.mouseLook(ev.movementX || 0, ev.movementY || 0); return; }
        const p = pointers.get(ev.pointerId); if (p) { p.x = ev.clientX; p.y = ev.clientY; }
        if (pinch && pointers.size === 2 && this.mode === 'top') {
          const [a, b] = [...pointers.values()];
          this.topGoal.h = NAV.clamp(pinch.h * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 18, 260);
          return;
        }
        if (!down) return;
        const dx = ev.clientX - down.lx, dy = ev.clientY - down.ly;
        down.lx = ev.clientX; down.ly = ev.clientY;
        if (Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6) { down.moved = true; this.dragging = true; }
        if (!down.moved) return;
        if (this.mode === 'walk' || this.mode === 'auto') {
          if (this.mode === 'auto') this.stopAuto();
          // a finger drags the world; a mouse turns the camera the same way mouse look does
          const s = (ev.pointerType === 'touch' ? 0.0062 : 0.0042) * (this.cam.fov / 62) * (ev.pointerType === 'touch' ? 1 : -1);
          this.fp.yaw += dx * s; this.fp.pitch = NAV.clamp(this.fp.pitch + dy * s, -1.15, 1.15);
        } else if (this.mode === 'top') {
          const mpp = (2 * this.top.h * Math.tan(THREE.MathUtils.degToRad(this.cam.fov) / 2)) / this.dom.clientHeight;
          this.topGoal.x = NAV.clamp(this.topGoal.x - dx * mpp, -30, 140); this.topGoal.z = NAV.clamp(this.topGoal.z - dy * mpp, -60, 60);
        }
      });
      const up = (ev) => {
        if (this.locked) {
          if (lockDown !== null && performance.now() - lockDown < 600 && this.onClick) this.onClick(0, 0, 'locked');
          lockDown = null; return;
        }
        pointers.delete(ev.pointerId);
        if (pointers.size < 2) pinch = null;
        if (down && !down.moved && performance.now() - down.t < 450 && this.onClick) this.onClick(ev.clientX, ev.clientY, ev.pointerType);
        down = null; this.dragging = false;
      };
      dom.addEventListener('pointerup', up);
      dom.addEventListener('pointercancel', up);
      dom.addEventListener('wheel', (ev) => {
        ev.preventDefault();
        if (this.mode === 'top') this.topGoal.h = NAV.clamp(this.topGoal.h * Math.exp(ev.deltaY * 0.0012), 18, 260);
        else if (this.mode === 'walk') this.wheelV = NAV.clamp(this.wheelV - ev.deltaY * 0.012, -3, 3);
      }, { passive: false });
      const typing = () => ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      window.addEventListener('keydown', (ev) => { if (!typing()) this.keys.add(ev.code); });
      window.addEventListener('keyup', (ev) => this.keys.delete(ev.code));
      window.addEventListener('blur', () => this.keys.clear());
    }
    bindJoystick(base, knob) {
      const R = 46;
      const set = (ev) => {
        const r = base.getBoundingClientRect(), dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
        const d = Math.min(R, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
        this.joy.x = (Math.cos(a) * d) / R; this.joy.y = (Math.sin(a) * d) / R;
        knob.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`;
      };
      base.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); base.setPointerCapture(ev.pointerId); this.joy.on = true; if (this.mode === 'auto') this.stopAuto(); set(ev); });
      base.addEventListener('pointermove', (ev) => { if (this.joy.on) set(ev); });
      const end = () => { this.joy.on = false; this.joy.x = this.joy.y = 0; knob.style.transform = ''; };
      base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
    }
  }
  NAV.Rig = Rig;
})();
