import catalogueSource from '#catalogue';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {courses,constants} from '../src/reference-formulas.js';
import {exam84101} from '../src/exam-84101.js';
import {formulaMetadata,exerciseFormulaContext,explicitFormulaMetadata,exerciseFormulaContexts} from '../src/formula-metadata.js';
import {compactFormulaTopics} from '../src/formula-print-data.js';
import {formulaPresentations} from '../src/formula-presentation.js';
import {SYMBOLS} from '../src/symbol-defs.js';
const catalogue=structuredClone(catalogueSource);
const types=new Set(['equation','conversion','prefix-table','definition-table','configuration-table','rule','reaction','comparison','ratio-with-prose-labels','navigation','nuclear-reaction','numeric-threshold','numeric-value','numeric-estimate','course-values','constant-or-conversion','worked-context']);
function validate(record,where){
 assert.ok(record,where+': missing explicit metadata');assert.ok(types.has(record.kind),where+': unknown category');
 assert.ok(record.symbols?.length||record.explanation?.trim(),where+': needs definitions or notation explanation');
 const seen=new Map();for(const id of record.symbols||[]){assert.ok(SYMBOLS[id],where+': unknown '+id);const {sym}=SYMBOLS[id];assert.ok(!seen.has(sym)||seen.get(sym)===id,where+': conflicting contexts for '+sym);seen.set(sym,id)}
}
test('every authored catalogue, constant and theory equation has explicit valid metadata',()=>{
 for(const c of courses)for(const t of c.topics)for(const [label,text,,symbols] of t.items)validate(formulaMetadata(text,{symbols}),c.id+'/'+t.id+'/'+label);
 for(const [label,text]of constants)validate(formulaMetadata(text),'constant/'+label);
 for(const c of catalogue.courses)for(const t of c.topics)for(const b of t.content.theory)if(b.layout==='equation')validate(formulaMetadata(b.text,{symbols:b.symbols}),c.id+'/'+t.id+'/'+b.text);
});
test('every worked display step inherits an explicit reviewed exercise context and new steps fail closed',()=>{
 const exercised=new Set();let lines=0;
 const check=(title,blocks)=>{const m=exerciseFormulaContext(title);exercised.add(title);validate(m,title);const expressions=blocks.filter(b=>b.math).map(b=>b.math);assert.deepEqual(expressions,m.expressions,title+': steps changed, review context coverage');lines+=expressions.length;for(const b of blocks)if(b.math)validate(b.formulaContext||m,title+'/'+b.math)};
 for(const c of catalogue.courses)for(const t of c.topics)for(const w of t.content.worked)if(w.solutionBlocks)check(w.title,w.solutionBlocks);
 for(const e of exam84101)if(e.parts.some(p=>p.solutionBlocks))check(e.title,e.parts.flatMap(p=>p.solutionBlocks||[]));
 assert.equal(lines,269);assert.deepEqual([...exercised].sort(),Object.keys(exerciseFormulaContexts).sort(),'No dangling exercise contexts');
});
test('unknown metadata never receives a guessed global symbol definition',()=>{
 assert.equal(formulaMetadata('R = newly-authored-and-unreviewed'),null);
 assert.throws(()=>exerciseFormulaContext('new exercise'),/Missing exercise/);
 const metal=formulaMetadata('M-OR + H₂O → M-OH + ROH');assert.ok(metal.symbols.includes('R@organic'));
 assert.ok(exerciseFormulaContext('ממשיים 4: בויל אינו קסם').symbols.includes('c@concentration'));
});


test('metadata and reviewed presentation overrides cannot become unmatched',()=>{
 const authored=new Set();
 const add=value=>authored.add(typeof value==='string'?value:JSON.stringify(value));
 for(const c of courses)for(const t of c.topics)for(const item of t.items){add(item[1]);if(item[2])add(item[2])}
 for(const c of courses)for(const t of compactFormulaTopics(c))for(const [,value,,symbols]of t.items){add(value);validate(formulaMetadata(value,{symbols}),'print/'+t.id)}
 for(const [,value]of constants)add(value);
 for(const c of catalogue.courses)for(const t of c.topics)for(const b of t.content.theory)if(b.layout==='equation')add(b.text);
 for(const [text,record]of Object.entries(explicitFormulaMetadata)){assert.ok(authored.has(text),'Unmatched metadata: '+text);validate(record,text)}
 for(const [text,value]of formulaPresentations){assert.ok(authored.has(text),'Unmatched presentation override: '+text);assert.ok(value.includes('frac{'),'Reviewed override should use fraction notation')}
});
