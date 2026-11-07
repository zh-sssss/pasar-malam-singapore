// Visitor reviews and merchants' offers on the cards (S9). Both come from a Google Sheet published as CSV
// (reviews-config.js); a Google Form adds rows, and only rows a moderator has approved are shown. Nothing is shown that
// isn't in the Sheet: with no Sheet configured the cards say so plainly.
(function () {
  const NAV = window.NAV;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // RFC 4180: quoted fields, doubled quotes, commas and line breaks inside quotes
  function parseCSV(text) {
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
      if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim()));
  }
  // rows as objects keyed by what each column is, found from its header's words (forms name questions freely)
  function table(text, want) {
    const [head, ...rows] = parseCSV(text);
    if (!head) return [];
    const col = {};
    for (const [key, re] of Object.entries(want)) col[key] = head.findIndex((h) => re.test(h.trim().toLowerCase()));
    return rows.map((r) => Object.fromEntries(Object.entries(col).map(([k, i]) => [k, i >= 0 ? (r[i] || '').trim() : ''])));
  }
  const yes = (v) => /^(true|yes|y|1|✓|✔|approved)$/i.test(v.trim());
  // the stall's ID at the start of the answer ("NE-07 · Bangle shop lane display", "ne07", "N07")
  const idOf = (v) => {
    const m = v.toUpperCase().match(/\b(NE|SW|LM)[-\s]?0*(\d{1,2})\b/) || v.toUpperCase().match(/\b([NSL])0*(\d{1,2})\b/);
    if (!m) return '';
    const side = { N: 'NE', S: 'SW', L: 'LM' }[m[1]] || m[1];
    return `${side}-${m[2].padStart(2, '0')}`;
  };
  // dates as Sheets writes them in Singapore (d/m/y) or as ISO; null when there is nothing to read
  function day(v) {
    if (!v) return null;
    let m = v.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    return null;
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDay = (d) => (d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '');
  const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  const cfg = Object.assign({ reviewsCsv: '', reviewForm: '', reviewFormStall: '', offersCsv: '', offerForm: '', offerFormStall: '' }, window.NAV_SHEETS || {});
  const state = { reviews: null, offers: null, failed: { reviews: false, offers: false }, at: 0 };
  const listeners = [];

  async function fetchCSV(url) {
    const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'cb=' + Math.floor(Date.now() / 60000), { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    return r.text();
  }
  async function load() {
    state.at = Date.now();
    const jobs = [];
    if (cfg.reviewsCsv) jobs.push(fetchCSV(cfg.reviewsCsv).then((t) => {
      state.reviews = table(t, { time: /timestamp|time|date/, stall: /stall|shop|^id$/, name: /your name|^name$|display name|nickname/, rating: /rating|stars|score/, text: /review|comment|experience/, ok: /approv|publish|show/ })
        .filter((r) => yes(r.ok) && idOf(r.stall) && r.text)
        .map((r) => ({ id: idOf(r.stall), name: r.name.slice(0, 40), rating: NAV.clamp(+r.rating || 0, 0, 5), text: r.text.slice(0, 700), date: day(r.time) }));
      state.failed.reviews = false;
    }).catch(() => { state.failed.reviews = true; }));
    if (cfg.offersCsv) jobs.push(fetchCSV(cfg.offersCsv).then((t) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      state.offers = table(t, { stall: /stall|shop|^id$/, title: /title|offer|headline/, text: /detail|description|text/, from: /from|start/, until: /until|end|to$/, link: /link|url|website/, ok: /approv|publish|show/ })
        .filter((r) => yes(r.ok) && idOf(r.stall) && (r.title || r.text))
        .map((r) => ({ id: idOf(r.stall), title: r.title.slice(0, 80), text: r.text.slice(0, 400), from: day(r.from), until: day(r.until), link: /^https?:\/\//i.test(r.link) ? r.link : '' }))
        .filter((o) => (!o.from || o.from <= today) && (!o.until || o.until >= today));
      state.failed.offers = false;
    }).catch(() => { state.failed.offers = true; }));
    await Promise.all(jobs);
    listeners.forEach((fn) => fn());
  }

  // a form link with the stall filled in, when the form's question is known
  const formLink = (url, field, e) => (!url ? '' : field ? `${url}${url.includes('?') ? '&' : '?'}usp=pp_url&${encodeURIComponent(field)}=${encodeURIComponent(`${e.id} · ${e.name}`)}` : url);
  // a shop's offers show on its displays' cards too, and a display's on its shop's
  function family(e, all) { const ids = new Set([e.id]); if (e.operator) ids.add(e.operator); for (const o of all) if (o.operator === e.id) ids.add(o.id); return ids; }

  NAV.reviews = {
    load, onChange: (fn) => listeners.push(fn),
    stale: () => Date.now() - state.at > 5 * 60 * 1000,
    renderReviews(el, e) {
      const mine = (state.reviews || []).filter((r) => r.id === e.id).reverse();         // newest first (forms append)
      const rated = mine.filter((r) => r.rating > 0), avg = rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : 0;
      const write = formLink(cfg.reviewForm, cfg.reviewFormStall, e);
      let html = '<h3>Visitor reviews</h3>';
      if (mine.length) {
        html += `<p class="rsum">${rated.length ? `<span class="stars" aria-label="${avg.toFixed(1)} out of 5">${stars(avg)}</span> ${avg.toFixed(1)} · ` : ''}${mine.length} review${mine.length > 1 ? 's' : ''}</p><ul class="rlist">` +
          mine.map((r, k) => `<li${k > 2 ? ' class="more"' : ''}><div class="rh"><b>${esc(r.name || 'A visitor')}</b>${r.rating ? `<span class="stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</span>` : ''}<span class="rd">${esc(fmtDay(r.date))}</span></div><p>${esc(r.text)}</p></li>`).join('') + '</ul>' +
          (mine.length > 3 ? `<button class="link rall">Show all ${mine.length}</button>` : '');
      } else html += `<p>${cfg.reviewsCsv && state.failed.reviews ? 'Reviews couldn’t load just now.' : 'No reviews yet.'}</p>`;
      if (write) html += `<a class="btn small" href="${esc(write)}" target="_blank" rel="noopener">Write a review</a><p class="fine">Reviews appear here once a moderator has read them.</p>`;
      el.innerHTML = html;
      const all = el.querySelector('.rall'); if (all) all.addEventListener('click', () => { el.classList.add('all'); all.remove(); });
    },
    renderOffers(el, e, entities) {
      const ids = family(e, entities), mine = (state.offers || []).filter((o) => ids.has(o.id));
      const post = formLink(cfg.offerForm, cfg.offerFormStall, e);
      let html = '<h3>Offers from the shop</h3>';
      if (mine.length) html += '<ul class="olist">' + mine.map((o) => `<li><b>${esc(o.title)}</b>${o.text ? `<p>${esc(o.text)}</p>` : ''}<span class="rd">${o.until ? `Until ${esc(fmtDay(o.until))}` : ''}${o.link ? `${o.until ? ' · ' : ''}<a href="${esc(o.link)}" target="_blank" rel="noopener">More</a>` : ''}</span></li>`).join('') + '</ul>';
      else html += `<p>${cfg.offersCsv && state.failed.offers ? 'Offers couldn’t load just now.' : 'Nothing posted yet.'}${post ? '' : ' Merchants can add their own offers here.'}</p>`;
      if (post) html += `<a class="link" href="${esc(post)}" target="_blank" rel="noopener">Merchants: post an offer</a>`;
      el.innerHTML = html;
    },
  };
  // exposed for the checks: the parser and the readers, with no network
  NAV.reviews._test = { parseCSV, table, idOf, day, yes, set: (k, v) => { state[k] = v; } };
})();
