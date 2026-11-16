# V+ worked answer: course rule versus isolated-ion ground state

Checked 2026-11-16. This correction concerns P7, worked exercise 4, not the periodic-table reference data.

## Course evidence

The supplied Inorganic Chemistry 84102 lesson 8 text asks: "Select the correct electronic configuration for V1+ (Z = 23)". Its six choices include option 3, `[Ar] 3d3 4s1`; `[Ar] 3d4` is not among the choices. The recovered text does not preserve a marked official answer or slide graphics.

The supplied recitation 4 text states that for metals with two or more d electrons, removal is from s before d. Recitation 5 repeats s-before-d. Starting from neutral `[Ar] 4s2 3d3`, removing one 4s electron gives `[Ar] 4s1 3d3`, with 22 electrons. This supports the course-rule answer, without claiming it is a universal ground-state prediction.

## Atomic reference evidence

- NIST Atomic Data for Vanadium: https://physics.nist.gov/PhysRefData/Handbook/Tables/vanadiumtable1_a.htm . V I neutral ground state is `[Ar] 3d3 4s2`; V II (singly ionized V+) ground state is `[Ar] 3d4`.
- NIST Energy Levels of Singly Ionized Vanadium: https://physics.nist.gov/PhysRefData/Handbook/Tables/vanadiumtable6.htm . The `3d4` ground level is 0 cm^-1; the lowest listed `3d3 4s` level is 2604.88 cm^-1. A simple removal rule does not account for the final reorganization into the lower-energy configuration.

## Change and guardrails

The original worked answer rejected the course-rule result while explaining its own different answer with "always remove s first". Replace that contradiction with the course-rule calculation and a visible distinction from the isolated free-ion ground state. Keep the NIST-backed periodic-table V+ value unchanged.

No other lesson paragraphs, quiz keys, question IDs, grading, progress storage, or electron-control behavior change. The baseline-content hash test restores only this exact known correction before checking all other content. Unit tests lock both the worked answer and the distinct NIST value; browser checks reveal this solution at every tested viewport and check for overflow.
