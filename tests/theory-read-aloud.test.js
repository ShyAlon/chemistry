import test from 'node:test';import assert from 'node:assert/strict';
import catalogue from '#catalogue';import readings from '../src/read-aloud/equation-readings.json' with {type:'json'};
import {topicNarration} from '../src/read-aloud/topic-sections.js';import {proseSpeech} from '../src/read-aloud/speech.js';
const topics=catalogue.courses.find(c=>c.id==='84101').topics;
test('all sixteen existing theory topics keep one reading unit per original block',()=>{
 assert.equal(topics.length,16);let total=0,equations=0,figures=0;const ids=new Set();
 for(const t of topics){const before=JSON.stringify(t);const chunks=topicNarration(t.id,t.content.theory);assert.equal(chunks.length,t.content.theory.length);assert.equal(JSON.stringify(t),before);
  for(const [i,c]of chunks.entries()){assert.equal(c.display,t.content.theory[i].text);assert.ok(c.spoken.length>0);assert.ok(!/[A-Za-z{}]/.test(c.spoken),c.id);assert.ok(!ids.has(c.id));ids.add(c.id);if(t.content.theory[i].layout==='equation')equations++;if(c.style==='Figure')figures++;}total+=chunks.length;
 }assert.equal(total,551);assert.equal(equations,121);assert.equal(figures,23);assert.equal(Object.keys(readings).length,121);
});
test('changed or newly introduced equation requires source review',()=>{
 const t=structuredClone(topics[0]);t.content.theory[6].text+=' + 1';assert.throws(()=>topicNarration(t.id,t.content.theory),/needs review/);
 assert.throws(()=>topicNarration('not-reviewed',[{style:'Normal',layout:'equation',text:'X = Y'}]),/needs review/);
});
test('theory units contain no worked exercises, quiz answers, drafts or other courses',()=>{
 for(const t of topics){const chunks=topicNarration(t.id,t.content.theory);assert.ok(chunks.every(c=>c.id.startsWith('84101-'+t.id+'-theory-')));assert.ok(chunks.every((c,i)=>c.sourceIndex===i));}
});
test('paragraphs are not split into sentence utterances',()=>{
 const t=topics[0],c=topicNarration(t.id,t.content.theory)[1];assert.equal(c.display,t.content.theory[1].text);assert.ok(c.spoken.includes('תערובת'));assert.ok(c.spoken.split('.').length>2);
});
test('constants resolve from the current registry and units are pronounced, not raw tokens',()=>{
 const t=topics.find(t=>t.id==='G9');const c=topicNarration(t.id,t.content.theory).find(c=>c.display.includes('{R@latm}'));
 assert.ok(c.spoken.includes('0.08206'));assert.ok(c.spoken.includes('ליטר אטמוספרה למול לקלווין'));assert.ok(!c.spoken.includes('{'));
});
test('literal inline notation distinguishes phases and units from variable letters',()=>{
 assert.ok(proseSpeech('m/V').includes('אם חלקי וי'));assert.ok(proseSpeech('300 K').includes('קלווין'));assert.ok(proseSpeech('HCl(aq)').includes('בתמיסה מימית'));assert.ok(proseSpeech('H₂O').includes('מים'));assert.ok(!proseSpeech('H₂O₂').includes('חמצן דו אטומי'));assert.ok(proseSpeech('0.028 kg/mol').includes('קילוגרם למול'));
});
test('authored readings retain scientific distinctions across chemistry topics',()=>{
 assert.ok(readings['G8:9'].spoken.includes('פרמנגנט'));assert.ok(readings['G15:15'].spoken.includes('פחות'));assert.ok(readings['G16:27'].spoken.includes('מחצית החיים'));assert.ok(readings['G12:29'].spoken.includes('מינוס עשר'));
});
test('spoken fractions make compound denominators and grouped roots explicit',()=>{
 for(const key of ['G9:25','G10:18','G10:64','G10:114','G12:11','G15:39','G15:49'])assert.ok(readings[key].spoken.includes('במכנה'),key);
 assert.ok(readings['G10:39'].spoken.includes('חלקי המכפלה של פאי ואם'));
 assert.ok(readings['G10:98'].spoken.includes('חלקי ההפרש'));
 assert.ok(readings['G15:53'].spoken.includes('הגורם הראשון'));
});
