// Solutions are authored as one paragraph per answer. Lessons show one idea per block, so a
// run-on chain of calculations is split into the same kind of blocks at display time.
// Text is never changed: only sentence ends, and the comma before a concluding "ולכן", become line breaks.
// A sentence ends at ! ? or a single full stop. An ellipsis ("..." or "…") continues a list and never ends a step.
const SENTENCE=/(?<=[!?]|(?<!\.)\.)\s+(?=\S)/;
const LABEL=/^(?:\(?[א-ת]\)\.?|[א-ת]\.|\(?\d+[.)]+)$/;
const CONCLUSION=/,\s+(?=(?:ולכן|לכן|כלומר|ומכאן)\s)/;
const looksLikeCalculation=s=>/[=≈<>→]/.test(s);
// A short Hebrew lead ending in a colon, followed by a pure equation, becomes a lead line and an equation block.
const LEAD=/^([^=≈→]*[א-ת][^=≈→:]*:)\s+([^א-ת]*[=≈→][^א-ת]*)$/;
function splitLead(s){const m=LEAD.exec(s);return m&&m[1].split(/\s+/).length<=8?[m[1],m[2]]:[s]}
export function splitSolutionSteps(text){
 if(typeof text!=='string')return [text];
 const sentences=text.split(SENTENCE).filter(Boolean);
 const steps=[];
 for(const s of sentences){
  const parts=s.split(CONCLUSION);
  if(parts.length===2&&looksLikeCalculation(parts[0]))steps.push(...splitLead(parts[0]),parts[1]);else steps.push(...splitLead(s));
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
const UNIT='(?:g\\/mL|g\\/L|kg\\/L|km\\/h|m\\/s|mol\\/kg|mol\\/L|g\\/mol|L·atm\\/\\(mol·K\\)|J\\/\\(mol·K\\)|mmHg|atm|kPa|Pa|kg|mol|mL|cm³|dm³|cm|mm|km|Å|μm|g|L|K|J|kJ|°C|nm|pm|u|M|m)';
// Glue-only units (never used to isolate quantities in prose, so labels like 2s or 3N stay untouched).
const GLUE_UNIT='(?:mol\\/kg|mol\\/L|g\\/mol|g\\/mL|g\\/L|kg\\/L|kg\\/m³|km\\/h|cm\\/s|m\\/s²|m\\/s|L·atm\\/\\(mol·K\\)|J\\/\\(mol·K\\)|mmHg|atm|kPa|kJ|Pa|kg|mol|mL|cm³|dm³|m³|cm|mm|km|nm|pm|μm|µm|Å|cal|°C|°F|min|g|L|K|J|N|s|u|M|m)';
export const glueCalculation=s=>s.replace(new RegExp('([\\d⁰¹²³⁴⁵⁶⁷⁸⁹])\\s+(?='+GLUE_UNIT+'(?![\\w.]))','g'),'$1\u00a0').replace(/\s+(?=[=≈→+−×·])/g,'\u00a0').replace(/\b(g|kg|mol|cm|km|m)\/(mL|L|s²|s|h|kg|mol|m³)(?![\w])/g,'$1/\u2060$2').replace(/×\s+(?=10[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹])/g,'×\u00a0').replace(/=(?!\u200b)(?![^=\s]{1,12}$)/g,'=\u200b').replace(/=(?=[−+][^=\s\u200b\u2060]{1,12}$)/g,'=\u2060');
// Inside a mixed Hebrew step, an inline equation (a non-Hebrew run holding "=" and a digit) is one left-to-right unit.
export function splitEquationRuns(text){
  const out=[];let last=0;const re=/[^\u0590-\u05FF\n]+/g;let m;
  while((m=re.exec(text))){
    const run=m[0];if(!(/=/.test(run)||/\d\/\d/.test(run))||!/\d/.test(run))continue;
    const lead=run.match(/^[\s,;:.\-–]*/)[0].length;const trail=run.match(/[\s,;:.\-–]*$/)[0].length;
    const core=run.slice(lead,run.length-trail);if(!core)continue;
    const start=m.index+lead;
    if(start>last)out.push({text:text.slice(last,start)});
    out.push({text:core.length<=28?glueCalculation(core).replace(/\u200b/g,''):glueCalculation(core),equation:true});last=start+core.length;
  }
  if(last<text.length)out.push({text:text.slice(last)});
  return out;
}

// A plain quantity (number with optional unit) inside Hebrew prose is one left-to-right run. A Hebrew prefix hyphen stays outside it.
const NUM='\\d+(?:[.,]\\d+)?';
const PREFIXED='(?<=[א-ת]-)'+NUM+'(?:[\\s\\u00a0]?'+UNIT+'(?!\\w))?';
const WITH_UNIT='[−+]?'+NUM+'(?:[\\s\\u00a0]?×[\\s\\u00a0]?10[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]+)?[\\s\\u00a0]?'+UNIT+'(?!\\w)';
const QTY_ALL=new RegExp('('+PREFIXED+'|'+WITH_UNIT+')');
// A comma list of two or more quantities ("200°C, 1000 atm") is one left-to-right run.
const LIST=WITH_UNIT+'(?:,[\\s\\u00a0]?'+WITH_UNIT+')+';
const QTY_PREFIX=new RegExp('('+PREFIXED+'|'+LIST+')');
const cut=(text,re)=>String(text).split(re).map((x,i)=>i%2?{text:x.replace(/\s/g,'\u00a0'),quantity:true}:{text:x}).filter(x=>x.text!=='');
// Only a number with a unit, or a number right after a Hebrew prefix hyphen, is isolated. Bare numbers stay in the surrounding run.
export const splitQuantities=(text,prefixOnly=false)=>cut(text,prefixOnly?QTY_PREFIX:QTY_ALL);

// Break opportunities for a long inline expression: only after a top-level operator (never inside brackets, never in a signed number or unit).
export const breakMath=s=>{let d=0,o='';const t=[...s];for(let i=0;i<t.length;i++){const c=t[i];o+=c;if('([{'.includes(c))d++;else if(')]}'.includes(c))d=Math.max(0,d-1);
 else if(!d){const p=t[i-1]||'',n=t[i+1]||'';const sp=n===' '||n==='\u00a0';
  if(c==='×'&&/[\d)\]]/.test(p)&&n!=='\u200b'&&!/^[\s\u00a0]?10[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(t.slice(i+1,i+5).join('')))o+='\u200b';
  else if((c==='/'||c==='+'||c==='−'||c==='·')&&(sp&&(p===' '||p==='\u00a0'||c==='/'||/[\d)]/.test(p)))&&n!=='\u200b'){o+=sp?t[++i]+'\u200b':'\u200b'}
  else if(c==='·'&&/\d/.test(p)&&/\d/.test(n))o+='\u200b'}}return o};
