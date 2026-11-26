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

## Advisory source preprocessing (default during preparation)

Whenever `check` or `ingest` verifies a `--sources DIR`, an advisory
preprocessing step runs automatically (`scripts/preprocess-sources.mjs`,
opt out with `--no-preprocess`). It extracts each source PDF once into a
PRIVATE cache outside the repo (default `~/.cache/spectra-preprocess`) and
prints review leads: text-layer equation lines classed as `balanced`,
`balanced-ambiguous` (the plain-text charge notation is ambiguous and a
person must decide which reading the slide meant), `unbalanced`, `unparsed`,
`notation` or `fragment`, plus arithmetic mismatches in simple `a op b = c`
lines. Repeat preparations reuse the cache; a changed source (new SHA-256)
re-extracts, and the cache identity carries the tool version, image DPI and
extraction mode so a config change never silently reuses stale pages.

Limits: leads only, never science sign-off; the human review and release gate
above are unchanged. Equations drawn inside slide images are invisible to the
text-layer check (the cached page images are the review mechanism there).
Arithmetic coverage is whatever simple equality lines the slides happen to
contain - usually very few - and is not meaningful verification by itself.

Standalone use: `node scripts/preprocess-sources.mjs --sources DIR [--cache DIR] [--report FILE]`.
(No npm-script alias is provided on purpose: `package.json` is bound into the
reviewed coverage hashes, so it must not change outside a review.)
Cache and report paths inside the repo are refused (symlink-safe: paths that
reach the repo through a symlinked parent or an existing symlinked cache dir
are refused too). Sources are only read; neither they nor the cache ever enter
the repo. If python3/pymupdf is missing or a source cannot be processed, the
step prints a note and preparation continues unchanged (exit 0).

Privacy: the cache holds extracted private slide text and page images, and a
`--report` file holds source equation lines. Both live only outside the repo
(the default cache is `~/.cache/spectra-preprocess`), are retained for reuse
across runs, can be deleted at any time, and must never be committed, shared
or attached anywhere. Known honest limit: a split line whose left side mixes a
lone charge fragment with real species (e.g. `2- + H+ → ...`) is evaluated
without the broken-off charge, so a rare false flag is possible there; the
leads list always stays advisory for exactly this reason.

Bounded execution (tested bounds, not absolute guarantees): each PDF run is
limited to 300 s and killed with SIGKILL (a child that traps SIGTERM is still
stopped), the step stops starting new sources after a 15-minute total budget,
and the importer applies a generous outer bound around the whole step. In
every one of these cases preparation prints a note and continues unchanged.
Overrides for tests: `PREPROCESS_TIMEOUT_MS`, `PREPROCESS_TOTAL_BUDGET_MS`,
`IMPORT_PREPROCESS_TIMEOUT_MS`.

Honest residual limit: when the importer's OUTER bound stops the step, the
wrapper's in-flight python child is orphaned (not process-group killed) and
can keep writing into the private cache after preparation has moved on. Cache
directories are written meta-last, so a partial directory has no meta.json and
the next run re-extracts it; still, do not start another preprocessing run
against the same cache immediately after such an outer timeout.

## Re-import alignment: stable keys, order consent, ledger v2

`diff` and `accept` align current and staged blocks by a stable key, not by
position, so an insert, delete or reorder no longer shifts every later block.

- **Keys.** Theory and quiz blocks need an `id` (key `i:<id>`). Worked
  examples use their `title` (key `t:<title>`); an untitled worked example
  falls back to a hash of its content (`h:<hash>`), so editing an untitled
  worked example reads as one removed plus one added block.
- **Fail closed.** If any block in an array lacks a key while others have one
  (mixed), or a key appears twice on either side, `diff` aborts before any
  write. Arrays where no block has a key use the legacy positional rules.
- **Consent per decision.** Each report entry is decided on its own (decision
  identity includes the block key), so a local-only conflict and a staged
  conflict at the same index never overwrite each other. `skip` is honored.
- **Order is its own entry.** A `reordered` entry appears whenever shared
  blocks sit in a new order. Existing blocks change order only if that entry
  is accepted. Without it, accepted inserts land before their earliest staged
  successor and the current order is kept. With it, staged order applies, and
  a removal you did not accept stays before its current successor.
- **Ledger v2.** The ledger records a hash lookup of delivered blocks
  (`ledgerVersion: 2`). Version 1 ledgers still read.
