# General Chemistry: practice integration, second batch

## Scope

Enriches existing G1, G9, G10 and G11 rather than adding duplicate topics.

| Topic | New worked examples | New questions | Added theory/figure blocks |
| --- | ---: | ---: | ---: |
| G1: units and density | 4 | 5 | 7 |
| G9: gas mixtures and reactions | 2 | 4 | 5 |
| G10: kinetic theory and effusion | 6 | 8 | 16 |
| G11: intermolecular forces | 3 | 4 | 10 |
| Total | 15 | 21 | 38 |

The course remains at 16 topics, now with 107 questions and 79 worked examples. Three new original figures cover a calculated Maxwell speed distribution with a finite band, molar versus mass effusion rates, and water orientation around ions. The formula sheet gains dimensional-analysis, Maxwell and Coulomb relations. No source file, slide image or copied slide diagram is published.

## Five original materials and overlap decisions

1. **General Chemistry homework 1, one-page legacy Word document.** Recovered the original Hebrew through Word-compatible conversion, then checked the rendered page. Adds higher-power unit conversion, kinetic-energy dimensional analysis, carat/density and coupled mixture-density equations. Basic Celsius/Kelvin and volume conversion are already in G1, so they are reinforced by practice rather than repeated as a separate lesson.
2. **General Chemistry homework 6, two pages.** Adds speed ratios, most probable speed, sample versus per-particle translational energy, Maxwell finite-band counts, inverse density from a speed-band population, reaction pressure bookkeeping and the equal-mass effusion distinction. Its 11 numbered questions contain many subparts; the new educational material groups these skills rather than reproducing every original question.
3. **Recitation 5a: kinetic theory, 42 pages.** Much of the page count is progressive repetition of the same solutions. Adds the three speed definitions, probability density versus probability, the midpoint approximation, unit checks and initial effusate composition. The generated distribution is calculated from the Maxwell formula, not traced from its artwork.
4. **Scanned ideal-gas worked solutions, 13 pages, printed question numbering 1-11.** This is an older ideal-gas solutions key, not the key for homework 6. It overlaps existing G9 mixture, combined-law and nitrogen-fluoride questions. Used for cross-checking and for the gas-capture stoichiometry example. All new answers are independently computed, not treated as official answer authority.
5. **Intermolecular-forces lecture, 26 pages.** London forces, permanent/induced dipoles and hydrogen bonding already have G11 coverage. Adds force versus potential energy, qualitative lattice comparisons, hydration orientation, crystal water stoichiometry, orientation-dependent versus thermally averaged dipole potentials and limits of polarizability rules.

## Scientific qualifications and corrections

- Balance the methanol exercise as `CO + 2H2 -> CH3OH`, correcting its missing hydrogen coefficient. Its 250 atm calculation is explicitly an ideal-model exercise, not an accurate high-pressure prediction. At constant volume and temperature, each extent removes two net gas moles.
- Define `3nRT/2` as total **translational kinetic** energy. It is not the entire internal energy of a general molecular gas. Equal temperatures imply equal mean translational energy per particle, not equal total energy for unequal samples.
- Distinguish most probable, mean and RMS speeds. Use kg/mol with R in SI for numeric speeds; molar-mass ratios in Graham's law can instead use any common mass unit.
- A Maxwell ordinate is a probability density, not the probability of one exact speed. Finite-band probabilities require an integral; `f(midpoint) * width` is labeled an approximation.
- For the two NH3 windows, independent quadrature and the midpoint approximation differ by about 0.0226% at 313.15 K and 0.00290% at 673.15 K. These are comfortably below displayed exercise precision.
- At fixed source T and P, molar effusion rate scales as `1/sqrt(M)` while mass rate scales as `sqrt(M)`. Equal gram transfers cannot use the equal-mole time ratio. The large-source approximation and finite-reservoir limits are explicit.
- Helium loss through a polymer balloon is not offered as a pure effusion experiment. Permeation involves more than passage through a small hole.
- Correct the existing enrichment van der Waals equation to include `an^2/V^2` for total volume V, and state its separate molar-volume form. The original core relation was already correct.
- Separate Coulomb force magnitude (`1/r^2`) from pair potential (`1/r`). Qualify lattice/melting comparisons rather than presenting the pair formula as a complete melting-point model.
- Do not carry over the lecture's claim that no equations of state exist for liquids/solids, its universal nonhydrating-ion rule, or a universal mass/polarizability/solubility rule.
- A fixed-orientation dipole potential has an angular factor and a `1/r^3` dependence. Thermal averaging can yield an attractive `1/(T*r^6)` dependence; this is not an absolute gas-versus-liquid classification.
- Correct the existing Hebrew CO2/CH4 hydrogen-bond warning. Distinguish donors from acceptors, rather than inferring bonding from an oxygen atom alone.

Four existing prose changes are recorded verbatim in `src/practice-corrections.json`. No existing quiz prompt, answer, ID or field is changed by this batch.

## Independent verification sources

Consulted for the relevant formulas and claims:

- OpenStax Chemistry 2e, kinetic-molecular theory: https://openstax.org/books/chemistry-2e/pages/9-5-the-kinetic-molecular-theory
- OpenStax Chemistry 2e, effusion/diffusion: https://openstax.org/books/chemistry-2e/pages/9-4-effusion-and-diffusion-of-gases
- LibreTexts physical chemistry, Maxwell distribution and the three speed definitions: https://chem.libretexts.org/Bookshelves/Physical_and_Theoretical_Chemistry_Textbook_Maps/Physical_Chemistry_(LibreTexts)/27%3A_The_Kinetic_Theory_of_Gases/27.03%3A_The_Distribution_of_Molecular_Speeds_is_Given_by_the_Maxwell-Boltzmann_Distribution
- OpenStax Chemistry 2e, electrolyte hydration: https://openstax.org/books/chemistry-2e/pages/11-2-electrolytes
- OpenStax Chemistry 2e, lattice energy and ionic charge/radius effects: https://openstax.org/books/chemistry-2e/pages/7-5-strengths-of-ionic-and-covalent-bonds
- LibreTexts, fixed-orientation and thermally averaged dipole interactions: https://chem.libretexts.org/Courses/University_of_Georgia/CHEM_3212%3A_Physical_Chemistry_II/01%3A_The_Properties_of_Gases/1.09%3A_Specific_Interactions/1.9.01%3A_Dipole-Dipole_Interactions

Course materials select the teaching coverage. Independent sources and direct calculation establish the derived content. Some independent source pages also contain notation typos, so only verified expressions were used.

## Preservation and tests

- Existing topic and question IDs are unchanged. New question IDs append after the original five in each expanded topic.
- No storage migration, progress reset, renderer, CSS, workflow or repository-setting changes.
- Saved answers and existing completion flags survive loading. If an expanded quiz is resumed, the unchanged scoring logic evaluates completion against its expanded question count. Previously recorded answers remain, but all newly added questions must be answered for the expanded quiz to be complete. No new completion policy is introduced.
- Fixed baseline signatures protect every existing topic, including G13-G16. Tests remove only blocks tagged `batch2` and reverse only the explicit four prose corrections before comparing. Historical preservation digests remain unchanged.
- Independent calculations cover all 11 new numeric quiz answers, sample calculations, reaction mole/pressure conservation, Maxwell normalization and quadrature checks, and effusion quantity distinctions.
- Visual checks cover desktop, 390 px and 320 px phones, plus 667x375 landscape. Inspect new diagrams, equations and worked solutions at actual pixels. New diagrams use the existing enlarge control; captions remain text outside SVG. Body theory stays 20 px, with no font-size reduction to force fit.
