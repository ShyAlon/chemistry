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

const base=`http://127.0.0.1:${s.address().port}/chemistry/index.html#/course/solid-state/SS6`;
const state=()=>ev(`(()=>{const a=document.querySelector('.anim');return a?{t:parseFloat(a.dataset.animT),playing:a.dataset.animPlaying,stage:+a.dataset.animStage}:null})()`);
const click=sel=>ev(`document.querySelector('.anim ${sel}').click()`);
const setScrub=v=>ev(`(()=>{const i=document.querySelector('.anim .anim-scrub');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${v}');i.dispatchEvent(new Event('input',{bubbles:true}))})()`);
const load=async(w=1200,reduce=false)=>{await call('Emulation.setDeviceMetricsOverride',{width:w,height:900,deviceScaleFactor:1,mobile:w<500});await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduce?'reduce':'no-preference'}]});await call('Page.navigate',{url:'about:blank'});await call('Page.navigate',{url:base});await sleep(2500);await ev(`document.querySelector('.anim').scrollIntoView({block:'center'})`);await sleep(300)};
// 1. opens finished, nothing moves by itself
await load();let st=await state();assert.ok(st,'animated figure present');assert.equal(st.t,1,'opens on the finished poster frame');await sleep(1200);st=await state();assert.equal(st.t,1);assert.equal(st.playing,'0');
// 2. play, monotonic progress, pause holds
await click('.anim-play');await sleep(500);let a=await state();await sleep(500);let b=await state();assert.equal(a.playing,'1');assert.ok(a.t<1&&b.t>a.t,'time advances while playing');
await click('.anim-play');await sleep(150);a=await state();await sleep(500);b=await state();assert.equal(a.playing,'0');assert.equal(a.t,b.t,'pause holds the frame');
// 3. scrub and stage stepping
await setScrub(500);await sleep(100);st=await state();assert.equal(st.t,0.5);assert.equal(st.stage,1);
await click('[aria-label="השלב הבא"]');st=await state();assert.equal(st.stage,1);assert.ok(st.t>0.66&&st.t<0.67,'next goes to the end of the current stage');
await click('[aria-label="השלב הבא"]');st=await state();assert.equal(st.t,1);assert.equal(st.stage,2);
await click('[aria-label="השלב הקודם"]');st=await state();assert.equal(st.stage,1);
await click('[aria-label="מההתחלה"]');await sleep(200);st=await state();assert.ok(st.t<0.2&&st.playing==='1','replay starts from the beginning');await click('.anim-play');
// speed button cycles
const sp=[];for(let i=0;i<3;i++){sp.push(await ev(`document.querySelector('.anim-speed').textContent`));await click('.anim-speed')}assert.deepEqual(sp.sort(),['0.5×','1×','2×'].sort());
// 4. every frame is well formed and inside the viewBox
for(let v=0;v<=1000;v+=50){await setScrub(v);const r=await ev(`(()=>{const s=document.querySelector('.anim svg');const vb=s.viewBox.baseVal;let bad=0;[...s.querySelectorAll('*')].forEach(e=>{for(const at of e.getAttributeNames())if(/NaN|undefined|Infinity/.test(e.getAttribute(at)))bad++});const out=[...s.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<vb.x-1||b.x+b.width>vb.x+vb.width+1||b.y<vb.y-1||b.y+b.height>vb.y+vb.height+1}).map(t=>t.textContent);return {bad,out}})()`);assert.equal(r.bad,0,'no NaN attributes at '+v);assert.deepEqual(r.out,[],'text inside viewBox at '+v)}
// 4b. physical parameters: separate from speed, never start playback, reset to lesson values, every frame still well formed
const setP=(id,v)=>ev(`(()=>{const i=document.querySelector('.anim [data-param="${id}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${v}');i.dispatchEvent(new Event('input',{bubbles:true}))})()`);
const prm=()=>ev(`JSON.parse(document.querySelector('.anim').dataset.animParams)`);
const bounds=`(()=>{const s=document.querySelector('.anim svg');const vb=s.viewBox.baseVal;let bad=0;[...s.querySelectorAll('*')].forEach(e=>{for(const at of e.getAttributeNames())if(/NaN|undefined|Infinity/.test(e.getAttribute(at)))bad++});const out=[...s.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<vb.x-1||b.x+b.width>vb.x+vb.width+1||b.y<vb.y-1||b.y+b.height>vb.y+vb.height+1}).map(t=>t.textContent);return {bad,out}})()`;
await setScrub(1000);await sleep(100);
assert.deepEqual(await prm(),{photonE:2,count:1},'parameters start at the lesson values');
const circles=()=>ev(`document.querySelectorAll('.anim svg circle').length`);const c1=await circles();
await setP('count',6);await sleep(100);assert.equal(await circles(),c1+5,'particle count changes the picture');
st=await state();assert.equal(st.playing,'0');assert.equal(st.t,1,'changing a parameter does not play or move time');
await setP('photonE',1.4);await sleep(100);assert.ok((await ev(`document.querySelector('.anim svg').textContent`)).includes('אין בליעה'),'photon below the gap is not absorbed');
await setScrub(1000);await sleep(100);assert.ok((await ev(`document.querySelector('.anim .anim-stage').textContent`)).includes('אין פליטה'),'below-gap stage labels say nothing happens');assert.equal(await ev(`document.querySelectorAll('.anim svg [marker-end]').length`),0,'below the gap no excitation arrow is drawn');
await setP('photonE',2.0);await setScrub(1000);await sleep(100);assert.ok(await ev(`document.querySelectorAll('.anim svg [marker-end]').length`)>=3,'above the gap the three arrows are drawn');await setP('photonE',1.4);
for(const E of [1.0,1.4,1.7,1.8,2.5])for(const n of [1,6]){await setP('photonE',E);await setP('count',n);for(let v=0;v<=1000;v+=100){await setScrub(v);const r=await ev(bounds);assert.equal(r.bad,0,`no NaN E=${E} n=${n} t=${v}`);assert.deepEqual(r.out,[],`text inside viewBox E=${E} n=${n} t=${v}`)}}
await click('.anim-param-reset');await sleep(100);assert.deepEqual(await prm(),{photonE:2,count:1},'reset restores lesson values');
await setScrub(1000);
// 5. off-screen pauses playback
await setScrub(0);await click('.anim-play');await sleep(200);assert.equal((await state()).playing,'1');await ev(`window.scrollTo(0,0)`);await sleep(700);assert.equal((await state()).playing,'0','leaving the screen pauses');
// 6. reduced motion: no continuous playback, play steps between stages
await load(1200,true);st=await state();assert.equal(st.t,1);await click('.anim-play');await sleep(300);st=await state();assert.equal(st.playing,'0');assert.ok(st.t<1);const s0=st.stage;await click('.anim-play');st=await state();assert.ok(st.stage>s0||st.t===1);assert.equal(await ev(`document.querySelector('.anim-speed').disabled`),true);
// 7. phone: controls fit the card
await load(390);const fit=await ev(`(()=>{const c=document.querySelector('.anim-controls').getBoundingClientRect();return {l:c.left,r:c.right,w:innerWidth,sw:document.documentElement.scrollWidth}})()`);assert.ok(fit.l>=0&&fit.r<=fit.w+1&&fit.sw<=fit.w+1,'controls fit at 390: '+JSON.stringify(fit));
console.log('ANIMATION FRAMEWORK PASSED: poster start, play/pause hold, scrub, stage steps, replay, speed, 21 frames well formed, parameters (photon energy, particle count, reset, 10 combinations x 11 frames), off-screen pause, reduced motion, 390px fit');
ch.kill();process.exit(0);
