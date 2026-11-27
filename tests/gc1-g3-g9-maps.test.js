import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {figuresHashFor,figuresHash,loadPolicy} from '../scripts/check-coverage.mjs';
const rd=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const topic=id=>rd(`src/content/84101/topics/${id}.json`).content;
const map=id=>rd(`ingest/84101/coverage/${id}.json`);
const unit=(m,page)=>m.pages.find(p=>p.page===page).units.flatMap(u=>u.targets||[]);
const item=(t,ref)=>{const m=/^(worked|quiz):(\d+)$/.exec(ref);return m[1]==='worked'?topic(t).worked[m[2]-1]:topic(t).quiz.find(q=>String(q.id)===m[2])};
// Existence alone lets a wrong target pass, so the intended items are pinned by content.
test('G3 map: slide pages resolve to the intended teaching items',()=>{
 const m=map('G3');assert.equal(m.source.pageCount,36);
 assert.ok(item('G3','worked:6').title.includes('S₈')||item('G3','worked:6').content[0].includes('S₈'));assert.ok(unit(m,12).includes('worked:6'));
 assert.ok(item('G3','quiz:12').prompt.includes('Cr')&&unit(m,27).includes('quiz:12'));
 assert.ok(item('G3','quiz:13').prompt.includes('7 אטומי פחמן')&&unit(m,36).includes('quiz:13'));
 assert.ok(item('G3','quiz:5').prompt.includes('אנילין')&&unit(m,21).includes('quiz:5'));
 assert.ok(unit(m,3).includes('theory:G3-t32')&&unit(m,4).includes('theory:G3-t33'));
 assert.ok(topic('G3').theory.find(b=>b.id==='G3-t32').figure!==undefined||topic('G3').theory.find(b=>b.id==='G3-t32'));
 const add=m.lessonAdditions.flatMap(a=>a.targets);for(const t of['worked:8','quiz:14','quiz:15','theory:G3-t30','theory:G3-t31'])assert.ok(add.includes(t),t);
 assert.ok(item('G3','quiz:14').prompt.includes('מגנזיום'));assert.ok(item('G3','worked:8').content[0].includes('X-63'));
});
test('G9 map: slide pages resolve to the intended teaching items',()=>{
 const m=map('G9');assert.equal(m.source.pageCount,35);
 assert.ok(item('G9','quiz:13').prompt.includes('kPa')&&unit(m,5).includes('quiz:13'));
 assert.ok(item('G9','quiz:14').prompt.includes('מנומטר')&&unit(m,6).includes('quiz:14'));
 assert.ok(item('G9','quiz:15').prompt.includes('הליום')&&unit(m,26).includes('quiz:15'));
 assert.ok(item('G9','quiz:16').prompt.includes('ZnS')&&unit(m,29).includes('quiz:16'));
 assert.ok(item('G9','worked:8').content[0].includes('NaN₃')&&unit(m,28).includes('worked:8'));
 const add=Object.fromEntries(m.lessonAdditions.map(a=>[a.id,a.targets]));
 assert.ok(add.a3.includes('worked:11')&&item('G9','worked:11').content[1].includes('CH₂S'));
 assert.ok(add.a5.includes('quiz:11')&&item('G9','quiz:11').prompt.includes('CS₂'));
 assert.ok(add.a4.includes('quiz:12')&&item('G9','quiz:12').prompt.includes('He'));
 assert.ok(add.a2.includes('worked:5')&&item('G9','worked:5').content[0].includes('250 atm'));
});
test('G3 and G9 figure binding includes the GC1 figure module; other GC1 topics keep the legacy hash',()=>{
 const p=loadPolicy();
 for(const t of['G3','G9']){const r=figuresHashFor('84101',p,undefined,t);assert.deepEqual(r.errors,[]);for(const f of['src/figures-gc1.jsx','src/figures-gc1-extra.jsx','src/figures.jsx','src/figures-core.jsx','src/style.css'])assert.ok(r.files.includes(f),f)}
 const g10=figuresHashFor('84101',p,undefined,'G10');assert.equal(g10.files,null);assert.equal(g10.hash,figuresHash());
});
