# Run the demo on macOS with Docker Compose

This guide runs the Le Mans demo on a Docker Desktop Mac and publishes only
the web service through a native macOS Cloudflare Tunnel. PostgreSQL remains
on the private Compose network. The Compose file uses one Docker-managed
secret whose value comes directly from a shell environment variable; no `.env`
file or helper script is needed.

## Prerequisites

- Docker Desktop for Apple silicon with Compose v2.
- `cloudflared` installed on macOS.
- A Cloudflare named tunnel and public hostname configured to forward to
  `http://127.0.0.1:3000`.
- The repository checked out on the Mac.

Set the database password in the current shell. Do not commit it or put it in
a file inside the repository:

```sh
export LEMANS_DB_PASSWORD="$(openssl rand -hex 32)"
```

The macOS login Keychain is the recommended place to keep this value. You
can retrieve it immediately before startup with `security
find-generic-password` and export the output, using the service names you
choose when storing the items:

```sh
export LEMANS_DB_PASSWORD="$(security find-generic-password -s 'lemans/db-password' -w)"
```

## Validate and start

Validate the Compose file with a safe temporary value, then start the demo:

```sh
LEMANS_DB_PASSWORD=compose-validation-only docker compose config
docker compose up -d --build
docker compose ps
```

The first startup builds the Alpine-based Next.js and Go images, starts
PostgreSQL 16 on its named volume, runs Go migrations, seeds demo data, and
starts the web service. The web service is published only on macOS loopback at
`127.0.0.1:3000`; the tunnel is its only external ingress. The API and
PostgreSQL ports are not published.

In the Cloudflare Tunnel dashboard, configure the public hostname's service as
`http://127.0.0.1:3000`. Because `cloudflared` runs natively on macOS, it must
use the host loopback address, not the Docker-only name `web`. Cloudflare
preserves the request path, so open `https://your-hostname/demo/lemans/`.

Start the native tunnel in another macOS terminal using the existing named
tunnel configuration:

```sh
cloudflared tunnel run YOUR_TUNNEL_NAME
```

Check service state with:

```sh
docker compose ps
docker compose logs -f web
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
