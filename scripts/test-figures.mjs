// Figure geometry guard: renders every registered didactic figure and checks
// its real SVG layout against explicit declarations.
//
// What it enforces, per figure (see scripts/figure-geometry-manifest.json):
//  1. Declared label/box associations hold: each declared label's rendered text
//     sits fully inside its declared box (1px tolerance). The association is
//     explicit in the manifest; the guard never infers a label's box.
//  2. No undeclared boxed labels: any text whose center lands inside some rect
//     must have a declared association, so new labels force a manifest review.
//  3. No partial box overlaps: two rects that intersect without one containing
//     the other fail, unless the pair is declared in allowOverlaps.
//  4. No undeclared containment: a rect fully containing another rect fails
//     unless the figure declares allowContainment (intentional nested panels).
//
// --generate-manifest seeds the manifest from the current render (smallest
// containing rect per boxed text). Its output must be reviewed before commit.
import {createServer} from 'node:http';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {launchChrome} from './launch-chrome.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const manifestPath=path.join(here,'figure-geometry-manifest.json');
const generate=process.argv.includes('--generate-manifest');

const out=await mkdtemp(path.join(tmpdir(),'chem-fig-build-'));
await new Promise((resolve,reject)=>{const p=spawn(path.join(here,'../node_modules/.bin/vite'),['build','--config',path.join(here,'figure-geometry/vite.config.mjs')],{env:{...process.env,FIG_PROBE_OUT:out},stdio:['ignore','ignore','inherit']});p.on('exit',c=>c===0?resolve():reject(Error('probe build failed')));});

const server=createServer(async(req,res)=>{try{let p=path.join(out,new URL(req.url,'http://local').pathname);if(p.endsWith('/'))p+='probe.html';res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'})[path.extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const profile=await mkdtemp(path.join(tmpdir(),'chem-fig-guard-'));
const {chrome,endpoint}=await launchChrome(profile);let ws;
try{
 const tabs=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const pair=pending.get(m.id);pending.delete(m.id);if(pair)m.error?pair[1](Error(JSON.stringify(m.error))):pair[0](m.result);}});
 const call=(m,p={})=>new Promise((a,b)=>{const n=++id;pending.set(n,[a,b]);ws.send(JSON.stringify({id:n,method:m,params:p}))});
 const js=async e=>{const r=await call('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');
 await call('Page.navigate',{url:origin+'/probe.html'});
 for(let i=0;i<240;i++){if(await js('window.__figureIds&&document.querySelectorAll("[data-fig] svg").length===window.__figureIds.length'))break;await new Promise(r=>setTimeout(r,50));}
 await js('document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))');
 const figures=await js(`(()=>{const out={};for(const sec of document.querySelectorAll('[data-fig]')){const svg=sec.querySelector('svg');
  out[sec.dataset.fig]={
   rects:[...svg.querySelectorAll('rect')].map(r=>{const b=r.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}}),
   texts:[...svg.querySelectorAll('text')].map(t=>{const b=t.getBoundingClientRect();return {text:t.textContent,x:b.x,y:b.y,w:b.width,h:b.height}})};}
  return out;})()`);

 const inside=(t,r,tol=0)=>t.x>=r.x-tol&&t.y>=r.y-tol&&t.x+t.w<=r.x+r.w+tol&&t.y+t.h<=r.y+r.h+tol;
 const centerIn=(t,r)=>{const cx=t.x+t.w/2,cy=t.y+t.h/2;return cx>=r.x&&cx<=r.x+r.w&&cy>=r.y&&cy<=r.y+r.h;};
 const overlap=(a,b)=>({ox:Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),oy:Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)});
 const contains=(a,b,tol=1)=>b.x>=a.x-tol&&b.y>=a.y-tol&&b.x+b.w<=a.x+a.w+tol&&b.y+b.h<=a.y+a.h+tol;

 if(generate){
  const manifest={};
  for(const [fig,{rects,texts}] of Object.entries(figures)){
   const labels=[];
   for(const t of texts){
    const holders=rects.map((r,i)=>({r,i})).filter(({r})=>centerIn(t,r));
    if(!holders.length)continue;
    holders.sort((a,b)=>a.r.w*a.r.h-b.r.w*b.r.h);
    labels.push({text:t.text,box:holders[0].i});
   }
   const nested=rects.some((a,i)=>rects.some((b,j)=>i!==j&&contains(a,b)));
   manifest[fig]={labels,allowContainment:nested,allowOverlaps:[]};
  }
  await writeFile(manifestPath,JSON.stringify(manifest,null,1)+'\n');
  console.log(`Wrote ${manifestPath} for ${Object.keys(manifest).length} figures. Review before commit.`);
 }else{
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  const failures=[];
  for(const [fig,decl] of Object.entries(manifest)){
   const g=figures[fig];
   if(!g){failures.push(`${fig}: in manifest but not rendered`);continue;}
   for(const {text,box} of decl.labels){
    if(box>=g.rects.length){failures.push(`${fig}: declared box ${box} for "${text}" out of range (${g.rects.length} rects)`);continue;}
    const r=g.rects[box];
    // A declaration names text and box; when the same text appears several
    // times (e.g. repeated units), the declared box picks which one is meant.
    const matches=g.texts.filter(t=>t.text===text&&centerIn(t,r));
    if(!matches.length){failures.push(`${fig}: association broken, no label "${text}" centered inside its declared box ${box}`);continue;}
    for(const t of matches)if(!inside(t,r,1))failures.push(`${fig}: label "${text}" overflows its declared box`);
   }
   // undeclared boxed labels
   for(const t of g.texts){
    const holders=g.rects.map((r,i)=>({r,i})).filter(({r})=>centerIn(t,r));
    if(holders.length&&!decl.labels.some(l=>l.text===t.text&&l.box<g.rects.length&&centerIn(t,g.rects[l.box])))failures.push(`${fig}: undeclared boxed label "${t.text}" (add an explicit association to the manifest)`);
   }
   // overlaps
   for(let i=0;i<g.rects.length;i++)for(let j=i+1;j<g.rects.length;j++){
    const a=g.rects[i],b=g.rects[j];const {ox,oy}=overlap(a,b);
    if(ox<=2||oy<=2)continue;
    if(contains(a,b)||contains(b,a)){if(!decl.allowContainment)failures.push(`${fig}: undeclared containment between boxes ${i} and ${j}`);continue;}
    const allowed=(decl.allowOverlaps||[]).some(([x,y])=>(x===i&&y===j)||(x===j&&y===i));
    if(!allowed)failures.push(`${fig}: boxes ${i} and ${j} partially overlap (${Math.round(ox)}x${Math.round(oy)}px)`);
   }
  }
  for(const fig of Object.keys(figures))if(!manifest[fig])failures.push(`${fig}: rendered but missing from manifest (run --generate-manifest and review)`);
  if(failures.length){console.error('Figure geometry failures:\n'+failures.map(f=>' - '+f).join('\n'));process.exit(1);}
  console.log(`Figure geometry OK: ${Object.keys(figures).length} figures match their declared layout.`);
 }
}finally{ws?.close();chrome.kill('SIGKILL');await new Promise(res=>{if(chrome.exitCode!==null||chrome.signalCode!==null)return res();chrome.once('exit',res);setTimeout(res,3000).unref();});server.close();await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});await rm(out,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
