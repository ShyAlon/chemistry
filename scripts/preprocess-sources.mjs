#!/usr/bin/env node
// Advisory source preprocessing for course preparation.
//
// Runs scripts/preprocess/preprocess.py over every source PDF and prints an
// aggregated review-lead summary (equation balance classes, arithmetic
// mismatches). This is a preparation AID only: it never writes into the repo,
// never blocks the import and never replaces human review or the release gate.
//
// Safety properties:
//   - the cache defaults to ~/.cache/spectra-preprocess (outside the repo) and
//     any cache or report path inside the repo is refused;
//   - sources are only read, never copied or committed;
//   - if python3/pymupdf is missing or a run fails, the step prints a note and
//     exits 0 (advisory), so preparation continues unchanged.
//
// Usage:
//   node scripts/preprocess-sources.mjs --sources DIR [--cache DIR] [--report FILE]
// Env overrides (mainly for tests):
//   PREPROCESS_PYTHON   python executable (default python3)
//   PREPROCESS_SCRIPT   path to preprocess.py
//   PREPROCESS_CACHE    default cache dir (still must be outside the repo)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const args=process.argv.slice(2);
const flag=n=>{const i=args.indexOf('--'+n);if(i<0)return undefined;const v=args[i+1];return v!==undefined&&!v.startsWith('--')?v:''};
const repoRoot=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const note=m=>console.log('preprocess: '+m);

const sourcesDir=flag('sources');
if(sourcesDir===undefined||sourcesDir===''){
 console.error('usage: node scripts/preprocess-sources.mjs --sources DIR [--cache DIR] [--report FILE]');
 process.exit(2);
}
for(const f of ['cache','report'])if(args.includes('--'+f)&&flag(f)===''){console.error('preprocess: --'+f+' needs a path value');process.exit(2)}
// Symlink-safe repo-containment check: resolve the real path of the target (or
// its nearest existing ancestor, since the target may not exist yet) and of the
// repo root, so a symlinked parent cannot smuggle the cache/report into the repo.
const realRepo=fs.realpathSync(repoRoot);
const realpathNearest=p=>{
 let cur=path.resolve(p);const tail=[];
 while(true){
  try{return path.join(fs.realpathSync(cur),...tail.reverse())}
  catch{const parent=path.dirname(cur);if(parent===cur)return cur;tail.push(path.basename(cur));cur=parent}
 }
};
const insideRepo=p=>{const r=path.relative(realRepo,realpathNearest(p));return r!==''&&!r.startsWith('..')&&!path.isAbsolute(r)};
const cacheDir=flag('cache')||process.env.PREPROCESS_CACHE||path.join(os.homedir(),'.cache','spectra-preprocess');
const reportPath=flag('report')||null;
if(insideRepo(cacheDir)){console.error('preprocess: refused - cache dir must be outside the repo: '+cacheDir);process.exit(2)}
if(reportPath&&insideRepo(reportPath)){console.error('preprocess: refused - report path must be outside the repo: '+reportPath);process.exit(2)}
// an existing final cache dir that is itself a symlink is refused outright
try{if(fs.lstatSync(path.resolve(cacheDir)).isSymbolicLink()){console.error('preprocess: refused - cache dir must not be a symlink: '+cacheDir);process.exit(2)}}catch{}

let pdfs;
try{pdfs=fs.readdirSync(sourcesDir).filter(f=>f.toLowerCase().endsWith('.pdf')).sort()}
catch{console.error('preprocess: cannot read sources dir: '+sourcesDir);process.exit(2)}
if(!pdfs.length){note('no PDFs in '+sourcesDir+'; nothing to preprocess');process.exit(0)}

const python=process.env.PREPROCESS_PYTHON||'python3';
const script=process.env.PREPROCESS_SCRIPT||path.join(repoRoot,'scripts','preprocess','preprocess.py');

const runs=[];
for(const f of pdfs){
 try{
  const out=execFileSync(python,[script,path.join(sourcesDir,f),'--cache',cacheDir],{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:64*1024*1024});
  runs.push(JSON.parse(out));
 }catch(e){
  note('advisory only: preprocessing unavailable for '+f+' ('+String(e.message||e).split('\n')[0]+'); preparation continues unchanged');
  process.exit(0);
 }
}

const classes=['balanced','balanced-ambiguous','unbalanced','unparsed','notation','fragment','not-equation'];
const counts=Object.fromEntries(classes.map(k=>[k,0]));
let pages=0,candidates=0,arithOk=0;
const mismatches=[];
for(const r of runs){
 pages+=r.pageCount;
 candidates+=r.check.candidates;
 for(const k of classes)counts[k]+=r.check.counts[k]||0;
 arithOk+=r.check.arith.ok;
 for(const m of r.check.arith.mismatch)mismatches.push({file:r.file,...m});
}
const summary={sources:runs.length,pages,candidates,counts,arith:{ok:arithOk,mismatchCount:mismatches.length}};
note('review leads over '+runs.length+' source(s), '+pages+' pages: '+JSON.stringify(summary.counts));
if(mismatches.length)note('arithmetic mismatches to review: '+mismatches.length);
note('leads only - no science sign-off; human review and the release gate are unchanged');
if(reportPath){
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});
 fs.writeFileSync(reportPath,JSON.stringify({generatedAt:new Date().toISOString(),summary,mismatches,runs},null,1)+'\n');
 note('full report written outside the repo: '+reportPath);
}
process.exit(0);
