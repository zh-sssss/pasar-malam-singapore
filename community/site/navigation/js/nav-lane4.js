// S7b: the Indian Heritage Centre stretch, 64–90 m from Serangoon Road. Built from the frames at 433–600 s (out along
// the south-west side) and 755–890 s (back along the north-east side), and the stills of its entities.
// North-east: the Indian Heritage Centre. Its four storeys show the lane a glass wall behind a dark steel lattice of
// stretched hexagons, the galleries' murals and stairs lit warm behind the glass and purple light along the lattice. The
// upper floors overhang a dark ground floor: banners and a stone ledge where people sit, a painted wall of palace arches
// behind a long bench, and at the Clive Street corner the entrance with its carved timber door, screens and steps. Its
// tents (henna, statues and fountains, AJMIR STORE) stand under the overhang as holograms, rebuilt here from their stills.
// South-west: 10–18 Campbell Lane, the Little India Arcade's white shophouses with red windows and shutters; the
// Arcade's reception behind its red doors; wood-inlay pictures and brass camels; Celebration of Arts and its tables of
// textiles under bags and lanterns; the festival stalls of LED diya lamps and décor. Where things stand is read from the
// frames; signs carry only the words the video shows.
(function () {
  const NAV = window.NAV, THREE = window.THREE, KIT = NAV.kit;
  // the wood-inlay display stands under the tent row in the frames (S0 filed it under the five-foot way)
  NAV.tentFor.add('SW-22');
  const { Kit, pick, ATLASES, N, WOOD, BRASS, garlandRail, addGeo } = NAV.shopKit;
  const { GF, REC, at, V, board, canvasTex, glass, fiveFootWay, upper, window2, WHITE, TRIM, RED, fam } = NAV.blockKit;
  const { room, sideShelves, patch, seq } = NAV.laneKit;
  const STEEL_D = 0x2b2d33, GRANITE = 0x3d3b3f, STONE = 0x8d8a86, MASS = 0x2c2d34, DARKRED = 0x8e1f22;

  // ---- the Indian Heritage Centre's footprint (OSM 176326997): its lane face runs A–B, its Clive Street corner B–C–D -----
  const FOOT = [[67.89, -13.02], [67.25, -5.44], [111.16, -3.9], [114.11, -5.97], [123.63, -37.43], [85.73, -17.03]];
  const SOFFIT = 4.8, TOP = 20.4, ZG = -7.6;                 // the overhang's underside, the roof, the ground floor's face
  const GROUND = [[67.89, -13.02], [67.43, ZG], [114.6, ZG], [123.63, -37.43], [85.73, -17.03]];
  const front = (x) => -5.44 + ((x - 67.25) / 43.91) * 1.54;  // z of the lane face at x
  // the Little India Arcade's houses along the lane: OSM id, x0, x1, frontage z, back z
  const ARCADE = [[176326698, 65.61, 70.57, 6.84, 25.9], [176326731, 70.57, 75.72, 6.88, 25.99], [176326759, 75.72, 80.88, 6.93, 26.03],
    [176326784, 80.88, 85.44, 6.96, 26.07], [176326792, 85.44, 90.42, 7.01, 26.11]];

  const nonIdx = (g) => (g.index ? g.toNonIndexed() : g);
  const mergeG = (list) => THREE.BufferGeometryUtils.mergeGeometries(list.map(nonIdx));
  const V2 = (x, y) => new THREE.Vector2(x, y);
  // a footprint ([x, z] points) as a solid from y0 to y1
  const extrude = (pts, y0, y1) => new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, z]) => V2(x, -z))), { depth: y1 - y0, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, y0, 0);
  // a polygon with some of its edges moved inwards by ds[k] (edge k runs from point k to point k + 1)
  function inset(pts, ds) {
    const n = pts.length, L = pts.map((p, k) => { const q = pts[(k + 1) % n], dx = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dx, dz); return { px: p[0] + (dz / len) * ds[k], pz: p[1] - (dx / len) * ds[k], dx, dz }; });
    return pts.map((_, i) => {
      const a = L[(i - 1 + n) % n], b = L[i], den = a.dx * b.dz - a.dz * b.dx;
      if (Math.abs(den) < 1e-9) return [b.px, b.pz];
      const t = ((b.px - a.px) * b.dz - (b.pz - a.pz) * b.dx) / den;
      return [a.px + a.dx * t, a.pz + a.dz * t];
    });
  }

  // ---- shapes of this stretch's goods (instanced, unit size) ---------------------------------------------------------
  // a seated deity figurine: plinth, crossed legs, body, head and crown, a flat halo behind (1.1 m tall at scale 1)
  addGeo('s7b-figure', () => mergeG([new THREE.CylinderGeometry(0.42, 0.48, 0.12, 10).translate(0, 0.06, 0), new THREE.SphereGeometry(0.42, 8, 4).scale(1, 0.42, 0.76).translate(0, 0.22, 0.04),
    new THREE.CylinderGeometry(0.15, 0.22, 0.42, 8).translate(0, 0.5, 0), new THREE.SphereGeometry(0.13, 6, 4).translate(0, 0.82, 0), new THREE.ConeGeometry(0.1, 0.18, 6).translate(0, 1.0, 0),
    new THREE.CylinderGeometry(0.32, 0.32, 0.03, 12).rotateX(Math.PI / 2).translate(0, 0.78, -0.17)]));
  // a seated brass camel: body, hump, neck and head, folded legs (1 m long at scale 1)
  addGeo('s7b-camel', () => mergeG([new THREE.SphereGeometry(0.5, 14, 10).scale(1, 0.55, 0.45).translate(0, 0.42, 0), new THREE.SphereGeometry(0.22, 12, 8).scale(1, 0.9, 0.9).translate(-0.05, 0.72, 0),
    new THREE.CylinderGeometry(0.07, 0.1, 0.55, 10).rotateZ(-0.5).translate(0.5, 0.72, 0), new THREE.SphereGeometry(0.11, 10, 8).scale(1.5, 0.8, 0.8).translate(0.68, 0.98, 0),
    new THREE.BoxGeometry(0.9, 0.16, 0.42).translate(0, 0.08, 0)]));
  // a standing brass elephant: body, head, ears, trunk, legs (0.9 m long at scale 1)
  addGeo('s7b-elephant', () => mergeG([new THREE.SphereGeometry(0.42, 14, 10).scale(1.1, 0.75, 0.7).translate(0, 0.62, 0), new THREE.SphereGeometry(0.22, 12, 8).translate(0.48, 0.72, 0),
    new THREE.CylinderGeometry(0.045, 0.08, 0.5, 8).rotateZ(-0.25).translate(0.62, 0.45, 0),
    ...[[-0.25, -0.15], [-0.25, 0.15], [0.25, -0.15], [0.25, 0.15]].map(([x, z]) => new THREE.CylinderGeometry(0.08, 0.09, 0.4, 8).translate(x, 0.2, z)),
    ...[-1, 1].map((s) => new THREE.SphereGeometry(0.16, 8, 6).scale(0.3, 1, 1).translate(0.42, 0.78, s * 0.2))]));
  // a cloth bag with its strap (0.8 m wide at scale 1)
  addGeo('s7b-bag', () => mergeG([new THREE.BoxGeometry(0.8, 0.7, 0.12).translate(0, 0.35, 0), new THREE.TorusGeometry(0.28, 0.025, 6, 16, Math.PI).translate(0, 0.7, 0)]));
  // a paper or cloth lantern: two cones base to base, a tassel under it (0.9 m tall at scale 1)
  addGeo('s7b-lantern', () => mergeG([new THREE.ConeGeometry(0.4, 0.45, 8).rotateX(Math.PI).translate(0, -0.22, 0), new THREE.ConeGeometry(0.4, 0.45, 8).translate(0, 0.22, 0),
    new THREE.CylinderGeometry(0.03, 0.06, 0.3, 6).translate(0, -0.6, 0)]));

  // ---- printed things --------------------------------------------------------------------------------------------------
  // wood-inlay pictures: a figure in pale woods under an arch on a dark ground, framed, as on the five-foot way (faceless)
  function inlayAtlas() {
    if (inlayAtlas.t) return inlayAtlas.t;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const g = cv.getContext('2d'), s = 1024 / N, R = seq(4711);
    for (let row = 0; row < N; row++) for (let i = 0; i < N; i++) {
      const x = i * s, y = row * s, cx = x + s / 2;
      g.fillStyle = '#3b2414'; g.fillRect(x, y, s, s);
      g.fillStyle = '#5a3519'; g.fillRect(x + 8, y + 8, s - 16, s - 16);
      g.strokeStyle = 'rgba(30,15,5,0.35)'; g.lineWidth = 1; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(x + 8, y + 12 + k * 13); g.bezierCurveTo(x + 40, y + 6 + k * 13, x + 80, y + 20 + k * 13, x + s - 8, y + 10 + k * 13); g.stroke(); }
      g.fillStyle = '#d9a868'; g.strokeStyle = '#d9a868'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + 22, y + s - 18); g.lineTo(x + 22, y + 46); g.quadraticCurveTo(cx, y + 6, x + s - 22, y + 46); g.lineTo(x + s - 22, y + s - 18); g.stroke();   // the arch
      g.beginPath(); g.arc(cx, y + 48, 14, 0, Math.PI * 2); g.stroke();                                                                    // the halo
      g.beginPath(); g.ellipse(cx, y + 50, 7, 8, 0, 0, Math.PI * 2); g.fill();                                                              // the head
      if (R() < 0.5) { g.beginPath(); g.moveTo(cx - 22, y + 100); g.quadraticCurveTo(cx, y + 54, cx + 22, y + 100); g.fill(); }              // seated
      else { g.beginPath(); g.moveTo(cx - 11, y + 108); g.lineTo(cx - 8, y + 60); g.lineTo(cx + 8, y + 60); g.lineTo(cx + 11, y + 108); g.fill(); g.fillRect(cx - 24, y + 66, 48, 5); }   // standing, arms out
      g.fillStyle = '#e8c27a'; for (let p = 0; p < 5; p++) { g.beginPath(); g.ellipse(cx - 20 + p * 10, y + s - 20, 5, 3, 0, 0, Math.PI * 2); g.fill(); }                        // a lotus at the foot
    }
    const t = (inlayAtlas.t = new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  ATLASES['s7b-inlay'] = inlayAtlas;
  const inlay = (r) => [Math.floor(r() * N), Math.floor(r() * N), 's7b-inlay'];

  // the galleries seen through the IHC's glass at night: warm murals and framed works floor by floor, stairs rising
  function galleryMat() {
    if (galleryMat.m) return galleryMat.m;
    const tex = canvasTex(2048, 720, (g, w, h) => {
      const R = seq(1101), pk = (a) => a[Math.floor(R() * a.length)], fh = h / 3;
      g.fillStyle = '#1d0d0a'; g.fillRect(0, 0, w, h);
      for (let f = 0; f < 3; f++) {
        const top = f * fh;
        for (let x = 0; x < w;) {
          const pw = 70 + R() * 150;
          g.fillStyle = pk(['#8e1b12', '#b5361c', '#d35400', '#a8431d', '#7a1730', '#c0392b', '#5b1f14', '#0f5c5c']); g.fillRect(x, top + fh * 0.12, pw - 4, fh * 0.78);
          const gr = g.createLinearGradient(0, top + fh * 0.12, 0, top + fh * 0.55); gr.addColorStop(0, 'rgba(255,220,150,0.5)'); gr.addColorStop(1, 'rgba(255,220,150,0)');
          g.fillStyle = gr; g.fillRect(x, top + fh * 0.12, pw - 4, fh * 0.43);
          const k = R();
          if (k < 0.35) {
            const ax = x + pw / 2, ay = top + fh * 0.55, aw = pw * 0.32, ah = fh * 0.3;
            g.strokeStyle = '#f2c14e'; g.lineWidth = 4; g.beginPath(); g.moveTo(ax - aw, ay + ah); g.lineTo(ax - aw, ay); g.quadraticCurveTo(ax, ay - ah * 1.2, ax + aw, ay); g.lineTo(ax + aw, ay + ah); g.stroke();
          } else if (k < 0.7) {
            for (let j = 0; j < 2; j++) { g.fillStyle = '#e8c27a'; g.fillRect(x + 10 + (j * pw) / 2, top + fh * 0.32, pw / 2 - 20, fh * 0.32); g.fillStyle = pk(['#3a2a20', '#6b3a1e', '#1f3b57', '#2e5e3a']); g.fillRect(x + 14 + (j * pw) / 2, top + fh * 0.32 + 4, pw / 2 - 28, fh * 0.32 - 8); }
          } else {
            g.fillStyle = 'rgba(255,214,120,0.6)'; for (let m = 0; m < 6; m++) { g.beginPath(); g.arc(x + 15 + R() * (pw - 30), top + fh * (0.3 + R() * 0.45), 6 + R() * 10, 0, Math.PI * 2); g.fill(); }
          }
          x += pw;
        }
        g.fillStyle = '#120807'; g.fillRect(0, top, w, fh * 0.1);
        g.fillStyle = '#fff2c8'; for (let x = 20; x < w; x += 48) g.fillRect(x, top + fh * 0.1, 8, 4);
      }
      for (const sx of [380, 1220, 1760]) {
        g.strokeStyle = '#2b2b2b'; g.lineWidth = 26; g.beginPath(); g.moveTo(sx, h * 0.95); g.lineTo(sx + 320, h * 0.4); g.stroke();
        g.strokeStyle = '#e8e8e8'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, h * 0.9); g.lineTo(sx + 320, h * 0.35); g.stroke();
        for (let s = 0; s < 14; s++) { g.fillStyle = '#555555'; g.fillRect(sx + s * 22.8, h * 0.95 - (s * h * 0.55) / 14 - 3, 22, 3); }
      }
    });
    tex.wrapS = THREE.RepeatWrapping;
    const m = (galleryMat.m = NAV.toon(0xffffff, { map: tex, emissive: 0xffffff, emissiveIntensity: 0.85, ink: false, unique: true })); m.emissiveMap = tex;
    return m;
  }
  // the painted wall under the overhang: palace arches in gold under green domes, curtains drawn aside, lotuses at the foot
  const archMural = () => canvasTex(2048, 512, (g, w, h) => {
    g.fillStyle = '#d81b7a'; g.fillRect(0, 0, w, h);
    const n = 6, aw = w / n;
    for (let k = 0; k < n; k++) {
      const x = k * aw, cx = x + aw / 2;
      g.fillStyle = '#2e9a4a'; g.beginPath(); g.moveTo(cx - aw * 0.22, h * 0.2); g.quadraticCurveTo(cx - aw * 0.24, h * 0.02, cx, 0); g.quadraticCurveTo(cx + aw * 0.24, h * 0.02, cx + aw * 0.22, h * 0.2); g.fill();
      g.fillStyle = '#f2c230'; g.fillRect(x + aw * 0.06, h * 0.2, aw * 0.88, h * 0.72);
      g.fillStyle = '#1b2a6b'; g.beginPath(); g.moveTo(x + aw * 0.14, h * 0.92); g.lineTo(x + aw * 0.14, h * 0.42); g.quadraticCurveTo(cx, h * 0.18, x + aw * 0.86, h * 0.42); g.lineTo(x + aw * 0.86, h * 0.92); g.fill();
      g.fillStyle = '#f6d84a'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * aw * 0.36, h * 0.36); g.quadraticCurveTo(cx + s * aw * 0.2, h * 0.5, cx + s * aw * 0.3, h * 0.9); g.lineTo(cx + s * aw * 0.36, h * 0.9); g.fill(); }
      g.fillStyle = '#ff7ab6'; for (let p = 0; p < 5; p++) { g.beginPath(); g.ellipse(cx - aw * 0.1 + p * aw * 0.05, h * 0.86, aw * 0.025, h * 0.05, (p - 2) * 0.35, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#e8b62a'; g.fillRect(x, h * 0.2, aw * 0.06, h * 0.72);
      g.fillStyle = '#2e9a4a'; g.fillRect(x, h * 0.18, aw * 0.06, h * 0.04);
    }
    g.fillStyle = '#1f7a3a'; g.fillRect(0, h * 0.92, w, h * 0.08);
  });
  // the galleries' banner on the ground floor: the words the video shows, the anniversary mark, an artefact
  const milestoneTex = () => canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#4b2a72'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.fillRect(w * 0.06, h * 0.04, w * 0.24, h * 0.16); g.fillStyle = '#4b2a72'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${h * 0.05}px ${fam}`; g.fillText('10', w * 0.18, h * 0.08); g.font = `600 ${h * 0.022}px ${fam}`; g.fillText('YEARS', w * 0.18, h * 0.115); g.font = `700 ${h * 0.045}px ${fam}`; g.fillText('60', w * 0.18, h * 0.165);
    g.fillStyle = '#f2c86a'; g.textAlign = 'left'; g.font = `italic 700 ${h * 0.07}px Georgia, serif`; g.fillText('Milestone', w * 0.08, h * 0.3);
    g.font = `700 ${h * 0.06}px Georgia, serif`; g.fillText('Rotation at Our', w * 0.08, h * 0.38); g.fillText('Permanent Galleries', w * 0.08, h * 0.45);
    g.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 3; k++) g.fillRect(w * 0.08, h * (0.51 + k * 0.03), w * (0.7 - k * 0.12), h * 0.012);
    g.fillStyle = '#d9a441'; g.beginPath(); g.arc(w * 0.6, h * 0.76, w * 0.17, 0, Math.PI * 2); g.fill(); g.fillStyle = '#b8862e'; g.beginPath(); g.arc(w * 0.6, h * 0.76, w * 0.12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8c27a'; g.fillRect(w * 0.2, h * 0.7, w * 0.05, h * 0.2); g.beginPath(); g.ellipse(w * 0.225, h * 0.68, w * 0.08, h * 0.03, 0, 0, Math.PI * 2); g.fill();
  });
  // its neighbour: an artefact framed in orange and lines of text too small to read in the video
  const galleriesTex = () => canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#4b2a72'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8732a'; g.fillRect(w * 0.18, h * 0.12, w * 0.64, h * 0.5); g.fillStyle = '#7a2a12'; g.fillRect(w * 0.23, h * 0.16, w * 0.54, h * 0.42);
    g.strokeStyle = '#f2c86a'; g.lineWidth = 6; g.beginPath(); g.arc(w * 0.5, h * 0.33, w * 0.14, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#f2e6c8'; g.beginPath(); g.moveTo(w * 0.36, h * 0.55); g.quadraticCurveTo(w * 0.5, h * 0.36, w * 0.64, h * 0.55); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 5; k++) g.fillRect(w * 0.1, h * (0.7 + k * 0.045), w * (0.8 - (k % 2) * 0.2), h * 0.014);
  });
  // the carved timber door: square panels with rosettes in a heavy frame, studded
  const doorTex = () => canvasTex(512, 768, (g, w, h) => {
    g.fillStyle = '#5a2414'; g.fillRect(0, 0, w, h);
    const cols = 4, rows = 7, cw = (w - 40) / cols, ch = (h - 40) / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = 20 + i * cw, y = 20 + j * ch;
      g.fillStyle = '#8a3a1e'; g.fillRect(x + 6, y + 6, cw - 12, ch - 12); g.fillStyle = '#6e2c16'; g.fillRect(x + 14, y + 14, cw - 28, ch - 28);
      g.fillStyle = '#b05a2e'; for (let p = 0; p < 8; p++) { const a = (p / 8) * Math.PI * 2; g.beginPath(); g.ellipse(x + cw / 2 + Math.cos(a) * 16, y + ch / 2 + Math.sin(a) * 16, 9, 4, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#d9a441'; g.beginPath(); g.arc(x + cw / 2, y + ch / 2, 6, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#d9a441'; for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { g.beginPath(); g.arc(20 + i * cw, 20 + j * ch, 4, 0, Math.PI * 2); g.fill(); }
  });
  // the plinth by the entrance: the centre's mark and its name in its four languages
  const logoTex = () => canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#1c1c1f'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(w * 0.5 + (i - j) * 13, h * 0.12 + (i + j) * 7, 4, 0, Math.PI * 2); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${w * 0.1}px ${fam}`; ['INDIAN', 'HERITAGE', 'CENTRE'].forEach((t, k) => g.fillText(t, w / 2, h * (0.3 + k * 0.06)));
    g.font = `600 ${w * 0.075}px ${fam}`; g.fillText('இந்திய மரபுடைமை', w / 2, h * 0.52); g.fillText('நிலையம்', w / 2, h * 0.57);
    g.font = `600 ${w * 0.09}px ${fam}`; g.fillText('印度文化馆', w / 2, h * 0.65);
    g.font = `600 ${w * 0.075}px ${fam}`; g.fillText('Pusat Warisan India', w / 2, h * 0.72);
  });
  const screenTex = () => canvasTex(256, 448, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#dfe9f5'); gr.addColorStop(1, '#b9cbe2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4b2a72'; g.fillRect(0, 0, w, h * 0.12); g.fillStyle = '#7a8aa6'; for (let k = 0; k < 9; k++) g.fillRect(w * 0.1, h * (0.2 + k * 0.07), w * (0.8 - (k % 3) * 0.15), h * 0.02);
  });
  // a sign fin: its words running down it, white on near-black
  const finTex = (text, font) => canvasTex(256, 2048, (g, w, h) => {
    g.fillStyle = '#16161a'; g.fillRect(0, 0, w, h); g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 2);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = 150; g.font = `700 ${px}px ${font}`; while (g.measureText(text).width > h * 0.9 && px > 20) { px -= 4; g.font = `700 ${px}px ${font}`; }
    g.fillText(text, 0, 0); g.restore();
  });
  // the stone at the corner: warm beige, grooved in long waves
  const grooveTex = () => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#c9b08a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,70,45,0.55)'; g.lineWidth = 3;
    for (let y = 10; y < h; y += 18) { g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + y * 0.1) * 4); g.stroke(); }
  });
  const receptionTex = () => canvasTex(512, 192, (g, w, h) => {
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4ead8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${h * 0.34}px Georgia, serif`; g.fillText('RECEPTION', w / 2, h * 0.34); g.font = `600 ${h * 0.26}px ${fam}`; g.fillText('வரவேற்பு', w / 2, h * 0.74);
  });
  const textTex = (text, bg, ink, font, w = 1024, h = 160) => canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = Math.round(h * 0.6); g.font = `700 ${px}px ${font}`; while (g.measureText(text).width > w * 0.9 && px > 10) { px -= 2; g.font = `700 ${px}px ${font}`; }
    g.fillText(text, w / 2, h * 0.54);
  });

  // ---- the IHC's facades -------------------------------------------------------------------------------------------------
  // a frame on a facade from a to b ([x, z]): x along it, y up, z out of it
  function faceFrame(a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    return { len, M: new THREE.Matrix4().makeBasis(new THREE.Vector3(ux, 0, uz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-uz, 0, ux)).setPosition(a[0], 0, a[1]) };
  }
  // one face: the glass with the galleries behind it, the lattice of stretched hexagons in front, purple light along some
  // of its members (collected in leds), a dark band at its foot and the parapet at its head
  function latticeFace(K, a, b, y0, y1, leds, uOff = 0) {
    const F = faceFrame(a, b), M = F.M, W = 2.6, FL = 1.3, H = 1.3, dx = (W + FL) / 2, seen = new Set();
    const gl = new THREE.PlaneGeometry(F.len - 0.1, y1 - y0 - 0.2).translate(F.len / 2, (y0 + y1) / 2, -0.66), uv = gl.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setX(k, uOff + (uv.getX(k) * F.len) / 43.94);
    K.extra.push(new THREE.Mesh(gl.applyMatrix4(M), galleryMat()));
    const member = (ax, ay, bx, by) => {
      const key = [ax, ay, bx, by].map((v) => Math.round(v * 100)).join(','), rev = [bx, by, ax, ay].map((v) => Math.round(v * 100)).join(',');
      if (seen.has(key) || seen.has(rev)) return;
      seen.add(key);
      if (Math.min(ax, bx) < -0.01 || Math.max(ax, bx) > F.len + 0.01 || Math.min(ay, by) < y0 - 0.01 || Math.max(ay, by) > y1 + 0.01) return;
      const len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax), mx = (ax + bx) / 2, my = (ay + by) / 2;
      K.add(new THREE.BoxGeometry(len + 0.1, 0.11, 0.3).rotateZ(ang).translate(mx, my, -0.45).applyMatrix4(M), STEEL_D);
      if (ay !== by && (Math.round(mx * 3) + Math.round(my * 3)) % 3 === 0) leds.push(new THREE.BoxGeometry(len * 0.8, 0.045, 0.035).rotateZ(ang).translate(mx, my, -0.29).applyMatrix4(M));
    };
    for (let c = 0; c * dx < F.len + W; c++) for (let r = -1; y0 + r * H < y1 + H; r++) {
      const cx = c * dx, cy = y0 + r * H + (c % 2 ? H / 2 : 0);
      const P = [[cx - W / 2, cy], [cx - FL / 2, cy + H / 2], [cx + FL / 2, cy + H / 2], [cx + W / 2, cy], [cx + FL / 2, cy - H / 2], [cx - FL / 2, cy - H / 2]];
      for (let k = 0; k < 6; k++) member(...P[k], ...P[(k + 1) % 6]);
    }
    K.add(new THREE.BoxGeometry(F.len, 0.55, 0.78).translate(F.len / 2, y0 - 0.1, -0.36).applyMatrix4(M), STEEL_D);
    K.add(new THREE.BoxGeometry(F.len, 0.45, 0.78).translate(F.len / 2, y1 + 0.1, -0.36).applyMatrix4(M), STEEL_D);
    for (const u of [0.06, F.len - 0.06]) K.add(new THREE.BoxGeometry(0.14, y1 - y0, 0.3).translate(u, (y0 + y1) / 2, -0.45).applyMatrix4(M), STEEL_D);
    return F;
  }
  // a sign fin standing out of face F at u, its words down both sides
  function fin(K, F, u, y0, y1, text, font) {
    const tex = finTex(text, font), mat = NAV.toon(0xffffff, { map: tex, emissive: 0xffffff, emissiveIntensity: 0.55, unique: true }), h = y1 - y0, out = 1.25;
    mat.emissiveMap = tex;
    K.add(new THREE.BoxGeometry(0.12, h, out).translate(u, (y0 + y1) / 2, out / 2 - 0.62).applyMatrix4(F.M), 0x16161a);
    for (const s of [-1, 1]) K.extra.push(new THREE.Mesh(new THREE.PlaneGeometry(out - 0.08, h - 0.1).rotateY((s * Math.PI) / 2).translate(u + s * 0.065, (y0 + y1) / 2, out / 2 - 0.62).applyMatrix4(F.M), mat));
  }
  // a steel strut holding the overhang, from the ground by the wall up and out to the soffit's edge
  function strut(K, x) {
    K.rod(V(x, 0, ZG + 0.75), V(x + 0.9, SOFFIT, front(x + 0.9) - 0.95), 0.12, STEEL_D, 10);
    K.box(x - 0.2, x + 0.2, 0, 0.06, ZG + 0.55, ZG + 0.95, STEEL_D);
    K.block(x - 0.2, ZG + 0.55, x + 0.2, ZG + 0.95);
  }
  function ihc(K, r) {
    // the massing: the upper floors behind the lattice, the ground floor set back under them
    const UPPER = inset(FOOT, [0, 0.7, 0.7, 0.7, 0, 0]);
    K.add(extrude(UPPER, SOFFIT, TOP), MASS);
    K.add(extrude(GROUND, 0, SOFFIT), GRANITE);
    K.blockPoly(GROUND);
    const leds = [], A = FOOT[1], B = FOOT[2], C = FOOT[3], D = FOOT[4];
    const lane = latticeFace(K, A, B, SOFFIT, TOP, leds);
    latticeFace(K, B, C, SOFFIT, TOP, leds, 0.3); latticeFace(K, C, D, SOFFIT, TOP, leds, 0.55);
    const glow = NAV.toon(0xc58cff, { emissive: 0xa64dff, emissiveIntensity: 1, ink: false, unique: true });
    K.extra.push(new THREE.Mesh(mergeG(leds), glow));
    // its names on fins: Tamil at the west corner, English down the middle of the lane side (both read in the video)
    fin(K, lane, 0.35, 6.2, 17.6, 'இந்திய மரபுடைமை நிலையம்', fam);
    fin(K, lane, 12.25, 6.0, 17.0, 'INDIAN HERITAGE CENTRE', fam);
    // downlights in the soffit along the overhang
    const lamp = NAV.toon(0xfff2d0, { emissive: 0xfff0c8, emissiveIntensity: 1, ink: false });
    for (let x = 68.2; x < 113.5; x += 2.4) for (const t of [0.3, 0.75]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 14), lamp); m.position.set(x, SOFFIT - 0.02, ZG + (front(x) - 0.7 - ZG) * t); K.extra.push(m); }
    const face = ZG + 0.02;
    // the ground floor's west part: dark granite, the galleries' banners, a stone ledge people sit on, struts
    board(K, milestoneTex(), 2.2, 2.75, V(69.4, 2.3, face), 0, 0.45);
    board(K, galleriesTex(), 2.2, 2.75, V(72.1, 2.3, face), 0, 0.45);
    K.box(67.6, 82.6, 0, 0.45, ZG, ZG + 0.55, STONE, 0.02); K.block(67.6, ZG, 82.6, ZG + 0.6);
    for (const x of [68.6, 81.9, 98.6]) strut(K, x);
    // the painted wall of palace arches and the long bench before it
    board(K, archMural(), 18.4, 4.5, V(88.3, 2.3, face), 0, 0.5);
    K.box(82.6, 97.2, 0, 0.4, ZG, ZG + 0.6, STONE, 0.02); K.box(82.6, 97.2, 0.4, 0.47, ZG, ZG + 0.62, 0x2e8b57, 0.02);
    K.block(82.6, ZG, 97.2, ZG + 0.65);
    // the entrance at the Clive Street corner: two screens, the plinth with its name, the carved door up three steps,
    // a warm beige wall grooved in waves at the corner
    for (const x of [101.1, 102.4]) board(K, screenTex(), 1.0, 1.75, V(x, 1.85, face), 0, 0.85);
    K.box(103.7, 104.7, 0, 1.95, ZG + 0.35, ZG + 0.6, 0x1c1c1f); board(K, logoTex(), 0.9, 1.8, V(104.2, 1.0, ZG + 0.61), 0, 0.45);
    K.block(103.65, ZG + 0.3, 104.75, ZG + 0.65);
    K.box(105.1, 109.1, 0.45, 4.75, ZG, ZG + 0.22, 0x232326); board(K, doorTex(), 3.0, 4.0, V(107.1, 2.47, ZG + 0.23), 0, 0.3);
    for (let k = 0; k < 3; k++) K.box(104.9, 114.55, k * 0.15, (k + 1) * 0.15, ZG, ZG + 0.6 - k * 0.2, 0x9d9a95);
    for (const x of [105.0, 110.4]) { K.rod(V(x, 0, ZG + 0.55), V(x, 0.95, ZG + 0.55), 0.02, 0xd5dbe2, 8); K.rod(V(x, 0.95, ZG + 0.55), V(x, 1.25, ZG + 0.15), 0.02, 0xd5dbe2, 8); }
    K.block(104.85, ZG, 114.6, ZG + 0.65);
    board(K, grooveTex(), 5.1, 4.6, V(112.05, 2.3, face + 0.01), 0, 0.25);
    // the gap to its west: a gate across the passage beside FAIR Value (the passage beyond it is not in the video)
    for (let x = 63.9; x < 67.5; x += 0.13) K.box(x - 0.015, x + 0.015, 0, 2.2, -11.62, -11.58, 0x34363c);
    K.box(63.85, 67.5, 2.15, 2.25, -11.64, -11.56, 0x34363c); K.box(63.85, 67.5, 1.0, 1.06, -11.64, -11.56, 0x34363c);
    K.block(63.8, -11.7, 67.5, -11.5);
  }

  // ---- 10–18 Campbell Lane: the Little India Arcade's houses ------------------------------------------------------------
  // one leaf of red louvred doors, as the Arcade's shops close
  function leaf(K, xa, xb, zs) {
    K.box(xa, xb, 0.03, 2.2, zs - 0.035, zs, RED);
    for (let y = 0.2; y < 2.05; y += 0.085) K.box(xa + 0.05, xb - 0.05, y, y + 0.03, zs - 0.055, zs - 0.035, DARKRED);
  }
  // the transom over a shopfront: a red frame of white lattice
  function transom(K, a, b, y0, y1, zs) {
    K.box(a, b, y0, y1, zs - 0.03, zs, RED);
    const n = Math.max(2, Math.round((b - a) / 0.45)), cw = (b - a) / n, h = y1 - y0 - 0.08;
    for (let k = 0; k < n; k++) for (const s of [-1, 1]) K.add(new THREE.BoxGeometry(Math.hypot(cw, h), 0.035, 0.02).rotateZ(s * Math.atan2(h, cw)).translate(a + (k + 0.5) * cw, (y0 + y1) / 2, zs - 0.04), 0xf4f1ea);
  }
  // a closed shopfront: louvred leaves between white piers, the transom over them
  function louvred(K, x0, x1, zs) {
    K.box(x0, x1, 0, GF, zs, zs + 0.25, WHITE);
    K.box(x0, x0 + 0.3, 0, GF, zs - 0.05, zs + 0.2, TRIM); K.box(x1 - 0.3, x1, 0, GF, zs - 0.05, zs + 0.2, TRIM); K.box(x0, x1, 2.72, GF, zs - 0.05, zs + 0.2, TRIM);
    const a = x0 + 0.3, b = x1 - 0.3, n = Math.max(2, Math.round((b - a) / 0.55)), lw = (b - a) / n;
    for (let k = 0; k < n; k++) leaf(K, a + k * lw + 0.015, a + (k + 1) * lw - 0.015, zs);
    transom(K, a, b, 2.2, 2.72, zs);
    K.block(x0, zs - 0.08, x1, zs + 0.25);
  }
  function arcade(K, r) {
    for (const [, x0, x1, zf, zb] of ARCADE) {
      const fr = { x0, x1, zf, s: 1 }, w = x1 - x0;
      upper(K, fr, zb, 7.0, WHITE, 0xa54b3a);
      K.box(x0, x1, 6.95, 7.06, zf - 0.09, zf, RED);                                       // red band under the cornice
      K.box(x0 - 0.13, x0 + 0.13, GF + 0.32, 6.95, zf - 0.06, zf + 0.02, TRIM);            // the pilaster between houses
      for (const t of [0.27, 0.73]) window2(K, fr, x0 + w * t, RED, 0x9c2f2a, r() < 0.3, 0.9, 4.25, 6.05);
      // the red vent over the windows, a white roundel in it
      K.box(x0 + w / 2 - 0.24, x0 + w / 2 + 0.24, 6.22, 6.7, zf - 0.05, zf + 0.01, RED);
      K.add(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 20).rotateX(Math.PI / 2).translate(x0 + w / 2, 6.46, zf - 0.065), 0xf4f1ea);
      fiveFootWay(K, fr, [x0], 0xeeeae2);
    }
    // the shopfronts that stay closed: 10, most of 12 and 14, 16 (the reception and Celebration of Arts build their own)
    louvred(K, 65.61, 70.57, at({ zf: 6.84, s: 1 }, REC)); louvred(K, 70.57, 74.5, at({ zf: 6.88, s: 1 }, REC));
    louvred(K, 77.0, 80.88, at({ zf: 6.93, s: 1 }, REC)); louvred(K, 80.88, 85.44, at({ zf: 6.96, s: 1 }, REC));
  }

  // ---- the Arcade's reception (SW-21) -----------------------------------------------------------------------------------
  function reception(K, r) {
    const fr = { x0: 74.5, x1: 77.0, zf: 6.9, s: 1 }, R0 = room(K, fr, 74.5, 77.0, 13.2, { floor: 0xd9d4ca, tubes: 1 }), zs = R0.zs;
    // red louvred doors on the left, a red-framed glazed pair on the right, the lattice transom over both
    leaf(K, 74.82, 75.2, zs); leaf(K, 75.22, 75.6, zs);
    for (const [a, b] of [[75.65, 76.17], [76.19, 76.7]]) {
      for (const [xa, xb] of [[a, a + 0.07], [b - 0.07, b]]) K.box(xa, xb, 0.03, 2.2, zs - 0.06, zs - 0.01, RED);
      K.box(a, b, 0.03, 0.12, zs - 0.06, zs - 0.01, RED); K.box(a, b, 2.12, 2.2, zs - 0.06, zs - 0.01, RED);
      for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(b - a - 0.14, 0.58), glass()); p.position.set((a + b) / 2, 0.42 + k * 0.66, zs - 0.045); p.rotation.y = Math.PI; K.extra.push(p); }
      for (let k = 1; k < 3; k++) K.box(a + 0.05, b - 0.05, 0.08 + k * 0.66, 0.13 + k * 0.66, zs - 0.06, zs - 0.04, RED);
    }
    transom(K, 74.82, 76.7, 2.2, 2.72, zs);
    // its sign over the glazed doors, a lamp over that, the fire bell and a camera on the beam
    board(K, receptionTex(), 0.9, 0.34, V(76.18, 2.47, zs - 0.07), Math.PI, 0.45);
    K.box(76.12, 76.24, 2.85, 3.05, zs - 0.18, zs - 0.06, 0x2b2b2b);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), NAV.toon(0xfff2d0, { emissive: 0xfff0c8, emissiveIntensity: 1, ink: false })); bulb.position.set(76.18, 2.8, zs - 0.12); K.extra.push(bulb);
    K.add(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 18).rotateX(Math.PI / 2).translate(75.3, 3.2, zs - 0.06), 0xd8232a);
    K.box(74.75, 74.85, 3.05, 3.15, zs - 0.2, zs - 0.05, 0xf4f4f2); K.item('ball', [74.8, 3.0, zs - 0.18], 0.04, 0x1b1b1b);
    board(K, textTex('Leasing Inquiry', '#ffffff', '#c62828', fam, 512, 128), 0.32, 0.08, V(76.44, 1.62, zs - 0.06), Math.PI, 0.3);
    // beside it on the next house's front: a pot plant on a bracket and the white electrical cabinet
    K.box(77.18, 77.22, 1.95, 2.0, zs - 0.35, zs - 0.02, 0x2b2b2b); K.cyl(77.2, 2.0, zs - 0.2, 0.13, 0.22, 0xb5603a, { rt: 0.16, seg: 14 }); K.item('plume', [77.2, 2.45, zs - 0.2], [0.28, 0.3, 0.26], 0x3f7a35);
    K.box(77.15, 77.75, 0, 1.4, zs - 0.45, zs - 0.02, 0xf2f2ef, 0.02); K.block(77.1, zs - 0.5, 77.8, zs);
    // inside (seen only through the glass, so this is an assumption): a counter, chairs, the Arcade's name on the wall
    K.box(74.95, 76.55, 0, 1.05, 11.4, 12.0, 0xf2efe8, 0.02); K.box(74.95, 76.55, 1.05, 1.1, 11.35, 12.05, WOOD);
    for (const x of [75.3, 76.2]) { K.cyl(x, 0, 10.5, 0.2, 0.45, 0x2b4c9a, { seg: 14 }); K.box(x - 0.2, x + 0.2, 0.45, 0.85, 10.66, 10.72, 0x2b4c9a); }
    board(K, textTex('LITTLE INDIA ARCADE', '#b3262a', '#ffffff', fam), 1.9, 0.3, V(75.75, 2.35, 13.03), Math.PI, 0.4);
    K.block(74.9, 10.25, 76.6, 12.1);
    return { box: new THREE.Box3(V(74.5, 0, zs), V(77.0, GF, 13.2)) };
  }

  // ---- the wood-inlay pictures and brass on the five-foot way (SW-22) -----------------------------------------------------
  function woodInlay(K, r) {
    // a mesh panel draped in magenta satin facing the lane, framed marquetry of deities on it, a gold crescent
    K.box(77.85, 81.35, 0.25, 2.35, 6.56, 6.6, 0xc2187a);
    for (const x of [77.88, 81.32]) K.box(x - 0.02, x + 0.02, 0, 2.4, 6.58, 6.64, 0x9aa0a6);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) K.item('box', [78.35 + i * 0.82, 0.95 + j * 0.78, 6.53], [0.62, 0.7, 0.04], 0xffffff, [0, Math.PI, 0], inlay(r));
    K.add(new THREE.TorusGeometry(0.25, 0.05, 8, 24, Math.PI * 1.3).rotateZ(0.6).translate(81.0, 2.0, 6.52), 0xd9a441);
    K.block(77.8, 6.45, 81.4, 6.68);
    // brass camels and elephants on the floor before it, a bunch of peacock feathers in a pot
    for (const [kind, x, z, s, ry] of [['s7b-camel', 78.4, 5.95, 0.62, 0.3], ['s7b-camel', 79.3, 5.6, 0.7, -0.2], ['s7b-elephant', 80.3, 5.95, 0.55, 2.9], ['s7b-camel', 80.9, 5.3, 0.5, 3.4], ['s7b-elephant', 79.0, 6.15, 0.42, 3.1]]) {
      K.item(kind, [x, 0, z], s, pick(r, [0xb98a3e, 0xa87a33, 0xc59a4a]), [0, ry, 0]);
      K.block(x - s * 0.5, z - s * 0.3, x + s * 0.5, z + s * 0.3);
    }
    K.cyl(77.75, 0, 6.1, 0.14, 0.4, 0xb5603a, { rt: 0.16, seg: 14 });
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2, t = V(77.75 + Math.cos(a) * 0.22, 1.25 + r() * 0.2, 6.1 + Math.sin(a) * 0.22); K.rod(V(77.75, 0.38, 6.1), t, 0.006, 0x6b5a3a, 4); K.item('plume', [t.x, t.y, t.z], [0.05, 0.07, 0.03], pick(r, [0x1e8a8a, 0x2e7d32, 0x1565c0])); }
    K.block(77.55, 5.9, 77.95, 6.3);
  }

  // ---- Celebration of Arts: its display under the tent (SW-24) and the shop (SW-23) ----------------------------------------
  const TEXT = [0xf2e6c8, 0xe85c9a, 0x2b4c9a, 0xc62828, 0xf9a825, 0x2e7d32, 0x7b1fa2, 0xffffff, 0xd35400];
  // stacked textiles on a table: cushion covers and throws in prints, folded in piles
  function textiles(K, r, x0, x1, z0, z1, y) {
    for (let x = x0 + 0.18; x < x1 - 0.15; x += 0.34) for (let z = z0 + 0.18; z < z1 - 0.14; z += 0.36) {
      const n = 2 + Math.floor(r() * 6);
      for (let k = 0; k < n; k++) K.item('box', [x + (r() - 0.5) * 0.03, y + 0.025 + k * 0.05, z + (r() - 0.5) * 0.03], [0.3, 0.045, 0.32], 0xffffff, [0, (r() - 0.5) * 0.12, 0], patch(r, r() < 0.6 ? 'print' : 'patch'));
    }
  }
  function table(K, x0, x1, z0, z1, h = 0.78, top = WOOD) {
    K.box(x0, x1, h - 0.04, h, z0, z1, top, 0.01);
    for (const x of [x0 + 0.05, x1 - 0.05]) for (const z of [z0 + 0.05, z1 - 0.05]) K.box(x - 0.025, x + 0.025, 0, h - 0.04, z - 0.025, z + 0.025, 0x5e3f26);
    K.block(x0, z0, x1, z1);
  }
  // goods hung from a rod at height y: cloth bags and lanterns
  function hangers(K, r, x0, x1, z, y) {
    K.rod(V(x0, y, z), V(x1, y, z), 0.012, 0xb9bec4);
    for (let x = x0 + 0.15; x < x1 - 0.1; x += 0.3 + r() * 0.1) {
      if (r() < 0.6) K.item('s7b-bag', [x, y - 0.45, z], 0.42, 0xffffff, [0, (r() - 0.5) * 0.5, 0], patch(r, r() < 0.5 ? 'mirror' : 'patch'));
      else K.item('s7b-lantern', [x, y - 0.3, z], 0.32, pick(r, [0xe53935, 0xf9a825, 0x43a047, 0x8e24aa, 0xfb8c00]), [0, r() * 3, 0]);
    }
  }
  function artsDisplay(K, r) {
    // a magenta satin wall on the display's west side, brass and metal wall art on it: rounds, sunbursts, peacock plates
    K.box(83.12, 83.16, 0.2, 2.3, 2.3, 6.7, 0xc2187a);
    for (let k = 0; k < 16; k++) {
      const z = 2.55 + (k % 6) * 0.72 + (r() - 0.5) * 0.1, y = 0.75 + Math.floor(k / 6) * 0.55 + (k % 2) * 0.12, s = 0.1 + r() * 0.08;
      K.item('disc', [83.19, y, z], [s, 0.02, s], pick(r, [0xb98a3e, 0x8a6a3a, 0xd9a441, 0x6b8e5a, 0x3a6ea5]), [0, 0, Math.PI / 2]);
      K.item('torus', [83.21, y, z], s * 1.25, 0xd9a441, [0, Math.PI / 2, 0]);
      if (k % 4 === 1) K.item('box', [83.2, y, z], [0.02, s * 1.6, s * 1.6], 0xffffff, [Math.PI / 4, 0, 0], inlay(r));
    }
    K.block(83.05, 2.25, 83.25, 6.75);
    // tables of textiles, gold-thread boxes, figurines and singing bowls, a way down the middle to the shop
    for (const [a, b] of [[83.45, 85.7], [87.0, 88.35]]) {
      table(K, a, b, 2.45, 3.3); table(K, a, b, 5.35, 6.4);
    }
    textiles(K, r, 83.45, 85.7, 2.45, 3.3, 0.78); textiles(K, r, 87.0, 88.35, 5.35, 6.4, 0.78);
    for (let x = 87.15; x < 88.25; x += 0.12) for (let z = 2.6; z < 3.2; z += 0.12) K.item('disc', [x, 0.8 + r() * 0.03, z], [0.055, 0.03, 0.055], pick(r, [0xd9a441, 0xe8c25a, 0xc62828, 0x2e7d32, 0x1565c0]));
    for (let x = 83.65; x < 85.6; x += 0.22) {
      if (r() < 0.6) K.item('s7b-figure', [x, 0.78, 5.85 + (r() - 0.5) * 0.3], 0.22 + r() * 0.12, pick(r, [0xf2efe9, 0xd9a441, 0xe85c9a, 0x4fc3f7, 0xb98a3e]), [0, Math.PI + (r() - 0.5) * 0.4, 0]);
      else K.item('pot', [x, 0.78, 5.85], 0.12, BRASS);
    }
    // bags and lanterns hung from rods across the tent, tassel garlands along its front
    hangers(K, r, 83.4, 88.4, 3.0, 2.28); hangers(K, r, 83.4, 88.4, 5.6, 2.28);
    garlandRail(K, r, 83.4, 88.4, 2.05, 2.3, [0.3, 0.55], 0.2);
  }
  function artsShop(K, r) {
    const fr = { x0: 85.44, x1: 90.42, zf: 7.01, s: 1 }, R0 = room(K, fr, 85.44, 90.42, 14.3, { floor: 'tiles', tubes: 3 }), zs = R0.zs;
    // its yellow banner hung inside the five-foot way: the name, put together from the two fragments the video shows
    // ("…ration of Arts" and "celebration.of…")
    board(K, textTex('Celebration of Arts', '#f6d32b', '#a3151b', 'Georgia, "Times New Roman", serif'), 3.6, 0.42, V(87.93, 2.45, zs - 0.25), Math.PI, 0.4);
    // shelving of figurines, brass and boxes on both walls, folded cloth to the ceiling at the back
    const shelfGoods = (y, room, a, b) => {
      for (let z = 9.35; z < 13.6; z += 0.24) {
        const k = r(), x = (a + b) / 2;
        if (k < 0.5) K.item('s7b-figure', [x, y, z], Math.min(room * 0.85, 0.3) / 1.1 * (0.8 + r() * 0.2) * 1.1, pick(r, [0xf2efe9, 0xd9a441, 0xe85c9a, 0x4fc3f7, 0xb98a3e, 0x5e3f26]), [0, (a < b ? 1 : -1) * Math.PI / 2, 0]);
        else if (k < 0.6) K.item('lamp', [x, y, z], Math.min(room * 0.8, 0.36) / 1.3, BRASS);
        else K.item('box', [x, y + 0.08, z], [0.24, 0.16, 0.2], 0xffffff, [0, 0, 0], patch(r, 'print'));
      }
    };
    sideShelves(K, 85.6, 1, 9.2, 13.7, 2.5, 6, shelfGoods, WOOD); sideShelves(K, 90.26, -1, 9.2, 13.7, 2.5, 6, shelfGoods, WOOD);
    K.box(86.1, 89.8, 0, 2.9, 13.9, 14.12, WOOD);
    for (let y = 0.3; y < 2.8; y += 0.3) { K.box(86.1, 89.8, y - 0.01, y + 0.01, 13.62, 13.9, WOOD); for (let x = 86.2; x < 89.65; x += 0.26) for (let l = 0; l < 2; l++) K.item('box', [x + 0.12, y + 0.07 + l * 0.11, 13.76], [0.22, 0.1, 0.26], 0xffffff, [0, 0, 0], patch(r, r() < 0.5 ? 'print' : 'patch')); }
    K.block(86.1, 13.6, 89.8, 14.3);
    // a long table of textiles down the middle with a way round it each side, a counter at the back, lanterns and tassels
    table(K, 87.2, 88.7, 9.7, 12.4); textiles(K, r, 87.2, 88.7, 9.7, 12.4, 0.78);
    K.box(88.9, 90.0, 0, 0.95, 12.95, 13.45, 0x8e6a49, 0.02); K.block(88.85, 12.9, 90.05, 13.5);
    for (const z of [10.0, 11.3, 12.6]) hangers(K, r, 86.0, 89.9, z, 3.2);
    garlandRail(K, r, 86.0, 89.9, 9.35, 3.25, [0.35, 0.7], 0.22);
    return { box: new THREE.Box3(V(85.44, 0, zs), V(90.42, GF, 14.3)) };
  }

  // ---- the festival stalls as holograms, rebuilt from their stills ---------------------------------------------------------
  const HG = {
    statue: mergeG([new THREE.CylinderGeometry(0.09, 0.1, 0.06, 12).translate(0, 0.03, 0), new THREE.CylinderGeometry(0.05, 0.085, 0.2, 12).translate(0, 0.16, 0),
      new THREE.SphereGeometry(0.045, 12, 8).translate(0, 0.3, 0), new THREE.TorusGeometry(0.07, 0.008, 6, 20).translate(0, 0.31, -0.03)]),
    fountain: mergeG([new THREE.CylinderGeometry(0.15, 0.12, 0.09, 16).translate(0, 0.045, 0), new THREE.CylinderGeometry(0.05, 0.07, 0.2, 12).translate(0, 0.19, 0),
      new THREE.CylinderGeometry(0.11, 0.07, 0.06, 14).translate(0, 0.32, 0), new THREE.SphereGeometry(0.055, 12, 8).translate(0, 0.4, 0)]),
    peacock: mergeG([new THREE.ConeGeometry(0.05, 0.24, 10).translate(0, 0.12, 0), new THREE.SphereGeometry(0.03, 10, 8).translate(0, 0.27, 0.01),
      new THREE.CylinderGeometry(0.2, 0.2, 0.012, 18, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, 0.2, -0.05)]),
    diya: mergeG([0, 1, 2, 3].map((k) => new THREE.CylinderGeometry(0.15 - k * 0.032, 0.17 - k * 0.032, 0.05, 14).translate(0, 0.04 + k * 0.1, 0))
      .concat(new THREE.CylinderGeometry(0.018, 0.022, 0.38, 6).translate(0, 0.19, 0), new THREE.SphereGeometry(0.035, 10, 8).translate(0, 0.42, 0))),
    mosaic: mergeG([new THREE.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.42, 0), new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6).translate(0, 0.21, 0),
      new THREE.CylinderGeometry(0.08, 0.09, 0.03, 14).translate(0, 0.015, 0)]),
    hanging: mergeG([new THREE.SphereGeometry(0.11, 12, 8).scale(1, 1.2, 1), new THREE.CylinderGeometry(0.004, 0.004, 0.4, 4).translate(0, 0.33, 0)]),
    jar: new THREE.CylinderGeometry(0.065, 0.065, 0.2, 14, 1), lid: new THREE.CylinderGeometry(0.07, 0.07, 0.034, 14, 1),
    bulb: new THREE.SphereGeometry(0.06, 12, 8), bead: new THREE.IcosahedronGeometry(0.025, 0), orb: new THREE.SphereGeometry(0.035, 8, 6),
    cone: new THREE.ConeGeometry(0.014, 0.14, 6),
  };
  const STOCK = [0xe8b04a, 0xd9564a, 0x4f86c6, 0x5aa36a, 0xe07a4f, 0xf2e3b8, 0xb06ad0];
  const builder = (e, depth) => [new KIT.Builder(e.x0, e.x1, KIT.frontZ(e), depth, e.side), KIT.rnd(KIT.seedOf(e.id))];
  // garlands of beads looped along y between lx0 and lx1 at depth lz, sagging in swags
  function toran(B, beads, lx0, lx1, lz, y, span, sag, colours) {
    for (let a = lx0; a < lx1 - 0.05; a += span) for (let k = 0; k <= 10; k++) {
      const t = k / 10, p = B.P(a + span * t, y - Math.sin(Math.PI * t) * sag, lz);
      beads.push([p.x, p.y, p.z, 0, 1, colours[k % colours.length]]);
    }
  }
  // NE-18: the henna stall in a clear-walled tent: the pop-art poster board with its own words (its figures, which have
  // faces, are left out), the henna table and stools, a tall shelf of goods, the stepladder, a rope light (437, 884–890 s)
  KIT.custom['NE-18'] = (e, depth) => {
    const [B, r] = builder(e, depth), { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 });
    B.sheet(0.02, 0xdfeaf2, { folds: 6 }); B.sheet(w - 0.02, 0xdfeaf2, { folds: 6 });
    B.box('furniture', 0.8, 1.2, 0.42, 1.45, 2.4, 0.04, 0xf59ac4);
    B.sign('STAY CALM & HENNA ON', 0.8, 1.98, 0.39, 1.36, { bg: ['#e8237f', '#ff7ac0'], ink: '#ffffff', sub: 'Yidara JG', subInk: '#ffe14a', h: 0.72 });
    B.sign('Hello gorgeous!', 1.12, 0.95, 0.39, 0.62, { bg: '#16a394', ink: '#fff6a8', h: 0.6 });
    B.table(1.7, 0.6, 0.85, 0.55, 0.75, 0xf3efe6, 0xe85c9a);
    for (const [lx, lz] of [[1.9, 1.4], [2.35, 0.3]]) B.box('furniture', lx, 0.22, lz, 0.34, 0.44, 0.34, 0xe14b4b);
    const cones = [], goods = [], orbs = [];
    for (let k = 0; k < 7; k++) { const p = B.P(1.85 + k * 0.08, 0.83, 0.8); cones.push([p.x, p.y, p.z, 0, 1, 0x6d3b1f]); }
    const ys = B.shelving(w - 0.5, 0.45, 0.42, 1.9, 2.1, 5);
    for (const y of ys.slice(0, 4)) for (let lz = 0.6; lz < 2.25; lz += 0.24) { const p = B.P(w - 0.29, y, lz); goods.push([p.x, p.y, p.z, r() * 3, 0.9 + r() * 0.4, pick(r, STOCK)]); }
    B.rod('furniture', B.P(w - 0.95, 0, 1.75), B.P(w - 0.8, 1.6, 1.55), 0.02, 0xb9bec4); B.rod('furniture', B.P(w - 0.55, 0, 1.75), B.P(w - 0.65, 1.6, 1.55), 0.02, 0xb9bec4);
    for (let k = 0; k < 18; k++) { const t = k / 17, p = B.P(w - 0.58 - Math.sin(t * 9) * 0.06, 0.4 + t * 1.6, 0.42 + Math.cos(t * 9) * 0.06); orbs.push([p.x, p.y, p.z, 0, 1, 0x4fc3f7]); }
    B.instanced('cones', HG.cone, 0xffffff, cones); B.instanced('goods', HG.statue, 0xffffff, goods); B.instanced('rope', HG.orb, 0xffffff, orbs);
    return B.finish();
  };
  // NE-19: statues and fountains: red cloth behind white shelving of seated deities, a front table of tabletop fountains
  // with LED orbs and peacocks, mosaic lamps and paper lanterns from the ridge, LED vines down the front (815–863 s)
  KIT.custom['NE-19'] = (e, depth, sign) => {
    const [B, r] = builder(e, depth), { w, d } = B;
    B.tentRow(2, { eave: 2.5, ridge: 3.15 });
    KIT.eaveSign(B, sign);
    B.box('walls', w / 2, 1.25, d - 0.06, w - 0.1, 2.5, 0.03, 0xb3122e);
    const statues = [], fountains = [], peacocks = [], hanging = [], orbs = [];
    for (const lx of [0.15, w / 2 + 0.05]) {
      const ys = B.shelving(lx, d - 0.52, w / 2 - 0.2, 0.42, 2.05, 5);
      for (const y of ys.slice(0, 4)) for (let k = 0; k < Math.floor((w / 2 - 0.35) / 0.24); k++) { const p = B.P(lx + 0.15 + k * 0.24, y, d - 0.32); (r() < 0.75 ? statues : fountains).push([p.x, p.y, p.z, 0, r() < 0.75 ? 1.1 + r() * 0.5 : 0.8, pick(r, STOCK)]); }
    }
    B.table(0.25, 0.25, w - 0.5, 0.65, 0.8, 0xf3efe6, 0x8e0f2a);
    for (let k = 0; k < Math.floor((w - 0.6) / 0.34); k++) {
      const p = B.P(0.45 + k * 0.34, 0.8, 0.55 + (k % 2) * 0.12);
      if (k % 4 === 1) peacocks.push([p.x, p.y, p.z, 0, 1.3, 0x2e7d32]); else fountains.push([p.x, p.y, p.z, r() * 3, 0.9 + r() * 0.4, 0x8a8f96]);
    }
    for (let k = 0; k < 7; k++) { const p = B.P(0.4 + (k * (w - 0.8)) / 6, 2.15 - (k % 2) * 0.2, d * 0.45); hanging.push([p.x, p.y, p.z, 0, 1, pick(r, STOCK)]); }
    for (const lx of [0.08, w / 2, w - 0.08]) for (let k = 0; k < 20; k++) { const p = B.P(lx + Math.sin(k * 1.7) * 0.05, 0.2 + k * 0.1, 0.06); orbs.push([p.x, p.y, p.z, 0, 1, 0x9be15d]); }
    B.box('goods', w * 0.62, 1.65, d - 0.1, 0.42, 0.5, 0.03, 0xe8732a);                       // a framed picture on the cloth
    B.instanced('statues', HG.statue, 0xffffff, statues); B.instanced('fountains', HG.fountain, 0xffffff, fountains);
    B.instanced('peacocks', HG.peacock, 0xffffff, peacocks); B.instanced('hanging', HG.hanging, 0xffffff, hanging); B.instanced('vines', HG.orb, 0xffffff, orbs);
    return B.finish();
  };
  // NE-20: AJMIR STORE: white shelving units of jars across the back, the brown counter carrying the stall's own board
  // standing out on the inner yellow line, a white fridge, bulbs along the front (797–815 s)
  KIT.custom['NE-20'] = (e, depth) => {
    const [B, r] = builder(e, depth), { w, d } = B;
    B.tentRow(2, { eave: 2.5, ridge: 3.15 });
    const jars = [], lids = [], bulbs = [];
    for (const lx of [0.15, 1.95, 3.75]) {
      const ys = B.shelving(lx, d - 0.55, 1.7, 0.45, 2.1, 6);
      for (const y of ys.slice(0, 5)) for (let row = 0; row < 2; row++) for (let k = 0; k < 10; k++) {
        const tall = 0.17 + (r() < 0.3 ? 0.07 : 0), p = B.P(lx + 0.1 + k * 0.155, y + tall / 2, d - 0.55 + 0.12 + row * 0.2);
        jars.push([p.x, p.y, p.z, 0, 1, pick(r, [0xe3b25a, 0xc98a3c, 0xf0d28a, 0x9c5a2e, 0xe2c27a, 0xd8743c, 0xf3e3b4]), tall / 0.2]);
        lids.push([p.x, y + tall + 0.017, p.z, 0, 1, r() < 0.5 ? 0xd2262e : 0xe8b53a]);
      }
    }
    B.box('furniture', w / 2, 0.5, 0.0, w - 0.7, 1.0, 0.56, 0x3a2a1e);
    B.box('furniture', w / 2, 1.02, 0.0, w - 0.6, 0.04, 0.62, 0xd9c08a);
    B.sign('AJMIR STORE', w / 2, 0.62, -0.3, 2.2, { bg: '#231a14', ink: '#e6b84a', sub: 'SNACKS OF THE LEGEND', subInk: '#e6b84a', h: 0.5 });
    B.box('furniture', w - 0.45, 0.9, d * 0.5, 0.65, 1.8, 0.6, 0xf4f4f2);
    for (let k = 0; k < 8; k++) { const p = B.P(0.4 + (k * (w - 0.8)) / 7, 2.35, 0.25); bulbs.push([p.x, p.y, p.z, 0, 1, 0xfff6d8]); }
    B.instanced('jars', HG.jar, 0xffffff, jars); B.instanced('lids', HG.lid, 0xffffff, lids); B.instanced('bulbs', HG.bulb, 0xfff6d8, bulbs);
    return B.finish();
  };
  // SW-18: LED diya lamps: a white wall at the back with a toran of beads along its top and framed paintings on it, an L of
  // tables in magenta cloth with tiered gold lamps and peacocks, mosaic glass lamps (491–527 s)
  KIT.custom['SW-18'] = (e, depth, sign) => {
    const [B, r] = builder(e, depth), { w, d } = B;
    B.tentRow(Math.max(1, Math.round(w / 3.2)), { eave: 2.5, ridge: 3.15 });
    KIT.eaveSign(B, sign);
    B.box('walls', w / 2, 1.2, d - 0.12, w - 0.1, 2.4, 0.03, 0xf4f1ea);
    const beads = [], diyas = [], peacocks = [], mosaics = [];
    toran(B, beads, 0.1, w - 0.1, d - 0.16, 2.3, 0.5, 0.12, [0xd9a441, 0x8e1f22, 0xd9a441, 0x2e7d32]);
    for (const [lx, ly, sx, sy] of [[0.9, 1.55, 0.95, 0.6], [2.05, 1.55, 0.95, 0.6], [3.15, 1.6, 0.7, 0.5], [1.5, 0.95, 0.7, 0.45]]) B.box('goods', lx, ly, d - 0.15, sx, sy, 0.03, 0x2b4c9a);
    B.table(0.2, 0.25, w - 0.4, 0.62, 0.8, 0xf3efe6, 0xc2187a);
    B.table(0.2, 1.05, 0.7, d - 1.7, 0.8, 0xf3efe6, 0xc2187a);
    for (let k = 0; k < Math.floor((w - 0.6) / 0.32); k++) { const p = B.P(0.4 + k * 0.32, 0.8, 0.52); (k % 3 === 1 ? peacocks : diyas).push([p.x, p.y, p.z, 0, k % 3 === 1 ? 1.1 : 1 + r() * 0.4, 0xd9a441]); }
    for (let lz = 1.3; lz < d - 0.8; lz += 0.38) { const p = B.P(0.55, 0.8, lz); (r() < 0.6 ? diyas : mosaics).push([p.x, p.y, p.z, 0, 1 + r() * 0.3, pick(r, STOCK)]); }
    for (const lx of [w - 0.4, w - 0.85]) { const p = B.P(lx, 0, d - 0.55); B.box('furniture', lx, 0.45, d - 0.55, 0.36, 0.9, 0.36, 0xf3efe6); mosaics.push([p.x, 0.9, p.z, 0, 1.4, pick(r, STOCK)]); }
    B.instanced('beads', HG.bead, 0xffffff, beads); B.instanced('diyas', HG.diya, 0xffffff, diyas);
    B.instanced('peacocks', HG.peacock, 0xffffff, peacocks); B.instanced('mosaics', HG.mosaic, 0xffffff, mosaics);
    return B.finish();
  };
  // SW-19: a module closed in clear plastic on all sides, the decorations stored in it showing through (527 s)
  KIT.custom['SW-19'] = (e, depth) => {
    const [B, r] = builder(e, depth), { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 });
    B.sheet(0.02, 0xdfeaf2, { folds: 6 }); B.sheet(w - 0.02, 0xdfeaf2, { folds: 6 });
    const g = new THREE.PlaneGeometry(w - 0.06, 2.4, 20, 1), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin((p.getX(k) / w + 0.5) * Math.PI * 8) * 0.03);
    g.computeVertexNormals(); B.add('walls', g, 0xdfeaf2, B.P(w / 2, 1.2, 0.05));
    for (let k = 0; k < 5; k++) B.box('goods', 0.4 + k * 0.42, 0.25 + (k % 2) * 0.5, d * 0.5 + (r() - 0.5) * 0.8, 0.38, 0.5, 0.36, pick(r, [0xc62828, 0xd9a441, 0xc9a77a]));
    const beads = []; toran(B, beads, 0.2, w - 0.2, d * 0.55, 1.9, 0.6, 0.18, [0xc62828, 0xd9a441]);
    B.instanced('beads', HG.bead, 0xffffff, beads);
    return B.finish();
  };

  NAV.lane4 = {
    buildings: [176326997, ...ARCADE.map((a) => a[0])],
    // S1 columns these houses' own replace (a neighbour's column at 65.61 included; 90.42 stays with 20 Campbell Lane)
    columns: (x, z) => z > 6 && z < 8.6 && x > 65.3 && x < 90.2,
    build(root, grid) {
      const g = new THREE.Group(); g.name = 'lane4'; root.add(g);
      const kits = { 'LM-01': [6701, ihc], arcade: [6501, arcade], 'SW-21': [7451, reception], 'SW-22': [7751, woodInlay], 'SW-24': [8301, artsDisplay], 'SW-23': [8541, artsShop] };
      const parts = {}, built = {}, rooms = {};
      for (const [key, [seed, fn]] of Object.entries(kits)) {
        const K = (built[key] = new Kit(seed)), res = fn(K, K.r);
        if (res && res.box) rooms[key] = res.box;
        parts[key] = K.build(g, { soft: ['plume'] }).map((m) => ({ m, role: 'look' }));
        for (const [x0, z0, x1, z1] of K.blocks) grid.fillRect(x0, z0, x1, z1);
        for (const pts of K.polys || []) grid.fillPolygon(pts);
      }
      delete parts.arcade;
      grid.fillRect(75.85, -2.95, 81.15, -2.3);                       // AJMIR's counter stands out of its tent on the inner line
      // the lights: the overhang and the tents under it, the facade's purple, the reception, Celebration of Arts, the
      // stalls and displays along the Arcade
      NAV.addLight([66.5, -0.5, -8.2], [114.6, 4.9, -2.2], 0xffc98a, 0.45, 0.6);
      NAV.addLight([66.0, 4.4, -7.2], [124.0, 21.0, -3.0], 0xb070ff, 0.3, 0.8);
      NAV.addLight([74.5, -0.5, 8.5], [77.0, 3.4, 13.2], 0xfff4e6, 1.0, 0.45);
      NAV.addLight([83.0, -0.5, 1.9], [90.42, 3.4, 14.3], 0xffeed8, 0.9, 0.5);
      NAV.addLight([64.5, -0.5, 1.9], [83.0, 3.0, 7.0], 0xfff0dc, 0.4, 0.5);
      // the IHC is picked by its lane side, its corner and its ground floor's face; shops by their rooms, displays by goods
      const ihcPick = [];
      for (let k = 0; k < 4; k++) { const xa = 67.25 + k * 10.98, xb = xa + 10.98; ihcPick.push(new THREE.Box3(V(xa, SOFFIT - 0.4, Math.min(front(xa), front(xb)) - 0.9), V(xb, TOP + 0.5, Math.max(front(xa), front(xb)) + 0.05))); }
      ihcPick.push(new THREE.Box3(V(111.1, SOFFIT - 0.4, -6.0), V(114.2, TOP + 0.5, -3.85)), new THREE.Box3(V(67.43, 0, ZG - 0.3), V(114.6, SOFFIT, ZG + 0.62)));
      return {
        ...parts,
        box: { 'SW-21': rooms['SW-21'], 'SW-23': rooms['SW-23'] },
        pick: { 'LM-01': ihcPick, 'SW-22': built['SW-22'].pickBoxes(), 'SW-24': built['SW-24'].pickBoxes() },
      };
    },
  };
  NAV.detailed.push(NAV.lane4);
})();
