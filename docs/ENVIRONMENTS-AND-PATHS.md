# Environment Matrix & Remote Quadlet Path Specifications

## 1. Overview & Single Repository Mandate
All application logic, container build files, database schemas, and Quadlet definitions reside in a **single unified source repository**. Environment isolation is strictly maintained through environment files, container naming, database volume identifiers, network namespaces, and distinct Quadlet systemd unit configurations.

- **Remote GitHub Repository**: `https://github.com/ItsAdventureTime/bridge-lemans`
- **SSH Target**: `git@github.com:ItsAdventureTime/bridge-lemans.git`

---

## 2. Four Isolated Target Environments (Verified Phase 2 Status)

| Environment Parameter | 1. `local-demo` | 2. `local-prodlike` | 3. `remote-demo` | 4. `remote-production` |
|---|---|---|---|---|
| **Status** | **Verified (200 OK)** | **Verified (200 OK)** | Pending Phase 5 | Pending Phase 5 |
| **Target Host** | macOS (Apple Silicon arm64) | macOS (Apple Silicon arm64) | Remote Linux Server | Remote Linux Server |
| **Podman Command** | `podman machine start` | `podman machine start` | Systemd User Quadlet | Systemd User Quadlet |
| **Image Tag Standard** | `latest-alpine` / `latest-slim` | `lts-alpine` / `lts-slim` | `latest-alpine` / `latest-slim` | `lts-alpine` / `lts-slim` |
| **Source Mounting** | **Narrow Bind Mount** (`./src:/app/src`) | **Immutable Image** (No bind mounts) | **Immutable Image** (No bind mounts) | **Immutable Image** (No bind mounts) |
| **App Port Binding** | `127.0.0.1:3000` | `127.0.0.1:3001` | `127.0.0.1:3002` (Behind Proxy) | `127.0.0.1:3003` (Behind Proxy) |
| **DB Port Binding** | `NONE` (Internal Podman Net) | `NONE` (Internal Podman Net) | `NONE` (Internal Podman Net) | `NONE` (Internal Podman Net) |
| **Container Name** | `lemans-demo-app` | `lemans-prodlike-app` | `lemans-remote-demo-app` | `lemans-remote-prod-app` |
| **DB Volume Name** | `lemans-demo-db-data` | `lemans-prodlike-db-data` | `lemans-remote-demo-db-data` | `lemans-remote-prod-db-data` |
| **Podman Network** | `lemans-demo-net` | `lemans-prodlike-net` | `lemans-remote-demo-net` | `lemans-remote-prod-net` |
| **Better Auth Secret** | `BETTER_AUTH_SECRET` (dev value, injected) | `BETTER_AUTH_SECRET` (prod value, injected) | `BETTER_AUTH_SECRET` (injected) | `BETTER_AUTH_SECRET` (injected) |
| **Backblaze B2 Bucket** | `lemans-demo-attachments` | `lemans-prodlike-attachments` | `lemans-remote-demo-attachments` | `lemans-remote-prod-attachments` |

---

## 3. Remote Directory & Systemd Quadlet Paths

### Remote Demo Environment
- **Remote Demo Application Build Path**:
  `/home/jk/bridge-ph/lemans-demo`
- **Remote Demo Systemd Quadlet Path**:
  `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`
- **Remote Demo Backblaze Bucket**:
  `lemans-remote-demo-attachments`

### Remote Production Environment
- **Remote Production Application Build Path**:
  `/home/jk/bridge-ph/lemans`
- **Remote Production Systemd Quadlet Path**:
  `/home/jk/.config/containers/systemd/bridge-ph/lemans`
- **Remote Production Backblaze Bucket**:
  `lemans-remote-prod-attachments`

## 4. Required Secrets / Environment Variables

Each environment requires the following environment variables. Values are injected at container runtime via `Environment=` in Quadlet files or `environment:` in Compose files; they are **never committed to source control**.

| Variable | Purpose | Provider |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Container env |
| `BETTER_AUTH_SECRET` | Better Auth token signing secret | Secrets manager / env file |
| `BETTER_AUTH_URL` | Canonical app URL for Better Auth callbacks | `http://127.0.0.1:3000` (demo), proxy URL for remote |
| `B2_ENDPOINT` | Backblaze S3-compatible endpoint, e.g. `https://s3.us-west-004.backblazeb2.com` | Secrets manager / env file |
| `B2_REGION` | Backblaze region segment, e.g. `us-west-004` | Secrets manager / env file |
| `B2_ACCESS_KEY_ID` | Backblaze application key ID | Secrets manager / env file |
| `B2_SECRET_ACCESS_KEY` | Backblaze application key secret | Secrets manager / env file |
| `B2_BUCKET_NAME` | Target bucket name per environment | Per-environment env file |
