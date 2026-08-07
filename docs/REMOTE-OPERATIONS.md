# Remote Operations Guide

## Environments

| Environment       | Quadlet Path                                         | App Port         | DB Volume                    | Image                                 |
| ----------------- | ---------------------------------------------------- | ---------------- | ---------------------------- | ------------------------------------- |
| Remote demo       | `~/.config/containers/systemd/bridge-ph/lemans-demo` | `127.0.0.1:3002` | `lemans-remote-demo-db-data` | `lemans-bridge-dashboard:latest-slim` |
| Remote production | `~/.config/containers/systemd/bridge-ph/lemans`      | `127.0.0.1:3003` | `lemans-remote-prod-db-data` | `lemans-bridge-dashboard:lts-slim`    |

## Required Secrets

Copy the Quadlet files to the target systemd user directory, then create
`/etc/containers/systemd/bridge-ph/lemans-demo/lemans-demo.secrets` (or use
`EnvironmentFile=` referencing a file owned by root and mode `0600`):

```
BETTER_AUTH_SECRET=<strong random secret>
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_ACCESS_KEY_ID=<Backblaze key ID>
B2_SECRET_ACCESS_KEY=<Backblaze key secret>
```

Update the container Quadlet to reference the secret file:

```ini
EnvironmentFile=%h/.config/containers/systemd/bridge-ph/lemans-demo/lemans-demo.env
```

## Installation Procedure

1. Build and push the multi-arch image:
   ```bash
   ./scripts/build-multiarch.sh demo
   ./scripts/build-multiarch.sh prod
   ```
2. On the remote host, install Quadlets:
   ```bash
   mkdir -p ~/.config/containers/systemd/bridge-ph/lemans-demo
   cp quadlet/remote-demo/* ~/.config/containers/systemd/bridge-ph/lemans-demo/
   # create .env file with secrets
   systemctl --user daemon-reload
   systemctl --user start lemans-remote-demo-app
   ```
3. Run health checks:
   ```bash
   curl -I http://127.0.0.1:3002/
   curl -I http://127.0.0.1:3002/login
   ```
4. Push database schema and seed:
   ```bash
   podman exec lemans-remote-demo-app sh -c \
     "npx prisma db push --accept-data-loss && npx prisma db seed"
   ```

## Backup Procedure

```bash
podman exec lemans-remote-prod-db pg_dump -U postgres lemans_remote_prod_db \
  > lemans-prod-backup-$(date +%F).sql
```

Store backups off-host in the configured Backblaze B2 bucket under `backups/`.

## Restore Procedure

1. Stop the app container.
2. Recreate the database volume (or use a new volume).
3. Restore:
   ```bash
   podman exec -i lemans-remote-prod-db psql -U postgres -d lemans_remote_prod_db \
     < lemans-prod-backup-YYYY-MM-DD.sql
   ```
4. Restart app and run health checks.

## Rollback Procedure

1. Re-tag the previous known-good digest on the registry:
   ```bash
   podman pull lemans-bridge-dashboard:lts-slim-previous
   podman tag lemans-bridge-dashboard:lts-slim-previous lemans-bridge-dashboard:lts-slim
   ```
2. Restart the production container:
   ```bash
   systemctl --user restart lemans-remote-prod-app
   ```
3. Verify `http://127.0.0.1:3003/` returns `200 OK`.

## Health Checks

Use the same checks as `scripts/verify-vertical-slice.sh`. For remote environments
authenticate via `/api/auth/sign-in/email` with the deployed admin credentials.

## Notes

- Do not commit secrets to source control.
- Keep remote demo and production databases and buckets isolated.
- The production Quadlet drops all capabilities and sets `NoNewPrivileges=true`.
- DNS and reverse proxy configuration are out of scope; only the upstream proxy
  should bind public ports.
