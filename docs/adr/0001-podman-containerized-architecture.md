# ADR 0001: Rootless Podman Containerized Infrastructure & Quadlet Systemd Units

- **Status**: Approved
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-07 (Updated)

## Context

The Le Mans Operations & Job Cost Management System requires a strict deployment and execution paradigm to ensure security, environment parity, and operational control. The host environment operates rootless Podman on macOS via `podman machine start`, while target remote hosts run Linux systemd Quadlet container managers.

## Decision

We decide to mandate rootless Podman as the **exclusive runtime and tooling environment** for all local and remote execution:

1. **Container Isolation**: All node processes, dev servers, builds, database instances, and migration scripts must execute strictly within Podman containers.
2. **Local macOS Execution**: `podman machine start` is used to manage `podman-machine-default`.
3. **Quadlet Systemd Declarative Specification**:
   - Remote Demo Quadlet Path: `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`
   - Remote Prod Quadlet Path: `/home/jk/.config/containers/systemd/bridge-ph/lemans`
4. **Image Tag Standard**:
   - Demo Builds: `latest-alpine` (fallback: `latest-slim`, then `latest`).
   - Production Builds: `lts-alpine` (fallback: `lts-slim`, then `lts`).
5. **Container Runtime Standard**:
   - Prefer `node:lts-alpine`, `golang:alpine`, and `postgres:alpine` for all images unless dependency compatibility explicitly requires the lightest Debian-based image.
   - Never use `podman compose` or `docker compose` for local builds, tests, or execution.
   - Always run local builds, linting, type-checking, and tests inside disposable `podman run --rm` containers.
   - Do not leave transient containers or images running; remove them immediately with `--rm` or targeted cleanup.
6. **No Database Host Ports**: PostgreSQL database containers run on internal user networks (`lemans-net`) without exposed host ports.
7. **Loopback Application Binding**: Exposed application HTTP ports bind to `127.0.0.1`.
8. **Caddy Bridge Pattern**: Each VPS environment joins the existing `caddy.network` via a single bridge container for reverse proxy access.

## Consequences

- **Positive**: Complete parity between development and production environments; zero host contamination; strict security isolation; declarative version-controlled infrastructure via Quadlet.
- **Negative**: Development tools must be executed via `podman run --rm` helper scripts or `podman exec` rather than bare metal host binaries.
