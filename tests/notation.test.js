import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {notationCorrections,undoNotation} from './notation-baseline.js';
import {normalizeBidiText} from '../src/bidi.js';
import {CONSTANTS,formatConstant,formatNumber,resolveConstants} from '../src/constants.js';
import {SYMBOLS} from '../src/symbol-defs.js';
import {symbolRow,symbolText} from '../src/symbols.js';
import {FormulaTip,DisplayMath} from '../src/scientific-text.js';
const catalogue=JSON.parse(readFileSync(new URL('../src/courses.json',import.meta.url)));
const gc=catalogue.courses.find(c=>c.id==='84101');
const hebrew=/[\u0590-\u05ff]/;
const blocks=()=>gc.topics.flatMap(t=>t.content.theory.map((b,i)=>({t:t.id,i,b})).filter(x=>x.b.notationOf!==undefined));
// Equation text with the constants resolved, whitespace/subscript markup removed.
const norm=s=>resolveConstants(s).normalize('NFD').replace(/[\s_{}·\u0304\u200e\u200f\u2066-\u2069]/g,'').replace(/[−–]/g,'-');
const unit=s=>norm(s).replace(/[.,:;]+$/,'').replace(/^[-.,:;(]+/,'').replace(/[)→]+$/,'').replace(/^[A-Za-z,]{1,4}:/,'');

test('every reformatted passage keeps each of its original formula runs',()=>{
 // Intentional, reviewed notation changes: ASCII-only subscript names replace
 // Hebrew subscripts so equation blocks stay free of Hebrew, constants now carry
 // their units, and one ambiguous comma is dropped. G2.4 moved the value of Nₐ into the central symbol key. G10.53 gained explicit parentheses around VRT/n.
 const exempt=new Set(['G1.14','G9.6','G2.4','G10.53']);
 let checked=0;const misses=[];
 for(const c of notationCorrections){
  const after=gc.topics.find(t=>t.id===c.topic).content.theory.filter(b=>b.notationOf===c.index);
  assert.equal(after.length,c.count);
  if(exempt.has(c.topic+'.'+c.index))continue;
  const text=after.map(b=>norm(b.text)).join('|');
  const runs=c.before.text.split(/[\u0590-\u05ff]+|\.\s|;|,\s| {3,}/).map(unit).filter(r=>/[=∝≈<>√]/.test(r)&&r.length>=5);
  for(const r of runs){
   const loose=r.replace(/\(?(?:mol|L·atm|J|kg|g)[^)]*\)?$/,'');
   if(!(text.includes(r)||text.includes(loose)||text.includes(r.replace(/≈/g,'='))))misses.push(c.topic+'.'+c.index+' '+r);
   if(0)assert.ok(text.includes(r)||text.includes(loose)||text.includes(r.replace(/≈/g,'=')),`${c.topic}.${c.index}: lost "${r}"`);
   checked++;
  }
 }
 assert.deepEqual(misses,[]);assert.ok(checked>40,String(checked));
});

test('the reported kinetic-theory formulas are present with their meaning, and the originals are reconstructable',()=>{
 const t=gc.topics.find(t=>t.id==='G10');
 const eq=t.content.theory.filter(b=>b.layout==='equation').map(b=>norm(b.text)).join('|');
 for(const f of ['ₖ=3RT/2','ₖ=3kT/2','k=R/Nₐ','urms=√(3RT/M)','rA/rB=√(MB/MA)','rA/rB=(PA/PB)√(MB/MA)','(P+an²/V²)(V-nb)=nRT','Z=PV/(nRT)'])assert.ok(eq.includes(f),f);
 const original=undoNotation(t);
 assert.ok(original.content.theory.some(b=>b.text.startsWith('למול:')&&b.text.includes('√(3RT/M)')));
 assert.equal(original.content.theory.filter(b=>b.notationOf!==undefined).length,0);
});

test('equation blocks created by this pass contain no Hebrew and are LTR display blocks',()=>{
 for(const {t,i,b} of blocks()){
  if(b.layout==='equation'){assert.ok(!hebrew.test(resolveConstants(b.text)),t+'.'+i);assert.equal(b.style,'Normal')}
  else assert.ok(!b.layout&&b.text&&hebrew.test(b.text),'prose block '+t+'.'+i);
 }
});

