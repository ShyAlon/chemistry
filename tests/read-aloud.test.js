import test from 'node:test';
import assert from 'node:assert/strict';
import {Narrator,isLocalHebrew} from '../src/read-aloud/narrator.js';
import {sections} from '../src/read-aloud/sections.js';
const local={voiceURI:'local-he',name:'Test local Hebrew',lang:'he-IL',localService:true};
function fixture(voices=[local]){
 let visible=true;const timers=new Map();let n=0;const listeners=new Map();
 const engine={voices,queue:[],getVoices(){return this.voices;},speak(u){this.queue.push(u);},cancel(){this.cancels=(this.cancels||0)+1;},addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k){listeners.delete(k);}};
 const p=new Narrator({engine,Utterance:class{constructor(text){this.text=text;}},timer:fn=>{timers.set(++n,fn);return n;},clear:id=>timers.delete(id),isVisible:()=>visible});p.load(sections[0].chunks);
 return {p,engine,timers,listeners,hidden:()=>{visible=false;},last:()=>engine.queue.at(-1)};
}
test('no remote, English or unknown-locality fallback',()=>{for(const v of [{...local,localService:false},{...local,lang:'en-US'},{lang:'he-IL'}])assert.equal(isLocalHebrew(v),false);const f=fixture([{...local,localService:false}]);f.p.play();assert.equal(f.engine.queue.length,0);assert.equal(f.p.status,'error');});
test('delayed voice discovery is supported',()=>{const f=fixture([]);assert.equal(f.p.voice,null);f.engine.voices=[local];f.listeners.get('voiceschanged')();assert.equal(f.p.voice,local);f.p.play();assert.equal(f.engine.queue.length,1);});
test('highlight starts only on actual start, advances only on end',()=>{const f=fixture();f.p.play();assert.equal(f.p.active,null);assert.equal(f.p.status,'starting');f.last().onstart();assert.equal(f.p.active,0);f.last().onend();assert.equal(f.p.index,1);assert.equal(f.p.active,null);});
test('pause invalidates old callbacks and resume restarts current sentence',()=>{const f=fixture();f.p.play();const old=f.last();old.onstart();f.p.pause();assert.equal(f.p.status,'paused');assert.equal(f.p.active,null);old.onend();old.onerror();assert.equal(f.p.index,0);assert.equal(f.p.status,'paused');f.p.play();assert.equal(f.last().text,old.text);});
test('stop and section changes cannot be undone by late callbacks',()=>{const f=fixture();f.p.play();const old=f.last();old.onstart();f.p.load(sections[1].chunks);old.onend();assert.equal(f.p.index,0);assert.equal(f.p.active,null);assert.equal(f.engine.queue.length,1);assert.equal(f.p.status,'idle');});
test('skip while running starts target; idle skip does not speak',()=>{const f=fixture();f.p.jump(1);assert.equal(f.engine.queue.length,0);f.p.play();f.last().onstart();f.p.jump(2);assert.equal(f.engine.queue.length,2);assert.equal(f.last().text,sections[0].chunks[2].spoken);f.last().onstart();f.last().onend();assert.equal(f.p.status,'finished');assert.equal(f.p.active,null);});
test('speed applies to the next sentence, not invented word timing',()=>{const f=fixture();f.p.play();f.last().onstart();assert.equal(f.last().rate,1);f.p.setRate(1.5);assert.equal(f.last().rate,1);f.last().onend();assert.equal(f.last().rate,1.5);});
test('hidden document never starts or advances narration',()=>{const f=fixture();f.hidden();f.p.play();assert.equal(f.engine.queue.length,0);const g=fixture();g.p.play();g.last().onstart();g.hidden();g.last().onend();assert.equal(g.engine.queue.length,1);assert.equal(g.p.status,'idle');});
test('errors and watchdogs stop without fallback',()=>{const f=fixture();f.p.play();f.last().onerror();assert.equal(f.p.status,'error');assert.equal(f.p.active,null);assert.equal(f.timers.size,0);f.p.play();[...f.timers.values()][0]();assert.equal(f.p.status,'error');assert.equal(f.timers.size,0);});
test('missing start event does not silently skip all content',()=>{const f=fixture();f.p.play();f.last().onend();assert.equal(f.p.status,'error');assert.equal(f.engine.queue.length,1);});
test('voice removal during speech stops rather than substituting',()=>{const f=fixture();f.p.play();f.last().onstart();f.engine.voices=[];f.listeners.get('voiceschanged')();assert.equal(f.p.active,null);assert.equal(f.p.status,'idle');assert.equal(f.p.voice,null);});
test('cleanup removes listeners and timers',()=>{const f=fixture();f.p.play();f.p.dispose();assert.equal(f.listeners.size,0);assert.equal(f.timers.size,0);});
test('source mapping preserves decimal, authored display and context-specific volume',()=>{assert.equal(sections[0].chunks.length,3);assert.equal(sections[1].chunks.length,9);const t=sections[1].chunks.find(c=>c.display.includes('273.15'));assert.ok(t.display.startsWith('טמפרטורה'));assert.ok(t.spoken.includes('נקודה אחת חמש'));const equations=sections[1].chunks.filter(c=>c.equation);assert.equal(equations.length,3);for(const c of equations)assert.deepEqual(c.symbols,['ρ','m','V#2']);});
