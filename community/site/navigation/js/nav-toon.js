// The local look (S3b): the intro's anime line-art style, at night. Toon materials with the intro's nearly flat
// gradient; light comes from a dim sky and from zones (lit shop interiors, the five-foot ways, the tents' bulbs) that
// add to the ambient light, as the intro's shop lamps do. Every solid thing also writes its normal and an ink id in a
// second pass, from which the composite (nav-holo.js) draws contours, creases and colour borders.
(function () {
  const NAV = window.NAV, THREE = window.THREE;

  const GRADIENT = (() => {
    const n = 64, d = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      const c = (i + 0.5) / n, v = c > 0.56 ? 255 : c > 0.46 ? 234 : 214;
      d.set([v, v, v, 255], i * 4);
    }
    const t = new THREE.DataTexture(d, n, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  })();

  // ---- light zones: soft boxes that add light of a colour to everything inside them ----------------------------------
  // A fragment finds its zones through a table of 4 m bins along the lane: each bin lists the zones that reach it, so it
  // tests a dozen boxes at most however many shops are lit (testing every zone cost about 5 ms a frame per 24 zones).
  const ZONES = 48, BIN_X0 = -30, BIN_W = 4, BINS = 48, SLOTS = 12;
  const bins = new Uint8Array(SLOTS * BINS * 4);
  const BIN_TEX = new THREE.DataTexture(bins, SLOTS, BINS, THREE.RGBAFormat);       // r: zone index + 1; 0 ends a bin's list
  BIN_TEX.minFilter = BIN_TEX.magFilter = THREE.NearestFilter; BIN_TEX.generateMipmaps = false; BIN_TEX.needsUpdate = true;
  // the zones themselves in a small float texture, one row each: min corner and softness, max corner, light colour (a
  // texture rather than uniform arrays, which were uploaded again at every change of material)
  const zones = new Float32Array(3 * ZONES * 4);
  const ZONE_TEX = new THREE.DataTexture(zones, 3, ZONES, THREE.RGBAFormat, THREE.FloatType);
  ZONE_TEX.minFilter = ZONE_TEX.magFilter = THREE.NearestFilter; ZONE_TEX.generateMipmaps = false; ZONE_TEX.needsUpdate = true;
  const U = { uZoneBin: { value: BIN_TEX }, uZoneData: { value: ZONE_TEX } };
  // zone k lights the box a–b (each [x, y, z]) in `color` times `k`, fading over `soft` metres at its sides
  NAV.lightZone = (k, a, b, color, strength = 1, soft = 0.6) => {
    if (k >= ZONES) { console.warn('light zones are full'); return; }
    const c = new THREE.Color(color).multiplyScalar(strength);
    zones.set([a[0], a[1], a[2], soft, b[0], b[1], b[2], 0, c.r, c.g, c.b, 0], k * 12);
    ZONE_TEX.needsUpdate = true;
    // list it in every bin its box reaches, soft edge included
    const i0 = NAV.clamp(Math.floor((a[0] - soft - BIN_X0) / BIN_W), 0, BINS - 1), i1 = NAV.clamp(Math.floor((b[0] + soft - BIN_X0) / BIN_W), 0, BINS - 1);
    for (let i = i0; i <= i1; i++) {
      let s = 0;
      while (s < SLOTS && bins[(i * SLOTS + s) * 4] !== 0 && bins[(i * SLOTS + s) * 4] !== k + 1) s++;
      if (s < SLOTS) bins[(i * SLOTS + s) * 4] = k + 1; else console.warn(`light zones: the bin at x ${BIN_X0 + i * BIN_W} m is full`);
    }
    BIN_TEX.needsUpdate = true;
  };
  // the next free zone: 0–3 light the lane, 4–6 the pooja shop; shops built later take theirs from here
  let nextZone = 7;
  NAV.addLight = (a, b, color, strength, soft) => NAV.lightZone(nextZone++, a, b, color, strength, soft);
  const ZONE_GLSL = `
#if defined( RE_IndirectDiffuse )
  {
    int zBin = int( clamp( floor( ( vWPos.x - ${BIN_X0.toFixed(1)} ) / ${BIN_W.toFixed(1)} ), 0.0, ${(BINS - 1).toFixed(1)} ) );
    for ( int s = 0; s < ${SLOTS}; s ++ ) {
      int k = int( texelFetch( uZoneBin, ivec2( s, zBin ), 0 ).r * 255.0 + 0.5 ) - 1;
      if ( k < 0 ) break;                                       // the end of this bin's list
      vec4 za = texelFetch( uZoneData, ivec2( 0, k ), 0 ), zb = texelFetch( uZoneData, ivec2( 1, k ), 0 );
      if ( any( lessThan( vWPos, za.xyz - za.w ) ) || any( greaterThan( vWPos, zb.xyz + za.w ) ) ) continue;
      vec3 lo = smoothstep( za.xyz - za.w, za.xyz + za.w, vWPos ), hi = 1.0 - smoothstep( zb.xyz - za.w, zb.xyz + za.w, vWPos );
      irradiance += texelFetch( uZoneData, ivec2( 2, k ), 0 ).rgb * lo.x * lo.y * lo.z * hi.x * hi.y * hi.z;
    }
  }
#endif
`;
  function patch(shader) {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <project_vertex>', `#include <project_vertex>
  vec4 dWP = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  dWP = instanceMatrix * dWP;
#endif
  vWPos = ( modelMatrix * dWP ).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWPos;
uniform highp sampler2D uZoneData;
uniform sampler2D uZoneBin;`)
      .replace('#include <lights_fragment_begin>', '#include <lights_fragment_begin>\n' + ZONE_GLSL);
  }

  // ---- materials ------------------------------------------------------------------------------------------------------
  const CACHE = new Map();
  // o: map, opacity, side, alphaTest, emissive, emissiveIntensity, vc (vertex colours), ink (false | 'soft'), unique
  NAV.toon = (color, o = {}) => {
    const key = [color, o.map ? o.map.uuid : '', o.opacity ?? 1, o.side ?? 0, o.alphaTest ?? 0, o.emissive ?? '', o.emissiveIntensity ?? '', o.vc ?? '', o.ink ?? '', o.polyOffset ?? ''].join('|');
    if (!o.unique && CACHE.has(key)) return CACHE.get(key);
    const m = new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT });
    if (o.map) m.map = o.map;
    if (o.opacity !== undefined && o.opacity < 1) { m.transparent = true; m.opacity = o.opacity; }
    if (o.alphaTest) m.alphaTest = o.alphaTest;
    if (o.side) m.side = o.side;
    if (o.vc) { m.vertexColors = true; m.userData.inkVertex = true; }
    if (o.emissive !== undefined) { m.emissive.set(o.emissive); m.emissiveIntensity = o.emissiveIntensity ?? 1; }
    if (o.polyOffset) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2; }
    if (o.ink !== undefined) m.userData.ink = o.ink;
    m.onBeforeCompile = patch;
    if (!o.unique) { m.userData.cached = true; CACHE.set(key, m); }   // shared: shops' loose parts in it are pooled (nav-shop.js)
    return m;
  };
  // plain colours merged into one mesh carry their colour and their ink id per vertex
  NAV.toonVC = (side = THREE.FrontSide) => NAV.toon(0xffffff, { vc: true, side });
  NAV.inkIdOfColor = (hex) => 0.06 + ((hex * 0.6180339887) % 1) * 0.42;

  // printed goods: an atlas of labels, one cell per product, chosen per instance
  NAV.labelMat = (atlas, n) => {
    const m = NAV.toon(0xffffff, { map: atlas, unique: true });
    m.onBeforeCompile = (shader) => {
      patch(shader);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 uvOff;')
        .replace('#include <uv_vertex>', `#include <uv_vertex>\n#ifdef USE_MAP\n  vMapUv = vMapUv * ${(1 / n).toFixed(6)} + uvOff;\n#endif`);
    };
    m.customProgramCacheKey = () => 'nav-label-' + n;
    return m;
  };

  // ---- the line-art pass: normal and ink id of every solid thing ------------------------------------------------------
  const NRM_VS = `
    varying vec3 vN; varying vec2 vUv0; varying float vViewZ;
    #ifdef USE_INKID
    attribute float inkId; varying float vInkId;
    #endif
    void main() {
      vUv0 = uv;
    #ifdef USE_INKID
      vInkId = inkId;
    #endif
      vec3 objectNormal = normal; vec4 p = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      mat3 im = mat3(instanceMatrix);
      objectNormal /= vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2]));
      objectNormal = im * objectNormal;
      p = instanceMatrix * p;
    #endif
      vN = normalize(normalMatrix * objectNormal);
      vec4 mv = modelViewMatrix * p; vViewZ = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`;
  const NRM_FS = `
    uniform float uId; uniform sampler2D uMap; uniform float uCut;
    varying vec3 vN; varying vec2 vUv0; varying float vViewZ;
    #ifdef USE_INKID
    varying float vInkId;
    #endif
    void main() {
    #ifdef USE_CUT
      if (texture2D(uMap, vUv0).a < uCut) discard;
    #endif
      vec3 n = normalize(vN);
      if (!gl_FrontFacing) n = -n;
      if (n.z < 0.0) n = -n;               // facing the camera, so x and y are enough
    #ifdef USE_INKID
      float id = vInkId;
    #else
      float id = uId;
    #endif
      gl_FragColor = vec4(n.xy, vViewZ, id);  // normal, view depth, ink id: the line art and the holograms' occlusion read it
    }`;
  const NRM_CACHE = new Map();
  // ids: 0 = no lines, 0.06–0.48 regular ink, 0.54–0.96 soft lines (garlands, plants)
  const inkIdOf = (m) => { const h = (m.id * 0.6180339887) % 1; return m.userData.ink === false ? 0 : m.userData.ink === 'soft' ? 0.54 + h * 0.42 : 0.06 + h * 0.42; };
  // the stand-in a mesh wears in the line-art pass, or null when it shouldn't be drawn there (see-through things)
  NAV.inkMaterial = (m) => {
    if (!m || Array.isArray(m) || m.userData.inkSkip) return null;
    if (m.transparent && (!m.depthWrite || m.opacity < 0.75)) return null;
    let nm = NRM_CACHE.get(m);
    if (!nm) {
      const defines = {};
      if (m.alphaTest > 0 && m.map) defines.USE_CUT = '';
      if (m.userData.inkVertex) defines.USE_INKID = '';
      // pushed back a hair, so the colour pass, which tests against this depth, never loses a surface to rounding
      nm = new THREE.ShaderMaterial({ uniforms: { uId: { value: inkIdOf(m) }, uMap: { value: m.map || null }, uCut: { value: m.alphaTest } }, vertexShader: NRM_VS, fragmentShader: NRM_FS, side: m.side, defines,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      NRM_CACHE.set(m, nm);
    }
    return nm;
  };
})();
