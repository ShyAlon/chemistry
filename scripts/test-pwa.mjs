import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
let edition=1,offline=false,requests=0,failInstall=false;
const root=path.resolve('dist'),out=process.env.PWA_SCREENSHOTS;
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
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await navigate('');await wait(`!!navigator.serviceWorker.controller`);
 await wait(`document.querySelector('.pwa-status').textContent.includes('מוכן')`);
 const initial=await js(`({keys:await caches.keys(),scope:(await navigator.serviceWorker.getRegistration()).scope,entries:(await(await caches.open((await caches.keys())[0])).keys()).map(r=>r.url)})`);
 assert.equal(initial.scope,origin+'/chemistry/');assert.ok(initial.entries.some(e=>e.includes('ion-data')),'Lazy ion bundle precached');assert.ok(initial.entries.some(e=>e.includes('orbitals/')));
 const progress='{"P7":{"answers":{},"complete":true,"score":5}}';
 await js(`localStorage.setItem('spectra-course-84102-progress-v1',${JSON.stringify(progress)});document.querySelector('.pwa-controls details').open=true;document.querySelector('.pwa-controls').scrollIntoView({block:'center'})`);
 await shot('iphone-install-offline-ready');
 offline=true;
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await navigate('#course/84102/P7');assert.ok(await js(`document.querySelector('.theory').textContent.length>100`));
 await navigate('#references/periodic');await wait(`document.querySelectorAll('.pt-cell[aria-label]').length===118`);
 await navigate('#references/formulas');await wait(`!!document.querySelector('#ref-P9')`);
 await js(`document.querySelector('.formula-print-tool details').open=true;document.querySelector('.formula-print-tool details .primary').click()`);await wait(`document.querySelectorAll('.fp-paper').length===2`);
 assert.equal(await js(`document.querySelector('.fp-toolbar .primary').disabled`),false);
 await js(`document.querySelectorAll('.ref-tabs button')[1].click()`);await wait(`!!document.querySelector('#ref-G16')`);
 assert.equal(await js(`localStorage.getItem('spectra-course-84102-progress-v1')`),progress);
 await js(`document.querySelector('.pwa-controls details').open=true;document.querySelector('.pwa-controls').scrollIntoView({block:'center'})`);await shot('iphone-offline-status');
 offline=false;edition=2;await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await js(`(await navigator.serviceWorker.getRegistration()).update()`);await wait(`!!document.querySelector('.pwa-update')`);
 assert.equal(await js(`document.querySelector('meta[name=test-edition]').content`),'1','Update cannot reload current study session');
 await js(`document.querySelector('.pwa-controls details').open=false;document.querySelector('.pwa-update').scrollIntoView({block:'center'})`);await shot('iphone-update-offer');
 ws.addEventListener('message',e=>{if(JSON.parse(e.data).method==='Page.javascriptDialogOpening')call('Page.handleJavaScriptDialog',{accept:true})});
 await js(`document.querySelector('.pwa-update button').click();true`).catch(()=>{});
 await wait(`document.querySelector('meta[name=test-edition]')?.content==='2'`);await wait(`!!document.querySelector('.header')`);
 assert.equal(await js(`localStorage.getItem('spectra-course-84102-progress-v1')`),progress,'Update must preserve progress');
 assert.equal(await js(`document.querySelectorAll('.formula-shortcut').length`),1,'Pending formula changes not included');
 await js(`caches.open('unrelated-test')`);edition=3;failInstall=true;
 await js(`const reg=await navigator.serviceWorker.getRegistration();reg.addEventListener('updatefound',()=>{window.failedWorker=reg.installing},{once:true});await reg.update();`);
 await wait(`window.failedWorker?.state==='redundant'`);
 assert.ok(!(await js(`await caches.keys()`)).some(k=>k.endsWith('-test3')),'Failed update must remove its partial cache');
 assert.ok((await js(`await caches.keys()`)).includes('unrelated-test'),'Do not touch unrelated caches');
 assert.equal(await js(`document.querySelector('meta[name=test-edition]').content`),'2');
 assert.equal(await js(`localStorage.getItem('spectra-course-84102-progress-v1')`),progress);
 console.log('PWA PASSED: scoped complete precache, lazy bundles/images, first install readiness, offline reloads and both-course references/printing, update waits for explicit approval, activated new edition, progress unchanged. Requests:',requests);
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:300})}
