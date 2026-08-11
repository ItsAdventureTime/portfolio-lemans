# Completion and synchronization standard

- Every code, configuration, deployment, workflow, or user-facing change includes the matching active documentation and guides in the same change set.
- Keep current operating guidance aligned with the implementation; retain historical material only as clearly separated archive/review material.
- Before completion, validate proportionately, commit locally, synchronize GitHub using `gh`-authenticated HTTPS transport, and confirm local `main` equals remote `main`.
- Do not report work complete while documentation or local/remote synchronization is outstanding.
- Repository sources of truth: `AGENTS.md` and `docs/DOCUMENTATION-INDEX.md`.
