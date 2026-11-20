import {bidiElement} from './bidi-react.js';
import React,{useEffect,useRef,useState} from 'react';
import {getGenerativeModel} from 'firebase/ai';
import {doc,getDoc,setDoc,addDoc,collection,serverTimestamp} from 'firebase/firestore';
import {ai,db} from './firebase-init.js';
import {CHAT_MODELS,modelAfterFailure,isQuotaError,buildMissPayload,chatErrorMessage,SYSTEM_INSTRUCTION,MISS_QUESTION_MAX,stripMarkdown,matchSubjects,isMiss} from './chat-logic.js';
import {searchSite} from './search.js';

// The learning chat: a study companion for THIS site. Every learner
// question is routed to the real catalogue — matching subjects render as
// navigable cards, and a true zero-match is surfaced as a missing-topic
// report prompt. The model answers briefly in plain text and can never
// invent coverage claims (see chat-logic SYSTEM_INSTRUCTION). Opening the
// chat requires the visitor's own adult declaration (a declaration, not
// age verification), stored once per account in users/{uid}.

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

function MissReport({user,lastAnswer,prefill}){
  const [open,setOpen]=useState(false);
  const [text,setText]=useState('');
  const [state,setState]=useState('idle');
  useEffect(()=>{if(prefill?.text){setText(prefill.text);setOpen(true);setState('idle')}},[prefill]);
  const submit=async e=>{
    e.preventDefault();
    if(state==='sending')return;
    setState('sending');
    try{
      const payload=buildMissPayload({question:text,answer:lastAnswer,uid:user.uid});
      await addDoc(collection(db,'misses'),{...payload,createdAt:serverTimestamp()});
      setState('sent');setText('');setOpen(false);
    }catch{setState('failed')}
  };
  // Success feedback lives exactly where the learner was looking — in the
  // button's spot, never below a fold.
  if(state==='sent')return <p className="miss-ok miss-standalone" role="status">הדיווח נשמר. תודה! <button className="quiet" onClick={()=>setState('idle')}>עוד דיווח</button></p>;
  if(!open)return <button className="quiet miss-open" onClick={()=>{setOpen(true);setState('idle')}}>נושא חסר באתר?</button>;
  return <form className="miss-form" onSubmit={submit}>
   <h4>דיווח על נושא חסר</h4>
   <p className="miss-hint">הדיווח נשמר לבעלי האתר בלבד ואי אפשר לערוך אותו אחרי השליחה.</p>
   <textarea value={text} maxLength={MISS_QUESTION_MAX} rows={3} required placeholder="איזה נושא חסר לכם?" onChange={e=>setText(e.target.value)} aria-label="תיאור הנושא החסר"/>
   <div className="miss-actions">
    <button type="button" className="secondary" onClick={()=>setOpen(false)}>ביטול</button>
    <button type="submit" className="auth-submit" disabled={state==='sending'||!text.trim()}>{state==='sending'?'שולחים…':'שליחת הדיווח'}</button>
   </div>
   {state==='failed'&&<p className="chat-error" role="alert"><strong>הדיווח לא נשלח.</strong> בודקים את החיבור ומנסים שוב.</p>}
  </form>;
}

export function Chat({user}){
  const [open,setOpen]=useState(false);
  const [adult,confirmAdult]=useAdultDeclaration(user,open);
  const [messages,setMessages]=useState([{role:'model',text:'שלום! שואלים אותי על כימיה ואני גם מפנה לנושאים שקיימים באתר. מה מעסיק אותך?'}]);
  const [input,setInput]=useState('');
  const [typing,setTyping]=useState(false);
  const [notice,setNotice]=useState('');
  const [missPrefill,setMissPrefill]=useState(null);
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
      const cards=matchSubjects(text);
      setMessages(ms=>[...ms,{role:'model',text:reply,cards},...(isMiss(cards)?[{role:'miss-prompt',question:text}]:[])]);
    }catch(error){
      const msg=chatErrorMessage(error);
      const suggestions=isQuotaError(error)?searchSite(text,{limit:3}):[];
      setMessages(ms=>[...ms,{role:'error',...msg,suggestions}]);
    }finally{setTyping(false)}
  };

  const lastAnswer=[...messages].reverse().find(m=>m.role==='model')?.text;
  const go=route=>{location.hash=route};

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
       {messages.map((m,i)=>{
        if(m.role==='error')return <div key={i} className="chat-msg error" role="alert">
         <p><strong>{m.error}</strong> {m.next}</p>
         {!!m.suggestions?.length&&<ul className="chat-suggest">{m.suggestions.map(s=><li key={s.route}><button onClick={()=>{go(s.route);setOpen(false)}}>{s.kind}: {s.title}</button></li>)}</ul>}
        </div>;
        if(m.role==='miss-prompt')return <div key={i} className="chat-msg miss-prompt">
         <p>לא מצאתי את הנושא הזה באתר.</p>
         <button className="miss-prompt-btn" onClick={()=>setMissPrefill({text:m.question,at:Date.now()})}>לדווח עליו כחסר?</button>
        </div>;
        return <div key={i} className={'chat-msg '+m.role} dir="auto">
         <p>{m.role==='model'?stripMarkdown(m.text):m.text}</p>
         {!!m.cards?.length&&<div className="subject-cards">
          <span className="subject-cards-label">באתר:</span>
          {m.cards.map(c=><button key={c.route} className="subject-card" onClick={()=>go(c.route)}><span className="subject-kind">{c.kind}</span>{c.title}</button>)}
         </div>}
        </div>;
       })}
       {typing&&<div className="chat-msg model typing"><p>חושב…</p></div>}
       {notice&&<p className="chat-notice" role="status">{notice}</p>}
      </div>
      <form className="chat-input" onSubmit={send}>
       <input value={input} onChange={e=>setInput(e.target.value)} placeholder="מה לא מובן?" aria-label="שאלה לצ'אט" disabled={typing}/>
       <button type="submit" className="auth-submit" disabled={typing||!input.trim()} aria-label="שליחת השאלה">שליחה</button>
      </form>
      <MissReport user={user} lastAnswer={lastAnswer} prefill={missPrefill}/>
     </>
     :adult.status==='checking'
      ?<div className="chat-scroll"><p className="chat-notice">רגע, בודקים את אישור הגיל…</p></div>
      :<AdultStep state={adult} onConfirm={confirmAdult} onClose={()=>setOpen(false)}/>}
   </div>}
  </>;
}
