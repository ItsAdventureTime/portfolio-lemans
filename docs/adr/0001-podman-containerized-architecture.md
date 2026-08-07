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
   - Demo Builds: `latest-alpine` or `latest-slim` (fallback: `latest`).
   - Production Builds: `lts-alpine` or `lts-slim` (fallback: `lts`).
5. **No Database Host Ports**: PostgreSQL database containers run on internal user networks (`lemans-net`) without exposed host ports.
6. **Loopback Application Binding**: Exposed application HTTP ports bind to `127.0.0.1`.

## Consequences

- **Positive**: Complete parity between development and production environments; zero host contamination; strict security isolation; declarative version-controlled infrastructure via Quadlet.
- **Negative**: Development tools must be executed via `podman exec` or container scripts rather than bare metal host binaries.
