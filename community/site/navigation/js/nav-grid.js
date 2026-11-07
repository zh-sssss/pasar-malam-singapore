// Walkable grid over the lane frame (x along the lane, z across): collision for walking, A* for routes.
(function () {
  const NAV = window.NAV;

  class Grid {
    constructor(x0, z0, x1, z1, cell) {
      this.x0 = x0; this.z0 = z0; this.cell = cell;
      this.w = Math.ceil((x1 - x0) / cell); this.h = Math.ceil((z1 - z0) / cell);
      this.blocked = new Uint8Array(this.w * this.h);
      this.clear = null; // blocked mask grown by the walker's clearance, built by finish()
    }
    i(x) { return Math.floor((x - this.x0) / this.cell); }
    j(z) { return Math.floor((z - this.z0) / this.cell); }
    cx(i) { return this.x0 + (i + 0.5) * this.cell; }
    cz(j) { return this.z0 + (j + 0.5) * this.cell; }
    inside(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h; }

    fillRect(xa, za, xb, zb, v = 1) {
      const i0 = Math.max(0, this.i(Math.min(xa, xb))), i1 = Math.min(this.w - 1, this.i(Math.max(xa, xb)));
      const j0 = Math.max(0, this.j(Math.min(za, zb))), j1 = Math.min(this.h - 1, this.j(Math.max(za, zb)));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) this.blocked[j * this.w + i] = v;
    }
    fillCircle(x, z, r) {
      const i0 = Math.max(0, this.i(x - r)), i1 = Math.min(this.w - 1, this.i(x + r));
      const j0 = Math.max(0, this.j(z - r)), j1 = Math.min(this.h - 1, this.j(z + r));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        if (Math.hypot(this.cx(i) - x, this.cz(j) - z) <= r + this.cell * 0.5) this.blocked[j * this.w + i] = 1;
      }
    }
    fillPolygon(pts, v = 1) {
      let xa = Infinity, xb = -Infinity, za = Infinity, zb = -Infinity;
      for (const [x, z] of pts) { xa = Math.min(xa, x); xb = Math.max(xb, x); za = Math.min(za, z); zb = Math.max(zb, z); }
      const i0 = Math.max(0, this.i(xa)), i1 = Math.min(this.w - 1, this.i(xb));
      const j0 = Math.max(0, this.j(za)), j1 = Math.min(this.h - 1, this.j(zb));
      for (let j = j0; j <= j1; j++) {
        const z = this.cz(j);
        for (let i = i0; i <= i1; i++) {
          const x = this.cx(i);
          let inside = false;
          for (let k = 0, m = pts.length - 1; k < pts.length; m = k++) {
            const [xk, zk] = pts[k], [xm, zm] = pts[m];
            if ((zk > z) !== (zm > z) && x < ((xm - xk) * (z - zk)) / (zm - zk) + xk) inside = !inside;
          }
          if (inside) this.blocked[j * this.w + i] = v;
        }
      }
    }
    // grow the blocked cells by r metres (a square kernel is fine at this cell size). Blocks already round out to whole
    // cells, so r rounds to the nearest cell rather than up: 0.35 m is one cell, and a 1.3 m five-foot way stays open
    finish(r) {
      const n = Math.max(1, Math.round(r / this.cell)), { w, h } = this;
      const rows = new Uint8Array(w * h), out = new Uint8Array(w * h);
      for (let j = 0; j < h; j++) {
        let last = -1e9;
        for (let i = 0; i < w; i++) { if (this.blocked[j * w + i]) last = i; if (i - last <= n) rows[j * w + i] = 1; }
        last = 1e9;
        for (let i = w - 1; i >= 0; i--) { if (this.blocked[j * w + i]) last = i; if (last - i <= n) rows[j * w + i] = 1; }
      }
      for (let i = 0; i < w; i++) {
        let last = -1e9;
        for (let j = 0; j < h; j++) { if (rows[j * w + i]) last = j; if (j - last <= n) out[j * w + i] = 1; }
        last = 1e9;
        for (let j = h - 1; j >= 0; j--) { if (rows[j * w + i]) last = j; if (last - j <= n) out[j * w + i] = 1; }
      }
      this.clear = out;
    }

    isBlocked(x, z, mask = this.blocked) {
      const i = this.i(x), j = this.j(z);
      return !this.inside(i, j) || mask[j * this.w + i] === 1;
    }
    // free if no blocked cell touches a circle of radius r around (x, z)
    freeAt(x, z, r) {
      if (this.isBlocked(x, z)) return false;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        if (this.isBlocked(x + Math.cos(a) * r, z + Math.sin(a) * r)) return false;
      }
      return true;
    }
    // move from (x, z) by (dx, dz), sliding along whatever blocks the way
    slide(x, z, dx, dz, r) {
      if (this.freeAt(x + dx, z + dz, r)) return [x + dx, z + dz];
      if (this.freeAt(x + dx, z, r)) return [x + dx, z];
      if (this.freeAt(x, z + dz, r)) return [x, z + dz];
      return [x, z];
    }
    nearestFree(x, z, mask = this.clear) {
      const i0 = this.i(x), j0 = this.j(z);
      for (let rad = 0; rad < 60; rad++) {
        let best = null, bd = Infinity;
        for (let dj = -rad; dj <= rad; dj++) for (let di = -rad; di <= rad; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== rad) continue;
          const i = i0 + di, j = j0 + dj;
          if (!this.inside(i, j) || mask[j * this.w + i]) continue;
          const d = di * di + dj * dj;
          if (d < bd) { bd = d; best = [i, j]; }
        }
        if (best) return best;
      }
      return null;
    }
    los(ax, az, bx, bz, mask = this.clear) {
      const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / (this.cell * 0.5)));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        if (this.isBlocked(ax + (bx - ax) * t, az + (bz - az) * t, mask)) return false;
      }
      return true;
    }

    // A* over the clearance mask, 8-connected, then string-pulled to the fewest straight legs
    findPath(ax, az, bx, bz) {
      const s = this.nearestFree(ax, az), g = this.nearestFree(bx, bz);
      if (!s || !g) return null;
      const { w, h } = this, mask = this.clear, N = w * h;
      const gs = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
      const start = s[1] * w + s[0], goal = g[1] * w + g[0];
      const heur = (k) => { const dx = Math.abs((k % w) - g[0]), dz = Math.abs(((k / w) | 0) - g[1]); return Math.max(dx, dz) + 0.41421 * Math.min(dx, dz); };
      const heap = [[heur(start), start]];
      const push = (f, k) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } }
        return top;
      };
      gs[start] = 0;
      const nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41421], [1, -1, 1.41421], [-1, 1, 1.41421], [-1, -1, 1.41421]];
      while (heap.length) {
        const [, k] = pop();
        if (closed[k]) continue;
        if (k === goal) break;
        closed[k] = 1;
        const i = k % w, j = (k / w) | 0;
        for (const [di, dj, c] of nb) {
          const ni = i + di, nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= w || nj >= h) continue;
          const nk = nj * w + ni;
          if (mask[nk] || closed[nk]) continue;
          if (di && dj && (mask[j * w + ni] || mask[nj * w + i])) continue; // no corner cutting
          const ng = gs[k] + c;
          if (ng < gs[nk]) { gs[nk] = ng; from[nk] = k; push(ng + heur(nk), nk); }
        }
      }
      if (from[goal] < 0 && goal !== start) return null;
      const cells = [];
      for (let k = goal; k >= 0; k = from[k]) { cells.push([this.cx(k % w), this.cz((k / w) | 0)]); if (k === start) break; }
      cells.reverse();
      cells[0] = this.isBlocked(ax, az, mask) ? cells[0] : [ax, az];
      cells[cells.length - 1] = this.isBlocked(bx, bz, mask) ? cells[cells.length - 1] : [bx, bz];
      const pts = [cells[0]];
      let anchor = 0;
      for (let k = 2; k < cells.length; k++) {
        if (!this.los(cells[anchor][0], cells[anchor][1], cells[k][0], cells[k][1])) { pts.push(cells[k - 1]); anchor = k - 1; }
      }
      pts.push(cells[cells.length - 1]);
      return pts;
    }
  }

  NAV.Grid = Grid;
  NAV.pathLength = (pts) => pts.reduce((s, p, k) => (k ? s + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0), 0);
})();
