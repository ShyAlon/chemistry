# G4 (איזון וסטויכומטריה) source-audit checkpoint 1, 2026-11-28 ~14:00 IST

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
