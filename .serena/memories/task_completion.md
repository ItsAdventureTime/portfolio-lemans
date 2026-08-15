# Task completion checklist

Before marking a feature or deployment change complete:

1. Run relevant formatting, lint, typecheck, build, and tests through `jk-sbx-project exec` inside the initialized Docker Sandbox.
2. Use the active project scripts for local runtime/health verification; local containers use Docker and project-specific cleanup only.
3. For remote deployment changes, verify the target-platform image packaging path and checksum artifact; the VPS imports images and activates Quadlets without compiling or building.
4. Confirm UI/data changes preserve the four-state contract (loading, empty, error, success) and the demo's no-auth Admin/role-simulation boundary.
5. Update affected active docs and guides in the same change; keep historical material separated.
6. Commit the complete validated snapshot locally on `main` with signed `git commit -S`.
7. Configure/verify GitHub HTTPS through `gh auth setup-git --hostname github.com`, push `main`, and confirm local and remote SHAs match.
8. Inspect branch protection/unique commits and keep only required `main`; never delete `main` or unrelated user work.

Do not report completion while validation, documentation, or synchronization is outstanding.