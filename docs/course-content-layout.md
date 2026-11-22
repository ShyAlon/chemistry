# Course content layout

This refactor changes file organization, not lesson content or learner behavior.

```text
src/content/
  courses.json                  Ordered course catalogue and course metadata
  84101/
    topics.json                 Ordered topic IDs and file references
    topics/
      G1.json                   Complete topic: metadata + content
      ...
  84102/ ...
  nano/ ...
  nuclear/ ...
```

The top-level catalogue has a `courses` array. Each entry keeps the existing
course metadata and replaces its inline `topics` array with `topicCatalogue`,
for example `84101/topics.json`. Each topic catalogue has a `topics` array of
`{id, file}` references, with paths relative to that course directory. Order is
explicit in both catalogues, never inferred from directory sorting.

Each individual topic file keeps its entire previous JSON object without changes:
ID, title, source references, spectrum, optional orbital data, and `content` with
`theory`, `worked` and `quiz` arrays. Question IDs remain scoped to their topic.
Topic IDs remain scoped to their course. Existing routes and progress keys do
not change.

## Reading content

Consumers import the catalogue using `#catalogue`. Package-local conditional
imports select the appropriate small adapter:

- The browser adapter (`src/catalogue.js`) eagerly bundles the JSON files using
  Vite. It introduces no runtime content requests or online dependency.
- The Node adapter (`scripts/content-store.mjs`) reads the same files for tests
  and content-editing scripts.
- Both call `assembleCatalogue` in `src/catalogue-contract.js`, which returns
  the same `{courses: [...]}` structure consumers previously read. It checks
  duplicate IDs/references, invalid paths, missing/unreferenced files, topic-ID
  agreement and the three required content arrays.

This is a structural contract, not a scientific verifier or a full course-import
pipeline. Existing content, answer, notation and browser tests still apply.

## Editing content

To update a topic, edit its topic JSON file. To add/reorder a topic, update its
course's `topics.json` explicitly. To add a course, add its metadata/reference to
the root catalogue and create its topic catalogue and topic files. Invalid or
orphaned entries fail validation rather than silently disappearing.

The existing enrichment and final-prep scripts read and write the split data
through `loadCatalogue` / `writeCatalogue`. Their writer permits content edits,
validates before writing, and avoids rewriting unchanged files. Structural edits
require explicit manifest changes; these scripts cannot silently reorder/add IDs.

**Legacy maintenance warning:** these scripts reconstruct authored layers and can
replace corrections or metadata added after those layers were written. Their
outputs were checked against the old monolithic versions, not certified as safe
for arbitrary content regeneration. They are not invoked by normal dev, build,
test, preview or CI commands. Do not use them as a new course-import step. Edit
individual topic files until a separately reviewed source-safe ingestion process
exists.

## Review checks

Run the existing `npm test` and `npm run build` gates. Browser tests still run
against the isolated Firebase test doubles; production builds still use the real
client packages. Refresh the committed recovery output locally in the same PR,
then run its snapshot check. CI must not silently generate a replacement backup.

The first split was checked by deep comparison of the fully reconstructed data
against the pre-refactor catalogue at main `477c1deaef64fbf8e956355c44b8a60ba700cf2e`:
4 courses, 50 topics, 372 topic-quiz questions. Its compact JSON SHA256 is
`00bb462e60aca11f0bc5a8734211db390d0bd21196bf5503e0b97d038a455f15`.
This is review evidence, not a rule preventing later approved content changes.

## Outside this refactor

Exam data modules, practice generators, formulas, glossaries and figures remain
where they are. No Firestore migration, account separation, behavior collection,
new exam mode, question rewording or dependency/runtime upgrade is included.
