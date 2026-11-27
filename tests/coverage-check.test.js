import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import catalogue from '#catalogue';
import {createHash} from 'node:crypto';
import {checkTopic,checkAll,contentHash,unitMapHash,figuresHash,adminPages,blockExists,genuineApproval,genuineReviewer,loadPolicy,sourceBindingErrors,parseSpan} from '../scripts/check-coverage.mjs';
const topic=catalogue.courses.find(c=>c.id==='nuclear').topics.find(t=>t.id==='E5');
const cov=()=>JSON.parse(fs.readFileSync(new URL('../ingest/nuclear/coverage/E5.json',import.meta.url)));
const errs=(f,t=topic)=>{const c=cov();f(c);return checkTopic(t,c).errors.join('|')};
const GOOD_APPROVAL='whatsapp:wamid.HBgMOTcyNTQ1Njc4MzMw';
function reviewed(c,t=topic){c.semanticReview={status:'done',reviewer:'reviewer.alice',sourceSha256:c.source.sha256,contentSha256:contentHash(t),unitMapSha256:unitMapHash(c),figuresSha256:figuresHash(),adminPagesAttested:adminPages(c)};return c}
function run(c,{cat=catalogue,requireReview=false}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cov-'));
 try{fs.mkdirSync(path.join(dir,'nuclear','coverage'),{recursive:true});fs.writeFileSync(path.join(dir,'nuclear','coverage','E5.json'),JSON.stringify(c));
  return checkAll({cat,dir,requireReview,policy:loadPolicy()}).find(r=>r.topic==='E5')}finally{fs.rmSync(dir,{recursive:true,force:true})}
}
test('E5 map is valid, traced, and has no pending exclusions',()=>{
 const r=checkTopic(topic,cov());assert.deepEqual(r.errors,[]);assert.deepEqual(r.unmapped,[]);assert.deepEqual(r.pending,[]);
});
test('legacy topics are unaudited only via the explicit allowlist; new topics without maps fail',()=>{
 const rows=checkAll();assert.equal(rows.filter(r=>r.status==='fail').length,0);assert.equal(rows.filter(r=>r.status==='unaudited').length,45);
 const pol={...loadPolicy(),legacyUnaudited:loadPolicy().legacyUnaudited.slice(1)};
 const miss=checkAll({policy:pol}).filter(r=>r.status==='fail');assert.equal(miss.length,1);assert.match(miss[0].errors[0],/no coverage map and not on the legacy-unaudited allowlist/);
 assert.match(checkAll({policy:{...loadPolicy(),legacyUnaudited:[...loadPolicy().legacyUnaudited,'nuclear/E5']}}).filter(r=>r.status==='fail').map(r=>r.errors[0]).join('|'),/remove it/);
 assert.match(checkAll({policy:{...loadPolicy(),legacyUnaudited:[...loadPolicy().legacyUnaudited,'nuclear/Z9']}}).filter(r=>r.status==='fail').map(r=>r.errors[0]).join('|'),/does not exist/);
});
test('legacy topics are unaudited, not failed',()=>{
 const rows=checkAll();assert.equal(rows.filter(r=>r.status==='fail').length,0);assert.equal(rows.filter(r=>r.status==='unaudited').length,45);
});
test('deck files are pinned to the manifest, spans respect real page counts, and the cross-topic partition is accountable',()=>{
 const manifest=[{file:'a.pdf',sha256:'a'.repeat(64)},{file:'b.pdf',sha256:'b'.repeat(64)}];
 const partition={files:[{file:'a.pdf',pageCount:4},{file:'b.pdf',pageCount:2}],shared:[{file:'a.pdf',page:2,topics:['T1','T2']}]};
 const deck=(topic,file,pages,sha)=>({topic,file,pages,sha256:sha||(manifest.find(s=>s.file===file)||{sha256:'c'.repeat(64)}).sha256});
 // complete partition + one declared shared page: clean
 assert.deepEqual(sourceBindingErrors({decks:[deck('T1','a.pdf',[1,2,3]),deck('T2','a.pdf',[2,4]),deck('T2','b.pdf',[1,2])],manifest,partition}),[]);
 // file/sha must match the manifest
 assert.match(sourceBindingErrors({decks:[deck('T1','c.pdf',[1])],manifest,partition:null}).join('|'),/not in sources\.manifest\.json/);
 assert.match(sourceBindingErrors({decks:[deck('T1','a.pdf',[1],'0'.repeat(64))],manifest,partition:null}).join('|'),/differs from sources\.manifest\.json/);
 assert.match(sourceBindingErrors({decks:[deck('T1','a.pdf',[1])],manifest:null,partition:null}).join('|'),/no sources\.manifest\.json/);
 // a span past the real page count fails
 assert.match(sourceBindingErrors({decks:[deck('T1','a.pdf',[1,2,3,4,5])],manifest,partition}).join('|'),/exceeds the real page count 4/);
 // a page missing from every deck fails; an undeclared overlap fails; a stale declaration fails
 assert.match(sourceBindingErrors({decks:[deck('T1','a.pdf',[1,2]),deck('T2','a.pdf',[2,4]),deck('T2','b.pdf',[1,2])],manifest,partition}).join('|'),/a\.pdf page 3 is not in any topic deck/);
 assert.match(sourceBindingErrors({decks:[deck('T1','a.pdf',[1,2,3,4]),deck('T2','a.pdf',[2]),deck('T2','b.pdf',[1,2])],manifest,partition:{...partition,shared:[]}}).join('|'),/page 2 is in T1\+T2 without a matching shared declaration/);
 assert.match(sourceBindingErrors({decks:[deck('T1','a.pdf',[1,3]),deck('T2','a.pdf',[2,4]),deck('T2','b.pdf',[1,2])],manifest,partition}).join('|'),/shared declaration for page 2 has no multi-topic coverage/);
 assert.deepEqual(parseSpan('1-3,5'),[1,2,3,5]);
});
test('multi-file deck descriptor: spans, firstPage order, pageCount and digest are enforced',()=>{
 const files=[{file:'a.pdf',sha256:'a'.repeat(64),pages:'1-20',firstPage:1},{file:'b.pdf',sha256:'b'.repeat(64),pages:'21-40',firstPage:21}];
 const digest=createHash('sha256').update(JSON.stringify(files)).digest('hex');
 const good=c=>{c.source={...c.source,files,sha256:digest};};
 assert.deepEqual(errs(c=>good(c)),'');
 assert.match(errs(c=>{good(c);c.source.sha256='0'.repeat(64)}),/sha256\(JSON\.stringify\(source\.files\)\)/);
 assert.match(errs(c=>{c.source={...c.source,files:[files[0],{...files[1],firstPage:22}],sha256:digest}}),/firstPage must be 21/);
 assert.match(errs(c=>{good(c);c.source.pageCount=41}),/total of the source\.files spans \(40\)/);
 assert.match(errs(c=>{c.source={...c.source,files:[{...files[0],pages:'x'},files[1]],sha256:digest}}),/pages must be a span/);
 assert.match(errs(c=>{c.source={...c.source,files:[{...files[0],sha256:'zz'}],sha256:digest}}),/sha256 must be a 64-hex hash/);
});
test('missing and duplicate page, unit and target fail closed',()=>{
 assert.match(errs(c=>c.pages.pop()),/page 40 has no units/);
 assert.match(errs(c=>{c.pages[1].page=1}),/duplicate page 1/);
 assert.match(errs(c=>{c.pages[3].units=[]}),/page 4: no units/);
 assert.match(errs(c=>{c.pages[5].units[1].id=c.pages[5].units[0].id}),/duplicate id/);
 assert.match(errs(c=>{c.pages[5].units[0].id='p07.u1'}),/must start with its page locator/);
 assert.match(errs(c=>{c.pages[2].units[0].targets=['theory:E5-t999']}),/target not found/);
 assert.match(errs(c=>{c.pages[2].units[0].targets=['worked:99']}),/target not found/);
 assert.match(errs(c=>{c.pages[2].units[0].targets=[]}),/needs targets/);
 assert.match(errs(c=>{c.pages[2].units[0].targets=['bogus']}),/target not found/);
 assert.match(errs(c=>{c.pages[5].units.pop();c.pages[5].units.pop();c.pages[5].units.pop()}),/no units/);
 assert.match(errs(c=>{c.pages[2].units[0].extra=1}),/unexpected field extra/);
 assert.match(errs(c=>{c.pages[2].units[0].text='copied slide text'}),/no source text/);
 assert.match(errs(c=>{c.pages[2].units[0].label='x'.repeat(81)}),/label required/);
 assert.match(errs(c=>{c.schema=1}),/schema must be 2/);
 assert.match(errs(c=>{c.unknownTop=1}),/unexpected field unknownTop/);
 assert.match(errs(c=>{delete c.authoredBy}),/authoredBy/);
});
test('admin cannot hide substantive content, and excluded content needs a genuine owner approval reference',()=>{
 assert.match(errs(c=>{const u=c.pages[2].units[0];u.disposition='admin';delete u.targets;u.rationale='skip'}),/admin disposition is only for/);
 assert.match(errs(c=>{c.pages[0].units[0].disposition='covered'}),/non-content units must be admin/);
 const ex=c=>{const u=c.pages[2].units[0];u.disposition='excluded';u.rationale='scoped reason';delete u.targets};
 assert.match(errs(c=>{const u=c.pages[2].units[0];u.disposition='excluded';u.rationale='scoped reason';u.approval=GOOD_APPROVAL}),/excluded units have no targets/);
 assert.match(errs(c=>ex(c)),/needs approval reference/);
 for(const bad of ['pending-owner','NEEDED','whatsapp:test','whatsapp:wamid.TESTAPPROVAL123','ok','yes','email:placeholder-approval-id','whatsapp:short'])
  assert.match(errs(c=>{ex(c);c.pages[2].units[0].approval=bad}),/not a genuine owner-message reference/,bad);
 assert.equal(errs(c=>{ex(c);c.pages[2].units[0].approval=GOOD_APPROVAL}),'');
 assert.match(errs(c=>{ex(c);c.pages[2].units[0].approval=GOOD_APPROVAL;delete c.pages[2].units[0].rationale}),/excluded needs rationale/);
 assert.ok(genuineApproval('whatsapp:wamid.HBgMtestXY7Q9aZ')&&genuineReviewer('contestant-77')&&genuineReviewer('nadia.k'),'random ids containing letters like test are legitimate');
 assert.ok(genuineApproval(GOOD_APPROVAL)&&!genuineApproval('pending-owner'));
 assert.ok(genuineReviewer('reviewer.alice')&&!genuineReviewer('TBD')&&!genuineReviewer('test-reviewer')&&!genuineReviewer(''));
});
test('review must be independent and bound to exact source, content and unit-map hashes',()=>{
 assert.equal(run(reviewed(cov())).status,'audited-reviewed');
 // placeholder / missing / self reviewers
 for(const who of ['TBD','pending','test','x',''])assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.reviewer=who;return c})()).errors.join('|'),/placeholder/,who);
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.reviewer=c.authoredBy[0];return c})()).errors.join('|'),/self-review/);
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.reviewer=c.authoredBy[0].toUpperCase();return c})()).errors.join('|'),/self-review/);
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.reviewer='agent-'+c.authoredBy[0].replace(/^chat-/,'');return c})()).errors.join('|'),/self-review/);
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.reviewer=c.authoredBy[1];return c})()).errors.join('|'),/self-review/);
 assert.equal(run((()=>{const c=reviewed(cov());c.semanticReview.reviewer='chat-01M88ZHANBB4E1BHZPDEC7FZ4F';return c})()).errors.length,0);
 assert.match(run((()=>{const c=reviewed(cov());delete c.semanticReview.reviewer;return c})()).errors.join('|'),/placeholder/);
 // stale source hash
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.sourceSha256='0'.repeat(64);return c})()).errors.join('|'),/source hash/);
 // stale content hash
 const edited=structuredClone(catalogue);edited.courses.find(x=>x.id==='nuclear').topics.find(t=>t.id==='E5').content.theory[1].text+=' x';
 assert.match(run(reviewed(cov()),{cat:edited}).errors.join('|'),/content changed since the review/);
 // stale unit map: change a rationale / target / disposition after review
 for(const f of [c=>{c.pages[6].units[0].rationale='changed'},c=>{c.pages[2].units[0].targets=['theory:E5-t02']},c=>{c.pages[0].units.push({id:'p01.u9',kind:'marker',disposition:'admin',label:'extra',rationale:'extra'})}]){
  const c=reviewed(cov());f(c);assert.match(run(c).errors.join('|'),/unit map changed since the review/);
 }
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.figuresSha256='0'.repeat(64);return c})()).errors.join('|'),/figure implementation changed/);
 assert.match(run((()=>{const c=reviewed(cov());delete c.semanticReview.figuresSha256;return c})()).errors.join('|'),/figure implementation changed/);
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.adminPagesAttested.pop();return c})()).errors.join('|'),/adminPagesAttested/);
 assert.match(run((()=>{const c=reviewed(cov());delete c.semanticReview.adminPagesAttested;return c})()).errors.join('|'),/adminPagesAttested/);
 assert.match(errs(c=>{delete c.pages[3].imageSha256}),/imageSha256/);
 assert.match(errs(c=>{c.pages[3].imageSha256='abc'}),/imageSha256/);
 // unknown review fields and bad status fail closed
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.note='ok';return c})()).errors.join('|'),/unexpected review field/);
 assert.match(run((()=>{const c=reviewed(cov());c.semanticReview.status='approved';return c})()).errors.join('|'),/pending or done/);
});
test('cross-topic targets need an explicit topic prefix and resolve through the loader, failing closed without one',()=>{
 const other={content:{theory:[{id:'SS2-t14'}],worked:[],quiz:[]}};
 const load=tid=>tid==='SS2'?other:null;
 assert.ok(blockExists(topic,'SS2/theory:SS2-t14',load));
 assert.ok(!blockExists(topic,'SS2/theory:SS2-t999',load));
 assert.ok(!blockExists(topic,'ZZ/theory:SS2-t14',load));
 assert.ok(!blockExists(topic,'SS2/theory:SS2-t14'));
 assert.match(errs(c=>{c.pages[2].units[0].targets=['ZZ/theory:SS2-t14']}),/target not found/);
});
test('audited topics refuse id-less non-heading blocks; structural headings may stay id-less',()=>{
 const t=structuredClone(topic);t.content.theory.push({text:'presentation split row',style:'Normal'});
 assert.match(checkTopic(t,cov()).errors.join('|'),/theory blocks lack ids/);
 const t2=structuredClone(topic);t2.content.theory.push({text:'structural heading',style:'Heading 2'});
 assert.ok(!/lack ids/.test(checkTopic(t2,cov()).errors.join('|')),'id-less Heading stays structural');
 const t3=structuredClone(topic);t3.content.theory.push({text:'untraced with id',style:'Normal',id:'E5-t998'});
 assert.deepEqual(checkTopic(t3,cov()).unmapped,['E5-t998']);
});
test('release mode refuses unreviewed maps and untraced blocks; blocks resolve by id',()=>{
 const r=run((()=>{const c=cov();c.semanticReview={status:'pending'};return c})(),{requireReview:true});assert.equal(r.status,'fail');assert.match(r.errors.join('|'),/review not recorded/);
 const t=structuredClone(topic);t.content.theory.splice(t.content.theory.findIndex(b=>b.id==='E5-t13'),1);
 assert.match(checkTopic(t,cov()).errors.join('|'),/target not found theory:E5-t13/);
 const t2=structuredClone(topic);t2.content.theory.push({text:'new untraced block',style:'Normal',id:'E5-t999'});
 assert.deepEqual(checkTopic(t2,cov()).unmapped,['E5-t999']);
 assert.ok(blockExists(topic,'theory:E5-t12')&&!blockExists(topic,'worked:0'));
 const raw=fs.readFileSync(new URL('../ingest/nuclear/coverage/E5.json',import.meta.url),'utf8');
 assert.ok(!/[\u0590-\u05ff]/.test(raw),'map holds locators and own-word English labels only');
});

