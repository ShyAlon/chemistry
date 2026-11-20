import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {searchSite} from '../src/search.js';
import {CHAT_MODELS,CHAT_TIMEOUT_MS,stripMarkdown,SUBJECT_CARD_LIMIT,buildRoutingSystemInstruction,ROUTING_GENERATION_CONFIG,matchIntentTerms,parseRoutingResponse,isRetryable,isQuotaError,modelAfterFailure,buildMissPayload,chatErrorMessage,MISS_QUESTION_MAX} from '../src/chat-logic.js';

test('transient failures on the primary route once to the fallback',()=>{
 assert.equal(modelAfterFailure(CHAT_MODELS.primary,{status:500}),CHAT_MODELS.fallback);
 assert.equal(modelAfterFailure(CHAT_MODELS.primary,{status:408,message:'chat request timed out'}),CHAT_MODELS.fallback,'a stalled request falls back');
 assert.equal(CHAT_MODELS.primary,'gemini-3.5-flash-lite','20/day quota makes 3.8-flash untenable as primary (verified live 2026-11-20)');
 assert.equal(modelAfterFailure(CHAT_MODELS.primary,{status:429}),CHAT_MODELS.fallback);
 assert.equal(modelAfterFailure(CHAT_MODELS.primary,{message:'The model is overloaded, try again later'}),CHAT_MODELS.fallback);
});

test('no retry from the fallback, and non-retryable errors stay put',()=>{
 assert.equal(modelAfterFailure(CHAT_MODELS.fallback,{status:500}),null);
 assert.equal(modelAfterFailure(CHAT_MODELS.primary,{status:401}),null);
 assert.equal(modelAfterFailure(CHAT_MODELS.primary,{status:400,message:'invalid request'}),null);
});

test('retryable and quota classifiers agree on 429 but differ on 401',()=>{
 assert.ok(isRetryable({status:429})&&isQuotaError({status:429}));
 assert.ok(isQuotaError({message:'RESOURCE_EXHAUSTED: quota'}));
 assert.ok(!isRetryable({status:401})&&!isQuotaError({status:401}));
});

test('miss payload matches the deployed Firestore rules exactly',()=>{
 const p=buildMissPayload({question:'  מה זה אוסמוזה? ',answer:'תשובה',uid:'u1'});
 assert.deepEqual(Object.keys(p).sort(),['answer','question','uid']);
 assert.equal(p.question,'מה זה אוסמוזה?');
 assert.equal(p.uid,'u1');
 assert.ok(!('createdAt' in p),'caller adds serverTimestamp');
 const bare=buildMissPayload({question:'נושא',uid:'u2'});
 assert.deepEqual(Object.keys(bare).sort(),['question','uid']);
});

test('miss payload trims to the rules limit and rejects empty questions',()=>{
 const long=buildMissPayload({question:'א'.repeat(MISS_QUESTION_MAX+500),uid:'u'});
 assert.equal(long.question.length,MISS_QUESTION_MAX);
 assert.throws(()=>buildMissPayload({question:'   ',uid:'u'}));
 assert.throws(()=>buildMissPayload({uid:'u'}));
});

test('quota errors route the learner to site search; others to a plain retry',()=>{
 const q=chatErrorMessage({status:429});
 assert.match(q.next,/חיפוש האתר/);
 const g=chatErrorMessage({status:401});
 assert.match(g.next,/מנסים שוב/);
 assert.doesNotMatch(g.next,/חיפוש/);
});

const catalogue=JSON.parse(readFileSync(new URL('../src/courses.json',import.meta.url)));
// Deterministic matcher: the real local search over the real catalogue, the
// same path the app wires into parseRoutingResponse.
const matchTerms=(term,opts)=>searchSite(term,opts);

test('routing instruction demands JSON and plain-text answers, no coverage claims',()=>{
 const instruction=buildRoutingSystemInstruction();
 assert.match(instruction,/JSON/);
 assert.match(instruction,/"terms"/);
 assert.match(instruction,/Markdown/);
 assert.ok(!instruction.includes('84102/'),'no topic list is injected - the model never sees IDs to invent');
});

test('generation config pins strict JSON with answer and terms',()=>{
 assert.equal(ROUTING_GENERATION_CONFIG.responseMimeType,'application/json');
 assert.deepEqual(ROUTING_GENERATION_CONFIG.responseSchema.required,['answer','terms']);
});

test('valid structured response yields real catalogue cards from local matching',()=>{
 const r=parseRoutingResponse(JSON.stringify({answer:'תשובה קצרה',terms:['אוסמוזה','לחץ אוסמוטי']}),matchTerms);
 assert.ok(r.ok);
 assert.equal(r.answer,'תשובה קצרה');
 assert.ok(r.cards.length>0);
 assert.ok(r.cards.every(c=>c.route.startsWith('course/')),'every card is a real navigable route');
 assert.ok(r.cards.some(c=>c.route==='course/84101/G15'),'osmose intent reaches the osmose topic');
 assert.equal(r.missing,false);
});

test('intent terms match one at a time, deduped and capped',()=>{
 const r=parseRoutingResponse(JSON.stringify({answer:'a',terms:['לחץ אדים','שיווי משקל','טמפרטורת רתיחה','מעבר פאזה']}),matchTerms);
 assert.ok(r.cards.length>0,'vapor-pressure intent finds real cards');
 assert.ok(r.cards.some(c=>c.route==='course/84101/G13'));
 assert.ok(r.cards.length<=SUBJECT_CARD_LIMIT);
 assert.equal(new Set(r.cards.map(c=>c.route)).size,r.cards.length,'no duplicate routes');
 const joined=parseRoutingResponse(JSON.stringify({answer:'a',terms:['מסה מולרית','מול','מספר אבוגדרו']}),matchTerms);
 assert.ok(joined.cards.some(c=>c.route.includes('glossary/mole')||c.route==='course/84102/P5'),'mole intent survives extra terms');
});

test('unrelated intent terms produce a grounded miss, never invented cards',()=>{
 const r=parseRoutingResponse(JSON.stringify({answer:'זה לא נלמד כאן',terms:['פוטוסינתזה']}),matchTerms);
 assert.ok(r.ok);
 assert.deepEqual(r.cards,[]);
 assert.equal(r.missing,true);
});

test('code-fenced JSON parses; malformed JSON degrades honestly to ok:false',()=>{
 const fenced='```json\n{"answer":"א","terms":["אנרגיית יינון"]}\n```';
 const ok=parseRoutingResponse(fenced,matchTerms);
 assert.ok(ok.ok);
 assert.ok(ok.cards.some(c=>c.route==='course/84102/P9'));
 const bad=parseRoutingResponse('מצטער, נפלה שגיאה',matchTerms);
 assert.equal(bad.ok,false);
 assert.deepEqual(bad.cards,[]);
 assert.equal(bad.missing,false);
});

test('empty or non-string terms are tolerated without model calls or cards',()=>{
 const r=parseRoutingResponse(JSON.stringify({answer:'א',terms:[42,'',null]}),matchTerms);
 assert.ok(r.ok);
 assert.deepEqual(r.terms,[]);
 assert.deepEqual(r.cards,[]);
 assert.equal(r.missing,false);
});
