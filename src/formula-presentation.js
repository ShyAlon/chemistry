// Explicit, reviewed display overrides. Source equations remain searchable and unchanged.
// No automatic algebra rewriting or symbol inference.
export const formulaPresentations=new Map([
 ['ΔN/N ≈ 4π(Mw/(2πRT))^(3/2)·v²   ·exp(−Mwv²/(2RT))·Δv','frac{ΔN}{N} ≈ 4π(frac{Mw}{2πRT})^(3/2)   ·v²·e^(−frac{Mwv²}{2RT})·Δv']
]);
export const formulaPresentation=text=>formulaPresentations.get(text)||text;