test('release wiring: npm run build starts with the review gate and checks the production dist; the deploy workflow runs npm run build',()=>{
 const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 const steps=pkg.scripts.build.split('&&').map(s=>s.trim());
 assert.equal(steps[0],'npm run release:coverage');
 assert.ok(steps.includes('DIST_DIR=dist npm run test:served'),'served check must run on the production dist');
 assert.ok(steps.indexOf('vite build')<steps.indexOf('DIST_DIR=dist npm run test:served'));
 assert.match(pkg.scripts['release:coverage'],/check-coverage\.mjs --release/);
 const wf=fs.readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
 assert.match(wf,/^\s*- run: npm run build\s*$/m);
});
test('lessonAdditions: authored material outside source coverage, hash-bound, strictly validated',()=>{
 const base=cov();
 // an unmapped-by-design block: pull one theory target out of the only unit that credits it
 const count={};for(const p of base.pages)for(const u of p.units)for(const t of u.targets||[])count[t]=(count[t]||0)+1;
 let pick;for(const p of base.pages)for(const u of p.units)if((u.targets||[]).length>1&&!pick)pick=u.targets.find(t=>t.startsWith('theory:')&&count[t]===1);
 assert.ok(pick,'fixture has a singly credited theory block in a multi-target unit');
 const strip=c=>{for(const p of c.pages)for(const u of p.units)if(u.targets)u.targets=u.targets.filter(t=>t!==pick)};
 const add=(c,extra={})=>{strip(c);c.lessonAdditions=[{id:'a01',targets:[pick],rationale:'Own addition, no source page.',...extra}]};
 const untouched=unitMapHash(cov());
 assert.equal(unitMapHash(cov()),untouched,'maps without additions keep their hash');
 const c0=cov();strip(c0);assert.deepEqual(checkTopic(topic,c0).unmapped,[pick.slice(7)],'without the declaration the block is untraced');
 const c1=cov();add(c1);const r1=checkTopic(topic,c1);assert.deepEqual(r1.errors,[]);assert.deepEqual(r1.unmapped,[]);assert.equal(r1.additions,1);
 const c2=cov();add(c2);assert.notEqual(unitMapHash(c2),untouched,'additions change the unit-map hash');
 // a review bound before the additions changed is voided
 const c3=cov();reviewed(c3);add(c3);assert.match(run(c3,{requireReview:true}).errors.join('|'),/unit map changed since the review/);
 assert.match(errs(c=>add(c,{rationale:''})),/rationale required/);
 assert.match(errs(c=>add(c,{targets:[]})),/needs targets/);
 assert.match(errs(c=>add(c,{targets:['theory:E5-t999']})),/target not found/);
 assert.match(errs(c=>add(c,{id:'x1'})),/id must be a unique aNN/);
 assert.match(errs(c=>add(c,{extra:1})),/unexpected field extra/);
 assert.match(errs(c=>{add(c);c.lessonAdditions.push({id:'a01',targets:[pick],rationale:'dup'})}),/unique aNN|listed twice/);
 assert.match(errs(c=>{c.lessonAdditions=[{id:'a01',targets:[pick],rationale:'credited elsewhere'}]}),/already credited as source coverage/);
 assert.match(errs(c=>{c.lessonAdditions=[]}),/non-empty list/);
});
test('supporting sources are validated structurally, hash-pinned against the manifest and bound into the map hash',()=>{
 const tgt=cov().pages.flatMap(p=>p.units).find(u=>u.targets?.length).targets[0];
 const good=()=>[{file:'x.pdf',sha256:'a'.repeat(64),items:[{ref:'Q6',use:'method-only',targets:[tgt]}]}];
 assert.equal(errs(c=>{c.supportingSources=good()}),'');
 assert.match(errs(c=>{c.supportingSources=good();c.supportingSources[0].sha256='zz'}),/sha256 must be a 64-hex hash/);
 assert.match(errs(c=>{c.supportingSources=good();c.supportingSources[0].items[0].targets=['theory:E5-t998']}),/target not found theory:E5-t998/);
 assert.match(errs(c=>{c.supportingSources=good();c.supportingSources[0].items[0].use='same'}),/use must be/);
 assert.equal(errs(c=>{c.supportingSources=good();c.supportingSources[0].items.push({ref:'Q9',use:'not-covered',reason:'no item uses this question'})}),'');
 assert.match(errs(c=>{c.supportingSources=good();c.supportingSources[0].items.push({ref:'Q9',use:'not-covered'})}),/needs a reason/);
 assert.match(errs(c=>{c.supportingSources=good();c.supportingSources[0].items.push({ref:'Q9',use:'not-covered',reason:'no item uses this question',targets:[tgt]})}),/must not list targets/);
 assert.match(errs(c=>{c.supportingSources=good();c.supportingSources[0].items[0].reason='x'}),/reason is only for not-covered/);
 assert.match(errs(c=>{c.supportingSources=good();c.supportingSources[0].items[0].ref='page 6'}),/ref must be a question label/);
 assert.match(errs(c=>{c.supportingSources=[]}),/non-empty list/);
 const a=cov(),b=cov();b.supportingSources=good();assert.notEqual(unitMapHash(a),unitMapHash(b));
 // manifest pin: G13 declares the HW6 and sample exam; a wrong hash must fail checkAll.
 const real=JSON.parse(fs.readFileSync(new URL('../ingest/84101/coverage/G13.json',import.meta.url)));
 const pins=JSON.parse(fs.readFileSync(new URL('../ingest/84101/sources.manifest.json',import.meta.url))).sources;
 for(const s of real.supportingSources)assert.equal(pins.find(p=>p.file===s.file)?.sha256,s.sha256,s.file);
});
