# G4 (איזון וסטויכומטריה) source-audit checkpoint 2, 2026-11-28 ~14:00 IST (supersedes checkpoint 1)

Status: PARTIAL. Not a coverage map. Lesson text unchanged.

## Sources checked so far (originals read)
- Midterm "בוחן אמצע כימיה כללית תשפ"ז" (4 pp, sha256 prefix f807caa1a2f6bc95): read in full.
## Sources still to read (not available to this task yet)
- GC1 lesson 2 deck (the file the lesson cites as "General Chemistry 2.pdf") slides 37-52 and the reaction-evidence slides 37-39.
- Recitation 3 pp. 15-21, HW3, HW4 (Q3c), extra-practice Q3 d/e, final-exam example set (balancing items).
(The lesson 1 deck, 57 slides, was supplied and is G1/G2 material, not G4.)

## Findings from the midterm vs. existing G4 content
1. Q2 is covered only in part. G4 quiz 5 asks only for mol NaCl from 46 g Na (2.00 mol, correct). Q2 has three parts that G4 lacks:
   - Q2.1 total volume of all gases produced in the series at 0.705 atm, 37 C (310.15 K). Balanced: 2Na+2H2O->2NaOH+H2; 2NaOH+CO2->Na2CO3+H2O; Na2CO3+2HCl->2NaCl+H2O+CO2. From 2.00 mol Na: H2 1.00 mol (step I), CO2 1.00 mol made in step III; step II consumes 1.00 mol CO2, so net gas is 1.00 mol H2 only. Both readings: "all gases produced" = 2.00 mol, V = nRT/P = 72.2 L; net gas = 36.1 L. The wording ("כל הגזים המתקבלים") is ambiguous; the lesson text (theory 12) already warns about this. Use R=0.082057, T=310.15 K (R=0.082, 310 K gives 72.1 L). State the assumption in the solution.
   - Q2.2 NaCl molarity: 2.00 mol / 1.500 L = 1.333 M.
   - Q2.3 CO2 molecules by carbon isotope, 1.00 mol CO2 (from step III), 14C neglected: 12C 98.93% -> 5.958e23 molecules; 13C 1.07% -> 6.44e21 molecules (NA = 6.022e23).
2. Q1 (CO + O2, gases, limiting reagent, partial pressures, Vrms) and Q3 (Fe2+/KMnO4 titration, redox balancing) belong to other topics (G5/G9, G8 per the coverage maps); G4 should only cross-reference the balancing step (note: the printed equation CO+O2->CO2 is unbalanced; 2CO+O2->2CO2).
3. Midterm Q3 redox equation is printed unbalanced (MnO4- + Fe2+ -> Mn2+ + Fe3+ without H+/H2O); balanced: MnO4- + 5Fe2+ + 8H+ -> Mn2+ + 5Fe3+ + 4H2O. Source error to correct, not copy.

## Existing G4 lesson inventory (src/content/84101/topics/G4.json at main 6137d38)
21 theory paragraphs, 4 worked examples, 5 quiz items. Cites only "General Chemistry 2.pdf pp. 37-52; midterm Q2". No ingest/84101/coverage/G4.json exists; G4 is listed in legacyUnaudited.

---
# Checkpoint 2: lesson-2 deck slides 37-52 read in text and pixels (all 16 slides, 50-dpi montages), exercises read

Source identity (hashes match ingest/84101/sources.manifest.json): "General Chemistry 2.pdf" (GC1 lesson 2 deck, 121 pp) sha256 5f9d1110...; midterm f807caa1...; "שאלות לדוגמא" d1fb53fa...; "שאלות נוספות" d7f1b7df...; Recitation 3 e7042d64...

