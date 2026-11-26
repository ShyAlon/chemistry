import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {verifySources,applyCorrections,classifyReimport,hash} from '../scripts/import-lib.mjs';
import {assembleCatalogue} from '../src/catalogue-contract.js';

const repo=fileURLToPath(new URL('..',import.meta.url));
const cli=(...args)=>spawnSync(process.execPath,['scripts/import-course.mjs',...args],{cwd:repo,encoding:'utf8'});
const writeJson=(abs,v)=>{fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,JSON.stringify(v,null,1)+'\n')};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'import-fix-'));
 writeJson(path.join(root,'src/content/courses.json'),{courses:[]});
 // staged authored content for course "demo" (the C-fix correction target is intentional)
 writeJson(path.join(root,'staged/demo/course.json'),{id:'demo',name:'Demo course',title:'Demo'});
 writeJson(path.join(root,'staged/demo/topics.json'),{topics:[{id:'T1',file:'topics/T1.json'},{id:'T2',file:'topics/T2.json'}]});
 writeJson(path.join(root,'staged/demo/topics/T1.json'),{id:'T1',title:'Ionic',content:{
  theory:[{text:'Molar volume of NaCl is 13.6 cm3/mol.'},{text:'Second paragraph.'}],
  worked:[{title:'W1',content:'worked one'}],
  quiz:[{type:'mc',id:'T1-q1',prompt:'p',options:['a','b'],correct:0,answer:'a'}]}});
 writeJson(path.join(root,'staged/demo/topics/T2.json'),{id:'T2',title:'Doping',content:{theory:[{text:'Donors.'}],worked:[],quiz:[]}});
 writeJson(path.join(root,'ingest/demo/corrections.json'),{corrections:[
  {id:'CFIX',topic:'T1',array:'theory',field:'text',find:'13.6 cm3/mol',replace:'13.57 cm3/mol',note:'unit fix',reference:'https://example.test/ref'}]});
 fs.mkdirSync(path.join(root,'sources/demo'),{recursive:true});
 fs.writeFileSync(path.join(root,'sources/demo','MMM_TA_1.pdf'),'fake pdf bytes');
 writeJson(path.join(root,'ingest/demo/sources.manifest.json'),{course:'demo',version:1,sources:[{file:'MMM_TA_1.pdf',sha256:sha(path.join(root,'sources/demo','MMM_TA_1.pdf'))}]});
 return root;
}
const ingestOk=root=>{const r=cli('ingest','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--sources',path.join(root,'sources/demo'));assert.equal(r.status,0,r.stderr);return r};
const readTopic=(root,id)=>JSON.parse(fs.readFileSync(path.join(root,'src/content/demo/topics/'+id+'.json'),'utf8'));

test('ingest creates a new course, applies corrections, validates the catalogue and writes a ledger',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const r=ingestOk(root);
 assert.match(r.stdout,/ingested demo: 2 topics/);
 assert.match(r.stdout,/CFIX/);
 assert.equal(readTopic(root,'T1').content.theory[0].text,'Molar volume of NaCl is 13.57 cm3/mol.');
 const docs={};const walk=(d,p='')=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const n=p+e.name;if(e.isDirectory())walk(path.join(d,e.name),n+'/');else docs[n]=JSON.parse(fs.readFileSync(path.join(d,e.name),'utf8'))}};
 walk(path.join(root,'src/content'));
 const cat=assembleCatalogue(docs);
 assert.deepEqual(cat.courses.map(c=>c.id),['demo']);
 const ledger=JSON.parse(fs.readFileSync(path.join(root,'ingest/demo/ledger.json'),'utf8'));
 assert.equal(ledger.kind,'ingested');
 assert.equal(ledger.blocks.T1.theory.length,2);
 assert.notEqual(ledger.blocks.T1.theory[0].base,ledger.blocks.T1.theory[0].final);
});

test('identical re-import is a no-op diff',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'));
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/"added":0,"sourceChanged":0,"conflicts":0,"removed":0/);
});

