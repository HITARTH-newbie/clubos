/**
 * ClubOS frontend configuration.
 *
 * To connect the Java (Spring Boot) backend:
 *   1. Set useMock to false.
 *   2. Set apiBaseUrl to where the backend runs (for example http://localhost:8080).
 *   3. Make sure the Spring Boot app allows this origin (CORS) and accepts the
 *      demo session header `X-ClubOS-Id` (see README.md, "Connecting the Java API").
 *
 * Nothing else in the UI needs to change: every screen talks to js/api.js only.
 */
window.CLUBOS_CONFIG = {
  useMock: false,
  apiBaseUrl: 'https://clubos-1.onrender.com',
  // Simulated network delay for the mock backend (min, max) in milliseconds.
  mockLatencyMs: [90, 240],

  // Login-screen hints only. These do NOT decide anyone's role: the backend
  // looks up the full ID and returns the real user and permissions.
  demoIdHints: [
    { id: 'CD001', label: 'Coordinator' },
    { id: 'CD002', label: 'Coordinator' },
    { id: 'MB001', label: 'Member' },
    { id: 'MB002', label: 'Member' }
  ]
};
