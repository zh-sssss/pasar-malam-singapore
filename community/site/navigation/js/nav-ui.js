// DOM side of the page: stall directory, stall card, hover label, route bar, view toggle and top-view labels.
(function () {
  const NAV = window.NAV;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const SIDE = { NE: 'north-east side', SW: 'south-west side', centre: 'Serangoon Road' };
  const GROUP = (e) => (e.kind === 'landmark' ? 'Landmarks' : (NAV.CAT[e.category] || NAV.CAT.other).label);

  NAV.ui = function (data, world) {
    const list = data.entities.filter((e) => e.interactive);
    const ui = {};
    let filter = 'all', query = '';

    // ---- directory -----------------------------------------------------------------------------------------
    const dir = $('#dir'), dirList = $('#dir-list'), search = $('#dir-search');
    function renderList() {
      const q = query.trim().toLowerCase();
      const rows = list.filter((e) => {
        if (filter === 'stalls' && e.kind !== 'bazaar_stall') return false;
        if (filter === 'shops' && !['local_shop', 'shop_extension'].includes(e.kind)) return false;
        if (!q) return true;
        return [e.name, e.goods, e.sign_text, (NAV.CAT[e.category] || {}).label, NAV.shortId(e.id)].join(' ').toLowerCase().includes(q);
      });
      const groups = new Map();
      for (const e of rows) { const g = GROUP(e); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(e); }
      const order = Object.values(NAV.CAT).map((c) => c.label).concat('Landmarks');
      dirList.innerHTML = [...groups.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).map(([g, es]) => {
        const col = (Object.values(NAV.CAT).find((c) => c.label === g) || { color: '#9aa3ad' }).color;
        return `<li class="grp"><span class="dot" style="background:${col}"></span>${esc(g)}<span class="n">${es.length}</span></li>` +
          es.sort((a, b) => a.x0 - b.x0).map((e) => `<li><button class="item" data-id="${e.id}"><span class="sid">${NAV.shortId(e.id)}</span>` +
            `<span class="nm">${esc(e.name)}</span><span class="kd">${esc(NAV.KIND[e.kind])} · ${e.side === 'NE' ? 'NE' : e.side === 'SW' ? 'SW' : ''} side</span></button></li>`).join('');
      }).join('') || '<li class="empty">Nothing matches.</li>';
      $('#dir-count').textContent = `${rows.length} of ${list.length}`;
    }
    search.addEventListener('input', () => { query = search.value; renderList(); });
    document.querySelectorAll('#dir-filter button').forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.f; document.querySelectorAll('#dir-filter button').forEach((o) => o.setAttribute('aria-pressed', o === b)); renderList();
    }));
    dirList.addEventListener('click', (ev) => { const b = ev.target.closest('.item'); if (b) NAV.emit('pickFromList', b.dataset.id); });
    // a closed panel is out of the tab order and hidden from screen readers
    dir.inert = true;
    ui.toggleDir = (open = !dir.classList.contains('open')) => {
      dir.classList.toggle('open', open); dir.inert = !open; $('#btn-dir').setAttribute('aria-expanded', open);
      if (open) NAV.emit('dirOpen');
      if (open && matchMedia('(pointer: fine)').matches) setTimeout(() => search.focus(), 220);
    };
    $('#btn-dir').addEventListener('click', () => ui.toggleDir());
    $('#dir-close').addEventListener('click', () => ui.toggleDir(false));
    renderList();
    // credits, from the data's own lines: the photos, the map, the event
    $('#credits-text').innerHTML = [`Photos: ${esc(data.credit)}, for teaching use.`, `Map data ${esc(data.attribution)}.`, esc(data.event) + '.',
      'Built with three.js. Type: Fredoka and Noto Sans Tamil.'].join('<br>');

    // ---- card --------------------------------------------------------------------------------------------------
    const card = $('#card');
    let shots = [], shot = 0;
    function showShot() {
      const img = $('#card-img'), s = shots[shot];
      $('#card-photo').classList.toggle('none', !s);
      if (!s) return;
      img.src = 'generated/' + s.file; img.alt = `Photo of ${$('#card-title').textContent}`;
      $('#card-credit').textContent = `Photo · ${data.credit} · ${NAV.fmtVideo(s.t)}`;
      $('#card-prev').hidden = $('#card-next').hidden = shots.length < 2;
      $('#card-count').textContent = shots.length > 1 ? `${shot + 1} / ${shots.length}` : '';
    }
    $('#card-prev').addEventListener('click', () => { shot = (shot + shots.length - 1) % shots.length; showShot(); });
    $('#card-next').addEventListener('click', () => { shot = (shot + 1) % shots.length; showShot(); });
    ui.showCard = (e) => {
      const cat = NAV.CAT[e.category] || NAV.CAT.other;
      $('#card-title').textContent = e.name || 'Unnamed stall';
      $('#card-id').textContent = NAV.shortId(e.id);
      $('#card-kind').textContent = NAV.KIND[e.kind];
      $('#card-kind').dataset.kind = e.kind;
      $('#card-cat').innerHTML = `<span class="dot" style="background:${cat.color}"></span>${esc(cat.label)}`;
      $('#card-where').textContent = [SIDE[e.side], e.unit && !/^gap/.test(e.unit) ? `by ${e.unit}` : ''].filter(Boolean).join(' · ');
      $('#card-goods').textContent = e.goods || '';
      const op = e.operator && data.entities.find((o) => o.id === e.operator);
      $('#card-op').innerHTML = op ? `Run by <button class="link" data-id="${op.id}">${esc(op.name)}</button>` : e.operator ? `Run by ${esc(e.operator)}` : '';
      $('#card-sign').innerHTML = e.sign_text ? `<span class="lbl">Sign</span> <span lang="${(e.sign_languages || '').includes('ta') ? 'ta' : 'en'}">${esc(e.sign_text.replace(/\s*\|\s*/g, ' · '))}</span>` : '';
      const ov = e.overflow;
      $('#card-ar').hidden = !(NAV.arFor && NAV.arFor(e.id));
      $('#card-line').innerHTML = ov ? `<span class="lbl">Aisle line</span> ${e.yellow_line === 'goods_past_line' ? 'Goods stand past' : 'Goods stand on'} the yellow line${ov.past_line_m ? `, reaching about ${ov.past_line_m} m into the aisle` : ''}.` : '';
      shots = e.stills || []; shot = 0; showShot();
      ui.shown = e; renderSheets(e);
      card.classList.add('open'); card.inert = false; card.dataset.id = e.id;
      card.scrollTop = 0;
    };
    // reviews and offers from the Sheet (nav-reviews.js); the open card refreshes when they arrive
    function renderSheets(e) {
      if (!NAV.reviews) return;
      $('#card-reviews').classList.remove('all');
      NAV.reviews.renderOffers($('#card-offers'), e, data.entities); NAV.reviews.renderReviews($('#card-reviews'), e);
      if (NAV.reviews.stale()) NAV.reviews.load();
    }
    if (NAV.reviews) NAV.reviews.onChange(() => { if (card.dataset.id && ui.shown) { NAV.reviews.renderOffers($('#card-offers'), ui.shown, data.entities); NAV.reviews.renderReviews($('#card-reviews'), ui.shown); } });
    ui.hideCard = () => { card.classList.remove('open'); card.inert = true; delete card.dataset.id; };
    card.inert = true;
    $('#card-close').addEventListener('click', () => NAV.emit('deselect'));
    $('#card-op').addEventListener('click', (ev) => { const b = ev.target.closest('[data-id]'); if (b) NAV.emit('pickFromList', b.dataset.id); });
    $('#card-route').addEventListener('click', () => NAV.emit('routeTo', card.dataset.id));
    $('#card-above').addEventListener('click', () => NAV.emit('seeFromAbove', card.dataset.id));
    $('#card-ar').addEventListener('click', () => NAV.emit('arPlay', card.dataset.id));

    // ---- hover label ------------------------------------------------------------------------------------------
    const tip = $('#tip');
    ui.showTip = (e, x, y) => {
      const cat = NAV.CAT[e.category] || NAV.CAT.other;
      tip.innerHTML = `<span class="dot" style="background:${cat.color}"></span><b>${esc(e.name)}</b><span class="sid">${NAV.shortId(e.id)}</span>`;
      tip.style.transform = `translate(${Math.round(x + 14)}px, ${Math.round(y + 16)}px)`;
      tip.classList.add('on');
    };
    ui.hideTip = () => tip.classList.remove('on');

    // ---- route bar --------------------------------------------------------------------------------------------
    ui.setRoute = (e, metres) => {
      $('#route-name').textContent = e.name;
      $('#route-meta').textContent = `${Math.round(metres)} m · about ${NAV.fmtTime(metres / 1.2)} on foot`;
      $('#routebar').classList.add('on');
    };
    ui.clearRoute = () => $('#routebar').classList.remove('on');
    ui.setWalking = (on) => { $('#route-go').textContent = on ? 'Stop' : 'Walk there'; $('#route-go').dataset.on = on ? '1' : ''; };
    $('#route-go').addEventListener('click', () => NAV.emit($('#route-go').dataset.on ? 'stopWalk' : 'go'));
    $('#route-clear').addEventListener('click', () => NAV.emit('clearRoute'));

    // ---- view toggle and hints ------------------------------------------------------------------------------
    document.querySelectorAll('#view button').forEach((b) => b.addEventListener('click', () => NAV.emit('view', b.dataset.v)));
    ui.setMode = (mode) => {
      const v = mode === 'top' ? 'top' : 'walk';
      document.querySelectorAll('#view button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
      document.body.dataset.mode = mode;
    };
    ui.hint = (on) => $('#hint').classList.toggle('on', on);
    // the before/after slider
    $('#btn-cmp').addEventListener('click', () => NAV.emit('compare'));
    ui.setCompare = (on) => { $('#btn-cmp').setAttribute('aria-pressed', on); document.body.classList.toggle('comparing', on); };

    // ---- crosshair for mouse look -------------------------------------------------------------------------------
    const xhair = $('#xhair'), xlabel = $('#xlabel');
    let xTarget;
    ui.setCrosshair = (e) => {
      if (e === xTarget) return;
      xTarget = e;
      xhair.classList.toggle('on', !!e); xlabel.classList.toggle('on', !!e);
      if (!e) return;
      const cat = NAV.CAT[e.category] || NAV.CAT.other;
      xhair.style.setProperty('--ring', cat.color);
      xlabel.innerHTML = `<span class="dot" style="background:${cat.color}"></span><b>${esc(e.name)}</b><span class="act">click</span>`;
    };
    ui.setLocked = (on) => {
      document.body.classList.toggle('locked', on);
      if (on) { $('#lookchip').classList.remove('on'); clearTimeout(ui._esc); $('#esctip').classList.add('on'); ui._esc = setTimeout(() => $('#esctip').classList.remove('on'), 3200); }
      else $('#esctip').classList.remove('on');
    };

    // ---- labels for the top view ------------------------------------------------------------------------------
    const layer = $('#labels');
    const labels = list.map((e) => {
      const el = document.createElement('button');
      el.className = 'lab'; el.dataset.id = e.id; el.dataset.kind = e.kind; el.tabIndex = -1;
      const cat = NAV.CAT[e.category] || NAV.CAT.other;
      el.innerHTML = `<span class="dot" style="background:${cat.color}"></span><span class="sid">${NAV.shortId(e.id)}</span><span class="nm">${esc(e.name)}</span>`;
      layer.appendChild(el);
      const ent = world.entities.get(e.id);
      return { el, e, p: ent ? ent.label : [e.x0, 2, e.z0] };
    });
    layer.addEventListener('click', (ev) => { const b = ev.target.closest('.lab'); if (b) NAV.emit('pickFromList', b.dataset.id); });
    // far: coloured dots; nearer: IDs; close: IDs and names. Labels that would overlap one already placed are hidden,
    // except the selected one, which is placed first and always shows.
    ui.updateLabels = (camera, mode, height, THREE) => {
      const show = mode === 'top';
      layer.classList.toggle('on', show);
      if (!show) return;
      const level = height > 105 ? 'dots' : height > 52 ? 'ids' : 'names';
      layer.classList.toggle('dots', level === 'dots'); layer.classList.toggle('names', level === 'names');
      const v = new THREE.Vector3(), w = innerWidth, h = innerHeight, placed = [];
      const order = labels.slice().sort((a, b) => (b.e.id === NAV.state.selected) - (a.e.id === NAV.state.selected));
      for (const l of order) {
        v.set(l.p[0], 0.5, l.p[2]).project(camera);
        const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
        const sel = NAV.state.selected === l.e.id;
        const bw = level === 'dots' && !sel ? 14 : level === 'names' ? 56 + Math.min(150, l.e.name.length * 6.6) : 50, bh = level === 'dots' && !sel ? 14 : 22;
        const box = [x - (level === 'dots' && !sel ? 7 : 12), y - (bh / 2), bw, bh];
        const hit = placed.some((p) => box[0] < p[0] + p[2] + 2 && p[0] < box[0] + box[2] + 2 && box[1] < p[1] + p[3] + 2 && p[1] < box[1] + box[3] + 2);
        const off = !sel && hit;
        if (!off) placed.push(box);
        l.el.classList.toggle('off', off);
        l.el.classList.toggle('sel', sel);
        l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
    };

    return ui;
  };
})();