test('changed staged source classifies as source-changed and accept applies it',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 const tp=path.join(root,'staged/demo/topics/T1.json');
 const topic=JSON.parse(fs.readFileSync(tp,'utf8'));
 topic.content.theory[1].text='Second paragraph, updated by the lecturer.';
 fs.writeFileSync(tp,JSON.stringify(topic,null,1));
 const report=path.join(root,'report.json');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/#1 source-changed T1\/theory\[1\]/);
 const rep=JSON.parse(fs.readFileSync(report,'utf8'));
 rep.entries[0].decision='accept';fs.writeFileSync(report,JSON.stringify(rep,null,1));
 const a=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(a.status,0,a.stderr);
 assert.equal(readTopic(root,'T1').content.theory[1].text,'Second paragraph, updated by the lecturer.');
});

test('local edit colliding with a staged change is a conflict, never silently overwritten',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 // local correction made after import
 const cp=path.join(root,'src/content/demo/topics/T1.json');
 const cur=JSON.parse(fs.readFileSync(cp,'utf8'));
 cur.content.theory[1].text='Second paragraph, locally corrected.';
 fs.writeFileSync(cp,JSON.stringify(cur,null,1)+'\n');
 // staged changes the same block
 const sp=path.join(root,'staged/demo/topics/T1.json');
 const st=JSON.parse(fs.readFileSync(sp,'utf8'));
 st.content.theory[1].text='Second paragraph, rewritten from new slides.';
 fs.writeFileSync(sp,JSON.stringify(st,null,1));
 const report=path.join(root,'report.json');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/#1 conflict T1\/theory\[1\] - current content differs from the last ledger record/);
 // accept without a resolution fails closed
 let rep=JSON.parse(fs.readFileSync(report,'utf8'));
 rep.entries[0].decision='accept';fs.writeFileSync(report,JSON.stringify(rep,null,1));
 let a=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.notEqual(a.status,0);
 assert.match(a.stderr,/needs resolution/);
 assert.equal(readTopic(root,'T1').content.theory[1].text,'Second paragraph, locally corrected.');
 // keep-current preserves the local edit and records it as the state of record
 rep.entries[0].resolution='keep-current';fs.writeFileSync(report,JSON.stringify(rep,null,1));
 a=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(a.status,0,a.stderr);
 assert.equal(readTopic(root,'T1').content.theory[1].text,'Second paragraph, locally corrected.');
 // a later reconciliation round sees the staged rewrite as a clean source change and can accept it
 const report2=path.join(root,'report2.json');
 const r2=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report2);
 assert.equal(r2.status,0,r2.stderr);
 assert.match(r2.stdout,/#1 source-changed T1\/theory\[1\]/);
 const rep2=JSON.parse(fs.readFileSync(report2,'utf8'));
 rep2.entries[0].decision='accept';fs.writeFileSync(report2,JSON.stringify(rep2,null,1));
 a=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report2);
 assert.equal(a.status,0,a.stderr);
 assert.equal(readTopic(root,'T1').content.theory[1].text,'Second paragraph, rewritten from new slides.');
});

test('a correction whose target no longer matches fails the import loudly',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const tp=path.join(root,'staged/demo/topics/T1.json');
 const topic=JSON.parse(fs.readFileSync(tp,'utf8'));
 topic.content.theory[0].text='Base text rewritten, correction target gone.';
 fs.writeFileSync(tp,JSON.stringify(topic,null,1));
 const r=cli('ingest','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--sources',path.join(root,'sources/demo'));
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/correction CFIX: expected exactly 1 target block/);
 assert.equal(fs.existsSync(path.join(root,'src/content/demo')),false);
});

