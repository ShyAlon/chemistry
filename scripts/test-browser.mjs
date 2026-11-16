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
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Fetch.requestPaused'){const p=m.params;ws.send(JSON.stringify({id:++id,method:p.request.url.startsWith(origin+'/')?'Fetch.continueRequest':'Fetch.failRequest',params:p.request.url.startsWith(origin+'/')?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'}}));}if(m.id){const [resolve,reject]=pending.get(m.id)||[];pending.delete(m.id);m.error?reject?.(Error(JSON.stringify(m.error))):resolve?.(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,[resolve,reject]);ws.send(JSON.stringify({id:n,method,params}))});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const ready=async selector=>{for(let i=0;i<100;i++){if(await js(`document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`)){await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');return;}await new Promise(r=>setTimeout(r,50))}throw Error('Missing '+selector)};
 const shot=async name=>{if(screenshots){const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await (await import('node:fs/promises')).writeFile(path.join(screenshots,name+'.png'),Buffer.from(r.data,'base64'))}};
 await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await call('Network.enable');
 
 for(const [width,height] of [[320,800],[375,800],[390,800],[520,800],[667,375],[800,800],[1100,800],[1280,900],[1440,900],[1536,900]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const route of ['','course/84102/P7','references/formulas','references/periodic','references/diagrams','references/aufbau']){
   await call('Page.navigate',{url:origin+'/chemistry/index.html#/'+route});await ready('.header');
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
  await call('Page.navigate',{url:origin+'/chemistry/__fixture'});await ready('#exact');
  const runs=await js(`[...document.querySelectorAll('#exact>bdi')].map(e=>e.textContent)`);
  assert.ok(runs.includes('4s²3d⁴'));assert.ok(runs.includes('Cu'));assert.ok(!runs.includes('4s²3d⁴; Cu'));
  const temp=await js(`(()=>{const e=document.querySelector('#temperature .math-unit');return {text:e.textContent,rects:e.getClientRects().length,nowrap:getComputedStyle(e).whiteSpace}})()`);assert.equal(temp.text,'0.1024°C');assert.equal(temp.rects,1);assert.equal(temp.nowrap,'nowrap');
  const sub=await js(`[...document.querySelectorAll('sub')].map(e=>e.textContent)`);assert.ok(sub.includes('vap'));assert.ok(sub.includes('A'));
  if([390,667,1280].includes(width))await shot('notation-'+width);
 }
 console.log('Browser regression matrix passed: 60 route/viewports plus 10 notation fixtures, full desktop table bounds and electron controls.');
}finally{ws?.close();chrome.kill();server.close();await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200})}
