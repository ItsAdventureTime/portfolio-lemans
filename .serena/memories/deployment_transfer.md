# Deployment transfer standard

- Use `rsync` over SSH for remote deployment archive and runtime-config transfers.
- Do not use `scp` for deployment transfers.
- Require `rsync` on both workstation and VPS before transfer.
- Use non-destructive, resumable options; do not use `--delete` in release transfers.
- The repository source of truth is `AGENTS.md` and the remote deployment playbook.
