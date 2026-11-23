import test from 'node:test';
import assert from 'node:assert/strict';
import {templates84101} from '../src/mock-exam/templates-84101.js';
import {rng} from '../src/mock-exam/rng.js';
import {createAttempt,markNumeric,scoreAttempt,expiryFor,applyRetention,submitAttempt,validateAttempt,TOLERANCE,PAPER_SIZE,MAX_COMPLETED} from '../src/mock-exam/attempt.js';

test('every template generates finite numeric answers and required fields across seeds',()=>{
 for(const t of templates84101){
  for(let s=0;s<500;s++){
   const v=t.generate(rng(t.id+':'+s));
   assert.ok(v.given.length>20,t.id);
   assert.ok(v.parts.length>=2,t.id);
   for(const p of v.parts){
    assert.ok(['numeric','concept'].includes(p.kind));
    if(p.kind==='numeric'){
     assert.ok(Number.isFinite(p.answer),`${t.id} ${p.label}`);
     assert.ok(Array.isArray(p.solution)&&p.solution.length>0);
    }else{
     assert.ok(p.modelAnswer&&p.modelAnswer.length>20);
    }
   }
  }
 }
});

test('variants are deterministic per seed and differ across seeds',()=>{
 const a=createAttempt(templates84101,{seed:'abc',id:'a1'});
 const b=createAttempt(templates84101,{seed:'abc',id:'a1'});
 const c=createAttempt(templates84101,{seed:'abd',id:'a1'});
 assert.deepEqual(a.questions,b.questions);
 assert.notDeepEqual(a.questions,c.questions);
});

test('paper draws at most one question per area, up to PAPER_SIZE',()=>{
 const a=createAttempt(templates84101,{seed:'x',id:'a1'});
 assert.ok(a.questions.length<=PAPER_SIZE);
 const areas=a.questions.map(q=>q.area);
 assert.equal(new Set(areas).size,areas.length);
});

test('marking accepts 5% relative error per Shy example (1.03 for 0.99)',()=>{
 assert.equal(TOLERANCE,0.05);
 assert.ok(markNumeric('1.03',0.99));          // his exact example
 assert.ok(markNumeric('20.9',20.0));           // +4.5%
 assert.ok(!markNumeric('21.2',20.0));          // +6%
 assert.ok(markNumeric('0.945',0.99));          // -4.5%
 assert.ok(!markNumeric('abc',20.0));
 assert.ok(markNumeric('2.01×10⁴',20000));      // formatted input parses
});

test('equal weight: every part of every question counts the same',()=>{
 const a=createAttempt(templates84101,{seed:'s',id:'a1'});
 // Answer every numeric part correctly, leave concept parts unmarked.
 for(const q of a.questions){
  a.drafts[q.templateId]={};
  for(const p of q.parts)if(p.kind!=='concept')a.drafts[q.templateId][p.label]=String(p.answer);
 }
 const s=scoreAttempt(a);
 const totalParts=a.questions.reduce((n,q)=>n+q.parts.length,0);
 assert.equal(s.total,totalParts);
 assert.equal(s.autoCorrect,s.autoTotal);
 assert.equal(s.selfCorrect,0);
 assert.equal(s.percent,Math.round(100*s.autoTotal/totalParts));
 // Now self-mark every concept part: percent reaches 100.
 for(const q of a.questions){
  a.selfMarks[q.templateId]={};
  for(const p of q.parts)if(p.kind==='concept')a.selfMarks[q.templateId][p.label]=true;
 }
 assert.equal(scoreAttempt(a).percent,100);
});

test('expiry is three calendar months, not 90 days',()=>{
 assert.equal(expiryFor('2026-11-30T10:00:00.000Z'),'2027-02-28T10:00:00.000Z');  // clamped, not Mar 2
 assert.equal(expiryFor('2026-12-15T10:00:00.000Z'),'2027-03-15T10:00:00.000Z'); // day-of-month preserved
 // Jan 31 distinguishes: 3 calendar months = Apr 30; a 90-day rule gives May 1.
 assert.equal(expiryFor('2027-01-31T10:00:00.000Z'),'2027-04-30T10:00:00.000Z');
 assert.equal(new Date(new Date('2027-01-31T10:00:00.000Z').getTime()+90*24*3600*1000).toISOString(),
  '2027-05-01T10:00:00.000Z');
});

