import {readFileSync} from 'node:fs';
const fx12=JSON.parse(readFileSync(new URL('./fixtures/G12-pre-bidi.json',import.meta.url)));
const fxd=JSON.parse(readFileSync(new URL('./fixtures/G12-display-pairs.json',import.meta.url)));
const fx=JSON.parse(readFileSync(new URL('./fixtures/G11-pre-audit-p20.json',import.meta.url)));
// G11 worked 2 / quiz 3 cited GC5 p20 for noble-gas boiling points that the visible slide does not show; repaired in the source audit. Baselines keep the pre-repair text.
export function revertG11(t){
 if(t.id==='G12'){ // G12 theory t03/t12/t16 inline math scrambled under RTL; display repaired in the G12 audit (reviewed). Baselines keep the pre-repair text, matched by text.
  // Round-3 display repairs (inline Latin/number runs rewritten as words or formula sentences; spectrum template card removed as irrelevant to crystals). Baselines keep the previous text.
  for(const p of fxd.theory){const b=t.content.theory.find(b=>b.text===p.new);if(b)b.text=p.old}
  for(const p of fxd.worked){if(JSON.stringify(t.content.worked[p.i]?.content)===JSON.stringify(p.new))t.content.worked[p.i].content=structuredClone(p.old)}
  for(const p of fxd.quiz){const q=t.content.quiz.find(q=>q.id===p.id);if(q&&q.prompt===p.new.prompt&&q.answer===p.new.answer){q.prompt=p.old.prompt;q.answer=p.old.answer}}
  if(t.provenance&&t.provenance.sourceReferences===fxd.meta.newRefs){t.provenance.sourceReferences=fxd.meta.oldRefs}
  if(!t.spectrum){const rest=Object.entries(t);for(const [k] of rest)delete t[k];for(const [k,v] of rest){t[k]=v;if(k==='source')t.spectrum=structuredClone(fxd.meta.spectrum)}}
  for(const {new:n,old} of fx12){const b=t.content.theory.find(b=>b.text===n);if(b)b.text=old;}return t;}
 if(t.id!=='G11')return t;
 t.content.worked[1].content=structuredClone(fx.worked2);
 const q=t.content.quiz.find(q=>q.id===3);q.answer=fx.quiz3answer;q.prompt=fx.quiz3prompt;return t;
}
