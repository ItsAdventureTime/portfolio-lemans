# Portfolio demo implementation notes

**Date:** 2026-09-24  
**Implementation owner:** GPT-6 Luna (High)  
**Next owner:** Mac mini operator, then GPT-6 Sol (Medium) for live acceptance

## Deviations

- No Cloudflare account, R2 bucket, API keys, tunnel network, or Mac mini
  deployment was accessed. Those are external operator resources and remain
  unverified.
- The R2 proof upload/download could not be exercised against a real bucket.
  The operator must provide a real account endpoint and scoped keys before
  live proof verification. The code uses existing Go S3 presigning and requires
  `R2_ENDPOINT` plus three external secret files at Compose time.
- Installed production dependencies had a critical Next.js AVIF image
  optimization RCE and high-severity `sharp`/libheif advisory. Updated Next.js
  and `eslint-config-next` to `16.3.6`, and the lockfile to `sharp` `0.35.4`.
  Both packages retain their existing npm maintainers and registry signing key.
  Next.js `16.3.6` was published 2026-09-22; `sharp` `0.35.4` was published
  2026-08-26. A dev-only `js-yaml` advisory was found and its lockfile version
  updated from `4.3.1` to patched `4.3.2` (same maintainer and runtime
  dependency list). npm then reported zero vulnerabilities; Sol must confirm
  on the new commit.
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
  directory mode `700`. The 2026-09-25 review prepared a Git-ignored workspace
  `secrets/` directory with a random DB password and R2 placeholders. Docker
  builds also ignore the directory. Keys must be replaced by the operator.
- Configure an R2 lifecycle rule for `lemans/demo/` to expire objects after 30
  days. The database seed does not remove R2 objects; expiry can take 24 hours
  or longer.
- Luna did not run review, tests, builds, or validation per the assigned role.
  Sol should validate each new committed follow-up. Use
  throwaway non-secret values for local Compose config and smoke checks; never
  use or print real credentials in the sandbox.
- Sol's first validation attempt against commit `63c8b0f` found invalid mixed
  list/map syntax under `web.networks`; that failed `docker compose config
--quiet`. The network now uses mapping syntax. Sol also found the documented
  `ACCOUNT_ID` R2 endpoint placeholder passed Compose interpolation; Go config
  now rejects non-account-specific R2 endpoints when region is `auto`, with a
  focused regression case. Validate the follow-up HEAD; neither fix has been
  checked by Luna.
- On `9cceb53`, Sol confirmed Go tests, lint, typecheck, Next.js build, Compose
  config, image builds, seed/proxy smoke, DB persistence, and controlled seed
  reset. Prettier and the base-path test failed; Luna formatted the reported
  files and changed the test to use the already-installed TypeScript compiler
  API instead of Node's unsupported `--experimental-strip-types` runtime. These
  fixes, dependency updates, and docs required a fresh validation run.
- On `b0180d8`, Sol confirmed Go tests, formatting, lint, typecheck, both
  base-path modes, Next.js build, Compose builds, seed/proxy smoke, and DB
  persistence/reset. Production audit had zero findings. Full audit found one
  high dev-only `js-yaml` advisory; Luna updated it from 4.3.1 to patched 4.3.2.
  `16bef3f` fresh `npm ci`, formatting, lint, typecheck, both base-path modes,
  Next.js build, and web image build passed. Full and production audits report
  zero vulnerabilities, with `js-yaml` 4.3.2. `npm audit signatures` still
  fails for `clsx@2.1.1` because its registry signing key expired 2025-01-29;
  this is not evidence of tampering, but signature verification remains
  incomplete.
- The second Sol reviewer started `scripts/verify-e2e.sh` in the validation
  Sandbox. The legacy demo reached `/demo/lemans`, but pulling the official
  Playwright/Chromium image failed with `no space left on device`; zero browser
  tests ran. The Sandbox reported 6.355 GB reclaimable build cache and 2.4 GB
  free after the failed pull. No broad cache cleanup or retry was performed.
  The targeted stop script removed only the named demo app/API/DB containers;
  the data volume remains. The existing suite targets `/demo/lemans`, not the
  root-base-path Compose target.
- Validate Compose configuration, both image builds, Go tests, frontend format,
  lint, typecheck, base-path tests, and Next.js build. If the sandbox can test
  Compose safely, use an isolated external test network and verify seeding,
  `/` response, allowed `/api/` proxying, rejected public seed call, and zero
  published API/DB ports. Do not bootstrap browser tooling in the implementation
  lane; rendered/visual QA belongs to independent review.
- Real R2 proof upload/download and actual tunnel routing remain pending until
  the operator provides external resources. Do not access or modify the Mac
  mini, Cloudflare, DNS, or legacy VPS as part of this handoff.
- GitHub `main` was synchronized over HTTPS after local acceptance checks; local
  and remote `main` match. Only `main` exists locally and remotely. No public
  deployment was performed.

## Sources checked

- [Docker Compose build reference](https://docs.docker.com/reference/compose-file/build/)
- [Docker Compose variable interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Cloudflare R2 object lifecycle rules](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [PostgreSQL official image](https://hub.docker.com/_/postgres)
- [PostgreSQL version policy](https://www.postgresql.org/support/versioning/)
- [Next.js AVIF image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
- [Next.js `next/og` advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j)
- [sharp/libheif advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c)
- [js-yaml advisory](https://github.com/nodeca/js-yaml/security/advisories/GHSA-2883-xcg3-v3hh)
