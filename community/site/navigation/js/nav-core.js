// Shared namespace, constants and helpers for the navigation page. Plain script (not a module) so the page
// also runs from file://; three.js arrives as window.THREE from the bootstrap in index.html.
(function () {
  const NAV = (window.NAV = window.NAV || {});

  NAV.CAT = {
    clothing: { label: 'Clothing', color: '#d98b9b' },
    snacks_sweets: { label: 'Snacks & sweets', color: '#e2b04a' },
    flowers_garlands: { label: 'Flowers & garlands', color: '#f0c43c' },
    festive_decor: { label: 'Festive décor', color: '#e07a4f' },
    religious_items: { label: 'Religious items', color: '#c2694b' },
    jewellery: { label: 'Jewellery', color: '#c9a227' },
    henna_beauty: { label: 'Henna & beauty', color: '#b5785a' },
    handicrafts: { label: 'Handicrafts', color: '#a98bc9' },
    fruit_veg: { label: 'Fruit & veg', color: '#79b06a' },
    household: { label: 'Household', color: '#7fa3b8' },
    food_drink: { label: 'Food & drink', color: '#cf8f5f' },
    services: { label: 'Services', color: '#8c9aa6' },
    other: { label: 'Other', color: '#b8ada0' },
  };
  NAV.KIND = { local_shop: 'Local shop', shop_extension: 'Shop display', bazaar_stall: 'Festival stall', landmark: 'Landmark', other: 'Other' };

  NAV.EYE = 1.6;          // eye height, m
  NAV.WALK = 2.4;         // walking speed, m/s: brisker than a stroll, as the user asked (2026-10-30)
  NAV.RUN = 5.4;          // with Shift
  NAV.LINE_Z = 1.75;      // the aisle's yellow lines sit at z = ±1.75 m

  NAV.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  NAV.lerp = (a, b, t) => a + (b - a) * t;
  NAV.smoothstep = (a, b, v) => { const t = NAV.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // minimum-jerk profile: zero velocity and acceleration at both ends, one smooth bell of speed in between
  NAV.ease = (t) => t * t * t * (10 + t * (-15 + 6 * t));
  NAV.wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  NAV.fmtTime = (s) => { s = Math.round(s); return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60 ? (s % 60) + ' s' : ''}`.trim(); };
  NAV.fmtVideo = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  NAV.shortId = (id) => id.replace('NE-', 'N').replace('SW-', 'S').replace('LM-', 'L');

  // tiny event bus between scene, controller and UI
  const handlers = {};
  NAV.on = (name, fn) => { (handlers[name] = handlers[name] || []).push(fn); };
  NAV.emit = (name, payload) => { (handlers[name] || []).forEach((fn) => fn(payload)); };

  NAV.state = { mode: 'walk', hovered: null, selected: null, route: null, reducedMotion: false };

  // the parts of the lane built at final quality register here in load order (nav-shop, nav-mouth, nav-lane1…): each is
  // { buildings: [OSM ids it replaces], columns(x, z), build(root, grid) → { [entity id]: parts, box: {id: Box3}, pick: {id: [Box3]} } }
  NAV.detailed = [];
  // shop displays a stage found standing in the tent row although S0 filed them under the five-foot way: they get a tent too
  NAV.tentFor = new Set();
})();
