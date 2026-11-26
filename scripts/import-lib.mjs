// Source-safe course import: shared pure machinery.
// The importer ingests reviewed, authored topic JSON (same shape as the split
// course content) staged outside src/content. It never parses source PDFs and
// never generates teaching content. See ingest/README.md for the runbook.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {assembleCatalogue} from '../src/catalogue-contract.js';

export const ARRAYS=['theory','worked','quiz'];
// Hard blocklist, independent of any manifest revision: the excluded book can
// never be admitted as a course source (owner decision, 2026-11-23).
export const BLOCKED_SOURCE=/cartoon[\s_-]*guide/i;

export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export const hash=value=>crypto.createHash('sha256').update(canonical(value)).digest('hex');
export const fileHash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const loadJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));

// ---- staged authored content ----
export function readStaged(dir){
 const course=loadJson(path.join(dir,'course.json'));
 if(!course||typeof course.id!=='string')throw new Error('staged course.json needs a course id');
 const topics=loadJson(path.join(dir,'topics.json'));
 if(!topics||!Array.isArray(topics.topics))throw new Error('staged topics.json needs a topics array');
 const files={};
 for(const ref of topics.topics){
  if(ref.file!=='topics/'+ref.id+'.json')throw new Error('staged topic ref must be topics/<id>.json: '+ref.id);
  const topic=loadJson(path.join(dir,'topics',ref.id+'.json'));
  if(topic.id!==ref.id)throw new Error('staged topic id mismatch: '+ref.id);
  files[ref.id]=topic;
 }
 return {course,topics,files};
}

// ---- corrections as replayable data ----
export function applyCorrections(topicFiles,corrections){
 const applied=[];
 for(const c of corrections||[]){
  const topic=topicFiles[c.topic];
  if(!topic)throw new Error('correction '+c.id+': unknown topic '+c.topic);
  const arr=topic.content&&topic.content[c.array];
  if(!Array.isArray(arr))throw new Error('correction '+c.id+': no such content array '+c.array+' in '+c.topic);
  const hits=arr.filter(b=>b&&typeof b[c.field]==='string'&&b[c.field].includes(c.find));
  if(hits.length!==1)throw new Error('correction '+c.id+': expected exactly 1 target block in '+c.topic+'/'+c.array+', found '+hits.length+' - the base content changed, review this correction');
  hits[0][c.field]=hits[0][c.field].split(c.find).join(c.replace);
  applied.push(c.id);
 }
 return applied;
}

// ---- source manifest verification (hashes only; originals stay private) ----
export function verifySources(manifest,sourcesDir){
 if(!manifest||!Array.isArray(manifest.sources)||typeof manifest.version!=='number')
  throw new Error('invalid source manifest (need version and sources[])');
 for(const entry of manifest.sources){
  if(BLOCKED_SOURCE.test(entry.file))throw new Error('blocked source file in manifest: '+entry.file);
  const p=path.join(sourcesDir,entry.file);
  if(!fs.existsSync(p))throw new Error('manifest source missing from source directory: '+entry.file);
  if(fileHash(p)!==entry.sha256)throw new Error('source hash mismatch: '+entry.file+' - refresh the manifest in a reviewed revision');
 }
 for(const f of fs.readdirSync(sourcesDir)){
  if(BLOCKED_SOURCE.test(f))throw new Error('blocked source file present: '+f);
  if(!manifest.sources.some(s=>s.file===f))throw new Error('unlisted file in source directory: '+f+' - admit it only through a reviewed manifest revision');
 }
}

