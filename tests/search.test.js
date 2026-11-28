import catalogueSource from '#catalogue';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeText,tokenize,buildSearchIndex,searchSite,suggestCompletion} from '../src/search.js';
import {papers} from '../src/paper-discussions.js';
import {pages as referencePages} from '../src/reference-pages.js';
import {glossaryDocs} from '../src/glossary-data.js';

const catalogue=structuredClone(catalogueSource);
const PRACTICE_ROUTES=['course/84102/practice','course/84101/practice'];

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

test('index covers every course, topic, glossary term, paper, practice and reference page',()=>{
 const {docs}=buildSearchIndex();
 const routes=new Set(docs.map(d=>d.route));
 const topics=catalogue.courses.reduce((n,c)=>n+c.topics.length,0);
 const terms=glossaryDocs();
 assert.equal(docs.length,topics+catalogue.courses.length+papers.length+PRACTICE_ROUTES.length+referencePages.length+terms.length);
 for(const c of catalogue.courses){
  assert.ok(routes.has('course/'+c.id));
  for(const t of c.topics)assert.ok(routes.has('course/'+c.id+'/'+t.id));
 }
 for(const p of papers)assert.ok(routes.has('course/nano/papers/'+p.id));
 for(const r of PRACTICE_ROUTES)assert.ok(routes.has(r));
 for(const p of referencePages)assert.ok(routes.has('references/'+p.id));
 for(const g of terms)assert.ok(routes.has(g.route),'glossary term indexed: '+g.route);
});

