/**
 * MOCK BACKEND — stands in for the Java application until it is connected.
 *
 * This is NOT part of the real product. It exists so the frontend can be
 * demonstrated and tested without Java. It deliberately mirrors the REST
 * contract (same paths, same JSON shapes, same HTTP status codes), so
 * switching to the real backend means setting `useMock: false` in config.js.
 *
 * Every rule below is the Java team's responsibility in the real system:
 *
 *   resolveSession / permissions ........ SessionService, access checks in controllers
 *   readiness()  ........................ ReadinessCalculator (Event)
 *   workload()   ........................ WorkloadService (Member)
 *   suggest()    ........................ AssignmentSuggester
 *   flagsFor() / attentionFor() ......... Task (overdue, due soon, dependency state)
 *   PATCH /api/tasks/:id rules .......... TaskService (status rules, dependency checks)
 *
 * The frontend only DISPLAYS the values returned here.
 * State is kept in localStorage so edits survive a reload; "Reset demo data"
 * in the user menu restores the original sample data.
 */
(function () {
  'use strict';

  const cfg = window.CLUBOS_CONFIG || {};
  const DB_KEY = 'clubos.mock.db.v2';

  const STATUSES = [
    { id: 'todo', label: 'To do' },
    { id: 'in_progress', label: 'In progress' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'done', label: 'Completed' }
  ];
  const PRIORITIES = [
    { id: 'high', label: 'High', weight: 3 },
    { id: 'medium', label: 'Medium', weight: 2 },
    { id: 'low', label: 'Low', weight: 1 }
  ];
  const SKILLS = ['Styling', 'Design', 'Photography', 'Social Media', 'Music', 'Sound', 'Choreography',
    'Logistics', 'Sponsorship', 'Budgeting', 'Stage Management', 'Scripting', 'Lighting', 'Coding'];
  const RESOURCE_CATEGORIES = ['Posters', 'Scripts', 'Music', 'Documents', 'Notes', 'Links'];
  const DUE_SOON_DAYS = 3;

  // ------------------------------------------------------------------ storage
  let db = loadDb();

  function loadDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to seed */ }
    return window.ClubOSSeed();
  }
  function saveDb() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* storage unavailable */ }
  }
  function resetDb() {
    db = window.ClubOSSeed();
    saveDb();
  }

  // ------------------------------------------------------------------ helpers
  class HttpError extends Error {
    constructor(status, code, message) { super(message); this.status = status; this.code = code; }
  }
  const need = (cond, msg) => { if (!cond) throw new HttpError(422, 'VALIDATION', msg); };

  const pad = (n) => String(n).padStart(2, '0');
  const fmtIso = (t) => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  const todayIso = () => fmtIso(new Date());
  const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const diffDays = (iso, base) => Math.round((toDate(iso) - toDate(base || todayIso())) / 86400000);
  const validIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fmtIso(toDate(s)) === s;
  const initials = (name) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pWeight = (p) => (PRIORITIES.find((x) => x.id === p) || { weight: 1 }).weight;

  const userById = (id) => db.users.find((u) => u.id === id);
  const clubById = (id) => db.clubs.find((c) => c.id === id);
  const eventById = (id) => db.events.find((e) => e.id === id);
  const taskById = (id) => db.tasks.find((t) => t.id === id);
  const clubRole = (userId, clubId) => {
    const m = db.memberships.find((x) => x.userId === userId && x.clubId === clubId);
    return m ? m.role : null;
  };

  /** Access rule: coordinators see every event of clubs they coordinate; members only events they are on. */
  function requireEvent(user, eventId) {
    const ev = eventById(eventId);
    if (!ev) throw new HttpError(404, 'NOT_FOUND', 'That event does not exist.');
    const role = clubRole(user.id, ev.clubId);
    const allowed = role === 'coordinator' || (role === 'member' && ev.teamIds.includes(user.id));
    if (!allowed) throw new HttpError(403, 'FORBIDDEN', 'You do not have access to this event.');
    return { ev, role };
  }
  function visibleEvents(user, clubId) {
    const role = clubRole(user.id, clubId);
    if (!role) return [];
    return db.events
      .filter((e) => e.clubId === clubId && (role === 'coordinator' || e.teamIds.includes(user.id)))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ----------------------------------------------------------- domain rules
  /** ReadinessCalculator: share of priority-weighted work that is completed. */
  function readiness(eventId) {
    const ts = db.tasks.filter((t) => t.eventId === eventId);
    const byStatus = { todo: 0, in_progress: 0, blocked: 0, done: 0 };
    let total = 0, done = 0;
    const t0 = todayIso();
    let overdue = 0;
    ts.forEach((t) => {
      byStatus[t.status]++;
      const w = pWeight(t.priority);
      total += w;
      if (t.status === 'done') done += w;
      else if (diffDays(t.dueDate, t0) < 0) overdue++;
    });
    const percent = total ? Math.round((100 * done) / total) : 0;
    let health = 'on_track';
    if (!ts.length) health = 'empty';
    else if (overdue > 0 || byStatus.blocked > 0) health = 'attention';
    return { percent, total: ts.length, done: byStatus.done, byStatus, overdue, health };
  }

  function flagsFor(t, t0) {
    const open = t.status !== 'done';
    const days = diffDays(t.dueDate, t0);
    const unfinished = t.dependsOn.map(taskById).filter((d) => d && d.status !== 'done');
    return {
      overdue: open && days < 0,
      dueSoon: open && days >= 0 && days <= DUE_SOON_DAYS,
      dependencyBlocked: open && unfinished.length > 0,
      unassigned: open && !t.assigneeId,
      daysUntilDue: days
    };
  }

  function taskView(t, role, user, t0) {
    const a = t.assigneeId ? userById(t.assigneeId) : null;
    return {
      id: t.id, eventId: t.eventId, title: t.title, description: t.description || '',
      assigneeId: t.assigneeId || null,
      assigneeName: a ? a.name : null,
      assigneeInitials: a ? initials(a.name) : null,
      dueDate: t.dueDate, priority: t.priority, status: t.status,
      requiredSkill: t.requiredSkill || null,
      dependsOn: t.dependsOn.map(taskById).filter(Boolean).map((d) => ({ id: d.id, title: d.title, status: d.status })),
      flags: flagsFor(t, t0),
      isYours: t.assigneeId === user.id,
      permissions: {
        canEdit: role === 'coordinator',
        canChangeStatus: role === 'coordinator' || t.assigneeId === user.id
      }
    };
  }

  /** Which tasks a user may see: coordinators all, members only what is assigned to them. */
  function visibleTasks(ev, role, user) {
    const all = db.tasks.filter((t) => t.eventId === ev.id);
    return role === 'coordinator' ? all : all.filter((t) => t.assigneeId === user.id);
  }

  function attentionFor(tv) {
    const reasons = [];
    let score = 0;
    const f = tv.flags;
    if (f.overdue) { reasons.push({ kind: 'overdue', text: `Overdue by ${-f.daysUntilDue} day${f.daysUntilDue === -1 ? '' : 's'}` }); score += 100 + Math.min(-f.daysUntilDue, 30); }
    if (tv.status === 'blocked') { reasons.push({ kind: 'blocked', text: 'Marked blocked' }); score += 80; }
    if (f.unassigned) { reasons.push({ kind: 'unassigned', text: 'No owner yet' }); score += 60; }
    if (f.dependencyBlocked && f.daysUntilDue <= 7) {
      const names = tv.dependsOn.filter((d) => d.status !== 'done').map((d) => d.title);
      reasons.push({ kind: 'waiting', text: `Waiting on ${names.length > 1 ? names.length + ' tasks' : names[0]}` });
      score += 50;
    }
    if (f.dueSoon && !f.overdue) {
      const n = f.daysUntilDue;
      reasons.push({ kind: 'due_soon', text: n === 0 ? 'Due today' : n === 1 ? 'Due tomorrow' : `Due in ${n} days` });
      score += 40 - n;
    }
    return { score, reasons };
  }

  /** WorkloadService: open tasks, weighted load and a simple level label. */
  function workload(ev, userId, t0, excludeTaskId) {
    const mine = db.tasks.filter((t) => t.eventId === ev.id && t.assigneeId === userId && t.id !== excludeTaskId);
    const active = mine.filter((t) => t.status !== 'done');
    const weight = active.reduce((a, t) => a + pWeight(t.priority), 0);
    const overdue = active.filter((t) => diffDays(t.dueDate, t0) < 0).length;
    const level = weight === 0 ? 'Free' : weight <= 4 ? 'Light' : weight <= 8 ? 'Balanced' : 'Heavy';
    return { active: active.length, done: mine.length - active.length, overdue, weight, level, capacity: 12 };
  }

  /** AssignmentSuggester: rule-based ranking (skill match, current load, overdue work, deadline crowding). */
  function suggest(ev, opts, t0) {
    const skill = opts.skill || null;
    const team = ev.teamIds.map(userById).filter(Boolean);
    const anyMatch = !!skill && team.some((u) => u.skills.includes(skill));
    const ranked = team.map((u) => {
      const wl = workload(ev, u.id, t0, opts.taskId);
      const skillMatch = !!skill && u.skills.includes(skill);
      let score = 50 - wl.weight * 4 - wl.overdue * 10;
      const reasons = [];
      if (skillMatch) { score += 40; reasons.push(`Has the ${skill} skill`); }
      if (opts.dueDate && validIso(opts.dueDate)) {
        const crowded = db.tasks.filter((t) => t.eventId === ev.id && t.assigneeId === u.id && t.id !== opts.taskId &&
          t.status !== 'done' && Math.abs(diffDays(t.dueDate, opts.dueDate)) <= 1).length;
        if (crowded > 0) { score -= 5 * Math.min(crowded, 2); reasons.push(`${crowded} deadline${crowded > 1 ? 's' : ''} near this date`); }
      }
      reasons.push(wl.active === 0 ? 'No open tasks' : `${wl.level} workload (${wl.active} open)`);
      if (wl.overdue) reasons.push(`${wl.overdue} overdue`);
      return { userId: u.id, name: u.name, initials: initials(u.name), skillMatch, reasons, level: wl.level, score };
    });
    ranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return { skill, noSkillMatch: !!skill && !anyMatch, options: ranked.slice(0, 3).map(({ score, ...rest }) => rest) };
  }

  function eventSummary(ev, user, role) {
    const r = readiness(ev.id);
    const t0 = todayIso();
    const days = diffDays(ev.date, t0);
    return {
      id: ev.id, clubId: ev.clubId, clubName: clubById(ev.clubId).name,
      name: ev.name, date: ev.date, venue: ev.venue, description: ev.description,
      daysToGo: days, phase: days < 0 ? 'past' : 'upcoming',
      teamSize: ev.teamIds.length,
      readiness: { percent: r.percent, health: r.health, overdue: r.overdue, total: r.total, done: r.done },
      role,
      myOpenTasks: db.tasks.filter((t) => t.eventId === ev.id && t.assigneeId === user.id && t.status !== 'done').length
    };
  }

  function announcementView(a) {
    const u = userById(a.authorId);
    return { id: a.id, title: a.title, body: a.body, authorName: u ? u.name : 'Unknown', postedOn: a.postedOn };
  }

  // -------------------------------------------------------------- validation
  function reaches(fromId, targetId, seen) {
    seen = seen || new Set();
    if (fromId === targetId) return true;
    if (seen.has(fromId)) return false;
    seen.add(fromId);
    const t = taskById(fromId);
    return !!t && t.dependsOn.some((id) => reaches(id, targetId, seen));
  }

  function cleanTaskFields(ev, body, partial, selfId) {
    const out = {};
    if (!partial || 'title' in body) {
      const v = str(body.title);
      need(v.length >= 3, 'Give the task a title of at least 3 characters.');
      need(v.length <= 120, 'Keep the title under 120 characters.');
      out.title = v;
    }
    if ('description' in body) {
      const v = str(body.description);
      need(v.length <= 500, 'Keep the description under 500 characters.');
      out.description = v;
    }
    if (!partial || 'dueDate' in body) {
      need(validIso(body.dueDate), 'Choose a valid due date.');
      out.dueDate = body.dueDate;
    }
    if (!partial || 'priority' in body) {
      need(PRIORITIES.some((p) => p.id === body.priority), 'Choose a priority.');
      out.priority = body.priority;
    }
    if ('assigneeId' in body) {
      const v = body.assigneeId || null;
      need(v === null || ev.teamIds.includes(v), 'That person is not on this event\'s team.');
      out.assigneeId = v;
    }
    if ('requiredSkill' in body) {
      const v = body.requiredSkill || null;
      need(v === null || SKILLS.includes(v), 'Unknown skill.');
      out.requiredSkill = v;
    }
    if ('dependsOn' in body) {
      const v = Array.isArray(body.dependsOn) ? Array.from(new Set(body.dependsOn)) : [];
      v.forEach((id) => {
        need(id !== selfId, 'A task cannot depend on itself.');
        need(db.tasks.some((t) => t.id === id && t.eventId === ev.id), 'A dependency is not part of this event.');
        if (selfId) need(!reaches(id, selfId), 'That dependency would create a loop between tasks.');
      });
      out.dependsOn = v;
    }
    if ('status' in body) {
      need(STATUSES.some((s) => s.id === body.status), 'Unknown status.');
      out.status = body.status;
    }
    return out;
  }

  // ------------------------------------------------------------------ routes
  const routes = [];
  function route(method, pattern, handler, opts) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, re, keys, handler, opts: opts || {} });
  }

  // GET /api/session/{id}  — resolve the demo ID to a real user record and role.
  route('GET', '/api/session/:id', ({ params }) => {
    const id = decodeURIComponent(params.id).trim().toUpperCase();
    const u = userById(id);
    if (!u) throw new HttpError(404, 'UNKNOWN_ID', `We couldn't find the ID “${decodeURIComponent(params.id).trim()}”.`);
    const coordinates = db.memberships.some((m) => m.userId === u.id && m.role === 'coordinator');
    return { user: { id: u.id, name: u.name, initials: initials(u.name), skills: u.skills }, role: coordinates ? 'COORDINATOR' : 'MEMBER' };
  }, { public: true });

  route('GET', '/api/meta', () => ({ statuses: STATUSES, priorities: PRIORITIES.map(({ id, label }) => ({ id, label })), skills: SKILLS, resourceCategories: RESOURCE_CATEGORIES }));

  // GET /api/clubs — only the club workspaces this user belongs to, each with the events they may see.
  route('GET', '/api/clubs', ({ user }) =>
    db.memberships.filter((m) => m.userId === user.id).map((m) => {
      const club = clubById(m.clubId);
      return { id: club.id, name: club.name, tagline: club.tagline, role: m.role, events: visibleEvents(user, club.id).map((e) => eventSummary(e, user, m.role)) };
    }));

  // GET /api/clubs/{id}/members  (additional proposed endpoint; coordinators only, used by "New event")
  route('GET', '/api/clubs/:id/members', ({ user, params }) => {
    const role = clubRole(user.id, params.id);
    if (!role) throw new HttpError(403, 'FORBIDDEN', 'You are not part of that club.');
    if (role !== 'coordinator') throw new HttpError(403, 'FORBIDDEN', 'Only coordinators can see the club member list.');
    return db.memberships.filter((m) => m.clubId === params.id).map((m) => {
      const u = userById(m.userId);
      return { id: u.id, name: u.name, initials: initials(u.name), skills: u.skills, clubRole: m.role };
    });
  });

  // GET /api/events?clubId=
  route('GET', '/api/events',({ user, query }) => {
    const clubs = query.clubId ? [query.clubId] : db.memberships.filter((m) => m.userId === user.id).map((m) => m.clubId);
    if (query.clubId && !clubRole(user.id, query.clubId)) throw new HttpError(403, 'FORBIDDEN', 'You are not part of that club.');
    return clubs.flatMap((cid) => visibleEvents(user, cid).map((e) => eventSummary(e, user, clubRole(user.id, cid))));
  });

  // POST /api/events
  route('POST', '/api/events', ({ user, body }) => {
    const role = clubRole(user.id, body.clubId);
    if (!role) throw new HttpError(403, 'FORBIDDEN', 'You are not part of that club.');
    if (role !== 'coordinator') throw new HttpError(403, 'FORBIDDEN', 'Only coordinators can create events.');
    const name = str(body.name), venue = str(body.venue), description = str(body.description);
    need(name.length >= 3 && name.length <= 80, 'Event names need 3 to 80 characters.');
    need(validIso(body.date), 'Choose a valid event date.');
    need(diffDays(body.date) >= 0, 'The event date cannot be in the past.');
    need(venue.length <= 80, 'Keep the venue under 80 characters.');
    need(description.length <= 400, 'Keep the description under 400 characters.');
    const clubMembers = db.memberships.filter((m) => m.clubId === body.clubId).map((m) => m.userId);
    const team = Array.from(new Set([user.id].concat(Array.isArray(body.teamIds) ? body.teamIds : [])));
    team.forEach((id) => need(clubMembers.includes(id), 'Everyone on the team must be a member of the club.'));
    const ev = {
      id: 'E' + (++db.seq), clubId: body.clubId, name, date: body.date, venue, description, teamIds: team,
      milestones: [{ id: 'M' + (++db.seq), title: 'Event day', date: body.date }]
    };
    db.events.push(ev);
    return eventSummary(ev, user, role);
  }, { created: true });

  // GET /api/dashboard?eventId=  — role-aware payload for the overview screen.
  route('GET', '/api/dashboard', ({ user, query }) => {
    const { ev, role } = requireEvent(user, query.eventId);
    const t0 = todayIso();
    const views = visibleTasks(ev, role, user).map((t) => taskView(t, role, user, t0));
    const open = views.filter((t) => t.status !== 'done');
    const byDue = (a, b) => a.dueDate.localeCompare(b.dueDate);

    const attention = open
      .map((tv) => ({ tv, a: attentionFor(tv) }))
      .filter((x) => x.a.score > 0)
      .sort((x, y) => y.a.score - x.a.score)
      .slice(0, 6)
      .map((x) => Object.assign({}, x.tv, { reasons: x.a.reasons }));

    const out = {
      role,
      event: eventSummary(ev, user, role),
      readiness: readiness(ev.id),
      milestones: ev.milestones
        .map((m) => ({ id: m.id, title: m.title, date: m.date, daysUntil: diffDays(m.date, t0) }))
        .filter((m) => m.daysUntil >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4),
      announcements: db.announcements.filter((a) => a.eventId === ev.id).sort((a, b) => b.postedOn.localeCompare(a.postedOn)).slice(0, 3).map(announcementView),
      attention,
      upcoming: open.filter((t) => t.flags.daysUntilDue >= 0 && t.flags.daysUntilDue <= 7).sort(byDue).slice(0, 6)
    };

    if (role === 'coordinator') {
      const unassigned = open.filter((t) => t.flags.unassigned).sort(byDue);
      out.coordinator = {
        workload: ev.teamIds.map((uid) => {
          const u = userById(uid);
          return Object.assign({ userId: u.id, name: u.name, initials: initials(u.name), clubRole: clubRole(u.id, ev.clubId) }, workload(ev, u.id, t0));
        }).sort((a, b) => b.weight - a.weight),
        unassignedCount: unassigned.length,
        suggestions: unassigned.slice(0, 3).map((tv) => ({
          task: tv,
          suggestion: suggest(ev, { skill: tv.requiredSkill, dueDate: tv.dueDate, taskId: tv.id }, t0)
        }))
      };
    } else {
      const mine = open.slice().sort((a, b) => (b.flags.overdue - a.flags.overdue) || byDue(a, b));
      out.member = {
        myTasks: mine,
        completedCount: views.length - open.length,
        workload: workload(ev, user.id, t0),
        stats: {
          open: open.length,
          dueThisWeek: open.filter((t) => t.flags.daysUntilDue >= 0 && t.flags.daysUntilDue <= 7).length,
          overdue: open.filter((t) => t.flags.overdue).length
        },
        openAcrossWorkspaces: db.tasks.filter((t) => t.assigneeId === user.id && t.status !== 'done').length
      };
    }
    return out;
  });

  // GET /api/events/{id}/tasks
  route('GET', '/api/events/:id/tasks', ({ user, params }) => {
    const { ev, role } = requireEvent(user, params.id);
    const t0 = todayIso();
    return visibleTasks(ev, role, user).map((t) => taskView(t, role, user, t0)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  });

  // POST /api/events/{id}/tasks
  route('POST', '/api/events/:id/tasks', ({ user, params, body }) => {
    const { ev, role } = requireEvent(user, params.id);
    if (role !== 'coordinator') throw new HttpError(403, 'FORBIDDEN', 'Only coordinators can create tasks.');
    const f = cleanTaskFields(ev, body, false, null);
    const t = {
      id: 'T' + (++db.seq), eventId: ev.id, title: f.title, description: f.description || '',
      assigneeId: f.assigneeId || null, status: 'todo', dueDate: f.dueDate, priority: f.priority,
      requiredSkill: f.requiredSkill || null, dependsOn: f.dependsOn || []
    };
    db.tasks.push(t);
    return taskView(t, role, user, todayIso());
  }, { created: true });

  // PATCH /api/tasks/{id}
  route('PATCH', '/api/tasks/:id', ({ user, params, body }) => {
    const t = taskById(params.id);
    if (!t) throw new HttpError(404, 'NOT_FOUND', 'That task does not exist.');
    const { ev, role } = requireEvent(user, t.eventId);
    if (role === 'member') {
      if (t.assigneeId !== user.id) throw new HttpError(403, 'FORBIDDEN', 'You can only update tasks assigned to you.');
      if (Object.keys(body).some((k) => k !== 'status')) throw new HttpError(403, 'FORBIDDEN', 'Members can only change the status of their own tasks.');
    }
    const changes = cleanTaskFields(ev, body, true, t.id);
    if (changes.status === 'in_progress' || changes.status === 'done') {
      const deps = ('dependsOn' in changes ? changes.dependsOn : t.dependsOn).map(taskById).filter((d) => d && d.status !== 'done');
      if (deps.length) {
        throw new HttpError(409, 'DEPENDENCY_BLOCKED',
          `“${t.title}” can't be ${changes.status === 'done' ? 'completed' : 'started'} yet. It is waiting on: ${deps.map((d) => d.title).join(', ')}.`);
      }
    }
    Object.assign(t, changes);
    return taskView(t, role, user, todayIso());
  });

  // GET /api/events/{id}/timeline
  route('GET', '/api/events/:id/timeline', ({ user, params }) => {
    const { ev, role } = requireEvent(user, params.id);
    const t0 = todayIso();
    const items = ev.milestones.map((m) => ({ kind: 'milestone', id: m.id, title: m.title, date: m.date, daysUntil: diffDays(m.date, t0), isEventDay: m.date === ev.date }))
      .concat(visibleTasks(ev, role, user).map((t) => ({ kind: 'task', date: t.dueDate, task: taskView(t, role, user, t0) })));
    items.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'milestone' ? -1 : 1));
    return { today: t0, items };
  });

  // GET /api/events/{id}/people
  route('GET', '/api/events/:id/people', ({ user, params }) => {
    const { ev, role } = requireEvent(user, params.id);
    const t0 = todayIso();
    const people = ev.teamIds.map((uid) => {
      const u = userById(uid);
      const p = { id: u.id, name: u.name, initials: initials(u.name), skills: u.skills, clubRole: clubRole(u.id, ev.clubId), isYou: u.id === user.id };
      if (role === 'coordinator' || u.id === user.id) {
        p.workload = workload(ev, u.id, t0);
        p.tasks = db.tasks.filter((t) => t.eventId === ev.id && t.assigneeId === u.id && t.status !== 'done')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4)
          .map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate, flags: flagsFor(t, t0) }));
      }
      return p;
    });
    return {
      role, people,
      unassignedCount: role === 'coordinator' ? db.tasks.filter((t) => t.eventId === ev.id && t.status !== 'done' && !t.assigneeId).length : null,
      openAcrossWorkspaces: db.tasks.filter((t) => t.assigneeId === user.id && t.status !== 'done').length
    };
  });

  // GET /api/events/{id}/resources
  route('GET', '/api/events/:id/resources', ({ user, params }) => {
    const { ev } = requireEvent(user, params.id);
    return db.resources.filter((r) => r.eventId === ev.id).sort((a, b) => b.addedOn.localeCompare(a.addedOn))
      .map((r) => ({ id: r.id, name: r.name, category: r.category, description: r.description, url: r.url || '', addedByName: (userById(r.addedBy) || { name: 'Unknown' }).name, addedOn: r.addedOn }));
  });

  // POST /api/events/{id}/resources  (additional proposed endpoint)
  route('POST', '/api/events/:id/resources', ({ user, params, body }) => {
    const { ev, role } = requireEvent(user, params.id);
    if (role !== 'coordinator') throw new HttpError(403, 'FORBIDDEN', 'Only coordinators can add resources.');
    const name = str(body.name), description = str(body.description), url = str(body.url);
    need(name.length >= 3 && name.length <= 80, 'Resource names need 3 to 80 characters.');
    need(RESOURCE_CATEGORIES.includes(body.category), 'Choose a category.');
    need(description.length <= 300, 'Keep the description under 300 characters.');
    need(url === '' || /^https?:\/\/\S+$/i.test(url), 'Links must start with http:// or https://.');
    const r = { id: 'R' + (++db.seq), eventId: ev.id, name, category: body.category, description, url, addedBy: user.id, addedOn: todayIso() };
    db.resources.push(r);
    return { id: r.id, name, category: r.category, description, url, addedByName: user.name, addedOn: r.addedOn };
  }, { created: true });

  // GET /api/events/{id}/announcements
  route('GET', '/api/events/:id/announcements', ({ user, params }) => {
    const { ev } = requireEvent(user, params.id);
    return db.announcements.filter((a) => a.eventId === ev.id).sort((a, b) => b.postedOn.localeCompare(a.postedOn)).map(announcementView);
  });

  // GET /api/events/{id}/suggestions?skill=&dueDate=&taskId=  (coordinators only)
  route('GET', '/api/events/:id/suggestions', ({ user, params, query }) => {
    const { ev, role } = requireEvent(user, params.id);
    if (role !== 'coordinator') throw new HttpError(403, 'FORBIDDEN', 'Only coordinators can see assignment suggestions.');
    return suggest(ev, { skill: query.skill || null, dueDate: query.dueDate || null, taskId: query.taskId || null }, todayIso());
  });

  // ----------------------------------------------------------------- dispatch
  async function handle(req) {
    const lat = cfg.mockLatencyMs || [0, 0];
    await sleep(lat[0] + Math.random() * (lat[1] - lat[0]));
    try {
      const parts = req.path.split('?');
      const path = parts[0];
      const query = Object.fromEntries(new URLSearchParams(parts[1] || ''));
      let match = null, found = null;
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = path.match(r.re);
        if (m) { match = m; found = r; break; }
      }
      if (!found) throw new HttpError(404, 'NOT_FOUND', `No such endpoint: ${req.method} ${path}`);
      const params = {};
      found.keys.forEach((k, i) => { params[k] = match[i + 1]; });

      let user = null;
      if (!found.opts.public) {
        user = req.userId ? userById(req.userId) : null;
        if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in with a valid ID.');
      }
      const data = found.handler({ user, params, query, body: req.body || {} });
      if (req.method !== 'GET') saveDb();
      return { ok: true, status: found.opts.created ? 201 : 200, data: clone(data) };
    } catch (e) {
      if (e instanceof HttpError) return { ok: false, status: e.status, data: { code: e.code, message: e.message } };
      console.error('[mock-server]', e);
      return { ok: false, status: 500, data: { code: 'SERVER_ERROR', message: 'The mock backend hit an unexpected error.' } };
    }
  }

  window.ClubOSMockServer = { handle, reset: resetDb };
})();
