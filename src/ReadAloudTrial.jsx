import React,{useEffect,useRef,useState} from 'react';
import {bidiElement} from './bidi-react.js';
import {DisplayMath} from './Formula.js';
import {Narrator} from './read-aloud/narrator.js';
import {sections} from './read-aloud/sections.js';
import './read-aloud.css';
import {PageTitle} from './PageTitle.jsx';
const labels={idle:'מוכן',starting:'מתחיל להקריא',playing:'מקריא',paused:'מושהה',finished:'הקטע הסתיים',error:'ההקראה אינה זמינה כרגע'};
export function ReadAloudTrial(){
 const [section,setSection]=useState(0),[state,setState]=useState(null),[footerInset,setFooterInset]=useState(80);
 useEffect(()=>{const footer=document.querySelector('.site-footer');if(!footer){setFooterInset(0);return;}const update=()=>setFooterInset(Math.ceil(footer.getBoundingClientRect().height));const observer=new ResizeObserver(update);observer.observe(footer);update();return()=>observer.disconnect();},[]);const player=useRef(null);
 useEffect(()=>{const p=new Narrator({engine:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,onChange:setState,isVisible:()=>!document.hidden});player.current=p;p.load(sections[0].chunks);
  const leave=()=>p.stop('ההקראה נעצרה כשהחלון יצא מהחזית.');const hidden=()=>{if(document.hidden)leave();};document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);window.addEventListener('blur',leave);
  return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);window.removeEventListener('blur',leave);p.dispose();};
 },[]);
 useEffect(()=>{if(state?.active===null||state?.active===undefined)return;const el=document.querySelector('[data-chunk="'+sections[section].chunks[state.active]?.id+'"]');if(!el)return;const r=el.getBoundingClientRect(),top=document.querySelector('.header')?.getBoundingClientRect().bottom||0,bottom=document.querySelector('.pilot-dock')?.getBoundingClientRect().top||innerHeight;window.scrollTo({top:scrollY+r.top-top-Math.max(8,(bottom-top-r.height)/2)});},[state?.active,section]);
 if(!state)return <main><p>טוען את הניסוי המקומי...</p></main>;
 const current=sections[section],running=['playing','starting'].includes(state.status);const choose=i=>{player.current.load(sections[i].chunks);setSection(i);};
 return <main className="pilot-shell read-aloud-trial" style={{'--trial-footer-bottom':footerInset+'px'}}>
  <header><p className="pilot-label">כימיה · ניסוי הקראה מוגבל</p><PageTitle className="ref-title">לשמוע ולעקוב</PageTitle><p>שני קטעים קצרים לבדיקת הקראה בעברית והדגשת משפט. קול עברי מקומי בלבד, ללא שירות הקראה חיצוני.</p></header>
  <nav className="pilot-tabs" aria-label="קטעי הניסוי">{sections.map((s,i)=><button key={s.id} type="button" aria-pressed={i===section} onClick={()=>choose(i)}>{i+1}. {s.title}</button>)}</nav>
  <section className="pilot-panel" aria-labelledby="controls-title"><h2 id="controls-title">הקראה בקול מקומי</h2>
   {!state.available?<div className="pilot-notice" role="status"><strong>לא נמצא כרגע קול עברי מקומי זמין בדפדפן.</strong><p>הטקסט עדיין זמין לקריאה. אפשר לבדוק אם במכשיר מותקן קול עברי ולהפעיל שוב את הבדיקה. לא נעבור לאנגלית או לשירות מרוחק.</p><button type="button" onClick={()=>player.current.refreshVoices()}>בדיקת קולות מחדש</button></div>:<label className="pilot-field">קול עברי מקומי<select id="voice" value={state.voice.voiceURI} onChange={e=>player.current.selectVoice(e.target.value)}>{state.voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>}
   <div className="pilot-dock"><p id="playback-status" role="status" aria-live="polite">{labels[state.status]} · משפט {state.index+1} מתוך {current.chunks.length}{state.message?' · '+state.message:''}</p><div className="pilot-buttons"><button id="play" type="button" disabled={!state.available||running} onClick={()=>player.current.play(state.status==='finished'?0:state.index)}>{state.status==='paused'?'המשך מתחילת המשפט':'הקראה'}</button><button id="pause" type="button" disabled={!running} onClick={()=>player.current.pause()}>השהיה</button><button id="stop" type="button" disabled={!running&&state.status!=='paused'} onClick={()=>player.current.stop()}>עצירה</button></div></div>
   <div className="pilot-buttons"><button id="previous" type="button" disabled={state.index===0} onClick={()=>player.current.jump(state.index-1)}>המשפט הקודם</button><button id="replay" type="button" disabled={!state.available} onClick={()=>player.current.play()}>שוב את המשפט</button><button id="next" type="button" disabled={state.index===current.chunks.length-1} onClick={()=>player.current.jump(state.index+1)}>המשפט הבא</button></div>
   <label className="pilot-field">מהירות, מהמשפט הבא<select id="rate" value={state.rate} onChange={e=>player.current.setRate(Number(e.target.value))}><option value="0.75">איטי · 0.75</option><option value="1">רגיל · 1</option><option value="1.25">מהיר · 1.25</option><option value="1.5">מהיר יותר · 1.5</option></select></label>
   <p className="pilot-note">הדגשה מופיעה רק לאחר שהדפדפן מדווח שהדיבור התחיל. אחרי השהיה ממשיכים מתחילת המשפט. מעבר חלון או קטע עוצר את ההקראה.</p>
  </section>
  <article className="pilot-panel theory"><h2>{current.title}</h2><p className="pilot-source">{current.source}</p><ol className="pilot-chunks">{current.chunks.map((chunk,i)=><li key={chunk.id} data-chunk={chunk.id} className={state.active===i?'active':''} aria-current={state.active===i?'true':undefined}><div className="pilot-chunk-head"><button type="button" aria-label={'בחירת משפט '+(i+1)} onClick={()=>player.current.jump(i)}>משפט {i+1}{state.index===i?' · נבחר':''}{state.active===i?' · מוקרא עכשיו':''}</button></div>{chunk.equation||chunk.math?<React.Fragment>{chunk.label&&<p>{chunk.label}</p>}<DisplayMath text={chunk.math||chunk.display} symbols={chunk.symbols}/></React.Fragment>:<p>{chunk.display}</p>}<details><summary>נוסח ההקראה {chunk.equation||chunk.math?'לנוסחה':''}</summary><p>{chunk.spoken}</p></details></li>)}</ol></article>
  <aside className="pilot-panel"><h2>מה עדיין צריך לשמוע במכשיר?</h2><p>איכות העברית, הגיית הכימיה, הרווחים בין המשפטים ותזמון ההדגשה עדיין לא אומתו במכשיר שלך. הנוסח המילולי לנוסחאות גלוי לבדיקה.</p><p>הבדיקה מכוונת תחילה ל־Chrome; מערכת ההפעלה אינה ידועה. אין הבטחה להקראה במצב לא מקוון, ברקע או במסך נעול. אין שמירת פעילות, בקשת מיקרופון או שירות הקראה חיצוני.</p></aside>
 </main>;
}
