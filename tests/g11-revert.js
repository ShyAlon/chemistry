import {readFileSync} from 'node:fs';
const fx12=JSON.parse(readFileSync(new URL('./fixtures/G12-pre-bidi.json',import.meta.url)));
const fxd=JSON.parse(readFileSync(new URL('./fixtures/G12-display-pairs.json',import.meta.url)));
const fx=JSON.parse(readFileSync(new URL('./fixtures/G11-pre-audit-p20.json',import.meta.url)));
// G11 worked 2 / quiz 3 cited GC5 p20 for noble-gas boiling points that the visible slide does not show; repaired in the source audit. Baselines keep the pre-repair text.
export function revertG11(t){
 if(t.id==='G4'){ // G4 audit: source line and provenance now name the exercises and recitation used; baselines keep the original labels.
  if(t.source.includes('תרגול 3, עמ׳ 15-21'))t.source='מקורות: General Chemistry 2.pdf, עמ׳ 37-52; בוחן אמצע שאלה 2 | סיכום ושאלות לימוד נגזרו מהחומר; הפתרונות חושבו מחדש, לא מפתח רשמי.';
  if(t.provenance?.sourceReferences?.includes('תרגול 3, עמ׳ 15-21'))t.provenance.sourceReferences='General Chemistry 2.pdf, עמ׳ 37-52; בוחן אמצע שאלה 2';
  return t;
 }
 if(t.id==='G12'){ // G12 theory t03/t12/t16 inline math scrambled under RTL; display repaired in the G12 audit (reviewed). Baselines keep the pre-repair text, matched by text.
  // Round-3 display repairs (inline Latin/number runs rewritten as words or formula sentences; spectrum template card removed as irrelevant to crystals). Baselines keep the previous text.
  for(const p of fxd.theory){const b=t.content.theory.find(b=>b.text===p.new);if(b)b.text=p.old}
  for(const p of fxd.worked){if(JSON.stringify(t.content.worked[p.i]?.content)===JSON.stringify(p.new))t.content.worked[p.i].content=structuredClone(p.old)}
  for(const p of fxd.quiz){const q=t.content.quiz.find(q=>q.id===p.id);if(q&&q.prompt===p.new.prompt&&q.answer===p.new.answer){q.prompt=p.old.prompt;q.answer=p.old.answer}}
  if(t.provenance&&t.provenance.sourceReferences===fxd.meta.newRefs){t.provenance.sourceReferences=fxd.meta.oldRefs;delete t.provenance.externalReferences}
  if(!t.spectrum){const rest=Object.entries(t);for(const [k] of rest)delete t[k];for(const [k,v] of rest){t[k]=v;if(k==='source')t.spectrum=structuredClone(fxd.meta.spectrum)}}
  for(const {new:n,old} of fx12){const b=t.content.theory.find(b=>b.text===n);if(b)b.text=old;}return t;}
 if(t.id!=='G11')return t;
 t.content.worked[1].content=structuredClone(fx.worked2);
 const q=t.content.quiz.find(q=>q.id===3);q.answer=fx.quiz3answer;q.prompt=fx.quiz3prompt;return t;
}
// G1 audit: two reviewed prose corrections (practice-corrections.json) restore their pre-audit text for the layer baselines that do not apply practice-baseline.
import {readFileSync as _rf} from 'node:fs';
export function revertG1(t){
 if(t?.id!=='G1'&&t?.id!=='G2'&&t?.id!=='G4')return t;
 const list=JSON.parse(_rf(new URL('../src/practice-corrections.json',import.meta.url))).filter(c=>c.topic===t.id);
 for(const c of list){if(c.worked){const w=t.content.worked.find(w=>w.title===c.worked&&w.content[1]===c.after);if(!w)throw new Error('G1 worked correction missing');w.content[1]=c.before;continue}const b=t.content.theory.find(b=>b.text===c.after);if(!b)throw new Error('G1 correction missing');b.text=c.before}
 return t;
}
