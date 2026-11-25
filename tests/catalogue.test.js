import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import catalogue from '#catalogue';
import {assembleCatalogue} from '../src/catalogue-contract.js';
import {contentRoot,readDocuments,loadCatalogue,writeCatalogue} from '../scripts/content-store.mjs';
const clone=()=>structuredClone(readDocuments());

test('split manifest preserves ordered course/topic identity and complete content',()=>{
 assert.deepEqual(catalogue.courses.map(c=>[c.id,c.topics.length]),[['84102',12],['84101',16],['nano',12],['nuclear',10],['solid-state',8],['general-chemistry-2',13]]);
 assert.deepEqual(catalogue.courses[0].topics.map(t=>t.id),['P7','P9','P10','P3','P2','P5','P6','P8','P1','P4','P11','P12']);
 assert.equal(catalogue.courses.flatMap(c=>c.topics).length,71);
 assert.equal(catalogue.courses.flatMap(c=>c.topics.flatMap(t=>t.content.quiz)).length,657);
 assert.deepEqual(loadCatalogue(),catalogue);
 assert.equal(Object.keys(readDocuments()).length,78); // 55 legacy + solid-state topics.json + 8 topic files + general-chemistry-2 topics.json + 13 topic files
});
test('missing, orphan and multiply referenced files fail closed',()=>{
 const missing=clone();delete missing['84101/topics/G1.json'];assert.throws(()=>assembleCatalogue(missing),/missing file/);
 const orphan=clone();orphan['84101/topics/unused.json']={};assert.throws(()=>assembleCatalogue(orphan),/unreferenced/);
 const duplicate=clone();duplicate['84101/topics.json'].topics.push({...duplicate['84101/topics.json'].topics[0]});assert.throws(()=>assembleCatalogue(duplicate),/duplicate topic/);
});
test('invalid course/topic references and duplicate IDs fail before rendering',()=>{
 const duplicate=clone();duplicate['courses.json'].courses.push({...duplicate['courses.json'].courses[0]});assert.throws(()=>assembleCatalogue(duplicate),/duplicate course/);
 const traversal=clone();traversal['84101/topics.json'].topics[0].file='../84102/topics/P1.json';assert.throws(()=>assembleCatalogue(traversal),/invalid topic file/);
 const wrongId=clone();wrongId['84101/topics/G1.json'].id='changed';assert.throws(()=>assembleCatalogue(wrongId),/invalid topic content/);
 const badContent=clone();badContent['84101/topics/G1.json'].content.quiz={};assert.throws(()=>assembleCatalogue(badContent),/invalid topic content/);
});
test('catalogue order is explicit, never filename order; topic IDs can repeat across courses',()=>{
 const documents=clone();documents['84101/topics.json'].topics.reverse();
 assert.equal(assembleCatalogue(documents).courses[1].topics[0].id,'G16');
 assert.equal(assembleCatalogue(documents).courses[1].topics.at(-1).id,'G1');
 const repeated={'courses.json':{courses:[]}};
 for(const id of ['first','second']){
  repeated['courses.json'].courses.push({id,topicCatalogue:id+'/topics.json'});
  repeated[id+'/topics.json']={topics:[{id:'T1',file:'topics/T1.json'}]};
  repeated[id+'/topics/T1.json']={id:'T1',content:{theory:[],worked:[],quiz:[]}};
 }
 assert.deepEqual(assembleCatalogue(repeated).courses.map(c=>c.topics[0].id),['T1','T1']);
});
test('content writer round trips without rewriting unchanged files and validates before writes',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chem-content-'));
 try{
  fs.cpSync(contentRoot,dir,{recursive:true});
  assert.equal(writeCatalogue(structuredClone(catalogue),dir),0);
  const updated=structuredClone(catalogue);updated.courses[1].topics[0].content.theory[0].text+=' test';
  assert.equal(writeCatalogue(updated,dir),1);assert.deepEqual(loadCatalogue(dir),updated);
  const invalid=structuredClone(updated);invalid.courses[1].topics.reverse();
  assert.throws(()=>writeCatalogue(invalid,dir),/structural edits/);
  assert.deepEqual(loadCatalogue(dir),updated);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('Node content reader rejects symlinks and unexpected files',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chem-content-'));
 try{
  fs.cpSync(contentRoot,dir,{recursive:true});fs.writeFileSync(path.join(dir,'notes.txt'),'unexpected');
  assert.throws(()=>readDocuments(dir),/unexpected data entry/);fs.unlinkSync(path.join(dir,'notes.txt'));
  fs.symlinkSync(path.join(dir,'courses.json'),path.join(dir,'alias.json'));
  assert.throws(()=>readDocuments(dir),/symlink/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
