import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {finalPrep84101 as layer,finalPrepExam as exam} from '../src/final-prep-84101.js';
import {numericCorrect,loadCourseProgress,courseProgressKey} from '../src/logic.js';
import {undoNotation} from './notation-baseline.js';
const catalogue=JSON.parse(readFileSync(new URL('../src/courses.json',import.meta.url)));
const course=catalogue.courses.find(c=>c.id==='84101');
const topic=id=>course.topics.find(t=>t.id===id);
const R=.08206,NA=6.022e23;
const close=(a,b,rel=1e-8)=>assert.ok(Math.abs(a-b)<=rel*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const includesValues=(text,values)=>{for(const [n,d] of values)assert.ok(text.includes(n.toFixed(d)),`Missing independently calculated ${n.toFixed(d)}`)};
const blocksText=x=>x.solutionBlocks.map(b=>b.math||b.text).join(' ');
const w=(id,i)=>blocksText(layer[id].worked[i]);
const e=id=>exam.find(e=>e.id===id).parts.map(blocksText).join(' ');

test('final preparation is append-only on exact reviewed main; every other byte of the parsed catalogue is retained',()=>{
 const original=structuredClone(catalogue);
 for(const c of original.courses)for(const t of c.topics){
  if(c.id==='84101')t.content.theory=undoNotation(t).content.theory;
  t.source=t.source.split(' תוספת הכנה למבחן:')[0];
  for(const key of ['theory','worked','quiz'])t.content[key]=t.content[key].filter(b=>!b.finalPrep);
 }
 assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),'27cb2127dfcef0b4b3a757c9e93313f33fd90c0b70af410b9a3d8622007ce21b');
 assert.equal(course.topics.length,16);
 for(const [id,add] of Object.entries(layer)){
  for(const k of ['theory','worked','quiz'])assert.deepEqual(topic(id).content[k].filter(x=>x.finalPrep),add[k]);
  const ids=topic(id).content.quiz.map(q=>q.id);assert.equal(new Set(ids).size,ids.length);
  const origIds=topic(id).content.quiz.filter(q=>!q.finalPrep).map(q=>q.id);
  assert.equal(add.quiz[0].id,Math.max(...origIds)+1);
 }
 assert.equal(Object.values(layer).flatMap(x=>x.worked).length,14);
 assert.equal(Object.values(layer).flatMap(x=>x.quiz).length,19);
 // The original eight exam objects are unchanged, down to their source serialization.
 let source=readFileSync(new URL('../src/exam-84101.js',import.meta.url),'utf8');
 source=source.replace("import {finalPrepExam} from './final-prep-84101.js';\n",'').replace(' ...finalPrepExam,\n','');
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/final-prep-exam-baseline.json',import.meta.url)));
 assert.equal(createHash('sha256').update(source).digest('hex'),fixture.sourceSha256);
});

test('all new numeric quiz answers are independently recalculated and accepted with their units',()=>{
 const pressure=R*320/(.75-.04)-3.6/.75**2;
 const radius=Math.sqrt(3)/4*(200/(NA*12))**(1/3)*1e10;
 const expected={G10:[3.6/(R*.04),pressure*.75/(R*320),R*300/.5*(1/.98-.95),1/.96-.04],G12:[radius,2000/12],G13:[20*Math.exp(30000/8.314*(1/300-1/330)),.035*1.505*18/(R*300.15)],G15:[1.86*(3*.01+.02)/.1,.4,.05*R*298.15/.105,.7]};
 for(const [id,values] of Object.entries(expected)){
  const qs=layer[id].quiz.filter(q=>q.type==='numeric');assert.equal(qs.length,values.length);
  qs.forEach((q,i)=>{close(q.fields[0].value,values[i]);assert.ok(numericCorrect([String(values[i])],[q.fields[0].unit],q.fields));});
 }
 for(const add of Object.values(layer))for(const q of add.quiz){assert.ok(q.answer.length>30);if(q.type==='mcq'){assert.equal(q.options.length,4);assert.ok(q.options[q.correct]);}}
});

