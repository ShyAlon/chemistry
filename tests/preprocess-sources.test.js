// Tests for the advisory preprocessing wiring (scripts/preprocess-sources.mjs
// and its default hook in scripts/import-course.mjs). The real preprocess.py
// is not required: a stub node "python" emits canned JSON and writes a marker
// file; a missing tool is simulated with a nonexistent executable. No source
// PDFs are used.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const repoRoot=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const wrapper=path.join(repoRoot,'scripts','preprocess-sources.mjs');
const importer=path.join(repoRoot,'scripts','import-course.mjs');

const CANNED={file:'a.pdf',sha256:'x',pageCount:2,seconds:{},reused:true,
 check:{candidates:3,reconcile:4,counts:{balanced:1,'balanced-ambiguous':1,unbalanced:1,unparsed:0,notation:0,fragment:0,'not-equation':1},
 balancedAmbiguous:[],unbalanced:[],unparsed:[],arith:{ok:0,mismatch:[{line:'2.5 + 2.5 = 5.1',computed:'5.0',claimed:'5.1'}]}}};

function tmpdir(){return fs.mkdtempSync(path.join(os.tmpdir(),'preprocess-wire-'))}
const writeJson=(abs,v)=>{fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,JSON.stringify(v,null,1)+'\n')};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// A stand-in for python3+preprocess.py: prints the canned run JSON and, when
// MARKER is set, appends a line so tests can prove the hook actually ran.
function stubPython(dir){
 const p=path.join(dir,'stub-python.mjs');
 fs.writeFileSync(p,
  'import fs from "node:fs";\n'+
  'if(process.env.MARKER)fs.appendFileSync(process.env.MARKER,"ran\\n");\n'+
  'process.stdout.write(JSON.stringify('+JSON.stringify(CANNED)+')+"\\n");\n');
 return p;
}

test('refuses a cache dir inside the repo',()=>{
 const dir=tmpdir();fs.writeFileSync(path.join(dir,'a.pdf'),'%PDF-1.4 stub');
 const cache=path.join(repoRoot,'tmp-preprocess-cache-inside-repo');
 const r=spawnSync(process.execPath,[wrapper,'--sources',dir,'--cache',cache],{encoding:'utf8'});
 assert.equal(r.status,2);
 assert.match(r.stderr,/must be outside the repo/);
});

test('refuses a report path inside the repo',()=>{
 const dir=tmpdir();fs.writeFileSync(path.join(dir,'a.pdf'),'%PDF-1.4 stub');
 const r=spawnSync(process.execPath,[wrapper,'--sources',dir,'--cache',tmpdir(),'--report',path.join(repoRoot,'preprocess-report.json')],{encoding:'utf8'});
 assert.equal(r.status,2);
 assert.match(r.stderr,/must be outside the repo/);
});

test('advisory: missing tool exits 0 with a note, never blocks',()=>{
 const dir=tmpdir();fs.writeFileSync(path.join(dir,'a.pdf'),'%PDF-1.4 stub');
 const r=spawnSync(process.execPath,[wrapper,'--sources',dir,'--cache',tmpdir()],{encoding:'utf8',
  env:{...process.env,PREPROCESS_PYTHON:'/nonexistent/python'}});
 assert.equal(r.status,0);
 assert.match(r.stdout,/advisory only/);
});

test('aggregates runs and writes the report outside the repo',()=>{
 const dir=tmpdir();fs.writeFileSync(path.join(dir,'a.pdf'),'%PDF-1.4 stub');fs.writeFileSync(path.join(dir,'b.pdf'),'%PDF-1.4 stub');
 const report=path.join(tmpdir(),'report.json');
 const env={...process.env,PREPROCESS_PYTHON:process.execPath,PREPROCESS_SCRIPT:stubPython(tmpdir())};
 const r=spawnSync(process.execPath,[wrapper,'--sources',dir,'--cache',tmpdir(),'--report',report],{encoding:'utf8',env});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/2 source\(s\), 4 pages/);
 assert.match(r.stdout,/arithmetic mismatches to review: 2/);
 const out=JSON.parse(fs.readFileSync(report,'utf8'));
 assert.equal(out.summary.counts.balanced,2);
 assert.equal(out.summary.counts['balanced-ambiguous'],2);
 assert.equal(out.mismatches.length,2);
});

// Minimal staged course fixture, same shape as course-import.test.js.
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'import-pre-'));
 writeJson(path.join(root,'src/content/courses.json'),{courses:[]});
 writeJson(path.join(root,'staged/demo/course.json'),{id:'demo',name:'Demo course',title:'Demo'});
 writeJson(path.join(root,'staged/demo/topics.json'),{topics:[{id:'T1',file:'topics/T1.json'}]});
 writeJson(path.join(root,'staged/demo/topics/T1.json'),{id:'T1',title:'Ionic',content:{
  theory:[{text:'Molar volume of NaCl is 13.6 cm3/mol.'}],worked:[],quiz:[]}});
 fs.mkdirSync(path.join(root,'sources/demo'),{recursive:true});
 fs.writeFileSync(path.join(root,'sources/demo','MMM_TA_1.pdf'),'fake pdf bytes');
 writeJson(path.join(root,'ingest/demo/sources.manifest.json'),{course:'demo',version:1,sources:[{file:'MMM_TA_1.pdf',sha256:sha(path.join(root,'sources/demo','MMM_TA_1.pdf'))}]});
 return root;
}
const ingest=(root,extraEnv,extraArgs=[])=>spawnSync(process.execPath,
 [importer,'ingest','demo','--root',root,'--staged',path.join(root,'staged/demo'),'--sources',path.join(root,'sources/demo'),...extraArgs],
 {encoding:'utf8',env:{...process.env,...extraEnv}});

test('ingest runs advisory preprocessing by default (and still ingests)',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const marker=path.join(tmpdir(),'marker.txt');
 const r=ingest(root,{PREPROCESS_PYTHON:process.execPath,PREPROCESS_SCRIPT:stubPython(tmpdir()),PREPROCESS_CACHE:tmpdir(),MARKER:marker});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/ingested demo: 1 topics/);
 assert.ok(fs.existsSync(marker),'preprocessing hook should have run');
 assert.equal(fs.readFileSync(marker,'utf8').trim(),'ran');
});

test('ingest --no-preprocess skips the advisory step',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const marker=path.join(tmpdir(),'marker.txt');
 const r=ingest(root,{PREPROCESS_PYTHON:process.execPath,PREPROCESS_SCRIPT:stubPython(tmpdir()),PREPROCESS_CACHE:tmpdir(),MARKER:marker},['--no-preprocess']);
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/ingested demo: 1 topics/);
 assert.ok(!fs.existsSync(marker),'preprocessing hook must not run with --no-preprocess');
});

test('ingest continues when the preprocessing tool is unavailable',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const r=ingest(root,{PREPROCESS_PYTHON:'/nonexistent/python',PREPROCESS_CACHE:tmpdir()});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/ingested demo: 1 topics/);
});
