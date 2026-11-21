# Matching recovery copy in each PR

A content PR includes its matching production backup. There is no second backup-only PR and no automatic repository write from CI.

Before committing the final candidate:

1. Run the existing production build and every test/browser/offline gate.
2. Run `python3 scripts/release-output.py refresh-snapshot` locally.
3. Review and commit the two generated `known-good` files with the code.
4. Run the complete gate again on that exact commit, including `python3 scripts/release-output.py check-snapshot`.

CI checks the saved copy against every production output byte before packaging. Promotion checks it against the verified artifact again. A stale copy fails validation instead of being silently replaced. If code, tests, docs, build configuration or other tracked files change after refresh, refresh it again. Only the two generated backup files are excluded from the source identity.

The source identity hashes tracked paths, executable modes and file contents. It is stable across merge commits and excludes the generated backup to avoid a self-referential final commit SHA. This is build provenance, not a claim that this candidate was already deployed. The successful PR run, merge and promotion establish that separately.

The ZIP is deterministic: fixed member timestamps, sorted paths and fixed file modes. Its record includes the archive hash, source identity, site origin and generated service-worker version. No secrets, source files, runtime URL or uploaded script are accepted by snapshot restore.

Manual `restore-snapshot` is a separate owner-approved operation. It uses the fixed reviewed backup from current main, verifies its current-source identity and hashes, and publishes without npm or rebuilding. An out-of-date checkout or stale source identity fails closed. The existing explicit retained-artifact restore remains available for an approved historical recovery while that artifact exists.

After a normal release, verify the served files against the tested output before calling it complete. A recovery trial and repository visibility change still require separate approval. This mechanism does not promise that private GitHub Actions will be admitted when compute allowance is exhausted.
