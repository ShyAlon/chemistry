import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {figuresHash,figuresHashFor,figureClosure,loadPolicy} from '../scripts/check-coverage.mjs';

function tree(files){
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'fig-'));
 for(const [f,t] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(d,f)),{recursive:true});fs.writeFileSync(path.join(d,f),t)}
 return d;
}
const base={
 'figures.jsx':"import {A} from './figures-core.jsx';\nimport {G} from './figures-gc2.jsx';\nexport const x=1;\n",
 'figures-core.jsx':"export const A=1;\n",
 'figures-gc2.jsx':"import {A} from './figures-core.jsx';\nexport const G=A;\n",
 'figures-nuclear.jsx':"export const N=1;\n",
 'unrelated.jsx':"export const U=1;\n",
};
const pol={figureBinding:{gc2:{roots:['figures.jsx']}}};
const h=(d,id='gc2')=>figuresHashFor(id,pol,d);

test('GC2 binding covers the import closure (toy tree), sorted, and ignores unrelated files',()=>{
 const d=tree(base);
 assert.deepEqual(h(d).files,['src/figures-core.jsx','src/figures-gc2.jsx','src/figures.jsx']);
 const before=h(d).hash;
 fs.writeFileSync(path.join(d,'unrelated.jsx'),'export const U=2;\n');
 fs.writeFileSync(path.join(d,'figures-nuclear.jsx'),'export const N=2;\n');
 assert.equal(h(d).hash,before);
});
test('editing a GC2-only figure file or a shared dependency changes the GC2 hash',()=>{
 for(const f of ['figures-gc2.jsx','figures-core.jsx','figures.jsx']){
  const d=tree(base);const before=h(d).hash;
  fs.appendFileSync(path.join(d,f),'// edit\n');
  assert.notEqual(h(d).hash,before,f);
 }
});
test('a GC2-only file edit does not change the legacy hash used by courses without a binding',()=>{
 const d=tree(base);
 const real=figuresHash();
 assert.equal(figuresHashFor('nuclear',pol,d).hash,real);
 assert.equal(figuresHashFor('nuclear',pol,d).files,null);
});
test('missing root, missing import and src-escaping import fail closed',()=>{
 let d=tree({'figures.jsx':"import {G} from './figures-gc2.jsx';\n"});
 assert.match(h(d).errors.join('|'),/missing: figures-gc2\.jsx/);assert.equal(h(d).hash,null);
 d=tree({});assert.match(h(d).errors.join('|'),/missing: figures\.jsx/);
 d=tree({'figures.jsx':"import {G} from '../outside.js';\n"});assert.match(h(d).errors.join('|'),/escapes src/);
 assert.match(figuresHashFor('gc2',{figureBinding:{gc2:{roots:[]}}},d).errors.join('|'),/needs roots/);
});
test('a newly imported file joins the binding automatically',()=>{
 const d=tree(base);const before=h(d).hash;
 fs.writeFileSync(path.join(d,'figures-new.jsx'),'export const Q=1;\n');
 fs.appendFileSync(path.join(d,'figures-gc2.jsx'),"import {Q} from './figures-new.jsx';\n");
 assert.ok(h(d).files.includes('src/figures-new.jsx'));assert.notEqual(h(d).hash,before);
});
test('the real policy binds general-chemistry-2 to an existing closure and leaves nuclear on the legacy hash',()=>{
 const p=loadPolicy();
 assert.ok(p.figureBinding['general-chemistry-2']);assert.equal(p.figureBinding.nuclear,undefined);
 const r=figuresHashFor('general-chemistry-2',p);assert.deepEqual(r.errors,[]);assert.ok(r.files.includes('src/figures.jsx')&&r.files.includes('src/figures-core.jsx'));
 assert.equal(figuresHashFor('nuclear',p).hash,figuresHash());
});
test('author aliases: a reviewer who is an alias of an author fails self-review; an unrelated id passes',async()=>{
 const {checkAll,contentHash,unitMapHash,adminPages}=await import('../scripts/check-coverage.mjs');
 const {default:catalogue}=await import('#catalogue');
 const topic=catalogue.courses.find(c=>c.id==='nuclear').topics.find(x=>x.id==='E5');
 const run=(reviewer,policy)=>{
  const c=JSON.parse(fs.readFileSync(new URL('../ingest/nuclear/coverage/E5.json',import.meta.url)));
  c.authoredBy=['chat-01AAAAAAAAAAAAAAAAAAAAAAAA'];
  c.semanticReview={status:'done',reviewer,sourceSha256:c.source.sha256,contentSha256:contentHash(topic),unitMapSha256:unitMapHash(c),figuresSha256:figuresHash(),adminPagesAttested:adminPages(c)};
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cov-'));
  try{fs.mkdirSync(path.join(dir,'nuclear','coverage'),{recursive:true});fs.writeFileSync(path.join(dir,'nuclear','coverage','E5.json'),JSON.stringify(c));
   return checkAll({dir,requireReview:true,policy}).find(r=>r.topic==='E5')}finally{fs.rmSync(dir,{recursive:true,force:true})}
 };
 const base=loadPolicy();
 const aliased={...base,authorAliases:[['chat-01AAAAAAAAAAAAAAAAAAAAAAAA','agent-01BBBBBBBBBBBBBBBBBBBBBBBB']]};
 assert.match(run('agent-01BBBBBBBBBBBBBBBBBBBBBBBB',aliased).errors.join('|'),/self-review/);
 assert.doesNotMatch(run('agent-01BBBBBBBBBBBBBBBBBBBBBBBB',{...base,authorAliases:[]}).errors.join('|'),/self-review/);
 assert.doesNotMatch(run('agent-01CCCCCCCCCCCCCCCCCCCCCCCC',aliased).errors.join('|'),/self-review/);
});
test('dynamic relative imports are followed',()=>{
 const d=tree({'figures.jsx':"const m=()=>import('./lazy.jsx');\n",'lazy.jsx':'export default 1;\n'});
 assert.deepEqual(h(d).files,['src/figures.jsx','src/lazy.jsx']);
 fs.writeFileSync(path.join(d,'figures.jsx'),"const m=()=>import('./gone.jsx');\n");
 assert.match(h(d).errors.join('|'),/missing: gone\.jsx/);
});
test('REAL renderer graph: GC2 closure includes the shared nuclear renderer, core, animation, bidi and the stylesheet, so those edits invalidate GC2 reviews',()=>{
 const r=figuresHashFor('general-chemistry-2',loadPolicy());
 assert.deepEqual(r.errors,[]);
 for(const f of ['figures.jsx','figures-nuclear.jsx','figures-core.jsx','anim-core.jsx','anim-figures.jsx','bidi-react.js','style.css'])assert.ok(r.files.includes('src/'+f),f);
 for(const f of ['package.json','package-lock.json'])assert.ok(r.files.includes(f),f);
});

