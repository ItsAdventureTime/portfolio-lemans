# Remote Demo Deployment Playbook

- **Status**: Authoritative for the remote demo deployment profile
- **Version**: 1.2.0
- **Updated**: 2026-08-12
- **Target URL**: `https://delegateops.business/lemans/demo`
- **Remote user**: `jk`
- **Current evidence**: Local image/runtime verification is complete; remote
  deployment has not been exercised and remains authorization-gated.

This playbook defines the preferred deployment model for the demo. It supersedes
older remote-demo instructions that describe local long-running deployments,
login credentials, host-based standalone-output sync, or a sleeping Caddy bridge.

## 1. Deployment policy

The demo is deployed remotely only. There is no persistent local deployment
target.

The workstation does not deploy, build, compile, or execute the application as
part of remote deployment. It packages the committed source with `git archive`
and transfers the archive and runtime configuration over SSH/SCP. Local
Podman-based verification is an optional, separate activity; if it is needed,
it must use disposable `podman run --rm` containers and leave no project
containers, volumes, or images running afterward.

The VPS is the build and execution environment. It uses rootless `podman build`
for the web and Go images, `podman run --rm` for image smoke checks, and the
existing rootless Quadlets for the persistent runtime. A Linux VPS does not
need a Podman machine.

The remote demo is a rootless Podman Quadlet deployment managed by the `jk`
user's systemd user manager.

## 2. Canonical remote locations

| Purpose                                   | Required location                                           |
| ----------------------------------------- | ----------------------------------------------------------- |
| Quadlet units and drop-ins                | `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo` |
| Demo runtime data/config/database/backups | `/home/jk/bridge-ph/lemans-demo`                            |
| Public URL                                | `https://delegateops.business/lemans/demo`                  |
| Remote app service                        | `lemans-demo.service`                                       |
| Remote Go API service                     | `lemans-demo-go.service`                                    |
| Remote database service                   | `lemans-demo-db.service`                                    |
| Internal app/database network             | `lemans-demo-net`                                           |
| Caddy-shared network                      | `caddy.network`                                             |

The path under `/home/jk/bridge-ph/lemans-demo` must be subdivided and permission
controlled, for example:

```text
/home/jk/bridge-ph/lemans-demo/
├── config/       # mode and non-secret runtime configuration
├── data/         # persistent demo data and database bind data if used
├── uploads/      # demo attachment objects
├── backups/      # optional demo backups
└── releases/     # release manifests and deployment evidence
```

Secrets must not be committed or placed in public repository files. Prefer
Podman secrets or a rootless systemd credential mechanism. Any environment file
containing secrets must be owned by `jk`, mode `0600`, and stored only on the
remote host.

### Remote builder contract

Each deployment creates a release directory below
`/home/jk/bridge-ph/lemans-demo/releases/<release-id>` and builds images from
the transferred committed source archive. The remote rootless image store keeps
release-specific tags such as:

```text
localhost/lemans-bridge-dashboard:demo-web-<release-id>
localhost/lemans-bridge-dashboard-go:demo-go-<release-id>
```

The Quadlets are rewritten to those exact local tags, so deployment does not
depend on a registry or on a local `podman save`/`podman load` pipeline. The
database volume is retained across application releases. The source archive is
removed from the release directory after a successful activation; the manifest
and release images remain available for rollback and audit.

## 3. Required topology

Use the smallest isolated topology that satisfies the application:

