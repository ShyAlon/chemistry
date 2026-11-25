// Source-safe course importer. Ingests reviewed, authored topic JSON staged
// outside src/content; never parses source PDFs and never generates content.
// Commands:
//   baseline <course>                     Record the current content of an existing course as the ledger baseline (no content writes).
//   check <course> --staged DIR           Validate staged content, manifest and corrections; dry-run the re-import diff for known courses.
//   ingest <course> --staged DIR --sources DIR   Import a NEW course: verify sources, apply corrections, write content + ledger.
//   diff <course> --staged DIR [--report FILE]   Classify a re-import without writing: unchanged / source-changed / conflict / added / removed.
//   accept <course> --staged DIR --report FILE   Apply the reviewer's decisions from an edited diff report.
// Flags: --root DIR (repo root, default: this repo), --force (baseline rebuild), --no-preprocess (skip the advisory source preprocessing step).
//
// Whenever a --sources DIR is verified (check and ingest), an advisory preprocessing
// step runs by default (scripts/preprocess-sources.mjs): it extracts and checks the
// source PDFs into a PRIVATE cache outside the repo and prints review leads. It never
// writes into the repo, never blocks the command and is no replacement for review.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readDocuments,contentRoot as defaultContentRoot} from './content-store.mjs';
import {assembleCatalogue} from '../src/catalogue-contract.js';
import {ARRAYS,readStaged,applyCorrections,verifySources,baselineLedger,ingestLedger,buildWriteSet,classifyReimport,hash,loadJson} from './import-lib.mjs';

const args=process.argv.slice(2);
const command=args[0],course=args[1];
const flag=name=>{const i=args.indexOf('--'+name);return i<0?undefined:args[i+1]};
const has=name=>args.includes('--'+name);
const repoRoot=flag('root')?path.resolve(flag('root')):fileURLToPath(new URL('..',import.meta.url));
const contentRootDir=path.join(repoRoot,'src','content');
const ingestDir=path.join(repoRoot,'ingest',course||'');
const ledgerPath=path.join(ingestDir,'ledger.json');
const fail=m=>{console.error('import: '+m);process.exit(1)};
// Advisory preprocessing of the source PDFs, on by default for check/ingest.
// Private cache outside the repo; any problem is a printed note, never a failure.
// The wrapper resolves next to this script (not --root, which may be a scratch root).
// Bounded: the wrapper bounds each PDF (300s, SIGKILL) and its total budget (900s);
// this outer bound covers a hung wrapper itself. Generous but finite.
const PREPROCESS_OUTER_MS=parseInt(process.env.IMPORT_PREPROCESS_TIMEOUT_MS||'1260000',10);
function advisoryPreprocess(srcDir){
 if(!srcDir||has('no-preprocess'))return;
 try{
  const wrapper=fileURLToPath(new URL('preprocess-sources.mjs',import.meta.url));
  const r=spawnSync(process.execPath,[wrapper,'--sources',path.resolve(srcDir)],{stdio:'inherit',timeout:PREPROCESS_OUTER_MS,killSignal:'SIGKILL'});
  if(r.error&&/ETIMEDOUT/.test(String(r.error.message||r.error)))console.log('import: advisory preprocessing timed out and was stopped; continuing');
  else if(r.error)console.log('import: advisory preprocessing unavailable ('+String(r.error.message||r.error).split('\n')[0]+'); continuing');
  else if(r.status!==0&&r.status!==null)console.log('import: advisory preprocessing skipped (exit '+r.status+'); continuing');
 }catch(e){console.log('import: advisory preprocessing unavailable ('+String(e.message||e).split('\n')[0]+'); continuing')}
}
if(!command||!course)fail('usage: node scripts/import-course.mjs <baseline|check|ingest|diff|accept> <course> [flags]');
const writeJson=(abs,value)=>{fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,JSON.stringify(value,null,1)+'\n')};
const readLedger=()=>fs.existsSync(ledgerPath)?loadJson(ledgerPath):null;
const loadCorrections=()=>{const p=path.join(ingestDir,'corrections.json');return fs.existsSync(p)?loadJson(p).corrections||[]:[]};
const loadManifest=()=>{const p=path.join(ingestDir,'sources.manifest.json');if(!fs.existsSync(p))fail('missing '+path.relative(repoRoot,p));return loadJson(p)};
const currentDocs=()=>readDocuments(contentRootDir);
const currentCourse=()=>{const cat=assembleCatalogue(currentDocs());return cat.courses.find(c=>c.id===course)||null};

