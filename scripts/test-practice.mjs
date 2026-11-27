import {reloadDocument} from './browser-page.mjs';
import {buildManifest,toView} from '../src/progress-model.js';
import {sessions as progressSessions} from '../src/practice-sessions.js';
import catalogueSource from '#catalogue';
import {spawn} from 'node:child_process';
import {launchChrome} from './launch-chrome.mjs';
import {createServer} from 'node:http';
import {readFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {bidiElement} from '../src/bidi-react.js';
import {DisplayMath} from '../src/scientific-text.js';

// Real Chromium, local build only: no external network, models, databases or accounts.
const root=path.resolve(new URL('..',import.meta.url).pathname);
const screenshots=process.env.SCREENSHOTS;
if(screenshots)await mkdir(screenshots,{recursive:true});
const data=structuredClone(catalogueSource);
const exact=data.courses[0].topics[0].content.theory.find(p=>p.text?.startsWith('החריגים Cr')).text;
const fixture=renderToStaticMarkup(React.createElement('html',{dir:'rtl',lang:'he'},
 React.createElement('head',null,React.createElement('meta',{charSet:'utf-8'}),React.createElement('style',null,await readFile(path.join(root,'src/style.css'),'utf8')+await readFile(path.join(root,'src/equation-wrap.css'),'utf8'))),
 React.createElement('body',null,React.createElement('article',{className:'theory panel',style:{margin:24}},
 bidiElement('p',{id:'exact'},exact),
 bidiElement('p',null,'נתון: ΔH_vap = 40.7 kJ/mol; T_1 = 300 K; x_A = 0.25; P°_A = 80 kPa'),
 React.createElement('div',{className:'solution',style:{width:250}},bidiElement('p',{id:'temperature'},'ΔT_b=0.512·0.200=0.1024°C, ולכן טמפרטורת הרתיחה עולה.')),
 React.createElement(DisplayMath,{text:'ln(P₂/P₁) = (ΔH_vap/R)·(1/T₁ − 1/T₂)'})))));
const server=createServer(async(req,res)=>{
 if(req.url==='/chemistry/__fixture'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(fixture)}
 try{const file=path.join(root,process.env.DIST_DIR||'dist',decodeURIComponent(req.url.split('?')[0]).replace(/^\/chemistry\//,'')||'index.html');
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Not found')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const profile=await mkdtemp(path.join(tmpdir(),'chem-browser-'));
const {chrome,endpoint}=await launchChrome(profile);
let ws;
try{
 const port=new URL(endpoint).port;
 const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Fetch.requestPaused'){const p=m.params;ws.send(JSON.stringify({id:++id,method:p.request.url.startsWith(origin+'/')?'Fetch.continueRequest':'Fetch.failRequest',params:p.request.url.startsWith(origin+'/')?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'}}));}if(m.method==='Runtime.exceptionThrown')console.error(JSON.stringify(m.params));if(m.id){const [resolve,reject]=pending.get(m.id)||[];pending.delete(m.id);m.error?reject?.(Error(JSON.stringify(m.error))):resolve?.(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,[resolve,reject]);ws.send(JSON.stringify({id:n,method,params}))});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const ready=async selector=>{for(let i=0;i<100;i++){if(await js(`document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`)){await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');return;}await new Promise(r=>setTimeout(r,50))}throw Error('Missing '+selector)};
 const shot=async name=>{if(screenshots){await js(`Promise.all((document.querySelector(".source-popover")?.getAnimations()||[]).map(a=>a.finished.catch(()=>{})))`);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await (await import('node:fs/promises')).writeFile(path.join(screenshots,name+'.png'),Buffer.from(r.data,'base64'))}};
 await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await call('Network.enable');await call('Runtime.enable');await call('Page.enable');await call('Page.addScriptToEvaluateOnNewDocument',{source:`navigator.serviceWorker.register=()=>Promise.reject(new Error('Workers tested by dedicated PWA suite'))`});
 

 const {sessions}=await import('../src/practice-sessions.js');
 for(const width of [320,390,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/chemistry/index.html#course/84102/practice'});await ready('.practice-session-grid');
  assert.equal(await js(`document.querySelectorAll('.practice-session-card').length`),8);
  assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'));
  await shot('practice-sessions-'+width);
  if(width!==390)continue;
  const prior='{"P7":{"complete":true,"score":7,"answers":{"keep":{"correct":true}}}}';
  await js(`localStorage.setItem('spectra-course-84102-progress-v1',${JSON.stringify(prior)})`);
  await reloadDocument(call,js);await ready('.practice-session-grid');
  for(const [si,s] of sessions.entries()){
   await js(`document.querySelectorAll('.practice-session-card button')[${si}].click()`);await ready('.practice-question');
   assert.equal(await js(`document.querySelectorAll('.practice-question').length`),10);
   assert.equal(await js(`document.querySelector('.practice-submit .primary').disabled`),true);
   assert.equal(await js(`document.querySelectorAll('.practice-question .feedback').length`),0,'No key before submit');
   for(let i=0;i<10;i++){
    // First session deliberately includes one wrong answer; others all correct.
    const pick=si===0&&i===0?(s.questions[i].correct+1)%4:s.questions[i].correct;
    await js(`document.querySelectorAll('.practice-question')[${i}].querySelectorAll('.choices button')[${pick}].click()`);
   }
   assert.equal(await js(`document.querySelector('.practice-submit .primary').disabled`),false);
   if(si===0){await js(`document.querySelector('.practice-question').scrollIntoView({block:'start'})`);await shot('practice-question-390');}
   await js(`document.querySelector('.practice-submit .primary').click()`);await ready('.practice-question .feedback');
   assert.ok(await js(`document.querySelector('.practice-counter').textContent.includes('${si===0?'9':'10'}/10')`));
   assert.equal(await js(`document.querySelectorAll('.practice-question .feedback a').length`),10);
   assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'));
   await ready('.progress-state[data-state="saved"]');
   const cache=JSON.parse(await js(`localStorage.getItem('spectra-account-progress-v1:stub-learner:cache')`));
   const stored=toView(cache.records,buildManifest(data.courses.map(c=>({...c,topics:c.topics.map(t=>({...t,...t.content}))})),progressSessions))['84102'];
   assert.equal(await js(`localStorage.getItem('spectra-course-84102-progress-v1')`),prior,'Unowned legacy answers untouched');assert.equal(stored.P7,undefined,'Legacy data not assigned to account');assert.equal(stored._practice[s.id].score,si===0?9:10);
   if(si===0){await js(`document.querySelector('.practice-question .feedback').scrollIntoView({block:'center'})`);await shot('practice-feedback-390');}
   await js(`document.querySelector('.practice-session-heading button').click()`);await ready('.practice-session-grid');
  }
  await reloadDocument(call,js);await ready('.practice-session-grid');assert.equal(await js(`document.querySelectorAll('.practice-saved').length`),8);
  await shot('practice-saved-sessions-390');
  await call('Page.navigate',{url:origin+'/chemistry/index.html#course/84102'});await ready('.action-bar');
  await js(`document.querySelector('.action-bar a[href="#course/84102/practice"]').click()`);await ready('.practice-session-grid');
 }
 console.log('Practice browser PASSED: 320/390/1280 layouts, eight sessions/all80 selections, gated submission, score9/10 and10/10, final explanations and topic links, persisted eight results after reload, existing P7 answers unchanged, course entry.');
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:300})}
