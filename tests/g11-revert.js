import {readFileSync} from 'node:fs';
const fx=JSON.parse(readFileSync(new URL('./fixtures/G11-pre-audit-p20.json',import.meta.url)));
// G11 worked 2 / quiz 3 cited GC5 p20 for noble-gas boiling points that the visible slide does not show; repaired in the source audit. Baselines keep the pre-repair text.
export function revertG11(t){
 if(t.id!=='G11')return t;
 t.content.worked[1].content=structuredClone(fx.worked2);
 const q=t.content.quiz.find(q=>q.id===3);q.answer=fx.quiz3answer;q.prompt=fx.quiz3prompt;return t;
}
