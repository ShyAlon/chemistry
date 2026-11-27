#!/usr/bin/env node
// Before committing: which recorded semantic reviews do my changes invalidate, and why?
//   node scripts/review-impact.mjs [--base origin/main]
// Changed files = committed diff against the base, plus staged, unstaged and untracked files.
// It maps each file to the review bindings (figure closure, topic content, unit map) and then prints the
// checker's real current verdict per topic, so the prediction and the truth sit side by side.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import catalogue from '#catalogue';
import {checkAll,figureClosure,loadPolicy} from './check-coverage.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bi=process.argv.indexOf('--base');const base=bi<0?'origin/main':process.argv[bi+1];
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'});
const changed=new Set();
try{git('diff','--name-only',base+'...HEAD').split('\n').filter(Boolean).forEach(f=>changed.add(f))}catch(e){console.error('cannot diff against '+base+': '+e.message.split('\n')[0]);process.exit(2)}
git('diff','--name-only','HEAD').split('\n').filter(Boolean).forEach(f=>changed.add(f));
git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean).forEach(f=>changed.add(f));
const policy=loadPolicy();
const reasons=new Map(); // "course/topic" -> reasons[]
const note=(k,r)=>{if(!reasons.has(k))reasons.set(k,[]);reasons.get(k).push(r)};
const reviewed=(course,topic)=>{const f=path.join(root,'ingest',course,'coverage',topic+'.json');if(!fs.existsSync(f))return false;try{return JSON.parse(fs.readFileSync(f,'utf8')).semanticReview?.status==='done'}catch{return false}};
for(const c of catalogue.courses){
 const b=(policy.figureBinding||{})[c.id];
 let bound;
 if(b){const cl=figureClosure(b.roots,path.join(root,'src'),b.extraFiles||[]);bound=new Set([...cl.files.map(f=>'src/'+f),...(b.extraFiles||[])])}
 else bound=new Set(['src/figures-nuclear.jsx','src/figures.jsx']);
 const hit=[...changed].filter(f=>bound.has(f));
 for(const t of c.topics){
  if(!reviewed(c.id,t.id))continue;
  const k=c.id+'/'+t.id;
  if(hit.length)note(k,'figure implementation: '+hit.join(', '));
  if(changed.has(`src/content/${c.id}/topics/${t.id}.json`))note(k,'lesson content changed');
  if(changed.has(`ingest/${c.id}/coverage/${t.id}.json`))note(k,'unit map file changed (only a semanticReview-only edit keeps the bindings)');
 }
}
console.log('changed files vs '+base+': '+changed.size);
if(!reasons.size)console.log('predicted: no recorded review is invalidated by these files');
else{console.log('predicted review invalidations: '+reasons.size+' topic(s), one review record per topic');for(const [k,r] of [...reasons].sort())console.log('  '+k+': '+r.join('; '))}
const rows=checkAll({requireReview:false}).filter(r=>r.status==='fail');
console.log('limits: prediction follows the figure closure (static relative imports, policy extraFiles), the topic JSON and the unit map file; courses with no figureBinding use the legacy two-file fallback (figures.jsx, figures-nuclear.jsx); the checker verdict below is the authority.');
console.log(rows.length?'checker now fails '+rows.length+' topic(s):':'checker now: no failing topic');
for(const r of rows)console.log('  '+r.course+'/'+r.topic+': '+r.errors.join(' | '));
process.exit(rows.length?1:0);
