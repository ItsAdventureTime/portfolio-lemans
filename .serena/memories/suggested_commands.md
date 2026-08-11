# Current commands

Run from repository root with `export PATH="/opt/podman/bin:$PATH"`.

- Build demo images: `./scripts/build.sh demo`
- Static/build/Go validation in disposable containers: `./scripts/verify-local.sh`
- Start local demo: `./scripts/run-local.sh`
- HTTP/topology verification: `./scripts/verify-vertical-slice.sh`
- Browser verification in disposable Playwright container: `./scripts/verify-e2e.sh`
- Stop demo runtime after validation: `./scripts/stop-local.sh`
- Reset only disposable demo data: `./scripts/reset-local.sh`

Do not run `go mod tidy` as a verification workaround; verification uses `-mod=readonly`. Do not use Compose. Remote deploy/backup/restore requires explicit authorization.