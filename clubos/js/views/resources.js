/** Resources — shared links, working documents, notes and event announcements. */
(function () {
  'use strict';
  const ns = window.ClubOS;
  const { html, icon, fmtDate, pageHead, emptyState } = ns.ui;
  const C = ns.components;
  const safeUrl = (u) => /^https?:\/\/\S+$/i.test(u || '');

  function resourceCard(r) {
    const linked = safeUrl(r.url);
    return html`<article class="card lift res-card feature-resource-card">
      <div class="res-top"><span class="resource-category-mark">${icon(r.category === 'Scripts' ? 'file' : r.category === 'Music' ? 'music' : r.category === 'Posters' ? 'image' : r.category === 'Links' ? 'link' : 'folder', 16)}</span><span class="chip chip-accent">${r.category}</span></div>
      <div class="feature-resource-main"><h3 class="res-title">${r.name}</h3>${r.description ? html`<p class="muted res-desc">${r.description}</p>` : ''}</div>
      <div class="res-foot"><span class="muted small">${r.addedByName} <span aria-hidden="true">·</span> ${fmtDate(r.addedOn)}</span>${linked ? html`<a class="btn btn-ghost btn-sm" href="${r.url}" target="_blank" rel="noopener noreferrer">Open resource ${icon('external', 13)}</a>` : html`<span class="chip chip-muted">Shared note</span>`}</div>
    </article>`;
  }

  async function resources(ctx) {
    const [items, anns] = await Promise.all([ctx.api.getResources(ctx.event.id), ctx.api.getAnnouncements(ctx.event.id)]);
    const cats = ns.ui.getMeta().resourceCategories;
    const sel = ctx.state.resourceFilter;
    const shown = items.filter((r) => sel === 'all' || r.category === sel);
    const isCoord = ctx.role === 'coordinator';
    const actions = isCoord ? html`<button class="btn btn-primary" data-action="new-resource">${icon('plus', 16)}Add resource</button>` : '';
    const filters = html`<div class="feature-filter-row"><div class="chip-filters" role="group" aria-label="Filter by category"><button class="filter-chip" data-action="resource-filter" data-value="all" aria-pressed="${sel === 'all'}">All <span class="count">${items.length}</span></button>${cats.map((c) => html`<button class="filter-chip" data-action="resource-filter" data-value="${c}" aria-pressed="${sel === c}">${c} <span class="count">${items.filter((r) => r.category === c).length}</span></button>`)}</div><span class="feature-count">${shown.length} shown</span></div>`;
    const announcements = html`<section class="card feature-announcements">${C.cardHead('The noticeboard', 'Updates and reminders for everyone on this event')}${anns.length ? html`<ul class="notes feature-notes">${anns.map(C.announcementItem)}</ul>` : html`<p class="muted">No announcements yet. Check back for updates from your coordinator.</p>`}</section>`;
    const list = shown.length ? html`<div class="res-grid feature-resource-grid">${shown.map(resourceCard)}</div>` : emptyState(items.length ? 'No resources in this category' : 'Your shared library starts here', items.length ? 'Try another category to see more.' : (isCoord ? 'Add a poster, script, document or useful link for the team.' : 'Coordinators will share useful files, links and notes here.'), isCoord && !items.length ? html`<button class="btn btn-primary" data-action="new-resource">${icon('plus', 16)}Add the first resource</button>` : '');
    const stats = html`<div class="feature-stats resource-stats"><div class="feature-stat"><span>Shared resources</span><strong>${items.length}</strong><small>For this event</small></div><div class="feature-stat"><span>Categories</span><strong>${new Set(items.map((r) => r.category)).size}</strong><small>Types of material</small></div><div class="feature-stat"><span>Announcements</span><strong>${anns.length}</strong><small>Team updates</small></div></div>`;
    return html`${pageHead(ctx, { title: 'Resources', sub: 'The shared shelf for everything your team needs to make this happen.', actions })}${stats}<div class="feature-section-head"><div><p class="eyebrow">THE SHARED LIBRARY</p><h2>Everything in its right place.</h2></div></div>${filters}${list}${announcements}`;
  }
  ns.views.resources = resources;
})();