test('every new worked real-gas answer independently computes; fitted measurements reproduce both inputs',()=>{
 const pid=R*320/.75,rep=R*320/.71,att=3.6/.75**2,p=rep-att;
 includesValues(w('G10',0),[[pid,3],[rep,3],[att,3],[p,3],[p/pid,5],[rep-pid,3]]);
 const a=R*300/.5*(1/.98-.95);includesValues(w('G10',1),[[a,5]]);
 const P1=.2*R*320/.092-2.4*.2**2/.1**2,P2=.2*R*200/.092-2.4*.2**2/.1**2;
 const D=.2*R*(320-200)/(P1-P2),b=(.1-D)/.2,ainferred=(.2*R*320/D-P1)*.1**2/.2**2;
 close(b,.04);close(ainferred,2.4);const pt=.2*R*280/(.2-.2*b)-ainferred*.2**2/.2**2;
 includesValues(w('G10',2),[[P1-P2,6],[pt,5],[pt*.2/(.2*R*280),6]]);
 includesValues(w('G10',3),[[3.6/(R*.04),3],[1/.96-.04,6]]);
 const n=.5*10/(R*300),nb=.6*n,pMix=nb*R*330/(.3-nb*.035)-1.5*nb**2/.3**2;
 includesValues(w('G10',4),[[n,6],[nb,6],[.3-nb*.035,6],[pMix,5]]);
 const nTotal=.15,xi=.18-nTotal,produced=2*xi;close(produced,.06);close(produced/.1,.6);
 const pReact=produced*R*350/(.1-produced*.04)-3.6*produced**2/.1**2;
 includesValues(w('G10',5),[[pReact,5]]);
 // Critical units: a has pressure*volume²/mol²; b volume/mol; both Z terms dimensionless.
 const z1=1/(1-.04)-3.6/(R*320),z2=(R*320/(1-.04)-3.6)/(R*320);close(z1,z2);
});

test('all new worked crystal, phase and solution calculations independently recompute',()=>{
 const r=125e-10,ab=4*r/Math.sqrt(3),af=2*Math.sqrt(2)*r;
 includesValues(w('G12',0),[[ab*1e10,3],[af*1e10,3],[2*60/(NA*ab**3),5],[4*60/(NA*af**3),5]]);
 const a=(200/(NA*12))**(1/3);includesValues(w('G12',1),[[a*1e10,4],[Math.sqrt(3)*a/4*1e10,4],[2000/12,4]]);
 includesValues(w('G13',0),[[20*Math.exp(30000/8.314*(1/300-1/330)),5]]);
 includesValues(w('G13',1),[[.035*1.505*18/(R*300.15),6]]);
 const ns=3*.01+.02,nw=100/18;
 includesValues(w('G15',0),[[1.86*ns/.1,5],[ns*R*298.15/.105,5],[23.76*nw/(nw+ns),5]]);
 const particles=.8928*.5/1.86,alpha=particles/.1-2;close(alpha,.4);
 close(.1+.04,.06+2*.04);includesValues(w('G15',1),[[particles*R*300/.52,5]]);
 close(1.4625/58.5*2,.05);assert.ok(w('G15',2).includes('180.00'));
 const M=5.12*2.4/(1.2*.1),i=2.0925/(1.86*(4.8/M)/.1);close(M,102.4);close(i,2.4);close((i-1)/2,.7);
 includesValues(w('G15',3),[[M,5],[i,6]]);
});

