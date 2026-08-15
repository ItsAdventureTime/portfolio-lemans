# ADR 0005: Docker Sandbox Local Builds with VPS Image Import

- **Status**: Approved
- **Supersedes**: Local build and validation portions of ADR 0001
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-16

## Context

The project now has an initialized Docker Sandbox for the repository. Local
builds, compilation, tests, and the local demo runtime can therefore use the
Sandbox workspace and its private Docker engine. Building the same images again
on the VPS adds deployment time and makes a remote deployment do more than
activate a validated artifact.

The VPS still uses rootless Podman Quadlets for the persistent runtime and the
existing Caddy network. That runtime requires image tags to be present in the
VPS's rootless container store.

## Decision

1. Run local project commands through `jk-sbx-project exec`.
2. Use Docker inside the Sandbox for local image builds, local service
   containers, and disposable verification containers. Do not use a local
   Podman machine or local Podman commands.
3. Build the verified remote target platform inside the Sandbox. The current
   VPS target is `linux/amd64`, so the packaging helper uses that as its default
   while accepting an explicit `TARGET_PLATFORM` override. The Dockerfiles pin
   build stages to `BUILDPLATFORM`, cross-compile the Go binary, and avoid
   target-stage `RUN` instructions so an ARM64 Sandbox can package the amd64
   runtime without privileged QEMU/binfmt setup.
4. Export the two profile images with `docker save` into an ignored,
   short-lived workspace artifact directory. Transfer the archive and its
   SHA-256 checksum over the authorized VPS `rsync`/SSH transport.
5. On the VPS, import the archive with rootless `podman load`, verify the
   checksum, install Quadlets, start the runtime, and run deployment health
   checks. The VPS must not run `podman build`, application compilation, or
   image smoke tests.
6. Keep remote Podman for runtime operations only: Quadlets, networks, volumes,
   secrets, Caddy integration, service logs, and targeted cleanup.

## Consequences

- **Positive**: One locally validated image lineage reaches the VPS; remote
  activation is shorter and deterministic; local macOS Podman setup is no
  longer required; image transfer is integrity-checked.
- **Trade-off**: Deployment transfers the image layers in addition to source
  and runtime configuration. A different VPS architecture must be verified
  first and passed as `TARGET_PLATFORM`; the resulting image must not be
  assumed compatible with another CPU architecture.
- **Operational rule**: Do not commit `.deployment-artifacts/`; the deployment
  wrapper removes its local archive after each run.

## Official guidance

- [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)
- [Docker Sandbox security model](https://docs.docker.com/ai/sandboxes/security/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [`docker image save`](https://docs.docker.com/reference/cli/docker/image/save/)
- [`podman load`](https://docs.podman.io/en/latest/markdown/podman-load.1.html)
