import {revertG11,revertG1} from './g11-revert.js';
import {fixT40} from './g15-t40.js';
import catalogueSource from '#catalogue';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {finalPrep84101 as layer,finalPrepExam as exam} from '../src/final-prep-84101.js';
import {numericCorrect} from '../src/logic.js';
import {undoNotation,undoFormulaReview} from './notation-baseline.js';
const catalogue=structuredClone(catalogueSource);
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
 // Nuclear E5 was intentionally repaired (source coverage). Its pre-repair topic is kept verbatim as a fixture so the
 // original hash still proves every OTHER topic is byte-identical; E5 itself is pinned by the nuclear snapshot test.
 {const n=original.courses.find(c=>c.id==='nuclear'),i=n.topics.findIndex(t=>t.id==='E5');n.topics[i]=JSON.parse(readFileSync(new URL('./fixtures/nuclear-E5-before-repair.json',import.meta.url)))}
 // Nuclear E6 was intentionally repaired (source coverage, stable ids, reviewer corrections); same fixture pattern as E5.
 {const n=original.courses.find(c=>c.id==='nuclear'),i=n.topics.findIndex(t=>t.id==='E6');n.topics[i]=JSON.parse(readFileSync(new URL('./fixtures/nuclear-E6-before-repair.json',import.meta.url)))}
 // Solid State SS1-SS4 gained stable theory-block ids for source-coverage mapping; same fixture pattern as E5/E6.
 for(const id of ['SS1','SS2','SS3','SS4']){const n=original.courses.find(c=>c.id==='solid-state'),i=n.topics.findIndex(t=>t.id===id);n.topics[i]=JSON.parse(readFileSync(new URL('./fixtures/solid-state-'+id+'-before-repair.json',import.meta.url)))}
 original.courses=original.courses.filter(c=>c.id!=='general-chemistry-2');
 // G3 quiz 4 gained the additive answerLines display field (one LTR line per compound); the baseline keeps the pre-field digest.
 delete original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G3').content.quiz.find(q=>q.id===4).answerLines;
 // Nano N13 is a new topic authored after the reviewed-main snapshot this hash protects; drop it so the hash still proves every pre-existing byte is retained.
 {const n=original.courses.find(c=>c.id==='nano');n.topics=n.topics.filter(t=>t.id!=='N13');}
 for(const c of original.courses)for(const t of c.topics){
  if(c.id==='84101'&&t.id==='G15')for(const b of t.content.theory)fixT40(b);
  if(c.id==='84101')t.content.theory=undoNotation(t).content.theory;
  else undoFormulaReview(t);
  t.source=t.source.split(' תוספת הכנה למבחן:')[0];
  for(const key of ['theory','worked','quiz'])t.content[key]=t.content[key].filter(b=>!b.finalPrep&&!b.batch4&&!b.batch5);
 }
 // G10 quiz 1 answer was intentionally repaired in the source audit (3718.55 -> 3718.45); same fixture pattern as E5/E6/SS1-SS4 above.
 original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G10').content.quiz.find(x=>x.id===1).answer='Ēₖ=3RT/2=3718.55 J/mol.';
 // G10 worked 1 ("סוג 1") answer line was intentionally repaired in the same audit round (3718.55 -> 3718.45) and later re-laid-out as short math lines; restore the whole pre-audit array.
 original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G10').content.worked[0].content=['GC4 עמ׳ 7: מה האנרגיה הקינטית התרגומית הממוצעת למול ב-25°C? R=8.3145.','E=1.5×8.3145×298.15=3718.55 J/mol. למולקולה מחלקים ב-6.022×10²³ ומקבלים כ-6.175×10⁻²¹ J.'];
 // G10 worked 11 (מהלך חופשי) and worked 12 (חימום Cv) were re-laid-out as short math lines in the visual review round; restore their pre-layout arrays.
 original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G10').content.worked[10].content=['כלי מכיל CO₂ ב-27°C ובלחץ 0.60 atm. קוטר המולקולה ρ = 3.4 Å. מה המהלך החופשי הממוצע, וכמה פעמים בשנייה מתנגשת מולקולה ממוצעת?','P = 0.60×101325 = 60,795 Pa. λ = 8.314×300.15/(√2·π·(3.4×10⁻¹⁰)²×6.022×10²³×60,795) = 1.33×10⁻⁷ m, כלומר כ-133 nm. v_avg = √(8×8.314×300.15/(π×0.044)) = 380 m/s, ולכן z = 380/1.33×10⁻⁷ ≈ 2.9×10⁹ התנגשויות בשנייה. שימו לב: M הומר לק"ג למול, הלחץ לפסקל והקוטר למטר — לפני ההצבה.'];
 original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G10').content.worked[11].content=['0.200 mol N₂ (מולקולה קווית) בכלי קשיח מחוממים מ-25°C ל-125°C. כמה חום נדרש, בג׳ול ובקלוריות?','N₂ קווית ← Cv = 5R/2. q = 0.200×2.5×8.314×100 = 416 J. בקלוריות: q = 0.200×2.5×1.987×100 = 99.4 cal. להשוואה: גז חד־אטומי באותה כמות היה דורש 0.200×1.5×8.314×100 = 249 J בלבד — אין לו סיבובים "להאכיל".'];
 // G10 worked 13 (van der Waals/Z) displayed-precision reconciliation (52.88 unrounded in the Z substitution); restore the pre-repair array.
 original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G10').content.worked[12].content=['דוחסים 1.00 mol CO₂ ל-0.500 L ב-100°C. נתון a = 3.52 L²·atm/mol² ו-b = 0.0427 L/mol. חשבו את הלחץ לפי ואן דר ואלס, את מקדם הדחיסות Z, ומה לומדים ממנו.','אידיאלי: P = 0.08206×373.15/0.500 = 61.2 atm. ואן דר ואלס: P = RT/(V−b) − a/V² = 30.62/0.4573 − 3.52/0.25 = 66.96 − 14.08 = 52.9 atm. מקדם הדחיסות: Z = PV/RT = 52.9×0.500/30.62 = 0.863. Z<1: בתנאים אלה המשיכה הבין־מולקולרית (a) מנצחת את תיקון הנפח העצמי (b) — הגז נדחס יותר ממה שהמודל האידיאלי חוזה.'];
 // G10 theory 36/39 (post-undoNotation) gained source-audit applicability caveats (hard-sphere dilute-gas model; real-gas Cv slightly above classical values); same fixture pattern.
 {const th=original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G10').content.theory;
 for(const b of th)delete b.id; // G10 gained stable theory-block ids for source-coverage mapping; same fixture pattern as SS1-SS4.
 revertG11(original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G11'));revertG11(original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G12'));revertG1(original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G1'));
 {const g=original.courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G11').content.theory.find(b=>b.text.includes("ללא קשרי מימן היינו "));g.text=g.text.replace("ללא קשרי מימן היינו מצפים לנקודת רתיחה נמוכה בהרבה מ-100 °C, בדומה ל-H₂S.","בלי קשרי מימן, מים היו גז בטמפרטורת החדר ולא היו חיים כפי שאנחנו מכירים.")} // G11 life-claim overclaim repaired in the source audit; baseline keeps the pre-repair sentence.
 for(const id of ['G1','G3','G9','G11','G12','G13','G14','G15'])for(const b of original.courses.find(c=>c.id==='84101').topics.find(t=>t.id===id).content.theory){delete b.id;fixT40(b)} // G13/G14/G15 gained stable theory-block ids for source-coverage mapping (batch 1); same fixture pattern as G10.
  th.find(b=>(b.text||'').includes('המהלך החופשי הממוצע λ')).text='המהלך החופשי הממוצע λ הוא המרחק שמולקולה עוברת בין התנגשות להתנגשות. הוא מתקצר כשהלחץ עולה (יותר מולקולות בדרך) וכשהמולקולות גדולות (קוטר ρ גדול — שטח חתך גדול יותר).';
  const cvb=th.find(b=>(b.text||'').includes('אלו ערכי מינימום'));
  cvb.text=cvb.text.replace('מתעוררת ו-Cv גדל מעבר להם, וגם סביב טמפרטורת החדר הערכים הנמדדים בגזים ממשיים מעט גבוהים מהמודל הקלאסי. לכן','מתעוררת ו-Cv גדל מעבר להם. לכן');}
 assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),'0be1ffb658af1ba6f3b88d2bdd971b99b76cc3623c14bb20d9e38052c5e585d5');
 assert.equal(course.topics.length,16);
 for(const [id,add] of Object.entries(layer)){
  for(const k of ['theory','worked','quiz'])assert.deepEqual(topic(id).content[k].filter(x=>x.finalPrep).map(x=>{if(k!=='theory'||id!=='G12')return x;const {id:_ignored,...r}=x;return r}),add[k]);
  const ids=topic(id).content.quiz.map(q=>q.id);assert.equal(new Set(ids).size,ids.length);
  const origIds=topic(id).content.quiz.filter(q=>!q.finalPrep&&!q.batch5).map(q=>q.id);
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

test('Boyle curve values and model warnings are explicit',()=>{
 const a=3.592,b=.04267,TB=a/(R*b);
 for(const c of [0,.1,1,4]){const z=1/(1-b*c)-a*c/(R*TB);close(z-1,(b*c)**2/(1-b*c));}
 assert.ok(layer.G10.theory.some(x=>x.figure==='real-gas-boyle'));
 const figure=readFileSync(new URL('../src/figures-final-prep.jsx',import.meta.url),'utf8');
 assert.ok([...figure.matchAll(/size=\{(\d+)\}/g)].every(m=>+m[1]>=18));
 const text=layer.G10.theory.map(x=>x.text).join(' ');assert.ok(text.includes('מסדר שני'));assert.ok(text.includes('−130°C'));
 assert.ok(layer.G13.theory.some(x=>x.text.includes('הקריטית')&&x.text.includes('אומדן')));
});


test('all 38 new solutions use explicit prose/math blocks with no RTL text inside calculations',()=>{
 const solutions=[...Object.values(layer).flatMap(t=>t.worked),...exam.flatMap(p=>p.parts)];
 assert.equal(solutions.length,38);
 for(const s of solutions){assert.ok(s.solutionBlocks.length>0);for(const b of s.solutionBlocks){assert.ok(b.math||b.text);if(b.math)assert.ok(!/[\u0590-\u05ff]/u.test(b.math));}}
});
