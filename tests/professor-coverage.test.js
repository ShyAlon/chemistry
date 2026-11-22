import test from 'node:test';
import assert from 'node:assert/strict';
import review from './formula-coverage-review.json' with {type:'json'};
import {collectFormulaRecords,validateCoverage,validateCoverageManifest} from '../scripts/formula-coverage.mjs';
import {SYMBOLS} from '../src/symbol-defs.js';
const rows=collectFormulaRecords();
const added=rows.filter(r=>r.key.startsWith('professor/84101/'));

test('all 29 supplied-handout displays have explicit coverage, including expanded printed constants',()=>{
 assert.equal(added.length,29);
 for(const row of added){
  const contract=review.reviewed[row.key];assert.ok(contract,row.key);
  assert.ok(!review.legacyUnreviewed[row.key],row.key);
  assert.equal(row.metadata.kind,'equation');
  assert.deepEqual(new Set(row.metadata.symbols),new Set(Object.values(contract.bindings)),row.key);
  assert.doesNotThrow(()=>validateCoverage(row,contract));
 }
 assert.ok(added.find(r=>r.key.endsWith('/r-cm')).expression.includes('82.1 cm³'));
 assert.ok(added.find(r=>r.key.endsWith('/avogadro')).expression.includes('6.0221×10²³'));
 assert.ok(added.find(r=>r.key.endsWith('/boltzmann')).expression.includes('1.380649×10⁻²³'));
});

test('new-page same-letter and same-glyph context substitutions fail closed',()=>{
 const cases=[['maxwell','sheet:pi','sheet:osmotic'],['kinetic-mole','sheet:energy','Eₖ'],['mean-speed','sheet:Mw','M@molarity'],['mean-free-pressure','λ','λ#2'],['henry','sheet:gas-pressure','P'],['temperature','t@celsius','T']];
 for(const [id,correct,wrong]of cases){
  const row=structuredClone(added.find(r=>r.key.endsWith('/'+id)));
  assert.ok(row.metadata.symbols.includes(correct),id);
  row.metadata.symbols=row.metadata.symbols.map(value=>value===correct?wrong:value);
  assert.throws(()=>validateCoverage(row,review.reviewed[row.key]),/unreviewed context ID|missing required definition/,id);
 }
});

test('new source-page definition meanings are locked, not only their visible labels',()=>{
 for(const id of new Set(added.flatMap(row=>Object.values(review.reviewed[row.key].bindings)).filter(id=>id.startsWith('sheet:')))){
  const definitions=structuredClone(SYMBOLS);definitions[id].meaning=['changed meaning'];
  assert.throws(()=>validateCoverageManifest(rows,review,definitions),/Reviewed definition changed/,id);
 }
});
