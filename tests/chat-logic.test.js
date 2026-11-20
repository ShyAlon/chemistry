import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAT_MODELS,CHAT_TIMEOUT_MS,SYSTEM_INSTRUCTION,stripMarkdown,matchSubjects,isMiss,SUBJECT_CARD_LIMIT,isRetryable,isQuotaError,modelAfterFailure,buildMissPayload,chatErrorMessage,MISS_QUESTION_MAX} from '../src/chat-logic.js';

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

test('stripMarkdown removes what the model was told not to emit',()=>{
 assert.equal(stripMarkdown('**אוסמוזה** היא מעבר מים'),'אוסמוזה היא מעבר מים');
 assert.equal(stripMarkdown('## כותרת\nטקסט'),'כותרת\nטקסט');
 assert.equal(stripMarkdown('משתנה `x_A` כאן'),'משתנה x_A כאן');
 assert.equal(stripMarkdown('- נקודה ראשונה'),'• נקודה ראשונה');
 assert.equal(stripMarkdown('  טקסט  \n\n\n\nעוד'),'טקסט\n\nעוד');
});

test('system instruction forbids markdown and invented coverage claims',()=>{
 assert.match(SYSTEM_INSTRUCTION,/Markdown/);
 assert.match(SYSTEM_INSTRUCTION,/אל תטען/);
 assert.match(SYSTEM_INSTRUCTION,/4 משפטים/);
});

test('matchSubjects routes real Hebrew intents to navigable catalogue cards',()=>{
 const cards=matchSubjects('מה זה אוסמוזה?');
 assert.ok(cards.length>=1&&cards.length<=SUBJECT_CARD_LIMIT);
 assert.ok(cards.every(c=>c.route&&c.kind&&c.title));
 const ligand=matchSubjects('הסבר על ליגנדים');
 assert.ok(ligand.length>=1,'alias/normalization should find ליגנד');
});

test('a topic the site does not cover is detected as a miss',()=>{
 const cards=matchSubjects('אלקטרוליזה');
 assert.ok(isMiss(cards));
 assert.ok(!isMiss(matchSubjects('אוסמוזה')));
 assert.ok(isMiss(null)&&isMiss([]));
});
