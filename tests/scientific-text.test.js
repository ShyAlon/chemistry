import {createHash} from 'node:crypto';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {ScientificText,Definition,DisplayMath} from '../src/scientific-text.js';
const data=JSON.parse(readFileSync(new URL('../src/courses.json',import.meta.url)));
test('explicit math and short meaningful groups stay inline',()=>{
 const html=render(React.createElement(ScientificText,{runs:['תחום: ',{keep:[{math:'l=0'},' עד ',{math:'n−1'}]},'.']}));
 assert.match(html,/class="math-unit"/);assert.match(html,/<bdi dir="ltr" class="inline-math">l=0/);assert.ok(!html.includes('display-math'));
});
test('quantum-number definition preserves all four mappings, range and original source text',()=>{
 const p=data.courses[0].topics[0].content.theory.find(p=>p.definition);
 assert.ok(p.text.includes('l=3 הוא f'));
 assert.deepEqual(p.definition.mappings,[['l = 0','s'],['l = 1','p'],['l = 2','d'],['l = 3','f']]);
 const html=render(React.createElement(Definition,{definition:p.definition}));assert.equal((html.match(/<dt>/g)||[]).length,4);assert.match(html,/n−1/);assert.match(html,/Angular momentum/);
});
test('only authored equation blocks get standalone layout; long source lines are not rewritten',()=>{
 const text='E = h·ν = h·c/λ        h = 6.626×10⁻³⁴ J·s';
 const html=render(React.createElement(DisplayMath,{text}));assert.match(html,/class="display-math" dir="ltr"/);assert.ok(html.includes('<div>E = h·ν = h·c/λ</div>'));assert.ok(html.includes('h = 6.626×10⁻³⁴ J·s'));
 const equations=data.courses.flatMap(c=>c.topics.flatMap(t=>t.content.theory.filter(p=>p.layout==='equation')));assert.equal(equations.length,7);for(const p of equations)assert.ok(!/[\u0590-\u05ff]/.test(p.text));
});

test('all original course content and answer data stay identical to reviewed baseline',()=>{
 const copy=structuredClone(data);for(const c of copy.courses)for(const t of c.topics)for(const p of t.content.theory){delete p.definition;delete p.layout}
 assert.equal(createHash('sha256').update(JSON.stringify(copy)).digest('hex'),'60434a51eae8d06f6eaaedc1a22a21db6fcbe2a8a49ba78e50226af68aef8f9b');
});