test('the √ stays inside its left-to-right run (screenshot regression)',()=>{
 const out=normalizeBidiText('מהירות RMS היא √(3RT/M), שורש ממוצע ריבועי');
 assert.ok(out.includes('\u2066√(3RT/M)\u2069'),JSON.stringify(out));
 const eff=normalizeBidiText('באותם תנאים יחס הקצבים rA/rB=√(MB/MA). גז קל');
 assert.ok(eff.includes('\u2066rA/rB=√(MB/MA)\u2069'));
 assert.ok(normalizeBidiText('מתקבל ∑xᵢ וגם ∫f').includes('\u2066∑xᵢ\u2069'));
});

test('constants are defined once and display precision is separate from stored values',()=>{
 assert.equal(formatConstant('R'),'8.314 J/(mol·K)');
 assert.equal(formatConstant('R@latm'),'0.08206 L·atm/(mol·K)');
 assert.equal(formatConstant('R@latm5'),'0.082057 L·atm/(mol·K)');
 assert.equal(formatConstant('R@sheet'),'0.082 L·atm/(mol·K)');
 assert.equal(formatConstant('k'),'1.381×10⁻²³ J/K');
 assert.equal(formatConstant('Nₐ'),'6.022×10²³ mol⁻¹');
 assert.equal(formatNumber(CONSTANTS.R.value,5),'8.3145');
 assert.equal(CONSTANTS.R.value,8.314462618);
 assert.equal(resolveConstants('R = {R@latm}'),'R = 0.08206 L·atm/(mol·K)');
 assert.equal(resolveConstants('{unknown}'),'{unknown}');
 const before=CONSTANTS.R.digits;CONSTANTS.R.digits=5;
 try{assert.equal(formatConstant('R'),'8.3145 J/(mol·K)');assert.match(symbolText('R'),/8\.3145 J\/\(mol·K\)/);
  assert.ok(renderToStaticMarkup(React.createElement(DisplayMath,{text:'R = {R}'})).includes('8.3145'))}
 finally{CONSTANTS.R.digits=before}
 assert.equal(formatConstant('R'),'8.314 J/(mol·K)');
});

test('every symbol and constant reference resolves; constants in definitions come from constants.js',()=>{
 for(const {t,i,b} of blocks())for(const id of b.symbols||[]){assert.ok(SYMBOLS[id],`${t}.${i} ${id}`);symbolRow(id)}
 for(const [id,s] of Object.entries(SYMBOLS)){assert.ok(s.sym&&s.meaning.length,id);for(const r of s.meaning)if(r.const)formatConstant(r.const);
  const flat=s.meaning.map(r=>typeof r==='string'?r:r.math||'').join('');
  assert.ok(!/(?:8\.314|0\.0820|6\.022|1\.38)/.test(flat),'literal constant in definition '+id)}
 for(const {t,i,b} of blocks())for(const m of b.text.matchAll(/\{([^{}]+)\}/g))formatConstant(m[1]);
 const referenced=new Set(blocks().flatMap(x=>x.b.symbols||[]));
 for(const id of Object.keys(SYMBOLS))assert.ok(referenced.has(id),'unused definition '+id);
 assert.ok(blocks().filter(x=>x.b.symbols?.length).length>=56);
});

