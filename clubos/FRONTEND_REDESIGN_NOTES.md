# ClubOS Frontend Redesign — Modern Editorial

This update redesigns the public-facing experience and applies the new warm-neutral visual system to the existing workspace.

## Changed files

- `index.html` — adds a full public landing page, feature discovery sections, role explanation, how-it-works flow, and a separate workspace sign-in screen. The existing application shell and script loading order are retained.
- `css/styles.css` — adds the ClubOS 2.0 design system and responsive styles. The existing component/view styles are retained so the current feature screens continue to render, with updated colours, typography, surfaces and navigation.
- `js/app.js` — adds navigation between the public landing page, sign-in screen and existing authenticated app. Sign-out returns to the public landing page. Removes the theme toggle because this redesign uses one consistent light visual system.

## What changed visually

- Warm ivory, charcoal, muted sage, soft sand and stone palette.
- DM Serif Display for selected editorial headings; Inter for interface text.
- New public homepage with hero, illustrative product preview, problem/solution story, feature cards, coordinator/member explanation, three-step onboarding and CTA.
- New separate workspace entry screen with demo ID shortcuts.
- Existing dashboard shell receives updated spacing, typography, borders, cards and navigation styling.
- Responsive layouts for tablet and mobile, including a compact mobile marketing navigation.

## Run locally

Open `index.html` through a local static server (recommended) or your usual frontend workflow. The current mock API setup and existing Java API configuration are unchanged.

For example:

```bash
cd clubos
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Important notes

- The dashboard feature logic and mock data were intentionally left intact.
- Marketing-page numbers and dashboard previews are illustrative sample content, not live data.
- The landing page uses CSS-built interface illustrations, so no extra image assets or build dependencies are required.
- Google Fonts are loaded remotely; system fallbacks are included if they are unavailable.

## Dashboard polish (2.1)

The authenticated workspace now has separate home experiences by role:

- **Coordinator:** operational overview with event context, readiness and attention metrics, a prioritised attention list, upcoming work, team capacity, milestones and announcements. Suggested task owners are tucked into a disclosure so they do not dominate the first screen.
- **Member:** personal home with assigned work, next task focus, due/overdue counts, team progress, milestones and announcements.
- **Navigation:** coordinators see Overview, Events, Task board, Timeline, Team and Resources. Members see My home, My tasks, Events, My team and Resources. Navigation refreshes when switching clubs/workspaces.
- **Contextual page labels:** the task and people pages now use member/coordinator language rather than one generic label.

The dashboard views continue to consume the existing API response; no mock data, permissions, backend routes or Java code were changed. Dashboard rendering was exercised against representative coordinator and member payloads, and all JavaScript files pass `node --check`. A full Chromium browser smoke test could not run in this environment because local browser navigation is blocked, so please do a quick visual pass after starting the project locally.

## Club identity and feature-page polish (November 2026)

- Replaced the generic club names with Radiance and The Thespian Circle.
- Updated demo coordinators to Raajvee Mishra (CD001) and Krish Goyal (CD002).
- Updated demo members Hitarth Jaiswal (MB001) and Atishay Jain (MB002).
- Removed the unrelated third demo club so the workspace reflects the two societies being presented.
- Refined Events, Task Board, Timeline, Team and Resources pages with shared feature-page styling, useful summaries, clearer hierarchy and responsive layouts.
- Bumped the mock-data storage key to v2 so existing browser sessions receive the updated demo seed rather than stale localStorage records. The Java backend contract and real API integration remain unchanged.

The event/task/resource records are still illustrative demo records, not a claim that these are the societies' actual current events or documents. Replace those records with verified club information before presenting them as factual.
