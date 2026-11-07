// S7: the Jothi stretch, 41–66 m from Serangoon Road. Built from the frames at 860–1110 s (the walk back along the
// north-east side) and 340–480 s (out along the south-west side), and the stills of its ten entities.
// North-east: Jothi Store & Flower Shop fills 1 and 3 Campbell Lane, four storeys of dusty pink with cream frames round
// lit posters, a statue holding a diya and the blade sign ஜோதி at its corner, the black JOTHI fascia over the five-foot
// way. In the lane: its flower counter of step ladders hung with garlands, racks of painted diyas and a cage of clay ones,
// the long tent hung thick with garlands over tables of rangoli stickers, and the displays under its red-orange awning,
// where MADDY FLOWERS sells loose flowers and FAIR Value watches and clothes. South-west: 2, 6 and 8 Campbell Lane in the
// arcade's white and red, Jothi's racks behind a green tarp, the garland-and-toran stall and the deity statue stall.
// The north-east frontages run at a slant, so those buildings are built in frames of their own. Where things stand is
// read from the frames; the shop rooms are not seen in the video and are furnished as such shops are.
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const { Kit, pick, N, cell, labelled, pack, shelfWall, TERRA, PAINT, WOOD, STEEL, RED, addGeo } = NAV.shopKit;
  const { GF, V, board, boardTex, canvasTex, glass, fiveFootWay, window2, closedUnit, counter, TRIM, fam } = NAV.blockKit;
  const { room, meshTex, patch, seq } = NAV.laneKit;
  const ROSE = 0xe7cbc2, CREAM = 0xf3e6c8, GILT = 0xd9b45a, SLOT = 0xe8e2cf, WALLA = 0xf4efe6, TAMIL = `"Noto Sans Tamil", ${fam}`;

  // ---- printed things ----------------------------------------------------------------------------------------------------
  const sheet = (draw) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1024; draw(cv.getContext('2d'), 1024 / N); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  // the lit posters in Jothi's frames: the shop's own adverts, drawn without people: mixer-grinders, toiletries, a diya,
  // gold kolam, brass lamps, a marigold garland, cookware, a saree's border
  function postersAtlas() {
    if (postersAtlas.t) return postersAtlas.t;
    return (postersAtlas.t = sheet((g, s) => {
      const BG = ['#0f6b63', '#3b2a7a', '#f28c28', '#1f5fbf', '#7a1f2b', '#f5c542', '#c62828', '#d81b60'];
      for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) {
        const k = (row + i * 3) % 8, R = seq(row * 8 + i + 3);
        g.save(); g.translate(i * s, row * s); g.fillStyle = BG[k]; g.fillRect(0, 0, s, s);
        if (k === 0) {                                                                          // mixer-grinders
          g.fillStyle = '#dfe6ea'; g.fillRect(s * 0.28, s * 0.62, s * 0.44, s * 0.2);
          for (let j = 0; j < 3; j++) { g.fillStyle = '#c9d3d9'; g.beginPath(); g.moveTo(s * (0.22 + j * 0.2), s * 0.6); g.lineTo(s * (0.38 + j * 0.2), s * 0.6); g.lineTo(s * (0.4 + j * 0.2), s * 0.3); g.lineTo(s * (0.2 + j * 0.2), s * 0.3); g.fill(); g.fillStyle = '#263238'; g.fillRect(s * (0.21 + j * 0.2), s * 0.26, s * 0.18, s * 0.05); }
        } else if (k === 1) {                                                                   // toiletries
          for (let j = 0; j < 6; j++) { const h = 0.25 + R() * 0.3, x = 0.12 + j * 0.13; g.fillStyle = ['#ffffff', '#e57373', '#81c784', '#ffd54f', '#4fc3f7', '#ce93d8'][j]; g.fillRect(s * x, s * (0.85 - h), s * 0.1, s * h); g.fillStyle = '#263238'; g.fillRect(s * (x + 0.03), s * (0.8 - h), s * 0.04, s * 0.05); }
        } else if (k === 2) {                                                                   // a diya, its flame
          const gr = g.createRadialGradient(s / 2, s * 0.45, 2, s / 2, s * 0.45, s * 0.5); gr.addColorStop(0, '#fff3c0'); gr.addColorStop(1, '#f28c28'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
          g.fillStyle = '#8d4f2a'; g.beginPath(); g.ellipse(s / 2, s * 0.72, s * 0.22, s * 0.09, 0, 0, Math.PI); g.fill();
          g.fillStyle = '#fffbe6'; g.beginPath(); g.moveTo(s / 2, s * 0.38); g.quadraticCurveTo(s * 0.58, s * 0.58, s / 2, s * 0.68); g.quadraticCurveTo(s * 0.42, s * 0.58, s / 2, s * 0.38); g.fill();
        } else if (k === 3) {                                                                   // gold kolam
          g.strokeStyle = '#f2cf6a'; g.lineWidth = 3;
          for (let ring = 1; ring < 4; ring++) { g.beginPath(); g.arc(s / 2, s / 2, ring * s * 0.11, 0, Math.PI * 2); g.stroke(); }
          for (let p = 0; p < 8; p++) { const a = (p / 8) * Math.PI * 2; g.beginPath(); g.ellipse(s / 2 + Math.cos(a) * s * 0.3, s / 2 + Math.sin(a) * s * 0.3, s * 0.07, s * 0.035, a, 0, Math.PI * 2); g.stroke(); }
        } else if (k === 4) {                                                                   // brass lamps
          g.fillStyle = '#e8b94a';
          for (const [cx, sc] of [[0.3, 0.8], [0.6, 1], [0.82, 0.7]]) { g.fillRect(s * (cx - 0.015), s * (0.85 - 0.5 * sc), s * 0.03, s * 0.5 * sc); g.beginPath(); g.ellipse(s * cx, s * 0.86, s * 0.1 * sc, s * 0.03, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(s * cx, s * (0.86 - 0.3 * sc), s * 0.09 * sc, s * 0.025, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(s * cx, s * (0.85 - 0.62 * sc)); g.lineTo(s * (cx + 0.04), s * (0.85 - 0.5 * sc)); g.lineTo(s * (cx - 0.04), s * (0.85 - 0.5 * sc)); g.fill(); }
        } else if (k === 5) {                                                                   // a marigold garland in swags
          for (let sw = 0; sw < 3; sw++) for (let t = 0; t <= 10; t++) { const x = s * (0.08 + sw * 0.3 + t * 0.027), y = s * (0.3 + 0.35 * Math.sin((t / 10) * Math.PI)); g.fillStyle = t % 3 ? '#ef6c00' : '#c62828'; g.beginPath(); g.arc(x, y, s * 0.035, 0, Math.PI * 2); g.fill(); }
        } else if (k === 6) {                                                                   // cookware
          g.fillStyle = '#cfd8dc'; g.fillRect(s * 0.15, s * 0.45, s * 0.35, s * 0.32); g.fillStyle = '#263238'; g.fillRect(s * 0.2, s * 0.4, s * 0.25, s * 0.05); g.fillRect(s * 0.44, s * 0.36, s * 0.04, s * 0.08);
          g.fillStyle = '#b0bec5'; g.beginPath(); g.ellipse(s * 0.72, s * 0.66, s * 0.17, s * 0.12, 0, 0, Math.PI * 2); g.fill();
        } else {                                                                                // a saree's border
          g.fillStyle = '#f48fb1'; g.beginPath(); g.moveTo(0, s * 0.2); g.lineTo(s, s * 0.6); g.lineTo(s, s); g.lineTo(0, s); g.fill();
          g.fillStyle = '#f2cf6a'; g.beginPath(); g.moveTo(0, s * 0.3); g.lineTo(s, s * 0.7); g.lineTo(s, s * 0.78); g.lineTo(0, s * 0.38); g.fill();
        }
        g.restore();
      }
    }));
  }
  // what Jothi's tables and hooks are full of: rangoli sticker sets in their sleeves, torans and door hangings (some read
  // WEL COME), Happy Deepavali peacock boards; and the yellow JOTHI card, the E-INVOICE board, the cage's price card
  const CARD = [7, 7], EINV = [7, 6], PRICE = [7, 5];
  function stickersAtlas() {
    if (stickersAtlas.t) return stickersAtlas.t;
    return (stickersAtlas.t = sheet((g, s) => {
      const COL = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#d81b60', '#00897b'];
      for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) {
        const R = seq(row * 31 + i * 7 + 5), x = i * s, y = row * s;
        g.save(); g.translate(x, y); g.textAlign = 'center'; g.textBaseline = 'middle';
        if (row === 7 && i >= 5) {
          g.fillStyle = i === 5 ? '#ffffff' : '#f7d23a'; g.fillRect(0, 0, s, s);
          g.fillStyle = i === 5 ? '#c62828' : '#1b1b1b';
          if (i === 5) { g.font = `700 ${s * 0.3}px ${fam}`; g.fillText('$.28/-', s / 2, s / 2); }
          else if (i === 6) { g.fillStyle = '#c62828'; g.font = `700 ${s * 0.2}px ${fam}`; g.fillText('E-INVOICE', s / 2, s / 2); }
          else { g.font = `700 ${s * 0.26}px ${fam}`; g.fillText('JOTHI', s / 2, s * 0.34); g.font = `700 ${s * 0.24}px ${TAMIL}`; g.fillText('ஜோதி', s / 2, s * 0.7); }
        } else if (row < 4) {                                                                   // rangoli stickers on a sheet
          g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, s, s);
          const n = 6 + Math.floor(R() * 6), c0 = COL[Math.floor(R() * 8)], c1 = COL[Math.floor(R() * 8)], c2 = COL[Math.floor(R() * 8)];
          for (let p = 0; p < n; p++) { const a = (p / n) * Math.PI * 2; g.fillStyle = p % 2 ? c0 : c1; g.beginPath(); g.ellipse(s / 2 + Math.cos(a) * s * 0.26, s / 2 + Math.sin(a) * s * 0.26, s * 0.13, s * 0.06, a, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = c2; g.beginPath(); g.arc(s / 2, s / 2, s * 0.15, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#f2cf6a'; for (let p = 0; p < 12; p++) { const a = (p / 12) * Math.PI * 2; g.beginPath(); g.arc(s / 2 + Math.cos(a) * s * 0.42, s / 2 + Math.sin(a) * s * 0.42, s * 0.025, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(s * 0.06, 0, s * 0.06, s);
        } else if (row < 6 || row === 7) {                                                      // torans and door hangings
          g.fillStyle = ['#c62828', '#f2c94c', '#2e7d32', '#8e24aa'][(row + i) % 4]; g.fillRect(0, 0, s, s);
          g.strokeStyle = '#f2cf6a'; g.lineWidth = 5; g.strokeRect(s * 0.08, s * 0.08, s * 0.84, s * 0.84);
          g.fillStyle = '#f2cf6a'; for (let p = 0; p < 8; p++) { g.beginPath(); g.arc(s * (0.15 + p * 0.1), s * 0.88, s * 0.03, 0, Math.PI * 2); g.fill(); }
          if ((row + i) % 3 === 0) { g.fillStyle = '#fff3c4'; g.font = `700 ${s * 0.2}px ${fam}`; g.fillText('WEL', s / 2, s * 0.4); g.fillText('COME', s / 2, s * 0.62); }
          else { g.strokeStyle = '#fff3c4'; g.lineWidth = 3; g.beginPath(); g.moveTo(s / 2, s * 0.2); g.lineTo(s * 0.8, s / 2); g.lineTo(s / 2, s * 0.8); g.lineTo(s * 0.2, s / 2); g.closePath(); g.stroke(); g.beginPath(); g.arc(s / 2, s / 2, s * 0.12, 0, Math.PI * 2); g.stroke(); }
        } else {                                                                                // peacock boards
          g.fillStyle = '#0d47a1'; g.fillRect(0, 0, s, s);
          for (let p = 0; p < 7; p++) { const a = Math.PI * (0.15 + p * 0.117); g.fillStyle = p % 2 ? '#2e7d32' : '#00897b'; g.beginPath(); g.ellipse(s / 2 + Math.cos(a) * s * 0.3, s * 0.7 - Math.sin(a) * s * 0.3, s * 0.08, s * 0.15, -a + Math.PI / 2, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f2cf6a'; g.beginPath(); g.arc(s / 2 + Math.cos(a) * s * 0.33, s * 0.7 - Math.sin(a) * s * 0.33, s * 0.035, 0, Math.PI * 2); g.fill(); }
          if (i % 2 === 0) { g.fillStyle = '#f2cf6a'; g.font = `italic 700 ${s * 0.13}px ${fam}`; g.fillText('Happy', s / 2, s * 0.72); g.fillText('Deepavali', s / 2, s * 0.86); }
        }
        g.restore();
      }
    }));
  }
  // garland strands along their length: marigold, jasmine with roses, jasmine, roses, pinks, mixed, mango leaves, tinsel
  const STRAND = { marigold: 0, jasmineRose: 1, jasmine: 2, rose: 3, pink: 4, mixed: 5, leaves: 6, tinsel: 7 };
  function strandAtlas() {
    if (strandAtlas.t) return strandAtlas.t;
    return (strandAtlas.t = sheet((g, s) => {
      const PAL = [['#f57c00', '#fbc02d'], ['#f7f3ea', '#d32f2f'], ['#f7f3ea', '#cfe8c0'], ['#c62828', '#ad1457'], ['#f48fb1', '#f7f3ea'], ['#8e24aa', '#fdd835'], ['#2e7d32', '#7cb342'], ['#e8c25a', '#fff3c4']];
      for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) {
        const [a, b] = PAL[row], R = seq(row * 13 + i + 1), band = 2 + Math.floor(R() * 4);
        g.save(); g.translate(i * s, row * s); g.fillStyle = a; g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 8) for (let x = 4; x < s; x += 10) { g.fillStyle = Math.floor(y / 8 / band) % 3 === 2 ? b : (x + y) % 20 ? a : b; g.beginPath(); g.arc(x + (y % 16 ? 5 : 0), y + 4, 4.2, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < s; y += 8) g.fillRect(0, y, s, 1);
        g.restore();
      }
    }));
  }
  NAV.shopKit.ATLASES['s7-posters'] = postersAtlas; NAV.shopKit.ATLASES['s7-stickers'] = stickersAtlas; NAV.shopKit.ATLASES['s7-strand'] = strandAtlas;
  const sticker = (row, col) => [row, col, 's7-stickers'];
  // a garland strand hanging from its top, flowers bunched along it (unit length and radius; items scale it)
  addGeo('s7-strand', () => {
    const p = [new THREE.Vector2(0.001, 0.02), new THREE.Vector2(0.45, 0)];
    for (let k = 1; k <= 10; k++) p.push(new THREE.Vector2(k % 2 ? 1 : 0.72, -k / 10.6));
    p.push(new THREE.Vector2(0.5, -0.995), new THREE.Vector2(0.001, -1.02));
    return new THREE.LatheGeometry(p, 5);
  });
  // a heart-shaped lamp, as they hang from Jothi's racks
  addGeo('s7-heart', () => {
    const h = new THREE.Shape();
    h.moveTo(0, -0.5); h.bezierCurveTo(-0.15, -0.3, -0.56, -0.1, -0.5, 0.18); h.bezierCurveTo(-0.45, 0.5, -0.08, 0.5, 0, 0.25);
    h.bezierCurveTo(0.08, 0.5, 0.45, 0.5, 0.5, 0.18); h.bezierCurveTo(0.56, -0.1, 0.15, -0.3, 0, -0.5);
    return new THREE.ExtrudeGeometry(h, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1, curveSegments: 5 }).translate(0, 0, -0.15);
  });

  // ---- building in a frame of one's own ----------------------------------------------------------------------------------
  // A frontage's frame: u along it from (x0, z0), w out of it towards the lane, y up; M places it in the world. The kit
  // helpers (room, fiveFootWay, shelfWall, counter…) take a kit first, so they build in a frame when handed framed(K, fr).
  function frontage(x0, z0, x1, z1) {
    const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(-(z1 - z0) / len, (x1 - x0) / len);
    return { len, yaw, M: new THREE.Matrix4().makeRotationY(yaw).setPosition(x0, 0, z0) };
  }
  // the same frame moved to (u, w) and turned by a about the vertical
  const turned = (fr, u, w, a) => ({ yaw: fr.yaw + a, M: fr.M.clone().multiply(new THREE.Matrix4().makeRotationY(a).setPosition(u, 0, w)) });
  function framed(K, fr) {
    const { M } = fr, q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), fr.yaw), e = new THREE.Euler(), qq = new THREE.Quaternion();
    const P = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(M);
    const flat = (pts) => pts.map(([x, z]) => { const v = P(x, 0, z); return [v.x, v.z]; });
    const F = {
      r: K.r, P,
      extra: { push: (m) => { m.updateMatrix(); m.applyMatrix4(M); K.extra.push(m); } },
      add: (g, color, side, ink) => K.add(g.applyMatrix4(M), color, side, ink),
      box(x0, x1, y0, y1, z0, z1, color, r = 0, side) {
        if (x0 > x1) [x0, x1] = [x1, x0]; if (y0 > y1) [y0, y1] = [y1, y0]; if (z0 > z1) [z0, z1] = [z1, z0];
        const w = x1 - x0, h = y1 - y0, d = z1 - z0;
        const g = r > 0 ? new THREE.RoundedBoxGeometry(w, h, d, r <= 0.025 ? 1 : 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d);
        return F.add(g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), color, side);
      },
      cyl: (x, y, z, r, h, color, o = {}) => F.add(new THREE.CylinderGeometry(o.rt ?? r, r, h, o.seg ?? 16, 1, !!o.open).translate(x, y + h / 2, z), color, o.open ? THREE.DoubleSide : undefined),
      rod: (a, b, r, color, seg) => K.rod(a.clone().applyMatrix4(M), b.clone().applyMatrix4(M), r, color, seg),
      plane(w, h, color, at, rot, side = THREE.DoubleSide) { const g = new THREE.PlaneGeometry(w, h); g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot))); g.translate(...at); return F.add(g, color, side); },
      item(kind, p, s, color, rot = [0, 0, 0], label = null) {
        const w = P(...p); qq.setFromEuler(e.set(...rot)).premultiply(q); e.setFromQuaternion(qq);
        K.item(kind, [w.x, w.y, w.z], s, color, [e.x, e.y, e.z], label);
      },
      block: (x0, z0, x1, z1) => K.blockPoly(flat([[x0, z0], [x1, z0], [x1, z1], [x0, z1]])),
      blockPoly: (pts) => K.blockPoly(flat(pts)),
    };
    return F;
  }
  // the world box round a frame's rectangle u0..u1 × w0..w1, y0..y1
  const frameBox = (fr, u0, u1, w0, w1, y0, y1) => new THREE.Box3().setFromPoints([[u0, w0], [u1, w0], [u1, w1], [u0, w1]].flatMap(([u, w]) => [new THREE.Vector3(u, y0, w).applyMatrix4(fr.M), new THREE.Vector3(u, y1, w).applyMatrix4(fr.M)]));
  // a rail of hanging garland strands from a to b at height y (any kit, framed or not); kept short over a way through
  function strands(K, r, a, b, y, len, step, rows, { clear = null, thick = 0.035 } = {}) {
    K.rod(V(a.x, y + 0.02, a.z), V(b.x, y + 0.02, b.z), 0.01, 0xb9bec4, 6);
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    for (let t = 0.05; t < L - 0.04; t += step * (0.8 + r() * 0.4)) {
      let l = len[0] + r() * (len[1] - len[0]);
      if (clear && t > clear[0] && t < clear[1]) l = Math.min(l, y - 1.98);
      if (l < 0.15) continue;
      K.item('s7-strand', [a.x + (dx * t) / L + (r() - 0.5) * 0.01, y, a.z + (dz * t) / L + (r() - 0.5) * 0.05], [thick * (0.85 + r() * 0.3), l, thick], 0xffffff, [0, r() * 6.28, 0], [pick(r, rows), Math.floor(r() * N), 's7-strand']);
    }
  }
  const lit = (color, i = 1) => NAV.toon(color, { emissive: color, emissiveIntensity: i, ink: false });
  // the face of a cream slotted-angle shelf stocked with painted diyas in their boxes, bowls and jars, as a picture
  const shelfFace = () => shelfFace.t || (shelfFace.t = canvasTex(256, 512, (g, w, h) => {
    const R = seq(91); g.fillStyle = '#d9d2bf'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 5; k++) {
      const y = h - 14 - k * (h - 30) / 4;
      for (let x = 8; x < w - 20;) { const bw = 18 + R() * 22, bh = 24 + R() * 40; g.fillStyle = ['#c62828', '#2e7d4f', '#f2b632', '#1f5fa8', '#e86fa8', '#9e9e9e', '#7b4bb3'][Math.floor(R() * 7)]; g.fillRect(x, y - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 3, y - bh + 4, bw - 6, 4); x += bw + 3; }
      g.fillStyle = '#efe9da'; g.fillRect(0, y, w, 8);
    }
    g.fillStyle = '#efe9da'; for (const x of [0, w / 2 - 5, w - 10]) g.fillRect(x, 0, 10, h);
    g.fillStyle = '#8a8170'; for (let y = 6; y < h; y += 18) for (const x of [4, w / 2 - 1, w - 6]) g.fillRect(x, y, 2, 8);
  }));
  // a caged LED bulb hanging on its cord
  function bulb(K, x, y, z) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), lit(0xfdfcf6)); b.position.set(x, y, z); K.extra.push(b);
    K.rod(V(x, y + 0.06, z), V(x, y + 0.42, z), 0.005, 0x222222, 4);
  }

  // ---- north-east: Jothi Store & Flower Shop in 1 and 3 Campbell Lane -------------------------------------------------------
  const B1 = frontage(41.3, -6.7, 51.63, -6.2), B3 = frontage(51.63, -6.2, 63.75, -5.3);
  const LOC1 = { x0: 0, x1: B1.len, zf: 0, s: -1 }, LOC3 = { x0: 0, x1: B3.len, zf: 0, s: -1 };   // as room() and fiveFootWay() read a block
  const FAIR = 7.9;                                    // along 3 Campbell Lane, where FAIR Value's unit begins (x 59.5)
  const TOP = 13.2, ROWS = [5.15, 8.35, 11.55];       // four storeys; the rows of frames on the upper three
  const PEDIMENT = () => PEDIMENT.g || (PEDIMENT.g = (() => {
    const s = new THREE.Shape(); s.moveTo(-0.86, 0); s.quadraticCurveTo(0, 0.62, 0.86, 0); s.lineTo(0.66, 0); s.quadraticCurveTo(0, 0.36, -0.66, 0); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false, curveSegments: 10 });
  })());
  // an ornate cream frame round a lit poster: pilasters, a sill on a corbel, a lintel under a scrolled pediment, a gilt
  // medallion, a spotlight below; the poster joins one lit mesh per front (posterMesh)
  function frameAt(F, fr, uc, yc, posters, r) {
    for (const s of [-1, 1]) F.box(uc + s * 0.68, uc + s * 0.8, yc - 0.66, yc + 0.62, 0, 0.12, CREAM);
    F.box(uc - 0.88, uc + 0.88, yc - 0.8, yc - 0.66, -0.02, 0.18, CREAM, 0.02);
    F.box(uc - 0.22, uc + 0.22, yc - 0.98, yc - 0.8, 0, 0.13, CREAM, 0.02);
    F.box(uc - 0.84, uc + 0.84, yc + 0.62, yc + 0.72, -0.01, 0.15, CREAM);
    F.add(PEDIMENT().clone().translate(uc, yc + 0.72, 0), CREAM);
    F.add(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16).rotateX(Math.PI / 2).translate(uc, yc + 1.02, 0.15), GILT);
    for (const s of [-1, 1]) F.add(new THREE.CylinderGeometry(0.06, 0.06, 0.13, 12).rotateX(Math.PI / 2).translate(uc + s * 0.8, yc + 0.8, 0.07), CREAM);
    F.box(uc - 0.06, uc + 0.06, yc - 1.12, yc - 1.04, 0.1, 0.3, 0x1b1b1b);
    posters.push([fr, uc, yc, [Math.floor(r() * N), Math.floor(r() * N)]]);
  }
  // all the posters of the fronts in one lit mesh, each poster with its own cell of the atlas
  function posterMesh(list) {
    const geos = list.map(([fr, uc, yc, [row, col], pw = 1.32, ph = 1.12, w = 0.07]) => {
      const g = new THREE.PlaneGeometry(pw, ph), uv = g.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (uv.getX(k) + col) / N, (uv.getY(k) + N - 1 - row) / N);
      return g.translate(uc, yc, w).applyMatrix4(fr.M);
    });
    const tex = postersAtlas(), m = new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(geos), NAV.toon(0xffffff, { map: tex, emissive: 0xffffff, emissiveIntensity: 0.62, unique: true }));
    m.material.emissiveMap = tex;
    return m;
  }
  // a front of Jothi's above its five-foot way: the upper floors back over the plot, a cream beam, string courses, cornice
  // and parapet, corner pilasters, and on each floor a row of frames
  function jothiFront(F, fr, len, us, posters, r) {
    F.box(0, len, GF, TOP, -11.4, 0, ROSE);
    F.box(0, len, GF - 0.02, GF + 0.36, -0.14, 0.03, CREAM, 0.02);
    for (const y of [6.8, 10.0]) F.box(0, len, y - 0.06, y + 0.06, 0, 0.08, CREAM);
    F.box(0, len, TOP, TOP + 0.3, -0.12, 0.26, CREAM, 0.02);
    F.box(0, len, TOP + 0.3, TOP + 0.95, -0.06, 0.1, ROSE);
    F.box(0, len, TOP + 0.95, TOP + 1.05, -0.08, 0.14, CREAM);
    for (const u of [0.13, len - 0.13]) F.box(u - 0.13, u + 0.13, GF + 0.36, TOP, 0, 0.07, CREAM);
    for (const yc of ROWS) for (const uc of us) frameAt(F, fr, uc, yc, posters, r);
  }
  // the figure of a woman holding a diya, on a carved bracket between the frames: a simple form, without a face
  function statue(F, uc, y0) {
    F.box(uc - 0.3, uc + 0.3, y0 - 0.5, y0 - 0.38, 0, 0.5, 0x9a5a3a, 0.02);
    F.box(uc - 0.22, uc + 0.22, y0 - 0.38, y0 - 0.12, 0, 0.4, 0xa8653f, 0.02);
    F.box(uc - 0.3, uc + 0.3, y0 - 0.12, y0, 0, 0.5, 0x9a5a3a, 0.02);
    const w = 0.27;
    F.add(new THREE.CylinderGeometry(0.15, 0.24, 1.05, 16).translate(uc, y0 + 0.525, w), 0x2e8b6a);                 // her skirt
    F.add(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 14).translate(uc, y0 + 1.3, w), 0x8e3a7a);                    // blouse and drape
    F.add(new THREE.SphereGeometry(0.105, 14, 10).translate(uc, y0 + 1.66, w), 0xc98b62);
    F.add(new THREE.SphereGeometry(0.07, 10, 8).translate(uc, y0 + 1.72, w - 0.08), 0x2b1a12);
    for (const s of [-1, 1]) F.rod(V(uc + s * 0.14, y0 + 1.47, w), V(uc + s * 0.05, y0 + 1.24, w + 0.17), 0.033, 0xc98b62);
    F.add(new THREE.ConeGeometry(0.09, 0.07, 14).rotateX(Math.PI).translate(uc, y0 + 1.25, w + 0.22), GILT);         // the diya
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 8), lit(0xffc860)); fl.position.set(uc, y0 + 1.33, w + 0.22); F.extra.push(fl);
  }
  // the blade sign at the corner, lit: ஜோதி over lines of smaller red script too small to read in the video, an emblem
  function blade(F) {
    const tex = canvasTex(256, 1024, (g, w, h) => {
      g.fillStyle = '#3a2414'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9b45a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#fff6e6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${w * 0.6}px ${TAMIL}`;
      g.fillText('ஜோ', w / 2, h * 0.2); g.fillText('தி', w / 2, h * 0.46);
      g.fillStyle = '#e53935'; for (let k = 0; k < 3; k++) g.fillRect(w * 0.24, h * (0.66 + k * 0.045), w * 0.52, h * 0.016);
      g.strokeStyle = '#d9b45a'; g.lineWidth = 5; g.beginPath(); g.arc(w / 2, h * 0.88, w * 0.2, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(w / 2, h * 0.84); g.lineTo(w / 2, h * 0.92); g.moveTo(w * 0.42, h * 0.9); g.lineTo(w * 0.58, h * 0.9); g.stroke();
    });
    F.box(0.25, 0.47, 4.25, 7.15, 0.08, 0.92, 0x3a2414);
    for (const s of [-1, 1]) board(F, tex, 0.7, 2.8, V(0.36 + s * 0.12, 5.7, 0.5), s * Math.PI / 2, 0.55);
  }
  // the black fascia over the five-foot way: ஜோதி, the lamp emblem over SINCE 1960, JOTHI, repeated along the front
  function fascia(F, u0, u1, reps) {
    const L = u1 - u0, tex = canvasTex(2048, Math.round((2048 * 0.7) / L), (g, w, h) => {
      g.fillStyle = '#151515'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9b45a'; g.fillRect(0, 4, w, 3); g.fillRect(0, h - 7, w, 3);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let k = 0; k < reps; k++) {
        const x = (w / reps) * k;
        g.fillStyle = '#efe3c8'; g.font = `700 ${h * 0.46}px ${TAMIL}`; g.fillText('ஜோதி', x + (w / reps) * 0.17, h * 0.54);
        g.strokeStyle = '#d9b45a'; g.lineWidth = 3; g.beginPath(); g.arc(x + (w / reps) * 0.42, h * 0.4, h * 0.2, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#d9b45a'; g.font = `600 ${h * 0.13}px ${fam}`; g.fillText('SINCE 1960', x + (w / reps) * 0.42, h * 0.78);
        g.fillStyle = '#efe3c8'; g.font = `700 ${h * 0.5}px Georgia, "Times New Roman", serif`; g.fillText('JOTHI', x + (w / reps) * 0.72, h * 0.55);
      }
    });
    board(F, tex, L, 0.7, V((u0 + u1) / 2, 3.8, 0.045), 0, 0.3);
  }
  // Jothi's red-orange retractable awning over the displays at the east end, on folding arms; rods of red, green and blue
  // under it to hang garlands from, caged LED bulbs and a tube
  function awning(F, u0, u1) {
    const yA = 3.42, yB = 2.78, wB = 3.35, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([u0, yA, 0.05, u1, yA, 0.05, u1, yB, wB, u0, yA, 0.05, u1, yB, wB, u0, yB, wB], 3)); g.computeVertexNormals();
    F.add(g, 0xe0562a, THREE.DoubleSide);
    F.box(u0, u1, yB - 0.1, yB + 0.02, wB - 0.04, wB + 0.04, 0xf2f2f2);
    for (let k = 0; k < 5; k++) { const u = u0 + 0.3 + (k * (u1 - u0 - 0.6)) / 4; F.rod(V(u, yA - 0.28, 0.08), V(u, yB - 0.08, wB - 0.06), 0.02, 0xf2f2f2, 6); }
    [[1.1, 0xd8323a], [1.9, 0x2e8b57], [2.7, 0x2d6fd6]].forEach(([w, c]) => F.rod(V(u0 + 0.1, 2.6, w), V(u1 - 0.1, 2.6, w), 0.018, c, 6));
    for (let u = u0 + 0.7; u < u1 - 0.3; u += 1.4) for (const w of [1.5, 2.9]) bulb(F, u, 2.3, w);
    const tube = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.07), lit(0xffffff)); tube.position.set((u0 + u1) / 2, 2.62, 2.3); F.extra.push(tube);
  }
  function jothi(K, r) {
    const F1 = framed(K, B1), F3 = framed(K, B3), posters = [];
    // the fronts: three rows of frames on each; the statue and the blade sign at the north-west corner of number 1
    jothiFront(F1, B1, B1.len, [1.35, 3.95, 6.55, 9.0], posters, r);
    jothiFront(F3, B3, B3.len, [1.5, 4.4, 7.3, 10.2], posters, r);
    statue(F1, 2.65, 6.15); blade(F1);
    fascia(F1, 0.2, B1.len, 3); fascia(F3, 0, FAIR - 0.2, 2);
    // the five-foot ways (one column at the joint), the rooms behind them
    fiveFootWay(F1, LOC1, [0.25, 5.17], 0xe9e4da); fiveFootWay(F3, LOC3, [0.0, 6.08, 11.9], 0xe9e4da);
    room(F1, LOC1, 0, B1.len, -8.8, { floor: 0xe6dfd2, tubes: 4 });
    room(F3, LOC3, 0, FAIR, -8.0, { floor: 0xe6dfd2, tubes: 3 });
    F1.box(0, B1.len, 0, GF, -11.4, -8.8, ROSE); F1.block(0, -11.6, B1.len, -8.7);
    F3.box(0, FAIR, 0, GF, -11.4, -8.0, ROSE); F3.block(0, -11.6, FAIR, -7.9);
    F3.box(FAIR, B3.len, 0, GF, -11.4, -6.6, ROSE); F3.block(FAIR, -11.6, B3.len, -6.5);
    // inside (not seen in the video): shelving of pooja goods to the ceiling on the back walls, gondolas between, the
    // till by the door, garlands hung inside the opening
    shelfWall(framed(K, turned(B1, 0, -8.65, Math.PI / 2)), r, 0, -1, 0.3, B1.len - 0.3, 3.05, 7, 3.35);
    shelfWall(framed(K, turned(B3, 0, -7.85, Math.PI / 2)), r, 0, -1, 0.3, FAIR - 0.3, 3.05, 7, 3.35);
    for (const u of [3.4, 6.9]) slottedRow(F1, r, u - 0.45, u + 0.45, -7.6, -3.7, 1.9, 5, diyaStock(F1, r));
    slottedRow(F3, r, 3.55, 4.45, -6.9, -3.6, 1.9, 5, diyaStock(F3, r));
    F1.box(0.6, 2.4, 0, 0.95, -3.2, -2.55, 0x8e6a49, 0.02); F1.box(1.0, 1.4, 0.95, 1.2, -3.1, -2.8, 0x2a2d33); F1.block(0.55, -3.25, 2.45, -2.5);
    strands(F1, r, V(0.4, 0, -2.25), V(B1.len - 0.4, 0, -2.25), 2.62, [0.35, 0.6], 0.16, [0, 1, 2, 4]);
    // number 3's glass doors, posters on them, a way in between
    for (const [a, b] of [[0.35, 2.9], [4.9, 7.55]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 2.5), glass()); p.position.set((a + b) / 2, 1.3, -1.82); F3.extra.push(p);
      F3.box(a, b, 2.55, 2.62, -1.86, -1.78, 0xb9bec4); F3.block(a, -1.9, b, -1.74);
      for (let u = a + 0.45; u < b - 0.3; u += 0.95) posters.push([B3, u, 1.45, [Math.floor(r() * N), Math.floor(r() * N)], 0.5, 0.65, -1.8]);
    }
    awning(F3, 3.87, B3.len - 0.05);
    K.extra.push(posterMesh(posters));
  }

  // ---- north-east: FAIR Value at the east end of 3 Campbell Lane -------------------------------------------------------------
  function fairValue(K, r) {
    const F = framed(K, B3);
    room(F, LOC3, FAIR, B3.len, -6.6, { floor: 0xe2e5e9, tubes: 2 });
    // its front: a pier faced in diamond mosaic, the CROWN lightbox of watches by the door, the blue banner with its name,
    // a white valance printed with clothes over it
    const mosaic = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 * 16; x < w; x += 32) { g.fillStyle = ['#7a5a3a', '#b08a5a', '#3a3a3a'][(x + y) % 3]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 8); g.lineTo(x, y + 16); g.lineTo(x - 8, y + 8); g.fill(); } });
    const mp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 2.7), NAV.toon(0xffffff, { map: mosaic, unique: true })); mp.position.set(FAIR + 0.15, 1.36, -1.765); F.extra.push(mp);
    const crown = canvasTex(256, 768, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0d2a6b'); gr.addColorStop(1, '#1e5fbf'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = `700 ${w * 0.2}px Georgia, serif`; g.fillText('CROWN', w / 2, h * 0.08);
      for (const [cx, cy, s] of [[0.35, 0.3, 1], [0.66, 0.42, 0.8], [0.4, 0.62, 1.1], [0.62, 0.82, 0.9]]) { g.fillStyle = '#e8c25a'; g.fillRect(w * (cx - 0.04), h * (cy - 0.1 * s), w * 0.08, h * 0.2 * s); g.fillStyle = '#f5f5f5'; g.beginPath(); g.arc(w * cx, h * cy, w * 0.11 * s, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#263238'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * cx, h * cy); g.lineTo(w * cx, h * cy - w * 0.07 * s); g.moveTo(w * cx, h * cy); g.lineTo(w * cx + w * 0.05 * s, h * cy); g.stroke(); }
    });
    F.box(8.38, 8.96, 0.02, 1.98, -1.74, -1.56, 0x1b1b1b, 0.01); board(F, crown, 0.52, 1.88, V(8.67, 1.0, -1.545), 0, 0.6); F.block(8.33, -1.79, 9.01, -1.5);
    const banner = boardTex([['FAIR Value', 0.62, 0.52]], { w: 3.7, h: 0.3, bg: '#1a3f9a', ink: '#ffffff' });
    board(F, banner, 3.7, 0.3, V((FAIR + B3.len) / 2 + 0.05, 2.56, -1.765), 0, 0.35);
    const valance = canvasTex(1024, 160, (g, w, h) => {
      g.fillStyle = '#e7e0d4'; g.fillRect(0, 0, w, h); g.fillStyle = '#fbfbf8';
      g.fillRect(0, 0, w, h * 0.7); for (let x = 0; x < w; x += 64) { g.beginPath(); g.arc(x + 32, h * 0.7, 32, 0, Math.PI); g.fill(); }
      const C = ['#263238', '#c62828', '#1565c0', '#8d6e63', '#2e7d32', '#455a64'];
      for (let k = 0; k < 14; k++) { const x = 30 + k * 72; g.fillStyle = C[k % 6]; if (k % 3 === 2) { g.fillRect(x, 20, 26, 70); g.fillRect(x + 30, 20, 26, 70); } else { g.fillRect(x, 28, 56, 62); g.fillRect(x - 10, 28, 12, 34); g.fillRect(x + 54, 28, 12, 34); } }
    });
    board(F, valance, B3.len - FAIR - 0.3, 0.55, V((FAIR + B3.len) / 2, 3.0, -1.765), 0, 0.3);
    // inside: rails of shirts and trousers on both walls, folded clothes on the back wall, a glass counter of watches
    for (const [uw, face] of [[FAIR + 0.17, 1], [B3.len - 0.17, -1]]) {
      const ur = uw + face * 0.35;
      F.rod(V(ur, 1.8, -2.3), V(ur, 1.8, -5.9), 0.013, 0xc9ced3); for (const w of [-2.3, -5.9]) F.rod(V(ur, 0, w), V(ur, 1.8, w), 0.016, 0xc9ced3);
      for (let w = -2.4; w > -5.8; w -= 0.075) { const jeans = r() < 0.35, l = jeans ? 1.0 : 0.75 + r() * 0.15; F.item('box', [ur, 1.77 - l / 2, w], [0.42, l, 0.025], jeans ? pick(r, [0x1e3a6e, 0x2a4f8a, 0x263238]) : 0xffffff, [0, 0, 0], jeans ? null : patch(r, 'print')); }
      F.block(Math.min(uw, ur + face * 0.25), -5.95, Math.max(uw, ur + face * 0.25), -2.25);
    }
    F.box(FAIR + 0.3, B3.len - 0.3, 0, 2.2, -6.45, -6.4, 0xf2f2ef);
    for (let y = 0.35; y < 2.1; y += 0.35) {
      F.box(FAIR + 0.3, B3.len - 0.3, y - 0.012, y + 0.012, -6.4, -6.08, 0xf2f2ef);
      for (let u = FAIR + 0.4; u < B3.len - 0.45; u += 0.3) for (let l = 0; l < 2; l++) F.item('box', [u + 0.13, y + 0.065 + l * 0.105, -6.24], [0.26, 0.1, 0.28], pick(r, [0x1e3a6e, 0xf5f5f5, 0xc62828, 0x455a64, 0x8d6e63, 0x2e7d32]));
    }
    F.block(FAIR + 0.3, -6.5, B3.len - 0.3, -6.05);
    counter(F, r, FAIR + 1.4, FAIR + 2.9, -5.4, -4.9);
  }

  // ---- north-east: Jothi's displays in the lane ----------------------------------------------------------------------------
  // a row of cream slotted-angle shelving from the aisle back to the shop (along z), stocked on both faces
  function slottedRow(K, r, x0, x1, z0, z1, h, levels, stock) {
    const xm = (x0 + x1) / 2, n = Math.max(1, Math.round((z1 - z0) / 0.95));
    for (const x of [x0 + 0.02, xm, x1 - 0.02]) for (let k = 0; k <= n; k++) { const z = z0 + ((z1 - z0) * k) / n; K.box(x - 0.02, x + 0.02, 0, h, z - 0.02, z + 0.02, SLOT); }
    const ys = [];
    for (let k = 0; k < levels; k++) { const y = 0.12 + (k * (h - 0.3)) / (levels - 1); K.box(x0, x1, y - 0.012, y + 0.012, z0, z1, SLOT); ys.push(y + 0.012); }
    for (const face of [-1, 1]) ys.forEach((y, k) => stock(face > 0 ? xm : x0, face > 0 ? x1 : xm, y, k < ys.length - 1 ? ys[k + 1] - y - 0.04 : 0.3, z0, z1, face));
    K.block(x0, z0, x1, z1);
    return ys;
  }
  // painted diyas in their gift boxes, steel bowls, jars, stacked to the board above
  const diyaStock = (K, r) => (xa, xb, y, room, z0, z1) => {
    for (let z = z0 + 0.06; z < z1 - 0.1;) {
      const kind = r(), run = 0.3 + r() * 0.4;
      if (kind < 0.55) { const lab = pick(r, ['green', 'red', 'diya', 'rangoli']), hh = 0.07 + r() * 0.05, layers = Math.max(1, Math.floor(room / (hh + 0.005))); for (let zz = z; zz < Math.min(z + run, z1 - 0.12); zz += 0.15) for (let l = 0; l < layers; l++) labelled(K, r, lab, xa + 0.03, xb - 0.03, y + l * (hh + 0.004), y + l * (hh + 0.004) + hh, zz, zz + 0.14); }
      else if (kind < 0.8) { for (let zz = z + 0.1; zz < Math.min(z + run, z1 - 0.12); zz += 0.2) { const hh = Math.min(room - 0.02, 0.1 + r() * 0.15); K.item('disc', [(xa + xb) / 2, y + hh / 2, zz], [0.09, hh, 0.09], STEEL); } }
      else { for (let zz = z + 0.07; zz < Math.min(z + run, z1 - 0.1); zz += 0.13) pack(K, r, (xa + xb) / 2, y, zz, Math.min(1, room / 0.18)); }
      z += run + 0.02;
    }
  };
  // a step ladder of aluminium used as a rack: garlands hang from its rungs on the side facing the aisle
  function ladder(K, r, x, z0, z1, h = 1.85) {
    const zm = (z0 + z1) / 2, AL = 0xc9ced3;
    for (const dx of [-0.22, 0.22]) for (const z of [z0, z1]) K.rod(V(x + dx, 0, z), V(x + dx * 0.82, h, zm), 0.018, AL, 6);
    K.box(x - 0.18, x + 0.18, h - 0.02, h + 0.03, zm - 0.12, zm + 0.12, AL);
    for (let k = 1; k < 6; k++) {
      const t = k / 6, y = h * t;
      for (const z of [z0, z1]) { const zz = z + (zm - z) * t; K.rod(V(x - 0.22 + 0.04 * t, y, zz), V(x + 0.22 - 0.04 * t, y, zz), 0.012, AL, 6); }
      const zz = z1 + (zm - z1) * t;
      if (k > 1) for (let xx = x - 0.17; xx < x + 0.18; xx += 0.085) K.item('s7-strand', [xx, y, zz + 0.04], [0.032, Math.min(y - 0.1, 0.45 + r() * 0.3), 0.032], 0xffffff, [0, r() * 6.28, 0], [pick(r, [0, 1, 2]), Math.floor(r() * N), 's7-strand']);
    }
    K.block(x - 0.26, Math.min(z0, z1), x + 0.26, Math.max(z0, z1));
  }
  // NE-11: the flower counter: a steel counter of loose marigolds and coiled garlands, two step ladders hung with fresh
  // garlands, shelves of clay pots and diyas behind, a bulb, the JOTHI card
  function flowerCounter(K, r) {
    K.box(41.5, 43.1, 0, 0.9, -2.75, -2.1, 0xd5dbe2, 0.015);
    K.box(41.62, 42.22, 0.9, 1.04, -2.62, -2.22, 0x2d6fd6, 0.01);
    for (let k = 0; k < 26; k++) K.item('ball', [41.68 + (k % 9) * 0.06, 1.07, -2.56 + Math.floor(k / 9) * 0.13], 0.032, pick(r, [0xf57c00, 0xfbc02d, 0xff9800]));
    for (let k = 0; k < 5; k++) K.item('torus', [42.45 + (k % 3) * 0.2, 0.93 + Math.floor(k / 3) * 0.05, -2.45], [0.11, 0.11, 0.11], pick(r, [0xf7f3ea, 0xf57c00, 0xd32f2f]), [Math.PI / 2, 0, r() * 6]);
    K.block(41.45, -2.8, 43.15, -2.05);
    for (const x of [41.78, 42.88]) ladder(K, r, x, -3.35, -4.35);
    K.box(41.45, 43.2, 0, 1.5, -6.25, -6.21, 0x9aa0a6);
    for (const x of [41.47, 43.18]) K.box(x - 0.02, x + 0.02, 0, 1.5, -6.25, -5.75, 0x9aa0a6);
    for (const y of [0.05, 0.42, 0.86, 1.3]) {
      K.box(41.48, 43.17, y - 0.012, y + 0.012, -6.22, -5.78, 0xb9bec4);
      for (let x = 41.62; x < 43.1; x += 0.2) K.item(r() < 0.5 ? 'pot' : 'disc', [x, y + 0.012, -6.0], r() < 0.5 ? 0.16 : [0.07, 0.03, 0.07], pick(r, TERRA), [0, r() * 6, 0]);
    }
    K.block(41.4, -6.3, 43.25, -5.7);
    bulb(K, 42.3, 2.15, -3.0);
    K.item('box', [42.3, 2.05, -2.0], [0.42, 0.3, 0.012], 0xffffff, [0, 0, 0], sticker(...CARD));
  }
  // NE-12: Jothi's racks: a wire cage of clay diyas with its price card on the aisle, two rows of slotted-angle shelving of
  // painted diyas, bowls and jars running back to the shop (S3a's overflow stands on the line at the end of the first),
  // heart lamps and garlands hung from their tops, shelving across the back
  function racks(K, r) {
    const cg = (x0, x1, z0, z1, h) => {
      for (const [a, b, c] of [[x0, z0, 0], [x0, z1, 0], [x0, z0, 1], [x1, z0, 1]]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(c ? Math.abs(z1 - z0) : x1 - x0, h), NAV.toon(0xffffff, { map: meshTex(), alphaTest: 0.5, side: THREE.DoubleSide, ink: false }));
        if (c) { m.rotation.y = Math.PI / 2; m.position.set(a, h / 2 + 0.05, (z0 + z1) / 2); } else m.position.set((x0 + x1) / 2, h / 2 + 0.05, b);
        K.extra.push(m);
      }
      for (const x of [x0, x1]) for (const z of [z0, z1]) K.box(x - 0.012, x + 0.012, 0, h + 0.05, z - 0.012, z + 0.012, 0xf2f2ef);
      for (let k = 0; k < 6; k++) K.item('disc', [x0 + 0.15 + (k % 3) * 0.2, 0.45, z0 - 0.17 - Math.floor(k / 3) * 0.3 * Math.sign(z0 - z1)], [0.085, 0.8, 0.085], pick(r, TERRA));   // stacks of clay diyas
      K.item('box', [(x0 + x1) / 2, h + 0.25, z0], [0.4, 0.28, 0.012], 0xffffff, [0, 0, 0], sticker(...PRICE));
      K.block(x0 - 0.02, Math.min(z0, z1), x1 + 0.02, Math.max(z0, z1));
    };
    cg(43.5, 44.2, -2.05, -2.75, 1.05);
    // S3a's shelving end on the line (nav-world's overflow goods): its three open faces painted as stocked shelving
    const face = shelfFace(), fm = NAV.toon(0xffffff, { map: face });
    for (const [w, x, z, ry] of [[0.9, 45.4, -1.735, 0], [0.45, 44.935, -1.975, -Math.PI / 2], [0.45, 45.865, -1.975, Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.0), fm); m.position.set(x, 1.0, z); m.rotation.y = ry; K.extra.push(m); }
    const stock = diyaStock(K, r);
    for (const [x0, x1, z0] of [[44.95, 45.85, -5.85], [46.6, 47.35, -5.85]]) {
      const ys = slottedRow(K, r, x0, x1, z0, x0 < 45 ? -2.22 : -2.4, 2.0, 5, stock);
      for (let z = z0 + 0.3; z < -2.4; z += 0.55) {
        const hang = r() < 0.5;
        if (hang) K.item('s7-heart', [(x0 + x1) / 2 + (r() - 0.5) * 0.3, ys[ys.length - 1] + 0.3, z], 0.17, pick(r, [0xd81b60, 0xe53935]), [0, Math.PI / 2, 0]);
        else K.item('s7-strand', [r() < 0.5 ? x0 - 0.05 : x1 + 0.05, 2.0, z], [0.034, 0.45 + r() * 0.3, 0.034], 0xffffff, [0, r() * 6, 0], [pick(r, [0, 3, 4, 5]), Math.floor(r() * N), 's7-strand']);
      }
    }
    for (let x = 43.45; x < 47.4; x += 1.0) {
      K.box(x, x + 0.96, 0, 2.0, -6.32, -5.92, SLOT);
      for (let y = 0.3; y < 1.9; y += 0.4) for (let xx = x + 0.07; xx < x + 0.9; xx += 0.17) {
        labelled(K, r, pick(r, ['green', 'red', 'diya', 'camphor']), xx, xx + 0.14, y, y + 0.1 + r() * 0.06, -5.92, -5.78);
        if (xx < 46.1 || xx > 46.8) labelled(K, r, pick(r, ['green', 'red', 'diya', 'carton']), xx, xx + 0.14, y, y + 0.1 + r() * 0.06, -6.44, -6.32);   // the face to the five-foot way, clear of its column
      }
    }
    K.block(43.4, -6.35, 47.45, -5.75);
    K.item('box', [45.4, 2.25, -2.3], [0.42, 0.3, 0.012], 0xffffff, [0, 0, 0], sticker(...CARD));
  }
  // NE-13: the long tent: white tables of rangoli stickers in their sleeves at the front and through the middle, a way
  // through to the shop, shelving across the back; garlands, door hangings and peacock boards hung thick from rails
  // under the roof, caged bulbs, the JOTHI cards and the E-INVOICE board (S3a's baskets and crate stand on the line)
  function longTent(K, r) {
    const table = (x0, x1, z0, z1) => {
      K.box(x0, x1, 0.74, 0.78, z0, z1, 0xf7f7f4, 0.01);
      for (const x of [x0 + 0.05, x1 - 0.05]) for (const z of [z0 + 0.05, z1 - 0.05]) K.box(x - 0.02, x + 0.02, 0, 0.74, z - 0.02, z + 0.02, 0x9aa0a6);
      for (let x = x0 + 0.15; x < x1 - 0.12; x += 0.27) for (let z = Math.min(z0, z1) + 0.15; z < Math.max(z0, z1) - 0.1; z += 0.27) K.item('box', [x, 0.787 + r() * 0.004, z], [0.24, 0.006, 0.24], 0xffffff, [0, (r() - 0.5) * 0.25, 0], sticker(Math.floor(r() * 4), Math.floor(r() * N)));
      K.block(x0, Math.min(z0, z1), x1, Math.max(z0, z1));
    };
    table(47.7, 50.0, -2.85, -2.08); table(53.2, 55.3, -2.85, -2.08);          // S3a's baskets and crate stand on the line at 50.3–52.1; the way in is beside them
    table(47.8, 50.0, -4.4, -3.6); table(52.1, 55.2, -4.4, -3.6);
    for (const [x0, x1] of [[47.6, 50.2], [51.9, 55.4]]) {
      K.box(x0, x1, 0, 2.05, -6.02, -5.62, SLOT);
      for (let y = 0.25; y < 1.95; y += 0.42) for (let x = x0 + 0.06; x < x1 - 0.18; x += 0.19) {
        labelled(K, r, pick(r, ['green', 'red', 'diya', 'rangoli', 'carton']), x, x + 0.17, y, y + 0.12 + r() * 0.12, -5.62, -5.5);
        labelled(K, r, pick(r, ['green', 'red', 'carton', 'incense']), x, x + 0.17, y, y + 0.1 + r() * 0.12, -6.14, -6.02);
      }
      K.block(x0, -6.05, x1, -5.45);
    }
    for (const z of [-2.45, -3.1, -3.8, -4.5, -5.2]) strands(K, r, V(47.6, 0, z), V(55.4, 0, z), 2.42, [0.55, 1.05], 0.11, [0, 1, 2, 3, 4, 5], { clear: [2.4, 4.5] });
    for (let k = 0; k < 16; k++) {
      const x = 47.9 + k * 0.48 + (r() - 0.5) * 0.1, z = pick(r, [-2.75, -3.45, -4.15, -4.85]), wide = r() < 0.35;
      if (x > 49.9 && x < 52.2) continue;
      K.item('box', [x, wide ? 2.02 : 1.95, z], wide ? [0.5, 0.42, 0.012] : [0.26, 0.36, 0.012], 0xffffff, [0, (r() - 0.5) * 0.3, wide ? 0 : Math.PI / 4], sticker(wide ? 6 : 4 + Math.floor(r() * 2), Math.floor(r() * N)));
    }
    for (let x = 48.4; x < 55.3; x += 1.6) for (const z of [-3.0, -4.85]) bulb(K, x, 2.32, z);
    K.item('box', [49.0, 2.0, -2.3], [0.42, 0.3, 0.012], 0xffffff, [0, 0, 0], sticker(...CARD));
    K.item('box', [53.8, 2.0, -2.3], [0.42, 0.3, 0.012], 0xffffff, [0, 0, 0], sticker(...CARD));
    K.item('box', [55.0, 1.95, -3.3], [0.5, 0.3, 0.012], 0xffffff, [0, -Math.PI / 2, 0], sticker(...EINV));
  }
  // NE-15: under the awning: a rail of thick artificial jasmine-and-rose garlands, a pink cart heaped with more, a table of
  // painted diya trays, a mesh board of door hangings, cartons; a way through to the five-foot way at its east end, clear
  // of the five-foot way's column
  function awningDisplays(K, r) {
    strands(K, r, V(55.6, 0, -2.3), V(56.95, 0, -2.3), 2.25, [0.8, 1.25], 0.09, [1, 1, 2, 3], { thick: 0.058 });
    for (const x of [55.6, 56.95]) K.rod(V(x, 0, -2.3), V(x, 2.25, -2.3), 0.016, 0xc9ced3);
    K.block(55.5, -2.5, 57.0, -2.1);
    K.box(57.05, 57.95, 0.18, 0.82, -3.25, -2.6, 0xe07aa8, 0.02);
    for (const x of [57.13, 57.87]) for (const z of [-3.17, -2.68]) K.cyl(x, 0, z, 0.06, 0.18, 0x2b2b2b, { seg: 10 });
    for (let k = 0; k < 28; k++) K.item('torus', [57.2 + (k % 7) * 0.11, 0.86 + Math.floor(k / 7) * 0.06, -2.92 + ((k % 2) - 0.5) * 0.18], [0.13, 0.13, 0.13], pick(r, [0xf7f3ea, 0xd32f2f, 0xf57c00, 0xf7f3ea]), [Math.PI / 2, 0, r() * 6]);
    K.block(57.0, -3.3, 58.0, -2.55);
    K.box(55.7, 56.95, 0.72, 0.76, -4.1, -3.4, 0xf7f7f4, 0.01);
    for (const x of [55.75, 56.9]) for (const z of [-4.05, -3.45]) K.box(x - 0.02, x + 0.02, 0, 0.72, z - 0.02, z + 0.02, 0x9aa0a6);
    for (let x = 55.82; x < 56.9; x += 0.18) for (let z = -4.0; z < -3.45; z += 0.17) { if (r() < 0.5) pack(K, r, x, 0.76, z, 0.9); else labelled(K, r, pick(r, ['green', 'red']), x - 0.07, x + 0.07, 0.76, 0.84, z - 0.07, z + 0.07); }
    K.block(55.65, -4.15, 57.0, -3.35);
    const mb = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.7), NAV.toon(0xffffff, { map: meshTex(), alphaTest: 0.5, side: THREE.DoubleSide, ink: false })); mb.position.set(57.45, 1.2, -4.95); K.extra.push(mb);
    for (const x of [56.95, 57.95]) K.box(x - 0.02, x + 0.02, 0, 2.1, -4.97, -4.93, 0xf2f2ef);
    for (let y = 0.6; y < 1.95; y += 0.42) for (let x = 57.12; x < 57.9; x += 0.3) K.item('box', [x, y, -4.92], [0.24, 0.24, 0.012], 0xffffff, [0, 0, Math.PI / 4], sticker(4 + Math.floor(r() * 2), Math.floor(r() * N)));
    K.block(56.9, -5.1, 58.0, -4.8);
    for (let k = 0; k < 4; k++) K.box(55.7 + (k % 2) * 0.55, 56.2 + (k % 2) * 0.55, Math.floor(k / 2) * 0.36, 0.35 + Math.floor(k / 2) * 0.36, -5.5, -5.05, pick(r, [0xd8c08a, 0xc9a96e]), 0.01);
    K.block(55.65, -5.55, 56.8, -5.0);
    K.item('box', [58.5, 2.15, -2.3], [0.42, 0.3, 0.012], 0xffffff, [0, 0, 0], sticker(...CARD));
  }

  // ---- south-west: 2, 6 and 8 Campbell Lane, in the arcade's white and red -------------------------------------------------
  const SW2 = { x0: 45.58, x1: 51.06, zf: 6.67, s: 1 }, SW68 = { x0: 56.53, x1: 65.61, zf: 6.78, s: 1 }, SWBACK = 25.8;
  // the upper floor over the plot, tall French windows in red with shutters and coloured fanlights, white globe lanterns in
  // red brackets on the pilasters, eaves with a red fascia, a tiled roof (frames at 870 s)
  function arcadeFront(K, fr, wins, ww, pilasters, lanterns, r) {
    const { x0, x1, zf } = fr, top = 7.0;
    K.box(x0, x1, GF, top, zf, SWBACK, WALLA);
    K.box(x0, x1, GF - 0.02, GF + 0.32, zf - 0.12, zf + 0.02, TRIM, 0.02);
    K.box(x0, x1, top - 0.04, top + 0.02, zf - 0.44, zf, 0xf4f1ea);
    K.box(x0, x1, top - 0.02, top + 0.26, zf - 0.48, zf - 0.42, RED);
    const y0 = top + 0.2, yr = 9.6, zr = 16.2, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, zf - 0.44, x1, y0, zf - 0.44, x1, yr, zr, x0, y0, zf - 0.44, x1, yr, zr, x0, yr, zr, x0, yr, zr, x1, yr, zr, x1, y0, SWBACK, x0, yr, zr, x1, y0, SWBACK, x0, y0, SWBACK], 3));
    K.add(g, 0xa54b3a, THREE.DoubleSide);
    for (let z = zf; z < zr; z += 0.44) { const t = (z - zf + 0.44) / (zr - zf + 0.44); K.box(x0, x1, y0 + t * (yr - y0) + 0.02, y0 + t * (yr - y0) + 0.06, z - 0.03, z, 0x8c3d2f); }
    for (const x of pilasters) K.box(x - 0.13, x + 0.13, GF + 0.32, top - 0.04, zf - 0.06, zf + 0.02, TRIM);
    for (const [cx, on] of wins) {
      window2(K, fr, cx, RED, 0x9c2f2a, on, ww, 4.1, 6.05);
      K.box(cx - ww / 2 - 0.075, cx + ww / 2 + 0.075, 6.13, 6.62, zf - 0.04, zf + 0.02, RED);
      for (let k = 0; k < 3; k++) K.box(cx - ww / 2 + 0.03 + (k * ww) / 3, cx - ww / 2 - 0.03 + ((k + 1) * ww) / 3, 6.2, 6.55, zf - 0.05, zf - 0.04, pick(r, [0x5d8fd6, 0xe8b54a, 0x6fbf73, 0xd8573a]));
    }
    for (const x of lanterns) {
      K.box(x - 0.1, x + 0.1, 4.95, 5.45, zf - 0.2, zf - 0.04, RED, 0.01);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), lit(0xfff6e0, 0.9)); gl.position.set(x, 5.2, zf - 0.27); K.extra.push(gl);
    }
  }
  function arcade(K, r) {
    arcadeFront(K, SW2, [[46.95, true], [49.69, false]], 0.95, [45.71, 50.93], [48.32], r);
    arcadeFront(K, SW68, [[57.73, false], [59.87, true], [62.27, true], [64.41, false]], 0.8, [56.66, 61.07, 65.48], [58.8, 61.07, 63.34], r);
    fiveFootWay(K, SW2, [45.58], 0xe9e4da); fiveFootWay(K, SW68, [61.07], 0xe9e4da);              // the column at 65.61 is 10 Campbell Lane's (S7b)
    // their ground floors, closed behind roller shutters (the video does not show them)
    closedUnit(K, SW2, 45.58, 51.06, 18.0); closedUnit(K, SW68, 56.53, 61.07, 18.0); closedUnit(K, SW68, 61.07, 65.61, 18.0);
  }
  // SW-13: Jothi's racks behind a green tarp: slotted-angle shelving of boxed diyas and steel plates along the back, a
  // pallet of plates and stacked cartons at the front, a table of painted diyas, tinsel and mango-leaf thoranam above
  function greenTarp(K, r) {
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.4, 20, 1), NAV.toon(0x2e8b3a, { side: THREE.DoubleSide }));
    const p = tp.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(p.getX(k) * 6) * 0.04);
    tp.geometry.computeVertexNormals(); tp.rotation.y = Math.PI / 2; tp.position.set(50.42, 1.2, 4.25); K.extra.push(tp);
    for (let x = 47.6; x < 50.3; x += 0.9) {
      K.box(x, x + 0.88, 0, 2.0, 6.0, 6.42, SLOT);
      for (let y = 0.25; y < 1.9; y += 0.4) {
        if (r() < 0.35) K.item('disc', [x + 0.44, y + 0.1, 5.9], [0.16, 0.2, 0.16], STEEL);
        else for (let xx = x + 0.06; xx < x + 0.82; xx += 0.17) labelled(K, r, pick(r, ['green', 'red', 'diya']), xx, xx + 0.15, y, y + 0.1 + r() * 0.07, 5.86, 6.0);
      }
    }
    K.block(47.55, 5.8, 50.35, 6.45);
    K.box(47.8, 48.8, 0, 0.12, 2.3, 3.1, WOOD);
    for (let k = 0; k < 6; k++) { const hh = 0.2 + r() * 0.15; K.item('disc', [48.05 + (k % 3) * 0.25, 0.12 + hh / 2, 2.5 + Math.floor(k / 3) * 0.4], [0.13, hh, 0.13], STEEL); }
    K.block(47.75, 2.25, 48.85, 3.15);
    for (let k = 0; k < 6; k++) K.box(49.25 + (k % 2) * 0.5, 49.72 + (k % 2) * 0.5, Math.floor(k / 2) * 0.34, 0.33 + Math.floor(k / 2) * 0.34, 2.45, 2.9, pick(r, [0xd8c08a, 0xc9a96e, 0xe0cba0]), 0.01);
    K.block(49.2, 2.4, 50.3, 2.95);
    K.box(47.9, 49.7, 0.72, 0.76, 3.9, 4.6, 0xf7f7f4, 0.01);
    for (const x of [47.95, 49.65]) for (const z of [3.95, 4.55]) K.box(x - 0.02, x + 0.02, 0, 0.72, z - 0.02, z + 0.02, 0x9aa0a6);
    for (let x = 48.0; x < 49.65; x += 0.16) for (let z = 3.98; z < 4.55; z += 0.15) pack(K, r, x, 0.76, z, 0.85);
    K.block(47.85, 3.85, 49.75, 4.65);
    strands(K, r, V(47.6, 0, 2.08), V(50.3, 0, 2.08), 2.32, [0.3, 0.55], 0.075, [6, 7], { thick: 0.04 });
  }

  // ---- the festival stalls of the stretch, as holograms rebuilt from their stills -------------------------------------------
  const merged = (parts) => THREE.BufferGeometryUtils.mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
  // NE-16: MADDY FLOWERS' steel frame under Jothi's awning (the awning itself is solid, above): garlands in plastic sleeves
  // from a bar along the front, steel tables of crates of loose petals, bunches of loose flowers and bowls behind (904–925 s)
  NAV.kit.custom['NE-16'] = (e, depth, sign) => {
    const { Builder, frontZ, rnd, seedOf, eaveSign } = NAV.kit, B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w } = B, f = 0xc9ced3;
    for (const lx of [0.06, w - 0.06]) for (const lz of [0.12, 2.4]) B.rod('frame', B.P(lx, 0, lz), B.P(lx, 2.35, lz), 0.022, f);
    for (const lz of [0.12, 2.4]) B.rod('frame', B.P(0, 2.35, lz), B.P(w, 2.35, lz), 0.02, f);
    for (const lx of [0.06, w - 0.06]) B.rod('frame', B.P(lx, 2.35, 0.12), B.P(lx, 2.35, 2.4), 0.02, f);
    eaveSign(B, sign, 2.42);
    B.rod('furniture', B.P(0.1, 2.12, 0.35), B.P(w - 0.1, 2.12, 0.35), 0.015, f);
    const sleeves = [], petals = [], bunches = [];
    for (let lx = 0.2; lx < w - 0.15; lx += 0.12) { const l = 0.9 + r() * 0.45, p = B.P(lx, 2.09 - l / 2, 0.35 + (r() - 0.5) * 0.05); sleeves.push([p.x, p.y, p.z, 0, 1, pick(r, [0xd32f2f, 0xf7f3ea, 0xf57c00, 0xad1457, 0xfbc02d]), l]); }
    B.table(0.15, 0.7, w - 0.3, 0.7, 0.85, 0xdfe3e7);
    for (let k = 0; k < Math.floor((w - 0.4) / 0.42); k++) {
      B.box('goods', 0.38 + k * 0.42, 0.92, 1.05, 0.38, 0.14, 0.5, pick(r, [0x2d6fd6, 0xd8323a, 0x2d6fd6, 0xf5f5f5]));
      const c = pick(r, [0xfbc02d, 0xf7f3ea, 0xd32f2f, 0xf57c00]);
      for (let j = 0; j < 8; j++) { const p = B.P(0.25 + k * 0.42 + (j % 4) * 0.08, 1.0, 0.9 + Math.floor(j / 4) * 0.25); petals.push([p.x, p.y, p.z, 0, 1, c]); }
    }
    B.table(0.4, 1.75, w - 0.8, 0.6, 0.85, 0xdfe3e7);
    for (let lx = 0.55; lx < w - 0.5; lx += 0.22) { const p = B.P(lx, 0.97, 2.0 + (r() - 0.5) * 0.2); bunches.push([p.x, p.y, p.z, 0, 0.9 + r() * 0.4, pick(r, [0xf06292, 0xaed581, 0xf7f3ea, 0xffb74d])]); }
    for (let k = 0; k < 3; k++) B.box('goods', 0.6 + k * 0.9, 0.16, 1.2, 0.5, 0.3, 0.4, 0xd8c39a);
    B.instanced('sleeves', new THREE.CylinderGeometry(0.05, 0.045, 1, 8), 0xffffff, sleeves);
    B.instanced('petals', new THREE.IcosahedronGeometry(0.045, 0), 0xffffff, petals);
    B.instanced('bunches', new THREE.IcosahedronGeometry(0.1, 1), 0xffffff, bunches);
    return B.finish();
  };
  // SW-16: the garland and toran stall: a white frame of diamond-shaped torans at the front, rails of hanging garlands, a
  // pink-skirted table of boxed garlands, framed pictures on its back wall, a blue tarp at its north-west end (870–966 s)
  NAV.kit.custom['SW-16'] = (e, depth, sign) => {
    const { Builder, frontZ, rnd, seedOf, eaveSign, garlandRail } = NAV.kit, B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 }); eaveSign(B, sign);
    B.sheet(0.02, 0x3a7fd0, { folds: 8 });
    for (const lx of [0.25, 2.2]) B.rod('furniture', B.P(lx, 0, 0.32), B.P(lx, 2.2, 0.32), 0.016, 0xf2f2f2);
    B.rod('furniture', B.P(0.25, 2.2, 0.32), B.P(2.2, 2.2, 0.32), 0.014, 0xf2f2f2);
    const torans = [], tassels = [], beads = [], pics = [];
    for (let row = 0; row < 3; row++) for (let lx = 0.42; lx < 2.1; lx += 0.36) {
      const p = B.P(lx + (row % 2) * 0.12, 1.95 - row * 0.5, 0.33); torans.push([p.x, p.y, p.z, 0, 0.9 + r() * 0.3, pick(r, [0xf2c94c, 0xc62828, 0x2e7d32, 0xd9b45a])]);
      for (let t = -1; t <= 1; t++) { const q = B.P(lx + (row % 2) * 0.12 + t * 0.08, 1.95 - row * 0.5 - 0.22, 0.33); tassels.push([q.x, q.y, q.z, 0, 0.8, pick(r, [0xc62828, 0xf2c94c])]); }
    }
    garlandRail(B, r, beads, tassels, 2.4, w - 0.15, 1.2, 2.3, 0.11);
    garlandRail(B, r, beads, tassels, 2.4, w - 0.15, 2.0, 2.3, 0.11);
    garlandRail(B, r, beads, tassels, 0.3, 2.2, 2.4, 2.3, 0.12, 0.8);
    B.table(2.45, 0.42, w - 2.75, 0.62, 0.8, 0xf3efe6, 0xd2246f);
    for (let k = 0; k < Math.floor((w - 2.9) / 0.32); k++) B.box('goods', 2.62 + k * 0.32, 0.86, 0.73, 0.28, 0.08, 0.36, pick(r, [0xf7a21b, 0xffffff, 0xe2342d, 0xf5c518]));
    B.box('walls', w / 2, 1.3, d - 0.06, w - 0.3, 2.3, 0.04, 0xf7f5ef);
    for (let k = 0; k < 10; k++) { const p = B.P(0.5 + (k % 5) * 0.9, 1.2 + Math.floor(k / 5) * 0.55, d - 0.1); pics.push([p.x, p.y, p.z, 0, 1, pick(r, [0x6d4c41, 0xd9b45a, 0x8e24aa, 0x1565c0])]); }
    B.instanced('torans', new THREE.PlaneGeometry(0.3, 0.3).rotateZ(Math.PI / 4), 0xffffff, torans);
    B.instanced('beads', new THREE.IcosahedronGeometry(0.03, 0), 0xffffff, beads);
    B.instanced('tassels', new THREE.ConeGeometry(0.03, 0.09, 8), 0xffffff, tassels);
    B.instanced('pictures', new THREE.BoxGeometry(0.34, 0.44, 0.03), 0xffffff, pics);
    return B.finish();
  };
  // SW-17: the deity statue stall: painted resin statues as simple forms, small ones on a pink-skirted front table, larger
  // ones on a stepped stand behind (seated, standing with a staff, the broad seated figure with a trunk), garlands at the
  // front eave, framed pictures on the back wall (443–476 s)
  const STATUE = {
    seated: () => merged([new THREE.CylinderGeometry(0.11, 0.12, 0.06, 14).translate(0, 0.03, 0), new THREE.CylinderGeometry(0.06, 0.1, 0.22, 12).translate(0, 0.17, 0),
      new THREE.SphereGeometry(0.05, 12, 8).translate(0, 0.33, 0), new THREE.ConeGeometry(0.035, 0.08, 8).translate(0, 0.41, 0), new THREE.TorusGeometry(0.08, 0.008, 6, 20).translate(0, 0.35, -0.04)]),
    standing: () => merged([new THREE.CylinderGeometry(0.09, 0.1, 0.05, 12).translate(0, 0.025, 0), new THREE.CylinderGeometry(0.05, 0.07, 0.42, 12).translate(0, 0.26, 0),
      new THREE.SphereGeometry(0.045, 12, 8).translate(0, 0.52, 0), new THREE.ConeGeometry(0.035, 0.09, 8).translate(0, 0.6, 0), new THREE.CylinderGeometry(0.007, 0.007, 0.62, 6).translate(0.09, 0.31, 0),
      new THREE.ConeGeometry(0.025, 0.07, 6).translate(0.09, 0.65, 0)]),
    broad: () => merged([new THREE.CylinderGeometry(0.14, 0.15, 0.06, 14).translate(0, 0.03, 0), new THREE.SphereGeometry(0.13, 14, 10).scale(1, 0.9, 0.85).translate(0, 0.18, 0),
      new THREE.SphereGeometry(0.08, 12, 8).translate(0, 0.36, 0.01), new THREE.ConeGeometry(0.025, 0.14, 8).rotateX(Math.PI * 0.9).translate(0, 0.3, 0.08),
      new THREE.CylinderGeometry(0.06, 0.06, 0.01, 12).rotateZ(Math.PI / 2).translate(-0.09, 0.37, 0), new THREE.CylinderGeometry(0.06, 0.06, 0.01, 12).rotateZ(Math.PI / 2).translate(0.09, 0.37, 0),
      new THREE.ConeGeometry(0.045, 0.1, 8).translate(0, 0.48, 0)]),
  };
  NAV.kit.custom['SW-17'] = (e, depth, sign) => {
    const { Builder, frontZ, rnd, seedOf, eaveSign, garlandRail } = NAV.kit, B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 }); eaveSign(B, sign);
    const PAINTED = [0xd9b45a, 0x1e88e5, 0xe57373, 0x43a047, 0xf5f0e6, 0xff8a65, 0x8e24aa], list = { seated: [], standing: [], broad: [] }, beads = [], tassels = [], pics = [];
    const put = (kind, lx, ly, lz, s) => { const p = B.P(lx, ly, lz); list[kind].push([p.x, p.y, p.z, B.s > 0 ? Math.PI : 0, s, pick(r, PAINTED)]); };
    B.table(0.2, 0.3, w - 0.4, 0.65, 0.8, 0xf3efe6, 0xd2246f);
    for (let lx = 0.4; lx < w - 0.3; lx += 0.32) put(pick(r, ['seated', 'seated', 'broad', 'standing']), lx, 0.8, 0.62, 0.8 + r() * 0.35);
    for (let k = 0; k < 3; k++) B.box('furniture', w / 2, 0.2 * (k + 1), 2.3 + k * 0.5 + 0.25, w - 0.5, 0.4 * (k + 1), 0.5, 0xd2246f);
    for (let k = 0; k < 3; k++) for (let lx = 0.5; lx < w - 0.4; lx += 0.55 + k * 0.1) put(k === 2 ? pick(r, ['standing', 'broad']) : pick(r, ['seated', 'broad', 'standing']), lx + (r() - 0.5) * 0.1, 0.4 + k * 0.4, 2.3 + k * 0.5 + 0.25, 1.4 + k * 0.4 + r() * 0.3);
    put('standing', w - 0.4, 0, d - 0.5, 2.3); put('broad', 0.45, 0, d - 0.55, 2.2);
    garlandRail(B, r, beads, tassels, 0.15, w - 0.15, 0.15, 2.32, 0.13, 0.75);
    B.box('walls', w / 2, 1.3, d - 0.05, w - 0.3, 2.3, 0.04, 0xf7f5ef);
    for (let k = 0; k < 8; k++) { const p = B.P(0.5 + (k % 4) * 0.8, 1.5 + Math.floor(k / 4) * 0.5, d - 0.09); pics.push([p.x, p.y, p.z, 0, 1, pick(r, [0x6d4c41, 0xd9b45a, 0x1565c0])]); }
    for (const [k, items] of Object.entries(list)) if (items.length) B.instanced('statue-' + k, STATUE[k](), 0xffffff, items);
    B.instanced('beads', new THREE.IcosahedronGeometry(0.03, 0), 0xffffff, beads);
    B.instanced('tassels', new THREE.ConeGeometry(0.03, 0.09, 8), 0xffffff, tassels);
    B.instanced('pictures', new THREE.BoxGeometry(0.4, 0.42, 0.03), 0xffffff, pics);
    return B.finish();
  };

  NAV.lane3 = {
    buildings: [176326694, 176326842, 176326798, 176326923, 176326965],
    // S1's columns along these five frontages (those at 51.06 and 56.53 are the pooja shop's, which skips them already)
    columns: (x, z) => (z < 0 ? x > 40.8 && x < 64.25 && z > -7.5 && z < -5.4 : ((x > 45.0 && x < 51.4) || (x > 56.0 && x < 66.1)) && z > 6.4 && z < 7.6),
    build(root, grid) {
      const g = new THREE.Group(); g.name = 'lane3'; root.add(g);
      const kits = { 'NE-14': [4101, jothi], 'NE-17': [5901, fairValue], 'NE-11': [4111, flowerCounter], 'NE-12': [4112, racks], 'NE-13': [4113, longTent], 'NE-15': [5501, awningDisplays], swShell: [4501, arcade], 'SW-13': [4713, greenTarp] };
      const parts = {}, built = {};
      for (const [key, [seed, fn]] of Object.entries(kits)) {
        const K = (built[key] = new Kit(seed)); fn(K, K.r);
        parts[key] = K.build(g, { soft: ['s7-strand', 'torus'], glow: { 's7-heart': 0x6a1018 } }).map((m) => ({ m, role: 'look' }));
        for (const [x0, z0, x1, z1] of K.blocks) grid.fillRect(x0, z0, x1, z1);
        for (const pts of K.polys || []) grid.fillPolygon(pts);
      }
      delete parts.swShell;
      // the light: Jothi's bright rooms and five-foot way, its tents of LED bulbs, the awning's bulbs over MADDY and the
      // displays, FAIR Value's cool white, the wash of the spotlights up Jothi's front, the green-tarp racks, the arcade's lanterns
      NAV.addLight([41.3, -0.5, -15.6], [59.6, 3.5, -5.6], 0xfff2e0, 1.0, 0.5);
      NAV.addLight([41.3, -0.5, -6.5], [55.5, 3.0, -1.9], 0xffecd0, 0.7, 0.5);
      NAV.addLight([55.5, -0.5, -5.9], [63.8, 3.4, -1.9], 0xfff0dc, 0.7, 0.5);
      NAV.addLight([59.5, -0.5, -12.0], [63.8, 3.4, -6.9], 0xf2f6ff, 1.0, 0.45);
      NAV.addLight([41.3, 3.6, -7.6], [63.8, 14.2, -4.6], 0xffd9b0, 0.45, 0.8);
      NAV.addLight([47.5, -0.5, 1.9], [50.5, 2.8, 6.7], 0xfff0dc, 0.5, 0.5);
      NAV.addLight([45.5, 3.4, 5.6], [65.7, 7.6, 7.4], 0xfff2e0, 0.35, 0.5);
      const room1 = frameBox(B1, 0, B1.len, -8.8, -1.8, 0, GF), room3 = frameBox(B3, 0, FAIR, -8.0, -1.8, 0, GF), fair = frameBox(B3, FAIR, B3.len, -6.6, -1.8, 0, GF);
      const jothiBox = room1.union(room3); jothiBox.max.z = Math.min(jothiBox.max.z, -8.0);
      fair.max.z = Math.min(fair.max.z, -7.1);
      return {
        ...parts,
        // a shop is picked by its rooms behind the five-foot way; a display by its goods as they stand
        box: { 'NE-14': jothiBox, 'NE-17': fair },
        pick: { 'NE-11': built['NE-11'].pickBoxes(), 'NE-12': built['NE-12'].pickBoxes(), 'NE-13': built['NE-13'].pickBoxes(), 'NE-15': built['NE-15'].pickBoxes(), 'SW-13': built['SW-13'].pickBoxes() },
      };
    },
  };
  NAV.detailed.push(NAV.lane3);
})();