// ---- block hashing and the ingest ledger ----
export function hashTopicBlocks(topicFiles){
 const out={};
 for(const [id,topic] of Object.entries(topicFiles)){
  const arrays={};
  for(const a of ARRAYS)arrays[a]=(topic.content[a]||[]).map(b=>hash(b));
  out[id]=arrays;
 }
 return out;
}
// Ledger format version 2: per-block records are looked up by hash, not by
// array position, so a mid-array insert no longer invalidates later records.
export const LEDGER_VERSION=2;
export function baselineLedger(course,topicFiles,recordedAt){
 const blocks={};
 for(const [id,arrays] of Object.entries(hashTopicBlocks(topicFiles)))
  blocks[id]=Object.fromEntries(Object.entries(arrays).map(([a,hs])=>[a,hs.map(h=>({base:h,final:h}))]));
 return {course,kind:'baseline',ledgerVersion:LEDGER_VERSION,recordedAt,note:'Pre-importer content of record; base hashes equal final hashes.',blocks};
}
export function ingestLedger(course,manifest,stagedFiles,correctedFiles,applied,recordedAt){
 const base=hashTopicBlocks(stagedFiles),fin=hashTopicBlocks(correctedFiles);
 const blocks={};
 for(const id of Object.keys(stagedFiles))
  blocks[id]=Object.fromEntries(ARRAYS.map(a=>[a,base[id][a].map((b,i)=>({base:b,final:fin[id][a][i]}))]));
 return {course,kind:'ingested',ledgerVersion:LEDGER_VERSION,recordedAt,manifestVersion:manifest.version,
  sources:manifest.sources.map(s=>({file:s.file,sha256:s.sha256})),correctionsApplied:applied,blocks};
}

// ---- write-set assembly: only the target course's files may change ----
export function buildWriteSet(currentDocs,nextDocs,course){
 const allowed=new Set(['courses.json',course+'/topics.json']);
 const prefix=course+'/topics/';
 const writes=[];
 for(const name of Object.keys(nextDocs)){
  const isCourseTopic=name.startsWith(prefix)&&name.endsWith('.json');
  const before=currentDocs[name]===undefined?undefined:JSON.stringify(currentDocs[name]);
  const after=JSON.stringify(nextDocs[name]);
  if(before===after)continue;
  if(!allowed.has(name)&&!isCourseTopic)throw new Error('write-set violation: '+name+' is outside course '+course);
  writes.push(name);
 }
 for(const name of Object.keys(currentDocs)){
  if(nextDocs[name]!==undefined)continue;
  if(!(name.startsWith(prefix)&&name.endsWith('.json')))throw new Error('write-set violation: removing '+name+' is outside course '+course);
  writes.push(name);
 }
 return writes.sort();
}

// ---- stable-key block alignment ----
// theory and quiz blocks key on `id`; worked blocks key on `title`, falling
// back to the block's content hash when a worked block has no title. Keyed
// alignment replaces positional matching, so inserting a block mid-array no
// longer cascades false changes onto every later block, and accept writes
// each staged block to the position of the block with the same key (staged
// order is authoritative) instead of a stale numeric index.
// Arrays with no ids at all on either side keep the legacy positional
// behaviour. Mixed arrays (some blocks keyed, some not, on either side) or
// duplicate keys abort the run before anything is written.
export function blockKey(array,block){
 if(!block||typeof block!=='object')return undefined;
 if(array==='worked'){
  if(typeof block.title==='string'&&block.title)return 't:'+block.title;
  return 'h:'+hash(block);
 }
 const id=block.id;
 if(typeof id==='string'&&id)return 'i:'+id;
 if(typeof id==='number')return 'i:'+String(id);
 return undefined;
}
// 'keyed' when every block on both sides has a stable key, 'positional' when
// none do; throws (fail closed, no writes) on a mixed array.
export function arrayMode(array,curArr,stArr,where){
 const blocks=[...(curArr||[]),...(stArr||[])];
 let any=false,all=true;
 for(const b of blocks){
  const k=array==='worked'?(blockKey(array,b)):blockKey(array,b);
  if(k===undefined)all=false;else any=true;
 }
 if(any&&!all)throw new Error('mixed stable keys in '+(where||'content')+'/'+array+': some blocks carry an id and some do not - give every block a stable key (or none) before re-importing; nothing was written');
 return any?'keyed':'positional';
}
function dupCheck(array,arr,side,where){
 const seen=new Set();
 for(const b of arr){
  const k=blockKey(array,b);
  if(seen.has(k))throw new Error('duplicate stable key '+k+' in '+side+' '+where+'/'+array+' - aborting, nothing was written');
  seen.add(k);
 }
}

