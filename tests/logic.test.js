import {beforePractice} from './practice-baseline.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseNumber,numericCorrect,configuration,loadProgress,wavelengthColor} from '../src/logic.js';
const catalogue=JSON.parse(fs.readFileSync(new URL('../src/courses.json',import.meta.url)));
const topics=catalogue.courses[0].topics.slice(0,10).map(t=>({...t,...t.content}));
test('all ten packs, priority, 57 questions and complete content',()=>{assert.deepEqual(topics.map(t=>t.id),['P7','P9','P10','P3','P2','P5','P6','P8','P1','P4']);assert.equal(topics.flatMap(t=>t.quiz).length,57);for(const t of topics){assert.ok(t.theory.length>3);assert.ok(t.worked.length>=3);assert.ok(t.spectrum.lines.length>=3);for(const q of t.quiz){assert.ok(q.answer);if(q.type==='mcq'){assert.ok(q.options[q.correct],t.id+' '+q.id)}}}});
test('scientific notation, unicode exponents, negatives and invalid input',()=>{for(const s of ['1.9e16','1.9×10^16','1.9×10¹⁶','1.9 * 10^16'])assert.equal(parseNumber(s),1.9e16);assert.equal(parseNumber('−6.04'),-6.04);assert.equal(parseNumber('10^-9'),1e-9);for(const s of ['', '5abc', '1/0','1;alert(1)'])assert.ok(Number.isNaN(parseNumber(s)))});
test('numeric marking requires unit and accepts rounded answer',()=>{const f=[{value:4,unit:'eV'}];assert.ok(numericCorrect(['4'],['eV'],f));assert.ok(!numericCorrect(['4'],['J'],f));assert.ok(!numericCorrect(['5'],['eV'],f));assert.ok(numericCorrect(['3.96e-12'],['m'],[{value:3.96e-12,unit:'m'}]))});
test('numeric marking converts dimensionally equivalent units without weakening tolerance',()=>{
 const wave=[{value:434.11834185294214,unit:'nm'}];
 assert.ok(numericCorrect(['434.12'],['nm'],wave),'same unit as before');
 assert.ok(numericCorrect(['434*10^-9'],['m'],wave),'the rejected quiz entry: same wavelength in metres');
 assert.ok(numericCorrect(['4.3412e5'],['pm'],wave),'picometres convert too');
 assert.ok(!numericCorrect(['4.34e-7'],['nm'],wave),'raw metres value against nm still fails');
 assert.ok(!numericCorrect(['450e-9'],['m'],wave),'converted value outside 1.5% tolerance fails');
 assert.ok(!numericCorrect(['434.12'],['eV'],wave),'energy unit against a length answer rejected');
 assert.ok(!numericCorrect(['434.12'],['cal'],wave),'any wrong dimension rejected');
 const energy=[{value:2.856,unit:'eV'}];
 assert.ok(numericCorrect(['4.5757e-19'],['J'],energy),'joules convert to eV');
 assert.ok(!numericCorrect(['2.856'],['J'],energy),'raw eV value against J fails');
 assert.ok(numericCorrect(['1'],['MeV'],[{value:1e6,unit:'eV'}]),'MeV converts to eV');
 const compound=[{value:-1.89,unit:'eV'},{value:656,unit:'nm'}];
 assert.ok(numericCorrect(['-3.028e-19','6.56e-7'],['J','m'],compound),'compound fields convert independently, signs kept');
 assert.ok(!numericCorrect(['-3.028e-19','656'],['J','eV'],compound),'one wrong-dimension field fails the compound');
 assert.ok(numericCorrect(['94'],['J'],[{value:22.5,unit:'cal'}]),'course cal convention: 94 J = 22.5 cal');
});
test('Aufbau progress fills 1s, 2s, 2p',()=>{assert.deepEqual(configuration(0),[]);assert.deepEqual(configuration(3),[['1s',2],['2s',1]]);assert.deepEqual(configuration(10),[['1s',2],['2s',2],['2p',6]])});
test('bad storage recovers, existing storage loads',()=>{assert.deepEqual(loadProgress({getItem:()=>'{oops'}),{});assert.deepEqual(loadProgress({getItem:()=>'{"P7":{"complete":true}}'}),{P7:{complete:true}});assert.deepEqual(loadProgress({getItem:()=>{throw Error('blocked')}}),{})});
test('physical source wavelengths and corrected P10 example',()=>{for(const t of topics){assert.match(t.spectrum.source,/^https:\/\/physics.nist.gov\//);for(const w of t.spectrum.lines){assert.ok(w>=400&&w<=700);assert.match(wavelengthColor(w),/^rgb\(/)}}const ex=topics.find(t=>t.id==='P10').worked[1].content.join(' ');assert.match(ex,/13-18/);assert.match(ex,/הערת תיקון/)});

test('course-scoped progress separates identical topic ids and migrates old v1 safely',async()=>{const {courseProgressKey,loadCourseProgress}=await import('../src/logic.js');const values=new Map([['spectra-progress-v1','{"P7":{"complete":true}}']]);const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};const courses=[{id:'84102'},{id:'course-2'}];let all=loadCourseProgress(storage,courses);assert.ok(all['84102'].P7.complete);assert.deepEqual(all['course-2'],{});values.set(courseProgressKey('course-2'),'{"P7":{"complete":false}}');all=loadCourseProgress(storage,courses);assert.ok(all['84102'].P7.complete);assert.equal(all['course-2'].P7.complete,false);assert.notEqual(courseProgressKey('84102'),courseProgressKey('course-2'))});
test('course routes, old links, and invalid destinations',async()=>{const {parseRoute}=await import('../src/logic.js');const courses=catalogue.courses;assert.equal(parseRoute('',courses).course,null);assert.equal(parseRoute('course/84102',courses).course.id,'84102');assert.equal(parseRoute('course/84102/P7',courses).topicId,'P7');assert.equal(parseRoute('P7',courses).course.id,'84102');assert.ok(parseRoute('course/missing',courses).invalid);assert.ok(parseRoute('course/84102/missing',courses).invalid)});
test('course data nests content and provides orbital images for all existing topics',()=>{assert.equal(catalogue.courses.length,3);assert.equal(catalogue.courses[0].id,'84102');for(const t of catalogue.courses[0].topics){assert.ok(t.content.theory.length);assert.ok(t.content.quiz.length);assert.ok(t.orbital.file);assert.ok(fs.existsSync(new URL('../public/orbitals/'+t.orbital.file,import.meta.url)));assert.ok(t.spectrum.accentWave)}});

test('General Chemistry derived edition has twelve sourced topics and sixty complete questions',()=>{const c=structuredClone(catalogue.courses.find(c=>c.id==='84101'));c.topics=c.topics.slice(0,12).map(beforePractice);assert.ok(c);assert.equal(c.contentStatus,'derived-first-edition');assert.equal(c.topics.length,12);assert.equal(c.topics.flatMap(t=>t.content.quiz).length,60);assert.equal(c.topics.flatMap(t=>t.content.worked).length,48);for(const t of c.topics){assert.ok(t.source.includes('pdf'));assert.ok(t.content.theory.length>=8);assert.equal(t.provenance.answerAuthority,'independently-computed-not-official');assert.equal(t.content.quiz.length,5);const ids=t.content.quiz.map(q=>q.id);assert.equal(new Set(ids).size,ids.length);for(const q of t.content.quiz){assert.ok(q.prompt);assert.ok(q.answer);if(q.type==='mcq')assert.ok(q.options[q.correct]);if(q.type==='numeric')for(const f of q.fields){assert.ok(Number.isFinite(f.value));assert.ok(f.unit)}}}});
test('General Chemistry calculations and corrections use exact inputs',()=>{const c=catalogue.courses.find(c=>c.id==='84101');const q=(t,id)=>c.topics.find(t0=>t0.id===t).content.quiz.find(q=>q.id===id);assert.ok(Math.abs(q('G2',4).fields[0].value-69.1522370133)<1e-7);assert.ok(Math.abs(q('G8',4).fields[0].value-411.056)<1e-9);assert.equal(q('G12',1).fields[0].value,4);assert.ok(Math.abs(q('G9',3).fields[0].value-38.0273743873)<1e-7);for(const t of c.topics)for(const x of t.content.quiz.filter(q=>q.type==='numeric'))assert.ok(numericCorrect([String(x.fields[0].value)],[x.fields[0].unit],x.fields));});
test('General Chemistry routes do not change original default and legacy routing',async()=>{const {parseRoute}=await import('../src/logic.js');assert.equal(catalogue.courses[0].id,'84102');assert.equal(parseRoute('course/84101/G12',catalogue.courses).course.id,'84101');assert.equal(parseRoute('course/84101/G12',catalogue.courses).topicId,'G12');assert.equal(parseRoute('P7',catalogue.courses).course.id,'84102');});
