# Typography and opaque emphasis

Updated 2026-08-15 for the Le Mans Service Plus dashboard.

- Ordinary labels, descriptions, metadata, notes, table headers, workflow labels,
  and routine detail copy use regular weight. Medium is limited to controls or
  small semantic cues; semibold/bold remains for real headings, identifiers,
  financial values, and primary metrics.
- Shared `surface-card-muted` and `surface-card-inset` use solid background
  tokens. Workflow current/completed/upcoming state cards and labels use opaque
  semantic rectangles with borders and readable text. `StatusBadge` remains an
  opaque compact status surface.
- Do not use heavier type, all-caps, or translucent emphasis backgrounds as the
  primary visual signal. State meaning must remain available through text/icon,
  border, and background, not color or weight alone.
- Job-order stepper labels stay readable in a contained horizontal scroll region
  on narrow screens; do not truncate stage names.
- Existing `motion/react` pathname transition remains the animation boundary.
  Keep Motion restrained, preserve keyboard focus, and honor
  `prefers-reduced-motion`. SmoothUI is the visual reference for quiet borders,
  solid tints, clear grouping, and short interaction feedback; do not add a new
  animation dependency.
- See `mem:ui/motion-and-focus` for route transition, focus, dialog, and
  reduced-motion behavior. Keep `docs/DESIGN-SYSTEM.md`,
  `docs/UI-UX-REVAMP-HANDOFF.md`, and `docs/CURRENT-STATE.md` synchronized
  with further visual changes.