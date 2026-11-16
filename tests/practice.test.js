import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforePractice,beforeVanadium,corrections} from './practice-baseline.js';
import {numericCorrect,loadCourseProgress,courseProgressKey} from '../src/logic.js';
const data=JSON.parse(readFileSync(new URL('../src/courses.json',import.meta.url)));
const general=data.courses.find(c=>c.id==='84101');
const t=id=>general.topics.find(t=>t.id===id);
const additions=key=>general.topics.flatMap(t=>t.content[key].filter(b=>b.batch2));
const R=8.314462618;
const density=(v,M,T)=>4*Math.PI*(M/(2*Math.PI*R*T))**1.5*v*v*Math.exp(-M*v*v/(2*R*T));
function simpson(f,a,b,n=10000){const h=(b-a)/n;let sum=f(a)+f(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3}
test('practice enriches four existing topics without duplicate topics; 15 examples and 21 questions',()=>{
 assert.equal(general.topics.length,16);assert.equal(additions('worked').length,15);assert.equal(additions('quiz').length,21);assert.equal(additions('theory').length,38);
 assert.deepEqual(general.topics.filter(t=>t.content.quiz.some(q=>q.batch2)).map(t=>t.id),['G1','G9','G10','G11']);
 for(const t of general.topics){assert.equal(new Set(t.content.quiz.map(q=>q.id)).size,t.content.quiz.length);for(const q of t.content.quiz){assert.ok(q.answer);if(q.type==='numeric')assert.ok(numericCorrect([String(q.fields[0].value)],[q.fields[0].unit],q.fields));if(q.type==='mcq'){assert.equal(q.options.length,4);assert.ok(q.options[q.correct])}}}
});
test('every prior topic, question id and answer matches fixed reviewed baseline after explicit exemptions',()=>{
 const baseline=JSON.parse(readFileSync(new URL('./fixtures/practice-baseline.json',import.meta.url)));
 for(const c of data.courses)for(const topic of c.topics){const key=c.id+'/'+topic.id;assert.equal(createHash('sha256').update(JSON.stringify(beforeVanadium(beforePractice(topic)))).digest('hex'),baseline[key],key)}
 assert.equal(corrections.length,4);assert.deepEqual(corrections.map(c=>c.topic),['G10','G10','G10','G11']);
});
test('all eleven new numeric question answers independently recompute',()=>{
 const expected={G1:[90/3.6,7*.1,77-273.15,(3400-1000)/2000],G9:[(250-205)/2,22.5/205],G10:[Math.sqrt(1200/300),Math.sqrt(2*R*300/.028),1.5*120,Math.sqrt(2/44)],G11:[1/4]};
 for(const [id,values]of Object.entries(expected)){const qs=t(id).content.quiz.filter(q=>q.batch2&&q.type==='numeric');assert.equal(qs.length,values.length);values.forEach((v,i)=>assert.ok(Math.abs(v-qs[i].fields[0].value)<1e-10,id+'/'+qs[i].id))}
});
test('Maxwell midpoint examples agree with quadrature and units; distribution and marker order are valid',()=>{
 for(const T of[313.15,673.15]){const f=v=>density(v,.017,T);const midpoint=f(410)*20,exact=simpson(f,400,420);assert.ok(Math.abs(midpoint/exact-1)<.0003);const example=t('G10').content.worked.find(w=>w.batch2&&w.title.includes('חלון מהירויות צר'));assert.ok(example.content[1].includes(midpoint.toFixed(7)));assert.ok(example.content[1].includes((midpoint*1.5/17).toFixed(7)))}
 assert.ok(Math.abs(simpson(v=>density(v,.028,300),0,5000)-1)<1e-10);
 const mp=Math.sqrt(2*R*300/.028),avg=Math.sqrt(8*R*300/(Math.PI*.028)),rms=Math.sqrt(3*R*300/.028);assert.ok(mp<avg&&avg<rms);
 const T=303.15,M=.03,v=Math.sqrt(2*R*T/M);const fraction=density(v+.05,M,T)*.1;const rho=2.45e19/(6.02214076e23*fraction)*30/2;
 assert.ok(t('G10').content.worked.find(w=>w.title.includes('לצפיפות')&&w.batch2).content[1].includes(rho.toFixed(5)));
});
test('reaction pressure bookkeeping is balanced and energy/effusion quantity distinctions survive',()=>{
 const delta=22.5,final=[125-delta,125-2*delta,delta];assert.equal(final.reduce((a,b)=>a+b),205);assert.equal(delta/125,.18);assert.ok(t('G9').content.worked.find(w=>w.batch2&&w.title.includes('בבסיס')).content[1].includes((12.5*.082057*300/(748/760)).toFixed(4)));assert.equal(2*delta/125,.36);
 assert.ok(t('G9').content.theory.find(b=>b.batch2&&b.layout==='equation').text.includes('2H₂'));
 assert.ok(t('G10').content.theory.some(b=>b.batch2&&b.text.includes('תרגומיות בלבד')));
 assert.ok(t('G10').content.worked.some(w=>w.batch2&&w.content[1].includes('0.21320')));
 const water=100*90.075/249.682;assert.ok(t('G11').content.worked.find(w=>w.batch2&&w.title.includes('מי גביש')).content[1].includes(water.toFixed(4)));
});
test('new figures have registered ids, 18-unit labels and formula blocks use the existing renderer',()=>{
 const reg=readFileSync(new URL('../src/figures.jsx',import.meta.url),'utf8'),jsx=readFileSync(new URL('../src/figures-practice.jsx',import.meta.url),'utf8');
 assert.equal(additions('theory').filter(b=>b.style==='Figure').length,3);
 for(const b of additions('theory').filter(b=>b.style==='Figure'))assert.ok(reg.includes("'"+b.figure+"':"));
 assert.ok([...jsx.matchAll(/size=\{(\d+)\}/g)].every(m=>+m[1]>=18));
 for(const b of additions('theory').filter(b=>b.layout==='equation')){assert.equal(b.style,'Normal');assert.ok(!b.text.includes('\n'))}
});
test('adding practice does not clear previously complete lessons or stored answer ids',()=>{
 const old={G1:{complete:true,answers:{1:{correct:true}}},G10:{complete:true,score:5}};
 const storage={getItem:k=>k===courseProgressKey('84101')?JSON.stringify(old):null,setItem:()=>{throw Error('must not migrate')}};
 assert.deepEqual(loadCourseProgress(storage,data.courses)['84101'],old);
});

test('displayed compact Maxwell expression retains pi in its exponent',()=>{
 const text=t('G10').content.theory.find(b=>b.batch2&&b.text?.startsWith('A =')).text;
 assert.ok(text.includes('A = M/(2πRT)'));assert.ok(text.includes('exp(−πAv²)'));assert.ok(readFileSync(new URL('../src/reference-formulas.js',import.meta.url),'utf8').includes('exp(−πAv²)'));
 for(const [v,M,T] of [[410,.028,300],[120,.017,313.15]]){const A=M/(2*Math.PI*R*T);assert.ok(Math.abs(4*Math.PI*A*Math.sqrt(A)*v*v*Math.exp(-Math.PI*A*v*v)/density(v,M,T)-1)<1e-12)}
});

test('remaining worked arithmetic independently recomputes at displayed precision',()=>{
 const worked=id=>t(id).content.worked.filter(w=>w.batch2);
 assert.ok(worked('G1')[1].content[1].includes((.5*.0075*(1300/3.6)**2).toFixed(3)));
 assert.ok(worked('G1')[2].content[1].includes((.150/3.51).toFixed(6)));
 const heating=worked('G10')[0].content[1];assert.ok(heating.includes(Math.sqrt(373.15/273.15).toFixed(5)));assert.ok(heating.includes(Math.sqrt(2*R*373.15/.028).toFixed(3)));assert.ok(heating.includes((1.5*5.2/28*R*373.15).toFixed(3)));
 const kinetic=worked('G10')[1].content[1];assert.ok(kinetic.includes((1e-25*100**2/(3*1.380649e-23)).toFixed(4)));assert.ok(kinetic.includes((2*50/(3*.001)).toFixed(1)));
 assert.ok(worked('G10')[4].content[1].includes((4*Math.sqrt(7)/(1+4*Math.sqrt(7))).toFixed(5)));
});
