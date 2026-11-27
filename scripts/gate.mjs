#!/usr/bin/env node
// One local gate for an exact commit: the same checks CI runs (npm test, rules, release-output tests, release coverage,
// production build, served-catalogue, the browser/offline/figure suites) plus the snapshot check, one table at the end.
// Parity with CI is by step list, not by environment: CI also runs `npm ci` and `npm run setup:rules` first, and the
// gate assumes dependencies are already installed. Like CI it records src/content byte hashes before the steps and
// checks them after (content-freeze), so a step that mutates content fails the gate.
//   node scripts/gate.mjs              full gate
//   node scripts/gate.mjs --fast       unit tests, rules, coverage, release-output tests only (no builds or browsers)
//   node scripts/gate.mjs --list       print the steps
//   node scripts/gate.mjs --only npm-test,snapshot
// It does NOT refresh the snapshot. A stale snapshot fails with the command to run, because refreshing it automatically
// would make the check pass by rewriting its own evidence. It does not change CI: CI keeps its own workflow and cost.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const logDir=process.env.GATE_LOG_DIR||'/tmp/gate-logs';
const sh=(cmd,env={})=>({cmd,env});
const steps=[
 {id:'npm-test',fast:true,...sh('npm test')},
 {id:'rules',fast:true,...sh('npm run test:rules')},
 {id:'release-output-tests',fast:true,...sh('python3 scripts/test-release-output.py')},
 {id:'coverage-release',fast:true,...sh('npm run release:coverage')},
 {id:'vite-build',...sh('rm -rf dist && npx vite build')},
 {id:'served-dist',...sh('npm run test:served',{DIST_DIR:'dist'})},
 {id:'snapshot',...sh('python3 scripts/release-output.py check-snapshot'),hint:'stale snapshot: run `python3 scripts/release-output.py refresh-snapshot`, review and commit the two recovery files, then re-run the gate on that exact commit'},
 {id:'build-test',...sh('rm -rf dist-test && npm run build:test')},
 {id:'browser',...sh('npm run test:browser',{DIST_DIR:'dist-test'})},
 {id:'pwa',...sh('npm run test:pwa',{DIST_DIR:'dist-test'})},
 {id:'practice',...sh('npm run test:practice',{DIST_DIR:'dist-test'})},
 {id:'mock-exam',...sh('npm run test:mock-exam',{DIST_DIR:'dist-test'})},
 {id:'papers',...sh('npm run test:papers',{DIST_DIR:'dist-test'})},
 {id:'final-prep',...sh('npm run test:final-prep',{DIST_DIR:'dist-test'})},
 {id:'figures',...sh('npm run test:figures')},
 {id:'served-dist-test',...sh('npm run test:served',{DIST_DIR:'dist-test'})},
];
const arg=n=>{const i=process.argv.indexOf('--'+n);return i<0?null:process.argv[i+1]};
if(process.argv.includes('--list')){for(const s of steps)console.log((s.fast?'fast  ':'full  ')+s.id.padEnd(22)+s.cmd);process.exit(0)}
let run=process.argv.includes('--fast')?steps.filter(s=>s.fast):steps;
if(arg('only')){const ids=arg('only').split(',');const bad=ids.filter(i=>!steps.some(s=>s.id===i));if(bad.length){console.error('unknown step '+bad);process.exit(2)}run=steps.filter(s=>ids.includes(s.id))}
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const dirty=git('status','--porcelain','--untracked-files=no').split('\n').filter(Boolean);
console.log('commit '+git('rev-parse','HEAD')+'\ntree   '+git('rev-parse','HEAD^{tree}')+(dirty.length?'\nWARNING: '+dirty.length+' tracked file(s) differ from HEAD; this is not an exact-commit result':''));
fs.mkdirSync(logDir,{recursive:true});
const freezeFile=path.join(logDir,'content-freeze.json');
const freeze=(mode)=>spawnSync('node',['scripts/content-freeze.mjs','--'+mode,freezeFile],{cwd:root,encoding:'utf8'});
const rec=freeze('record');if(rec.status!==0){console.error(rec.stdout+rec.stderr);process.exit(1)}
const results=[];
for(const s of run){
 const t0=Date.now();const log=path.join(logDir,s.id+'.log');
 const r=spawnSync('bash',['-c',s.cmd],{cwd:root,env:{...process.env,...s.env},encoding:'utf8',maxBuffer:1<<28});
 fs.writeFileSync(log,(r.stdout||'')+(r.stderr||''));
 const sec=Math.round((Date.now()-t0)/1000);
 results.push({id:s.id,code:r.status,sec,log,hint:s.hint});
 console.log((r.status===0?'ok   ':'FAIL ')+s.id.padEnd(22)+String(sec).padStart(4)+'s');
}
const chk=freeze('check');fs.writeFileSync(path.join(logDir,'content-freeze.log'),(chk.stdout||'')+(chk.stderr||''));
results.push({id:'content-freeze',code:chk.status,sec:0,log:path.join(logDir,'content-freeze.log')});
console.log((chk.status===0?'ok   ':'FAIL ')+'content-freeze'.padEnd(22)+'   0s');
const bad=results.filter(r=>r.code!==0);
console.log('\n'+(bad.length?bad.length+' step(s) failed':'all '+results.length+' step(s) passed')+(run.length<steps.length?' (partial run: '+run.length+' of '+steps.length+' steps)':''));
for(const r of bad){console.log('  '+r.id+' -> '+r.log+(r.hint?'\n    '+r.hint:''))}
process.exit(bad.length?1:0);