test('the excluded book is refused even when a manifest revision lists it',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const mp=path.join(root,'ingest/demo/sources.manifest.json');
 const m=JSON.parse(fs.readFileSync(mp,'utf8'));
 m.version=2;m.sources.push({file:'The-Cartoon-Guide-to-Chemistry.pdf',sha256:'0'.repeat(64)});
 fs.writeFileSync(mp,JSON.stringify(m,null,1));
 assert.throws(()=>verifySources(m,path.join(root,'sources/demo')),/blocked source file in manifest/);
 // and when simply present in the source directory
 fs.writeFileSync(path.join(root,'sources/demo','cartoon guide.pdf'),'x');
 assert.throws(()=>verifySources(JSON.parse(fs.readFileSync(path.join(root,'ingest/demo/sources.manifest.json'),'utf8')).__proto__===null?null:{course:'demo',version:1,sources:[{file:'MMM_TA_1.pdf',sha256:sha(path.join(root,'sources/demo','MMM_TA_1.pdf'))}]},path.join(root,'sources/demo')),/blocked source file present/);
});

test('unlisted files in the source directory are refused',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,'sources/demo','extra.pdf'),'x');
 const m=JSON.parse(fs.readFileSync(path.join(root,'ingest/demo/sources.manifest.json'),'utf8'));
 assert.throws(()=>verifySources(m,path.join(root,'sources/demo')),/unlisted file in source directory: extra.pdf/);
});

test('baseline records the current content of an existing course with zero writes and refuses to rebuild',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 // an existing course that predates the importer
 writeJson(path.join(root,'src/content/courses.json'),{courses:[{id:'demo',name:'Demo',title:'Demo',topicCatalogue:'demo/topics.json'}]});
 writeJson(path.join(root,'src/content/demo/topics.json'),{topics:[{id:'T1',file:'topics/T1.json'}]});
 writeJson(path.join(root,'src/content/demo/topics/T1.json'),{id:'T1',title:'Ionic',content:{theory:[{text:'existing'}],worked:[],quiz:[]}});
 const before=fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8');
 const r=cli('baseline','demo','--root',root);
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/baseline ledger recorded for demo: 1 topics, 0 content writes/);
 assert.equal(fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8'),before);
 const ledger=JSON.parse(fs.readFileSync(path.join(root,'ingest/demo/ledger.json'),'utf8'));
 assert.equal(ledger.kind,'baseline');
 assert.equal(ledger.blocks.T1.theory[0].base,ledger.blocks.T1.theory[0].final);
 const again=cli('baseline','demo','--root',root);
 assert.notEqual(again.status,0);
 assert.match(again.stderr,/ledger already exists/);
});

test('content freeze detects any mutation and passes when clean',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const freeze=(...a)=>spawnSync(process.execPath,['scripts/content-freeze.mjs',...a,'--root',root],{cwd:repo,encoding:'utf8'});
 const rec=path.join(root,'freeze.json');
 assert.equal(freeze('--record',rec).status,0);
 assert.equal(freeze('--check',rec).status,0);
 fs.appendFileSync(path.join(root,'src/content/courses.json'),' ');
 const bad=freeze('--check',rec);
 assert.notEqual(bad.status,0);
 assert.match(bad.stderr,/content freeze FAILED/);
 assert.match(bad.stderr,/courses\.json/);
});

// ---- stable-key alignment (importer positional-insertion repair) ----
// Keyed arrays: theory/quiz by `id`, worked by `title`; staged order is
// authoritative on accept. Arrays with no keys keep legacy positional
// behaviour. Mixed or duplicate keys abort with no writes.

function keyedFixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'import-keyed-'));
 writeJson(path.join(root,'src/content/courses.json'),{courses:[]});
 writeJson(path.join(root,'staged/demo/course.json'),{id:'demo',name:'Demo course',title:'Demo'});
 writeJson(path.join(root,'staged/demo/topics.json'),{topics:[{id:'T1',file:'topics/T1.json'}]});
 writeJson(path.join(root,'staged/demo/topics/T1.json'),{id:'T1',title:'Keyed',content:{
  theory:[{id:'T1-t1',text:'alpha'},{id:'T1-t2',text:'beta'},{id:'T1-t3',text:'gamma'}],
  worked:[{title:'W-one',content:['one']},{title:'W-two',content:['two']}],
  quiz:[{type:'mc',id:'q1',prompt:'p1',options:['a','b'],correct:0,answer:'a'},{type:'mc',id:'q2',prompt:'p2',options:['a','b'],correct:0,answer:'a'}]}});
 fs.mkdirSync(path.join(root,'sources/demo'),{recursive:true});
 fs.writeFileSync(path.join(root,'sources/demo','lec.pdf'),'fake pdf bytes');
 writeJson(path.join(root,'ingest/demo/sources.manifest.json'),{course:'demo',version:1,sources:[{file:'lec.pdf',sha256:sha(path.join(root,'sources/demo','lec.pdf'))}]});
 return root;
}
const stagedTopic=(root)=>path.join(root,'staged/demo/topics/T1.json');
const editStaged=(root,fn)=>{const p=stagedTopic(root);const t=JSON.parse(fs.readFileSync(p,'utf8'));fn(t);fs.writeFileSync(p,JSON.stringify(t,null,1)+'\n');return t};
const acceptAll=(root,decision)=>{
 const report=path.join(root,'report.json');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(r.status,0,r.stderr);
 const rep=JSON.parse(fs.readFileSync(report,'utf8'));
 for(const e of rep.entries){e.decision=decision||'accept';if(e.status==='conflict')e.resolution='take-staged'}
 fs.writeFileSync(report,JSON.stringify(rep,null,1));
 return {report,a:cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report),rep};
};
const bytesEqual=(root)=>fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8')===fs.readFileSync(stagedTopic(root),'utf8');

test('keyed: inserting blocks mid-array classifies only the inserts and accept reproduces staged byte-for-byte',t=>{
 const root=keyedFixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 editStaged(root,topic=>{
  topic.content.theory.splice(1,0,{id:'T1-t1b',text:'inserted theory'});
  topic.content.worked.splice(1,0,{title:'W-mid',content:['mid']});
  topic.content.quiz.splice(1,0,{type:'mc',id:'q1b',prompt:'pb',options:['a','b'],correct:0,answer:'a'});
 });
 const {a,rep}=acceptAll(root);
 assert.equal(a.status,0,a.stderr);
 assert.deepEqual(rep.entries.map(e=>e.status),['added','added','added']);
 assert.deepEqual(rep.entries.map(e=>e.key).sort(),['i:T1-t1b','i:q1b','t:W-mid']);
 assert.equal(rep.summary.sourceChanged,0,'no cascade of phantom source-changed entries');
 assert.equal(rep.summary.conflicts,0);
 assert.ok(bytesEqual(root),'accepted content is byte-for-byte the staged file');
 const ledger=JSON.parse(fs.readFileSync(path.join(root,'ingest/demo/ledger.json'),'utf8'));
 assert.equal(ledger.ledgerVersion,2);
});

test('keyed: deleting a block mid-array classifies only the removal and accept reproduces staged',t=>{
 const root=keyedFixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 editStaged(root,topic=>{
  topic.content.theory.splice(1,1);
  topic.content.worked.splice(0,1);
 });
 const {a,rep}=acceptAll(root);
 assert.equal(a.status,0,a.stderr);
 assert.deepEqual(rep.entries.map(e=>e.status).sort(),['removed','removed']);
 assert.ok(bytesEqual(root));
});

