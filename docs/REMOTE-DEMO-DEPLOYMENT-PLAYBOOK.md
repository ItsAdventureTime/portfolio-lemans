# Remote Demo Deployment Playbook

- **Status**: Authoritative for the remote demo deployment profile
- **Version**: 1.10.0
- **Updated**: 2026-08-16
- **Target URL**: `https://delegateops.business/demo/lemans`
- **Remote user**: `jk`
- **Current evidence**: Local image/runtime verification is complete; remote
  deployment has not been exercised and remains authorization-gated.

This playbook defines the remote-only deployment model for the demo. It replaces
older instructions for persistent local deployments, login credentials,
host-based standalone-output sync, or a sleeping Caddy bridge.

## 1. Deployment policy

The demo is deployed remotely only. There is no persistent local deployment
target.

GitHub and VPS transport are separate concerns. Use local `git` for the local
commit, and use the official `gh` HTTPS credential path for GitHub operations.
The SSH references in this playbook are only for the explicitly authorized VPS
source transfer and activation; they must never be used as GitHub transport.

The workstation uses the initialized project Docker Sandbox to build, compile,
test, and package the application. The deployment wrapper creates a temporary
`HEAD` source tree and an ephemeral `docker save` image bundle, then transfers
both with resumable `rsync` over SSH. The image bundle is checksum-verified on
the VPS and removed from the local workspace after the wrapper exits. Do not
use `scp` for deployment transfers. Local Podman is not required.

The VPS is the runtime activation environment, not the build environment. It
uses rootless `podman load` to import the locally built images, installs the
existing rootless Quadlets, starts the persistent runtime, and performs
deployment health checks. It does not run `podman build`, application
compilation, or image smoke tests.

The remote demo is a rootless Podman Quadlet deployment managed by the `jk`
user's systemd user manager.

## 2. Remote locations

| Purpose                                   | Required location                                           |
| ----------------------------------------- | ----------------------------------------------------------- |
| Quadlet units and drop-ins                | `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo` |
| Demo runtime data/config/database/backups | `/home/jk/bridge-ph/lemans-demo`                            |
| Public URL                                | `https://delegateops.business/demo/lemans`                  |
| Remote app service                        | `lemans-demo.service`                                       |
| Remote Go API service                     | `lemans-demo-go.service`                                    |
| Remote database service                   | `lemans-demo-db.service`                                    |
| Internal app/database network             | `lemans-demo-net`                                           |
| Caddy Quadlet reference / Podman network  | `caddy.network` / `caddy`                                   |

The path under `/home/jk/bridge-ph/lemans-demo` must be subdivided and permission
controlled, for example:

```text
/home/jk/bridge-ph/lemans-demo/
├── config/       # mode and non-secret runtime configuration
├── data/         # persistent demo data and database bind data if used
├── uploads/      # demo attachment objects
├── backups/      # optional demo backups
├── current/      # synced source used for the next VPS activation
└── deployment.json # current image and source metadata
```

Secrets must not be committed or placed in public repository files. Database
passwords use profile-scoped Podman secrets (`lemans_demo_db_password` or
`lemans_prod_db_password`); Backblaze credentials are written to the mode-600
profile Go API `.container` file as required by this project. No external
environment file is created.

### Local image bundle contract

Each deployment builds stable profile-scoped image tags inside the project
Docker Sandbox, retags them for the VPS's local Podman store, and exports both
images to one temporary archive. The current VPS target is `linux/amd64`;
`TARGET_PLATFORM` is available only as an explicit override after verifying a
different remote architecture. The build stages run on the Sandbox's native
platform and the runtime stages contain no target-architecture `RUN` steps, so
the ARM64 Sandbox does not need privileged emulation.

```text
localhost/lemans-bridge-dashboard:demo-web
localhost/lemans-bridge-dashboard-go:demo-go
```

The archive and `.sha256` checksum are transferred alongside the committed
source to `/home/jk/bridge-ph/lemans-demo/current`. The VPS imports the archive
with `podman load`; Quadlets use those exact local tags. The database volume is
retained across deployments. After a successful health check, obsolete profile
release directories and old profile image tags are removed with targeted
commands; unrelated Podman resources are never pruned.

## 3. Required topology

