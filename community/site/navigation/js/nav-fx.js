// The AR layer chosen in the S2 study (D28): the route on foot as a trail of dots and arrowheads with a pulse running
// ahead (T2), a dimension on the ground wherever goods stand past a yellow line (M1), and the wave that builds the
// festival stalls from their anchors on the yellow lines (R3).
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

  // a big yellow figure over a small cyan line, with a dark halo so it reads over the lit lane
  function tagTexture(big, small) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 205;
    const g = cv.getContext('2d'), fam = 'Fredoka, "Noto Sans Tamil", system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(6, 10, 30, 0.75)'; g.shadowBlur = 10;
    g.fillStyle = '#ffe07a'; g.font = `700 84px ${fam}`; g.fillText(big, 256, 86);
    let s = 40; g.font = `600 ${s}px ${fam}`;
    while (g.measureText(small).width > 490 && s > 20) { s -= 2; g.font = `600 ${s}px ${fam}`; }
    g.fillStyle = '#bff8ff'; g.fillText(small, 256, 164);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }

  // ---- T2: the route on foot ----------------------------------------------------------------------------------------
  // Dots every 0.45 m floating just off the ground, an arrowhead every 3 m, a pulse running ahead of the walker, the
  // distance left at the end. What the walker has passed fades away.
  const DOT = 0.45, HEAD = 3.0, GOLD = new THREE.Color(0xffc65a), PALE = new THREE.Color(0xffe2a0), BLACK = new THREE.Color(0);
  class Trail {
    constructor(scene) {
      this.scene = scene;
      this.dotGeo = new THREE.CircleGeometry(0.055, 16).rotateX(-Math.PI / 2);
      const arrow = new THREE.Shape();
      arrow.moveTo(0.16, 0); arrow.lineTo(-0.09, 0.12); arrow.lineTo(-0.03, 0); arrow.lineTo(-0.09, -0.12); arrow.closePath();
      this.headGeo = new THREE.ShapeGeometry(arrow).rotateX(-Math.PI / 2);
      this.ringGeo = new THREE.RingGeometry(0.4, 0.5, 48).rotateX(-Math.PI / 2);
      this.mat = new THREE.MeshBasicMaterial({ color: 0xffffff, ...ADD, side: THREE.DoubleSide });
      this.ringMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
      this.group = null;
    }
    // pts: the route, densified; name: where it goes
    set(pts, name) {
      this.clear();
      const s = [0];
      for (let k = 1; k < pts.length; k++) s.push(s[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      const at = (d) => {                      // the point and heading at arc length d
        let k = 1; while (k < s.length - 1 && s[k] < d) k++;
        const t = (d - s[k - 1]) / Math.max(1e-6, s[k] - s[k - 1]), a = pts[k - 1], b = pts[k];
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(-(b[1] - a[1]), b[0] - a[0])];
      };
      this.pts = pts; this.s = s; this.len = s[s.length - 1]; this.name = name; this.k = 0; this.shown = -1;
      this.dotS = []; this.headS = [];
      for (let d = DOT; d < this.len - 0.3; d += DOT) this.dotS.push(d);
      for (let d = HEAD / 2; d < this.len - 0.8; d += HEAD) this.headS.push(d);
      const g = (this.group = new THREE.Group()), M = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
      this.dots = new THREE.InstancedMesh(this.dotGeo, this.mat, Math.max(1, this.dotS.length));
      this.dots.setColorAt(0, BLACK);
      this.dotS.forEach((d, k) => { const [x, z] = at(d); this.dots.setMatrixAt(k, M.compose(new THREE.Vector3(x, 0.045, z), q.identity(), one)); this.dots.setColorAt(k, GOLD); });
      this.heads = new THREE.InstancedMesh(this.headGeo, this.mat, Math.max(1, this.headS.length));
      this.heads.setColorAt(0, BLACK);
      this.headS.forEach((d, k) => { const [x, z, a] = at(d); this.heads.setMatrixAt(k, M.compose(new THREE.Vector3(x, 0.05, z), q.setFromAxisAngle(Y, a), one)); this.heads.setColorAt(k, PALE); });
      for (const m of [this.dots, this.heads]) { m.count = Math.max(0, m === this.dots ? this.dotS.length : this.headS.length); m.computeBoundingSphere(); g.add(m); }
      const end = pts[pts.length - 1];
      this.ring = new THREE.Mesh(this.ringGeo, this.ringMat); this.ring.position.set(end[0], 0.035, end[1]);
      this.tag = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
      this.tag.scale.set(1.1, 0.44, 1); this.tag.position.set(end[0], 1.0, end[1]);
      g.add(this.ring, this.tag);
      this.scene.add(g);
    }
    // the walker's arc length along the route: a local search from last time, a full one if they wandered off
    progress(x, z) {
      const near = (a, b) => { let best = Infinity, bk = this.k; for (let k = Math.max(0, a); k < Math.min(this.pts.length, b); k++) { const d = (this.pts[k][0] - x) ** 2 + (this.pts[k][1] - z) ** 2; if (d < best) { best = d; bk = k; } } return [best, bk]; };
      let [d, k] = near(this.k - 20, this.k + 80);
      if (d > 9) [d, k] = near(0, this.pts.length);
      this.k = k;
      return this.s[k];
    }
    update(t, x, z, camY) {
      if (!this.group) return;
      this.group.visible = camY < 30;
      const sw = this.progress(x, z), left = this.len - sw;
      // the pulse runs ahead of the walker to the end and starts again
      const ph = sw + ((t * 4.0) % (left + 4)), c = new THREE.Color();
      this.dotS.forEach((d, k) => {
        const fade = NAV.smoothstep(-0.4, 0.5, d - sw), q = ph - d, pulse = q >= 0 && q < 3 ? 1 - q / 3 : 0;
        this.dots.setColorAt(k, fade ? c.copy(GOLD).multiplyScalar((0.45 + 0.9 * pulse) * fade) : BLACK);
      });
      this.headS.forEach((d, k) => this.heads.setColorAt(k, c.copy(PALE).multiplyScalar(NAV.smoothstep(-0.4, 0.8, d - sw))));
      this.dots.instanceColor.needsUpdate = true; this.heads.instanceColor.needsUpdate = true;
      this.ring.scale.setScalar(1 + 0.12 * Math.sin(t * 6));
      const m = Math.max(1, Math.round(left));
      if (m !== this.shown) {
        this.shown = m;
        if (this.tag.material.map) this.tag.material.map.dispose();
        this.tag.material.map = tagTexture(`${m} m`, this.name); this.tag.material.needsUpdate = true;
      }
    }
    clear() {
      if (!this.group) return;
      this.scene.remove(this.group);
      this.dots.dispose(); this.heads.dispose();
      if (this.tag.material.map) this.tag.material.map.dispose();
      this.tag.material.dispose();
      this.group = null; this.pts = null;
    }
  }
  NAV.Trail = Trail;

  // ---- M1: goods past the yellow line ---------------------------------------------------------------------------------
  // A dimension on the ground from the line to the front of the goods, ticks at both ends, its figure lying beside it so
  // it reads from the aisle, and the stretch of line they cross lit up. Strongest close by; gone from far off and above.
  class OverflowMarks {
    constructor(scene, list) {
      this.marks = list.map((o) => {
        const sgn = o.e.side === 'SW' ? 1 : -1, g = new THREE.Group(), y = 0.022;
        const dimMat = new THREE.MeshBasicMaterial({ color: 0xffe07a, transparent: true, depthWrite: false });
        const strips = [], strip = (cx, cz, sx, sz) => { const p = new THREE.PlaneGeometry(sx, sz).rotateX(-Math.PI / 2); p.translate(cx, y, cz); strips.push(p); };
        const len = Math.abs(o.zLine - o.zFront);
        strip(o.x, (o.zLine + o.zFront) / 2, 0.028, len); strip(o.x, o.zLine, 0.26, 0.028); strip(o.x, o.zFront, 0.26, 0.028);
        g.add(new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(strips), dimMat));
        const what = o.overhang ? 'hangs over the line' : o.inner ? 'past the inner line' : 'past the line';
        const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.46), new THREE.MeshBasicMaterial({ map: tagTexture(`+${o.past} m`, what), transparent: true, depthWrite: false }));
        lbl.rotation.set(-Math.PI / 2, 0, sgn > 0 ? Math.PI : 0);          // its top points into the stall
        lbl.position.set(o.x + 0.05, y + 0.003, o.zFront - sgn * 0.42);
        g.add(lbl);
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd84a, ...ADD }));
        glow.position.set(o.x, 0.02, o.zLine);
        g.add(glow);
        scene.add(g);
        return { o, g, mats: [dimMat, lbl.material], glow };
      });
    }
    update(t, camera) {
      for (const m of this.marks) {
        const d = Math.hypot(camera.position.x - m.o.x, camera.position.z - m.o.zLine);
        const a = camera.position.y > 8 ? 0 : 1 - NAV.smoothstep(14, 28, d);
        m.g.visible = a > 0.01;
        for (const mat of m.mats) mat.opacity = a;
        m.glow.material.opacity = a * (0.35 + 0.2 * Math.sin(t * 3));
      }
    }
  }
  NAV.OverflowMarks = OverflowMarks;

  // ---- R3 on arrival: the stalls build themselves, each from its anchor, in a wave rolling out from where you stand ------
  // Returns a ticker; it reports true while any stall is still building.
  NAV.arrivalWave = function (holo, from, { delay = 0.5, perMetre = 0.028, dur = 1.9 } = {}) {
    const jobs = [...holo.entries.values()].map((h) => ({ h, t0: delay + Math.hypot(h.anchor.x - from.x, h.anchor.z - from.z) * perMetre }));
    for (const j of jobs) holo.setReveal(j.h, 0);
    let t = 0;
    return (dt) => {
      t += dt;
      let busy = false;
      for (const j of jobs) if (j.h.reveal < 1) { holo.setReveal(j.h, (t - j.t0) / dur); busy = true; }
      return busy;
    };
  };
})();
