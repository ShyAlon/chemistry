import catalogueSource from '#catalogue';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {normalizeBidiText as n} from '../src/bidi.js';import {bidiElement} from '../src/bidi-react.js';
const L='\u2066',R='\u2067',P='\u2069';
test('prefix definitions isolate formulas separately from Hebrew parentheses',()=>{assert.equal(n('k = 10³ (קילו), M = 10⁶ (מגה).'),`${L}k = 10³${P} ${R}(קילו)${P}, ${L}M = 10⁶${P} ${R}(מגה)${P}.`)});
test('nested formulas, Hebrew parentheses and units preserve source characters',()=>{for(const input of ['זהויות (מתרגול 1)','1 nm = 10 Å (ואנגסטרם: 1 Å = 10⁻¹⁰ m)','לחץ [Pa = kg/(m·s²)].','H₂SO₄ + 2OH⁻ → SO₄²⁻ + 2H₂O','m = 10⁻³ (מילי), µ = 10⁻⁶ (מיקרו)','מהירות 515 m/s ב-25°C']){const out=n(input);assert.equal(out.replace(/[\u2066-\u2069]/g,''),input);assert.equal(n(out),out);let depth=0;for(const c of out){if(c===L||c===R)depth++;if(c===P)depth--;assert.ok(depth>=0)}assert.equal(depth,0)}assert.equal(n('זהויות (מתרגול 1)'),`זהויות ${R}(מתרגול ${L}1${P})${P}`)});
test('default JSX boundary keeps all prose math inline and machine values raw',()=>{
 const html=renderToStaticMarkup(bidiElement('p',null,'אנרגיה: 1 cal = 4.184 J, מסה 5 g'));
 assert.ok(!html.includes('formula-block'));assert.match(html,/<bdi[^>]*dir="ltr"/);assert.match(html,/5 g/);
 const input=bidiElement('option',{value:'g/mol'},'g/mol');assert.equal(input.props.value,'g/mol');
 for(const tag of ['h1','h2','h3','p','button','option'])assert.ok(!renderToStaticMarkup(bidiElement(tag,null,'נתון: E = hν')).includes('formula-block'));
});
test('punctuation does not fuse one mapping with the next formula',()=>{
 assert.equal(n('s, l=1'),`${L}s${P}, ${L}l=1${P}`);
 assert.equal(n('n = 1, 2, 3'),`${L}n = 1, 2, 3${P}`);
 assert.equal(n('(subshell). l = 0'),`${L}(subshell)${P}. ${L}l = 0${P}`);
 assert.equal(n('v = 3.14 m/s'),`${L}v = 3.14 m/s${P}`);
});
test('explicit directional HTML stays raw and does not nest generated boundaries',()=>{
 assert.equal(renderToStaticMarkup(bidiElement('bdi',{dir:'ltr'},'l = 0')), '<bdi dir="ltr">l = 0</bdi>');
});

test('SVG text keeps valid text nodes and visible atom labels',()=>{const svg=renderToStaticMarkup(bidiElement('svg',null,bidiElement('text',null,'P7'),bidiElement('text',null,'G12')));assert.ok(!svg.includes('<span'));assert.ok(svg.includes('P7'));assert.ok(svg.includes('G12'));assert.ok(svg.includes('\u2066'));});

test('signed fractions and range limits keep signs inside their LTR boundary',()=>{
 assert.equal(n('+½'),`${L}+½${P}`);assert.equal(n('-½'),`${L}-½${P}`);assert.equal(n('−½'),`${L}−½${P}`);
 assert.equal(n('עד +l'),`עד ${L}+l${P}`);assert.equal(n('ב-25°C'),`ב-${L}25°C${P}`);
 assert.equal(n('-25°C'),`${L}-25°C${P}`);
});

test('all course strings retain characters and idempotence through display normalization',async()=>{
 const {readFileSync}=await import('node:fs');const data=structuredClone(catalogueSource);
 function visit(x){if(typeof x==='string'){const out=n(x);assert.equal(out.replace(/[\u2066-\u2069]/g,''),x.replace(/[\u2066-\u2069]/g,''));assert.equal(n(out),out)}else if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object')Object.values(x).forEach(visit)}visit(data);
});

test('chromium/copper screenshot: semicolon cannot fuse separate scientific statements',()=>{
 const data=structuredClone(catalogueSource);
 const text=data.courses[0].topics[0].content.theory.find(p=>p.text?.startsWith('החריגים Cr')).text;
 const html=renderToStaticMarkup(bidiElement('p',null,text));
 assert.ok(!html.includes('4s²3d⁴; Cu'));
 assert.match(html,/4s²3d⁴<\/bdi>; <bdi[^>]+>Cu<\/bdi>/);
 assert.equal(n('תוצאה 4s²3d⁴; Cu הוא יסוד'),`תוצאה ${L}4s²3d⁴${P}; ${L}Cu${P} הוא יסוד`);
 // Bracketed groups and comma enumerations are mathematical content, not prose boundaries.
 assert.equal(n('[x; y]'),`${L}[x; y]${P}`);
 assert.equal(n('n = 1, 2, 3'),`${L}n = 1, 2, 3${P}`);
});

test('isotope mass numbers open the LTR run: left superscripts stay attached',()=>{
 assert.equal(n('האיזוטופ ¹⁰⁷Ag נפוץ'),`האיזוטופ ${L}¹⁰⁷Ag${P} נפוץ`);
 assert.equal(n('²⁷Al + ⁴He → ³⁰P + n'),`${L}²⁷Al + ⁴He → ³⁰P + n${P}`);
 assert.equal(n('CO₂ ו-H₂O ב-STP'),`${L}CO₂${P} ו-${L}H₂O${P} ב-${L}STP${P}`);
});
