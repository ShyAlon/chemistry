import {fixT40} from './g15-t40.js';
import catalogueSource from '#catalogue';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeRecap} from './practice-baseline.js';
import {undoNotation} from './notation-baseline.js';
import {numericCorrect,parseRoute} from '../src/logic.js';
import {courses as formulas} from '../src/reference-formulas.js';
const data=structuredClone(catalogueSource);
const course=data.courses[0],added=course.topics.slice(10),find=id=>course.topics.find(t=>t.id===id);
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const q=(t,n)=>find(t).content.quiz.find(q=>q.id===n);

test('recap edition integrates all ten topics plus affinity and mixed review, with full answers',()=>{
 assert.deepEqual(added.map(t=>t.id),['P11','P12']);
 assert.equal(course.topics.length,12);assert.equal(course.topics.flatMap(t=>t.content.quiz).length,83);
 assert.equal(course.topics.flatMap(t=>t.content.worked.filter(w=>w.recap)).length,23);
 for(const t of course.topics.slice(0,10)){
  assert.ok(t.source.includes('Recap lesson 1'));assert.ok(t.source.includes('שיעור הכנה לבוחן'));
  assert.ok(t.recapSources.recapSlides&&t.recapSources.examPrepSlides);
  assert.ok(t.content.theory.some(b=>b.recap));assert.ok(t.content.worked.some(w=>w.recap));
 }
 for(const t of added){
  assert.equal(t.provenance.answerAuthority,'independently-computed-not-official');
  assert.ok(t.provenance.verificationSources.every(s=>s.startsWith('https://')));
  assert.ok(t.content.theory.some(b=>b.style==='Figure'));assert.ok(t.content.theory.some(b=>b.style==='Callout'));
  assert.equal(new Set(t.content.quiz.map(q=>q.id)).size,t.content.quiz.length);
  for(const q of t.content.quiz){assert.ok(q.prompt&&q.answer);if(q.type==='mcq'){assert.equal(q.options.length,4);assert.ok(q.options[q.correct])}if(q.type==='numeric'){const f=q.fields[0];assert.ok(numericCorrect([String(f.value)],[f.unit],q.fields));assert.ok(!numericCorrect(['0'],[f.unit],q.fields),'zero must not pass a small answer');assert.ok(!numericCorrect([String(f.value*1.1)],[f.unit],q.fields),'10% error must fail')}}
 }
});
test('all 57 previous inorganic questions and IDs stay byte-for-byte identical',()=>{
 assert.equal(digest(course.topics.slice(0,10).map(t=>({id:t.id,quiz:t.content.quiz}))), 'ae67e2b5d0ea82a763ad1063ce2105143c4495fe0fba1c5c5d40be2bd84efd8a');
});
test('entire General Chemistry course is unchanged outside the flagged batch3 exam-gap additions',()=>{
 const c=JSON.parse(JSON.stringify(data.courses[1]));
 // G3 quiz 4 gained the additive answerLines display field (one LTR line per compound); the baseline keeps the pre-field digest.
 delete c.topics.find(t=>t.id==='G3').content.quiz.find(q=>q.id===4).answerLines;
 for(const t of c.topics){if(t.id==='G15')for(const b of t.content.theory)fixT40(b);t.content.theory=undoNotation(t).content.theory;t.source=t.source.split(' תוספת הכנה למבחן:')[0];for(const k of ['theory','worked','quiz'])t.content[k]=t.content[k].filter(b=>!b.batch3&&!b.batch4&&!b.batch5&&!b.finalPrep);}
 // G10 quiz 1 answer was intentionally repaired in the source audit (3718.55 -> 3718.45 = 3/2*8.3145*298.15); keep the pre-repair text so the baseline digest still proves every other byte.
 c.topics.find(t=>t.id==='G10').content.quiz.find(x=>x.id===1).answer='Ēₖ=3RT/2=3718.55 J/mol.';
 // G10 worked 1 answer line repaired in the same audit round (3718.55 -> 3718.45); same fixture pattern.
 c.topics.find(t=>t.id==='G10').content.worked[0].content=['GC4 עמ׳ 7: מה האנרגיה הקינטית התרגומית הממוצעת למול ב-25°C? R=8.3145.','E=1.5×8.3145×298.15=3718.55 J/mol. למולקולה מחלקים ב-6.022×10²³ ומקבלים כ-6.175×10⁻²¹ J.'];
 {const th=c.topics.find(t=>t.id==='G10').content.theory;
 for(const b of th)delete b.id; // stable ids added for source-coverage mapping; baseline keeps the pre-id digest.
 }
 for(const id of ['G3','G9','G13','G14','G15'])for(const b of c.topics.find(t=>t.id===id).content.theory){delete b.id;fixT40(b)} // G13/G14/G15 gained stable theory-block ids for source-coverage mapping (batch 1); same fixture pattern as G10.
 assert.equal(digest(c),'d0929b3c50f11fd0e378302cf578afd9983ba6cb1110881864eb9dac452d0cf3');
});
test('reviewed earlier inorganic data reconstructs with only documented additions and corrections',()=>{
 assert.equal(digest(course.topics.slice(0,10).map(beforeRecap)),'aece875a727588a716dded08242ca9b3cbd2bab2bf28e5d3848b4bff13c5defa');
 const changes=JSON.parse(readFileSync(new URL('../src/recap-corrections.json',import.meta.url)));
 assert.equal(changes.length,14);
 assert.ok(find('P6').content.theory.some(b=>b.text.includes('P(r)=r²|R(r)|²')));
 assert.ok(find('P8').content.theory.some(b=>b.text.includes('אינו פתרון מדויק')));
 assert.ok(find('P10').content.theory.some(b=>b.text.includes('אנרגיית קשירה חיובית')));
});
test('independent numeric checks cover every new numeric answer and sign convention',()=>{
 const h=6.62607015e-34,c=299792458,e=1.602176634e-19,m=9.1093837139e-31;
 const values={P11:{1:349,2:-24,5:(10+2)/2},P12:{1:16/4,2:13.6*(1/4-1/16),3:h*c/(13.6*e)*1e9,4:h*c/(13.6*(1/4-1/25)*e)*1e9,5:h/(2*m*2.5*e)**.5*1e9,6:h/(4*Math.PI*m*.15e-9),7:4*(7.9/13.6)**.5,8:13.6*3.25**2/36,14:1254-384,17:h/(1.7e6*2.5e-10)/1e-30}};
 for(const [id,questions]of Object.entries(values))for(const [n,v]of Object.entries(questions))assert.ok(Math.abs(q(id,+n).fields[0].value/v-1)<1e-12,id+'/'+n);
 const all=added.flatMap(t=>t.content.quiz.filter(q=>q.type==='numeric'));assert.equal(all.length,13);
 assert.equal(q('P12',17).fields[0].unit,'10⁻³⁰ kg');
 // Source concept-check keys: 4x, 2.55 eV; 91.2 nm; three electrons; free Fe3+ d5.
 assert.equal(q('P12',9).options[q('P12',9).correct],'3');assert.equal(q('P12',10).options[q('P12',10).correct],'Fe³⁺');
});
test('new topic routes and formula coverage coexist',()=>{
 for(const t of added){assert.equal(parseRoute('course/84102/'+t.id,data.courses).topicId,t.id);assert.ok(formulas[0].topics.some(x=>x.id===t.id))}
});
