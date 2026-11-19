import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
let edition=1,offline=false,requests=0,failInstall=false;
const root=path.resolve('dist'),out=process.env.PAPER_SCREENSHOTS;
if(out)await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
 requests++;
 if(offline){res.statusCode=503;return res.end('Offline test')}
 try{
  let file=decodeURIComponent(req.url.split('?')[0]).replace(/^\/chemistry\//,'')||'index.html';
  if(failInstall&&file.startsWith('orbitals/')&&file.endsWith('.png')){res.statusCode=503;return res.end('Interrupted update')}
  let body=await readFile(path.join(root,file));
  if(file==='sw.js')body=Buffer.from(body.toString().replace(/const VERSION=(.+);/,`const VERSION=$1+'-test${edition}';`));
  if(file==='index.html')body=Buffer.from(body.toString().replace('</head>',`<meta name="test-edition" content="${edition}"/></head>`));
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');res.end(body);
 }catch{res.statusCode=404;res.end('Not found')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const profile=await mkdtemp(path.join(tmpdir(),'chem-pwa-'));
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless','--no-sandbox','--disable-gpu','--remote-allow-origins=*','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let ws,id=0;const pending=new Map();
try{
 const endpoint=await new Promise((resolve,reject)=>{let t='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);chrome.stderr.on('data',x=>{t+=x;const m=t.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1])}})});
 const tabs=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const [resolve,reject]=pending.get(m.id)||[];pending.delete(m.id);m.error?reject?.(Error(JSON.stringify(m.error))):resolve?.(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,[resolve,reject]);ws.send(JSON.stringify({id:n,method,params}))});
 const js=async expression=>{if(!expression.includes(';'))expression='return ('+expression+')';const r=await call('Runtime.evaluate',{expression:'(async()=>{'+expression+'})()',returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const wait=async condition=>{for(let i=0;i<200;i++){if(await js(condition))return;await new Promise(r=>setTimeout(r,50))}throw Error('Not ready: '+condition+' '+await js('JSON.stringify({url:location.href,text:document.body.innerText.slice(0,1000),cells:document.querySelectorAll(".pt-cell").length})'))};
 const navigate=async hash=>{await call('Page.navigate',{url:origin+'/chemistry/'+hash});await wait(`document.readyState==='complete'&&!!document.querySelector('.header')`)};
 const shot=async name=>{if(out)await writeFile(path.join(out,name+'.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'))};
 await call('Network.enable');await call('Runtime.enable');await call('Page.enable');
 const errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params)});
 const geometry=async()=>{const g=await js(`({w:innerWidth,scroll:document.documentElement.scrollWidth,footer:document.querySelector('.site-footer').getBoundingClientRect().bottom,height:innerHeight})`);assert.ok(g.scroll<=g.w+1,JSON.stringify(g));assert.ok(Math.abs(g.footer-g.height)<2,JSON.stringify(g))};
 const clickTab=async n=>{await js(`document.querySelectorAll('.paper-tabs button')[${n}].click();true`);await wait(`document.querySelectorAll('.paper-tabs button')[${n}].getAttribute('aria-current')==='step'`)};
 const stored='{"N3":{"answers":{},"complete":true,"score":7}}';
 for(const width of [320,390,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
  await navigate('#course/nano');await wait(`!!document.querySelector('.paper-entry')`);await geometry();await js(`document.querySelector('.paper-entry').scrollIntoView({block:'center'});true`);await shot('nano-map-'+width);
  assert.equal(await js(`document.querySelectorAll('.topic-card').length`),12);
  await js(`localStorage.setItem('spectra-course-nano-progress-v1',${JSON.stringify(stored)});true`);
  for(const id of ['shape-2026','pbse-2017']){
   await navigate('#course/nano');await wait(`!!document.querySelector('.paper-entry')`);await js(`document.querySelector('.paper-entry a[href="#course/nano/papers/${id}"]').click();true`);await wait(`!!document.querySelector('.paper-reading')`);await geometry();await shot(id+'-reading-'+width);
   assert.equal(await js(`document.querySelector('.paper-page').textContent.includes('פוטון נפלט')`),false);
   assert.ok(await js(`document.querySelectorAll('.paper-section').length>=11`));
   await js(`document.querySelector('.paper-mechanism').scrollIntoView({block:'center'});true`);await shot(id+'-diagram-'+width);
   await js(`document.querySelector('.paper-hero .source-trigger').click();true`);await wait(`!!document.querySelector('.source-popover')`);
   assert.ok(await js(`document.querySelector('.source-popover a').href.startsWith('https://')`));
   await js(`document.querySelector('.source-close').click();true`);
   await clickTab(1);await wait(`document.querySelectorAll('.paper-evidence').length===4`);await geometry();await shot(id+'-evidence-'+width);
   const details=await js(`document.querySelectorAll('.paper-example-list details').length`);assert.ok(details>=3);
   for(let i=0;i<details;i++){await js(`document.querySelectorAll('.paper-example-list details')[${i}].open=true;true`);assert.ok(await js(`document.querySelectorAll('.paper-example-list details')[${i}].textContent.length>100`))}
   await clickTab(2);await wait(`!!document.querySelector('.paper-oral')`);await geometry();
   for(let i=0;i<10;i++){
    await js(`document.querySelectorAll('.paper-oral .question-steps button')[${i}].click();true`);await wait(`document.querySelectorAll('.paper-oral .question-steps button')[${i}].getAttribute('aria-current')==='step'`);
    assert.equal(await js(`document.querySelector('.paper-reveal').getAttribute('aria-expanded')`),'false');
    await js(`document.querySelector('.paper-reveal').click();true`);await wait(`!!document.querySelector('[aria-label="נקודות בדיקה"]')`);
    assert.ok(await js(`document.querySelector('[aria-label="נקודות בדיקה"]').textContent.includes('שאלת המשך לתרגול')`));
   }
   await js(`document.querySelector('.paper-question').scrollIntoView({block:'start'});true`);await shot(id+'-oral-'+width);
   assert.equal(await js(`localStorage.getItem('spectra-course-nano-progress-v1')`),stored);
  }
 }
 // A genuine service worker precache and network-offline reload, not structural inference.
 await wait(`!!navigator.serviceWorker.controller`);await wait(`document.querySelector('.pwa-status')?.textContent.includes('מוכן')`);
 offline=true;await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 for(const id of ['shape-2026','pbse-2017']){
  await navigate('#course/nano/papers/'+id);await wait(`!!document.querySelector('.paper-reading')`);await clickTab(1);await wait(`document.querySelectorAll('.paper-evidence').length===4`);await clickTab(2);await js(`document.querySelector('.paper-reveal').click();true`);await wait(`!!document.querySelector('[aria-label="נקודות בדיקה"]')`);
  assert.equal(await js(`localStorage.getItem('spectra-course-nano-progress-v1')`),stored);
 }
 assert.deepEqual(errors,[],'No runtime exceptions on paper journeys');
 console.log('PAPERS PASSED: both selected routes; mobile+desktop; all 20 oral reveals; all figure stations and worked answers; source tooltips; unchanged 12-topic progress; no overflow; real service-worker offline reloads and oral flow.');
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:300})}
