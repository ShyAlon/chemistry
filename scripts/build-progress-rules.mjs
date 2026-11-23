import {readFile,writeFile} from 'node:fs/promises';import catalogue from '#catalogue';import {sessions} from '../src/practice-sessions.js';import {buildManifest} from '../src/progress-model.js';
const courses=catalogue.courses.map(c=>({...c,topics:c.topics.map(t=>({...t,...t.content}))})),manifest=buildManifest(courses,sessions),spec=Object.fromEntries(Object.entries(manifest).map(([id,m])=>[id,m.kind==='practice'?{'@practice':true}:m.questions]));
const block=`
    // Account-bound outcomes only. No activity or reset-history collections.
    function owned(uid) { return request.auth != null && request.auth.uid==uid
      && !exists(/databases/$(database)/documents/users/$(uid)/studyAccess/closed); }
    function questions(id) { return ${Object.entries(spec).map(([id,q])=>`id==${JSON.stringify(id)}?${JSON.stringify(q)}:`).join('')}{}; }
    function time(v) { return v.at is string && v.at.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\\\.[0-9]{3}Z$'); }
    function topicData(d,q) {
      let key=d.changedQuestion; let old=resource==null?{}:resource.data.answers; let v=d.answers[key];
      return d.keys().hasOnly(['schema','course','topic','kind','answers','changedQuestion','updatedAt'])
        && d.kind=='topic' && key in q && d.answers is map && d.answers.keys().hasOnly(q.keys())
        && d.answers.diff(old).affectedKeys().hasOnly([key])
        && v.keys().hasOnly(['correct','kind','at']) && v.correct is bool && v.kind==q[key] && time(v);
    }
    function choice(v) { return v is int && v>=0 && v<=3; }
    function practiceData(d) { let v=d.value;
      return d.keys().hasOnly(['schema','course','topic','kind','value','updatedAt']) && d.kind=='practice'
        && v.keys().hasOnly(['choices','score','at','attempts']) && v.choices is list && v.choices.size()==10
        && choice(v.choices[0]) && choice(v.choices[1]) && choice(v.choices[2]) && choice(v.choices[3]) && choice(v.choices[4])
        && choice(v.choices[5]) && choice(v.choices[6]) && choice(v.choices[7]) && choice(v.choices[8]) && choice(v.choices[9])
        && v.score is int && v.score>=0 && v.score<=10 && v.attempts is int && v.attempts>0 && time(v);
    }
    function validProgress(id,d) { let q=questions(id);
      return q.size()>0 && d.schema==1 && id==d.course+'~'+d.topic && d.updatedAt==request.time
        && (('@practice' in q)?practiceData(d):topicData(d,q));
    }
    match /users/{uid}/studyProgress/{id} {
      allow get,list,delete: if owned(uid);
      allow create,update: if owned(uid) && validProgress(id,request.resource.data);
    }
    // Mock-exam attempts: one bounded document per attempt, owner only.
    // The paper itself is a bounded JSON string: Firestore's expression
    // budget cannot afford per-part validation of five nested questions.
    function mockStr(v,n) { return v is string && v.size()<=n; }
    function validMock(id,d) {
      return id==d.id && d.schema==1 && mockStr(d.id,64) && d.course=='84101' && mockStr(d.seed,64)
        && d.keys().hasOnly(['schema','id','course','seed','status','createdAt','submittedAt','expireAt','elapsedSec','timerRunning','drafts','selfMarks','questions','_ts'])
        && (d.status=='open'||d.status=='submitted')
        && mockStr(d.createdAt,40) && (d.submittedAt==null || mockStr(d.submittedAt,40))
        && (d.expireAt==null || mockStr(d.expireAt,40))
        && d.elapsedSec is int && d.elapsedSec>=0 && d.elapsedSec<=864000 && d.timerRunning is bool
        && d.drafts is map && d.drafts.keys().size()<=10 && d.selfMarks is map && d.selfMarks.keys().size()<=10
        && d.questions is string && d.questions.size()<=60000
        && d._ts==request.time;
    }
    match /users/{uid}/mockExam/{id} {
      allow get,list,delete: if owned(uid);
      allow create,update: if owned(uid) && validMock(id,request.resource.data);
    }
    // Privacy/account closure only, never used for ordinary progress reset.
    match /users/{uid}/studyAccess/{id} { allow read,write: if false; }
`;
const baseline=await readFile(new URL('../operations/firestore/baseline.rules',import.meta.url),'utf8'),output=baseline.replace('    match /{document=**}',()=>block+'    match /{document=**}'),target=new URL('../operations/firestore/progress.rules',import.meta.url);
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==output)throw Error('Progress Rules are stale: npm run rules:generate');}else await writeFile(target,output);
console.log(`Progress Rules: ${Object.keys(manifest).length} bounded records; no epochs, activity or recovery paths`);
