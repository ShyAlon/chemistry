import React from 'react';
import {mathNotation} from './math-notation.js';
import {bidiElement} from './bidi-react.js';
import {resolveConstants,symbolRows} from './symbols.js';
import {normalizeBidiText} from './bidi.js';
// Optional, explicit authored runs. Source strings stay intact for searching,
// provenance, answers and storage. No HTML parsing or DOM rewriting.
export function ScientificText({runs}){return React.createElement(React.Fragment,null,...runs.map((run,i)=>typeof run==='string'?bidiElement(React.Fragment,{key:i},run):run.keep?React.createElement('span',{key:i,className:'math-unit'},React.createElement(ScientificText,{runs:run.keep})):React.createElement('bdi',{key:i,dir:run.dir||'ltr',className:'inline-math'},...mathNotation(run.math))));}
export function Definition({definition}){return React.createElement('div',{className:'scientific-definition'},
 React.createElement('p',null,React.createElement(ScientificText,{runs:definition.intro})),
 React.createElement('p',null,React.createElement(ScientificText,{runs:definition.range})),
 React.createElement('dl',{className:'math-definitions'},...definition.mappings.map(([term,value])=>React.createElement('div',{key:term},React.createElement('dt',null,React.createElement('bdi',{dir:'ltr'},term)),React.createElement('dd',null,React.createElement('bdi',{dir:'ltr'},value))))));}
// Equations are LTR; items that mix Hebrew prose (sheet alternatives like
// 'כליאה ∝ 1/R²') get an RTL paragraph direction, with each math run LTR-isolated
// by normalizeBidiText so reciprocals and operators keep their order and meaning.
const mathDir=text=>/[\u0590-\u05ff]/.test(text)?'rtl':'ltr';
const mathLine=line=>/[\u0590-\u05ff]/.test(line)?mathNotation(normalizeBidiText(line)):mathNotation(line);
export function DisplayMath({text}){return React.createElement('div',{className:'display-math',dir:mathDir(text),tabIndex:0,'aria-label':'נוסחה'},...resolveConstants(text).split(/ {3,}/).map((line,i)=>React.createElement('div',{key:i},...mathLine(line))));}

// A formula with a symbol popup. The trigger is the formula itself: hovering it
// (mouse) for half a second opens the popup, keyboard focus opens it at once and
// a tap (touch) toggles it; it stays open while the pointer or focus is inside,
// Escape closes it. The popup fades in over a second and fades out in half that
// time. The ⓘ hint and the ✕ button exist only where hover does not. Printing
// hides the popup and prints the same list under the formula.
export const FORMULA_TIP_HOVER_MS=500;
const LEAVE_GRACE_MS=180;
export function SymbolList({rows}){return React.createElement('dl',null,...rows.map(([sym,meaning],i)=>React.createElement('div',{key:i},React.createElement('dt',null,React.createElement('bdi',{dir:'ltr'},...mathNotation(sym))),React.createElement('dd',null,React.createElement(ScientificText,{runs:Array.isArray(meaning)?meaning:[meaning]})))))}
export function FormulaTip({text,symbols}){
 const [open,setOpen]=React.useState(false);const [place,setPlace]=React.useState(null);const id=React.useId();const rows=symbolRows(symbols);
 const touch=React.useRef(null);const tip=React.useRef(null);const pop=React.useRef(null);const face=React.useRef(null);const timers=React.useRef({open:0,close:0});
 React.useEffect(()=>()=>{clearTimeout(timers.current.open);clearTimeout(timers.current.close)},[]);
 const cancel=()=>{clearTimeout(timers.current.open);clearTimeout(timers.current.close)};
 const scheduleOpen=()=>{cancel();timers.current.open=setTimeout(()=>setOpen(true),FORMULA_TIP_HOVER_MS)};
 const scheduleClose=()=>{cancel();timers.current.close=setTimeout(()=>setOpen(false),LEAVE_GRACE_MS)};
 // Keep the popup inside the viewport: on wide screens it opens on the side with more room and scrolls inside;
 // on narrow screens CSS turns it into a bottom sheet with its own scrolling.
 React.useLayoutEffect(()=>{
  if(!open||typeof window==='undefined'||!tip.current||!pop.current)return;
  if(window.innerWidth<=700){setPlace(null);return}
  const r=tip.current.getBoundingClientRect();const below=window.innerHeight-r.bottom-72,above=r.top-84,need=pop.current.scrollHeight+10;
  if(need<=below)setPlace({above:false,max:below});else if(above>below)setPlace({above:true,max:Math.max(Math.min(above,need),180)});else setPlace({above:false,max:Math.max(below,180)});
 },[open]);
 React.useEffect(()=>{
  if(!open)return;
  const away=e=>{if(tip.current&&!tip.current.contains(e.target)){cancel();setOpen(false)}};
  document.addEventListener('pointerdown',away);return()=>document.removeEventListener('pointerdown',away);
 },[open]);
 const lines=()=>resolveConstants(text).split(/ {3,}/).map((line,i)=>React.createElement('div',{key:i},...mathLine(line)));
 return React.createElement('div',{ref:tip,className:'formula-tip'+(open?' open':'')+(place?.above?' above':''),
  onFocus:()=>{cancel();setOpen(true)},onBlur:e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)},
  onKeyDown:e=>{if(e.key==='Escape'){cancel();setOpen(false);face.current&&face.current.focus()}}},
  React.createElement('div',{className:'formula-face'},
   React.createElement('div',{ref:face,className:'display-math',dir:mathDir(text),tabIndex:0,'aria-describedby':id,'aria-label':'נוסחה, עם הסבר לסמלים',
    onPointerEnter:e=>{if(e.pointerType==='mouse')scheduleOpen()},onPointerLeave:e=>{if(e.pointerType==='mouse')scheduleClose()},
    onPointerDown:e=>{touch.current=e.pointerType==='mouse'?null:{wasOpen:open}},
    onClick:()=>{if(touch.current){const w=touch.current.wasOpen;touch.current=null;cancel();setOpen(!w)}}},
    ...lines(),
    React.createElement('span',{className:'formula-hint','aria-hidden':'true'},'ⓘ'))),
  React.createElement('div',{ref:pop,className:'formula-pop',id,role:'tooltip',style:place&&!place.above?{maxHeight:place.max}:place?{maxHeight:place.max}:undefined,
   onPointerEnter:e=>{if(e.pointerType==='mouse')cancel()},onPointerLeave:e=>{if(e.pointerType==='mouse')scheduleClose()}},
   React.createElement('div',{className:'formula-pop-head'},React.createElement('div',{className:'formula-pop-title'},'מקרא סמלים'),React.createElement('button',{type:'button',className:'formula-pop-close','aria-label':'סגירת המקרא',onClick:e=>{e.stopPropagation();touch.current=null;cancel();setOpen(false);face.current&&face.current.focus()}},'✕')),
   React.createElement('div',{className:'formula-pop-eq',dir:mathDir(text)},...lines()),
   React.createElement(SymbolList,{rows})),
  React.createElement('div',{className:'formula-print-key'},React.createElement('div',{className:'formula-pop-title'},'מקרא סמלים'),React.createElement(SymbolList,{rows})));
}
