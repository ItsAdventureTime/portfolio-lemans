# UI typography

- Ordinary UI copy uses the calmer 500 weight: labels, descriptions, table headers, metadata, badges, navigation, and action labels.
- Use semantic heading elements for 600-weight section/page hierarchy. Reserve 700 display weight for page titles and primary dashboard metrics.
- Monospace or tabular identifiers and financial values may use 600 when data scanning benefits from emphasis; do not apply heavy weight to explanatory copy.
- Detail views use 14–16px medium labels/body copy and 14px metadata, with `surface-card-muted` or `surface-card-inset` grouping instead of bold or all-caps emphasis.
- Shared `DataTable` uses 16px body text and 14px medium headers; keep identifiers and amounts aligned with stable columns and tabular numerals.
- The shared CSS utility baseline maps `.font-semibold` to 500, with headings and monospace/tabular values opting into 600; `.font-bold` remains 600 for legacy heading utilities.
- Motion stays short and compositor-friendly (opacity/transform/color); honor `prefers-reduced-motion` and never make animation required for task completion.
- Keep typography and motion rules synchronized with `docs/DESIGN-SYSTEM.md` and `docs/UI-UX-REVAMP-HANDOFF.md`.
