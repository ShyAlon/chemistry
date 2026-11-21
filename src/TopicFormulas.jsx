import React from 'react';
import {bidiElement} from './bidi-react.js';
import {courses as formulaCourses} from './reference-formulas.js';
import {ScientificText} from './scientific-text.js';
import {Formula} from './Formula.js';

// The per-topic formulas tab: the same reference-formulas.js items that drive
// the References sheet and the print tool, shown on the topic page for homework.
// Formula owns all display and tooltip decisions, including structured items.
// This page supplies content only and never touches saved progress.
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
     <Formula expr={expr} symbols={symbols}/>
     {note&&<small><ScientificText runs={[note]}/></small>}
    </dd>
   </div>)}</dl>
  </section>
  <p className="ref-note">הערכים הם אלה שבקורס. אם דף הנוסחאות של הבוחן נותן ערך אחר, משתמשים בו.</p>
  <button className="secondary" onClick={()=>{location.hash='references/formulas'}}>לדף הנוסחאות המלא של הקורס ולהדפסה ←</button>
 </>;
}
