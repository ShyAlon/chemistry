import {bidiElement} from './bidi-react.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Narrator} from './read-aloud/narrator.js';
import {topicNarration} from './read-aloud/topic-sections.js';
import './theory-reader.css';
const status={idle:'מוכן להקראה',starting:'מתחיל להקריא',playing:'מקריא',paused:'מושהה',finished:'הנושא הסתיים',error:'ההקראה נעצרה'};
export function TheoryReader({topic,renderBlock}){
 const chunks=useMemo(()=>topicNarration(topic.id,topic.theory),[topic.id,topic.theory]);
 const [state,setState]=useState(null),player=useRef(null),root=useRef(null);
 useEffect(()=>{
  const p=new Narrator({engine:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,onChange:setState,isVisible:()=>!document.hidden});player.current=p;p.load(chunks);
  const leave=()=>p.stop('ההקראה נעצרה כשהחלון יצא מהחזית.');const hidden=()=>{if(document.hidden)leave();};
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);window.addEventListener('blur',leave);
  return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);window.removeEventListener('blur',leave);p.dispose();player.current=null;};
 },[chunks]);
 useEffect(()=>{
  if(state?.active===null||state?.active===undefined)return;
  const el=root.current?.querySelector('[data-reading-id="'+chunks[state.active].id+'"]');if(!el)return;
  const box=el.getBoundingClientRect(),dock=root.current.querySelector('.reader-dock').getBoundingClientRect(),header=document.querySelector('.header')?.getBoundingClientRect().bottom||0,footer=document.querySelector('.site-footer')?.getBoundingClientRect().top||innerHeight;
  const top=header+8+dock.height,space=footer-top;
  window.scrollTo({top:Math.max(0,scrollY+box.top-top-Math.max(12,(space-box.height)/2)),behavior:'auto'});
 },[state?.active,chunks]);
 const index=state?.index||0,running=['starting','playing'].includes(state?.status),select=i=>player.current?.jump(i);
 return <section className="theory-reader" ref={root} aria-label="הקראת התיאוריה בעברית">
  <div className="reader-intro"><h3>לקרוא בקצב שלך, לשמוע פסקה שלמה</h3><p>בחרו פסקה בטקסט, או בתפריט הבחירה, והפעילו הקראה. ההדגשה עוקבת אחרי הפסקה, לא אחרי כל מילה.</p></div>
  {state&&!state.available&&<div className="reader-notice" role="status"><p>לא נמצא כרגע קול עברי מקומי בדפדפן. אפשר להמשיך לקרוא כרגיל. לא נעבור לאנגלית או לשירות הקראה מרוחק.</p><button className="secondary" type="button" onClick={()=>player.current.refreshVoices()}>בדיקת קולות מחדש</button></div>}
  <details className="reader-settings"><summary>קול, מהירות ובחירת פסקה</summary><div className="reader-fields">
   <label>קול עברי מקומי<select aria-label="קול עברי מקומי" disabled={!state?.available} value={state?.voice?.voiceURI||''} onChange={e=>player.current.selectVoice(e.target.value)}>{(state?.voices||[]).map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>
   <label>מהירות, מהפסקה הבאה<select aria-label="מהירות הקראה" value={state?.rate||1} onChange={e=>player.current?.setRate(Number(e.target.value))}>{[.75,1,1.25,1.5].map(r=><option key={r} value={r}>{r}</option>)}</select></label>
   <label className="reader-paragraph-field">פסקה לקריאה<select aria-label="פסקה לקריאה" value={index} onChange={e=>select(Number(e.target.value))}>{chunks.map((c,i)=><option key={c.id} value={i}>{i+1}. {c.display.slice(0,70)}</option>)}</select></label>
  <div className="reader-paragraph-field"><strong>נוסח ההקראה של הקטע הנבחר</strong><p className="reader-spoken">{chunks[index].spoken}</p></div>
  </div><p>בהמשך אחרי השהיה הפסקה מתחילה מחדש. ההקראה נעצרת ביציאה מהנושא, ממסך התיאוריה או מהחלון. איכות הקול תלויה במכשיר ובדפדפן.</p></details>
  <div className="reader-dock"><p role="status" aria-live="polite">{status[state?.status]||'טוען את ההקראה'} · קטע {index+1} מתוך {chunks.length}{state?.message&&state.status!=='paused'?' · '+state.message:''}</p>
   <div className="reader-actions"><button className="primary" data-reader="play" type="button" disabled={!state?.available||running} onClick={()=>player.current.play(state.status==='finished'?0:state.index)}>{state?.status==='paused'?'המשך הפסקה':'הקראה'}</button><button className="secondary" data-reader="pause" type="button" disabled={!running} onClick={()=>player.current.pause()}>השהיה</button><button className="secondary" data-reader="stop" type="button" disabled={!running&&state?.status!=='paused'} onClick={()=>player.current.stop()}>עצירה</button></div>
   <div className="reader-navigation"><button type="button" disabled={!state||index===0} onClick={()=>select(index-1)}>הקודם</button><button type="button" disabled={!state?.available} onClick={()=>player.current.play()}>שוב את הפסקה</button><button type="button" disabled={!state||index===chunks.length-1} onClick={()=>select(index+1)}>הבא</button></div>
  </div>
  <article className="theory panel reader-content">{topic.theory.map((block,i)=><div key={chunks[i].id} data-reading-id={chunks[i].id} data-reading-style={block.style} className={'theory-reading-block'+(state?.active===i?' reading-active':'')+(index===i?' reading-selected':'')} aria-current={state?.active===i?'true':undefined} onClick={e=>{if(!e.target.closest('button,a,input,select,summary')&&!window.getSelection()?.toString())select(i);}}>{renderBlock(block,i)}</div>)}</article>
 </section>;
}
