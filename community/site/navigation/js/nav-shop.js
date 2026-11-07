// Local shops at final quality, in the intro's line-art style at night (S3b). First: the pooja and religious-goods
// shop at 4 Campbell Lane (SW-15) and its garland tent in the lane (SW-14), built from the stills at 402–432 s.
// What the video shows: a white two-storey shophouse with red shutters; a terracotta-tiled five-foot way with a round
// grey column; a yellow sign with blue serif letters, mostly hidden by garlands ("…& CULT…"); a deep, narrow shop
// lit white, shelves to the ceiling, diya packs, clay and painted kalash pots, cartons and boxed goods stacked on the
// floor at the entrance, a step up at the back; in front, a tent hung thick with artificial marigold, rose and
// jasmine garlands over a table of red boxed packs, rangoli colour trays and a brass lamp, a bucket of peacock
// feathers and pampas grass at its corner. Where things stood inside is read from the frames, not measured.
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  // ---- printed goods: one atlas of labels for this shop's kind of stock -------------------------------------------------
  const N = 8;
  const ROWS = {
    incense: ['AGARBATHI', 'ஊதுபத்தி'], camphor: ['CAMPHOR', 'கற்பூரம்'], kumkum: ['KUMKUM', 'குங்குமம்'], diya: ['DIYA', 'அகல்'],
    carton: ['CLAY EARTHEN DIWA', 'FRAGILE'], green: ['DIYA GIFT SET', 'தீபம்'], red: ['DEEPAVALI', 'தீபாவளி'], rangoli: ['RANGOLI COLOURS', 'கோலம்'],
  };
  const PAL = [['#f4e9d0', '#c0392b', '#2c3e50'], ['#2e7d4f', '#f4d03f', '#ffffff'], ['#7b2d8e', '#f5b041', '#ffffff'], ['#1f5fa8', '#f7dc6f', '#ffffff'],
    ['#c0392b', '#f9e79f', '#ffffff'], ['#f5b041', '#922b21', '#4a235a'], ['#117a65', '#fdebd0', '#ffffff'], ['#e8daef', '#8e44ad', '#4a235a']];
  let ATLAS = null;
  function atlas() {
    if (ATLAS) return ATLAS;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const g = cv.getContext('2d'), s = 1024 / N, r = rnd(4044), fam = 'Fredoka, "Noto Sans Tamil", system-ui, sans-serif';
    const fit = (t, size, w, weight = 700) => { g.font = `${weight} ${size}px ${fam}`; while (g.measureText(t).width > w && size > 8) { size -= 1; g.font = `${weight} ${size}px ${fam}`; } };
    Object.entries(ROWS).forEach(([kind, words], row) => {
      for (let i = 0; i < N; i++) {
        const x = i * s, y = row * s, [en, ta] = kind === 'incense' && i % 2 ? ['SAMBRANI', 'சாம்பிராணி'] : words;
        if (kind === 'diya') {
          // a cellophane stack of painted diyas: the paint, the stacked rims, the wrapper catching the light, a sticker
          g.fillStyle = ['#d8323a', '#2e8b57', '#e0a92a', '#2d6fd6', '#e86fa8', '#f07c2a', '#7b4bb3', '#1fa3a3'][i]; g.fillRect(x, y, s, s);
          for (let k = 0; k < 6; k++) {
            g.fillStyle = 'rgba(40, 20, 10, 0.38)'; g.fillRect(x, y + s * (0.07 + k * 0.16), s, s * 0.035);
            g.fillStyle = 'rgba(255, 240, 200, 0.4)'; g.fillRect(x, y + s * (0.11 + k * 0.16), s, s * 0.018);
          }
          g.fillStyle = 'rgba(255, 255, 255, 0.3)'; g.fillRect(x + s * 0.14, y, s * 0.07, s);
          g.fillStyle = '#fffdf2'; g.fillRect(x + s * 0.52, y + s * 0.4, s * 0.36, s * 0.22);
          g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#b52a22'; fit(en, 14, s * 0.32); g.fillText(en, x + s * 0.7, y + s * 0.51);
          continue;
        }
        let [bg, band, ink] = PAL[(i + row * 3) % PAL.length];
        if (kind === 'carton') { bg = ['#c9a56e', '#bf9a62', '#d2b07a'][i % 3]; band = '#8a6a3a'; ink = '#3a2a1a'; }
        if (kind === 'green') { bg = ['#3f9a4a', '#2f8a3f', '#4aa857'][i % 3]; band = '#f7e27a'; ink = '#ffffff'; }
        if (kind === 'red') { bg = ['#c62828', '#b71c1c', '#d32f2f'][i % 3]; band = '#e8b94a'; ink = '#fff3c4'; }
        g.fillStyle = bg; g.fillRect(x, y, s, s);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        if (kind === 'carton') {
          g.strokeStyle = band; g.lineWidth = 2; g.strokeRect(x + 6, y + 6, s - 12, s - 12);
          g.fillStyle = ink; fit(en, 15, s - 16); g.fillText(en, x + s / 2, y + s * 0.42);
          fit(ta, 11, s - 20, 600); g.fillText('↑↑ ' + ta, x + s / 2, y + s * 0.66);
          continue;
        }
        if (kind === 'rangoli') {
          const sw = ['#e91e63', '#ffeb3b', '#4caf50', '#ff9800', '#2196f3', '#9c27b0'];
          sw.forEach((c, k) => { g.fillStyle = c; g.fillRect(x + 8 + k * (s - 16) / 6, y + s * 0.55, (s - 16) / 6 - 2, s * 0.32); });
        }
        g.fillStyle = band; g.fillRect(x, y + s * 0.08, s, s * 0.1);
        g.fillStyle = ink; fit(en, 22, s - 14); g.fillText(en, x + s / 2, y + s * (kind === 'rangoli' ? 0.32 : 0.42));
        if (kind !== 'rangoli') { g.fillStyle = band; fit(ta, 15, s - 20, 600); g.fillText(ta, x + s / 2, y + s * 0.7); }
        g.fillStyle = band; g.beginPath(); g.arc(x + s * 0.82, y + s * 0.84, s * 0.06 + r() * 2, 0, Math.PI * 2); g.fill();
      }
    });
    ATLAS = new THREE.CanvasTexture(cv); ATLAS.colorSpace = THREE.SRGBColorSpace; ATLAS.anisotropy = 8;
    return ATLAS;
  }
  const cell = (kind, r) => [Object.keys(ROWS).indexOf(kind), Math.floor(r() * N)];
  // atlases by name, each N × N cells; shops built later register theirs here
  const ATLASES = { goods: atlas };
  const BRASS = 0xd9a441;

  // terracotta floor tiles laid on the diagonal, as in the shop and on its five-foot way
  let TILES = null;
  function tiles() {
    if (TILES) return TILES;
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d'), r = rnd(77);
    g.fillStyle = '#e7d3c0'; g.fillRect(0, 0, 256, 256);
    g.save(); g.translate(128, 128); g.rotate(Math.PI / 4);
    for (let i = -4; i < 4; i++) for (let j = -4; j < 4; j++) { g.fillStyle = pick(r, ['#b4553a', '#ad4f36', '#ba5c40', '#a94b33']); g.fillRect(i * 46 + 2, j * 46 + 2, 42, 42); }
    g.restore();
    TILES = new THREE.CanvasTexture(cv); TILES.colorSpace = THREE.SRGBColorSpace; TILES.wrapS = TILES.wrapT = THREE.RepeatWrapping; TILES.anisotropy = 8;
    return TILES;
  }

  // ---- a builder: plain parts merged with their colour and ink id per vertex, goods as instances ------------------------
  const merge = (list) => THREE.BufferGeometryUtils.mergeGeometries(list);
  const GEO = {}, CUSTOM = {};
  const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  function geo(kind) {
    if (GEO[kind]) return GEO[kind];
    const nonIdx = (g) => (g.index ? g.toNonIndexed() : g);
    switch (kind) {
      case 'box': GEO.box = new THREE.BoxGeometry(1, 1, 1); break;
      case 'rbox': GEO.rbox = new THREE.RoundedBoxGeometry(1, 1, 1, 1, 0.08); break;
      case 'pack': GEO.pack = new THREE.CylinderGeometry(0.5, 0.5, 1, 14, 1).translate(0, 0.5, 0); break;          // a cellophane stack of diyas
      case 'pot': GEO.pot = lathe([[0, 0], [0.32, 0.02], [0.46, 0.3], [0.5, 0.52], [0.38, 0.8], [0.26, 0.9], [0.3, 1.0], [0.24, 1.0]]); break;
      case 'kalash': GEO.kalash = merge([nonIdx(lathe([[0, 0], [0.3, 0.02], [0.48, 0.3], [0.5, 0.5], [0.34, 0.76], [0.22, 0.84], [0.3, 0.92], [0.2, 0.94]])),
        nonIdx(new THREE.SphereGeometry(0.24, 12, 8).translate(0, 1.08, 0))]); break;                               // with its coconut on top
      case 'lamp': GEO.lamp = merge([lathe([[0, 0], [0.5, 0], [0.5, 0.06], [0.2, 0.12], [0.08, 0.2], [0.07, 0.8], [0.35, 0.86], [0.38, 0.92], [0.06, 0.94], [0.05, 1.1], [0.12, 1.16], [0, 1.3]], 18)].map(nonIdx)); break;
      case 'bead': GEO.bead = new THREE.IcosahedronGeometry(1, 0); break;
      case 'gseg': GEO.gseg = merge([0, 1, 2].map((k) => nonIdx(new THREE.IcosahedronGeometry(0.62, 0).translate(Math.cos(k * 2.094) * 0.42, k * 0.3 - 0.3, Math.sin(k * 2.094) * 0.42)))); break;   // a clump of flowers round the string
      case 'bell': GEO.bell = lathe([[0, 1], [0.12, 1], [0.16, 0.85], [0.3, 0.5], [0.5, 0.08], [0.52, 0], [0, 0]], 12); break;
      case 'leaf': GEO.leaf = new THREE.PlaneGeometry(0.6, 1).translate(0, -0.5, 0); break;
      case 'stick': GEO.stick = new THREE.CylinderGeometry(1, 1, 1, 6, 1); break;
      case 'disc': GEO.disc = new THREE.CylinderGeometry(1, 1, 1, 20, 1); break;
      case 'cone': GEO.cone = new THREE.ConeGeometry(1, 1, 8, 1); break;
      case 'plume': GEO.plume = new THREE.SphereGeometry(1, 8, 10); break;
      case 'jar': GEO.jar = new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1).translate(0, 0.5, 0); break;
      case 'ball': GEO.ball = new THREE.IcosahedronGeometry(1, 1); break;
      case 'torus': GEO.torus = new THREE.TorusGeometry(1, 0.08, 6, 24, Math.PI); break;                       // a necklace's arc
      case 'frustum': GEO.frustum = new THREE.CylinderGeometry(0.35, 0.5, 1, 16, 1).translate(0, 0.5, 0); break;   // a skirt, a kurta: flared to the hem
      case 'bunch': GEO.bunch = merge([-2, -1, 0, 1, 2].map((k) => {                                              // a hand of bananas, hung by its crown
        const a = k * 0.36, c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.sin(a) * 0.35, -0.55, Math.cos(a) * 0.35), new THREE.Vector3(Math.sin(a) * 0.62, -0.5, Math.cos(a) * 0.85));
        return nonIdx(new THREE.TubeGeometry(c, 5, 0.1, 5, false));
      })); break;
      default:
        if (!CUSTOM[kind]) throw new Error(kind);
        GEO[kind] = CUSTOM[kind](); break;                                                               // a stage's own shape (addGeo)
    }
    return GEO[kind];
  }
  // the lane's pool of loose parts in shared materials, merged per material in 24 m lengths of the lane (so the frustum
  // still drops what is behind you) once every detailed build has run
  const POOL = new Map();
  function flushPool(parent) {
    for (const [mat, list] of POOL) {
      const chunks = new Map();
      for (const m of list) {
        m.updateMatrix();
        const g = m.geometry.clone().applyMatrix4(m.matrix);
        for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
        g.computeBoundingBox();
        const key = Math.floor((g.boundingBox.min.x + g.boundingBox.max.x) / 2 / 24);
        if (!chunks.has(key)) chunks.set(key, []);
        chunks.get(key).push(g.index ? g.toNonIndexed() : g);
      }
      for (const geos of chunks.values()) parent.add(new THREE.Mesh(merge(geos), mat));
    }
    POOL.clear();
  }
  class Kit {
    constructor(seed) { this.r = rnd(seed); this.plain = new Map(); this.items = new Map(); this.extra = []; this.blocks = []; }
    add(g, color, side = THREE.FrontSide, ink) {
      g = g.index ? g.toNonIndexed() : g;
      if (!g.attributes.normal) g.computeVertexNormals();
      const n = g.attributes.position.count, c = new THREE.Color(color), col = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setAttribute('inkId', new THREE.BufferAttribute(new Float32Array(n).fill(ink ?? NAV.inkIdOfColor(color)), 1));
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color', 'inkId'].includes(k)) g.deleteAttribute(k);
      if (!this.plain.has(side)) this.plain.set(side, []);
      this.plain.get(side).push(g);
      return g;
    }
    // an axis-aligned box between two corners, rounded by r
    box(x0, x1, y0, y1, z0, z1, color, r = 0, side) {
      if (x0 > x1) [x0, x1] = [x1, x0]; if (y0 > y1) [y0, y1] = [y1, y0]; if (z0 > z1) [z0, z1] = [z1, z0];
      const w = x1 - x0, h = y1 - y0, d = z1 - z0;
      const g = r > 0 ? new THREE.RoundedBoxGeometry(w, h, d, r <= 0.025 ? 1 : 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d);
      return this.add(g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), color, side);
    }
    cyl(x, y, z, r, h, color, o = {}) { return this.add(new THREE.CylinderGeometry(o.rt ?? r, r, h, o.seg ?? 16, 1, !!o.open).translate(x, y + h / 2, z), color, o.open ? THREE.DoubleSide : undefined); }
    rod(a, b, r, color, seg = 8) {
      const len = a.distanceTo(b), g = new THREE.CylinderGeometry(r, r, len, seg, 1);
      g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()), new THREE.Vector3(1, 1, 1)));
      return this.add(g, color);
    }
    plane(w, h, color, at, rot, side = THREE.DoubleSide) { const g = new THREE.PlaneGeometry(w, h); g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot))); g.translate(...at); return this.add(g, color, side); }
    // one instance of a good: kind, position, scale [sx, sy, sz], colour, rotation [rx, ry, rz], label cell [row, col]
    item(kind, p, s, color = 0xffffff, rot = [0, 0, 0], label = null) {
      const key = kind + (label ? ':' + (label[2] || 'goods') : '');
      if (!this.items.has(key)) this.items.set(key, { kind, label: label ? label[2] || 'goods' : null, list: [] });
      this.items.get(key).list.push({ p, s: Array.isArray(s) ? s : [s, s, s], color, rot, label });
    }
    block(x0, z0, x1, z1) { this.blocks.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]); }
    blockPoly(pts) { (this.polys = this.polys || []).push(pts); }
    pickBoxes(h = 2.3) { return this.blocks.map(([x0, z0, x1, z1]) => new THREE.Box3(new THREE.Vector3(x0, 0, z0), new THREE.Vector3(x1, h, z1))); }
    // the meshes, with materials of their own so the hover can warm this shop alone
    build(parent, { soft = [], glow = {}, double = [] } = {}) {
      const out = [];
      for (const [side, list] of this.plain) {
        const m = new THREE.Mesh(merge(list), NAV.toon(0xffffff, { vc: true, side, unique: true }));
        parent.add(m); out.push(m);
      }
      const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
      for (const { kind, label, list } of this.items.values()) {
        const mat = label ? NAV.labelMat(ATLASES[label](), N)
          : NAV.toon(0xffffff, { unique: true, ink: soft.includes(kind) ? 'soft' : undefined, emissive: glow[kind], emissiveIntensity: 1, side: double.includes(kind) ? THREE.DoubleSide : undefined });
        const im = new THREE.InstancedMesh(geo(kind), mat, list.length);
        const off = label ? new Float32Array(list.length * 2) : null;
        list.forEach((it, k) => {
          im.setMatrixAt(k, M.compose(v.set(...it.p), q.setFromEuler(e.set(...it.rot)), sc.set(...it.s)));
          im.setColorAt(k, c.set(it.color));
          if (off) { off[k * 2] = it.label[1] / N; off[k * 2 + 1] = 1 - (it.label[0] + 1) / N; }
        });
        if (off) { im.geometry = im.geometry.clone(); im.geometry.setAttribute('uvOff', new THREE.InstancedBufferAttribute(off, 2)); }
        im.computeBoundingSphere();
        parent.add(im); out.push(im);
      }
      // loose meshes that share a material merge into one draw. A material shared by every shop (floor tiles, glass,
      // tubes, bulbs) goes to the lane's pool instead, one draw per material for the whole lane (flushPool); those parts
      // don't warm on hover. Any other material is copied, so the hover warms this shop alone.
      const byMat = new Map();
      for (const m of this.extra) { if (!byMat.has(m.material)) byMat.set(m.material, []); byMat.get(m.material).push(m); }
      for (const [mat, list] of byMat) {
        if (mat.userData.cached) { if (!POOL.has(mat)) POOL.set(mat, []); POOL.get(mat).push(...list); continue; }
        const own = mat.clone(); own.onBeforeCompile = mat.onBeforeCompile;
        if (list.length === 1) { list[0].material = own; parent.add(list[0]); out.push(list[0]); continue; }
        const geos = list.map((m) => { m.updateMatrix(); const g = m.geometry.clone().applyMatrix4(m.matrix); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return g.index ? g.toNonIndexed() : g; });
        const one = new THREE.Mesh(merge(geos), own); parent.add(one); out.push(one);
      }
      return out;
    }
  }

  // ---- the pooja shop at 4 Campbell Lane ------------------------------------------------------------------------------
  const X0 = 51.06, X1 = 56.53, ZF = 6.72, ZS = ZF + 1.8, ZB = 17.6, GF = 3.6, CEIL = 3.4, XC = (X0 + X1) / 2;
  const WALL = 0xf3eee6, TRIM = 0xe9e2d6, RED = 0xb3262a, SHUT = 0x9c2f2a, GREY = 0x9ea3a9, STEEL = 0xe4e6ea, WOOD = 0x8e6a49;
  const TERRA = [0xb5603a, 0xa8552f, 0xc06b45], PAINT = [0xd8323a, 0x2e8b57, 0xf2b632, 0x2d6fd6, 0xe86fa8, 0xf07c2a, 0x7b4bb3, 0x1fa3a3];
  const GARLAND = [[0xf28a1a, 0xf7c51e], [0xf7c51e, 0xf28a1a], [0xd8232a, 0xf7c51e], [0xf7f3ea, 0xf4b6c8], [0xf28a1a, 0xd8232a], [0xf7f3ea, 0xf7c51e],
    [0x7b3fa0, 0xf7f3ea], [0x2d5fd6, 0xf7f3ea], [0x2f8f4a, 0xf7f3ea], [0xd8232a, 0xf7f3ea]];

  // the shophouse front above the five-foot way: white wall, red-framed windows with shutters, cornices, tiled roof
  function shophouse(K, r) {
    K.box(X0, X1, GF, 7.1, ZF, 25.78, WALL);                                                      // the upper floor
    K.box(X0, X1, GF - 0.02, GF + 0.3, ZF - 0.12, ZF + 0.02, TRIM, 0.02);                         // beam over the five-foot way
    K.box(X0, X1, 7.1, 7.32, ZF - 0.16, ZF + 0.3, TRIM, 0.02);                                    // cornice
    K.box(X0, X1, 7.32, 7.75, ZF - 0.04, ZF + 0.2, WALL);                                          // parapet
    for (const x of [X0, X1]) K.box(x - 0.14, x + 0.14, GF + 0.3, 7.1, ZF - 0.07, ZF + 0.02, TRIM);   // pilasters on the party walls
    // three French windows with louvred shutters folded back, one of them lit
    for (let k = 0; k < 3; k++) {
      const cx = X0 + (X1 - X0) * (k + 0.5) / 3, w = 0.9, y0 = 4.25, y1 = 6.15, z = ZF - 0.02;
      K.box(cx - w / 2 - 0.08, cx + w / 2 + 0.08, y0 - 0.12, y0, z - 0.1, z + 0.05, TRIM, 0.015);          // sill
      for (const sx of [-1, 1]) K.box(cx + sx * (w / 2 + 0.03) - 0.04, cx + sx * (w / 2 + 0.03) + 0.04, y0, y1, z - 0.04, z + 0.02, RED);
      K.box(cx - w / 2 - 0.07, cx + w / 2 + 0.07, y1, y1 + 0.08, z - 0.04, z + 0.02, RED);
      K.box(cx - 0.02, cx + 0.02, y0, y1, z - 0.03, z + 0.01, RED);                                     // the two leaves meet
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), k === 1 ? NAV.toon(0xffd9a0, { emissive: 0xffc070, emissiveIntensity: 0.55 }) : NAV.toon(0x2c3550));
      glass.position.set(cx, (y0 + y1) / 2, z + 0.005); glass.rotation.y = Math.PI; K.extra.push(glass);
      for (const sx of [-1, 1]) {                                                                        // a shutter folded back against the wall
        const x0 = cx + sx * (w / 2 + 0.08), x1 = x0 + sx * 0.46;
        K.box(Math.min(x0, x1), Math.max(x0, x1), y0, y1, z - 0.06, z - 0.02, SHUT);
        for (let y = y0 + 0.08; y < y1 - 0.05; y += 0.09) K.box(Math.min(x0, x1) + 0.03, Math.max(x0, x1) - 0.03, y, y + 0.025, z - 0.075, z - 0.06, 0x7d241f);
      }
    }
    // red tiles on the roof slope behind the parapet, rising to the ridge
    const roof = new THREE.BufferGeometry(), y0 = 7.4, yr = 9.6, z0 = ZF + 0.2, zr = 16.2;
    roof.setAttribute('position', new THREE.Float32BufferAttribute([X0, y0, z0, X1, y0, z0, X1, yr, zr, X0, y0, z0, X1, yr, zr, X0, yr, zr], 3));
    K.add(roof, 0xa54b3a, THREE.DoubleSide);
    for (let z = z0 + 0.4; z < zr; z += 0.42) { const t = (z - z0) / (zr - z0); K.box(X0, X1, y0 + t * (yr - y0) + 0.02, y0 + t * (yr - y0) + 0.06, z - 0.03, z, 0x8c3d2f); }
  }

  // the five-foot way: tiles, the round grey columns, the ceiling and its lamp
  function fiveFoot(K) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, ZS - ZF + 0.02), NAV.toon(0xffffff, { map: tiles() }));
    floor.geometry.attributes.uv.array.forEach((v, k, a) => { a[k] = v * (k % 2 ? (ZS - ZF) / 0.6 : (X1 - X0) / 0.6); });
    floor.rotation.x = -Math.PI / 2; floor.position.set(XC, 0.014, (ZF + ZS) / 2); K.extra.push(floor);
    K.plane(X1 - X0, ZS - ZF, 0xe4ddd2, [XC, GF - 0.021, (ZF + ZS) / 2], [Math.PI / 2, 0, 0]);       // ceiling
    for (const x of [X0, X1]) {
      K.cyl(x, 0, ZF + 0.22, 0.2, GF - 0.3, GREY, { seg: 24 });
      K.box(x - 0.27, x + 0.27, 0, 0.14, ZF - 0.05, ZF + 0.49, 0x8d9298, 0.02);
      K.box(x - 0.26, x + 0.26, GF - 0.32, GF - 0.02, ZF - 0.04, ZF + 0.48, 0xa9adb3, 0.02);
      K.block(x - 0.3, ZF - 0.08, x + 0.3, ZF + 0.52);
    }
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 20), NAV.toon(0xfff3d6, { emissive: 0xfff0c8, emissiveIntensity: 0.9, ink: false }));
    lamp.position.set(XC, GF - 0.06, ZF + 0.9); K.extra.push(lamp);
  }
  // goods stacked on the five-foot way at the entrance, either side of the way in. They stand back against the
  // shopfront and the pallet keeps to the door, so the five-foot way still runs past the shop and its columns.
  function fiveFootGoods(K, r) {
    // NW side: a wall of cartons against the shopfront, a low pallet of diya packs by the door
    for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) labelled(K, r, 'carton', 51.55 + (k % 2) * 0.62, 51.55 + (k % 2) * 0.62 + 0.6, l * 0.3, l * 0.3 + 0.29, 8.08, 8.48, (r() - 0.5) * 0.04);
    K.block(51.45, 8.05, 52.85, 8.52);
    K.box(52.35, 52.8, 0, 0.12, 7.75, 8.06, WOOD);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { pack(K, r, 52.44 + i * 0.135, 0.12, 7.84 + j * 0.12); if (r() < 0.6) pack(K, r, 52.44 + i * 0.135, 0.27, 7.84 + j * 0.12); }
    K.block(52.3, 7.7, 52.85, 8.08);
    // SE side: a narrow table of brass lamps and green boxed goods against the shopfront
    K.box(54.85, 56.1, 0, 0.75, 8.05, 8.5, 0xe8e2d8, 0.02);
    for (let i = 0; i < 3; i++) K.item('lamp', [55.58 + i * 0.2, 0.75, 8.2 + (i % 2) * 0.16], 0.3 + (i % 3) * 0.06, BRASS);
    for (let k = 0; k < 7; k++) labelled(K, r, 'green', 54.95, 55.4, 0.75 + k * 0.065, 0.81 + k * 0.065, 8.13, 8.42, (r() - 0.5) * 0.06);
    K.block(54.8, 8.0, 56.15, 8.52);
  }

  // the sign over the shop: a yellow board with blue serif letters, of which only "& CULT" can be read
  function signTexture() {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 112;
    const g = cv.getContext('2d');
    g.fillStyle = '#f2cd3a'; g.fillRect(0, 0, 1024, 112);
    g.strokeStyle = '#1d3f8f'; g.lineWidth = 5; g.strokeRect(8, 8, 1008, 96);
    g.fillStyle = '#1d3f8f'; g.font = '700 74px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('& CULT', 560, 60);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }

  // garlands hanging from a rail along the lane at depth z: clumps of flowers in coloured sections, a tassel at the foot
  function garlandRail(K, r, x0, x1, z, y, len, step, { clear = null, headroom = 1.95 } = {}) {
    K.rod(new THREE.Vector3(x0, y + 0.02, z), new THREE.Vector3(x1, y + 0.02, z), 0.012, 0xb9bec4);
    for (let x = x0 + 0.05; x < x1 - 0.04; x += step * (0.85 + r() * 0.3)) {
      let l = len[0] + r() * (len[1] - len[0]);
      if (clear && x > clear[0] && x < clear[1]) l = Math.min(l, y - headroom);          // keep the way in clear
      const pal = pick(r, GARLAND), jas = pal[0] === 0xf7f3ea, rad = jas ? 0.026 : 0.035, gap = jas ? 0.04 : 0.05;
      const n = Math.max(2, Math.floor(l / gap)), zz = z + (r() - 0.5) * 0.07, sec = 4 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) K.item('gseg', [x + (r() - 0.5) * 0.006, y - 0.03 - k * gap, zz], rad * (0.9 + r() * 0.2), Math.floor(k / sec) % 3 === 2 ? pal[1] : pal[0], [0, r() * 6.28, 0]);
      K.item('cone', [x, y - 0.03 - n * gap - 0.03, zz], [0.026, 0.08, 0.026], pal[1]);
    }
  }
  // swags: garlands looped between points along a front, a tassel where each one sags lowest
  function swags(K, r, x0, x1, z, y, span = 0.5, sag = 0.2) {
    for (let xa = x0; xa < x1 - span * 0.6; xa += span) {
      const pal = pick(r, GARLAND), n = 12;
      for (let k = 0; k <= n; k++) {
        const t = k / n, x = xa + span * t, yy = y - sag * 4 * t * (1 - t);
        K.item('gseg', [x, yy, z], 0.03 * (0.9 + r() * 0.2), k % 4 === 2 ? pal[1] : pal[0], [Math.PI / 2, 0, r() * 6.28]);
      }
      K.item('cone', [xa + span / 2, y - sag - 0.08, z], [0.03, 0.1, 0.03], pal[1]);
      K.item('bell', [xa, y - 0.08, z], 0.05, BRASS);
    }
  }
  // a cellophane stack of painted diyas, or a row of them
  const pack = (K, r, x, y, z, s = 1) => K.item('pack', [x, y, z], [0.12 * s, (0.11 + r() * 0.05) * s, 0.12 * s], 0xffffff, [0, r() * 6.28, 0], cell('diya', r));
  // an open plastic basket with a rolled rim
  function basket(K, x0, x1, y0, y1, z0, z1, color) {
    const t = 0.012;
    K.box(x0, x1, y0, y0 + t, z0, z1, color);
    K.box(x0, x1, y0, y1, z0, z0 + t, color); K.box(x0, x1, y0, y1, z1 - t, z1, color);
    K.box(x0, x0 + t, y0, y1, z0, z1, color); K.box(x1 - t, x1, y0, y1, z0, z1, color);
    K.box(x0 - 0.008, x1 + 0.008, y1 - 0.016, y1, z0 - 0.008, z1 + 0.008, color, 0.006);
  }
  const labelled = (K, r, kind, x0, x1, y0, y1, z0, z1, rot = 0) => K.item('box', [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], 0xffffff, [0, rot, 0], cell(kind, r));

  // steel shelving along a side wall, facing the aisle (+1: faces +x), packed from the floor to the ceiling
  function shelfWall(K, r, xw, face, z0, z1, h = 3.05, levels = 7, ceil = CEIL) {
    const d = 0.45, xf = xw + face * d;                       // xf: the shelf's front edge, towards the aisle
    for (const z of [z0, z1]) for (const x of [xw + face * 0.02, xf - face * 0.02]) K.box(x - 0.018, x + 0.018, 0, h, z - 0.018, z + 0.018, STEEL);
    const ys = [];
    for (let k = 0; k < levels; k++) {
      const y = 0.1 + (k * (h - 0.25)) / (levels - 1);
      K.box(Math.min(xw, xf), Math.max(xw, xf), y - 0.012, y + 0.012, z0, z1, STEEL);
      K.box(xf - face * 0.012 - 0.006, xf - face * 0.012 + 0.006, y + 0.012, y + 0.05, z0, z1, 0xf6f6f2);   // price-strip lip
      ys.push(y + 0.012);
    }
    K.block(Math.min(xw, xf), z0 - 0.05, Math.max(xw, xf), z1 + 0.05);
    ys.forEach((y, k) => {
      const top = k === ys.length - 1, room = top ? ceil - y - 0.03 : ys[k + 1] - y - 0.05;
      if (top) {                                               // cartons on top, up to the ceiling
        for (let z = z0 + 0.02; z < z1 - 0.3; z += 0.44) labelled(K, r, 'carton', Math.min(xw, xw + face * 0.44), Math.max(xw, xw + face * 0.44), y, y + Math.min(room, 0.34), z, z + 0.42, (r() - 0.5) * 0.04);
        return;
      }
      let z = z0 + 0.03;
      while (z < z1 - 0.1) {
        const run = Math.min(z1 - 0.03 - z, 0.32 + r() * 0.45), kind = r();
        if (kind < 0.36) {                                     // boxed goods, stacked up to the next board
          const lab = pick(r, ['incense', 'camphor', 'kumkum', 'red', 'incense']), w = 0.08 + r() * 0.06, hh = 0.1 + r() * 0.1, dd = 0.2 + r() * 0.15;
          const c = cell(lab, r), layers = Math.max(1, Math.floor(room / (hh + 0.004)));
          for (let zz = z; zz < z + run - w + 0.001; zz += w + 0.006) for (let l = 0; l < layers; l++)
            K.item('box', [xw + face * (0.03 + dd / 2), y + l * (hh + 0.004) + hh / 2, zz + w / 2], [dd, hh, w], 0xffffff, [0, (r() - 0.5) * 0.05, 0], c);
        } else if (kind < 0.66) {                              // diya packs, two deep, stacked up to the next board
          const layers = Math.max(1, Math.floor(room / 0.15));
          for (let zz = z + 0.065; zz < z + run - 0.06; zz += 0.128) for (const dx of [0.11, 0.27]) for (let l = 0; l < layers; l++) pack(K, r, xw + face * dx, y + l * 0.148, zz, 0.98);
        } else if (kind < 0.84) {                              // clay pots and painted kalash, as big as the shelf allows
          for (let zz = z + 0.13; zz < z + run - 0.11; zz += 0.25) {
            const ks = r() < 0.45 ? 'kalash' : 'pot', sz = Math.min(room * 0.92, 0.38) / (ks === 'kalash' ? 1.32 : 1);
            K.item(ks, [xw + face * 0.22, y, zz], sz * (0.85 + r() * 0.15), ks === 'kalash' ? pick(r, PAINT) : pick(r, TERRA), [0, r() * 6, 0]);
          }
        } else {                                               // brass lamps, bells and plates
          for (let zz = z + 0.09; zz < z + run - 0.07; zz += 0.17) K.item('lamp', [xw + face * (0.15 + r() * 0.12), y, zz], Math.min(room * 0.9, 0.44) / 1.3, BRASS);
        }
        z += run + 0.015;
      }
    });
  }

  // a stepped stand of diya packs, kalash and pots rising from the aisle to the wall
  function steps(K, r, x0, x1, z0, z1, rise) {
    const n = 3, face = x0 < XC ? 1 : -1;                     // the low step faces the aisle
    for (let k = 0; k < n; k++) {
      const w = (x1 - x0) / n, xa = face > 0 ? x1 - (k + 1) * w : x0 + k * w, xb = xa + w, top = 0.35 + (n - 1 - k) * rise;
      K.box(xa, xb, 0, top, z0, z1, 0xe8e2d8, 0.015);
      for (let z = z0 + 0.09; z < z1 - 0.06; z += 0.14) for (let x = xa + 0.08; x < xb - 0.05; x += 0.14) {
        if (r() < 0.22) K.item(r() < 0.5 ? 'kalash' : 'pot', [x, top, z], 0.17 + r() * 0.05, r() < 0.5 ? pick(r, PAINT) : pick(r, TERRA), [0, r() * 6, 0]);
        else { pack(K, r, x, top, z); if (r() < 0.5) pack(K, r, x, top + 0.15, z); }
      }
    }
    K.block(x0, z0, x1, z1);
  }

  function interior(K, r) {
    // floor, the step up at the back, walls, ceiling and its tubes
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, ZB - ZS), NAV.toon(0xffffff, { map: tiles() }));
    floor.geometry.attributes.uv.array.forEach((v, k, a) => { a[k] = v * (k % 2 ? (ZB - ZS) / 0.6 : (X1 - X0) / 0.6); });
    floor.rotation.x = -Math.PI / 2; floor.position.set(XC, 0.014, (ZS + ZB) / 2); K.extra.push(floor);
    K.box(X0 + 0.15, X1 - 0.15, 0, 0.15, 15.6, ZB, 0xa9573c, 0.01); K.block(X0, 15.55, X1, ZB);
    const IN = 0xf1e7d4;
    for (const [xa, xb] of [[X0 - 0.01, X0 + 0.15], [X1 - 0.15, X1 + 0.01]]) { K.box(xa, xb, 0, GF, ZS, ZB, IN); K.block(xa - 0.05, ZS, xb + 0.05, ZB); }
    K.box(X0, X1, 0, GF, ZB, ZB + 0.2, IN); K.block(X0, ZB - 0.05, X1, ZB + 0.25);
    // the doorway to the back, its frame and a maroon curtain hung in folds
    K.box(53.22, 54.38, 0.15, 2.36, ZB - 0.04, ZB - 0.0, WOOD);
    const cur = new THREE.PlaneGeometry(1.04, 2.1, 16, 1), cp = cur.attributes.position;
    for (let k = 0; k < cp.count; k++) cp.setZ(k, Math.sin((cp.getX(k) / 1.04 + 0.5) * Math.PI * 7) * 0.025);
    cur.translate(53.8, 1.21, ZB - 0.07); K.add(cur, 0x7a1f2b, THREE.DoubleSide);
    // the calendar and the clock on the back wall
    K.box(52.0, 52.75, 1.35, 2.25, ZB - 0.03, ZB - 0.01, 0xf7f3ea); K.box(52.0, 52.75, 2.0, 2.25, ZB - 0.035, ZB - 0.025, 0xc0392b);
    for (let k = 0; k < 20; k++) K.box(52.06 + (k % 5) * 0.135, 52.16 + (k % 5) * 0.135, 1.45 + Math.floor(k / 5) * 0.12, 1.53 + Math.floor(k / 5) * 0.12, ZB - 0.034, ZB - 0.03, k % 7 === 6 ? 0xc0392b : 0x9aa0a6);
    K.add(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 28).rotateX(Math.PI / 2).translate(55.25, 2.65, ZB - 0.04), 0xf7f3ea);
    K.add(new THREE.TorusGeometry(0.17, 0.018, 6, 28).translate(55.25, 2.65, ZB - 0.06), 0x3a3d42);
    K.box(55.244, 55.256, 2.65, 2.79, ZB - 0.07, ZB - 0.065, 0x2b2b2b); K.box(55.25, 55.36, 2.644, 2.656, ZB - 0.07, ZB - 0.065, 0x2b2b2b);   // its hands
    K.plane(X1 - X0, ZB - ZS, 0xf4f1ea, [XC, CEIL, (ZS + ZB) / 2], [Math.PI / 2, 0, 0]);
    K.box(X0, X1, CEIL, GF, ZS, ZS + 0.25, TRIM);                                           // the lintel inside the opening
    for (const x of [52.6, XC, 55.0]) for (let z = 9.2; z < 17.2; z += 2.6) {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 1.2), NAV.toon(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1.0, ink: false }));
      tube.position.set(x, CEIL - 0.04, z + 0.6); K.extra.push(tube);
    }
    // the shopfront: piers either side of the opening, the beam, the sign
    K.box(X0, X0 + 0.32, 0, GF, ZS - 0.02, ZS + 0.25, TRIM); K.box(X1 - 0.32, X1, 0, GF, ZS - 0.02, ZS + 0.25, TRIM);
    K.box(X0, X1, 2.72, GF, ZS - 0.02, ZS + 0.25, TRIM);
    K.block(X0, ZS - 0.05, X0 + 0.35, ZS + 0.3); K.block(X1 - 0.35, ZS - 0.05, X1, ZS + 0.3);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 - 0.5, 0.56), (() => { const t = signTexture(); return NAV.toon(0xffffff, { map: t, emissive: 0xffffff, emissiveIntensity: 0.25, unique: true }); })());
    sign.material.emissiveMap = sign.material.map;
    sign.position.set(XC, 3.1, ZS - 0.035); sign.rotation.y = Math.PI; K.extra.push(sign);
    // garlands hung in front of the sign and over the entrance; most of the sign disappears behind them
    garlandRail(K, r, X0 + 0.25, X1 - 0.25, ZS - 0.22, 3.42, [0.5, 1.15], 0.07, { clear: [52.9, 54.7], headroom: 2.05 });
    // at the entrance, right: the stepped stand of diya packs and pots; left: stacked green boxes and a counter
    steps(K, r, X0 + 0.2, X0 + 1.9, ZS + 0.3, ZS + 2.2, 0.32);
    for (let s = 0; s < 6; s++) {
      const x = 54.75 + (s % 3) * 0.36, z = ZS + 0.35 + Math.floor(s / 3) * 0.26, n = 8 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) labelled(K, r, 'green', x - 0.16, x + 0.16, k * 0.065, k * 0.065 + 0.06, z - 0.11, z + 0.11, (r() - 0.5) * 0.06);
    }
    K.block(54.55, ZS + 0.2, 55.95, ZS + 0.75);
    K.box(54.65, X1 - 0.18, 0, 0.86, ZS + 0.85, ZS + 2.3, 0xe8e2d8, 0.02);                  // counter
    K.box(54.6, X1 - 0.15, 0.86, 0.9, ZS + 0.8, ZS + 2.35, 0xd8d2c6, 0.01);
    K.block(54.6, ZS + 0.8, X1 - 0.15, ZS + 2.35);
    tray(K, r, 55.1, 0.9, ZS + 1.2); tray(K, r, 55.65, 0.9, ZS + 1.85);
    basket(K, 55.35, 55.9, 0.9, 1.08, ZS + 1.4, ZS + 1.78, 0xd8323a);                     // a basket of diya packs
    for (let k = 0; k < 6; k++) pack(K, r, 55.44 + (k % 3) * 0.16, 0.92, ZS + 1.5 + Math.floor(k / 3) * 0.16, 0.95);
    for (let k = 0; k < 6; k++) pack(K, r, 54.8 + (k % 3) * 0.14, 0.9, ZS + 2.1 - Math.floor(k / 3) * 0.14);
    // cartons stacked on the floor behind the stand
    for (let k = 0; k < 5; k++) labelled(K, r, 'carton', X0 + 0.2, X0 + 0.62, k * 0.3, k * 0.3 + 0.29, ZS + 2.3, ZS + 2.75);
    // shelving up both walls; islands either side of the aisle; the cashier at the back
    shelfWall(K, r, X0 + 0.15, 1, ZS + 2.85, 15.5);
    shelfWall(K, r, X1 - 0.15, -1, ZS + 2.45, 13.1);
    shelfWall(K, r, X1 - 0.15, -1, 14.6, 15.5, 2.2, 5);
    island(K, r, 52.05, 52.95, ZS + 3.0, 15.0);
    island(K, r, 54.65, 55.4, ZS + 3.0, 12.9);
    // stock waiting on the floor: cartons against the islands' ends, a basket of packs, a stool by the cashier
    labelled(K, r, 'carton', 52.15, 52.6, 0, 0.32, ZS + 2.62, ZS + 2.97); labelled(K, r, 'carton', 52.2, 52.62, 0.32, 0.6, ZS + 2.64, ZS + 2.95);
    basket(K, 54.7, 55.15, 0, 0.26, ZS + 2.6, ZS + 2.97, 0x2d6fd6);
    for (let k = 0; k < 4; k++) pack(K, r, 54.82 + (k % 2) * 0.2, 0.02, ZS + 2.7 + Math.floor(k / 2) * 0.15, 0.9);
    K.block(52.1, ZS + 2.55, 52.65, ZS + 3.0); K.block(54.65, ZS + 2.55, 55.2, ZS + 3.0);
    K.cyl(55.1, 0, 14.9, 0.16, 0.45, 0xd8323a, { rt: 0.15, seg: 14 }); K.block(54.9, 14.7, 55.3, 15.1);
    K.box(54.6, 55.9, 0, 0.95, 13.4, 14.5, 0xc9b79c, 0.02);                                  // cashier counter, glass top, register
    K.box(54.58, 55.92, 0.95, 0.99, 13.38, 14.52, 0xbfe1ec, 0.01);
    K.box(55.3, 55.75, 0.99, 1.2, 13.7, 14.1, 0x3a3d42, 0.02);
    K.block(54.55, 13.35, 55.95, 14.55);
    // the prayer shelf on the wall behind the cashier: a framed picture, a lamp, flowers
    K.box(X1 - 0.45, X1 - 0.15, 2.0, 2.04, 13.5, 14.4, WOOD);
    K.box(X1 - 0.2, X1 - 0.16, 2.06, 2.56, 13.7, 14.2, BRASS);
    K.box(X1 - 0.21, X1 - 0.19, 2.1, 2.52, 13.75, 14.15, 0xe86fa8);
    K.item('lamp', [X1 - 0.33, 2.04, 13.62], 0.12, BRASS);
    // cartons on the back platform, either side of the doorway
    for (let k = 0; k < 8; k++) labelled(K, r, 'carton', k < 4 ? X0 + 0.25 : 54.5, k < 4 ? X0 + 0.7 : 54.95, 0.15 + (k % 4) * 0.3, 0.44 + (k % 4) * 0.3, 16.9, 17.4);
    // garlands hung from the ceiling over the aisle, inside the door; bells on strings and mango-leaf torans further in
    garlandRail(K, r, 52.4, 55.2, ZS + 0.6, CEIL - 0.02, [0.35, 0.8], 0.09, { clear: [52.9, 54.7], headroom: 2.05 });
    for (let k = 0; k < 7; k++) {
      const x = 52.75 + k * 0.33, z = 10.6 + (k % 2) * 0.25, n = 5 + (k % 3);
      K.rod(new THREE.Vector3(x, CEIL, z), new THREE.Vector3(x, CEIL - 0.15 - n * 0.11, z), 0.003, 0x8a6a3a, 4);
      for (let b = 0; b < n; b++) K.item('bell', [x, CEIL - 0.2 - b * 0.11, z], 0.045 + (b === n - 1 ? 0.025 : 0), BRASS);
    }
    for (const z of [12.0, 14.0]) {
      K.rod(new THREE.Vector3(52.1, CEIL - 0.3, z), new THREE.Vector3(55.5, CEIL - 0.3, z), 0.004, 0xd9c08a, 4);
      for (let x = 52.15; x < 55.45; x += 0.07) K.item('leaf', [x, CEIL - 0.31, z], [0.06, 0.13, 1], (x * 100) % 2 < 1 ? 0x2f8f3a : 0x3fa04a, [0, 0, (r() - 0.5) * 0.3]);
    }
    // a ceiling fan over the middle of the shop
    K.cyl(XC, CEIL - 0.42, 12.9, 0.012, 0.42, 0x9aa0a6); K.cyl(XC, CEIL - 0.5, 12.9, 0.1, 0.1, 0xe4e6ea);
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.4; K.add(new THREE.BoxGeometry(0.55, 0.012, 0.12).translate(0.36, 0, 0).rotateY(a).translate(XC, CEIL - 0.46, 12.9), 0xe4e6ea); }
  }
  // a gondola of shelves down the middle of the shop, goods on both faces
  function island(K, r, x0, x1, z0, z1) {
    const xm = (x0 + x1) / 2;
    K.box(xm - 0.03, xm + 0.03, 0, 1.5, z0, z1, 0xd8dbe0);                 // the divider
    K.box(x0, x1, 0, 0.1, z0, z1, 0xc9ccd2);                                 // plinth
    for (let k = 0; k < 4; k++) {
      const y = 0.1 + k * 0.4, top = k === 3, room = top ? 0.4 : 0.36;
      for (const face of [-1, 1]) {
        const xa = face < 0 ? x0 : x1, xin = xm + face * 0.03;                 // the board runs from the divider to the face
        K.box(Math.min(xa, xin), Math.max(xa, xin), y - 0.01, y + 0.01, z0, z1, STEEL);
        K.box(xa - 0.006, xa + 0.006, y + 0.01, y + 0.045, z0, z1, 0xf6f6f2);  // price-strip lip
        for (let z = z0 + 0.08; z < z1 - 0.06; z += 0.13) {
          const d = r();
          if (top && d < 0.35) K.item('kalash', [xm + face * 0.22, y, z], 0.2, pick(r, PAINT), [0, r() * 6, 0]);
          else if (d < 0.6) { pack(K, r, xm + face * 0.12, y + 0.01, z); pack(K, r, xm + face * 0.29, y + 0.01, z); if (!top) { pack(K, r, xm + face * 0.12, y + 0.16, z); pack(K, r, xm + face * 0.29, y + 0.16, z); } }
          else { const c = cell(pick(r, ['incense', 'camphor', 'kumkum', 'red']), r); for (let l = 0; l < (top ? 2 : 2); l++) K.item('box', [xm + face * 0.21, y + 0.01 + 0.085 + l * 0.17, z], [0.32, 0.165, 0.11], 0xffffff, [0, 0, 0], c); }
        }
      }
    }
    // packets hung on hooks at the ends that face the door and the back
    for (const [z, f] of [[z0, -1], [z1, 1]]) {
      K.box(x0, x1, 0.2, 1.42, z - 0.015, z + 0.015, 0xc8a87a);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) K.item('box', [x0 + (x1 - x0) * (i + 0.5) / 3, 1.25 - j * 0.28, z + f * 0.03], [0.16, 0.2, 0.02], 0xffffff, [0, 0, 0], cell(pick(r, ['kumkum', 'camphor', 'incense']), r));
    }
    K.block(x0, z0, x1, z1);
  }
  // a round tray of rangoli colour sticks
  function tray(K, r, x, y, z) {
    K.item('disc', [x, y + 0.01, z], [0.2, 0.02, 0.2], BRASS);
    for (let k = 0; k < 26; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.16;
      K.item('stick', [x + Math.cos(a) * d, y + 0.035, z + Math.sin(a) * d], [0.012, 0.11, 0.012], pick(r, [0xe91e63, 0xffeb3b, 0x4caf50, 0xff9800, 0x2196f3, 0x9c27b0]), [Math.PI / 2, a, 0]);
    }
  }

  // ---- the garland tent in the lane (SW-14): the shop's own goods, solid under the hologram tent ---------------------------
  function laneDisplay(K, r) {
    const xa = 50.62, xb = 55.92, way = [53.1, 54.8];          // the way in from the aisle to the shop, wide enough to walk
    // garlands thick on four rails under the roof (shorter over the way in), swags along the front
    for (const z of [3.0, 4.1, 5.2]) garlandRail(K, r, xa, xb, z, 2.36, [0.95, 1.85], 0.075, { clear: [52.7, 55.3], headroom: 1.98 });
    swags(K, r, 52.0, xb, 2.02, 2.42);
    for (let k = 0; k < 4; k++) {
      const x = xa + 0.6 + k * 1.45, bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), NAV.toon(0xfff3d0, { emissive: 0xfff0c0, emissiveIntensity: 1, ink: false }));
      bulb.position.set(x, 2.5, 4.3); K.extra.push(bulb); K.rod(new THREE.Vector3(x, 2.56, 4.3), new THREE.Vector3(x, 3.0, 4.3), 0.004, 0x222222, 4);
    }
    // the front table either side of the way in, in red cloth, laid with the shop's stock
    for (const [x0, x1] of [[xa, way[0]], [way[1], xb]]) {
      K.box(x0, x1, 0, 0.78, 2.0, 2.72, 0xc8242c, 0.02);
      K.block(x0, 1.95, x1, 2.78);
    }
    // stacked red boxed packs, two rangoli trays, diya packs, and the brass kuthuvilakku on its tower of boxes
    for (let s = 0; s < 5; s++) { const x = xa + 0.2 + s * 0.27, n = 3 + Math.floor(r() * 4); for (let k = 0; k < n; k++) labelled(K, r, 'red', x - 0.11, x + 0.11, 0.78 + k * 0.072, 0.78 + k * 0.072 + 0.068, 2.12, 2.4, (r() - 0.5) * 0.08); }
    tray(K, r, 52.1, 0.78, 2.25); tray(K, r, 52.5, 0.78, 2.52);
    for (let k = 0; k < 8; k++) pack(K, r, 50.85 + k * 0.14, 0.78, 2.58);
    for (let k = 0; k < 3; k++) labelled(K, r, 'rangoli', 52.75, 53.05, 0.78 + k * 0.1, 0.87 + k * 0.1, 2.15, 2.45);
    K.item('lamp', [52.9, 1.08, 2.3], 0.42, BRASS);
    for (let k = 0; k < 6; k++) labelled(K, r, k % 2 ? 'kumkum' : 'camphor', 54.92 + k * 0.16, 55.06 + k * 0.16, 0.78, 0.98, 2.15, 2.3);
    for (let k = 0; k < 3; k++) K.box(55.25, 55.75, 0.78 + k * 0.12, 0.9 + k * 0.12, 2.42, 2.66, [0x2d6fd6, 0xd8323a, 0x2d6fd6][k], 0.02);   // stacked baskets
    // cartons under the tables, and along the tent's sides
    for (let k = 0; k < 4; k++) labelled(K, r, 'carton', xa + 0.1 + k * 0.62, xa + 0.65 + k * 0.62, 0, 0.36, 2.3, 2.7);
    for (let k = 0; k < 4; k++) labelled(K, r, 'carton', xa + 0.05, xa + 0.5, k * 0.33, k * 0.33 + 0.32, 3.3, 3.75);
    K.block(xa, 3.2, xa + 0.55, 3.85);
    // the low side tables inside the tent, one each side of the way, with boxed festive goods
    for (const [x0, x1] of [[xa, 51.5], [55.0, xb]]) {
      K.box(x0, x1, 0, 0.72, 4.1, 6.3, 0xf1ece2, 0.02); K.block(x0, 4.05, x1, 6.35);
      for (let z = 4.2; z < 6.2; z += 0.27) for (let x = x0 + 0.12; x < x1 - 0.1; x += 0.26) {
        const kind = pick(r, ['red', 'green', 'rangoli', 'incense']), hh = 0.06 + r() * 0.08;
        for (let k = 0; k < 1 + Math.floor(r() * 3); k++) labelled(K, r, kind, x - 0.11, x + 0.11, 0.72 + k * (hh + 0.004), 0.72 + k * (hh + 0.004) + hh, z - 0.11, z + 0.11, (r() - 0.5) * 0.1);
      }
    }
    // the corner by the aisle: a bucket of peacock feathers and a pot of pampas grass
    const bx = 55.75, bz = 2.98;
    K.cyl(bx, 0, bz, 0.15, 0.34, 0x2d6fd6, { rt: 0.17, seg: 18 });
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + r() * 0.3, tilt = 0.12 + r() * 0.22, len = 0.9 + r() * 0.35;
      const tip = new THREE.Vector3(bx + Math.cos(a) * Math.sin(tilt) * len, 0.3 + Math.cos(tilt) * len, bz + Math.sin(a) * Math.sin(tilt) * len);
      K.rod(new THREE.Vector3(bx, 0.3, bz), tip, 0.004, 0x8a7a4a, 4);
      K.item('plume', [tip.x, tip.y - 0.05, tip.z], [0.045, 0.08, 0.02], 0x1f7a6a, [0, -a, 0]);
      K.item('plume', [tip.x, tip.y - 0.05, tip.z], [0.022, 0.04, 0.024], 0x2a4fb0, [0, -a, 0]);
    }
    K.cyl(55.75, 0, 3.55, 0.17, 0.4, 0xb5603a, { rt: 0.2, seg: 18 });
    for (let k = 0; k < 9; k++) {
      const a = r() * Math.PI * 2, tilt = 0.08 + r() * 0.2, len = 1.05 + r() * 0.4;
      const tip = new THREE.Vector3(55.75 + Math.cos(a) * Math.sin(tilt) * len, 0.38 + Math.cos(tilt) * len, 3.55 + Math.sin(a) * Math.sin(tilt) * len);
      K.rod(new THREE.Vector3(55.75, 0.38, 3.55), tip, 0.006, 0xb8a27a, 4);
      K.item('plume', [tip.x, tip.y + 0.08, tip.z], [0.05, 0.22, 0.05], 0xe9dcc0, [Math.cos(a) * tilt, 0, Math.sin(a) * tilt]);
    }
    K.block(bx - 0.25, bz - 0.25, bx + 0.25, 3.8);
  }

  // Build SW-15 and SW-14. The world skips its own grey-box for this unit (its building, its strip of five-foot way,
  // the columns on its party walls) and fills the walkable grid from the blocks here instead.
  // addGeo(kind, make): a stage's own instanced shape, made once on first use (unit size; items scale it)
  NAV.shopKit = { Kit, rnd, pick, cell, ATLASES, N, labelled, pack, basket, shelfWall, garlandRail, swags, tray, tiles, BRASS, TERRA, PAINT, GARLAND, WOOD, STEEL, GREY, RED, addGeo: (kind, make) => { CUSTOM[kind] = make; }, flushPool };
  NAV.shop = {
    pooja: { buildings: [176326872], columns: (x, z) => [X0, X1].some((c) => Math.abs(c - x) < 0.6) && Math.abs(z - (ZF + 0.25)) < 0.6 },
    buildPooja(root, grid) {
      const shop = new THREE.Group(), tent = new THREE.Group(); root.add(shop, tent);
      const A = new Kit(415), B = new Kit(414);
      shophouse(A, A.r); fiveFoot(A); fiveFootGoods(A, A.r); interior(A, A.r);
      laneDisplay(B, B.r);
      const glow = { lamp: 0x4a3410, bell: 0x4a3410 }, double = ['leaf'];
      const partsA = A.build(shop, { soft: ['gseg', 'cone', 'leaf'], glow, double }), partsB = B.build(tent, { soft: ['gseg', 'cone', 'plume'], glow, double });
      for (const [x0, z0, x1, z1] of A.blocks.concat(B.blocks)) grid.fillRect(x0, z0, x1, z1);
      // the shop's own light: its tubes fill the room and spill onto the five-foot way; bulbs light the tent's garlands
      NAV.lightZone(4, [X0 + 0.1, -0.5, ZS - 0.1], [X1 - 0.1, CEIL + 0.3, ZB], 0xffefd6, 1.25, 0.45);
      NAV.lightZone(5, [X0, -0.5, ZF - 0.3], [X1, GF, ZS + 0.2], 0xffe2b8, 0.55, 0.6);
      NAV.lightZone(6, [50.5, -0.5, 1.9], [56.0, 3.0, 6.7], 0xffe6c0, 0.42, 0.5);
      return {
        'SW-15': partsA.map((m) => ({ m, role: 'look' })),
        'SW-14': partsB.map((m) => ({ m, role: 'look' })),
        box: { 'SW-15': new THREE.Box3(new THREE.Vector3(X0, 0, ZS), new THREE.Vector3(X1, GF, ZB)) },
        // the tent's goods, and the garlands hanging over them
        pick: { 'SW-14': B.pickBoxes().concat(new THREE.Box3(new THREE.Vector3(50.6, 0.5, 2.8), new THREE.Vector3(55.95, 2.45, 5.8))) },
      };
    },
  };
  NAV.shop.pooja.build = (root, grid) => NAV.shop.buildPooja(root, grid);
  NAV.detailed.push(NAV.shop.pooja);
})();
