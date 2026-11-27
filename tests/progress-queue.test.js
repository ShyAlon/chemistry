import test from 'node:test';import assert from 'node:assert/strict';
import {createProgressStore,isItemError} from '../src/progress-store.js';import {apply} from '../src/progress-model.js';
const manifest={'c~t':{course:'c',topic:'t',kind:'topic',questions:{a:'mcq',b:'mcq',c:'mcq'}},'c~s':{course:'c',topic:'s',kind:'practice',questions:{},correct:Array(10).fill(0)}};
const value=(correct=true)=>({correct,kind:'mcq',at:'2026-11-22T12:00:00.000Z'});
class Storage{m=new Map();getItem(k){return this.m.has(k)?this.m.get(k):null;}setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}}
const settle=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));};
// rule(op) returns an error code to throw for that entry, or nothing.
const clock={t:1e12};const nowFn=()=>clock.t;
function fixture(storage=new Storage(),shared={}){const calls=[];let rule=()=>null;const gateway={async load(){return structuredClone(shared);},async commit(o,m){calls.push(o.record+'/'+o.item);const code=rule(o);if(code)throw Object.assign(new Error(code),{code});shared[o.record]=apply(shared[o.record],o,m);},async reset(){}};
 const store=createProgressStore({uid:'u',storage,gateway,manifest,now:nowFn});return {store,shared,storage,calls,rule:f=>rule=f};}
const denyA=o=>o.record==='c~t'&&o.item==='a'?'permission-denied':null;
const saved=(f,item)=>Boolean(f.shared['c~t']?.answers?.[item]);
test('one denied entry does not block later independent valid saves',async()=>{const f=fixture();await f.store.start();f.rule(denyA);f.store.enqueue('c~t','a',value());f.store.enqueue('c~t','b',value());f.store.enqueue('c~t','c',value());await settle();
 assert.equal(saved(f,'b'),true);assert.equal(saved(f,'c'),true);assert.equal(saved(f,'a'),false);
 const s=f.store.snapshot();assert.equal(s.pending,1);assert.equal(s.blocked,1);assert.equal(s.phase,'attention');assert.match(s.error,/permission/);
 assert.ok(s.progress.c.t.answers?.a||JSON.stringify(s.progress).includes('"a"'),'denied answer stays visible locally');f.store.close();});
test('denied entry arriving first and a denied practice result do not starve a topic answer',async()=>{const f=fixture();await f.store.start();f.rule(o=>o.record==='c~s'?'permission-denied':null);f.store.enqueue('c~s','result',{choices:Array(10).fill(0),score:5,at:value().at});f.store.enqueue('c~t','b',value());await settle();assert.equal(saved(f,'b'),true);assert.equal(f.store.snapshot().blocked,1);f.store.close();});
test('a blocked entry is not retried automatically, only by explicit retry, and succeeds once allowed',async()=>{const f=fixture();await f.store.start();f.rule(denyA);f.store.enqueue('c~t','a',value());await settle();for(let i=0;i<3;i++){await f.store.sync();}
 assert.equal(f.calls.filter(c=>c==='c~t/a').length,1,'denied call made once, not on every sync/focus');
 f.rule(()=>null);await f.store.retry();assert.equal(saved(f,'a'),true);assert.equal(f.store.snapshot().pending,0);assert.equal(f.store.snapshot().phase,'saved');f.store.close();});
test('blocked work is preserved across restart and retried once per session',async()=>{const f=fixture();await f.store.start();f.rule(denyA);f.store.enqueue('c~t','a',value());await settle();f.store.close();
 const g=fixture(f.storage,f.shared);g.rule(denyA);await g.store.start();assert.equal(g.calls.length,1,'one retry on the new session');assert.equal(g.store.snapshot().pending,1);assert.equal(g.store.snapshot().blocked,1);g.store.close();
 const h=fixture(f.storage,f.shared);await h.store.start();assert.equal(saved(h,'a'),true,'saved after the rule is fixed, with no user action');h.store.close();});
