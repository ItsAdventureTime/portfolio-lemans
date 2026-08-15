# ADR 0001: Rootless Podman Containerized Infrastructure & Quadlet Systemd Units

- **Status**: Approved for remote runtime; local tooling superseded by ADR 0005
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-12 (Updated)

## Context

The Le Mans Operations & Job Cost Management System requires a strict deployment and execution paradigm to ensure security, environment parity, and operational control. The target remote host runs Linux systemd Quadlet container managers. Local build and validation execution is now governed by ADR 0005 and runs inside the project Docker Sandbox.

## Decision

We mandate rootless Podman as the **remote runtime environment** and retain its Quadlet topology for production and demo services. Local tooling uses the project Docker Sandbox under ADR 0005:

1. **Local Sandbox Execution**: Builds, tests, image packaging, and local service execution run through `jk-sbx-project exec` using Docker inside the Sandbox.
2. **Remote Runtime**: The VPS imports locally built images with rootless `podman load` and manages them through Quadlet systemd units.
3. **Quadlet Systemd Declarative Specification**:
   - Remote Demo Quadlet Path: `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`
   - Remote Prod Quadlet Path: `/home/jk/.config/containers/systemd/bridge-ph/lemans`
4. **Image Tag Standard**:
   - Demo Builds: `lemans-bridge-dashboard:demo-web` and
     `lemans-bridge-dashboard-go:demo-go`.
   - Production Builds: `lemans-bridge-dashboard:prod-web` and
     `lemans-bridge-dashboard-go:prod-go`.
5. **Container Runtime Standard**:
   - Prefer `node:lts-alpine`, `golang:alpine`, and `postgres:alpine` for all images unless dependency compatibility explicitly requires the lightest Debian-based image.
   - Do not use Compose for local builds, tests, or execution.
   - Always run local builds, linting, type-checking, and tests inside the project Docker Sandbox.
   - Do not leave transient containers or images running; remove them immediately with `--rm` or targeted cleanup.
6. **No Database Host Ports**: PostgreSQL database containers run on the
   profile-specific internal user networks (`lemans-demo-net` or
   `lemans-prod-net`) without exposed host ports.
7. **Loopback Application Binding**: Exposed application HTTP ports bind to `127.0.0.1`.
8. **Caddy Bridge Pattern**: Each VPS environment references the existing
   `caddy.network` Quadlet to join its `caddy` Podman network for reverse proxy
   access.

## Consequences

- **Positive**: Complete image lineage from local validation to VPS runtime; zero host contamination from Sandbox execution; strict security isolation; declarative version-controlled infrastructure via Quadlet.
- **Negative**: The Sandbox must be initialized and able to build the target VPS architecture before deployment.
