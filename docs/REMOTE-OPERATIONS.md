# Remote Operations Guide

> **Use this guide with the [remote demo deployment playbook](./REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md).** Remote operations require explicit authorization and have not been exercised from this workspace. The current Quadlets use `lemans-demo-*` and `lemans-prod-*` container and network names.

## Environments

| Environment       | Quadlet Path                                         | Web Port         | Go API Container | DB Volume             | Web Image                                              | Go Image                                                 |
| ----------------- | ---------------------------------------------------- | ---------------- | ---------------- | --------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| Remote demo       | `~/.config/containers/systemd/bridge-ph/lemans-demo` | `127.0.0.1:3002` | `lemans-demo-go` | `lemans-demo-db-data` | `localhost/lemans-bridge-dashboard:demo-web` | `localhost/lemans-bridge-dashboard-go:demo-go` |
| Remote production | `~/.config/containers/systemd/bridge-ph/lemans`      | `127.0.0.1:3003` | `lemans-prod-go` | `lemans-prod-db-data` | `localhost/lemans-bridge-dashboard:prod-web` | `localhost/lemans-bridge-dashboard-go:prod-go` |

## Caddy Integration

An existing rootless Caddy Quadlet already handles public HTTP/HTTPS traffic. Its
file is named `caddy.network`, while its `[Network] NetworkName=caddy` creates
the actual Podman network named `caddy`. Each Le Mans web container retains
`Network=caddy.network` so Quadlet creates the correct service dependency. The
deployment check uses the actual Podman network name, `caddy`. The Go API
container is attached only to the internal app network and is not reachable from
Caddy.

- Remote demo web container networks: `caddy.network` + `lemans-demo-net`
- Remote production web container networks: `caddy.network` + `lemans-prod-net`

The web container is reachable by Caddy via its container name on the shared
`caddy` Podman network. The web port (`127.0.0.1:3002/3003`) is only published
for direct loopback health checks.

### `delegateops.business` demo route

The tracked route fragment is
[`caddy/lemans-demo.handlers.Caddyfile`](../caddy/lemans-demo.handlers.Caddyfile).
The remote demo deploy installs it into the existing Caddy configuration
directory, adds its import immediately before the DelegateOps static fallback,
formats both Caddyfile inputs, validates the complete configuration, and then
performs a graceful Caddy reload. Existing Caddy mounts and unrelated app
routes remain untouched. The Caddy Quadlet is expected at
`/home/jk/.config/containers/systemd/caddy/`, with its configuration and data
under `/home/jk/caddy/`; if a newly added `:Z`-mounted file is unreadable, the
activation script restarts `caddy.service` once to reapply the mount label.

```caddy
delegateops.business {
    @lemans_demo_root path /lemans/demo
    redir @lemans_demo_root /lemans/demo/ 308

    # Place this handle block before the static-site fallback. Do not use
    # handle_path: Next.js was built with /lemans/demo as its base path.
    handle /lemans/demo/* {
        header {
            >Cache-Control "public, max-age=0, must-revalidate"
        }

        reverse_proxy lemans-demo-app:3000
    }
}
```

The deployment script adds this block to the supplied `delegateops.business`
site before its final unmatched `handle` fallback. Do not add the demo internal
network to `caddy.container`: the existing `Network=caddy.network` is the
correct shared edge attachment, and the web container is the only Le Mans
container that joins it. Because the bridge containers join the `caddy` Podman
network through the `caddy.network` Quadlet reference, Caddy can resolve
`lemans-demo-app` directly.