## Slide-by-slide units (37-52) and current lesson coverage
| slide | content | in current G4? |
|---|---|---|
| 37 | evidence of reaction: colour change, precipitate (Ag2CrO4 photo), gas, heat | NO |
| 38 | thermite Fe2O3 + 2Al -> 2Fe + Al2O3 + heat; short high-T burst, rail welding | NO |
| 39 | evidence cont.: ignition of iron gauze, K2CrO4 + 2AgNO3 -> Ag2CrO4 + 2KNO3, Cu + 4H+ + 2NO3- -> Cu2+ + 2NO2 + 2H2O | NO |
| 40 | NO + O2 -> NO2: write symbols, balance, 2NO + O2 -> 2NO2, stoichiometric coefficients, molecular picture | partly (balancing text, no example) |
| 41 | never add extraneous atoms (NO + O2 -> NO2 + O), never change a formula (NO3), only coefficients | partly (formula rule only) |
| 42 | strategy: single-compound elements first, free elements last, polyatomics as groups, fractions cleared by multiplying | partly |
| 43 | triethylene glycol C6H14O4 combustion: C6H14O4 + 15/2 O2 -> 6CO2 + 7H2O, x2 | quiz 4 (different fuel) only; slide example absent |
| 44 | state symbols; conditions over arrows (heat, 350 C/340 atm/ZnO,Cr2O3 -> CH3OH, Ag2O 350 C) | NO |
| 45 | stoichiometry: 2H2 + O2 -> 2H2O; coefficients are mole ratios; stoichiometric factor | yes (theory 4-6) |
| 46 | generalized stoichiometry diagram (moles A -> factor -> moles B, preliminary/further steps) | figure stoich-map only in enrich |
| 47 | 2.72 mol H2 -> 2.72 mol H2O | yes (worked 0, quiz 2) |
| 48-50 | alloy 93.7% Al / 6.3% Cu, 2.85 g/cm3, 0.691 cm3 + excess HCl: 5 conversion factors; 2Al + 6HCl -> 2AlCl3 + 3H2; answer 0.207 g H2 (recomputed: 0.2068 g) | NO (only mentioned as "density, mass percent" in one sentence) |
| 51 | Fe2O3 + 3CO -> 2Fe + 3CO2, 1.00 kg Fe2O3 -> 698 g Fe | NO |
| 52 | 5.00 g MnO2 + 4HCl -> 8.40 g HCl | yes |

## Source errors found (to correct, not copy)
- Slide 39: "K+CrO4" should be K2CrO4 (the equation next to it already uses 2KNO3 and Ag2CrO4).
- Slide 44: "2C6H12O4(l) + 15O2 -> 12CO2 + 14H2O" is unbalanced (24 H left, 28 H right); slide 43 shows the compound is C6H14O4, so the intended line is 2C6H14O4 + 15O2 -> 12CO2 + 14H2O.
- Slide 43: coefficient is printed as a stacked fraction; 15/2 O2 (7.5), then x2 gives 15.
- Slide 51: 698 g uses M(Fe2O3)=160 and 55.8; with 159.69 and 55.845 it is 699 g. Lesson will show the slide method and state the rounding difference.
- Recitation 3 slide 21 (last of the NaBr chain): final step inverts the ratio (n(Fe)=8/3 n(NaBr) = 2.59 mol, 144.46 g); slides 19-20 correctly give n(Fe)=3/8 n(NaBr)=0.364 mol, so m(Fe)=0.364 x 55.85 = 20.3 g. NaBr M: 22.99+79.90=102.89 -> 0.972 mol.
- Final-exam-example set Q7 (שאלות לדוגמא): printed MCl2 + AgNO3 -> M(NO3)2 + AgCl is unbalanced; the filled-in solution in the shared file writes MCl2 + 2AgNO3 -> M + 2NO3 + 2AgCl (drops the metal ion). Correct: MCl2 + 2AgNO3 -> M(NO3)2 + 2AgCl. 7.964 g AgCl / 143.32 = 0.05557 mol; n(M)=0.02778 mol; M = 2.434/0.02778 = 87.6 g/mol -> strontium (87.62).
- Q6 of the same set (NH3 -> NO -> HCN) prints both equations unbalanced and the second needs a half coefficient (2NO + 2CH4 -> 2HCN + 2H2O + H2). Limiting-reagent part belongs to G5; G4 gets the balancing.

## Scope decision for G4 (proposal for the candidate)
Slides 37-52 all units become covered. Supporting exercises assigned to G4: midterm Q2 (all three parts), Recitation 3 slides 15-21 (NaBr chain, corrected), final-exam-example Q7 (MCl2/AgCl, corrected), extra-practice Q3 part d (P4 -> P2O3 -> P2O5 -> H3PO4 balanced chain). Left to G5 (note for later): extra-practice Q3 part e (limiting reagent over a chain; "each step separately" gives 14.1 mol H3PO4 whereas a single combined P4+5O2 view gives 25.0 mol, so the wording is ambiguous), Q6 limiting-reagent part. Recitation 3 slides 1-14 (empirical formula, combustion analysis, oxidation states) are in no topic's map: flagged to main.
