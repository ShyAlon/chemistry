import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
const topic=JSON.parse(fs.readFileSync(new URL('../src/content/84101/topics/G4.json',import.meta.url),'utf8'));
const map=JSON.parse(fs.readFileSync(new URL('../ingest/84101/coverage/G4.json',import.meta.url),'utf8'));
const unit=id=>map.pages.flatMap(p=>p.units).find(u=>u.id===id);
test('G4 map targets point at the intended worked items (index-to-title)',()=>{
 const w=n=>topic.content.worked[n-1];
 assert.match(w(2).content[0],/MnO₂/);assert.ok(unit('p16.u1').targets.includes('worked:2'));assert.ok(!unit('p16.u1').targets.includes('worked:4'));
 assert.ok(!unit('p07.u1').targets.some(t=>t.startsWith('worked:')));
 assert.match(w(3).title,/איזון שריפה/);assert.match(w(4).title,/מגרמי מגיב/);
 const add=map.lessonAdditions.flatMap(a=>a.targets);assert.ok(add.includes('worked:3')&&add.includes('worked:4'));
 assert.ok(!JSON.stringify(topic).includes('הממולא'),'student text must not point at the filled homework file');
});
