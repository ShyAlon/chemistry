// Re-applies the reviewed GC1 notation conversion on top of the enrichment layer.
// scripts/apply-enrichment.mjs strips enrich-flagged blocks and re-appends the
// layer's original text; this puts the converted blocks (src/notation-blocks.json)
// back in place of the matching original paragraph. Final-prep paragraphs are
// converted inside src/final-prep-84101.js itself and are skipped here.
export function applyNotation(catalogue,entries){
 const course=catalogue.courses.find(c=>c.id==='84101');let n=0;
 for(const e of entries){
  if(e.finalPrep)continue;
  const theory=course.topics.find(t=>t.id===e.topic).content.theory;
  const i=theory.findIndex(b=>b.text===e.before&&b.notationOf===undefined&&!b.finalPrep);
  if(i<0)continue;
  theory.splice(i,1,...structuredClone(e.blocks));n++;
 }
 return n;
}