test('all eight new three-part exam scenarios independently recompute',()=>{
 assert.deepEqual(exam.map(p=>p.id),['E9','E10','E11','E12','E13','E14','E15','E16']);
 for(const p of exam){assert.equal(p.parts.length,3);assert.ok(p.given.length>80);}
 for(const [M,a,b] of [[44,3.592,.04267],[4,.0341,.0237]]){
  const n=20/M,pi=n*R*310,P=n*R*310/(1-n*b)-a*n*n;
  includesValues(e('E9'),[[n,6],[pi,5],[P,5],[P/pi,6]]);
 }
 const n=.15,V=.12,T1=330,T2=230,a=2,b=.045,D=V-n*b;
 const P1=n*R*T1/D-a*n*n/V**2,P2=n*R*T2/D-a*n*n/V**2;
 const backD=n*R*(T1-T2)/(P1-P2);close(backD,D);close((V-backD)/n,b);
 const Ptarget=n*R*290/(.24-n*b)-a*n*n/.24**2;
 includesValues(e('E10'),[[P1,6],[P2,6],[Ptarget,6],[Ptarget*.24/(n*R*290),6]]);
 const extent=.22-.18;close(2*extent/.12,2/3);const Pco=.08*R*340/(.12-.08*.04)-3.5*.08**2/.12**2;
 includesValues(e('E11'),[[Pco,6],[Pco*.12/(.08*R*340),6]]);
 includesValues(e('E12'),[[2.5/(R*.05),6],[1/.96-.04,6]]);
 const rad=125e-10,ab=4*rad/Math.sqrt(3),af=2*Math.sqrt(2)*rad,df=240/(NA*af**3);
 includesValues(e('E13'),[[ab*1e10,6],[af*1e10,6],[120/(NA*ab**3),6],[df,6],[180/df,6]]);
 includesValues(e('E14'),[[20*Math.exp(30000/8.314*(1/300-1/330)),6]]);
 const ns=.008*3+.016;includesValues(e('E15'),[[1.86*ns/.1,6],[ns*R*300/.11,6],[26.5*(100/18)/(100/18+ns),6]]);
 const ns16=.8556*.4/1.86;close(ns16,.184);close(ns16/.08-2,.3);close(.08+.024,.056+2*.024);
 includesValues(e('E16'),[[ns16,6],[ns16*R*300/.42,6]]);
});

test('Boyle curve values, model warnings and saved progress are explicit',()=>{
 const a=3.592,b=.04267,TB=a/(R*b);
 for(const c of [0,.1,1,4]){const z=1/(1-b*c)-a*c/(R*TB);close(z-1,(b*c)**2/(1-b*c));}
 assert.ok(layer.G10.theory.some(x=>x.figure==='real-gas-boyle'));
 const figure=readFileSync(new URL('../src/figures-final-prep.jsx',import.meta.url),'utf8');
 assert.ok([...figure.matchAll(/size=\{(\d+)\}/g)].every(m=>+m[1]>=18));
 const text=layer.G10.theory.map(x=>x.text).join(' ');assert.ok(text.includes('מסדר שני'));assert.ok(text.includes('−130°C'));
 assert.ok(layer.G13.theory.some(x=>x.text.includes('הקריטית')&&x.text.includes('אומדן')));
 const old={G10:{complete:true,answers:{2:{correct:true}}},G12:{complete:true},G15:{answers:{1:{correct:true}}}};
 const storage={getItem:k=>k===courseProgressKey('84101')?JSON.stringify(old):null,setItem:()=>{throw Error('no migration')}};
 assert.deepEqual(loadCourseProgress(storage,catalogue.courses)['84101'],old);
});


test('all 38 new solutions use explicit prose/math blocks with no RTL text inside calculations',()=>{
 const solutions=[...Object.values(layer).flatMap(t=>t.worked),...exam.flatMap(p=>p.parts)];
 assert.equal(solutions.length,38);
 for(const s of solutions){assert.ok(s.solutionBlocks.length>0);for(const b of s.solutionBlocks){assert.ok(b.math||b.text);if(b.math)assert.ok(!/[\u0590-\u05ff]/u.test(b.math));}}
});