Use the smallest isolated topology that satisfies the application:

```text
Internet
   │ HTTPS
   ▼
Caddy on the `caddy` Podman network (`caddy.network` Quadlet reference)
   │
   ├── lemans-demo-app on caddy + lemans-demo-net
   │   │                                  │
   │   │                                  ├── lemans-demo-go
   │   │                                  │   on lemans-demo-net only
   │   │                                  │
   │   │                                  ▼
   │   │                          lemans-demo-db
   │   │                          on lemans-demo-net only
```

Recommended units:

- `lemans-demo.network` for app/database traffic.
- `lemans-demo.volume` or a bind mount under the remote demo data root.
- `lemans-demo-db.container` with no published port.
- `lemans-demo-go.container` attached only to `lemans-demo-net`.
  Its unit name is `lemans-demo-go.service` and it should
  `After=lemans-demo-db.service` (and ideally `Requires=lemans-demo-db.service`).
- `lemans-demo.container` attached to both the `caddy.network` Quadlet
  reference (the `caddy` Podman network) and
  `lemans-demo-net`. Its unit name is `lemans-demo.service` and it should
  `After=lemans-demo-go.service` (and ideally `Requires=lemans-demo-go.service`).
- The Go API container runs migrations on startup and serves the
  `/admin/seed` endpoint only when `DEMO_MODE=true`.

Each container must reference tracked resources by their Quadlet filenames,
such as `Network=lemans-demo.network` and
`Volume=lemans-demo.volume:/var/lib/postgresql`. This lets Quadlet generate the
network and volume dependencies before the database starts.

Unit names are generated from the Quadlet filename (e.g., `lemans-demo.container`
becomes `lemans-demo.service`). Container names (`lemans-demo-app`,
`lemans-demo-go`, `lemans-demo-db`) remain separate and are used for
internal references such as DNS aliases and `podman exec` commands.

Do not use a container that only runs `sleep infinity` as a network bridge. The
application container should join both networks directly, or a real configured
proxy container must be used. A sleeping container does not proxy traffic.

The application may expose a loopback-only health port, such as
`127.0.0.1:3002:3000`, for operator checks. PostgreSQL must never publish port
5432 to the host.

## 4. Public subpath contract

The app is served under `/demo/lemans`, not at the domain root. This must be
implemented deliberately because Next.js `basePath` is embedded at build time.

Recommended approach:

1. Build the demo with `basePath: '/demo/lemans'`.
2. Configure Caddy to preserve the `/demo/lemans` prefix when proxying.
3. Proxy both the exact path and all descendants to the app container.
4. Verify navigation, static assets, API routes, browser flows, redirects,
   cookies, and error pages under the subpath.

The tracked `caddy/lemans-demo.handlers.Caddyfile` is inserted directly into
the active `/home/jk/caddy/conf/Caddyfile` before its static fallback:

```caddy
@lemans_demo path /demo/lemans /demo/lemans/*

handle @lemans_demo {
    reverse_proxy lemans-demo-app:3000
}
```

Do not use `handle_path` or strip the prefix unless the application is purposely
built and tested for that arrangement. Stripping the prefix can create the
Next.js subfolder problem for links and assets.

Do not replace this image with a static HTML export. The demo uses server
actions, dynamic server rendering, and a private Go API, so `Dockerfile.web`
uses Next.js `output: 'standalone'` and runs `server.js` in the remote web
container. The standalone image is the appropriate static-asset optimization;
the application itself remains a server runtime.

The Caddy container/network definitions and Caddyfile must be reviewed before
the first deployment. For the supplied Caddy configuration, `caddy.network`
sets `NetworkName=caddy`; therefore the deployment checks the `caddy` Podman
network while Le Mans Quadlets continue to use `Network=caddy.network`. The
authorized demo deployment installs the tracked route block directly before the
static fallback, formats and validates the complete configuration, and
gracefully reloads the running Caddy container. It preserves the existing
static-site and application mounts. The operator should provide the
configuration if the network name, site-block structure, or TLS ownership is
unclear.

Caddy treats a specific `import` path as required. During demo activation, the
script validates the complete configuration from inside the Caddy container. If
Caddy reports an exact absolute file import missing from that mounted view, the
script omits that exact import and validates again, up to eight imports. This
handles stale fragments left outside the Le Mans source tree without naming or
coupling the deployment to another application. Wildcard imports are untouched;
all other Caddy validation errors remain fatal.

