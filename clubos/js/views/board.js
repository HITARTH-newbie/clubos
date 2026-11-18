/**
 * Task Board — To Do, In Progress, Blocked, Completed.
 * Search, filters, status changes and drag/drop retain the existing API flow.
 */
(function () {
  'use strict';
  const ns = window.ClubOS;
  const { html, raw, icon, emptyState, pageHead, avatar } = ns.ui;
  const C = ns.components;

  function applyFilters(tasks, f) {
    const q = f.q.trim().toLowerCase();
    return tasks.filter((t) =>
      (f.assignee === 'all' || (f.assignee === 'none' ? !t.assigneeId : t.assigneeId === f.assignee)) &&
      (f.priority === 'all' || t.priority === f.priority) &&
      (!q || t.title.toLowerCase().includes(q) || (t.assigneeName || '').toLowerCase().includes(q)));
  }

  function card(t) {
    const draggable = t.permissions.canChangeStatus;
    return html`<article class="card lift task-card feature-task-card ${t.status === 'done' ? 'is-done' : ''}" data-task-id="${t.id}" ${draggable ? raw('draggable="true"') : ''}>
      <div class="task-top">${C.priorityChip(t.priority)}${C.flagChips(t, { hideUnassigned: true })}</div>
      <button class="link-btn task-title" data-action="open-task" data-task-id="${t.id}">${t.title}</button>
      ${t.description ? html`<p class="feature-task-description">${t.description}</p>` : ''}
      <div class="task-meta">${C.person(t)}${C.dueLabel(t)}</div>
      ${t.dependsOn.length ? html`<div class="task-dep">${C.depSummary(t)}</div>` : ''}
      <div class="task-foot">${C.statusSelect(t)}</div>
    </article>`;
  }

  function columns(ctx, tasks) {
    const statuses = ns.ui.getMeta().statuses;
    const shown = applyFilters(tasks, ctx.state.filters);
    return html`${statuses.map((s) => {
      const items = shown.filter((t) => t.status === s.id);
      return html`<section class="board-col feature-board-col" data-status="${s.id}" aria-label="${s.label}">
        <header class="col-head"><span class="dot s-${s.id}" aria-hidden="true"></span><h3>${s.label}</h3><span class="count">${items.length}</span></header>
        <div class="col-body">${items.length ? items.map(card) : html`<p class="col-empty">${tasks.some((t) => t.status === s.id) ? 'No tasks match these filters' : 'Nothing here yet'}</p>`}</div>
      </section>`;
    })}`;
  }

  async function board(ctx) {
    const tasks = await ctx.api.getTasks(ctx.event.id);
    ctx.state.tasks = tasks;
    const f = ctx.state.filters;
    const isCoord = ctx.role === 'coordinator';
    const assignees = [];
    tasks.forEach((t) => { if (t.assigneeId && !assignees.some((a) => a.id === t.assigneeId)) assignees.push({ id: t.assigneeId, name: t.assigneeName }); });
    assignees.sort((a, b) => a.name.localeCompare(b.name));
    const counts = { todo: 0, in_progress: 0, blocked: 0, done: 0 };
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    const overdue = tasks.filter((t) => t.flags.overdue).length;
    const actions = isCoord ? html`<button class="btn btn-primary" data-action="new-task">${icon('plus', 16)}New task</button>` : '';
    const priorities = ns.ui.getMeta().priorities;
    const summary = html`<div class="feature-stats task-stats">
      <div class="feature-stat"><span>All tasks</span><strong>${tasks.length}</strong><small>In this event</small></div>
      <div class="feature-stat"><span>In progress</span><strong>${counts.in_progress}</strong><small>Moving forward</small></div>
      <div class="feature-stat"><span>Completed</span><strong>${counts.done}</strong><small>Checked off</small></div>
      <div class="feature-stat ${overdue ? 'stat-alert' : ''}"><span>Overdue</span><strong>${overdue}</strong><small>${overdue ? 'Needs a look' : 'Nothing overdue'}</small></div>
    </div>`;
    const toolbar = html`<div class="feature-toolbar" role="search">
      <label class="search feature-search"><span class="sr-only">Search tasks</span>${icon('search', 16)}<input class="input" type="search" placeholder="Find a task or teammate…" value="${f.q}" data-input="board-search" autocomplete="off"></label>
      ${isCoord ? html`<label class="inline-field"><span class="sr-only">Filter by assignee</span><select class="select" data-change="board-filter" data-key="assignee"><option value="all">Everyone</option><option value="none" ${f.assignee === 'none' ? 'selected' : ''}>Unassigned</option>${assignees.map((a) => html`<option value="${a.id}" ${f.assignee === a.id ? 'selected' : ''}>${a.name}</option>`)}</select></label>` : ''}
      <label class="inline-field"><span class="sr-only">Filter by priority</span><select class="select" data-change="board-filter" data-key="priority"><option value="all">Any priority</option>${priorities.map((p) => html`<option value="${p.id}" ${f.priority === p.id ? 'selected' : ''}>${p.label} priority</option>`)}</select></label>
      <button class="btn btn-quiet btn-sm" data-action="clear-filters">Clear filters</button>
      <p class="muted small count-note" id="board-count" aria-live="polite">${applyFilters(tasks, f).length} of ${tasks.length} tasks</p>
    </div>`;
    const note = !isCoord ? html`<p class="notice feature-notice">${icon('info', 14)} This board shows your assigned tasks. Teammates' work appears only where it affects your dependencies.</p>` : html`<p class="feature-hint">Move cards between columns or update a status directly. Changes are saved to the workspace.</p>`;
    const body = tasks.length ? html`<div class="board feature-board" id="board-cols">${columns(ctx, tasks)}</div>` : emptyState(isCoord ? 'A fresh board, ready for a plan' : 'Nothing assigned just yet', isCoord ? 'Create the first task and give the team a clear next step.' : 'Your coordinator will assign work here when it is ready.', isCoord ? html`<button class="btn btn-primary" data-action="new-task">${icon('plus', 16)}Create a task</button>` : '');
    return html`${pageHead(ctx, { eyebrow: ctx.club.name, title: isCoord ? 'Task board' : 'My tasks', sub: isCoord ? 'Turn the event plan into clear, owned next steps.' : 'Your responsibilities, deadlines and progress — without the noise.', actions })}${summary}${note}${tasks.length ? toolbar : ''}${body}`;
  }

  ns.views.board = board;
  ns.views.boardColumns = columns;
  ns.views.boardApplyFilters = applyFilters;
})();
