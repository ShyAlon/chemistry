import {bidiElement} from './bidi-react.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Narrator} from './read-aloud/narrator.js';
import {topicNarration} from './read-aloud/topic-sections.js';
import {register,unregister} from './read-aloud/session.js';
import './theory-reader.css';
export function TheoryReader({topic,renderBlock}){
 const chunks=useMemo(()=>topicNarration(topic.id,topic.theory),[topic.id,topic.theory]);
 const [state,setState]=useState(null),player=useRef(null),root=useRef(null);
 useEffect(()=>{
  let updateSession=()=>{};
  const p=new Narrator({engine:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,isVisible:()=>!document.hidden,onChange:s=>{setState(s);updateSession(s);}});player.current=p;p.load(chunks);
  updateSession=register(p,chunks);
  const leave=()=>p.stop('ההקראה נעצרה כשהחלון יצא מהחזית.');const hidden=()=>{if(document.hidden)leave();};
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);window.addEventListener('blur',leave);
  return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);window.removeEventListener('blur',leave);unregister(p);p.dispose();player.current=null;};
 },[chunks]);
 useEffect(()=>{
  if(state?.active===null||state?.active===undefined)return;
  const el=root.current?.querySelector('[data-reading-id="'+chunks[state.active].id+'"]');if(!el)return;
  const box=el.getBoundingClientRect(),chrome=(document.querySelector('.reader-strip')||document.querySelector('.header'))?.getBoundingClientRect().bottom||0,footer=document.querySelector('.site-footer')?.getBoundingClientRect().top||innerHeight;
  const top=chrome+8,space=footer-top;
  window.scrollTo({top:Math.max(0,scrollY+box.top-top-Math.max(12,(space-box.height)/2)),behavior:'auto'});
 },[state?.active,chunks]);
 const index=state?.index||0,select=i=>player.current?.jump(i);
 return <section className="theory-reader" ref={root} aria-label="הקראת התיאוריה בעברית">
  <div className="reader-intro"><h3>לקרוא בקצב שלך, לשמוע פסקה שלמה</h3><p>בחרו פסקה בטקסט או בתפריט הבחירה, והפעילו הקראה מהסרגל העליון. ההדגשה עוקבת אחרי הפסקה, לא אחרי כל מילה. הקול והמהירות נקבעים בהגדרות ההקראה שבתפריט האישי.</p></div>
  {state&&!state.available&&<div className="reader-notice" role="status"><p>לא נמצא כרגע קול עברי מקומי בדפדפן. אפשר להמשיך לקרוא כרגיל. לא נעבור לאנגלית או לשירות הקראה מרוחק.</p><button className="secondary" type="button" onClick={()=>player.current.refreshVoices()}>בדיקת קולות מחדש</button></div>}
  <details className="reader-jump"><summary>בחירת פסקה ונוסח ההקראה</summary>
   <label className="reader-paragraph-field">פסקה לקריאה<select aria-label="פסקה לקריאה" value={index} onChange={e=>select(Number(e.target.value))}>{chunks.map((c,i)=><option key={c.id} value={i}>{i+1}. {c.display.slice(0,70)}</option>)}</select></label>
   <div className="reader-paragraph-field"><strong>נוסח ההקראה של הקטע הנבחר</strong><p className="reader-spoken">{chunks[index].spoken}</p></div>
   <p>בהמשך אחרי השהיה הפסקה מתחילה מחדש. ההקראה נעצרת ביציאה מהנושא, ממסך התיאוריה או מהחלון. איכות הקול תלויה במכשיר ובדפדפן.</p></details>
  <article className="theory panel reader-content">{topic.theory.map((block,i)=><div key={chunks[i].id} data-reading-id={chunks[i].id} data-reading-style={block.style} className={'theory-reading-block'+(state?.active===i?' reading-active':'')+(index===i?' reading-selected':'')} aria-current={state?.active===i?'true':undefined} onClick={e=>{if(!e.target.closest('button,a,input,select,summary')&&!window.getSelection()?.toString())select(i);}}>{renderBlock(block,i)}</div>)}</article>
 </section>;
}
