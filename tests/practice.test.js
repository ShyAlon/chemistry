import catalogueSource from '#catalogue';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforePractice,beforeVanadium,corrections} from './practice-baseline.js';
import {numericCorrect} from '../src/logic.js';
import {symbolRows} from '../src/symbols.js';
const data=structuredClone(catalogueSource);
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
// G3 quiz 4 gained the additive answerLines display field; the baseline keeps the pre-field digest.
const withoutG3AnswerLines=(courseId,topic)=>{if(courseId!=='84101'||(topic.id!=='G3'&&topic.id!=='G2'))return topic;const copy=structuredClone(topic);if(topic.id==='G3')delete copy.content.quiz.find(q=>q.id===4).answerLines;else for(const q of copy.content.quiz)delete q.answerLines;return copy};
test('every prior topic, question id and answer matches fixed reviewed baseline after explicit exemptions',()=>{
 const baseline=JSON.parse(readFileSync(new URL('./fixtures/practice-baseline.json',import.meta.url)));
 for(const c of data.courses.filter(c=>c.id!=='general-chemistry-2'))for(const topic of c.topics.filter(t=>!t.provenance?.edition?.startsWith('inorganic-recap-'))){const key=c.id+'/'+topic.id;assert.equal(createHash('sha256').update(JSON.stringify(beforeVanadium(beforePractice(withoutG3AnswerLines(c.id,topic))))).digest('hex'),baseline[key],key)}
 assert.equal(corrections.length,19);assert.deepEqual(corrections.map(c=>c.topic),['G10','G10','G10','G11','G11','G1','G1','G1','G1','G1','G1','G1','G1','G2','G2','G2','G2','G2','G2']);
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
test('displayed compact Maxwell expression retains pi in its exponent',()=>{
 const text=t('G10').content.theory.find(b=>b.batch2&&b.text?.startsWith('A =')).text;
 assert.ok(text.includes('A = M/(2πRT)'));assert.ok(text.includes('exp(−πAv²)'));const sheet=readFileSync(new URL('../src/reference-formulas.js',import.meta.url),'utf8');assert.ok(sheet.includes('B = 4πA√A ; f(v)=Bv²·exp(−πAv²)'));
 for(const [v,M,T] of [[410,.028,300],[120,.017,313.15]]){const A=M/(2*Math.PI*R*T);assert.ok(Math.abs(4*Math.PI*A*Math.sqrt(A)*v*v*Math.exp(-Math.PI*A*v*v)/density(v,M,T)-1)<1e-12)}
});

test('batch4 slide-10 layer: explicit Maxwell-Boltzmann fraction equation, legend and equivalence',()=>{
 const allG10=t('G10').content.theory;
 const mbIntro=allG10.find(b=>b.batch4&&b.text?.includes('שקופית 10'));
 const blocks=allG10.slice(allG10.indexOf(mbIntro),allG10.indexOf(mbIntro)+3);
 assert.equal(blocks.length,3);
 const [intro,eq,legend]=blocks;
 assert.ok(intro.text.includes('משוואת מקסוול–בולצמן')&&intro.text.includes('שקופית 10'));
 assert.equal(eq.layout,'equation');
 assert.ok(eq.text.replace(/ +/g,'').includes('ΔN/N≈4π(Mw/(2πRT))^(3/2)·v²·exp(−Mwv²/(2RT))·Δv'));
 for(const [v,dv,M,T] of [[410,20,.017,313.15],[571,1,.044,473.15]]){
  const explicit=4*Math.PI*(M/(2*Math.PI*R*T))**1.5*v*v*Math.exp(-M*v*v/(2*R*T))*dv;
  assert.ok(Math.abs(explicit/(density(v,M,T)*dv)-1)<1e-12);
 }
 for(const fragment of ['ΔN','N —','kg/mol','8.314','m/s','≈','אינטגרל','Mw'])assert.ok(legend.text.includes(fragment),fragment);
 for(const s of eq.symbols)assert.doesNotThrow(()=>symbolRows([s]),s);
 const sheet=readFileSync(new URL('../src/reference-formulas.js',import.meta.url),'utf8');
 assert.ok(sheet.replace(/ +/g,'').includes('ΔN/N≈4π(Mw/(2πRT))^(3/2)·v²·exp(−Mwv²/(2RT))·Δv'));
 assert.ok(sheet.includes(eq.text));
 assert.ok(sheet.includes('B = 4πA√A ; f(v)=Bv²·exp(−πAv²)'));
});

test('remaining worked arithmetic independently recomputes at displayed precision',()=>{
 const worked=id=>t(id).content.worked.filter(w=>w.batch2);
 assert.ok(worked('G1')[1].content[1].includes((.5*.0075*(1300/3.6)**2).toFixed(3)));
 assert.ok(worked('G1')[2].content[1].includes((.150/3.51).toFixed(6)));
 const heating=worked('G10')[0].content[1];assert.ok(heating.includes(Math.sqrt(373.15/273.15).toFixed(5)));assert.ok(heating.includes(Math.sqrt(2*R*373.15/.028).toFixed(3)));assert.ok(heating.includes((1.5*5.2/28*R*373.15).toFixed(3)));
 const kinetic=worked('G10')[1].content[1];assert.ok(kinetic.includes((1e-25*100**2/(3*1.380649e-23)).toFixed(4)));assert.ok(kinetic.includes((2*50/(3*.001)).toFixed(1)));
 assert.ok(worked('G10')[4].content[1].includes((4*Math.sqrt(7)/(1+4*Math.sqrt(7))).toFixed(5)));
});

const additions3=key=>general.topics.flatMap(t=>t.content[key].filter(b=>b.batch3));
test('batch3 exam-gap layer: 9 theory blocks, 5 worked examples and 5 questions across G9, G10 and G14',()=>{
 assert.equal(additions3('theory').length,9);assert.equal(additions3('worked').length,5);assert.equal(additions3('quiz').length,5);
 assert.deepEqual(general.topics.filter(t=>t.content.quiz.some(q=>q.batch3)).map(t=>t.id),['G9','G10','G14']);
});
test('all batch3 numeric answers independently recompute',()=>{
 const R=0.08206,TK=298.15;
 const g9=t('G9').content.quiz.find(q=>q.batch3&&q.type==='numeric');
 const expected9=0.1*R*TK/5+23.76/760;
 assert.ok(Math.abs(expected9-g9.fields[0].value)<1e-4,'G9 condensation pressure');
 assert.ok(g9.answer.includes('23.76'));
 const g10=t('G10').content.quiz.find(q=>q.batch3&&q.type==='numeric');
 assert.ok(Math.abs(380/1.18e-7-g10.fields[0].value)/g10.fields[0].value<1e-4,'G10 collision frequency');
 const g14=t('G14').content.quiz.find(q=>q.batch3&&q.type==='numeric');
 assert.ok(Math.abs((0.5*100)/(0.5*100+0.5*25)-g14.fields[0].value)<1e-10,'G14 vapor composition');
 const mcq=t('G10').content.quiz.filter(q=>q.batch3&&q.type==='mcq');
 assert.equal(mcq.length,2);assert.equal(mcq[0].correct,2);assert.equal(mcq[1].correct,1);
});
test('batch3 worked examples carry the verified headline numbers',()=>{
 const lam=8.314*300.15/(Math.SQRT2*Math.PI*(3.4e-10)**2*6.022e23*60795);
 assert.ok(Math.abs(lam-1.33e-7)/1.33e-7<0.01);
 const w10=t('G10').content.worked.filter(w=>w.batch3);
 const w10text=w10[0].content.join(' ');assert.ok(w10text.includes('1.33×10⁻⁷')&&w10text.includes('2.9×10⁹')); /* layout split into short math lines for phone; numbers verified across the item */
 const q=0.2*2.5*8.314*100;assert.ok(Math.abs(q-415.7)<0.1);
 const w11text=w10[1].content.join(' ');assert.ok(w11text.includes('416 J')&&w11text.includes('99.4 cal')); /* same short-line layout */
 assert.ok(w10[2].content[1].includes('52.9 atm')&&w10[2].content[1].includes('0.863'));
 const w9=t('G9').content.worked.find(w=>w.batch3);
 const p9=0.2*0.08206*298.15/8+23.76/760;assert.ok(Math.abs(p9-0.643)<0.001);
 assert.ok(w9.content[1].includes('0.643 atm'));
 const w14=t('G14').content.worked.find(w=>w.batch3);
 for(const y of ['0.798','0.930','0.978'])assert.ok(w14.content[1].includes(y),'G14 cycle '+y);
});