```bash
# Manual validation/reload path when the tracked fragment and import already exist.
# If either is missing, rerun ./scripts/deploy-remote-demo.sh so the script can
# install the fragment and create the fixed Caddyfile backup before reloading.
formatted_caddyfile="$(mktemp)"
podman exec --user 0 caddy caddy fmt /etc/caddy/Caddyfile > "$formatted_caddyfile"
install -m 0644 "$formatted_caddyfile" /home/jk/caddy/conf/Caddyfile
rm -f "$formatted_caddyfile"
podman exec --user 0 caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
podman exec --user 0 caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

## Required Secrets

The activation script writes runtime `Environment=` entries in the profile Go
API Quadlet and creates a profile-specific Podman database secret. On macOS, run
the one-time configuration
helper to store the remote settings and Backblaze B2 credentials in the login
Keychain. Later deployments load those values automatically and do not prompt
for deployment variables or B2 credentials.

```bash
./scripts/configure-remote-demo.sh
# Later deployments:
./scripts/deploy-remote-demo.sh
```

The helper stores no plaintext credentials in the repository or a local config
file. It stores the remote host, user, public URL, Caddy network name, B2 access
key ID, and B2 secret in profile-specific Keychain items. Explicit environment
variables still take precedence, which keeps the scripts usable in non-macOS or
automated environments.

The deployment writes current `Environment=` entries directly into the
profile's Go API `.container` file. The active file contains values such as:

```ini
Environment=DATABASE_URL=postgresql://postgres:<generated>@lemans-demo-db:5432/lemans_demo_db
Environment=B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
Environment=B2_REGION=us-west-004
Environment=B2_ACCESS_KEY_ID=<Backblaze key ID>
Environment=B2_SECRET_ACCESS_KEY=<Backblaze key secret>
Environment=B2_BUCKET_NAME=lemans-demo-attachments
```

The runtime `.container` file is mode `600`. No external `lemans-demo.env` or
`lemans.env` file is created; the deployment removes those legacy files from
the active Quadlet directory and current deployment directory. Demo uses
`lemans_demo_db_password`; production uses `lemans_prod_db_password`. These
names are profile-scoped to avoid collisions with unrelated containers. If an
older profile still references the legacy `db_password` secret, activation
migrates its value to the profile-specific name without deleting the legacy
secret, which may belong to another application.

## Remote Demo Deployment

```bash
# One-time setup on macOS. Values are saved in the login Keychain.
./scripts/configure-remote-demo.sh

# Later deployments require no exported deployment variables.
./scripts/deploy-remote-demo.sh
```

This will:

1. Stage the clean committed source in a temporary local directory; it does not
   build or execute the application on the workstation and creates no transfer
   archive.
2. Transfer the source tree with resumable `rsync --partial --delete` over SSH;
   do not use `scp`. The temporary tree is removed when the sync command exits.
3. Build stable profile-tagged web and Go API images on the VPS with rootless Podman.
4. Run disposable `podman run --rm` image smoke checks on the VPS.
5. Sync the current source and tracked Quadlets/scripts to
   `~/.config/containers/systemd/bridge-ph/lemans-demo`.
6. Install native timer units in `~/.config/systemd/user`, reload the user
   manager, and confirm every required unit is loaded before activation.
7. Create the managed internal network and database volume, then start the DB,
   Go API, and web systemd services.
8. Seed the database (demo only) and start the rootless user-level 30-minute
   reset timer.
9. Confirm the configured public HTTPS URL returns `200 OK`. This makes a
   missing or prefix-stripping Caddy route a deployment failure rather than a
false success.

For an operator-controlled deployment, run `./scripts/sync-remote-demo.sh`, log
in to the VPS, and run the one activation command printed by the script. It is
just `cd /home/jk/bridge-ph/lemans-demo/current &&
./scripts/activate-remote-demo.sh`; the synced source marker and profile
defaults supply the remaining values. The existing
`./scripts/deploy-remote-demo.sh` wrapper performs both stages over one SSH
control connection.

The Caddy Quadlet must already have created its `caddy` Podman network. Le Mans
containers continue to reference `caddy.network` by filename. The tracked
`.network` and `.volume` files create the internal network and database volume
before PostgreSQL starts. If a service fails, the deployment script prints its
complete status and current-boot journal. Set `CADDY_NETWORK_NAME` only when the
shared Caddy Quadlet uses a different `NetworkName`. `REMOTE_PATH` and
`QUADLET_PATH` remain optional profile-specific overrides; when omitted, the
script selects the correct demo or production defaults.

## Remote Production Deployment

```bash
# One-time setup on macOS.
./scripts/configure-remote-prod.sh

# Later deployments require no exported deployment variables.
./scripts/deploy-remote-prod.sh

