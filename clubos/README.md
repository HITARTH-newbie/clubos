# ClubOS — frontend prototype

> **Make the chaos visible.**

ClubOS is an event-production and coordination platform for college clubs (OOPS Using Java academic project). This folder is the **frontend only**: plain HTML, CSS and vanilla JavaScript. The Java (Spring Boot) backend is the primary academic deliverable; this UI talks to it through one API service file.

**Important: everything you see right now is sample data.** A clearly labelled mock backend (`js/mock-server.js`) stands in for Java. The sidebar shows a "Mock data" badge while it is active.

## Run it

No build step and no dependencies.

```bash
cd clubos
python3 -m http.server 5173      # or: npx serve .
```

Open <http://localhost:5173>. (Opening `index.html` directly also works.) The two fonts, Cormorant Garamond and Inter, load from Google Fonts; without internet the UI falls back to Georgia and the system sans-serif.

## Demo IDs

There is no registration or password. Type an ID on the entry screen, or click a chip.

| ID | Person | What they get |
|---|---|---|
| `CD001` | Raajvee Mishra | Coordinator of **Radiance**. |
| `CD002` | Krish Goyal | Coordinator of **The Thespian Circle**. |
| `MB001` | Hitarth Jaiswal | Member of **Radiance** and **The Thespian Circle**. |
| `MB002` | Atishay Jain | Member of **Radiance**. |

Other seeded people (`MB003`–`MB006`) also work as IDs.

**The prefix grants nothing.** The ID is sent to the backend (`GET /api/session/{id}`), which looks up the full ID and returns the user and role. Roles are assigned per club, and the UI follows what the backend returns. Unknown IDs show an error.

## What to try

- Sign in as `CD001` (Radiance coordinator), `CD002` (Thespian coordinator), `MB001` (Hitarth) and `MB002` (Atishay) to compare role-specific experiences.
- Switch **Club** and **Event** in the top bar. Every view reloads for that workspace.
- Task Board: change a status from the card's menu, or drag a card to another column. Try completing a task that has unfinished dependencies and the backend refuses it.
- As a coordinator: create a task (the form shows rule-based owner suggestions), edit it, create an event, add a resource.
- User menu, "Reset demo data" restores the current Radiance / Thespian sample data.

## Project layout

```
index.html            entry screen + app shell
css/styles.css        design tokens (dark "After Hours" / light "The Editorial") and all components
js/config.js          useMock flag, API base URL, login hints
js/api.js             THE API service layer: the only file screens use for data
js/mock-server.js     MOCK backend (mirrors the REST contract and Java rules)
js/seed-data.js       MOCK sample data (Radiance and The Thespian Circle)
js/ui.js              safe HTML templating, icons, modal, toasts
js/components.js      shared renderers (chips, task rows, progress, workload)
js/views/*.js         overview, events, board, timeline, people, resources
js/app.js             session, navigation, workspace switching, forms, global events
```

## What is mock, what is not

| Behaviour | Source today | Real owner |
|---|---|---|
| ID lookup and role | `mock-server.js` | Java `SessionService` |
| Which clubs/events/tasks a user may see | `mock-server.js` | Java access checks in controllers |
| Readiness percentage | `mock-server.js` `readiness()` | Java `Event` / readiness calculator |
| Workload levels | `mock-server.js` `workload()` | Java workload service |
| Assignment suggestions | `mock-server.js` `suggest()` | Java assignment suggester |
| Overdue / due-soon / dependency flags | `mock-server.js` `flagsFor()` | Java `Task` |
| Status and dependency rules (409 on blocked) | `mock-server.js` `PATCH` route | Java `TaskService` |
| Persistence | browser `localStorage` | Java collections / database |

The JavaScript only **displays** returned values. It never computes readiness, workload or suggestions, and it never decides a role. Buttons for actions a user may not perform are hidden using the `permissions` the API returns, but that is cosmetic: the backend must reject them too (the mock does, with 403).

## Connecting the Java API

1. In `js/config.js` set `useMock: false` and `apiBaseUrl` to the Spring Boot address.
2. Enable CORS for the frontend origin in Spring Boot.
3. Read the demo session header `X-ClubOS-Id` (sent on every request after login) and resolve it to a user. This is a prototype stand-in for a real token.
4. Implement these endpoints with the JSON shapes `js/mock-server.js` returns (compare each route there with its Java controller):

| Method and path | Purpose |
|---|---|
| `GET /api/session/{id}` | Resolve the ID: `{ user, role }` |
| `GET /api/meta` | Statuses, priorities, skills, resource categories |
| `GET /api/clubs` | Permitted club workspaces, each with visible events and the user's role |
| `GET /api/clubs/{clubId}/members` | Club members (coordinators only) |
| `GET /api/events?clubId=` · `POST /api/events` | List / create events |
| `GET /api/dashboard?eventId=` | Role-aware overview payload |
| `GET /api/events/{id}/tasks` · `POST …/tasks` | List / create tasks |
| `PATCH /api/tasks/{taskId}` | Edit fields or change status |
| `GET /api/events/{id}/timeline` | Milestones and deadlines |
| `GET /api/events/{id}/people` | Team, skills, workload |
| `GET /api/events/{id}/resources` · `POST …/resources` | Resource references |
| `GET /api/events/{id}/announcements` | Announcements |
| `GET /api/events/{id}/suggestions?skill=&dueDate=&taskId=` | Rule-based owner suggestions |

Endpoints beyond the brief's list (`meta`, `members`, `timeline`, `people`, `resources` POST, `announcements`, `suggestions`) are proposals. Rename them freely, then change the matching one-line method in `js/api.js`. No screen needs to change. Error responses should be `{ "code": "...", "message": "..." }` with a normal HTTP status (401, 403, 404, 409, 422); the UI shows `message` to the user.

When the real backend is on, delete `js/mock-server.js` and `js/seed-data.js` and their two `<script>` tags in `index.html`.

## Accessibility and motion

Keyboard focus is always visible, status can be changed without dragging (select menu on every card), colour is never the only signal (chips carry text), and `prefers-reduced-motion` disables transitions. Hover lift is 3 px; most transitions are 200 ms.
