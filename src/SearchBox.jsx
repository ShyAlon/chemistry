import React,{useEffect,useMemo,useRef,useState} from 'react';
import {bidiElement} from './bidi-react.js';
import {searchSite,suggestCompletion,tokenize} from './search.js';

function Magnifier(){return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>}

function Highlight({text,terms}){
 if(!terms.length)return text;
 const pattern=terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 const parts=String(text).split(new RegExp('('+pattern+')','gi'));
 return parts.map((part,i)=>i%2?<mark key={i}>{part}</mark>:part);
}

export function SearchBox(){
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState('');
 const [active,setActive]=useState(0);
 const inputRef=useRef(null);
 const triggerRef=useRef(null);
 const results=useMemo(()=>open&&query.trim()?searchSite(query):[],[open,query]);
 const terms=useMemo(()=>tokenize(query),[query]);
 // Shadow completion: ghost text finishing the word being typed ("ליגנ" →
 // "ליגנד"), accepted with Tab, a tap on the ghost, or the arrow key that
 // points past the end of the text: ArrowRight in LTR, ArrowLeft in RTL.
 // The opposite arrow stays natural caret motion and is never intercepted.
 const completion=useMemo(()=>open&&query.trim()?suggestCompletion(query):null,[open,query]);
 // Case-insensitive prefix check: a Latin suggestion keeps the site's casing
 // ("osmo" completes to "Osmosis").
 const ghost=completion&&completion.slice(0,query.length).toLowerCase()===query.toLowerCase()?completion.slice(query.length):null;
 const rtl=/[\u0590-\u05ff]/.test((query.match(/[a-zA-Z\u0590-\u05ff]/)||[''])[0]);
 const acceptKey=rtl?'ArrowLeft':'ArrowRight';
 const acceptGhost=()=>{if(completion){setQuery(completion);requestAnimationFrame(()=>{const el=inputRef.current;if(el)el.setSelectionRange(completion.length,completion.length)})}};
 useEffect(()=>{
  const fn=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(v=>!v)}};
  addEventListener('keydown',fn);return()=>removeEventListener('keydown',fn);
 },[]);
 useEffect(()=>{if(open){setActive(0);requestAnimationFrame(()=>inputRef.current?.focus())}},[open]);
 useEffect(()=>{setActive(0)},[query]);
 const close=()=>{setOpen(false);triggerRef.current?.focus()};
 const go=route=>{setOpen(false);if(route)location.hash=route};
 const onKeyDown=e=>{
  if(e.key==='Escape'){e.preventDefault();close()}
  else if(e.key==='ArrowDown'){e.preventDefault();if(results.length)setActive((active+1)%results.length)}
  else if(e.key==='ArrowUp'){e.preventDefault();if(results.length)setActive((active-1+results.length)%results.length)}
  else if(e.key==='Enter'){e.preventDefault();if(results[active])go(results[active].route)}
  else if(e.key==='Tab'&&ghost){e.preventDefault();acceptGhost()}
  else if(e.key===acceptKey&&ghost){const el=inputRef.current;if(el&&el.selectionStart===query.length&&el.selectionEnd===query.length){e.preventDefault();acceptGhost()}}
 };
 // Tap acceptance for touch keyboards: the ghost remainder itself is the
 // accept target; mousedown preventDefault keeps the input focused.
 const tapGhost=e=>{e.preventDefault();acceptGhost()};
 return <>
  <button ref={triggerRef} className="search-trigger" aria-label="חיפוש באתר" title="חיפוש (Ctrl+K)" aria-expanded={open} onClick={()=>setOpen(true)}><Magnifier/></button>
  {open&&<div className="search-overlay" onClick={close}>
   <div className="search-panel" role="dialog" aria-modal="true" aria-label="חיפוש באתר" onClick={e=>e.stopPropagation()} onKeyDown={onKeyDown}>
    <div className="search-row">
     <Magnifier/>
     <span className="search-input-wrap">
      <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder='מה מחפשים? למשל: אוסמוזה, effusion, PbSe' aria-label="מונח חיפוש" enterKeyHint="search"/>
      {ghost&&<span className="search-ghost" aria-hidden="true"><span className="ghost-typed">{query}</span><span className="ghost-rest" onMouseDown={tapGhost}>{ghost}</span></span>}
     </span>
     <button className="search-close" onClick={close} aria-label="סגירת החיפוש">✕</button>
    </div>
    {!query.trim()&&<p className="search-hint">חיפוש בכל הקורסים, המקראות, המאמרים והתרגולים. התוצאות מדורגות לפי רלוונטיות.</p>}
    {query.trim()&&!results.length&&<p className="search-hint">לא נמצאו תוצאות ל״{query}״. נסו מונח אחר או כתיב חלופי.</p>}
    {!!results.length&&<ul className="search-results" role="listbox" aria-label="תוצאות חיפוש">
     {results.map((r,i)=><li key={r.route}>
      <button className={'search-result'+(i===active?' active':'')} role="option" aria-selected={i===active} onClick={()=>go(r.route)} onMouseEnter={()=>setActive(i)}>
       <span className="search-kind">{r.kind}</span>
       <span className="search-main">
        <span className="search-title"><Highlight text={r.title} terms={terms}/></span>
        <span className="search-context"><bdi>{r.context}</bdi></span>
        {r.snippet&&<span className="search-snippet" dir="auto"><Highlight text={r.snippet} terms={terms}/></span>}
       </span>
      </button>
     </li>)}
    </ul>}
   </div>
  </div>}
 </>;
}