# For non-macOS or automation, provide values as environment variables instead.
export REMOTE_HOST=<vps-host-or-ip>
# Set PUBLIC_URL to the production HTTPS URL when it differs from REMOTE_HOST.
export PUBLIC_URL=https://<production-public-host>/lemans
export REMOTE_USER=jk
export B2_ACCESS_KEY_ID=<your-b2-key-id>
export B2_SECRET_ACCESS_KEY=<your-b2-key-secret>
./scripts/deploy-remote-prod.sh
```

Production follows the same remote-build flow but **does not seed the database**
and starts a **daily B2 backup timer** instead of a reset timer.

## Demo Role Simulation

The demo seed creates fictional data for six roles. The demo has no real login
or user credentials; its simulated entry action is `Enter as an Admin`. Use the
**Role Switcher** in the UI to switch between Admin, General Manager,
Sales Advisor, Service Advisor, Purchasing, and DCS. The active role is stored
in a `lemans-demo-role` cookie, passed to the Next.js API routes and then to
the Go API via the `X-Demo-Role` header for server-side action validation.

## Remote Demo Reset

The remote demo deploy installs two reset paths:

1. **Scheduled**: rootless user-level `lemans-demo-reset.service` + `lemans-demo-reset.timer`
   (every 30 minutes) defined by tracked Quadlet files in `quadlet/remote-demo/`.
2. **Manual**:
   ```bash
   ssh jk@vps.example.com
   export PATH="/opt/podman/bin:$PATH"
   /home/jk/bridge-ph/lemans-demo/reset-demo.sh
   ```

The reset script stops web + Go API + DB services, recreates the DB volume,
restarts services, calls `POST /admin/seed` on the Go API, and deletes uploaded
attachments from the demo B2 bucket. The same reset implementation is baked
into the Go API image at `/usr/local/bin/reset-demo.sh`.

## Backup Procedure (Production)

The production deployment installs `lemans-backup.service` and `lemans-backup.timer`, which runs daily:

```bash
# Runs automatically, or manually:
export PATH="/opt/podman/bin:$PATH"
/home/jk/bridge-ph/lemans/backup-prod.sh
```

The script dumps `lemans_prod_db` with `pg_dump`, gzips it, and uploads it to `s3://lemans-prod-attachments/backups/db/` using the B2 CLI.

## Restore Procedure

1. Stop the app container:
   ```bash
   systemctl --user stop lemans-prod-app
   ```
2. Recreate the database volume or use a new volume.
3. Download the desired backup from Backblaze B2:
   ```bash
   b2 download-file-by-name lemans-prod-attachments backups/db/lemans-prod-backup-YYYY-MM-DD-HHMMSS.sql.gz /tmp/restore.sql.gz
   gunzip /tmp/restore.sql.gz
   ```
4. Restore:
   ```bash
   podman exec -i lemans-prod-db psql -U postgres -d lemans_prod_db < /tmp/restore.sql
   ```
5. Restart the app and run health checks.

## Rollback Procedure

1. Restore the previous known-good source commit by rerunning the sync and
   activation commands for that commit. Stable image tags are replaced by the
   activation, so the stable `current` path is all that is required.
2. If only the proxy changed, restore `/home/jk/caddy/conf/Caddyfile.bak`, then
   validate and gracefully reload Caddy:
   ```bash
   install -m 0644 /home/jk/caddy/conf/Caddyfile.bak /home/jk/caddy/conf/Caddyfile
   podman exec --user 0 caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
   podman exec --user 0 caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
   ```
3. Verify the profile loopback URL returns `200 OK`.

## Health Checks

For remote environments, verify the Go API and web endpoints on the loopback
ports:

```bash
curl -sL -o /dev/null -w '%{http_code}' http://127.0.0.1:3002/lemans/demo
podman exec lemans-demo-go curl -s http://127.0.0.1:8080/health
```

## Role-Based Navigation & 403 Access Restricted

The navigation bar filters menu items by the active user's role permissions (`src/components/Navbar.tsx`). Users will only see modules they have permission to access.

If a user without permission manually navigates to a restricted URL (e.g. a `ROLE-GM` user accessing `/accounting`), the application renders an explicit **403 Access Restricted** page (`src/components/AccessDenied.tsx`) with a **Return to Overview** button instead of silently redirecting.

## Notes

- Do not commit secrets to source control.
- Do not create external remote `.env` files. The deployment writes runtime
  values into mode-`600` Quadlet `Environment=` entries in the active Go API
  `.container` file.
- Keep remote demo and production databases and buckets isolated.
- DNS and reverse proxy configuration are managed by the existing Caddy quadlet; only Caddy binds public ports.
- Use `node:lts-alpine`, `golang:alpine`, and `postgres:alpine` for all images unless dependency compatibility explicitly requires a Debian-based image.
- All deployment containers and temporary build containers are `--rm` or explicitly removed.

## Official Guidance

- [Podman Quadlet rootless units](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Podman Quadlet basic usage](https://docs.podman.io/en/latest/markdown/podman-quadlet-basic-usage.7.html)
- [systemd `loginctl` linger](https://www.freedesktop.org/software/systemd/man/252/loginctl.html)
- [Next.js 16 self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Caddy command line (`fmt`, `validate`, and `reload`)](https://caddyserver.com/docs/command-line)
- [Caddy graceful reload guidance](https://caddyserver.com/docs/getting-started)
- [goose migrations](https://github.com/pressly/goose)
- [sqlc documentation](https://docs.sqlc.dev)
