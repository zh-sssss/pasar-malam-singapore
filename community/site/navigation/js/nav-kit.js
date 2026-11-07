// Stall kit: detailed festival stalls built from parts, so one look (solid or hologram) can be applied per part.
// Every stall returns buckets: structure (frame, canopy, walls), content (furniture, goods, instanced goods) and signs.
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const M4 = () => new THREE.Matrix4();
  const frontZ = (e) => (Math.abs(e.z0) < Math.abs(e.z1) ? e.z0 : e.z1);     // the edge that faces the aisle

  // geometry with a per-vertex colour, so a bucket merges into one mesh whatever its parts' colours
  function coloured(g, color) {
    const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    return g.index ? g.toNonIndexed() : g;
  }

  class Builder {
    // x0..x1 along the lane; zf is the aisle-side edge, depth runs into the stall towards the shopfront
    constructor(x0, x1, zf, depth, side) {
      this.x0 = x0; this.w = x1 - x0; this.zf = zf; this.d = depth; this.s = side === 'NE' ? -1 : 1;
      this.b = { frame: [], canopy: [], walls: [], furniture: [], goods: [] };
      this.inst = []; this.signs = [];
    }
    // local (lx along the lane from x0, ly up, lz into the stall) to world
    P(lx, ly, lz) { return new THREE.Vector3(this.x0 + lx, ly, this.zf + this.s * lz); }
    add(bucket, g, color, at, rotY = 0) {
      const m = M4().makeRotationY(rotY).setPosition(at);
      g.applyMatrix4(m); this.b[bucket].push(coloured(g, color));
    }
    box(bucket, lx, ly, lz, sx, sy, sz, color) { this.add(bucket, new THREE.BoxGeometry(sx, sy, sz), color, this.P(lx, ly, lz)); }
    rod(bucket, a, b, r, color, seg = 8) {           // a cylinder between two world points
      const len = a.distanceTo(b), g = new THREE.CylinderGeometry(r, r, len, seg, 1);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      g.applyMatrix4(M4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
      this.b[bucket].push(coloured(g, color));
    }
    quad(bucket, a, b, c, d, color) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap((p) => [p.x, p.y, p.z]), 3));
      g.computeVertexNormals();
      this.b[bucket].push(coloured(g, color));
    }
    instanced(name, geo, color, items, bucket = 'goods') {   // items: [[x, y, z, rotY, scale, colour?, yScale?], ...] in world space
      this.inst.push({ name, geo, color, items, bucket });
    }

    // white gable tent module: poles, eaves, rafters, ridge, scalloped valance, roof skin
    tent({ eave = 2.45, ridge = 3.12, valance = true, roof = 0xf4f1ea, frame = 0xd9dde2, trim = 0xffffff } = {}) {
      const { w, d } = this, r = 0.028, zm = d / 2;
      for (const lx of [0.03, w - 0.03]) for (const lz of [0.03, d - 0.03]) this.rod('frame', this.P(lx, 0, lz), this.P(lx, eave, lz), r, frame);
      for (const lz of [0.03, d - 0.03]) this.rod('frame', this.P(0, eave, lz), this.P(w, eave, lz), r, frame);
      for (const lx of [0.03, w - 0.03]) {
        this.rod('frame', this.P(lx, eave, 0.03), this.P(lx, ridge, zm), r * 0.9, frame);
        this.rod('frame', this.P(lx, ridge, zm), this.P(lx, eave, d - 0.03), r * 0.9, frame);
        this.rod('frame', this.P(lx, eave, 0.03), this.P(lx, eave, d - 0.03), r * 0.7, frame);   // tie
      }
      this.rod('frame', this.P(0, ridge, zm), this.P(w, ridge, zm), r, frame);
      // two roof slopes as thin skins, each a quad between the eave and the ridge
      this.quad('canopy', this.P(0, eave, 0), this.P(w, eave, 0), this.P(w, ridge, zm), this.P(0, ridge, zm), roof);
      this.quad('canopy', this.P(0, ridge, zm), this.P(w, ridge, zm), this.P(w, eave, d), this.P(0, eave, d), roof);
      if (valance) {
        // scalloped valance along the aisle-side eave: the festival tents' white wavy trim
        const sh = new THREE.Shape(), n = Math.max(3, Math.round(w / 0.32)), sw = w / n, h = 0.26;
        sh.moveTo(0, 0); sh.lineTo(w, 0); sh.lineTo(w, -h * 0.55);
        for (let k = n; k > 0; k--) sh.quadraticCurveTo(sw * (k - 0.5), -h * 1.25, sw * (k - 1), -h * 0.55);
        sh.lineTo(0, 0);
        const g = new THREE.ShapeGeometry(sh, 6);
        g.translate(this.x0, eave + 0.02, this.zf - this.s * 0.01);
        this.b.canopy.push(coloured(g, trim));
      }
      return this;
    }
    // a run of n modules side by side, as the long tents are put up
    tentRow(n, opts) {
      const x0 = this.x0, w = this.w, mw = w / n;
      for (let k = 0; k < n; k++) { this.x0 = x0 + k * mw; this.w = mw; this.tent(opts); }
      this.x0 = x0; this.w = w;
      return this;
    }
    // a hanging tarp or plastic sheet across one end, with soft vertical folds
    sheet(lx, color, { top = 2.4, folds = 7, depth = this.d, tied = false } = {}) {
      const g = new THREE.PlaneGeometry(depth, top, 24, 4), p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const u = p.getX(k) / depth + 0.5;
        p.setZ(k, Math.sin(u * Math.PI * folds) * 0.035 * (tied ? (1 - u) : 1));
        if (tied) p.setX(k, p.getX(k) * (0.35 + 0.65 * (1 - (p.getY(k) / top + 0.5) * 0.4)));
      }
      g.computeVertexNormals();
      g.applyMatrix4(M4().makeRotationY(Math.PI / 2));
      g.translate(this.x0 + lx, top / 2, this.zf + this.s * depth / 2);
      this.b.walls.push(coloured(g, color));
    }
    // steel shelving unit: uprights, boards; returns the board heights so goods can sit on them
    shelving(lx, lz, sx, sz, h, levels, color = 0xe8e9ec) {
      const ys = [];
      for (const ox of [0.02, sx - 0.02]) for (const oz of [0.02, sz - 0.02]) this.box('furniture', lx + ox, h / 2, lz + oz, 0.035, h, 0.035, color);
      for (let k = 0; k < levels; k++) {
        const y = 0.12 + (k * (h - 0.2)) / (levels - 1);
        this.box('furniture', lx + sx / 2, y, lz + sz / 2, sx, 0.025, sz, color);
        this.box('furniture', lx + sx / 2, y + 0.03, lz + 0.01, sx, 0.05, 0.012, 0xffffff);   // price-strip lip
        ys.push(y + 0.0125);
      }
      return ys;
    }
    table(lx, lz, sx, sz, h, top = 0xf2efe8, skirt = null) {
      this.box('furniture', lx + sx / 2, h - 0.02, lz + sz / 2, sx, 0.04, sz, top);
      for (const ox of [0.05, sx - 0.05]) for (const oz of [0.05, sz - 0.05]) this.box('furniture', lx + ox, (h - 0.04) / 2, lz + oz, 0.035, h - 0.04, 0.035, 0x9aa0a6);
      if (skirt) {
        const g = new THREE.PlaneGeometry(sx, h - 0.06, 18, 1), p = g.attributes.position;
        for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin((p.getX(k) / sx + 0.5) * Math.PI * 9) * 0.012);
        g.computeVertexNormals();
        if (this.s > 0) g.applyMatrix4(M4().makeRotationY(Math.PI));
        g.translate(this.x0 + lx + sx / 2, (h - 0.06) / 2, this.zf + this.s * (lz - 0.005));
        this.b.furniture.push(coloured(g, skirt));
      }
      return h;
    }
    sign(text, lx, ly, lz, width, opts = {}) { this.signs.push({ text, pos: this.P(lx, ly, lz), width, opts, rotY: this.s > 0 ? Math.PI : 0 }); }

    finish() {
      const out = { meshes: {}, instanced: [], signs: [] };
      for (const [k, list] of Object.entries(this.b)) if (list.length) out.meshes[k] = THREE.BufferGeometryUtils.mergeGeometries(list);
      out.instanced = this.inst; out.signs = this.signs;
      return out;
    }
  }

  // ---- goods ---------------------------------------------------------------------------------------------------
  const JAR_FILL = [0xe3b25a, 0xc98a3c, 0xf0d28a, 0x9c5a2e, 0xe2c27a, 0xd8743c, 0xf3e3b4, 0x8a6a3a, 0xe9a64a];
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  function snackStall(e, sideDepth) {
    const B = new Builder(e.x0, e.x1, frontZ(e), sideDepth, e.side), r = rnd(97);
    const { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 });
    // steel truss along the front eave carrying the banners
    const ty = 2.32;
    for (const oy of [0, 0.22]) B.rod('frame', B.P(0, ty + oy, 0.08), B.P(w, ty + oy, 0.08), 0.022, 0xcfd3d8);
    for (let k = 0; k < Math.round(w / 0.22); k++) {
      const xa = k * 0.22, xb = xa + 0.22;
      B.rod('frame', B.P(xa, ty, 0.08), B.P(Math.min(w, xb), ty + 0.22, 0.08), 0.008, 0xcfd3d8, 5);
    }
    B.sign("BAWA'S DELICACY PTE LTD", w / 2, 2.43, -0.04, Math.min(w - 0.3, 3.4), { bg: '#f7d23a', ink: '#c0222b', sub: 'HP: 9007 9354 · www.bawas.com.sg', subInk: '#1f2a44', h: 0.52 });
    // the second banner, black vinyl with gold letters, hung from the truss further back
    B.sign("BAWA'S DELICACY PTE LTD", w / 2, 2.62, d - 1.0, Math.min(w - 0.6, 2.8), { bg: '#17140f', ink: '#e2b64a', h: 0.34 });
    B.sheet(w - 0.02, 0x2f6fc0, { folds: 9 });                       // blue tarp on the far side
    B.sheet(0.03, 0xdfeaf2, { folds: 5, tied: true, depth: 0.9 });     // clear plastic curtain, tied back
    // back shelving, two units, jars on four boards
    const units = [[0.12, w / 2 - 0.16], [w / 2 + 0.04, w / 2 - 0.16]];
    const jars = [], lids = [];
    for (const [ux, uw] of units) {
      const ys = B.shelving(ux, d - 0.62, uw, 0.45, 2.05, 5);
      for (const y of ys.slice(0, 4)) {
        const n = Math.floor(uw / 0.155);
        for (let row = 0; row < 2; row++) for (let k = 0; k < n; k++) {
          const lx = ux + 0.08 + k * 0.155, lz = d - 0.62 + 0.12 + row * 0.2;
          const tall = 0.18 + (r() < 0.25 ? 0.06 : 0);
          const p = B.P(lx, y + tall / 2, lz), fill = JAR_FILL[Math.floor(r() * JAR_FILL.length)];
          jars.push([p.x, p.y, p.z, 0, 1, fill, tall / 0.2]);
          lids.push([p.x, y + tall + 0.017, p.z, 0, 1, r() < 0.5 ? 0xd2262e : 0xe8b53a]);
        }
      }
    }
    // curved glass case on a table at the front, with trays of sweets
    B.table(0.25, 0.25, 1.7, 0.62, 0.8, 0xf3efe6, 0xc0222b);
    B.box('furniture', 1.1, 0.83, 0.56, 1.6, 0.04, 0.55, 0xd9d4ca);
    const glass = new THREE.CylinderGeometry(0.42, 0.42, 1.58, 18, 1, true, 0, Math.PI / 2);
    glass.applyMatrix4(M4().makeRotationZ(Math.PI / 2));
    B.add('furniture', glass, 0xbfe9ff, B.P(1.1, 0.85, 0.72), B.s > 0 ? Math.PI : 0);
    for (let k = 0; k < 6; k++) B.box('goods', 0.42 + k * 0.26, 0.9, 0.62, 0.22, 0.04, 0.3, [0xf2c94c, 0xe07a3c, 0xf7e7b0, 0xb5652b][k % 4]);
    // second front table: a pyramid of jars, the "3 FOR $10" card, a cash box, baskets underneath
    B.table(2.1, 0.22, Math.max(1.2, w - 2.35), 0.62, 0.78, 0xf3efe6, 0xd8a72a);
    const tw = Math.max(1.2, w - 2.35);
    for (let tier = 0; tier < 3; tier++) {
      const n = 6 - tier * 2;
      for (let k = 0; k < n; k++) {
        const lx = 2.1 + tw / 2 - (n - 1) * 0.08 + k * 0.16, y = 0.78 + tier * 0.215 + 0.1;
        const p = B.P(lx, y, 0.5 - tier * 0.04);
        jars.push([p.x, p.y, p.z, 0, 1, JAR_FILL[(k + tier) % JAR_FILL.length], 1]);
        lids.push([p.x, y + 0.117, p.z, 0, 1, 0xd2262e]);
      }
    }
    B.sign('3 FOR $10', 2.1 + tw - 0.25, 0.98, 0.32, 0.36, { bg: '#ffffff', ink: '#d0202a', h: 0.22, card: true });
    B.box('goods', 2.35, 0.86, 0.6, 0.26, 0.12, 0.18, 0x3a3f46);                                    // cash box
    for (let k = 0; k < 3; k++) B.box('goods', 2.4 + k * 0.42, 0.13 + 0, 0.5, 0.38, 0.26, 0.3, [0x2d7fd6, 0xe23a3a, 0x2d7fd6][k]); // baskets
    for (let k = 0; k < 4; k++) B.box('goods', w - 0.4, 0.2 + k * 0.38, 1.6, 0.5, 0.36, 0.42, 0xc9a77a);                           // cartons
    B.box('furniture', w - 1.0, 0.25, 1.4, 0.32, 0.5, 0.32, 0xe14b4b);                                                                 // stool
    // hanging LED bulbs on cords from the ridge
    const bulbs = [];
    for (let k = 0; k < 4; k++) {
      const lx = (w * (k + 0.5)) / 4, top = B.P(lx, 3.0, d * 0.42), low = B.P(lx, 2.38, d * 0.42);
      B.rod('goods', top, low, 0.006, 0x222222, 4);
      bulbs.push([low.x, low.y - 0.06, low.z, 0, 1, 0xfff6d8]);
    }
    B.instanced('jars', new THREE.CylinderGeometry(0.065, 0.065, 0.2, 14, 1), 0xffffff, jars);
    B.instanced('lids', new THREE.CylinderGeometry(0.07, 0.07, 0.034, 14, 1), 0xffffff, lids);
    B.instanced('bulbs', new THREE.SphereGeometry(0.06, 12, 8), 0xfff6d8, bulbs);
    return B.finish();
  }

  const GARLAND = [[0xf7a21b, 0xf5c518], [0xf5c518, 0xffffff], [0xe2342d, 0xf7a21b], [0xffffff, 0xe85c9a], [0xf7a21b, 0xe2342d], [0xffffff, 0xf5c518]];
  function garlandStall(e, sideDepth, sign) {
    const B = new Builder(e.x0, e.x1, frontZ(e), sideDepth, e.side), r = rnd(31);
    const { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 });
    eaveSign(B, sign);
    B.sheet(w - 0.02, 0x3a7fd0, { folds: 8 });
    // three rails of hanging garlands: marigold strands of beads, a flower tassel at the foot
    const beads = [], tassels = [];
    [0.55, 1.45, 2.35].forEach((lz, ri) => {
      B.rod('furniture', B.P(0.1, 2.32, lz), B.P(w - 0.1, 2.32, lz), 0.012, 0xb9bec4);
      const n = Math.floor((w - 0.3) / 0.11);
      for (let k = 0; k < n; k++) {
        const lx = 0.18 + k * 0.11 + (r() - 0.5) * 0.02, len = 1.0 + r() * 0.7 + (ri === 0 ? -0.15 : 0);
        const pal = GARLAND[Math.floor(r() * GARLAND.length)], step = 0.042, count = Math.floor(len / step);
        for (let b = 0; b < count; b++) {
          const p = B.P(lx + Math.sin(b * 0.7 + k) * 0.004, 2.3 - b * step, lz + Math.cos(b * 0.5 + k) * 0.004);
          beads.push([p.x, p.y, p.z, b * 0.9, 1, (b % 9 < 6) ? pal[0] : pal[1]]);
        }
        const foot = B.P(lx, 2.3 - count * step - 0.05, lz);
        tassels.push([foot.x, foot.y, foot.z, 0, 1, pal[1]]);
      }
    });
    // torans on the back: a band of mango leaves and bells
    const leaves = [];
    for (let t = 0; t < 4; t++) {
      const lx0 = 0.2 + t * (w - 0.4) / 4, y = 2.05 - (t % 2) * 0.55;
      B.box('goods', lx0 + (w - 0.4) / 8, y, d - 0.08, (w - 0.4) / 4 - 0.12, 0.08, 0.02, [0xd23a3a, 0xf0b21b][t % 2]);
      for (let k = 0; k < 9; k++) {
        const p = B.P(lx0 + 0.08 + k * ((w - 0.4) / 4 - 0.2) / 8, y - 0.16, d - 0.09);
        leaves.push([p.x, p.y, p.z, 0, 1, k % 2 ? 0x2f8f3a : 0xf0b21b]);
      }
    }
    // front table of boxed garlands and tubs of loose flowers; cartons under it
    B.table(0.2, 0.18, w - 0.4, 0.66, 0.8, 0xf3efe6, 0xd2246f);
    for (let k = 0; k < Math.floor((w - 0.6) / 0.3); k++) B.box('goods', 0.38 + k * 0.3, 0.86, 0.48, 0.26, 0.08, 0.36, [0xf7a21b, 0xffffff, 0xe2342d, 0xf5c518][k % 4]);
    for (let k = 0; k < 3; k++) B.box('goods', 0.6 + k * 1.1, 0.16, 0.5, 0.5, 0.3, 0.36, 0xd8c39a);
    B.instanced('beads', new THREE.IcosahedronGeometry(0.03, 0), 0xffffff, beads);
    B.instanced('tassels', new THREE.ConeGeometry(0.035, 0.1, 8), 0xffffff, tassels);
    const leaf = new THREE.PlaneGeometry(0.07, 0.14); leaf.translate(0, -0.07, 0);
    B.instanced('leaves', leaf, 0xffffff, leaves);
    return B.finish();
  }

  // ---- the other festival stalls ------------------------------------------------------------------------------------
  // A tent, the stall's furniture and its kind of goods at the right size, so the lane reads as it does in the video.
  // S4–S7 rebuild each stall from its own stills, as BAWA'S and the garland stall are built above.
  const seedOf = (id) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483646, 11) + 1;
  const STOCK = [0xe8b04a, 0xd9564a, 0x4f86c6, 0x5aa36a, 0xe07a4f, 0xf2e3b8, 0xb06ad0];
  const GEO = {
    garment: new THREE.BoxGeometry(0.035, 0.8, 0.44),
    jar: new THREE.CylinderGeometry(0.065, 0.065, 0.2, 14, 1), lid: new THREE.CylinderGeometry(0.07, 0.07, 0.034, 14, 1),
    bead: new THREE.IcosahedronGeometry(0.03, 0), tassel: new THREE.ConeGeometry(0.035, 0.1, 8),
    foil: new THREE.BoxGeometry(0.26, 0.012, 0.26), orb: new THREE.SphereGeometry(0.06, 14, 10), lantern: new THREE.SphereGeometry(0.11, 12, 8),
    plate: new THREE.CylinderGeometry(0.13, 0.13, 0.015, 20).rotateX(Math.PI / 2),
  };
  const merged = (parts) => THREE.BufferGeometryUtils.mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
  // a seated deity figure: plinth, body, head, halo
  GEO.statue = merged([new THREE.CylinderGeometry(0.09, 0.1, 0.06, 12).translate(0, 0.03, 0), new THREE.CylinderGeometry(0.05, 0.085, 0.2, 12).translate(0, 0.16, 0),
    new THREE.SphereGeometry(0.045, 12, 8).translate(0, 0.3, 0), new THREE.TorusGeometry(0.07, 0.008, 6, 20).translate(0, 0.31, -0.03)]);
  // a three-tier LED diya lamp on a stem
  GEO.lamp = merged([0, 1, 2].map((k) => new THREE.CylinderGeometry(0.07 - k * 0.018, 0.08 - k * 0.018, 0.04, 12).translate(0, 0.05 + k * 0.1, 0))
    .concat(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6).translate(0, 0.15, 0)));

  // the board under the front eave: the stall's own sign, or a quiet description when the video shows none
  function eaveSign(B, sign, y = 2.24) {
    if (!sign) return;
    // just in front of the valance, as the boards hang on the tents' front edge
    if (sign.real) { const width = Math.min(B.w - 0.3, 3.2); B.sign(sign.text, B.w / 2, y, -0.04, width, { ...sign.style, h: Math.min(0.46, width * 0.16) }); }
    else { const width = Math.min(B.w - 0.6, 1.6); B.sign(sign.text, B.w / 2, y + 0.06, 0.04, width, { quiet: true, h: Math.min(0.16, width * 0.1) }); }
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  // a hanging rail on two uprights, along the lane at depth lz, with garments of length len[0]–len[1] hanging from it
  function rail(B, items, r, lx0, lx1, lz, y, len, step = 0.09) {
    for (const lx of [lx0, lx1]) B.rod('furniture', B.P(lx, 0, lz), B.P(lx, y, lz), 0.016, 0xc9ced3);
    B.rod('furniture', B.P(lx0, y, lz), B.P(lx1, y, lz), 0.013, 0xc9ced3);
    for (let lx = lx0 + 0.07; lx < lx1 - 0.05; lx += step * (0.8 + r() * 0.4)) {
      const l = len[0] + r() * (len[1] - len[0]), p = B.P(lx, y - 0.03 - l / 2, lz);
      items.push([p.x, p.y, p.z, (r() - 0.5) * 0.3, 1, pick(r, STOCK), l / 0.8]);
    }
  }
  // a rolling rack on castors standing at an angle out into the aisle, from a to b ([lx, lz] each), hung with cloths
  function rollingRack(B, r, items, { a, b, y = 1.55 }) {
    for (const [lx, lz] of [a, b]) {
      B.rod('furniture', B.P(lx, 0.07, lz), B.P(lx, y, lz), 0.016, 0xc9ced3);
      B.add('furniture', new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10).rotateZ(Math.PI / 2), 0x2b2b2b, B.P(lx, 0.035, lz));
    }
    for (const yy of [0.07, y]) B.rod('furniture', B.P(a[0], yy, a[1]), B.P(b[0], yy, b[1]), 0.013, 0xc9ced3);
    const A = B.P(a[0], 0, a[1]), E = B.P(b[0], 0, b[1]), ang = Math.atan2(E.z - A.z, E.x - A.x), len = A.distanceTo(E);
    for (let s = 0.08; s < len - 0.06; s += 0.075) {
      const t = s / len, l = 1.0 + r() * 0.25;
      items.push([A.x + (E.x - A.x) * t, y - 0.03 - l / 2, A.z + (E.z - A.z) * t, -ang, 1, pick(r, STOCK), l / 0.8]);
    }
  }
  function stacks(B, r, lx0, lx1, lz, h) {
    for (let lx = lx0 + 0.18; lx < lx1 - 0.15; lx += 0.34) {
      const n = 2 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) B.box('goods', lx + (r() - 0.5) * 0.02, h + 0.03 + k * 0.058, lz, 0.28, 0.055, 0.3, pick(r, STOCK));
    }
  }
  function jarShelves(B, r, lx, lz, sx, jars, lids) {
    const ys = B.shelving(lx, lz, sx, 0.42, 2.0, 5);
    for (const y of ys.slice(0, 4)) for (let row = 0; row < 2; row++) for (let k = 0; k < Math.floor((sx - 0.05) / 0.155); k++) {
      const tall = 0.18 + (r() < 0.25 ? 0.06 : 0), p = B.P(lx + 0.08 + k * 0.155, y + tall / 2, lz + 0.11 + row * 0.2);
      jars.push([p.x, p.y, p.z, 0, 1, pick(r, JAR_FILL), tall / 0.2]);
      lids.push([p.x, y + tall + 0.017, p.z, 0, 1, r() < 0.5 ? 0xd2262e : 0xe8b53a]);
    }
  }
  function garlandRail(B, r, beads, tassels, lx0, lx1, lz, y, spacing, lenK = 1) {
    B.rod('furniture', B.P(lx0, y + 0.02, lz), B.P(lx1, y + 0.02, lz), 0.012, 0xb9bec4);
    for (let lx = lx0 + 0.08; lx < lx1 - 0.05; lx += spacing) {
      const len = (0.8 + r() * 0.6) * lenK, pal = pick(r, GARLAND), step = 0.045, n = Math.floor(len / step);
      for (let k = 0; k < n; k++) { const p = B.P(lx + Math.sin(k * 0.7 + lx * 9) * 0.004, y - k * step, lz); beads.push([p.x, p.y, p.z, k * 0.9, 1, k % 9 < 6 ? pal[0] : pal[1]]); }
      const foot = B.P(lx, y - n * step - 0.05, lz);
      tassels.push([foot.x, foot.y, foot.z, 0, 1, pal[1]]);
    }
  }
  function mannequin(B, r, lx, ly, lz) {
    B.rod('furniture', B.P(lx, ly, lz), B.P(lx, ly + 0.9, lz), 0.015, 0x9aa0a6);
    B.add('goods', new THREE.CylinderGeometry(0.13, 0.1, 0.5, 14), 0xe8d6c4, B.P(lx, ly + 1.15, lz));
    B.add('goods', new THREE.SphereGeometry(0.09, 14, 10), 0xe8d6c4, B.P(lx, ly + 1.5, lz));
    B.add('goods', new THREE.ConeGeometry(0.32, 0.75, 18, 1, true), pick(r, STOCK), B.P(lx, ly + 0.55, lz));   // the frock
  }
  // MADDY's steel frame under the shop's retractable awning, with rods to hang the garlands from
  function awning(B) {
    const { w, d } = B, f = 0xc9ced3, back = Math.min(d, 2.2);
    for (const lx of [0.05, w - 0.05]) for (const lz of [0.05, back]) B.rod('frame', B.P(lx, 0, lz), B.P(lx, 2.3, lz), 0.022, f);
    for (const lz of [0.05, back]) B.rod('frame', B.P(0, 2.3, lz), B.P(w, 2.3, lz), 0.02, f);
    B.quad('canopy', B.P(0, 2.42, -0.1), B.P(w, 2.42, -0.1), B.P(w, 2.85, d), B.P(0, 2.85, d), 0xe0562a);
  }

  function basicStall(e, depth, sign, o = {}) {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id));
    const { w, d } = B, cat = e.category;
    const open = e.id === 'SW-11';             // J&G's kiosk stands in the open, in a gap between the tents
    if (e.id === 'NE-16') awning(B);
    else if (!open) B.tentRow(Math.max(1, Math.round(w / 3.2)), { eave: 2.5, ridge: 3.15 });
    if (!open) eaveSign(B, sign);
    const lists = {}, L = (name) => (lists[name] = lists[name] || []);
    if (cat === 'clothing') {
      rail(B, L('garments'), r, 0.15, w - 0.15, d - 0.55, 1.95, [0.9, 1.25]);
      rail(B, L('garments'), r, 0.3, w - 0.3, d * 0.5, 1.7, [0.6, 0.95]);
      if (o.platform) {                        // a raised green platform with mannequins in frocks
        B.box('furniture', w / 2, 0.15, d * 0.27, w - 0.5, 0.3, 1.1, 0x4f9a5a);
        mannequin(B, r, w * 0.3, 0.3, d * 0.27); mannequin(B, r, w * 0.7, 0.3, d * 0.27);
      } else { B.table(0.25, 0.22, w - 0.5, 0.62, 0.78, 0xf3efe6, 0x8a5bb5); stacks(B, r, 0.25, w - 0.25, 0.53, 0.78); }
      if (o.rack) rollingRack(B, r, L('garments'), o.rack);
    } else if (cat === 'snacks_sweets') {
      jarShelves(B, r, 0.12, d - 0.6, w - 0.24, L('jars'), L('lids'));
      B.table(0.2, 0.2, w - 0.4, 0.62, 0.8, 0xf3efe6, e.id === 'SW-04' ? 0xc0222b : 0x2f6fc0);
      for (let k = 0; k < Math.floor((w - 0.6) / 0.24); k++) { const hh = 0.1 + r() * 0.06; B.box('goods', 0.38 + k * 0.24, 0.8 + hh / 2, 0.5, 0.2, hh, 0.26, pick(r, STOCK)); }
      if (e.id === 'NE-20') B.box('furniture', w - 0.45, 0.9, d * 0.55, 0.65, 1.8, 0.6, 0xf4f4f2);   // AJMIR's white fridge
    } else if (cat === 'flowers_garlands') {
      const rails = e.id === 'NE-16' ? [0.35, 0.95] : [0.45, Math.max(0.9, d - 0.7)];
      rails.forEach((lz, k) => garlandRail(B, r, L('beads'), L('tassels'), 0.1, w - 0.1, lz, 2.22, 0.12, k ? 1.2 : 1.0));
      const tz = Math.min(d - 0.75, Math.max(...rails) + 0.45);
      B.table(0.15, tz, w - 0.3, 0.7, 0.78, 0xb9bec4);
      for (let k = 0; k < Math.floor((w - 0.4) / 0.55); k++) B.box('goods', 0.45 + k * 0.55, 0.16, tz + 0.35, 0.45, 0.3, 0.36, [0xf4f4f0, 0x2d7fd6, 0xe23a3a][k % 3]);
    } else if (cat === 'religious_items') {
      // three steps rising to the back, statues on each, more on the front table
      for (let k = 0; k < 3; k++) {
        const lz = d - 0.35 - k * 0.42, top = 1.25 - k * 0.4;
        B.box('furniture', w / 2, top / 2, lz, w - 0.3, top, 0.42, 0xf0ebe2);
        for (let i = 0; i < Math.floor((w - 0.5) / 0.3); i++) { const p = B.P(0.4 + i * 0.3, top, lz); L('statues').push([p.x, p.y, p.z, 0, 1.3 + (2 - k) * 0.25 + r() * 0.2, pick(r, STOCK)]); }
      }
      B.table(0.2, 0.22, w - 0.4, 0.62, 0.78, 0xf3efe6, 0xd2246f);
      for (let i = 0; i < Math.floor((w - 0.5) / 0.26); i++) {
        const p = B.P(0.36 + i * 0.26, 0.78, 0.5);
        if (e.id === 'NE-19' && i % 3 === 1) { B.add('goods', new THREE.CylinderGeometry(0.12, 0.08, 0.08, 16), 0xb88a5a, B.P(0.36 + i * 0.26, 0.82, 0.5)); L('orbs').push([p.x, p.y + 0.16, p.z, 0, 1, 0xbfe9ff]); }
        else L('statues').push([p.x, p.y, p.z, 0, 0.9 + r() * 0.3, pick(r, STOCK)]);
      }
    } else if (cat === 'henna_beauty') {
      B.table(0.3, 0.3, Math.min(1.4, w - 0.6), 0.7, 0.75, 0xf3efe6, 0xe85c9a);
      for (const lx of [0.6, 1.3]) B.box('furniture', lx, 0.22, 1.35, 0.34, 0.44, 0.34, 0xe14b4b);   // stools
      B.box('furniture', w - 0.4, 1.05, 0.12, 0.8, 1.3, 0.03, 0xf59ac4);                              // pop-art poster board
      B.rod('furniture', B.P(w - 0.9, 0, 1.6), B.P(w - 0.75, 1.6, 1.4), 0.02, 0xb9bec4);               // folding ladder
      B.rod('furniture', B.P(w - 0.5, 0, 1.6), B.P(w - 0.6, 1.6, 1.4), 0.02, 0xb9bec4);
      for (let k = 0; k < 3; k++) B.box('goods', 0.5 + k * 0.5, 0.2, d - 0.5, 0.45, 0.4, 0.4, 0xc9a77a);    // cartons
    } else if (e.id === 'SW-11') {
      // three rows of tables in pink and black cloth, gold-foil rangoli stickers laid out on them, a backdrop board behind
      for (let k = 0; k < 3; k++) B.table(0.2, 0.3 + k * 1.15, w - 0.6, 0.75, 0.78, 0xf3efe6, k % 2 ? 0x1c1c1c : 0xe85c9a);
      for (let k = 0; k < 3; k++) for (let i = 0; i < Math.floor((w - 0.8) / 0.3); i++) for (let j = 0; j < 2; j++) {
        const p = B.P(0.36 + i * 0.3, 0.786, 0.47 + k * 1.15 + j * 0.34);
        L('foils').push([p.x, p.y, p.z, (r() - 0.5) * 0.4, 1, 0xe2b64a]);
      }
      B.box('walls', w / 2, 1.1, d - 0.2, w - 0.3, 2.2, 0.03, 0xd8c4a0);
      if (sign) B.sign(sign.text, w / 2, 1.8, d - 0.24, Math.min(w - 0.6, 2.6), sign.real ? { ...sign.style, h: 0.4 } : { quiet: true, h: 0.32 });
    } else if (cat === 'festive_decor') {
      // LED diya lamps on shelving and on the front table, framed paintings above
      const ys = B.shelving(0.12, d - 0.6, w - 0.24, 0.42, 2.0, 5);
      for (const y of ys.slice(0, 4)) for (let k = 0; k < Math.floor((w - 0.45) / 0.22); k++) { const p = B.P(0.26 + k * 0.22, y, d - 0.38); L('lamps').push([p.x, p.y, p.z, 0, 0.8 + r() * 0.4, 0xe2b64a]); }
      B.table(0.2, 0.2, w - 0.4, 0.62, 0.8, 0xf3efe6, 0x8a2be2);
      for (let k = 0; k < Math.floor((w - 0.6) / 0.3); k++) { const p = B.P(0.38 + k * 0.3, 0.8, 0.5); L('lamps').push([p.x, p.y, p.z, 0, 1.1, 0xe2b64a]); }
      for (let k = 0; k < Math.floor((w - 0.4) / 0.9); k++) B.box('goods', 0.6 + k * 0.9, 2.25, d - 0.15, 0.7, 0.5, 0.03, 0x7a5a3a);
    } else {
      // painted plates on a purple backdrop, lanterns hanging from the eave, small décor on the table
      B.box('walls', w / 2, 1.2, d - 0.15, w - 0.2, 2.2, 0.03, 0x7b3fa0);
      for (let row = 0; row < 3; row++) for (let k = 0; k < Math.floor((w - 0.5) / 0.34); k++) { const p = B.P(0.4 + k * 0.34, 0.95 + row * 0.42, d - 0.19); L('plates').push([p.x, p.y, p.z, 0, 1, pick(r, STOCK)]); }
      for (let k = 0; k < 5; k++) { const lx = (w * (k + 0.5)) / 5, top = B.P(lx, 2.48, d * 0.45), low = B.P(lx, 2.05, d * 0.45); B.rod('goods', top, low, 0.005, 0x222222, 4); L('lanterns').push([low.x, low.y - 0.12, low.z, 0, 1, pick(r, STOCK), 1.3]); }
      B.table(0.2, 0.2, w - 0.4, 0.62, 0.8, 0xf3efe6, 0x7b3fa0);
      for (let k = 0; k < Math.floor((w - 0.6) / 0.28); k++) B.box('goods', 0.38 + k * 0.28, 0.86, 0.5, 0.2, 0.12, 0.2, pick(r, STOCK));
    }
    for (const [name, items] of Object.entries(lists)) if (items.length) B.instanced(name, GEO[{ garments: 'garment', jars: 'jar', lids: 'lid', beads: 'bead', tassels: 'tassel', statues: 'statue', orbs: 'orb', foils: 'foil', lamps: 'lamp', plates: 'plate', lanterns: 'lantern' }[name]], 0xffffff, items);
    return B.finish();
  }

  // modules that sell nothing: closed or clear-walled tents, a store tent with cocktail tables, an empty counter
  function closedModule(e, depth) {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side);
    B.tentRow(Math.max(1, Math.round(B.w / 3.2)), { eave: 2.5, ridge: 3.15 });
    B.sheet(0.02, 0xdfeaf2, { folds: 6 }); B.sheet(B.w - 0.02, 0xdfeaf2, { folds: 6 });
    if (e.id === 'SW-25') B.box('furniture', B.w / 2, 0.45, 0.6, Math.min(1.8, B.w - 0.4), 0.9, 0.7, 0xc9ced3);   // the empty bain-marie counter
    if (e.id === 'SW-29') for (let k = 0; k < 4; k++) {
      const lx = 1.0 + (k * (B.w - 2)) / 3;
      B.add('furniture', new THREE.CylinderGeometry(0.3, 0.3, 0.03, 20), 0xf4f4f2, B.P(lx, 1.08, 1.2));
      B.add('furniture', new THREE.CylinderGeometry(0.29, 0.22, 1.06, 20, 1, true), 0xf4f4f2, B.P(lx, 0.54, 1.2));   // stretch cover
    }
    return B.finish();
  }
  // the tent over a shop's own display: only its frame and roof; the goods under it are the shop's, drawn solid
  function canopy(e, depth) {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side);
    B.tentRow(Math.max(1, Math.round(B.w / 3.2)), { eave: 2.5, ridge: 3.15 });
    if (e.id === 'SW-14') B.sheet(B.w - 0.02, 0x2f6fc0, { folds: 8 });      // the garland tent's blue tarp on its SE side
    return B.finish();
  }

  // SW-04: a snack stall in a white tent with blue tarp walls (144 s): a red-skirted table of bagged murukku and mixture
  // and tubs of sweets, a glass case at its NW end, white shelving of jars against the shopfront behind
  function murukkuStall(e, depth, sign) {
    const B = new Builder(e.x0, e.x1, frontZ(e), depth, e.side), r = rnd(seedOf(e.id));
    const { w, d } = B;
    B.tent({ eave: 2.5, ridge: 3.15 });
    eaveSign(B, sign);
    B.sheet(0.02, 0x2f6fc0, { folds: 7 }); B.sheet(w - 0.02, 0x2f6fc0, { folds: 7 });
    B.table(0.95, 0.25, w - 1.2, 0.68, 0.8, 0xf3efe6, 0xc0222b);
    const bags = [], tubs = [], jars = [], lids = [];
    for (let x = 1.1; x < w - 0.35; x += 0.19) for (let k = 0; k < 3 + Math.floor(r() * 4); k++) {
      const p = B.P(x + (r() - 0.5) * 0.02, 0.83 + k * 0.052, 0.42 + (r() - 0.5) * 0.04);
      bags.push([p.x, p.y, p.z, (r() - 0.5) * 0.25, 1, pick(r, [0xe8913a, 0xf0b54a, 0xd96a2a])]);
    }
    for (let x = 1.12; x < w - 0.35; x += 0.21) { const p = B.P(x, 0.85, 0.75); tubs.push([p.x, p.y, p.z, 0, 1, 0xf6f2e8]); }
    // the glass case at the NW end, on its own legs, trays of sweets inside
    B.box('furniture', 0.5, 0.45, 0.6, 0.7, 0.9, 0.6, 0xbfe9ff);
    for (let k = 0; k < 3; k++) B.box('goods', 0.5, 0.25 + k * 0.28, 0.6, 0.6, 0.04, 0.5, pick(r, [0xf2c94c, 0xe07a3c, 0xf7e7b0]));
    // white shelving of jars against the shopfront
    const ys = B.shelving(0.3, d - 0.55, w - 0.6, 0.42, 2.0, 5);
    for (const y of ys.slice(0, 4)) for (let row = 0; row < 2; row++) for (let k = 0; k < Math.floor((w - 0.65) / 0.155); k++) {
      const p = B.P(0.38 + k * 0.155, y + 0.1, d - 0.55 + 0.12 + row * 0.2);
      jars.push([p.x, p.y, p.z, 0, 1, pick(r, JAR_FILL), 1]);
      lids.push([p.x, y + 0.217, p.z, 0, 1, r() < 0.5 ? 0xd2262e : 0xe8b53a]);
    }
    B.instanced('bags', new THREE.BoxGeometry(0.16, 0.05, 0.12), 0xffffff, bags);
    B.instanced('tubs', new THREE.CylinderGeometry(0.08, 0.07, 0.1, 12), 0xffffff, tubs);
    B.instanced('jars', GEO.jar, 0xffffff, jars);
    B.instanced('lids', GEO.lid, 0xffffff, lids);
    return B.finish();
  }

  function build(e, depth, sign, o) {
    if (NAV.kit.custom[e.id]) return NAV.kit.custom[e.id](e, depth, sign, o);          // a stage's own build of this stall
    if (e.id === 'SW-28') return snackStall(e, depth);
    if (e.id === 'SW-04') return murukkuStall(e, depth, sign);
    if (e.id === 'SW-16') return garlandStall(e, depth, sign);
    if (e.kind === 'other') return closedModule(e, depth);
    if (e.kind === 'shop_extension') return canopy(e, depth);
    return basicStall(e, depth, sign, o);
  }

  // custom[id] = (e, depth, sign, o) => Builder.finish(): a stage's own build of a festival stall, from its stills
  NAV.kit = { Builder, build, snackStall, garlandStall, basicStall, closedModule, canopy, custom: {}, frontZ, rnd, seedOf, pick, eaveSign, rail, rollingRack, stacks, jarShelves, garlandRail, mannequin, awning };
})();
