/**
 * Events — polished event directory and contextual event workspace.
 * The directory gives a quick read on the club calendar; each event opens
 * its own focused workspace with Overview, Tasks, Timeline, Resources and Team.
 */
(function () {
  'use strict';
  const ns = window.ClubOS;
  const { html, raw, icon, fmtDateLong, dayNum, monthShort, relDays, pageHead, emptyState } = ns.ui;
  const C = ns.components;

  const TABS = [
    { id: 'overview', label: 'Overview', view: 'overview' },
    { id: 'tasks', label: 'Tasks', view: 'board' },
    { id: 'timeline', label: 'Timeline', view: 'timeline' },
    { id: 'resources', label: 'Resources', view: 'resources' },
    { id: 'team', label: 'Team', view: 'people' }
  ];

  function eventCard(e, current) {
    const when = e.phase === 'past' ? `${-e.daysToGo} days ago` : relDays(e.daysToGo);
    return html`<article class="card lift event-card feature-event-card ${current ? 'current' : ''}">
      <div class="date-badge lg feature-date" aria-hidden="true"><span class="d">${dayNum(e.date)}</span><span class="m">${monthShort(e.date)}</span></div>
      <div class="event-body">
        <div class="feature-event-kicker"><span>${e.phase === 'past' ? 'PAST EVENT' : 'UPCOMING EVENT'}</span>${current ? html`<span class="current-tag">Current workspace</span>` : ''}</div>
        <h3 class="event-name"><button class="link-btn" data-action="open-event" data-event-id="${e.id}" data-club-id="${e.clubId}">${e.name}</button></h3>
        <p class="muted small">${e.venue || 'Venue to be confirmed'} <span aria-hidden="true">·</span> ${when}</p>
        ${C.progress(e.readiness.percent, { label: `${e.name} readiness` })}
        <div class="event-foot"><span><b>${e.readiness.percent}%</b> ready</span>${C.healthChip(e.readiness)}<span class="muted small">${e.teamSize} people</span>${e.role === 'member' ? html`<span class="muted small">${e.myOpenTasks} open for you</span>` : ''}</div>
      </div>
      <button class="event-open" data-action="open-event" data-event-id="${e.id}" data-club-id="${e.clubId}" aria-label="Open ${e.name}">${icon('arrow', 17)}</button>
    </article>`;
  }

  async function list(ctx) {
    const events = await ctx.api.getEvents(ctx.club.id);
    const isCoord = ctx.role === 'coordinator';
    const upcoming = events.filter((e) => e.phase !== 'past');
    const past = events.length - upcoming.length;
    const avg = events.length ? Math.round(events.reduce((sum, e) => sum + e.readiness.percent, 0) / events.length) : 0;
    const actions = isCoord ? html`<button class="btn btn-primary" data-action="new-event">${icon('plus', 16)}New event</button>` : '';
    const summary = html`<div class="feature-stats event-stats">
      <div class="feature-stat"><span>On the calendar</span><strong>${events.length}</strong><small>Events in this club</small></div>
      <div class="feature-stat"><span>Coming up</span><strong>${upcoming.length}</strong><small>Still ahead</small></div>
      <div class="feature-stat"><span>Past events</span><strong>${past}</strong><small>Completed moments</small></div>
      <div class="feature-stat"><span>Average readiness</span><strong>${avg}%</strong><small>Across listed events</small></div>
    </div>`;
    const body = events.length
      ? html`<div class="feature-section-head"><div><p class="eyebrow">YOUR CLUB CALENDAR</p><h2>Make room for what's next.</h2></div><span class="feature-count">${events.length} ${events.length === 1 ? 'event' : 'events'}</span></div>
        <div class="event-grid feature-event-grid">${events.map((e) => eventCard(e, e.id === ctx.state.eventId))}</div>`
      : emptyState(`No events in ${ctx.club.name} yet`, isCoord ? 'Create an event to give the team a shared plan.' : 'You have not been added to an event in this club yet.',
        isCoord ? html`<button class="btn btn-primary" data-action="new-event">${icon('plus', 16)}Create an event</button>` : '');
    return html`${pageHead(ctx, { eyebrow: ctx.club.name, title: 'Events', sub: isCoord ? 'A clear view of what your club is bringing to life.' : 'The events you are part of, all in one place.', actions })}${events.length ? summary : ''}${body}`;
  }

  async function workspace(ctx) {
    const tab = TABS.find((t) => t.id === ctx.state.eventTab) || TABS[0];
    const e = ctx.event;
    const inner = await ns.views[tab.view](Object.assign({}, ctx, { embedded: true }));
    return html`<div class="ws-head feature-workspace-head">
        <button class="link-btn back" data-action="events-back">${icon('back', 15)}All events</button>
        <div class="feature-workspace-title"><div><p class="eyebrow">${ctx.club.name} <span aria-hidden="true">/</span> ${ctx.role === 'coordinator' ? 'Coordinator workspace' : 'Your event workspace'}</p><h1>${e.name}</h1><p class="muted page-sub">${fmtDateLong(e.date)} <span aria-hidden="true">·</span> ${e.venue || 'Venue to be confirmed'}</p></div><div class="workspace-readiness"><strong>${e.readiness.percent}%</strong><span>ready</span></div></div>
      </div>
      <nav class="tabs feature-tabs" aria-label="Event sections">${TABS.map((t) => html`<button class="tab" data-action="event-tab" data-tab="${t.id}" ${t.id === tab.id ? raw('aria-current="page"') : ''}>${t.label}</button>`)}</nav>
      <div class="tab-panel">${inner}</div>`;
  }

  ns.views.events = async function (ctx) {
    return ctx.state.eventOpen && ctx.event ? workspace(ctx) : list(ctx);
  };
})();
