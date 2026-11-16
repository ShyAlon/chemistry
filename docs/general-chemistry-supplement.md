# General Chemistry supplement: source map and review notes

This addition is a Hebrew study adaptation, not a slide transcript or an official
answer key. No source PDF, slide artwork, photographs or slide screenshots are
shipped. All five drawings and all questions/examples in G13-G16 are new.

## Coverage

Page numbers below are physical PDF pages, not printed slide labels.

| Supplied source | Pages | Learning topic | Coverage |
| --- | --- | --- | --- |
| file-3fc9a323.pdf (75 pages) | 1-16 | G13 | Cohesion/adhesion, surface tension, wetting/meniscus/capillarity, viscosity, evaporation and condensation, vapor pressure, boiling and external pressure, vaporization enthalpy, Clausius-Clapeyron, relative humidity |
| same | 17-29 | G14 | Dissolution energetics, ideal/nonideal forces, saturation and supersaturation, temperature, Henry's law and partial pressure |
| same | 30-46 | G14 | Raoult and Dalton, liquid/vapor composition, bubble/dew curves, fractional distillation, positive/negative deviations, minimum/maximum-boiling azeotropes and separation limits |
| same | 47-75 | G15 | Vapor-pressure lowering, molarity vs molality, osmotic pressure, membrane flow, reverse osmosis, tonicity, freezing/boiling shifts, effective van't Hoff factor, molar-mass inference and nonideality |
| file-643d23ee.pdf (62 pages) | 1-26 | G16 | Chemical/nuclear distinction, nucleons and nuclides, units, forces, stability, atomic-mass bookkeeping, binding energy and energy per nucleon |
| same | 27-44 | G16 | Alpha/beta-minus/beta-plus/gamma/electron capture, balanced equations, neutrinos, penetration vs energy, decay rate, half-life and carbon dating |
| same | 45-58 | G16 | Fission/fusion, chain reactions, controlled reactor heat, moderators and breeder concept, solar fusion, conceptual civilian/military distinction only |
| same | 59-62 | G16 | Medical tracers and PET, iodine-131, ionization, activity vs dose, Gy/rad and Sv/rem, irradiation vs contamination |

There is no page 76 or 63 respectively: the text extractor emits an empty final
form-feed. The first PDF's metadata title ("Matter and Measurement") is a template
leftover and is not used as its subject title.

## Corrections and limits

- First PDF p13 has an extra minus in the two-point Clausius-Clapeyron equation.
  With the reciprocal difference (1/T1 - 1/T2), the prefactor is positive.
- pp63/68/74 have inconsistent signs for boiling elevation and osmotic pressure.
  New lessons define freezing depression as a positive magnitude and explicitly
  subtract it to obtain the solution freezing temperature.
- p73 gives 0.0361/0.0186 as 1.98. It is approximately 1.941.
- p55 infers final solution volume using an unstated solution density. The new
  original osmotic molar-mass example supplies the final solution volume.
- Nuclear p24 omits the conventional magic number 28. The new text includes it
  and treats stability rules as trends, not guarantees.
- p33 incorrectly describes a massless positron and spontaneous free-proton
  beta-plus decay. The new explanation uses a massive positron and an energetically
  permitted decay inside a suitable nucleus, including neutrino bookkeeping.
- pp34-36 conflate photon/particle language, penetration and energy. Gamma is a
  photon; alpha is not necessarily less energetic, and internal alpha exposure
  can be harmful despite low external penetration.
- p35 has a wrong daughter mass number in its gamma equation. A and Z are both
  unchanged in gamma emission.
- p59 gives iodine-131 a 14.8-hour half-life. It is about 8 days.
- p60 gives 1 rad = 0.001 J/kg. Correct: 0.01 J/kg = 0.01 Gy.
- The solar explanation uses the net four-proton-to-helium result. Fusion is not
  presented as entirely free of activation waste.
