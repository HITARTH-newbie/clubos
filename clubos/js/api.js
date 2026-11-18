/**
 * ClubOS API service layer — the ONLY file the screens use to get or change data.
 *
 * Every method maps to one REST endpoint. In mock mode the request is answered
 * by js/mock-server.js; in live mode it goes to the Java backend via fetch().
 * Screens never know the difference.
 *
 * Demo session: after the backend resolves an ID, the same ID is sent on every
 * request in the `X-ClubOS-Id` header. This is a prototype stand-in for a real
 * session token, and the backend must check permissions on every call.
 */
(function () {
  'use strict';

  const cfg = window.CLUBOS_CONFIG;

  class ApiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
  }

  let sessionId = null;

  async function request(method, path, body) {
    let res;
    if (cfg.useMock) {
      res = await window.ClubOSMockServer.handle({ method, path, body, userId: sessionId });
    } else {
      try {
        const r = await fetch(cfg.apiBaseUrl + path, {
          method,
          headers: { 'Content-Type': 'application/json', 'X-ClubOS-Id': sessionId || '' },
          body: body === undefined ? undefined : JSON.stringify(body)
        });
        const data = await r.json().catch(() => ({}));
        res = { ok: r.ok, status: r.status, data };
      } catch (e) {
        throw new ApiError(0, 'NETWORK', 'Could not reach the ClubOS server. Is the Java backend running?');
      }
    }
    if (!res.ok) throw new ApiError(res.status, res.data && res.data.code, (res.data && res.data.message) || 'Something went wrong.');
    return res.data;
  }

  const qs = (obj) => {
    const p = new URLSearchParams();
    Object.keys(obj).forEach((k) => { if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') p.set(k, obj[k]); });
    const s = p.toString();
    return s ? '?' + s : '';
  };
  const enc = encodeURIComponent;

  window.ClubOSApi = {
    ApiError,
    mode: cfg.useMock ? 'mock' : 'live',

    setSession(id) { sessionId = id; },
    clearSession() { sessionId = null; },

    // GET /api/session/{id}
    getSession: (id) => request('GET', `/api/session/${enc(id)}`),
    // GET /api/meta   (statuses, priorities, skills, resource categories)
    getMeta: () => request('GET', '/api/meta'),
    // GET /api/clubs
    getClubs: () => request('GET', '/api/clubs'),
    // GET /api/clubs/{clubId}/members
    getClubMembers: (clubId) => request('GET', `/api/clubs/${enc(clubId)}/members`),
    // GET /api/events
    getEvents: (clubId) => request('GET', '/api/events' + qs({ clubId })),
    // POST /api/events
    createEvent: (payload) => request('POST', '/api/events', payload),
    // GET /api/dashboard
    getDashboard: (eventId) => request('GET', '/api/dashboard' + qs({ eventId })),
    // GET /api/events/{eventId}/tasks
    getTasks: (eventId) => request('GET', `/api/events/${enc(eventId)}/tasks`),
    // POST /api/events/{eventId}/tasks
    createTask: (eventId, payload) => request('POST', `/api/events/${enc(eventId)}/tasks`, payload),
    // PATCH /api/tasks/{taskId}
    updateTask: (taskId, changes) => request('PATCH', `/api/tasks/${enc(taskId)}`, changes),
    // GET /api/events/{eventId}/timeline
    getTimeline: (eventId) => request('GET', `/api/events/${enc(eventId)}/timeline`),
    // GET /api/events/{eventId}/people
    getPeople: (eventId) => request('GET', `/api/events/${enc(eventId)}/people`),
    // GET /api/events/{eventId}/resources
    getResources: (eventId) => request('GET', `/api/events/${enc(eventId)}/resources`),
    // POST /api/events/{eventId}/resources
    createResource: (eventId, payload) => request('POST', `/api/events/${enc(eventId)}/resources`, payload),
    // GET /api/events/{eventId}/announcements
    getAnnouncements: (eventId) => request('GET', `/api/events/${enc(eventId)}/announcements`),
    // GET /api/events/{eventId}/suggestions
    getSuggestions: (eventId, opts) => request('GET', `/api/events/${enc(eventId)}/suggestions` + qs(opts || {})),

    // Mock-only helper (does nothing in live mode).
    resetMockData() { if (cfg.useMock) window.ClubOSMockServer.reset(); }
  };
})();
