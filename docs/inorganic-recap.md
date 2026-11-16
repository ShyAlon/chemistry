# Inorganic recap and exam-prep edition

## Sources and scope

Two privately supplied slide decks were read in full, including image-only questions:

- **Recap lesson 1**, Inorganic Chemistry 84102, 51 slides.
- **שיעור הכנה לבוחן**, 35 slides.

The source PDFs, slide screenshots, lecturer details and copied slide artwork are not added to the repository. The site contains derived Hebrew explanations, original diagrams, adapted exercises and independently computed answers. They are not an official answer key and do not predict exam questions.

### Coverage map

| Source pages | Integration |
| --- | --- |
| Recap 2–5 | P3 experimental evidence for the nuclear atom, charge and isotope notation |
| Recap 6–10; prep 4–5 | P2 wave quantities, photon energy, intensity and photoelectric threshold |
| Recap 11–14,19; prep 6,11 | P3 Bohr radius, absorption/emission signs, He+ threshold, Balmer transition |
| Recap 15–16; prep 12–13,30–31 | P4 de Broglie from kinetic energy, uncertainty and inferred mass |
| Recap 17–24,29–33; prep 14–15 | P5 orbital/electron counting and quantum-number constraints |
| Recap 25–30,38; prep 21–23 | P6 radial density, nodes and the carbon sketch exercise |
| Recap 31–32,40–43; prep 16–20,33 | P7 filling, ground/excited states, unpaired free-ion electrons and formal Ca addition/removal |
| Recap 34–39; prep 7–10,24 | P8 shielding, fitted Zeff, Fe and Cs calculations |
| Recap 44–46; prep 25–28 | P9 first/second ionization comparisons and successive ionization |
| Recap 47; prep 29,32 | P10 Ne PES calculation and subshell/peak counting |
| Recap 48–51 | New P11 electron affinity, sign conventions and electronegativity |
| Prep 2–3 | P1 unit conversions and numerical checks |
| Both decks' concept checks and practice problems | New P12 mixed review, with references back to P1–P11 |

Title/end slides and general encouragement do not create separate lessons. Existing coverage is retained rather than duplicated slide by slide.

## Additions

- 70 theory blocks across ten enriched topics and two new topics.
- 23 worked examples.
- 26 new quiz questions: 6 in P11 and 20 in P12, including 13 numerical, 10 multiple-choice and 3 self-graded written questions.
- Two original teaching diagrams and formula-sheet additions.
- Inorganic totals: **12 topics, 83 questions, 66 worked examples**.

## Scientific distinctions

`src/recap-corrections.json` records fourteen explicit before/after theory clarifications. In particular:

- With normalized angular functions, radial probability is `P(r)=r²|R(r)|²`. For a spherically symmetric s state, it can also be written `4πr²|Ψ(r)|²`; those two conventions must not be combined.
- The most probable radius is the global maximum, not the outermost peak by definition. Radial nodes exclude the origin and infinity.
- `px` and `py` are real combinations of the `ml=±1` states. Electron spin also exists in one-electron hydrogen.
- A shell's `2n²` capacity does not determine the length of every periodic-table row.
- A fitted `Zeff` produces a course approximation, not an exact many-electron spectrum.
- An atom's energy change can be negative on emission while the emitted photon energy is positive.
- Positive spectroscopic binding energy is distinct from a negative bound-electron level energy.
- One PES peak per occupied subshell is the simplified course model, not a universal rule for real XPS spectra. Instrument effects and splitting are acknowledged.
- The course uses `EA=-ΔE_attach`; some reference texts use the attachment energy itself. The sign definition is shown beside the calculation.
- Formal addition of several electrons to Ca is labelled as a filling exercise, not evidence that a free multiply charged Ca anion is stable. The existing V+ course-model versus NIST distinction remains unchanged.

## Verification references

- OpenStax, Chapter 6 summary: https://openstax.org/books/chemistry-2e/pages/6-summary
- OpenStax, electron configurations: https://openstax.org/books/chemistry-2e/pages/6-4-electronic-structure-of-atoms-electron-configurations
- OpenStax, periodic properties and electron affinity: https://openstax.org/books/chemistry-2e/pages/6-5-periodic-variations-in-element-properties
- OpenStax, electronegativity: https://openstax.org/books/chemistry-2e/pages/7-2-covalent-bonding
- Real/complex orbital bases and radial distribution: https://falstad.com/qmatom/directions.html
- Radial/angular factorization: https://chem.libretexts.org/Bookshelves/Physical_and_Theoretical_Chemistry_Textbook_Maps/Quantum_Mechanics__in_Chemistry_(Simons_and_Nichols)/05%3A_Molecular_Orbitals/5.04%3A_Atoms
- Course-level PES interpretation: https://chem.libretexts.org/Bookshelves/Inorganic_Chemistry/Introduction_to_Solid_State_Chemistry/06%3A_Recitations/6.06%3A_Aufbau_Principle_Electron_Filling_Box_Notation_and_Photoelectron_Spectroscopy
- Ionization comparison cross-check: https://periodictable.com/Properties/A/IonizationEnergies.an.log.pr.html

## Compatibility and verification

- All 57 existing inorganic questions, IDs, options and answer keys remain byte-for-byte identical.
- All existing worked examples remain unchanged. Fourteen documented theory clarifications are the only alterations to previous lesson prose.
- The entire General Chemistry course remains unchanged.
- No application, storage-key, progress-migration, periodic-table control, scrolling, deployment-workflow or external-service changes.
- Earlier fixed content baselines are reconstructed through explicit, audited exemptions, not replaced with fresh snapshot digests.
- Unit tests independently recompute all 13 new numerical answers. A mass question uses a scaled `10⁻³⁰ kg` unit to avoid a pre-existing absolute tolerance floor from making zero acceptable at that scale. Both zero and a 10% error are tested as rejected.
- The existing 72 route/viewport matrix, 12 notation fixtures, header/wheel/charge/tooltip/source-first checks remain in place.
- New browser journeys check all twelve inorganic topics at 320/390/1280px, open worked solutions, mark every new quiz answer through the real UI, reload, and confirm the earlier P7/P3 saved answers and completion records remain unchanged.

Publishing requires the owner's review of the actual additions and PR title/scope. The owner merges; the change is then verified on the live deployment.
