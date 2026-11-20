import {bidiElement} from './bidi-react.js';
import React,{useEffect,useRef,useState} from 'react';
import {getGenerativeModel} from 'firebase/ai';
import {doc,getDoc,setDoc,addDoc,collection,serverTimestamp} from 'firebase/firestore';
import {ai,db} from './firebase-init.js';
import {CHAT_MODELS,modelAfterFailure,isQuotaError,buildMissPayload,chatErrorMessage,SYSTEM_INSTRUCTION,MISS_QUESTION_MAX} from './chat-logic.js';
import {searchSite} from './search.js';

// The learning chat: floating button, panel, model call with a VISIBLE
// fallback, quota errors routed to the site's own search, and write-only
// missing-topic reports. Opening the chat requires the visitor's own
// adult declaration (a declaration, not age verification), stored once
// per account in users/{uid} and re-read from there.

function useAdultDeclaration(user,open){
  const [state,setState]=useState({status:'checking'});
  useEffect(()=>{
    if(!open)return;
    let live=true;
    setState({status:'checking'});
    getDoc(doc(db,'users',user.uid))
      .then(snap=>{if(live)setState({status:snap.data()?.adultConfirmed===true?'ok':'needed'})})
      .catch(()=>{if(live)setState({status:'error'})});
    return()=>{live=false};
  },[open,user.uid]);
  const confirm=async()=>{
    setState({status:'checking'});
    try{
      await setDoc(doc(db,'users',user.uid),{adultConfirmed:true,confirmedAt:serverTimestamp()});
      setState({status:'ok'});
    }catch{setState({status:'error'})}
  };
  return [state,confirm];
}

function AdultStep({onConfirm,onClose,state}){
  return <div className="adult-declare">
   <h3>לפני הצ'אט — אישור גיל</h3>
   <p>הצ'אט מופעל על ידי מודל שפה של Google, ותנאי השימוש בו מחייבים משתמשים מגיל 18 ומעלה. זהו אישור הצהרתי בלבד; אין כאן אימות גיל.</p>
   {state.status==='error'&&<p className="chat-error" role="alert"><strong>האישור לא נשמר.</strong> בודקים את החיבור ומנסים שוב.</p>}
   <div className="adult-actions">
    <button className="secondary" onClick={onClose}>עוד לא עכשיו</button>
    <button className="auth-submit" onClick={onConfirm} disabled={state.status==='checking'}>{state.status==='checking'?'שומרים…':'אני מעל גיל 18 — מאשר/ת'}</button>
   </div>
  </div>;
}

function MissReport({user,lastAnswer}){
  const [open,setOpen]=useState(false);
  const [text,setText]=useState('');
  const [state,setState]=useState('idle');
  const submit=async e=>{
    e.preventDefault();
    if(state==='sending')return;
    setState('sending');
    try{
      const payload=buildMissPayload({question:text,answer:lastAnswer,uid:user.uid});
      await addDoc(collection(db,'misses'),{...payload,createdAt:serverTimestamp()});
      setState('sent');setText('');
    }catch{setState('failed')}
  };
  if(!open)return <button className="quiet miss-open" onClick={()=>{setOpen(true);setState('idle')}}>נושא חסר באתר?</button>;
  return <form className="miss-form" onSubmit={submit}>
   <h4>דיווח על נושא חסר</h4>
   <p className="miss-hint">הדיווח נשמר לבעלי האתר בלבד ואי אפשר לערוך אותו אחרי השליחה.</p>
   <textarea value={text} maxLength={MISS_QUESTION_MAX} rows={3} required placeholder="איזה נושא חסר לכם?" onChange={e=>setText(e.target.value)} aria-label="תיאור הנושא החסר"/>
   <div className="miss-actions">
    <button type="button" className="secondary" onClick={()=>setOpen(false)}>ביטול</button>
    <button type="submit" className="auth-submit" disabled={state==='sending'||!text.trim()}>{state==='sending'?'שולחים…':'שליחת הדיווח'}</button>
   </div>
   {state==='sent'&&<p className="miss-ok" role="status">הדיווח נשמר. תודה!</p>}
   {state==='failed'&&<p className="chat-error" role="alert"><strong>הדיווח לא נשלח.</strong> בודקים את החיבור ומנסים שוב.</p>}
  </form>;
}

