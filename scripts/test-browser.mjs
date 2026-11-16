import {spawn} from 'node:child_process';
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
const data=JSON.parse(await readFile(path.join(root,'src/courses.json'),'utf8'));
const exact=data.courses[0].topics[0].content.theory.find(p=>p.text?.startsWith('החריגים Cr')).text;
const fixture=renderToStaticMarkup(React.createElement('html',{dir:'rtl',lang:'he'},
 React.createElement('head',null,React.createElement('meta',{charSet:'utf-8'}),React.createElement('style',null,await readFile(path.join(root,'src/style.css'),'utf8'))),
 React.createElement('body',null,React.createElement('article',{className:'theory panel',style:{margin:24}},
 bidiElement('p',{id:'exact'},exact),
 bidiElement('p',null,'נתון: ΔH_vap = 40.7 kJ/mol; T_1 = 300 K; x_A = 0.25; P°_A = 80 kPa'),
 React.createElement('div',{className:'solution',style:{width:250}},bidiElement('p',{id:'temperature'},'ΔT_b=0.512·0.200=0.1024°C, ולכן טמפרטורת הרתיחה עולה.')),
 React.createElement(DisplayMath,{text:'ln(P₂/P₁) = (ΔH_vap/R)·(1/T₁ − 1/T₂)'})))));
