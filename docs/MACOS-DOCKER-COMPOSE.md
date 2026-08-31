# Run the demo on macOS with Docker Compose

This guide runs the Le Mans demo on a Docker Desktop Mac and publishes only
the web service through an existing Cloudflare Tunnel. PostgreSQL remains on
the private Compose network. The Compose file uses Docker-managed secrets
whose values come directly from shell environment variables; no `.env` file is
needed.

## Prerequisites

- Docker Desktop for Apple silicon with Compose v2.
- A Cloudflare named tunnel and public hostname configured to forward to
  `http://web:3000`.
- The repository checked out on the Mac.

Set the two values in the current shell. Do not commit them or put them in a
file inside the repository:

```sh
export LEMANS_DB_PASSWORD="$(openssl rand -hex 32)"
export CLOUDFLARE_TUNNEL_TOKEN='replace-with-your-tunnel-token'
```

The macOS login Keychain is the recommended place to keep these values. You
can retrieve them immediately before startup with `security
find-generic-password` and export the output, using the service names you
choose when storing the items:

```sh
export LEMANS_DB_PASSWORD="$(security find-generic-password -s 'lemans/db-password' -w)"
export CLOUDFLARE_TUNNEL_TOKEN="$(security find-generic-password -s 'lemans/cloudflare-tunnel-token' -w)"
```

## Validate and start

Run the structural check first. It uses placeholders when the variables are
not set and does not start containers:

```sh
./scripts/verify-compose.sh
./scripts/start-compose.sh
```

The first startup builds the Alpine-based Next.js and Go images, starts
PostgreSQL 16 on its named volume, runs Go migrations, seeds demo data, and
starts the web and `cloudflared` services. The web service has no host port;
the tunnel is its only ingress.

In the Cloudflare Tunnel dashboard, configure the public hostname's service as
`http://web:3000`. Cloudflare preserves the request path, so open
`https://your-hostname/demo/lemans/`; do not include `/demo/lemans` in the
origin service URL.

Check service state with:

```sh
docker compose ps
docker compose logs -f cloudflared
```

Open the hostname configured in Cloudflare after the tunnel reports a healthy
connection. The demo entry screen is at `/demo/lemans/`.

## Stop and reset

Stop services while retaining database data:

```sh
docker compose down
```

To discard the demo database volume and reseed from scratch, use the explicit
project-scoped command:

```sh
docker compose down -v
```

This deployment is intended for a continuously available Mac mini. Add
Cloudflare Access before sharing the hostname; the demo's role switcher is not
authentication.
