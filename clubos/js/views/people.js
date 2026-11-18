/** People — a thoughtful team directory with role-aware workload visibility. */
(function () {
  'use strict';
  const ns = window.ClubOS;
  const { html, icon, avatar, pageHead } = ns.ui;
  const C = ns.components;
  const roleChip = (r) => html`<span class="chip ${r === 'coordinator' ? 'chip-accent' : 'chip-muted'}">${r === 'coordinator' ? 'Coordinator' : 'Member'}</span>`;

  function taskLine(t) {
    return html`<li class="mini-task"><button class="link-btn" data-action="open-task" data-task-id="${t.id}">${t.title}</button><span class="mini-meta">${C.statusChip(t.status)}${C.dueLabel({ status: t.status, dueDate: t.dueDate, flags: t.flags })}</span></li>`;
  }
  function personCard(p, isCoordView) {
    const w = p.workload;
    return html`<article class="card lift person-card feature-person-card ${p.isYou ? 'is-you' : ''}">
      <header class="person-head">${avatar(p.name, p.id, 'lg')}<div class="person-identity"><h3 class="person-title">${p.name}${p.isYou ? html` <span class="muted small">(you)</span>` : ''}</h3>${roleChip(p.clubRole)}<p class="person-id">${p.id}</p></div></header>
      <div class="feature-card-divider"></div>
      <div><p class="feature-mini-label">SKILLS & INTERESTS</p><div class="skill-row">${p.skills.map(C.skillChip)}</div></div>
      ${w ? html`<div class="person-load"><div class="row-line"><span class="feature-mini-label">CURRENT WORKLOAD</span>${C.levelChip(w)}</div>${C.workloadBar(w)}<p class="muted small">${w.active} open <span aria-hidden="true">·</span> ${w.overdue} overdue <span aria-hidden="true">·</span> ${w.done} completed</p></div>
        <div class="feature-person-tasks"><p class="feature-mini-label">ACTIVE TASKS</p>${p.tasks && p.tasks.length ? html`<ul class="mini-tasks">${p.tasks.slice(0, 3).map(taskLine)}</ul>` : html`<p class="muted small">No open tasks at the moment.</p>`}</div>
        ${isCoordView ? html`<button class="btn btn-quiet btn-sm feature-view-work" data-action="filter-assignee" data-user-id="${p.id}">View tasks on board ${icon('arrow', 13)}</button>` : ''}` : ''}
    </article>`;
  }

  async function people(ctx) {
    const d = await ctx.api.getPeople(ctx.event.id);
    const isCoord = d.role === 'coordinator';
    const coordinators = d.people.filter((p) => p.clubRole === 'coordinator').length;
    const members = d.people.length - coordinators;
    const heavy = d.people.filter((p) => p.workload && p.workload.level === 'Heavy').length;
    let summary;
    if (isCoord) {
      summary = html`<div class="feature-stats people-stats"><div class="feature-stat"><span>Event team</span><strong>${d.people.length}</strong><small>People involved</small></div><div class="feature-stat"><span>Coordinators</span><strong>${coordinators}</strong><small>Keeping things moving</small></div><div class="feature-stat"><span>Members</span><strong>${members}</strong><small>On this event</small></div><div class="feature-stat ${heavy ? 'stat-alert' : ''}"><span>Heavy workload</span><strong>${heavy}</strong><small>${heavy ? 'Worth redistributing' : 'Capacity looks good'}</small></div></div>`;
    } else {
      const you = d.people.find((p) => p.isYou);
      summary = you && you.workload ? html`<section class="card feature-my-workload">${C.cardHead('Your workload', `${d.openAcrossWorkspaces} open task${d.openAcrossWorkspaces === 1 ? '' : 's'} across your workspaces`)}<div class="row-line">${C.levelChip(you.workload)}<span class="muted small">${you.workload.active} open on this event <span aria-hidden="true">·</span> ${you.workload.overdue} overdue</span></div>${C.workloadBar(you.workload)}</section>` : '';
    }
    const sub = isCoord ? 'Meet the people behind the work. See skills, assignments and team capacity.' : 'The people you are building this event with.';
    return html`${pageHead(ctx, { title: isCoord ? 'Your team' : 'My team', sub })}${summary || ''}<div class="feature-section-head"><div><p class="eyebrow">THE PEOPLE BEHIND IT</p><h2>Good work is a team sport.</h2></div><span class="feature-count">${d.people.length} people</span></div><div class="people-grid feature-people-grid">${d.people.map((p) => personCard(p, isCoord))}</div>`;
  }
  ns.views.people = people;
})();
