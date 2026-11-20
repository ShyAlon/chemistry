import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
export const notationCorrections=JSON.parse(readFileSync(new URL('../src/notation-corrections.json',import.meta.url)));
// Reconstruct the reviewed pre-notation topic: each group of blocks created by
// the formula-readability pass (marked notationOf=<original index>) is replaced
// by the original paragraph it came from. Anything unmarked is untouched.
export function undoNotation(topic){
 const t=structuredClone(topic);const list=notationCorrections.filter(c=>c.topic===t.id);
 const theory=t.content.theory;const out=[];
 for(let i=0;i<theory.length;i++){
  const b=theory[i];
  if(b.notationOf===undefined){out.push(b);continue}
  const c=list.find(c=>c.index===b.notationOf);assert.ok(c,'unreviewed notation block in '+t.id);
  let n=0;while(i+n<theory.length&&theory[i+n].notationOf===b.notationOf)n++;
  assert.equal(n,c.count,'notation group size '+t.id+'.'+c.index);
  out.push(structuredClone(c.before));i+=n-1;
 }
 t.content.theory=out;return t;
}
