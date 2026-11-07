// Wires the navigation page together: renderer, world, rig, picking, routes, UI, arrival from the intro.
(function () {
  const NAV = window.NAV;

  NAV.main = function () {
    const THREE = window.THREE, data = window.NAV_DATA, S = NAV.state;
    S.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- renderer, scene, light ------------------------------------------------------------------------------
    // The scene renders into targets (nav-holo.js) and the composite antialiases nothing, so the canvas needs no MSAA.
    const host = document.getElementById('scene');
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.info.autoReset = false;           // one frame is several passes; count them together
    host.appendChild(renderer.domElement);
    // night: a dim blue sky and a weak moon; the warm light of the shops and tents comes from light zones (nav-toon.js)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1030);
    scene.fog = new THREE.Fog(0x10163a, 45, 200);
    scene.add(new THREE.HemisphereLight(0x6a78b8, 0x2a2228, 0.95));
    const moon = new THREE.DirectionalLight(0xa8b8ff, 0.35); moon.position.set(30, 80, -40); scene.add(moon);
    const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.08, 900);

    const holo = new NAV.Holo(renderer);
    const world = NAV.buildWorld(scene, data, holo);
    const rig = new NAV.Rig(camera, renderer.domElement, world);
    const ui = NAV.ui(data, world);
    if (NAV.reviews) NAV.reviews.load();          // reviews and offers from the Sheet, if one is set up (S9)
    const entityById = new Map(data.entities.map((e) => [e.id, e]));
    const marks = new NAV.OverflowMarks(scene, world.overflow);

    // ---- hover and selection looks ------------------------------------------------------------------------------
    // Holograms turn warm and the brackets lock on in the composite (H2); solid goods and shop rooms warm up here.
    for (const ent of world.entities.values()) for (const p of ent.parts) {
      const m = p.m.material;
      p.base = { opacity: m.opacity, emissive: m.emissive ? m.emissive.getHex() : null };
    }
    function style(id, level) {             // level 0 = rest, 1 = hover, 2 = selected
      const ent = world.entities.get(id); if (!ent) return;
      for (const p of ent.parts) {
        const m = p.m.material, b = p.base;
        if (p.role === 'pick') { m.opacity = [0, 0.12, 0.18][level]; p.m.visible = level > 0; }
        // things that light themselves (signs, tubes, lit panels) keep their own light
        if ((p.role === 'solid' || p.role === 'building' || p.role === 'look') && m.emissive && !b.emissive) m.emissive.setHex([b.emissive, 0x3a2a10, 0x5a3a12][level]);
      }
    }
    const boxOf = (id) => (id && world.entities.get(id) ? world.entities.get(id).box : null);
    const restyle = () => {
      for (const id of world.entities.keys()) style(id, id === S.selected ? 2 : id === S.hovered ? 1 : 0);
      holo.setHover(S.hovered, boxOf(S.hovered)); holo.setSelected(S.selected, boxOf(S.selected));
    };

    // ---- picking ------------------------------------------------------------------------------------------------
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function pick(cx, cy) {
      const arId = ar.markerAt(cx, cy);                           // an AR replay's marker over the line
      if (arId) return { entityId: arId, ar: arId };
      ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      // left of the before/after seam the festival's stalls and tents aren't there to pick
      const hits = ray.intersectObjects(world.pickables, false).filter((h) => !compare.absentAt(cx, entityById.get(h.object.userData.entityId)));
      const gp = new THREE.Vector3(), onGround = ray.ray.intersectPlane(ground, gp);
      const gd = onGround ? ray.ray.origin.distanceTo(gp) : Infinity;
      if (hits.length && hits[0].distance <= gd + 0.05) return { entityId: hits[0].object.userData.entityId };
      return onGround ? { ground: [gp.x, gp.z] } : null;
    }
    let hoverXY = null;
    renderer.domElement.addEventListener('pointermove', (ev) => { if (ev.pointerType !== 'touch') hoverXY = [ev.clientX, ev.clientY]; });
    renderer.domElement.addEventListener('pointerleave', () => { hoverXY = null; setHover(null); });
    renderer.domElement.addEventListener('pointerdown', () => ui.hint(false));
    function setHover(id, xy) {
      if (id !== S.hovered) { S.hovered = id; restyle(); }
      renderer.domElement.style.cursor = id ? 'pointer' : rig.mode === 'top' ? 'grab' : 'default';
      if (id && xy) ui.showTip(entityById.get(id), xy[0], xy[1]); else ui.hideTip();
    }

    // ---- selection, routes and walking ----------------------------------------------------------------------------
    // whenever the page shows something to press, hand the mouse back; closing it returns to mouse look
    let relock = false, lastUnlock = 0, pendingClick = null;
    // if the browser refuses mouse look, the click that asked for it walks to its spot instead
    NAV.on('lockError', () => {
      const hit = pendingClick; pendingClick = null;
      if (hit && hit.ground && (rig.mode === 'walk' || rig.mode === 'auto')) walkTo(hit.ground[0], hit.ground[1]);
    });
    function freeMouse() { if (rig.locked) { relock = true; rig.unlock(); } }
    function select(id, { route = false } = {}) {
      const e = entityById.get(id); if (!e) return;
      S.selected = id; restyle(); ui.showCard(e); freeMouse();
      if (route) routeTo(id);
    }
    function deselect({ resume = false } = {}) {
      S.selected = null; restyle(); ui.hideCard();
      if (resume && relock && !S.route) { relock = false; rig.lock(); }
    }

    // on foot the route is an AR trail (T2); from above it is a solid band
    const trail = new NAV.Trail(scene);
    // S8: the AR replays where goods cross the yellow line, and the before/after slider
    const ar = new NAV.ArScenes({ scene, camera, world, rig, data, marks });
    const compare = new NAV.Compare(holo, world, () => [...marks.marks.map((m) => m.g), trail.group, ...ar.markers]);
    const seamUI = NAV.compareUI(compare);
    function toggleCompare(on = !compare.on) {
      compare.on = on; seamUI.show(on); ui.setCompare(on);
      if (on) { freeMouse(); if (ar.active) ar.stop(); }
    }
    function playAr(id) {
      if (S.selected) deselect();
      if (compare.on) toggleCompare(false);
      freeMouse(); ar.play(id);
    }
    const routeTopMat = new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
    let routeTop = null, routePath = null, routeTarget = null;
    function ribbon(pts, width, mat, y) {
      const pos = [], uv = [], idx = [];
      let run = 0;
      for (let k = 0; k < pts.length; k++) {
        const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
        const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
        if (k) run += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
        pos.push(pts[k][0] + nx * width / 2, y, pts[k][1] + nz * width / 2, pts[k][0] - nx * width / 2, y, pts[k][1] - nz * width / 2);
        uv.push(run / 0.8, 1, run / 0.8, 0);
        if (k) { const o = (k - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      return new THREE.Mesh(g, mat);
    }
    function densify(path) {
      let pts = path;
      for (let pass = 0; pass < 3; pass++) {
        const out = [pts[0]];
        for (let k = 0; k < pts.length - 1; k++) {
          const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
          if (k > 0) out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
          if (k < pts.length - 2) out.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
        }
        out.push(pts[pts.length - 1]); pts = out;
      }
      const out = [pts[0]];
      for (let k = 1; k < pts.length; k++) {
        const [ax, az] = pts[k - 1], [bx, bz] = pts[k], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.3);
        for (let s = 1; s <= n; s++) out.push([ax + (bx - ax) * s / n, az + (bz - az) * s / n]);
      }
      return out;
    }
    function clearRoute() {
      if (routeTop) { scene.remove(routeTop); routeTop.geometry.dispose(); }
      trail.clear();
      routeTop = routePath = routeTarget = null; S.route = null; ui.clearRoute(); ui.setWalking(false);
    }
    function routeTo(id) {
      const ent = world.entities.get(id); if (!ent) return;
      clearRoute();
      const from = [rig.fp.x, rig.fp.z], to = ent.access;
      const path = world.grid.findPath(from[0], from[1], to[0], to[1]);
      if (!path) return;
      routePath = path; routeTarget = id; S.route = id;
      const dense = densify(path);
      trail.set(dense, ent.e.name);
      routeTop = ribbon(dense, 1.1, routeTopMat, 0.05); scene.add(routeTop);
      ui.setRoute(ent.e, NAV.pathLength(path));
      freeMouse();
    }
    function go() {
      if (!routePath) return;
      const id = routeTarget, ent = world.entities.get(id);
      const opts = { face: [ent.label[0], ent.label[2]], done: () => { clearRoute(); select(id); } };
      const path = () => world.grid.findPath(rig.fp.x, rig.fp.z, ent.access[0], ent.access[1]) || routePath;
      ui.setWalking(true);
      if (rig.mode === 'top') return rig.landOnto(path(), opts);           // one move: down onto the route and on along it
      if (rig.mode === 'fly') { const was = rig.fly.done; rig.fly.done = () => { if (was) was(); rig.follow(path(), opts); }; return; }
      if (!rig.follow(path(), opts)) ui.setWalking(false);
    }
    function walkTo(x, z) {
      const path = world.grid.findPath(rig.fp.x, rig.fp.z, x, z);
      if (!path) return;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.32, 32), ringMat.clone());
      ring.rotation.x = -Math.PI / 2; ring.position.set(path[path.length - 1][0], 0.035, path[path.length - 1][1]); scene.add(ring);
      const fade = () => { scene.remove(ring); ring.geometry.dispose(); };
      rig.follow(path, { speed: NAV.WALK * 1.15, done: fade });
      setTimeout(fade, 12000);
    }

    // ---- input from the scene and the UI -------------------------------------------------------------------------
    rig.onClick = (cx, cy, kind) => {
      ui.hint(false);
      if (kind === 'locked') {
        // mouse look: the crosshair picks. A stall opens its card (and frees the mouse); the ground is walked to.
        const hit = pick(innerWidth / 2, innerHeight / 2);
        if (!hit) return;
        if (hit.ar) return playAr(hit.ar);
        if (hit.entityId) return select(hit.entityId);
        if (rig.mode === 'walk' || rig.mode === 'auto') walkTo(hit.ground[0], hit.ground[1]);
        return;
      }
      const hit = pick(cx, cy);
      if (hit && hit.ar) return playAr(hit.ar);
      if (rig.mode === 'top') { if (!hit) return; if (hit.entityId) return select(hit.entityId); return rig.toWalk(hit.ground[0], hit.ground[1]); }
      if (hit && hit.entityId) return select(hit.entityId);
      if (kind === 'mouse' && rig.canLock) {                                      // click the view to look around
        relock = false; pendingClick = hit; rig.lock();
        return;
      }
      if (hit && (rig.mode === 'walk' || rig.mode === 'auto')) walkTo(hit.ground[0], hit.ground[1]);
    };
    NAV.on('pickFromList', (id) => {
      select(id, { route: true });
      if (matchMedia('(max-width: 720px)').matches) ui.toggleDir(false);
    });
    NAV.on('deselect', () => deselect({ resume: true }));
    NAV.on('dirOpen', freeMouse);
    NAV.on('lock', (on) => { pendingClick = null; ui.setLocked(on); if (!on) { lastUnlock = performance.now(); setHover(null); ui.setCrosshair(null); } });
    NAV.on('routeTo', (id) => { routeTo(id); if (matchMedia('(max-width: 720px)').matches) ui.hideCard(); });
    NAV.on('go', go);
    NAV.on('stopWalk', () => { rig.stopAuto(); ui.setWalking(false); });
    NAV.on('autoStopped', () => ui.setWalking(false));
    NAV.on('clearRoute', clearRoute);
    NAV.on('compare', () => toggleCompare());
    NAV.on('arPlay', playAr);
    let lockedBeforeTop = false;
    NAV.on('view', (v) => {
      if (v === 'top') { lockedBeforeTop = rig.locked; rig.unlock(); rig.toTop(); }
      else if (rig.mode === 'top') { rig.toWalk(); if (lockedBeforeTop) { lockedBeforeTop = false; setTimeout(() => rig.lock(), 0); } }
    });
    NAV.on('seeFromAbove', (id) => {
      const ent = world.entities.get(id); if (!ent) return;
      if (rig.mode !== 'top') rig.toTop();
      const go2 = () => { rig.topGoal = { x: ent.label[0], z: ent.label[2], h: 42 }; };
      if (rig.mode === 'fly') { const was = rig.fly.done; rig.fly.done = () => { if (was) was(); go2(); }; } else go2();
    });
    NAV.on('mode', (m) => { ui.setMode(m); if (m !== 'walk' && m !== 'auto') setHover(null); });
    addEventListener('keydown', (ev) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { if (ev.key === 'Escape') document.activeElement.blur(); return; }
      // the Esc that ends mouse look only frees the mouse; it doesn't also close the card
      if (ev.key === 'Escape') {
        if (performance.now() - lastUnlock < 300) return;
        if (ar.active) ar.stop(); else if (compare.on) toggleCompare(false); else if (S.selected) deselect(); else clearRoute();
      }
      if (ev.key === 'b' || ev.key === 'B') toggleCompare();
      if (ev.key === 't' || ev.key === 'T' || ev.key === 'm' || ev.key === 'M') NAV.emit('view', rig.mode === 'top' ? 'walk' : 'top');
      if (ev.key === '/') { ev.preventDefault(); ui.toggleDir(true); }
      if (rig.locked && (ev.code === 'KeyE' || ev.code === 'KeyN')) {
        const h = pick(innerWidth / 2, innerHeight / 2), id = h && h.entityId ? h.entityId : S.selected;
        if (id) (ev.code === 'KeyE' ? select(id) : (select(id), routeTo(id)));
      }
      if (ev.key === 'Enter' && S.route && document.activeElement === document.body) go();
      if (/^(Key[WASD]|Arrow)/.test(ev.code)) ui.hint(false);
    });
    if (matchMedia('(pointer: coarse)').matches) { document.body.classList.add('touch'); rig.bindJoystick(document.getElementById('joy'), document.getElementById('joy-knob')); }

    // ---- the walker's marker, seen from above ------------------------------------------------------------------------
    const marker = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }));
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.0, 3), new THREE.MeshBasicMaterial({ color: 0xff6a3d }));
    disc.rotation.x = -Math.PI / 2; arrow.rotation.x = -Math.PI / 2; arrow.position.y = 0.05;
    const arrowWrap = new THREE.Group(); arrowWrap.add(arrow); marker.add(disc, arrowWrap); marker.position.y = 0.06; scene.add(marker);

    // ---- detail by distance (S10) -----------------------------------------------------------------------------------
    // Goods (instanced) and small loose parts are most of the draws and triangles, and far down the lane they are a few
    // pixels across. On foot, those farther than DETAIL_R from the eye are not drawn; holograms' contents keep a little
    // longer. From above, only what stands out in the lane is drawn: what is under the roofs can't be seen anyway.
    const DETAIL_R = 34, HOLO_R = 46, detail = [];
    // not the moving marker, the pick boxes the hover shows, or the stalls' signs the arrival wave shows
    const keep = new Set(); marker.traverse((m) => keep.add(m)); for (const h of holo.entries.values()) for (const m of h.signs) keep.add(m);
    scene.traverse((o) => {
      if (!o.isMesh || keep.has(o) || !o.visible) return;
      const world = o.layers.isEnabled(NAV.LAYER.world), nd = o.layers.isEnabled(NAV.LAYER.nd);
      if (!world && !nd) return;
      o.updateMatrixWorld();
      let c, r;
      if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); c = o.boundingSphere.center.clone().applyMatrix4(o.matrixWorld); r = o.boundingSphere.radius; }
      else { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); r = o.geometry.boundingSphere.radius; if (r > 0.8) return; c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld); }
      if (r > 30) return;                                         // lane-long batches (S1's columns) stay
      detail.push({ o, c, r, R: nd ? HOLO_R : DETAIL_R });
    });
    let detailTick = 0;
    function updateDetail() {
      if (++detailTick % 4) return;                               // every fourth frame is plenty
      const p = camera.position, above = p.y > 12;
      for (const d of detail) {
        const on = above ? Math.abs(d.c.z) < 6.9 && d.c.y < 3.5 : Math.hypot(d.c.x - p.x, d.c.z - p.z) - d.r < d.R;
        if (on !== d.on) { d.on = on; d.o.visible = on; }
      }
    }

    // ---- loop ----------------------------------------------------------------------------------------------------
    let last = performance.now(), frames = 0, acc = 0, wave = null;
    const stats = { fps: 0, calls: 0, tris: 0 };
    // as the intro does: if the first seconds run slow, render at a lower pixel ratio (2, then 1.5, then 1).
    // ?pr=<n> fixes the ratio instead, for checks and recordings.
    const fixedPR = +new URLSearchParams(location.search).get('pr') || 0;
    if (fixedPR) { renderer.setPixelRatio(fixedPR); holo.resize(); }
    const quality = { n: 0, acc: 0, seen: 0, done: !!fixedPR };
    function adapt(dt) {
      if (quality.done || ++quality.seen < 60) return;
      quality.acc += dt; if (++quality.n < 90) return;
      const avg = quality.acc / quality.n, pr = renderer.getPixelRatio();
      quality.acc = 0; quality.n = 0;
      if (avg > 0.018 && pr > 1) { renderer.setPixelRatio(pr > 1.5 ? 1.5 : 1); renderer.setSize(innerWidth, innerHeight); holo.resize(); }   // below about 55 fps
      else quality.done = true;
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      adapt(dt);
      rig.update(dt);
      if (wave && !wave(dt)) wave = null;
      if (rig.locked && (rig.mode === 'walk' || rig.mode === 'auto')) {
        // mouse look: whatever sits under the crosshair is the hover target, named just below the crosshair
        const h = pick(innerWidth / 2, innerHeight / 2), id = h && h.entityId ? h.entityId : null;
        setHover(id, null); ui.setCrosshair(id ? entityById.get(id) : null);
      } else if (hoverXY && (rig.mode === 'walk' || rig.mode === 'top')) { const h = pick(hoverXY[0], hoverXY[1]); setHover(h && h.entityId ? h.entityId : null, hoverXY); }
      trail.update(now / 1000, rig.fp.x, rig.fp.z, camera.position.y);
      marks.update(now / 1000, camera);
      ar.update(dt, now / 1000, { hideMarkers: compare.on });      // after the marks: a replay puts its spot's away
      const above = rig.mode === 'top' || rig.mode === 'fly';
      marker.visible = above;
      if (routeTop) routeTop.visible = camera.position.y > 8;
      if (above) {
        marker.position.x = rig.fp.x; marker.position.z = rig.fp.z;
        marker.scale.setScalar(NAV.clamp(camera.position.y / 60, 1, 3.2));
        arrowWrap.rotation.y = rig.fp.yaw;
      }
      // the night haze closes in at eye level and opens out from above
      scene.fog.near = 45 + camera.position.y * 1.5; scene.fog.far = 200 + camera.position.y * 2.5;
      ui.updateLabels(camera, rig.mode, rig.top.h, THREE);
      renderer.info.reset();
      updateDetail();
      if (compare.on) compare.render(scene, camera, dt, now / 1000); else holo.render(scene, camera, dt, now / 1000);
      frames++; acc += dt;
      if (acc > 0.5) { stats.fps = Math.round(frames / acc); frames = 0; acc = 0; }
      stats.calls = renderer.info.render.calls; stats.tris = renderer.info.render.triangles;
      requestAnimationFrame(frame);
    }
    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); holo.resize();
      if (rig.mode === 'top') rig.topGoal.h = Math.max(rig.topGoal.h, 20);
    });
    ui.setMode('walk');
    requestAnimationFrame(frame);

    // ---- arrival: the page opens on the colour the intro whites out to, then the walk settles in -------------------
    // As the veil lifts, the festival stalls build themselves from their anchors on the yellow lines (R3).
    const veil = document.getElementById('veil');
    if (!S.reducedMotion) wave = NAV.arrivalWave(holo, { x: 0, z: 0 });
    requestAnimationFrame(() => {
      document.body.classList.add('ready');
      veil.classList.add('out');
      rig.arrive();
      setTimeout(() => ui.hint(true), 2300);
      setTimeout(() => ui.hint(false), 9000);
    });
    document.getElementById('back').addEventListener('click', (ev) => {
      const fromIntro = !document.referrer || document.referrer.includes('/intro/');
      if (history.length > 1 && fromIntro) { ev.preventDefault(); history.back(); }
    });

    // hooks for headless checks
    window.__nav = {
      stats, rig, world, holo, select, routeTo, go, clearRoute, deselect, setHover: (id) => { S.hovered = id; restyle(); },
      wave: (opts) => { wave = NAV.arrivalWave(holo, { x: rig.fp.x, z: rig.fp.z }, opts); },
      skipWave: () => { wave = null; for (const h of holo.entries.values()) holo.setReveal(h, 1); },
      top: () => rig.toTop(), walk: () => rig.toWalk(),
      compare: (on) => toggleCompare(on), seam: (v) => seamUI.setSeam(v), ar, playAr,
      pose: (x, z, yaw) => { rig.fly = null; rig.auto = null; rig.mode = 'walk'; rig.fp = { x, z, yaw, pitch: -0.02 }; rig.applyWalk(); ui.setMode('walk'); },
      settle: () => { if (rig.fly) { rig.fly.t = 1; rig.updateFly(0); } },
    };
  };
})();
