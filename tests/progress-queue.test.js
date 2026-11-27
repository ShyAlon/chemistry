import test from 'node:test';import assert from 'node:assert/strict';
import {createProgressStore,isItemError} from '../src/progress-store.js';import {apply} from '../src/progress-model.js';
const manifest={'c~t':{course:'c',topic:'t',kind:'topic',questions:{a:'mcq',b:'mcq',c:'mcq'}},'c~s':{course:'c',topic:'s',kind:'practice',questions:{},correct:Array(10).fill(0)}};
const value=(correct=true)=>({correct,kind:'mcq',at:'2026-11-22T12:00:00.000Z'});
class Storage{m=new Map();getItem(k){return this.m.has(k)?this.m.get(k):null;}setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}}
const settle=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));};
// rule(op) returns an error code to throw for that entry, or nothing.
function fixture(storage=new Storage(),shared={}){const calls=[];let rule=()=>null;const gateway={async load(){return structuredClone(shared);},async commit(o,m){calls.push(o.record+'/'+o.item);const code=rule(o);if(code)throw Object.assign(new Error(code),{code});shared[o.record]=apply(shared[o.record],o,m);},async reset(){}};
 const store=createProgressStore({uid:'u',storage,gateway,manifest});return {store,shared,storage,calls,rule:f=>rule=f};}
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
import {createAttempt} from '../src/mock-exam/attempt.js';
import {templates84101} from '../src/mock-exam/templates-84101.js';
function mockFixture(storage=new Storage(),server=[]){const saveCalls=[];let rule=()=>null;const gateway={async save(a){saveCalls.push(a.id);const c=rule(a);if(c)throw Object.assign(new Error(c),{code:c});server=server.filter(x=>x.id!==a.id).concat([a]);},async load(){return server.map(a=>({...a}));},async remove(ids){server=server.filter(a=>!ids.includes(a.id));}};
 const store=createMockExamStore({uid:'u',storage,gateway});return {store,storage,saveCalls,server:()=>server,rule:f=>rule=f};}
test('mock exam: a denied attempt does not stop other attempts, load or retention',async()=>{const f=mockFixture();await f.store.start();f.rule(a=>a.id==='bad'?'permission-denied':null);
 f.store.save(createAttempt(templates84101,{seed:'s1',id:'bad'}));f.store.save(createAttempt(templates84101,{seed:'s2',id:'good'}));await settle();
 assert.deepEqual(f.server().map(a=>a.id),['good']);const s=f.store.snapshot();assert.equal(s.blocked,1);assert.equal(s.pending,1);assert.equal(s.phase,'attention');assert.ok(s.attempts.bad,'denied attempt kept locally');
 const n=f.saveCalls.filter(i=>i==='bad').length;await f.store.sync();assert.equal(f.saveCalls.filter(i=>i==='bad').length,n,'not retried automatically');
 f.rule(()=>null);await f.store.retry();assert.deepEqual(f.server().map(a=>a.id).sort(),['bad','good']);assert.equal(f.store.snapshot().phase,'saved');f.store.close();});
test('mock exam: transient error keeps attempts pending and blocks none',async()=>{const f=mockFixture();await f.store.start();f.rule(()=>'unavailable');f.store.save(createAttempt(templates84101,{seed:'s1',id:'m1'}));await settle();assert.equal(f.store.snapshot().blocked,0);assert.equal(f.store.snapshot().pending,1);f.rule(()=>null);await f.store.sync();assert.equal(f.store.snapshot().pending,0);f.store.close();});