test('submit marks status, stamps expiry, stops timer',()=>{
 const a=createAttempt(templates84101,{seed:'s',id:'a1'});
 a.timerRunning=true;
 const s=submitAttempt(a,new Date('2026-11-23T09:00:00.000Z'));
 assert.equal(s.status,'submitted');
 assert.equal(s.timerRunning,false);
 assert.equal(s.expireAt,'2027-02-23T09:00:00.000Z');
});

test('retention deletes expired on next use and trims beyond 10 completed',()=>{
 const now=new Date('2026-11-23T09:00:00.000Z');
 const mk=(id,sub)=>({id,status:'submitted',submittedAt:sub,expireAt:expiryFor(sub)});
 const attempts=[mk('old','2026-08-01T09:00:00.000Z')];   // expired Nov 1
 for(let i=0;i<12;i++)attempts.push(mk('c'+i,`2026-11-${String(i+1).padStart(2,'0')}T09:00:00.000Z`));
 attempts.push({id:'open1',status:'open',submittedAt:null,expireAt:null});
 const {keep,drop}=applyRetention(attempts,now);
 assert.ok(drop.some(a=>a.id==='old'),'expired dropped on next use');
 assert.ok(keep.some(a=>a.id==='open1'),'open attempt always kept');
 assert.equal(keep.filter(a=>a.status==='submitted').length,MAX_COMPLETED);
 assert.ok(keep.some(a=>a.id==='c11'),'newest kept');
 assert.ok(!keep.some(a=>a.id==='c0'),'oldest trimmed');
});

// --- Store: cache + sync + retention on load -------------------------------
import {createMockExamStore,mockPrefix} from '../src/mock-exam/store.js';

function fakeStorage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),_map:m};}
function fakeGateway(server=[]){return {
 saved:[],removed:[],
 async save(a){this.saved.push(a.id);server=server.filter(x=>x.id!==a.id).concat([a]);},
 async load(){return server.map(a=>({...a}));},
 async remove(ids){this.removed.push(...ids);server=server.filter(a=>!ids.includes(a.id));},
 _get:()=>server};}

test('store caches locally and pushes unsynced work to the account',async()=>{
 const storage=fakeStorage(),gw=fakeGateway();
 const store=createMockExamStore({uid:'u1',storage,gateway:gw,changed:()=>{}});
 await store.start();
 const a=createAttempt(templates84101,{seed:'s1',id:'m1'});
 store.save(a);
 for(let i=0;i<50&&store.snapshot().pending;i++)await new Promise(r=>setTimeout(r,5));
 assert.deepEqual(gw.saved,['m1']);
 const cache=JSON.parse(storage.getItem(mockPrefix('u1')+'cache'));
 assert.equal(cache.attempts.m1._synced,true);
 assert.equal(cache.attempts.m1.questions.length,5);
});

test('store applies retention at load: expired synced attempts deleted server-side',async()=>{
 const old=submitAttempt(createAttempt(templates84101,{seed:'old',id:'old1'}),new Date('2026-06-01T10:00:00.000Z'));
 const fresh=submitAttempt(createAttempt(templates84101,{seed:'new',id:'new1'}),new Date('2026-11-20T10:00:00.000Z'));
 const storage=fakeStorage(),gw=fakeGateway([old,fresh]);
 const store=createMockExamStore({uid:'u1',storage,gateway:gw,changed:()=>{}});
 await store.start();
 assert.deepEqual(gw.removed,['old1']);           // 3 calendar months passed
 assert.ok(store.snapshot().attempts.new1);
 assert.equal(store.snapshot().attempts.old1,undefined);
});

