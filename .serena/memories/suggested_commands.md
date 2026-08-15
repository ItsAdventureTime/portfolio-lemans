# Current commands

Run from the repository root. Use the initialized project Docker Sandbox; do not export Podman paths.

- Prepare/resume Sandbox: `jk-sbx-project ensure`
- Build demo images: `jk-sbx-project exec -- ./scripts/build.sh demo`
- Build production images: `jk-sbx-project exec -- ./scripts/build.sh prod`
- Package the remote demo bundle: `jk-sbx-project exec -- ./scripts/build-local-artifacts.sh demo`
- Static/build/Go validation: `jk-sbx-project exec -- ./scripts/verify-local.sh`
- Start local demo: `jk-sbx-project publish 3000` then `jk-sbx-project exec -- ./scripts/run-local.sh`
- HTTP/topology verification: `jk-sbx-project exec -- ./scripts/verify-vertical-slice.sh`
- Browser verification: `jk-sbx-project exec -- ./scripts/verify-e2e.sh`
- Stop demo runtime after validation: `jk-sbx-project exec -- ./scripts/stop-local.sh`
- Reset only project demo data: `jk-sbx-project exec -- ./scripts/reset-local.sh`

Do not run `go mod tidy` as a verification workaround; verification uses `-mod=readonly`. Do not use Compose. Remote deploy/backup/restore requires explicit authorization.