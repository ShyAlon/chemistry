import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadCatalogue} from '../scripts/content-store.mjs';
// G12 (crystals) has no relevant emission-spectrum card. The spectrum card is optional per topic; every other GC1 topic keeps its card.
test('G12 carries no spectrum card and every other 84101 topic keeps a valid one',()=>{
 const gc1=loadCatalogue().courses.find(c=>c.id==='84101');
 for(const t of gc1.topics){
  if(t.id==='G12'){assert.equal(t.spectrum,undefined);continue}
  assert.ok(t.spectrum&&t.spectrum.symbol&&t.spectrum.lines.length>0&&Number.isFinite(t.spectrum.accentWave),'spectrum retained: '+t.id);
 }
});
test('app renders the spectrum card, photon theme and card color only when the topic has a spectrum',()=>{
 const src=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(src,/spectral=\{course\.id!=='nuclear'&&course\.spectrum!==false&&!!t\.spectrum\}/);
 assert.match(src,/course\.spectrum!==false&&topic\.spectrum&&<div className="card-spectrum">/);
 assert.match(src,/t\.spectrum\?`color-mix/);
});
