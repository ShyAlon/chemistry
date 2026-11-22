import {launchChrome} from './launch-chrome.mjs';
import {createServer} from 'node:http';
import {readFile,mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const out=process.env.SCREENSHOTS||path.join(tmpdir(),'interactive-formula-review');await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=path.join(root,'dist-test',decodeURIComponent(req.url.split('?')[0]).replace(/^\/chemistry\//,'')||'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.pdf':'application/pdf','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const profile=await mkdtemp(path.join(tmpdir(),'chem-companion-'));const {chrome,endpoint}=await launchChrome(profile);let ws;
try{
 const tabs=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();const errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Fetch.requestPaused'){const p=m.params,ok=p.request.url.startsWith(origin+'/');ws.send(JSON.stringify({id:++id,method:ok?'Fetch.continueRequest':'Fetch.failRequest',params:ok?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'}}))}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);if(m.id){const [resolve,reject]=pending.get(m.id)||[];pending.delete(m.id);m.error?reject?.(Error(JSON.stringify(m.error))):resolve?.(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,[resolve,reject]);ws.send(JSON.stringify({id:n,method,params}))});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const ready=async selector=>{for(let i=0;i<100;i++){if(await js(`document.readyState==='complete'&&!!document.querySelector(${JSON.stringify(selector)})`)){await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');return}await new Promise(r=>setTimeout(r,50))}console.error('Browser state',await js('({body:document.body.innerText,url:location.href})'),errors);await shot('failure');throw Error('Missing '+selector)};
 const shot=async name=>{const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(out,name+'.png'),Buffer.from(r.data,'base64'))};
 await call('Page.enable');await call('Runtime.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});await call('Page.addScriptToEvaluateOnNewDocument',{source:`navigator.serviceWorker.register=()=>Promise.reject(new Error('Workers tested separately'))`});
 await call('Page.bringToFront');
 const checks=[];
 for(const width of [320,390,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/chemistry/index.html#/references/chemistry1-sheet'});await ready('[data-sheet-formula]');
  assert.equal(await js(`document.querySelectorAll('[data-sheet-formula]').length`),29);
  assert.ok(await js(`document.documentElement.scrollWidth<=innerWidth+1`));
  assert.equal(await js(`document.querySelectorAll('a[href$=".pdf"],img[src*="formula-sheet"]').length`),0);
  if(width===390||width===1280){await shot('interactive-intro-'+width);for(const id of ['gases','real-gases','solutions','constants']){await js(`document.getElementById('professor-${id}').scrollIntoView();new Promise(r=>requestAnimationFrame(r))`);await shot('interactive-'+id+'-'+width);await js(`document.getElementById('professor-${id}').lastElementChild.lastElementChild.scrollIntoView({block:'center'});new Promise(r=>requestAnimationFrame(r))`);await shot('interactive-'+id+'-end-'+width)}}
  if(width===390||width===1280){await js(`document.querySelector('[data-sheet-formula="avogadro"]').scrollIntoView({block:'center'});new Promise(r=>requestAnimationFrame(r))`);await shot('interactive-avogadro-'+width)}
  await js(`document.querySelector('[data-sheet-formula="mean-free-pressure"] .display-math').focus();new Promise(r=>requestAnimationFrame(r))`);await ready('.formula-tip.open');assert.ok(await js(`document.querySelector('.formula-tip.open').textContent.includes('קוטר')`));
  await js(`Promise.all([...document.querySelectorAll('.formula-pop')].flatMap(e=>e.getAnimations()).map(a=>a.finished.catch(()=>{})))`);if(width===390||width===1280)await shot('interactive-symbols-'+width);
  await js(`document.querySelector('.formula-tip.open .display-math').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));document.querySelector('.professor-formulas .back').click()`);await ready('.formula-grid');
  assert.ok(await js(`document.querySelector('[role=tab][aria-selected=true]').textContent.includes('כימיה כללית')`));
  checks.push({width,formulas:29,overflow:false});
 }
 assert.deepEqual(errors,[]);console.log('PASS interactive professor sheet',JSON.stringify(checks));await writeFile(path.join(out,'interactive-checks.json'),JSON.stringify(checks,null,2));

}finally{ws?.close();server.close();await new Promise(resolve=>{if(chrome.exitCode!==null)return resolve();chrome.once('exit',resolve);chrome.kill('SIGKILL')});await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100})}