After installing the validated file, activation uses Caddy's graceful reload.
If the read-only mount has not adopted its `:Z` label yet, the script silently
captures that expected permission response, restarts the existing rootless Caddy
unit once to refresh the label, then validates and reloads again. A restart or
reload failure remains fatal and is printed with diagnostics.

## 5. Deployment commands

For the shortest operator path, see
[`REMOTE-DEPLOYMENT-QUICKSTART.md`](./REMOTE-DEPLOYMENT-QUICKSTART.md).

On macOS, the normal update command is:

```bash
./scripts/deploy-remote-demo.sh
```

If no saved remote host exists, the deployment wrapper automatically launches
the existing Keychain setup and then continues with deployment. This first run
saves the remote settings and B2 credentials in the login Keychain; later runs
need no exported environment variables. The explicit setup command remains
available when preferred:

```bash
./scripts/configure-remote-demo.sh
```

Production uses the same pattern with `./scripts/deploy-remote-prod.sh`; it
never accepts `--reset`.

The preferred operator-controlled workflow separates transfer from activation:

```bash
./scripts/sync-remote-demo.sh
ssh jk@216.75.75.136
# Run the single activation command printed by sync-remote-demo.sh.
```

The sync command validates stable `git status --porcelain=v1` output, builds the
target-platform image bundle inside the Docker Sandbox, and uses `rsync
--partial` to transfer the `HEAD` source tree, deployment metadata, and
checksum-verified image bundle. It prints one short activation command. The
guard reports every blocking path instead of asking the operator to guess what
is dirty. Serena's tracked `.serena/project.yml` metadata is the one local-only
exception; it is never included from the working tree.
The command is always:

```bash
cd '/home/jk/bridge-ph/lemans-demo/current' && ./scripts/activate-remote-demo.sh
```

The activation script infers the source commit, profile, public URL, and stable
remote paths. No release ID, archive name, or commit/public-URL flags are
required. Do not type angle-bracket placeholders from older examples; Bash
treats `<word>` as input redirection. The activation command runs entirely on
the VPS and prompts for B2 credentials only when they were not provided by the
automated wrapper. VPS authentication is an operator prerequisite; never put an
SSH password or private key in a script. GitHub authentication remains HTTPS
through `gh`.

Quadlet services are generated by Podman and should not be enabled with
`systemctl --user enable`. After installing or changing units, reload the user
manager, verify the generated units, and start the required services:

```bash
systemctl --user daemon-reload
systemd-analyze --user --generators=true verify \
  lemans-demo-network.service \
  lemans-demo-volume.service \
  lemans-demo-db.service \
  lemans-demo-go.service \
  lemans-demo.service
systemctl --user start lemans-demo-network.service lemans-demo-volume.service
systemctl --user status lemans-demo-db.service lemans-demo-go.service lemans-demo.service --no-pager
```

The activation script performs the equivalent load, dependency, health, and
service checks. Run the manual commands only for operator diagnostics or when
using the two-stage transfer/activation path.

Environment variables remain supported and take precedence for non-macOS and
automated environments. The deployment script may accept `REMOTE_USER`, but it
defaults to `jk`. It must:

1. Require a clean committed `main` source tree, apart from local Serena
   metadata, and collect the source commit.
2. Run the local Docker Sandbox build for the verified target Linux architecture
   (currently `linux/amd64`) and export the profile image bundle with
   `docker save`. The Dockerfiles use native build stages, so this ARM64
   Sandbox does not need privileged QEMU/binfmt setup.
3. Create a temporary `HEAD` source tree locally and transfer it with the image
   bundle and checksum using resumable `rsync --partial --delete` over SSH.
4. Verify the image checksum and import the bundle on the VPS with rootless
   `podman load`; do not build or compile on the VPS.
5. Install the tracked Quadlets, scripts, and current deployment manifest under
   the required remote paths.
6. Install native timer units in `/home/jk/.config/systemd/user`, reload the user
   manager, and confirm every required unit is loaded before starting the
   selected profile.
7. Seed the demo database on first install or with `RESET=true`; production
   never seeds or resets. Migrations run in the Go API container.
