import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
export const corrections=JSON.parse(readFileSync(new URL('../src/practice-corrections.json',import.meta.url)));
// Reconstruct the reviewed pre-practice topic. Only explicit additions and the
// four before/after prose corrections are exempted from baseline checks.
export function beforePractice(topic){
 const t=beforeRecap(topic);
 for(const key of ['theory','worked','quiz'])t.content[key]=t.content[key].filter(b=>!b.batch2);
 for(const c of corrections.filter(c=>c.topic===t.id)){
  const b=t.content.theory.find(b=>b.text===c.after);
  assert.ok(b,'reviewed correction missing: '+t.id);b.text=c.before;
 }
 return t;
}

// The approved PR16 answer change is separate from the practice additions.
// Keep the pre-PR16 fixture rather than replacing its recorded P7 digest.
export function beforeVanadium(topic){
 const t=structuredClone(topic);if(t.id!=='P7')return t;
 const v=t.content.worked.find(w=>w.title.startsWith('סוג 4:'));
 assert.equal(v.content.length,4);assert.match(v.content[2],/V⁺ = \[Ar\]4s¹3d³/);assert.match(v.content[3],/NIST/);assert.match(v.content[3],/\[Ar\]3d⁴/);
 v.content.splice(2,2,'V: [Ar]4s²3d³. V⁺ = [Ar]3d⁴ (לא [Ar]4s¹3d³ - המוצא הוא תמיד מ-s קודם).');return t;
}

// Preserve the fixed earlier baselines while allowing only this reviewed edition.
const recapCorrections=JSON.parse(readFileSync(new URL('../src/recap-corrections.json',import.meta.url)));
export function beforeRecap(topic){
 const t=structuredClone(topic);
 t.source=t.source.split(' תוספת חזרה:')[0];delete t.recapSources;
 for(const key of ['theory','worked'])t.content[key]=t.content[key].filter(b=>!b.recap);
 for(const c of recapCorrections.filter(c=>c.topic===t.id)){
  const b=t.content.theory[c.index];assert.equal(b.text,c.after,'reviewed recap correction missing: '+t.id);b.text=c.before;
 }
 return t;
}