function prepareStaged(){
 const stagedDir=flag('staged');if(!stagedDir)fail('--staged DIR is required');
 const staged=readStaged(stagedDir);
 if(staged.course.id!==course)fail('staged course id '+staged.course.id+' does not match '+course);
 const correctedFiles=structuredClone(staged.files);
 const applied=applyCorrections(correctedFiles,loadCorrections());
 return {...staged,correctedFiles,applied};
}
function writeCourseDocuments(staged,mode){
 const docs=currentDocs();
 const next={...docs};
 const existing=docs[course+'/topics.json']!==undefined;
 if(existing&&mode==='new')fail('course '+course+' already has content; use diff/accept for re-import');
 if(mode==='new'){
  const meta={...staged.course};delete meta.topics;delete meta.topicCatalogue;
  next['courses.json']={courses:[...assembleCatalogue(docs).courses.map(c=>{const m={...c};delete m.topics;m.topicCatalogue=c.id+'/topics.json';return m}),{...meta,topicCatalogue:course+'/topics.json'}]};
  next[course+'/topics.json']=staged.topics;
  for(const ref of staged.topics.topics)next[course+'/topics/'+ref.id+'.json']=staged.correctedFiles[ref.id];
 }
 assembleCatalogue(next); // validate the whole set before any write
 const changed=buildWriteSet(docs,next,course);
 for(const name of changed){
  const abs=path.join(contentRootDir,name);
  if(next[name]===undefined)fs.rmSync(abs);else writeJson(abs,next[name]);
 }
 return changed;
}

