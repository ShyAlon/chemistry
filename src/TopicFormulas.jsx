import React from 'react';
import {bidiElement} from './bidi-react.js';
import {courses as formulaCourses} from './reference-formulas.js';
import {ScientificText,FormulaTip,DisplayMath} from './scientific-text.js';

// The per-topic formulas tab: the same reference-formulas.js items that drive
// the References sheet and the print tool, shown on the topic page for homework.
// Each formula is the shared FormulaTip itself: hover, focus or tap opens the
// same symbol-key popup used in the theory. Items without symbols render as a
// plain DisplayMath, exactly like symbol-less theory equations. Nothing here
// duplicates definitions or touches saved progress.
export function topicFormulas(courseId,topicId){
 return formulaCourses.find(c=>c.id===courseId)?.topics.find(t=>t.id===topicId)||null;
}

export function TopicFormulas({courseId,topic}){
 const data=topicFormulas(courseId,topic.id);
 if(!data)return null;
 return <>
  <div className="lesson-intro"><span className="eyebrow">נוסחאות / {topic.id}</span><h2>הנוסחאות של הנושא, ליד התרגיל.</h2>
   <p className="muted">אותן נוסחאות כמו בדף הנוסחאות של הקורס. ריחוף, מקלדת או הקשה על נוסחה מציגים את מקרא הסמלים שלה.</p></div>
  <section className="panel ref-topic topic-formulas">
   <dl className="ref-items">{data.items.map(([label,expr,note,symbols],i)=><div key={i}>
    <dt>{label}</dt>
    <dd>
     {expr.split(' ; ').map((part,j)=>symbols?.length>0?<FormulaTip key={j} text={part} symbols={symbols}/>:<DisplayMath key={j} text={part}/>)}
     {note&&<small><ScientificText runs={[note]}/></small>}
    </dd>
   </div>)}</dl>
  </section>
  <p className="ref-note">הערכים הם אלה שבקורס. אם דף הנוסחאות של הבוחן נותן ערך אחר, משתמשים בו.</p>
  <button className="secondary" onClick={()=>{location.hash='references/formulas'}}>לדף הנוסחאות המלא של הקורס ולהדפסה ←</button>
 </>;
}
