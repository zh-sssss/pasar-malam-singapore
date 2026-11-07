// S5: the next stretch of the lane, 16–35 m from Serangoon Road, in the same blocks as the lane mouth (nav-mouth.js).
// Built from the frames at 140–208 s and 1213–1240 s. North-east: Sathish Trading, a greengrocer behind about 7 m of
// tall white fruit racks under a teal awning; the bangle shop, narrow and stacked to the ceiling with boxes of bangles,
// and its display in the lane of wire racks and mesh boards of bindi cards and hair accessories, lit green at one end.
// South-west: Lotus Mantra's henna station with its boards of henna designs and the red banner of what the shop sells,
// its clothing racks of patchwork skirts, kurtas and mirror-work vests, and the LOTUSMANTRA tailoring shop behind,
// its yellow sign over a door between two walls of juttis. The festival snack stall between them is a hologram from the
// stall kit (nav-kit.js). Where things stand is read from the frames; signs carry only the words the video shows.
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const { Kit, pick, ATLASES, N, tiles, WOOD } = NAV.shopKit;
  const { NEF, SWF, NEB, SWB, GF, REC, at, V, board, boardTex, canvasTex, glass, counter, TRIM, fam } = NAV.blockKit;
  const IN = 0xf1e7d4, WHITE = 0xf4f4f2;
  // the units this stretch builds; the lane mouth leaves them open
  for (const x of [16.8, 23.5, 28.0]) NAV.mouth.open.add(x);

  // ---- printed things: cards of bindis and hair clips; patchwork, mirror-work, block prints ------------------------------
  const seq = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  function cardsAtlas() {
    if (cardsAtlas.t) return cardsAtlas.t;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const g = cv.getContext('2d'), s = 1024 / N;
    const COL = ['#e53935', '#8e24aa', '#1e88e5', '#43a047', '#fdd835', '#fb8c00', '#d81b60', '#3949ab', '#00897b'];
    for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) {
      const x = i * s, y = row * s, k = row % 3;
      g.fillStyle = k === 2 ? '#2b2b2b' : '#fbf8f2'; g.fillRect(x, y, s, s);
      g.fillStyle = COL[(row + i) % COL.length]; g.fillRect(x, y, s, s * 0.16);                       // the card's printed band
      if (k === 0) {                                                                                    // bindis in rows
        for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) { g.fillStyle = COL[(a + b + i) % COL.length]; g.beginPath(); g.arc(x + s * (0.17 + a * 0.165), y + s * (0.32 + b * 0.17), s * 0.035, 0, Math.PI * 2); g.fill(); }
      } else if (k === 1) {                                                                             // hair clips and bands
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { g.fillStyle = COL[(a * 3 + b + row) % COL.length]; g.beginPath(); g.ellipse(x + s * (0.25 + a * 0.25), y + s * (0.36 + b * 0.22), s * 0.09, s * 0.04, 0.4, 0, Math.PI * 2); g.fill(); }
      } else {                                                                                          // earrings on black velvet
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) {
          g.fillStyle = '#e8c25a'; g.beginPath(); g.arc(x + s * (0.25 + a * 0.25), y + s * (0.4 + b * 0.3), s * 0.06, 0, Math.PI * 2); g.fill();
          g.fillStyle = COL[(a + b + i) % COL.length]; g.beginPath(); g.arc(x + s * (0.25 + a * 0.25), y + s * (0.4 + b * 0.3), s * 0.025, 0, Math.PI * 2); g.fill();
        }
      }
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(x + s * 0.08, y + s * 0.2, s * 0.05, s * 0.72);   // its cellophane
    }
    const t = (cardsAtlas.t = new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  function patchAtlas() {
    if (patchAtlas.t) return patchAtlas.t;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const g = cv.getContext('2d'), s = 1024 / N, R = seq(277), pk = (a) => a[Math.floor(R() * a.length)];
    const COL = ['#c62828', '#ef6c00', '#f9a825', '#2e7d32', '#1565c0', '#6a1b9a', '#ad1457', '#00838f', '#4e342e', '#f5f0e6'];
    const EARTH = ['#8d2b1e', '#b5651d', '#c9a227', '#5d6b2e', '#2e5e5a', '#4a2c2a', '#7a1f3d', '#1f3b57', '#a0522d', '#2b2b2b', '#d35400'];
    for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) {
      const x = i * s, y = row * s;
      if (row < 3) {                                                                                    // patchwork in earthy cottons, a sun embroidered here and there
        const q = s / 8;
        for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) {
          const px = x + a * q, py = y + b * q;
          g.fillStyle = pk(EARTH); g.fillRect(px, py, q, q);
          if (R() < 0.3) {
            g.strokeStyle = 'rgba(255,236,190,0.75)'; g.lineWidth = 1.5; g.beginPath(); g.arc(px + q / 2, py + q / 2, q * 0.24, 0, Math.PI * 2);
            for (let t = 0; t < 8; t++) { const an = (t * Math.PI) / 4; g.moveTo(px + q / 2 + Math.cos(an) * q * 0.28, py + q / 2 + Math.sin(an) * q * 0.28); g.lineTo(px + q / 2 + Math.cos(an) * q * 0.42, py + q / 2 + Math.sin(an) * q * 0.42); }
            g.stroke();
          }
        }
        g.strokeStyle = 'rgba(30,15,5,0.45)'; g.lineWidth = 1;
        for (let a = 1; a < 8; a++) { g.beginPath(); g.moveTo(x + a * q, y); g.lineTo(x + a * q, y + s); g.moveTo(x, y + a * q); g.lineTo(x + s, y + a * q); g.stroke(); }
      } else if (row < 5) {                                                                             // mirror-work: flowers and little mirrors
        g.fillStyle = pk(['#f06292', '#ff8a65', '#c62828', '#7b1fa2', '#f9a825']); g.fillRect(x, y, s, s);
        for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
          const cx = x + (a + 0.5) * s / 4, cy = y + (b + 0.5) * s / 4;
          g.fillStyle = pk(['#ffeb3b', '#4caf50', '#e91e63', '#ff9800', '#29b6f6']); g.beginPath(); g.arc(cx, cy, s * 0.07, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#e8eef2'; g.beginPath(); g.arc(cx, cy, s * 0.03, 0, Math.PI * 2); g.fill();
        }
      } else {                                                                                          // block prints: kurtas, sarees, suits
        g.fillStyle = pk(COL); g.fillRect(x, y, s, s);
        g.fillStyle = 'rgba(255,255,255,0.55)';
        for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) { const cx = x + (a + 0.5) * s / 5, cy = y + (b + 0.5) * s / 5; g.beginPath(); g.moveTo(cx, cy - s * 0.04); g.lineTo(cx + s * 0.03, cy); g.lineTo(cx, cy + s * 0.04); g.lineTo(cx - s * 0.03, cy); g.fill(); }
        g.fillStyle = pk(['#ffd54f', '#ffffff', '#ff8a65']); g.fillRect(x, y + s * 0.86, s, s * 0.08);   // a border
      }
    }
    const t = (patchAtlas.t = new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  // boxes of bangles: clear plastic over bangles stacked on their sides, edge-on, gold ones between, a price sticker
  function bangleAtlas() {
    if (bangleAtlas.t) return bangleAtlas.t;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const g = cv.getContext('2d'), s = 1024 / N, R = seq(613);
    const COL = ['#d81b60', '#e53935', '#f9a825', '#43a047', '#1e88e5', '#8e24aa', '#ff7043', '#26c6da', '#d4af37', '#ec407a', '#7cb342', '#5c6bc0'];
    for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) {
      const x = i * s, y = row * s, c = COL[Math.floor(R() * COL.length)], c2 = R() < 0.5 ? c : COL[Math.floor(R() * COL.length)];
      g.fillStyle = '#f4f2ee'; g.fillRect(x, y, s, s);
      for (let k = 0; k < 14; k++) {
        const bx = x + s * 0.08 + k * s * 0.06;
        g.fillStyle = k % 4 === 3 ? '#e8c25a' : k % 2 ? c : c2; g.fillRect(bx, y + s * 0.1, s * 0.05, s * 0.8);
        g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(bx + s * 0.01, y + s * 0.12, s * 0.012, s * 0.76);
      }
      g.fillStyle = '#ffffff'; g.fillRect(x + s * 0.62, y + s * 0.68, s * 0.3, s * 0.18);
    }
    const t = (bangleAtlas.t = new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  ATLASES.cards = cardsAtlas; ATLASES.patch = patchAtlas; ATLASES.bangles = bangleAtlas;
  const card = (r) => [Math.floor(r() * N), Math.floor(r() * N), 'cards'];
  const bangles = (r) => [Math.floor(r() * N), Math.floor(r() * N), 'bangles'];
  const patch = (r, kind) => [kind === 'patch' ? Math.floor(r() * 3) : kind === 'mirror' ? 3 + Math.floor(r() * 2) : 5 + Math.floor(r() * 3), Math.floor(r() * N), 'patch'];
  // white wire mesh, for the boards the small things hang on
  const meshTex = () => meshTex.t || (meshTex.t = canvasTex(256, 256, (g, w, h) => { g.strokeStyle = '#f5f5f5'; g.lineWidth = 3; for (let k = 0; k <= 16; k++) { g.beginPath(); g.moveTo(k * w / 16, 0); g.lineTo(k * w / 16, h); g.moveTo(0, k * h / 16); g.lineTo(w, k * h / 16); g.stroke(); } }));
  // a hand in mehndi, as the henna boards show them: palm and fingers, rings of lines and dots
  function hennaHand(g, cx, cy, w, h, skin = '#d9a37a') {
    g.fillStyle = skin; g.beginPath(); g.ellipse(cx, cy, w * 0.2, h * 0.2, 0, 0, Math.PI * 2); g.fill();
    for (let f = 0; f < 5; f++) { const fx = cx - w * 0.16 + f * w * 0.08, fl = h * (f === 0 ? 0.18 : 0.28); g.beginPath(); g.roundRect(fx - w * 0.028, cy - h * 0.12 - fl, w * 0.056, fl + h * 0.05, w * 0.03); g.fill(); }
    g.strokeStyle = '#6d2e10'; g.lineWidth = 2;
    for (let ring = 1; ring < 4; ring++) { g.beginPath(); g.arc(cx, cy, ring * w * 0.045, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#6d2e10';
    for (let d = 0; d < 10; d++) { g.beginPath(); g.arc(cx + Math.cos(d) * w * 0.17, cy + Math.sin(d) * h * 0.16, 2.5, 0, Math.PI * 2); g.fill(); }
    for (let f = 1; f < 5; f++) { const fx = cx - w * 0.16 + f * w * 0.08; g.fillRect(fx - w * 0.02, cy - h * 0.3, w * 0.04, h * 0.02); }
  }
  // a grid of henna photos: hands, and here and there an Om, a trident or a crescent
  function hennaGrid(g, x0, y0, w, h, cols, rows, seed) {
    const tw = w / cols, th = h / rows, R = seq(seed);
    for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {
      const x = x0 + a * tw, y = y0 + b * th, k = Math.floor(R() * 14);
      g.fillStyle = ['#ef5350', '#ffccbc', '#ff8a65', '#fff3e0', '#f8bbd0'][Math.floor(R() * 5)]; g.fillRect(x + 2, y + 2, tw - 4, th - 4);
      g.fillStyle = '#5d2e12'; g.strokeStyle = '#5d2e12'; g.lineWidth = Math.max(2, tw * 0.04); g.textAlign = 'center'; g.textBaseline = 'middle';
      if (k === 0) { g.font = `700 ${th * 0.6}px serif`; g.fillText('ॐ', x + tw / 2, y + th / 2); }
      else if (k === 1) { g.beginPath(); g.moveTo(x + tw / 2, y + th * 0.85); g.lineTo(x + tw / 2, y + th * 0.2); g.moveTo(x + tw * 0.3, y + th * 0.25); g.quadraticCurveTo(x + tw * 0.3, y + th * 0.45, x + tw / 2, y + th * 0.45); g.quadraticCurveTo(x + tw * 0.7, y + th * 0.45, x + tw * 0.7, y + th * 0.25); g.stroke(); }
      else if (k === 2) { hennaHand(g, x + tw / 2, y + th * 0.62, tw, th); g.beginPath(); g.arc(x + tw / 2, y + th * 0.6, tw * 0.1, 0.6, 5.2); g.stroke(); }
      else hennaHand(g, x + tw / 2, y + th * 0.62, tw, th, R() < 0.3 ? '#c98b62' : '#d9a37a');
    }
  }

  // ---- a shop room behind its five-foot way, on either side of the lane -----------------------------------------------------
  // walls on both sides and at the back, the ceiling and its tubes, the floor; piers and a beam frame the shopfront
  function room(K, fr, x0, x1, zb, { floor = 0xece6dc, tubes = 2 } = {}) {
    const zs = at(fr, REC), zm = (zs + zb) / 2, d = Math.abs(zb - zs), s = fr.s;
    K.box(x0, x0 + 0.15, 0, GF, zs, zb, IN); K.box(x1 - 0.15, x1, 0, GF, zs, zb, IN); K.box(x0, x1, 0, GF, zb, zb - s * 0.15, IN);
    K.block(x0 - 0.05, zs, x0 + 0.2, zb); K.block(x1 - 0.2, zs, x1 + 0.05, zb); K.block(x0, zb, x1, zb - s * 0.25);
    K.plane(x1 - x0, d, 0xf4f1ea, [(x0 + x1) / 2, 3.35, zm], [Math.PI / 2, 0, 0]);
    for (let k = 0; k < tubes; k++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, Math.min(1.2, d - 0.6)), NAV.toon(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1, ink: false }));
      t.position.set(x0 + (x1 - x0) * (k + 0.5) / tubes, 3.3, zm); K.extra.push(t);
    }
    const f = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, d), floor === 'tiles' ? NAV.toon(0xffffff, { map: tiles() }) : NAV.toon(floor));
    if (floor === 'tiles') f.geometry.attributes.uv.array.forEach((v, k, a) => { a[k] = v * (k % 2 ? d / 0.6 : (x1 - x0) / 0.6); });
    f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, 0.014, zm); K.extra.push(f);
    // the shopfront: a pier each side, the beam over the opening (as Akshaya's)
    K.box(x0, x0 + 0.3, 0, GF, zs - s * 0.02, zs + s * 0.2, TRIM); K.box(x1 - 0.3, x1, 0, GF, zs - s * 0.02, zs + s * 0.2, TRIM);
    K.box(x0, x1, 2.72, GF, zs - s * 0.02, zs + s * 0.2, TRIM);
    K.block(x0, zs - s * 0.05, x0 + 0.35, zs + s * 0.25); K.block(x1 - 0.35, zs - s * 0.05, x1, zs + s * 0.25);
    return { zs, zb, ry: s > 0 ? Math.PI : 0 };
  }
  // shelving along a side wall, facing into the room (face +1: towards +x); fill(y, room, xWall, xFront) loads each board
  function sideShelves(K, xw, face, z0, z1, h, levels, fill, colour = 0xf2f2ef) {
    const xf = xw + face * 0.42;
    for (const z of [z0, z1]) for (const x of [xw + face * 0.02, xf - face * 0.02]) K.box(x - 0.018, x + 0.018, 0, h, z - 0.018, z + 0.018, colour);
    const ys = [];
    for (let k = 0; k < levels; k++) { const y = 0.1 + (k * (h - 0.2)) / (levels - 1); K.box(xw, xf, y - 0.012, y + 0.012, z0, z1, colour); ys.push(y + 0.012); }
    K.block(xw, z0, xf, z1);
    ys.forEach((y, k) => fill(y, k < ys.length - 1 ? ys[k + 1] - y - 0.04 : 0.32, xw, xf));
  }
  // a mannequin: white legs in a patchwork skirt or harem pants; a figure in a kurta, a top or a sherwani (c: its
  // colour), on a stand or, full length, in trousers (legs: their colour)
  function mannequin(K, r, x, z, kind, c, h = 1, legs = null) {
    K.cyl(x, 0, z, 0.12 * h, 0.03, 0x2b2b2b, { seg: 14 });
    if (kind === 'legs') {
      K.cyl(x, 0.03, z, 0.012, 0.18, 0x9aa0a6, { seg: 6 });
      K.item('frustum', [x, 0.2, z], [0.5, 0.86, 0.5], 0xffffff, [0, r() * 6, 0], patch(r, 'patch'));
      K.cyl(x, 1.06, z, 0.15, 0.05, 0xf2efe9, { rt: 0.13, seg: 16 });                                // the white form's waist
      K.block(x - 0.25, z - 0.25, x + 0.25, z + 0.25);
      return;
    }
    if (legs !== null) K.cyl(x, 0.03, z, 0.09 * h, 0.5 * h, legs, { rt: 0.11 * h, seg: 12 });
    else K.cyl(x, 0.03, z, 0.012, 0.5 * h, 0x9aa0a6, { seg: 6 });
    K.item('frustum', [x, 0.5 * h, z], [0.34 * h, 0.94 * h, 0.26 * h], c);                             // flared to its hem
    K.item('plume', [x, 1.44 * h, z], [0.15 * h, 0.06 * h, 0.1 * h], c);                                // its shoulders
    K.cyl(x, 1.46 * h, z, 0.04 * h, 0.08 * h, 0xe8d6c4, { seg: 8 });
    K.item('plume', [x, 1.62 * h, z], [0.085 * h, 0.11 * h, 0.095 * h], 0xe8d6c4);
    K.block(x - 0.18 * h, z - 0.18 * h, x + 0.18 * h, z + 0.18 * h);
  }
  // garments on hangers along a rail from a to b (V3); the garments hang across the rail, as on any shop's rail
  function rail(K, r, a, b, y, kind, len = [0.8, 1.2]) {
    const along = b.x !== a.x, colour = 0xc9ced3;
    K.rod(V(a.x, y, a.z), V(b.x, y, b.z), 0.013, colour);
    for (const p of [a, b]) K.rod(V(p.x, 0, p.z), V(p.x, y, p.z), 0.016, colour);
    const n = Math.floor((along ? Math.abs(b.x - a.x) : Math.abs(b.z - a.z)) / 0.075);
    for (let k = 1; k < n; k++) {
      const t = k / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, l = len[0] + r() * (len[1] - len[0]);
      K.item('box', [x, y - 0.03 - l / 2, z], along ? [0.025, l, 0.44] : [0.44, l, 0.025], 0xffffff, [0, (r() - 0.5) * 0.25, 0], patch(r, typeof kind === 'function' ? kind() : kind));
    }
    if (along) K.block(Math.min(a.x, b.x) - 0.05, a.z - 0.25, Math.max(a.x, b.x) + 0.05, a.z + 0.25);
    else K.block(a.x - 0.25, Math.min(a.z, b.z) - 0.05, a.x + 0.25, Math.max(a.z, b.z) + 0.05);
  }

  // ---- north-east: Sathish Trading and its fruit racks --------------------------------------------------------------------
  const FRUIT = {
    apple: { c: [0xc62828, 0xd32f2f, 0xb71c1c], s: [0.042, 0.04, 0.042] }, guava: { c: [0xb5d36a, 0xa5c75a, 0x9ccc65], s: [0.045, 0.042, 0.048] },
    orange: { c: [0xfb8c00, 0xf57c00], s: [0.045, 0.043, 0.045] }, pomegranate: { c: [0x9c1c1c, 0xb02a2a], s: [0.048, 0.045, 0.048] },
    custard: { c: [0x8fae5a, 0x9bb866], s: [0.05, 0.048, 0.05] }, mango: { c: [0xf2c13a, 0xe8a832, 0xc5c83a], s: [0.048, 0.04, 0.065] },
    papaya: { c: [0xe8a03a, 0x9cb84a], s: [0.07, 0.065, 0.12] }, pineapple: { c: [0xc9932f, 0xb8862a], s: [0.07, 0.11, 0.07] },
  };
  // one tall white rack, its front to the lane (+z): three trays tilted to the lane on green liners, two shelves of
  // boxed and bagged fruit above, hands of bananas from a bar along the top, crates of coconuts underneath
  function fruitRack(K, r, x0, x1, zb, kinds) {
    const zf = zb + 0.6, H = 2.25;
    for (const x of [x0 + 0.02, x1 - 0.02]) for (const z of [zb + 0.02, zf - 0.02]) K.box(x - 0.018, x + 0.018, 0, H, z - 0.018, z + 0.018, WHITE);
    K.box(x0, x1, 0.4, H, zb, zb + 0.012, 0x2f8f3f);                                                     // the green back
    K.box(x0, x1, H - 0.03, H, zb, zf, WHITE);
    for (let k = 0; k < 3; k++) {
      const kind = FRUIT[kinds[k]], yl = 0.48 + k * 0.34, zl = zf + 0.3 - k * 0.12, yr = yl + 0.18, zr = zb + 0.03;
      const L = Math.hypot(zl - zr, yr - yl), th = Math.atan2(yr - yl, zl - zr);
      K.add(new THREE.BoxGeometry(x1 - x0 - 0.04, 0.02, L).rotateX(th).translate((x0 + x1) / 2, (yl + yr) / 2, (zl + zr) / 2), 0x3a9a48);   // its green liner
      K.box(x0 + 0.02, x1 - 0.02, yl - 0.02, yl + 0.07, zl, zl + 0.012, WHITE);                           // the lip
      for (let x = x0 + 0.14; x < x1 - 0.08; x += 0.3) K.box(x - 0.045, x + 0.045, yl + 0.07, yl + 0.13, zl + 0.004, zl + 0.008, 0xffffff);   // price cards
      const rows = Math.max(2, Math.floor(L / (kind.s[2] * 2.1)));
      for (let j = 0; j < rows; j++) {
        const t = (j + 0.5) / rows, z = zl + (zr - zl) * t, y = yl + (yr - yl) * t + 0.01 + kind.s[1] * 0.9;
        for (let x = x0 + 0.03 + kind.s[0]; x < x1 - 0.03 - kind.s[0]; x += kind.s[0] * 2.1) {
          K.item('ball', [x + (r() - 0.5) * 0.008, y, z], kind.s, pick(r, kind.c), [0, r() * 6, 0]);
          if (kinds[k] === 'pineapple') K.item('cone', [x, y + kind.s[1] + 0.05, z], [0.035, 0.1, 0.035], 0x3f7a35, [(r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3]);   // its crown
        }
      }
    }
    // the shelves above: boxes of fruit and mesh bags of oranges
    for (const y of [1.6, 1.93]) {
      K.box(x0, x1, y - 0.012, y + 0.012, zb, zf, WHITE);
      for (let x = x0 + 0.05; x < x1 - 0.2; x += 0.24 + r() * 0.06) {
        if (r() < 0.6) K.box(x, x + 0.22, y + 0.012, y + 0.012 + 0.13 + r() * 0.1, zb + 0.05, zb + 0.45, pick(r, [0xe9d9b0, 0xf4f4f0, 0xd8c08a, 0xf2e6c8]), 0.01);
        else for (let k = 0; k < 5; k++) K.item('ball', [x + 0.05 + (k % 3) * 0.06, y + 0.06 + Math.floor(k / 3) * 0.07, zb + 0.3 + (r() - 0.5) * 0.06], [0.045, 0.043, 0.045], pick(r, [0xfb8c00, 0xf2c13a, 0xc62828]));
      }
    }
    // hands of bananas from a bar in front of the top
    K.rod(V(x0 + 0.02, H - 0.08, zf + 0.04), V(x1 - 0.02, H - 0.08, zf + 0.04), 0.012, WHITE, 6);
    for (let x = x0 + 0.16; x < x1 - 0.1; x += 0.26) K.item('bunch', [x, H - 0.1, zf + 0.05], 0.2 + r() * 0.04, pick(r, [0xf2d13a, 0xe8c52a, 0xc9cf4a, 0xf2d13a]), [0, (r() - 0.5) * 0.6, 0]);
    // crates underneath: husked coconuts, young green ones
    for (let x = x0 + 0.04; x < x1 - 0.3; x += 0.36) {
      K.box(x, x + 0.34, 0.02, 0.28, zb + 0.08, zb + 0.5, pick(r, [0x1e5aa8, 0x2e7d32, 0x1e5aa8]), 0.01);
      const husk = r() < 0.6;
      for (let k = 0; k < 4; k++) K.item('ball', [x + 0.09 + (k % 2) * 0.16, 0.355, zb + 0.18 + Math.floor(k / 2) * 0.17], husk ? [0.07, 0.078, 0.07] : [0.08, 0.085, 0.08], husk ? pick(r, [0xe0cfa6, 0xd6c296]) : pick(r, [0x8bbf5a, 0x7fae4a]));
    }
    K.block(x0, zb, x1, zf + 0.3);
  }
  function sathishDisplay(K, r) {
    const KINDS = [['pineapple', 'apple', 'orange'], ['papaya', 'guava', 'apple'], ['pomegranate', 'custard', 'mango'], ['apple', 'orange', 'guava'], ['mango', 'pomegranate', 'apple'], ['guava', 'custard', 'orange']];
    KINDS.forEach((kinds, k) => fruitRack(K, r, 17.0 + k * 1.07, 18.02 + k * 1.07, NEF.zf + 0.07, kinds));
    // the rainbow-striped valance under the awning's edge, as over the snack shop's jars, and a row of bulbs below it
    const STRIPES = [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5, 0x8e24aa];
    for (let k = 0; k < 35; k++) K.box(16.85 + k * 0.19, 17.04 + k * 0.19, 2.42, 2.82, NEF.zf + 1.02, NEF.zf + 1.03, STRIPES[k % 6]);
    for (let x = 17.3; x < 23.4; x += 0.55) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), NAV.toon(0xfff6dc, { emissive: 0xfff0c8, emissiveIntensity: 1, ink: false }));
      b.position.set(x, 2.36, NEF.zf + 0.95); K.extra.push(b); K.rod(V(x, 2.4, NEF.zf + 0.95), V(x, 2.62, NEF.zf + 0.95), 0.004, 0x222222, 4);
    }
  }
  function sathish(K, r) {
    const R = room(K, NEF, 16.8, 23.5, NEB, { tubes: 3 });
    // its fascia: rainbow stripes round a white panel; its name from OSM (the video shows "...ADING AND ..." and the road)
    const fascia = canvasTex(1024, 128, (g, w, h) => {
      ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'].forEach((c, k, a) => { g.fillStyle = c; for (let x = k * 24; x < w; x += 24 * a.length) g.fillRect(x, 0, 24, h); });
      g.fillStyle = '#fffdf6'; g.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
      g.fillStyle = '#1b5e20'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `700 ${h * 0.34}px ${fam}`; g.fillText('SATHISH TRADING AND ENTERPRISE', w / 2, h * 0.4);
      g.font = `600 ${h * 0.2}px ${fam}`; g.fillText('SERANGOON ROAD · SINGAPORE', w / 2, h * 0.72);
    });
    board(K, fascia, 6.1, 0.62, V(20.15, 3.08, R.zs + 0.03), R.ry, 0.35);
    // inside: glass-door fridges of drinks and greens on the back wall, cartons on top; stands of vegetable crates on the
    // side walls, a table of crates in the middle, sacks of onions by the door, the counter
    const door = fridgeMat();
    for (let k = 0; k < 4; k++) {
      const x = 17.3 + k * 0.85;
      K.box(x, x + 0.8, 0, 2.0, NEB + 0.15, NEB + 0.8, 0xe9ecef, 0.02);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 1.6), door); gl.position.set(x + 0.4, 1.05, NEB + 0.81); K.extra.push(gl);
      for (let c = 0; c < 2; c++) K.box(x + 0.05 + c * 0.37, x + 0.38 + c * 0.37, 2.0, 2.2 + r() * 0.2, NEB + 0.25, NEB + 0.7, pick(r, [0xd8c08a, 0xc9a96e, 0xe9d9b0]), 0.01);
    }
    K.block(17.3, NEB, 20.7, NEB + 0.85);
    K.box(18.4, 20.6, 0, 0.7, -10.3, -9.6, 0x8e6a49, 0.02);
    for (let x = 18.45; x < 20.5; x += 0.42) {
      K.box(x, x + 0.4, 0.7, 0.84, -10.25, -9.65, pick(r, [0x2e7d32, 0x1e5aa8, 0xc62828]), 0.01);
      const veg = pick(r, [[0xc9a46a, 0.04], [0x8d6e63, 0.045], [0xd84315, 0.035], [0x7b1fa2, 0.045], [0x9ccc65, 0.04]]);
      for (let k = 0; k < 10; k++) K.item('ball', [x + 0.06 + (k % 5) * 0.07, 0.86 + veg[1] * 0.6, -10.15 + Math.floor(k / 5) * 0.2 + (r() - 0.5) * 0.04], veg[1], veg[0], [0, r() * 6, 0]);
    }
    K.block(18.35, -10.35, 20.65, -9.55);
    for (let k = 0; k < 3; k++) {
      const x = 17.75 + k * 0.42;
      K.item('plume', [x, 0.26, -9.05], [0.19, 0.26, 0.16], 0xc8b48a);
      for (let o = 0; o < 4; o++) K.item('ball', [x + (o % 2 - 0.5) * 0.08, 0.5, -9.05 + (Math.floor(o / 2) - 0.5) * 0.07], 0.04, pick(r, [0xb5651d, 0xc98a5a, 0x8d4f2a]));
    }
    K.block(17.5, -9.3, 18.85, -8.8);
    const VEG = [[0xc9a46a, [0.04, 0.035, 0.04]], [0xd84315, [0.014, 0.014, 0.06]], [0x33691e, [0.014, 0.014, 0.07]], [0x8d6e63, [0.045, 0.04, 0.045]], [0x7b1fa2, [0.045, 0.045, 0.06]], [0xe8e0c8, [0.05, 0.045, 0.05]]];
    for (const [xw, face] of [[16.95, 1], [23.35, -1]]) sideShelves(K, xw, face, -11.4, -9.0, 1.6, 4, (y, room, a, b) => {
      for (let z = -11.3; z < -9.15; z += 0.4) {
        K.box(Math.min(a, b) + 0.03, Math.max(a, b) - 0.03, y, y + 0.14, z, z + 0.36, 0x8e6a49, 0.01);
        const veg = pick(r, VEG);
        for (let k = 0; k < 7; k++) K.item('ball', [(a + b) / 2 + (r() - 0.5) * 0.24, y + 0.15 + veg[1][1] * 0.5, z + 0.06 + r() * 0.24], veg[1], veg[0], [0, r() * 6, r() * 0.4]);
      }
    }, 0x8e6a49);
    K.box(21.4, 23.0, 0, 0.92, -9.6, -9.05, 0xf6f6f2, 0.02); K.box(22.2, 22.5, 0.92, 0.98, -9.45, -9.2, 0x9aa0a6);
    K.block(21.35, -9.65, 23.05, -9.0);
    // on the five-foot way, against the shopfront: a drinks fridge
    K.box(19.6, 20.3, 0, 1.9, R.zs + 0.05, R.zs + 0.7, 0xe53935, 0.02);
    const dg = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.3), door); dg.position.set(19.95, 1.0, R.zs + 0.71); K.extra.push(dg);
    K.block(19.55, R.zs, 20.35, R.zs + 0.75);
  }
  // a fridge's glass door, lit from inside: shelves of bottles, cans and bunches of greens
  function fridgeMat() {
    if (fridgeMat.m) return fridgeMat.m;
    const tex = canvasTex(128, 320, (g, w, h) => {
      const R = seq(41); g.fillStyle = '#e8f4ff'; g.fillRect(0, 0, w, h);
      for (let s = 0; s < 5; s++) {
        const y = 14 + s * 62;
        g.fillStyle = '#b8c4cc'; g.fillRect(0, y + 52, w, 4);
        for (let x = 4; x < w - 10; x += 12 + Math.floor(R() * 4)) {
          const tall = s < 3, c = ['#c62828', '#2e7d32', '#f9a825', '#6d4c41', '#1565c0', '#fb8c00', '#f5f5f5'][Math.floor(R() * 7)];
          g.fillStyle = c; if (tall) { g.fillRect(x, y + 14, 9, 38); g.fillRect(x + 2, y + 6, 5, 9); } else { g.beginPath(); g.ellipse(x + 5, y + 40, 7, 12, 0, 0, Math.PI * 2); g.fill(); }
        }
      }
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(w * 0.12, 0, w * 0.08, h);
    });
    const m = (fridgeMat.m = NAV.toon(0xffffff, { map: tex, emissive: 0xffffff, emissiveIntensity: 0.5, ink: false, unique: true })); m.emissiveMap = tex;
    return m;
  }

  // ---- north-east: the bangle shop and its display in the lane ---------------------------------------------------------------
  // a white wire-mesh board on its stand, hung with cards of bindis, clips and earrings (face +1: towards +z)
  function meshBoard(K, r, x0, x1, z, face, y0 = 0.5, y1 = 2.2) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), NAV.toon(0xffffff, { map: meshTex(), alphaTest: 0.5, side: THREE.DoubleSide, ink: false }));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); K.extra.push(m);
    K.box(x0 - 0.02, x0 + 0.02, 0, y1, z - 0.02, z + 0.02, 0xf2f2ef); K.box(x1 - 0.02, x1 + 0.02, 0, y1, z - 0.02, z + 0.02, 0xf2f2ef);
    for (let y = y0 + 0.15; y < y1 - 0.1; y += 0.24) for (let x = x0 + 0.1; x < x1 - 0.08; x += 0.17) K.item('box', [x, y, z + face * 0.03], [0.13, 0.18, 0.012], 0xffffff, [0, 0, 0], card(r));
    K.block(x0, z - 0.15, x1, z + 0.15);
  }
  // a white wire rack of shelves on castors: packets of cards and boxes of bangles
  function wireRack(K, r, x0, x1, z0, z1, levels = 4) {
    for (const x of [x0, x1]) for (const z of [z0, z1]) { K.box(x - 0.012, x + 0.012, 0.08, 0.3 + levels * 0.38, z - 0.012, z + 0.012, 0xf2f2ef); K.cyl(x, 0, z, 0.03, 0.08, 0x2b2b2b, { seg: 8 }); }
    for (let k = 0; k < levels; k++) {
      const y = 0.22 + k * 0.38;
      K.box(x0, x1, y - 0.008, y + 0.008, z0, z1, 0xf2f2ef);
      for (let x = x0 + 0.08; x < x1 - 0.06; x += 0.13) {
        if (k % 2) for (let l = 0; l < 3; l++) K.item('box', [x, y + 0.04 + l * 0.07, (z0 + z1) / 2], [0.11, 0.065, Math.abs(z1 - z0) * 0.8], 0xffffff, [0, 0, 0], bangles(r));
        else K.item('box', [x, y + 0.11, (z0 + z1) / 2], [0.11, 0.2, Math.abs(z1 - z0) * 0.6], 0xffffff, [0, 0, 0], card(r));
      }
    }
    K.block(x0, z0, x1, z1);
  }
  function bangleShop(K, r) {
    const R = room(K, NEF, 23.5, 28.5, NEB, { floor: 'tiles', tubes: 2 });
    // its pink fascia: the words the video shows (its first and last were cut off), between rows of bangles
    const fascia = canvasTex(1024, 128, (g, w, h) => {
      g.fillStyle = '#f8bbd0'; g.fillRect(0, 0, w, h); g.fillStyle = '#ad1457'; g.font = `700 ${h * 0.34}px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('◆ BANGLES ◆ BRIDAL SETS ◆ HENNA ◆', w / 2, h * 0.52);
      for (let k = 0; k < 12; k++) { g.strokeStyle = ['#d4af37', '#e53935', '#8e24aa', '#1e88e5'][k % 4]; g.lineWidth = 5; g.beginPath(); g.arc(30 + k * 88, k % 2 ? 16 : h - 16, 10, 0, Math.PI * 2); g.stroke(); }
    });
    board(K, fascia, 4.6, 0.58, V(26.0, 3.08, R.zs + 0.03), R.ry, 0.4);
    // racks of bangle boxes to the ceiling on the back wall, shelving of them on both side walls, an island between
    const box = (p, s) => K.item('box', p, s, 0xffffff, [0, (r() - 0.5) * 0.03, 0], bangles(r));
    K.box(23.7, 28.3, 0, 3.2, NEB + 0.15, NEB + 0.17, 0xf2f2ef);
    for (let k = 0; k < 10; k++) {
      const y = 0.08 + k * 0.31;
      K.box(23.7, 28.3, y - 0.01, y + 0.01, NEB + 0.17, NEB + 0.47, 0xf2f2ef);
      for (let x = 23.75; x < 28.1; x += 0.155) for (let l = 0; l < 4; l++) box([x + 0.075, y + 0.043 + l * 0.068, NEB + 0.33], [0.15, 0.064, 0.26]);
    }
    K.block(23.7, NEB, 28.3, NEB + 0.5);
    const boxes = (y, room, a, b) => { for (let z = -11.1; z < -9.4; z += 0.155) for (let l = 0; l < Math.floor(room / 0.07); l++) box([(a + b) / 2, y + 0.034 + l * 0.068, z + 0.075], [0.3, 0.064, 0.145]); };
    sideShelves(K, 23.65, 1, -11.2, -9.3, 3.15, 9, boxes); sideShelves(K, 28.35, -1, -11.2, -9.3, 3.15, 9, boxes);
    K.box(25.95, 26.05, 0, 1.9, -11.0, -9.6, 0xf2f2ef);
    for (const face of [-1, 1]) for (let k = 0; k < 6; k++) {
      const y = 0.1 + k * 0.3, xf = 26.0 + face * 0.4;
      K.box(26.0, xf, y - 0.01, y + 0.01, -11.0, -9.6, 0xf2f2ef);
      for (let z = -10.95; z < -9.7; z += 0.155) for (let l = 0; l < 3; l++) box([26.0 + face * 0.2, y + 0.044 + l * 0.068, z + 0.075], [0.3, 0.064, 0.145]);
    }
    K.block(25.55, -11.05, 26.45, -9.55);
    // glass counters of bridal sets near the door, a mesh board of hair accessories, track lights and a CCTV camera
    counter(K, r, 23.85, 24.5, -9.25, -8.75); counter(K, r, 27.5, 28.15, -9.25, -8.75);
    meshBoard(K, r, 24.6, 25.5, -8.95, 1, 0.5, 2.3);
    for (const x of [24.6, 26.0, 27.4]) { K.box(x - 0.02, x + 0.02, 3.3, 3.34, -11.2, -9.0, 0x1b1b1b); for (let z = -10.9; z < -9.1; z += 0.6) K.cyl(x, 3.15, z, 0.04, 0.15, 0x1b1b1b, { seg: 8 }); }
    K.box(28.1, 28.25, 3.15, 3.25, -9.0, -8.85, 0x2b2b2b); K.cyl(28.17, 3.05, -8.86, 0.03, 0.1, 0x1b1b1b, { seg: 10 });
  }
  function bangleDisplay(K, r) {
    // at the back, under the navy awning: mesh boards of cards and a mesh panel lit green, boxes of bangles before it, a
    // way between them to the shop (clear of the five-foot way's columns)
    meshBoard(K, r, 23.8, 24.9, -6.35, 1); meshBoard(K, r, 25.95, 27.05, -6.35, 1);
    const green = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.8), NAV.toon(0x2e7d32, { emissive: 0x43d156, emissiveIntensity: 0.7, ink: false }));
    green.position.set(27.95, 1.2, -6.45); K.extra.push(green);
    meshBoard(K, r, 27.25, 28.65, -6.38, 1, 0.3, 2.1);
    wireRack(K, r, 27.35, 28.55, -6.1, -5.6, 4);
    board(K, boardTex([['Offer Bindi', 0.6, 0.55]], { w: 0.9, h: 0.26, bg: '#fff59d', ink: '#c62828' }), 0.9, 0.26, V(24.4, 2.36, -6.3), 0, 0.3);
    // in front: white wire racks on castors, one more by the aisle
    wireRack(K, r, 23.95, 24.75, -5.3, -4.85); wireRack(K, r, 26.25, 27.05, -5.3, -4.85);
    wireRack(K, r, 27.6, 28.4, -4.4, -3.95, 3); wireRack(K, r, 23.9, 24.7, -3.3, -2.85, 3);
  }

  // ---- south-west: Lotus Mantra's henna station and clothing racks ------------------------------------------------------------
  // the tall board at its NW end: henna designs under a red LOTUS MANTRA header and the shop's handle (157 s)
  const hennaBoard = () => hennaBoard.t || (hennaBoard.t = canvasTex(512, 768, (g, w, h) => {
    g.fillStyle = '#c62828'; g.fillRect(0, 0, w, h * 0.12); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${h * 0.062}px ${fam}`; g.fillText('LOTUS MANTRA', w / 2, h * 0.06);
    hennaGrid(g, 0, h * 0.12, w, h * 0.82, 3, 4, 31);
    g.fillStyle = '#c62828'; g.fillRect(0, h * 0.94, w, h * 0.06); g.fillStyle = '#ffffff'; g.font = `600 ${h * 0.035}px ${fam}`; g.fillText('@lotusmantra1', w / 2, h * 0.97);
  }));
  // the backdrop behind the henna table: the red banner of what the shop sells over a wall of henna photos (172–178 s);
  // the first word of the second line is hidden in the video, so it is left out
  const backdropTex = () => canvasTex(1024, 640, (g, w, h) => {
    const hb = h * 0.42;
    g.fillStyle = '#d32f2f'; g.fillRect(0, 0, w, hb);
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `700 ${hb * 0.24}px ${fam}`; g.fillText('LOTUS MANTRA', w * 0.03, hb * 0.17);
    g.font = `700 ${hb * 0.11}px ${fam}`; g.fillText('BESPOKE UNISEX TAILORING', w * 0.04, hb * 0.37);
    const pill = (y, text) => { g.font = `600 ${hb * 0.1}px ${fam}`; const tw = g.measureText(text).width; g.fillStyle = '#1e4fb8'; g.beginPath(); g.roundRect(w * 0.03, y - hb * 0.075, tw + w * 0.04, hb * 0.15, hb * 0.075); g.fill(); g.fillStyle = '#ffffff'; g.fillText(text, w * 0.05, y); };
    pill(hb * 0.56, 'Ready made Saree ★ Saree Blouse ★ Ladies suit');
    pill(hb * 0.73, 'Kurta ★ Kids ★ Plus Size Fashion & Others');
    g.fillStyle = '#ffffff'; g.font = `600 ${hb * 0.09}px ${fam}`; g.fillText('All orders completed in 48 hours', w * 0.05, hb * 0.9);
    g.fillStyle = '#fff3c4'; g.fillRect(w * 0.7, hb * 0.08, w * 0.27, hb * 0.6);
    for (let k = 0; k < 6; k++) { g.fillStyle = ['#7e57c2', '#43a047', '#f9a825', '#e91e63', '#26a69a', '#ef6c00'][k]; g.fillRect(w * (0.715 + (k % 3) * 0.085), hb * (0.13 + Math.floor(k / 3) * 0.27), w * 0.07, hb * 0.22); }   // blouse designs
    g.fillStyle = '#f2c230'; g.textAlign = 'center'; g.font = `700 ${hb * 0.16}px ${fam}`; g.fillText('#01-03', w * 0.835, hb * 0.84);
    g.fillStyle = '#f57c00'; g.fillRect(0, hb, w, h * 0.03);
    hennaGrid(g, 0, hb + h * 0.03, w, h - hb - h * 0.03, 8, 3, 57);
  });
  // a blue printed tablecloth, as on the henna table
  const clothTex = () => clothTex.t || (clothTex.t = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#2c5fb8'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 32) { g.fillStyle = (x + y) % 64 ? '#f4f1ea' : '#f06292'; g.beginPath(); g.arc(x + 16, y + 16, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2c5fb8'; g.beginPath(); g.arc(x + 16, y + 16, 4, 0, Math.PI * 2); g.fill(); }
  }));
  function henna(K, r) {
    // a green floor mat under both of Lotus Mantra's tents
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 3.7), NAV.toon(0x3f8f4a)); mat.rotation.x = -Math.PI / 2; mat.position.set(31.0, 0.012, 3.8); K.extra.push(mat);
    // the tall board at the NW end, facing the people coming from Serangoon Road, on two legs
    board(K, hennaBoard(), 1.3, 1.95, V(27.64, 1.47, 3.0), -Math.PI / 2, 0.35);
    K.box(27.66, 27.7, 0, 2.45, 2.3, 2.34, WOOD); K.box(27.66, 27.7, 0, 2.45, 3.66, 3.7, WOOD);
    K.block(27.6, 2.25, 27.8, 3.75);
    // the backdrop along the back of the tent, the long table before it in its printed cloth, design albums and cones on it
    board(K, backdropTex(), 2.6, 1.62, V(29.05, 1.61, 5.45), Math.PI, 0.35);
    K.box(27.78, 27.82, 0, 2.42, 5.45, 5.49, WOOD); K.box(30.33, 30.37, 0, 2.42, 5.45, 5.49, WOOD);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 0.62), NAV.toon(0xffffff, { map: clothTex() })); top.position.set(29.05, 0.55, 4.82); K.extra.push(top);
    for (const x of [28.0, 30.1]) for (const z of [4.6, 5.05]) K.box(x - 0.02, x + 0.02, 0, 0.35, z - 0.02, z + 0.02, 0x9aa0a6);
    K.block(27.85, 4.48, 30.25, 5.5);
    const album = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#1a237e'; g.fillRect(0, 0, w, h); hennaGrid(g, 6, 6, w / 2 - 9, h - 12, 2, 2, 71); hennaGrid(g, w / 2 + 3, 6, w / 2 - 9, h - 12, 2, 2, 73); });
    for (let k = 0; k < 4; k++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.23), NAV.toon(0xffffff, { map: album })); p.rotation.set(-Math.PI / 2, 0, (r() - 0.5) * 0.3);
      p.position.set(28.25 + k * 0.55, 0.757, 4.72 + (k % 2) * 0.12); K.extra.push(p);
    }
    K.cyl(29.9, 0.75, 4.95, 0.04, 0.09, 0x9aa0a6, { seg: 10 });
    for (let k = 0; k < 6; k++) K.item('cone', [29.9 + (k % 3 - 1) * 0.02, 0.88, 4.95 + (Math.floor(k / 3) - 0.5) * 0.025], [0.012, 0.14, 0.012], pick(r, [0x6d3b1f, 0x2e7d32, 0xc0c4c8]), [Math.PI + (r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3]);
    // plastic stools on the aisle side of the table, the A-frame board of designs by the aisle
    for (const [x, z, c] of [[28.5, 4.05, 0xe53935], [29.4, 4.0, 0x1e88e5], [30.0, 3.6, 0xe53935]]) { K.cyl(x, 0, z, 0.15, 0.42, c, { rt: 0.17, seg: 14 }); K.block(x - 0.18, z - 0.18, x + 0.18, z + 0.18); }
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.0), NAV.toon(0xffffff, { map: hennaBoard(), side: THREE.DoubleSide })); p.position.set(28.3 + s * 0.12, 0.5, 2.25); p.rotation.set(0, -Math.PI / 2, s * 0.22, 'ZYX'); K.extra.push(p); }
    K.block(28.0, 1.95, 28.6, 2.55);
    // fairy lights along the front of both tents
    for (let x = 27.6; x < 34.45; x += 0.16) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), NAV.toon(0xfff3c4, { emissive: 0xfff0b0, emissiveIntensity: 1, ink: false })); b.position.set(x, 2.42 - 0.05 * Math.abs(Math.sin(x * 1.4)), 1.98); K.extra.push(b); }
  }
  // the clothing racks: a way through the middle to the shop's door (x 31.5–32.4); patchwork, prints and mirror-work on
  // both sides, a block-print bedspread hung from the five-foot way's beam behind (184–197 s)
  function clothes(K, r) {
    const print = () => (r() < 0.65 ? 'print' : 'patch');
    // NW of the way: leg forms in patchwork at the aisle, a purple kurta, a rail of printed kurtas, a mesh panel of
    // patchwork trousers and a mirror-work vest at the back
    mannequin(K, r, 30.78, 2.42, 'legs'); mannequin(K, r, 31.28, 2.45, 'legs');
    mannequin(K, r, 30.85, 3.35, 'torso', 0x5b2a86);
    rail(K, r, V(30.6, 0, 4.3), V(31.4, 0, 4.3), 1.7, print);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.8), NAV.toon(0xffffff, { map: meshTex(), alphaTest: 0.5, side: THREE.DoubleSide, ink: false })); m.position.set(31.0, 1.3, 5.25); K.extra.push(m);
    K.box(30.55, 30.59, 0, 2.2, 5.23, 5.27, 0xf2f2ef); K.box(31.41, 31.45, 0, 2.2, 5.23, 5.27, 0xf2f2ef); K.block(30.5, 5.1, 31.5, 5.4);
    K.item('box', [30.8, 1.45, 5.21], [0.36, 0.95, 0.02], 0xffffff, [0, 0, 0], patch(r, 'patch'));
    K.item('box', [31.2, 1.75, 5.21], [0.36, 0.45, 0.02], 0xffffff, [0, 0, 0], patch(r, 'mirror'));
    const spread = canvasTex(256, 384, (g, w, h) => {
      g.fillStyle = '#2b4c9a'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 * 8; x < w; x += 16) { g.fillStyle = '#e8e4da'; g.fillRect(x + 5, y + 5, 6, 6); }
      g.fillStyle = '#b3262a'; g.fillRect(0, 0, w, 22); g.fillRect(0, h - 22, w, 22);
      for (const cy of [h * 0.3, h * 0.7]) { g.fillStyle = '#b3262a'; g.beginPath(); g.arc(w / 2, cy, 46, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f2e6c8'; g.beginPath(); g.arc(w / 2, cy, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2b4c9a'; g.beginPath(); g.arc(w / 2, cy, 12, 0, Math.PI * 2); g.fill(); }
    });
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6, 10, 1), NAV.toon(0xffffff, { map: spread, side: THREE.DoubleSide }));
    const spp = sp.geometry.attributes.position; for (let k = 0; k < spp.count; k++) spp.setZ(k, Math.sin(spp.getX(k) * 13) * 0.025);
    sp.geometry.computeVertexNormals(); sp.rotation.y = Math.PI; sp.position.set(30.98, 2.72, 5.76); K.extra.push(sp);
    // SE of the way: leg forms and a torso in a yellow top at the aisle, mirror-work vests up on a rod, two rails of
    // kurtas, caps and hats on a shelf at the back, cloth bags at its end
    mannequin(K, r, 32.75, 2.42, 'legs'); mannequin(K, r, 33.3, 2.45, 'legs'); mannequin(K, r, 33.9, 2.5, 'torso', 0xf2c21e);
    K.item('frustum', [33.9, 0.25, 2.5], [0.52, 0.78, 0.5], 0xf5f2ea);                                    // a white skirt under the yellow top
    K.rod(V(32.5, 2.36, 2.05), V(34.35, 2.36, 2.05), 0.012, WOOD);
    for (let x = 32.72; x < 34.3; x += 0.36) K.item('box', [x, 2.15, 2.07], [0.3, 0.36, 0.025], 0xffffff, [0, 0, 0], patch(r, 'mirror'));
    rail(K, r, V(32.55, 0, 3.75), V(34.3, 0, 3.75), 1.72, print);
    rail(K, r, V(32.55, 0, 5.0), V(34.3, 0, 5.0), 1.6, print, [0.7, 1.0]);
    K.box(32.55, 34.3, 1.72, 1.74, 4.85, 5.2, 0xf2f2ef);
    for (let x = 32.7; x < 34.2; x += 0.21) { if (r() < 0.5) K.item('ball', [x, 1.79, 5.02], [0.1, 0.06, 0.1], pick(r, [0xc62828, 0x8d6e63, 0xf5f0e6])); else K.item('cone', [x, 1.8, 5.02], [0.09, 0.12, 0.09], pick(r, [0x1565c0, 0xf5f0e6, 0x4e342e])); }
    for (const [y, c, z] of [[1.25, 0x7b1fa2, 4.75], [1.3, 0xe91e63, 4.87]]) K.item('box', [32.62, y, z], [0.06, 0.4, 0.4], c, [0, 0.2, 0]);
  }

  // ---- south-west: the LOTUSMANTRA shop -------------------------------------------------------------------------------------
  // its front, left to right as you face it: a wall of juttis, the BESPOKE board and a sherwani with a turban, the door
  // under the yellow sign, a kurta on a stand below a kurta poster, another wall of juttis (193–205 s)
  function juttiWall(K, r, x0, x1, zs) {
    const z0 = zs + 0.02, z1 = zs + 0.42;
    K.box(x0, x1, 0, 2.55, z1, z1 + 0.03, 0xf6f6f2);
    for (const x of [x0, x1]) K.box(x - 0.02, x + 0.02, 0, 2.55, z0, z1, 0xf6f6f2);
    for (let k = 0; k < 9; k++) {
      const y = 0.15 + k * 0.27;
      K.box(x0, x1, y - 0.01, y + 0.01, z0, z1, 0xf6f6f2);
      for (let x = x0 + 0.08; x < x1 - 0.06; x += 0.16) {
        const c = pick(r, [0xd4af37, 0xc62828, 0xf5f0e6, 0x8e24aa, 0xe8c25a, 0x2e7d32, 0xf06292]);
        for (const dx of [-0.032, 0.032]) K.item('ball', [x + dx, y + 0.034, z0 + 0.2], [0.032, 0.026, 0.11], c, [0.12, dx * 5, 0]);   // a pair, toes to the lane
      }
    }
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.06, 2.4), NAV.toon(0xfffaf0, { emissive: 0xfff4e0, emissiveIntensity: 0.55, ink: false }));
    glow.position.set((x0 + x1) / 2, 1.3, z1 - 0.005); glow.rotation.y = Math.PI; K.extra.push(glow);
    K.block(x0, zs, x1, z1 + 0.05);
  }
  function lotusShop(K, r) {
    const R = room(K, SWF, 28.0, 34.0, SWB, { tubes: 3 }), zs = R.zs;
    // the yellow sign over the door: a lotus over the name and the unit
    const sign = canvasTex(768, 320, (g, w, h) => {
      g.fillStyle = '#f2d23a'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d0315e'; g.lineWidth = 6;
      for (const [a, s] of [[0, 1], [-0.5, 0.8], [0.5, 0.8], [-0.95, 0.6], [0.95, 0.6]]) { g.save(); g.translate(w / 2, h * 0.36); g.rotate(a); g.beginPath(); g.ellipse(0, -h * 0.12 * s, w * 0.035 * s, h * 0.13 * s, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
      g.fillStyle = '#d0315e'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `700 ${h * 0.24}px ${fam}`; g.fillText('LOTUSMANTRA', w / 2, h * 0.6);
      g.font = `700 ${h * 0.13}px ${fam}`; g.fillText('#01-03', w / 2, h * 0.84);
    });
    board(K, sign, 1.9, 0.79, V(31.95, 3.04, zs - 0.04), R.ry, 0.45);
    // the maroon BESPOKE UNISEX TAILORING board beside the door, a suit pictured under it (no face)
    const bespoke = canvasTex(256, 512, (g, w, h) => {
      g.fillStyle = '#7b1f3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6d5dc'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `700 ${w * 0.17}px ${fam}`; ['BESPOKE', 'UNISEX', 'TAILORING'].forEach((t, k) => g.fillText(t, w / 2, h * (0.16 + k * 0.1)));
      g.fillStyle = '#2b2b33'; g.beginPath(); g.moveTo(w * 0.2, h); g.lineTo(w * 0.22, h * 0.62); g.quadraticCurveTo(w * 0.5, h * 0.52, w * 0.78, h * 0.62); g.lineTo(w * 0.8, h); g.fill();
      g.fillStyle = '#f4f1ea'; g.beginPath(); g.moveTo(w * 0.42, h * 0.58); g.lineTo(w * 0.5, h * 0.8); g.lineTo(w * 0.58, h * 0.58); g.fill();
    });
    board(K, bespoke, 0.5, 1.0, V(32.75, 2.1, zs - 0.04), R.ry, 0.4);
    const poster = canvasTex(256, 320, (g, w, h) => {
      g.fillStyle = '#f8d7e3'; g.fillRect(0, 0, w, h); g.fillStyle = '#fbfaf6';
      g.beginPath(); g.moveTo(w * 0.3, h * 0.12); g.lineTo(w * 0.7, h * 0.12); g.lineTo(w * 0.92, h * 0.3); g.lineTo(w * 0.8, h * 0.4); g.lineTo(w * 0.72, h * 0.32); g.lineTo(w * 0.74, h * 0.92); g.lineTo(w * 0.26, h * 0.92); g.lineTo(w * 0.28, h * 0.32); g.lineTo(w * 0.2, h * 0.4); g.lineTo(w * 0.08, h * 0.3); g.closePath(); g.fill();
      g.strokeStyle = '#d4b26a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h * 0.14); g.lineTo(w / 2, h * 0.5); g.stroke();
    });
    board(K, poster, 0.42, 0.52, V(30.95, 2.35, zs - 0.04), R.ry, 0.4);
    // walls of juttis at both ends of the front, the door and glazing between them
    juttiWall(K, r, 28.32, 30.45, zs); juttiWall(K, r, 33.05, 33.68, zs);
    for (const [a, b] of [[30.45, 31.4], [32.5, 33.05]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 2.6), glass()); p.position.set((a + b) / 2, 1.35, zs + 0.02); K.extra.push(p); K.block(a, zs - 0.03, b, zs + 0.08); }
    for (const x of [31.4, 32.5]) K.box(x - 0.04, x + 0.04, 0, 2.66, zs - 0.02, zs + 0.06, 0xe9d6dc);
    K.box(31.36, 32.54, 2.62, 2.7, zs - 0.02, zs + 0.06, 0xe9d6dc);
    K.box(32.9, 33.0, 3.0, 3.1, zs - 0.08, zs, 0xf4f4f2); K.item('ball', [32.95, 2.97, zs - 0.07], 0.045, 0x1b1b1b);   // the CCTV camera
    // on the five-foot way: the kurta, full length; the sherwani with a turban, a child's sherwani with one at its feet
    // (close to the shopfront, so the five-foot way stays open past the column at its corner)
    mannequin(K, r, 30.95, zs - 0.3, 'torso', 0xb98a1e, 1, 0x8a6a16);
    mannequin(K, r, 32.85, zs - 0.3, 'torso', 0xf3ead6, 1, 0xf3ead6);
    K.item('plume', [32.85, 1.71, zs - 0.3], [0.115, 0.075, 0.115], 0xc62828); K.item('plume', [32.85, 1.77, zs - 0.3], [0.085, 0.055, 0.085], 0xe8c25a);
    mannequin(K, r, 32.42, zs - 0.26, 'torso', 0xf3ead6, 0.58, 0xf3ead6);
    K.item('plume', [32.42, 0.99, zs - 0.26], [0.065, 0.045, 0.065], 0xe65100);
    // inside: rails of sarees and suits on both walls, garments shown flat above them, mannequins in kurtas, shelves
    // of folded cloth at the back and the tailor's counter
    for (const [xw, face, z1] of [[28.15, 1, 11.3], [33.85, -1, 10.4]]) {
      const xr = xw + face * 0.35;
      rail(K, r, V(xr, 0, 8.3), V(xr, 0, z1), 1.85, 'print', [0.9, 1.4]);
      for (let z = 8.5; z < 11.3; z += 0.62) K.item('box', [xw + face * 0.03, 2.65, z], [0.02, 0.85, 0.5], 0xffffff, [0, 0, 0], patch(r, r() < 0.5 ? 'print' : 'mirror'));
    }
    mannequin(K, r, 29.75, 9.35, 'torso', 0xf06292); mannequin(K, r, 33.05, 9.0, 'torso', 0x4fc3f7);
    rail(K, r, V(29.6, 0, 10.2), V(31.2, 0, 10.2), 1.7, 'print', [0.9, 1.3]);                         // a rail of suits across the room
    for (let x = 29.35; x < 32.8; x += 0.58) K.item('box', [x, 2.95, SWB - 0.19], [0.46, 0.72, 0.02], 0xffffff, [0, 0, 0], patch(r, r() < 0.6 ? 'print' : 'mirror'));
    K.box(29.0, 33.0, 0, 2.4, SWB - 0.2, SWB - 0.15, 0xf2f2ef);
    for (const x of [29.0, 33.0]) K.box(x - 0.02, x + 0.02, 0, 2.4, SWB - 0.6, SWB - 0.2, 0xf2f2ef);
    for (let y = 0.3; y < 2.3; y += 0.3) {
      K.box(29.0, 33.0, y - 0.01, y + 0.01, SWB - 0.6, SWB - 0.2, 0xf2f2ef);
      for (let x = 29.1; x < 32.8; x += 0.26) for (let l = 0; l < 2; l++) K.item('box', [x + 0.12, y + 0.07 + l * 0.12, SWB - 0.42], [0.22, 0.11, 0.3], 0xffffff, [0, (r() - 0.5) * 0.06, 0], patch(r, 'print'));
    }
    K.block(29.0, SWB - 0.65, 33.0, SWB);
    K.box(32.4, 33.6, 0, 0.95, 10.6, 11.15, 0x8e6a49, 0.02); K.block(32.35, 10.55, 33.65, 11.2);
  }

  NAV.lane1 = {
    buildings: [],
    columns: () => false,
    build(root, grid) {
      const g = new THREE.Group(); g.name = 'lane1'; root.add(g);
      const kits = { 'NE-04': [1601, sathish], 'NE-05': [1602, sathishDisplay], 'NE-06': [2301, bangleShop], 'NE-07': [2302, bangleDisplay], 'SW-05': [2801, henna], 'SW-06': [2802, clothes], 'SW-07': [2803, lotusShop] };
      const parts = {}, built = {};
      for (const [key, [seed, fn]] of Object.entries(kits)) {
        const K = (built[key] = new Kit(seed)); fn(K, K.r);
        parts[key] = K.build(g, { soft: ['bunch'] }).map((m) => ({ m, role: 'look' }));
        for (const [x0, z0, x1, z1] of K.blocks) grid.fillRect(x0, z0, x1, z1);
      }
      // the lights: Sathish's white tubes over its racks, the bangle shop's bright room, the green-lit display, the
      // henna and clothing tents, LOTUSMANTRA's room and its walls of juttis
      NAV.addLight([16.8, -0.5, -11.9], [23.5, 3.4, -5.3], 0xfff4e4, 1.0, 0.5);
      NAV.addLight([23.5, -0.5, -11.9], [28.5, 3.4, -8.3], 0xfff0f4, 1.15, 0.45);
      NAV.addLight([23.5, -0.5, -6.8], [29.0, 3.0, -1.9], 0xeefff0, 0.45, 0.5);
      NAV.addLight([27.5, -0.5, 1.9], [34.5, 3.0, 5.7], 0xfff0dc, 0.5, 0.5);
      NAV.addLight([28.0, -0.5, 6.6], [34.0, 3.4, 11.9], 0xfff2e2, 1.1, 0.45);
      return {
        ...parts,
        // a shop is picked by its room behind the five-foot way; a display by its goods as they stand
        box: {
          'NE-04': new THREE.Box3(V(16.8, 0, NEB), V(23.5, GF, at(NEF, REC))), 'NE-06': new THREE.Box3(V(23.5, 0, NEB), V(28.5, GF, at(NEF, REC))),
          'SW-07': new THREE.Box3(V(28.0, 0, at(SWF, REC)), V(34.0, GF, SWB)),
        },
        pick: { 'NE-05': built['NE-05'].pickBoxes(), 'NE-07': built['NE-07'].pickBoxes(), 'SW-05': built['SW-05'].pickBoxes(), 'SW-06': built['SW-06'].pickBoxes() },
      };
    },
  };
  NAV.detailed.push(NAV.lane1);
  // shared with the stages after this one
  NAV.laneKit = { room, sideShelves, mannequin, rail, meshBoard, wireRack, juttiWall, fruitRack, hennaGrid, hennaHand, fridgeMat, meshTex, card, patch, bangles, seq, IN, WHITE };
})();