```text
Internet
   │ HTTPS
   ▼
Caddy on caddy.network
   │
   ├── lemans-demo-app on caddy.network + lemans-demo-net
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
- `lemans-demo-db.volume` or a bind mount under the remote demo data root.
- `lemans-demo-db.container` with no published port.
- `lemans-demo-go.container` attached only to `lemans-demo-net`.
  Its unit name is `lemans-demo-go.service` and it should
  `After=lemans-demo-db.service` (and ideally `Requires=lemans-demo-db.service`).
- `lemans-demo.container` attached to both `caddy.network` and
  `lemans-demo-net`. Its unit name is `lemans-demo.service` and it should
  `After=lemans-demo-go.service` (and ideally `Requires=lemans-demo-go.service`).
- The Go API container runs migrations on startup and serves the
  `/admin/seed` endpoint only when `DEMO_MODE=true`.

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

The app is served under `/lemans/demo`, not at the domain root. This must be
implemented deliberately because Next.js `basePath` is embedded at build time.

Recommended approach:

1. Build the demo with `basePath: '/lemans/demo'`.
2. Configure Caddy to preserve the `/lemans/demo` prefix when proxying.
3. Proxy both the exact path and all descendants to the app container.
4. Verify navigation, static assets, API routes, Server Actions, redirects,
   cookies, and error pages under the subpath.

Illustrative Caddy shape, subject to validation against the live Caddyfile:

```caddy
delegateops.business {
    @lemans_demo path /lemans/demo /lemans/demo/*
    handle @lemans_demo {
        reverse_proxy lemans-demo-app:3000
    }
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
the first deployment. The operator should provide them if the existing network
name, site-block structure, or TLS ownership is unclear.

## 5. Single-command deployment contract

The operator should need one repository command:

```bash
REMOTE_HOST=<server-host> ./scripts/deploy-remote-demo.sh
```

The script may accept `REMOTE_USER`, but it defaults to `jk`. It must:

1. Require a clean committed `main` worktree and collect the source commit.
2. Create a release archive locally; do not invoke local image builds or app
   execution.
3. Transfer the archive and mode-0600 runtime environment file to the VPS.
4. Build both release-tagged images on the VPS with rootless `podman build`.
5. Run disposable `podman run --rm` image smoke checks on the VPS.
6. Install the tracked Quadlets, scripts, release manifest, and environment
   file under the canonical remote paths.
7. Validate generated units with `systemd-analyze --user --generators=true
verify`, reload the user manager, and start only the selected profile.
8. Seed the demo database on first install or with `RESET=true`; production
   never seeds or resets. Migrations run in the Go API container.
9. Check the internal Go health endpoint and loopback web endpoint on the VPS.
10. Print the release commit, image IDs, service status, URL, and rollback
    command.

The script must not silently deploy to production, reset the database, overwrite
the Caddyfile, or modify unrelated systemd units. Remote deployment remains an
explicitly authorized operation.

## 6. Demo runtime configuration

The demo profile remains free of real authentication:

- A login-like splash may present `Enter as an Admin` as demo theatre.
- That button enters the `Admin` simulated actor by default.
- No password, real session, login requirement, or authentication redirect.
- Visible role switcher.
- Fictional seeded data only.
- Reset is explicit and operator-controlled by default.

The remote demo configuration must include the public canonical URL and runtime
profile, for example:

```text
APP_ENV=remote-demo
DEMO_MODE=true
DEMO_PUBLIC_URL=https://delegateops.business/lemans/demo
NEXT_PUBLIC_BASE_PATH=/lemans/demo
API_BASE_URL=http://lemans-demo-go:8080
```

Use the actual variable names implemented by the application; do not introduce
duplicated configuration names without updating the configuration guide.

Production authentication, secrets, persistent retention, and stricter policy
belong to the later production profile and must not be required by the demo.

## 7. Migration, reset, and data policy

- Migrations are embedded in the Go API binary and run automatically on
  startup using `goose`. Do not run manual `goose` or `prisma` commands on the
  remote database.
- Do not run destructive reset logic during ordinary deploys.
- Install and verify a rootless user-level reset service and timer that restore
  the fictional seeded state every 30 minutes.
- Provide an explicit manual demo reset command in addition to the timer.
- Keep database and uploads inside the demo data boundary.
- Keep demo data fictional and safe for public presentation.
- Record schema version and seed version in the release manifest.

## 8. Verification gates

The deployment is not successful until all checks pass:

- Quadlet generator dry-run succeeds for the isolated unit directory.
- `systemd-analyze --user --generators=true verify` succeeds for generated units.
- Database has no published host port.
- App is reachable on `caddy.network` and only loopback health ports, if any,
  are published.
- `https://delegateops.business/lemans/demo` returns a healthy response.
- Static assets load beneath `/lemans/demo`.
- The simulated `Enter as an Admin` entry and Admin default work.
- Role switching works for all six demo roles.
- Database-backed workflows and attachments work.
- Reset is not triggered by ordinary deployment; the verified user timer runs
  at 30-minute intervals after deployment.
- Logs identify the release commit and image digest.

If Caddy configuration is changed, validate Caddy before reloading it and keep a
known-good rollback copy. Do not reload the shared proxy during an exploratory
deployment without explicit approval.

## 9. Rollback contract

Every deployment must retain the previous known-good image digest and release
manifest. Rollback must:

1. Point the demo Quadlet to the previous image digest.
2. Reload only the demo user units.
3. Restart the demo app.
4. Verify the public URL and database compatibility.
5. Record the rollback result.

Database migrations must be backward-compatible with the previous app during the
promotion window. Use an expand/contract migration strategy for destructive
schema changes.

## 10. Current implementation notes

The deployment script now builds release-tagged images on the VPS; it does not
build or execute the application locally. The Next.js web container joins
`caddy.network` directly.

- The script packages the committed source locally, then builds both
  `localhost/lemans-bridge-dashboard:demo-web-<release-id>` and
  `localhost/lemans-bridge-dashboard-go:demo-go-<release-id>` on the remote host.
- Remote image checks use disposable `podman run --rm` containers. No local
  deployment, local build, local compile, or local runtime is required.
- The Go API container is attached only to `lemans-demo-net`; the web container
  joins both `caddy.network` and `lemans-demo-net`.
- Go migrations run automatically inside `lemans-demo-go.service`.
- The `/admin/seed` endpoint is only available when `DEMO_MODE=true`.
- The remote demo reset service/timer must invoke the tracked reset script every
  30 minutes; this is a required deployment artifact, not an undocumented host
  customization.
- Temporary local env/release files must be removed on success and failure; the
  remote env file must be chmod `600`; release manifests must be written to
  `/home/jk/bridge-ph/lemans-demo/releases`. Verify these guarantees against
  both success and failure paths; see
  [`NEXT-AGENT-REMEDIATION-REPORT-2026-08-11.md`](../reviews/NEXT-AGENT-REMEDIATION-REPORT-2026-08-11.md).
- Rootless user services require a user manager that remains available after
  logout; verify `loginctl enable-linger jk` on the VPS as an operator
  prerequisite. Do not change that remote setting without explicit approval.

Do not claim the target URL is operational until the Caddy context and remote
health checks are verified.

## 11. Official guidance

- [Podman Quadlet rootless search paths and generator](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Podman Quadlet basic usage and verification](https://docs.podman.io/en/latest/markdown/podman-quadlet-basic-usage.7.html)
- [Podman build units](https://docs.podman.io/en/latest/markdown/podman-build.unit.5.html)
- [systemd `loginctl` linger](https://www.freedesktop.org/software/systemd/man/252/loginctl.html)
- [systemd timer unit configuration](https://man7.org/linux/man-pages/man5/systemd.timer.5.html)
- [Caddy reverse proxy and path handling](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Caddy `handle_path`](https://caddyserver.com/docs/caddyfile/directives/handle)
- [Next.js 16 self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js `output: 'standalone'`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Next.js `basePath`](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath)
- [goose migrations](https://github.com/pressly/goose)
- [goose SQL annotations](https://pressly.github.io/goose/documentation/annotations/)
- [sqlc documentation](https://docs.sqlc.dev)
- [Chi router](https://github.com/go-chi/chi)
- [GitHub deployment environments and protection rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
