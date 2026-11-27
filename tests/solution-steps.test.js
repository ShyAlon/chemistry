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
  _assert.equal(g.replace(/[\u200b\u2060]/g, '').replace(/\u00a0/g, ' '), 'm=0.100/0.500=0.200 mol/kg');
});
_t('long equation and decimal punctuation survive glue', () => {
  const s = 'P=0.0821·298·0.0100=0.245 atm, 1,86 K/m';
  _assert.equal(_glue(s).replace(/[\u200b\u2060]/g, '').replace(/\u00a0/g, ' '), s);
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

import {splitEquationRuns as _er} from '../src/solution-steps.js';
_t('inline equation inside Hebrew step becomes one LTR run, text preserved', () => {
  const s = 'בדיקת עיבוי: n=0.200×0.08206×298.15/8.00 = 0.612 atm = 465 mmHg — גבוה מ-23.76 mmHg.';
  const parts = _er(s);
  _assert.ok(parts.some(p => p.equation && p.text.includes('0.612\u00a0atm')));
  _assert.equal(parts.map(p => p.text).join('').replace(/[\u200b\u2060]/g, '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' '), s.replace(/\s+/g, ' '));
});

import {splitQuantities as _sqty} from '../src/solution-steps.js';
_t('Hebrew prefix hyphen stays outside the LTR quantity; slash never breaks', () => {
  const parts = _sqty('גבוה מ-23.76 mmHg ו-0.200 mol');
  _assert.deepEqual(parts.filter(p => p.quantity).map(p => p.text), ['23.76\u00a0mmHg', '0.200\u00a0mol']);
  _assert.equal(parts.map(p => p.text).join('').replace(/\u00a0/g, ' '), 'גבוה מ-23.76 mmHg ו-0.200 mol');
  _assert.ok(!_glue('a/b=1').includes('\u2060'));
});

_t('ellipsis does not split a step; labels with closing paren and period stay attached', () => {
  _assert.equal(splitSolutionSteps('הערכים 1.5, 2.0, ... 3.5 קבועים. סוף.').length, 2);
  const st = splitSolutionSteps('א). חישוב n=2. ב). תוצאה.');
  _assert.ok(st.every(x => x.length > 4), JSON.stringify(st));
  _assert.equal(splitSolutionSteps('1. חישוב n=2.').length, 1);
});
_t('short Hebrew lead plus equation becomes lead and equation; text kept', () => {
  const s = 'המרת לחץ: P = 735 mmHg × 101.325/760 = 98.0 kPa.';
  const st = splitSolutionSteps(s);
  _assert.equal(st.length, 2);
  _assert.equal(st.join(' '), s);
});
_t('no break before equals or operators in glued equations', () => {
  const g = _glue('a + b = c');
  _assert.ok(g.includes('a\u00a0+ b\u00a0=\u200b c'), JSON.stringify(g));
});

_t('bare digits are never isolated; prefixed numbers are', () => {
  _assert.deepEqual(_sqty('2NaN₃ → 3N₂ ו-5').filter(p => p.quantity).map(p => p.text), ['5']);
  _assert.deepEqual(_sqty('0.050 mol O₂, ב-300 K').filter(p => p.quantity).map(p => p.text), ['0.050\u00a0mol', '300\u00a0K']);
  _assert.deepEqual(_sqty('0.050 mol, ב-300 K', true).filter(p => p.quantity).map(p => p.text), ['300\u00a0K']);
});

_t('comma list of quantities in a problem statement is one LTR run', () => {
  const q = _sqty('א. 200°C, 1000 atm. ב. 157°C', true).filter(p => p.quantity).map(p => p.text);
  _assert.deepEqual(q, ['200°C,\u00a01000\u00a0atm']);
});

_t('short inline equations never break; long ones may break after =', () => {
  _assert.ok(!_er('מה? M(N₂)=28, M(Br₂)=160').some(p => p.equation && /\u200b/.test(p.text)));
  _assert.ok(_er('חישוב: 0.200×0.08206×298.15/8.00 = 0.612 atm = 465 mmHg').some(p => p.equation && /\u200b/.test(p.text)));
});
_t('signed value inside a quantity list stays in the list; ratio becomes an LTR run', () => {
  _assert.deepEqual(_sqty('ה. −10°C, 2 atm', true).filter(p => p.quantity).map(p => p.text), ['−10°C,\u00a02\u00a0atm']);
  _assert.ok(_er('NaCl: 1/58.5 mol ליחידות').some(p => p.equation));
});

import {breakMath} from '../src/solution-steps.js';
test('breakMath breaks only after top-level operators and never inside brackets, units or signs',()=>{
 const out=breakMath('8.314×300.15 / (√2·π·(3.4×10⁻¹⁰)²·Nₐ·P)');
 assert.equal(out.replace(/\u200b/g,''),'8.314×300.15 / (√2·π·(3.4×10⁻¹⁰)²·Nₐ·P)');
 assert.ok(out.includes('×\u200b300.15'));
 assert.ok(!/\([^)]*\u200b[^)]*\)/.test(out.replace(/\(√2.*$/,'')));
 assert.equal(breakMath('J/(mol·K)').includes('\u200b'),false);
 assert.equal(breakMath('Cd²⁺ + 2e⁻').replace(/\u200b/g,''),'Cd²⁺ + 2e⁻');
});
