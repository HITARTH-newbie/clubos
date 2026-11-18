/**
 * Overview — role-specific home screens.
 * Coordinators get an operational snapshot; members get a personal action list.
 * All numbers, permissions and recommendations continue to come from the API.
 */
(function () {
  'use strict';
  const ns = window.ClubOS;
  const { html, icon, fmtDateLong, relDays, emptyState, pageHead, avatar } = ns.ui;
  const C = ns.components;

  const STATUS_ORDER = ['todo', 'in_progress', 'blocked', 'done'];
  const firstName = (name) => String(name || 'there').trim().split(/\s+/)[0];
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const dueCopy = (n) => n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 1 ? `in ${n} days` : `${Math.abs(n)} days overdue`;

  function homeHead(ctx, role, kicker) {
    const name = firstName(ctx.state.user && ctx.state.user.name);
    return html`<section class="home-welcome">
      <div><p class="eyebrow">${kicker}</p><h1>${greeting()}, ${name}<span class="welcome-period">.</span></h1>
      <p>${role === 'coordinator' ? 'Here’s the pulse of your event. Let’s keep everything moving.' : 'Here’s what’s on your plate. One thing at a time.'}</p></div>
      <div class="welcome-mark" aria-hidden="true">${role === 'coordinator' ? '01' : '✳'}</div>
    </section>`;
  }

  function metric(label, value, note, tone, action) {
    return html`<article class="home-metric ${tone || ''}">
      <p>${label}</p><strong>${value}</strong><span>${note || ''}</span>
      ${action || ''}
    </article>`;
  }

  function eventContext(ctx, d) {
    const e = d.event;
    const when = e.daysToGo >= 0 ? (e.daysToGo === 0 ? 'Happening today' : `${relDays(e.daysToGo)} · ${fmtDateLong(e.date)}`) : `${fmtDateLong(e.date)} · completed`;
    return html`<section class="event-context-card">
      <div class="event-context-copy"><p class="eyebrow">CURRENT EVENT</p><h2>${e.name}</h2>
        <p>${when} <span aria-hidden="true">·</span> ${e.venue || 'Venue to be confirmed'}</p></div>
      <div class="event-context-progress"><span>${d.readiness.percent}%</span><small>ready</small><div class="progress"><span style="width:${d.readiness.percent}%"></span></div></div>
    </section>`;
  }

  function milestonesCard(d) {
    return html`<section class="card home-panel">${C.cardHead('On the horizon', 'The next dates worth keeping in sight')}
      ${d.milestones.length ? html`<ul class="rows">${d.milestones.slice(0, 4).map(C.milestoneItem)}</ul>` : html`<p class="muted">No upcoming milestones.</p>`}
    </section>`;
  }

  function announcementsCard(d) {
    return html`<section class="card home-panel">${C.cardHead('A note from the team', 'Latest announcements')}
      ${d.announcements.length ? html`<ul class="notes">${d.announcements.slice(0, 2).map(C.announcementItem)}</ul>` : html`<p class="muted">No announcements yet.</p>`}
    </section>`;
  }

  function readinessCard(ctx, d) {
    const r = d.readiness;
    const prev = ctx.state.lastReadiness[ctx.event.id];
    ctx.state.lastReadiness[ctx.event.id] = r.percent;
    const labels = ns.ui.getMeta().statuses;
    return html`<section class="card readiness home-panel" aria-label="Event readiness">
      <div class="readiness-top"><div><p class="eyebrow">TEAM PROGRESS</p><p class="readiness-num">${r.percent}<small>%</small></p></div>
        <div class="readiness-side">${C.healthChip(r)}<p class="muted small">${r.done} of ${r.total} tasks complete</p></div></div>
      ${C.progress(r.percent, { lg: true, label: 'Event readiness', animateFrom: prev === undefined ? 0 : prev })}
      <div class="status-strip">${STATUS_ORDER.map((s) => html`<button class="stat-link" data-action="goto-board"><span class="dot s-${s}" aria-hidden="true"></span><b>${r.byStatus[s]}</b><span>${labels.find((x) => x.id === s).label}</span></button>`)}</div>
    </section>`;
  }

  function attentionPanel(d) {
    return html`<section class="card home-panel home-attention">${C.cardHead('Needs your attention', 'The few things most likely to slow the team down', html`<span class="panel-count">${d.attention.length} items</span>`)}
      ${d.attention.length ? html`<ul class="rows">${d.attention.slice(0, 5).map((t) => C.taskRow(t, { showDeps: false }))}</ul>
        ${d.attention.length > 5 ? html`<button class="btn btn-quiet btn-sm panel-more" data-action="goto-board">See all ${d.attention.length} items ${icon('external', 13)}</button>` : ''}`
        : html`<div class="calm">${icon('check', 18)}<p>Nothing urgent. Your team is in a good place.</p></div>`}
    </section>`;
  }

  function upcomingPanel(d) {
    const attentionIds = new Set(d.attention.map((t) => t.id));
    const items = d.upcoming.filter((t) => !attentionIds.has(t.id)).slice(0, 4);
    if (!items.length) return '';
    return html`<section class="card home-panel">${C.cardHead('Coming up', 'Work with a deadline in the next seven days')}
      <ul class="rows">${items.map((t) => C.taskRow(t, { showPriority: true }))}</ul>
      <button class="btn btn-quiet btn-sm panel-more" data-action="goto-board">Open task board ${icon('external', 13)}</button>
    </section>`;
  }

  function workloadPanel(co) {
    const heavy = co.workload.filter((w) => w.level === 'Heavy').length;
    return html`<section class="card home-panel">${C.cardHead('Team capacity', `${co.workload.length} people working on this event`, html`<button class="btn btn-quiet btn-sm" data-action="goto-people">Meet the team</button>`)}
      <div class="capacity-summary"><strong>${heavy}</strong><span>people with a heavy workload</span></div>
      <ul class="rows workload-preview">${co.workload.slice(0, 4).map((w) => html`<li class="row row-tight">${avatar(w.name, w.userId)}<div class="row-main"><div class="row-line"><span class="row-title">${w.name}</span>${C.levelChip(w)}</div>${C.workloadBar(w)}</div></li>`)}</ul>
      ${co.workload.length > 4 ? html`<button class="btn btn-quiet btn-sm panel-more" data-action="goto-people">View all ${co.workload.length} people</button>` : ''}
    </section>`;
  }

  function suggestionsPanel(co) {
    if (!co.suggestions.length) return '';
    return html`<details class="card home-panel suggestions-disclosure"><summary><span><b>Suggested task owners</b><small>${co.unassignedCount} unassigned task${co.unassignedCount === 1 ? '' : 's'} · smart suggestions</small></span><span class="disclosure-icon">${icon('plus', 16)}</span></summary>
      <ul class="rows">${co.suggestions.slice(0, 4).map(({ task: t, suggestion: s }) => {
        const top = s.options[0];
        return html`<li class="row"><div class="row-main"><button class="link-btn" data-action="open-task" data-task-id="${t.id}">${t.title}</button><p class="muted small">${t.requiredSkill ? `Needs ${t.requiredSkill}` : 'No specific skill'} · ${ns.components.dueInfo(t).text}</p>${top ? html`<p class="suggest-line">${avatar(top.name, top.userId)}<span><b>${top.name}</b> <span class="muted">${top.reasons.join(' · ')}</span></span></p>` : ''}</div><div class="row-side">${top ? html`<button class="btn btn-ghost btn-sm" data-action="assign-suggestion" data-task-id="${t.id}" data-user-id="${top.userId}">Assign</button>` : ''}</div></li>`;
      })}</ul>
    </details>`;
  }

  function coordinator(ctx, d) {
    const co = d.coordinator;
    const urgentCount = d.attention.length;
    const actions = html`<button class="btn btn-primary" data-action="new-task">${icon('plus', 16)}Create a task</button><button class="btn btn-quiet" data-action="new-event">${icon('calendar', 15)}New event</button>`;
    return html`${homeHead(ctx, 'coordinator', 'YOUR CLUB · COORDINATOR VIEW')}
      ${eventContext(ctx, d)}
      <div class="home-metrics">
        ${metric('Event readiness', `${d.readiness.percent}%`, `${d.readiness.done} of ${d.readiness.total} tasks done`, 'metric-sage', html`<button data-action="goto-board" aria-label="Open task board">${icon('arrow', 14)}</button>`)}
        ${metric('Needs attention', urgentCount, urgentCount ? 'Items to review' : 'All clear for now', urgentCount ? 'metric-amber' : 'metric-sage', html`<button data-action="goto-board" aria-label="Review tasks">${icon('arrow', 14)}</button>`)}
        ${metric('Team members', co.workload.length, 'On this event', '', html`<button data-action="goto-people" aria-label="View team">${icon('arrow', 14)}</button>`)}
      </div>
      <div class="page-head home-actions-head"><div><p class="eyebrow">THE OVERVIEW</p><h2 class="home-section-title">Keep the momentum.</h2></div><div class="head-actions">${actions}</div></div>
      <div class="home-grid coordinator-grid"><div class="stack">${attentionPanel(d)}${upcomingPanel(d)}${readinessCard(ctx, d)}</div><div class="stack">${workloadPanel(co)}${milestonesCard(d)}${announcementsCard(d)}</div></div>
      ${suggestionsPanel(co)}`;
  }

  function member(ctx, d) {
    const m = d.member;
    const tasks = m.myTasks || [];
    const nextTask = tasks[0];
    const stats = m.stats;
    const focusNote = nextTask ? (nextTask.flags.overdue ? 'This one is overdue — start here.' : `Your next task is ${dueCopy(nextTask.flags.daysUntilDue)}.`) : 'You’re all caught up on assigned work.';
    const myTasks = html`<section class="card home-panel member-tasks">${C.cardHead('Your next moves', `${tasks.length} open task${tasks.length === 1 ? '' : 's'}${m.completedCount ? ` · ${m.completedCount} completed` : ''}`, html`<button class="btn btn-quiet btn-sm" data-action="nav" data-view="board">All tasks</button>`)}
      ${tasks.length ? html`<div class="focus-task"><span class="focus-task-label">${nextTask.flags.overdue ? 'PRIORITY' : 'UP NEXT'}</span><button class="link-btn" data-action="open-task" data-task-id="${nextTask.id}">${nextTask.title}</button><p>${focusNote}</p><div class="focus-task-meta">${C.priorityChip(nextTask.priority)}${C.dueLabel(nextTask)}</div></div>
        <ul class="rows member-task-list">${tasks.slice(1, 5).map((t) => C.taskRow(t, { statusSelect: true, showPriority: true, hidePerson: true }))}</ul>`
        : emptyState('Nothing assigned to you right now', 'When a coordinator assigns you work, it will appear here. Enjoy the breathing room.')}
    </section>`;
    const progress = html`<section class="card home-panel member-progress">${C.cardHead('The bigger picture', 'Your contribution is part of the whole')}
      <div class="readiness-inline"><span class="readiness-num sm">${d.readiness.percent}<small>%</small></span>${C.healthChip(d.readiness)}</div>
      ${C.progress(d.readiness.percent, { label: 'Event progress' })}<p class="muted small">${d.readiness.done} of ${d.readiness.total} tasks complete across the team.</p>
      <button class="btn btn-quiet btn-sm panel-more" data-action="goto-people">See your team ${icon('external', 13)}</button>
    </section>`;
    const otherWorkspaces = [];
    ctx.state.workspaces.forEach((c) => c.events.forEach((e) => { if (e.id !== ctx.event.id) otherWorkspaces.push({ club: c, e }); }));
    const otherCard = otherWorkspaces.length ? html`<section class="card home-panel">${C.cardHead('Your other spaces', `${m.openAcrossWorkspaces} open task${m.openAcrossWorkspaces === 1 ? '' : 's'} across your events`)}
      <ul class="rows">${otherWorkspaces.slice(0, 4).map(({ club, e }) => html`<li class="row row-tight"><div class="row-main"><button class="link-btn" data-action="switch-workspace" data-club-id="${club.id}" data-event-id="${e.id}">${e.name}</button><p class="muted small">${club.name}</p></div><div class="row-side"><span class="chip ${e.myOpenTasks ? 'chip-muted' : 'chip-ok'}">${e.myOpenTasks} open</span></div></li>`)}</ul>
    </section>` : '';
    return html`${homeHead(ctx, 'member', 'YOUR SPACE · MEMBER VIEW')}
      ${eventContext(ctx, d)}
      <div class="home-metrics member-metrics">
        ${metric('Open tasks', stats.open, 'Assigned to you', 'metric-sage')}
        ${metric('Due this week', stats.dueThisWeek, 'Keep an eye on these', '')}
        ${metric('Overdue', stats.overdue, stats.overdue ? 'Let’s get these moving' : 'You’re up to date', stats.overdue ? 'metric-amber' : 'metric-sage')}
      </div>
      <div class="page-head home-actions-head"><div><p class="eyebrow">YOUR WORKSPACE</p><h2 class="home-section-title">Make your next move.</h2><p class="muted">A clear view of what needs you, and what’s coming up.</p></div></div>
      <div class="home-grid member-grid"><div class="stack">${myTasks}${milestonesCard(d)}</div><div class="stack">${progress}${announcementsCard(d)}${otherCard}</div></div>`;
  }

  ns.views.overview = async function (ctx) {
    const d = await ctx.api.getDashboard(ctx.event.id);
    return d.role === 'coordinator' ? coordinator(ctx, d) : member(ctx, d);
  };
})();
