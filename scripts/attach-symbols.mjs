// Retired: the one-shot bootstrap map predates context-specific legend coverage.
// It could partially rewrite the source even after reporting failures.
// The current source is authoritative; never replay a second, stale ID map.
console.error('Retired one-shot: no files changed. Edit src/reference-formulas.js and its explicit coverage review, then run npm test. See docs/formula-legend-coverage.md.');
process.exitCode=1;
