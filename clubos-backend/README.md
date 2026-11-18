# ClubOS Backend — Java + Spring Boot

This is a working first backend implementation for the supplied ClubOS frontend and backend brief.

## Requirements
- JDK 21
- Maven 3.9+
- VS Code with Extension Pack for Java, or IntelliJ IDEA

## Run
```bash
mvn spring-boot:run
```
Server: `http://localhost:8080`

Try:
```bash
curl http://localhost:8080/api/session/MB001
curl -H "X-ClubOS-Id: CD001" http://localhost:8080/api/clubs
curl -H "X-ClubOS-Id: CD001" "http://localhost:8080/api/events?clubId=C1"
curl -H "X-ClubOS-Id: CD001" "http://localhost:8080/api/dashboard?eventId=E1"
```

Demo IDs:
- CD001 — Raajvee Mishra, Radiance coordinator
- CD002 — Krish Goyal, Thespian Circle coordinator
- MB001 — Hitarth Jaiswal, member of both clubs
- MB002 — Atishay Jain, Radiance member
- MB003–MB006 — other seeded members

## Connect the supplied frontend
1. Extract `ClubOS_Actual_Clubs_Feature_Polish.zip`.
2. In `clubos/js/config.js`, change `useMock: true` to `useMock: false`.
3. Keep `apiBaseUrl: 'http://localhost:8080'`.
4. Start this backend, then serve the frontend from its folder:
   `python -m http.server 5173`
5. Open `http://localhost:5173`.

The API accepts `X-ClubOS-Id` on protected calls. This is a classroom-demo session mechanism, not production authentication.

## API endpoints implemented
- GET `/api/session/{id}`
- GET `/api/meta`
- GET `/api/clubs`
- POST `/api/clubs`
- GET `/api/clubs/{id}/members`
- POST `/api/clubs/{id}/members`
- GET/POST `/api/events`
- GET `/api/dashboard?eventId=`
- GET/POST `/api/events/{id}/tasks`
- PATCH `/api/tasks/{id}`
- GET `/api/members/{memberId}/workload?eventId=`
- GET `/api/events/{id}/timeline`
- GET `/api/events/{id}/people`
- GET/POST `/api/events/{id}/resources`
- GET `/api/events/{id}/announcements`
- GET `/api/events/{id}/suggestions?skill=&dueDate=&taskId=`
- POST `/api/users`

## Important design notes
- Domain classes encapsulate their state. `Task` exposes methods to assign, update and change status.
- `User` is abstract; `Member` and `Coordinator` override `getRole()`.
- Membership role is per club, matching the actual frontend's multi-club design.
- Business rules live in the service/domain layer, not in JavaScript.
- In-memory maps are used initially. Data resets when the Java process restarts.
- Errors are returned as `{ "code": "...", "message": "..." }`.
- Event readiness currently uses the frontend's priority-weighted calculation so the live UI displays the same metric.
- The supplied PDF recommends plain task-progress readiness in one section, while the supplied frontend mock uses priority-weighted readiness. This implementation intentionally matches the real frontend mock.

## Scope / next steps
This is a classroom prototype foundation, not production auth or database persistence. Add repository interfaces + persistent storage after the end-to-end frontend flow is verified. The brief's separate ID-creation flow is included; public coordinator registration is retained for demo convenience and should be restricted before real deployment.

## Integrated frontend bundle
The frontend in the parent `clubos/` folder has already been configured for live mode (`useMock: false`) and the New Event form now sends the required event type.
Run the backend in one terminal, then in a second terminal:
```bash
cd clubos
python -m http.server 5173
```
Open `http://localhost:5173`. The sidebar should show **Live API**.