8. Check the internal Go health endpoint and loopback web endpoint on the VPS.
9. Print the source commit, imported image IDs, service status, and URL. The public
   check does not follow redirects; a non-200 response prints a redirect
   inspection command so trailing-slash or proxy loops remain visible.

If a managed service fails to start or pass its health check, the script prints
that unit's complete status and current-boot journal before it exits. The first
Podman error in that output is the diagnostic to use. The activation path does
not run disposable image smoke tests on the VPS.

The script must not silently deploy to production, reset the database, or modify
unrelated Caddy routes or systemd units. For the demo profile, it may manage the
tracked route block in the supplied Caddyfile and omit only exact absolute
imports that Caddy confirms are unavailable in its mounted filesystem. It
formats and validates the active Caddyfile in place, then uses a graceful reload.
It does not create a `.bak` file. Remote deployment remains an explicitly
authorized operation.

Because Caddy runs in a rootless Quadlet, the activation script invokes the
Caddy CLI as UID 0 inside the container's user namespace when it reads the
read-only configuration mount. This is not host-root execution; it only avoids
mapped-user permission failures on newly installed route fragments.
On SELinux hosts, it also copies the existing Caddyfile label to newly installed
files through `podman unshare chcon`; this is the documented follow-up for files
moved into a `:Z` volume after container creation. If the running container still
cannot read the new fragment, it restarts the existing rootless `caddy.service`
from `/home/jk/.config/containers/systemd/caddy/` so Podman reapplies the mount
label, then performs the normal graceful reload.

## 6. Demo runtime configuration

The demo profile remains free of real authentication:

- A login-like splash may present `Enter as an Admin` as demo theatre.
- That button enters the `Admin` simulated actor by default.
- No password, real session, login requirement, or authentication redirect.
- Visible role switcher.
- Fictional seeded data only.
- Reset is explicit and operator-controlled by default.

The remote demo configuration must include the public URL and runtime
profile, for example:

```text
APP_ENV=remote-demo
DEMO_MODE=true
DEMO_PUBLIC_URL=https://delegateops.business/demo/lemans
NEXT_PUBLIC_BASE_PATH=/demo/lemans
API_BASE_URL=http://lemans-demo-go:8080
```

Use the actual variable names implemented by the application; do not introduce
duplicated configuration names without updating the configuration guide.

Production authentication, secrets, persistent retention, and stricter policy
belong to the later production profile and must not be required by the demo.

## 7. Migration, reset, and data policy

- Migrations are embedded in the Go API binary and run automatically on
  startup using `goose`. Do not run manual migration commands on the
  remote database.
- Do not run destructive reset logic during ordinary deploys.
- Install and verify a rootless user-level reset service and timer that restore
  the fictional seeded state every 30 minutes.
- Provide an explicit manual demo reset command in addition to the timer.
- Keep database and uploads inside the demo data boundary.
- Keep demo data fictional and safe for public presentation.
- Record schema version and seed version in the deployment manifest.

## 8. Verification gates

The deployment is not successful until all checks pass:

- Quadlet services and native timer units are loaded after
  `systemctl --user daemon-reload`.
- The managed internal network and database volume start before PostgreSQL.
- The shared `caddy` Podman network, created by `caddy.network`, is present
  before the web container starts.
- Database has no published host port.
- App is reachable on the shared `caddy` Podman network and only loopback
  health ports, if any, are published.
- `https://delegateops.business/demo/lemans` returns a healthy response.
- Static assets load beneath `/demo/lemans`.
- The simulated `Enter as an Admin` entry and Admin default work.
- Role switching works for all six demo roles.
- Database-backed workflows and attachments work.
- Reset is not triggered by ordinary deployment; the verified user timer runs
  at 30-minute intervals after deployment.
- If the demo has B2 uploads, verify deletion of the `lemans/demo` object prefix
  separately; the current reset container only reseeds relational demo data.
- Logs identify the source commit and image digest.

If the tracked demo route changes Caddy configuration, the deployment formats
and validates the active Caddyfile before a graceful reload. It does not create
`.bak` files. Do not reload the shared proxy during an exploratory deployment
without explicit approval.

## 9. Rollback contract

