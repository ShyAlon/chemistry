import React,{useState} from 'react';
import {bidiElement} from './bidi-react.js';
import {courses as formulaCourses} from './reference-formulas.js';
import {Expr} from './formula-items.jsx';
import {ScientificText,SymbolList} from './scientific-text.js';
import {symbolRows} from './symbols.js';

// The per-topic formulas tab: the same reference-formulas.js items that drive
// the References sheet and the print tool, shown on the topic page for homework,
// with an expandable symbol key per formula. Meanings come from symbol-defs.js;
// nothing here duplicates definitions or touches saved progress.
export function topicFormulas(courseId,topicId){
 return formulaCourses.find(c=>c.id===courseId)?.topics.find(t=>t.id===topicId)||null;
}

export function TopicFormulas({courseId,topic}){
 const data=topicFormulas(courseId,topic.id);
 const [open,setOpen]=useState(null);
 if(!data)return null;
 return <>
  <div className="lesson-intro"><span className="eyebrow">נוסחאות / {topic.id}</span><h2>הנוסחאות של הנושא, ליד התרגיל.</h2>
   <p className="muted">אותן נוסחאות כמו בדף הנוסחאות של הקורס. לחיצה על "מקרא סמלים" מציגה את המשמעות של כל סמל בנוסחה.</p></div>
  <section className="panel ref-topic topic-formulas">
   <dl className="ref-items">{data.items.map(([label,expr,note,symbols],i)=><div key={i}>
    <dt>{label}</dt>
    <dd>
     <Expr expr={expr}/>
     {note&&<small><ScientificText runs={[note]}/></small>}
     {symbols?.length>0&&<>
      <button type="button" className="formula-key-toggle" aria-expanded={open===i} onClick={()=>setOpen(open===i?null:i)}>{open===i?'הסתרת מקרא הסמלים −':'ⓘ מקרא סמלים'}</button>
      {open===i&&<div className="formula-key-inline"><SymbolList rows={symbolRows(symbols)}/></div>}
     </>}
    </dd>
   </div>)}</dl>
  </section>
  <p className="ref-note">הערכים הם אלה שבקורס. אם דף הנוסחאות של הבוחן נותן ערך אחר, משתמשים בו.</p>
  <button className="secondary" onClick={()=>{location.hash='references/formulas'}}>לדף הנוסחאות המלא של הקורס ולהדפסה ←</button>
 </>;
}
