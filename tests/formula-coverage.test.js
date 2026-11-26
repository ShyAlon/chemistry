import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import review from './formula-coverage-review.json' with {type:'json'};
import regressions from './fixtures/formula-coverage-regressions.json' with {type:'json'};
import {collectFormulaRecords,validateCoverage,validateCoverageManifest} from '../scripts/formula-coverage.mjs';
import {SYMBOLS} from '../src/symbol-defs.js';
import catalogue from '#catalogue';
import {applyNotation} from '../src/notation-apply.js';
import {formulaMetadata} from '../src/formula-metadata.js';
const rows=collectFormulaRecords(),by=new Map(rows.map(r=>[r.key,r]));
const effusion=rows.find(r=>r.expression==='r_mol ∝ P/√M');

test('reviewed coverage is distinct from the explicitly unreviewed, change-locked legacy inventory',()=>{
 assert.deepEqual(validateCoverageManifest(rows,review),{reviewed:169,legacy:511,total:680});
 assert.ok(review.scope.includes('do not certify'));
 assert.ok(!Object.keys(review.reviewed).some(k=>Object.hasOwn(review.legacyUnreviewed,k)));
});
test('all 27 original defective metadata lists fail, although every list is nonempty and its IDs exist',()=>{
 assert.equal(regressions.length,27);
 for(const old of regressions){
  assert.ok(old.metadata.symbols.length,old.key);
  for(const id of old.metadata.symbols)assert.ok(SYMBOLS[id],old.key+' '+id);
  assert.throws(()=>validateCoverage(old,review.reviewed[old.key]),undefined,old.key);
  assert.doesNotThrow(()=>validateCoverage(by.get(old.key),review.reviewed[old.key]));
 }
});
test('removing each quantity binding leaves unclassified notation, even while the supplied legend stays nonempty',()=>{
 let checked=0;
 for(const [key,contract]of Object.entries(review.reviewed))for(const token of Object.keys(contract.bindings)){
  const copy=structuredClone(contract);delete copy.bindings[token];
  assert.throws(()=>validateCoverage(by.get(key),copy),/unclassified/,key+' '+token);checked++;
 }
 assert.ok(checked>100);
});
test('removing each required ID fails, including nonempty shortened legends',()=>{
 let checked=0,nonempty=0;
 for(const [key,contract]of Object.entries(review.reviewed))for(const id of new Set(Object.values(contract.bindings))){
  const row=structuredClone(by.get(key));row.metadata.symbols=row.metadata.symbols.filter(x=>x!==id);
  if(row.metadata.symbols.length)nonempty++;
  assert.throws(()=>validateCoverage(row,contract),/missing required definition/,key+' '+id);checked++;
 }
 assert.ok(checked>100);assert.ok(nonempty>=132);
});
test('same-letter wrong contexts are rejected instead of inferred from their display labels',()=>{
 const cases=[['q = n·ΔH_vap','q@vaporization','q'],['D = E/m ; 1 Gy = 1 J/kg','E@absorbed','E'],['l = 0 … n−1','n@level','n'],['Π = i·M·R·T','M@molarity','M']];
 for(const [expression,correct,wrong]of cases){const row=structuredClone(rows.find(r=>r.expression===expression&&review.reviewed[r.key]));row.metadata.symbols=row.metadata.symbols.map(id=>id===correct?wrong:id);assert.throws(()=>validateCoverage(row,review.reviewed[row.key]),/unreviewed context ID/)}
});
test('a nonempty effusion key with only r fails, and P/M are required independently',()=>{
 for(const ids of [['r'],['r','P'],['r','M']]){const row=structuredClone(effusion);row.metadata.symbols=ids;assert.throws(()=>validateCoverage(row,review.reviewed[row.key]),/missing required definition/)}
});
test('new quantities cannot hide in a reviewed expression or behind unknown notation',()=>{
 const row=structuredClone(effusion);row.expression+=' + Z_new';
 assert.throws(()=>validateCoverage(row,review.reviewed[row.key]),/expression changed/);
 const changed=structuredClone(review.reviewed[row.key]);changed.expression=row.expression;
 assert.throws(()=>validateCoverage(row,changed),/unclassified/);
 const untyped=structuredClone(changed);untyped.literals.push({text:'Z_new'});
 assert.throws(()=>validateCoverage(row,untyped),/untyped notation/);
});
test('new displays and shortened legacy lists fail closed rather than silently becoming certified',()=>{
 const fresh={...effusion,key:'new/course/formula'};
 assert.throws(()=>validateCoverageManifest([...rows,fresh],review),/new display record/);
 const copy=structuredClone(rows),legacy=copy.find(r=>review.legacyUnreviewed[r.key]&&r.metadata.symbols?.length>1);legacy.metadata.symbols.pop();
 assert.throws(()=>validateCoverageManifest(copy,review),/legacy record changed/);
});
test('reviewed definition meanings are locked as well as the IDs, while the correct gas-average context is untouched',()=>{
 const definitions=structuredClone(SYMBOLS);definitions['q@vaporization'].meaning=definitions.q.meaning;
 assert.throws(()=>validateCoverageManifest(rows,review,definitions),/Reviewed definition changed/);
 const average=rows.find(r=>r.metadata.symbols?.includes('M@gas-average'));
 assert.ok(average);assert.ok(!average.metadata.symbols.includes('M̄'));
 const copy=structuredClone(rows),changed=copy.find(r=>r.key===average.key);changed.metadata.symbols=changed.metadata.symbols.map(id=>id==='M@gas-average'?'M̄':id);
 assert.throws(()=>validateCoverageManifest(copy,review),/legacy record changed/);
});
test('all 18 repaired theory records replay from the stored notation source with the same complete bindings',()=>{
 const entries=JSON.parse(fs.readFileSync(new URL('../src/notation-blocks.json',import.meta.url)));
 let checked=0;
 for(const row of rows.filter(r=>review.reviewed[r.key]&&r.key.includes('/theory/')&&!r.key.startsWith('nuclear/E5/')&&!r.key.startsWith('nuclear/E6/'))){
  const topic=row.key.split('/')[1],entry=entries.find(e=>e.topic===topic&&e.blocks.some(b=>b.text===row.expression&&JSON.stringify(b.symbols)===JSON.stringify(row.metadata.symbols)));assert.ok(entry,row.key);
  const fixture={courses:[{id:'84101',topics:[{id:topic,content:{theory:[{text:entry.before}]}}]}]};assert.equal(applyNotation(fixture,[entry]),1);
  const block=fixture.courses[0].topics[0].content.theory.find(b=>b.text===row.expression&&JSON.stringify(b.symbols)===JSON.stringify(row.metadata.symbols));
  const metadata=formulaMetadata(block.text,{symbols:block.symbols});assert.deepEqual(metadata,row.metadata,row.key);
  assert.doesNotThrow(()=>validateCoverage({...row,metadata},review.reviewed[row.key]));checked++;
 }
 assert.equal(checked,18);
});
test('nuclear/E5 reviewed theory records replay from the live block with the same complete bindings (equivalent of the notation replay)',()=>{
 const keys=rows.filter(r=>review.reviewed[r.key]&&r.key.startsWith('nuclear/E5/theory/')||review.reviewed[r.key]&&r.key.startsWith('nuclear/E6/theory/'));
 assert.equal(keys.length,7);
 for(const row of keys){
  const idx=Number(row.key.split('/').pop()),block=catalogue.courses.find(c=>c.id==='nuclear').topics.find(t=>t.id===row.key.split('/')[1]).content.theory[idx];
  assert.equal(block.text,row.expression,row.key);assert.ok(block.symbols?.length||row.metadata.kind==='nuclear-reaction'||row.metadata.kind==='reaction',row.key);
  const metadata=formulaMetadata(block.text,{symbols:block.symbols});assert.deepEqual(metadata,row.metadata,row.key);
  assert.doesNotThrow(()=>validateCoverage({...row,metadata},review.reviewed[row.key]),row.key);
  const mutated={...review.reviewed[row.key],bindings:{...review.reviewed[row.key].bindings,__x:'X'}};
  if(Object.keys(review.reviewed[row.key].bindings||{}).length)assert.throws(()=>validateCoverage({...row,metadata:{...metadata,symbols:[...(metadata.symbols||[]),'Z@none']}},review.reviewed[row.key]),undefined,row.key+' must fail closed when a binding is added');
 }
});
test('retired one-shot attachment script refuses safely without writing reference content',()=>{
 const file=new URL('../src/reference-formulas.js',import.meta.url),before=fs.readFileSync(file,'utf8');
 const result=spawnSync(process.execPath,[new URL('../scripts/attach-symbols.mjs',import.meta.url).pathname],{encoding:'utf8'});
 assert.equal(result.status,1);assert.match(result.stderr,/Retired one-shot: no files changed/);assert.equal(fs.readFileSync(file,'utf8'),before);
});