The stable image tags point to the current deployment. The previous Caddy
rollback of application code requires restoring a known-good source commit and
rerunning the same sync and activation commands. Caddy configuration rollback
is operator-managed from the active `/home/jk/caddy/conf/Caddyfile`; this script
does not create backup files.

Rollback must:

1. Point the demo Quadlet to the previous image digest.
2. Reload only the demo user units.
3. Restart the demo app.
4. Verify the public URL and database compatibility.
5. Record the rollback result.

Database migrations must be backward-compatible with the previous app during the
promotion window. Use an expand/contract migration strategy for destructive
schema changes.

## 10. Current implementation notes

The deployment script now builds stable profile-tagged images inside the project
Docker Sandbox and imports them on the VPS; the VPS does not build or compile
the application. The Next.js web container references `caddy.network` directly,
which joins it to the `caddy` Podman network defined by that Quadlet.

- The sync script builds both
  `localhost/lemans-bridge-dashboard:demo-web` and
  `localhost/lemans-bridge-dashboard-go:demo-go` in the Docker Sandbox, then
  transfers one checksum-verified image archive with the committed source.
- Remote activation uses `podman load` and targeted runtime health checks. No
  remote build, remote compile, or remote image smoke-test container is used.
- The Go API container is attached only to `lemans-demo-net`; the web container
  references `caddy.network` (actual network: `caddy`) and
  `lemans-demo.network` (actual network: `lemans-demo-net`).
- Go migrations run automatically inside `lemans-demo-go.service`.
- The `/admin/seed` endpoint is only available when `DEMO_MODE=true`.
- The remote demo reset service/timer must invoke the tracked reset script every
  30 minutes; this is a required deployment artifact, not an undocumented host
  customization.
- The reset script runs inside `lemans-demo-reset.container` and calls the
  demo Go API over `lemans-demo-net`. It must not call `systemctl`, `podman`, or
  host-only commands from inside the reset container.
- Runtime credentials must be written as `Environment=` entries in the generated
  Go API `.container` file with mode `600`; no external remote `.env` file is
  allowed. Legacy generated env files are removed from the active Quadlet and
  current deployment directory. The deployment manifest is written to
  `/home/jk/bridge-ph/lemans-demo/deployment.json`. Verify these guarantees against
  both success and failure paths; see
  the current validation records in `CURRENT-STATE.md` and this playbook.
- Rootless user services require a user manager that remains available after
  logout; verify `loginctl enable-linger jk` on the VPS as an operator
  prerequisite. Do not change that remote setting without explicit approval.
- The reset path resets the fictional relational demo data through
  `/admin/seed`; B2 upload-object cleanup remains a separate storage concern and
  has not been exercised from this workspace. Do not claim the upload reset
  guarantee until that remote storage check is completed.

Do not claim the target URL is operational until the Caddy context and remote
health checks are verified.

## 11. Official guidance

- [Podman Quadlet rootless search paths and generator](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Podman Quadlet basic usage and verification](https://docs.podman.io/en/latest/markdown/podman-quadlet-basic-usage.7.html)
- [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)
- [Docker Sandbox security model](https://docs.docker.com/ai/sandboxes/security/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [`docker image save`](https://docs.docker.com/reference/cli/docker/image/save/)
- [`podman load`](https://docs.podman.io/en/latest/markdown/podman-load.1.html)
- [systemd `loginctl` linger](https://www.freedesktop.org/software/systemd/man/252/loginctl.html)
- [systemd timer unit configuration](https://man7.org/linux/man-pages/man5/systemd.timer.5.html)
- [Caddy reverse proxy and path handling](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Caddy `import` directive](https://caddyserver.com/docs/caddyfile/directives/import)
- [Caddy `handle_path`](https://caddyserver.com/docs/caddyfile/directives/handle)
- [Next.js 16 self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js `output: 'standalone'`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Next.js `basePath`](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath)
- [`gh auth setup-git`](https://cli.github.com/manual/gh_auth_setup-git)
- [goose migrations](https://github.com/pressly/goose)
- [goose SQL annotations](https://pressly.github.io/goose/documentation/annotations/)
- [sqlc documentation](https://docs.sqlc.dev)
- [Chi router](https://github.com/go-chi/chi)
- [GitHub deployment environments and protection rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
