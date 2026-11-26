import {reloadDocument} from './browser-page.mjs';
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
import {resolveConstants} from '../src/constants.js';

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
let ws;const exceptions=[];
try{
 const port=new URL(endpoint).port;
 const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Fetch.requestPaused'){const p=m.params;ws.send(JSON.stringify({id:++id,method:p.request.url.startsWith(origin+'/')?'Fetch.continueRequest':'Fetch.failRequest',params:p.request.url.startsWith(origin+'/')?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'}}));}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params);if(m.id){const [resolve,reject]=pending.get(m.id)||[];pending.delete(m.id);m.error?reject?.(Error(JSON.stringify(m.error))):resolve?.(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,[resolve,reject]);ws.send(JSON.stringify({id:n,method,params}))});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const ready=async selector=>{for(let i=0;i<100;i++){if(await js(`document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`)){await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');return;}await new Promise(r=>setTimeout(r,50))}throw Error('Missing '+selector)};

 const shot=async name=>{if(screenshots){await js(`Promise.all((document.querySelector(".source-popover")?.getAnimations()||[]).map(a=>a.finished.catch(()=>{})))`);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await (await import('node:fs/promises')).writeFile(path.join(screenshots,name+'.png'),Buffer.from(r.data,'base64'))}};
 await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await call('Network.enable');await call('Runtime.enable');await call('Page.enable');await call('Page.addScriptToEvaluateOnNewDocument',{source:`navigator.serviceWorker.register=()=>Promise.reject(new Error('Workers tested by dedicated PWA suite'))`});
 

// Appended to the shared local-only Chromium harness by the construction step.
 const {finalPrep84101:layer,finalPrepExam:problems}=await import('../src/final-prep-84101.js');
 const prior=JSON.stringify({G1:{complete:true,answers:{1:{correct:true}}},G10:{complete:true,score:2,answers:{2:{correct:true}}},G15:{answers:{1:{correct:true}}}});
 const assertWidth=async label=>assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+1'),label+' page overflow');
 for(const [width,height] of [[1280,900],[390,844],[320,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/chemistry/index.html#course/84101'});await ready('.action-bar');
  await js(`localStorage.setItem('spectra-course-84101-progress-v1',${JSON.stringify(prior)})`);
  await reloadDocument(call,js);await ready('.action-bar');
  await js(`document.querySelector('.action-bar a[href="#course/84101/practice"]').click()`);await ready('.practice-session-grid');
  assert.equal(await js(`document.querySelectorAll('.practice-session-card').length`),16);
  assert.ok(await js(`document.querySelector('.practice-session-card h2').textContent.includes('אותו משקל')`));
  await assertWidth('exam list '+width);await shot('final-prep-exam-list-'+width);
  for(const p of problems){
   await js(`Array.from(document.querySelectorAll('.practice-session-card')).find(c=>c.querySelector('h2').textContent===${JSON.stringify(p.title)}).querySelector('button').click()`);await ready('.exam-given');
   assert.equal(await js(`document.querySelectorAll('.exam-part').length`),3);
   assert.equal(await js(`document.querySelectorAll('.exam-part .solution').length`),0,'solutions hidden before attempt');
   for(let i=0;i<3;i++){
    await js(`document.querySelectorAll('.exam-part > button')[${i}].click()`);await ready('.solution');
    const text=await js(`document.querySelectorAll('.exam-part .solution')[${i}].textContent`);assert.ok(text.length>20,p.id+' solution '+i);
   }
   await assertWidth(p.id+' '+width);
   assert.ok(await js(`Array.from(document.querySelectorAll('.solution .display-math')).every(e=>getComputedStyle(e).direction==='ltr'&&getComputedStyle(e).overflowX==='auto'&&(${width}>600?getComputedStyle(e).whiteSpace==='nowrap':e.querySelector('.math-fraction')||getComputedStyle(e).whiteSpace==='normal'))`),'authored calculations stay LTR, scrollable on desktop and wrapped on a phone');
   if(p.id==='E10'&&width!==320){await js(`document.querySelector('.exam-part').scrollIntoView({block:'start'});scrollBy(0,-100)`);await shot('final-prep-inverse-solution-'+width);await js(`document.querySelectorAll('.exam-part')[1].scrollIntoView({block:'start'});scrollBy(0,-100)`);await shot('final-prep-inverse-check-'+width);}
   await js(`document.querySelector('.practice-session-heading button').click()`);await ready('.practice-session-grid');
  }
  for(const [id,add] of Object.entries(layer)){
   await call('Page.navigate',{url:origin+'/chemistry/index.html#course/84101/'+id});await ready('.theory');
   assert.ok(await js(`document.querySelector('.theory').textContent.includes('הכנה למבחן')`));
   for(const b of add.theory){
    if(b.layout==='equation')assert.ok(await js(`Array.from(document.querySelectorAll('.display-math')).some(e=>e.textContent.normalize('NFC').includes(${JSON.stringify(resolveConstants(b.text).split('    ')[0].replaceAll('_','').normalize('NFC'))}))`),'equation rendered '+id+' '+b.text+'; actual: '+await js(`Array.from(document.querySelectorAll('.display-math')).map(e=>e.textContent).join('|')`));
   }
   await assertWidth(id+' theory '+width);
   if(id==='G10'){
    await js(`Array.from(document.querySelectorAll('.theory h3')).find(e=>e.textContent.startsWith('הכנה למבחן')).scrollIntoView({block:'start'});scrollBy(0,-110)`);await shot('final-prep-real-gas-theory-'+width);
    await js(`document.querySelector('svg[aria-label^="Calculated van der Waals"]').closest('figure').scrollIntoView({block:'center'})`);await shot('final-prep-boyle-figure-'+width);
    await assertWidth('figure '+width);
   }
   await js(`document.querySelectorAll('.tabs button')[1].click()`);await ready('.worked');
   for(const ex of add.worked){
    await js(`Array.from(document.querySelectorAll('.worked')).find(e=>e.querySelector('h3').textContent===${JSON.stringify(ex.title)}).querySelector('button').click()`);
   }
   assert.equal(await js(`document.querySelectorAll('.worked .solution').length`),add.worked.length);
   await assertWidth(id+' worked '+width);
   if(width<=600)assert.deepEqual(await js(`Array.from(document.querySelectorAll('.worked .solution .display-math')).filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent.slice(0,40))`),[],id+' worked equations are clipped at '+width);
   if(width<=600){const tok=await js(`(()=>{const t=Array.from(document.querySelectorAll('.worked .solution .display-math .math-token'));return {n:t.length,split:t.filter(e=>e.getClientRects().length>1||!/\\d|sub/.test(e.innerHTML)).map(e=>e.textContent),numeric:t.filter(e=>/^[+−-]?\\d/.test(e.textContent)).length}})()`);assert.ok(tok.n>0,id+' worked equations have no number tokens at '+width);assert.deepEqual(tok.split,[],id+' a number or symbol+subscript token wraps at '+width)}
   if(id==='G15'&&width===390){await js(`Array.from(document.querySelectorAll('.worked')).find(e=>e.querySelector('h3').textContent.includes('פירוק שניוני')).querySelector('.solution').scrollIntoView({block:'start'});scrollBy(0,-110)`);await shot('final-prep-solution-particles-390');}
   // Submit a fresh new numeric question through the real controls and verify storage on reload.
   if(width===390){
    await js(`document.querySelectorAll('.tabs button')[2].click()`);await ready('.question');
    const q=add.quiz.find(q=>q.type==='numeric');
    const all=structuredClone(catalogueSource).courses.find(c=>c.id==='84101').topics.find(t=>t.id===id).content.quiz;
    const qi=all.findIndex(x=>x.id===q.id);
    await js(`document.querySelectorAll('.question-steps button')[${qi}].click()`);await ready('.numeric-fields');
    await js(`(()=>{const el=document.querySelector('.numeric-fields input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(String(q.fields[0].value))});el.dispatchEvent(new Event('input',{bubbles:true}));const select=document.querySelector('.numeric-fields select');select.value=${JSON.stringify(q.fields[0].unit)};select.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    await js('new Promise(r=>requestAnimationFrame(r))');
    assert.equal(await js(`document.querySelector('.check-answer').disabled`),false);
    await js(`document.querySelector('.check-answer').click()`);await ready('.feedback.correct');
    await ready('.progress-state[data-state="saved"]');
    const stored=JSON.parse(await js(`localStorage.getItem('spectra-account-progress-v1:stub-learner:cache')`)).records;
    assert.equal(await js(`localStorage.getItem('spectra-course-84101-progress-v1')`),prior,'Legacy keys remain untouched');
    assert.equal(stored['84101~'+id].answers[q.id].correct,true);
    await reloadDocument(call,js);await ready('.theory');await ready('.progress-state[data-state="saved"]');
    const reloaded=JSON.parse(await js(`localStorage.getItem('spectra-account-progress-v1:stub-learner:cache')`)).records;assert.deepEqual(Object.keys(reloaded).sort(),Object.keys(stored).sort());for(const key of Object.keys(stored))assert.deepEqual(reloaded[key].answers,stored[key].answers);

   }
  }
 }
 assert.deepEqual(exceptions,[],'No runtime exceptions');
 console.log('FINAL PREP PASSED: 320/390/1280 layouts; all 24 new exam-part reveals; all 14 worked-example reveals; all new equations; four real numeric submissions, unit selection and persisted answers after reload; unowned legacy answers preserved without assignment; calculated Boyle figure; no external requests or live models.');
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:300})}