// ---- re-import diff classification ----
export function classifyReimport(ledger,currentCourse,staged){
 const stagedCorrected=staged.correctedFiles;
 const entries=[];let n=0;
 const push=(topic,array,index,status,detail,key)=>{
  const e={n:++n,topic,array,index,status,detail};
  if(key!==undefined)e.key=key;
  entries.push(e);
 };
 const currentFiles=Object.fromEntries((currentCourse?currentCourse.topics:[]).map(t=>[t.id,t]));
 const ledgerBlocks=(ledger&&ledger.blocks)||{};
 const ids=[...staged.topics.topics.map(r=>r.id),...Object.keys(currentFiles).filter(id=>!staged.files[id])];
 for(const id of ids){
  const cur=currentFiles[id],st=stagedCorrected[id];
  if(st&&!cur){push(id,'*',null,'topic-added','new topic '+id);continue}
  if(cur&&!st){push(id,'*',null,'topic-removed','staged content drops topic '+id);continue}
  const lb=(ledgerBlocks[id])||{};
  for(const a of ARRAYS){
   const curArr=cur.content[a]||[],stArr=st.content[a]||[],lArr=lb[a]||[];
   const mode=arrayMode(a,curArr,stArr,id);
   if(mode==='keyed'){
    // Stable-key alignment: match blocks by id/title, not by position.
    dupCheck(a,curArr,'current',id);dupCheck(a,stArr,'staged',id);
    const curByKey=new Map(curArr.map((b,i)=>[blockKey(a,b),{b,i}]));
    const stKeys=new Set(stArr.map(b=>blockKey(a,b)));
    const ledgerFinals=new Set(lArr.map(le=>le&&le.final));
    for(let j=0;j<stArr.length;j++){
     const s=stArr[j],k=blockKey(a,s),found=curByKey.get(k);
     if(!found){push(id,a,j,'added','new block',k);continue}
     const ch=hash(found.b),sh=hash(s);
     if(ch===sh)continue;
     if(ledgerFinals.has(ch)){push(id,a,j,'source-changed','staged update over an untouched block',k);continue}
     push(id,a,j,'conflict','current content differs from the last ledger record - a local edit collides with the staged change',k);
    }
    for(let i=0;i<curArr.length;i++){
     const c=curArr[i],k=blockKey(a,c);
     if(stKeys.has(k))continue;
     if(ledgerFinals.has(hash(c)))push(id,a,i,'removed','staged content drops this block',k);
     else push(id,a,i,'conflict','present only in current content, no ledger baseline - local addition?',k);
    }
    // Order is a separate, explicit decision: whenever the shared blocks sit
    // in a different order in staged content, emit a reordered entry (also
    // alongside added/removed/changed entries), so accept never changes the
    // order of existing blocks unless that entry is accepted too.
    const curMatchedOrder=curArr.map(b=>blockKey(a,b)).filter(k=>stKeys.has(k));
    const stMatchedOrder=stArr.map(b=>blockKey(a,b)).filter(k=>curByKey.has(k));
    if(curMatchedOrder.join('')!==stMatchedOrder.join(''))
     push(id,a,null,'reordered','shared blocks sit in a new order in the staged content - accept applies the staged order, skip keeps the current order');
    continue;
   }
   // Legacy positional alignment (no stable keys on either side).
   const len=Math.max(curArr.length,stArr.length);
   for(let i=0;i<len;i++){
    const c=curArr[i],s=stArr[i],le=lArr[i];
    if(s!==undefined&&c===undefined){push(id,a,i,'added','new block');continue}
    if(c!==undefined&&s===undefined){
     push(id,a,i,le?'removed':'conflict',le?'staged content drops this block':'present only in current content, no ledger baseline - local addition?');
     continue;
    }
    const ch=hash(c),sh=hash(s);
    if(ch===sh)continue;
    if(le&&le.final===ch){push(id,a,i,'source-changed','staged update over an untouched block');continue}
    push(id,a,i,'conflict',le?'current content differs from the last ledger record - a local edit collides with the staged change':'no ledger baseline for this block');
   }
  }
 }
 return {course:ledger?ledger.course:staged.course.id,entries,
  summary:{unchangedIgnored:true,added:entries.filter(e=>e.status==='added'||e.status==='topic-added').length,
   sourceChanged:entries.filter(e=>e.status==='source-changed').length,
   conflicts:entries.filter(e=>e.status==='conflict').length,
   removed:entries.filter(e=>e.status==='removed'||e.status==='topic-removed').length,
   reordered:entries.filter(e=>e.status==='reordered').length}};
}

// ---- catalogue validation helper ----
export function validateDocuments(docs){return assembleCatalogue(docs)}
