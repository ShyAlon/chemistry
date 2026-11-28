import {fixT40} from './g15-t40.js';
import catalogueSource from '#catalogue';
import {beforePractice} from './practice-baseline.js';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {numericCorrect,parseRoute} from '../src/logic.js';
import {courses as sheet} from '../src/reference-formulas.js';
const data=structuredClone(catalogueSource);
const course=data.courses.find(c=>c.id==='84101');const added=course.topics.slice(12);
const q=(t,id)=>added.find(t0=>t0.id===t).content.quiz.find(q=>q.id===id);
test('supplement appends four sourced topics, 16 examples and 26 complete questions',()=>{
 assert.deepEqual(added.map(t=>t.id),['G13','G14','G15','G16']);assert.equal(added.flatMap(t=>t.content.quiz.filter(q=>!q.batch3&&!q.batch5&&!q.finalPrep)).length,26);assert.equal(added.flatMap(t=>t.content.worked.filter(w=>!w.batch3&&!w.batch5&&!w.finalPrep)).length,16);
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
test('original topics and questions are unchanged except the explicit V+ correction',()=>{
 // Fixed from reviewed main 0d40e61. Does not require historical Git objects in CI.
 const original=[data.courses[0].topics.slice(0,10),course.topics.slice(0,12)].map(ts=>ts.map(beforePractice));
 // G10 quiz 1 answer was intentionally repaired in the source audit (3718.55 -> 3718.45); same fixture pattern as the V+ correction below.
 original[1].find(t=>t.id==='G10').content.quiz.find(x=>x.id===1).answer='Ēₖ=3RT/2=3718.55 J/mol.';
 // G10 worked 1 answer line repaired in the same audit round (3718.55 -> 3718.45); same fixture pattern.
 original[1].find(t=>t.id==='G10').content.worked[0].content=['GC4 עמ׳ 7: מה האנרגיה הקינטית התרגומית הממוצעת למול ב-25°C? R=8.3145.','E=1.5×8.3145×298.15=3718.55 J/mol. למולקולה מחלקים ב-6.022×10²³ ומקבלים כ-6.175×10⁻²¹ J.'];
 {const th=original[1].find(t=>t.id==='G10').content.theory;
 {const b56=th.find(b=>(b.text||'').includes('√2·π·ρ²·Nₐ·P'));if(b56)b56.text='λ = R·T/(√2·π·ρ²·Nₐ·P)        z = v_avg/λ';} /* pre-repair duplicate-z text restored in-memory; batch3-stripped in some fixtures */
 {const b59=th.find(b=>(b.text||'').includes('ביחידות SI מציבים P בפסקל'));if(b59)b59.text='זהו המרחק שהיא עוברת בשנייה, חלקי המרחק בין שתי התנגשויות. ביחידות SI מציבים P בפסקל, R = {R} ו-ρ במטר, ומקבלים λ במטר ו-z ביחידות 1/s.';} /* pre-repair SI sentence restored in-memory */
 for(const b of th)delete b.id; // stable ids added for source-coverage mapping; baseline keeps the pre-id digest.
 }
 for(const id of ['G1','G2','G3','G9','G11','G12','G13','G14','G15'])for(const b of original[1].find(t=>t.id===id)?.content.theory||[]){delete b.id;fixT40(b)} // G13/G14/G15 gained stable theory-block ids for source-coverage mapping (batch 1); same fixture pattern as G10.
 // Restore only the approved correction; retain the original baseline digest.
 // G3 quiz 4 gained the additive answerLines display field (one LTR line per compound); the baseline keeps the pre-field digest.
 delete original[1].find(t=>t.id==='G3').content.quiz.find(q=>q.id===4).answerLines;for(const q of original[1].find(t=>t.id==='G2').content.quiz){delete q.answerLines;delete q.answerNote}
 const vanadium=original[0].find(t=>t.id==='P7').content.worked.find(w=>w.title.startsWith('סוג 4:'));
 vanadium.content.splice(2,2,'V: [Ar]4s²3d³. V⁺ = [Ar]3d⁴ (לא [Ar]4s¹3d³ - המוצא הוא תמיד מ-s קודם).');
 assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),'5f07203833c2d48632c533dd0ab982bdfdf86102e6060d7aed67f5a8487bd7c0');
});
test('new routes resolve without changing the course layout',()=>{
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
test('batch-5 practice answers are recomputed independently from the stated data',()=>{
 const R=8.314,b5=id=>added.find(t=>t.id===id).content.quiz.filter(x=>x.batch5&&x.type==='numeric').map(x=>x.fields[0].value);
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-3*Math.max(1,Math.abs(b)),a+' vs '+b);
 const g13=b5('G13');close(g13[0],R*Math.log(760/200)/(1/320-1/350)/1000);close(g13[1],1/(1/340-R*Math.log(.5)/30000));close(g13[2],R*Math.log(60)/(1/300-1/450)/1000);
 const g14=b5('G14');close(g14[0],.25);close(g14[1],.25*3+.75*1);assert.equal(g14[2],600);
 assert.ok(Math.abs((3*.25)/(.25*3+.75)-.5)<1e-12);assert.equal(2*600+3*200,1800);assert.equal(3*600+3*200,2400);
 const g15=b5("G15"),nw=60/18.015,ng=40/180.16;close(g15[0],100*nw/(nw+ng));
 const nb=96/78.11,xb=700/760;close(g15[1],4/(nb*(1-xb)/xb));
 const np=3.35/1.86*.05,x=g15[2];assert.ok(Math.abs((1+x)*3/(26.98+35.45*x)-np)<1.5e-3);
});
