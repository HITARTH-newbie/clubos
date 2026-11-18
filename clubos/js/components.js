/**
 * Reusable domain components shared by several views.
 * Everything here only RENDERS values the backend returned (flags, levels,
 * percentages, reasons). No business rules live in this file.
 */
(function () {
  'use strict';
  const ns = window.ClubOS;
  const { html, raw, icon, avatar, fmtDate, statusLabel, priorityLabel } = ns.ui;

  const statusChip = (s) => html`<span class="chip chip-status s-${s}"><span class="dot s-${s}" aria-hidden="true"></span>${statusLabel(s)}</span>`;
  const priorityChip = (p) => html`<span class="chip chip-prio prio-${p}">${priorityLabel(p)}</span>`;
  const skillChip = (s) => html`<span class="chip chip-muted">${s}</span>`;

  function healthChip(r) {
    if (r.health === 'attention') return html`<span class="chip chip-warn">${icon('alert', 12)}Needs attention</span>`;
    if (r.health === 'empty') return html`<span class="chip chip-muted">No tasks yet</span>`;
    return html`<span class="chip chip-ok">${icon('check', 12)}On track</span>`;
  }

  /** Due-date label + tone, from flags computed by the backend. */
  function dueInfo(t) {
    if (t.status === 'done') return { text: 'Completed', tone: 'ok' };
    const n = t.flags.daysUntilDue;
    if (n < 0) return { text: `Overdue · ${fmtDate(t.dueDate)}`, tone: 'bad' };
    if (n === 0) return { text: 'Due today', tone: 'warn' };
    if (n === 1) return { text: 'Due tomorrow', tone: 'warn' };
    if (n <= 3) return { text: `Due in ${n} days`, tone: 'warn' };
    return { text: `Due ${fmtDate(t.dueDate)}`, tone: '' };
  }
  const dueLabel = (t) => { const d = dueInfo(t); return html`<span class="due ${d.tone ? 'tone-' + d.tone : ''}">${icon('calendar', 13)}${d.text}</span>`; };

  function flagChips(t, opts) {
    const o = opts || {};
    const out = [];
    if (t.status === 'done') return '';
    if (t.flags.overdue) out.push(html`<span class="chip chip-bad">${icon('alert', 12)}Overdue</span>`);
    else if (t.flags.dueSoon) out.push(html`<span class="chip chip-warn">Due soon</span>`);
    if (t.flags.dependencyBlocked) {
      const n = t.dependsOn.filter((d) => d.status !== 'done').length;
      out.push(html`<span class="chip chip-warn-outline">${icon('link', 12)}Waiting on ${n}</span>`);
    }
    if (t.flags.unassigned && !o.hideUnassigned) out.push(html`<span class="chip chip-muted">Unassigned</span>`);
    return out;
  }

  function depSummary(t) {
    if (!t.dependsOn.length) return '';
    const waiting = t.dependsOn.filter((d) => d.status !== 'done');
    const names = (waiting.length ? waiting : t.dependsOn).map((d) => d.title);
    const shown = names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '');
    return html`<span class="dep ${waiting.length ? 'waiting' : ''}" title="${t.dependsOn.map((d) => d.title + ' (' + statusLabel(d.status) + ')').join('; ')}">${icon('link', 12)}${waiting.length ? 'Waiting on ' : 'Cleared: '}${shown}</span>`;
  }

  function statusSelect(t) {
    const statuses = ns.ui.getMeta().statuses;
    return html`<select class="select select-sm status-select s-${t.status}" data-change="task-status" data-task-id="${t.id}"
        aria-label="Status for ${t.title}" ${t.permissions.canChangeStatus ? '' : 'disabled'}>
      ${statuses.map((s) => html`<option value="${s.id}" ${s.id === t.status ? 'selected' : ''}>${s.label}</option>`)}
    </select>`;
  }

  function person(t) {
    return t.assigneeName
      ? html`<span class="person">${avatar(t.assigneeName, t.assigneeId)}<span class="person-name">${t.assigneeName}</span></span>`
      : html`<span class="chip chip-muted">Unassigned</span>`;
  }

  /** Compact row used in overview lists. */
  function taskRow(t, opts) {
    const o = opts || {};
    return html`<li class="row">
      <div class="row-main">
        <button class="link-btn" data-action="open-task" data-task-id="${t.id}">${t.title}</button>
        <div class="row-meta">
          ${(t.reasons || []).map((r) => html`<span class="chip ${r.kind === 'overdue' || r.kind === 'blocked' ? 'chip-bad' : r.kind === 'unassigned' ? 'chip-muted' : 'chip-warn'}">${r.text}</span>`)}
          ${t.reasons ? '' : flagChips(t, { hideUnassigned: true })}
          ${o.showPriority ? priorityChip(t.priority) : ''}
          ${o.showDeps ? depSummary(t) : ''}
        </div>
      </div>
      <div class="row-side">
        ${o.statusSelect ? statusSelect(t) : dueLabel(t)}
        ${o.statusSelect ? dueLabel(t) : (o.hidePerson ? '' : person(t))}
      </div>
    </li>`;
  }

  function progress(percent, opts) {
    const o = opts || {};
    return html`<div class="progress ${o.lg ? 'lg' : ''} ${o.tone ? 'fill-' + o.tone : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="${o.label || 'Progress'}">
      <span style="width:${o.animateFrom === undefined ? percent : o.animateFrom}%" ${o.animateFrom === undefined ? '' : raw(`data-progress="${Number(percent)}"`)}></span>
    </div>`;
  }

  function workloadBar(w) {
    const pct = Math.min(100, Math.round((w.weight / w.capacity) * 100));
    const tone = w.level === 'Heavy' ? 'bad' : w.level === 'Balanced' ? 'warn' : 'ok';
    return progress(pct, { tone, label: `Workload: ${w.level}` });
  }
  const levelChip = (w) => {
    if (w.level === 'Free') return html`<span class="chip chip-muted">No open tasks</span>`;
    const cls = w.level === 'Heavy' ? 'chip-bad' : w.level === 'Balanced' ? 'chip-warn' : 'chip-ok';
    return html`<span class="chip ${cls}">${w.level}</span>`;
  };

  function announcementItem(a) {
    return html`<li class="note"><p class="note-title">${a.title}</p><p class="muted note-body">${a.body}</p>
      <p class="note-meta">${a.authorName} · ${fmtDate(a.postedOn)}</p></li>`;
  }

  function milestoneItem(m) {
    return html`<li class="row row-tight">
      <div class="date-badge" aria-hidden="true"><span class="d">${ns.ui.dayNum(m.date)}</span><span class="m">${ns.ui.monthShort(m.date)}</span></div>
      <div class="row-main"><p class="row-title">${m.title}</p><p class="muted small">${ns.ui.relDays(m.daysUntil)}</p></div>
    </li>`;
  }

  function cardHead(title, sub, actionHtml) {
    return html`<div class="card-head"><div><h3 class="card-title">${title}</h3>${sub ? html`<p class="card-sub">${sub}</p>` : ''}</div>${actionHtml || ''}</div>`;
  }

  ns.components = {
    statusChip, priorityChip, skillChip, healthChip, dueInfo, dueLabel, flagChips, depSummary,
    statusSelect, person, taskRow, progress, workloadBar, levelChip, announcementItem, milestoneItem, cardHead
  };
})();
