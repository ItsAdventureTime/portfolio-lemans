# Google Antigravity prompt: complete UI/UX revamp

Copy the prompt below into Google Antigravity from the repository root.

```text
You are taking over the Le Mans Operations & Job Cost Management System demo.
Read these files before editing anything:

1. AGENTS.md
2. docs/DOCUMENTATION-INDEX.md
3. docs/CURRENT-STATE.md
4. docs/DEMO-IMPLEMENTATION-PLAYBOOK.md
5. docs/DESIGN-SYSTEM.md
6. docs/PROJECT-SPEC.md
7. docs/UI-UX-REVAMP-HANDOFF.md
8. docs/WRITING-STYLE.md

Treat to-review-and-delete/ as historical review material only. Do not use it
as implementation authority unless the user explicitly asks you to compare it.

Goal: completely revamp the demo UI and UX, especially navigation and the visual
representation of the end-to-end workflow, while preserving the existing
business behavior and deployment contract.

Before coding:

- Inspect the current routes, API helpers, role policy, UI primitives, seeded
  records, and all navigation/detail links.
- Search current official guidance for WCAG 2.2, Next.js App Router navigation,
  loading UI, route announcements, and responsive interaction patterns.
- Write a short plan and a route/state map. Identify any ambiguous product
  behavior before changing it.

Design requirements:

- Use the canonical logo at public/lemans-service-plus-logo.jpg.
- Create a coherent shell with clear hierarchy, role-aware navigation, active
  location, breadcrumbs/context, and predictable back paths.
- Show the workflow as a reusable, accessible flow:
  Customer/vehicle → quotation → approval/conversion → job order → assignment
  and status → purchasing and supplier allocation → invoice and collection →
  costing and accounting.
- Use text, labels, timestamps, and links in the workflow visualization. Never
  communicate state with color alone.
- Constrain reading surfaces; reserve horizontal scrolling for wide tables.
- Keep primary actions obvious and secondary actions quiet.
- Implement loading, empty, error, success, and access-denied states for every
  dynamic route or mutation.
- Use next/link for internal routes. Preserve NEXT_PUBLIC_BASE_PATH for both
  /lemans/demo and /lemans. Do not hardcode a prefixed router.push path.
- Keep transitions responsive, preserve the shared shell, and honor reduced
  motion. Do not use a full-screen gray loading overlay.
- Ensure keyboard navigation, visible focus, screen-reader labels, route titles,
  status announcements, and field-level error recovery.

Non-negotiable boundaries:

- This is a no-auth demo theatre. Keep the splash, Admin default, visible role
  switcher, and simulated policy behavior. Do not add real login or sessions.
- Do not change API contracts, role policy, seeded business semantics, or
  deployment scripts unless required by a documented UI contract.
- Do not create external .env files, compose files, a second source tree, or
  SSH/scp-based deployment behavior.
- Keep Backblaze storage in bucket bridge-ph with demo prefix lemans/demo and
  production prefix lemans.
- Run all builds, tests, and local execution in rootless Podman. Do not install
  host dependencies as a workaround.
- Preserve unrelated user changes. Do not reset or delete broad workspace data.

Implementation sequence:

1. Update the active documentation and design contract if the revamp changes
   behavior or acceptance criteria.
2. Build the shell/navigation and route context model.
3. Build the reusable workflow visualization and connect it to real API data.
4. Revise list/detail/forms/mutation states module by module, starting with the
   customer → quotation → job-order path.
5. Add or update focused unit, API, and Playwright coverage for navigation,
   role switching, base paths, workflow links, loading/error states, and
   responsive accessibility.
6. Run formatting, lint, typecheck, production build, Go tests, and the E2E suite
   in disposable rootless Podman containers.
7. Review the diff for stale documentation, dead routes, hardcoded base paths,
   inaccessible controls, and inconsistent labels.

Required handoff report:

- Files changed and why.
- Route/state map before and after.
- Workflow visualization behavior and data sources.
- Accessibility and responsive checks performed.
- Tests and exact results.
- Any remaining backlog or user decisions.

Do not claim completion until the app, active docs, tests, and deployment
assumptions agree.
```
