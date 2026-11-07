// The page's renderer. Solid things are drawn in the intro's line-art style (nav-toon.js); festival stalls are
// line-art holograms (look B, D28): their furniture and goods go through a normal/depth/id pass and are inked over the
// world in the same composite, tents are edge lines over a faint skin, signs keep their own colours. The composite also
// draws the lock-on for whatever is under the crosshair (H2: warm lines and target brackets). A stall can be rebuilt
// by a wave that spreads from its AR anchor on the yellow line (R3).
(function () {
  const NAV = window.NAV, THREE = window.THREE;
  const LAYER = (NAV.LAYER = { world: 0, holo: 1, nd: 2 });
  const CYAN = 0x6fe9ff, WARM = 0xffb24a;
  const DENSE = ['beads', 'tassels', 'leaves', 'garments', 'strands'];   // fine goods: a third of the fill, lighter lines

  const G = { uTime: { value: 0 }, uCol: { value: new THREE.Color(CYAN) }, uWarm: { value: new THREE.Color(WARM) }, tW: { value: null }, uRes: { value: new THREE.Vector2(1, 1) } };
  // the tents' lines and skins are drawn last, over the composite: they hide behind solid things by reading the
  // world's view depth that the line-art pass left in tW, so nothing has to write depth for them
  const HID = `uniform sampler2D tW; uniform vec2 uRes;
    bool hidden(float z) { float wz = texture2D(tW, gl_FragCoord.xy / uRes).b; return wz > 0.0 && z > wz + 0.03 + 0.002 * wz; }`;
  const VTX = `
    varying vec3 vWP; varying vec3 vN; varying float vViewZ;
    void main() {
      vec4 p = vec4(position, 1.0); vec3 n = normal;
      #ifdef USE_INSTANCING
        p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
      #endif
      vec4 wp = modelMatrix * p; vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
      vec4 mv = viewMatrix * wp; vViewZ = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`;
  // a stall shows only what the reconstruction wave has reached
  const REV = `uniform vec3 uAnchor; uniform float uRadius;
    float rev(vec3 wp) { return step(distance(wp, uAnchor), uRadius); }`;
  const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

  // each vertex carries its line's strength, so a stall's frame, roof, walls and footprint draw as one set of lines
  const lineMat = (su) => new THREE.ShaderMaterial({
    ...ADD, uniforms: { ...G, ...su },
    vertexShader: 'attribute float aAlpha; varying float vA; varying vec3 vWP; varying float vViewZ; void main() { vA = aAlpha; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; vec4 mv = viewMatrix * wp; vViewZ = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 uCol, uWarm; uniform float uHot; varying float vA; varying vec3 vWP; varying float vViewZ; ${REV} ${HID}
      void main() { if (rev(vWP) < 0.5 || hidden(vViewZ)) discard; gl_FragColor = vec4(mix(uCol, uWarm, uHot) * vA * (1.0 + 0.5 * uHot), 1.0); }`,
  });
  const strength = (g, a) => g.setAttribute('aAlpha', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(a), 1));
  const skinMat = (su, base, rim) => new THREE.ShaderMaterial({
    ...ADD, side: THREE.DoubleSide, uniforms: { ...G, ...su, uBase: { value: base }, uRim: { value: rim } }, vertexShader: VTX,
    fragmentShader: `uniform vec3 uCol, uWarm; uniform float uTime, uBase, uRim, uHot; varying vec3 vWP; varying vec3 vN; varying float vViewZ; ${REV} ${HID}
      void main() {
        if (rev(vWP) < 0.5 || hidden(vViewZ)) discard;
        vec3 v = normalize(cameraPosition - vWP), n = normalize(vN);
        float f = pow(1.0 - abs(dot(n, v)), 2.0);
        float scan = smoothstep(0.75, 1.0, 0.5 + 0.5 * sin(vWP.y * 48.0 - uTime * 4.0));
        float flick = 0.94 + 0.06 * sin(uTime * 41.0 + vWP.x * 5.0);
        gl_FragColor = vec4(mix(uCol, uWarm, uHot) * (uBase + f * uRim + scan * 0.05) * flick * (1.0 + 0.6 * uHot), 1.0);
      }`,
  });
  // normal, view depth and id of the stall's content; the composite inks it. ids: stall number, +0.5 for fine goods
  const ndMat = (su, id) => new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...su, uId: { value: id } }, vertexShader: VTX,
    fragmentShader: `uniform float uId; varying vec3 vWP; varying vec3 vN; varying float vViewZ; ${REV}
      void main() {
        if (rev(vWP) < 0.5) discard;
        vec3 n = normalize((viewMatrix * vec4(vN, 0.0)).xyz);
        if (n.z < 0.0) n = -n;
        gl_FragColor = vec4(n.xy, vViewZ, uId);
      }`,
  });
  // the wavefront where it cuts through the content: a thin bright band
  const contourMat = (su) => new THREE.ShaderMaterial({
    ...ADD, side: THREE.DoubleSide, uniforms: { ...G, ...su }, vertexShader: VTX,
    fragmentShader: `uniform vec3 uCol, uAnchor; uniform float uRadius; varying vec3 vWP; varying float vViewZ; ${HID}
      void main() {
        float d = abs(distance(vWP, uAnchor) - uRadius), w = 0.02;
        if (d > w || hidden(vViewZ)) discard;
        gl_FragColor = vec4(mix(uCol, vec3(1.0), 0.55) * (1.0 - d / w) * 1.7, 1.0);
      }`,
  });

  // a flat additive light, optionally textured: the anchor dot and our quiet labels
  const glowMat = (color, map = null, opacity = 1) => new THREE.ShaderMaterial({
    ...ADD, side: THREE.DoubleSide, defines: map ? { USE_GLOWMAP: '' } : {},
    uniforms: { ...G, uColor: { value: new THREE.Color(color) }, uMap: { value: map }, uOpacity: { value: opacity } },
    vertexShader: 'varying vec2 vUv; varying float vViewZ; void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vViewZ = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 uColor; uniform sampler2D uMap; uniform float uOpacity; varying vec2 vUv; varying float vViewZ; ${HID}
      void main() {
        if (hidden(vViewZ)) discard;
        vec4 c = vec4(uColor, 1.0);
      #ifdef USE_GLOWMAP
        c *= texture2D(uMap, vUv);
      #endif
        gl_FragColor = vec4(c.rgb * c.a * uOpacity, 1.0);
      }`,
  });
  const setOpacity = (m, v) => { if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = v; else m.opacity = v; };

  // a sign in the stall's own colours, or, for our own descriptive labels, quiet hologram text
  function signTexture(text, o) {
    const cv = document.createElement('canvas'), W = 1024, H = Math.max(96, Math.round(W * o.h / o.width));
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    if (o.quiet) { g.clearRect(0, 0, W, H); g.fillStyle = '#bff8ff'; }
    else {
      if (Array.isArray(o.bg)) { const gr = g.createLinearGradient(0, 0, W, 0); o.bg.forEach((c, k) => gr.addColorStop(k / (o.bg.length - 1), c)); g.fillStyle = gr; }
      else g.fillStyle = o.bg || '#fffdf8';
      g.fillRect(0, 0, W, H);
      if (o.border) { g.strokeStyle = o.border; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10); }
      g.fillStyle = o.ink || '#2b2622';
    }
    const fam = 'Fredoka, "Noto Sans Tamil", system-ui, sans-serif';
    let size = Math.round(H * (o.sub ? 0.5 : 0.62));
    g.font = `700 ${size}px ${fam}`;
    while (g.measureText(text).width > W * 0.92 && size > 20) { size -= 4; g.font = `700 ${size}px ${fam}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, W / 2, o.sub ? H * 0.4 : H * 0.53);
    if (o.sub) {
      g.fillStyle = o.subInk || g.fillStyle;
      let s2 = Math.round(H * 0.2); g.font = `600 ${s2}px ${fam}`;
      while (g.measureText(o.sub).width > W * 0.9 && s2 > 12) { s2 -= 2; g.font = `600 ${s2}px ${fam}`; }
      g.fillText(o.sub, W / 2, H * 0.8);
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }

  function instMesh(spec, mat) {
    const m = new THREE.InstancedMesh(spec.geo, mat, spec.items.length), q = new THREE.Quaternion(), e = new THREE.Euler(), M = new THREE.Matrix4();
    spec.items.forEach((it, k) => {
      q.setFromEuler(e.set(0, it[3] || 0, 0));
      const s = it[4] || 1;
      m.setMatrixAt(k, M.compose(new THREE.Vector3(it[0], it[1], it[2]), q, new THREE.Vector3(s, s * (it[6] || 1), s)));
    });
    m.computeBoundingSphere();
    return m;
  }
  const onLayer = (o, layer) => { o.layers.set(layer); return o; };

  class Holo {
    constructor(renderer) {
      this.r = renderer;
      this.entries = new Map();         // entity id -> stall handle
      this.dbg = {};
      this.n = 0;
      this.hover = null; this.selected = null; this.hoverT = 0; this.selT = 0;
      const pr = renderer.getPixelRatio();
      // colour in sRGB bytes (half the memory traffic of half floats, and no banding in the dark); data in half floats
      // no multisampling for the world's colour: its line art covers its edges. The composite target keeps it for the
      // tents' lines, and needs no depth buffer since they test themselves against the line-art pass's depth
      const samples = pr >= 1.5 ? 2 : 4, col = { colorSpace: THREE.SRGBColorSpace, samples };
      this.rtMain = new THREE.WebGLRenderTarget(1, 1, { colorSpace: THREE.SRGBColorSpace });   // the world's colour
      this.rtW = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });            // its normals, view depth, ink ids
      // the two share one depth buffer: the line-art pass runs first, so the colour pass shades each pixel once
      this.depth = new THREE.DepthTexture(1, 1); this.depth.type = THREE.UnsignedIntType;
      this.rtMain.depthTexture = this.depth; this.rtW.depthTexture = this.depth;
      this.rtND = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });           // the holograms' content
      this.rtC = new THREE.WebGLRenderTarget(1, 1, { ...col, depthBuffer: false });          // composite, then the tents' lines
      this.makeComposite();
      this.resize();
    }

    // ---- one stall: structure as lines and skins, content in the normal/depth pass, signs, a pick proxy ---------------
    // e: the entity; src: a kit stall ({meshes, instanced, signs}); box: its extent for picking and the brackets
    addStall(e, src, box) {
      const sgn = e.side === 'SW' ? 1 : -1, xc = (e.x0 + e.x1) / 2;
      const anchor = new THREE.Vector3(xc, 0.02, sgn * NAV.LINE_Z);
      const su = { uHot: { value: 0 }, uAnchor: { value: anchor }, uRadius: { value: 1e4 } };
      const content = ['furniture', 'goods'].filter((k) => src.meshes[k]);
      const id = content.length || src.instanced.length ? ++this.n : 0;
      const h = { e, id, su, anchor, box, group: new THREE.Group(), signs: [], reveal: 1 };
      const add = (o, layer) => { h.group.add(onLayer(o, layer)); return o; };
      // tent frame, canopy and side walls as edge lines, the footprint drawn on the ground; a faint skin on roof and walls
      const lines = [];
      for (const k of ['frame', 'canopy', 'walls']) if (src.meshes[k]) lines.push(strength(new THREE.EdgesGeometry(src.meshes[k], 25), k === 'frame' ? 0.55 : 0.35));
      const za = Math.min(e.z0, e.z1), zb = Math.max(e.z0, e.z1), y = 0.015;
      const fp = new THREE.BufferGeometry();
      fp.setAttribute('position', new THREE.Float32BufferAttribute([e.x0, y, za, e.x1, y, za, e.x1, y, za, e.x1, y, zb, e.x1, y, zb, e.x0, y, zb, e.x0, y, zb, e.x0, y, za], 3));
      lines.push(strength(fp, e.kind === 'other' ? 0.3 : 0.7));
      add(new THREE.LineSegments(THREE.BufferGeometryUtils.mergeGeometries(lines), lineMat(su)), LAYER.holo);
      const skins = ['canopy', 'walls'].filter((k) => src.meshes[k]).map((k) => src.meshes[k]);
      if (skins.length) add(new THREE.Mesh(skins.length > 1 ? THREE.BufferGeometryUtils.mergeGeometries(skins) : skins[0], skinMat(su, 0.012, 0.14)), LAYER.holo);
      // content, inked in the composite; the same meshes carry the wavefront band while the stall is rebuilt
      h.contour = new THREE.Group(); h.contour.visible = false; h.group.add(h.contour);
      const cmat = contourMat(su);
      if (content.length) {
        const g = content.length > 1 ? THREE.BufferGeometryUtils.mergeGeometries(content.map((k) => src.meshes[k])) : src.meshes[content[0]];
        add(new THREE.Mesh(g, ndMat(su, id)), LAYER.nd);
        h.contour.add(onLayer(new THREE.Mesh(g, cmat), LAYER.holo));
      }
      for (const s of src.instanced) {
        add(instMesh(s, ndMat(su, id + (DENSE.includes(s.name) ? 0.5 : 0))), LAYER.nd);
        h.contour.add(onLayer(instMesh(s, cmat), LAYER.holo));
      }
      // signs: the stall's own board in its own colours; our descriptive labels as quiet hologram text
      for (const s of src.signs) {
        const hgt = s.opts.h || Math.min(0.5, s.width * 0.18);
        const tex = signTexture(s.text, { ...s.opts, width: s.width, h: hgt });
        const mat = s.opts.quiet
          ? glowMat(0xffffff, tex, 0.5)
          : new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1, side: THREE.DoubleSide });
        // a real board is solid: it hides the frame and the goods behind it
        const m = add(new THREE.Mesh(new THREE.PlaneGeometry(s.width, hgt), mat), s.opts.quiet ? LAYER.holo : LAYER.world);
        m.position.copy(s.pos); m.rotation.y = s.rotY; m.userData.opacity = s.opts.quiet ? 0.5 : mat.opacity;
        h.signs.push(m);
      }
      // how far the wave has to travel to reach the stall's farthest corner
      let far = 0;
      for (const x of [box.min.x, box.max.x]) for (const yy of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) far = Math.max(far, anchor.distanceTo(new THREE.Vector3(x, yy, z)));
      h.rMax = far + 0.4;
      // the AR anchor on the yellow line, and the wavefront where it meets the ground: a thin ring of constant width,
      // kept to the stall's own side of the aisle so neighbouring waves don't tangle across it
      h.ring = add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
        ...ADD, uniforms: { ...G, ...su, uFade: { value: 0 }, uClip: { value: new THREE.Vector4(box.min.x - 0.6, box.max.x + 0.6, sgn, NAV.LINE_Z - 0.45) } },
        vertexShader: 'varying vec3 vWP; varying float vViewZ; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; vec4 mv = viewMatrix * wp; vViewZ = -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: `uniform vec3 uCol, uAnchor; uniform float uRadius, uFade; uniform vec4 uClip; varying vec3 vWP; varying float vViewZ; ${HID}
          void main() {
            float d = abs(length(vWP.xz - uAnchor.xz) - uRadius), w = 0.035;
            if (d > w || vWP.x < uClip.x || vWP.x > uClip.y || vWP.z * uClip.z < uClip.w || hidden(vViewZ)) discard;
            gl_FragColor = vec4(mix(uCol, vec3(1.0), 0.5) * (1.0 - d / w) * uFade, 1.0);
          }`,
      })), LAYER.holo);
      h.ring.position.set(anchor.x, 0.03, anchor.z); h.ring.scale.set(2 * h.rMax + 1, 1, 2 * h.rMax + 1); h.ring.visible = false;
      h.dot = add(new THREE.Mesh(new THREE.CircleGeometry(0.09, 32).rotateX(-Math.PI / 2), glowMat(0xffffff)), LAYER.holo);
      h.dot.position.set(anchor.x, 0.03, anchor.z); h.dot.visible = false;
      // an invisible box to pick the stall by (the raycaster still sees it)
      h.proxy = new THREE.Mesh(new THREE.BoxGeometry(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      h.proxy.position.copy(box.getCenter(new THREE.Vector3())); h.proxy.visible = false; h.group.add(h.proxy);
      this.entries.set(e.id, h);
      return h;
    }

    // R3: p runs from 0 (nothing yet) to 1 (the whole stall); the wave leaves the anchor and sweeps over the stall
    setReveal(h, p) {
      p = NAV.clamp(p, 0, 1); h.reveal = p;
      const building = p > 0 && p < 1;
      h.su.uRadius.value = p >= 1 ? 1e4 : h.rMax * NAV.ease(p);
      h.contour.visible = building;
      h.ring.visible = building; h.ring.material.uniforms.uFade.value = 0.85 * (1 - NAV.smoothstep(0.7, 1, p));
      h.dot.visible = p < 1; setOpacity(h.dot.material, p <= 0 ? 0.35 : 1 - NAV.smoothstep(0.8, 1, p));
      for (const m of h.signs) { setOpacity(m.material, m.userData.opacity * NAV.smoothstep(0.8, 1, p)); m.visible = p > 0.8; }
    }

    // ---- hover and selection (H2): warm lines on the target, brackets locking on round it ------------------------------
    // box: a THREE.Box3 round the target, for the brackets; any entity can be a target, not just a hologram
    setHover(id, box) { if (id !== this.hover) { this.hover = id; this.hoverBox = box; this.hoverT = 0; this.hot(); } }
    setSelected(id, box) { if (id !== this.selected) { this.selected = id; this.selBox = box; this.selT = 0; this.hot(); } }
    hot() {
      for (const h of this.entries.values()) h.su.uHot.value = h.e.id === this.hover || h.e.id === this.selected ? 1 : 0;
      const idOf = (k) => (k && this.entries.get(k) ? this.entries.get(k).id : 0);
      this.U.uHovId.value = idOf(this.hover); this.U.uSelId.value = idOf(this.selected);
    }
    // the target's screen rectangle in device pixels, or null when it is behind or around the camera
    rect(box, camera) {
      const v = new THREE.Vector3(), xs = [], ys = [], W = this.rtMain.width, H = this.rtMain.height;
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
        if (v.z > -camera.near * 2) return null;
        v.applyMatrix4(camera.projectionMatrix);
        xs.push((v.x * 0.5 + 0.5) * W); ys.push((v.y * 0.5 + 0.5) * H);
      }
      const pad = 10 * this.U.uPx.value;
      const r = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
      const cover = (Math.min(W, r[2]) - Math.max(0, r[0])) * (Math.min(H, r[3]) - Math.max(0, r[1])) / (W * H);
      if (r[2] < 0 || r[0] > W || r[3] < 0 || r[1] > H) return null;
      return { r, fade: 1 - NAV.smoothstep(0.5, 0.85, cover) };
    }
    brackets(dt, camera) {
      const U = this.U;
      this.hoverT += dt; this.selT += dt;
      const lock = (t, box, outV, onU) => {
        const q = box ? this.rect(box, camera) : null;
        if (!q) { onU.value = 0; return; }
        // locking on: the brackets close in from a little wider and fade up, in a fifth of a second
        const k = NAV.state.reducedMotion ? 1 : NAV.ease(NAV.clamp(t / 0.2, 0, 1)), grow = 0.3 * (1 - k);
        const [x0, y0, x1, y1] = q.r, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2 * (1 + grow), hh = (y1 - y0) / 2 * (1 + grow);
        outV.value.set(cx - hw, cy - hh, cx + hw, cy + hh);
        onU.value = q.fade * NAV.clamp(t / 0.1, 0, 1);
      };
      lock(this.selT, this.selected ? this.selBox : null, U.uBoxB, U.uBoxBOn);
      lock(this.hoverT, this.hover && this.hover !== this.selected ? this.hoverBox : null, U.uBoxA, U.uBoxAOn);
    }

    // ---- composite: the world plus the line-art holograms, the warm target and its brackets ------------------------------
    makeComposite() {
      this.U = {
        tMain: { value: null }, tW: { value: null }, tND: { value: null }, uRes: { value: new THREE.Vector2() },
        uNear: { value: 0.1 }, uFar: { value: 900 }, uInk: { value: new THREE.Color(0x2a2430) }, uInkPx: { value: 1 },
        uTime: G.uTime, uCol: G.uCol, uWarm: G.uWarm, uPx: { value: 1 }, uFill: { value: 0.035 }, uHovId: { value: 0 }, uSelId: { value: 0 },
        uBoxA: { value: new THREE.Vector4() }, uBoxAOn: { value: 0 }, uBoxB: { value: new THREE.Vector4() }, uBoxBOn: { value: 0 },
      };
      this.comp = new THREE.ShaderMaterial({
        uniforms: this.U, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `
          uniform sampler2D tMain, tW, tND; uniform vec2 uRes; uniform float uNear, uFar, uInkPx, uTime, uPx, uFill, uHovId, uSelId, uBoxAOn, uBoxBOn;
          uniform vec3 uCol, uWarm, uInk; uniform vec4 uBoxA, uBoxB; varying vec2 vUv;
          // tW: the world's view-space normal (x, y), view depth (0 where nothing was drawn), ink id
          vec3 nrm(vec4 t) { return vec3(t.xy, sqrt(max(0.0, 1.0 - dot(t.xy, t.xy)))); }
          float far(vec4 t) { return t.b > 0.0 ? t.b : 1e5; }
          // the intro's line art: a contour where the next pixel is much farther, creases and colour borders on one side
          const vec2 OFF[8] = vec2[8](vec2(1, 0), vec2(0, 1), vec2(1, 1), vec2(-1, 1), vec2(-1, 0), vec2(0, -1), vec2(-1, -1), vec2(1, -1));
          vec3 inked(vec2 uv, vec3 col, vec4 a) {
            float e = 0.0;
            if (a.a > 0.002 && a.b > 0.0) {
              float da = a.b; vec3 na = nrm(a);
              for (int i = 0; i < 8; i++) {
                vec4 b = texture2D(tW, uv + OFF[i] * uInkPx / uRes);
                float rel = (far(b) - da) / da;
                e = max(e, smoothstep(0.0035, 0.011, rel));
                if (i < 4 && b.a > 0.002) {
                  float near = 1.0 - smoothstep(0.015, 0.04, abs(rel));
                  float en = smoothstep(0.12, 0.3, 1.0 - dot(na, nrm(b))), ei = step(0.0035, abs(a.a - b.a));
                  e = max(e, max(en, ei) * near);
                }
              }
              e *= 1.0 - smoothstep(90.0, 170.0, da);
            }
            // garlands and plants (ids above 0.5) get a lighter line in a darker shade of their own colour
            float soft = step(0.5, a.a);
            vec3 inkCol = mix(mix(col * 0.32, uInk, 0.55), col * vec3(0.42, 0.52, 0.44), soft);
            return mix(col, inkCol, clamp(e, 0.0, 1.0) * mix(0.88, 0.78, soft));
          }
          float idOf(float a) { return floor(a + 0.01); }
          float hotId(float id) { return ((uHovId > 0.5 && abs(id - uHovId) < 0.5) || (uSelId > 0.5 && abs(id - uSelId) < 0.5)) ? 1.0 : 0.0; }
          // content counts where it is nearer than the world there (half floats lose a little depth far away)
          float visAt(vec2 uv, out vec4 s) { s = texture2D(tND, uv); if (s.a < 0.5) return 0.0; float wd = far(texture2D(tW, uv)); return s.b < wd + 0.05 + 0.002 * wd ? 1.0 : 0.0; }
          vec2 edgeAt(vec2 uv, vec4 c, float here, float r) {
            float e = 0.0, hv = 0.0; vec2 px = r / uRes;
            for (int k = 0; k < 8; k++) {
              float a = float(k) * 0.785398;
              vec4 s; float sv = visAt(uv + vec2(cos(a), sin(a)) * px, s);
              if (sv > 0.5) hv = max(hv, hotId(idOf(s.a)));
              if (here < 0.5 && sv < 0.5) continue;
              if (here < 0.5 || sv < 0.5) { e = 1.0; continue; }
              float dn = length(c.xy - s.xy), dz = abs(c.b - s.b) / max(c.b, 0.2), did = step(0.25, abs(c.a - s.a));
              e = max(e, max(smoothstep(0.12, 0.42, dn), max(smoothstep(0.012, 0.05, dz), did)));
            }
            return vec2(e, hv);
          }
          float bracket(vec2 p, vec4 B) {
            float L = min(46.0 * uPx, 0.28 * min(B.z - B.x, B.w - B.y)), T = 1.6 * uPx, b = 0.0;
            vec4 cs[4]; cs[0] = vec4(B.x, B.y, 1.0, 1.0); cs[1] = vec4(B.z, B.y, -1.0, 1.0); cs[2] = vec4(B.x, B.w, 1.0, -1.0); cs[3] = vec4(B.z, B.w, -1.0, -1.0);
            for (int k = 0; k < 4; k++) {
              vec2 d = (p - cs[k].xy) * cs[k].zw;
              b = max(b, step(abs(d.y), T) * step(0.0, d.x) * step(d.x, L));
              b = max(b, step(abs(d.x), T) * step(0.0, d.y) * step(d.y, L));
            }
            return b;
          }
          void main() {
            vec4 w0 = texture2D(tW, vUv);
            vec3 base = inked(vUv, texture2D(tMain, vUv).rgb, w0);
            // most of the screen has no hologram content near it: look first, cheaply, before inking any
            float near = step(0.5, texture2D(tND, vUv).a);
            for (int k = 0; k < 8; k++) near = max(near, step(0.5, texture2D(tND, vUv + OFF[k] * 2.6 * uPx / uRes).a));
            vec3 add = vec3(0.0);
            if (near > 0.5) {
            vec4 c; float here = visAt(vUv, c);
            vec2 e1 = edgeAt(vUv, c, here, uPx), e2 = edgeAt(vUv, c, here, uPx * 2.6);
            float nz = sqrt(max(0.0, 1.0 - dot(c.xy, c.xy))), fres = pow(1.0 - nz, 2.0);
            float scan = smoothstep(0.7, 1.0, 0.5 + 0.5 * sin(gl_FragCoord.y * 0.9 / uPx - uTime * 5.0));
            float hov = max(here * hotId(idOf(c.a)), (1.0 - here) * e1.y);
            float dense = here * step(0.25, fract(c.a + 0.01));
            vec3 col = mix(uCol, uWarm, hov);
            add = here * col * (uFill + fres * 0.3 + scan * 0.025 + hov * 0.04) * (1.0 - 0.65 * dense)
                + max(e1.x, e2.x * 0.32) * col * (1.15 + hov * 0.35) * (1.0 - 0.3 * dense);
            }
            add += (bracket(gl_FragCoord.xy, uBoxA) * uBoxAOn + bracket(gl_FragCoord.xy, uBoxB) * uBoxBOn) * uWarm * 1.3;
            add = add / (1.0 + 0.45 * add);            // soft limit: the glow never whitens over the shop light behind it
            gl_FragColor = vec4(base + add, 1.0);
          }`,
      });
      this.out = new THREE.ShaderMaterial({
        uniforms: { tC: { value: null } }, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: 'uniform sampler2D tC; varying vec2 vUv; void main() { gl_FragColor = texture2D(tC, vUv); \n#include <colorspace_fragment>\n }',
      });
      const tri = new THREE.BufferGeometry();
      tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
      tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
      this.compScene = new THREE.Scene(); this.outScene = new THREE.Scene();
      const quad = new THREE.Mesh(tri, this.comp); quad.frustumCulled = false; this.compScene.add(quad);
      const quad2 = new THREE.Mesh(tri, this.out); quad2.frustumCulled = false; this.outScene.add(quad2);
      this.compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    resize() {
      const pr = this.r.getPixelRatio(), w = Math.round(innerWidth * pr), h = Math.round(innerHeight * pr);
      for (const rt of [this.rtMain, this.rtW, this.rtND, this.rtC]) rt.setSize(w, h);
      this.U.uRes.value.set(w, h); G.uRes.value.set(w, h); this.U.uPx.value = pr; this.U.uInkPx.value = pr >= 1.5 ? 1.0 : 0.85;
    }

    // the line-art pass: every solid thing in the world wears a stand-in that writes its normal and ink id
    worldNormals(scene, camera) {
      const R = this.r, hidden = [], swapped = [];
      scene.traverseVisible((o) => {
        if (!o.layers.isEnabled(LAYER.world)) return;
        if (o.isSprite || o.isLine || o.isPoints) { hidden.push(o); return; }
        if (!o.isMesh) return;
        const nm = NAV.inkMaterial(o.material);
        if (!nm) { hidden.push(o); return; }
        swapped.push(o, o.material); o.material = nm;
      });
      for (const o of hidden) o.visible = false;
      const fog = scene.fog; scene.fog = null;
      R.setRenderTarget(this.rtW); R.setClearColor(0x000000, 0); R.clear();
      R.render(scene, camera);
      for (let i = 0; i < swapped.length; i += 2) swapped[i].material = swapped[i + 1];
      for (const o of hidden) o.visible = true;
      scene.fog = fog;
    }

    // world colour → its normals, ink ids and depth → the holograms' content → composite (the world inked, the content
    // inked over it, the world's depth written) → the tents' lines and skins, hidden behind solid things → the screen
    render(scene, camera, dt, time) {
      const R = this.r, bg = scene.background, ac = R.autoClear, cc = R.getClearColor(new THREE.Color()), ca = R.getClearAlpha();
      G.uTime.value = time;
      this.brackets(dt, camera);
      const dbg = this.dbg;                     // profiling switches, set from the console or a test (see README)
      camera.layers.set(LAYER.world);
      // the line-art pass first: its depth is the colour pass's depth, so nothing hidden gets shaded
      scene.background = null;
      if (!dbg.noNormals) this.worldNormals(scene, camera);
      scene.background = bg;
      if (dbg.flatWorld) scene.overrideMaterial = this.flat || (this.flat = new THREE.MeshBasicMaterial({ color: 0x808080 }));
      R.setRenderTarget(this.rtMain); R.autoClearDepth = !!dbg.noNormals; R.render(scene, camera); R.autoClearDepth = true;
      scene.overrideMaterial = null;
      scene.background = null;
      R.setRenderTarget(this.rtND); R.setClearColor(0x000000, 0); R.clear();
      camera.layers.set(LAYER.nd); R.render(scene, camera);
      R.setClearColor(cc, ca);
      const U = this.U;
      U.tMain.value = this.rtMain.texture; U.tW.value = this.rtW.texture; U.tND.value = this.rtND.texture; G.tW.value = this.rtW.texture;
      U.uNear.value = camera.near; U.uFar.value = camera.far;
      R.setRenderTarget(this.rtC); R.clear(); R.render(this.compScene, this.compCam);
      R.autoClear = false;
      camera.layers.set(LAYER.holo); if (!dbg.noTents) R.render(scene, camera);
      R.autoClear = ac; scene.background = bg; camera.layers.set(LAYER.world);
      this.out.uniforms.tC.value = this.rtC.texture;
      R.setRenderTarget(null); R.render(this.outScene, this.compCam);
    }
  }
  NAV.Holo = Holo;
})();
