# Update the deployed Le Mans app

- **Status**: Current operator quickstart
- **Updated**: 2026-08-16
- **Scope**: macOS workstation → existing VPS demo or production profile

Use this guide after the change has completed
[`POST-CHANGE-COMPLETION-GUIDE.md`](./POST-CHANGE-COMPLETION-GUIDE.md): the
active documentation is updated, validation is complete, and local and remote
`main` share one commit. You do not need to run Git staging, commit, or push
commands. This guide does not connect to the VPS automatically from the
documentation task.

## Normal demo update

After Codex reports that the change is synchronized, run this from the repository
root to update the demo VPS:

```bash
./scripts/deploy-remote-demo.sh
```

The deployment script refuses uncommitted deployable changes, builds Linux
deployment images inside the project Docker Sandbox, stages the exact
committed `HEAD` source, exports a checksum-verified image bundle, and transfers
both with resumable `rsync`. VPS activation imports the bundle, updates the
rootless Quadlets, starts the runtime, and verifies the public URL. The VPS
transfer uses SSH because it is the transport to the server; GitHub continues
to use the HTTPS credential helper configured by `gh`.

The current VPS target is `linux/amd64`. The Dockerfiles use native build stages
and cross-compile the Go binary, so the ARM64 Sandbox can package the target
without privileged QEMU/binfmt setup. If the VPS architecture changes, verify it
first and set `TARGET_PLATFORM` for that deployment.

Before syncing, the script checks stable `git status --porcelain=v1` output and
prints the exact paths that block deployment. Changes outside the application
source are not silently staged. Serena may refresh the tracked
`.serena/project.yml` metadata locally; that one file is treated as local-only
and is excluded from the deployment guard. The transfer snapshot is taken from
`HEAD`, so staged-but-uncommitted application changes cannot be deployed by
accident. If another path is listed, have the intended change committed before
rerunning the command and leave unrelated work untouched.

### First run only

If the deployment settings are not saved yet, `deploy-remote-demo.sh` opens the
existing interactive Keychain setup automatically. It stores the remote host,
user, public URL, Caddy network name, and B2 credentials in the macOS login
Keychain. Future deployments use the same one-command flow without exported
environment variables.

You can also run the setup explicitly:

```bash
./scripts/configure-remote-demo.sh
```

## Production update

Use the same flow with the production wrapper:

```bash
./scripts/deploy-remote-prod.sh
```

Production never accepts `--reset`. Do not use the demo wrapper for the
production URL.

## Optional operator controls

```bash
# Build and transfer source plus prebuilt images; print the VPS activation command.
./scripts/sync-remote-demo.sh

# Explicitly reseed the fictional demo database during activation.
./scripts/deploy-remote-demo.sh --reset
```

Use `--reset` only when you intend to replace demo records. Ordinary deploys do
not reset the database. The remote activation script imports images and runs
deployment health checks on the VPS; it does not build or compile the app there.
Local builds and tests run inside the Docker Sandbox.

## If deployment stops

The script prints the failed Quadlet unit, its systemd status, and its current
boot journal. Preserve that output. The first Podman error is usually the
useful diagnostic. Do not run `systemctl --user enable` for Quadlets; reload the
user manager and let Podman’s generator create the service units.

If Caddy reports `File to import not found`, activation checks the generated
configuration inside the Caddy container. It may omit that exact absolute import
from the candidate configuration and validate again; other Caddy errors remain
fatal. This behavior is generic and does not depend on another application’s
name or directory. A one-time permission response while Caddy reads the newly
written `:Z` mount is handled by refreshing the rootless Caddy unit; it is only
reported as a deployment error if the subsequent validation or reload fails.

For the two-stage workflow, run the activation command printed by
`sync-remote-demo.sh` after logging in to the VPS. Use the full
[`REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md) for
Caddy, rollback, data, and remote topology rules.

## Guidance applied

- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
  recommends a reverse proxy in front of the Next.js server; this deployment
  keeps Caddy in front of the web container.
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
  supports the existing minimal production web image.
- [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
  documents rootless search paths and generated systemd units; the activation
  script uses `systemctl --user daemon-reload` and does not enable generated
  services.
- [`gh auth setup-git`](https://cli.github.com/manual/gh_auth_setup-git)
  configures GitHub CLI as the HTTPS credential helper; no GitHub SSH transport,
  SSH key, or passkey is needed.
- [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) provide the isolated
  project workspace used for local builds and execution.
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
  supports the repository `.dockerignore` and multi-stage image approach.
- [`docker image save`](https://docs.docker.com/reference/cli/docker/image/save/)
  and [`podman load`](https://docs.podman.io/en/latest/markdown/podman-load.1.html)
  define the local image-bundle transfer path.