test('formula popup: readable repeated formula, isolated LTR math in symbols, keyboard access and print key',()=>{
 const html=renderToStaticMarkup(React.createElement(FormulaTip,{text:'Ē\u0304ₖ = 3kT/2        k = R/Nₐ',symbols:Object.entries(SYMBOLS).filter(([id,s])=>s.sym.includes('ₖ')&&JSON.stringify(s.meaning).includes('מולקולה אחת')||id==='k'||id==='R').map(([id])=>id)}));
 assert.match(html,/role="tooltip"/);assert.match(html,/tabindex="0"/);assert.match(html,/aria-describedby=/);
 assert.ok(html.includes('class="formula-pop-eq"'));assert.ok(html.includes('class="formula-print-key"'));
 assert.ok((html.match(/3kT\/2/g)||[]).length>=2,'formula is repeated in the popup');
 assert.ok(html.includes('<bdi dir="ltr" class="inline-math">1.381×10⁻²³ J/K</bdi>'),html);
 assert.ok(html.includes('<bdi dir="ltr" class="inline-math">8.314 J/(mol·K)</bdi>'));
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(css,/@media print\{\.formula-pop,\.formula-hint\{display:none!important\}\.formula-print-key\{display:block/);
});

test('every GC1 theory equation has a symbol key, except one reviewed symbol-free reaction',()=>{
 const bare=gc.topics.flatMap(t=>t.content.theory.filter(b=>b.layout==='equation'&&!(b.symbols&&b.symbols.length)).map(b=>t.id+': '+b.text));
 assert.deepEqual(bare,['G8: MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O']);
});

test('the gas constant key names one applicable value per context',()=>{
 const by=(id)=>symbolText(id);
 assert.match(by('R'),/8\.314 J\/\(mol·K\)/);assert.ok(!/0\.082/.test(by('R')),'SI-only key must not offer the L·atm value');
 assert.match(by('R:latm'),/0\.08206/);assert.ok(!/8\.314/.test(by('R:latm')));
 assert.match(by('R:gas'),/Pa.*8\.314.*atm.*0\.08206/);
 const eq=(txt)=>gc.topics.flatMap(t=>t.content.theory).find(b=>b.layout==='equation'&&b.text.normalize('NFD').startsWith(txt.normalize('NFD')));
 assert.ok(eq('Ēₖ = 3RT/2').symbols.includes('R'));
 assert.ok(eq('u_rms = √').symbols.includes('R'));
 assert.ok(eq('PV = nRT').symbols.includes('R:gas'));
});

test('glossary values for R, k and Nₐ follow the central constants',async()=>{
 const {glossary}=await import('../src/glossary-data.js');
 const e=slug=>glossary['84101'].find(x=>x.slug===slug).def;
 assert.ok(e('gas-constant').includes(formatConstant('R'))&&e('gas-constant').includes(formatConstant('R@latm')));
 assert.ok(e('boltzmann-constant').includes(formatConstant('k')));
 assert.ok(e('avogadro').includes(formatConstant('Nₐ')));
 assert.ok(e('mole').includes('6.022×10²³'));
});

test('shared display references (formula sheet, prose placeholders, search) come from constants.js',async()=>{
 const {constants}=await import('../src/reference-formulas.js');
 const row=l=>constants.find(r=>r[0]===l)[1];
 assert.equal(row('מספר אבוגדרו'),'Nₐ = '+formatConstant('Nₐ'));
 assert.equal(row('קבוע הגזים'),'R = '+formatConstant('R@sheet')+' ; R = '+formatConstant('R'));
 assert.equal(resolveConstants('{Nₐ@count}'),'6.022×10²³');
 const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.ok(main.includes('resolveConstants(text)'),'Rich text resolves placeholders');
 const search=readFileSync(new URL('../src/search.js',import.meta.url),'utf8');
 assert.ok(search.includes("map(p=>resolveConstants(p.text||''))"),'search indexes resolved text');
 const mole=gc.topics.find(t=>t.id==='G2').content.theory.find(b=>b.text.includes('{Nₐ@count}'));
 assert.ok(mole&&!/6\.022/.test(mole.text));
 const grah=gc.topics.find(t=>t.id==='G10').content.theory.find(b=>b.text.includes('R={R}'));
 assert.ok(grah&&!/8\.314/.test(grah.text));
});

test('reference sentences state R through placeholders; supplied exercise values stay literal',()=>{
 assert.equal(formatConstant('R@cal'),'1.987 cal/(mol·K)');
 assert.equal(formatConstant('R@value'),'8.314');
 const text=gc.topics.flatMap(t=>t.content.theory).map(b=>b.text||'').join('\n');
 assert.ok(text.includes('R = {R@cal}, לא ב-{R@value}'));
 assert.ok(text.includes('R = {R} ו-ρ במטר'));
 // supplied values in prompts and worked arithmetic are deliberate and unchanged
 const quiz=JSON.stringify(gc.topics.find(t=>t.id==='G10').content.quiz);
 assert.ok(quiz.includes('R=8.3145 J/(mol·K)'));assert.ok(quiz.includes('R = 0.08206'));
});
