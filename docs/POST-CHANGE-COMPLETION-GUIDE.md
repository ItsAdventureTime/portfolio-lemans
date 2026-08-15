# Post-change completion guide

- **Status**: Current repository operating standard
- **Updated**: 2026-08-16
- **Scope**: Every Le Mans source, UX, documentation, script, configuration, or deployment change

Use this guide after every completed update. It keeps the implementation,
active documentation, local `main`, and GitHub `main` aligned before the work is
reported as complete.

## Standard sequence

1. **Research current guidance.** Search authoritative documentation for the
   frameworks, libraries, accessibility practices, deployment behavior, or Git
   workflow affected by the change. Record only relevant sources in the
   affected guide; do not copy fast-moving claims into application code.
2. **Inspect before editing.** Check the current source of truth, preserve
   unrelated work, and confirm the repository is on `main`.
3. **Implement the complete change.** Keep Le Mans branding, behavior, and
   architecture consistent with the active project documents.
4. **Update documentation in the same change.** Update or remove stale active
   guides, scripts, configuration references, verification evidence, and
   links. Keep historical material under `to-review-and-delete/`.
5. **Validate in the project sandbox.** Use `jk-sbx-project exec` for builds,
   tests, linting, type checks, and application execution. Use the smallest
   relevant validation set and record the commands actually run.
6. **Commit the validated snapshot locally.** Use `git add` and `git commit`
   on `main`. GitHub CLI has no local commit command, so this local `git`
   primitive is the required exception to the GitHub-facing CLI rule.
7. **Synchronize GitHub through authenticated HTTPS.** Configure the GitHub
   CLI credential helper, push `main`, and do not use SSH remotes, SSH keys,
   passkeys, or another GitHub transport:

   ```bash
   gh auth status --hostname github.com
   gh auth setup-git --hostname github.com
   git push origin main
   ```

   The repository remote must remain the HTTPS remote for
   `ItsAdventureTime/bridge-lemans`. GitHub-facing authentication, remote
   inspection, API checks, and synchronization use `gh`.
8. **Verify parity before handoff.** Confirm the worktree is clean, local
   `main` is current, and the GitHub `main` commit SHA matches the local SHA:

   ```bash
   test "$(git branch --show-current)" = main
   test -z "$(git status --porcelain)"
   LOCAL_SHA="$(git rev-parse HEAD)"
   REMOTE_SHA="$(gh api repos/ItsAdventureTime/bridge-lemans/commits/main --jq .sha)"
   test "$LOCAL_SHA" = "$REMOTE_SHA"
   printf 'main synchronized at %s\n' "$LOCAL_SHA"
   ```

## Branch rule

Keep work on `main`; do not create feature or review branches. If another
branch exists, inspect its protection and unique commits before removing it.
Never remove `main` or discard required work. Confirm the local and remote
branch lists through the project’s GitHub CLI workflow before handoff.

## Documentation rule

The affected active guide is part of the change, not a follow-up task. At a
minimum, review [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md),
[`CURRENT-STATE.md`](./CURRENT-STATE.md), and the relevant implementation or
deployment playbook. Apply [`WRITING-STYLE.md`](./WRITING-STYLE.md) to new
active text.

## Official guidance used

- [`gh auth setup-git`](https://cli.github.com/manual/gh_auth_setup-git)
  configures GitHub CLI as Git’s credential helper.
- [`gh auth login`](https://cli.github.com/manual/gh_auth_login) documents the
  HTTPS Git protocol option and authenticated host setup.
- [`gh auth status`](https://cli.github.com/manual/gh_auth_status) verifies the
  active authenticated account without exposing credentials.
- [`gh api`](https://cli.github.com/manual/gh_api) provides authenticated
  GitHub API checks for remote commit verification.
- [`Diátaxis`](https://diataxis.fr/) separates tutorials, how-to guides,
  reference material, and explanations; this document is a how-to guide.
