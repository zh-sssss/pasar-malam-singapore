// S4: the lane mouth at Serangoon Road, in the local look (nav-toon.js) with the shop toolkit (nav-shop.js).
// Built from the frames at 72–135 s and 1264–1281 s. North-east: the corner block at 56 Serangoon Road, a white
// two-storey building whose lane side is a tall plain wall over a long dark-green canvas awning; the beauty salon's lit
// posters at the corner; the snack shop's white shelving of big jars along the five-foot way, its wheeled cabinets of
// fruit and the cashier under a red and yellow parasol. South-west: the corner block at 54 Serangoon Road, white with
// red window frames and an ornate gable on its cut corner; Akshaya Jewellers behind its green and gold sign, and its two
// tents in the lane: costume jewellery on wooden racks and glass counters, gold-foil frames on shelves and tables.
// The blocks' other units keep closed fronts until their stages. Where things stand is read from the frames.
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const { Kit, pick, ATLASES, N, labelled, basket, shelfWall, tiles, BRASS, WOOD, STEEL } = NAV.shopKit;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const GF = 3.6, REC = 1.8;
  const WHITE = 0xf1ece4, TRIM = 0xe7e0d4, GREEN = 0x1f5a3a, DGREEN = 0x194a30, RED = 0xb3262a, GOLD = 0xd9a441, SILVER = 0xd5dbe2;

  // ---- printed things: gold-foil frames, the salon's posters ------------------------------------------------------------
  function framesAtlas() {
    if (framesAtlas.t) return framesAtlas.t;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const g = cv.getContext('2d'), s = 1024 / N;
    for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) {
      const x = i * s, y = row * s, k = row * N + i;
      // a dark wooden moulding, a gold relief panel, an arch and an ornament in raised gold; some on red velvet
      g.fillStyle = ['#3a2416', '#2b1a10', '#4a2c18'][k % 3]; g.fillRect(x, y, s, s);
      g.fillStyle = k % 4 === 3 ? '#a3181f' : '#7a5a2a'; g.fillRect(x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8);
      const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, '#f6dc8a'); gr.addColorStop(0.5, '#d9a441'); gr.addColorStop(1, '#f3d27a');
      g.fillStyle = gr; g.fillRect(x + s * 0.16, y + s * 0.16, s * 0.68, s * 0.68);
      g.strokeStyle = '#8a6420'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + s * 0.24, y + s * 0.8); g.lineTo(x + s * 0.24, y + s * 0.42); g.quadraticCurveTo(x + s * 0.5, y + s * 0.12, x + s * 0.76, y + s * 0.42); g.lineTo(x + s * 0.76, y + s * 0.8); g.stroke();
      g.fillStyle = '#b8862e';
      if (k % 3 === 0) { for (let p = 0; p < 8; p++) { const a = (p / 8) * Math.PI * 2; g.beginPath(); g.ellipse(x + s * 0.5 + Math.cos(a) * s * 0.1, y + s * 0.56 + Math.sin(a) * s * 0.1, s * 0.07, s * 0.035, a, 0, Math.PI * 2); g.fill(); } }
      else if (k % 3 === 1) { g.beginPath(); g.ellipse(x + s * 0.5, y + s * 0.6, s * 0.12, s * 0.17, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(x + s * 0.5, y + s * 0.38, s * 0.07, 0, Math.PI * 2); g.fill(); }
      else { for (let p = 0; p < 5; p++) { g.beginPath(); g.moveTo(x + s * 0.5, y + s * 0.74); g.quadraticCurveTo(x + s * (0.3 + p * 0.1), y + s * 0.5, x + s * (0.34 + p * 0.08), y + s * 0.32); g.stroke(); } }
      g.fillStyle = 'rgba(255, 250, 220, 0.35)'; g.fillRect(x + s * 0.2, y + s * 0.18, s * 0.06, s * 0.6);
    }
    const t = (framesAtlas.t = new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  ATLASES.frames = framesAtlas;
  const frameCell = (r) => [Math.floor(r() * N), Math.floor(r() * N), 'frames'];

  const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const fam = 'Fredoka, "Noto Sans Tamil", system-ui, sans-serif';
  // the beauty salon's lit posters: what it offers, in its pinks; no faces
  const posterTex = (word, hue) => canvasTex(256, 384, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `hsl(${hue}, 80%, 86%)`); gr.addColorStop(1, `hsl(${hue + 20}, 75%, 66%)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(w / 2, h * 0.38, w * 0.26, h * 0.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = `hsl(${hue + 10}, 70%, 45%)`; g.beginPath(); g.ellipse(w / 2, h * 0.38, w * 0.15, h * 0.11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.font = `700 34px ${fam}`; g.textAlign = 'center'; g.fillText(word, w / 2, h * 0.75);
    g.font = `600 20px ${fam}`; g.fillText('Dazzle', w / 2, h * 0.86);
  });
  const boardTex = (lines, o) => canvasTex(1024, Math.round(1024 * o.h / o.w), (g, w, h) => {
    g.fillStyle = o.bg; g.fillRect(0, 0, w, h);
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); }
    g.fillStyle = o.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(([text, size, y, font]) => {
      let px = Math.round(h * size); g.font = `700 ${px}px ${font || fam}`;
      while (g.measureText(text).width > w * 0.9 && px > 10) { px -= 2; g.font = `700 ${px}px ${font || fam}`; }
      g.fillText(text, w / 2, h * y);
    });
  });
  // a lit board, a poster or a sign: a plane with its own light, facing the lane (rotation ry)
  function board(K, tex, w, h, at, ry, glow = 0.5) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), NAV.toon(0xffffff, { map: tex, emissive: 0xffffff, emissiveIntensity: glow, unique: true }));
    m.material.emissiveMap = tex; m.position.copy(at); m.rotation.y = ry; K.extra.push(m);
    return m;
  }
  const glass = () => NAV.toon(0xcfe6ee, { opacity: 0.32 });

  // ---- shared parts of a shophouse block -------------------------------------------------------------------------------
  // fr: { x0, x1, zf (frontage line), s (+1: the building lies at larger z) }; zs is the shopfront line behind the five-foot way
  const at = (fr, d) => fr.zf + fr.s * d;
  // the five-foot way: tiled floor, ceiling under the upper floor, columns on the frontage line
  function fiveFootWay(K, fr, cols, colColour = 0xe9e4da) {
    const zs = at(fr, REC), w = fr.x1 - fr.x0;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, REC), NAV.toon(0xffffff, { map: tiles() }));
    floor.geometry.attributes.uv.array.forEach((v, k, a) => { a[k] = v * (k % 2 ? REC / 0.6 : w / 0.6); });
    floor.rotation.x = -Math.PI / 2; floor.position.set((fr.x0 + fr.x1) / 2, 0.014, (fr.zf + zs) / 2); K.extra.push(floor);
    K.plane(w, REC, 0xe4ddd2, [(fr.x0 + fr.x1) / 2, GF - 0.021, (fr.zf + zs) / 2], [Math.PI / 2, 0, 0]);
    for (const x of cols) {
      const zc = at(fr, 0.22);
      K.cyl(x, 0, zc, 0.19, GF - 0.3, colColour, { seg: 22 });
      K.box(x - 0.25, x + 0.25, 0, 0.12, zc - 0.25, zc + 0.25, 0xb9b4aa, 0.02);
      K.box(x - 0.25, x + 0.25, GF - 0.32, GF - 0.02, zc - 0.25, zc + 0.25, 0xd8d2c6, 0.02);
      K.block(x - 0.24, zc - 0.24, x + 0.24, zc + 0.24);
    }
  }
  // the upper floor over the five-foot way and the roof; windows are added per block
  function upper(K, fr, zb, top, colour, roof) {
    K.box(fr.x0, fr.x1, GF, top, fr.zf, zb, colour);
    K.box(fr.x0, fr.x1, GF - 0.02, GF + 0.32, at(fr, -0.12), at(fr, 0.02), TRIM, 0.02);       // beam over the five-foot way
    K.box(fr.x0, fr.x1, top, top + 0.22, at(fr, -0.16), at(fr, 0.3), TRIM, 0.02);             // cornice
    // a tiled roof rising from behind the cornice to a ridge along the block
    const zr = (fr.zf + zb) / 2, g = new THREE.BufferGeometry(), y0 = top + 0.15, yr = top + 1.7;
    g.setAttribute('position', new THREE.Float32BufferAttribute([fr.x0, y0, at(fr, 0.2), fr.x1, y0, at(fr, 0.2), fr.x1, yr, zr, fr.x0, y0, at(fr, 0.2), fr.x1, yr, zr, fr.x0, yr, zr,
      fr.x0, yr, zr, fr.x1, yr, zr, fr.x1, y0, zb, fr.x0, yr, zr, fr.x1, y0, zb, fr.x0, y0, zb], 3));
    K.add(g, roof, THREE.DoubleSide);
    const run = Math.abs(zr - at(fr, 0.2));
    for (let d = 0.35; d < run; d += 0.42) { const t = d / run, y = y0 + t * (yr - y0) + 0.03, z = at(fr, 0.2 + d); K.box(fr.x0, fr.x1, y, y + 0.04, z - 0.025, z + 0.025, 0x8c3d2f); }
  }
  // a French window on the upper floor, framed, with louvred shutters folded back
  function window2(K, fr, cx, frame, shutter, lit, w = 0.9, y0 = 4.3, y1 = 6.1) {
    const z = at(fr, -0.02), out = -fr.s;                     // out: towards the lane
    K.box(cx - w / 2 - 0.08, cx + w / 2 + 0.08, y0 - 0.12, y0, z, z + out * 0.1, TRIM, 0.015);
    for (const sx of [-1, 1]) K.box(cx + sx * (w / 2 + 0.03) - 0.04, cx + sx * (w / 2 + 0.03) + 0.04, y0, y1, z + out * 0.04, z - out * 0.02, frame);
    K.box(cx - w / 2 - 0.07, cx + w / 2 + 0.07, y1, y1 + 0.08, z + out * 0.04, z - out * 0.02, frame);
    K.box(cx - 0.02, cx + 0.02, y0, y1, z + out * 0.03, z - out * 0.01, frame);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), lit ? NAV.toon(0xffd9a0, { emissive: 0xffc070, emissiveIntensity: 0.55 }) : NAV.toon(0x2c3550));
    g.position.set(cx, (y0 + y1) / 2, z + out * 0.005); g.rotation.y = fr.s > 0 ? Math.PI : 0; K.extra.push(g);
    for (const sx of [-1, 1]) {
      const xa = cx + sx * (w / 2 + 0.08), xb = xa + sx * 0.46;
      K.box(xa, xb, y0, y1, z + out * 0.02, z + out * 0.06, shutter);
      for (let y = y0 + 0.08; y < y1 - 0.05; y += 0.09) K.box(xa + sx * 0.03, xb - sx * 0.03, y, y + 0.025, z + out * 0.06, z + out * 0.075, 0x2a2a2a);
    }
  }
  // the same window on a face at any angle: built in the face's frame (x along it, z out of it), then turned into place
  function faceWindow(K, px, pz, nx, nz, frame, shutter, lit, w = 0.9, y0 = 4.3, y1 = 6.1) {
    const M = new THREE.Matrix4().makeRotationY(Math.atan2(nx, nz)).setPosition(px, 0, pz);
    const part = (x0, x1, ya, yb, z0, z1, colour) => K.add(new THREE.BoxGeometry(x1 - x0, yb - ya, z1 - z0).translate((x0 + x1) / 2, (ya + yb) / 2, (z0 + z1) / 2).applyMatrix4(M), colour);
    part(-w / 2 - 0.08, w / 2 + 0.08, y0 - 0.12, y0, 0, 0.1, TRIM);
    for (const sx of [-1, 1]) part(sx * (w / 2 + 0.03) - 0.04, sx * (w / 2 + 0.03) + 0.04, y0, y1, -0.02, 0.04, frame);
    part(-w / 2 - 0.07, w / 2 + 0.07, y1, y1 + 0.08, -0.02, 0.04, frame);
    part(-0.02, 0.02, y0, y1, -0.01, 0.03, frame);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0).translate(0, (y0 + y1) / 2, 0.005).applyMatrix4(M), lit ? NAV.toon(0xffd9a0, { emissive: 0xffc070, emissiveIntensity: 0.55 }) : NAV.toon(0x2c3550));
    K.extra.push(g);
    for (const sx of [-1, 1]) {
      const xa = sx * (w / 2 + 0.08), xb = xa + sx * 0.46;
      part(Math.min(xa, xb), Math.max(xa, xb), y0, y1, 0.02, 0.06, shutter);
      for (let y = y0 + 0.08; y < y1 - 0.05; y += 0.09) part(Math.min(xa, xb) + 0.03, Math.max(xa, xb) - 0.03, y, y + 0.025, 0.06, 0.075, 0x2a2a2a);
    }
  }
  // a closed unit: a roller shutter under its fascia, until its own stage builds it
  function closedUnit(K, fr, x0, x1, zb) {
    const zs = at(fr, REC);
    K.box(x0, x1, 0, GF, zs, zb, WHITE);
    K.box(x0 + 0.15, x1 - 0.15, 0.02, 2.75, at(fr, REC - 0.02), at(fr, REC - 0.04), 0xb7bcc2);
    for (let y = 0.12; y < 2.7; y += 0.1) K.box(x0 + 0.15, x1 - 0.15, y, y + 0.015, at(fr, REC - 0.04), at(fr, REC - 0.05), 0x9aa0a6);
    K.box(x0 + 0.1, x1 - 0.1, 2.75, 3.05, at(fr, REC - 0.02), at(fr, REC - 0.2), 0xa9aeb4, 0.02);    // shutter box
    K.block(x0, Math.min(zs, zb), x1, Math.max(zs, zb));
  }

  // ---- north-east: 56 Serangoon Road ------------------------------------------------------------------------------------
  const NEF = { x0: 12.4, x1: 36.6, zf: -6.72, s: -1 }, NEB = -11.9;
  // the awning over the five-foot way changes colour with the shop: canvas green, teal, navy (logged at 82, 1232, 1216 s)
  const AWNINGS = [[12.4, 16.8, GREEN, DGREEN], [16.8, 23.5, 0x1d7470, 0x145550], [23.5, 28.5, 0x23305e, 0x1a2447], [28.5, 36.6, GREEN, DGREEN]];
  function northEast(K, r) {
    upper(K, NEF, NEB, 7.2, WHITE, 0xa54b3a);
    // the lane side is a tall plain wall, weathered in long grey streaks, with a few small windows and vents
    for (let k = 0; k < 9; k++) {
      const x = 13.5 + k * 2.6 + (r() - 0.5) * 0.8, w = 0.5 + r() * 1.4, y1 = 7.1 - r() * 0.4, y0 = y1 - 1.2 - r() * 2.0;
      K.box(x, x + w, y0, y1, NEF.zf - 0.006, NEF.zf - 0.004, pick(r, [0xd9d3c8, 0xcfc8bb, 0xe1dbd0]));
    }
    for (const x of [18.6, 24.2, 30.4]) {
      K.box(x - 0.4, x + 0.4, 5.0, 5.9, NEF.zf - 0.02, NEF.zf + 0.02, GREEN);
      const g = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.72), NAV.toon(0x2c3550)); g.position.set(x, 5.45, NEF.zf - 0.03); K.extra.push(g);
    }
    for (const x of [21.3, 27.4, 33.2]) { K.box(x - 0.25, x + 0.25, 6.3, 6.6, NEF.zf - 0.03, NEF.zf + 0.01, 0xcfd4d8); for (let k = 0; k < 4; k++) K.box(x - 0.22, x + 0.22, 6.33 + k * 0.07, 6.35 + k * 0.07, NEF.zf - 0.04, NEF.zf - 0.03, 0x8a9096); }
    // the street-name plate on the wall over the awning
    board(K, boardTex([['CAMPBELL LANE', 0.6, 0.55]], { w: 1.6, h: 0.32, bg: '#1d4f37', ink: '#ffffff', border: '#ffffff' }), 1.6, 0.32, V(14.2, 4.15, NEF.zf - 0.03), 0, 0.15);
    // the Serangoon Road end: green-framed windows and the salon's sign over the corner unit
    for (const z of [-8.3, -10.5]) {
      K.box(NEF.x0 - 0.06, NEF.x0 + 0.02, 4.3, 6.1, z - 0.5, z + 0.5, GREEN);
      const g = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.66), NAV.toon(0x2c3550)); g.position.set(NEF.x0 - 0.065, 5.2, z); g.rotation.y = -Math.PI / 2; K.extra.push(g);
    }
    fiveFootWay(K, NEF, [12.4, 17.23, 22.07, 26.92, 31.76, 36.6], 0xe9e4da);
    // the long dark-green canvas awning out over the edge of the five-foot way, its valance hemmed in a darker green
    const y0 = 3.3, y1 = 2.86, z0 = NEF.zf + 0.02, z1 = NEF.zf + 1.05;
    for (const [xa, xb, cloth, hem] of AWNINGS) {
      const aw = new THREE.BufferGeometry();
      aw.setAttribute('position', new THREE.Float32BufferAttribute([xa, y0, z0, xb, y0, z0, xb, y1, z1, xa, y0, z0, xb, y1, z1, xa, y1, z1], 3));
      K.add(aw, cloth, THREE.DoubleSide);
      K.box(xa, xb, y1 - 0.24, y1 + 0.01, z1 - 0.01, z1 + 0.01, hem);
    }
    for (let x = NEF.x0 + 0.3; x < NEF.x1; x += 2.4) K.rod(V(x, y1, z1), V(x, GF - 0.1, NEF.zf - 0.02), 0.012, 0x3a3d42, 4);
    // the units: the snack shop is open; the rest close their shutters until their stages
    for (const [xa, xb] of [[16.8, 23.5], [23.5, 28.5], [28.5, 34.0], [34.0, 36.6]]) if (!NAV.mouth.open.has(xa)) closedUnit(K, NEF, xa, xb, NEB);
    K.block(NEF.x0, NEB, NEF.x1, -11.7);
  }

  // big clear jars of snacks with coloured lids, packed two deep on white shelving facing the lane (face: +1 → +z)
  const SNACK = [0xe9b347, 0xd88a2f, 0xf2d27a, 0xc96a2a, 0xe7c66a, 0xb9522a, 0xf0e2b0, 0x9b6a3a];
  const LID = [0xd8323a, 0x2e8b57, 0xf2b632, 0x2d6fd6, 0xe86fa8];
  function jarShelf(K, r, x0, x1, zb, face, h = 2.15, levels = 6) {
    const d = 0.46, zfr = zb + face * d;
    for (const x of [x0 + 0.02, x1 - 0.02]) for (const z of [zb + face * 0.02, zfr - face * 0.02]) K.box(x - 0.018, x + 0.018, 0, h, z - 0.018, z + 0.018, 0xf2f2ef);
    K.box(x0, x1, 0, h, zb, zb + face * 0.015, 0xf2f2ef);                                   // back panel
    const ys = [];
    for (let k = 0; k < levels; k++) { const y = 0.08 + (k * (h - 0.2)) / (levels - 1); K.box(x0, x1, y - 0.012, y + 0.012, zb, zfr, 0xf6f6f2); ys.push(y + 0.012); }
    K.block(x0, Math.min(zb, zfr), x1, Math.max(zb, zfr));
    ys.forEach((y, k) => {
      const room = k < ys.length - 1 ? ys[k + 1] - y - 0.03 : 0.3, top = k === ys.length - 1;
      const big = room > 0.3 && r() < 0.7, jh = big ? 0.3 : Math.min(room - 0.04, 0.2), jr = big ? 0.075 : 0.06;
      for (let x = x0 + 0.1; x < x1 - 0.07; x += jr * 2 + 0.012) for (const dz of [0.12, 0.3]) {
        if (top && dz > 0.2) continue;
        const z = zb + face * dz, c = pick(r, SNACK);
        K.item('jar', [x, y, z], [jr * 2, jh, jr * 2], c);
        K.item('jar', [x, y + jh, z], [jr * 2.05, 0.035, jr * 2.05], pick(r, LID));
      }
    });
  }
  // fruit trays on top of a cabinet: mangoes, guavas, custard apples
  function fruit(K, r, x0, x1, y, z0, z1) {
    for (let x = x0 + 0.06; x < x1 - 0.05; x += 0.11) for (let z = Math.min(z0, z1) + 0.06; z < Math.max(z0, z1) - 0.05; z += 0.11) {
      const kind = r(), c = kind < 0.45 ? pick(r, [0xf2c13a, 0xe8a832, 0x9cc24a]) : kind < 0.75 ? pick(r, [0x9fcf5a, 0xb9d86a]) : 0x6f9a52;
      K.item('ball', [x + (r() - 0.5) * 0.02, y + 0.045, z + (r() - 0.5) * 0.02], kind < 0.45 ? [0.05, 0.04, 0.065] : [0.048, 0.045, 0.048], c, [0, r() * 6, 0]);
    }
  }
  // a beach parasol in red and yellow segments, on its pole
  function parasol(K, x, z, rad = 1.25, y = 2.45) {
    K.cyl(x, 0, z, 0.02, y + 0.15, 0xd9d9d9, { seg: 8 });
    for (let k = 0; k < 8; k++) K.add(new THREE.CylinderGeometry(0.02, rad, 0.42, 3, 1, true, (k / 8) * Math.PI * 2, Math.PI / 4).translate(x, y, z), k % 2 ? 0xf2c21e : 0xd8232a, THREE.DoubleSide);
  }
  // the snack shop's room: white shelving of jars on its back and side walls, up to the ceiling
  function snackShop(K, r) {
    const zs = at(NEF, REC);
    K.box(14.0, 14.15, 0, GF, zs, NEB, 0xf1e7d4); K.box(16.65, 16.8, 0, GF, zs, NEB, 0xf1e7d4);
    K.block(13.95, NEB, 14.2, zs); K.block(16.6, NEB, 16.85, zs);
    K.plane(2.5, Math.abs(NEB - zs), 0xf4f1ea, [15.4, 3.35, (zs + NEB) / 2], [Math.PI / 2, 0, 0]);
    for (const z of [-9.4, -10.8]) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.07), NAV.toon(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1, ink: false })); t.position.set(15.4, 3.3, z); K.extra.push(t); }
    jarShelf(K, r, 14.2, 16.6, NEB + 0.05, 1, 3.0, 8);
    shelfWall(K, r, 14.15, 1, zs - 0.4, NEB + 0.55, 3.0, 7, 3.35);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2.5, Math.abs(NEB - zs)), NAV.toon(0xffffff, { map: tiles() }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(15.4, 0.014, (zs + NEB) / 2); K.extra.push(floor);
  }
  // the beauty salon at the corner: its sign to Serangoon Road, lit posters in its pink glazing and on its corner
  function salon(K) {
    const zs = at(NEF, REC);
    K.box(12.4, 14.0, 0, GF, zs - 0.02, NEB, 0xf6e9f0);
    K.block(12.35, NEB, 14.05, zs + 0.05);
    K.box(12.45, 13.95, 0.02, 2.5, zs + 0.01, zs - 0.01, 0xf3c6da);                                 // its frosted pink glazing
    [['THREADING', 330], ['FACIAL', 300], ['HAIR', 340]].forEach(([word, hue], k) => board(K, posterTex(word, hue), 0.3, 0.45, V(12.6 + k * 0.42, 1.55, zs + 0.03), 0, 0.85));
    [['NAILS', 315], ['BRIDAL', 350]].forEach(([word, hue], k) => board(K, posterTex(word, hue), 0.36, 0.54, V(NEF.x0 - 0.04, 1.6, -7.7 - k * 0.48), -Math.PI / 2, 0.85));
    board(K, boardTex([['Dazzle', 0.5, 0.38], ['Beauty Salon', 0.32, 0.75]], { w: 2.4, h: 0.7, bg: '#fbe3ef', ink: '#c2185b', border: '#e91e63' }), 2.4, 0.7, V(NEF.x0 - 0.06, 3.15, -9.6), -Math.PI / 2, 0.55);
  }
  // the snack shop's display in the lane: jar shelving along the five-foot way, wheeled cabinets of fruit, the cashier
  function snackDisplay(K, r) {
    // two units of jar shelving facing the lane, a way between them to the shop
    jarShelf(K, r, 12.55, 14.45, NEF.zf - 0.55, 1, 2.15, 6);
    jarShelf(K, r, 15.45, 16.75, NEF.zf - 0.55, 1, 2.15, 6);
    // under the awning: wheeled white cabinets with glass tops, trays of fruit on top
    for (const [x0, x1] of [[12.7, 13.9], [14.0, 15.1]]) {
      K.box(x0, x1, 0.08, 0.92, -5.95, -5.35, 0xf6f6f2, 0.02);
      K.box(x0 + 0.04, x1 - 0.04, 0.6, 0.9, -5.36, -5.33, 0xbfe1ec);
      for (const x of [x0 + 0.08, x1 - 0.08]) for (const z of [-5.9, -5.4]) K.cyl(x, 0, z, 0.035, 0.08, 0x2b2b2b, { seg: 10 });
      K.box(x0 + 0.02, x1 - 0.02, 0.92, 0.95, -5.93, -5.37, 0xd9c08a);
      fruit(K, r, x0 + 0.04, x1 - 0.04, 0.95, -5.9, -5.4);
      K.block(x0, -5.98, x1, -5.3);
    }
    // the cashier's stand under the parasol: a small counter, a screen, a red basket
    K.box(16.45, 17.35, 0, 0.9, -4.75, -4.2, 0xf6f6f2, 0.02);
    K.box(16.6, 17.05, 0.9, 1.22, -4.65, -4.62, 0x2a2d33); K.box(16.76, 16.9, 0.9, 0.98, -4.66, -4.5, 0x2a2d33);
    basket(K, 17.05, 17.35, 0.9, 1.04, -4.65, -4.3, 0xd8323a);
    K.box(16.55, 16.8, 0.9, 0.96, -4.42, -4.25, 0x9aa0a6);                                        // the scale
    K.block(16.4, -4.8, 17.4, -4.15);
    parasol(K, 16.9, -4.45);
    // the rainbow-striped canopy hung under the awning's edge in front of the shelving
    const STRIPES = [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5, 0x8e24aa];
    for (let k = 0; k < 22; k++) K.box(12.5 + k * 0.19, 12.69 + k * 0.19, 2.42, 2.82, NEF.zf + 1.02, NEF.zf + 1.03, STRIPES[k % 6]);
  }

  // ---- south-west: 54 Serangoon Road ------------------------------------------------------------------------------------
  const SWF = { x0: 19.8, x1: 42.5, zf: 5.68, s: 1 }, SWB = 11.9;      // its back meets 52 Serangoon Road's front
  function southWest(K, r) {
    upper(K, SWF, SWB, 7.0, WHITE, 0xa54b3a);
    K.box(SWF.x0, SWF.x1, 6.95, 7.05, SWF.zf - 0.08, SWF.zf, RED);                                // red band under the cornice
    for (let k = 0; k < 9; k++) window2(K, SWF, 20.8 + k * 2.45, RED, 0x9c2f2a, k === 2 || k === 6);
    for (let x = SWF.x0; x <= SWF.x1 + 0.01; x += 4.54) K.box(x - 0.13, x + 0.13, GF + 0.32, 6.95, SWF.zf - 0.06, SWF.zf + 0.02, TRIM);
    // the cut corner: its own face to the junction, a red-and-white gable over it with a round emblem
    const c0 = V(16.6, 0, 8.6), c1 = V(19.8, 0, 5.5), mid = c0.clone().add(c1).multiplyScalar(0.5), len = c0.distanceTo(c1), ang = Math.atan2(c1.z - c0.z, c1.x - c0.x);
    // the cut corner's volume: the upper floor over the whole wedge; on the ground, a glazed corner window lit from inside
    // behind a five-foot way that follows the cut
    const wedge = (pts, y0, y1, colour) => {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: y1 - y0, bevelEnabled: false });
      g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return K.add(g, colour);
    };
    wedge([[16.55, 8.65], [19.8, 5.68], [19.8, SWB], [16.5, SWB]], GF, 7.0, WHITE);
    wedge([[16.5, 11.2], [19.8, 8.0], [19.8, SWB], [16.5, SWB]], 0, GF, WHITE);
    K.blockPoly([[16.4, 11.2], [19.85, 7.9], [19.85, 12.0], [16.4, 12.0]]);
    // red-framed windows on the cut face and on the Serangoon Road face
    faceWindow(K, (16.55 + 19.8) / 2 - 0.696 * 0.0, (8.65 + 5.68) / 2, -0.696, -0.718, RED, 0x9c2f2a, true);
    faceWindow(K, 16.5, 10.3, -1, 0, RED, 0x9c2f2a, false);
    const walkPts = [[16.6, 8.6], [19.8, 5.68], [19.8, 8.0], [16.5, 11.2]];
    const ffw = new THREE.ShapeGeometry(new THREE.Shape(walkPts.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2);
    const fu = ffw.attributes.uv, fp = ffw.attributes.position;
    for (let k = 0; k < fu.count; k++) fu.setXY(k, fp.getX(k) / 0.6, fp.getZ(k) / 0.6);
    const ffwMesh = new THREE.Mesh(ffw, NAV.toon(0xffffff, { map: tiles() })); ffwMesh.position.y = 0.014; K.extra.push(ffwMesh);
    const ceil = new THREE.ShapeGeometry(new THREE.Shape(walkPts.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(Math.PI / 2).translate(0, GF - 0.02, 0);
    K.add(ceil.scale(1, 1, -1), 0xe4ddd2, THREE.DoubleSide);
    // the corner window: glass on the inner line, a warm-lit display of gold behind it
    const w0 = V(16.5, 0, 11.2), w1 = V(19.8, 0, 8.0), wm = w0.clone().add(w1).multiplyScalar(0.5), wl = w0.distanceTo(w1), wa = Math.atan2(w1.z - w0.z, w1.x - w0.x);
    // (the wedge is solid, so the lit display sits just proud of its face, the glass a hand's width in front of that)
    const out = (d) => [wm.x + Math.sin(wa) * d, wm.z - Math.cos(wa) * d];
    const [gx, gz] = out(0.1), pane = new THREE.Mesh(new THREE.PlaneGeometry(wl - 0.4, 2.3), glass()); pane.position.set(gx, 1.35, gz); pane.rotation.y = -wa + Math.PI; K.extra.push(pane);
    const [fx0, fz0] = out(0.0); K.add(new THREE.BoxGeometry(wl - 0.2, 0.3, 0.14).rotateY(-wa).translate(fx0, 2.62, fz0), TRIM);            // its lintel
    const glowTex = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#fff3d6'; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 4; k++) { g.fillStyle = '#e9d9b8'; g.fillRect(0, 50 + k * 55, w, 6); }
      for (let k = 0; k < 28; k++) { g.fillStyle = k % 3 ? '#d9a441' : '#c9ccd2'; g.fillRect(10 + (k % 7) * 72, 18 + Math.floor(k / 7) * 55, 46, 30); }
    });
    const [bx, bz] = out(0.03); board(K, glowTex, wl - 0.5, 2.1, V(bx, 1.35, bz), -wa + Math.PI, 0.7);
    const gable = new THREE.Shape(); gable.moveTo(-len / 2, 0); gable.lineTo(len / 2, 0); gable.lineTo(len / 2, 0.5); gable.lineTo(0.3, 1.35); gable.lineTo(-0.3, 1.35); gable.lineTo(-len / 2, 0.5); gable.closePath();
    const gg = new THREE.ExtrudeGeometry(gable, { depth: 0.25, bevelEnabled: false }).translate(0, 0, -0.12).rotateY(-ang).translate(mid.x, 7.0, mid.z);
    K.add(gg, WHITE);
    const rim = new THREE.ExtrudeGeometry(gable, { depth: 0.04, bevelEnabled: false }).scale(1.04, 1.04, 1).translate(0, -0.02, 0.12).rotateY(-ang).translate(mid.x, 7.0, mid.z);
    K.add(rim, RED);
    const em = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 28).rotateX(Math.PI / 2).rotateY(-ang).translate(mid.x - Math.sin(ang) * 0.17, 7.75, mid.z - Math.cos(ang) * 0.17);
    K.add(em, 0xf7f3ea); K.add(new THREE.TorusGeometry(0.32, 0.03, 6, 28).rotateY(-ang).translate(mid.x - Math.sin(ang) * 0.2, 7.75, mid.z - Math.cos(ang) * 0.2), RED);
    fiveFootWay(K, SWF, [19.8, 24.34, 28.88, 33.42, 37.96, 42.5], 0xe9e4da);
    // the units: Akshaya is open; the rest keep closed fronts until their stages
    for (const [xa, xb] of [[25.0, 28.0], [28.0, 34.0], [34.0, 38.3], [38.3, 42.5]]) if (!NAV.mouth.open.has(xa)) closedUnit(K, SWF, xa, xb, SWB);
    K.block(SWF.x0, 12.2, SWF.x1, SWB);
  }
  // Akshaya Jewellers: the green and gold sign, glass counters of silver, wooden shelving of gold-foil frames behind
  function akshaya(K, r) {
    const zs = at(SWF, REC), x0 = 19.8, x1 = 25.0;
    K.box(x0, x0 + 0.15, 0, GF, zs, SWB, 0xf1e7d4); K.box(x1 - 0.15, x1, 0, GF, zs, SWB, 0xf1e7d4); K.box(x0, x1, 0, GF, SWB - 0.15, SWB, 0xf1e7d4);
    K.block(x0 - 0.05, zs, x0 + 0.2, SWB); K.block(x1 - 0.2, zs, x1 + 0.05, SWB);
    K.plane(x1 - x0, SWB - zs, 0xf4f1ea, [(x0 + x1) / 2, 3.3, (zs + SWB) / 2], [Math.PI / 2, 0, 0]);
    for (const x of [21.0, 22.4, 23.8]) for (const z of [9.0, 10.8]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 1.2), NAV.toon(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1, ink: false })); t.position.set(x, 3.25, z); K.extra.push(t); }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, SWB - zs), NAV.toon(0xf0ece4)); floor.rotation.x = -Math.PI / 2; floor.position.set((x0 + x1) / 2, 0.014, (zs + SWB) / 2); K.extra.push(floor);
    // the shopfront: piers, a glazed front either side of the door, the sign over it
    K.box(x0, x0 + 0.3, 0, GF, zs - 0.02, zs + 0.2, TRIM); K.box(x1 - 0.3, x1, 0, GF, zs - 0.02, zs + 0.2, TRIM); K.box(x0, x1, 2.7, GF, zs - 0.02, zs + 0.2, TRIM);
    K.block(x0, zs - 0.05, x0 + 0.35, zs + 0.25); K.block(x1 - 0.35, zs - 0.05, x1, zs + 0.25);
    board(K, boardTex([['AKSHAYA', 0.5, 0.36, 'Georgia, "Times New Roman", serif'], ['JEWELLERS PTE LIMITED', 0.24, 0.78, 'Georgia, "Times New Roman", serif']], { w: 4.2, h: 0.62, bg: '#145a32', ink: '#f2cf6a', border: '#d9a441' }), 4.2, 0.62, V((x0 + x1) / 2, 3.1, zs - 0.04), Math.PI, 0.4);
    for (const [a, b] of [[x0 + 0.3, 21.55], [23.25, x1 - 0.3]]) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 2.4), glass()); pane.position.set((a + b) / 2, 1.3, zs + 0.02); K.extra.push(pane);
      K.box(a, b, 0, 0.5, zs, zs + 0.06, 0x2b2b2b); K.block(a, zs - 0.03, b, zs + 0.1);
    }
    // inside: glass counters of silver plates, bowls and lamps; shelving of gold-foil frames on the walls
    for (const [a, b, z0, z1] of [[x0 + 0.3, x0 + 0.85, 8.2, 11.2], [x1 - 0.85, x1 - 0.3, 8.2, 11.2], [21.2, 23.6, 11.3, 11.85]]) {
      counter(K, r, a, b, z0, z1);
    }
    for (const xw of [x0 + 0.15, x1 - 0.15]) frameShelf(K, r, xw, xw < 22 ? 1 : -1, 8.4, 11.1);
    frameWall(K, r, 20.4, 24.4, SWB - 0.17, -1);
  }
  // a glass counter: black frame, glass top and front, silver goods inside and on top
  function counter(K, r, x0, x1, z0, z1) {
    K.box(x0, x1, 0, 0.35, z0, z1, 0x232323, 0.01);
    for (const x of [x0, x1]) for (const z of [z0, z1]) K.box(x - 0.015, x + 0.015, 0.35, 0.95, z - 0.015, z + 0.015, 0x232323);
    K.box(x0, x1, 0.94, 0.96, z0, z1, 0x232323);
    const top = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 0.03, 0.6, z1 - z0 - 0.03), glass()); top.position.set((x0 + x1) / 2, 0.65, (z0 + z1) / 2); K.extra.push(top);
    for (let x = x0 + 0.1; x < x1 - 0.08; x += 0.17) for (let z = z0 + 0.12; z < z1 - 0.1; z += 0.2) {
      const kind = r();
      if (kind < 0.4) K.item('disc', [x, 0.37, z], [0.07, 0.012, 0.07], SILVER);
      else if (kind < 0.7) K.item('lamp', [x, 0.36, z], 0.11, SILVER);
      else K.item('pot', [x, 0.36, z], 0.07, SILVER);
    }
    K.block(x0, z0, x1, z1);
  }
  // wooden shelving of gold-foil frames along a side wall (face: towards the shop's middle)
  function frameShelf(K, r, xw, face, z0, z1) {
    const xf = xw + face * 0.32;
    K.box(xw, xf, 0, 2.6, z0, z0 + 0.04, WOOD); K.box(xw, xf, 0, 2.6, z1 - 0.04, z1, WOOD); K.box(xw, xw + face * 0.02, 0, 2.6, z0, z1, 0x6e4e32);
    for (let k = 0; k < 6; k++) {
      const y = 0.3 + k * 0.4;
      K.box(xw, xf, y - 0.015, y + 0.015, z0, z1, WOOD);
      for (let z = z0 + 0.18; z < z1 - 0.14; z += 0.3) {
        const w = 0.24 + r() * 0.04, h = 0.3;
        K.item('box', [xw + face * 0.07, y + 0.015 + h / 2, z], [0.03, h, w], 0xffffff, [0, face > 0 ? 0 : Math.PI, -face * 0.12], frameCell(r));
      }
    }
    K.block(Math.min(xw, xf), z0, Math.max(xw, xf), z1);
  }
  // gold-foil frames hung on the back wall, a grid of them
  function frameWall(K, r, x0, x1, z, face) {
    for (let k = 0; k < 4; k++) for (let x = x0 + 0.2; x < x1 - 0.15; x += 0.34) K.item('box', [x, 1.1 + k * 0.42, z + face * 0.03], [0.28, 0.34, 0.03], 0xffffff, [0, 0, 0], frameCell(r));
  }
  // Akshaya's first tent in the lane (SW-01): costume jewellery
  function jewelleryTent(K, r) {
    // wooden earring racks marked NEW ARRIVAL, black tables of necklace sets, a glass counter
    for (const x of [17.6, 18.5]) {
      K.box(x - 0.03, x + 0.03, 0, 1.75, 4.6, 4.66, WOOD); K.box(x + 0.6, x + 0.66, 0, 1.75, 4.6, 4.66, WOOD);
      for (let k = 0; k < 6; k++) {
        const y = 0.75 + k * 0.17;
        K.box(x, x + 0.63, y, y + 0.018, 4.6, 4.66, 0x5e3f26);
        for (let e = 0; e < 9; e++) { const ex = x + 0.05 + e * 0.065; K.item('bell', [ex, y - 0.07, 4.57], [0.026, 0.05, 0.026], pick(r, [GOLD, 0xe8c25a, 0xc0392b, 0x2e8b57]), [Math.PI, 0, 0]); }
      }
      board(K, boardTex([['NEW ARRIVAL', 0.6, 0.55]], { w: 0.6, h: 0.16, bg: '#ffffff', ink: '#c62828' }), 0.6, 0.16, V(x + 0.33, 1.84, 4.56), Math.PI, 0.3);
      K.block(x - 0.05, 4.5, x + 0.7, 4.75);
    }
    // black-clothed tables: open boxes of necklace sets on red velvet
    for (const [a, b] of [[17.3, 19.2], [19.5, 21.3]]) {
      K.box(a, b, 0, 0.76, 2.2, 2.85, 0x1b1b1d, 0.02);
      for (let x = a + 0.15; x < b - 0.1; x += 0.24) for (const z of [2.36, 2.66]) {
        K.box(x - 0.1, x + 0.1, 0.76, 0.79, z - 0.1, z + 0.1, 0xa3181f, 0.008);
        K.item('torus', [x, 0.8, z + 0.02], [0.07, 0.07, 0.07], pick(r, [GOLD, 0xe8c25a, 0xd5dbe2]), [-Math.PI / 2, 0, Math.PI]);
        K.item('ball', [x, 0.8, z - 0.05], [0.012, 0.012, 0.012], pick(r, [0xc0392b, 0x2e8b57, 0xffffff]));
      }
      K.block(a, 2.15, b, 2.9);
    }
    counter(K, r, 19.6, 21.0, 3.6, 4.15);
  }
  // its second tent (SW-02): gold-foil frames on wooden shelving at the back, and on tables in black cloth and red velvet
  function framesTent(K, r) {
    for (let s = 0; s < 2; s++) {
      const a = 21.7 + s * 1.4, b = a + 1.3, z = 5.2;
      K.box(a, b, 0, 2.1, z, z + 0.04, WOOD);
      for (let k = 0; k < 5; k++) {
        const y = 0.25 + k * 0.42;
        K.box(a, b, y - 0.015, y + 0.015, z - 0.3, z, WOOD);
        for (let x = a + 0.15; x < b - 0.1; x += 0.27) K.item('box', [x, y + 0.17, z - 0.08], [0.24, 0.3, 0.03], 0xffffff, [-0.12, 0, 0], frameCell(r));
      }
      K.block(a, z - 0.32, b, z + 0.05);
    }
    for (const [a, b, z0, z1] of [[21.7, 24.3, 2.2, 3.0], [22.2, 23.9, 3.5, 4.2]]) {
      K.box(a, b, 0, 0.74, z0, z1, 0x1b1b1d, 0.02);
      for (let x = a + 0.16; x < b - 0.12; x += 0.3) for (let z = z0 + 0.16; z < z1 - 0.1; z += 0.3) {
        if (r() < 0.3) { K.box(x - 0.12, x + 0.12, 0.74, 0.79, z - 0.1, z + 0.1, 0xa3181f, 0.008); K.item('box', [x, 0.8, z], [0.18, 0.012, 0.13], 0xffffff, [0, (r() - 0.5) * 0.2, 0], frameCell(r)); }
        else K.item('box', [x, 0.86, z], [0.24, 0.22, 0.03], 0xffffff, [-0.5, (r() - 0.5) * 0.4, 0], frameCell(r));
      }
      K.block(a, z0 - 0.05, b, z1 + 0.05);
    }
  }

  // the lane mouth's blocks and shops; the world skips its own grey-box for these buildings and their columns
  // shared with the next stretch of the lane (nav-lane1.js), which builds the units it lists in NAV.mouth.open
  NAV.blockKit = { NEF, SWF, NEB, SWB, GF, REC, at, V, board, boardTex, canvasTex, posterTex, glass, fiveFootWay, upper, window2, faceWindow, closedUnit, jarShelf, fruit, parasol, counter, frameShelf, frameWall, WHITE, TRIM, GREEN, DGREEN, RED, GOLD, SILVER, fam };
  NAV.mouth = {
    open: new Set(),
    buildings: [176326920, 176326918],
    columns: (x, z) => (z < 0 ? x > NEF.x0 - 0.5 && x < NEF.x1 + 0.5 && Math.abs(z - (NEF.zf - 0.25)) < 0.6 : x > SWF.x0 - 0.5 && x < SWF.x1 + 0.5 && Math.abs(z - (SWF.zf + 0.25)) < 0.6),
    build(root, grid) {
      const g = new THREE.Group(); root.add(g);
      const glow = { lamp: 0x2a2a30, bell: 0x4a3410, torus: 0x4a3410 };
      // each shop its own kit, so the hover warms that shop alone; the blocks' shells belong to no shop
      const kits = {
        neBlock: [5601, northEast], swBlock: [5401, southWest], 'NE-01': [5603, salon], 'NE-02': [5602, snackShop], 'NE-03': [5604, snackDisplay],
        'SW-03': [5402, akshaya], 'SW-01': [5403, jewelleryTent], 'SW-02': [5404, framesTent],
      };
      const parts = {}, built = {};
      for (const [key, [seed, fn]] of Object.entries(kits)) {
        const K = (built[key] = new Kit(seed)); fn(K, K.r);
        parts[key] = K.build(g, { glow });
        for (const [x0, z0, x1, z1] of K.blocks) grid.fillRect(x0, z0, x1, z1);
        for (const pts of K.polys || []) grid.fillPolygon(pts);
      }
      // the lights: the snack shop's white tubes over its jars and fruit, the salon's pink, Akshaya's bright shop and tents
      NAV.addLight([12.4, -0.5, -12.0], [16.9, 3.4, -4.0], 0xfff2e0, 1.05, 0.5);
      NAV.addLight([12.3, -0.5, -9.6], [14.1, 3.2, -7.0], 0xffd6ec, 0.55, 0.4);
      NAV.addLight([19.9, -0.5, 7.4], [24.9, 3.35, 12.3], 0xfff4e6, 1.15, 0.45);
      NAV.addLight([17.0, -0.5, 1.9], [24.6, 3.0, 5.7], 0xfff0dc, 0.5, 0.5);
      NAV.addLight([16.4, -0.5, 5.6], [20.0, 3.3, 11.4], 0xffe9c8, 0.45, 0.6);
      const look = (list) => list.map((m) => ({ m, role: 'look' }));
      return {
        'NE-01': look(parts['NE-01']), 'NE-02': look(parts['NE-02']), 'NE-03': look(parts['NE-03']),
        'SW-03': look(parts['SW-03']), 'SW-01': look(parts['SW-01']), 'SW-02': look(parts['SW-02']),
        // a shop is picked by its room behind the five-foot way (so you can stand at its door and still aim at it)
        box: {
          'NE-01': new THREE.Box3(V(12.4, 0, NEB), V(14.0, GF, at(NEF, REC))), 'NE-02': new THREE.Box3(V(14.0, 0, NEB), V(16.8, GF, at(NEF, REC))),
          'SW-03': new THREE.Box3(V(19.8, 0, at(SWF, REC)), V(25.0, GF, SWB)),
        },
        // a display by its goods, as they stand; the snack display also by its parasol
        pick: {
          'NE-03': built['NE-03'].pickBoxes().concat(new THREE.Box3(V(15.65, 2.0, -5.7), V(18.15, 2.65, -3.2))),
          'SW-01': built['SW-01'].pickBoxes(), 'SW-02': built['SW-02'].pickBoxes(),
        },
      };
    },
  };
  NAV.detailed.push(NAV.mouth);
})();
