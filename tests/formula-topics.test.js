import catalogueSource from '#catalogue';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {courses as sheet} from '../src/reference-formulas.js';
import {symbolRows} from '../src/symbols.js';

const catalogue=structuredClone(catalogueSource);
const main=fs.readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');

// Topics intentionally without a formulas tab: their course content has no
// quantitative relation worth a homework reference. Removing one from this list
// means curating real items for it; adding one is a coverage decision to surface.
const NO_FORMULAS={'nano':['N4','N5','N11','N12'],'nuclear':['E8','E10']};

test('every formula item symbol key resolves against the shared definitions',()=>{
 let keyed=0;
 for(const c of sheet)for(const t of c.topics)for(const item of t.items){
  const symbols=item[3];
  if(!symbols)continue;
  keyed++;
  assert.ok(Array.isArray(symbols)&&symbols.length>0,'empty symbols list on '+t.id+'/'+item[0]);
  assert.doesNotThrow(()=>symbolRows(symbols),t.id+'/'+item[0]);
 }
 assert.ok(keyed>50,'expected broad symbol-key coverage, got '+keyed);
});

test('per-topic coverage matches the course catalogue, with an explicit no-formula list',()=>{
 for(const course of catalogue.courses){
  const sh=sheet.find(c=>c.id===course.id);
  const covered=new Set(sh?sh.topics.map(t=>t.id):[]);
  const absent=course.topics.map(t=>t.id).filter(id=>!covered.has(id));
  assert.deepEqual(absent.sort(),(NO_FORMULAS[course.id]||[]).sort(),'uncovered topics changed for '+course.id);
 }
});

test('the topic page wires the formulas tab to the shared sheet data',()=>{
 assert.ok(main.includes("from './TopicFormulas.jsx'"));
 assert.ok(main.includes("'formulas','04','נוסחאות'"));
 assert.ok(main.includes('topicFormulas(course,t.id)'),'tab must appear only when the topic has sheet data');
});
