# General Chemistry I: final preparation, 20 November 2026

> Maintenance note, 22 November 2026: the legacy layer-reapply commands described below can replace later corrections or metadata. They are not part of normal dev/build/test/preview or CI. Do not use them as a general course-import process. See [current content layout](course-content-layout.md).


## Approved scope

Exam date: Thursday, 3 December 2026. Real gases first. Keep all 16 topic IDs, all prior question IDs and saved answers, and the auth/chat behavior. No uploaded course PDFs, lecturer artwork or answer keys are published. The new numerical scenarios, solutions and calculated diagram are original teaching adaptations, not an official key.

## Teaching changes

Four existing topics are extended with a marked `finalPrep` layer. There is no new course or replacement lesson. There are 14 worked examples and 19 append-only quiz questions, plus eight new three-part exam problems E9-E16. The original eight exam objects remain unchanged. The exam page puts the four new real-gas problems first; data IDs remain stable. Count labels derive from the data, not a hardcoded eight.

- G10: 6 worked examples, 8 quiz questions. Choosing the model; total versus molar volume; the two pressure corrections; direct and inverse Z; parameter fitting using two fixed-volume measurements; Boyle temperature and the surviving quadratic density correction; mixture density before separation; reaction extent before compression; phase/model validity.
- G12: 2 worked examples, 3 quiz questions. Determine BCC/FCC from density and radius; reverse density to radius; distinguish atoms per cell from coordination number; convert pm to cm before cubing.
- G13: 2 worked examples, 3 quiz questions. Vapor pressure followed by phase decisions; limits of constant-enthalpy Clausius-Clapeyron; saturated water mass with the gas-space volume explicit; both conditions for a supercritical fluid.
- G15: 4 worked examples, 5 quiz questions. Multiple solutes and three different denominators; secondary partial dissociation, charge balance, and i versus alpha; equal vapor pressures; two-solvent inference of molar mass and i.

## Seven-source coverage map

Physical PDF pages are used. Original files remain private. Mapping is by skill, not by copied question wording or a claim that each original question has a new duplicate.

| Supplied material | Pages/questions | Existing coverage retained | New work / decision |
| --- | --- | --- | --- |
| Recitation 5a, kinetic theory, 42 pages | pp2-19: energies, three speeds, Maxwell finite bands and ratios; pp20-41: diffusion/effusion and early effusate | G10 theory, batch2 worked examples and quizzes; exam E2 | No duplicate kinetic lesson. Distinguish finite-band probability from probability density and translational energy from total internal energy. |
| Recitation 5b, real gases, 29 pages | pp2-8: model, Z, a/b and Boyle; pp9-18: mixture, separation, compression; pp19-28: unknown a from Z and changed states | G10 base equation/Z and prior direct numerical example | New G10 real-gas layer; original derived exam E9-E12. |
| Recitation 6a, 23 pages | pp2-9: forces; pp10-15: phase diagrams and Clausius-Clapeyron; pp16-23: concentrations, Raoult and distillation | G11-G14; E3, E6, E7 | G13 pressure-to-phase practice and approximation warning. Do not import the artwork or another full Raoult lesson. |
| Nuclear Chemistry PPT, 62 slides | 1-26 structure/stability/BE; 27-44 decay; 45-58 fission/fusion; 59-62 applications/radiation | G16 and E5, matching existing supplement source map | No duplicate G16. Preserve already-reviewed corrections. |
| Sample questions, 6 pages | Q1/4/7/9/10/12 combustion and gas bookkeeping; Q2/5/7 kinetic theory/heat/real gas; Q3/6/8/11/13 solution properties; Q14/15 nuclear | G3-G16; E1-E8 | Use as a skill checklist. New linked real-gas, mixed-solute and partial-dissociation work supplements it. Not every source subpart is solved or copied. |
| Homework 6a+b, 4 pages | Q2 forces; Q3-6 vapor/Clausius/phase; Q7-9 crystals; Q10-15 colligative inference; Q16-17 dew/bubble; Q18 vapor equilibrium; Q19-20 inverse Raoult/nonideality; Q21 secondary dissociation; Q22 Raoult | G11-G15, E3/E4/E6/E7 | G12 inversions; G13 phase/saturation; G15 multiple-solute, two-solvent, equal-vapor and secondary-dissociation practice. Its heading is numbered 1; actual exercise numbering starts at 2. Q5's referenced SO2 class data is in recitation 6a. |
| Homework 7, 2 pages | Q1 compare Z of CO2/He; Q2 fit a/b then target Z; Q3 reaction then isolate/compress; Q4 direct P, particle density, cold model and Z | G2 particle counts; G9 reactions; G10 base real gas | New G10 examples/quiz, E9-E12. The visible header says 7 even though metadata says 6. |

## Scientific qualifications retained or added

