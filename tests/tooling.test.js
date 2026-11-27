import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {stylesheetPaths,loadStyles} from '../scripts/lib/load-styles.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('shared fixture styles load every stylesheet the app imports, main.jsx order first',async()=>{
 const got=(await stylesheetPaths(root)).map(p=>path.relative(path.join(root,'src'),p));
 const onDisk=fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(f=>f.endsWith('.css'));
 for(const f of onDisk)assert.ok(got.includes(f),f+' exists in src but is not loaded by any import, or fixtures would miss it');
 assert.equal(got[0],'style.css');
 assert.ok(got.length>=onDisk.length);
 assert.ok((await loadStyles(root)).includes('.display-math'));
});
test('load-styles throws on css import forms it cannot resolve instead of skipping them',async()=>{
 const tmp=fs.mkdtempSync(path.join(process.env.TMPDIR||'/tmp','ls-'));
 fs.mkdirSync(path.join(tmp,'src/sub'),{recursive:true});
 fs.writeFileSync(path.join(tmp,'src/a.css'),'.a{}');
 fs.writeFileSync(path.join(tmp,'src/main.jsx'),"import './a.css';\nimport './sub/x.jsx';\n");
 fs.writeFileSync(path.join(tmp,'src/sub/x.jsx'),"import styles from '../a.css';\n");
 assert.equal((await stylesheetPaths(tmp)).length,1);
 fs.writeFileSync(path.join(tmp,'src/sub/b.css'),'.b{}');
 fs.writeFileSync(path.join(tmp,'src/sub/x.jsx'),"import './b.css';\n");
 assert.equal((await stylesheetPaths(tmp)).length,2,'nested directories are discovered');
 fs.writeFileSync(path.join(tmp,'src/sub/x.jsx'),"const m=await import('./b.css');\n");
 await assert.rejects(stylesheetPaths(tmp),/unrecognised css import form/);
 fs.writeFileSync(path.join(tmp,'src/sub/x.jsx'),"import './b.css?inline';\n");
 await assert.rejects(stylesheetPaths(tmp),/unrecognised css import form|missing stylesheet/);
 fs.writeFileSync(path.join(tmp,'src/sub/x.jsx'),"import './b.css';\n");
 fs.writeFileSync(path.join(tmp,'src/sub/b.css'),"@import './a.css';");
 await assert.rejects(stylesheetPaths(tmp),/@import/);
});
test('browser fixtures that inline CSS use the shared loader, not a hand-listed stylesheet',()=>{
 for(const f of fs.readdirSync(path.join(root,'scripts')).filter(f=>/^test-.*\.mjs$/.test(f))){
  const text=fs.readFileSync(path.join(root,'scripts',f),'utf8');
  assert.ok(!/readFile\(path\.join\(root,'src\/[\w-]+\.css'\)/.test(text),f+' inlines a stylesheet by name; use scripts/lib/load-styles.mjs');
 }
});
test('gate covers every suite the production build script runs, and never refreshes the snapshot',()=>{
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const list=execFileSync('node',['scripts/gate.mjs','--list'],{cwd:root,encoding:'utf8'});
 for(const m of pkg.scripts.build.matchAll(/npm run (test:[\w-]+|release:coverage|build:test)/g))assert.ok(list.includes('npm run '+m[1]),'gate is missing '+m[1]);
 const src=fs.readFileSync(path.join(root,'scripts/gate.mjs'),'utf8');
 assert.ok(!/['"`]refresh-snapshot['"`]/.test(src.replace(/`python3 scripts\/release-output\.py refresh-snapshot`/g,'')),'gate must not run refresh-snapshot');
});
test('record-review reproduces every recorded review exactly and refuses what it cannot vouch for',()=>{
 const run=(...a)=>spawnSync('node',['scripts/record-review.mjs',...a],{cwd:root,encoding:'utf8'});
 let n=0;const skipped=[];
 for(const course of fs.readdirSync(path.join(root,'ingest'))){
  const dir=path.join(root,'ingest',course,'coverage');if(!fs.existsSync(dir))continue;
  for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){
   const cov=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));const rv=cov.semanticReview;
   if(rv?.status!=='done')continue;
   const r=run('--course',course,'--topic',f.replace(/\.json$/,''),'--reviewer',rv.reviewer,'--admin-pages',rv.adminPagesAttested.length?rv.adminPagesAttested.join(','):'none');
   if(/formatting is not reproducible/.test(r.stderr)){skipped.push(course+'/'+f);continue} // legacy layout: the tool refuses to rewrite it
   assert.equal(r.status,0,course+'/'+f+': '+r.stderr);
   assert.match(r.stdout,/replaced\n(?:\+ |- )?/,r.stdout);
   const minus=r.stdout.split('\n').filter(l=>l.startsWith('- ')),plus=r.stdout.split('\n').filter(l=>l.startsWith('+ '));
   assert.deepEqual(plus,minus,course+'/'+f+': recomputed review differs from the recorded one');
   n++;
  }
 }
 assert.ok(n>=10,'expected the recorded reviews to be reproduced, got '+n+' (skipped for layout: '+skipped+')');
 assert.ok(!skipped.some(k=>k.startsWith('84101/')),'84101 maps must stay tool-reproducible: '+skipped);
 const first=fs.readdirSync(path.join(root,'ingest/84101/coverage')).find(f=>/^G13/.test(f));
 assert.notEqual(run('--course','84101','--topic','G13','--reviewer','chat-01M8B9ZAAD3HVWPYYYXSQY9MR5').status,0,'admin pages are mandatory');
 assert.notEqual(run('--course','84101','--topic','G13','--reviewer','chat-01M8B9ZAAD3HVWPYYYXSQY9MR5','--admin-pages','none').status,0,'wrong admin pages are refused');
 assert.notEqual(run('--course','84101','--topic','G13','--reviewer','chat-01M89RY0MBEE8YJNW0XSDTVYDY','--admin-pages','1').status,0,'an author cannot review');
 assert.notEqual(run('--course','84101','--topic','G13','--reviewer','TODO','--admin-pages','1').status,0,'placeholder reviewer refused');
});
