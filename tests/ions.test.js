import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {elements} from '../src/reference-data.js';import {ions} from '../src/ion-data.js';import {ionState,parseIon,MODEL_MAX_ELECTRONS} from '../src/ions.js';
const el=s=>elements.find(e=>e.s===s);
const txt=(s,q)=>{const t=ionState(el(s),q,ions);return t.cfg?`${t.kind}:${t.core?'['+t.core+']':''}${t.cfg.map(([a,n])=>a+n).join('')}`:t.kind+(t.reason?':'+t.reason:'')};
const CORE={'':0,He:2,Ne:10,Ar:18,Kr:36,Xe:54,Rn:86};
test('every NIST ion has exactly Z-q electrons',()=>{
 assert.equal(ions.length,104);
 for(let z=1;z<=103;z++){assert.equal(ions[z].length,z-1,'z'+z);ions[z].forEach((s,i)=>{assert.ok(s,`z${z} q${i+1} missing`);const p=parseIon(s);assert.equal(CORE[p.core]+p.cfg.reduce((a,[,n])=>a+n,0),z-(i+1),`z${z} q${i+1}`)})}
});
test('cations come from NIST, not from a removal rule',()=>{
 assert.equal(txt('Fe',2),'nist:[Ar]3d6');assert.equal(txt('Fe',3),'nist:[Ar]3d5');
 assert.equal(txt('V',1),'nist:[Ar]3d4'); // distinct from course-rule result 4s1 3d3
 assert.equal(txt('Ni',1),'nist:[Ar]3d9'); // a 4s-first rule would give 4s1 3d8
 assert.equal(txt('Cr',1),'nist:[Ar]3d5');assert.equal(txt('Na',1),'nist:[He]2s22p6');
});
test('existing common anion results stay derived, with expanded formal filling elsewhere',()=>{
 assert.equal(txt('O',-2),'derived:[He]2s22p6');assert.equal(txt('N',-3),'derived:[He]2s22p6');assert.equal(txt('Cl',-1),'derived:[Ne]3s23p6');assert.equal(txt('H',-1),'derived:1s2');
 assert.equal(txt('C',-1),'model:[He]2s22p3');assert.equal(txt('C',-4),'model:[He]2s22p6');assert.equal(txt('C',-5),'model:[He]2s22p63s1');
 assert.equal(txt('Na',-1),'model:[Ne]3s2');assert.equal(txt('Ne',-1),'model:[He]2s22p63s1');
 assert.equal(txt('Fe',-1),'model:[Ar]4s23d7');assert.equal(txt('Cr',-1),'model:[Ar]4s23d5');
 assert.equal(txt('O',-3),'model:[He]2s22p63s1');
});
test('all formal anions conserve electron count, capacity and neutral arrangement, never mutate source',()=>{
 const before=JSON.stringify(elements),cap={s:2,p:6,d:10,f:14};let count=0;
 for(const e of elements)for(let k=1;e.z+k<=MODEL_MAX_ELECTRONS;k++){
  const t=ionState(e,-k,ions);assert.ok(['model','derived'].includes(t.kind),e.s+' '+k);
  assert.equal(CORE[t.core]+t.cfg.reduce((n,[,v])=>n+v,0),e.z+k);
  assert.equal(new Set(t.cfg.map(([s])=>s)).size,t.cfg.length);
  for(const [s,n] of t.cfg){assert.ok(n>0&&n<=cap[s[1]],s+' '+n);assert.ok(n>=(e.cfg.find(([a])=>a===s)?.[1]||0))}
  count++;
 }
 assert.equal(JSON.stringify(elements),before);assert.ok(count>6000);
 for(const e of elements)assert.equal(ionState(e,-(MODEL_MAX_ELECTRONS-e.z+1),ions).reason,'model-range');
 assert.equal(ionState(el('Og'),-1,ions).reason,'model-range');
 assert.equal(ionState(el('Rf'),-1,ions).seedPredicted,true);
});
test('bounds and missing data',()=>{
 assert.equal(ionState(el('H'),1,ions).kind,'none');assert.equal(ionState(el('He'),2,ions).kind,'none');assert.equal(ionState(el('Og'),0,ions).kind,'predicted');
 assert.equal(ionState(el('Og'),1,ions).kind,'unsupported');assert.equal(ionState({...el('Og'),cfg:[]},0,ions).kind,'missing');assert.equal(ionState(el('Rf'),0,ions).kind,'predicted');assert.equal(ionState(el('Rf'),1,ions).kind,'unsupported');
 assert.equal(txt('Og',0),'predicted:[Rn]7s25f146d107p6');assert.equal(txt('Rg',0),'predicted:[Rn]7s25f146d97p0'.replace('7p0',''));assert.equal(txt('Fl',0),'predicted:[Rn]7s25f146d107p2');
 for(let z=104;z<=118;z++)assert.equal(elements[z-1].pred,1);
 assert.ok(elements.filter(e=>e.z<=103).every(e=>!e.pred));
});
test('ion logic and data never touch storage',()=>{for(const f of ['ions.js','ion-data.js']){assert.ok(!/localStorage|sessionStorage/i.test(fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8')),f)}});
