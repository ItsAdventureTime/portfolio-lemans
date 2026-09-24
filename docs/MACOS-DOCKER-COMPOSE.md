# Deploy the portfolio demo on the Mac mini

**Status:** Compose implementation is committed and awaits independent
validation; external network, R2 resources, and public deployment remain
unverified. Complete and review
[`agent/HANDOFF.md`](./agent/HANDOFF.md) first. This guide is for
`https://lemans.delegateops.business/`, not the old VPS or a production profile.

OrbStack runs Next.js, Go, and PostgreSQL. The existing `cloudflared` container stays in its own project and reaches only the Le Mans web service on a shared Docker network. R2 stores demo proof files using its S3 compatible API. [OrbStack Compose support](https://docs.orbstack.dev/docker/), [Docker Compose networking](https://docs.docker.com/compose/how-tos/networking/), [Cloudflare published applications](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/).

Compose uses local Dockerfile builds, required shell-variable interpolation,
and file-backed secrets. See the official [Compose build
reference](https://docs.docker.com/reference/compose-file/build/) and
[variable interpolation guide](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
(checked 2026-09-24).

## 1. Check the existing Mac and tunnel

On the Mac mini, confirm OrbStack and the Docker CLI work:

```sh
docker context show
docker compose version
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Networks}}'
```

Find the actual Docker network joined by the running `cloudflared` container and inspect it with `docker network inspect NETWORK_NAME`. Export its exact name as `CLOUDFLARED_NETWORK`; Compose rejects an unset value. The web service joins that external network with alias `lemans-web`. Keep API and database on the private Le Mans network only. Leave Linkwarden, Vaultwarden, DocuSeal, and the existing tunnel project unchanged. If there is no suitable shared network, resolve that first; do not expose the API or database to work around it.

## 2. Create an R2 bucket and scoped keys

In the [Cloudflare dashboard](https://dash.cloudflare.com/), open **R2 object storage**. Create a private demo bucket such as `portfolio-lemans`, or confirm that one exists. Record the Cloudflare account ID and bucket name. Create an R2 API token scoped to object read/write for this bucket. Copy its **Access Key ID** and **Secret Access Key** once. The Go API uses `https://ACCOUNT_ID.r2.cloudflarestorage.com`, region `auto`, and a demo-only prefix such as `lemans/demo`. Do not put keys in Git, `compose.yaml`, command arguments, or a `.env` file. [R2 S3 setup](https://developers.cloudflare.com/r2/get-started/s3/), [R2 API tokens](https://developers.cloudflare.com/r2/api/tokens/).

Current DCS proof upload runs in a Next.js server action. Browser CORS is not needed for that request. If the implementation moves a signed `PUT` or `GET` into the browser, add a bucket CORS rule for exactly `https://lemans.delegateops.business`, the used methods, and sent headers such as `Content-Type`, then test it. Keep the bucket private. [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/).

In the bucket settings, add an enabled object lifecycle rule for prefix
`lemans/demo/` that deletes objects after 30 days. DB seeding does not delete
R2 objects. Expired R2 objects are typically removed within 24 hours and may
take longer. Confirm the rule is present before opening the public demo.
[R2 object lifecycle rules](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).

## 3. Store secrets outside the repository

Create a private directory on the Mac. `LEMANS_SECRET_DIR` is a path, not a credential; it is only for Compose interpolation. Do not create a `.env` file. The Compose file requires `LEMANS_SECRET_DIR`, `CLOUDFLARED_NETWORK`, and `R2_ENDPOINT` from the shell environment.

```sh
export LEMANS_SECRET_DIR="$HOME/Library/Application Support/lemans-demo/secrets"
mkdir -p "$LEMANS_SECRET_DIR"
chmod 700 "$LEMANS_SECRET_DIR"
openssl rand -hex 32 > "$LEMANS_SECRET_DIR/db_password"
chmod 600 "$LEMANS_SECRET_DIR/db_password"
```

Use a trusted editor or password manager to write the R2 Access Key ID to `r2_access_key_id` and the Secret Access Key to `r2_secret_access_key` in this directory. Each file holds only its value and an optional trailing newline. Set and inspect permissions without printing values:

```sh
chmod 600 "$LEMANS_SECRET_DIR/r2_access_key_id" "$LEMANS_SECRET_DIR/r2_secret_access_key"
ls -ld "$LEMANS_SECRET_DIR"
ls -l "$LEMANS_SECRET_DIR"/{db_password,r2_access_key_id,r2_secret_access_key}
```

The directory should show `drwx------`; each file should show `-rw-------`. The reviewed Compose file must mount each secret only into services that need it. [Docker Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/).

## 4. Configure and build the demo

After the Luna implementation passes review, export the actual tunnel network and account-specific R2 endpoint. Keep credentials in secret files. Compose supplies `NEXT_PUBLIC_BASE_PATH=""` at **web build time** and runtime. A runtime variable alone cannot correct a previously built Next.js base path. [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).

From the repository root on the Mac mini:

```sh
export COMPOSE_DISABLE_ENV_FILE=1
export LEMANS_SECRET_DIR="$HOME/Library/Application Support/lemans-demo/secrets"
export CLOUDFLARED_NETWORK='the-existing-network-name'
export R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"
docker compose config --quiet
docker compose build web api
docker compose up -d db api web
docker compose ps
```

The build runs in OrbStack on the Mac mini. A GitHub push alone does not update these containers. If a secret or external network is missing, fix it before starting. Never use `docker compose down -v` for an ordinary update: it deletes the database volume.

## 5. Seed and check private services

Run the internal one-shot seed command only for initial setup or a planned reset. It replaces demo database records and is not exposed by the public proxy.

```sh
docker compose exec web node -e "fetch('http://127.0.0.1:3000/').then(r => { console.log(r.status); process.exit(r.ok ? 0 : 1) }).catch(e => { console.error(e); process.exit(1) })"
docker compose exec web node -e "fetch('http://api:8080/health').then(r => { console.log(r.status); process.exit(r.ok ? 0 : 1) }).catch(e => { console.error(e); process.exit(1) })"
docker compose ps
docker compose run --rm seed
```

Expect HTTP `200` for both health checks. Confirm no host port mapping for `api` or `db`. Verify that `POST /api/proxy/admin/seed` returns `404` and records remain unchanged. The demo's entry cookie and role switcher are not authentication.

## 6. Route the public hostname

In Cloudflare, open **Networking > Tunnels**, select the existing healthy tunnel, and add a **Published application** route. Set hostname `lemans.delegateops.business`, HTTP service URL `http://lemans-web:3000` (or the reviewed alias), and no path prefix. The connector and web container must share the network found in step 1. Save the route and confirm the hostname's DNS record targets this tunnel. Do not route to `127.0.0.1` inside `cloudflared`, the Go API, the database, or another homelab service. [Cloudflare published applications](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/).

Open `https://lemans.delegateops.business/`. Check the branded splash, Enter as an Admin, all six roles, a complete job workflow, and R2 proof upload/download.

## 7. Update, reset, and recover

For a later reviewed commit, update the Mac checkout of `main`, then rebuild and restart only this Compose project:

```sh
docker compose build web api
docker compose up -d db api web
docker compose ps
```

Recheck `/`, Go health, a role workflow, and R2 proof. Preserve the PostgreSQL volume. Reset records only with the reviewed one-shot seed command. Use an R2 lifecycle rule or reviewed cleanup procedure for demo-prefixed objects; database seeding does not delete R2 files. If an update fails, return to prior known-good image tags and keep the database volume. Code rollback does not reverse a database migration.

The implementer must replace this planning status with verified commands and results before calling the guide operational.
