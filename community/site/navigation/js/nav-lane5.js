// S7c: the Clive Street end of the lane, 88–125 m from Serangoon Road. Built from the frames at 590–665 s and 757–796 s.
// South-west: 20 and 22 Campbell Lane, white shophouses with red-framed windows and shutters, 22 turning the corner onto
// Clive Street; Serangoon Air Travel behind its slate-blue fascia and poster-covered glass; and, as holograms, the empty
// bain-marie module, the clothing stall with its rolling rack past the line, BAWA'S under its LED bells with its shelving
// of jars against the shopfronts, the closed tent and storage area with four cocktail tables at the end.
// North-east: the SINDA outreach van with its cones and stock trolleys, chalk kolam on the aisle beside it, and the
// non-trading tents by the IHC entrance. The street end: Clive Street crossing on its diagonal, bollards and a lattice truss
// at the mouth, and across it Madras Bakery's uplit corner under its gable, the green-lit row beyond and the ochre building
// with arched windows over Chola Mart. Signs carry only the words the video shows; where things stand is read from frames.
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const { Kit, pick, ATLASES, N, tiles } = NAV.shopKit;
  const { board, boardTex, canvasTex, glass, fiveFootWay, upper, window2, faceWindow, at, V, GF, WHITE, TRIM, RED, fam } = NAV.blockKit;
  const KIT = NAV.kit;
  const seq = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // 20 Campbell Lane: its front all but square to the lane; 22: its front turns 4° and the plot cuts the corner onto Clive Street
  const F20 = { x0: 90.42, x1: 95.86, zf: 7.05, s: 1 }, BACK20 = 26.1, ROOM20 = 14.0;
  const P22 = [[95.86, 7.08], [102.37, 7.58], [104.02, 10.04], [99.62, 26.02], [95.58, 26.16]], IN22 = [99.5, 16];
  const W22 = [[95.86, 7.08], [102.37, 7.58], [103.62, 9.45], [95.83, 8.875]];                     // its five-foot way
  const G22 = [[95.83, 8.875], [103.62, 9.45], [104.02, 10.04], [99.62, 26.02], [95.58, 26.16]];    // its ground floor behind it
  // across Clive Street (OSM): Madras Bakery's corner, the row beyond it, the ochre building on the SW corner
  const MADRAS = [[132.28, 0.44], [129.37, -0.03], [127.69, -2.9], [131.31, -20.67], [136.31, -19.7]];
  const GREEN1 = [[137.28, 1.41], [132.28, 0.44], [136.31, -19.7], [141.31, -18.74]];
  const GREEN2 = [[142.28, 2.38], [137.28, 1.41], [141.31, -18.74], [146.31, -17.77]];
  const OCHRE_B = [[131.84, 8.17], [130.84, 12.9], [118.17, 10.5], [119.69, 5.9]];
  // Clive Street's centre line crosses the lane's at x 116 and runs 19° off square (OSM)
  const clive = (z) => 116 - 0.35 * z, HW = 3.4;

  // ---- walls at any angle -----------------------------------------------------------------------------------------------
  // the frame of a wall from a to b seen from outside the building (inside: a point within it): x runs along the wall from
  // one end, y up, z out of it; the frame faceWindow uses
  function face(a, b, inside) {
    let [ax, az] = a, [bx, bz] = b;
    const len = Math.hypot(bx - ax, bz - az);
    let nx = -(bz - az) / len, nz = (bx - ax) / len;
    if ((inside[0] - ax) * nx + (inside[1] - az) * nz > 0) { nx = -nx; nz = -nz; [ax, az, bx, bz] = [bx, bz, ax, az]; }
    const ux = (bx - ax) / len, uz = (bz - az) / len, ry = Math.atan2(nx, nz);
    return { len, nx, nz, ry, M: new THREE.Matrix4().makeRotationY(ry).setPosition(ax, 0, az), at: (s, d = 0) => [ax + ux * s + nx * d, az + uz * s + nz * d] };
  }
  // a box on a wall: s0–s1 along it, y0–y1 up, d0–d1 out of it (negative: into the building)
  const part = (K, F, s0, s1, y0, y1, d0, d1, colour) => K.add(new THREE.BoxGeometry(s1 - s0, y1 - y0, d1 - d0).translate((s0 + s1) / 2, (y0 + y1) / 2, (d0 + d1) / 2).applyMatrix4(F.M), colour);
  // a flat panel on a wall (a lit window, a shopfront), facing out of it
  function panel(K, F, w, h, s, y, d, mat) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(s, y, d).applyMatrix4(F.M), mat); K.extra.push(m); return m; }
  // a lit board on a wall: a sign, a lightbox
  const sign = (K, F, tex, w, h, s, y, d = 0.04, glow = 0.5) => { const [x, z] = F.at(s, d); return board(K, tex, w, h, V(x, y, z), F.ry, glow); };
  // a volume on a footprint, from y0 to y1
  function prism(K, pts, y0, y1, colour) {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: y1 - y0, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return K.add(g, colour);
  }
  // a flat footprint at height y: floor tiles (a material) or, upside down, a ceiling (a colour)
  function flat(K, pts, y, matOrColour) {
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, p.getX(k) / 0.6, p.getZ(k) / 0.6);
    g.translate(0, y, 0);
    if (typeof matOrColour === 'number') return K.add(g, matOrColour, THREE.DoubleSide);
    const m = new THREE.Mesh(g, matOrColour); K.extra.push(m); return m;
  }
  // the tiled roof rising from a wall's cornice to a ridge `run` metres behind it
  function roofSlope(K, F, top, run, rise, colour = 0xa54b3a) {
    const g = new THREE.BufferGeometry(), y0 = top + 0.15, y1 = top + rise, L = F.len;
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, y0, 0.2, L, y0, 0.2, L, y1, -run, 0, y0, 0.2, L, y1, -run, 0, y1, -run], 3));
    K.add(g.applyMatrix4(F.M), colour, THREE.DoubleSide);
    for (let d = 0.42; d < run; d += 0.42) { const y = y0 + ((d + 0.2) / (run + 0.2)) * (y1 - y0) + 0.03; part(K, F, 0, L, y, y + 0.04, 0.2 - d - 0.025, 0.2 - d + 0.025, 0x8c3d2f); }
  }
  // a thin strip on the ground from a to b (kerbs, road markings)
  function strip(K, a, b, w, h, colour, y = 0) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    K.add(new THREE.BoxGeometry(Math.hypot(dx, dz), h, w).rotateY(-Math.atan2(dz, dx)).translate((a[0] + b[0]) / 2, y + h / 2, (a[1] + b[1]) / 2), colour);
  }
  // windows: a French window shut behind louvred timber shutters in a moulded surround; an arched one with a shuttered fanlight
  function shutWindow(K, F, s, colour, { w = 0.95, y0 = 4.2, y1 = 6.2, surround = 0xf3ece0 } = {}) {
    part(K, F, s - w / 2 - 0.1, s + w / 2 + 0.1, y0 - 0.14, y0, 0, 0.1, surround);
    part(K, F, s - w / 2 - 0.1, s + w / 2 + 0.1, y1, y1 + 0.16, -0.01, 0.08, surround);
    for (const sx of [-1, 1]) part(K, F, s + sx * (w / 2 + 0.05) - 0.05, s + sx * (w / 2 + 0.05) + 0.05, y0, y1, -0.01, 0.06, surround);
    part(K, F, s - w / 2, s + w / 2, y0, y1, -0.04, 0.02, colour);
    part(K, F, s - 0.012, s + 0.012, y0, y1, 0.02, 0.035, 0x2a1a12);
    for (let y = y0 + 0.1; y < y1 - 0.06; y += 0.1) part(K, F, s - w / 2 + 0.05, s + w / 2 - 0.05, y, y + 0.022, 0.02, 0.03, 0x5a2416);
  }
  function archWindow(K, F, s, { w = 1.25, y0 = 4.1, y1 = 5.9, shutter = 0x6e2430, trim = 0xf4ecd8 } = {}) {
    const rr = w / 2;
    part(K, F, s - w / 2 - 0.12, s + w / 2 + 0.12, y0 - 0.15, y0, 0, 0.12, trim);
    for (const sx of [-1, 1]) part(K, F, s + sx * (w / 2 + 0.06) - 0.06, s + sx * (w / 2 + 0.06) + 0.06, y0, y1, -0.01, 0.07, trim);
    K.add(new THREE.TorusGeometry(rr + 0.06, 0.07, 6, 18, Math.PI).translate(s, y1, 0.03).applyMatrix4(F.M), trim);
    part(K, F, s - w / 2, s + w / 2, y0, y1, -0.05, 0.0, shutter);
    K.add(new THREE.CircleGeometry(rr, 16, 0, Math.PI).translate(s, y1, 0.001).applyMatrix4(F.M), shutter);
    for (let y = y0 + 0.08; y < y1 - 0.05; y += 0.1) part(K, F, s - w / 2 + 0.05, s + w / 2 - 0.05, y, y + 0.025, 0.0, 0.012, 0x4a1820);
    part(K, F, s - 0.012, s + 0.012, y0, y1, 0.0, 0.015, 0x3a1218);
    part(K, F, s - 0.09, s + 0.09, y1 + rr - 0.02, y1 + rr + 0.16, -0.01, 0.1, trim);            // keystone
  }
  // louvred timber doors, shut, across a shopfront from s0 to s1
  function shutDoors(K, F, s0, s1, colour = 0x7a2a22, h = 2.7) {
    part(K, F, s0, s1, 0, h, 0, 0.05, colour);
    for (let s = s0 + 0.55; s < s1 - 0.1; s += 0.55) part(K, F, s - 0.012, s + 0.012, 0, h, 0.05, 0.065, 0x4a1612);
    for (let y = 0.15; y < h - 0.1; y += 0.12) part(K, F, s0 + 0.05, s1 - 0.05, y, y + 0.025, 0.05, 0.06, 0x6e221c);
  }
  const lamp = (K, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.1), NAV.toon(0xfff2cc, { emissive: 0xffdc9a, emissiveIntensity: 1, ink: false })); b.position.set(x, y, z); K.extra.push(b); };

  // ---- printed things: travel posters and flags; the van's livery; chalk kolam ---------------------------------------------
  // a travel poster: sky, sun or moon, a landmark's silhouette over land or sea; or a flag of plain bands. No words.
  function poster(g, x, y, w, h, k) {
    const R = seq(31 + k * 7), pk = (a) => a[Math.floor(R() * a.length)];
    if (k % 5 === 4) {                                                                               // a flag
      const C = pk([['#d32f2f', '#ffffff', '#1565c0'], ['#ff9933', '#ffffff', '#138808'], ['#ffffff', '#d32f2f', '#ffffff'], ['#000000', '#d32f2f', '#ffce00'], ['#0052b4', '#ffffff', '#d80027']]);
      for (let b = 0; b < 3; b++) { g.fillStyle = C[b]; if (k % 2) g.fillRect(x + (b * w) / 3, y, w / 3 + 1, h); else g.fillRect(x, y + (b * h) / 3, w, h / 3 + 1); }
      return;
    }
    const sky = g.createLinearGradient(x, y, x, y + h); sky.addColorStop(0, pk(['#1e88e5', '#ff8a65', '#7e57c2', '#26c6da'])); sky.addColorStop(1, pk(['#fff3e0', '#ffe082', '#b3e5fc']));
    g.fillStyle = sky; g.fillRect(x, y, w, h);
    g.fillStyle = '#fffde7'; g.beginPath(); g.arc(x + w * (0.2 + R() * 0.6), y + h * 0.25, w * 0.09, 0, Math.PI * 2); g.fill();
    g.fillStyle = pk(['#2e7d32', '#1565c0', '#5d4037']); g.fillRect(x, y + h * 0.72, w, h * 0.28);   // land or sea
    g.fillStyle = 'rgba(30,30,50,0.85)'; const cx = x + w * 0.5, base = y + h * 0.74, kind = k % 4;
    g.beginPath();
    if (kind === 0) { g.moveTo(x, base); g.lineTo(x + w * 0.3, y + h * 0.35); g.lineTo(x + w * 0.5, y + h * 0.55); g.lineTo(x + w * 0.72, y + h * 0.3); g.lineTo(x + w, base); }   // mountains
    else if (kind === 1) { for (let t = 0; t < 4; t++) { const tw = w * (0.4 - t * 0.08); g.rect(cx - tw / 2, base - (t + 1) * h * 0.1, tw, h * 0.07); } }                 // a tiered tower
    else if (kind === 2) { g.rect(cx - w * 0.22, base - h * 0.18, w * 0.44, h * 0.18); g.arc(cx, base - h * 0.18, w * 0.16, Math.PI, 0); g.rect(cx - w * 0.3, base - h * 0.42, w * 0.03, h * 0.42); g.rect(cx + w * 0.27, base - h * 0.42, w * 0.03, h * 0.42); }   // a dome and minarets
    else { g.moveTo(cx - w * 0.2, base); g.lineTo(cx, y + h * 0.22); g.lineTo(cx + w * 0.2, base); }                              // a spire
    g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(2, w * 0.03); g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }
  function postersAtlas() {
    if (postersAtlas.t) return postersAtlas.t;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const g = cv.getContext('2d'), s = 1024 / N;
    for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) poster(g, i * s, row * s, s, s, row * N + i);
    const t = (postersAtlas.t = new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  ATLASES['s7c-posters'] = postersAtlas;
  const posterCell = (r) => [Math.floor(r() * N), Math.floor(r() * N), 's7c-posters'];
  // the travel agency's window, papered with posters and flags
  const windowTex = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#dfe9ef'; g.fillRect(0, 0, w, h); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if ((a + b) % 7 !== 3) poster(g, 8 + a * 126, 8 + b * 126, 116, 116, a * 4 + b + 3); });
  // the van's side: its people in a chain, faceless, and the words on it (782 s)
  const liveryTex = () => canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#6b3fb3'; g.fillRect(0, 0, w, h);
    const C = ['#ffca28', '#ff7043', '#26c6da', '#ec407a', '#9ccc65', '#ffa726', '#42a5f5'], SKIN = ['#8d5524', '#c68642', '#a0522d', '#e0ac69'];
    for (let k = 0; k < 9; k++) {
      const x = w * 0.36 + k * w * 0.072, y = h * (0.42 + (k % 2) * 0.06);
      g.fillStyle = C[k % C.length]; g.beginPath(); g.ellipse(x, y + h * 0.3, w * 0.03, h * 0.3, 0, Math.PI, 0); g.fill();
      g.fillStyle = SKIN[k % SKIN.length]; g.beginPath(); g.arc(x, y - h * 0.06, h * 0.08, 0, Math.PI * 2); g.fill();
      g.strokeStyle = C[k % C.length]; g.lineWidth = 9; g.beginPath(); g.moveTo(x + w * 0.02, y + h * 0.12); g.lineTo(x + w * 0.052, y + h * 0.18); g.stroke();
    }
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `700 ${h * 0.15}px ${fam}`; g.fillText('MOVING FORWARD', w * 0.03, h * 0.22); g.fillText('TOGETHER', w * 0.03, h * 0.38);
    g.font = `800 ${h * 0.2}px ${fam}`; g.fillText('SINDA', w * 0.03, h * 0.64);
    g.font = `600 ${h * 0.06}px ${fam}`; g.fillText('Singapore Indian Development Association', w * 0.03, h * 0.78); g.fillText('www.sinda.org.sg', w * 0.03, h * 0.9);
  });
  // chalk kolam on the aisle beside the van (775–780 s): loops round grids of dots, and rangoli flowers in coloured chalk
  const kolamTex = () => canvasTex(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); const R = seq(19);
    for (let k = 0; k < 7; k++) {
      const cx = w * (0.08 + k * 0.14) + (R() - 0.5) * 30, cy = h * (0.5 + (R() - 0.5) * 0.3), rr = h * (0.22 + R() * 0.12);
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3;
      if (k % 2) {
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (Math.abs(a) + Math.abs(b) <= 2) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(cx + a * rr * 0.32, cy + b * rr * 0.32, 3, 0, Math.PI * 2); g.fill(); }
        for (let p = 0; p < 8; p++) { const an = (p * Math.PI) / 4; g.beginPath(); g.ellipse(cx + Math.cos(an) * rr * 0.5, cy + Math.sin(an) * rr * 0.5, rr * 0.42, rr * 0.18, an, 0, Math.PI * 2); g.stroke(); }
      } else {
        for (let ring = 3; ring > 0; ring--) { g.strokeStyle = ['rgba(255,190,205,0.9)', 'rgba(255,236,170,0.9)', 'rgba(255,255,255,0.9)'][ring - 1]; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, (rr * ring) / 3, 0, Math.PI * 2); g.stroke(); }
        for (let p = 0; p < 12; p++) { const an = (p * Math.PI) / 6; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(an + 0.3) * rr * 1.2, cy + Math.sin(an + 0.3) * rr * 1.2, cx + Math.cos(an) * rr * 1.3, cy + Math.sin(an) * rr * 1.3); g.stroke(); }
      }
    }
  });

  // ---- south-west: 20 and 22 Campbell Lane ----------------------------------------------------------------------------------
  function row(K) {
    // 20: white, red-framed French windows with their shutters folded back, a red band under the cornice (659 s)
    upper(K, F20, BACK20, 7.0, WHITE, 0xa54b3a);
    K.box(F20.x0, F20.x1, 6.95, 7.05, F20.zf - 0.08, F20.zf, RED);
    for (const cx of [91.78, 94.5]) window2(K, F20, cx, RED, 0x9c2f2a, false);
    for (const x of [F20.x0, F20.x1]) K.box(x - 0.13, x + 0.13, GF + 0.32, 6.95, F20.zf - 0.06, F20.zf + 0.02, TRIM);
    fiveFootWay(K, F20, [90.42, 95.86], 0xe9e4da);
    K.box(F20.x0, F20.x1, 0, GF, ROOM20, BACK20, WHITE); K.block(F20.x0, ROOM20, F20.x1, BACK20);
    // 22: the same front, turned with its plot, and round the cut corner onto Clive Street
    const front = face(P22[0], P22[1], IN22), cut = face(P22[1], P22[2], IN22), side = face(P22[2], P22[3], IN22), inner = face(W22[3], W22[2], IN22);
    prism(K, P22, GF, 7.0, WHITE); prism(K, G22, 0, GF, WHITE); K.blockPoly(G22);
    for (const F of [front, cut, side]) {
      part(K, F, -0.03, F.len + 0.03, 7.0, 7.22, -0.3, 0.16, TRIM);
      part(K, F, 0, F.len, 6.95, 7.05, 0, 0.08, RED);
      roofSlope(K, F, 7.0, 3.2, 1.3);
    }
    part(K, front, 0, front.len, GF - 0.02, GF + 0.32, -0.02, 0.12, TRIM);
    part(K, cut, cut.len - 2.25, cut.len, GF - 0.02, GF + 0.32, -0.02, 0.12, TRIM);                 // over the five-foot way's end
    for (const s of [0.13, front.len - 0.13]) part(K, front, s - 0.13, s + 0.13, GF + 0.32, 6.95, -0.02, 0.06, TRIM);
    for (const s of [1.63, 4.9]) { const [x, z] = front.at(s); faceWindow(K, x, z, front.nx, front.nz, RED, 0x9c2f2a, false); }
    { const [x, z] = cut.at(cut.len / 2); faceWindow(K, x, z, cut.nx, cut.nz, RED, 0x9c2f2a, false); }
    for (let k = 0; k < 5; k++) { const [x, z] = side.at(1.9 + k * 3.2); faceWindow(K, x, z, side.nx, side.nz, RED, 0x9c2f2a, false); }
    // its five-foot way, its corner column with a heritage lamp, and two units shut behind red louvred doors (an
    // assumption: BAWA'S shelving and the closed tent hide them in the video)
    flat(K, W22, 0.014, NAV.toon(0xffffff, { map: tiles() })); flat(K, W22, GF - 0.021, 0xe4ddd2);
    const [cx, cz] = front.at(0.02, -0.22);
    K.cyl(cx, 0, cz, 0.19, GF - 0.3, 0xe9e4da, { seg: 22 }); K.box(cx - 0.25, cx + 0.25, 0, 0.12, cz - 0.25, cz + 0.25, 0xb9b4aa, 0.02); K.box(cx - 0.25, cx + 0.25, GF - 0.32, GF - 0.02, cz - 0.25, cz + 0.25, 0xd8d2c6, 0.02);
    K.block(cx - 0.24, cz - 0.24, cx + 0.24, cz + 0.24);
    K.rod(V(cx, 3.05, cz - 0.2), V(cx, 3.05, cz - 0.45), 0.02, 0x1b1b1b, 6); K.box(cx - 0.09, cx + 0.09, 2.78, 3.0, cz - 0.55, cz - 0.37, 0x1b1b1b); lamp(K, cx, 2.86, cz - 0.46);
    for (const [s0, s1] of [[0.45, 3.65], [3.95, 7.5]]) {
      shutDoors(K, inner, s0, s1);
      for (const s of [s0 - 0.2, s1 + 0.2]) part(K, inner, s - 0.15, s + 0.15, 0, GF, -0.02, 0.2, TRIM);
    }
    part(K, inner, 0.1, 7.8, 2.72, GF, -0.02, 0.2, TRIM);
    for (let k = 0; k < 4; k++) { const s = 2.6 + k * 3.6; shutDoors(K, side, s - 0.6, s + 0.6, 0x7a2a22, 2.5); part(K, side, s - 0.75, s + 0.75, 2.5, 2.7, 0, 0.1, TRIM); }
  }

  // ---- south-west: Serangoon Air Travel ------------------------------------------------------------------------------------
  function travel(K, r) {
    const { room } = NAV.laneKit, R = room(K, F20, F20.x0, F20.x1, ROOM20, { floor: 0xe6e2da, tubes: 3 }), zs = R.zs;
    // its fascia: a slate-blue board with the name, the phones and the web address in white (616–624 s), a lantern by it
    board(K, boardTex([['SERANGOON AIR TRAVEL', 0.5, 0.4, 'Georgia, "Times New Roman", serif'], ['Tel:65917160   Hp:98395023   www.serangoonair.com', 0.19, 0.8]], { w: 4.8, h: 0.62, bg: '#4f7f96', ink: '#ffffff' }), 4.8, 0.62, V(93.14, 3.12, zs - 0.04), R.ry, 0.4);
    K.rod(V(95.38, 3.02, zs - 0.02), V(95.38, 3.02, zs - 0.3), 0.012, 0x1b1b1b, 6);
    K.box(95.29, 95.47, 2.66, 2.96, zs - 0.4, zs - 0.22, 0x1b1b1b); K.item('cone', [95.38, 3.02, zs - 0.31], [0.13, 0.12, 0.13], 0x1b1b1b); lamp(K, 95.38, 2.8, zs - 0.31);
    // the shopfront: a glass door standing open at its NW end, a window papered with posters and flags, a wall behind BAWA'S
    for (const x of [90.78, 91.98, 94.15]) K.box(x - 0.03, x + 0.03, 0, 2.72, zs - 0.02, zs + 0.06, 0xc9ced3);
    K.box(90.75, 92.01, 2.62, 2.72, zs - 0.02, zs + 0.06, 0xc9ced3);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.5), glass()); leaf.rotation.y = Math.PI / 2; leaf.position.set(90.83, 1.3, zs + 0.58); K.extra.push(leaf);
    board(K, windowTex(), 2.1, 2.55, V(93.07, 1.32, zs - 0.01), R.ry, 0.3);
    K.box(92.01, 94.15, 0, 0.06, zs - 0.03, zs + 0.06, 0xc9ced3);
    K.box(94.18, 95.56, 0, 2.72, zs - 0.02, zs + 0.15, TRIM);
    K.block(92.05, zs - 0.06, 95.6, zs + 0.18);
    // inside (not seen: assumed): two desks with screens, chairs either side, a rack of brochures, posters on the walls
    for (const [x0, x1] of [[91.3, 92.75], [93.35, 94.8]]) {
      K.box(x0, x1, 0.72, 0.76, 10.9, 11.6, 0xd9cdb8, 0.01); K.box(x0 + 0.04, x1 - 0.04, 0, 0.72, 11.45, 11.58, 0xc4b69c);
      for (const x of [x0 + 0.05, x1 - 0.05]) K.box(x - 0.025, x + 0.025, 0, 0.72, 10.95, 11.55, 0x9a9184);
      const mx = (x0 + x1) / 2;
      K.box(mx - 0.27, mx + 0.27, 0.86, 1.18, 11.32, 11.36, 0x1f2328); K.box(mx - 0.03, mx + 0.03, 0.76, 0.86, 11.33, 11.37, 0x2b2b2b);
      K.box(mx - 0.22, mx + 0.22, 0.76, 0.78, 11.05, 11.2, 0x2b2b2b);
      for (const [z, back] of [[12.05, 12.3], [10.35, 10.12]]) {
        K.cyl(mx, 0, z, 0.22, 0.04, 0x2b2b2b, { seg: 10 }); K.cyl(mx, 0.04, z, 0.025, 0.4, 0x6a6f75, { seg: 6 });
        K.box(mx - 0.23, mx + 0.23, 0.44, 0.5, z - 0.22, z + 0.22, 0x23395b, 0.02); K.box(mx - 0.22, mx + 0.22, 0.5, 0.98, back - 0.03, back + 0.03, 0x23395b, 0.02);
      }
      K.block(x0 - 0.05, 10.85, x1 + 0.05, 11.65);
    }
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.28), NAV.toon(0xcfe8ff, { emissive: 0xa9d4ff, emissiveIntensity: 0.6, ink: false }));
    for (const mx of [92.025, 94.075]) { const sc = screen.clone(); sc.rotation.y = Math.PI; sc.position.set(mx, 1.02, 11.315); K.extra.push(sc); }
    K.box(95.29, 95.69, 0, 1.6, 9.4, 10.6, 0xd8dcdf);
    for (let k = 0; k < 4; k++) for (let z = 9.5; z < 10.5; z += 0.24) K.item('box', [95.275, 0.35 + k * 0.36, z + 0.1], [0.03, 0.3, 0.21], 0xffffff, [0, 0, 0], posterCell(r));
    K.block(95.25, 9.35, 95.72, 10.65);
    for (let z = 9.3; z < 13.4; z += 0.85) for (const [x, ry] of [[90.59, Math.PI / 2], [95.69, -Math.PI / 2]]) if (x < 91 || z > 10.8) K.item('box', [x, 1.95, z], [0.62, 0.84, 0.012], 0xffffff, [0, ry, 0], posterCell(r));
    for (let x = 91.0; x < 95.4; x += 0.95) K.item('box', [x, 1.95, ROOM20 - 0.17], [0.62, 0.84, 0.012], 0xffffff, [0, 0, 0], posterCell(r));
    K.box(94.9, 95.65, 0, 1.3, 12.9, 13.8, 0xb9bec4); K.box(95.05, 95.5, 1.3, 1.62, 13.3, 13.65, 0xe9eef2); K.block(94.85, 12.85, 95.7, 13.85);
    // a second rack of brochures at the back, stacks of them on the desks, a clock and framed licences, flags strung across
    K.box(90.58, 90.98, 0, 1.6, 11.9, 13.4, 0xd8dcdf); K.block(90.55, 11.85, 91.0, 13.45);
    for (let k = 0; k < 4; k++) for (let z = 12.0; z < 13.3; z += 0.24) K.item('box', [90.995, 0.35 + k * 0.36, z + 0.1], [0.03, 0.3, 0.21], 0xffffff, [0, 0, 0], posterCell(r));
    for (const x of [91.5, 92.2, 93.6, 94.3]) for (let k = 0; k < 3; k++) K.item('box', [x, 0.78 + k * 0.012, 11.0], [0.21, 0.01, 0.3], 0xffffff, [0, (r() - 0.5) * 0.4, 0], posterCell(r));
    K.cyl(93.14, 2.45, ROOM20 - 0.17, 0.17, 0.03, 0xf4f4f2, { seg: 20 });
    for (const x of [91.7, 92.4]) K.box(x - 0.22, x + 0.22, 2.3, 2.62, ROOM20 - 0.19, ROOM20 - 0.16, 0x8e6a49);
    K.rod(V(90.6, 3.05, 9.3), V(95.7, 3.05, 12.8), 0.004, 0x333333, 4);
    for (let k = 0; k < 14; k++) { const t = (k + 0.5) / 14, fl = 4 + 5 * (k % 12); K.item('box', [90.6 + 5.1 * t, 2.88, 9.3 + 3.5 * t], [0.24, 0.32, 0.005], 0xffffff, [0, -Math.atan2(3.5, 5.1), 0], [Math.floor(fl / N), fl % N, 's7c-posters']); }   // the flags in the atlas
  }

  // ---- north-east: the SINDA van, its cones and the trolleys of stall stock beside it -------------------------------------------
  function van(K) {
    const P = 0x6b3fb3, x0 = 90.3, x1 = 94.75, z0 = -3.69, z1 = -1.95;
    K.box(x0, x1, 0.32, 1.24, z0, z1, P, 0.06);                                                       // body
    K.box(x0 + 0.06, x1 - 0.05, 1.24, 1.86, z0 + 0.05, z1 - 0.05, P, 0.08);                         // window band
    K.box(x0 + 0.15, x1 - 0.12, 1.86, 1.97, z0 + 0.11, z1 - 0.11, 0x5a3399, 0.05);                  // roof
    K.box(x0 - 0.06, x0 + 0.04, 0.36, 0.5, z0 - 0.03, z1 + 0.03, 0xc9ced3, 0.02); K.box(x1 - 0.04, x1 + 0.07, 0.36, 0.5, z0 - 0.03, z1 + 0.03, 0xc9ced3, 0.02);
    for (const z of [z0 + 0.32, z1 - 0.32]) { K.add(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16).rotateZ(Math.PI / 2).translate(x0 - 0.01, 0.84, z), 0xeef2f5); K.box(x0 - 0.03, x0, 0.3, 0.4, z - 0.1, z + 0.1, 0xffb74d); }
    for (const x of [x0 + 0.75, x1 - 0.8]) for (const z of [z0, z1]) {
      K.add(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 20).rotateX(Math.PI / 2).translate(x, 0.33, z), 0x1b1b1b);
      K.add(new THREE.CylinderGeometry(0.15, 0.15, 0.24, 14).rotateX(Math.PI / 2).translate(x, 0.33, z), 0xd5dbe2);
    }
    for (const z of [z0 - 0.04, z1 + 0.04]) K.box(x0 + 0.25, x0 + 0.35, 1.3, 1.42, z - 0.04, z + 0.04, 0x1b1b1b);                  // mirrors
    const tinted = NAV.toon(0x2a3348, { emissive: 0x1a2236, emissiveIntensity: 0.4, ink: false });
    const pane = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), tinted); m.position.set(x, y, z); m.rotation.y = ry; K.extra.push(m); };
    pane(1.5, 0.5, x0 - 0.005, 1.53, (z0 + z1) / 2, -Math.PI / 2);                                  // the windscreen
    pane(1.3, 0.42, x1 + 0.005, 1.55, (z0 + z1) / 2, Math.PI / 2);
    for (let k = 0; k < 3; k++) { const x = x0 + 1.15 + k * 1.05; pane(0.9, 0.44, x, 1.55, z1 - 0.044, 0); pane(0.9, 0.44, x, 1.55, z0 + 0.044, Math.PI); }
    const liv = liveryTex();
    board(K, liv, 4.0, 0.86, V((x0 + x1) / 2, 0.8, z1 + 0.006), 0, 0.12); board(K, liv, 4.0, 0.86, V((x0 + x1) / 2, 0.8, z0 - 0.006), Math.PI, 0.12);
    board(K, boardTex([['SINDA', 0.62, 0.55]], { w: 0.9, h: 0.3, bg: '#6b3fb3', ink: '#ffffff' }), 0.9, 0.3, V(x0 - 0.008, 1.08, (z0 + z1) / 2), -Math.PI / 2, 0.15);
    K.block(x0 - 0.08, z0 - 0.06, x1 + 0.08, z1 + 0.06);
    // the traffic cones on the line at its ends, the trolleys of stock beside it (780–782 s)
    for (const [x, z] of [[89.7, -1.8], [95.35, -1.85]]) {
      K.box(x - 0.19, x + 0.19, 0, 0.04, z - 0.19, z + 0.19, 0xd8501a); K.cyl(x, 0.04, z, 0.15, 0.66, 0xf26a1b, { rt: 0.03, seg: 14 });
      const rc = (y) => 0.15 - ((y - 0.04) / 0.66) * 0.12 + 0.012;                                  // its white bands, just proud of it
      for (const y of [0.3, 0.47]) K.cyl(x, y, z, rc(y), 0.07, 0xf5f5f5, { rt: rc(y + 0.07), seg: 14 });
      K.block(x - 0.2, z - 0.2, x + 0.2, z + 0.2);
    }
    for (const [xa, za] of [[88.95, -2.85], [95.05, -3.65]]) {
      K.box(xa, xa + 0.9, 0.16, 0.2, za, za + 0.58, 0x9aa0a6);
      for (const x of [xa + 0.06, xa + 0.84]) for (const z of [za + 0.06, za + 0.52]) K.cyl(x, 0, z, 0.06, 0.16, 0x2b2b2b, { seg: 10 });
      K.box(xa + 0.84, xa + 0.88, 0.2, 1.0, za, za + 0.58, 0x9aa0a6);
      for (let k = 0; k < 4; k++) K.box(xa + 0.05 + (k % 2) * 0.38, xa + 0.4 + (k % 2) * 0.38, 0.2 + Math.floor(k / 2) * 0.3, 0.48 + Math.floor(k / 2) * 0.3, za + 0.05, za + 0.53, pick(seq(k + 9), [0xd8c08a, 0xc9a96e, 0xf4f4f0]), 0.01);
      K.block(xa - 0.02, za - 0.02, xa + 0.92, za + 0.6);
    }
  }

  // ---- the street end: Clive Street, the mouth's bollards and truss, the street lamps ---------------------------------------
  function street(K) {
    const road = NAV.toon(0x3b3e46), walk = NAV.toon(0x8c8c92);
    flat(K, [[clive(-45) + HW, -45], [150, -45], [150, 36], [clive(36) + HW, 36]], 0.003, walk);                       // the far pavements
    flat(K, [[96, 9.2], [clive(9.2) - HW, 9.2], [clive(36) - HW, 36], [96, 36]], 0.003, walk);                           // round 22's corner
    flat(K, [[clive(-45) - HW, -45], [clive(-45) + HW, -45], [clive(36) + HW, 36], [clive(36) - HW, 36]], 0.006, road);  // Clive Street
    flat(K, [[118.5, -0.76], [146.5, 4.44], [145.5, 9.56], [117.5, 4.36]], 0.006, road);                                  // the lane beyond it
    strip(K, [clive(-4.6) - HW, -4.6], [clive(36) - HW, 36], 0.16, 0.08, 0xb9b7b0);
    strip(K, [clive(-45) + HW, -45], [clive(-1.0) + HW, -1.0], 0.16, 0.08, 0xb9b7b0); strip(K, [clive(4.6) + HW, 4.6], [clive(36) + HW, 36], 0.16, 0.08, 0xb9b7b0);
    for (let z = -42; z < 34; z += 3.2) strip(K, [clive(z), z], [clive(z + 1.6), z + 1.6], 0.12, 0.004, 0xeeeeea, 0.006);
    // bollards along the kerb at the lane's mouth, silver with a yellow band (651, 660 s)
    for (const z of [-3.4, -1.7, 0, 1.7, 3.4, 5.1]) {
      const x = clive(z) - HW - 0.45;
      K.cyl(x, 0, z, 0.1, 0.88, 0xc4c8cc, { seg: 14 }); K.cyl(x, 0.62, z, 0.106, 0.1, 0xf2c12e, { seg: 14 }); K.item('ball', [x, 0.88, z], [0.1, 0.05, 0.1], 0xc4c8cc);
      K.block(x - 0.12, z - 0.12, x + 0.12, z + 0.12);
    }
    // the bare steel lattice truss at the SW corner of the mouth
    const tx = 111.5, tz = 6.0, h = 5.2, c = 0xc9ced3;
    for (const [dx, dz] of [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]]) K.rod(V(tx + dx, 0, tz + dz), V(tx + dx, h, tz + dz), 0.022, c, 6);
    const C4 = [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]];
    for (let y = 0.3; y < h; y += 0.5) for (let k = 0; k < 4; k++) {
      const [ax, az] = C4[k], [bx, bz] = C4[(k + 1) % 4];
      K.rod(V(tx + ax, y, tz + az), V(tx + bx, y, tz + bz), 0.01, c, 4); K.rod(V(tx + ax, y, tz + az), V(tx + bx, Math.min(h, y + 0.5), tz + bz), 0.009, c, 4);
    }
    K.box(tx - 0.3, tx + 0.3, 0, 0.03, tz - 0.3, tz + 0.3, 0x8a9096); K.block(tx - 0.3, tz - 0.3, tx + 0.3, tz + 0.3);
    // two street lamps on Clive Street
    for (const [x, z, dir] of [[clive(-9) + HW + 0.6, -9, -1], [clive(11.5) - HW - 0.6, 11.5, 1]]) {
      K.cyl(x, 0, z, 0.09, 7.4, 0x5c6168, { rt: 0.06, seg: 10 }); K.rod(V(x, 7.3, z), V(x + dir * 1.1, 7.5, z), 0.04, 0x5c6168, 6);
      K.box(x + dir * 1.1 - 0.3, x + dir * 1.1 + 0.3, 7.38, 7.52, z - 0.12, z + 0.12, 0x5c6168, 0.02);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.18), NAV.toon(0xfff6e0, { emissive: 0xfff0cc, emissiveIntensity: 1, ink: false })); glow.position.set(x + dir * 1.1, 7.36, z); K.extra.push(glow);
      K.block(x - 0.12, z - 0.12, x + 0.12, z + 0.12);
    }
    // the chalk kolam beside the van
    const kolam = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1.7), NAV.toon(0xffffff, { map: kolamTex(), alphaTest: 0.3, ink: false, polyOffset: true }));
    kolam.rotation.x = -Math.PI / 2; kolam.position.set(92.3, 0.009, -0.88); K.extra.push(kolam);
  }

  // ---- across Clive Street: Madras Bakery, the green-lit row, the ochre building over Chola Mart (644–651 s) -------------------
  const shopGlow = () => NAV.toon(0xffe8c4, { emissive: 0xffd49a, emissiveIntensity: 0.7, ink: false });
  function madras(K) {
    const IN = [132.5, -9], west = face(MADRAS[3], MADRAS[2], IN), corner = face(MADRAS[2], MADRAS[1], IN), north = face(MADRAS[1], MADRAS[0], IN);
    const WALL = 0xf6f0e2, MOULD = 0xece3d2, SHUT = 0x8a3a22;
    prism(K, MADRAS, 0, 7.3, WALL); K.blockPoly(MADRAS);
    for (const F of [west, corner, north]) {
      part(K, F, -0.05, F.len + 0.05, 7.3, 7.5, -0.25, 0.2, MOULD);
      roofSlope(K, F, 7.35, 2.6, 1.15);
      part(K, F, 0, F.len, GF - 0.05, GF + 0.12, -0.02, 0.12, MOULD);
      const n = Math.max(1, Math.round(F.len / 3.2)), step = F.len / n;
      for (let k = 0; k <= n; k++) { const s = Math.min(F.len - 0.12, Math.max(0.12, k * step)), [lx, lz] = F.at(s, 0.14); part(K, F, s - 0.12, s + 0.12, GF + 0.12, 7.3, -0.02, 0.08, 0xfbf7ee); lamp(K, lx, 3.82, lz); }
      if (F === west) for (let k = 0; k < n; k++) shutWindow(K, F, (k + 0.5) * step, SHUT);
    }
    shutWindow(K, corner, corner.len / 2, SHUT, { w: 0.9 }); shutWindow(K, north, north.len / 2, SHUT, { w: 0.9 });
    // its gable on the cut corner
    {
      const w = corner.len + 0.3, sh = new THREE.Shape(), h = 2.35;
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, 0.35);
      sh.quadraticCurveTo(w * 0.22, 0.55, w * 0.17, 1.35); sh.quadraticCurveTo(w * 0.15, h, 0, h);
      sh.quadraticCurveTo(-w * 0.15, h, -w * 0.17, 1.35); sh.quadraticCurveTo(-w * 0.22, 0.55, -w / 2, 0.35); sh.closePath();
      K.add(new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 10 }).translate(corner.len / 2, 7.4, -0.18).applyMatrix4(corner.M), WALL);
      part(K, corner, corner.len / 2 - 0.18, corner.len / 2 + 0.18, 8.75, 9.15, 0.1, 0.14, 0x3a2a22);
    }
    // the bakery's lit ground floor, its dark-red signboards in Tamil and English and the round signs
    const glowM = shopGlow();
    panel(K, west, 8.2, 2.35, west.len - 4.3, 1.25, 0.03, glowM); panel(K, corner, corner.len - 0.4, 2.35, corner.len / 2, 1.25, 0.03, glowM); panel(K, north, north.len - 0.4, 2.35, north.len / 2, 1.25, 0.03, glowM);
    for (const F of [west, corner, north]) for (let s = 1.0; s < F.len - 0.3; s += 1.3) if (F !== west || s > west.len - 8.4) part(K, F, s - 0.03, s + 0.03, 0, 2.45, 0.02, 0.07, 0x3a2a22);
    const red = '#7d1d1d';
    sign(K, west, boardTex([['மெட்ராஸ் பேக்கரி', 0.5, 0.42], ['PUFFS & MILK TEA   ·   MASALA TEA', 0.18, 0.84]], { w: 3.6, h: 0.6, bg: red, ink: '#ffffff' }), 3.6, 0.6, west.len - 6.1, 2.85);
    sign(K, west, boardTex([['Madras Bakery', 0.62, 0.5, 'Georgia, "Times New Roman", serif']], { w: 3.0, h: 0.6, bg: red, ink: '#f7d23a' }), 3.0, 0.6, west.len - 2.3, 2.85);
    sign(K, north, boardTex([['Madras Bakery', 0.62, 0.5, 'Georgia, "Times New Roman", serif']], { w: 2.5, h: 0.55, bg: red, ink: '#f7d23a' }), 2.5, 0.55, north.len / 2, 2.85);
    part(K, corner, 0.2, corner.len - 0.2, 2.3, 2.42, 0, 0.75, 0x9c1f24);
    const disc = (text, sub, bg, ink, F, s, y, d, rr) => {
      const tex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = bg; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#c62828'; g.lineWidth = 10; g.stroke(); g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${w * 0.16}px Georgia, serif`; g.fillText(text, w / 2, h * 0.46); if (sub) { g.font = `700 ${w * 0.14}px Georgia, serif`; g.fillText(sub, w / 2, h * 0.64); } });
      const m = new THREE.Mesh(new THREE.CircleGeometry(rr, 32), NAV.toon(0xffffff, { map: tex, emissive: 0xffffff, emissiveIntensity: 0.55, unique: true })); m.material.emissiveMap = tex;
      const [x, z] = F.at(s, d); m.position.set(x, y, z); m.rotation.y = F.ry; K.extra.push(m);
    };
    disc('Madras', 'Bakery', '#fdf6ea', '#b71c1c', corner, corner.len / 2, 3.35, 0.32, 0.4);
    const jk = west.len - west.len / Math.round(west.len / 3.2);                                     // on the pilaster by the corner
    disc('Juice', 'King', '#e65100', '#ffffff', west, jk, 4.9, 0.3, 0.32);
    for (const [F, s, y] of [[corner, corner.len / 2, 3.35], [west, jk, 4.9]]) { const [x0, z0] = F.at(s, 0.02), [x1, z1] = F.at(s, 0.3); K.rod(V(x0, y + 0.42, z0), V(x1, y + 0.42, z1), 0.015, 0x1b1b1b, 4); }
  }
  function greenRow(K) {
    [[GREEN1, [136.8, -9]], [GREEN2, [141.8, -8]]].forEach(([P, IN], k) => {
      prism(K, P, 0, 7.1, 0xeef1e6); K.blockPoly(P);
      const F = face(P[1], P[0], IN);
      part(K, F, -0.05, F.len + 0.05, 7.1, 7.3, -0.25, 0.2, 0xe2e6d8); roofSlope(K, F, 7.15, 2.6, 1.15);
      part(K, F, 0, F.len, GF - 0.05, GF + 0.12, -0.02, 0.12, 0xe2e6d8);
      for (const s of [1.4, 3.7]) shutWindow(K, F, s, 0x2e7d32, { w: 0.85, surround: 0xf4f6ee });
      // green light strips under the cornice and the sills, a green awning over the lit shops
      const led = NAV.toon(0x7dff6a, { emissive: 0x6dff5a, emissiveIntensity: 1, ink: false });
      for (const y of [6.95, 3.95]) panel(K, F, F.len - 0.2, 0.05, F.len / 2, y, 0.13, led);
      panel(K, F, F.len - 0.5, 2.3, F.len / 2, 1.2, 0.03, shopGlow());
      const aw = new THREE.BufferGeometry();
      aw.setAttribute('position', new THREE.Float32BufferAttribute([0.1, 2.95, 0.05, F.len - 0.1, 2.95, 0.05, F.len - 0.1, 2.55, 1.1, 0.1, 2.95, 0.05, F.len - 0.1, 2.55, 1.1, 0.1, 2.55, 1.1], 3));
      K.add(aw.applyMatrix4(F.M), 0x1e8a45, THREE.DoubleSide);
      sign(K, F, boardTex([['', 0.5, 0.5]], { w: 2.0, h: 0.42, bg: k ? '#f8e7a1' : '#ffffff', ink: '#2b2b2b', border: '#2e7d32' }), 2.0, 0.42, F.len / 2, 3.2, 0.05, 0.6);
      if (!k) sign(K, F, canvasTex(96, 384, (g, w, h) => { g.fillStyle = '#16120e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c230'; g.font = `700 ${w * 0.62}px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle'; [...'AADHI'].forEach((c, i) => g.fillText(c, w / 2, h * (0.13 + i * 0.18))); }), 0.36, 1.45, 0.9, 4.75, 0.2, 0.7);
    });
  }
  function ochreBuilding(K) {
    const IN = [125, 9.8], north = face(OCHRE_B[3], OCHRE_B[0], IN), west = face(OCHRE_B[2], OCHRE_B[3], IN), OCH = 0xd9b25c, CREAM = 0xf2e7cc;
    prism(K, OCHRE_B, 0, 7.6, OCH); K.blockPoly(OCHRE_B);
    for (const F of [north, west]) { part(K, F, -0.05, F.len + 0.05, 7.6, 7.82, -0.25, 0.22, CREAM); roofSlope(K, F, 7.65, 2.6, 1.15); part(K, F, 0, F.len, GF - 0.05, GF + 0.15, -0.02, 0.14, CREAM); }
    for (let k = 0; k < 4; k++) archWindow(K, north, 1.6 + k * 3.0);
    archWindow(K, west, west.len / 2);
    // the lit shops under it: their lightboxes with LED frames; only the words the video shows (651 s)
    panel(K, north, north.len - 0.6, 2.4, north.len / 2, 1.25, 0.03, shopGlow());
    const lightbox = (text, bg, ink, w, h, s, y, size = 0.55) => sign(K, north, canvasTex(512, Math.round((512 * h) / w), (g, cw, ch) => {
      g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
      const D = ['#ff1744', '#ffea00', '#00e676', '#2979ff', '#d500f9'];                       // the LED dots round its edge
      for (let i = 0; i < 24; i++) for (const y of [3, ch - 9]) { g.fillStyle = D[(i + (y > 3 ? 2 : 0)) % 5]; g.fillRect(((i + 0.5) * cw) / 24 - 3, y, 6, 6); }
      if (text) { g.fillStyle = ink; g.font = `700 ${ch * size}px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cw / 2, ch * 0.52); }
    }), w, h, s, y, 0.05, 0.75);
    lightbox('Chola Mart', '#e3f4ff', '#1e6fd0', 2.6, 0.62, 8.6, 2.95);
    lightbox('Chola Mart', '#e3f4ff', '#1e6fd0', 0.7, 1.1, 6.95, 2.75, 0.14);
    lightbox('IT', '#1565c0', '#ffffff', 1.0, 0.62, 5.1, 2.95, 0.7);
    lightbox('', '#ffffff', '#c62828', 1.3, 0.62, 11.3, 2.95);
    lightbox('', '#fff3e0', '#c62828', 0.55, 1.0, 10.2, 2.7);
    sign(K, north, boardTex([['SPICE HITS', 0.5, 0.5]], { w: 0.7, h: 0.32, bg: '#c62828', ink: '#ffffff' }), 0.7, 0.32, 8.3, 1.25, 0.06, 0.6);
  }

  // ---- the stalls of this stretch, as holograms built from their stills -------------------------------------------------------
  const { Builder, rnd, seedOf, frontZ, eaveSign, rollingRack } = KIT;
  const HG = {};
  const hg = (k, make) => HG[k] || (HG[k] = make());
  const garment = () => hg('garment', () => new THREE.BoxGeometry(0.035, 0.8, 0.44));
  const JAR = [0xe3b25a, 0xc98a3c, 0xf0d28a, 0x9c5a2e, 0xe2c27a, 0xd8743c, 0xf3e3b4, 0x8a6a3a, 0xe9a64a];
  // a clear plastic or tarp wall across a stall's front (along the lane), with soft folds
  function frontSheet(B, lx0, lx1, lz, top, colour, folds = 9) {
    const w = lx1 - lx0, g = new THREE.PlaneGeometry(w, top, 24, 3), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin((p.getX(k) / w + 0.5) * Math.PI * folds) * 0.03);
    g.computeVertexNormals(); B.add('walls', g, colour, B.P(lx0 + w / 2, top / 2, lz));
  }
  // SW-25: an open frame, an empty steel bain-marie counter on castors with its gantry, empty white shelving behind (592 s)
  KIT.custom['SW-25'] = (e, depth) => {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side);
    B.tent({ eave: 2.5, ridge: 3.15 });
    B.box('furniture', 1.0, 0.5, 0.42, 1.8, 0.78, 0.66, 0xc9ced3);
    for (let k = 0; k < 4; k++) B.box('furniture', 0.38 + k * 0.41, 0.9, 0.45, 0.36, 0.04, 0.5, 0x8a9096);
    for (const lx of [0.2, 1.8]) for (const lz of [0.18, 0.66]) B.add('furniture', new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10).rotateZ(Math.PI / 2), 0x2b2b2b, B.P(lx, 0.06, lz));
    for (const lx of [0.14, 1.86]) B.rod('furniture', B.P(lx, 0.89, 0.62), B.P(lx, 1.62, 0.62), 0.015, 0xc9ced3);
    for (const ly of [1.25, 1.6]) B.box('furniture', 1.0, ly, 0.55, 1.74, 0.02, 0.32, 0xd9e7ee);
    B.shelving(0.15, 1.6, 1.7, 0.42, 2.0, 5, 0xf4f4f2);
    return B.finish();
  };
  // SW-26: kurtis and long dresses, block-print shirts, skirts and palazzos on rails; mirror-work hangings with elephants on a bar
  // over the front; the rolling rack of brocade table runners out past the line; a TOP SELLER card on a rail (594–608 s)
  KIT.custom['SW-26'] = (e, depth, sgn, o = {}) => {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B, items = [];
    B.tent({ eave: 2.5, ridge: 3.15 });
    eaveSign(B, sgn);
    B.rod('furniture', B.P(0.1, 2.32, 0.32), B.P(w - 0.1, 2.32, 0.32), 0.012, 0xb9bec4);
    for (let k = 0; k < 5; k++) { B.box('goods', 0.38 + k * 0.68, 1.98, 0.33, 0.58, 0.62, 0.02, [0xd84315, 0xf9a825, 0x6a1b9a, 0x00897b, 0xc62828][k]); for (let m = 0; m < 6; m++) B.box('goods', 0.2 + k * 0.68 + (m % 3) * 0.18, 1.8 + Math.floor(m / 3) * 0.32, 0.31, 0.05, 0.05, 0.01, 0xe8eef2); }
    KIT.rail(B, items, r, 0.12, w - 0.12, d - 0.5, 1.95, [1.05, 1.4]);
    KIT.rail(B, items, r, 0.25, w - 0.5, d * 0.55, 1.75, [0.75, 1.0]);
    KIT.rail(B, items, r, 0.3, w - 0.6, 1.55, 1.35, [0.7, 0.95]);
    for (const lx of [w - 0.32]) { B.rod('furniture', B.P(lx, 1.7, 1.2), B.P(lx, 1.7, 3.3), 0.013, 0xc9ced3); for (const lz of [1.2, 3.3]) B.rod('furniture', B.P(lx, 0, lz), B.P(lx, 1.7, lz), 0.016, 0xc9ced3); for (let lz = 1.3; lz < 3.25; lz += 0.085) { const p = B.P(lx, 1.25, lz); items.push([p.x, p.y, p.z, Math.PI / 2 + (r() - 0.5) * 0.3, 1, 0xd9c6a5, 1.05]); } }
    if (o.rack) rollingRack(B, r, items, o.rack);
    B.rod('furniture', B.P(1.0, 1.35, 1.45), B.P(1.0, 1.7, 1.45), 0.01, 0x43a047);
    B.sign('TOP SELLER', 1.0, 1.82, 1.43, 0.32, { bg: '#f7d23a', ink: '#1f2a44', sub: '$30', subInk: '#1f2a44', h: 0.24, card: true });
    B.sheet(w - 0.02, 0xdfeaf2, { folds: 5, tied: true, depth: 0.9 });
    B.instanced('garments', garment(), 0xffffff, items);
    return B.finish();
  };
  // SW-28, BAWA'S: the yellow and the black banners, three rows of LED bells under the truss, the front table of jars and bagged
  // murukku with its 3 FOR $10 cards, the curved glass case of canned drinks at the SE end by the blue and white tarp, white
  // shelving down that side, and the white and black shelving of jars against the shopfronts on the five-foot way (609–642 s)
  KIT.custom['SW-28'] = (e, depth) => {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w } = B;
    const back = 6.48, jars = [], lids = [], bags = [], cans = [], bells = [];
    B.tent({ eave: 2.5, ridge: 3.15 });
    for (const lz of [0.08, 1.75, 3.45]) {
      for (const oy of [0, 0.2]) B.rod('frame', B.P(0, 2.32 + oy, lz), B.P(w, 2.32 + oy, lz), 0.02, 0xcfd3d8);
      for (let k = 0; k < Math.round(w / 0.25); k++) B.rod('frame', B.P(k * 0.25, 2.32, lz), B.P(Math.min(w, k * 0.25 + 0.25), 2.52, lz), 0.008, 0xcfd3d8, 5);
    }
    B.sign("BAWA'S DELICACY PTE LTD", w / 2, 2.43, -0.04, Math.min(w - 0.3, 3.4), { bg: '#f7d23a', ink: '#c0222b', sub: 'HP: 9007 9354 · www.bawas.com.sg', subInk: '#1f2a44', h: 0.52 });
    B.sign("BAWA'S DELICACY PTE LTD", w / 2, 2.42, 4.3, Math.min(w - 0.6, 2.8), { bg: '#17140f', ink: '#e2b64a', h: 0.32 });
    for (const lz of [0.9, 2.6, 4.2]) for (let k = 0; k < 5; k++) { const lx = 0.4 + k * ((w - 0.8) / 4), top = B.P(lx, 2.32, lz), low = B.P(lx, 2.12, lz); B.rod('goods', top, low, 0.005, 0x222222, 4); bells.push([low.x, low.y - 0.08, low.z, 0, 1, 0xfff6d8]); }
    B.sheet(w - 0.02, 0x2f6fc0, { folds: 9 });
    B.sheet(0.03, 0xdfeaf2, { folds: 5, tied: true, depth: 0.9 });
    const fill = (ys, lx0, lx1, lz0, rows, alongZ = false, len = 0) => {
      for (const y of ys.slice(0, -1)) for (let row = 0; row < rows; row++) {
        const n = Math.floor(((alongZ ? len : lx1 - lx0) - 0.08) / 0.155);
        for (let k = 0; k < n; k++) {
          const tall = 0.18 + (r() < 0.25 ? 0.06 : 0), p = alongZ ? B.P(lx0 + 0.11 + row * 0.2, y + tall / 2, lz0 + 0.1 + k * 0.155) : B.P(lx0 + 0.09 + k * 0.155, y + tall / 2, lz0 + 0.11 + row * 0.2);
          jars.push([p.x, p.y, p.z, 0, 1, pick(r, JAR), tall / 0.2]); lids.push([p.x, y + tall + 0.017, p.z, 0, 1, r() < 0.55 ? 0xd2262e : 0xe8b53a]);
        }
      }
    };
    fill(B.shelving(0.2, back, 1.6, 0.42, 2.25, 6, 0xf4f4f2), 0.2, 1.8, back, 2);
    fill(B.shelving(1.85, back, 1.75, 0.42, 2.25, 6, 0x2b2b2b), 1.85, 3.6, back, 2);
    fill(B.shelving(w - 0.5, 1.15, 0.42, 3.9, 2.1, 5, 0xf4f4f2), w - 0.5, 0, 1.15, 2, true, 3.9);
    B.table(0.25, 0.12, 2.35, 0.68, 0.8, 0xf3efe6, 0xd8a72a);
    for (let tier = 0; tier < 3; tier++) for (let k = 0; k < 9 - tier * 2; k++) { const p = B.P(0.5 + tier * 0.155 + k * 0.155, 0.9 + tier * 0.215, 0.62 - tier * 0.05); jars.push([p.x, p.y, p.z, 0, 1, pick(r, JAR), 1]); lids.push([p.x, p.y + 0.117, p.z, 0, 1, 0xd2262e]); }
    for (let x = 0.32; x < 2.55; x += 0.17) for (let k = 0; k < 3; k++) { const p = B.P(x, 0.83 + k * 0.05, 0.25 + (r() - 0.5) * 0.04); bags.push([p.x, p.y, p.z, (r() - 0.5) * 0.3, 1, pick(r, [0xe8913a, 0xf0b54a, 0xd96a2a])]); }
    for (const lx of [0.6, 2.2]) B.sign('3 FOR $10', lx, 1.0, 0.16, 0.34, { bg: '#ffffff', ink: '#d0202a', h: 0.22, card: true });
    B.box('furniture', 3.3, 0.42, 0.47, 1.1, 0.84, 0.68, 0xd9d4ca);
    const case_ = new THREE.CylinderGeometry(0.4, 0.4, 1.08, 18, 1, true, 0, Math.PI / 2); case_.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
    B.add('furniture', case_, 0xbfe9ff, B.P(3.3, 0.86, 0.7), Math.PI);
    for (let k = 0; k < 14; k++) { const p = B.P(2.85 + (k % 7) * 0.13, 0.92, 0.32 + Math.floor(k / 7) * 0.18); cans.push([p.x, p.y, p.z, 0, 1, pick(r, [0x2e7d32, 0xc62828, 0x1565c0, 0xf9a825])]); }
    for (let k = 0; k < 3; k++) B.box('goods', 0.32, 0.17 + k * 0.32, 1.3, 0.42, 0.3, 0.36, 0xf4f4f0);
    B.box('furniture', 1.4, 0.23, 1.25, 0.32, 0.46, 0.32, 0xe14b4b);
    B.instanced('jars', hg('jar', () => new THREE.CylinderGeometry(0.065, 0.065, 0.2, 10, 1)), 0xffffff, jars);
    B.instanced('lids', hg('lid', () => new THREE.CylinderGeometry(0.07, 0.07, 0.034, 10, 1)), 0xffffff, lids);
    B.instanced('bags', hg('bag', () => new THREE.BoxGeometry(0.15, 0.05, 0.12)), 0xffffff, bags);
    B.instanced('cans', hg('can', () => new THREE.CylinderGeometry(0.033, 0.033, 0.12, 10, 1)), 0xffffff, cans);
    B.instanced('bells', hg('bell', () => new THREE.LatheGeometry([[0, 0.16], [0.03, 0.16], [0.05, 0.12], [0.11, 0.02], [0.12, 0]].map(([a, b]) => new THREE.Vector2(a, b)), 14)), 0xfff6d8, bells);
    return B.finish();
  };
  // SW-29: the closed tent with its blue and white tarp drawn, the storage tent (plywood, scaffold poles, cartons, black bags,
  // chairs, a cooler, a wall fan), the sloped canopy frame at the corner over stacked tables, chairs and goods under black
  // tarps, and the four white stretch-covered cocktail tables on the line (641–660 s, 760–768 s)
  KIT.custom['SW-29'] = (e, depth) => {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B, tarp = 0x2f6fc0, clear = 0xdfeaf2;
    B.w = 7.0; B.tentRow(2, { eave: 2.5, ridge: 3.15 }); B.w = w;
    frontSheet(B, 0.05, 3.45, 0.04, 2.45, tarp); B.sheet(0.02, tarp); B.sheet(3.48, tarp);
    B.sheet(3.53, clear, { folds: 5, tied: true, depth: 1.0 });
    for (let k = 0; k < 4; k++) { const g = new THREE.BoxGeometry(1.2, 2.4, 0.02).rotateX(-0.12); B.add('goods', g, 0xc9a77a, B.P(3.9 + k * 0.32, 1.2, d - 0.35 - k * 0.05)); }
    for (let k = 0; k < 8; k++) B.rod('goods', B.P(6.55 + (k % 4) * 0.06, 0, d - 0.3 - Math.floor(k / 4) * 0.08), B.P(6.6 + (k % 4) * 0.05, 2.35, d - 0.45), 0.024, 0xc9ced3, 6);
    for (let k = 0; k < 7; k++) B.box('goods', 4.2 + (k % 3) * 0.48, 0.18 + Math.floor(k / 3) * 0.36, 2.8, 0.44, 0.34, 0.4, pick(r, [0xc9a77a, 0xd8c39a]));
    for (let k = 0; k < 4; k++) B.add('goods', new THREE.SphereGeometry(0.28, 10, 8).scale(1, 0.85, 1), 0x1b1b1b, B.P(5.6 + (k % 2) * 0.5, 0.24, 1.2 + Math.floor(k / 2) * 0.45));
    B.table(4.1, 3.9, 1.2, 0.65, 0.75, 0x8a6a4a); B.box('goods', 5.2, 0.2, 1.9, 0.6, 0.4, 0.42, 0x1e88e5); B.box('goods', 4.6, 0.08, 1.6, 0.8, 0.15, 0.6, tarp);
    for (let k = 0; k < 5; k++) B.box('furniture', 6.25, 0.46 + k * 0.05, 1.5, 0.45, 0.03, 0.45, 0x2b2b2b);
    B.add('furniture', new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16).rotateX(Math.PI / 2), 0xe8eef2, B.P(6.9, 2.15, d - 0.2));
    for (const lx of [1.7, 5.2]) B.box('furniture', lx, 2.42, d / 2, 1.2, 0.04, 0.06, 0xffffff);
    // the canopy frame at the corner, sloping down to the back, over the stacked tables and chairs and the black-tarped goods
    const c0 = 7.3, c1 = w - 0.2, f = 0xc9ced3;
    for (const lx of [c0, c1]) { B.rod('frame', B.P(lx, 0, 0.3), B.P(lx, 2.6, 0.3), 0.024, f); B.rod('frame', B.P(lx, 0, d - 0.3), B.P(lx, 2.2, d - 0.3), 0.024, f); B.rod('frame', B.P(lx, 2.6, 0.3), B.P(lx, 2.2, d - 0.3), 0.02, f); }
    for (const [lz, y] of [[0.3, 2.6], [d - 0.3, 2.2]]) B.rod('frame', B.P(c0, y, lz), B.P(c1, y, lz), 0.02, f);
    B.quad('canopy', B.P(c0, 2.62, 0.3), B.P(c1, 2.62, 0.3), B.P(c1, 2.22, d - 0.3), B.P(c0, 2.22, d - 0.3), 0xe8eef2);
    for (let k = 0; k < 6; k++) B.box('goods', 8.0 + (k % 3) * 0.9, 0.78 + Math.floor(k / 3) * 0.06, 2.9, 0.8, 0.04, 1.6, 0xd9d4ca);
    for (const lx of [8.0, 8.9, 9.8]) for (const lz of [2.2, 3.6]) B.rod('furniture', B.P(lx, 0, lz), B.P(lx, 0.76, lz), 0.014, 0x8a9096);
    for (let k = 0; k < 8; k++) B.box('furniture', 10.9, 0.46 + k * 0.05, 3.2, 0.45, 0.03, 0.45, 0x2b2b2b);
    for (let k = 0; k < 3; k++) B.add('goods', new THREE.SphereGeometry(0.5, 12, 8).scale(1, 0.75, 0.8), 0x1b1b1b, B.P(8.2 + k * 1.0, 0.36, d - 0.9));
    // the cocktail tables in a row on the line
    const shape = new THREE.LatheGeometry([[0, 0], [0.3, 0], [0.14, 0.55], [0.31, 1.06], [0.31, 1.1], [0, 1.1]].map(([a, b]) => new THREE.Vector2(a, b)), 20);
    for (let k = 0; k < 4; k++) B.add('furniture', shape.clone(), 0xf4f4f2, B.P(0.9 + k * 1.2, 0, 0.25));
    return B.finish();
  };
  // NE-22: by the IHC entrance, a clear-walled tent with a marigold festoon across its front and cartons, tinsel and red and orange
  // hangings inside; a closed white tent; a clear module with a few cartons (757–782 s)
  KIT.custom['NE-22'] = (e, depth) => {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id)), { w, d } = B, clear = 0xdfeaf2, beads = [];
    B.tentRow(3, { eave: 2.5, ridge: 3.15 });
    const m = w / 3;
    for (const k of [0, 2]) { frontSheet(B, k * m + 0.05, k * m + m - 0.05, 0.04, 2.45, clear, 7); B.sheet(k * m + 0.02, clear, { folds: 5 }); B.sheet(k * m + m - 0.02, clear, { folds: 5 }); }
    frontSheet(B, m + 0.05, 2 * m - 0.05, 0.04, 2.45, 0xf4f4f2, 5); B.sheet(m + 0.03, 0xf4f4f2, { folds: 4 }); B.sheet(2 * m - 0.03, 0xf4f4f2, { folds: 4 });
    for (let s = 0; s < 4; s++) {
      const a = 0.15 + s * ((m - 0.3) / 4), b = a + (m - 0.3) / 4;
      for (let t = 0; t <= 1.001; t += 0.035) { const p = B.P(a + (b - a) * t, 2.32 - 0.34 * 4 * t * (1 - t), -0.06); beads.push([p.x, p.y, p.z, t * 9, 1, Math.floor(t * 12) % 3 ? 0xf28a1a : 0xf7c51e]); }
      for (let k = 0; k < 12; k++) { const p = B.P(a, 2.3 - k * 0.042, -0.06); beads.push([p.x, p.y, p.z, k, 1, k % 4 ? 0xf28a1a : 0xf7c51e]); }
    }
    for (let k = 0; k < 6; k++) B.box('goods', 0.6 + (k % 3) * 0.55, 0.17 + Math.floor(k / 3) * 0.33, d - 0.6, 0.5, 0.32, 0.45, pick(r, [0xc9a77a, 0xd8c39a]));
    for (let k = 0; k < 9; k++) B.rod('goods', B.P(0.4 + k * 0.32, 2.3, 1.2 + (k % 3) * 0.5), B.P(0.42 + k * 0.32, 1.55 + r() * 0.3, 1.2 + (k % 3) * 0.5), 0.008, k % 2 ? 0xd9d9d9 : 0xe2b64a, 4);
    for (let k = 0; k < 3; k++) B.box('goods', 0.8 + k * 0.9, 1.95, d - 0.25, 0.45, 0.5, 0.02, k % 2 ? 0xe65100 : 0xc62828);
    for (let k = 0; k < 3; k++) B.box('goods', 2 * m + 0.5 + k * 0.6, 0.17, 1.4 + (k % 2) * 0.6, 0.5, 0.32, 0.45, 0xc9a77a);
    B.instanced('beads', hg('bead', () => new THREE.IcosahedronGeometry(0.035, 0)), 0xffffff, beads);
    return B.finish();
  };

  NAV.lane5 = {
    buildings: [176326803, 176326811, 176326807, 176326815, 176326823, 176326827],
    // the five-foot way's columns along 20 and 22, the one shared with 18 included (S7b leaves it to this stretch)
    columns: (x, z) => x > 90.2 && x < 103 && z > 6.8 && z < 8.1,
    build(root, grid) {
      const g = new THREE.Group(); g.name = 'lane5'; root.add(g);
      const kits = { row: [2001, row], 'SW-27': [2002, travel], 'NE-21': [2003, van], street: [2004, street], end: [2005, (K) => { madras(K); greenRow(K); ochreBuilding(K); }] };
      const parts = {};
      for (const [key, [seed, fn]] of Object.entries(kits)) {
        const K = new Kit(seed); fn(K, K.r);
        parts[key] = K.build(g, {}).map((m) => ({ m, role: 'look' }));
        for (const [x0, z0, x1, z1] of K.blocks) grid.fillRect(x0, z0, x1, z1);
        for (const pts of K.polys || []) grid.fillPolygon(pts);
      }
      // the lights: the travel agency's tubes; the lane's light on the row's upper floors; BAWA'S LED bells over the shopfronts;
      // across Clive Street, Madras Bakery's uplights, the row lit green, the ochre building over Chola Mart; the van under the IHC
      NAV.addLight([90.5, -0.5, 8.8], [95.8, 3.4, ROOM20], 0xf2f6ff, 1.05, 0.45);
      NAV.addLight([90.3, 3.5, 6.2], [104.3, 7.3, 7.9], 0xfff0d8, 0.5, 0.6);
      NAV.addLight([93.6, -0.5, 1.6], [98.3, 3.0, 9.3], 0xfff4e0, 0.6, 0.5);
      NAV.addLight([126.5, -0.5, -22], [137, 9.6, 1.6], 0xffcf88, 2.0, 0.8);
      NAV.addLight([131.5, -0.5, -4], [147, 8.0, 3.4], 0x9cff86, 0.9, 0.8);
      NAV.addLight([117, -0.5, 4.8], [132.5, 8.2, 13.5], 0xfff0d4, 1.05, 0.8);
      NAV.addLight([88.5, -0.5, -5.0], [108, 2.8, -1.2], 0xffe6c8, 0.35, 0.6);
      return {
        'SW-27': parts['SW-27'], 'NE-21': parts['NE-21'],
        box: { 'SW-27': new THREE.Box3(V(F20.x0, 0, at(F20, 1.8)), V(F20.x1, GF, ROOM20)) },
        pick: { 'NE-21': [new THREE.Box3(V(90.2, 0, -3.75), V(94.85, 2.0, -1.9))] },
      };
    },
  };
  NAV.detailed.push(NAV.lane5);
})();
