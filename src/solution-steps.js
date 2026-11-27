// Solutions are authored as one paragraph per answer. Lessons show one idea per block, so a
// run-on chain of calculations is split into the same kind of blocks at display time.
// Text is never changed: only sentence ends, and the comma before a concluding "ולכן", become line breaks.
const SENTENCE=/(?<=[.!?])\s+(?=\S)/;
const LABEL=/^(?:\(?[א-ת]\)|[א-ת]\.|\d+\))$/;
const CONCLUSION=/,\s+(?=(?:ולכן|לכן|כלומר|ומכאן)\s)/;
const looksLikeCalculation=s=>/[=≈<>→]/.test(s);
export function splitSolutionSteps(text){
 if(typeof text!=='string')return [text];
 const sentences=text.split(SENTENCE).filter(Boolean);
 const steps=[];
 for(const s of sentences){
  const parts=s.split(CONCLUSION);
  if(parts.length===2&&looksLikeCalculation(parts[0]))steps.push(parts[0],parts[1]);else steps.push(s);
 }
 // A part label such as "א." stays with the step it introduces.
 const out=[];
 for(let i=0;i<steps.length;i++){if(LABEL.test(steps[i])&&i+1<steps.length){steps[i+1]=steps[i]+' '+steps[i+1]}else out.push(steps[i])}
 return out;
}
export function solutionStepsText(text){return splitSolutionSteps(text).join(' ')}
// A step with no Hebrew that is a calculation is shown like a lesson equation: its own left-to-right block.
export const isCalculationStep=s=>typeof s==='string'&&!/[א-ת]/.test(s)&&/[=≈→]/.test(s);
// A hyphen glued to a Hebrew prefix before a signed number ("ב-−0.372°C") puts two dashes side by side in
// right-to-left text and the minus reads as part of the prefix. A space keeps the sign inside the number.
export const solutionDisplayText=s=>typeof s==='string'?s.replace(/([א-ת])-([−+])(?=\d)/g,'$1 $2'):s;
const SIGNED=/([−+]\d+(?:[.,]\d+)?(?:\s?°C|\s?K\b)?)/;
export function splitSignedQuantities(text){return String(text).split(SIGNED).filter(x=>x!=='').map(x=>SIGNED.test(x)&&/^[−+]/.test(x)?{text:x.replace(/\s/g,'\u00a0'),quantity:true}:{text:x})}
// Display glue for a calculation line: a number never separates from its unit, and the line may only break after "=".
const UNIT='(?:mol\\/kg|mol\\/L|g\\/mol|L·atm\\/\\(mol·K\\)|mmHg|atm|kPa|Pa|kg|mol|mL|cm³|dm³|g|L|K|J|kJ|°C|nm|pm|u|M|m)';
export const glueCalculation=s=>s.replace(new RegExp('(\\d)\\s+(?='+UNIT+'(?![\\w.]))','g'),'$1\u00a0').replace(/=(?!\u200b)/g,'=\u200b');
// Inside a mixed Hebrew step, an inline equation (a non-Hebrew run holding "=" and a digit) is one left-to-right unit.
export function splitEquationRuns(text){
  const out=[];let last=0;const re=/[^\u0590-\u05FF\n]+/g;let m;
  while((m=re.exec(text))){
    const run=m[0];if(!/=/.test(run)||!/\d/.test(run))continue;
    const lead=run.match(/^[\s,;:.]*/)[0].length;const trail=run.match(/[\s,;:.]*$/)[0].length;
    const core=run.slice(lead,run.length-trail);if(!core)continue;
    const start=m.index+lead;
    if(start>last)out.push({text:text.slice(last,start)});
    out.push({text:glueCalculation(core),equation:true});last=start+core.length;
  }
  if(last<text.length)out.push({text:text.slice(last)});
  return out;
}
