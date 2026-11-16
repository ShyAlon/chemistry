import {bidiElement} from './bidi-react.js';
import React,{useState,useRef,useId,useLayoutEffect,useEffect} from 'react';
import {createPortal} from 'react-dom';

// A compact source disclosure, styled as a tooltip. Unlike a native title it
// works with touch, keyboard and links, without taking space in the reading flow.
export function SourceTooltip({label='מקורות',children}){
 const id=useId(),trigger=useRef(null),panel=useRef(null),timer=useRef(null);
 const pinned=useRef(false);const [open,setOpen]=useState(false),[position,setPosition]=useState({left:12,top:12});
 const clear=()=>clearTimeout(timer.current);
 const dismiss=(restore=false)=>{clear();pinned.current=false;if(restore)trigger.current?.focus();setOpen(false)};
 const enter=()=>{clear();document.dispatchEvent(new CustomEvent('source-tooltip-open',{detail:id}));setOpen(true)};
 const leave=()=>{clear();if(!pinned.current)timer.current=setTimeout(()=>{if(!panel.current?.contains(document.activeElement)&&document.activeElement!==trigger.current)setOpen(false)},160)};
 useLayoutEffect(()=>{
  if(!open)return;
  const place=()=>{if(!trigger.current||!panel.current)return;const a=trigger.current.getBoundingClientRect(),b=panel.current.getBoundingClientRect();const left=Math.max(12,Math.min(a.right-b.width,innerWidth-b.width-12));const below=innerHeight-a.bottom-8;const top=below>=b.height?a.bottom+8:Math.max(12,Math.min(a.top-b.height-8,innerHeight-b.height-12));setPosition({left,top})};
  place();addEventListener('resize',place);addEventListener('scroll',place,true);
  const outside=e=>{if(!trigger.current?.contains(e.target)&&!panel.current?.contains(e.target))dismiss()};
  const key=e=>{if(e.key==='Escape'){e.preventDefault();dismiss(true)}};
  const route=()=>dismiss();document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);addEventListener('hashchange',route);
  return()=>{removeEventListener('resize',place);removeEventListener('scroll',place,true);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);removeEventListener('hashchange',route)};
 },[open,children]);
 useEffect(()=>{const other=e=>{if(e.detail!==id)dismiss()};document.addEventListener('source-tooltip-open',other);return()=>{clearTimeout(timer.current);document.removeEventListener('source-tooltip-open',other)}},[id]);
 const blur=e=>{if(!panel.current?.contains(e.relatedTarget)&&e.relatedTarget!==trigger.current&&!pinned.current)dismiss()};
 return <span className="source-tooltip"><button ref={trigger} type="button" className="source-trigger" aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?id:undefined}
  onPointerEnter={e=>{if(e.pointerType==='mouse')enter()}} onPointerLeave={leave} onFocus={enter} onBlur={blur}
  onClick={()=>{clear();if(pinned.current)dismiss();else{enter();pinned.current=true}}}
  onKeyDown={e=>{if(open&&(e.key==='ArrowDown'||(e.key==='Tab'&&!e.shiftKey))){e.preventDefault();panel.current?.querySelector('a,button')?.focus()}}}><span aria-hidden="true">ⓘ</span></button>
 {open&&createPortal(<section ref={panel} id={id} role="dialog" aria-modal="false" aria-label={label} className="source-popover" dir="rtl" style={position}
  onPointerEnter={clear} onPointerLeave={leave} onBlur={blur}>
  <div className="source-popover-head"><strong>{label}</strong><button type="button" className="source-close" aria-label="סגירת המקור" onClick={()=>dismiss(true)}>×</button></div>
  <div className="source-popover-body">{children}</div>
 </section>,document.body)}</span>
}
