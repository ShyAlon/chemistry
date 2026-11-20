import {bidiElement} from './bidi-react.js';
import React,{useEffect,useState} from 'react';
import {onAuthStateChanged,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,GoogleAuthProvider} from 'firebase/auth';
import {auth} from './firebase-init.js';
import {authErrorMessage} from './auth-logic.js';
import {HeliumAvatar} from './AvatarMenu.jsx';

// Site-wide entry gate: while the auth state loads we show a splash; a
// signed-out visitor gets the landing page INSTEAD of the app content.
// The hash route is never touched, so after sign-in the visitor lands
// exactly on the page they originally asked for.
export function AuthGate({children}){
  const [state,setState]=useState({status:'loading',user:null});
  useEffect(()=>onAuthStateChanged(auth,user=>setState(user?{status:'in',user}:{status:'out',user:null})),[]);
  if(state.status==='loading')return <div className="auth-splash" role="status"><HeliumAvatar/><p>רגע, בודקים את החשבון…</p></div>;
  if(state.status==='out')return <Landing/>;
  return children(state.user);
}

function Landing(){
  const [mode,setMode]=useState('in');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [problem,setProblem]=useState(null);
  const run=async promise=>{
    setBusy(true);setProblem(null);
    try{await promise}catch(error){setProblem(authErrorMessage(error))}
    finally{setBusy(false)}
  };
  const submit=e=>{
    e.preventDefault();
    if(busy)return;
    run(mode==='in'
      ?signInWithEmailAndPassword(auth,email,password)
      :createUserWithEmailAndPassword(auth,email,password));
  };
  const google=()=>{if(!busy)run(signInWithPopup(auth,new GoogleAuthProvider()))};
  return <main className="landing">
   <section className="landing-hero">
    <HeliumAvatar/>
    <div className="eyebrow" dir="ltr">SPECTRA — CHEMISTRY, IN YOUR ORBIT</div>
    <h1>נכנסים למעבדה.</h1>
    <p>האתר פתוח לתלמידות ותלמידים רשומים. מתחברים עם חשבון Google או עם אימייל וסיסמה, וממשיכים בדיוק מהמקום שביקשתם.</p>
   </section>
   <section className="landing-panel panel" aria-label="כניסה או הרשמה">
    <button className="google-btn" onClick={google} disabled={busy}>
     <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.48-5 3.48-8.6z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.14.01-3.6 2.8-.05.13C3.4 21.3 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.2 14.4c-.24-.72-.38-1.5-.38-2.4s.14-1.68.36-2.4l-.01-.16-3.65-2.8-.12.06C.5 8.4 0 10.1 0 12s.5 3.6 1.4 5.33l3.8-2.93z"/><path fill="#EA4335" d="M12 4.6c2.3 0 3.8.97 4.7 1.78l3.4-3.3C18.1 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.67l3.78 2.93c1-2.9 3.7-5 6.82-5z"/></svg>
     המשך עם Google
    </button>
    <div className="landing-divider" role="separator"><span>או עם אימייל</span></div>
    <form className="auth-form" onSubmit={submit}>
     <label>אימייל<input dir="ltr" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
     <label>סיסמה<input dir="ltr" type="password" autoComplete={mode==='in'?'current-password':'new-password'} required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <button className="auth-submit" type="submit" disabled={busy}>{busy?'רגע…':mode==='in'?'כניסה':'פתיחת חשבון'}</button>
    </form>
    {problem&&<p className="auth-error" role="alert"><strong>{problem.error}</strong> {problem.next}</p>}
    <button className="quiet landing-toggle" onClick={()=>{setMode(mode==='in'?'up':'in');setProblem(null)}}>
     {mode==='in'?'חדשים כאן? פתיחת חשבון':'כבר יש חשבון? כניסה'}
    </button>
   </section>
  </main>;
}
