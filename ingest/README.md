# Source-safe course ingestion

`scripts/import-course.mjs` is the only sanctioned path for adding or bulk-updating
course content. It ingests **reviewed, authored** topic JSON (same shape as the
split files under `src/content/<course>/`) that a person prepared from the source
materials. It never parses source PDFs and never generates teaching content.

Originals stay private: PDFs/slides are never committed. Only their SHA-256
hashes live here, in `ingest/<course>/sources.manifest.json`.

## Layout

```text
ingest/<course>/
  sources.manifest.json   Versioned {course, version, sources:[{file, sha256}]}
  corrections.json        Optional reviewed corrections, replayed over the base
  ledger.json             Written by the importer; the content state of record
```

A staged course is a directory with `course.json` (catalogue metadata),
`topics.json` (ordered topic refs) and `topics/<id>.json` files.

## Commands

```bash
node scripts/import-course.mjs baseline <course>                    # record current content as the ledger baseline (0 writes)
node scripts/import-course.mjs check    <course> --staged DIR [--sources DIR]
node scripts/import-course.mjs ingest   <course> --staged DIR --sources DIR   # NEW courses only
node scripts/import-course.mjs diff     <course> --staged DIR --report report.json
node scripts/import-course.mjs accept   <course> --staged DIR --report report.json
```

- `ingest` verifies every source file against the manifest hashes, refuses
  unlisted or blocklisted files, replays `corrections.json` (a correction whose
  target no longer matches fails the import), validates the whole catalogue,
  and writes only the new course's files plus its ledger.
- `diff` writes nothing. It classifies every differing block as
  `source-changed` (staged update over an untouched block), `conflict` (a local
  edit collides with the staged change), `added`, `removed`, `topic-added` or
  `topic-removed`.
- `accept` applies only entries the reviewer marked `decision:"accept"`.
  Conflicts also need `resolution:"take-staged"|"keep-current"`; without one
  the run fails closed and writes nothing. After applying, the ledger is
  rebuilt from the reconciled state.

The Cartoon Guide to Chemistry is on a hard blocklist inside
`scripts/import-lib.mjs` (owner decision, 2026-11-23). No manifest revision can
admit it. Adding or replacing sources otherwise requires a reviewed manifest
revision with fresh hashes.

## Guarantees and limits

- No build/test/CI step may modify `src/content`: `scripts/content-freeze.mjs`
  records and checks byte hashes; CI enforces it around the build.
- Existing courses were baselined (zero content change). The retired
  strip-and-reappend codemods (`apply-enrichment`, `apply-final-prep`) were
  deleted; the layer data files remain as live app data only.
- Block alignment is positional within each topic array; a heavily reordered
  re-import shows up as many added/removed entries for review, not as silent
  merges.
