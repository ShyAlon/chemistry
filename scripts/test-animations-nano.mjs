import {createServer} from 'node:http';import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';const out=path.resolve(process.env.DIST_DIR||'dist-test');
const s=createServer(async(q,r)=>{try{let u=new URL(q.url,'http://l').pathname.replace(/^\/chemistry/,'')||'/index.html';if(u==='/')u='/index.html';r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(u)]||'application/octet-stream');r.end(await readFile(path.join(out,u)))}catch{r.statusCode=404;r.end('')}});
await new Promise(r=>s.listen(0,'127.0.0.1',r));
const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--remote-debugging-port=9444','about:blank'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,2500));
const tg=await (await fetch('http://127.0.0.1:9444/json')).json();
const ws=new WebSocket(tg.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend={};ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id])pend[d.id](d)};
const call=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const ev=async e=>(await call('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true})).result.result?.value;
const sleep=t=>new Promise(r=>setTimeout(r,t));
const shot=async(f,clip)=>{const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...clip,scale:1}});await writeFile(f,Buffer.from(r.result.data,'base64'))};

const base=`http://127.0.0.1:${s.address().port}/chemistry/index.html#/course/nuclear/E4`;
const state=()=>ev(`(()=>{const a=document.querySelector('.anim');return a?{t:parseFloat(a.dataset.animT),playing:a.dataset.animPlaying,stage:+a.dataset.animStage}:null})()`);
const click=sel=>ev(`document.querySelector('.anim ${sel}').click()`);
const setScrub=v=>ev(`(()=>{const i=document.querySelector('.anim .anim-scrub');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${v}');i.dispatchEvent(new Event('input',{bubbles:true}))})()`);
const load=async(w=1200,reduce=false)=>{await call('Emulation.setDeviceMetricsOverride',{width:w,height:900,deviceScaleFactor:1,mobile:w<500});await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduce?'reduce':'no-preference'}]});await call('Page.navigate',{url:'about:blank'});await call('Page.navigate',{url:base});await sleep(2500);await ev(`document.querySelector('.anim').scrollIntoView({block:'center'})`);await sleep(300)};

const setP=(id,v)=>ev(`(()=>{const i=document.querySelector('.anim [data-param="${id}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${v}');i.dispatchEvent(new Event('input',{bubbles:true}))})()`);
const prm=()=>ev(`JSON.parse(document.querySelector('.anim').dataset.animParams)`);
const bounds=`(()=>{const s=document.querySelector('.anim svg');const vb=s.viewBox.baseVal;let bad=0;[...s.querySelectorAll('*')].forEach(e=>{for(const at of e.getAttributeNames())if(/NaN|undefined|Infinity/.test(e.getAttribute(at)))bad++});const out=[...s.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<vb.x-1||b.x+b.width>vb.x+vb.width+1||b.y<vb.y-1||b.y+b.height>vb.y+vb.height+1}).map(t=>t.textContent);return {bad,out}})()`;
const svgText=()=>ev(`document.querySelector('.anim svg').textContent`);
const count=sel=>ev(`document.querySelectorAll('.anim svg ${sel}').length`);
const LAMER_D='M70 205 C130 200 170 150 195 90 C205 62 215 45 235 42 C255 40 262 70 275 92 C300 130 340 142 380 146 C430 149 480 150 520 150';
const baseNano=`http://127.0.0.1:${s.address().port}/chemistry/index.html#/course/nano/N3`;
await call('Page.navigate',{url:'about:blank'});await call('Page.navigate',{url:baseNano});await sleep(2500);
await ev(`document.querySelector('.anim[data-anim-id="lamer-burst"]').scrollIntoView({block:'center'})`);await sleep(300);
const stN=await state();assert.ok(stN,'lamer-burst present');assert.equal(stN.t,1,'opens on the finished frame');
const poster=await svgText();
// poster at lesson defaults is the static lesson figure: same curve, same stage labels, thresholds
assert.ok(poster.includes('סף גרעינות')&&poster.includes('ריכוז רוויה')&&poster.includes('פרץ גרעינות')&&poster.includes('גדילה בלבד'),'poster carries the lesson stage labels');
assert.ok(!poster.includes('חוזר')&&!poster.includes('אין גרעינים'),'poster has no non-default regime text');
const posterD=await ev(`document.querySelector('.anim svg g[clip-path] path').getAttribute('d')`);
assert.equal(posterD,LAMER_D,'poster curve is identical to the static lesson figure');
assert.deepEqual(await prm(),{regime:1},'default is the lesson (controlled) regime');
const aria=async()=>ev(`document.querySelector('.anim svg').getAttribute('aria-label')`);
assert.ok((await aria()).includes('איכותי'),'aria label states the model is qualitative');
// the rate parameter is a real physical control, not a relabel: the curve shape itself changes regime
await setScrub(1000);
await setP('regime',0);await sleep(120);
const slowD=await ev(`document.querySelector('.anim svg g[clip-path] path').getAttribute('d')`);
assert.notEqual(slowD,LAMER_D,'slow scenario draws a different curve');
const slowText=await svgText();
assert.ok(slowText.includes('עלייה בלבד')&&!slowText.includes('פרץ גרעינות'),'slow scenario: rise only, no burst');
assert.ok((await aria()).includes('הומוגנית'),'slow-scenario aria label: homogeneous, no nuclei');
// slow curve stays below the nucleation threshold (pixel y >= 90 everywhere)
const slowMinY=await ev(`Math.min(...document.querySelector('.anim svg g[clip-path] path').getAttribute('d').match(/,([0-9.]+)/g).map(x=>+x.slice(1)))`);
assert.ok(slowMinY>=89.5,'slow curve never crosses the nucleation threshold line');
await setP('regime',2);await sleep(120);
const fastD=await ev(`document.querySelector('.anim svg g[clip-path] path').getAttribute('d')`);
assert.notEqual(fastD,LAMER_D);assert.notEqual(fastD,slowD,'fast scenario draws a third, distinct curve');
const fastText=await svgText();
assert.ok(fastText.includes('פרצי גרעינות חוזרים'),'fast scenario: repeated bursts labeled');
assert.ok((await aria()).includes('חוזרת'),'fast-rate aria label says nucleation repeats');
await setP('regime',1);await sleep(120);
assert.equal(await ev(`document.querySelector('.anim svg g[clip-path] path').getAttribute('d')`),LAMER_D,'reset to the default rate restores the lesson curve');
// well-formedness sweep across the whole slider range
for(const rate of [0,1,2]){
  await setP('regime',rate);
  for(let i=0;i<=10;i++){await setScrub(i*100);await sleep(40);
    const b=await ev(bounds);assert.equal(b.bad,0,`no NaN at rate ${rate}`);assert.deepEqual(b.out,[],`all text inside the viewBox at rate ${rate} t=${i/10}: ${b.out}`);}
}
await setP('regime',1);
// N1: the held static surface-area illustration renders in its topic
await call('Page.navigate',{url:'about:blank'});await call('Page.navigate',{url:baseNano.replace('/N3','/N1')});await sleep(2500);
const n1=await ev(`[...document.querySelectorAll('svg')].map(x=>x.textContent).join(' ')`);
assert.ok(n1.includes('600 m²')&&n1.includes('10¹⁸'),'N1 surface-area illustration renders with its quantitative labels');
console.log('NANO ANIMATIONS PASSED: lamer-burst (poster purity, slow/classic/fast regimes, threshold respect, reset, sweep) and N1 surface-area illustration');
s.close();ch.kill();