test('unsupported dependency forms are rejected, not ignored',()=>{
 for(const [name,src] of Object.entries({req:"const a=require('./x.js');",glob:"const m=import.meta.glob('./*.jsx');",url:"const u=new URL('./a.svg',import.meta.url);",dyn:"const n='./x.jsx';import(n);"})){
  const d=tree({'figures.jsx':src+"\n",'x.js':'1','x.jsx':'1'});
  assert.match(h(d).errors.join('|'),/unsupported dependency form/,name);assert.equal(h(d).hash,null);
 }
});
test('css @import and relative url() are followed; extraFiles are pinned and must exist',()=>{
 const d=tree({'figures.jsx':"import './s.css';\n",'s.css':"@import './base.css';\n.a{background:url('./i.svg')}\n",'base.css':'.b{}\n','i.svg':'<svg/>'});
 assert.deepEqual(h(d).files,['src/base.css','src/figures.jsx','src/i.svg','src/s.css']);
 const p2={figureBinding:{gc2:{roots:['figures.jsx'],extraFiles:['package.json']}}};
 const dd=tree({'src/figures.jsx':'export const a=1;\n','package.json':'{}\n'});
 assert.deepEqual(figuresHashFor('gc2',p2,path.join(dd,'src')).errors,[]);
 fs.rmSync(path.join(dd,'package.json'));
 assert.match(figuresHashFor('gc2',p2,path.join(dd,'src')).errors.join('|'),/missing: package\.json/);
});
test('binding errors surface in checkAll even while a review is only pending',async()=>{
 const {checkAll}=await import('../scripts/check-coverage.mjs');
 const {default:catalogue}=await import('#catalogue');
 const pol={...loadPolicy(),figureBinding:{nuclear:{roots:['does-not-exist.jsx']}}};
 const row=checkAll({policy:pol}).find(r=>r.course==='nuclear'&&r.topic==='E5');
 assert.equal(row.status,'fail');assert.match(row.errors.join('|'),/missing: does-not-exist\.jsx/);
});

