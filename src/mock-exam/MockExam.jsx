import React,{useEffect,useMemo,useRef,useState} from 'react';
import {bidiElement} from '../bidi-react.js';
import {mathNotation} from '../math-notation.js';
import {normalizeBidiText} from '../bidi.js';
import {PageTitle} from '../PageTitle.jsx';
import {templates84101,fmtHe} from './templates-84101.js';
import {createAttempt,scoreAttempt,submitAttempt,markNumeric,PAPER_SIZE} from './attempt.js';
import {createMockExamStore} from './store.js';
import {firebaseMockExamGateway} from './firebase.js';
import {auth,db} from '../firebase-init.js';
import {examNote} from '../exam-84101.js';

const empty={phase:'loading',storageFailed:false,error:'',pending:0,attempts:{}};
function useMockExam(uid){
 const [state,setState]=useState(empty);
 const store=useMemo(()=>{let storage;try{storage=localStorage}catch{storage={getItem(){throw Error('storage')},setItem(){throw Error('storage')}}}return createMockExamStore({uid,storage,online:()=>navigator.onLine,gateway:firebaseMockExamGateway(uid,{db,account:()=>auth.currentUser}),changed:setState});},[uid]);
 useEffect(()=>{void store.start();const refresh=()=>void store.sync();for(const e of ['online','focus'])addEventListener(e,refresh);return()=>{store.close();for(const e of ['online','focus'])removeEventListener(e,refresh);};},[uid,store]);
 return {state,store};
}
// Worked algebra renders as explicit LTR math blocks, one equation per block,
// with Hebrew explanation as ordinary RTL paragraphs outside the blocks. The
// split is bracket-aware: a Hebrew label inside brackets (n(אתנול), P°(מים))
// is part of the formula and stays in the block as an RTL isolate. Each
// top-level semicolon starts a new block, so steps wrap deliberately.
const hebrewRun=/[\u0590-\u05ff]/u;
function splitSmart(text){
 const segs=[];let cur='',depth=0,heMode=null;
 const push=()=>{if(cur!=='')segs.push({he:heMode,s:cur});cur='';};
 for(const ch of String(text)){
  const he=hebrewRun.test(ch)&&depth===0;
  if(heMode===null||he!==heMode){push();heMode=he;}
  if('([{'.includes(ch))depth++;else if(')]}'.includes(ch))depth=Math.max(0,depth-1);
  cur+=ch;
 }
 push();
 return segs;
}
function topLevelSemicolons(s){
 const out=[];let cur='',depth=0;
 for(const ch of s){
  if('([{'.includes(ch))depth++;else if(')]}'.includes(ch))depth=Math.max(0,depth-1);
  if(ch===';'&&depth===0){out.push(cur);cur='';}else cur+=ch;
 }
 out.push(cur);return out;
}
const bracketedHebrew=/[(\[{][^()\[\]{}]*[\u0590-\u05ff][^()\[\]{}]*[)\]}]/u;
function mathChildren(s){
 const out=[];let rest=s,k=0,m;
 while((m=rest.match(bracketedHebrew))){
  if(m.index>0)out.push(...mathNotation(rest.slice(0,m.index)));
  out.push(<bdi key={'bh'+(k++)} dir="rtl">{m[0]}</bdi>);
  rest=rest.slice(m.index+m[0].length);
 }
 if(rest)out.push(...mathNotation(rest));
 return out;
}
function mixedBlocks(text,keyBase){
 const out=[];let prose='',n=0,carry='';
 const flush=()=>{const t=prose.trim();prose='';if(t)out.push(<p key={keyBase+'-p'+(n++)} dir="rtl">{normalizeBidiText(t)}</p>);};
 for(const seg of splitSmart(text)){
  if(seg.he){prose+=carry+seg.s;carry='';continue;}
  let math=seg.s,lead='';
  const lm=math.match(/^[\s:;,.\u2013-]*=?[\s]*/);
  if(lm){lead=lm[0];math=math.slice(lead.length);}
  const tm=math.match(/[\s,;]+$/);let tail='';
  if(tm){tail=tm[0];math=math.slice(0,math.length-tail.length);}
  const worked=/[=\u221a\u2211\u222b]/.test(math)||math.trim().length>24;
  if(worked){
   prose+=carry+lead;carry='';flush();
   for(const step of topLevelSemicolons(math)){
    const st=step.trim();
    if(st)out.push(<p key={keyBase+'-m'+(n++)} dir="ltr" className="mock-math">{mathChildren(st)}</p>);
   }
   carry=tail;
  }else{prose+=carry+seg.s;carry='';}
 }
 flush();
 return out;
}
const fmtTime=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=Math.floor(s%60);return `${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`;};

