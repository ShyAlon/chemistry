// Source coverage check. Verifies STRUCTURE and TRACEABILITY only: every source page
// has a verdict, every "covered" page points at real lesson blocks, and no source text
// is stored. It cannot prove the lesson is semantically complete; that needs the
// independent review recorded in semanticReview.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import catalogue from '#catalogue';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TOP_KEYS=new Set(['schema','course','topic','source','authoredBy','semanticReview','pages']);
const REVIEW_KEYS=new Set(['status','reviewer','sourceSha256','contentSha256','unitMapSha256','figuresSha256','adminPagesAttested']);
const ADMIN_KINDS=new Set(['title','outline','divider','marker']);
const PH_WORDS=['pending','tbd','todo','dummy','placeholder','fake','sample','example','none','unknown','test','needed'];
// Placeholder check is per token and by prefix, so a random legitimate id that merely contains these letters passes.
const isPlaceholder=v=>String(v).split(/[^A-Za-z0-9]+/).filter(Boolean).some(tok=>PH_WORDS.some(w=>tok.toLowerCase().startsWith(w)));
export const normId=v=>String(v??'').trim().toLowerCase().replace(/^(chat|agent)-/,'');// chat-<ULID> and agent-<ULID> of the same actor compare equal
// Format screen only. An approval ref is evidence that must be verified externally against the owner's message; the regex cannot prove it.
export const genuineApproval=a=>typeof a==='string'&&/^(whatsapp|imessage|email):[A-Za-z0-9._=@-]{12,}$/.test(a)&&!isPlaceholder(a.split(':')[1]);
export const genuineReviewer=r=>typeof r==='string'&&/^[A-Za-z0-9._-]{3,64}$/.test(r)&&!isPlaceholder(r);
const PAGE_KEYS=new Set(['page','imageSha256','units']);
const UNIT_KEYS=new Set(['id','kind','disposition','label','targets','rationale','approval']);
const KINDS=new Set(['concept','equation','table','figure','exercise','claim','title','outline','divider','marker']);
const DISPOSITIONS=new Set(['covered','adapted','corrected','excluded','admin']);
const sha=v=>createHash('sha256').update(v).digest('hex');
// Hash of the exact lesson content a review applies to.
export const contentHash=topic=>sha(JSON.stringify(topic));
// Hash of the unit map itself (source + pages), so a review cannot survive edits to the map.
// Hash of the figure implementation file the lesson's figure blocks render through.
export const figuresHash=(files=['figures-nuclear.jsx','figures.jsx'].map(f=>path.join(root,'src',f)))=>sha(files.map(f=>fs.readFileSync(f,'utf8')).join('\n--file--\n'));
// Per-course figure binding (policy.figureBinding[courseId]={roots:[...]}). The hash covers the import closure
// of the roots under src/, so an imported renderer file cannot be left out. Fails closed on a missing root or
// an unresolvable relative import. Courses without a binding keep the legacy two-file hash above.
export function figureClosure(roots,srcDir=path.join(root,'src'),extra=[],baseDir=path.dirname(srcDir)){
 const seen=new Map(),errs=[];
 const unsupported=(f,text)=>{
  const bad=[];
  if(/\brequire\s*\(/.test(text))bad.push('require()');
  if(/import\.meta\.(glob|url)/.test(text))bad.push('import.meta.glob/url');
  for(const m of text.matchAll(/\bimport\s*\(\s*([^)]*)\)/g))if(!/^(['"])\.[^'"]*\1\s*$/.test(m[1].trim())&&!/^(['"])[^.'"][^'"]*\1\s*$/.test(m[1].trim()))bad.push('non-literal dynamic import');
  if(/\bimport\s*\{[^}]*\}\s*from\s*[^'"\s]/.test(text))bad.push('non-literal import source');
  for(const b of new Set(bad))errs.push('unsupported dependency form in '+f+': '+b);
 };
 const visit=f=>{
  if(seen.has(f))return;
  const full=path.join(srcDir,f);
  if(!fs.existsSync(full)){errs.push('figure dependency missing: '+f);return}
  const text=fs.readFileSync(full,'utf8');seen.set(f,text);
  const rels=[];
  if(/\.css$/.test(f)){
   for(const m of text.matchAll(/@import\s+(?:url\(\s*)?['"]?([^'")\s;]+)/g))rels.push(m[1]);
   for(const m of text.matchAll(/url\(\s*['"]?([^'")\s]+)/g))if(!/^(data:|https?:|#|\/)/.test(m[1]))rels.push(m[1]);
  }else{
   unsupported(f,text);
   for(const m of text.matchAll(/(?:import|export)\s[^;'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g))rels.push(m[1]||m[2]||m[3]);
  }
  for(const rel of rels){
   if(!rel.startsWith('.'))continue; // bare package: bound through package.json and the lockfile
   const t=path.normalize(path.join(path.dirname(f),rel));
   if(t.startsWith('..')){errs.push('figure dependency escapes src/: '+rel);continue}
   visit(t);
  }
 };
 for(const r of roots)visit(path.normalize(r));
 const extras=new Map();
 for(const x of extra){const full=path.join(baseDir,x);if(!fs.existsSync(full))errs.push('figure dependency missing: '+x);else extras.set(x,fs.readFileSync(full,'utf8'))}
 return {files:[...seen.keys()].sort(),texts:seen,extras,errors:errs};
}
export function figuresHashFor(courseId,policy,srcDir=path.join(root,'src')){
 const b=(policy.figureBinding||{})[courseId];
 if(!b)return {hash:figuresHash(),files:null,errors:[]};
 if(!Array.isArray(b.roots)||!b.roots.length)return {hash:null,files:[],errors:['figureBinding for '+courseId+' needs roots']};
 const c=figureClosure(b.roots,srcDir,b.extraFiles||[]);
 if(c.errors.length)return {hash:null,files:c.files,errors:c.errors};
 const parts=c.files.map(f=>'src/'+f+'\n'+c.texts.get(f)).concat([...c.extras.keys()].sort().map(x=>x+'\n'+c.extras.get(x)));
 return {hash:sha(parts.join('\n--file--\n')),files:[...c.files.map(f=>'src/'+f),...[...c.extras.keys()].sort()],errors:[]};
}
export const unitMapHash=cov=>sha(JSON.stringify({source:cov.source,pages:cov.pages}));
export function blockExists(topic,ref){
 const m=/^(theory|worked|quiz):(.+)$/.exec(ref);if(!m)return false;
 const arr=topic.content[m[1]];
 if(m[1]==='theory')return arr.some(b=>b.id===m[2]);
 if(m[1]==='worked')return /^\d+$/.test(m[2])&&arr[Number(m[2])-1]!==undefined;
 return arr.some(q=>String(q.id)===m[2]);
}
// Structure and traceability only. Returns {errors, pendingApprovals, unmapped}.
// Pages whose units are all admin: the reviewer must attest each one was viewed.
export const adminPages=cov=>(cov.pages||[]).filter(p=>p.units?.length&&p.units.every(u=>u.disposition==='admin')).map(p=>p.page);
export function checkTopic(topic,cov){
 const errors=[],pending=[];const e=m=>errors.push(m);
 for(const k of Object.keys(cov))if(!TOP_KEYS.has(k))e('unexpected field '+k);
 if(cov.schema!==2)e('schema must be 2');
 if(!Array.isArray(cov.authoredBy)||!cov.authoredBy.length)e('authoredBy must list the author(s)');
 for(const k of Object.keys(cov.semanticReview||{}))if(!REVIEW_KEYS.has(k))e('unexpected review field '+k);
 if(!/^[0-9a-f]{64}$/.test(cov.source?.sha256||''))e('source.sha256 must be a 64-hex hash');
 const n=cov.source?.pageCount;if(!Number.isInteger(n)||n<1)e('source.pageCount invalid');
 const seen=new Set(),ids=new Set(),used=new Set();
 for(const p of cov.pages||[]){
  for(const k of Object.keys(p))if(!PAGE_KEYS.has(k))e('page '+p.page+': unexpected field '+k);
  if(!Number.isInteger(p.page)||p.page<1||p.page>n){e('bad page '+p.page);continue}
  if(seen.has(p.page))e('duplicate page '+p.page);seen.add(p.page);
  if(!/^[0-9a-f]{64}$/.test(p.imageSha256||''))e('page '+p.page+': imageSha256 (fingerprint of the reviewed slide image) required');
  if(!p.units?.length)e('page '+p.page+': no units');
  for(const u of p.units||[]){
   const w='unit '+u.id+': ';
   for(const k of Object.keys(u))if(!UNIT_KEYS.has(k))e(w+'unexpected field '+k+' (no source text allowed)');
   if(!u.id||ids.has(u.id))e(w+'missing or duplicate id');ids.add(u.id);
   if(!u.id?.startsWith('p'+String(p.page).padStart(2,'0')+'.'))e(w+'id must start with its page locator');
   if(!KINDS.has(u.kind))e(w+'bad kind');
   if(!DISPOSITIONS.has(u.disposition))e(w+'bad disposition');
   if(!(u.label||'').trim()||u.label.length>80)e(w+'label required, max 80 chars (own words, not slide text)');
   if((u.rationale||'').length>200)e(w+'rationale too long');
   const d=u.disposition;
   if(d==='admin'&&!ADMIN_KINDS.has(u.kind))e(w+'admin disposition is only for title/outline/divider/marker units');
   if(ADMIN_KINDS.has(u.kind)&&d!=='admin')e(w+'non-content units must be admin');
   if(d==='admin'){if(u.targets?.length)e(w+'admin units have no targets');if(!(u.rationale||'').trim())e(w+'admin needs rationale')}
   else{
    if(!u.targets?.length)e(w+d+' needs targets');
    for(const t of u.targets||[]){if(!blockExists(topic,t))e(w+'target not found '+t);used.add(t)}
   }
   if(['adapted','corrected','excluded'].includes(d)&&!(u.rationale||'').trim())e(w+d+' needs rationale');
   if(d==='excluded'){
    if(!(u.approval||'').trim())e(w+'excluded needs approval reference');
    else if(!genuineApproval(u.approval)){pending.push(u.id);e(w+'approval is not a genuine owner-message reference (whatsapp:/imessage:/email: id)')}
   }
  }
 }
 for(let i=1;i<=n;i++)if(!seen.has(i))e('page '+i+' has no units');
 const missingIds=topic.content.theory.filter(b=>b.id===undefined).length;
 if(missingIds)e(missingIds+' theory blocks lack ids');
 const unmapped=topic.content.theory.filter(b=>b.id&&b.style!=='Heading'&&!used.has('theory:'+b.id)).map(b=>b.id);
 return {errors,pending,unmapped};
}
export function loadPolicy(dir=path.join(root,'ingest')){return JSON.parse(fs.readFileSync(path.join(dir,'coverage-policy.json'),'utf8'))}
export function checkAll({cat=catalogue,dir=path.join(root,'ingest'),requireReview=false,policy=loadPolicy(dir)}={}){
 const allow=new Set(policy.legacyUnaudited||[]);
 const rows=[];
 for(const c of cat.courses)for(const t of c.topics){
  const f=path.join(dir,c.id,'coverage',t.id+'.json');
  const listed=allow.has(c.id+'/'+t.id);
  if(!fs.existsSync(f)){rows.push(listed?{course:c.id,topic:t.id,status:'unaudited',errors:[]}:{course:c.id,topic:t.id,status:'fail',errors:['no coverage map and not on the legacy-unaudited allowlist (ingest/coverage-policy.json)']});continue}
  if(listed){rows.push({course:c.id,topic:t.id,status:'fail',errors:['has a coverage map but is still on the legacy-unaudited allowlist; remove it']});continue}
  const cov=JSON.parse(fs.readFileSync(f,'utf8'));
  const r=checkTopic(t,cov),errors=[...r.errors];
  {const fb=figuresHashFor(c.id,policy);for(const m of fb.errors)errors.push(m)}
  if(cov.course!==c.id||cov.topic!==t.id)errors.push('course/topic mismatch');
  const rv=cov.semanticReview||{};
  const reviewed=rv.status==='done';
  if(reviewed){
   if(!genuineReviewer(rv.reviewer))errors.push('reviewer is missing or a placeholder');
   const authors=new Set((cov.authoredBy||[]).map(normId));
   for(const g of policy.authorAliases||[]){const ids=g.map(normId);if(ids.some(i=>authors.has(i)))ids.forEach(i=>authors.add(i))}
   if(authors.has(normId(rv.reviewer)))errors.push('self-review: reviewer is also an author');
   if(rv.sourceSha256!==cov.source?.sha256)errors.push('review is not bound to this source hash');
   if(rv.contentSha256!==contentHash(t))errors.push('lesson content changed since the review; re-review required');
   if(JSON.stringify([...(rv.adminPagesAttested||[])].sort((a,b)=>a-b))!==JSON.stringify(adminPages(cov)))errors.push('adminPagesAttested must list exactly the all-admin pages the reviewer viewed');
   const fh=figuresHashFor(c.id,policy);
   if(!fh.errors.length&&rv.figuresSha256!==fh.hash)errors.push('figure implementation changed since the review; re-review required');
   if(rv.unitMapSha256!==unitMapHash(cov))errors.push('unit map changed since the review; re-review required');
  }else if(rv.status!=='pending')errors.push('semanticReview.status must be pending or done');
  if(requireReview){
   if(!reviewed)errors.push('independent semantic review not recorded');
   if(r.pending.length)errors.push('exclusions awaiting genuine owner approval: '+r.pending.join(', '));
   if(r.unmapped.length)errors.push('theory blocks not traced to any source unit: '+r.unmapped.join(', '));
  }
  rows.push({course:c.id,topic:t.id,status:errors.length?'fail':reviewed?'audited-reviewed':'audited-review-pending',errors,pending:r.pending,unmapped:r.unmapped});
 }
 for(const k of Object.keys(policy.figureBinding||{}))if(!cat.courses.some(c=>c.id===k))rows.push({course:k,topic:'*',status:'fail',errors:['figureBinding names a course that does not exist']});
 for(const k of allow)if(!cat.courses.some(c=>c.topics.some(t=>c.id+'/'+t.id===k)))rows.push({course:k.split('/')[0],topic:k.split('/')[1],status:'fail',errors:['allowlist entry names a topic that does not exist']});
 return rows;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const rows=checkAll({requireReview:process.argv.includes('--require-review')||process.argv.includes('--release')});
 const bad=rows.filter(r=>r.status==='fail');
 const count=s=>rows.filter(r=>r.status===s).length;
 for(const r of rows.filter(r=>r.status!=='unaudited'))console.log(r.course+'/'+r.topic+': '+r.status+(r.errors.length?'\n  '+r.errors.join('\n  '):''));
 console.log('unaudited: '+count('unaudited')+' | review-pending: '+count('audited-review-pending')+' | reviewed: '+count('audited-reviewed')+' | failed: '+bad.length);
 process.exit(bad.length?1:0);
}