test('minified import and export-from forms and alias specifiers are classified, not ignored',()=>{
 let d=tree({'figures.jsx':"import{a}from'./m.jsx';export{b}from'./n.jsx';import*as x from'./o.jsx';\n",'m.jsx':'1','n.jsx':'1','o.jsx':'1'});
 assert.deepEqual(h(d).files,['src/figures.jsx','src/m.jsx','src/n.jsx','src/o.jsx']);
 d=tree({'figures.jsx':"import {a} from '#catalogue';\n"});assert.match(h(d).errors.join('|'),/alias\/absolute/);
 d=tree({'figures.jsx':"const n=1;import(`./x-${n}.jsx`);\n"});assert.match(h(d).errors.join('|'),/unsupported dependency form/);
});
test('REAL TREE mutation: one-byte edits in each closure file change the GC2 hash; files outside it do not; the E5 legacy hash follows its own two files only',()=>{
 const real=fileURLToPath(new URL('../src',import.meta.url)),pkg=fileURLToPath(new URL('..',import.meta.url));
 const p=loadPolicy(),id='general-chemistry-2';
 const copy=()=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),'real-'));fs.cpSync(real,path.join(d,'src'),{recursive:true});for(const f of ['package.json','package-lock.json'])fs.copyFileSync(path.join(pkg,f),path.join(d,f));return d};
 const d0=copy();const base=figuresHashFor(id,p,path.join(d0,'src'));assert.deepEqual(base.errors,[]);
 assert.equal(base.hash,figuresHashFor(id,p).hash);
 for(const f of base.files){
  const d=copy();fs.appendFileSync(path.join(d,f),f.endsWith('.json')?'':'\n/* mutation */\n');
  if(f.endsWith('.json')){const t=fs.readFileSync(path.join(d,f),'utf8');fs.writeFileSync(path.join(d,f),t.replace(/\s*$/,'\n\n'))}
  assert.notEqual(figuresHashFor(id,p,path.join(d,'src')).hash,base.hash,f);
 }
 const outside=fs.readdirSync(real).filter(f=>/\.(jsx?|css)$/.test(f)&&!base.files.includes('src/'+f));
 assert.ok(outside.length>0);
 for(const f of outside.slice(0,6)){const d=copy();fs.appendFileSync(path.join(d,'src',f),'\n/* mutation */\n');assert.equal(figuresHashFor(id,p,path.join(d,'src')).hash,base.hash,f)}
 // legacy hash: nuclear course has no binding, hash covers exactly figures-nuclear.jsx + figures.jsx
 assert.equal(figuresHashFor('nuclear',p).hash,figuresHash());
});
test('REAL TREE legacy hash (E5): editing figures.jsx or figures-nuclear.jsx changes it; editing any other file does not',()=>{
 const real=fileURLToPath(new URL('../src',import.meta.url));
 const mk=mut=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),'leg-'));fs.cpSync(real,d,{recursive:true});if(mut)fs.appendFileSync(path.join(d,mut),'\n/* m */\n');return figuresHash(['figures-nuclear.jsx','figures.jsx'].map(f=>path.join(d,f)))};
 const base=mk();assert.equal(base,figuresHash());
 assert.notEqual(mk('figures.jsx'),base);assert.notEqual(mk('figures-nuclear.jsx'),base);
 for(const f of ['anim-core.jsx','figures-core.jsx','style.css'])assert.equal(mk(f),base,f);
});
