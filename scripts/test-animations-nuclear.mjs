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
const routes={'nuclear-half-life':'#/course/nuclear/E4','chain-reaction':'#/course/nuclear/E7'};
for(const [id,route] of Object.entries(routes)){
  await call('Page.navigate',{url:'about:blank'});await call('Page.navigate',{url:base.split('#')[0]+route});await sleep(2500);
  await ev(`document.querySelector('.anim[data-anim-id="${id}"]').scrollIntoView({block:'center'})`);await sleep(300);
  let st=await state();assert.ok(st,id+' present');assert.equal(st.t,1,id+' opens on the finished frame');
  const poster=await svgText();
  // poster at lesson defaults carries only what the lesson figure shows
  if(id==='nuclear-half-life'){assert.deepEqual(await prm(),{count:0,halfLife:1,run:1});assert.ok(!poster.includes('דגימה אקראית'),'poster is the lesson curve only');assert.ok(poster.includes('t / t½'),'poster axis is normalized time');assert.equal(await count('path'),1,'poster: only the ideal curve path');}
  if(id==='chain-reaction'){assert.deepEqual(await prm(),{k:1});assert.ok((await ev('document.body.textContent')).includes('אינה מתארת את מנגנון הביקוע'),'chain caption labels it generation multiplication, not a microscopic fission event');assert.ok(poster.includes('קריטית')&&poster.includes('k = 1')&&!poster.includes('חלקית'),'poster is the lesson figure');assert.equal(await count('circle'),17,'lesson dot counts: 7 + 3 + 7');}
  await click('.anim-play');await sleep(400);let a=await state();assert.equal(a.playing,'1');await click('.anim-play');
  if(id==='nuclear-half-life'){
    await setScrub(1000);await setP('count',10);await sleep(100);assert.ok((await svgText()).includes('דגימה אקראית אחת'),'sample label appears');
    assert.ok(!(await svgText()).includes('כל הרצה אחרת'),'long honesty note stays out of the plot');
    assert.ok((await ev('document.body.textContent')).includes('כל הרצה אחרת שונה מעט'),'honesty note lives in the wrapping caption');
    // approved scope: an adjustable half-life. Default 1 s keeps the normalized lesson axis; a physical value switches the axis to seconds.
    await setP('halfLife',5);await sleep(100);const ph=await svgText();assert.ok(ph.includes('t (s)')&&ph.includes('20 s'),'half-life 5 s gives a physical seconds axis');
    await setP('halfLife',1);await sleep(100);assert.ok((await svgText()).includes('t / t½'),'reset to 1 s restores the normalized axis');
    const readout=async()=>ev(`[...document.querySelectorAll('.anim svg text')].map(t=>t.textContent).map(x=>x.replace(/[^0-9\\/]/g,'')).find(x=>/^\\d+\\/\\d+$/.test(x))`);
    await setScrub(0);await sleep(60);assert.equal(await readout(),'10/10','all nuclei present at t=0');
    await setScrub(1000);const end10=await readout();
    // same seed gives the same realization on replay
    await setScrub(500);const mid1=await readout();await setScrub(0);await setScrub(500);assert.equal(await readout(),mid1,'fixed seed replays identically');
    await setP('run',2);await setScrub(1000);await sleep(60);
    for(const hl of [1,10]){await setP('halfLife',hl);for(const v of [0,500,1000]){await setScrub(v);const r=await ev(bounds);assert.equal(r.bad,0,`no NaN hl=${hl} t=${v}`);assert.deepEqual(r.out,[],`text inside viewBox hl=${hl} t=${v}`)}}
    await setP('halfLife',1);
    for(const n of [0,10,100,400])for(const run of [1,5,9]){await setP('count',n);await setP('run',run);for(let v=0;v<=1000;v+=100){await setScrub(v);const r=await ev(bounds);assert.equal(r.bad,0,`no NaN n=${n} run=${run} t=${v}`);assert.deepEqual(r.out,[],`text inside viewBox n=${n} run=${run} t=${v}`)}}
    await setP('count',400);await setScrub(1000);const e=await readout();const left=Number(e.split('/')[0]);assert.ok(left<400*0.1,'after four half-lives only a small fraction remains in a large sample: '+e);
  }
  if(id==='chain-reaction'){
    await setScrub(1000);await setP('k',1.5);await sleep(100);assert.ok((await svgText()).includes('על־קריטית'),'k>1 middle panel is supercritical');assert.ok((await svgText()).includes('חלקית'),'fractional dots are explained');
    await setP('k',0.5);await sleep(100);assert.ok((await svgText()).includes('תת־קריטית'));
    for(const k of [0.5,0.8,1,1.3,2])for(let v=0;v<=1000;v+=100){await setP('k',k);await setScrub(v);const r=await ev(bounds);assert.equal(r.bad,0,`no NaN k=${k} t=${v}`);assert.deepEqual(r.out,[],`text inside viewBox k=${k} t=${v}`)}
    await click('.anim-param-reset');await sleep(100);assert.deepEqual(await prm(),{k:1});
  }
  await setScrub(1000);st=await state();assert.equal(st.playing,'0');
}
console.log('NUCLEAR ANIMATIONS PASSED: half-life (poster, sample, fixed seed, extremes) and chain reaction (poster, k, extremes)');
ch.kill();process.exit(0);
