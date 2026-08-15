# Deployment transfer standard

- Use `rsync` over SSH for remote deployment archive and runtime-config transfers.
- Do not use `scp` for deployment transfers.
- Require `rsync` on both workstation and VPS before transfer.
- Use non-destructive, resumable options; do not use `--delete` in release transfers.
- On macOS, `scripts/configure-remote-{demo,prod}.sh` stores remote settings and B2 credentials in the login Keychain; routine deploys load them automatically. Environment variables override Keychain values for automation and non-macOS use.
- Use a per-deployment temporary OpenSSH control socket to reuse one authenticated connection for rsync and remote commands. Password authentication should prompt once per deployment; SSH keys remove that remaining prompt.
- The repository source of truth is `AGENTS.md` and the remote deployment playbook.
- Authorized demo deployments insert the tracked `caddy/lemans-demo.handlers.Caddyfile` route block directly before the DelegateOps static fallback, format and validate the complete Caddyfile, and gracefully reload the running rootless Caddy container. During validation, an exact absolute import that Caddy reports missing from its container-mounted view may be omitted from the generated candidate; other validation failures remain fatal. The shared `caddy.container` remains attached only to the shared `caddy` network; do not add the demo internal network.
- Remote deployments must not create external `.env` files. Runtime values are written as `Environment=` entries in the generated Go API `.container` file with mode 600; legacy generated env files are removed during activation.