1. A below-1-atm ideality rule is a stated exercise assumption, not a universal boundary. Use the assumptions in the course problem while naming their limit.
2. For total volume, `(P+an²/V²)(V−nb)=nRT`; for molar volume, `(P+a/Vm²)(Vm−b)=RT`. These must not be mixed. `Z=V/(V−nb)−an/(VRT)` is dimensionless.
3. In the van der Waals model, `T_B=a/(Rb)` cancels the linear-density term at low density. At finite `c=n/V`, `Z(T_B)−1=(bc)²/(1−bc)` remains. The new plot is calculated from the model and labeled as such, not measured data.
4. Recitation 6a p15 estimates constant vaporization enthalpy using a critical point. Treat this as a coarse course approximation, not an accurate constant enthalpy over that entire interval.
5. Homework 7 Q4's CO2 calculation at -130 C is an assigned model exercise. A positive algebraic pressure does not prove a stable gas phase or accurate equilibrium prediction there.
6. Sample Q14 labels about 95.908 u as Zr-97. Existing E5 already explains that it corresponds to Zr-96 and uses the correct isotope for the reaction. No duplicate correction is inserted.
7. Sample Q12 prints 98 g. Its stated PVT gives about 0.19979 mol total and the oxygen accounts for 0.165 mol; the water yield and hydrocarbon mass are not consistent. Do not silently turn it into 0.98 g. The new exercises use independently consistent data.
8. Homework 6a+b Q11 labels benzene C2H6. The new two-solvent example uses the correct identity and clearly stated exercise constants. Its source values are not exported as universal constants.
9. Sample Q1 lists SO3 boiling at -5.36 C. PubChem lists 44.8 C. Its room-temperature product-state reasoning needs checking before any direct solution is published. No raw source answer is treated as official truth.
10. The nuclear PPT repeats the existing reviewed errors: missing magic number 28; positron mass/free-proton decay; radiation penetration versus energy; iodine-131 half-life; rad conversion. Existing G16 corrections remain intact.
11. Ideal particle-count formulas for colligative properties are explicitly conditional. Full stoichiometric dissociation alone does not guarantee the ideal measured van't Hoff factor in a real ionic solution.

## Verification and preservation

The new tests reconstruct the exact parsed catalogue of main 6f3878e after removing only the marked additions and appended source suffixes. A fixed SHA-256 digest checks the entire remaining catalogue, including all other courses. The original eight exam-source objects are pinned separately. Existing historical digests are retained, not replaced to accommodate changes.

Every new numeric quiz answer and all new worked and exam calculations are independently recomputed in `tests/final-prep.test.js`. Checks cover both fitted input pressures, conserved moles/charge, unit handling, Boyle residuals, crystal geometry and all three solution denominators. The new browser gate tests actual reveals, answer submission, saved-progress preservation, source notes, narrow/desktop layouts and blocked external requests. All 38 new solutions use explicit Hebrew prose and separate LTR math blocks. Long calculations scroll within the block; result lines keep values and units together. Independent arithmetic checks inspect the displayed blocks.

Final local gate: 149 unit tests, production build, full browser matrix, PWA/offline update flow, existing practice/papers, formula screen/print, and final-preparation browser suite all pass. No live model calls were used.

Reapply authored data: `node scripts/apply-final-prep.mjs`. It removes only `finalPrep` blocks, appends the canonical layer, and is idempotent. Existing enrichment integration does not remove the new layer because it is not marked `enrich`. No storage keys, migration, Firebase settings, model settings or security rules change.

The two new formula-sheet rows cover direct van der Waals Z and Boyle temperature; the full print gate passes for the entire course, without dropping rows.

## Independent sources read

Course files determine scope. Equations and physical qualifications were checked against these sources and independent arithmetic. Some textbook image descriptions contain sign/notation issues; the equations were derived rather than copied from alternative text.

- OpenStax Chemistry 2e, non-ideal behavior: https://openstax.org/books/chemistry-2e/pages/9-6-non-ideal-gas-behavior
- OpenStax Chemistry 2e, phase diagrams: https://openstax.org/books/chemistry-2e/pages/10-4-phase-diagrams
- OpenStax Chemistry 2e, intermolecular forces: https://openstax.org/books/chemistry-2e/pages/10-1-intermolecular-forces
- OpenStax Chemistry 2e, colligative properties: https://openstax.org/books/chemistry-2e/pages/11-4-colligative-properties
- Boyle temperature and the second virial coefficient: https://en.wikipedia.org/wiki/Boyle_temperature
- NIST zirconium isotope table: https://pml.nist.gov/PhysRefData/Handbook/Tables/zirconiumtable1_a.htm
- PubChem sulfur trioxide: https://pubchem.ncbi.nlm.nih.gov/compound/sulfur_trioxide

This update targets the supplied materials. It is not a guarantee of coverage against an unseen final-exam syllabus, nor a complete official solution key for every supplied question.
