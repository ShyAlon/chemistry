import catalogueSource from '#catalogue';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {elements} from '../src/reference-data.js';
import {courses as sheet,constants} from '../src/reference-formulas.js';
const figureIds=new Set([...fs.readFileSync(new URL('../src/figures.jsx',import.meta.url),'utf8').matchAll(/^\s*'([a-z-]+)':[A-Za-z]+,/gm)].map(m=>m[1]));
import {enrichment84101} from '../src/enrichment-84101.js';
import {enrichment84102} from '../src/enrichment-84102.js';
const catalogue=structuredClone(catalogueSource);
test('periodic table has 118 unique elements in unique grid cells',()=>{
 assert.equal(elements.length,118);assert.deepEqual(elements.map(e=>e.z),[...Array(118).keys()].map(i=>i+1));
 assert.equal(new Set(elements.map(e=>e.s)).size,118);assert.equal(new Set(elements.map(e=>e.p+','+e.g)).size,118);
 for(const e of elements){assert.ok((e.he||e.z>=104)&&e.n&&e.cat&&e.b);assert.ok(e.g>=1&&e.g<=18)}
});
test('known configurations match the course exceptions and counts',()=>{
 const f=z=>{const e=elements[z-1];return (e.core?`[${e.core}]`:'')+e.cfg.map(([s,n])=>s+n).join('')};
 assert.equal(f(24),'[Ar]4s13d5');assert.equal(f(29),'[Ar]4s13d10');assert.equal(f(10),'[He]2s22p6');
 for(const e of elements.filter(e=>e.z<=103&&e.z>2&&!e.core.length===false)){const core={He:2,Ne:10,Ar:18,Kr:36,Xe:54,Rn:86}[e.core];assert.equal(core+e.cfg.reduce((a,[,n])=>a+n,0),e.z,e.s)}
});
test('formula sheet covers course topics: exactly for the two original courses, curated subsets for nuclear and nano',()=>{
 // 84101/84102 have sheets matching their topics exactly; nuclear and nano have curated sheets
 // only for topics with real quantitative content (see tests/formula-topics.test.js).
 assert.deepEqual(sheet.map(x=>x.id).sort(),['84101','84102','nano','nuclear']);
 for(const sh of sheet){const c=catalogue.courses.find(x=>x.id===sh.id);assert.ok(c,'formula sheet for unknown course '+sh.id);
  if(sh.id==='84101'||sh.id==='84102')assert.deepEqual(sh.topics.map(t=>t.id).sort(),c.topics.map(t=>t.id).sort());
  else for(const t of sh.topics)assert.ok(c.topics.some(x=>x.id===t.id),'sheet topic missing from course '+t.id)}
 assert.ok(constants.length>=10);
 for(const t of sheet.flatMap(c=>c.topics))assert.ok(t.items.length>0&&t.items.every(i=>i[0]&&i[1]))
});
test('gallery figures all exist',()=>{
 for(const enr of [enrichment84101,enrichment84102])for(const t of Object.values(enr))for(const p of t.theory||[])if(p.style==='Figure')assert.ok(figureIds.has(p.figure),p.figure)
});
test('reference pages never touch saved progress',()=>{
 for(const f of ['references.jsx','reference-data.js','reference-formulas.js','ions.js','ion-data.js']){const s=fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8');assert.ok(!/localStorage|sessionStorage/i.test(s),f)}
});

test('gallery figures render labels at 18px or more',()=>{
 const sizes=['figures-84101.jsx','figures-84102.jsx','figures-core.jsx'].flatMap(f=>[...fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8').matchAll(/size=\{?(\d+)\}?/g)].map(m=>+m[1]));
 const boxes=['figures-84101.jsx','figures-84102.jsx'].flatMap(f=>[...fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8').matchAll(/viewBox="0 0 (\d+) \d+"/g)].map(m=>+m[1]));
 const css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 const width=+css.match(/\.ref-fig \.fig-svg\{width:(\d+)px/)[1];
 const narrowest=Math.min(560,...boxes);
 assert.ok(Math.min(...sizes)*width/narrowest>=18,'smallest label too small');
});
test('element data keeps sources: weights have uncertainty or mass numbers',()=>{
 for(const e of elements)assert.ok((e.m&&e.u)||(!e.m&&e.mn?.length),e.s);
 assert.equal(elements.filter(e=>e.m).length+elements.filter(e=>e.mn).length,118);
});
