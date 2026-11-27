// Opens every worked solution at 320 and 390 px and fails if any text is clipped by a non-scrolling container or pushes the page wide. Needs: BROWSER_TEST_STUB=1 npx vite build --outDir dist-test. Exits 1 on failure.
import {createServer} from 'node:http';
import {readFile,mkdtemp} from 'node:fs/promises';
import {readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {launchChrome} from './launch-chrome.mjs';
const root=path.resolve(process.env.ROOT||new URL('..',import.meta.url).pathname);
const server=createServer(async(req,res)=>{try{const file=path.join(root,'dist-test',decodeURIComponent(req.url.split('?')[0]).replace(/^\/chemistry\//,'')||'index.html');
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file))}catch{res.statusCode=404;res.end('nf')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const {chrome,endpoint}=await launchChrome(await mkdtemp(path.join(tmpdir(),'chem-browser-')));
const topics=[];for(const c of readdirSync(root+'/src/content')){try{for(const f of readdirSync(`${root}/src/content/${c}/topics`))if(f.endsWith('.json'))topics.push([c,f.slice(0,-5)])}catch{}}
try{
 const port=new URL(endpoint).port;
 const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const [a,b]=pending.get(m.id);pending.delete(m.id);m.error?b(Error(JSON.stringify(m.error))):a(m.result)}});
 const call=(method,params={})=>new Promise((a,b)=>{const n=++id;pending.set(n,[a,b]);ws.send(JSON.stringify({id:n,method,params}))});
 const js=async x=>{const r=await call('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 await call('Runtime.enable');await call('Page.enable');
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`navigator.serviceWorker.register=()=>Promise.reject(new Error('x'))`});
 const SCAN=`(()=>{const bad=[];let scrolls=0,n=0;document.querySelectorAll('.worked').forEach((w,wi)=>{const sol=w.querySelector('.solution');if(!sol)return;n++;
 sol.querySelectorAll('*').forEach(el=>{if(el.closest('.formula-pop,.formula-tip'))return;const r=el.getBoundingClientRect();if(!r.width)return;
  const hasText=[...el.childNodes].some(c=>c.nodeType===3&&c.textContent.trim());if(!hasText&&el.children.length)return;
  for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){const cs=getComputedStyle(a);const ar=a.getBoundingClientRect();
   if(cs.overflowX!=='visible'){if(r.right>ar.right+1||r.left<ar.left-1){if(cs.overflowX==='auto'||cs.overflowX==='scroll'){scrolls++}else bad.push([wi,el.textContent.trim().slice(0,50)])}break}}
  if(r.right>innerWidth+1||r.left<-1){let a=el.parentElement,sc=false;for(;a&&a!==document.body;a=a.parentElement){const o=getComputedStyle(a).overflowX;if(o==='auto'||o==='scroll'){sc=true;break}}if(!sc)bad.push([wi,'PAGE '+el.textContent.trim().slice(0,50)])}
 });
 sol.querySelectorAll('.display-math').forEach(d=>{if(d.scrollWidth>d.clientWidth+1)scrolls+=0});});
 return {n,bad:bad.slice(0,6),badN:bad.length,scrolls,page:document.documentElement.scrollWidth<=innerWidth+1}})()`;
 let tot=0;const bad=[];
 for(const width of [320,390]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
  for(const [c,t] of topics){
   await call('Page.navigate',{url:'about:blank'});await sleep(100);await call('Page.navigate',{url:origin+`/chemistry/index.html#/course/${c}/${t}`});
   let ok=false;for(let i=0;i<60&&!ok;i++){ok=await js(`!!document.querySelector('.theory')`);await sleep(100)}
   if(!ok)continue;
   await js("document.querySelectorAll('.tabs button')[1]?.click()");await sleep(300);
   await js(`document.querySelectorAll('.worked').forEach(e=>{if(!e.querySelector('.solution'))e.querySelector('button')?.click()})`);await sleep(400);
   const r=await js(SCAN);tot+=r.n;
   if(r.badN||!r.page)bad.push(1),console.log('FAIL',width,c,t,JSON.stringify(r));else console.log('ok',width,c,t,'solutions',r.n,'scrollable',r.scrolls);
  }
 }
 console.log('TOTAL solutions scanned',tot);if(bad.length){console.log('FAILED',bad.length);process.exitCode=1}
}finally{chrome.kill();server.close()}