export function MockExam({user}){
 const {state,store}=useMockExam(user.uid);
 const [activeId,setActiveId]=useState(null);
 const attempts=Object.values(state.attempts).sort((a,b)=>(b.submittedAt||b.createdAt).localeCompare(a.submittedAt||a.createdAt));
 const active=activeId?state.attempts[activeId]:null;
 const open=attempts.find(a=>a.status==='open');
 // Count-up stopwatch with pause, per Shy's decision. Ticks while the paper is
 // open and running; the persisted elapsedSec is the source of truth.
 const tickRef=useRef(null);
 useEffect(()=>{
  if(!active||active.status!=='open'||!active.timerRunning)return;
  tickRef.current=setInterval(()=>{
   const cur=store.snapshot().attempts[active.id];
   if(cur&&cur.status==='open'&&cur.timerRunning)store.save({...cur,elapsedSec:cur.elapsedSec+1});
  },1000);
  return()=>clearInterval(tickRef.current);
 },[active?.id,active?.status,active?.timerRunning,store]);
 const patch=(id,fn)=>{const cur=store.snapshot().attempts[id];if(cur)store.save(fn(cur));};
 const startNew=()=>{
  if(open&&!confirm(`כבר יש מבחן פתוח (${new Date(open.createdAt).toLocaleDateString('he-IL')}). להתחיל מבחן חדש? הפתוח נשאר ברשימה.`))return;
  const id=crypto.randomUUID();
  const a=createAttempt(templates84101,{seed:id,id});
  store.save({...a,timerRunning:true});setActiveId(id);window.scrollTo(0,0);
 };
 const submit=id=>{
  const cur=store.snapshot().attempts[id];if(!cur)return;
  const answered=Object.values(cur.drafts).reduce((n,d)=>n+Object.values(d).filter(v=>String(v).trim()).length,0);
  const total=cur.questions.reduce((n,q)=>n+q.parts.length,0);
  if(answered<total&&!confirm(`עניתם על ${answered} מתוך ${total} סעיפים. להגיש בכל זאת? סעיפים ריקים נספרים כשגויים בחלק המספרי.`))return;
  patch(id,a=>submitAttempt(a));
 };
 const score=active?scoreAttempt(active):null;
 if(!active){
  return <main className="topic-page practice-page"><button className="back quiet" onClick={()=>{location.hash='course/84101'}}>→ לקורס</button><PageTitle>בחינה לדוגמה במספרים משתנים</PageTitle>
   <p className="practice-intro">{PAPER_SIZE} שאלות רב־שלביות, מספרים חדשים בכל מבחן. בדיקה אוטומטית בסובלנות של 5% לסעיפים המספריים, וסימון עצמי לסעיפי ההסבר אחרי חשיפת תשובת המודל. משקל שווה לכל סעיף.</p>
   <details className="practice-source"><summary>על המבחן, השעון והשמירה</summary>
    <p>שעון עצר סופר למעלה ואפשר להשהות אותו; אין ספירה לאחור. טיוטות התשובות נשמרות תוך כדי כתיבה בחשבון ובמכשיר, ואפשר לחזור למבחן פתוח בכל עת.</p>
    <p>מבחנים שהוגשו נשמרים לשלושה חודשים קלנדריים מיום ההגשה ואז מוסתרים; המחיקה מתבצעת בשימוש הבא. נשמרים עד 10 מבחנים שהוגשו — מעבר לזה, הישנים ביותר נמחקים.</p>
    <p>{examNote}</p>
   </details>
   {state.error&&<p role="alert" className="warning">הסנכרון עם החשבון נכשל ({state.error}). העבודה נשמרת במכשיר ותיסנכרן בחיבור פעיל.</p>}
   <section className="practice-session-grid" aria-label="מבחנים">
    <article className="panel practice-session-card"><h2>מבחן חדש</h2><p>{PAPER_SIZE} שאלות מתחומים שונים, עם שעון עצר ופתרונות אחרי הגשה.</p><button className="primary" onClick={startNew}>יוצרים מבחן ←</button></article>
    {open&&<article className="panel practice-session-card"><h2>מבחן פתוח</h2><p>נפתח ב-{new Date(open.createdAt).toLocaleDateString('he-IL')} · שעון: <bdi dir="ltr">{fmtTime(open.elapsedSec)}</bdi></p><button className="primary" onClick={()=>{setActiveId(open.id);window.scrollTo(0,0)}}>ממשיכים מהמקום שעצרנו ←</button></article>}
    {attempts.filter(a=>a.status==='submitted').map(a=>{const s=scoreAttempt(a);return <article className="panel practice-session-card" key={a.id}><h2>הוגש ב-{new Date(a.submittedAt).toLocaleDateString('he-IL')}</h2>
     <p>ציון: <bdi dir="ltr">{s.percent}%</bdi> · מספרי: <bdi dir="ltr">{s.autoCorrect}/{s.autoTotal}</bdi> · סימון עצמי: <bdi dir="ltr">{s.selfCorrect}/{s.selfTotal}</bdi>{s.pending>0&&<span> · ממתינים לסימון: <bdi dir="ltr">{s.pending}</bdi> (הציון זמני)</span>} · שעון: <bdi dir="ltr">{fmtTime(a.elapsedSec)}</bdi></p>
     <p className="practice-saved">נשמר עד {new Date(a.expireAt).toLocaleDateString('he-IL')}</p>
     <button className="secondary" onClick={()=>{setActiveId(a.id);window.scrollTo(0,0)}}>{s.selfCorrect<s.selfTotal?'השלמת סימון עצמי':'צפייה בפתרונות'}</button></article>})}
   </section>
  </main>;
 }
 const submitted=active.status==='submitted';
 return <main className="topic-page practice-page"><button className="back quiet" onClick={()=>setActiveId(null)}>→ כל המבחנים</button><PageTitle>בחינה לדוגמה</PageTitle>
  <div className="mock-exam-bar panel" role="status">
   <span>שעון: <bdi dir="ltr">{fmtTime(active.elapsedSec)}</bdi></span>
   {!submitted&&<button className="quiet" onClick={()=>patch(active.id,a=>({...a,timerRunning:!a.timerRunning}))}>{active.timerRunning?'השהיית השעון':'הפעלת השעון'}</button>}
   {submitted&&score&&<span>ציון: <bdi dir="ltr">{score.percent}%</bdi> · מספרי: <bdi dir="ltr">{score.autoCorrect}/{score.autoTotal}</bdi> · סימון עצמי: <bdi dir="ltr">{score.selfCorrect}/{score.selfTotal}</bdi>{score.pending>0&&<span> · ממתינים לסימון: <bdi dir="ltr">{score.pending}</bdi> (הציון זמני)</span>}</span>}
  </div>
  {active.questions.map((q,qi)=><article key={q.templateId} className="question panel practice-question" aria-labelledby={q.templateId}>
   <div className="exercise-index">שאלה <bdi dir="ltr">{qi+1}/{active.questions.length}</bdi> · <bdi dir="ltr">{q.area}</bdi></div>
   <h3 id={q.templateId}>{q.title}</h3>
   {bidiElement('p',null,q.given)}
   {q.parts.map(p=>{
    const draft=active.drafts?.[q.templateId]?.[p.label]??'';
    const correct=submitted&&p.kind==='numeric'?markNumeric(draft,p.answer):null;
    const self=active.selfMarks?.[q.templateId]?.[p.label];
    return <section key={p.label} className="mock-part">
     {bidiElement('h4',null,`סעיף ${p.label}. ${p.question}`)}
     {p.kind==='numeric'?<label className="mock-answer">תשובה{p.unit?` (${p.unit})`:''}: <input dir="ltr" inputMode="decimal" disabled={submitted} value={draft} onChange={e=>patch(active.id,a=>({...a,drafts:{...a.drafts,[q.templateId]:{...(a.drafts?.[q.templateId]||{}),[p.label]:e.target.value}}}))}/></label>
      :<label className="mock-answer">ההסבר שלכם: <textarea rows={3} disabled={submitted} value={draft} onChange={e=>patch(active.id,a=>({...a,drafts:{...a.drafts,[q.templateId]:{...(a.drafts?.[q.templateId]||{}),[p.label]:e.target.value}}}))}/></label>}
     {submitted&&p.kind==='numeric'&&<div className={'feedback '+(correct?'correct':'incorrect')}><h4>{correct?'נכון (בתוך 5%)':'לא נכון'}. התשובה: <bdi dir="ltr">{mathNotation(fmtHe(p.answer)+(p.unit?' '+p.unit:''))}</bdi></h4>{p.solution?.flatMap((s,i)=>mixedBlocks(s,'q'+qi+p.label+i))}</div>}
     {submitted&&p.kind==='concept'&&<div className="feedback"><h4>תשובת מודל — השוו להסבר שלכם וסמנו:</h4>{mixedBlocks(p.modelAnswer,'q'+qi+p.label+'ma')}
      <div className="choices" role="group" aria-label={`סימון עצמי לסעיף ${p.label}`}>
       <button className={self===true?'selected':''} aria-pressed={self===true} onClick={()=>patch(active.id,a=>({...a,selfMarks:{...a.selfMarks,[q.templateId]:{...(a.selfMarks?.[q.templateId]||{}),[p.label]:true}}}))}><span>✓</span>צדקתי</button>
       <button className={self===false?'selected':''} aria-pressed={self===false} onClick={()=>patch(active.id,a=>({...a,selfMarks:{...a.selfMarks,[q.templateId]:{...(a.selfMarks?.[q.templateId]||{}),[p.label]:false}}}))}><span>✗</span>טעיתי</button>
      </div></div>}
    </section>;
   })}
  </article>)}
  {!submitted?<section className="panel practice-submit"><p>ההגשה חושפת פתרונות מלאים לסעיפים המספריים ותשובות מודל לסעיפי ההסבר, ואז מסמנים את סעיפי ההסבר בעצמכם.</p><button className="primary" onClick={()=>submit(active.id)}>הגשת המבחן וחשיפת הפתרונות</button></section>
   :score&&score.selfCorrect+score.autoCorrect<score.total&&score.selfCorrect<score.selfTotal?<section className="panel practice-submit"><p>נשארו סעיפי הסבר לסמן. הציון מתעדכן עם כל סימון.</p></section>:null}
 </main>;
}
