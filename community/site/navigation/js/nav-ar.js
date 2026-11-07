// AR replays (S8): where a local shop's display stands past the yellow line, a scan replays how it got there. The view
// moves to the line in one flight; the goods first stand inside the line as a hologram, as before the bazaar; a scan
// sweeps over them; then they slide out to where the walk found them, the distance past the line counting up beside
// them, and turn solid again. A marker floats over the line wherever a replay waits. Parts of it reuse the S2 picks: the
// cyan line-art hologram (B), the dimension on the ground (M1).
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const XRAY = { transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending };
  const CYAN = 0x7ff3ff, GOLD = 0xffd84a;

  const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
  // the scan's floor: a fine grid that fades out from its middle
  const gridTex = () => canvasTex(512, 512, (g, w, h) => {
    g.strokeStyle = 'rgba(140, 245, 255, 0.9)'; g.lineWidth = 2;
    for (let k = 0; k <= 16; k++) { g.beginPath(); g.moveTo(k * w / 16, 0); g.lineTo(k * w / 16, h); g.moveTo(0, k * h / 16); g.lineTo(w, k * h / 16); g.stroke(); }
    g.globalCompositeOperation = 'destination-in';
    const r = g.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.5); r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  // the scan's sheet of light: bright along its foot, thinning upwards
  const scanTex = () => canvasTex(16, 256, (g, w, h) => {
    const l = g.createLinearGradient(0, h, 0, 0); l.addColorStop(0, 'rgba(160, 250, 255, 0.95)'); l.addColorStop(0.08, 'rgba(120, 240, 255, 0.45)'); l.addColorStop(1, 'rgba(120, 240, 255, 0)');
    g.fillStyle = l; g.fillRect(0, 0, w, h);
  });
  // the marker: a ring round "AR", a chevron pointing down at the line
  const markerTex = () => canvasTex(256, 320, (g, w) => {
    g.shadowColor = 'rgba(6, 10, 30, 0.8)'; g.shadowBlur = 14;
    g.strokeStyle = '#8ff6ff'; g.lineWidth = 12; g.beginPath(); g.arc(w / 2, 118, 92, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(10, 40, 60, 0.55)'; g.beginPath(); g.arc(w / 2, 118, 86, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8feff'; g.font = '700 84px Fredoka, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AR', w / 2, 122);
    g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(w / 2 - 34, 238); g.lineTo(w / 2 + 34, 238); g.lineTo(w / 2, 288); g.closePath(); g.fill();
  });
  // what the S0 log says the walk found, without its timestamps
  const noteOf = (e) => (e.overflow.note || '').replace(/\s*\(\d+(\.\d+)?\s*s\)/g, '').replace(/(\d)-(\d)/g, '$1–$2');

  class ArScenes {
    // marks: the M1 dimensions on the ground; the replay draws its own, so the spot's is put away while it plays
    constructor({ scene, camera, world, rig, data, marks }) {
      this.scene = scene; this.cam = camera; this.world = world; this.rig = rig; this.data = data; this.marks = marks;
      // the local displays whose goods stand past a line (S0): each has its goods as one mesh (nav-world)
      this.spots = world.overflow.filter((o) => o.mesh && o.e.kind === 'shop_extension');
      this.byId = new Map(this.spots.map((o) => [o.e.id, o]));
      const mt = markerTex();
      this.markers = this.spots.map((o) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, transparent: true, depthWrite: false, depthTest: false }));
        s.scale.set(0.46, 0.575, 1); s.position.set(o.x, 2.45, o.zLine); s.layers.set(NAV.LAYER.holo); s.userData.arId = o.e.id;
        scene.add(s);
        return s;
      });
      this.ray = new THREE.Raycaster(); this.ray.layers.set(NAV.LAYER.holo);
      this.grid = gridTex(); this.scan = scanTex();
      this.run = null;
      this.el = { bar: document.getElementById('arbar'), title: document.getElementById('ar-title'), text: document.getElementById('ar-text'), read: document.getElementById('arread') };
      document.getElementById('ar-replay').addEventListener('click', () => { if (this.run) this.play(this.run.o.e.id, { again: true }); });
      document.getElementById('ar-done').addEventListener('click', () => this.stop());
      NAV.arFor = (id) => this.idFor(id);
    }
    // the display with a replay for this entity: the display itself, or the one its shop runs
    idFor(id) {
      if (this.byId.has(id)) return id;
      const o = this.spots.find((s) => s.e.operator === id);
      return o ? o.e.id : null;
    }
    // the marker under a screen point, if any
    markerAt(cx, cy) {
      if (this.run) return null;
      this.ray.setFromCamera(new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1), this.cam);
      const hit = this.ray.intersectObjects(this.markers.filter((m) => m.visible), false)[0];
      return hit ? hit.object.userData.arId : null;
    }

    play(id, { again = false } = {}) {
      const o = this.byId.get(this.idFor(id)); if (!o) return;
      this.stop({ keepBar: true });
      const s = o.e.side === 'SW' ? 1 : -1, rig = this.rig;
      // the view: standing in the aisle 2.5 m off the line, a step to the side you came from, looking down at the goods
      if (!again) {
        if (rig.mode === 'auto') rig.stopAuto();
        const side = this.cam.position.x < o.x ? -1 : 1;
        const fp = { x: o.x + side * 1.8, z: o.zLine - s * 2.5 };
        const tx = o.x - fp.x, tz = o.zLine + s * 0.25 - fp.z, d = Math.hypot(tx, tz);
        rig.fp = { x: fp.x, z: fp.z, yaw: Math.atan2(-tx / d, -tz / d), pitch: -Math.atan2(NAV.EYE - 0.45, d) };
        rig.flyTo(rig.walkPose(), { duration: 1.6, then: 'walk' });
      }
      // the goods as a hologram: their edges and a faint fill, drawn over everything like an AR overlay
      const geo = o.mesh.geometry, ghost = new THREE.Group();
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 22), new THREE.LineBasicMaterial({ color: CYAN, ...XRAY, opacity: 0 }));
      const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x3fd8ff, ...XRAY, opacity: 0 }));
      ghost.add(edges, fill);
      const grid = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.grid, color: CYAN, ...XRAY, opacity: 0 }));
      grid.position.set(o.x, 0.03, o.zLine + s * 0.4);
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.4), new THREE.MeshBasicMaterial({ map: this.scan, color: CYAN, ...XRAY, opacity: 0, side: THREE.DoubleSide }));
      sheet.position.set(o.x, 1.2, o.zLine);
      const line = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.09).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: GOLD, ...XRAY, opacity: 0 }));
      line.position.set(o.x, 0.028, o.zLine);
      const dim = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffe07a, ...XRAY, opacity: 0 }));
      dim.position.set(o.x + 0.62, 0.032, o.zLine);
      const group = new THREE.Group(); group.add(ghost, grid, sheet, line, dim);
      group.traverse((m) => m.layers.set(NAV.LAYER.holo));
      this.scene.add(group);
      this.run = { o, s, t: again ? 1.0 : 0, group, ghost, edges, fill, grid, sheet, line, dim, inside: s * (o.past + 0.12), phase: '' };
      o.mesh.visible = true;
      this.el.title.textContent = o.e.name;
      this.el.bar.classList.add('on'); document.body.classList.add('arplay');
      this.phase('before');
      for (const m of this.markers) m.visible = false;
    }
    phase(p) {
      const r = this.run; if (!r || r.phase === p) return;
      r.phase = p;
      this.el.text.innerHTML = p === 'before'
        ? '<span class="lbl">Before the bazaar</span> The shop keeps its goods inside the yellow line.'
        : `<span class="lbl">During the bazaar</span> ${noteOf(r.o.e).replace(/&/g, '&amp;').replace(/</g, '&lt;')}`;
    }
    stop({ keepBar = false } = {}) {
      const r = this.run; if (!r) return;
      r.o.mesh.visible = true;
      this.scene.remove(r.group);
      r.group.traverse((m) => { if (m.material) m.material.dispose(); });
      r.edges.geometry.dispose(); r.grid.geometry.dispose(); r.sheet.geometry.dispose(); r.line.geometry.dispose(); r.dim.geometry.dispose();
      this.run = null;
      this.el.read.classList.remove('on');
      if (!keepBar) { this.el.bar.classList.remove('on'); document.body.classList.remove('arplay'); }
    }
    get active() { return !!this.run; }

    update(dt, time, { hideMarkers = false } = {}) {
      // markers: over the line, bobbing, gone from far off, from above and while a replay plays
      const walking = this.rig.mode === 'walk' || this.rig.mode === 'auto';
      for (const m of this.markers) {
        const o = this.byId.get(m.userData.arId), d = Math.hypot(this.cam.position.x - o.x, this.cam.position.z - o.zLine);
        const a = walking && !this.run && !hideMarkers ? 1 - NAV.smoothstep(14, 24, d) : 0;
        m.visible = a > 0.02; m.material.opacity = a;
        m.position.y = 2.45 + 0.05 * Math.sin(time * 2.2 + o.x);
      }
      const r = this.run; if (!r) return;
      r.t += dt;
      const mark = this.marks && this.marks.marks.find((m) => m.o === r.o);
      if (mark) mark.g.visible = false;
      const t = r.t, rm = NAV.state.reducedMotion, ss = NAV.smoothstep;
      // 0–1.6 s the flight; the goods turn to a hologram inside the line; 1.8–2.6 s the scan; 2.8–4.8 s they slide out
      // to where they stand; then they turn solid and the hologram fades
      const slide = rm ? (t > 2.8 ? 1 : 0) : NAV.ease(NAV.clamp((t - 2.8) / 2.0, 0, 1));
      const holo = ss(1.0, 1.5, t) * (1 - ss(5.0, 6.0, t));
      r.o.mesh.visible = !(t > 1.0 && t < 4.9);
      r.ghost.position.z = r.inside * (1 - slide);
      r.edges.material.opacity = holo * (0.85 + (t > 4.6 && t < 5.2 ? 0.6 : 0));
      r.fill.material.opacity = holo * 0.16;
      r.grid.material.opacity = 0.75 * ss(0.6, 1.6, t) * (1 - ss(7.0, 8.5, t));
      const sweep = NAV.clamp((t - 1.8) / 0.8, 0, 1);
      r.sheet.visible = sweep > 0 && sweep < 1 && !rm;
      r.sheet.position.z = r.o.zLine + r.s * (2.2 - 3.0 * sweep);
      r.sheet.material.opacity = 0.9 * Math.sin(Math.PI * sweep);
      r.line.material.opacity = (0.35 + 0.25 * Math.sin(time * 5)) * ss(1.0, 1.6, t);
      // the dimension grows from the line with the goods' front, its figure counting up beside it
      const past = r.o.past * slide, front = r.o.zLine - r.s * past;
      r.dim.scale.z = Math.max(0.001, past); r.dim.position.z = (r.o.zLine + front) / 2;
      r.dim.material.opacity = slide > 0 ? 0.95 : 0;
      this.phase(t < 4.8 ? 'before' : 'after');
      const p = new THREE.Vector3(r.o.x + 0.62, 0.3, front).project(this.cam), on = t > 2.8 && p.z < 1;
      this.el.read.classList.toggle('on', on);
      if (on) {
        this.el.read.style.transform = `translate(${((p.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px, ${((-p.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px)`;
        this.el.read.firstChild.textContent = `+${past.toFixed(2)} m`;
      }
      // walking well away from the replay ends it
      if (t > 2 && Math.hypot(this.cam.position.x - r.o.x, this.cam.position.z - r.o.zLine) > 9) this.stop();
    }
  }
  NAV.ArScenes = ArScenes;
})();
