// The before/after slider (S8): one view split at a seam you drag. Left of the seam is the lane before the bazaar came,
// with no tents and no festival stalls and the shops' goods kept inside the yellow lines; right of it is the lane during
// the bazaar, as walked. The view renders twice and the second, the lane before, is cut off at the seam on its way to the
// screen; everything in between renders in full, so both halves keep their line art.
(function () {
  const NAV = window.NAV;

  class Compare {
    // hideAlso(): the AR layer's own pieces (marks, trail, markers) that belong to the bazaar's time
    constructor(holo, world, hideAlso = () => []) {
      this.holo = holo; this.world = world; this.hideAlso = hideAlso;
      this.on = false; this.seam = 0.5;
      this.hidden = [];
    }
    // the screen x of the seam, in CSS pixels
    seamX() { return this.seam * innerWidth; }
    // a hit left of the seam can't be a festival stall or tent: they aren't there before the bazaar
    absentAt(cx, e) { return this.on && cx < this.seamX() && !!e && (e.kind === 'bazaar_stall' || e.kind === 'other'); }

    // the lane before the bazaar: every hologram (the festival's stalls and tents, their signs and rings) hidden, the
    // goods that stand past a line pulled back inside it
    before(on) {
      if (on) {
        this.hidden = [];
        for (const h of this.holo.entries.values()) if (h.group.visible) { h.group.visible = false; this.hidden.push(h.group); }
        for (const o of this.hideAlso()) if (o && o.visible) { o.visible = false; this.hidden.push(o); }
        for (const o of this.world.overflow) if (o.mesh) o.mesh.position.z += (o.e.side === 'SW' ? 1 : -1) * (o.past + 0.12);
      } else {
        for (const o of this.hidden) o.visible = true;
        this.hidden = [];
        for (const o of this.world.overflow) if (o.mesh) o.mesh.position.z -= (o.e.side === 'SW' ? 1 : -1) * (o.past + 0.12);
      }
    }
    render(scene, camera, dt, time) {
      const R = this.holo.r;
      this.holo.render(scene, camera, dt, time);                  // during the bazaar, the whole view
      this.before(true);
      // render targets ignore the renderer's scissor, so only the final copy to the screen is cut at the seam
      R.setScissorTest(true); R.setScissor(0, 0, Math.max(1, Math.round(this.seamX())), innerHeight);
      this.holo.render(scene, camera, 0, time);
      R.setScissorTest(false);
      this.before(false);
    }
  }
  NAV.Compare = Compare;

  // the seam on screen: a line with a knob to drag, the two names either side of it
  NAV.compareUI = function (compare, onChange) {
    const el = document.getElementById('cmp'), knob = document.getElementById('cmp-knob');
    const place = () => { el.style.setProperty('--seam', `${(compare.seam * 100).toFixed(2)}%`); knob.setAttribute('aria-valuenow', Math.round(compare.seam * 100)); };
    const setSeam = (v) => { compare.seam = NAV.clamp(v, 0.06, 0.94); place(); if (onChange) onChange(); };
    let drag = null;
    knob.addEventListener('pointerdown', (ev) => { ev.preventDefault(); knob.setPointerCapture(ev.pointerId); drag = ev.pointerId; el.classList.add('drag'); });
    knob.addEventListener('pointermove', (ev) => { if (drag === ev.pointerId) setSeam(ev.clientX / innerWidth); });
    const end = (ev) => { if (drag === ev.pointerId) { drag = null; el.classList.remove('drag'); } };
    knob.addEventListener('pointerup', end); knob.addEventListener('pointercancel', end);
    knob.addEventListener('keydown', (ev) => {
      const step = ev.shiftKey ? 0.1 : 0.03;
      if (ev.key === 'ArrowLeft') { setSeam(compare.seam - step); ev.preventDefault(); ev.stopPropagation(); }
      if (ev.key === 'ArrowRight') { setSeam(compare.seam + step); ev.preventDefault(); ev.stopPropagation(); }
      if (ev.key === 'Home') setSeam(0.06);
      if (ev.key === 'End') setSeam(0.94);
    });
    return {
      show(on) { el.classList.toggle('on', on); el.setAttribute('aria-hidden', !on); place(); },
      setSeam,
    };
  };
})();