const server=createServer(async(req,res)=>{
 if(req.url==='/chemistry/__fixture'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(fixture)}
 try{const file=path.join(root,'dist',decodeURIComponent(req.url.split('?')[0]).replace(/^\/chemistry\//,'')||'index.html');
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Not found')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const profile=await mkdtemp(path.join(tmpdir(),'chem-browser-'));
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless','--no-sandbox','--disable-gpu','--remote-allow-origins=*','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let ws;
try{
 const endpoint=await new Promise((resolve,reject)=>{let text='';const t=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);chrome.stderr.on('data',x=>{text+=x;const m=text.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(t);resolve(m[1])}});chrome.on('error',reject)});
 const port=new URL(endpoint).port;
 const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Fetch.requestPaused'){const p=m.params;ws.send(JSON.stringify({id:++id,method:p.request.url.startsWith(origin+'/')?'Fetch.continueRequest':'Fetch.failRequest',params:p.request.url.startsWith(origin+'/')?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'}}));}if(m.method==='Runtime.exceptionThrown')console.error(JSON.stringify(m.params));if(m.id){const [resolve,reject]=pending.get(m.id)||[];pending.delete(m.id);m.error?reject?.(Error(JSON.stringify(m.error))):resolve?.(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,[resolve,reject]);ws.send(JSON.stringify({id:n,method,params}))});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const ready=async selector=>{for(let i=0;i<100;i++){if(await js(`document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`)){await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');return;}await new Promise(r=>setTimeout(r,50))}throw Error('Missing '+selector)};
 const shot=async name=>{if(screenshots){const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await (await import('node:fs/promises')).writeFile(path.join(screenshots,name+'.png'),Buffer.from(r.data,'base64'))}};
 await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await call('Network.enable');await call('Runtime.enable');
 
 for(const [width,height] of [[320,800],[375,800],[380,800],[381,800],[390,800],[520,800],[667,375],[800,800],[1100,800],[1280,900],[1440,900],[1536,900]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const route of ['','course/84102/P7','references/formulas','references/periodic','references/diagrams','references/aufbau']){
   await call('Page.navigate',{url:origin+'/chemistry/index.html#/'+route});await ready('.header');
   const navigation=await js(`(()=>{const buttons=[...document.querySelectorAll('.header-tools>.quiet')];return buttons.map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,display:getComputedStyle(e).display,font:parseFloat(getComputedStyle(e).fontSize),width:r.width,height:r.height,disabled:e.disabled}})})()`);
   assert.deepEqual(navigation.map(n=>n.text),route.startsWith('course/')?['כל הקורסים','מקראות','על המעבדה']:['מקראות','על המעבדה'],'All route-appropriate navigation buttons must exist');
   for(const n of navigation){assert.notEqual(n.display,'none',JSON.stringify({viewport:width,route,...n}));assert.ok(n.width>0&&n.height>=44&&!n.disabled,JSON.stringify({viewport:width,route,...n}));if(width<=520)assert.ok(n.font>=18,JSON.stringify({viewport:width,route,...n}))}
   const geometry=await js(`(()=>{const visible=e=>getComputedStyle(e).display!=='none';const nodes=[document.querySelector('.brand'),document.querySelector('.avatar-wrap'),...document.querySelectorAll('.header-tools>.quiet')].filter(visible);return {width:innerWidth,scroll:document.documentElement.scrollWidth,rects:nodes.map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,font:parseFloat(getComputedStyle(e).fontSize)}}),header:document.querySelector('.header').getBoundingClientRect().bottom,footer:document.querySelector('.site-footer').getBoundingClientRect().bottom}})()`);
   for(const r of geometry.rects){assert.ok(r.left>=-1&&r.right<=width+1,JSON.stringify({width,route,...r}));assert.ok(r.bottom<=geometry.header+1)}
   assert.ok(geometry.scroll<=width+1,JSON.stringify({width,route,scroll:geometry.scroll}));
   assert.ok(Math.abs(geometry.footer-height)<2,JSON.stringify({width,height,route,footer:geometry.footer}));
   if(route==='references/periodic'){
    await ready('.pt-cell');
    const table=await js(`(()=>{const view=document.querySelector('.pt-scroll').getBoundingClientRect();const end=document.querySelector('.pt-cell[aria-label$=", 118"]').getBoundingClientRect();const head=[...document.querySelectorAll('.pt-head')].at(-1).getBoundingClientRect();const side=document.querySelector('.pt-detail').getBoundingClientRect();return {view:{left:view.left,right:view.right},end:{left:end.left,right:end.right},head:{left:head.left,right:head.right},sidebar:side.width,grid:document.querySelector('.pt-grid').scrollWidth,client:document.querySelector('.pt-scroll').clientWidth}})()`);
    if(width>=960){assert.ok(table.end.left>=table.view.left&&table.end.right<=table.view.right,JSON.stringify({width,table}));assert.ok(table.head.right<=table.view.right);assert.ok(table.grid<=table.client+1)}
    if(width>=1280)assert.equal(table.sidebar,240);
    if(width<960){
     await js(`document.querySelector('.pt-scroll').scrollLeft=9999`);
     assert.ok(await js(`(()=>{const a=document.querySelector('.pt-scroll').getBoundingClientRect(),b=document.querySelector('.pt-cell[aria-label$=", 118"]').getBoundingClientRect();return b.right<=a.right&&b.left>=a.left})()`));
    }
    await js(`document.querySelector('.pt-cell[aria-label$=", 26"]').click()`);
    await ready('.pt-step:not(:disabled)');
    for(let j=0;j<2;j++){await js(`document.querySelector('[aria-label="הסר אלקטרון"]').click();new Promise(r=>requestAnimationFrame(r))`)}
    assert.ok(await js(`document.querySelector('.pt-ion').textContent.includes('24 אלקטרונים')`));
    await js(`document.querySelector('.pt-neutral').click();new Promise(r=>requestAnimationFrame(r))`);
    assert.ok(await js(`document.querySelector('.pt-ion').textContent.includes('26 אלקטרונים')`));
    if([390,1100,1280,1440].includes(width)){
     await js(`document.querySelector('.pt-scroll').scrollLeft=0;window.scrollTo(0,document.querySelector('.pt-legend').getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight-12);new Promise(r=>requestAnimationFrame(r))`);
     await shot('periodic-'+width);
    }
   }
   if(route==='course/84102/P7'&&[320,375,380,381].includes(width))await shot('p7-'+width);
   if(route==='course/84102/P7'&&[390,667,1280].includes(width))await shot('p7-'+width);
   if(route==='course/84102/P7'){
    await js(`document.querySelectorAll('.tabs button')[1].click()`);await ready('.worked');
    await js(`document.querySelectorAll('.worked')[3].querySelector('button').click()`);await ready('.worked:nth-of-type(4) .solution');
    const answer=await js(`document.querySelectorAll('.worked')[3].querySelector('.solution').textContent`);
    assert.ok(answer.includes('V⁺ = [Ar]4s¹3d³'));assert.ok(answer.includes('NIST'));assert.ok(answer.includes('[Ar]3d⁴'));assert.ok(!answer.includes('תמיד'));
    assert.ok(await js(`document.documentElement.scrollWidth<=innerWidth+1`));
    if([390,667,1280].includes(width)){
     await js(`window.scrollTo(0,document.querySelectorAll('.worked')[3].getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight-12);new Promise(r=>requestAnimationFrame(r))`);
     await shot('vanadium-'+width);
     if(width===390){
      await js(`window.scrollTo(0,document.querySelectorAll('.worked')[3].querySelector('.solution p:nth-child(2)').getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight-12);new Promise(r=>requestAnimationFrame(r))`);
      await shot('vanadium-answer-'+width);
     }
    }
   }
  }
  await js(`document.querySelector('.header-tools>.quiet:last-child').click()`);await ready('.about');
  await call('Page.navigate',{url:origin+'/chemistry/__fixture'});await ready('#exact');
  const runs=await js(`[...document.querySelectorAll('#exact>bdi')].map(e=>e.textContent)`);
  assert.ok(runs.includes('4s²3d⁴'));assert.ok(runs.includes('Cu'));assert.ok(!runs.includes('4s²3d⁴; Cu'));
  const temp=await js(`(()=>{const e=document.querySelector('#temperature .math-unit');return {text:e.textContent,rects:e.getClientRects().length,nowrap:getComputedStyle(e).whiteSpace}})()`);assert.equal(temp.text,'0.1024°C');assert.equal(temp.rects,1);assert.equal(temp.nowrap,'nowrap');
  const sub=await js(`[...document.querySelectorAll('sub')].map(e=>e.textContent)`);assert.ok(sub.includes('vap'));assert.ok(sub.includes('A'));
  if([390,667,1280].includes(width))await shot('notation-'+width);
 }
 // Source disclosures: real mouse, keyboard and touch paths, with viewport bounds.
 const key=async key=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code:key})};
 const bounds=async()=>{const r=await js(`(()=>{const e=document.querySelector('.source-popover'),r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,font:parseFloat(getComputedStyle(e).fontSize),scroll:e.scrollHeight,client:e.clientHeight}})()`);assert.ok(r.left>=11&&r.right<=await js('innerWidth-11'),JSON.stringify(r));assert.ok(r.top>=11&&r.bottom<=await js('innerHeight-11'),JSON.stringify(r));assert.ok(r.font>=18);return r};
 for(const [width,height] of [[320,800],[375,800],[390,800],[667,375],[1280,900]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/chemistry/index.html#/references/periodic'});await ready('.source-trigger');
  assert.ok(!await js(`document.body.innerText.includes('CIAAW')`),'Source text should not consume page space');
  await call('Page.bringToFront');await js(`document.querySelector('.source-trigger').focus()`);await ready('.source-popover');
  assert.ok(await js(`document.querySelector('.source-popover').textContent.includes('ערך מקוצר, CIAAW')`));await bounds();
  await key('Escape');assert.equal(await js(`document.querySelectorAll('.source-popover').length`),0);assert.ok(await js(`document.activeElement===document.querySelector('.source-trigger')`));
  // Tap pins the disclosure; a second tap, outside tap and explicit close dismiss it.
  await call('Emulation.setTouchEmulationEnabled',{enabled:true});
  const tap=async selector=>{const p=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')};
  await tap('.source-trigger');await ready('.source-popover');await bounds();
  if([320,1280].includes(width))await shot('source-open-'+width);
  await tap('.source-trigger');assert.equal(await js(`document.querySelectorAll('.source-popover').length`),0);
  await tap('.source-trigger');await ready('.source-popover');await tap('.source-close');assert.equal(await js(`document.querySelectorAll('.source-popover').length`),0);
  await tap('.source-trigger');await ready('.source-popover');await tap('.pt-big');assert.equal(await js(`document.querySelectorAll('.source-popover').length`),0);
  if([320,1280].includes(width))await shot('source-compact-'+width);
  // Long table provenance fits even in phone landscape and scrolls internally.
  await tap('.ref-note .source-trigger');await ready('.source-popover');await bounds();
  assert.ok(await js(`document.querySelector('.source-popover').textContent.includes('terms.hebrew-academy.org.il')`));
  if(width===667)await shot('source-landscape-'+width);
  await call('Page.navigate',{url:origin+'/chemistry/index.html#/course/84102/P7'});await ready('.topic-hero');assert.equal(await js(`document.querySelectorAll('.source-popover').length`),0);
  await tap('.topic-hero .source-trigger');await ready('.source-popover');await bounds();assert.ok(await js(`document.querySelector('.source-popover').textContent.includes('שיעורים 7-8')`));
  if(width===320)await shot('lesson-source-'+width);
  await tap('.source-close');
  // Credits and their original outgoing links remain in the disclosure.
  await tap('.side-card .source-trigger');await ready('.source-popover');await bounds();
  assert.ok(await js(`document.querySelector('.source-popover a').href.includes('nist.gov')`));await key('Tab');assert.ok(await js(`document.activeElement.closest('.source-popover')!==null`));await key('Escape');
  await tap('.orbital-frame .source-trigger');await ready('.source-popover');await bounds();assert.ok(await js(`document.querySelector('.source-popover a').href.includes('wikimedia.org')`));await key('Escape');
  await call('Emulation.setTouchEmulationEnabled',{enabled:false});
  await call('Page.navigate',{url:origin+'/chemistry/index.html#/course/84101'});await ready('.section-heading .source-trigger');
  await js(`document.querySelector('.section-heading .source-trigger').scrollIntoView({block:'center'});document.querySelector('.section-heading .source-trigger').click()`);await ready('.source-popover');await bounds();assert.ok(await js(`document.querySelector('.source-popover').textContent.includes('קובצי מקור')`));
 }
 // Expanded electron addition never substitutes a model for an existing NIST cation.
 for(const [width,height] of [[320,800],[667,375],[1280,900]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/chemistry/index.html#/references/periodic'});await ready('.pt-cell');
  const saved=await js(`JSON.stringify(localStorage)`);
  for(const [z,adds,text] of [[6,4,'2p⁶'],[6,5,'3s¹'],[26,1,'3d⁷'],[10,1,'3s¹'],[104,1,'6d³']]){
   await js(`document.querySelector('.pt-cell[aria-label$=", ${z}"]').click()`);
   for(let k=0;k<adds;k++)await js(`document.querySelector('[aria-label="הוסף אלקטרון"]').click()`);
   await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
   const detail=await js(`document.querySelector('.pt-detail').textContent`);
   assert.ok(detail.includes('מודל אכלוס לימודי'),detail);assert.ok(detail.includes(text),detail);assert.ok(detail.includes(String(z+adds)+' אלקטרונים'),detail);
   assert.equal(await js(`document.querySelector('[aria-label="הוסף אלקטרון"]').disabled`),false);
   if(z===6&&adds===4){await js(`document.querySelector('.pt-cfg').scrollIntoView({block:'center'});new Promise(r=>requestAnimationFrame(r))`);await shot('calculated-carbon-'+width);if(width===320){await js(`document.querySelector('.pt-cfg .source-trigger').click()`);await ready('.source-popover');await bounds();await shot('calculated-method-'+width);await key('Escape')}}
   await js(`document.querySelector('.pt-neutral').click()`);assert.ok(!await js(`document.querySelector('.pt-detail').textContent.includes('מודל אכלוס לימודי')`));
  }
  await js(`document.querySelector('.pt-cell[aria-label$=", 23"]').click()`);await js(`new Promise(r=>requestAnimationFrame(r))`);await js(`document.querySelector('[aria-label="הסר אלקטרון"]').click()`);await ready('.pt-neutral');
  assert.ok(await js(`document.querySelector('.pt-cfg').textContent.includes('3d⁴')`));assert.ok(await js(`document.querySelector('.pt-cfg').textContent.includes('NIST')`));
  await js(`document.querySelector('.pt-cell[aria-label$=", 118"]').click()`);assert.equal(await js(`document.querySelector('[aria-label="הוסף אלקטרון"]').disabled`),true);assert.ok(await js(`document.querySelector('.pt-ion').textContent.includes('גבול החישוב באתר')`));
  assert.equal(await js(`JSON.stringify(localStorage)`),saved);assert.ok(await js(`document.documentElement.scrollWidth<=innerWidth+1`));
 }
 console.log('Anion expansion browser checks passed: C4-/C5-, Fe-, Ne-, predicted-neutral seed, reset, 118-electron bound, source-first V+ and unchanged storage.');
 // Hover works without click, and moving into the bubble does not dismiss it.
 await call('Page.navigate',{url:origin+'/chemistry/index.html#/references/periodic'});await ready('.source-trigger');
 const hover=async selector=>{const p=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mouseMoved',...p})};
 await hover('.source-trigger');await ready('.source-popover');await hover('.source-popover');await js('new Promise(r=>setTimeout(r,220))');assert.equal(await js(`document.querySelectorAll('.source-popover').length`),1);
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await js('new Promise(r=>setTimeout(r,220))');assert.equal(await js(`document.querySelectorAll('.source-popover').length`),0);
 console.log('Source tooltip interactions passed at 320/375/390px, landscape and desktop: keyboard, touch, hover, dismiss, source links and bounded long notes.');
 console.log('Browser regression matrix passed: 72 route/viewports plus 12 notation fixtures, full desktop table bounds and electron controls.');
}finally{ws?.close();chrome.kill();server.close();await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200})}
