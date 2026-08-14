# Update the deployed Le Mans app

- **Status**: Current operator quickstart
- **Updated**: 2026-08-14
- **Scope**: macOS workstation → existing VPS demo or production profile

Use this guide after Codex has reviewed the change, committed it locally, and
synchronized `main` with GitHub. You do not need to run Git staging, commit, or
push commands. This guide does not connect to the VPS automatically from the
documentation task.

## Normal demo update

After Codex reports that the change is synchronized, run this from the repository
root to update the demo VPS:

```bash
./scripts/deploy-remote-demo.sh
```

The deployment script refuses a dirty worktree, stages the committed source,
transfers it with resumable `rsync`, builds the web and Go images on the VPS,
updates the rootless Quadlets, runs smoke checks, and verifies the public URL.
The VPS transfer uses SSH because it is the transport to the server; GitHub
continues to use the HTTPS credential helper configured by `gh`.

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
# Transfer source only; print the VPS activation command.
./scripts/sync-remote-demo.sh

# Explicitly reseed the fictional demo database during activation.
./scripts/deploy-remote-demo.sh --reset
```

Use `--reset` only when you intend to replace demo records. Ordinary deploys do
not reset the database. The remote activation script runs builds and health
checks on the VPS; it does not build or run the app on the Mac.

## If deployment stops

The script prints the failed Quadlet unit, its systemd status, and its current
boot journal. Preserve that output. The first Podman error is usually the
useful diagnostic. Do not run `systemctl --user enable` for Quadlets; reload the
user manager and let Podman’s generator create the service units.

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
