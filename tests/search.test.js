import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeText,tokenize,buildSearchIndex,searchSite} from '../src/search.js';
import {papers} from '../src/paper-discussions.js';
import {pages as referencePages} from '../src/reference-pages.js';

const catalogue=JSON.parse(readFileSync(new URL('../src/courses.json',import.meta.url)));

test('normalization folds sub/superscripts, case and Hebrew final letters',()=>{
 assert.equal(normalizeText('H₂O'),'h2o');
 assert.equal(normalizeText('SO₄²⁻'),'so42-');
 assert.equal(normalizeText('ABC'),'abc');
 assert.equal(normalizeText('מים'),'מימ');
 assert.equal(normalizeText('אבגדהוזחטיכךלמםנןסעפףצץקרשת'),normalizeText('אבגדהוזחטיככ למ מנ נסעפפצצקרשת'.replaceAll(' ','')));
});

test('tokenizer splits Hebrew on maqaf and keeps latin/digit runs',()=>{
 assert.deepEqual(tokenize('קלאוזיוס־קלפירון'),['קלאוזיוס','קלפירונ']);
 assert.deepEqual(tokenize('mean free path'),['mean','free','path']);
 assert.ok(tokenize('PbSe').includes('pbse'));
});

test('index covers every course, topic, paper, practice and reference page',()=>{
 const {docs}=buildSearchIndex();
 const routes=new Set(docs.map(d=>d.route));
 const topics=catalogue.courses.reduce((n,c)=>n+c.topics.length,0);
 assert.equal(docs.length,topics+catalogue.courses.length+papers.length+1+referencePages.length);
 for(const c of catalogue.courses){
  assert.ok(routes.has('course/'+c.id));
  for(const t of c.topics)assert.ok(routes.has('course/'+c.id+'/'+t.id));
 }
 for(const p of papers)assert.ok(routes.has('course/nano/papers/'+p.id));
 assert.ok(routes.has('course/84102/practice'));
 for(const p of referencePages)assert.ok(routes.has('references/'+p.id));
});

test('representative queries rank the expected page first',()=>{
 const top=q=>searchSite(q)[0]?.route;
 assert.equal(top('אוסמוזה'),'course/84101/G15');
 assert.equal(top('אפוזיה'),'course/84101/G10');
 assert.equal(top('effusion'),'course/84101/G10');
 assert.equal(top('קלאוזיוס'),'course/84101/G13');
 assert.equal(top('clausius'),'course/84101/G13');
 assert.equal(top('פוטואלקטרי'),'course/84102/P2');
 assert.equal(top('bohr'),'course/84102/P3');
 assert.equal(top('טבלה מחזורית'),'references/periodic');
 assert.equal(top('Aufbau'),'references/aufbau');
 assert.equal(top('PbSe'),'course/nano/papers/pbse-2017');
 assert.equal(top('ביקוע'),'course/nuclear/E7');
});

test('body text is searchable: terms that appear only inside page text still find the page',()=>{
 // User requirement (2026-11-19): search covers full educational text, not just titles.
 // None of these terms appear in any page title.
 const top=q=>searchSite(q)[0]?.route;
 assert.equal(top('דלטון'),'course/84101/G9');
 assert.equal(top('בולצמן'),'course/84101/G10');
 assert.equal(top('איזופרופנול'),'course/84101/G1');
 assert.equal(top('קלאוזיוס'),'course/84101/G13');
 assert.equal(top('גרהם'),'course/84101/G10');
});

test('title matches outrank body-only matches for the same term',()=>{
 // User requirement (2026-11-19): a title hit scores higher than a body hit.
 const results=searchSite('ראול');
 const titled=results.find(r=>r.route==='course/84101/G14');
 const bodyOnly=results.find(r=>r.route==='references/formulas');
 assert.ok(titled&&bodyOnly,'both competitors should appear');
 assert.ok(titled.score>bodyOnly.score,`${titled.score} should exceed ${bodyOnly.score}`);
 assert.equal(results[0].route,'course/84101/G14');
});

test('phrase queries with a missing term still rank the closest topic first',()=>{
 // "מהלך חופשי" (mean free path) is the user's own example. Before dedicated
 // coverage exists, the kinetic-theory topic is the closest useful page.
 assert.equal(searchSite('מהלך חופשי')[0]?.route,'course/84101/G10');
});

test('unicode subscript and plain ASCII formula queries match the same pages',()=>{
 assert.deepEqual(searchSite('H₂O').map(r=>r.route),searchSite('h2o').map(r=>r.route));
});

test('empty and unknown queries return no results',()=>{
 assert.deepEqual(searchSite(''),[]);
 assert.deepEqual(searchSite('   '),[]);
 assert.deepEqual(searchSite('xyzq'),[]);
});

test('every result route resolves to a real page and snippets stay short',()=>{
 const valid=new Set();
 for(const c of catalogue.courses){valid.add('course/'+c.id);for(const t of c.topics)valid.add('course/'+c.id+'/'+t.id)}
 for(const p of papers)valid.add('course/nano/papers/'+p.id);
 valid.add('course/84102/practice');
 for(const p of referencePages)valid.add('references/'+p.id);
 for(const q of ['אוסמוזה','אנתלפיה','גזים','אלקטרון','קרינה','ננו','energy','תרגול']){
  const results=searchSite(q);
  assert.ok(results.length>0,'expected results for '+q);
  for(const r of results){
   assert.ok(valid.has(r.route),r.route);
   assert.ok(r.snippet.length<=165,JSON.stringify(r.snippet));
   assert.ok(r.title&&r.kind&&r.context);
  }
  assert.ok(results.length<=12);
 }
});