test('a new answer to the same question replaces the blocked entry and is tried again',async()=>{const f=fixture();await f.store.start();f.rule(denyA);f.store.enqueue('c~t','a',value());await settle();f.rule(()=>null);f.store.enqueue('c~t','a',value(false));await settle();assert.equal(saved(f,'a'),true);assert.equal(f.store.snapshot().blocked,0);f.store.close();});
test('transient failure stops the pass, keeps everything pending, blocks nothing, recovers',async()=>{const f=fixture();await f.store.start();f.rule(()=>'unavailable');f.store.enqueue('c~t','a',value());f.store.enqueue('c~t','b',value());await settle();
 const s=f.store.snapshot();assert.equal(s.pending,2);assert.equal(s.blocked,0);assert.equal(s.phase,'device');const n=f.calls.length;await f.store.sync();assert.equal(f.calls.length,n+1,'each pass stops at the first transient error');assert.ok(!f.calls.slice(n).includes('c~t/b'),'later entries are not attempted after a transient error');
 f.rule(()=>null);await f.store.sync();assert.equal(saved(f,'a')&&saved(f,'b'),true);assert.equal(f.store.snapshot().phase,'saved');f.store.close();});
test('auth failure is not item-specific: nothing is blocked and later entries wait',async()=>{const f=fixture();await f.store.start();f.rule(()=>'unauthenticated');f.store.enqueue('c~t','a',value());f.store.enqueue('c~t','b',value());await settle();assert.equal(f.store.snapshot().blocked,0);assert.equal(f.store.snapshot().pending,2);const n=f.calls.length;await f.store.sync();assert.equal(f.calls.length,n+1);assert.ok(!f.calls.slice(n).includes('c~t/b'));f.rule(()=>null);await f.store.sync();assert.equal(f.store.snapshot().pending,0);f.store.close();});
test('error classification',()=>{for(const c of ['permission-denied','invalid-argument','failed-precondition','firestore/permission-denied'])assert.equal(isItemError({code:c}),true,c);for(const c of ['unavailable','unauthenticated','deadline-exceeded','resource-exhausted','aborted','progress/account-changed',undefined])assert.equal(isItemError({code:c}),false,String(c));assert.equal(isItemError(Error('offline')),false);});

// --- mock-exam store: same failure mode, same isolation ---
import {createMockExamStore} from '../src/mock-exam/store.js';
import {createAttempt,submitAttempt,MAX_COMPLETED} from '../src/mock-exam/attempt.js';
import {templates84101} from '../src/mock-exam/templates-84101.js';
function mockFixture(storage=new Storage(),server=[]){const saveCalls=[],removed=[];let rule=()=>null;const gateway={async save(a){saveCalls.push(a.id);const c=rule(a);if(c)throw Object.assign(new Error(c),{code:c});server=server.filter(x=>x.id!==a.id).concat([a]);},async load(){return server.map(a=>({...a}));},async remove(ids){removed.push(...ids);server=server.filter(a=>!ids.includes(a.id));}};
 const store=createMockExamStore({uid:'u',storage,gateway,now:nowFn});return {store,storage,saveCalls,removed,server:()=>server,rule:f=>rule=f};}
test('mock exam: a denied attempt does not stop other attempts, load or retention',async()=>{const f=mockFixture();await f.store.start();f.rule(a=>a.id==='bad'?'permission-denied':null);
 f.store.save(createAttempt(templates84101,{seed:'s1',id:'bad'}));f.store.save(createAttempt(templates84101,{seed:'s2',id:'good'}));await settle();
 assert.deepEqual(f.server().map(a=>a.id),['good']);const s=f.store.snapshot();assert.equal(s.blocked,1);assert.equal(s.pending,1);assert.equal(s.phase,'attention');assert.ok(s.attempts.bad,'denied attempt kept locally');
 const n=f.saveCalls.filter(i=>i==='bad').length;await f.store.sync();assert.equal(f.saveCalls.filter(i=>i==='bad').length,n,'not retried automatically');
 f.rule(()=>null);await f.store.retry();assert.deepEqual(f.server().map(a=>a.id).sort(),['bad','good']);assert.equal(f.store.snapshot().phase,'saved');f.store.close();});
