import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {glossary,glossaryDocs,parseGlossaryRoute,glossaryCourseIds} from '../src/glossary-data.js';
import {enrichment84101} from '../src/enrichment-84101.js';
import {enrichment84102} from '../src/enrichment-84102.js';
import {exam84101} from '../src/exam-84101.js';
const catalogue=JSON.parse(fs.readFileSync(new URL('../src/courses.json',import.meta.url)));
const courses=catalogue.courses.filter(c=>c.topics?.length);

// Same normalization the page filter uses: lowercase, unify apostrophes, treat
// spaces and dashes alike, drop standalone one-letter Hebrew prefixes.
const norm=s=>String(s).toLowerCase().replace(/[’‘`׳״]/g,"'").split(/[\s־‐–—-]+/).filter(w=>!(w.length===1&&'בהולמכש'.includes(w))).join('');

// Every text the course ships for a topic: name, title, theory, worked, quiz,
// enrichment, and exam-level practice items that declare the topic.
const enrichments={'84101':enrichment84101,'84102':enrichment84102};
const exams={'84101':exam84101};
function topicText(course,topic){
 const t=[topic.name,topic.title,...(topic.content?.theory||[]).map(p=>p.text),...(topic.content?.worked||[]).flatMap(w=>[w.title,...(w.content||[])]),...(topic.content?.quiz||[]).flatMap(q=>[q.prompt,...(q.options||[]),q.answer||''])];
 const enr=enrichments[course.id]?.[topic.id];
 if(enr)t.push(...(enr.theory||[]).map(p=>p.text),...(enr.worked||[]).flatMap(w=>[w.title,...(w.content||[])]));
 for(const item of exams[course.id]||[]){
  if((item.topics||'').match(/[A-Z]\d+/g)?.includes(topic.id))t.push(item.title,item.given,...item.parts.flatMap(p=>[p.question||'',...(p.solution||[])]));
 }
 return t.filter(Boolean).join('\n');
}

test('every course ships a glossary, with well-formed unique entries on real topics',()=>{
 assert.deepEqual(glossaryCourseIds(courses).sort(),courses.map(c=>c.id).sort(),'a glossary per course');
 for(const course of courses){
  const entries=glossary[course.id];
  assert.ok(entries.length>=5,course.id+' glossary is substantive');
  const slugs=new Set();
  for(const e of entries){
   assert.ok(/^[a-z0-9-]+$/.test(e.slug),'slug '+e.slug);
   assert.ok(!slugs.has(e.slug),'duplicate slug '+course.id+'/'+e.slug);slugs.add(e.slug);
   assert.ok(e.he&&e.def,'hebrew term and definition for '+e.slug);
   assert.ok(course.topics.some(t=>t.id===e.topic),e.slug+' points at a real topic');
  }
 }
});

test('every entry is grounded in the shipped text of its own topic',()=>{
 // The glossary may rephrase, but each term (or its English/alias) must appear
 // where the entry says the course teaches it — definitions never float free
 // of reviewed course content.
 for(const course of courses)for(const e of glossary[course.id]){
  const hay=norm(topicText(course,course.topics.find(t=>t.id===e.topic)));
  const hit=[e.he,e.en,...(e.aliases||[])].filter(Boolean).some(x=>hay.includes(norm(x)));
  assert.ok(hit,course.id+'/'+e.slug+' not found in topic '+e.topic);
 }
});

// Maintenance loop: terms the course content itself defines in the repo's
// definition conventions — "מונח עברי (English): …" or a Heading carrying an
// English name — must be glossary-covered. The scan covers every shipped text
// surface: topic theory/worked/quiz, enrichment theory/worked, and exam-level
// practice. Adding such a term fails this test until the glossary gains it or
// it is consciously listed here with the reason it is not a glossary term.
// Known limit: a term introduced in plain prose without an English
// parenthetical or a definition block is not caught by this gate; the per-entry
// grounding test above still forces every glossary entry to stay anchored to
// real course text, and scientific review of definitions remains a human step.
const reviewedNonTerms={
 // '84101': {'Some Term':'reason it stays out'},
};
test('terms defined in course content stay covered as content grows',()=>{
 const re=/(?:^|[.׃,;]\s+)([א-ת][א-ת\-־ ']{1,35}?)\s*\(([A-Za-z][A-Za-z\-' ]{2,35})\)\s*:/g;
 for(const course of courses){
  const entries=glossary[course.id];
  const cover=[...new Set(entries.flatMap(e=>[e.he,e.en,...(e.aliases||[])]).filter(Boolean).map(norm))];
  const isCovered=x=>{const n=norm(x);return cover.some(c=>n.includes(c)||c.includes(n))};
  for(const topic of course.topics){
   const text=topicText(course,topic);
   for(const line of text.split('\n')){
    re.lastIndex=0;let m;
    while((m=re.exec(line))){
     const en=m[2].trim(),he=m[1].trim();
     const skip=reviewedNonTerms[course.id]?.[en];
     assert.ok(skip||isCovered(en)||isCovered(he),course.id+' content defines "'+he+' ('+en+')" in '+topic.id+' but the glossary has no entry for it');
    }
   }
  }
 }
 // Exam-level practice teaches and uses terms too; its defined terms must be
 // covered by the 84101 glossary it belongs to.
 for(const item of exam84101){
  const text=[item.title,item.given,...item.parts.flatMap(p=>[p.question||'',...(p.solution||[])])].filter(Boolean).join('\n');
  for(const line of text.split('\n')){
   re.lastIndex=0;let m;
   while((m=re.exec(line))){
    const en=m[2].trim(),he=m[1].trim();
    const entries=glossary['84101'];
    const cover=[...new Set(entries.flatMap(e=>[e.he,e.en,...(e.aliases||[])]).filter(Boolean).map(norm))];
    const isCovered=x=>{const n=norm(x);return cover.some(c=>n.includes(c)||c.includes(n))};
    const skip=reviewedNonTerms['84101']?.[en];
    assert.ok(skip||isCovered(en)||isCovered(he),'84101 exam practice defines "'+he+' ('+en+')" but the glossary has no entry for it');
   }
  }
 }
});

test('glossary routes are stable, unique and parse back',()=>{
 const docs=glossaryDocs();
 const total=Object.values(glossary).flat().length;
 assert.equal(docs.length,total);
 const routes=new Set(docs.map(d=>d.route));
 assert.equal(routes.size,total,'one stable route per term');
 for(const d of docs){
  assert.match(d.route,/^course\/[a-z0-9]+\/glossary\/[a-z0-9-]+$/);
  assert.equal(d.kind,'מונח');
  assert.ok(d.headings.length>=1&&d.body,'search doc carries heading terms and a definition body');
  const parsed=parseGlossaryRoute(d.route);
  assert.ok(parsed?.valid,'route parses back: '+d.route);
 }
 for(const [cid,entries] of Object.entries(glossary)){
  assert.deepEqual(parseGlossaryRoute('course/'+cid+'/glossary'),{courseId:cid,slug:'',valid:true});
  assert.equal(parseGlossaryRoute('course/'+cid+'/glossary/not-a-term').valid,false);
  assert.ok(parseGlossaryRoute('course/'+cid+'/glossary/'+entries[0].slug).valid);
 }
 assert.equal(parseGlossaryRoute('course/84102/P7'),null,'topic routes untouched');
 assert.equal(parseGlossaryRoute('references/formulas'),null);
});

test('no glossary route can ever collide with a topic id',()=>{
 for(const c of catalogue.courses)assert.ok(!c.topics?.some(t=>t.id==='glossary'),c.id);
});

test('glossary pages never touch saved progress, and the app wires them in',()=>{
 for(const f of ['glossary-data.js','Glossary.jsx']){
  const s=fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
  assert.ok(!/localStorage|sessionStorage/i.test(s),f);
 }
 const main=fs.readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.ok(main.includes('parseGlossaryRoute'),'route parsing wired');
 assert.ok(main.includes('<Glossary'),'page wired');
 assert.ok(main.includes('מילון המונחים'),'course-map entry panel wired');
});
