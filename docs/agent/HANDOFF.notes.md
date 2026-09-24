# Portfolio demo implementation notes

**Date:** 2026-09-24  
**Implementation owner:** GPT-6 Luna (High)  
**Next owner:** GPT-6 Sol (High), independent review and validation

## Deviations

- No Cloudflare account, R2 bucket, API keys, tunnel network, or Mac mini
  deployment was accessed. Those are external operator resources and remain
  unverified.
- The R2 proof upload/download could not be exercised against a real bucket.
  The operator must provide a real account endpoint and scoped keys before
  live proof verification. The code uses existing Go S3 presigning and requires
  `R2_ENDPOINT` plus three external secret files at Compose time.
- PostgreSQL 18 uses a new named volume, `lemans_postgres_data_pg18`. It is not
  compatible with the old PostgreSQL 16 data volume; no data migration or
  volume removal was performed.

## How the run ended

- Compose now builds the web and Go images, uses the root Next.js base path,
  puts API and DB only on an internal network, and joins the web service to an
  operator-selected external tunnel network. API and DB have no published
  ports.
- `seed` is an explicit one-shot service on the internal network. It calls
  `/admin/seed` on the Go API. The public Next.js proxy forwards only paths
  beginning with `/api/`.
- Operator setup must define `LEMANS_SECRET_DIR`, `CLOUDFLARED_NETWORK`, and
  `R2_ENDPOINT` in the shell. Secret files are `db_password`,
  `r2_access_key_id`, and `r2_secret_access_key`, each mode `600` under a
  directory mode `700` outside the repository.
- Configure an R2 lifecycle rule for `lemans/demo/` to expire objects after 30
  days. The database seed does not remove R2 objects; expiry can take 24 hours
  or longer.
- Luna did not run review, tests, builds, or validation per the assigned role.
  Sol should run `jk-sbx-project validate` against this committed change. Use
  throwaway non-secret values for local Compose config and smoke checks; never
  use or print real credentials in the sandbox.
- Sol's first validation attempt against commit `63c8b0f` found invalid mixed
  list/map syntax under `web.networks`; that failed `docker compose config
  --quiet`. The network now uses mapping syntax. Sol also found the documented
  `ACCOUNT_ID` R2 endpoint placeholder passed Compose interpolation; Go config
  now rejects non-account-specific R2 endpoints when region is `auto`, with a
  focused regression case. Validate the follow-up HEAD; neither fix has been
  checked by Luna.
- Validate Compose configuration, both image builds, Go tests, frontend format,
  lint, typecheck, base-path tests, and Next.js build. If the sandbox can test
  Compose safely, use an isolated external test network and verify seeding,
  `/` response, allowed `/api/` proxying, rejected public seed call, and zero
  published API/DB ports. Do not bootstrap browser tooling in the implementation
  lane; rendered/visual QA belongs to independent review.
- Real R2 proof upload/download and actual tunnel routing remain pending until
  the operator provides external resources. Do not access or modify the Mac
  mini, Cloudflare, DNS, or legacy VPS as part of this handoff.

## Sources checked

- [Docker Compose build reference](https://docs.docker.com/reference/compose-file/build/)
- [Docker Compose variable interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Cloudflare R2 object lifecycle rules](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [PostgreSQL official image](https://hub.docker.com/_/postgres)
- [PostgreSQL version policy](https://www.postgresql.org/support/versioning/)
