import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const numbers=s=>(s.match(/\d+(?:\.\d+)?/g)||[]);
const topics=[];
for(const c of fs.readdirSync(path.join(root,'src/content')))if(fs.existsSync(path.join(root,'src/content',c,'topics')))for(const f of fs.readdirSync(path.join(root,'src/content',c,'topics')))if(f.endsWith('.json'))topics.push([c+'/'+f,JSON.parse(fs.readFileSync(path.join(root,'src/content',c,'topics',f),'utf8'))]);
const quizzes=t=>(t.content?.quiz||t.quiz||[]);
test('answerLines are one complete calculation per line and carry exactly the numbers of the plain answer',()=>{
 let seen=0;
 for(const [name,t] of topics)for(const q of quizzes(t))if(q.answerLines){
  seen++;
  assert.ok(Array.isArray(q.answerLines)&&q.answerLines.length>=2,name+' q'+q.id+': answerLines needs 2+ lines');
  for(const l of q.answerLines){assert.equal(typeof l,'string');assert.ok(l.trim()&&!/[;]/.test(l),name+' q'+q.id+': one calculation per line, no semicolon: '+l)}
  assert.deepEqual(numbers(q.answerLines.join(' ')),numbers(q.answer),name+' q'+q.id+': lines must carry the same numbers as the plain answer, in order');
 }
 assert.ok(seen>=1,'G3 quiz 4 uses answerLines');
 const g3=Object.fromEntries(topics)['84101/G3.json'];
 assert.ok(quizzes(g3).find(q=>q.id===4).answerLines.every(l=>/^[A-Za-z0-9₀-₉]+: \d+\/\d+ = \d+\.\d+%$/.test(l)),'G3 q4 lines are compound: fraction = percent');
});
test('renderer shows answerLines as LTR lines and keeps the plain-answer fallback',()=>{
 const m=fs.readFileSync(path.join(root,'src/main.jsx'),'utf8');
 assert.match(m,/function AnswerBody\(\{q\}\)\{return Array\.isArray\(q\.answerLines\)/);
 assert.ok(!m.includes('<p><Rich text={q.answer}/></p><p>')&&!/<p><Rich text=\{q\.answer\}\/><\/p>(?!:)/.test(m.replace(/:<p><Rich text=\{q\.answer\}\/><\/p>\}/,'')),'every answer site goes through AnswerBody');
 assert.match(m,/className="answer-line" dir="ltr"/);
});

test('answerNote is a Hebrew explanation with no math, shown after the LTR lines',()=>{
 let seen=0;
 for(const [name,t] of topics)for(const q of quizzes(t))if(q.answerNote){seen++;assert.ok(Array.isArray(q.answerLines)&&q.answerLines.length>=2,name+' q'+q.id+': answerNote needs answerLines');assert.ok(/[\u0590-\u05FF]/.test(q.answerNote)&&!/[0-9=×]/.test(q.answerNote)&&!/[A-Za-z]/.test(q.answerNote),name+' q'+q.id+': note must be Hebrew prose without math')}
 assert.ok(seen>=1);
 const m=fs.readFileSync(path.join(root,'src/main.jsx'),'utf8');assert.match(m,/className="answer-note"/);
});
