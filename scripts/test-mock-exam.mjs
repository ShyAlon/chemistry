// Mock-exam browser gates: real Chromium against the local stub build.
// No external network, models, databases or accounts.
import {reloadDocument} from './browser-page.mjs';
import {launchChrome} from './launch-chrome.mjs';
import {createServer} from 'node:http';
import {readFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const screenshots=process.env.SCREENSHOTS;
if(screenshots)await mkdir(screenshots,{recursive:true});
const server=createServer(async(req,res)=>{
 try{const file=path.join(root,process.env.DIST_DIR||'dist',decodeURIComponent(req.url.split('?')[0]).replace(/^\/chemistry\//,'')||'index.html');
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Not found')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const profile=await mkdtemp(path.join(tmpdir(),'chem-mock-'));
const {chrome,endpoint}=await launchChrome(profile);
let ws;
try{
 const port=new URL(endpoint).port;
 const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Fetch.requestPaused'){const p=m.params;ws.send(JSON.stringify({id:++id,method:p.request.url.startsWith(origin+'/')?'Fetch.continueRequest':'Fetch.failRequest',params:p.request.url.startsWith(origin+'/')?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'}}))}if(m.method==='Runtime.exceptionThrown')console.error('PAGE EXCEPTION',m.params.exceptionDetails?.exception?.description||JSON.stringify(m.params).slice(0,1500));if(m.id){const [resolve,reject]=pending.get(m.id)||[];pending.delete(m.id);m.error?reject?.(Error(JSON.stringify(m.error))):resolve?.(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,[resolve,reject]);ws.send(JSON.stringify({id:n,method,params}))});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const ready=async selector=>{for(let i=0;i<100;i++){if(await js(`document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`)){await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');return;}await new Promise(r=>setTimeout(r,50))}throw Error('Missing '+selector+' :: '+(await js('document.body.innerText.slice(0,1200)')))};
 const shot=async name=>{if(screenshots){const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await (await import('node:fs/promises')).writeFile(path.join(screenshots,name+'.png'),Buffer.from(r.data,'base64'))}};
 await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await call('Network.enable');await call('Runtime.enable');await call('Page.enable');
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`navigator.serviceWorker.register=()=>Promise.reject(new Error('Workers tested by dedicated PWA suite'));
window.__setField=(el,v)=>{const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};`});
 const cacheKey='spectra-mock-exam-v1:stub-learner:cache';
 const readAttempt=async()=>{const c=JSON.parse(await js(`localStorage.getItem(${JSON.stringify(cacheKey)})`));const ids=Object.keys(c.attempts);assert.equal(ids.length,1,'one attempt');return c.attempts[ids[0]];};
 const fill=async(qi,pi,value)=>{await js(`window.__setField(document.querySelectorAll('.practice-question')[${qi}].querySelectorAll('.mock-part')[${pi}].querySelector('input,textarea'),${JSON.stringify(String(value))})`)};

 for(const width of [390,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/chemistry/index.html#course/84101'});await ready('.practice-entry');
  await call('Page.navigate',{url:origin+'/chemistry/index.html#course/84101/mock-exam'});await ready('.practice-session-grid');
  assert.ok((await js(`document.querySelectorAll('.practice-session-card').length`))>=1);
  await shot('mock-exam-list-'+width);
  await js(`document.querySelector('.practice-session-card .primary').click()`);await ready('.mock-part');
  assert.equal(await js(`document.querySelectorAll('.practice-question').length`),5,'five questions');
  assert.ok(await js(`document.querySelector('.mock-exam-bar').textContent.includes('שעון')`),'stopwatch shown');
  assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'no horizontal overflow');
  await shot('mock-exam-paper-'+width);
  if(width!==390){await js(`localStorage.clear();sessionStorage.clear()`);continue;}

  // Stopwatch: ticks while running, freezes while paused.
  await new Promise(r=>setTimeout(r,1500));
  const t1=(await readAttempt()).elapsedSec;
  assert.ok(t1>=1,'stopwatch ticks: '+t1);
  await js(`[...document.querySelectorAll('.mock-exam-bar button')].find(b=>b.textContent.includes('השהיית')).click()`);
  await new Promise(r=>setTimeout(r,1500));
  const paused=(await readAttempt()).elapsedSec;
  await new Promise(r=>setTimeout(r,1200));
  assert.equal((await readAttempt()).elapsedSec,paused,'stopwatch frozen while paused');
  await js(`[...document.querySelectorAll('.mock-exam-bar button')].find(b=>b.textContent.includes('הפעלת')).click()`);

  // Answer: every numeric part within 2% except the first numeric at 150%; drafts for concept parts.
  const attempt=await readAttempt();
  let wrongSet=false,numericTotal=0,conceptTotal=0;
  for(const [qi,q] of attempt.questions.entries()){
   for(const [pi,p] of q.parts.entries()){
    if(p.kind==='numeric'){numericTotal++;const v=!wrongSet?p.answer*1.5:p.answer*1.02;wrongSet=true;await fill(qi,pi,v.toPrecision(6));}
    else{conceptTotal++;await fill(qi,pi,'הסבר בדיקה לסעיף ההבנה');}
   }
  }
  await ready('.practice-submit .primary');
  await js(`document.querySelector('.practice-submit .primary').click()`);await ready('.feedback');
  assert.equal(await js(`document.querySelectorAll('.practice-question .feedback').length`),attempt.questions.reduce((n,q)=>n+q.parts.length,0),'feedback on every part');
  // Scientific readability: worked algebra renders as explicit LTR math
  // blocks containing no Hebrew; Hebrew explanation stays in RTL paragraphs.
  assert.ok((await js(`document.querySelectorAll('.feedback p.mock-math[dir="ltr"]').length`))>0,'worked algebra has explicit LTR blocks');
  assert.ok((await js(`[...document.querySelectorAll('.feedback p.mock-math')].every(p=>{const c=p.cloneNode(true);c.querySelectorAll('bdi[dir="rtl"]').forEach(b=>b.remove());return !/[\u0590-\u05ff]/.test(c.textContent);})`)),'Hebrew inside math blocks only as bracketed RTL labels');
  assert.ok((await js(`[...document.querySelectorAll('.feedback p.mock-math')].some(p=>/=/.test(p.textContent))`)),'math blocks carry equations');
  assert.ok((await js(`[...document.querySelectorAll('.feedback p:not(.mock-math)')].some(p=>/[\u0590-\u05ff]/.test(p.textContent))`)),'Hebrew explanation in prose paragraphs');
  const expectAuto=numericTotal-1,expectSelf=conceptTotal-1,total=numericTotal+conceptTotal;
  const expectPercent=Math.round(100*(expectAuto+expectSelf)/total);
  const bar=async()=>await js(`document.querySelector('.mock-exam-bar').textContent`);
  assert.ok((await bar()).includes(`${expectAuto}/${numericTotal}`),'auto split before self-marking: '+await bar());
  assert.ok((await bar()).includes(`ממתינים לסימון: ${conceptTotal}`),'pending count before self-marking: '+await bar());
  assert.ok((await bar()).includes('הציון זמני'),'provisional marker before self-marking');
  await shot('mock-exam-solutions-390');
  // Decisive captures: a numeric solution block and a model-answer block with its controls.
  await js(`document.querySelector('.practice-question .feedback').scrollIntoView({block:'center'})`);
  await new Promise(r=>setTimeout(r,150));
  await shot('mock-exam-feedback-390');
  await js(`[...document.querySelectorAll('.feedback')].find(f=>f.textContent.includes('תשובת מודל')).scrollIntoView({block:'center'})`);
  await new Promise(r=>setTimeout(r,150));
  await shot('mock-exam-model-answer-390');
  // Self-marking: first concept part marked wrong, the rest right.
  let marked=false;
  for(const [qi,q] of attempt.questions.entries()){
   for(const [pi,p] of q.parts.entries()){
    if(p.kind!=='concept')continue;
    const wantRight=marked;marked=true;
    await js(`[...document.querySelectorAll('.practice-question')[${qi}].querySelectorAll('.mock-part')[${pi}].querySelectorAll('.choices button')].find(b=>b.textContent.includes(${JSON.stringify(wantRight?'צדקתי':'טעיתי')})).click()`);
   }
  }
  await new Promise(r=>setTimeout(r,300));
  const barText=await bar();
  assert.ok(barText.includes(`${expectPercent}%`),'percent '+expectPercent+' in '+barText);
  assert.ok(barText.includes(`${expectSelf}/${conceptTotal}`),'self split');
  assert.ok(!barText.includes('ממתינים לסימון'),'no pending note once all self-marked');
  await shot('mock-exam-selfmarked-390');

  // Persistence across reload: listed with percent; reopening shows feedback.
  await reloadDocument(call,js);await ready('.practice-session-grid');
  const cards=await js(`[...document.querySelectorAll('.practice-session-card')].map(c=>c.textContent)`);
  assert.ok(cards.some(c=>c.includes(`${expectPercent}%`)),'submitted attempt listed with percent');
  assert.ok(cards.some(c=>c.includes('נשמר עד')),'history card shows retention date');
  await js(`[...document.querySelectorAll('.practice-session-card')].find(c=>c.textContent.includes('הוגש')).scrollIntoView({block:'center'})`);
  await new Promise(r=>setTimeout(r,150));
  await shot('mock-exam-history-390');
  await js(`[...document.querySelectorAll('.practice-session-card button')].find(b=>b.textContent.includes('צפייה')||b.textContent.includes('השלמת')).click()`);
  await ready('.feedback');
  assert.ok((await js(`document.querySelector('.mock-exam-bar').textContent`)).includes(`${expectPercent}%`),'score persists after reload');
  await shot('mock-exam-reviewed-390');

  // Desktop: same reviewed solutions keep expression-level isolation.
  await call('Emulation.setDeviceMetricsOverride',{width:1280,height:844,deviceScaleFactor:1,mobile:false});
  await new Promise(r=>setTimeout(r,200));
  assert.ok((await js(`[...document.querySelectorAll('.feedback p.mock-math')].every(p=>{const c=p.cloneNode(true);c.querySelectorAll('bdi[dir="rtl"]').forEach(b=>b.remove());return !/[\u0590-\u05ff]/.test(c.textContent);})`)),'desktop: Hebrew only as bracketed RTL labels');
  assert.ok((await js(`document.querySelectorAll('.feedback p.mock-math[dir="ltr"]').length`))>0,'desktop: explicit LTR math blocks');
  await js(`document.querySelector('.practice-question .feedback').scrollIntoView({block:'center'})`);
  await new Promise(r=>setTimeout(r,150));
  await shot('mock-exam-feedback-1280');

  // 320px: equations must stay readable without horizontal overflow.
  await call('Emulation.setDeviceMetricsOverride',{width:320,height:844,deviceScaleFactor:1,mobile:false});
  await new Promise(r=>setTimeout(r,200));
  assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),'320: no horizontal overflow');
  await js(`document.querySelector('.practice-question .feedback').scrollIntoView({block:'center'})`);
  await new Promise(r=>setTimeout(r,150));
  await shot('mock-exam-feedback-320');
 }
 console.log('Mock-exam browser PASSED: list/paper 390+1280 layouts, five questions, stopwatch run/pause/freeze, auto-marked 5% tolerance split, self-marked concept split, percent, persistence after reload.');
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:300})}
