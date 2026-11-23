import React,{useState,useEffect,useRef} from 'react';
import {bidiElement} from './bidi-react.js';
import {initialsFor} from './auth-logic.js';
import {ReadAloudDialog} from './ReaderChrome.jsx';

export function HeliumAvatar(){return <svg className="helium-avatar" viewBox="0 0 64 64" aria-hidden="true"><g className="helium-nucleus"><circle cx="29" cy="30" r="5"/><circle cx="35" cy="34" r="5"/><circle cx="35" cy="28" r="4"/><circle cx="28" cy="36" r="4"/></g>{[0,1].map(i=><g key={i} transform={`translate(32 32) rotate(${i?58:-32}) scale(1 .48)`}><circle className="helium-orbit" r="26"/><g className={'helium-motion electron-'+i}><circle className="helium-electron" cx="26" cy="0" r="4.5"/></g></g>)}</svg>}

// The signed-in account avatar: the provider photo when one exists, else
// initials on the spectroscopy palette. The helium atom stays as the
// site's greeter on the landing page and the loading splash.
export function AccountAvatar({user}){
 if(user?.photoURL)return <img className="avatar-photo" src={user.photoURL} alt="" referrerPolicy="no-referrer"/>;
 return <span className="avatar-initials" aria-hidden="true">{initialsFor(user)}</span>;
}

export function AvatarMenu({courses,progress,onReset,user,onSignOut,saveStatus}){
 const [open,setOpen]=useState(false),[confirming,setConfirming]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[settingsOpen,setSettingsOpen]=useState(false);
 const wrap=useRef(),trigger=useRef(),first=useRef(),cancel=useRef();
 const done=courses.reduce((n,c)=>n+c.topics.filter(t=>progress[c.id]?.[t.id]?.complete).length,0);
 const total=courses.reduce((n,c)=>n+c.topics.length,0);
 const close=()=>{setOpen(false);setConfirming(false);setError('');trigger.current?.focus()};
 useEffect(()=>{if(!open)return;const outside=e=>{if(!wrap.current?.contains(e.target))close()};const esc=e=>{if(e.key==='Escape'){e.preventDefault();close()}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',esc)}},[open]);
 useEffect(()=>{if(open)(confirming?cancel:first).current?.focus()},[open,confirming]);
 const reset=async()=>{setBusy(true);try{await onReset();close()}catch{setError('המחיקה טרם אושרה בחשבון ובמכשיר הזה. אפשר לנסות שוב; אין למחוק את החשבון לפני השלמתה.')}finally{setBusy(false)}};
 const signout=()=>{Promise.resolve(onSignOut?.()).catch(()=>setError('ההתנתקות נכשלה. אפשר לנסות שוב.'))};
 const name=user?.displayName||user?.email||'';
 return <div className="avatar-wrap" ref={wrap}><button ref={trigger} className="avatar-trigger" aria-label={'תפריט אישי - '+name} aria-expanded={open} aria-controls="personal-menu" onClick={()=>{if(open)close();else setOpen(true)}}><AccountAvatar user={user}/></button>{open&&<section id="personal-menu" className="avatar-menu panel" aria-label="תפריט אישי"><div className="avatar-menu-title"><div><h2>המרחב שלך</h2><p className="avatar-identity">{user?.displayName&&<span>{user.displayName} · </span>}<bdi dir="ltr">{user?.email}</bdi></p></div><span dir="ltr" className="helium-label">He</span></div>{saveStatus&&<p role="status" style={{fontSize:18,marginTop:12}}>{saveStatus}</p>}<div className="avatar-progress"><strong>{done}<small> / {total}</small></strong><span>נושאים הושלמו בכל הקורסים</span><progress max={total} value={done} aria-label="התקדמות בכל הקורסים"/></div>{!confirming?<><button ref={first} className="avatar-readaloud" onClick={()=>{setOpen(false);setConfirming(false);setSettingsOpen(true)}}><span aria-hidden="true">♪</span>הגדרות הקראה בקול</button><button ref={first} className="avatar-reset" onClick={()=>setConfirming(true)}><span aria-hidden="true">↺</span>איפוס כל ההתקדמות</button><small className="avatar-privacy">ההתקדמות שייכת לחשבון. עותק מקומי ושינויים ממתינים נשמרים במכשיר; הם אינם מוצפנים. אין איסוף ביקורים או זמן צפייה.</small></>:<div className="reset-confirm" role="group" aria-labelledby="reset-heading"><h3 id="reset-heading">לאפס את כל ההתקדמות?</h3><p>האיפוס מסיר את התוצאות מהשרת ומהמכשיר הזה. זו אינה מחיקת חשבון או בקשת מחיקת מידע. שינוי ממתין במכשיר אחר שלא היה מקוון עלול להחזיר תוצאה כשיתחבר. חומר הלימוד ונתונים ישנים ללא חשבון נשארים.</p><div className="reset-confirm-actions"><button ref={cancel} className="secondary" onClick={()=>setConfirming(false)}>ביטול</button><button className="reset-destructive" disabled={busy} onClick={reset}>{busy?'מוחקים ובודקים…':'כן, לאפס התקדמות'}</button></div></div>}{error&&<p className="avatar-error" role="alert">{error}</p>}<button className="avatar-signout" onClick={signout}><span aria-hidden="true">⇱</span>יציאה מהחשבון</button></section>}{settingsOpen&&<ReadAloudDialog onClose={()=>{setSettingsOpen(false);trigger.current?.focus()}}/>}</div>
}
