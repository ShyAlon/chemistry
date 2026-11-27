#!/usr/bin/env node
// Record a reviewer's finished semantic review in a coverage map.
// The tool computes the bindings (source, content, unit map, figures) with the checker's own functions.
// It never decides that a review happened: the reviewer id and the admin pages they actually viewed
// are required inputs from the human/independent reviewer's own report, and the tool stops if they
// are missing, a placeholder, an author, or do not match the map's all-admin pages.
//
//   node scripts/record-review.mjs --course 84101 --topic G13 --reviewer chat-... --admin-pages 1
//   node scripts/record-review.mjs --course 84101 --topic G15 --reviewer chat-... --admin-pages none --write
// Without --write it prints the exact diff and changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import catalogue from '#catalogue';
import {adminPages,contentHash,figuresHashFor,genuineReviewer,loadPolicy,normId,unitMapHash} from './check-coverage.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=n=>{const i=process.argv.indexOf('--'+n);return i<0?null:process.argv[i+1]};
const fail=m=>{console.error('STOP: '+m);process.exit(1)};
const course=arg('course'),topicId=arg('topic'),reviewer=arg('reviewer'),pagesArg=arg('admin-pages'),write=process.argv.includes('--write');
if(!course||!topicId)fail('--course and --topic are required');
if(!reviewer)fail('--reviewer is required (the independent reviewer\'s own id, as stated in their final report)');
if(pagesArg===null)fail('--admin-pages is required: the all-admin source pages the reviewer actually viewed, comma separated, or "none" when the map has no all-admin page');
const file=path.join(root,'ingest',course,'coverage',topicId+'.json');
if(!fs.existsSync(file))fail('no coverage map '+path.relative(root,file));
const raw=fs.readFileSync(file,'utf8');
const cov=JSON.parse(raw);
// Formatting guard: refuse to rewrite a file that JSON.stringify would not reproduce byte for byte,
// so a recording diff can only contain the semanticReview block.
const indentMatch=raw.match(/^\{\n( +)"/);const indent=indentMatch?indentMatch[1].length:1;
const ser=o=>JSON.stringify(o,null,indent)+'\n';
if(ser(cov)!==raw)fail('map formatting is not reproducible by the tool; fix formatting in a separate commit first');
if(!genuineReviewer(reviewer))fail('reviewer id is missing or a placeholder');
const authors=new Set((cov.authoredBy||[]).map(normId));
const policy=loadPolicy();
for(const g of policy.authorAliases||[]){const ids=g.map(normId);if(ids.some(i=>authors.has(i)))ids.forEach(i=>authors.add(i))}
if(authors.has(normId(reviewer)))fail('reviewer is also an author (self-review)');
const viewed=pagesArg==='none'?[]:pagesArg.split(',').map(x=>Number(x.trim()));
if(viewed.some(n=>!Number.isInteger(n)))fail('--admin-pages must be integers');
const need=adminPages(cov);
if(JSON.stringify([...viewed].sort((a,b)=>a-b))!==JSON.stringify(need))fail('admin pages viewed ['+viewed+'] must equal the map\'s all-admin pages ['+need+']; the reviewer must view each one, the tool will not attest pages');
const c=catalogue.courses.find(x=>x.id===course),t=c&&c.topics.find(x=>x.id===topicId);
if(!t)fail('topic not in the catalogue');
const fh=figuresHashFor(course,policy);
if(fh.errors.length)fail('figure binding: '+fh.errors.join('; '));
const review={status:'done',reviewer,sourceSha256:cov.source.sha256,contentSha256:contentHash(t),unitMapSha256:unitMapHash(cov),figuresSha256:fh.hash,adminPagesAttested:need};
const next={...cov,semanticReview:review};
const out=ser(next);
// Show the diff (line based, semanticReview block only by construction).
const a=raw.split('\n'),b=out.split('\n');let i=0;while(i<a.length&&a[i]===b[i])i++;let ea=a.length-1,eb=b.length-1;while(ea>i&&eb>i&&a[ea]===b[eb]){ea--;eb--}
console.log(`${course}/${topicId}: lines ${i+1}-${ea+1} replaced`);for(let k=i;k<=ea;k++)console.log('- '+a[k]);for(let k=i;k<=eb;k++)console.log('+ '+b[k]);
if(!write){console.log('dry run: nothing written (add --write)');process.exit(0)}
fs.writeFileSync(file,out);console.log('written; run: node scripts/check-coverage.mjs --release');
