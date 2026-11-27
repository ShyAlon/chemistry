import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {splitSolutionSteps} from '../src/solution-steps.js';
const squash=s=>s.replace(/[\s,]/g,'');
function* solutions(){
 const root=new URL('../src/content/',import.meta.url).pathname;
 for(const course of fs.readdirSync(root)){const dir=path.join(root,course,'topics');if(!fs.existsSync(dir))continue;
  for(const f of fs.readdirSync(dir)){const d=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
   for(const w of d.content?.worked||[]){if(w.solutionBlocks)continue;for(const p of w.content.slice(1))yield [course+'/'+f+': '+w.title,p]}
   for(const q of d.content?.quiz||[]){if(typeof q.answer==='string')yield [course+'/'+f+': quiz '+q.id,q.answer]}}}
}
test('splitting keeps every character of every authored solution and answer',()=>{
 let n=0;for(const [where,text] of solutions()){const steps=splitSolutionSteps(text);n++;
  assert.equal(squash(steps.join('')),squash(text),where);
  for(const s of steps)assert.ok(s.trim().length>0,where+' empty step')}
 assert.ok(n>900,'corpus size '+n)});
test('the colligative example becomes separate calculation and conclusion lines',()=>{
 const steps=splitSolutionSteps('m=0.100/0.500=0.200 mol/kg. ΔT_f=1.86·0.200=0.372°C, ולכן הקיפאון ב-−0.372°C. ΔT_b=0.512·0.200=0.1024°C, ולכן הרתיחה ב-100.1024°C, בקירוב המדולל.');
 assert.deepEqual(steps,['m=0.100/0.500=0.200 mol/kg.','ΔT_f=1.86·0.200=0.372°C','ולכן הקיפאון ב-−0.372°C.','ΔT_b=0.512·0.200=0.1024°C','ולכן הרתיחה ב-100.1024°C, בקירוב המדולל.'])});
test('a part label stays with its step and decimals are not split',()=>{
 assert.deepEqual(splitSolutionSteps('א. n=0.25 mol. ב. M=2.5 g/mol.'),['א. n=0.25 mol.','ב. M=2.5 g/mol.']);
 assert.deepEqual(splitSolutionSteps('P=1.5 atm'),['P=1.5 atm'])});
test('non-text input passes through',()=>{assert.deepEqual(splitSolutionSteps(undefined),[undefined])});

import {glueCalculation as _glue, splitSignedQuantities as _sq, solutionDisplayText as _disp} from '../src/solution-steps.js';
import {test as _t} from 'node:test';
import _assert from 'node:assert/strict';
_t('glue keeps number with unit and only breaks after =', () => {
  const g = _glue('m=0.100/0.500=0.200 mol/kg');
  _assert.ok(g.includes('0.200\u00a0mol/kg'));
  _assert.equal(g.replace(/[\u200b\u00a0]/g, ' ').replace(/ /g, '').replace('mol/kg', ' mol/kg').replace(' ', ''), 'm=0.100/0.500=0.200mol/kg');
});
_t('long equation and decimal punctuation survive glue', () => {
  const s = 'P=0.0821·298·0.0100=0.245 atm, 1,86 K/m';
  _assert.equal(_glue(s).replace(/\u200b/g, '').replace(/\u00a0/g, ' '), s);
});
_t('signed quantity is one LTR unit with sign preserved', () => {
  const parts = _sq('ולכן הקיפאון ב −0.372 °C.');
  const q = parts.find(p => p.quantity);
  _assert.ok(q && q.text.startsWith('−0.372'));
  _assert.equal(parts.map(p => p.text).join('').replace(/\u00a0/g, ' '), 'ולכן הקיפאון ב −0.372 °C.');
});
_t('Hebrew abbreviations and conclusion text unchanged by display text', () => {
  const s = 'ולכן ΔT = 2 K, כלומר מ"ל ו-ג׳ ממס.';
  _assert.equal(_disp(s).replace(/\s+/g, ' ').trim(), s);
});