test('store keeps unsynced local work offline without touching the account',async()=>{
 const storage=fakeStorage(),gw=fakeGateway();
 const store=createMockExamStore({uid:'u1',storage,gateway:gw,online:()=>false,changed:()=>{}});
 await store.start();
 store.save(createAttempt(templates84101,{seed:'s2',id:'m2'}));
 await store.sync();
 assert.deepEqual(gw.saved,[]);
 assert.equal(store.snapshot().pending,1);
 assert.ok(store.snapshot().attempts.m2);
});

test('paper balancing: exactly PAPER_SIZE questions, distinct areas, every area reachable across seeds',()=>{
 const allAreas=new Set(templates84101.map(t=>t.area));
 const seen=new Set();
 for(let i=0;i<80;i++){
  const a=createAttempt(templates84101,{seed:'bal:'+i,id:'b'+i});
  assert.equal(a.questions.length,PAPER_SIZE);
  const areas=a.questions.map(q=>q.area);
  assert.equal(new Set(areas).size,PAPER_SIZE,'one question per area');
  for(const q of a.questions){
   assert.ok(byAreaCount(q),q.templateId);
   seen.add(q.area);
  }
 }
 for(const area of allAreas)assert.ok(seen.has(area),`area never drawn: ${area}`);
 function byAreaCount(q){return templates84101.some(t=>t.id===q.templateId&&t.area===q.area);}
});

test('score denominator counts all parts; pending self-marks are explicit',()=>{
 const a=createAttempt(templates84101,{seed:'den:1',id:'d1'});
 // Fill every numeric draft correctly, leave concept parts unmarked.
 for(const q of a.questions)for(const p of q.parts)
  if(p.kind==='numeric'){a.drafts[q.templateId]=a.drafts[q.templateId]||{};a.drafts[q.templateId][p.label]=String(p.answer);}
 let s=scoreAttempt(a);
 assert.equal(s.autoCorrect,s.autoTotal);
 assert.equal(s.pending,s.selfTotal,'all concept parts pending before self-marking');
 assert.equal(s.selfMarked,0);
 // Percent is over ALL parts (equal weight), so pending concept parts lower it.
 assert.equal(s.percent,Math.round(100*s.autoCorrect/s.total));
 // Mark one concept part: pending drops, score rises, denominator unchanged.
 const q0=a.questions.find(q=>q.parts.some(p=>p.kind==='concept'));
 const p0=q0.parts.find(p=>p.kind==='concept');
 a.selfMarks[q0.templateId]={[p0.label]:true};
 s=scoreAttempt(a);
 assert.equal(s.pending,s.selfTotal-1);
 assert.equal(s.selfCorrect,1);
 assert.equal(s.total,s.autoTotal+s.selfTotal);
});

test('validateAttempt accepts a real attempt and rejects corrupt payloads',()=>{
 const a=submitAttempt(createAttempt(templates84101,{seed:'va:1',id:'v1'}));
 assert.ok(validateAttempt(JSON.parse(JSON.stringify(a))),'real attempt passes');
 const bad=[
  null,42,'x',[],
  {...a,questions:'not-an-array'},
  {...a,questions:[]},
  {...a,status:'weird'},
  {...a,elapsedSec:-3},
  {...a,questions:[{...a.questions[0],parts:[{...a.questions[0].parts[0],kind:'hybrid'}]}]},
  {...a,questions:[{...a.questions[0],given:'x'.repeat(5000)}]},
  {...a,questions:[{...a.questions[0],parts:a.questions[0].parts.map(p=>p.kind==='numeric'?{...p,answer:'12'}:p)}]},
  {...a,drafts:{x:{a:'y'.repeat(600)}}},
  {...a,selfMarks:{x:{a:'yes'}}},
 ];
 for(const b of bad)assert.equal(validateAttempt(b),null,JSON.stringify(b)?.slice(0,60));
 // A stored attempt with hostile markup in strings passes shape-checking but is
 // inert: React renders strings as text, so markup cannot execute.
 const hostile=JSON.parse(JSON.stringify(a));
 hostile.questions[0].given='<img src=x onerror=alert(1)>';
 hostile.questions[0].parts[0].question='<script>alert(1)</script>';
 assert.ok(validateAttempt(hostile),'markup is text, shape is valid');
});
