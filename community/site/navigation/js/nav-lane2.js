// S6: the stretch from 28 to 46 m: the far ends of the lane mouth's two blocks (nav-mouth.js) and the mouth of the
// Little India Arcade's covered passage. Built from the frames at 212–370 s and 1100–1216 s.
// North-east: the garland and religious-goods shop, its blue board of bulb letters behind curtains of artificial
// garlands, white shelving of clay and brass deities, incense and round Om hangings, the ceiling hung thick with
// garlands; its display in the lane of garland rails, a red-covered table, polystyrene boxes and a steel worktable; the
// fresh-flower kiosk by the gap before 1 Campbell Lane (a hologram).
// South-west: the festival stalls of bags, jackets and thali plates, and of girls' frocks on a green platform
// (holograms); Jothi's racks on this side, shelving of painted clay deities and diyas under curtains of mango-leaf
// torans, and its counter of brass lamps on the five-foot way; the clothing shop in the block's last unit; the covered
// passage of small shops into the Arcade; J&G Exclusive's open-air tables of gold-foil rangoli stickers (a hologram).
// Where things stand is read from the frames; signs carry only the words the video shows.
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const { Kit, pick, ATLASES, N, tiles, cell, pack, GARLAND, BRASS, TERRA, PAINT, addGeo } = NAV.shopKit;
  const { NEF, SWF, NEB, SWB, GF, REC, at, V, board, canvasTex, fam } = NAV.blockKit;
  const { room, sideShelves, mannequin, patch, hennaGrid, meshTex, seq, IN } = NAV.laneKit;
  // the units this stretch builds: the garland shop on the NE side, the clothing shop by the covered passage on the SW
  for (const x of [28.5, 38.3]) NAV.mouth.open.add(x);
  const IDOL = [0xf06292, 0x4fc3f7, 0xffb74d, 0xa5d6a7, 0xfff3e0, 0xce93d8, 0xffd54f, 0x81c784, 0xef5350];

  // ---- shapes: a seated deity in painted clay or brass, a disc for round hangings, a small bloom for strung garlands ------------
  // the figure faces +z: a lotus plinth, crossed legs, body and shoulders, head and crown, a ring of halo behind; unit height
  addGeo('s6-idol', () => THREE.BufferGeometryUtils.mergeGeometries([new THREE.CylinderGeometry(0.32, 0.26, 0.12, 8).translate(0, 0.06, 0),
    new THREE.SphereGeometry(1, 8, 4).scale(0.3, 0.12, 0.22).translate(0, 0.2, 0), new THREE.CylinderGeometry(0.12, 0.17, 0.32, 8).translate(0, 0.42, 0),
    new THREE.CylinderGeometry(0.06, 0.06, 0.42, 6).rotateZ(Math.PI / 2).translate(0, 0.53, 0), new THREE.SphereGeometry(0.1, 6, 4).translate(0, 0.68, 0),
    new THREE.ConeGeometry(0.075, 0.16, 6).translate(0, 0.84, 0), new THREE.TorusGeometry(0.2, 0.025, 3, 12).translate(0, 0.7, -0.08)].map((g) => (g.index ? g.toNonIndexed() : g))));
  addGeo('s6-coin', () => new THREE.CylinderGeometry(1, 1, 1, 24).rotateX(Math.PI / 2));
  addGeo('s6-bloom', () => new THREE.OctahedronGeometry(1, 0));

  // ---- printed things: round Om hangings, Jothi's price cards, framed pictures ---------------------------------------------
  const sheet = (draw, seed) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const g = cv.getContext('2d'), s = 1024 / N, R = seq(seed);
    for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) draw(g, i * s, row * s, s, R, row * N + i);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  };
  const COL = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#d81b60', '#00897b'];
  // a ring of colours round an Om on a gold disc, beads of light round its rim
  const hangAtlas = () => hangAtlas.t || (hangAtlas.t = sheet((g, x, y, s, R) => {
    const cx = x + s / 2, cy = y + s / 2;
    g.fillStyle = '#d4af37'; g.beginPath(); g.arc(cx, cy, s * 0.5, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 4; k++) { g.fillStyle = COL[Math.floor(R() * COL.length)]; g.beginPath(); g.arc(cx, cy, s * (0.44 - k * 0.08), 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#fff3c4'; for (let p = 0; p < 14; p++) { const a = (p / 14) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * s * 0.37, cy + Math.sin(a) * s * 0.37, s * 0.022, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#fff8e1'; g.beginPath(); g.arc(cx, cy, s * 0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c62828'; g.font = `700 ${s * 0.21}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ॐ', cx, cy + s * 0.01);
  }, 641));
  // Jothi's card: its name in blue over the Tamil, on yellow; the price is left off
  const jothiAtlas = () => jothiAtlas.t || (jothiAtlas.t = sheet((g, x, y, s) => {
    g.fillStyle = '#f7d417'; g.fillRect(x, y, s, s); g.strokeStyle = '#1d3f9a'; g.lineWidth = 4; g.strokeRect(x + 4, y + 4, s - 8, s - 8);
    g.fillStyle = '#1d3f9a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${s * 0.26}px ${fam}`; g.fillText('JOTHI', x + s / 2, y + s * 0.3);
    g.font = `700 ${s * 0.2}px ${fam}`; g.fillText('ஜோதி', x + s / 2, y + s * 0.56);
    g.fillStyle = '#ffffff'; g.fillRect(x + s * 0.18, y + s * 0.72, s * 0.64, s * 0.16);
  }, 1));
  // pictures in gold frames: a figure seated in a halo, a lotus, an Om, a peacock's feather; no faces
  const picsAtlas = () => picsAtlas.t || (picsAtlas.t = sheet((g, x, y, s, R, k) => {
    g.fillStyle = '#b8862e'; g.fillRect(x, y, s, s); g.fillStyle = '#e8c25a'; g.fillRect(x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9);
    g.fillStyle = ['#1a237e', '#7b1f3a', '#004d40', '#4a148c', '#bf360c'][k % 5]; g.fillRect(x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8);
    const cx = x + s / 2, cy = y + s / 2, kind = k % 4;
    if (kind === 0) {
      g.fillStyle = '#ffd54f'; g.beginPath(); g.arc(cx, cy - s * 0.12, s * 0.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL[k % COL.length]; g.beginPath(); g.ellipse(cx, cy + s * 0.14, s * 0.22, s * 0.16, 0, Math.PI, 0); g.fill(); g.fillRect(cx - s * 0.22, cy + s * 0.14, s * 0.44, s * 0.12);
      g.fillStyle = '#f2c79a'; g.beginPath(); g.arc(cx, cy - s * 0.12, s * 0.09, 0, Math.PI * 2); g.fill();
    } else if (kind === 1) {
      g.fillStyle = '#f48fb1'; for (let p = 0; p < 7; p++) { const a = Math.PI + (p / 6) * Math.PI; g.beginPath(); g.ellipse(cx + Math.cos(a) * s * 0.16, cy + Math.sin(a) * s * 0.16, s * 0.06, s * 0.16, a + Math.PI / 2, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#2e7d32'; g.fillRect(cx - s * 0.3, cy + s * 0.12, s * 0.6, s * 0.05);
    } else if (kind === 2) { g.fillStyle = '#ffd54f'; g.font = `700 ${s * 0.45}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ॐ', cx, cy + s * 0.02); }
    else {
      g.fillStyle = '#00897b'; g.beginPath(); g.ellipse(cx, cy, s * 0.14, s * 0.3, 0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1e88e5'; g.beginPath(); g.ellipse(cx, cy - s * 0.08, s * 0.08, s * 0.1, 0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffd54f'; g.beginPath(); g.ellipse(cx, cy - s * 0.08, s * 0.04, s * 0.05, 0.3, 0, Math.PI * 2); g.fill();
    }
  }, 5));
  ATLASES['s6-hang'] = hangAtlas; ATLASES['s6-jothi'] = jothiAtlas; ATLASES['s6-pics'] = picsAtlas;
  const cellOf = (name) => (r) => [Math.floor(r() * N), Math.floor(r() * N), name];
  const hang = cellOf('s6-hang'), jothi = cellOf('s6-jothi'), pics = cellOf('s6-pics');

  // garlands hung from a rail, a tassel at each foot: along the lane (along 'x', from a0 to a1 at z = c) or across it (along
  // 'z', at x = c). Strung as small blooms, or as the pooja shop's flower clumps ('gseg') where they hang in front; clear:
  // [a, b] keeps the strings there above headroom, so the way in stays open
  function strings(K, r, along, a0, a1, c, y, len, step, { kind = 's6-bloom', gap = 0.045, size = 0.026, clear = null, headroom = 2.05 } = {}) {
    const P = (u, yy, w) => (along === 'x' ? [u, yy, w] : [w, yy, u]);
    K.rod(V(...P(a0, y + 0.02, c)), V(...P(a1, y + 0.02, c)), 0.012, 0xb9bec4);
    for (let u = Math.min(a0, a1) + 0.05; u < Math.max(a0, a1) - 0.04; u += step * (0.85 + r() * 0.3)) {
      let l = len[0] + r() * (len[1] - len[0]);
      if (clear && u > clear[0] && u < clear[1]) l = Math.min(l, y - headroom);
      const pal = pick(r, GARLAND), n = Math.max(2, Math.floor(l / gap)), w = c + (r() - 0.5) * 0.05, sec = 4 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) K.item(kind, P(u, y - 0.03 - k * gap, w), size * (0.85 + r() * 0.3), Math.floor(k / sec) % 3 === 2 ? pal[1] : pal[0], kind === 'gseg' ? [0, r() * 6.28, 0] : [r() * 6, r() * 6, 0]);
      K.item('cone', P(u, y - 0.06 - n * gap, w), [0.024, 0.08, 0.024], pal[1]);
    }
  }
  const CLUMPS = { kind: 'gseg', gap: 0.065, size: 0.035 };

  // ---- north-east: the garland and religious-goods shop -------------------------------------------------------------------
  // its blue board of yellow bulb letters; garlands hang over the start of its name, and only "…A'S ARTS" shows past them
  const bulbSign = () => canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#1d3f9a'; g.fillRect(0, 0, w, h);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const t = cv.getContext('2d');
    t.fillStyle = '#fff'; t.font = `800 ${h * 0.7}px ${fam}`; t.textAlign = 'right'; t.textBaseline = 'middle'; t.fillText("A'S ARTS", w * 0.95, h * 0.55);
    const px = t.getImageData(0, 0, w, h).data;
    g.fillStyle = '#ffd34d';
    for (let y = 6; y < h; y += 8) for (let x = 6; x < w; x += 8) if (px[(y * w + x) * 4 + 3] > 128) { g.beginPath(); g.arc(x, y, 3.1, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffe9a0'; for (let x = 8; x < w; x += 16) for (const y of [6, h - 6]) { g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill(); }
  });
  function garlandShop(K, r) {
    const R = room(K, NEF, 28.5, 34.0, NEB, { floor: 'tiles', tubes: 3 }), zs = R.zs;
    board(K, bulbSign(), 5.0, 0.62, V(31.25, 3.12, zs + 0.03), R.ry, 0.5);
    // garlands hung over the five-foot way in front of the sign, a curtain of them across the doorway, short over the way in
    strings(K, r, 'x', 28.7, 30.9, zs + 0.28, 3.42, [1.0, 1.5], 0.1);
    strings(K, r, 'x', 28.85, 33.7, zs - 0.12, 2.68, [0.9, 1.4], 0.11, { ...CLUMPS, clear: [30.4, 32.3] });
    for (const x of [29.0, 33.5]) {                                   // strings of a lemon and green chillies by the door
      for (let k = 0; k < 6; k++) K.item('cone', [x, 2.45 - k * 0.07, zs - 0.06], [0.012, 0.07, 0.012], 0x2e7d32, [Math.PI, 0, 0]);
      K.item('ball', [x, 2.0, zs - 0.06], 0.035, 0xf2d13a);
    }
    K.box(30.3, 32.3, 0.016, 0.026, -9.7, -8.6, 0xb3262a);           // the red mat inside the door
    // white shelving on both side walls: tubs of stock at the top; clay and brass deities and boxed incense and camphor below
    const fill = (face) => (y, room, xw, xf) => {
      const top = y > 2.2, xm = (xw + xf) / 2, rot = (face * Math.PI) / 2;
      for (let z = -11.15; z < -9.1; z += 0.3 + r() * 0.05) {
        if (top) { K.box(xw + face * 0.04, xw + face * 0.38, y, y + 0.2, z, z + 0.27, 0xe3eaee, 0.01); continue; }
        const k = r();
        if (k < 0.45) K.item('s6-idol', [xm, y, z + 0.14], Math.min(room * 0.85, 0.26) * (0.75 + r() * 0.25), pick(r, IDOL), [0, rot, 0]);
        else if (k < 0.8) { const l = Math.max(1, Math.min(4, Math.floor(room / 0.11))); for (let n = 0; n < l; n++) K.item('box', [xm, y + 0.05 + n * 0.105, z + 0.14], [0.3, 0.1, 0.24], 0xffffff, [0, 0, 0], cell(pick(r, ['incense', 'camphor', 'kumkum', 'red']), r)); }
        else K.item('s6-idol', [xm, y, z + 0.14], Math.min(room * 0.85, 0.2), BRASS, [0, rot, 0]);
      }
    };
    sideShelves(K, 28.65, 1, -11.3, -8.95, 2.75, 6, fill(1));
    sideShelves(K, 33.85, -1, -11.3, -8.95, 2.75, 6, fill(-1));
    // the back wall shelved to the ceiling: boxed incense and camphor, a row of brass lamps, tubs at the top
    K.box(28.7, 33.8, 0, 3.2, NEB + 0.15, NEB + 0.17, 0xf2f2ef);
    for (let k = 0; k < 7; k++) {
      const y = 0.1 + k * 0.45;
      K.box(28.7, 33.8, y - 0.012, y + 0.012, NEB + 0.17, NEB + 0.55, 0xf2f2ef);
      for (let x = 28.8; x < 33.6; x += 0.36) {
        if (k === 6) K.box(x, x + 0.34, y + 0.012, y + 0.22, NEB + 0.2, NEB + 0.5, 0xe3eaee, 0.01);
        else if (k === 4) K.item('lamp', [x + 0.17, y + 0.012, NEB + 0.36], 0.3, BRASS);
        else for (let n = 0; n < 3; n++) K.item('box', [x + 0.17, y + 0.07 + n * 0.11, NEB + 0.36], [0.32, 0.1, 0.3], 0xffffff, [0, 0, 0], cell(pick(r, ['incense', 'camphor', 'kumkum', 'red', 'green']), r));
      }
    }
    K.block(28.7, NEB, 33.8, NEB + 0.6);
    // a gondola down the middle: deities and brass lamps on both faces
    K.box(30.95, 31.05, 0, 1.5, -11.0, -9.85, 0xf2f2ef);
    for (const face of [-1, 1]) for (let k = 0; k < 4; k++) {
      const y = 0.12 + k * 0.42;
      K.box(31.0, 31.0 + face * 0.42, y - 0.01, y + 0.01, -11.0, -9.85, 0xf2f2ef);
      for (let z = -10.9; z < -9.95; z += 0.24) {
        if (r() < 0.8) K.item('s6-idol', [31.0 + face * 0.22, y + 0.01, z + 0.1], 0.24 + r() * 0.08, r() < 0.4 ? BRASS : pick(r, IDOL), [0, (face * Math.PI) / 2, 0]);
        else K.item('lamp', [31.0 + face * 0.22, y + 0.01, z + 0.1], 0.25, BRASS);
      }
    }
    K.block(30.55, -11.05, 31.45, -9.8);
    // round hangings of an Om in rings of colour, tasselled with bells, along the shelves' top edges
    for (const [xf, face] of [[29.07, 1], [33.43, -1]]) for (const z of [-9.4, -10.25, -11.0]) {
      K.item('s6-coin', [xf + face * 0.03, 2.28, z], [0.19, 0.19, 0.025], 0xffffff, [0, (face * Math.PI) / 2, 0], hang(r));
      for (let t = 0; t < 5; t++) {
        const zz = z + (t - 2) * 0.07;
        K.item('cone', [xf + face * 0.03, 2.0 - (t % 2) * 0.05, zz], [0.022, 0.09, 0.022], pick(r, [0xe53935, 0xf9a825, 0x43a047, 0xd4af37]), [Math.PI, 0, 0]);
        K.item('bell', [xf + face * 0.03, 1.9 - (t % 2) * 0.05, zz], 0.035, BRASS);
      }
    }
    // the counter on the right, a card reader on it; a standing fan; strings of rudraksha beads on a rod beside it
    K.box(32.75, 33.4, 0, 0.95, -10.4, -9.3, 0xf6f6f2, 0.02);
    K.box(32.9, 33.05, 0.95, 1.0, -9.9, -9.75, 0x2b2b2b); K.box(33.1, 33.3, 0.95, 1.05, -10.2, -9.95, 0xc62828);
    K.block(32.7, -10.45, 33.45, -9.25);
    K.cyl(32.45, 0, -11.0, 0.15, 0.03, 0x4a4a4a, { seg: 12 }); K.cyl(32.45, 0.03, -11.0, 0.015, 1.25, 0x4a4a4a, { seg: 6 });
    K.item('s6-coin', [32.45, 1.32, -10.95], [0.16, 0.16, 0.05], 0xd9dde2);
    K.block(32.25, -11.2, 32.65, -10.8);
    K.rod(V(32.6, 2.1, -9.1), V(32.6, 2.1, -10.5), 0.01, 0x8e6a49);
    for (let z = -9.2; z > -10.45; z -= 0.12) { const n = 10 + Math.floor(r() * 6); for (let b = 0; b < n; b++) K.item('bead', [32.6, 2.05 - b * 0.04, z], 0.018, pick(r, [0x6d3b1f, 0x8d5524, 0x5d2e12])); }
    // the ceiling hung thick with garlands, short enough to walk under
    for (const z of [-9.4, -10.2, -11.0]) strings(K, r, 'x', 29.1, 33.4, z, 3.22, [0.45, 0.85], 0.13);
  }
  // its display in the lane: left of the way in, the red-covered table at the front, rails of garlands behind it, boxes and
  // crates among them, the steel worktable at the back; right of it, stacked polystyrene boxes, a short rail of garlands,
  // a table of basins (S3a's boxes, crate of pots and bin of peacock feathers stand on the line in front)
  function garlandDisplay(K, r) {
    K.box(28.7, 31.0, 0, 0.8, -2.95, -2.25, 0xc62828, 0.02);
    for (let x = 28.8; x < 30.85; x += 0.3) {
      K.box(x, x + 0.26, 0.8, 0.83, -2.85, -2.35, pick(r, [0xffffff, 0xd9dde2]), 0.008);
      const pal = pick(r, GARLAND);
      for (let k = 0; k < 8; k++) K.item('gseg', [x + 0.05 + (k % 4) * 0.055, 0.86, -2.75 + Math.floor(k / 4) * 0.25], 0.032, pal[k % 3 === 2 ? 1 : 0], [Math.PI / 2, 0, r() * 6]);
    }
    K.block(28.65, -3.0, 31.05, -2.2);
    strings(K, r, 'x', 28.7, 31.85, -3.3, 2.42, [0.9, 1.35], 0.1, CLUMPS);
    strings(K, r, 'x', 28.7, 31.85, -4.4, 2.42, [0.8, 1.25], 0.11);
    for (const [x, z, n] of [[28.75, -3.75, 2], [29.35, -3.75, 1], [30.6, -3.9, 2]]) for (let k = 0; k < n; k++) K.box(x, x + 0.55, k * 0.32, k * 0.32 + 0.31, z, z - 0.4, 0xf6f6f2, 0.01);
    K.box(29.95, 30.45, 0, 0.3, -3.85, -3.45, 0xd8323a, 0.01);
    K.block(28.65, -4.6, 31.9, -3.05);
    K.box(28.9, 31.4, 0.86, 0.9, -6.25, -5.55, 0xc9cdd2);
    for (const x of [28.95, 31.35]) for (const z of [-6.2, -5.6]) K.box(x - 0.015, x + 0.015, 0, 0.86, z - 0.015, z + 0.015, 0xc9cdd2);
    for (let x = 29.1; x < 31.2; x += 0.42) {
      K.cyl(x + 0.18, 0.9, -5.9, 0.15, 0.1, pick(r, [0x1e88e5, 0xd8323a, 0x1e88e5]), { rt: 0.19, seg: 16 });
      for (let k = 0; k < 6; k++) K.item('ball', [x + 0.1 + (k % 3) * 0.07, 1.0, -5.95 + Math.floor(k / 3) * 0.1], 0.035, pick(r, [0xf9a825, 0xe53935, 0xf06292, 0xffffff]));
    }
    K.box(29.3, 29.8, 0, 0.3, -6.1, -5.7, 0xf2c21e, 0.01);
    K.block(28.85, -6.3, 31.45, -5.5);
    for (let k = 0; k < 3; k++) K.box(33.6, 34.15, k * 0.32, k * 0.32 + 0.31, -2.9, -2.5, 0xf6f6f2, 0.01);
    strings(K, r, 'x', 33.55, 34.4, -3.7, 2.4, [0.9, 1.3], 0.12, CLUMPS);
    K.box(33.55, 34.4, 0, 0.82, -5.4, -4.7, 0xc9cdd2, 0.01);
    for (const x of [33.75, 34.15]) K.cyl(x, 0.82, -5.05, 0.13, 0.09, 0x1e88e5, { rt: 0.17, seg: 14 });
    K.block(33.45, -5.5, 34.45, -2.4);
  }

  // ---- south-west: Jothi's racks on this side of the lane, its lamp counter, the clothing shop, the covered passage ---------
  function jothiRacks(K, r) {
    // shelving with blue uprights and yellow and white boards along the back of the tent: painted clay deities, pots and
    // kalash, cellophane stacks of painted diyas; Jothi's cards on the uprights (their prices left off)
    for (const [x0, x1] of [[40.1, 41.35], [41.45, 42.65]]) {
      const zf = 5.0, zb = 5.55;
      for (const x of [x0 + 0.02, x1 - 0.02]) for (const z of [zf + 0.02, zb - 0.02]) K.box(x - 0.022, x + 0.022, 0, 2.25, z - 0.022, z + 0.022, 0x1e4fb8);
      for (let k = 0; k < 5; k++) {
        const y = 0.12 + k * 0.5;
        K.box(x0, x1, y - 0.015, y + 0.015, zf, zb, k % 2 ? 0xf4f4f2 : 0xf2c21e);
        for (let x = x0 + 0.1; x < x1 - 0.08; x += 0.17) {
          const t = r();
          if (k === 4 || t < 0.4) K.item('s6-idol', [x, y + 0.015, zf + 0.25], 0.26 + r() * 0.08, pick(r, IDOL), [0, Math.PI, 0]);
          else if (t < 0.65) K.item(r() < 0.5 ? 'kalash' : 'pot', [x, y + 0.015, zf + 0.25], 0.16 + r() * 0.06, r() < 0.5 ? pick(r, PAINT) : pick(r, TERRA), [0, r() * 6, 0]);
          else pack(K, r, x, y + 0.015, zf + 0.25, 1.0);
        }
      }
      for (const y of [0.9, 1.55]) K.item('box', [x0 + 0.1, y, zf - 0.03], [0.16, 0.2, 0.01], 0xffffff, [0, 0, 0], jothi(r));
      K.block(x0, zf, x1, zb);
    }
    // pink-skirted tables at the front: trays and cellophane stacks of painted diyas; the way to the passage at their end
    for (const [x0, x1] of [[40.2, 41.85], [42.05, 42.65]]) {
      K.box(x0, x1, 0, 0.78, 2.15, 2.9, 0xf06292, 0.02);
      for (let x = x0 + 0.1; x < x1 - 0.08; x += 0.16) for (let z = 2.25; z < 2.85; z += 0.16) {
        if (r() < 0.55) pack(K, r, x, 0.78, z, 0.95);
        else K.item('disc', [x, 0.8, z], [0.06, 0.03, 0.06], pick(r, PAINT));
      }
      K.block(x0 - 0.05, 2.1, x1 + 0.05, 2.95);
    }
    // curtains of mango-leaf torans hung thick from the tent's frame, gold among the green; diamonds of mirror-work along
    // the front, tasselled
    const diamonds = [];
    for (let x = 40.45; x < 42.7; x += 0.62) diamonds.push(x);
    for (const z of [2.05, 3.0, 3.95, 4.75]) {
      K.rod(V(40.05, 2.45, z), V(42.75, 2.45, z), 0.01, 0xb9bec4);
      for (let x = 40.12; x < 42.7; x += 0.09 + r() * 0.03) {
        if (z < 2.5 && diamonds.some((d) => Math.abs(d - x) < 0.2)) continue;
        const n = 8 + Math.floor(r() * 7) - (z < 2.5 ? 3 : 0), gold = r() < 0.25;
        for (let k = 0; k < n; k++) K.item('leaf', [x, 2.42 - k * 0.075, z + (r() - 0.5) * 0.02], [0.11, 0.12, 1], gold || k % 5 === 4 ? 0xd4af37 : pick(r, [0x2e8b3a, 0x3f9a4a, 0x2a7a35]), [0, (k % 2 ? 0.6 : -0.6) + (r() - 0.5) * 0.3, k % 2 ? 0.35 : -0.35]);
      }
    }
    for (const x of diamonds) {
      K.item('box', [x, 2.1, 2.05], [0.3, 0.3, 0.015], 0xffffff, [0, 0, Math.PI / 4], patch(r, 'mirror'));
      for (let t = 0; t < 3; t++) K.item('cone', [x + (t - 1) * 0.06, 1.82 - (t % 2) * 0.04, 2.05], [0.02, 0.08, 0.02], pick(r, [0xe53935, 0xf9a825, 0xd4af37]), [Math.PI, 0, 0]);
      K.rod(V(x, 2.45, 2.05), V(x, 2.31, 2.05), 0.004, 0x333333, 4);
    }
    // on the five-foot way behind: the counter of brass lamps under strings of lights, against a blue cloth and a white grid,
    // crystal lamps from the beam, its yellow board
    const blue = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 2.0), NAV.toon(0x1a2f7a)); blue.rotation.y = Math.PI; blue.position.set(40.68, 1.7, 7.4); K.extra.push(blue);
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.3), NAV.toon(0xffffff, { map: meshTex(), alphaTest: 0.5, side: THREE.DoubleSide, ink: false }));
    grid.rotation.y = Math.PI; grid.position.set(40.68, 1.95, 7.33); K.extra.push(grid);
    K.box(40.1, 41.25, 0, 0.9, 6.95, 7.38, 0xf4f4f2, 0.02);
    for (let x = 40.22; x < 41.17; x += 0.19) K.item('lamp', [x, 0.9, 7.15 + (r() - 0.5) * 0.08], 0.22 + r() * 0.12, BRASS);
    const LIT = [0xffd54f, 0x80deea, 0xf48fb1].map((c) => NAV.toon(c, { emissive: c, emissiveIntensity: 1, ink: false })), BULB = new THREE.SphereGeometry(0.014, 6, 4);
    for (let k = 0; k < 4; k++) for (let x = 40.16; x < 41.2; x += 0.05) {
      const b = new THREE.Mesh(BULB, LIT[(k + Math.round(x * 20)) % 3]); b.position.set(x, 2.5 - k * 0.32 - 0.06 * Math.sin((x - 40.2) * 4), 7.28); K.extra.push(b);
    }
    for (let x = 40.28; x < 41.15; x += 0.29) for (let k = 0; k < 5; k++) K.item('bead', [x, 3.0 - k * 0.07, 7.1], 0.03, pick(r, [0xf3c4f0, 0xc5b3ff, 0xbfe9ff]));
    const tag = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#f7d417'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d3f9a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${h * 0.36}px ${fam}`; g.fillText('JOTHI', w / 2, h * 0.32); g.font = `700 ${h * 0.3}px ${fam}`; g.fillText('ஜோதி', w / 2, h * 0.72); });
    board(K, tag, 0.56, 0.28, V(40.68, 2.78, 7.3), Math.PI, 0.35);
    K.block(40.05, 6.95, 41.3, 7.48);
  }
  // the block's last unit, by the passage: a clothing shop of white and cream kurtas and shirts; its fascia's words are
  // not legible in the video, so the board is left plain
  function clothingShop(K, r) {
    const R = room(K, SWF, 38.3, 42.5, SWB, { tubes: 2 }), zs = R.zs;
    K.box(38.4, 42.4, 2.78, 3.38, zs - 0.06, zs - 0.03, 0xf2c94c);
    for (const xr of [38.8, 41.95]) {
      K.rod(V(xr, 1.85, 8.0), V(xr, 1.85, 11.3), 0.013, 0xc9ced3);
      for (const z of [8.0, 11.3]) K.rod(V(xr, 0, z), V(xr, 1.85, z), 0.016, 0xc9ced3);
      for (let z = 8.1; z < 11.25; z += 0.07 + r() * 0.03) { const l = 0.85 + r() * 0.35; K.item('box', [xr, 1.82 - l / 2, z], [0.44, l, 0.025], pick(r, [0xf6f3ec, 0xefe8d8, 0xfaf8f2, 0xe8dcc4, 0xf2c6d0]), [0, (r() - 0.5) * 0.2, 0]); }
      K.block(xr - 0.25, 7.95, xr + 0.25, 11.35);
    }
    K.box(39.2, 41.6, 0, 2.3, SWB - 0.2, SWB - 0.15, 0xf2f2ef);
    for (let k = 0; k < 6; k++) {
      const y = 0.2 + k * 0.38;
      K.box(39.2, 41.6, y - 0.01, y + 0.01, SWB - 0.55, SWB - 0.2, 0xf2f2ef);
      for (let x = 39.3; x < 41.45; x += 0.26) for (let l = 0; l < 2; l++) K.box(x, x + 0.22, y + 0.012 + l * 0.1, y + 0.1 + l * 0.1, SWB - 0.5, SWB - 0.24, pick(r, [0xf6f3ec, 0xefe8d8, 0xe8dcc4, 0xd7e3ef]));
    }
    K.block(39.2, SWB - 0.6, 41.6, SWB);
    mannequin(K, r, 40.2, 8.5, 'torso', 0xf6f3ec, 1, 0xf6f3ec);
  }
  // the covered passage into the Arcade (184–370 s): terracotta tiles, a pitched roof of green panels on dark trusses, a
  // white pier at its mouth with the NO CYCLING sign, the yellow wall on its NW side hung with garlands and the Arcade's
  // notices, and its small shops along the SE side: henna, houseware, garlands and hangings, pictures in gold frames
  const notices = () => canvasTex(1024, 256, (g, w, h) => {
    const items = [['NO BICYCLES', 'ALLOWED', 'bike'], ['NO', 'SMOKING', 'smoke'], ['NO', 'SPITTING', 'drop'], ['DUMPING OF BULK', 'ITEMS PROHIBITED', 'box']];
    items.forEach(([a, b, icon], k) => {
      const x = k * w / 4 + 8, cw = w / 4 - 16, cx = x + cw / 2;
      g.fillStyle = '#ffffff'; g.fillRect(x, 8, cw, h - 16);
      g.fillStyle = '#222'; g.strokeStyle = '#222'; g.lineWidth = 6;
      if (icon === 'bike') { for (const dx of [-26, 26]) { g.beginPath(); g.arc(cx + dx, 92, 20, 0, Math.PI * 2); g.stroke(); } g.beginPath(); g.moveTo(cx - 26, 92); g.lineTo(cx, 70); g.lineTo(cx + 26, 92); g.stroke(); }
      else if (icon === 'smoke') g.fillRect(cx - 40, 80, 80, 14);
      else if (icon === 'drop') { g.beginPath(); g.moveTo(cx, 55); g.quadraticCurveTo(cx + 26, 95, cx, 110); g.quadraticCurveTo(cx - 26, 95, cx, 55); g.fill(); }
      else g.fillRect(cx - 28, 66, 56, 46);
      g.strokeStyle = '#d32f2f'; g.lineWidth = 10; g.beginPath(); g.arc(cx, 85, 52, 0, Math.PI * 2); g.moveTo(cx - 37, 48); g.lineTo(cx + 37, 122); g.stroke();
      g.fillStyle = '#c62828'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 22px ${fam}`; g.fillText(a, cx, 172); g.fillText(b, cx, 204);
    });
  });
  const noCycling = () => canvasTex(256, 320, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#222'; g.lineWidth = 7; for (const dx of [-36, 36]) { g.beginPath(); g.arc(w / 2 + dx, 130, 26, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(w / 2 - 36, 130); g.lineTo(w / 2, 100); g.lineTo(w / 2 + 36, 130); g.stroke();
    g.strokeStyle = '#d32f2f'; g.lineWidth = 12; g.beginPath(); g.arc(w / 2, 115, 80, 0, Math.PI * 2); g.moveTo(w / 2 - 57, 59); g.lineTo(w / 2 + 57, 171); g.stroke();
    g.fillStyle = '#d32f2f'; g.fillRect(20, 228, w - 40, 64); g.fillStyle = '#ffffff'; g.font = `800 40px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NO CYCLING', w / 2, 262);
  });
  const yidara = () => canvasTex(1024, 192, (g, w, h) => { g.fillStyle = '#f2d23a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c62828'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${h * 0.5}px ${fam}`; g.fillText('YIDARA HENNA', w / 2, h * 0.54); });
  function passage(K, r) {
    const X0 = 42.5, X1 = 45.4, Z0 = 5.95, Z1 = 19.8, XS = 44.25, yE = 4.4, yR = 5.1, xm = (X0 + X1) / 2;
    const f = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), NAV.toon(0xffffff, { map: tiles() }));
    f.geometry.attributes.uv.array.forEach((v, k, a) => { a[k] = v * (k % 2 ? (Z1 - Z0) / 0.6 : (X1 - X0) / 0.6); });
    f.rotation.x = -Math.PI / 2; f.position.set(xm, 0.013, (Z0 + Z1) / 2); K.extra.push(f);
    // the roof: two slopes of green panels, dark trusses and ties, green-painted walls up to it, a beam across its mouth
    for (const [xa, xb, ya, yb] of [[X0, xm, yE, yR], [xm, X1, yR, yE]]) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([xa, ya, Z0, xb, yb, Z0, xb, yb, Z1, xa, ya, Z0, xb, yb, Z1, xa, ya, Z1], 3));
      K.add(g, 0x2f6b4f, THREE.DoubleSide);
    }
    for (let z = Z0 + 0.1; z < Z1; z += 1.9) { K.rod(V(X0 + 0.05, yE, z), V(xm, yR, z), 0.03, 0x2b2b2b); K.rod(V(xm, yR, z), V(X1 - 0.05, yE, z), 0.03, 0x2b2b2b); K.rod(V(X0 + 0.05, yE - 0.4, z), V(X1 - 0.05, yE - 0.4, z), 0.02, 0x2b2b2b); }
    K.rod(V(xm, yR, Z0), V(xm, yR, Z1), 0.03, 0x2b2b2b);
    K.box(X0 + 0.03, X0 + 0.09, GF, yE, Z0, Z1, 0x5f9f7a); K.box(45.29, 45.35, GF, yE, Z0 + 0.6, Z1, 0x5f9f7a);
    K.box(X0, X1, GF - 0.12, yE, Z0, Z0 + 0.25, 0x5f9f7a);
    for (let z = Z0 + 1.5; z < Z1; z += 2.4) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 1.2), NAV.toon(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1, ink: false })); t.position.set(43.4, 3.95, z); K.extra.push(t); }
    // the white pier at its mouth, its sign to the lane; the yellow wall beyond it, the Arcade's notices on it, garlands
    // hung along it, a red lantern on a stand below them
    K.box(42.4, 42.8, 0, GF, 7.3, 7.7, 0xf4f1ea); K.block(42.35, 7.25, 42.85, 7.75);
    board(K, noCycling(), 0.3, 0.38, V(42.6, 1.75, 7.28), Math.PI, 0.3);
    K.box(X0 + 0.03, X0 + 0.1, 0, GF, 7.7, Z1, 0xf2d36b); K.block(X0, 7.7, X0 + 0.15, Z1);
    board(K, notices(), 1.6, 0.4, V(X0 + 0.12, 1.85, 10.6), Math.PI / 2, 0.25);
    strings(K, r, 'z', 12.6, 19.4, X0 + 0.2, 2.7, [0.8, 1.5], 0.24);
    K.cyl(42.95, 0, 11.6, 0.03, 0.9, 0x2b2b2b, { seg: 6 }); K.cyl(42.95, 0.9, 11.6, 0.14, 0.42, 0xd32f2f, { rt: 0.11, seg: 14 });
    K.cyl(42.95, 0.88, 11.6, 0.15, 0.03, 0xd4af37, { seg: 14 }); K.cyl(42.95, 1.31, 11.6, 0.12, 0.03, 0xd4af37, { seg: 14 });
    K.block(42.75, 11.4, 43.15, 11.8);
    // the shops: a back wall, partitions, a fascia over each front with the ceiling behind it, goods to the front. They
    // begin past the depth of 2 Campbell Lane's five-foot way, which opens into the passage at its mouth.
    K.box(45.25, 45.35, 0, GF, 8.55, 19.7, IN);
    const UNITS = [[8.65, 10.4, 'henna'], [10.55, 13.0, 'house'], [13.15, 16.3, 'hang'], [16.45, 19.6, 'pics']];
    for (const [z0, z1, kind] of UNITS) {
      for (const z of [z0 - 0.08, z1]) K.box(XS, 45.3, 0, GF, z, z + 0.08, IN);
      K.box(XS - 0.02, XS + 0.02, 2.55, 2.95, z0, z1, kind === 'henna' ? 0xf2d23a : pick(r, [0xffffff, 0xf2d36b, 0x5f9f7a]));
      K.box(XS, XS + 0.1, 2.95, GF, z0, z1, 0xf2d36b);
      K.plane(45.3 - XS, z1 - z0, 0xf4f1ea, [(XS + 45.3) / 2, 2.9, (z0 + z1) / 2], [Math.PI / 2, 0, 0]);
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.06), NAV.toon(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1, ink: false })); t.position.set(44.8, 2.85, (z0 + z1) / 2); K.extra.push(t);
      strings(K, r, 'z', z0 + 0.1, z1 - 0.1, XS - 0.12, 2.5, kind === 'hang' ? [0.9, 1.5] : [0.5, 1.0], kind === 'hang' ? 0.11 : 0.16);
      if (kind === 'henna') {
        board(K, yidara(), 1.6, 0.3, V(XS - 0.04, 2.75, (z0 + z1) / 2), -Math.PI / 2, 0.45);
        const poster = canvasTex(256, 384, (g, w, h) => { g.fillStyle = '#c62828'; g.fillRect(0, 0, w, h); hennaGrid(g, 8, 8, w - 16, h - 16, 2, 3, 91); });
        board(K, poster, 0.6, 0.9, V(45.22, 1.6, z0 + 0.7), -Math.PI / 2, 0.3);
        K.box(XS, 44.65, 0, 0.85, z0 + 0.3, z1 - 0.3, 0xf6f6f2, 0.02);
        for (let z = z0 + 0.4; z < z1 - 0.4; z += 0.06) K.item('cone', [44.45, 0.92, z], [0.012, 0.13, 0.012], pick(r, [0x6d3b1f, 0x2e7d32, 0xc0c4c8]), [Math.PI, 0, 0]);
        for (let y = 0.4; y < 2.3; y += 0.45) { K.box(44.9, 45.25, y - 0.01, y + 0.01, z0 + 1.2, z1 - 0.1, 0xf2f2ef); for (let z = z0 + 1.3; z < z1 - 0.2; z += 0.14) K.item('box', [45.07, y + 0.06, z], [0.26, 0.1, 0.11], pick(r, [0x2e7d32, 0xc62828, 0xf9a825, 0x6d3b1f, 0xffffff])); }
      } else if (kind === 'house') {
        for (let y = 0.3; y < 2.6; y += 0.45) {
          K.box(44.75, 45.25, y - 0.01, y + 0.01, z0 + 0.1, z1 - 0.1, 0xf6f6f2);
          for (let z = z0 + 0.25; z < z1 - 0.2; z += 0.26) { if (r() < 0.55) K.item('pot', [45.0, y + 0.01, z], 0.2 + r() * 0.06, 0xc9cdd2, [0, r() * 6, 0]); else K.box(44.85, 45.15, y + 0.01, y + 0.18 + r() * 0.12, z - 0.1, z + 0.1, pick(r, [0xb3e5fc, 0xf8bbd0, 0xfff59d, 0xc8e6c9, 0xffffff]), 0.02); }
        }
        K.box(XS + 0.05, 44.7, 0, 1.1, z0 + 0.25, z0 + 0.8, 0xf4f4f2, 0.03);       // an air cooler by the door
        for (let y = 0.55; y < 1.0; y += 0.06) K.box(XS + 0.04, XS + 0.05, y, y + 0.025, z0 + 0.32, z0 + 0.73, 0x5f6b73);
        for (let k = 0; k < 4; k++) K.cyl(44.5, k * 0.06, z1 - 0.5, 0.18, 0.3, pick(r, [0x1e88e5, 0xe53935, 0x43a047]), { rt: 0.2, seg: 14 });
      } else if (kind === 'hang') {
        for (let z = z0 + 0.3; z < z1 - 0.2; z += 0.4) {
          for (let k = 0; k < 3; k++) K.item('plume', [44.75, 2.2 - k * 0.22, z], [0.1, 0.1, 0.1], 0xd32f2f);   // red plush hangings
          K.item('plume', [45.05, 1.6, z + 0.2], [0.12, 0.16, 0.12], pick(r, [0xd32f2f, 0xf9a825]));         // lanterns
          for (let k = 0; k < 7; k++) K.item('bead', [44.95, 2.4 - k * 0.08, z + 0.1], 0.025, pick(r, [0xe1f5fe, 0xf3e5f5, 0xfff8e1]));
        }
        K.box(XS, 44.6, 0, 0.8, z0 + 0.3, z1 - 0.3, 0x1e88e5, 0.02);
      } else {
        for (let z = z0 + 0.3; z < z1 - 0.3; z += 0.5) for (const y of [0.7, 1.3, 1.95]) K.item('box', [45.22, y + (r() - 0.5) * 0.08, z], [0.02, 0.42, 0.34], 0xffffff, [0, 0, 0], pics(r));
        for (let z = z0 + 0.2; z < z1 - 0.2; z += 0.45) K.item('box', [44.4, 0.5, z], [0.04, 0.5, 0.38], 0xffffff, [0, 0.1, 0], pics(r));
      }
    }
    K.block(XS - 0.05, 8.55, 45.4, 19.7);
  }

  // ---- festival stalls, rebuilt from their stills as holograms (nav-kit.js) ---------------------------------------------
  // NE-10: the fresh-flower kiosk (1109–1116 s): a white counter of loose petals, chrysanthemum heads, betel leaves and
  // lotus buds, a basin of husked coconuts; jasmine, rose, globe-amaranth and marigold garlands from its front beam; a
  // shelf of framed pictures on its white back board, a wire rack of clay pots, a clear plastic curtain at its far end
  function flowerKiosk(e, depth, sign) {
    const { Builder, rnd, seedOf, frontZ, eaveSign, garlandRail: hangStrings } = NAV.kit;
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 });
    eaveSign(B, sign);
    B.sheet(w - 0.02, 0xe8f4ff, { folds: 6, top: 2.3 });
    B.table(0.1, 0.18, w - 0.75, 0.75, 0.82, 0xf6f4ee, 0xf6f4ee);
    const heads = [], bags = [], leaves = [], buds = [], nuts = [], pots = [], beads = [], tassels = [];
    for (let lx = 0.25; lx < w - 0.85; lx += 0.12) for (let lz = 0.3; lz < 0.85; lz += 0.12) {
      const p = B.P(lx + (r() - 0.5) * 0.03, 0.86, lz), t = r();
      if (t < 0.5) heads.push([p.x, p.y, p.z, r() * 6, 0.9 + r() * 0.3]);
      else if (t < 0.75) bags.push([p.x, p.y - 0.01, p.z, r() * 6, 1]);
      else leaves.push([p.x, p.y - 0.02, p.z, r() * 6, 1]);
    }
    for (let k = 0; k < 7; k++) { const p = B.P(0.3 + k * 0.28, 0.9, 0.95 - (k % 2) * 0.08); buds.push([p.x, p.y, p.z, 0, 1]); }
    B.add('furniture', new THREE.CylinderGeometry(0.22, 0.17, 0.14, 16), 0x1e88e5, B.P(w - 0.45, 0.07, 1.2));
    for (let k = 0; k < 6; k++) { const p = B.P(w - 0.45 + ((k % 3) - 1) * 0.1, 0.18, 1.15 + Math.floor(k / 3) * 0.1); nuts.push([p.x, p.y, p.z, 0, 1]); }
    hangStrings(B, r, beads, tassels, 0.15, w - 0.15, 0.08, 2.32, 0.11, 0.85);
    B.box('furniture', w / 2, 1.2, d - 0.06, w - 0.2, 2.3, 0.03, 0xf4f4f0);
    B.box('furniture', w / 2, 2.0, d - 0.18, w - 0.3, 0.03, 0.22, 0xf4f4f0);
    for (let lx = 0.3; lx < w - 0.3; lx += 0.32) B.box('goods', lx, 2.15, d - 0.2, 0.26, 0.3, 0.03, 0xd9a441);
    for (const y of B.shelving(w - 0.62, 0.25, 0.5, 0.42, 1.3, 4, 0xf4f4f0)) for (let k = 0; k < 3; k++) { const p = B.P(w - 0.54 + k * 0.14, y + 0.05, 0.46); pots.push([p.x, p.y, p.z, 0, 1]); }
    for (let k = 0; k < 3; k++) B.box('furniture', 0.4 + k * 0.5, 0.15, d - 0.45, 0.45, 0.3, 0.32, 0x2e7d32);
    for (const lx of [w * 0.3, w * 0.7]) B.add('goods', new THREE.SphereGeometry(0.12, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xffffff, B.P(lx, 2.2, 0.6));
    B.instanced('beads', new THREE.IcosahedronGeometry(0.03, 0), 0xffffff, beads);
    B.instanced('tassels', new THREE.ConeGeometry(0.035, 0.1, 8), 0xffffff, tassels);
    B.instanced('heads', new THREE.IcosahedronGeometry(0.045, 0), 0xffffff, heads);
    B.instanced('bags', new THREE.BoxGeometry(0.11, 0.04, 0.09), 0xffffff, bags);
    B.instanced('leaves', new THREE.PlaneGeometry(0.1, 0.14).rotateX(-Math.PI / 2), 0xffffff, leaves);
    B.instanced('buds', new THREE.ConeGeometry(0.03, 0.09, 8), 0xffffff, buds);
    B.instanced('nuts', new THREE.IcosahedronGeometry(0.07, 1), 0xffffff, nuts);
    B.instanced('pots', new THREE.CylinderGeometry(0.06, 0.04, 0.09, 12), 0xffffff, pots);
    return B.finish();
  }
  // SW-08: bags, jackets and thali plates (222–232 s): embroidered jackets on high rails front and back, steel thali plates
  // in cellophane on hooks at the corner, shoulder bags and T-shirts on the front rail, a white grid of scarves, two rails of
  // stoles, a table of folded stoles, palazzo trousers on leg forms by the aisle
  function bagStall(e, depth, sign) {
    const { Builder, rnd, seedOf, frontZ, eaveSign } = NAV.kit;
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 });
    eaveSign(B, sign);
    const jackets = [], plates = [], bags = [], strands = [];
    for (const [lz, y] of [[0.12, 2.32], [d - 0.35, 2.3]]) {
      B.rod('furniture', B.P(0.1, y, lz), B.P(w - 0.1, y, lz), 0.012, 0xc9ced3);
      for (let lx = 0.75; lx < w - 0.3; lx += 0.42) { const p = B.P(lx, y - 0.36, lz); jackets.push([p.x, p.y, p.z, 0, 1]); }
    }
    for (const lx of [0.15, 0.45]) for (let k = 0; k < 6; k++) { const p = B.P(lx, 2.05 - k * 0.24, 0.1); plates.push([p.x, p.y, p.z, 0, 1]); }
    for (let k = 0; k < 5; k++) { const p = B.P(0.85 + k * 0.3, 1.62 - (k % 2) * 0.12, 0.16); bags.push([p.x, p.y, p.z, 0, 1]); }
    B.box('furniture', w - 0.55, 1.2, 0.95, 0.8, 1.6, 0.02, 0xf4f4f0);
    for (let k = 0; k < 7; k++) { const p = B.P(w - 0.88 + k * 0.11, 1.3, 0.92); strands.push([p.x, p.y, p.z, 0, 1, 0, 0.9]); }
    for (const lz of [1.7, 2.45]) {
      for (const lx of [0.3, w - 0.3]) B.rod('furniture', B.P(lx, 0, lz), B.P(lx, 1.7, lz), 0.016, 0xc9ced3);
      B.rod('furniture', B.P(0.3, 1.7, lz), B.P(w - 0.3, 1.7, lz), 0.013, 0xc9ced3);
      for (let lx = 0.38; lx < w - 0.35; lx += 0.07) { const p = B.P(lx, 1.2, lz); strands.push([p.x, p.y, p.z, 0, 1]); }
    }
    B.table(0.3, d - 1.1, w - 0.6, 0.55, 0.76, 0xf3efe8, null);
    for (let lx = 0.45; lx < w - 0.45; lx += 0.3) for (let k = 0; k < 3; k++) B.box('goods', lx, 0.8 + k * 0.05, d - 0.82, 0.26, 0.045, 0.3, 0xffffff);
    for (const lx of [w - 0.35, w - 0.75]) { B.add('goods', new THREE.CylinderGeometry(0.14, 0.2, 0.9, 12), 0xffffff, B.P(lx, 0.55, 0.45)); B.add('goods', new THREE.CylinderGeometry(0.13, 0.14, 0.12, 12), 0xffffff, B.P(lx, 1.06, 0.45)); }
    B.instanced('garments', new THREE.BoxGeometry(0.46, 0.62, 0.05), 0xffffff, jackets);
    B.instanced('plates', new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20).rotateX(Math.PI / 2), 0xffffff, plates);
    B.instanced('bags', new THREE.BoxGeometry(0.26, 0.3, 0.07), 0xffffff, bags);
    B.instanced('strands', new THREE.BoxGeometry(0.06, 1.0, 0.012), 0xffffff, strands);
    return B.finish();
  }
  // SW-09: girls' frocks and party wear (1204–1209 s): a raised platform carpeted green, frocks flared on their hangers along
  // high rails front and back, a rail of salwar and kurta sets, two mannequins by the aisle, a small counter at the back
  function frockStall(e, depth, sign) {
    const { Builder, rnd, seedOf, frontZ, eaveSign, rail, mannequin: form } = NAV.kit;
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 });
    eaveSign(B, sign);
    B.box('furniture', w / 2, 0.075, d / 2 + 0.1, w - 0.1, 0.15, d - 0.4, 0x2e7d32);
    B.box('furniture', w / 2, 0.075, 0.29, w - 0.1, 0.15, 0.02, 0x222222);
    const frocks = [], sets = [];
    for (const [lz, y] of [[d - 0.3, 2.3], [0.14, 2.32]]) {
      B.rod('furniture', B.P(0.1, y, lz), B.P(w - 0.1, y, lz), 0.012, 0xc9ced3);
      for (let lx = 0.3; lx < w - 0.25; lx += 0.36) { const p = B.P(lx, y - 0.34, lz); frocks.push([p.x, p.y, p.z, 0, 0.9 + r() * 0.2]); }
    }
    rail(B, sets, r, 0.35, w - 0.35, 1.9, 1.75, [0.9, 1.2]);
    form(B, r, 0.7, 0.15, 0.62); form(B, r, w - 0.7, 0.15, 0.62);
    B.table(w - 1.1, d - 1.2, 0.8, 0.5, 0.95, 0xf3efe8, 0xc62828);
    const frock = THREE.BufferGeometryUtils.mergeGeometries([new THREE.BoxGeometry(0.2, 0.22, 0.08).translate(0, 0.2, 0), new THREE.CylinderGeometry(0.08, 0.22, 0.38, 12).translate(0, -0.1, 0)].map((g) => g.toNonIndexed()));
    B.instanced('frocks', frock, 0xffffff, frocks);
    B.instanced('garments', new THREE.BoxGeometry(0.035, 0.8, 0.44), 0xffffff, sets);
    return B.finish();
  }
  // SW-11: J&G Exclusive (350–370 s), open-air, no tent: tables in pink and black cloth laid with gold-foil rangoli stickers
  // and packs of them, gold plates stacked at the back; the back board of decorations with its Happy Deepavali banner and
  // round rangoli, the E-invoice card at its corner
  function jgKiosk(e, depth) {
    const { Builder, rnd, seedOf, frontZ } = NAV.kit;
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B;
    B.table(0.15, 0.2, w - 0.3, 0.7, 0.78, 0xf06292, 0xe91e63);
    B.table(0.6, 1.45, w - 0.75, 0.7, 0.78, 0x1b1b1d, 0x1b1b1d);
    B.table(0.4, d - 1.05, w - 0.55, 0.55, 0.78, 0xf06292, 0xe91e63);
    const foils = [], packs = [], plates = [];
    for (const [lz0, lz1] of [[0.25, 0.85], [1.5, 2.1]]) for (let lx = 0.3; lx < w - 0.3; lx += 0.3) for (let lz = lz0; lz < lz1; lz += 0.28) {
      const p = B.P(lx + (r() - 0.5) * 0.05, 0.79 + r() * 0.02, lz + 0.1);
      (r() < 0.6 ? foils : packs).push([p.x, p.y, p.z, r() * 6, 0.9 + r() * 0.3]);
    }
    for (let lx = 0.6; lx < w - 0.3; lx += 0.32) for (let k = 0; k < 4; k++) { const p = B.P(lx, 0.8 + k * 0.03, d - 0.78); plates.push([p.x, p.y, p.z, 0, 1]); }
    B.box('furniture', (w + 0.4) / 2, 1.5, d - 0.15, w - 0.6, 1.6, 0.04, 0xf3e6c8);
    for (const lx of [0.45, w - 0.2]) B.rod('furniture', B.P(lx, 0, d - 0.18), B.P(lx, 2.35, d - 0.18), 0.02, 0xc9ced3);
    B.sign('Happy Deepavali', w / 2 + 0.2, 2.02, d - 0.19, 1.2, { bg: '#d32f2f', ink: '#ffe08a', h: 0.22 });
    for (let k = 0; k < 6; k++) B.add('goods', new THREE.CylinderGeometry(0.13, 0.13, 0.01, 20).rotateX(Math.PI / 2), 0xffffff, B.P(0.8 + (k * (w - 1.2)) / 5, 1.35 + (k % 2) * 0.25, d - 0.2));
    B.sign('J&G EXCLUSIVE', 0.75, 2.04, d - 0.19, 0.5, { bg: '#e91e63', ink: '#ffffff', h: 0.1 });
    B.sign('E-INVOICE AVAILABLE HERE', 0.75, 1.87, d - 0.19, 0.5, { bg: '#ffffff', ink: '#c2185b', h: 0.2 });
    B.instanced('foils', new THREE.CylinderGeometry(0.14, 0.14, 0.006, 20), 0xffffff, foils);
    B.instanced('packs', new THREE.BoxGeometry(0.3, 0.012, 0.22), 0xffffff, packs);
    B.instanced('plates', new THREE.CylinderGeometry(0.12, 0.1, 0.02, 18), 0xffffff, plates);
    return B.finish();
  }
  Object.assign(NAV.kit.custom, { 'NE-10': flowerKiosk, 'SW-08': bagStall, 'SW-09': frockStall, 'SW-11': jgKiosk });

  NAV.lane2 = {
    buildings: [],
    columns: () => false,
    build(root, grid) {
      const g = new THREE.Group(); g.name = 'lane2'; root.add(g);
      const glow = { lamp: 0x4a3410, bell: 0x4a3410 };
      const kits = {
        'NE-08': [2851, garlandShop, { soft: ['gseg', 'cone', 's6-bloom'], glow }], 'NE-09': [2852, garlandDisplay, { soft: ['gseg', 'cone', 's6-bloom'] }],
        'SW-10': [4001, jothiRacks, { soft: ['leaf', 'cone'], double: ['leaf'], glow }], swUnit: [3831, clothingShop, {}],
        'SW-12': [4251, passage, { soft: ['s6-bloom', 'cone', 'plume'], glow }],
      };
      const parts = {}, built = {};
      for (const [key, [seed, fn, o]] of Object.entries(kits)) {
        const K = (built[key] = new Kit(seed)); fn(K, K.r);
        parts[key] = K.build(g, o).map((m) => ({ m, role: 'look' }));
        for (const [x0, z0, x1, z1] of K.blocks) grid.fillRect(x0, z0, x1, z1);
      }
      // the lights: the garland shop's room and the display before it, Jothi's racks and lamp counter, the clothing shop,
      // the covered passage
      NAV.addLight([28.5, -0.5, -11.9], [34.0, 3.4, -8.3], 0xfff0dc, 1.15, 0.45);
      NAV.addLight([28.5, -0.5, -8.6], [34.5, 3.0, -1.9], 0xffe6c4, 0.55, 0.5);
      NAV.addLight([40.0, -0.5, 1.9], [43.0, 3.0, 7.5], 0xfff0dc, 0.55, 0.5);
      NAV.addLight([38.3, -0.5, 7.4], [42.5, 3.4, 11.9], 0xfff4e8, 1.05, 0.45);
      NAV.addLight([42.5, -0.5, 5.9], [45.4, 4.2, 19.8], 0xfff2e2, 0.95, 0.5);
      return {
        'NE-08': parts['NE-08'], 'NE-09': parts['NE-09'], 'SW-10': parts['SW-10'], 'SW-12': parts['SW-12'],
        // a shop is picked by its room (the passage by its length), a display by its goods as they stand
        box: { 'NE-08': new THREE.Box3(V(28.5, 0, NEB), V(34.0, GF, at(NEF, REC))), 'SW-12': new THREE.Box3(V(42.55, 0, 6.3), V(45.4, GF, 19.8)) },
        pick: { 'NE-09': built['NE-09'].pickBoxes(), 'SW-10': built['SW-10'].pickBoxes() },
      };
    },
  };
  NAV.detailed.push(NAV.lane2);
})();
