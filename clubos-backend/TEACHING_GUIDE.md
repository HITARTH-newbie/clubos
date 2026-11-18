# ClubOS Backend — Teaching Guide

We'll learn the backend by following the request path rather than memorising files.

## 1. What happens when the dashboard loads?

The browser sends `GET /api/dashboard?eventId=E1` and includes `X-ClubOS-Id: CD001`.

1. `ClubOsController.dashboard()` receives the HTTP request.
2. The controller extracts the caller ID and passes it to `ClubOsService`.
3. The service resolves the ID to a `User`, finds the `Event`, and checks club membership.
4. The service calculates readiness, workload, visible tasks and attention flags.
5. Spring/Jackson converts the returned Java maps/lists into JSON.
6. The frontend renders that JSON. It should not calculate business rules itself.

## 2. OOP concepts used

- **Abstraction:** `User` is abstract; we never instantiate a generic user.
- **Inheritance:** `Member` and `Coordinator` extend `User`.
- **Polymorphism:** calling `getRole()` on a `User` reference returns the subclass's role.
- **Encapsulation:** `Task` fields are private. Changes happen through `assignTo`, `update`, and `setStatus`.
- **Composition:** `Event` stores team IDs and task IDs; a task stores prerequisite task IDs.
- **Collections:** `LinkedHashMap` gives fast ID lookup while retaining insertion order; `List` and `Set` represent ordered data and unique memberships/dependencies.

## 3. Spring annotations

- `@SpringBootApplication`: starts component scanning and application configuration.
- `@RestController`: marks a class as an HTTP controller whose return values become response bodies.
- `@RequestMapping`: common URL prefix.
- `@GetMapping`, `@PostMapping`, `@PatchMapping`: bind HTTP methods and paths to Java methods.
- `@Service`: registers business logic as a Spring-managed object.
- `@Component`: registers the in-memory store.
- `@RestControllerAdvice`: centralises exception-to-HTTP-response conversion.
- `@Bean` / `@Configuration`: registers CORS configuration.

## 4. Core business rules

### Task priority and workload
LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4. A member's active workload is the sum of priority weights of their unfinished tasks for the event.

### Readiness
The supplied frontend mock uses priority-weighted readiness:
`completed priority weight / total priority weight * 100`.
This backend matches that mock so the real UI does not change its meaning.

### Dependencies
A task cannot depend on itself or create a cycle. Completing a task is rejected with HTTP 409 if any prerequisite is unfinished.

### Permissions
Roles are stored on each club membership, not inferred from an ID prefix. Coordinators can manage their club's event data; members can access events they are assigned to and update their own task status.

## 5. Suggested teaching sequence

1. Open `ClubOsApplication.java`. Explain what `main()` does and why Spring starts the app.
2. Open `User.java`, `Member.java`, `Coordinator.java`. Draw the inheritance tree and explain dynamic dispatch.
3. Open `Task.java`. Trace how private fields plus methods protect state.
4. Open `ClubOsStore.java`. Explain maps as an in-memory repository.
5. Open `ClubOsService.java` and trace `dashboard()` from controller to response.
6. Test `GET /api/session/MB001`, then compare coordinator and member club results.
7. Try a task status PATCH that is blocked by dependencies and inspect the 409 JSON.
8. Switch the frontend to live mode and compare the real UI with mock mode.

## 6. Test calls

```bash
# Login lookup (public)
curl http://localhost:8080/api/session/MB001

# Coordinator club list
curl -H "X-ClubOS-Id: CD001" http://localhost:8080/api/clubs

# Member club list
curl -H "X-ClubOS-Id: MB001" http://localhost:8080/api/clubs

# Event dashboard
curl -H "X-ClubOS-Id: CD001" "http://localhost:8080/api/dashboard?eventId=E1"

# Event task board
curl -H "X-ClubOS-Id: CD001" http://localhost:8080/api/events/E1/tasks

# Try to finish T8 before T7; expected HTTP 409
curl -X PATCH -H "Content-Type: application/json" -H "X-ClubOS-Id: CD001" \
  -d '{"status":"done"}' http://localhost:8080/api/tasks/T8
```

## 7. Known prototype limitations to explain honestly

- The store is in-memory, so changes disappear when the server restarts.
- `X-ClubOS-Id` is a demo identity header, not secure authentication.
- Data transfer objects are represented as maps in this first teaching version to make the JSON contract visible. A next refactor can introduce typed request/response DTO records.
- There is no database or repository interface yet; the brief recommends starting in-memory and adding persistence later.
- Sample events are seeded to match the supplied frontend's demo IDs and stories.
