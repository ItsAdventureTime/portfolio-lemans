# Regression coverage

- `./scripts/verify-local.sh`: Prettier, ESLint, TypeScript, production Next build, Go generate/build/tests in disposable Podman containers.
- `./scripts/verify-vertical-slice.sh`: local page/API health and no published PostgreSQL port.
- `./scripts/verify-e2e.sh`: disposable Playwright container on `lemans-demo-net`; desktop Chromium, iPhone-sized Chromium touch, and reduced-motion profiles.
- Current E2E coverage includes splash/role simulation, error and form state, mobile target size, reduced motion, focus visibility, seeded data, accounting CSV/JSON downloads, and quote-to-payment workflow.
- Export unit tests cover deterministic CSV, BOM/escaping, and formula neutralization.