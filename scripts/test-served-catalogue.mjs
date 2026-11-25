// Proves the built bundle that is served contains the exact audited lesson content: every theory, worked and quiz
// string of each audited topic (those with a coverage map) must appear verbatim in the built JS assets.
// Limits: this is substring presence only. It does not check order, duplicates, extra or stale content, figure
// components or rendered output. The build runs it on the production dist (vite build) and on dist-test.
import fs from 'node:fs';
import path from 'node:path';
import catalogue from '#catalogue';
const dist=path.resolve(process.env.DIST_DIR||'dist-test');
const files=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);e.isDirectory()?walk(f):/\.(js|json|html)$/.test(e.name)&&files.push(f)}})(dist);
const blob=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const esc=s=>JSON.stringify(s).slice(1,-1);
let checked=0;const missing=[];
for(const c of catalogue.courses)for(const t of c.topics){
 if(!fs.existsSync(path.resolve('ingest',c.id,'coverage',t.id+'.json')))continue;
 const strings=[...t.content.theory.map(b=>b.text),...t.content.worked.flatMap(w=>[w.title,...(w.content||[]).filter(x=>typeof x==='string')]),...t.content.quiz.flatMap(q=>[q.prompt,q.answer])];
 for(const s of strings){if(!s)continue;checked++;if(!blob.includes(s)&&!blob.includes(esc(s))&&!blob.includes(esc(esc(s)))&&!blob.includes(s.replace(/"/g,String.raw`\\"`)))missing.push(c.id+'/'+t.id+': '+s.slice(0,40))}
}
if(!checked){console.error('no audited topic strings checked');process.exit(1)}
if(missing.length){console.error('built bundle is missing audited content:\n'+missing.slice(0,10).join('\n'));process.exit(1)}
console.log('served bundle matches catalogue: '+checked+' audited strings found in '+files.length+' built files ('+dist+')');
