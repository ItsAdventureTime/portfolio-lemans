# Le Mans UI motion and focus

Updated: 2026-08-15

- Use the existing `motion` package through `motion/react`; do not add GSAP or anime.js for ordinary route or control feedback.
- `SmoothPageTransition` is keyed by pathname and uses a 180ms opacity plus 4px vertical settle. It has no exit phase, mode wait, artificial navigation delay, parallax, or large layout movement.
- `MotionConfig reducedMotion="user"` and `useReducedMotion` honor user preferences. CSS remains the no-JavaScript fallback, and `prefers-reduced-motion: reduce` removes non-essential motion.
- `RouteScrollReset` must not blanket-blur active controls. After a route change, focus `#main-content` only when focus was in navigation, route content, or the document body; preserve role-switcher focus.
- Dialogs such as quick-add and supplier-invoice allocation must focus the first usable control, trap Tab, dismiss on Escape, restore trigger focus, and give icon-only controls accessible names.
- Root `loading.tsx` uses a quiet, layout-preserving skeleton. Keep mutation busy states local; never add an artificial navigation delay or blocking full-screen spinner.
- Keep implementation and validation notes synchronized with `docs/DESIGN-SYSTEM.md`, `docs/UI-UX-REVAMP-HANDOFF.md`, and `docs/CURRENT-STATE.md`.
