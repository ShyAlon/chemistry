import {bidiElement} from './bidi-react.js';
import React,{useEffect,useRef,useState} from 'react';
import {getSession,subscribeSession,getPrefs,subscribePrefs,setVoice,setRate,setStripVisible,localHebrewVoices} from './read-aloud/session.js';
const statusLabels={idle:'מוכן להקראה',starting:'מתחיל להקריא',playing:'מקריא',paused:'מושהה',finished:'הנושא הסתיים',error:'ההקראה נעצרה'};
const paths={
 play:'M8 5v14l11-7z',
 pause:'M6 5h4v14H6zM14 5h4v14h-4z',
 stop:'M6 6h12v12H6z',
 prev:'M6 6h2v12H6zM18 6l-8.5 6L18 18z',
 next:'M16 6h2v12h-2zM6 6l8.5 6L6 18z',
 replay:'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z',
};
const Icon=({name})=><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><path d={paths[name]}/></svg>;
// Compact playback strip in the top bar, visible only while a theory reader
// is on screen and the reader has asked for it in the read-aloud settings
// (hidden by default). The full status sentence stays available to assistive
// tech and behind the info button; the row itself carries icons and the counter.
export function ReaderStrip(){
 const [session,setSession]=useState(getSession()),[note,setNote]=useState(false),[prefs,setPrefs]=useState(getPrefs());
 useEffect(()=>subscribeSession(setSession),[]);
 useEffect(()=>subscribePrefs(setPrefs),[]);
 if(!session||!prefs.strip)return null;
 const {player,state,chunks}=session;
 const index=state?.index||0,running=['starting','playing'].includes(state?.status),paused=state?.status==='paused';
 return <div className="reader-strip" role="region" aria-label="בקרי ההקראה">
  <div className="reader-strip-row">
   <button type="button" data-reader="play" aria-label={paused?'המשך הפסקה':'הקראה'} disabled={!state?.available||running} onClick={()=>player.play(state.status==='finished'?0:state.index)}><Icon name="play"/></button>
   <button type="button" data-reader="pause" aria-label="השהיה" disabled={!running} onClick={()=>player.pause()}><Icon name="pause"/></button>
   <button type="button" data-reader="stop" aria-label="עצירה" disabled={!running&&!paused} onClick={()=>player.stop()}><Icon name="stop"/></button>
   <button type="button" data-reader="prev" aria-label="הפסקה הקודמת" disabled={!state||index===0} onClick={()=>player.jump(index-1)}><Icon name="prev"/></button>
   <button type="button" data-reader="replay" aria-label="שוב את הפסקה" disabled={!state?.available} onClick={()=>player.play()}><Icon name="replay"/></button>
   <button type="button" data-reader="next" aria-label="הפסקה הבאה" disabled={!state||index===chunks.length-1} onClick={()=>player.jump(index+1)}><Icon name="next"/></button>
   <span className="reader-strip-count" aria-hidden="true">{index+1}/{chunks.length}</span>
   {state?.message&&<button type="button" className="reader-strip-info" aria-label="למה ההקראה נעצרה" aria-expanded={note} onClick={()=>setNote(!note)}>ⓘ</button>}
  </div>
  <p className="sr-only" role="status" aria-live="polite">{statusLabels[state?.status]||'טוען את ההקראה'} · קטע {index+1} מתוך {chunks.length}{state?.message?' · '+state.message:''}</p>
  {note&&state?.message&&<p className="reader-strip-note">{state.message}</p>}
 </div>;
}
// Voice and speed settings, opened from the avatar menu. Choices persist on
// this device and apply to the active playback immediately.
export function ReadAloudDialog({onClose}){
 const [prefs,setPrefsState]=useState(getPrefs()),[session,setSession]=useState(getSession()),[voices,setVoices]=useState(()=>localHebrewVoices(window.speechSynthesis));
 const closeRef=useRef();
 useEffect(()=>subscribePrefs(setPrefsState),[]);
 useEffect(()=>subscribeSession(setSession),[]);
 useEffect(()=>{const eng=window.speechSynthesis;if(!eng?.addEventListener)return;const fn=()=>setVoices(localHebrewVoices(eng));eng.addEventListener('voiceschanged',fn);fn();return()=>eng.removeEventListener('voiceschanged',fn)},[]);
 useEffect(()=>{closeRef.current?.focus();const esc=e=>{if(e.key==='Escape'){e.preventDefault();onClose()}};document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc)},[onClose]);
 const missing=prefs.voiceURI&&!voices.some(v=>v.voiceURI===prefs.voiceURI);
 const currentVoice=missing?prefs.voiceURI:(prefs.voiceURI||session?.state?.voice?.voiceURI||'');
 return <div className="ra-overlay" onPointerDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="ra-dialog panel" role="dialog" aria-modal="true" aria-labelledby="ra-title">
   <h2 id="ra-title">הגדרות הקראה בקול</h2>
   {!voices.length&&<p className="ra-note" role="status">לא נמצא קול עברי מקומי במכשיר הזה כרגע. ההקראה תתאפשר כשקול מתאים יהיה זמין.</p>}
   <label>קול עברי מקומי
    <select aria-label="קול עברי מקומי" disabled={!voices.length} value={currentVoice} onChange={e=>setVoice(e.target.value)}>
     {!prefs.voiceURI&&<option value={session?.state?.voice?.voiceURI||''}>{session?.state?.voice?session.state.voice.name+' · '+session.state.voice.lang+' · ברירת מחדל':'ברירת מחדל'}</option>}
     {missing&&<option value={prefs.voiceURI}>הקול השמור אינו זמין כעת</option>}
     {voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}
    </select></label>
   <label>מהירות, מהפסקה הבאה
    <select aria-label="מהירות הקראה" value={prefs.rate} onChange={e=>setRate(Number(e.target.value))}>
     {[[.75,'איטי · 0.75'],[1,'רגיל · 1'],[1.25,'מהיר · 1.25'],[1.5,'מהיר יותר · 1.5']].map(([r,label])=><option key={r} value={r}>{label}</option>)}
    </select></label>
   <label className="ra-toggle">בקרי ההקראה בסרגל העליון
    <input type="checkbox" checked={prefs.strip} onChange={e=>setStripVisible(e.target.checked)}/>
    <span className="ra-toggle-hint">כברירת מחדל הבקרים מוסתרים. המתג מציג אותם בזמן קריאת התיאוריה.</span></label>
   <p className="ra-note">הבחירה נשמרת במכשיר וחלה מיד גם על הקראה שפועלת עכשיו.</p>
   <button ref={closeRef} className="secondary ra-close" onClick={onClose}>סגירה</button>
  </section>
 </div>;
}