test('mock exam: transient error keeps attempts pending and blocks none',async()=>{const f=mockFixture();await f.store.start();f.rule(()=>'unavailable');f.store.save(createAttempt(templates84101,{seed:'s1',id:'m1'}));await settle();assert.equal(f.store.snapshot().blocked,0);assert.equal(f.store.snapshot().pending,1);f.rule(()=>null);await f.store.sync();assert.equal(f.store.snapshot().pending,0);f.store.close();});

const submitted=(id,at)=>submitAttempt(createAttempt(templates84101,{seed:id,id}),at);
const recent=i=>new Date(clock.t-(i+2)*60000);
test('mock exam: cap eviction never discards an unsynced (blocked) attempt, then trims normally once it is accepted',async()=>{
 const server=Array.from({length:MAX_COMPLETED},(_,i)=>({...submitted('n'+i,recent(i))}));const f=mockFixture(new Storage(),server);f.rule(a=>a.id==='old'?'permission-denied':null);await f.store.start();
 f.store.save(submitted('old',new Date(clock.t-86400000)));await settle();
 assert.ok(f.store.snapshot().attempts.old,'kept locally despite being beyond the cap');assert.equal(f.store.snapshot().pending,1);assert.equal(f.store.snapshot().blocked,1);assert.ok(!f.removed.includes('old'));assert.equal(f.server().length,MAX_COMPLETED);
 const g=mockFixture(f.storage,f.server());g.rule(a=>a.id==='old'?'permission-denied':null);await g.store.start();assert.ok(g.store.snapshot().attempts.old,'still present after restart');g.store.close();
 f.rule(()=>null);await f.store.retry();assert.ok(f.server().some(a=>a.id==='old')||f.removed.includes('old'),'it reached the account before standard trimming');
 await settle();assert.equal(Object.keys(f.store.snapshot().attempts).length,MAX_COMPLETED,'standard cap applies again once nothing is unsynced');f.store.close();});
test('mock exam: an expired unsynced attempt is still dropped (expiry semantics unchanged)',async()=>{const f=mockFixture();f.rule(()=>'permission-denied');await f.store.start();f.store.save(submitted('gone',new Date('1990-01-01T00:00:00Z')));await settle();assert.ok(!f.store.snapshot().attempts.gone);f.store.close();});
test('mock exam: synced attempts beyond the cap are still trimmed and removed from the account',async()=>{const server=Array.from({length:MAX_COMPLETED+2},(_,i)=>submitted('s'+i,recent(i)));const f=mockFixture(new Storage(),server);await f.store.start();assert.equal(Object.keys(f.store.snapshot().attempts).length,MAX_COMPLETED);assert.deepEqual([...f.removed].sort(),['s10','s11']);f.store.close();});

import {BLOCK_COOLDOWN_MS} from '../src/progress-store.js';
test('topic store: blocked entry is retried at most once per cooldown on an existing trigger, never polled',async()=>{clock.t=1e12;const f=fixture();await f.store.start();f.rule(denyA);f.store.enqueue('c~t','a',value());await settle();
 for(let i=0;i<5;i++){clock.t+=60000;await f.store.sync();}assert.equal(f.calls.filter(c=>c==='c~t/a').length,1,'no retry inside the cooldown');
 clock.t+=BLOCK_COOLDOWN_MS;await f.store.sync();assert.equal(f.calls.filter(c=>c==='c~t/a').length,2,'one retry after the cooldown, still denied');assert.equal(f.store.snapshot().blocked,1);
 await f.store.sync();assert.equal(f.calls.filter(c=>c==='c~t/a').length,2,'blocked again for a full cooldown');
 f.rule(()=>null);clock.t+=BLOCK_COOLDOWN_MS;await f.store.sync();assert.equal(saved(f,'a'),true,'a long-open app heals without reload after the cause is fixed');f.store.close();});