- No medical dosing, universal hospital-usage statistic, weapon construction,
  assembly diagrams, design parameters or operational instructions are included.
  Historical/application context is kept at the level needed to learn chemistry.
- The source solvent-property tables are not reproduced wholesale. Exercises
  state the constants they need; formulas state their units and validity limits.

## Verification sources consulted, 2026-11-16

The supplied PDFs determine course scope. These independent sources were read to
check equations, interpretations and corrections, not copied into the lessons.

- OpenStax Chemistry 2e, 10.3 Phase Transitions: vapor pressure, equilibrium,
  boiling, two-point Clausius-Clapeyron and its sign.
  https://openstax.org/books/chemistry-2e/pages/10-3-phase-transitions
- OpenStax Chemistry 2e, 11.3 Solubility: saturation, gas pressure/temperature,
  Henry constant convention and limitations.
  https://openstax.org/books/chemistry-2e/pages/11-3-solubility
- OpenStax Chemistry 2e, 11.4 Colligative Properties: Raoult, concentration,
  positive boiling/freezing magnitudes, osmosis, reverse osmosis and effective i.
  https://openstax.org/books/chemistry-2e/pages/11-4-colligative-properties
- OpenStax Chemistry 2e, 21.1 Nuclear Structure and Stability: mass defect,
  atomic-mass bookkeeping, binding energy per nucleon and magic numbers.
  https://openstax.org/books/chemistry-2e/pages/21-1-nuclear-structure-and-stability
- OpenStax Chemistry 2e, 21.2 Nuclear Equations: particle identities and A/Z balance.
  https://openstax.org/books/chemistry-2e/pages/21-2-nuclear-equations
- OpenStax Chemistry 2e, 21.3 Radioactive Decay: beta-minus, beta-plus and capture.
  https://openstax.org/books/chemistry-2e/pages/21-3-radioactive-decay
- US NRC, Patients Treated with Radioactive Drugs: iodine-131, about 8 days,
  and medical imaging/treatment context.
  https://www.nrc.gov/materials/miau/patient-release
- US NRC, Measuring Radiation: distinguishes activity, absorbed dose and
  dose equivalent. Its broad exposure equivalences are not used as universal.
  https://www.nrc.gov/about-nrc/radiation/health-effects/measuring-radiation
- NIST Guide to the SI, Appendix B.8: rad to Gy and rem to Sv, each factor 0.01.
  https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8

## Compatibility

G1-G12 and all Inorganic Chemistry topic payloads are unchanged. New topic and
question IDs append to the existing scheme; no storage key, migration, reset or
marking logic changes. The formula sheet and diagram gallery include the new
material. The enrichment regeneration script now skips topics without a layer
before removing enrichment blocks, so it cannot erase this supplement.

The original regression hash still checks the reviewed original topic payload,
not newly appended topics or changing course-level descriptive metadata. New tests
separately check the supplement, independent arithmetic, units, sources, old topic
identity and old progress loading.

## Local verification

48 unit/regression tests pass, and the production build succeeds. Headless Chrome
inspection covered all four lessons at 1280x900, formula and worked-answer text at
390x800, and a nuclear quiz at 667x375. All five original diagrams were inspected
as pixels; no runtime exceptions occurred. New theory is 20px; SVG labels are at
least 18 units and render larger than 18px. Display equations have deliberate
line breaks on phones. Header top and footer bottom match viewport boundaries.

Browser interaction verified a correct new Raoult numeric answer with kPa units,
persisted it under G14, and preserved a pre-existing completed G1. Both the formula
sheet and gallery expose G13-G16. No source PDFs appear in the build.

Known unrelated baseline issue: at 390px, main 0d40e61's header-tools row extends
left to approximately -75px and causes horizontal page scrolling. New content
fits its container. Shared header/CSS is deliberately unchanged; its fix is owned
separately. Desktop and 667px landscape have no page-level horizontal overflow.

Vite emits pre-existing JSX greater-than warnings in the older figure files and a
bundle-size advisory. Neither is introduced by this supplement; build exits zero.
