# Deployment transfer standard

- Build and package the committed source in the initialized Docker Sandbox; local Podman is not part of the workflow.
- The current remote target is `linux/amd64`; `TARGET_PLATFORM` is an explicit override after verifying a different VPS architecture.
- Dockerfiles use native `BUILDPLATFORM` build stages, cross-compile the Go binary, and avoid target-stage `RUN` instructions so ARM64 Sandbox packaging does not require privileged QEMU/binfmt.
- Export the web and Go images with `docker save` into the ignored, short-lived `.deployment-artifacts/<profile>/` directory and write a SHA-256 checksum.
- Use `rsync --partial` over the authorized VPS SSH transport for source and bundle transfer; do not use `scp`. GitHub transport is separate and must use `gh`-authenticated HTTPS only.
- Require `rsync` on both workstation and VPS before transfer.
- On macOS, `scripts/configure-remote-{demo,prod}.sh` stores remote settings and B2 credentials in the login Keychain; environment variables remain supported for automation/non-macOS use.
- Use a per-deployment temporary OpenSSH control socket only for the authorized VPS transfer/activation.
- Remote activation verifies the checksum, runs rootless `podman load`, installs Quadlets, starts services, and performs runtime health checks. It must not run `podman build`, application compilation, or image smoke tests.
- Remote deployments must not create external `.env` files. Runtime values are written as `Environment=` entries in the generated Go API `.container` file with mode 600; legacy generated env files are removed during activation.