if(command==='baseline'){
 const current=currentCourse();if(!current)fail('no such course in content: '+course);
 if(readLedger()&&!has('force'))fail('ledger already exists for '+course+'; use --force to rebuild the baseline');
 const topicFiles=Object.fromEntries(current.topics.map(t=>[t.id,t]));
 writeJson(ledgerPath,baselineLedger(course,topicFiles,new Date().toISOString()));
 console.log('baseline ledger recorded for '+course+': '+current.topics.length+' topics, 0 content writes');

}else if(command==='check'){
 const staged=prepareStaged();
 console.log('staged content valid: '+staged.topics.topics.length+' topics; corrections applied: '+(staged.applied.join(', ')||'none'));
 if(fs.existsSync(path.join(ingestDir,'sources.manifest.json'))){
  const srcDir=flag('sources');
  if(srcDir){verifySources(loadManifest(),srcDir);console.log('source manifest verified against '+srcDir);advisoryPreprocess(srcDir)}
  else console.log('source manifest present (pass --sources DIR to verify hashes)');
 }
 const current=currentCourse();
 if(current){
  const ledger=readLedger();
  if(!ledger)console.log('course exists without a ledger; run baseline before re-import diffs');
  else{const report=classifyReimport(ledger,current,staged);console.log('dry-run diff: '+JSON.stringify(report.summary))}
 }else console.log('new course; ingest will create it');

}else if(command==='ingest'){
 const staged=prepareStaged();
 const sourcesDir=flag('sources');if(!sourcesDir)fail('--sources DIR is required for ingest');
 const manifest=loadManifest();
 verifySources(manifest,sourcesDir);
 advisoryPreprocess(sourcesDir);
 const changed=writeCourseDocuments(staged,'new');
 writeJson(ledgerPath,ingestLedger(course,manifest,staged.files,staged.correctedFiles,staged.applied,new Date().toISOString()));
 console.log('ingested '+course+': '+staged.topics.topics.length+' topics, '+changed.length+' content files written, corrections applied: '+(staged.applied.join(', ')||'none'));

}else if(command==='diff'){
 const ledger=readLedger();if(!ledger)fail('no ledger for '+course+'; run baseline (existing course) or ingest (new course) first');
 const current=currentCourse();if(!current)fail('no such course in content: '+course);
 const staged=prepareStaged();
 const report={...classifyReimport(ledger,current,staged),generatedAt:new Date().toISOString(),
  instructions:"Set decision:'accept'|'skip' on entries to apply. Conflict entries also need resolution:'take-staged'|'keep-current'. Anything not accepted stays byte-identical."};
 const out=flag('report');if(out)writeJson(out,report);
 console.log('re-import diff for '+course+': '+JSON.stringify(report.summary)+(out?' (report: '+out+')':''));
 for(const e of report.entries)console.log('  #'+e.n+' '+e.status+' '+e.topic+'/'+e.array+(e.index===null?'':'['+e.index+']')+' - '+e.detail);

}else if(command==='accept'){
 const ledger=readLedger();if(!ledger)fail('no ledger for '+course);
 const reportPath=flag('report');if(!reportPath)fail('--report FILE is required');
 const current=currentCourse();if(!current)fail('no such course in content: '+course);
 const staged=prepareStaged();
 const live=classifyReimport(ledger,current,staged);
 const decisions=loadJson(reportPath).entries||[];
 const key=e=>[e.topic,e.array,e.index,e.status].join('|');
 const decisionMap=new Map(decisions.filter(d=>d.decision).map(d=>[key(d),d]));
 const topics=Object.fromEntries(current.topics.map(t=>[t.id,structuredClone(t)]));
 const topicRefs=current.topics.map(t=>({id:t.id,file:'topics/'+t.id+'.json'}));
 let applied=0,skipped=0;
 const arraysToFix=new Set();
 for(const e of live.entries){
  const d=decisionMap.get(key(e));
  if(!d){skipped++;continue}
  if(e.status==='conflict'&&!['take-staged','keep-current'].includes(d.resolution))fail('conflict entry #'+e.n+' ('+key(e)+') needs resolution take-staged|keep-current');
  if(e.status==='conflict'&&d.resolution==='keep-current'){skipped++;continue}
  if(e.status==='topic-added'){topics[e.topic]=structuredClone(staged.correctedFiles[e.topic]);topicRefs.push({id:e.topic,file:'topics/'+e.topic+'.json'});applied++;continue}
  if(e.status==='topic-removed'){delete topics[e.topic];const i=topicRefs.findIndex(r=>r.id===e.topic);if(i>=0)topicRefs.splice(i,1);applied++;continue}
  arraysToFix.add(e.topic+'/'+e.array);
 }
 // Apply block-level entries per array in descending index order so indices stay valid.
 const perArray={};
 for(const e of live.entries){
  const d=decisionMap.get(key(e));if(!d)continue;
  if(e.status==='conflict'&&d.resolution==='keep-current')continue;
  if(!['added','removed','source-changed','conflict'].includes(e.status))continue;
  (perArray[e.topic+'/'+e.array]=perArray[e.topic+'/'+e.array]||[]).push(e);
 }
 for(const [k,list] of Object.entries(perArray)){
  const [tid,a]=k.split('/');const arr=topics[tid].content[a];
  for(const e of list.sort((x,y)=>y.index-x.index)){
   if(e.status==='added')arr.splice(e.index,0,structuredClone(staged.correctedFiles[tid].content[a][e.index]));
   else if(e.status==='removed')arr.splice(e.index,1);
   else arr[e.index]=structuredClone(staged.correctedFiles[tid].content[a][e.index]);
   applied++;
  }
 }
 const nextTopicDocs={};
 const refs=topicRefs.filter(r=>topics[r.id]);
 const docs=currentDocs();
 const next={...docs,[course+'/topics.json']:{topics:refs}};
 for(const r of refs)next[course+'/topics/'+r.id+'.json']=topics[r.id];
 assembleCatalogue(next);
 const changed=buildWriteSet(docs,next,course);
 for(const name of changed){const abs=path.join(contentRootDir,name);if(next[name]===undefined)fs.rmSync(abs);else writeJson(abs,next[name])}
 // Rebuild the ledger from the reconciled state of record.
 const reconciled={};for(const r of refs)reconciled[r.id]=topics[r.id];
 const fresh=baselineLedger(course,reconciled,new Date().toISOString());
 fresh.kind=ledger.kind==='baseline'?'baseline':'ingested';
 if(ledger.manifestVersion)fresh.manifestVersion=ledger.manifestVersion;
 if(ledger.sources)fresh.sources=ledger.sources;
 fresh.note='Post-reconciliation state of record.';
 writeJson(ledgerPath,fresh);
 console.log('accept complete: '+applied+' entries applied, '+skipped+' left unchanged, '+changed.length+' content files written');

}else fail('unknown command: '+command);
