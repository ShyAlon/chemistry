import React,{useState,useEffect,useMemo} from 'react';
import {PageTitle} from './PageTitle.jsx';
import {bidiElement} from './bidi-react.js';
import {glossary,parseGlossaryRoute} from './glossary-data.js';

// Per-course glossary page. Static study aid: never reads or writes saved progress.
// Data lives in glossary-data.js (plain JS) so the search index imports the same module.

const norm=s=>s.toLowerCase().replace(/[’‘`׳״]/g,"'").split(/[\s־‐–—-]+/).filter(w=>!(w.length===1&&'בהולמכש'.includes(w))).join('');

export function Glossary({course,route}){
 const entries=glossary[course.id]||[];
 const parsed=parseGlossaryRoute(route);
 const slug=parsed?.slug||'';
 const badSlug=!!(parsed&&slug&&!parsed.valid);
 const [filter,setFilter]=useState('');
 const query=norm(filter.trim());
 const match=e=>!query||norm([e.he,e.en,...(e.aliases||[])].filter(Boolean).join(' ')).includes(query)||norm(e.def).includes(query);
 const groups=useMemo(()=>course.topics.map(t=>({topic:t,items:entries.filter(e=>e.topic===t.id&&match(e))})).filter(g=>g.items.length),[course,entries,query]);
 const shown=groups.reduce((n,g)=>n+g.items.length,0);
 useEffect(()=>{
  if(!slug)return;
  const el=document.getElementById('g-'+slug);
  if(el){el.scrollIntoView({block:'start'});el.classList.add('hl')}
 },[slug]);
 return <main className="topic-page ref-page glossary-page">
  <button className="back quiet" onClick={()=>{location.hash='course/'+course.id}}>→ למפת הקורס</button>
  <div className="eyebrow"><bdi>{course.id}</bdi> / {course.name}</div>
  <PageTitle className="ref-title">מילון מונחים</PageTitle>
  <p className="ref-lead">{entries.length} מונחים מוגדרים לקורס, מקובצים לפי נושאי הלימוד. כל מונח מעוגן בנושא שמלמד אותו, וההגדרות נכתבו ונבדקו מול חומר הקורס. המילון גדל יחד עם הקורס.</p>
  {badSlug&&<p className="warning">המונח בקישור לא נמצא במילון. כל המונחים מופיעים כאן.</p>}
  <div className="glossary-toolbar">
   <input className="glossary-filter" type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="סינון מונחים — בעברית או באנגלית..." aria-label="סינון מונחים"/>
   <span className="glossary-count" role="status">{shown} מתוך {entries.length}</span>
  </div>
  <div className="glossary-list">
   {groups.map(g=><section key={g.topic.id} className="panel ref-topic">
    <h2><bdi dir="ltr" className="ref-id">{g.topic.id}</bdi> {g.topic.name}</h2>
    <dl className="glossary-terms">
     {g.items.map(e=><div key={e.slug} id={'g-'+e.slug} className="g-term">
      <dt>{bidiElement('span',{},e.he)}{e.en&&<bdi dir="ltr" className="g-en">{e.en}</bdi>}</dt>
      <dd>{bidiElement('p',{},e.def)}</dd>
     </div>)}
    </dl>
   </section>)}
   {!groups.length&&<p className="ref-note">אין מונחים שמתאימים לסינון. נסו ניסוח אחר, בעברית או באנגלית.</p>}
  </div>
  <p className="ref-note">ההגדרות הן אלו שבקורס. אם מרצה משתמש בטרמינולוגיה אחרת — היא קובעת במבחן.</p>
 </main>
}