test('mock exam: a refused submission of an attempt that exists on the server as open is not overwritten by the server copy',async()=>{clock.t=1e12;const open=createAttempt(templates84101,{seed:'x',id:'X'});const f=mockFixture(new Storage(),[{...open}]);await f.store.start();
 f.rule(a=>a.id==='X'&&a.status==='submitted'?'permission-denied':null);f.store.save(submitAttempt(open,new Date(clock.t-60000)));await settle();
 const s=f.store.snapshot();assert.equal(s.attempts.X.status,'submitted');assert.equal(s.pending,1);assert.equal(s.blocked,1);assert.equal(s.phase,'attention');
 f.rule(()=>null);await f.store.retry();assert.equal(f.server().find(a=>a.id==='X').status,'submitted');assert.equal(f.store.snapshot().phase,'saved');f.store.close();});
test('mock exam: a local update made while a save is in flight is kept and saved on the next pass',async()=>{clock.t=1e12;const a1=createAttempt(templates84101,{seed:'y',id:'Y'});let release;const gate=new Promise(r=>release=r);const f=mockFixture();let first=true;const orig=f.store;
 // wrap: hold the first save
 const saveCalls=[];let server=[];const gw={async save(a){saveCalls.push(a.status);if(first){first=false;await gate;}server=server.filter(x=>x.id!==a.id).concat([a]);},async load(){return server.map(a=>({...a}));},async remove(){}};
 const store=createMockExamStore({uid:'u2',storage:new Storage(),gateway:gw,now:nowFn});await store.start();store.save(a1);await settle();store.save(submitAttempt(a1,new Date(clock.t-60000)));release();await settle();await store.sync();
 assert.equal(server.find(a=>a.id==='Y').status,'submitted');assert.equal(store.snapshot().attempts.Y.status,'submitted');assert.equal(store.snapshot().pending,0);store.close();orig.close();});
test('mock exam: unsynced work does not evict synced attempts from the account via the cap',async()=>{clock.t=1e12;const server=Array.from({length:MAX_COMPLETED},(_,i)=>submitted('k'+i,recent(i+1)));const f=mockFixture(new Storage(),server);f.rule(a=>a.id==='fresh'?'permission-denied':null);await f.store.start();
 f.store.save(submitted('fresh',new Date(clock.t-30000)));await settle();assert.equal(f.removed.length,0,'no synced attempt removed from the account');assert.equal(f.server().length,MAX_COMPLETED);assert.ok(f.store.snapshot().attempts.fresh);assert.equal(Object.keys(f.store.snapshot().attempts).length,MAX_COMPLETED+1);f.store.close();});
test('mock exam: cooldown retry, once per cooldown',async()=>{clock.t=1e12;const f=mockFixture();f.rule(a=>a.id==='Z'?'permission-denied':null);await f.store.start();f.store.save(createAttempt(templates84101,{seed:'z',id:'Z'}));await settle();
 for(let i=0;i<4;i++){clock.t+=60000;await f.store.sync();}assert.equal(f.saveCalls.filter(i=>i==='Z').length,1);clock.t+=BLOCK_COOLDOWN_MS;await f.store.sync();assert.equal(f.saveCalls.filter(i=>i==='Z').length,2);f.store.close();});

test('topic store: a device clock that moves backwards does not keep an entry blocked',async()=>{clock.t=2e12;const f=fixture();await f.store.start();f.rule(denyA);f.store.enqueue('c~t','a',value());await settle();clock.t-=3600000;f.rule(()=>null);await f.store.sync();assert.equal(saved(f,'a'),true);f.store.close();});
test('mock exam: a device clock that moves backwards does not keep an attempt blocked',async()=>{clock.t=2e12;const f=mockFixture();f.rule(a=>a.id==='B'?'permission-denied':null);await f.store.start();f.store.save(createAttempt(templates84101,{seed:'b',id:'B'}));await settle();clock.t-=3600000;f.rule(()=>null);await f.store.sync();assert.ok(f.server().some(a=>a.id==='B'));f.store.close();});
