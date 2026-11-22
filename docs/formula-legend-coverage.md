# Formula legend coverage

A nonempty, valid list of symbol IDs is not proof that a legend explains its expression.
This guard runs in `npm test` and therefore in the existing CI workflow. It does not run
in the app, infer physical meanings, or change formula rendering.

## What is reviewed

`tests/formula-coverage-review.json` contains 79 explicitly reviewed string display
occurrences: the original 46 repaired theory/reference records, shared temperature
conversion and affected worked steps, plus 29 rows on the separate supplied-handout
page and four formula displays in the two-section read-aloud trial. Each record declares:

- the exact reviewed expression and context explanation;
- every quantity token and the intended context-specific `SYMBOLS` ID;
- typed units, functions and notation labels that are not quantity bindings;
- the allowed context rows, including intentionally shared exercise rows;
- hashes of the actual reviewed definition bodies, not only their display glyphs.

The scanner uses these declarations to classify the entire expression. It never chooses
an ID from a letter. Removing a binding leaves an unclassified token; removing a required
ID fails even when the remaining list is nonempty. Same-letter substitutions such as
heat-at-fixed-volume for vaporization heat, dipole energy for absorbed energy, or mole
amount for quantum number fail. The original repair tests exercise all 27 defective lists, 144 original single-binding
removals, and 132 original required-ID removals. Those removal tests now also cover
the new page, including its single-symbol legends.

## The legacy boundary is deliberate

The other 513 string display occurrences are explicitly **unreviewed legacy**, not
certified complete. Their full source metadata and referenced definitions are locked
against changes. A new, changed, moved or deleted record fails until reviewed. Do not
refresh a legacy hash to make a failure disappear. Promote the affected record to an
explicit coverage contract, review its scientific context and aliases, and update the
count assertion with the review. Extending coverage to the full legacy inventory is
separate work; a green test does not prove all chemistry legends correct.

Human review remains necessary. Deliberately misclassifying a quantity as a literal,
or approving an incorrect scientific binding in the contract, can still encode a bad
review. The tests prevent silent drift around the reviewed contract, not all possible
scientific mistakes.

## Editing a formula

1. Identify the source occurrence, its exact expression and intended units/context.
2. Follow actual symbol IDs into `src/symbol-defs.js`. Do not look up a generic definition
   merely because its displayed letter resembles the expression.
3. Reuse a definition only when its meaning and units match. Otherwise add a specific ID.
   Do not change a shared definition's meaning to fix one unrelated context.
4. Declare each quantity token, including subscripted forms and reviewed display aliases.
   Mark units/functions/labels explicitly; do not use a prose-label exemption for quantities.
5. Review the allowed context rows. Shared exercise legends may retain quantities used in
   other steps; an unrelated row is not justified merely by being allowed in an old list.
6. Keep `src/notation-blocks.json` in sync for converted theory records. The tests replay
   each of the 17 repaired theory records in isolated fixtures. The existing full
   enrichment-replay test remains in place.
7. Review any affected definition body before updating its digest. Never create those
   hashes as a substitute for reading the definitions.
8. Run `npm test`, the browser/build checks, and inspect mobile/desktop/print output.

`scripts/attach-symbols.mjs` was a one-shot bootstrap with a stale parallel ID map.
It is retired and now exits without reading or writing content. Edit the authoritative
reference records and their coverage review instead.

## The separate supplied-handout page

The 29 new rows are collected from `professor-formulas-84101.js`. Their coverage
expressions resolve the central constant variants exactly as the formula renderer
does, so changed printed precision or units cannot hide behind an unchanged placeholder.
Each row has its own reviewed context, quantity bindings and typed units/functions.
The scanner also accepts the authored power operator used in these rows.

Mathematical pi and the exponential base have their own page-specific definitions,
separate from osmotic pressure. Henry's pressure label matches its displayed P, and
the temperature conversion explicitly includes Celsius t. No pre-existing definition
body was changed. Tests reject wrong-context substitutions and changes to every new
sheet-specific definition meaning. The original PDF and its preview assets are not
part of the application change.

## This repair's boundaries

The audit retains original entry #27 as withdrawn: `M@gas-average` was already correct
and is unchanged. Entry #19 is a label mismatch, not a missing temperature meaning.
The generic model-substance phase contexts lose the unused water-only saturation row;
the water-specific definition remains available for humidity. The exam phase context
also gains the missing plain `P` pressure binding used in its final step.

No equations, numerical constants, worked answers, compact keyless print behavior,
backend settings or interactive formula-page code are changed by this repair.

The longer corrected key also exposed stale desktop popup placement after native focus
scrolling and sidebar reflow. The repair refreshes the existing placement calculation
on scroll, resize and observed reflow, with cleanup on close. A browser regression checks
five legend rows, header/viewport bounds, later scrolling and Escape. No CSS or equation
formatting is changed.

## Limited read-aloud trial

The three density expressions and the temperature conversion each have an explicit
read-aloud display record, with quantity bindings and typed temperature units.
Density uses rho, mass and the context-specific volume V#2; the conversion uses
absolute Kelvin temperature T and Celsius t, not time. The same source text is
retained for provenance, and the spoken equivalents are authored separately.
All 513 legacy hashes and all existing definition bodies remain unchanged.
