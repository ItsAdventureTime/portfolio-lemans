# Deployment transfer standard

- Use `rsync` over SSH for remote deployment archive and runtime-config transfers.
- Do not use `scp` for deployment transfers.
- Require `rsync` on both workstation and VPS before transfer.
- Use non-destructive, resumable options; do not use `--delete` in release transfers.
- On macOS, `scripts/configure-remote-{demo,prod}.sh` stores remote settings and B2 credentials in the login Keychain; routine deploys load them automatically. Environment variables override Keychain values for automation and non-macOS use.
- Use a per-deployment temporary OpenSSH control socket to reuse one authenticated connection for rsync and remote commands. Password authentication should prompt once per deployment; SSH keys remove that remaining prompt.
- The repository source of truth is `AGENTS.md` and the remote deployment playbook.
