import React,{useState} from 'react';
import {bidiElement} from './bidi-react.js';
import {PageTitle} from './PageTitle.jsx';
import {ScientificText} from './scientific-text.js';
import {exam84101,examNote} from './exam-84101.js';
function ExamPart({part,index}){const [show,setShow]=useState(false);
 return <section className="panel exam-part"><div className="exercise-index">סעיף {part.label}</div><h3><ScientificText runs={[part.question]}/></h3><button className="secondary" onClick={()=>setShow(!show)} aria-expanded={show}>{show?'הסתרת הפתרון':'נסיתי. מציגים פתרון'}<span>{show?'−':'+'}</span></button>{show&&<div className="solution">{part.solution.map((p,i)=><p key={i}><ScientificText runs={[p]}/></p>)}</div>}</section>}
export function ExamPractice(){
 const [active,setActive]=useState(null);
 const problem=exam84101.find(p=>p.id===active);
 const open=id=>{setActive(id);window.scrollTo(0,0)};
 return <main className="topic-page practice-page"><button className="back quiet" onClick={()=>{if(!problem)location.hash='course/84101';else setActive(null)}}>{problem?'→ כל שאלות הבחינה':'→ לקורס'}</button><PageTitle>שאלות ברמת בחינה</PageTitle>
  <p className="practice-intro">8 שאלות רב־שלביות המשלבות נושאים, ברמת החישוב של הבחינה. מנסים כל סעיף לבד, ורק אז חושפים את הפתרון.</p>
  <details className="practice-source"><summary>על השאלות והקבועים</summary><p><ScientificText runs={[examNote]}/></p><p>השאלות נבנו מסוגי השאלות בסט הדוגמאות של הקורס, בלי להעתיק ממנו: הדגש הוא מהלך חופשי ותדירות התנגשויות, קיבולי חום של גזים, ואן דר ואלס מספרי, זיקוק רב־שלבי ובדיקת עיבוי מול לחץ רוויה.</p></details>
  {!problem?<section className="practice-session-grid" aria-label="בחירת שאלה">{exam84101.map((p,i)=><article className="panel practice-session-card" key={p.id}><div className="exercise-index" dir="ltr">PROBLEM {i+1}/{exam84101.length}</div><h2>{p.title}</h2><p><bdi dir="rtl">{p.topics}</bdi> · {p.parts.length} סעיפים</p><button className="primary" onClick={()=>open(p.id)}>לשאלה ←</button></article>)}</section>:<>
   <div className="practice-session-heading"><h2>{problem.title}</h2><button className="secondary" onClick={()=>setActive(null)}>כל השאלות</button></div>
   <section className="panel exam-given"><span className="eyebrow">נתונים</span><p><ScientificText runs={[problem.given]}/></p></section>
   {problem.parts.map((part,i)=><ExamPart key={part.label} part={part} index={i}/>)}
  </>}
 </main>;
}
