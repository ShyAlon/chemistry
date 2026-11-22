import catalogueSource from '#catalogue';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {Formula} from '../src/Formula.js';
import {formulaPresentation} from '../src/formula-presentation.js';
import {courses} from '../src/reference-formulas.js';
const html=props=>render(React.createElement(Formula,props));
test('one Formula owns block, reference and print, including contextual tooltip choice',()=>{
 for(const variant of ['block','compact']){
  const out=html({text:'PV = nRT',symbols:['P','V#2','n','R:gas','T'],variant});
  assert.ok(out.includes('role="tooltip"'));assert.ok(out.includes('PV = nRT'));
 }
 const print=html({text:'PV = nRT',symbols:['P','V#2','n','R:gas','T'],variant:'print'});
 assert.ok(!print.includes('role="tooltip"'));assert.ok(print.includes('class="chip fx"'));
 assert.ok(!html({text:'x = 1'}).includes('role="tooltip"'),'No invented definitions');
});
test('shared display overrides apply transparently in every variant without source markup',()=>{
 const eq=courses.find(c=>c.id==='84101').topics.find(t=>t.id==='G10').items.find(i=>i[0]==='מקסוול–בולצמן')[1];
 assert.ok(!eq.includes('frac{'));
 assert.ok(formulaPresentation(eq).includes('frac{'));
 for(const variant of ['block','compact','print']){
  const out=html({text:eq,symbols:['ΔN/N','Mw','exp'],variant});
  assert.ok(out.includes('class="math-fraction"'));
  assert.ok(!out.includes('frac{'));assert.ok(out.includes('class="math-fenced"'));
 }
});
test('app formula callers never choose legacy popup/plain components or parse notation',()=>{
 for(const file of ['main.jsx','TopicFormulas.jsx','FinalPrepSolution.jsx','references.jsx','FormulaPrint.jsx']){
  const source=fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  assert.ok(source.includes('<Formula '),file);
  assert.ok(!/\b(?:DisplayMath|FormulaTip|mathNotation)\b/.test(source),file);
 }
});
test('all structured catalogue items are handled by Formula, without string-only callers',()=>{
 for(const item of courses.flatMap(c=>c.topics.flatMap(t=>t.items)).filter(i=>typeof i[1]!=='string'))assert.doesNotThrow(()=>html({expr:item[1]}));
});

test('P3 correction explicitly separates atomic energy and positive photon energy',()=>{
 const data=structuredClone(catalogueSource);
 const topic=data.courses.find(c=>c.id==='84102').topics.find(t=>t.id==='P3');
 const eq=topic.content.theory.find(b=>b.text.startsWith('ΔE_atom = E_f'));
 assert.ok(eq.text.includes('1/n_i² − 1/n_f²'));
 assert.ok(eq.text.includes('E_photon = |ΔE_atom|'));
 assert.ok(eq.text.includes('R∞·|1/n_f² − 1/n_i²|'));
 const initial=5,final=1;const delta=13.6*(1/initial**2-1/final**2);
 assert.ok(delta<0);assert.ok(Math.abs(delta+13.056)<1e-12);
 assert.ok(topic.content.theory.find(b=>b.formulaReview).text.includes('לא קבוע הגזים'));
});
