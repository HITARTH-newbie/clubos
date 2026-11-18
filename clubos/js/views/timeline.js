/** Timeline — one chronological view of milestones and task deadlines. */
(function () {
  'use strict';
  const ns = window.ClubOS;
  const { html, icon, fmtDate, dayNum, monthShort, weekdayShort, relDays, pageHead, emptyState } = ns.ui;
  const C = ns.components;

  function item(it, today) {
    const past = it.date < today;
    const date = html`<div class="tl-date"><span class="d">${dayNum(it.date)}</span><span class="m">${monthShort(it.date)}</span><span class="w">${weekdayShort(it.date)}</span></div>`;
    if (it.kind === 'milestone') {
      return html`<li class="tl-item milestone ${past ? 'past' : ''} ${it.isEventDay ? 'event-day' : ''}">${date}<span class="tl-mark diamond" aria-hidden="true"></span><div class="tl-body"><p class="tl-kind">${it.isEventDay ? 'Event day' : 'Milestone'}</p><p class="tl-title">${it.title}</p><p class="muted small">${relDays(it.daysUntil)}</p></div></li>`;
    }
    const t = it.task;
    return html`<li class="tl-item ${past ? 'past' : ''}">${date}<span class="tl-mark dot s-${t.status}" aria-hidden="true"></span><div class="tl-body"><p class="tl-kind">Task deadline</p><button class="link-btn tl-title" data-action="open-task" data-task-id="${t.id}">${t.title}</button><div class="row-meta">${C.statusChip(t.status)}${C.priorityChip(t.priority)}${C.flagChips(t, { hideUnassigned: true })}${t.assigneeName ? html`<span class="muted small">${t.assigneeName}</span>` : html`<span class="chip chip-muted">Unassigned</span>`}</div></div></li>`;
  }

  async function timeline(ctx) {
    const data = await ctx.api.getTimeline(ctx.event.id);
    const mode = ctx.state.timelineFilter;
    const all = data.items;
    const milestones = all.filter((i) => i.kind === 'milestone').length;
    const deadlines = all.filter((i) => i.kind === 'task').length;
    const overdue = all.filter((i) => i.kind === 'task' && i.task.flags.overdue).length;
    const items = all.filter((i) => mode === 'all' || (mode === 'milestones' ? i.kind === 'milestone' : i.kind === 'task'));
    const filters = html`<div class="feature-filter-row"><div class="chip-filters" role="group" aria-label="Timeline filter">${[['all', 'Everything'], ['milestones', 'Milestones'], ['tasks', 'Task deadlines']].map(([v, l]) => html`<button class="filter-chip" data-action="timeline-filter" data-value="${v}" aria-pressed="${mode === v}">${l}</button>`)}</div><span class="feature-count">${items.length} items shown</span></div>`;
    let marked = false;
    const rows = [];
    const todayRow = html`<li class="tl-today" aria-label="Today"><span>Today · ${fmtDate(data.today)}</span></li>`;
    items.forEach((it) => { if (!marked && it.date >= data.today) { rows.push(todayRow); marked = true; } rows.push(item(it, data.today)); });
    if (!marked) rows.push(todayRow);
    const summary = html`<div class="feature-stats timeline-stats"><div class="feature-stat"><span>Milestones</span><strong>${milestones}</strong><small>Key moments</small></div><div class="feature-stat"><span>Task deadlines</span><strong>${deadlines}</strong><small>Dates to plan around</small></div><div class="feature-stat ${overdue ? 'stat-alert' : ''}"><span>Overdue</span><strong>${overdue}</strong><small>${overdue ? 'Past due dates' : 'All clear'}</small></div></div>`;
    return html`${pageHead(ctx, { title: 'Timeline', sub: 'See the important dates before they sneak up on you.' })}${summary}${filters}${items.length ? html`<ol class="tl card feature-timeline">${rows}</ol>` : emptyState('Nothing on this part of the timeline', 'Try another filter or check back when new dates are added.')}`;
  }
  ns.views.timeline = timeline;
})();
