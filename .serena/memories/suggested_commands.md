Common project commands (run inside rootless Podman containers)

Start local demo

```bash
export PATH="/opt/podman/bin:$PATH"
podman machine start
./scripts/run-local.sh
open http://127.0.0.1:3000
```

Stop local demo

```bash
./scripts/stop-local.sh
```

Reset local demo to seeded state

```bash
./scripts/stop-local.sh
./scripts/reset-local.sh
./scripts/run-local.sh
```

Run verification

```bash
./scripts/verify-local.sh
./scripts/verify-vertical-slice.sh
```

Run Go checks

```bash
cd backend
podman run --rm -v "$(pwd):/app" -w /app golang:1.24-alpine sh -c "go mod tidy && go vet ./... && go test ./..."
```

Container logs

```bash
podman logs -f lemans-demo-app
podman logs -f lemans-demo-go
journalctl --user -u lemans-demo-app
journalctl --user -u lemans-demo-go
```

Local Git & Remote GitHub CLI (gh)

```bash
# Local commits & branch status
git status
git log --oneline -10
git commit -m "commit message"

# Remote commits & repository operations via gh CLI (HTTPS default auth)
gh auth status
gh auth setup-git
gh repo view
gh pr status
gh pr create
```
