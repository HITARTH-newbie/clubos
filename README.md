# ClubOS — Connected Frontend + Java Backend

This bundle contains both the supplied ClubOS frontend and its Spring Boot backend, configured to use the live API.

## Prerequisites
- Java JDK 21
- Apache Maven 3.9+
- Python 3 (for the static frontend server)

## Start the backend (Windows)
Open Command Prompt in `clubos-backend` and run:
```bat
mvn spring-boot:run
```
The API listens on `http://localhost:8080`.

## Start the frontend (second terminal)
Open Command Prompt in `clubos` and run:
```bat
python -m http.server 5173
```
Open `http://localhost:5173`.

The sidebar should show **Live API**. `clubos/js/config.js` is already set to `useMock: false` and `apiBaseUrl: 'http://localhost:8080'`.

## Demo logins
- `CD001` — Raajvee Mishra, Radiance coordinator
- `CD002` — Krish Goyal, The Thespian Circle coordinator
- `MB001` — Hitarth Jaiswal, member of both clubs
- `MB002` — Atishay Jain, Radiance member

## Smoke test
1. Sign in as `CD001`.
2. Open Radiance → Runway Showcase.
3. Open Overview, Task board, Timeline, Team and Resources.
4. Change a task status; refresh the view to verify the backend persisted the change while the server remains running.
5. Add a resource or create a task.
6. Sign out and sign in as `MB001`; verify the member sees member-only permissions and assigned tasks.

## Important
- The API stores data in memory. Restarting the backend resets the sample data.
- `X-ClubOS-Id` is a classroom demo identity header, not production authentication.
- This environment had Java 21 and Node available, and all 13 frontend JavaScript files passed `node --check`. Maven is not installed here, so a full Spring Boot compile/run test could not be performed in this environment. Run Maven locally to resolve dependencies and perform the end-to-end check.
- The mock server files remain in the frontend bundle but are not called because live mode is enabled.
