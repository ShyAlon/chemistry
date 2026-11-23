import test from 'node:test';import assert from 'node:assert/strict';
import catalogue from '#catalogue';
import {proseSpeech} from '../src/read-aloud/speech.js';
import {applyPronunciation,pronunciationEntries} from '../src/read-aloud/pronunciation.js';

const ASSEMBLY=['הרכבה','בהרכבה','להרכבות']; // הרכבה = assembly, a different word

test("Shy's Raoult example is spoken with composition pointing",()=>{
 const out=proseSpeech('חוק ראול: הרכב הנוזל אינו הרכב האדים');
 assert.equal(out.match(/הֶרְכֵּב/g).length,2);
 assert.ok(!/(?<![א-ת])הרכב(?![א-ת])/.test(out),'no unpointed הרכב remains');
});

test('every reviewed phrase maps exactly, in isolation',()=>{
 for(const e of pronunciationEntries)assert.equal(applyPronunciation(e.written),e.spoken,e.written);
});

test('a bare הרכב is never pointed: vehicle and unknown contexts keep the written form',()=>{
 for(const s of ['הרכב נסע במהירות','ראיתי את הרכב','באותו הרכב נסענו','ההרכב עוד לא נסקר','הרכב הקיר'])assert.equal(applyPronunciation(s),s,s);
});

test('assembly look-alikes are never pointed',()=>{
 for(const w of ASSEMBLY){
  assert.equal(proseSpeech(w+' עצמית'),w+' עצמית',w);
  assert.equal(applyPronunciation(w),w,w);
 }
});

// Word-token offset of the הרכב-bearing token inside a phrase (prefix letters
// like ו/ב/ל belong to the same token; maqaf splits it).
function tokenOffsetIn(phrase){
 const i=phrase.search(/הרכב/);let s=i;
 while(s>0&&/[א-ת]/.test(phrase[s-1]))s--;
 return s;
}
function coveredPositions(text){
 const covered=new Set();
 for(const e of pronunciationEntries){
  let idx=-1;const off=tokenOffsetIn(e.written);
  while((idx=text.indexOf(e.written,idx+1))!==-1)covered.add(idx+off);
 }
 return covered;
}

test('every composition הרכב in course theory is covered by a reviewed phrase; assembly forms are excluded',()=>{
 let composition=0;
 for(const course of catalogue.courses)for(const topic of course.topics||[])
  for(const block of topic.content?.theory||[]){
   const covered=coveredPositions(block.text);
   for(const m of block.text.matchAll(/[א-ת]*הרכב[א-ת]*/g)){
    if(ASSEMBLY.includes(m[0])){assert.ok(!covered.has(m.index),'assembly form mapped: '+m[0]);continue;}
    assert.ok(covered.has(m.index),'unreviewed הרכב context: ...'+block.text.slice(Math.max(0,m.index-25),m.index+25)+'...');
    composition++;
   }
  }
 assert.ok(composition>=26,'scan actually covered the corpus, found '+composition);
});

test('spoken output for reviewed contexts carries the hint; display text is untouched',()=>{
 for(const course of catalogue.courses)for(const topic of course.topics||[])
  for(const block of topic.content?.theory||[]){
   if(!/(?<![א-ת])הרכב(?![א-ת])/.test(block.text))continue;
   assert.ok(!/ֶ|ְ|ֵ/.test(block.text),'display text gained nikud');
   const spoken=proseSpeech(block.text);
   for(const e of pronunciationEntries)if(block.text.includes(e.written))assert.ok(spoken.includes('הֶרְכֵּב'),'missing spoken hint for '+e.written);
  }
});
