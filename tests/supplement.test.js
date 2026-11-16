import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {numericCorrect,parseRoute,loadCourseProgress,courseProgressKey} from '../src/logic.js';
import {courses as sheet} from '../src/reference-formulas.js';
const data=JSON.parse(readFileSync(new URL('../src/courses.json',import.meta.url)));
const course=data.courses.find(c=>c.id==='84101');const added=course.topics.slice(12);
const q=(t,id)=>added.find(t0=>t0.id===t).content.quiz.find(q=>q.id===id);
test('supplement appends four sourced topics, 16 examples and 26 complete questions',()=>{
 assert.deepEqual(added.map(t=>t.id),['G13','G14','G15','G16']);assert.equal(added.flatMap(t=>t.content.quiz).length,26);assert.equal(added.flatMap(t=>t.content.worked).length,16);
 for(const t of added){assert.ok(t.provenance.sourceReferences.includes('.pdf'));assert.ok(t.provenance.verificationSources.every(x=>x.startsWith('https://')));assert.ok(t.content.theory.length>=14);assert.equal(new Set(t.content.quiz.map(q=>q.id)).size,t.content.quiz.length);for(const q of t.content.quiz){assert.ok(q.answer);if(q.type==='mcq'){assert.ok(q.options[q.correct]);assert.equal(q.options.length,4)}if(q.type==='numeric')for(const f of q.fields)assert.ok(numericCorrect([String(f.value)],[f.unit],[f]))}}
});
test('independent arithmetic checks all new numeric answers',()=>{
 const expected={'G13':[20*Math.exp(-40000/8.314*(1/320-1/300)),.4*5,5000*8.314/1000],'G14':[.25*80+.75*40,20/50,.002*.3],'G15':[1.86*(.05/.25),3*.512*.1,.02*.082057*298,.0361/(1.86*.01)],'G16':[160*Math.pow(.5,12/4),Math.log(2)/10,.02*931.494,250*.01]};
 for(const [id,values] of Object.entries(expected))values.forEach((v,i)=>assert.ok(Math.abs(q(id,i+1).fields[0].value-v)<1e-10,id+'/'+(i+1)));
});
test('worked calculations keep signs, atomic masses and explicit solution volume',()=>{
 const be=(2*1.007825+2*1.008665-4.002603)*931.494;
 assert.ok(added[3].content.worked[0].content[1].includes(be.toFixed(5)));
 assert.ok(added[2].content.worked[3].content[1].includes((1.5*.082057*298/(.25*.25)).toFixed(5)));
 assert.ok(added[3].content.worked[3].content[1].includes((5730*Math.log(1/.3)/Math.log(2)).toFixed(3)));
 assert.ok(added[2].content.worked[0].content[1].includes('−0.372'));
});
test('all original topics and questions are byte-for-byte semantically unchanged',()=>{
 // Fixed from reviewed main 0d40e61. Does not require historical Git objects in CI.
 const original=[data.courses[0].topics,course.topics.slice(0,12)];
 assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),'5f07203833c2d48632c533dd0ab982bdfdf86102e6060d7aed67f5a8487bd7c0');
});
test('old progress persists and new routes resolve without any storage migration',()=>{
 const old={'G1':{complete:true},'G12':{complete:true}};
 const storage={getItem:k=>k===courseProgressKey('84101')?JSON.stringify(old):null,setItem:()=>{throw Error('unexpected write')}};
 assert.deepEqual(loadCourseProgress(storage,data.courses)['84101'],old);
 for(const t of added)assert.equal(parseRoute('course/84101/'+t.id,data.courses).topicId,t.id);
});
test('new figures are registered, labels meet 18px and formula sheet covers additions',()=>{
 const registry=readFileSync(new URL('../src/figures.jsx',import.meta.url),'utf8');
 const figs=added.flatMap(t=>t.content.theory.filter(p=>p.style==='Figure'));assert.equal(figs.length,5);
 for(const f of figs)assert.ok(registry.includes("'"+f.figure+"':"));
 const jsx=readFileSync(new URL('../src/figures-supplement.jsx',import.meta.url),'utf8');
 assert.ok([...jsx.matchAll(/size=\{(\d+)\}/g)].every(m=>+m[1]>=18));
 for(const t of added)assert.ok(sheet.find(c=>c.id==='84101').topics.some(x=>x.id===t.id));
});
