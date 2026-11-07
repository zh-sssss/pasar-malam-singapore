// The world: OSM massing with walkable five-foot ways, the lane, its yellow lines and one pickable object per stall
// or shop. Festival stalls are line-art holograms built from the stall kit (look B, D28); a shop's own display is
// solid under a hologram tent (D26), and goods that stand past the yellow line are placed there at their real size.
// Solid things use the intro's toon look at night (nav-toon.js). The lane itself is built at final quality by the builds
// registered in NAV.detailed (nav-shop.js, nav-mouth.js, nav-lane1.js … nav-lane5.js), which replace S1's grey-box for
// their buildings; the massing beyond the lane stays S1's.
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const GF = 3.6;            // ground-floor height
  const STOREY = 3.5;
  const RECESS = 1.8;        // five-foot way depth behind the frontage line
  const IHC_RECESS = 2.6;

  const MAT = {
    ground: NAV.toon(0x4a4e5c),
    road: NAV.toon(0x444652),
    walk: NAV.toon(0x9a9a9e),
    aisle: NAV.toon(0xa6a29a),
    ffw: NAV.toon(0xa8735e),
    mural: new THREE.MeshBasicMaterial({ color: 0xd98a7a, transparent: true, opacity: 0.22, depthWrite: false }),
    building: NAV.toon(0xffffff, { vc: true }),
    column: NAV.toon(0xe9e2d6),
    line: new THREE.MeshBasicMaterial({ color: 0xf2c12e }),
    lineFaded: new THREE.MeshBasicMaterial({ color: 0xc9a43a, transparent: true, opacity: 0.55, depthWrite: false }),
    pick: () => new THREE.MeshBasicMaterial({ color: 0xffc56b, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }),
    van: () => NAV.toon(0x6b3fb3, { unique: true }),
    lamp: NAV.toon(0x2f3138),
    lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe2a8 }),
  };
  MAT.lampGlow.userData.ink = false;

  // keep the part of a polygon on one side of the line z = c (Sutherland-Hodgman with one clip edge)
  function clipZ(pts, c, keepGreater) {
    const inside = (p) => (keepGreater ? p[1] >= c : p[1] <= c);
    const out = [];
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k], b = pts[(k + 1) % pts.length];
      const ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) { const t = (c - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, c]); }
    }
    return out;
  }

  function prism(pts, y0, y1, color) {
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y0, 0);
    const c = new THREE.Color(color), n = g.attributes.position.count, cols = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { cols[k * 3] = c.r; cols[k * 3 + 1] = c.g; cols[k * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.setAttribute('inkId', new THREE.BufferAttribute(new Float32Array(n).fill(NAV.inkIdOfColor(c.getHex())), 1));
    return g;
  }
  const strip = (x0, z0, x1, z1, y, mat) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0)), mat);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    return m;
  };
  function signTexture(text, opts = {}) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192;
    const g = cv.getContext('2d');
    g.fillStyle = opts.bg || '#fffdf8'; g.fillRect(0, 0, 1024, 192);
    if (opts.border) { g.strokeStyle = opts.border; g.lineWidth = 10; g.strokeRect(5, 5, 1014, 182); }
    g.fillStyle = opts.ink || '#3a322d';
    let size = 92;
    g.font = `600 ${size}px Fredoka, "Noto Sans Tamil", system-ui, sans-serif`;
    while (g.measureText(text).width > 960 && size > 40) { size -= 4; g.font = `600 ${size}px Fredoka, "Noto Sans Tamil", system-ui, sans-serif`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 512, 100);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  function signBoard(text, width, opts) {
    const h = Math.min(0.5, width * 0.19);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: signTexture(text, opts), transparent: !!opts.transparent, opacity: opts.opacity ?? 1, side: THREE.DoubleSide }));
    return m;
  }
  const signName = (e) => (e.name || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(Jothi|Akshaya) tent: /, '').trim();
  // the readable first line of a sign, or null when the video only shows a fragment of it
  const realSign = (e) => {
    if (!e || !e.sign_text) return null;
    const first = e.sign_text.split('|')[0].replace(/\(.*?\)/g, '').trim();
    return !first || /(\.\.\.|…)/.test(first) ? null : first;
  };
  // the colours of the real signs, read off the stills; a sign not listed here keeps a plain board until its stage
  const SIGN_STYLE = {
    'NE-16': { bg: ['#c9b5f0', '#f3a6d6'], ink: '#2a3f9e' },     // MADDY FLOWERS: lilac-to-pink banner, blue letters
    'NE-18': { bg: '#f59ac4', ink: '#1d1d2b' },                  // the pop-art henna poster
    'NE-20': { bg: '#231a14', ink: '#e6b84a' },                  // AJMIR STORE: dark badge, gold letters
    'SW-14': { bg: '#f4d23a', ink: '#1f1f1f' },                  // the yellow E-INVOICE board
    'SW-05': { bg: '#d8262c', ink: '#ffffff' },                  // LOTUS MANTRA's red header
    'SW-07': { bg: '#f2c230', ink: '#2b2b2b' },                  // LOTUSMANTRA's yellow fascia
    'SW-27': { bg: '#1f6f86', ink: '#ffffff' },                  // Serangoon Air Travel's teal fascia
    JOTHI: { bg: '#1c2238', ink: '#ffffff' },                    // Jothi's navy valance, white letters
  };
  // what a board says: the stall's own sign; for a shop's display, the shop's sign or name; otherwise a quiet description
  function signFor(e, byId) {
    const style = (text) => SIGN_STYLE[e.id] || SIGN_STYLE[e.operator] || (/JOTHI|ஜோதி/.test(text) ? SIGN_STYLE.JOTHI : { bg: '#fffdf8', ink: '#2b2622' });
    const op = e.operator && byId.get(e.operator);
    if (e.kind === 'shop_extension' && op) {
      const s = realSign(op) || realSign(e) || (op.kind === 'local_shop' ? signName(op) : null);
      if (s) return { text: s, real: true, style: style(s) };
    }
    const own = realSign(e);
    if (own) return { text: own, real: true, style: style(own) };
    return { text: signName(e) || NAV.shortId(e.id), real: e.kind === 'local_shop', style: style('') };
  }
  // the yellow line in front of a stall at x: its z, and the inner one's where the line is doubled
  function lineAt(data, side, x) {
    const yl = data.yellow_lines.find((l) => l.side === side && l.style !== 'faded' && l.points.length === 2 && l.points[0][1] === l.points[1][1]
      && x >= Math.min(l.points[0][0], l.points[1][0]) && x <= Math.max(l.points[0][0], l.points[1][0]));
    const z = yl ? yl.points[0][1] : (side === 'SW' ? 1 : -1) * NAV.LINE_Z;
    return { z, inner: yl && yl.style === 'double' ? z - Math.sign(z) * (yl.inner_offset || 0.4) : z };
  }

  // A festival stall's rack standing out past the line: SW-26's rolling rack of table runners, 0.3–1.4 m past the
  // inner line. The rail sits 0.22 m behind the cloths' aisle edge; one end reaches 0.3 m, the other the full distance.
  function rackFor(e, data) {
    if (e.kind !== 'bazaar_stall' || !e.overflow || !e.overflow.past_line_m || e.category !== 'clothing') return null;
    const sgn = e.side === 'SW' ? 1 : -1, zf = e.side === 'SW' ? Math.min(e.z0, e.z1) : Math.max(e.z0, e.z1);
    const line = lineAt(data, e.side, (e.x0 + e.x1) / 2), past = e.overflow.past_line_m;
    const lz = (m) => (line.inner - sgn * m - zf) * sgn + 0.22;
    const near = lz(0.3), far = lz(past), run = Math.sqrt(Math.max(0.25, 1.5 * 1.5 - (near - far) ** 2));
    return { a: [0.9, near], b: [0.9 + run, far], zLine: line.inner, past };
  }

  // many plain-coloured meshes baked into one: colour and ink id per vertex, one draw instead of many
  function bake(meshes) {
    const geos = meshes.map((m) => {
      m.updateMatrix();
      let geo = m.geometry.clone().applyMatrix4(m.matrix); geo = geo.index ? geo.toNonIndexed() : geo;
      const n = geo.attributes.position.count, c = m.material.color, col = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('inkId', new THREE.BufferAttribute(new Float32Array(n).fill(NAV.inkIdOfColor(c.getHex())), 1));
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'color', 'inkId'].includes(k)) geo.deleteAttribute(k);
      return geo;
    });
    return new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(geos), NAV.toon(0xffffff, { vc: true, unique: true }));
  }

  // A shop's goods past the yellow line, at their real size, as S0 logged them. How far they reach is measured; where
  // along the frontage they stood is not, so they stand mid-frontage. Returns what the ground dimension needs (M1).
  function overflowGoods(e, data, g, parts, grid) {
    const sgn = e.side === 'SW' ? 1 : -1, past = e.overflow.past_line_m, xm = (e.x0 + e.x1) / 2;
    const zLine = lineAt(data, e.side, xm).z, out = (m) => zLine - sgn * m;     // z of a face m metres past the line
    const mats = new Map(), mat = (c) => mats.get(c) || mats.set(c, NAV.toon(c, { unique: true })).get(c);
    const made = [], put = (geo, c, x, y, z) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(x, y, z); made.push(m); return m; };
    // a box sx × sy × sz whose aisle face is at zf, lifted by y0; boxes on the ground block the walk
    const box = (sx, sy, sz, c, x, zf, y0 = 0) => {
      put(new THREE.BoxGeometry(sx, sy, sz), c, x, y0 + sy / 2, zf + sgn * sz / 2);
      if (y0 < 1) grid.fillRect(x - sx / 2, Math.min(zf, zf + sgn * sz), x + sx / 2, Math.max(zf, zf + sgn * sz));
    };
    const basket = (x, zf, c, y0 = 0) => box(0.45, 0.24, 0.33, c, x, zf, y0);
    switch (e.id) {
      case 'NE-03':        // a stack of plastic shopping baskets on the line, up to 0.3 m past it
        for (let k = 0; k < 4; k++) basket(xm - 0.6, out(past), 0xd8323a, k * 0.17);
        break;
      case 'NE-07': {      // a wire trolley and potted plants, up to 0.3 m over the line
        const x = xm - 0.5, zf = out(past), wire = 0xb9c0c6;
        for (const dx of [-0.26, 0.26]) for (const dz of [0.02, 0.43]) box(0.025, 0.95, 0.025, wire, x + dx, zf + sgn * dz);
        for (const y of [0.15, 0.5, 0.85]) box(0.55, 0.02, 0.45, wire, x, zf, y);
        for (const dx of [0.55, 1.0]) {
          put(new THREE.CylinderGeometry(0.15, 0.11, 0.28, 14), 0xc0703f, x + dx, 0.14, zf + sgn * 0.16);
          put(new THREE.IcosahedronGeometry(0.24, 1), 0x4e8a4a, x + dx, 0.5, zf + sgn * 0.16);
          grid.fillCircle(x + dx, zf + sgn * 0.16, 0.16);
        }
        break;
      }
      case 'NE-09':        // polystyrene boxes, a crate of clay pots, a mesh bin of peacock feathers: 0.3–0.5 m past
        box(0.55, 0.32, 0.4, 0xf4f4f0, xm - 0.8, out(0.3)); box(0.55, 0.32, 0.4, 0xf4f4f0, xm - 0.8, out(0.3), 0.32);
        box(0.5, 0.3, 0.38, 0xd8823a, xm - 0.1, out(0.35));
        for (let k = 0; k < 6; k++) put(new THREE.CylinderGeometry(0.07, 0.05, 0.1, 10), 0xb5603a, xm - 0.28 + (k % 3) * 0.17, 0.35, out(0.35) + sgn * (0.1 + Math.floor(k / 3) * 0.17));
        put(new THREE.CylinderGeometry(0.17, 0.16, 0.6, 16, 1, true), 0x3d6fb5, xm + 0.55, 0.3, out(past) + sgn * 0.17);
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2, f = put(new THREE.CylinderGeometry(0.004, 0.006, 0.9, 4), 0x2f8f6a, xm + 0.55 + Math.cos(a) * 0.06, 0.95, out(past) + sgn * 0.17 + Math.sin(a) * 0.06);
          f.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18);
        }
        grid.fillCircle(xm + 0.55, out(past) + sgn * 0.17, 0.18);
        break;
      case 'NE-12': {      // the shelving ends stand on the line; heart lamps and garlands hang 0.3 m out over it
        const x = xm;
        box(0.9, 2.0, 0.45, 0xdfe3e7, x, zLine);
        put(new THREE.BoxGeometry(0.03, 0.03, past + 0.1), 0xdfe3e7, x, 2.05, zLine - sgn * (past - 0.1) / 2);
        for (let k = 0; k < 3; k++) {
          put(new THREE.BoxGeometry(0.004, 0.32, 0.004), 0x333333, x - 0.25 + k * 0.25, 1.88, out(past) + sgn * 0.04);
          put(new THREE.SphereGeometry(0.09, 14, 10), [0xe23a5a, 0xf2b53a, 0xe23a5a][k], x - 0.25 + k * 0.25, 1.65, out(past) + sgn * 0.09);
        }
        break;
      }
      case 'NE-13':        // blue shopping baskets and a red crate straddle the line, 0.1–0.3 m out
        basket(xm - 1.0, out(0.2), 0x2d6fd6); basket(xm - 0.45, out(0.1), 0x2d6fd6); basket(xm - 0.45, out(0.1), 0x2d6fd6, 0.17);
        box(0.5, 0.3, 0.38, 0xd8323a, xm + 0.3, out(past));
        break;
      default: return null;
    }
    const goods = bake(made); g.add(goods); parts.push({ m: goods, role: 'solid' });
    // mesh: the goods themselves, which the before/after view pulls back inside the line and the AR replays move
    return { e, x: xm, zLine, zFront: out(past), past, overhang: e.id === 'NE-12', mesh: goods };
  }

  NAV.buildWorld = function (scene, data, holo) {
    const frontById = new Map(data.frontages.map((f) => [f.id ?? f.osm_id, f]));
    const byId = new Map(data.entities.map((e) => [e.id, e]));
    const QUIET = { bg: 'rgba(0,0,0,0)', ink: '#a9eefc', transparent: true, opacity: 0.7 };
    const grid = new NAV.Grid(-22, -30, 128, 30, 0.25);
    const world = { pickables: [], parts: new Map(), entities: new Map(), labels: [], grid, overflow: [] };
    const root = new THREE.Group(); scene.add(root);

    // ---- ground --------------------------------------------------------------------------------------------
    root.add(strip(-80, -90, 200, 90, -0.02, MAT.ground));
    root.add(strip(-17, -90, -1.5, 90, -0.01, MAT.road));          // Serangoon Road carriageway
    root.add(strip(116.5, -90, 124, 90, -0.01, MAT.road));         // Clive Street
    root.add(strip(-1.5, -9, 116.5, 9, 0.0, MAT.walk));            // the paved lane and its kerbs
    root.add(strip(-22, -90, -17, 90, 0.0, MAT.walk));             // far footpath of Serangoon Road
    root.add(strip(0, -NAV.LINE_Z, 116, NAV.LINE_Z, 0.004, MAT.aisle));
    for (const gnd of data.ground) {
      if (gnd.kind === 'mural' || gnd.kind === 'kolam') root.add(strip(gnd.x0, gnd.z0, gnd.x1, gnd.z1, 0.006, MAT.mural));
    }

    // ---- buildings: upper floors on the full footprint, ground floor set back to leave the five-foot way open
    const geoms = [], columns = [];
    let ihcGroup = null;
    // buildings built at final quality (nav-shop.js, nav-mouth.js, nav-lane1.js) replace their grey-box, their five-foot way and columns
    const DETAILED = NAV.detailed;
    const skipBuilding = new Set(DETAILED.flatMap((d) => d.buildings)), skipColumn = (x, z) => DETAILED.some((d) => d.columns(x, z));
    data.buildings.forEach((b, n) => {
      if (skipBuilding.has(b.id)) return;
      const levels = Number(b.levels) || 2;
      const top = GF + (levels - 1) * STOREY + 0.9;
      const tone = 0.83 + ((b.id * 2654435761) % 1000) / 1000 * 0.08;
      const col = new THREE.Color().setHSL(0.09, 0.16, tone * 0.86);
      const f = frontById.get(b.id);
      let ground = b.pts;
      if (f) {
        const rec = b.name === 'Indian Heritage Centre' ? IHC_RECESS : RECESS;
        ground = f.side === 'SW' ? clipZ(b.pts, f.z + rec, true) : clipZ(b.pts, f.z - rec, false);
        const zc = f.side === 'SW' ? f.z + 0.25 : f.z - 0.25;
        const span = f.x1 - f.x0, nCols = Math.max(1, Math.round(span / 5));
        for (let k = 0; k <= nCols; k++) columns.push([f.x0 + (span * k) / nCols, zc]);
        root.add(strip(f.x0, f.z, f.x1, f.side === 'SW' ? f.z + rec : f.z - rec, 0.008, MAT.ffw));
      }
      const parts = [];
      if (ground.length >= 3) parts.push(prism(ground, 0, GF, col));
      parts.push(prism(b.pts, GF, top, col));
      grid.fillPolygon(ground.length >= 3 ? ground : b.pts);
      if (b.name === 'Indian Heritage Centre') {
        const g = THREE.BufferGeometryUtils.mergeGeometries(parts);
        ihcGroup = new THREE.Mesh(g, NAV.toon(0x9a8fb8, { unique: true }));
        root.add(ihcGroup);
      } else geoms.push(...parts);
    });
    root.add(new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(geoms), MAT.building));
    const seen = [];
    const colGeo = new THREE.BoxGeometry(0.38, GF, 0.38);
    const colMesh = new THREE.InstancedMesh(colGeo, MAT.column, columns.length);
    let nc = 0;
    for (const [x, z] of columns) {
      if (seen.some(([sx, sz]) => Math.abs(sx - x) < 0.6 && Math.abs(sz - z) < 0.6)) continue;
      if (skipColumn(x, z)) continue;
      seen.push([x, z]);
      colMesh.setMatrixAt(nc++, new THREE.Matrix4().makeTranslation(x, GF / 2, z));
      grid.fillRect(x - 0.2, z - 0.2, x + 0.2, z + 0.2);
    }
    colMesh.count = nc; root.add(colMesh);

    // ---- yellow lines ----------------------------------------------------------------------------------------
    const lineGeo = (pts, off) => {
      const out = [];
      for (let k = 1; k < pts.length; k++) {
        const [ax, az] = pts[k - 1], [bx, bz] = pts[k];
        const len = Math.hypot(bx - ax, bz - az);
        const g = new THREE.PlaneGeometry(len, 0.1); g.rotateX(-Math.PI / 2);
        g.rotateY(-Math.atan2(bz - az, bx - ax));
        g.translate((ax + bx) / 2, 0.012, (az + bz) / 2 + off);
        out.push(g);
      }
      return out;
    };
    const bright = [], faded = [];
    for (const yl of data.yellow_lines) {
      (yl.style === 'faded' ? faded : bright).push(...lineGeo(yl.points, 0));
      if (yl.style === 'double') {
        const off = (yl.inner_offset || 0.4) * (yl.points[0][1] > 0 ? -1 : 1);
        faded.push(...lineGeo(yl.points, off));
      }
    }
    root.add(new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(bright), MAT.line));
    if (faded.length) root.add(new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(faded), MAT.lineFaded));

    // ---- stalls, shops and landmarks ---------------------------------------------------------------------------
    // Each stall brings its own tent from the kit, so the tent rows are drawn module by module.
    // the detailed shops: per entity id, the parts that make it; per local shop, the box that picks it
    const pooja = { box: {}, pick: {} };
    const built = DETAILED.map((d) => d.build(root, grid));
    NAV.shopKit.flushPool(root);                     // the shops' loose parts in shared materials, one draw per material and 24 m
    for (const res of built) for (const [k, v] of Object.entries(res)) { if (k === 'box' || k === 'pick') Object.assign(pooja[k], v); else pooja[k] = v; }
    for (const e of data.entities) {
      const xa = Math.min(e.x0, e.x1), xb = Math.max(e.x0, e.x1), za = Math.min(e.z0, e.z1), zb = Math.max(e.z0, e.z1);
      const w = xb - xa, d = zb - za, xc = (xa + xb) / 2, zc = (za + zb) / 2;
      const sgn = e.side === 'SW' ? 1 : -1;              // +z is the SW side
      const front = e.side === 'SW' ? za : zb;            // the edge that faces the aisle
      const parts = [];
      const g = new THREE.Group(); g.userData.entityId = e.id; root.add(g);
      const cat = NAV.CAT[e.category] || NAV.CAT.other;
      // routes end across the aisle's centre line, about 2.8 m from the stall front, so the whole stall is in view
      const accessZ = -sgn * 0.9;
      let access = [xc, accessZ], label = [xc, 3.0, zc], hol = null;
      // what the brackets lock onto, and the hologram's extent
      const box = new THREE.Box3(new THREE.Vector3(xa, 0, za), new THREE.Vector3(xb, 2.55, zb));

      if (e.kind === 'bazaar_stall' || e.kind === 'other') {
        // a festival stall: a line-art hologram from the stall kit
        const rack = rackFor(e, data);
        const at = (p) => [xa + p[0], front + sgn * p[1]];                 // kit coordinates on the ground
        if (rack) for (const p of [rack.a, rack.b]) { const [x, z] = at(p); box.expandByPoint(new THREE.Vector3(x, 0, z - sgn * 0.25)); }
        hol = holo.addStall(e, NAV.kit.build(e, d, e.kind === 'other' ? null : signFor(e, byId), { platform: e.id === 'SW-09', rack }), box);
        g.add(hol.group);
        parts.push({ m: hol.proxy, role: 'proxy' });
        grid.fillRect(xa, e.side === 'SW' ? za + 0.6 : za, xb, e.side === 'SW' ? zb : zb - 0.6);
        if (rack) {
          // the rack and its cloths block the walk; the ground dimension measures its far end from the inner line
          const [ax, az] = at(rack.a), [bx, bz] = at(rack.b), l = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / l * 0.28, nz = (bx - ax) / l * 0.28;
          grid.fillPolygon([[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]]);
          world.overflow.push({ e, x: bx, zLine: rack.zLine, zFront: rack.zLine - sgn * rack.past, past: rack.past, inner: true });
        }
        label = [xc, 2.9, zc];
      } else if (e.kind === 'shop_extension') {
        // a local shop's own goods, solid (S4–S7 build them out), under a hologram tent where it stands in the tent row
        const solid = NAV.toon(cat.color, { unique: true });
        const counter = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, 0.9, Math.min(0.8, d * 0.3)), solid);
        counter.position.set(xc, 0.45, front + sgn * 0.5);
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 2.0, 0.5), solid);
        shelf.position.set(xc, 1.0, (e.side === 'SW' ? zb : za) - sgn * 0.35);
        const mid = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.6, w - 1.6), 0.75, Math.max(0.4, d * 0.28)), solid);
        mid.position.set(xc, 0.38, zc);
        const goods = new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries([counter, shelf, mid].map((m) => { m.updateMatrix(); return m.geometry.applyMatrix4(m.matrix); })), solid);
        if (pooja[e.id]) parts.push(...pooja[e.id]);
        else { g.add(goods); parts.push({ m: goods, role: 'solid' }); }
        if (e.overflow && e.overflow.past_line_m) {
          const o = overflowGoods(e, data, g, parts, grid);
          if (o) { world.overflow.push(o); box.expandByPoint(new THREE.Vector3(xc, 0, o.zFront)); }
        }
        if (e.zone === 'tent_row' || NAV.tentFor.has(e.id)) { hol = holo.addStall(e, NAV.kit.build(e, d), box); g.add(hol.group); }
        const walkIn = !!pooja[e.id];                    // its tent is walked through to the shop behind
        // picked by the goods themselves where a stage has built them, else by the whole display
        const boxes = pooja.pick[e.id] || [new THREE.Box3(new THREE.Vector3(xa, 0, za), new THREE.Vector3(xb, 2.4, zb))];
        for (const b of boxes) {
          const sz = b.getSize(new THREE.Vector3()), pick = new THREE.Mesh(new THREE.BoxGeometry(sz.x, sz.y, sz.z), MAT.pick());
          pick.position.copy(b.getCenter(new THREE.Vector3())); pick.visible = false; g.add(pick); parts.push({ m: pick, role: 'proxy' });
        }
        const s = signFor(e, byId);
        // the garland tent's yellow board is a small card at its NW corner; the other displays still carry S1's boards
        const sign = signBoard(s.text, walkIn ? 1.3 : Math.min(w - 0.3, 3.2), s.real ? s.style : QUIET);
        sign.position.set(walkIn ? xa + 0.85 : xc, walkIn ? 2.3 : 2.25, front - sgn * 0.03); sign.rotation.y = e.side === 'SW' ? Math.PI : 0;
        if (walkIn && e.id !== 'SW-14') sign.visible = false;   // a detailed display carries its shop's own signs
        g.add(sign); parts.push({ m: sign, role: 'sign' });
        if (!walkIn) grid.fillRect(xa, e.side === 'SW' ? za + 0.6 : za, xb, e.side === 'SW' ? zb : zb - 0.6);
        label = [xc, 2.9, zc];
      } else if (e.kind === 'local_shop' && pooja[e.id]) {
        // built at final quality: an invisible box over its room picks it; the shop itself warms on hover
        const pb = pooja.box[e.id], size = pb.getSize(new THREE.Vector3()), mid = pb.getCenter(new THREE.Vector3());
        const pick = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), MAT.pick()); pick.position.copy(mid); pick.visible = false;
        const face = new THREE.Mesh(new THREE.BoxGeometry(size.x, 3.4, 0.3), MAT.pick()); face.position.set(mid.x, GF + 1.8, front + sgn * 0.1); face.visible = false;   // its shophouse front
        g.add(pick, face); parts.push({ m: pick, role: 'proxy' }, { m: face, role: 'proxy' }, ...pooja[e.id]);
        const ext = data.entities.find((o) => o.operator === e.id && o.kind === 'shop_extension');
        access = ext ? [(ext.x0 + ext.x1) / 2, accessZ] : [xc, accessZ];
        label = [xc, GF + 0.3, front];
        box.copy(pb);
      } else if (e.kind === 'local_shop') {
        // the shop room itself sits behind the five-foot way; it lights up on hover
        const f = data.frontages.find((fr) => fr.side === e.side && xc >= fr.x0 - 0.5 && xc <= fr.x1 + 0.5);
        const fz = f ? f.z : e.side === 'SW' ? za : zb;
        const z0 = fz + sgn * RECESS, z1 = fz + sgn * (RECESS + 5);
        const pick = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, GF - 0.3, Math.abs(z1 - z0)), MAT.pick());
        pick.position.set(xc, (GF - 0.3) / 2, (z0 + z1) / 2); pick.visible = false;
        g.add(pick); parts.push({ m: pick, role: 'pick' });
        const s = signFor(e, byId);
        const sign = signBoard(s.text, Math.min(w - 0.4, 4.4), SIGN_STYLE[e.id] || (/JOTHI|ஜோதி/.test(s.text) ? SIGN_STYLE.JOTHI : { bg: '#2f2a26', ink: '#ffe9c4' }));
        sign.position.set(xc, GF - 0.45, fz - sgn * 0.05); sign.rotation.y = e.side === 'SW' ? Math.PI : 0;
        g.add(sign); parts.push({ m: sign, role: 'sign' });
        const ext = data.entities.find((o) => o.operator === e.id && o.kind === 'shop_extension');
        access = ext ? [(ext.x0 + ext.x1) / 2, accessZ] : [xc, accessZ];
        label = [xc, GF + 0.3, fz];
        box.set(new THREE.Vector3(xa + 0.1, 0, Math.min(z0, z1)), new THREE.Vector3(xb - 0.1, GF - 0.3, Math.max(z0, z1)));
      } else if (e.kind === 'landmark') {
        if (pooja[e.id]) {
          // built at final quality by a stage: invisible boxes over it pick it, the thing itself warms on hover
          const boxes = pooja.pick[e.id] || [pooja.box[e.id]];
          for (const b of boxes) {
            const sz = b.getSize(new THREE.Vector3()), pick = new THREE.Mesh(new THREE.BoxGeometry(sz.x, sz.y, sz.z), MAT.pick());
            pick.position.copy(b.getCenter(new THREE.Vector3())); pick.visible = false; g.add(pick); parts.push({ m: pick, role: 'proxy' });
          }
          parts.push(...pooja[e.id]);
          box.copy(boxes.reduce((u, b) => u.union(b), new THREE.Box3()));
          // routes to it end on its own half of the aisle (across from the van, a stall's rack reaches past the centre line)
          if (e.id === 'LM-01') { access = [111.5, -3.6]; label = [92, 16, -14]; } else { access = [xc, sgn * 0.6]; label = [xc, box.max.y + 0.4, zc]; }
        } else if (e.id === 'LM-01' && ihcGroup) {
          ihcGroup.userData.entityId = e.id; g.add(ihcGroup.clone()); ihcGroup.visible = false;
          g.children[0].material = g.children[0].material.clone();
          parts.push({ m: g.children[0], role: 'building' });
          access = [111.5, -3.6]; label = [92, 16, -14];
          box.setFromObject(g.children[0]);
        } else if (e.id === 'NE-21') {
          const van = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.3, 1.95), MAT.van());
          van.position.set(xc, 1.25, zc);
          g.add(van); parts.push({ m: van, role: 'solid' });
          grid.fillRect(xa, za, xb, zb);
          access = [xc, 0.9]; label = [xc, 2.9, zc];
          box.setFromObject(van);
        } else continue;
      }
      const rec = { e, group: g, parts, access, label, box, holo: hol };
      world.entities.set(e.id, rec);
      if (!e.interactive) continue;
      for (const p of parts) { p.m.userData.entityId = e.id; if (p.role !== 'look') world.pickables.push(p.m); }
    }

    // ---- street furniture and the light-up arches over Serangoon Road ---------------------------------------------
    const posts = [], glows = [];
    for (const gnd of data.ground) {
      if (gnd.kind !== 'lamp') continue;
      posts.push(new THREE.CylinderGeometry(0.07, 0.1, 4.2, 10).translate(gnd.x, 2.1, gnd.z));
      glows.push(new THREE.SphereGeometry(0.22, 16, 12).translate(gnd.x, 4.35, gnd.z));
      grid.fillCircle(gnd.x, gnd.z, 0.2);
    }
    if (posts.length) root.add(new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(posts), MAT.lamp), new THREE.Mesh(THREE.BufferGeometryUtils.mergeGeometries(glows), MAT.lampGlow));
    const archCols = [0xff4fb3, 0xffa531, 0x6ee7ff, 0xb57bff];
    [-26, -14, -2, 10, 22].forEach((z, k) => {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-16, 0, z), new THREE.Vector3(-15, 5.4, z), new THREE.Vector3(-9, 7.6, z), new THREE.Vector3(-3, 5.4, z), new THREE.Vector3(-2, 0, z)]);
      const glow = new THREE.MeshBasicMaterial({ color: archCols[k % 4] }); glow.userData.ink = false;
      root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.09, 6), glow));
    });

    // warm light from the shops along both five-foot ways, and the tents' bulbs over the stalls (nav-toon.js zones)
    NAV.lightZone(0, [16, -0.5, 6.3], [111, 3.9, 9.4], 0xffb070, 0.5, 0.8);
    NAV.lightZone(1, [11, -0.5, -9.4], [64.5, 3.9, -6.2], 0xffb070, 0.5, 0.8);
    NAV.lightZone(2, [17, -0.5, 1.6], [110, 3.3, 7.0], 0xffd9a8, 0.26, 0.6);
    NAV.lightZone(3, [23, -0.5, -7.0], [108, 3.3, -1.6], 0xffd9a8, 0.26, 0.6);

    // the walkable area ends at the model's edge: keep walkers on the streets near the lane's two mouths
    grid.fillRect(-22, -30, -17.5, 30); grid.fillRect(124, -30, 128, 30);
    grid.finish(0.35);
    world.root = root;
    return world;
  };
})();
