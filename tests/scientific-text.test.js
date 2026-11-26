import catalogueSource from '#catalogue';
import {beforePractice} from './practice-baseline.js';
import {createHash} from 'node:crypto';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {ScientificText,Definition,DisplayMath} from '../src/scientific-text.js';
const data=structuredClone(catalogueSource);
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
 const equations=data.courses.flatMap(c=>c.topics.filter(t=>!/^G1[3-6]$/.test(t.id)).flatMap(t=>t.content.theory.filter(p=>p.layout==='equation'&&!p.batch2&&!p.batch3&&!p.batch4&&!p.recap&&!p.finalPrep&&p.notationOf===undefined)));assert.equal(equations.length,20);for(const p of equations)assert.ok(!/[\u0590-\u05ff]/.test(p.text));
});

test('nuclear course content is pinned to its reviewed snapshot',()=>{
 const nuclear=data.courses.find(c=>c.id==='nuclear');
 assert.ok(nuclear);assert.equal(nuclear.topics.length,10);
 const copy=structuredClone(nuclear.topics).map(beforePractice);
 assert.equal(createHash('sha256').update(JSON.stringify(copy)).digest('hex'),'a4860199aefdbba2556cc4480f4b03d99f6747a1ed3f8f9f2e03f54acb664569');
});

test('course content and answer data stay identical except the explicit V+ worked-answer correction',()=>{
 const copy=structuredClone(data);copy.courses=copy.courses.filter(c=>c.id!=='nuclear'&&c.id!=='general-chemistry-2');copy.courses[0].topics=copy.courses[0].topics.slice(0,10);copy.courses.find(c=>c.id==='84101').topics=copy.courses.find(c=>c.id==='84101').topics.slice(0,12);for(const c of copy.courses)c.topics=c.topics.map(beforePractice);for(const c of copy.courses)for(const t of c.topics)for(const p of t.content.theory){delete p.definition;delete p.layout}
 const vanadium=copy.courses.find(c=>c.id==='84102').topics.find(t=>t.id==='P7').content.worked.find(w=>w.title.startsWith('סוג 4:'));
 assert.equal(vanadium.content.length,4);
 assert.match(vanadium.content[2],/לפי כלל ההוצאה הנלמד בקורס/);
 assert.match(vanadium.content[2],/V⁺ = \[Ar\]4s¹3d³/);
 assert.match(vanadium.content[3],/NIST/);
 assert.match(vanadium.content[3],/\[Ar\]3d⁴/);
 // Restore only this known correction before checking the unchanged content baseline.
 vanadium.content.splice(2,2,'V: [Ar]4s²3d³. V⁺ = [Ar]3d⁴ (לא [Ar]4s¹3d³ - המוצא הוא תמיד מ-s קודם).');
 assert.equal(createHash('sha256').update(JSON.stringify(copy.courses.map(c=>c.topics))).digest('hex'),'ecac22810423c5707fd80ee9c63b4fa229d3df6c9bb6abba8e0205d69c5ea3e4');
});
