/**
 * UI primitives: safe HTML templating, icons, dates, toasts and the modal.
 *
 * `html` is a tagged template that ESCAPES every interpolated value by default,
 * so text from the API can never inject markup. Nested `html` results and
 * `raw()` strings are passed through untouched.
 */
(function () {
  'use strict';
  const ns = (window.ClubOS = window.ClubOS || {});
  ns.views = ns.views || {};

  // ------------------------------------------------------------- templating
  class Safe { constructor(s) { this.s = s; } toString() { return this.s; } }
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  function str(v) {
    if (v === null || v === undefined || v === false || v === true) return '';
    if (v instanceof Safe) return v.s;
    if (Array.isArray(v)) return v.map(str).join('');
    return esc(v);
  }
  function html(strings, ...vals) {
    let out = '';
    for (let i = 0; i < strings.length; i++) {
      out += strings[i];
      if (i < vals.length) out += str(vals[i]);
    }
    return new Safe(out);
  }
  const raw = (s) => new Safe(String(s));

  // ------------------------------------------------------------------ icons
  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    board: '<path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>'
  };
  function icon(name, size) {
    const s = size || 18;
    return raw(`<svg class="icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`);
  }

  // ------------------------------------------------------------------ dates
  const pad = (n) => String(n).padStart(2, '0');
  const todayIso = () => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
  const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const fmtDate = (iso) => parse(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const fmtDateLong = (iso) => parse(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const dayNum = (iso) => parse(iso).getDate();
  const monthShort = (iso) => parse(iso).toLocaleDateString('en-GB', { month: 'short' });
  const weekdayShort = (iso) => parse(iso).toLocaleDateString('en-GB', { weekday: 'short' });
  function relDays(n) {
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    if (n === -1) return 'yesterday';
    return n > 0 ? `in ${n} days` : `${-n} days ago`;
  }

  // ------------------------------------------------------------------- meta
  let meta = { statuses: [], priorities: [], skills: [], resourceCategories: [] };
  const setMeta = (m) => { meta = m; };
  const getMeta = () => meta;
  const statusLabel = (id) => (meta.statuses.find((s) => s.id === id) || { label: id }).label;
  const priorityLabel = (id) => (meta.priorities.find((p) => p.id === id) || { label: id }).label;

  // ----------------------------------------------------------------- modal
  const dlg = () => document.getElementById('modal');

  function openModal(opts) {
    const d = dlg();
    d.innerHTML = html`
      <div class="modal-panel ${opts.wide ? 'wide' : ''}">
        <header class="modal-head">
          <div>
            ${opts.eyebrow ? html`<p class="eyebrow">${opts.eyebrow}</p>` : ''}
            <h2 id="modal-title">${opts.title}</h2>
          </div>
          <button type="button" class="icon-btn" data-action="close-modal" aria-label="Close dialog">${icon('x')}</button>
        </header>
        <div class="modal-body">${opts.body}</div>
      </div>`.s;
    if (!d.open) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
    if (!opts.keepFocus) {
      const f = d.querySelector('[data-autofocus]') || d.querySelector('input:not([type=hidden]),select,textarea');
      if (f) f.focus(); else { const c = d.querySelector('.icon-btn'); if (c) c.focus(); }
    }
  }
  function closeModal() {
    const d = dlg();
    if (!d.open) return;
    if (typeof d.close === 'function') d.close(); else { d.removeAttribute('open'); d.dispatchEvent(new Event('close')); }
  }
  const isModalOpen = () => dlg().open;

  // ----------------------------------------------------------------- toasts
  function toast(message, tone) {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast toast-${tone || 'info'}`;
    el.setAttribute('role', tone === 'bad' ? 'alert' : 'status');
    el.textContent = message;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 240); }, 4400);
  }

  // ------------------------------------------------------------- small bits
  const initials = (name) => String(name).split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function avatar(name, key, extra) {
    return html`<span class="avatar av-${hash(String(key || name)) % 4} ${extra || ''}" aria-hidden="true">${initials(name)}</span>`;
  }

  function emptyState(title, text, actionHtml) {
    return html`<div class="empty"><p class="empty-title">${title}</p>${text ? html`<p class="muted">${text}</p>` : ''}${actionHtml || ''}</div>`;
  }
  function errorState(message) {
    return html`<div class="error-state" role="alert">
      <p class="empty-title">We couldn't load this view</p>
      <p class="muted">${message}</p>
      <button class="btn btn-ghost" data-action="retry">Try again</button>
    </div>`;
  }
  function skeleton() {
    return html`<div class="skel-wrap" aria-hidden="true">
      <div class="skel skel-title"></div><div class="skel skel-line"></div>
      <div class="skel-grid"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>
    </div>`;
  }

  /** Page heading used by every view. When embedded in an event workspace it drops the large title. */
  function pageHead(ctx, opts) {
    if (ctx.embedded) {
      return html`<div class="embedded-head">
        <div>${opts.eyebrow ? html`<p class="eyebrow">${opts.eyebrow}</p>` : ''}<h2 class="embedded-title">${opts.title}</h2>${opts.sub ? html`<p class="muted">${opts.sub}</p>` : ''}</div>
        <div class="head-actions">${opts.actions || ''}</div></div>`;
    }
    const scope = ctx.club && ctx.event ? `${ctx.club.name} · ${ctx.event.name}` : '';
    return html`<div class="page-head">
      <div>
        <p class="eyebrow">${opts.eyebrow || scope}</p>
        <h1>${opts.title}</h1>
        ${opts.sub ? html`<p class="muted page-sub">${opts.sub}</p>` : ''}
      </div>
      <div class="head-actions">${opts.actions || ''}</div>
    </div>`;
  }

  ns.ui = {
    Safe, html, raw, esc, icon,
    todayIso, fmtDate, fmtDateLong, dayNum, monthShort, weekdayShort, relDays,
    setMeta, getMeta, statusLabel, priorityLabel,
    openModal, closeModal, isModalOpen, toast,
    initials, avatar, emptyState, errorState, skeleton, pageHead
  };
})();
