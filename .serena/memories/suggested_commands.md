Common project commands (run inside rootless Podman containers)

Start local demo

```bash
podman machine start
podman compose up -d
podman exec -i lemans-demo-app sh -c "npx prisma db push && npx ts-node --compiler-options '{\"module\":\"commonjs\"}' prisma/seed.ts"
open http://127.0.0.1:3000
```

Start local prodlike

```bash
podman compose -f docker-compose.prodlike.yml up -d --build
open http://127.0.0.1:3001
```

Run verification

```bash
./scripts/verify-vertical-slice.sh
```

Run tests

```bash
podman exec -i lemans-demo-app sh -c "npx ts-node --compiler-options '{\"module\":\"commonjs\"}' src/__tests__/job-order.test.ts"
```

Type check

```bash
podman exec -i lemans-demo-app npx tsc --noEmit
```

Container logs

```bash
podman logs -f lemans-demo-app
journalctl --user -u lemans-demo-app
```

Git

```bash
git status
git log --oneline -10
```