test('glossary terms are searchable by Hebrew and English names and land on their deep link',()=>{
 const hits=q=>searchSite(q).slice(0,5);
 const termHit=(q,route)=>hits(q).find(h=>h.route===route);
 const osmosis=termHit('אוסמוזה','course/84101/glossary/osmosis');
 assert.ok(osmosis,'Hebrew term finds its glossary entry');
 assert.equal(osmosis.kind,'מונח');
 assert.ok(termHit('osmosis','course/84101/glossary/osmosis'),'English term finds its glossary entry');
 assert.ok(termHit('mean free path','course/84101/glossary/mean-free-path'),'English multi-word term');
 assert.ok(termHit('ננו חלקיק','course/nano/glossary/nanoparticle'),'Hebrew term in another course');
 // A query matching a topic title still ranks the topic above its glossary terms.
 const top=searchSite('אוסמוזה')[0];
 assert.ok(['course/84101/G15','course/84101/glossary/osmosis'].includes(top.route),'topic or its own term stays on top');
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
 // Terms without a glossary entry lead to the topic that teaches them; terms
 // with an entry lead to it (the direct answer) while the teaching topic
 // stays right behind — it is never buried.
 const top=q=>searchSite(q)[0]?.route;
 const near=(q,route)=>searchSite(q).slice(0,3).some(r=>r.route===route);
 assert.ok(near('איזופרופנול','course/84101/G1')); // G1 grew (GC1 audit); G1 must stay among the first three
 assert.equal(top('קלאוזיוס'),'course/84101/G13');
 assert.equal(top('דלטון'),'course/84101/glossary/dalton');
 assert.ok(near('דלטון','course/84101/G9'));
 assert.equal(top('בולצמן'),'course/84101/glossary/maxwell-boltzmann');
 // GC2 (2026-11-25): E9 legitimately teaches S = k_B ln W and the formulas page lists it,
 // so they now rank between the glossary entries and G10. The two glossary entries stay
 // first, and both G10 and GC2 E9 must remain among the first five results.
 assert.ok(searchSite('בולצמן').slice(0,5).some(r=>r.route==='course/84101/G10'));
 assert.ok(searchSite('בולצמן').slice(0,5).some(r=>r.route==='course/general-chemistry-2/E9'));
 assert.equal(top('גרהם'),'course/84101/glossary/graham');
 assert.ok(near('גרהם','course/84101/G10'));
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

test('phrase queries land on the glossary term with the teaching topic right behind',()=>{
 // "מהלך חופשי" (mean free path) is the user's own example; the term page
 // answers it directly and G10, which teaches it, stays on the podium.
 const results=searchSite('מהלך חופשי');
 assert.equal(results[0]?.route,'course/84101/glossary/mean-free-path');
 assert.ok(results.slice(0,3).some(r=>r.route==='course/84101/G10'));
});

test('English phrase aliases land on the Hebrew term and its teaching pages',()=>{
 assert.equal(searchSite('mean free path')[0]?.route,'course/84101/glossary/mean-free-path');
 assert.ok(searchSite('mean free path').slice(0,3).some(r=>r.route==='course/84101/G10'));
 // GC2 (2026-11-25): the alias expands to the Hebrew term for collisions, and GC2 E11 is
 // titled as the collision-theory topic (accurate scientific heading, kept). It now ranks
 // first for this query. The glossary entry and the original teaching topic G10 must
 // stay in the first four results.
 assert.equal(searchSite('collision frequency')[0]?.route,'course/general-chemistry-2/E11');
 assert.ok(searchSite('collision frequency').slice(0,2).some(r=>r.route==='course/84101/glossary/collision-frequency'));
 assert.ok(searchSite('collision frequency').slice(0,4).some(r=>r.route==='course/84101/G10'));
 assert.equal(searchSite('dew point')[0]?.route,'course/84101/glossary/dew-point');
 assert.ok(searchSite('dew point').some(r=>r.route==='course/84101/practice'));
});

test('exam-level practice page is searchable by its problem content',()=>{
 const results=searchSite('נקודת טל');
 const exam=results.find(r=>r.route==='course/84101/practice');
 assert.ok(exam,'exam practice page appears');
 assert.equal(exam.kind,'בחינה');
 // The dew-point term leads; the exam page that drills it is right behind.
 assert.equal(results[0]?.route,'course/84101/glossary/dew-point');
 assert.ok(results.indexOf(exam)<=2,'exam page stays near the top');
});

test('unicode subscript and plain ASCII formula queries match the same pages',()=>{
 assert.deepEqual(searchSite('H₂O').map(r=>r.route),searchSite('h2o').map(r=>r.route));
});

test('half-typed words still rank results: prefix expansion (user report 2026-11-19)',()=>{
 // Shy typed "ליגנ" and got nothing while "ליגנד" had plenty; partial input
 // must match indexed tokens it prefixes, without outranking real matches.
 const partial=searchSite('ליגנ');
 assert.ok(partial.length>0,'"ליגנ" returns results');
 assert.ok(partial.some(r=>r.route==='course/nano/N11'),'the topic teaching ligands ranks');
 assert.ok(partial.some(r=>r.kind==='מונח'),'ligand glossary terms rank');
 // The suggested completion is ליגנד, so the standalone term leads: exact
 // completed-title relevance beats a longer compound-term prefix match.
 assert.equal(partial[0].route,'course/nano/glossary/ligand','standalone ligand term leads for the half-typed word');
 const full=searchSite('ליגנד');
 assert.ok(full.findIndex(r=>r.route==='course/nano/glossary/ligand')<full.findIndex(r=>r.route==='course/nano/glossary/ligand-exchange'),'standalone term beats the compound term for the completed word too');
 // The completed word's results stay ahead-ranked and unchanged in kind mix.
 assert.ok(searchSite('ליגנד').length>=partial.length-1,'completion does not lose coverage');
 // Prefix expansion never invents results for gibberish.
 assert.deepEqual(searchSite('ליגצ'),[]);
});

test('shadow completion finishes the word being typed from site titles',()=>{
 assert.equal(suggestCompletion('ליגנ'),'ליגנד');
 assert.equal(suggestCompletion('ליגנד'),null,'a complete vocabulary word gets no suggestion');
 assert.equal(suggestCompletion('מהלך חופ'),'מהלך חופשי');
 assert.equal(suggestCompletion('osmo'),'Osmosis');
 assert.equal(suggestCompletion('xyzq'),null);
 assert.equal(suggestCompletion(''),null);
 assert.equal(suggestCompletion('לי'),null,'too short to suggest responsibly');
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
 for(const r of PRACTICE_ROUTES)valid.add(r);
 for(const p of referencePages)valid.add('references/'+p.id);
 for(const g of glossaryDocs())valid.add(g.route);
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
