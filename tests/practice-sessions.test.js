import test from 'node:test';
import assert from 'node:assert/strict';
import {sessions} from '../src/practice-sessions.js';
test('eight distinct ten-question sessions preserve a unique question/answer identity',()=>{
 assert.equal(sessions.length,8);const all=sessions.flatMap(s=>s.questions);assert.equal(all.length,80);assert.equal(new Set(all.map(q=>q.id)).size,80);assert.equal(new Set(all.map(q=>q.prompt)).size,80);
 for(const q of all){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.correct>=0&&q.correct<4);assert.ok(q.explanation.length>30);assert.match(q.topic,/^P\d+$/)}
 for(const s of sessions){assert.equal(s.questions.length,10);assert.ok(s.questions.some(q=>q.topic==='P2'));assert.ok(s.questions.some(q=>q.topic==='P4'));}
});
test('all forty numeric answers independently recompute with positive physical values',()=>{
 const num=(text)=>Number(text.split(' ')[0]);
 const wavelengths=[200,240,300,400,500,600,620,800],work=[2,2.5,2,1.5,1,1,.8,.5],zs=[1,2,3,2,1,3,2,3],ns=[1,2,3,1,2,2,3,1],ze=[2.4,3.1,3.5,2.8,3.6,2.2,3.25,2.9],shell=[3,4,5,4,6,3,6,5],ke=[1,2,4,5,8,10,16,20],dx=[.1,.2,.25,.3,.4,.5,.75,1];
 for(let i=0;i<8;i++){
  const expected=[1240/wavelengths[i]-work[i],13.6*(zs[i]/ns[i])**2,13.6*(ze[i]/shell[i])**2,1.226425966/Math.sqrt(ke[i]),5.7883818e-5/(dx[i]*1e-9)];
  for(let j=0;j<5;j++){const q=sessions[i].questions.find(q=>q.id==='practice-'+(i*10+j+1)),actual=num(q.options[q.correct]);assert.ok(actual>0);assert.ok(actual===Number(expected[j].toPrecision(3)),q.id+' '+actual+' vs '+expected[j])}
 }
});
test('conceptual answers include course-specific radial order, ionization contrast and safe ion rules',()=>{
 const all=sessions.flatMap(s=>s.questions),get=fragment=>all.find(q=>q.prompt.includes(fragment));
 assert.equal(get('היינון השנייה הגבוהה').options[get('היינון השנייה הגבוהה').correct],'B');
 assert.equal(get('מה קונפיגורציית Fe²⁺').options[get('מה קונפיגורציית Fe²⁺').correct],'[Ar]3d⁶');
 assert.equal(get('מהו Zeff של האלקטרון היחיד').options[get('מהו Zeff של האלקטרון היחיד').correct],'3');
 assert.equal(get('סדר רדיוסי השיא').options[get('סדר רדיוסי השיא').correct],'1s, 2p, 2s');
});
