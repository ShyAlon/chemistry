import test from 'node:test';
import assert from 'node:assert/strict';
import {courses} from '../src/reference-formulas.js';
import {compactFormulaTopics,printRowGroups} from '../src/formula-print-data.js';

test('compact print removes only the worked example and gallery navigation, not topics or core equations',()=>{
 for(const c of courses){const before=JSON.stringify(c),out=compactFormulaTopics(c);assert.equal(out.length,c.topics.length);assert.equal(JSON.stringify(c),before,'Do not mutate screen reference');
  for(let ti=0;ti<out.length;ti++){
   const a=c.topics[ti],b=out[ti];assert.equal(b.id,a.id);
   const kept=a.items.filter(([l])=>!(a.id==='P9'&&l==='דוגמת סף')&&!(a.id==='G11'&&l==='מדריך'));assert.equal(b.items.length,kept.length);
   for(let i=0;i<kept.length;i++){assert.equal(b.items[i][0],kept[i][0]);if(typeof kept[i][1]==='string')assert.equal(b.items[i][1],kept[i][1],'Preserve all non-example equations exactly')}
  }
 }
});
test('compact notes retain validity limits, signs and units and remove navigation',()=>{
 const all=courses.flatMap(compactFormulaTopics),item=(id,label)=>all.find(t=>t.id===id).items.find(r=>r[0]===label);
 for(const [id,label,required] of [['P3','רידברג לפוטון',['חד־אלקטרוני','m⁻¹']],['P4','דה־ברויי',['לא־יחסותי','p = E/c']],['P8','מטען מתוך יינון',['קירוב','יחידות']],['P9','אורך גל סף ליינון',['מרבי','אחד','רמה']],['P11','מוסכמת הקורס',['< 0','> 0']],['G13','קלאוזיוס־קלפירון',['קלווין','יחידות']],['G15','לחץ אדים',['לא־נדיף','אידיאלית']]])for(const term of required)assert.ok(item(id,label)[2].includes(term),id+' '+term);
 assert.ok(!JSON.stringify(all).includes('ראו דף Aufbau'));
 assert.ok(all.find(t=>t.id==='P5').items.find(r=>r[0]==='תת־קליפות')[1].includes('l = 3: f'));
});

test('explicit side-by-side groups retain all items and their order without mutation',()=>{
 for(const course of courses)for(const topic of compactFormulaTopics(course)){
  const before=JSON.stringify(topic),groups=printRowGroups(topic);
  assert.deepEqual(groups.flatMap(g=>g.map(c=>c.item)),topic.items);assert.equal(JSON.stringify(topic),before);
 }
 for(const id of ['P2','P5','P6','P12'])assert.ok(printRowGroups(compactFormulaTopics(courses[0]).find(t=>t.id===id)).some(g=>g.length>1));
});
