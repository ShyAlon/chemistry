import {readFileSync} from 'node:fs';
const fx12=JSON.parse(readFileSync(new URL('./fixtures/G12-pre-bidi.json',import.meta.url)));
const fx=JSON.parse(readFileSync(new URL('./fixtures/G11-pre-audit-p20.json',import.meta.url)));
// G11 worked 2 / quiz 3 cited GC5 p20 for noble-gas boiling points that the visible slide does not show; repaired in the source audit. Baselines keep the pre-repair text.
export function revertG11(t){
 if(t.id==='G12'){ // G12 theory t03/t12/t16 inline math scrambled under RTL; display repaired in the G12 audit (reviewed). Baselines keep the pre-repair text, matched by text.
  for(const {new:n,old} of fx12){const b=t.content.theory.find(b=>b.text===n);if(b)b.text=old;}return t;}
 if(t.id!=='G11')return t;
 t.content.worked[1].content=structuredClone(fx.worked2);
 const q=t.content.quiz.find(q=>q.id===3);q.answer=fx.quiz3answer;q.prompt=fx.quiz3prompt;return t;
}
