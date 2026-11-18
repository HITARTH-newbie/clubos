/**
 * ClubOS application controller.
 *
 * Responsibilities: session (ID entry), shell and navigation, workspace
 * (club + event) switching, modals and forms, and one delegated event
 * listener for the whole app. It never decides what a role may do: every
 * permission shown in the UI comes from the backend response, and the
 * backend rejects anything that is not allowed.
 */
(function () {
  'use strict';

  const ns = window.ClubOS;
  const api = window.ClubOSApi;
  const cfg = window.CLUBOS_CONFIG;
  const ui = ns.ui;
  const C = ns.components;
  const { html, raw, icon, toast, fmtDate, fmtDateLong, avatar, emptyState } = ui;
  const $ = (sel, root) => (root || document).querySelector(sel);

  const SESSION_KEY = 'clubos.session';
  const THEME_KEY = 'clubos.theme';

  const NAV = {
    coordinator: [
      { id: 'overview', label: 'Overview', short: 'Home', icon: 'grid' },
      { id: 'events', label: 'Events', short: 'Events', icon: 'calendar' },
      { id: 'board', label: 'Task board', short: 'Tasks', icon: 'board' },
      { id: 'timeline', label: 'Timeline', short: 'Timeline', icon: 'clock' },
      { id: 'people', label: 'Team', short: 'Team', icon: 'users' },
      { id: 'resources', label: 'Resources', short: 'Files', icon: 'folder' }
    ],
    member: [
      { id: 'overview', label: 'My home', short: 'Home', icon: 'grid' },
      { id: 'board', label: 'My tasks', short: 'Tasks', icon: 'board' },
      { id: 'events', label: 'Events', short: 'Events', icon: 'calendar' },
      { id: 'people', label: 'My team', short: 'Team', icon: 'users' },
      { id: 'resources', label: 'Resources', short: 'Files', icon: 'folder' }
    ]
  };

  const state = (ns.state = {
    user: null,
    sessionRole: null,
    workspaces: [],
    clubId: null,
    eventId: null,
    view: 'overview',
    eventOpen: false,
    eventTab: 'overview',
    filters: { q: '', assignee: 'all', priority: 'all' },
    timelineFilter: 'all',
    resourceFilter: 'all',
    lastReadiness: {},
    tasks: [],
    openTaskId: null,
    renderToken: 0
  });

  const currentClub = () => state.workspaces.find((c) => c.id === state.clubId) || null;
  const currentEvent = () => { const c = currentClub(); return c ? c.events.find((e) => e.id === state.eventId) || null : null; };
  const ctx = () => ({ state, api, club: currentClub(), event: currentEvent(), role: (currentClub() || {}).role, embedded: false });
  const resetFilters = () => { state.filters = { q: '', assignee: 'all', priority: 'all' }; state.timelineFilter = 'all'; state.resourceFilter = 'all'; };

  // ------------------------------------------------------------------ theme
  function currentTheme() { return document.documentElement.dataset.theme || 'dark'; }
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
    updateThemeButtons();
  }
  function updateThemeButtons() {
    const dark = currentTheme() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
      b.innerHTML = icon(dark ? 'sun' : 'moon').s;
      b.setAttribute('aria-label', dark ? 'Switch to light theme (The Editorial)' : 'Switch to dark theme (After Hours)');
      b.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    });
  }

  // ------------------------------------------------------------------ public website / login entry
  function showLanding() {
    $('#shell').hidden = true;
    $('#login').hidden = true;
    $('#landing').hidden = false;
    document.title = 'ClubOS — Make good things happen';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showLogin() {
    $('#landing').hidden = true;
    $('#shell').hidden = true;
    $('#login').hidden = false;
    document.title = 'Sign in — ClubOS';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => $('#login-id').focus(), 80);
  }

  // ------------------------------------------------------------------ login
  function renderLoginHints() {
    $('#demo-chips').innerHTML = cfg.demoIdHints.map((h) => html`<button type="button" class="demo-chip" data-action="fill-id" data-id="${h.id}"><b>${h.id}</b><span>${h.label}</span></button>`.s).join('');
  }
  function showLoginError(msg) {
    const el = $('#login-error');
    el.textContent = msg;
    el.hidden = false;
    $('#login-id').setAttribute('aria-invalid', 'true');
  }
  function setBusy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; if (label) btn.textContent = label; }
    else { btn.disabled = false; if (btn.dataset.label) { btn.innerHTML = btn.dataset.label; delete btn.dataset.label; } }
  }

  async function onLogin(form) {
    const input = form.elements.userId;
    const id = input.value.trim().toUpperCase();
    $('#login-error').hidden = true;
    input.removeAttribute('aria-invalid');
    if (!id) { showLoginError('Enter your ID to continue, for example CD001 or MB001.'); input.focus(); return; }
    const btn = form.querySelector('button[type=submit]');
    setBusy(btn, true, 'Checking your ID…');
    try {
      await startSession(id);
    } catch (e) {
      showLoginError(e.status === 404 ? `${e.message} Try one of the demo IDs below.` : (e.message || 'Something went wrong.'));
      input.focus(); input.select();
    } finally { setBusy(btn, false); }
  }

  async function startSession(id) {
    const s = await api.getSession(id);          // backend resolves the full ID to a real user
    api.setSession(s.user.id);
    try {
      state.user = s.user;
      state.sessionRole = s.role;
      ui.setMeta(await api.getMeta());
      await loadWorkspaces(true);
    } catch (e) { api.clearSession(); throw e; }
    try { sessionStorage.setItem(SESSION_KEY, s.user.id); } catch (e) { /* ignore */ }
    showShell();
  }

  function signOut(message) {
    api.clearSession();
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    Object.assign(state, { user: null, sessionRole: null, workspaces: [], clubId: null, eventId: null, view: 'overview', eventOpen: false, eventTab: 'overview', lastReadiness: {}, tasks: [] });
    resetFilters();
    ui.closeModal();
    $('#shell').hidden = true;
    $('#login').hidden = true;
    $('#landing').hidden = false;
    $('#login-form').reset();
    $('#login-error').hidden = true;
    document.title = 'ClubOS — Make good things happen';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (message) toast(message, 'info');
  }

  // ------------------------------------------------------------- workspaces
  async function loadWorkspaces(initial) {
    state.workspaces = await api.getClubs();
    if (!currentClub()) {
      // Prefer a club where the person coordinates, otherwise the first one.
      const first = state.workspaces.find((c) => c.role === 'coordinator') || state.workspaces[0];
      state.clubId = first ? first.id : null;
    }
    const club = currentClub();
    if (club && !club.events.some((e) => e.id === state.eventId)) {
      const upcoming = club.events.find((e) => e.phase === 'upcoming') || club.events[0];
      state.eventId = upcoming ? upcoming.id : null;
    }
    if (!club) state.eventId = null;
    if (initial) { state.view = 'overview'; state.eventOpen = false; }
  }

  function selectClub(id) {
    state.clubId = id;
    const c = currentClub();
    const allowed = NAV[c.role] || NAV.member;
    if (!allowed.some((n) => n.id === state.view)) state.view = 'overview';
    const e = c.events.find((x) => x.phase === 'upcoming') || c.events[0];
    state.eventId = e ? e.id : null;
    state.eventOpen = false;
    resetFilters();
    renderSidebar();
    renderTopbar();
    renderView();
    $('#topbar [data-change="club"]').focus();
  }
  function selectEvent(id) {
    state.eventId = id;
    resetFilters();
    renderTopbar();
    renderView();
    $('#topbar [data-change="event"]').focus();
  }

  // ------------------------------------------------------------------ shell
  function showShell() {
    $('#landing').hidden = true;
    $('#login').hidden = true;
    $('#shell').hidden = false;
    renderSidebar();
    renderTopbar();
    renderView();
  }

  function renderSidebar() {
    const club = currentClub();
    const items = NAV[club ? club.role : 'member'];
    $('#nav').innerHTML = items.map((n) => html`<button class="nav-item" data-action="nav" data-view="${n.id}" ${state.view === n.id ? raw('aria-current="page"') : ''}>
      ${icon(n.icon, 18)}<span class="nav-label">${n.label}</span><span class="nav-short">${n.short}</span></button>`.s).join('');
    const live = api.mode === 'live';
    $('#sidebar-foot').innerHTML = html`<div class="mode-badge ${api.mode}" title="${live ? 'Connected to the Java backend' : 'All data in this prototype is sample data served by js/mock-server.js'}">
      <span class="mode-dot" aria-hidden="true"></span>
      <div><b>${live ? 'Live API' : 'Mock data'}</b><span>${live ? cfg.apiBaseUrl : 'Not connected to the Java backend'}</span></div></div>`.s;
  }
  function updateNav() {
    document.querySelectorAll('#nav .nav-item').forEach((b) => {
      if (b.dataset.view === state.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }

  function renderTopbar() {
    const club = currentClub();
    const u = state.user;
    const roleBadge = club
      ? html`<span class="role-badge ${club.role}" title="Your role in ${club.name}">${club.role === 'coordinator' ? 'Coordinator' : 'Member'}<small>in ${club.name}</small></span>` : '';
    $('#topbar').innerHTML = html`
      <div class="ws" role="group" aria-label="Current workspace">
        <label class="ws-field"><span class="eyebrow">Club</span>
          <select class="select" data-change="club" ${state.workspaces.length ? '' : 'disabled'}>
            ${state.workspaces.length ? state.workspaces.map((c) => html`<option value="${c.id}" ${c.id === state.clubId ? 'selected' : ''}>${c.name}</option>`) : html`<option>No clubs</option>`}
          </select></label>
        <label class="ws-field"><span class="eyebrow">Event</span>
          <select class="select" data-change="event" ${club && club.events.length ? '' : 'disabled'}>
            ${club && club.events.length ? club.events.map((e) => html`<option value="${e.id}" ${e.id === state.eventId ? 'selected' : ''}>${e.name}</option>`) : html`<option>No events</option>`}
          </select></label>
      </div>
      <div class="topbar-right">
        ${roleBadge}
        <div class="user-wrap">
          <button class="user-btn" data-action="toggle-user-menu" aria-haspopup="true" aria-expanded="false" aria-label="Account menu for ${u.name}">${avatar(u.name, u.id)}</button>
          <div class="menu" id="user-menu" hidden>
            <div class="menu-head"><p class="menu-name">${u.name}</p><p class="muted small">ID ${u.id} · demo credential</p>
              <p class="muted small">Signed in as ${state.sessionRole === 'COORDINATOR' ? 'a coordinator' : 'a member'} (from the backend)</p>
              ${api.mode === 'mock' ? html`<p class="muted small">Sample data from js/mock-server.js. Not live.</p>` : ''}</div>
            ${api.mode === 'mock' ? html`<button class="menu-item" data-action="reset-demo">Reset demo data</button>` : ''}
            <button class="menu-item" data-action="sign-out">${icon('logout', 15)}Sign out</button>
          </div>
        </div>
      </div>`.s;
    updateThemeButtons();
  }

  function afterMount(root) {
    root.querySelectorAll('[data-progress]').forEach((el) => {
      el.getBoundingClientRect();             // force layout so the width change animates
      el.style.width = el.dataset.progress + '%';
    });
  }

  function noEventView() {
    const club = currentClub();
    if (!club) return emptyState('You are not part of any club yet', 'Ask a coordinator to add you. Your workspaces will appear here once you are on a team.');
    const isCoord = club.role === 'coordinator';
    return emptyState(`No events in ${club.name} yet`, isCoord ? 'Create your first event to start planning.' : 'You have not been added to an event in this club yet.',
      isCoord ? html`<button class="btn btn-primary" data-action="new-event">${icon('plus', 16)}Create an event</button>` : '');
  }

  async function renderView(opts) {
    const silent = opts && opts.silent;
    const token = ++state.renderToken;
    const main = $('#main');
    if (!silent) main.innerHTML = ui.skeleton().s;
    main.setAttribute('aria-busy', 'true');
    try {
      const c = ctx();
      let content;
      if (state.view === 'events' && c.club) content = await ns.views.events(c);
      else if (!c.event) content = noEventView();
      else content = await ns.views[state.view](c);
      if (token !== state.renderToken) return;
      main.innerHTML = content.s;
      afterMount(main);
      document.title = `${c.event ? c.event.name + ' · ' : ''}ClubOS`;
    } catch (err) {
      if (token !== state.renderToken) return;
      if (err.status === 401) { signOut('Please sign in again.'); return; }
      main.innerHTML = ui.errorState(err.message || 'Unknown error').s;
    } finally {
      if (token === state.renderToken) main.removeAttribute('aria-busy');
    }
  }

  /** After any change: refresh the visible view, workspace counts and an open task dialog. */
  async function refreshAfterChange() {
    try { await loadWorkspaces(); } catch (e) { /* keep stale workspaces */ }
    renderTopbar();
    await renderView({ silent: true });
    if (state.openTaskId && ui.isModalOpen()) await openTaskDetail(state.openTaskId, true);
  }

  // ------------------------------------------------------------ task dialogs
  async function openTaskDetail(taskId, keep) {
    const ev = currentEvent();
    if (!ev) return;
    let tasks;
    try { tasks = await api.getTasks(ev.id); } catch (e) { toast(e.message, 'bad'); return; }
    const t = tasks.find((x) => x.id === taskId);
    if (!t) { ui.closeModal(); toast('That task is no longer available.', 'bad'); return; }
    state.openTaskId = taskId;
    const isCoord = currentClub().role === 'coordinator';
    const unblocks = isCoord ? tasks.filter((x) => x.dependsOn.some((d) => d.id === t.id)) : [];
    const body = html`
      <div class="detail-chips">${C.statusChip(t.status)}${C.priorityChip(t.priority)}${C.flagChips(t)}</div>
      ${t.description ? html`<p class="detail-desc">${t.description}</p>` : ''}
      <dl class="detail-list">
        <div><dt>Assigned to</dt><dd>${C.person(t)}</dd></div>
        <div><dt>Due</dt><dd>${fmtDateLong(t.dueDate)} ${C.dueLabel(t)}</dd></div>
        <div><dt>Skill needed</dt><dd>${t.requiredSkill || html`<span class="muted">Not specified</span>`}</dd></div>
        <div><dt>Status</dt><dd>${t.permissions.canChangeStatus ? C.statusSelect(t) : C.statusChip(t.status)}</dd></div>
      </dl>
      <h3 class="sub-title">Depends on</h3>
      ${t.dependsOn.length ? html`<ul class="dep-list">${t.dependsOn.map((d) => html`<li><span>${d.title}</span>${C.statusChip(d.status)}</li>`)}</ul>` : html`<p class="muted small">No dependencies.</p>`}
      ${isCoord ? html`<h3 class="sub-title">Unblocks</h3>${unblocks.length ? html`<ul class="dep-list">${unblocks.map((d) => html`<li><span>${d.title}</span>${C.statusChip(d.status)}</li>`)}</ul>` : html`<p class="muted small">Nothing depends on this task.</p>`}` : ''}
      <div class="modal-actions">
        ${t.permissions.canEdit ? html`<button class="btn btn-ghost" data-action="edit-task" data-task-id="${t.id}">${icon('edit', 15)}Edit task</button>` : ''}
        <button class="btn btn-primary" data-action="close-modal">Done</button>
      </div>`;
    ui.openModal({ eyebrow: `${currentClub().name} · ${ev.name}`, title: t.title, body, wide: true, keepFocus: keep });
  }

  let suggestSeq = 0;
  async function refreshSuggestions(form) {
    const panel = $('#suggest-panel', form);
    if (!panel) return;
    const seq = ++suggestSeq;
    const skill = form.elements.requiredSkill.value;
    const dueDate = form.elements.dueDate.value;
    try {
      const s = await api.getSuggestions(currentEvent().id, { skill, dueDate, taskId: form.dataset.taskId || '' });
      if (seq !== suggestSeq) return;
      panel.innerHTML = html`
        <p class="eyebrow">Suggested owners</p>
        ${s.noSkillMatch ? html`<p class="muted small">Nobody on this team lists ${s.skill}, so suggestions use workload only.</p>` : ''}
        <ul class="suggest-list">${s.options.map((o) => html`<li>
          ${avatar(o.name, o.userId)}
          <div class="grow"><b>${o.name}</b><p class="muted small">${o.reasons.join(' · ')}</p></div>
          <button type="button" class="btn btn-ghost btn-sm" data-action="use-suggestion" data-user-id="${o.userId}">Use</button>
        </li>`)}</ul>
        <p class="muted small">Rule-based ranking calculated by the backend.</p>`.s;
    } catch (e) { if (seq === suggestSeq) panel.innerHTML = html`<p class="muted small">Suggestions are unavailable right now.</p>`.s; }
  }

  async function openTaskForm(taskId) {
    const ev = currentEvent();
    if (!ev) return;
    let tasks, people;
    try { [tasks, people] = await Promise.all([api.getTasks(ev.id), api.getPeople(ev.id)]); } catch (e) { toast(e.message, 'bad'); return; }
    const t = taskId ? tasks.find((x) => x.id === taskId) : null;
    if (taskId && !t) { toast('That task is no longer available.', 'bad'); return; }
    const meta = ui.getMeta();
    const depIds = t ? t.dependsOn.map((d) => d.id) : [];
    const others = tasks.filter((x) => !t || x.id !== t.id);
    const defaultDue = t ? t.dueDate : '';
    const body = html`<form data-form="task" data-task-id="${t ? t.id : ''}" novalidate>
      <div class="field"><label for="f-title">Title</label>
        <input class="input" id="f-title" name="title" maxlength="120" required value="${t ? t.title : ''}" data-autofocus></div>
      <div class="field"><label for="f-desc">Description <span class="muted">(optional)</span></label>
        <textarea class="input" id="f-desc" name="description" rows="3" maxlength="500">${t ? t.description : ''}</textarea></div>
      <div class="form-grid">
        <div class="field"><label for="f-prio">Priority</label>
          <select class="select" id="f-prio" name="priority">${meta.priorities.map((p) => html`<option value="${p.id}" ${(t ? t.priority : 'medium') === p.id ? 'selected' : ''}>${p.label}</option>`)}</select></div>
        <div class="field"><label for="f-due">Due date</label>
          <input class="input" type="date" id="f-due" name="dueDate" value="${defaultDue}" required data-change="task-suggest"></div>
        <div class="field"><label for="f-skill">Skill needed</label>
          <select class="select" id="f-skill" name="requiredSkill" data-change="task-suggest"><option value="">No specific skill</option>
            ${meta.skills.map((s) => html`<option ${t && t.requiredSkill === s ? 'selected' : ''}>${s}</option>`)}</select></div>
        <div class="field"><label for="f-assignee">Assigned to</label>
          <select class="select" id="f-assignee" name="assigneeId"><option value="">Unassigned</option>
            ${people.people.map((p) => html`<option value="${p.id}" ${t && t.assigneeId === p.id ? 'selected' : ''}>${p.name}${p.workload ? ` (${p.workload.level.toLowerCase()})` : ''}</option>`)}</select></div>
        ${t ? html`<div class="field"><label for="f-status">Status</label>
          <select class="select" id="f-status" name="status">${meta.statuses.map((s) => html`<option value="${s.id}" ${t.status === s.id ? 'selected' : ''}>${s.label}</option>`)}</select></div>` : ''}
      </div>
      <div id="suggest-panel" class="suggest-panel" aria-live="polite"></div>
      <fieldset class="field dep-field"><legend>Depends on <span class="muted">(must be finished first)</span></legend>
        ${others.length ? html`<div class="check-list">${others.map((o) => html`<label class="check"><input type="checkbox" name="dependsOn" value="${o.id}" ${depIds.includes(o.id) ? 'checked' : ''}>
          <span>${o.title}</span>${C.statusChip(o.status)}</label>`)}</div>` : html`<p class="muted small">There are no other tasks yet.</p>`}
      </fieldset>
      <p class="form-error" role="alert" hidden></p>
      <div class="modal-actions"><button type="button" class="btn btn-quiet" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">${t ? 'Save changes' : 'Create task'}</button></div>
    </form>`;
    state.openTaskId = null;
    ui.openModal({ eyebrow: ev.name, title: t ? 'Edit task' : 'New task', body, wide: true });
    refreshSuggestions($('#modal form'));
  }

  async function openEventForm() {
    const club = currentClub();
    let members;
    try { members = await api.getClubMembers(club.id); } catch (e) { toast(e.message, 'bad'); return; }
    const body = html`<form data-form="event" data-club-id="${club.id}" novalidate>
      <div class="field"><label for="e-name">Event name</label><input class="input" id="e-name" name="name" maxlength="80" required data-autofocus></div>
      <div class="form-grid">
        <div class="field"><label for="e-type">Event type</label><select class="select" id="e-type" name="type" required>
          <option value="PERFORMANCE">Performance</option><option value="CULTURAL">Cultural</option>
          <option value="COMPETITION">Competition</option><option value="WORKSHOP">Workshop</option>
        </select></div>
        <div class="field"><label for="e-date">Date</label><input class="input" type="date" id="e-date" name="date" required></div>
      </div>
      <div class="field"><label for="e-venue">Venue <span class="muted">(optional)</span></label><input class="input" id="e-venue" name="venue" maxlength="80"></div>
      <div class="field"><label for="e-desc">Description <span class="muted">(optional)</span></label><textarea class="input" id="e-desc" name="description" rows="3" maxlength="400"></textarea></div>
      <fieldset class="field dep-field"><legend>Team <span class="muted">(you are added automatically)</span></legend>
        <div class="check-list">${members.filter((m) => m.id !== state.user.id).map((m) => html`<label class="check"><input type="checkbox" name="teamIds" value="${m.id}"><span>${m.name}</span><span class="muted small">${m.skills.slice(0, 2).join(', ')}</span></label>`)}</div>
      </fieldset>
      <p class="form-error" role="alert" hidden></p>
      <div class="modal-actions"><button type="button" class="btn btn-quiet" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">Create event</button></div>
    </form>`;
    state.openTaskId = null;
    ui.openModal({ eyebrow: club.name, title: 'New event', body });
  }

  function openResourceForm() {
    const ev = currentEvent();
    const cats = ui.getMeta().resourceCategories;
    const body = html`<form data-form="resource" novalidate>
      <div class="field"><label for="r-name">Name</label><input class="input" id="r-name" name="name" maxlength="80" required data-autofocus></div>
      <div class="form-grid">
        <div class="field"><label for="r-cat">Category</label><select class="select" id="r-cat" name="category">${cats.map((c) => html`<option>${c}</option>`)}</select></div>
        <div class="field"><label for="r-url">Link <span class="muted">(optional for notes)</span></label><input class="input" id="r-url" name="url" type="url" placeholder="https://"></div>
      </div>
      <div class="field"><label for="r-desc">Description</label><textarea class="input" id="r-desc" name="description" rows="3" maxlength="300"></textarea></div>
      <p class="form-error" role="alert" hidden></p>
      <div class="modal-actions"><button type="button" class="btn btn-quiet" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">Add resource</button></div>
    </form>`;
    state.openTaskId = null;
    ui.openModal({ eyebrow: ev.name, title: 'Add a resource', body });
  }

  // ------------------------------------------------------------------ forms
  function formError(form, msg) {
    const el = $('.form-error', form);
    el.textContent = msg;
    el.hidden = false;
  }

  const forms = {
    async task(form) {
      const fd = new FormData(form);
      const id = form.dataset.taskId;
      const payload = {
        title: String(fd.get('title') || '').trim(),
        description: String(fd.get('description') || '').trim(),
        priority: fd.get('priority'),
        dueDate: fd.get('dueDate'),
        requiredSkill: fd.get('requiredSkill') || null,
        assigneeId: fd.get('assigneeId') || null,
        dependsOn: fd.getAll('dependsOn')
      };
      if (id) payload.status = fd.get('status');
      $('.form-error', form).hidden = true;
      if (payload.title.length < 3) return formError(form, 'Give the task a title of at least 3 characters.');
      if (!payload.dueDate) return formError(form, 'Choose a due date.');
      const btn = form.querySelector('[type=submit]');
      setBusy(btn, true, 'Saving…');
      try {
        if (id) await api.updateTask(id, payload); else await api.createTask(currentEvent().id, payload);
        ui.closeModal();
        toast(id ? 'Task updated' : 'Task created', 'ok');
        await refreshAfterChange();
      } catch (e) { formError(form, e.message); } finally { setBusy(btn, false); }
    },

    async event(form) {
      const fd = new FormData(form);
      const payload = {
        clubId: form.dataset.clubId,
        name: String(fd.get('name') || '').trim(),
        date: fd.get('date'),
        type: fd.get('type'),
        venue: String(fd.get('venue') || '').trim(),
        description: String(fd.get('description') || '').trim(),
        teamIds: fd.getAll('teamIds')
      };
      $('.form-error', form).hidden = true;
      if (payload.name.length < 3) return formError(form, 'Give the event a name of at least 3 characters.');
      if (!payload.date) return formError(form, 'Choose the event date.');
      const btn = form.querySelector('[type=submit]');
      setBusy(btn, true, 'Creating…');
      try {
        const ev = await api.createEvent(payload);
        ui.closeModal();
        await loadWorkspaces();
        state.eventId = ev.id; state.eventOpen = true; state.eventTab = 'overview'; state.view = 'events';
        resetFilters();
        renderTopbar(); updateNav(); await renderView();
        toast(`${ev.name} created`, 'ok');
      } catch (e) { formError(form, e.message); } finally { setBusy(btn, false); }
    },

    async resource(form) {
      const fd = new FormData(form);
      const payload = { name: String(fd.get('name') || '').trim(), category: fd.get('category'), url: String(fd.get('url') || '').trim(), description: String(fd.get('description') || '').trim() };
      $('.form-error', form).hidden = true;
      if (payload.name.length < 3) return formError(form, 'Give the resource a name of at least 3 characters.');
      const btn = form.querySelector('[type=submit]');
      setBusy(btn, true, 'Adding…');
      try {
        await api.createResource(currentEvent().id, payload);
        ui.closeModal();
        toast('Resource added', 'ok');
        await renderView({ silent: true });
      } catch (e) { formError(form, e.message); } finally { setBusy(btn, false); }
    }
  };

  // ---------------------------------------------------------------- actions
  async function changeStatus(taskId, status) {
    try {
      await api.updateTask(taskId, { status });
      toast(`Moved to ${ui.statusLabel(status)}`, 'ok');
    } catch (e) { toast(e.message, 'bad'); }
    await refreshAfterChange();   // re-render also reverts a select the backend refused
  }

  function setView(view) {
    state.view = view;
    if (view === 'events') state.eventOpen = false;
    updateNav();
    renderView();
    $('#main').focus({ preventScroll: true });
  }

  function closeUserMenu() {
    const m = $('#user-menu');
    if (!m || m.hidden) return;
    m.hidden = true;
    const b = $('.user-btn'); if (b) b.setAttribute('aria-expanded', 'false');
  }

  const actions = {
    'show-login': () => showLogin(),
    'show-landing': () => showLanding(),
    'toggle-mobile-nav': () => {
      const nav = $('.marketing-links');
      if (nav) nav.classList.toggle('mobile-open');
    },
    'fill-id': (el) => { const i = $('#login-id'); i.value = el.dataset.id; i.focus(); $('#login-error').hidden = true; },
    nav: (el) => setView(el.dataset.view),
    'toggle-theme': () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'),
    'toggle-user-menu': (el) => {
      const m = $('#user-menu');
      const open = m.hidden;
      m.hidden = !open;
      el.setAttribute('aria-expanded', String(open));
    },
    'sign-out': () => signOut(),
    'reset-demo': async () => {
      closeUserMenu();
      api.resetMockData();
      resetFilters(); state.lastReadiness = {};
      await loadWorkspaces(true);
      renderTopbar(); updateNav(); await renderView();
      toast('Demo data restored', 'ok');
    },
    retry: () => renderView(),
    'close-modal': () => ui.closeModal(),

    'open-event': (el) => {
      state.clubId = el.dataset.clubId || state.clubId;
      state.eventId = el.dataset.eventId; state.eventOpen = true; state.eventTab = 'overview'; state.view = 'events';
      resetFilters(); renderSidebar(); renderTopbar(); updateNav(); renderView();
      $('#main').focus({ preventScroll: true });
    },
    'switch-workspace': (el) => {
      state.clubId = el.dataset.clubId; state.eventId = el.dataset.eventId; state.eventOpen = false;
      const allowed = NAV[(currentClub() || {}).role] || NAV.member;
      if (!allowed.some((n) => n.id === state.view)) state.view = 'overview';
      resetFilters(); renderSidebar(); renderTopbar(); renderView();
      window.scrollTo({ top: 0 });
    },
    'events-back': () => { state.eventOpen = false; renderView(); },
    'event-tab': (el) => { state.eventTab = el.dataset.tab; renderView({ silent: true }); },
    'goto-board': () => setView('board'),
    'goto-people': () => setView('people'),

    'open-task': (el) => openTaskDetail(el.dataset.taskId),
    'new-task': () => openTaskForm(null),
    'edit-task': (el) => openTaskForm(el.dataset.taskId),
    'new-event': () => openEventForm(),
    'new-resource': () => openResourceForm(),

    'assign-suggestion': async (el) => {
      el.disabled = true;
      try {
        const t = await api.updateTask(el.dataset.taskId, { assigneeId: el.dataset.userId });
        toast(`Assigned to ${t.assigneeName}`, 'ok');
      } catch (e) { toast(e.message, 'bad'); }
      await refreshAfterChange();
    },
    'use-suggestion': (el) => {
      const form = el.closest('form');
      form.elements.assigneeId.value = el.dataset.userId;
      form.elements.assigneeId.focus();
    },

    'clear-filters': () => { state.filters = { q: '', assignee: 'all', priority: 'all' }; renderView({ silent: true }); },
    'filter-assignee': (el) => { state.filters = { q: '', assignee: el.dataset.userId, priority: 'all' }; setView('board'); },
    'timeline-filter': (el) => { state.timelineFilter = el.dataset.value; renderView({ silent: true }); },
    'resource-filter': (el) => { state.resourceFilter = el.dataset.value; renderView({ silent: true }); }
  };

  const changes = {
    club: (el) => selectClub(el.value),
    event: (el) => selectEvent(el.value),
    'task-status': (el) => changeStatus(el.dataset.taskId, el.value),
    'board-filter': (el) => { state.filters[el.dataset.key] = el.value; redrawBoard(); },
    'task-suggest': (el) => refreshSuggestions(el.closest('form'))
  };

  function redrawBoard() {
    const cols = $('#board-cols');
    if (!cols) return;
    const c = ctx();
    cols.innerHTML = ns.views.boardColumns(c, state.tasks).s;
    const n = ns.views.boardApplyFilters(state.tasks, state.filters).length;
    $('#board-count').textContent = `${n} of ${state.tasks.length} tasks`;
  }

  // ------------------------------------------------------- global listeners
  function bind() {
    document.addEventListener('click', (e) => {
      const menu = $('#user-menu');
      if (menu && !menu.hidden && !e.target.closest('.user-wrap')) closeUserMenu();

      const modal = $('#modal');
      if (e.target === modal) { ui.closeModal(); return; }

      const el = e.target.closest('[data-action]');
      if (el) {
        const fn = actions[el.dataset.action];
        if (fn) fn(el, e);
        return;
      }
      const card = e.target.closest('.task-card');
      if (card && !e.target.closest('select,button,a')) openTaskDetail(card.dataset.taskId);
    });

    document.addEventListener('change', (e) => {
      const el = e.target.closest('[data-change]');
      if (!el) return;
      const fn = changes[el.dataset.change];
      if (fn) fn(el);
    });

    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-input="board-search"]')) { state.filters.q = e.target.value; redrawBoard(); }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.matches('#login-form')) { e.preventDefault(); onLogin(e.target); return; }
      const f = e.target.closest('form[data-form]');
      if (f) { e.preventDefault(); forms[f.dataset.form](f); }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeUserMenu();
    });

    $('#modal').addEventListener('close', () => { state.openTaskId = null; });

    // Drag a card to another column; the backend still decides if the move is allowed.
    document.addEventListener('dragstart', (e) => {
      const card = e.target instanceof Element && e.target.closest('.task-card[draggable="true"]');
      if (!card) return;
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    document.addEventListener('dragend', (e) => {
      if (e.target instanceof Element) e.target.classList.remove('dragging');
      document.querySelectorAll('.board-col.drop').forEach((c) => c.classList.remove('drop'));
    });
    document.addEventListener('dragover', (e) => {
      const col = e.target instanceof Element && e.target.closest('.board-col');
      if (!col) return;
      e.preventDefault();
      document.querySelectorAll('.board-col.drop').forEach((c) => { if (c !== col) c.classList.remove('drop'); });
      col.classList.add('drop');
    });
    document.addEventListener('drop', (e) => {
      const col = e.target instanceof Element && e.target.closest('.board-col');
      if (!col) return;
      e.preventDefault();
      col.classList.remove('drop');
      const id = e.dataTransfer.getData('text/plain');
      const t = state.tasks.find((x) => x.id === id);
      if (t && t.status !== col.dataset.status) changeStatus(id, col.dataset.status);
    });
  }

  // ------------------------------------------------------------------- boot
  async function boot() {
    updateThemeButtons();
    renderLoginHints();
    bind();
    let saved = null;
    try { saved = sessionStorage.getItem(SESSION_KEY); } catch (e) { /* ignore */ }
    if (saved) {
      try { await startSession(saved); return; } catch (e) { try { sessionStorage.removeItem(SESSION_KEY); } catch (x) { /* ignore */ } }
    }
    showLanding();
  }

  ns.app = { boot, state };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
