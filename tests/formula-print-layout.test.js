import test from 'node:test';
import assert from 'node:assert/strict';
import {packFormulaGroups,paginateFormulaGroups} from '../src/formula-print-layout.js';
const measured=Array.from({length:8},(_,i)=>({g:{id:'P'+i},h:6,ch:6,rows:Array.from({length:6},(_,j)=>({height:8,item:[i,j],key:i+'-'+j}))}));
const keys=cols=>cols.flat().filter(b=>b.kind==='row').map(b=>b.key);
test('client paginator is deterministic and preserves every row in source order',()=>{
 const before=JSON.stringify(measured),a=paginateFormulaGroups(measured,150,30);
 assert.deepEqual(a,paginateFormulaGroups(measured,150,30));assert.equal(JSON.stringify(measured),before);assert.equal(a.length,4);
 assert.deepEqual(keys(a),measured.flatMap(m=>m.rows.map(r=>r.key)));
 for(const [i,col] of a.entries()){
  assert.equal(col[0].kind,'head');const height=col.reduce((n,b)=>n+(b.kind==='head'?6:8),0);assert.ok(height<=150-(i>=2?30:0));
 }
});
test('oversized data remains explicit overflow, never dropped to force two pages',()=>{
 const a=paginateFormulaGroups(measured,40,10);assert.ok(a.length>4);assert.deepEqual(keys(a),measured.flatMap(m=>m.rows.map(r=>r.key)));
});
test('continuation headings accompany split sections and constants-only selection is valid',()=>{
 const a=packFormulaGroups([{g:{id:'X'},h:5,ch:5,rows:Array.from({length:8},(_,i)=>({height:10,key:String(i),item:[i]}))}],35);
 assert.equal(a.length,3);assert.equal(a[1][0].continued,true);assert.deepEqual(paginateFormulaGroups([],100,20),[[]]);
});

test('short topics move intact instead of leaving a one-row continuation',()=>{
 const groups=[{g:{id:'A'},h:5,ch:5,rows:[{height:20,key:'A',item:[]}]},{g:{id:'B'},h:5,ch:5,rows:[{height:12,key:'B1',item:[]},{height:12,key:'B2',item:[]}]}];
 const result=packFormulaGroups(groups,50,10);
 assert.equal(result.length,2);assert.deepEqual(keys([result[0]]),['A']);assert.deepEqual(keys([result[1]]),['B1','B2']);assert.equal(result[1][0].continued,undefined);
});
