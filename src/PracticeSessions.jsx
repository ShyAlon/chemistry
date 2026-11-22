import React,{useState} from 'react';
import {bidiElement} from './bidi-react.js';
import {PageTitle} from './PageTitle.jsx';
import {ScientificText} from './scientific-text.js';
import {sessions,practiceSourceNote} from './practice-sessions.js';
export function PracticeSessions({saved={},onSave}){
 const [active,setActive]=useState(null),[draft,setDraft]=useState({}),[submitted,setSubmitted]=useState(false),[error,setError]=useState('');
 const session=sessions.find(s=>s.id===active);
 const start=s=>{setActive(s.id);setDraft({});setSubmitted(false);setError('');window.scrollTo(0,0)};
 const finish=()=>{if(!session.questions.every(q=>Number.isInteger(draft[q.id])))return;const score=session.questions.filter(q=>draft[q.id]===q.correct).length;const result={score,total:10,answers:{...draft},at:new Date().toISOString(),attempts:(saved[active]?.attempts||0)+1};try{onSave(active,result);setSubmitted(true)}catch{setError('הניסיון לא נשמר. התשובות נשארו במסך; אפשר לנסות שוב.')}};
 const leave=()=>{if(!submitted&&Object.keys(draft).length&&!confirm('לחזור לרשימה? תשובות הניסיון הנוכחי שטרם נבדק לא יישמרו.'))return;setActive(null);window.scrollTo(0,0)};
 const correct=session?.questions.filter(q=>draft[q.id]===q.correct).length;
 return <main className="topic-page practice-page"><button className="back quiet" onClick={()=>{if(!session||submitted||!Object.keys(draft).length||confirm('לעזוב? טיוטת התשובות הנוכחית לא תישמר.'))location.hash='course/84102'}}>→ לקורס</button><PageTitle>תרגולים לבוחן</PageTitle>
  <p className="practice-intro">8 תרגולים · 80 שאלות אמריקאיות חדשות. חישובים והבחנות, עם פתרונות אחרי הגשה.</p>
  <details className="practice-source"><summary>על התרגול והקבועים</summary><p><ScientificText runs={[practiceSourceNote]}/></p><p>אפשר להיעזר בדף הנוסחאות. אין מגבלת זמן רשמית. בכל תרגול שאלות חדשות עם שילוב נושאים דומה; חלק מהחישובים הם וריאציות של אותה שיטה. הפתרונות מופיעים אחרי הגשה, לא תוך כדי.</p></details>
  {!session?<><section className="practice-session-grid" aria-label="בחירת תרגול">{sessions.map(s=><article className="panel practice-session-card" key={s.id}><h2>{s.title}</h2><p>פוטון · מימן · מטען אפקטיבי · דה-ברויי · אי-ודאות · מושגים</p>{saved[s.id]&&<p className="practice-saved">תוצאה אחרונה: <bdi dir="ltr">{saved[s.id].score}/10</bdi> · {saved[s.id].attempts} ניסיונות במונה משוער</p>}<button className="primary" onClick={()=>start(s)}>{saved[s.id]?'ניסיון נוסף':'מתחילים'}</button></article>)}</section></>:<>
   <div className="practice-session-heading"><h2>{session.title}</h2><button className="secondary" onClick={leave}>כל התרגולים</button></div>
   <p role="status" className="practice-counter">{submitted?`תוצאה: ${correct}/10`:`סומנו ${Object.keys(draft).length} מתוך 10. אפשר לשנות לפני הגשה.`}</p>
   {session.questions.map((q,i)=><article key={q.id} className="question panel practice-question" aria-labelledby={q.id}><div className="exercise-index">שאלה <bdi dir="ltr">{i+1}/10</bdi> · <bdi dir="ltr">{q.topic}</bdi></div><h3 id={q.id}><ScientificText runs={[q.prompt]}/></h3><div className="choices" role="group" aria-label={'תשובות לשאלה '+(i+1)}>{q.options.map((o,j)=><button key={j} className={draft[q.id]===j?'selected':''} disabled={submitted} aria-pressed={draft[q.id]===j} onClick={()=>setDraft({...draft,[q.id]:j})}><span>{'אבגד'[j]}</span><ScientificText runs={[o]}/></button>)}</div>{submitted&&<div className={'feedback '+(draft[q.id]===q.correct?'correct':'incorrect')}><h4>{draft[q.id]===q.correct?'נכון':'כדאי לחזור'}. התשובה: {'אבגד'[q.correct]}</h4><p><ScientificText runs={[q.explanation]}/></p><a href={'#course/84102/'+q.topic}>לחזרה בנושא <bdi>{q.topic}</bdi> ←</a></div>}</article>)}
   {!submitted?<section className="panel practice-submit"><p>לפני הגשה: התאימו כל ערך שחישבתם לאפשרות שסימנתם. טיוטה זו לא נשמרת עד לבדיקה.</p><button className="primary" disabled={Object.keys(draft).length!==10} onClick={finish}>בדיקת כל התשובות ושמירת הניסיון</button>{error&&<p role="alert">{error}</p>}</section>:<section className="panel practice-submit"><h2>סיימת: {correct}/10</h2><p>עברו על ההסברים, במיוחד תשובות מניחוש. תוצאה נכונה אינה מחליפה דרך פתרון.</p><button className="primary" onClick={()=>{setActive(null);window.scrollTo(0,0)}}>לבחירת התרגול הבא</button><button className="secondary" onClick={()=>start(session)}>אותו תרגול מחדש</button></section>}
  </>}
 </main>;
}