export function Chat({user}){
  const [open,setOpen]=useState(false);
  const [adult,confirmAdult]=useAdultDeclaration(user,open);
  const [messages,setMessages]=useState([{role:'model',text:'שלום! אני כאן לשאלות כימיה — על החומר באתר או מעבר לו. מה מעסיק אותך?'}]);
  const [input,setInput]=useState('');
  const [typing,setTyping]=useState(false);
  const [notice,setNotice]=useState('');
  const model=useRef({name:CHAT_MODELS.primary,history:[]});
  const scroller=useRef();

  useEffect(()=>{scroller.current?.scrollTo({top:scroller.current.scrollHeight})},[messages,typing,notice]);

  const attempt=async(name,text)=>{
    const m=getGenerativeModel(ai,{model:name,systemInstruction:SYSTEM_INSTRUCTION});
    const chat=m.startChat({history:model.current.history});
    const res=await chat.sendMessage(text);
    return res.response.text();
  };

  const send=async e=>{
    e.preventDefault();
    const text=input.trim();
    if(!text||typing)return;
    setInput('');setTyping(true);setNotice('');
    setMessages(ms=>[...ms,{role:'user',text}]);
    try{
      let reply;
      try{
        reply=await attempt(model.current.name,text);
      }catch(first){
        const next=modelAfterFailure(model.current.name,first);
        if(!next)throw first;
        reply=await attempt(next,text);
        model.current.name=next;
        setNotice('המודל הראשי עמוס כרגע — עברתי זמנית למודל גיבוי.');
      }
      model.current.history.push({role:'user',parts:[{text}]},{role:'model',parts:[{text:reply}]});
      setMessages(ms=>[...ms,{role:'model',text:reply}]);
    }catch(error){
      const msg=chatErrorMessage(error);
      const suggestions=isQuotaError(error)?searchSite(text,{limit:3}):[];
      setMessages(ms=>[...ms,{role:'error',...msg,suggestions}]);
    }finally{setTyping(false)}
  };

  const lastAnswer=[...messages].reverse().find(m=>m.role==='model')?.text;

  return <>
   <button className="chat-fab" aria-label="פתיחת צ'אט הלמידה" aria-expanded={open} onClick={()=>setOpen(o=>!o)}>
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
   </button>
   {open&&<div className="chat-panel" role="dialog" aria-modal="false" aria-label="צ'אט הלמידה">
    <header className="chat-head">
     <div><h2>שואלים את המורה</h2><p>מודל שפה של Google. יכול לטעות — בודקים מול החומר באתר.</p></div>
     <button className="search-close" onClick={()=>setOpen(false)} aria-label="סגירת הצ'אט">✕</button>
    </header>
    {adult.status==='ok'
     ?<>
      <div className="chat-scroll" ref={scroller} aria-live="polite">
       {messages.map((m,i)=>m.role==='error'
        ?<div key={i} className="chat-msg error" role="alert">
          <p><strong>{m.error}</strong> {m.next}</p>
          {!!m.suggestions?.length&&<ul className="chat-suggest">{m.suggestions.map(s=><li key={s.route}><button onClick={()=>{location.hash=s.route;setOpen(false)}}>{s.kind}: {s.title}</button></li>)}</ul>}
         </div>
        :<div key={i} className={'chat-msg '+m.role} dir="auto"><p>{m.text}</p></div>)}
       {typing&&<div className="chat-msg model typing"><p>חושב…</p></div>}
       {notice&&<p className="chat-notice" role="status">{notice}</p>}
      </div>
      <form className="chat-input" onSubmit={send}>
       <input value={input} onChange={e=>setInput(e.target.value)} placeholder="מה לא מובן?" aria-label="שאלה לצ'אט" disabled={typing}/>
       <button type="submit" className="auth-submit" disabled={typing||!input.trim()} aria-label="שליחת השאלה">שליחה</button>
      </form>
      <MissReport user={user} lastAnswer={lastAnswer}/>
     </>
     :adult.status==='checking'
      ?<div className="chat-scroll"><p className="chat-notice">רגע, בודקים את אישור הגיל…</p></div>
      :<AdultStep state={adult} onConfirm={confirmAdult} onClose={()=>setOpen(false)}/>}
   </div>}
  </>;
}