test('keyed: a pure reorder is one reordered entry per array; skip keeps current order, accept restores staged order',t=>{
 const root=keyedFixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 editStaged(root,topic=>{
  topic.content.theory.reverse();
  topic.content.worked.reverse();
 });
 const report=path.join(root,'report.json');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(r.status,0,r.stderr);
 const rep=JSON.parse(fs.readFileSync(report,'utf8'));
 assert.deepEqual(rep.entries.map(e=>e.status).sort(),['reordered','reordered']);
 // decision:'skip' leaves content byte-identical
 for(const e of rep.entries)e.decision='skip';
 fs.writeFileSync(report,JSON.stringify(rep,null,1));
 const before=fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8');
 const a1=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(a1.status,0,a1.stderr);
 assert.match(a1.stdout,/0 entries applied/);
 assert.equal(fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8'),before);
 // accept applies the staged order
 for(const e of rep.entries)e.decision='accept';
 fs.writeFileSync(report,JSON.stringify(rep,null,1));
 const a2=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(a2.status,0,a2.stderr);
 assert.ok(bytesEqual(root));
});

test('keyed: a staged content change hits its own block only, by id',t=>{
 const root=keyedFixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 editStaged(root,topic=>{topic.content.theory[1].text='beta, revised'});
 const report=path.join(root,'report.json');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/#1 source-changed T1\/theory\[1\]/);
 const rep=JSON.parse(fs.readFileSync(report,'utf8'));
 assert.equal(rep.entries.length,1);
 assert.equal(rep.entries[0].key,'i:T1-t2');
 rep.entries[0].decision='accept';fs.writeFileSync(report,JSON.stringify(rep,null,1));
 const a=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(a.status,0,a.stderr);
 assert.ok(bytesEqual(root));
});

test('keyed: local edit colliding with a staged change is a conflict; take-staged and keep-current both honored',t=>{
 const root=keyedFixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 const cp=path.join(root,'src/content/demo/topics/T1.json');
 const cur=JSON.parse(fs.readFileSync(cp,'utf8'));
 cur.content.theory[1].text='beta, locally corrected';
 fs.writeFileSync(cp,JSON.stringify(cur,null,1)+'\n');
 editStaged(root,topic=>{topic.content.theory[1].text='beta, rewritten from new slides'});
 const report=path.join(root,'report.json');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/#1 conflict T1\/theory\[1\]/);
 let rep=JSON.parse(fs.readFileSync(report,'utf8'));
 rep.entries[0].decision='accept';fs.writeFileSync(report,JSON.stringify(rep,null,1));
 let a=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.notEqual(a.status,0,'conflict without resolution fails closed');
 rep.entries[0].resolution='keep-current';fs.writeFileSync(report,JSON.stringify(rep,null,1));
 a=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report);
 assert.equal(a.status,0,a.stderr);
 assert.equal(readTopic(root,'T1').content.theory[1].text,'beta, locally corrected');
 // after keep-current, a fresh reconciliation classifies the staged rewrite as a clean source change
 const report2=path.join(root,'report2.json');
 const r2=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report2);
 assert.equal(r2.status,0,r2.stderr);
 assert.match(r2.stdout,/#1 source-changed T1\/theory\[1\]/);
 const rep2=JSON.parse(fs.readFileSync(report2,'utf8'));
 rep2.entries[0].decision='accept';fs.writeFileSync(report2,JSON.stringify(rep2,null,1));
 a=cli('accept','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--report',report2);
 assert.equal(a.status,0,a.stderr);
 assert.equal(readTopic(root,'T1').content.theory[1].text,'beta, rewritten from new slides');
 // and the reconciled state matches staged everywhere else
 assert.ok(bytesEqual(root));
});

test('keyed: duplicate stable keys abort the run with no writes',t=>{
 const root=keyedFixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 editStaged(root,topic=>{topic.content.theory.push({id:'T1-t2',text:'duplicated id'})});
 const before=fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'));
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/duplicate stable key i:T1-t2 in staged/);
 assert.equal(fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8'),before);
});

test('mixed stable keys (some blocks with ids, some without) abort the run with no writes',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 editStaged(root,topic=>{topic.content.theory[0].id='T1-t0'});
 const before=fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'));
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/mixed stable keys in T1\/theory/);
 assert.equal(fs.readFileSync(path.join(root,'src/content/demo/topics/T1.json'),'utf8'),before);
});

test('legacy positional behaviour is unchanged when no blocks carry keys',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 ingestOk(root);
 // insert a theory block mid-array in staged content without ids: the legacy
 // positional cascade is pinned here intentionally - keyed lessons do not
 // have it (see the keyed tests above).
 const tp=stagedTopic(root);const topic=JSON.parse(fs.readFileSync(tp,'utf8'));
 topic.content.theory.splice(1,0,{text:'inserted without an id'});
 fs.writeFileSync(tp,JSON.stringify(topic,null,1)+'\n');
 const r=cli('diff','demo','--root',root,'--staged',path.join(root,'staged/demo'));
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/#1 source-changed T1\/theory\[1\]/);
 assert.match(r.stdout,/#2 added T1\/theory\[2\]/);
});
