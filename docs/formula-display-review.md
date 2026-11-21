# Unified formula display review

Status: local preparation for review, not approved for publication.

## Single display owner

`Formula` owns block, compact reference and print presentation, symbol-popup policy, bidirectional text, line splitting, notation and reviewed display overrides. All authored display paths call it: theory, topic formulas, references, print and final-prep solution blocks. Existing names remain forwarding compatibility exports only. Inline prose and SVG text remain inline/text, sharing the notation renderer.

The data is not a single store. Reference items, lesson equations and worked calculations remain authored at their source locations. A shared presentation override eliminates duplicate Maxwell-Boltzmann formatting strings. Explicit metadata now covers all 194 reference items, 136 theory equations and 14 constants. All 217 worked display lines inherit one of 22 reviewed exercise contexts. Typed notation explanations replace variable legends for conversions, reactions, tables and rules where appropriate. Tests reject missing or unmatched metadata, conflicting symbol meanings, changed exercise steps and unmatched presentation overrides.

## P3 atomic transition correction

Original site expression used a positive emission-energy difference under the ambiguous name ΔE, and an unqualified R for inverse wavelength. This conflicted with its reference sheet and course text.

Recovered extracted text of Inorganic Chemistry lesson 3 and lesson 4 explicitly defines the atom's change as final minus initial and negative for emission. Lesson 4 gives the corrected n=5 to n=1 result, about -13.06 eV. The original source pixels have not been recovered; this finding rests on the preserved extracted source text, not a new visual inspection of those slides.

Local correction:

- ΔE_atom = E_f − E_i = R_H(1/n_i² − 1/n_f²)
- E_photon = |ΔE_atom|
- 1/λ = R∞ |1/n_f² − 1/n_i²|
- R_H = 13.6 eV, an energy; R∞ = 1.097×10⁷ m⁻¹, an inverse length, not the gas constant.
- These expressions are for hydrogen. Multiply energy differences and wavenumber by Z² for a one-electron ion.

Public supporting source: https://chem.libretexts.org/Bookshelves/General_Chemistry/Chemistry_2e_(OpenStax)/06%3A_Electronic_Structure_and_Periodic_Properties/6.03%3A_The_Bohr_Model

It explicitly relates photon energy to |E_f−E_i| and gives the one-electron-ion dependence. No quiz answers or stored progress are changed.
