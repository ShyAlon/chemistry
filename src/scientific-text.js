import React from 'react';
import {mathNotation} from './math-notation.js';
import {bidiElement} from './bidi-react.js';
import {resolveConstants,symbolRows} from './symbols.js';
// Optional, explicit authored runs. Source strings stay intact for searching,
// provenance, answers and storage. No HTML parsing or DOM rewriting.
export function ScientificText({runs}){return React.createElement(React.Fragment,null,...runs.map((run,i)=>typeof run==='string'?bidiElement(React.Fragment,{key:i},run):run.keep?React.createElement('span',{key:i,className:'math-unit'},React.createElement(ScientificText,{runs:run.keep})):React.createElement('bdi',{key:i,dir:run.dir||'ltr',className:'inline-math'},...mathNotation(run.math))));}
export function Definition({definition}){return React.createElement('div',{className:'scientific-definition'},
 React.createElement('p',null,React.createElement(ScientificText,{runs:definition.intro})),
 React.createElement('p',null,React.createElement(ScientificText,{runs:definition.range})),
 React.createElement('dl',{className:'math-definitions'},...definition.mappings.map(([term,value])=>React.createElement('div',{key:term},React.createElement('dt',null,React.createElement('bdi',{dir:'ltr'},term)),React.createElement('dd',null,React.createElement('bdi',{dir:'ltr'},value))))));}
export function DisplayMath({text}){return React.createElement('div',{className:'display-math',dir:'ltr',tabIndex:0,'aria-label':'נוסחה'},...resolveConstants(text).split(/ {3,}/).map((line,i)=>React.createElement('div',{key:i},...mathNotation(line))));}

// A formula with a symbol popup. Hover (mouse), focus (keyboard) or tap (touch)
// opens it; it stays open while the pointer or focus is inside, Escape closes
// it. The popup repeats the formula and lists every symbol from symbol-defs.js.
// Printing hides the popup and prints the same list under the formula.
function SymbolList({rows}){return React.createElement('dl',null,...rows.map(([sym,meaning],i)=>React.createElement('div',{key:i},React.createElement('dt',null,React.createElement('bdi',{dir:'ltr'},...mathNotation(sym))),React.createElement('dd',null,React.createElement(ScientificText,{runs:Array.isArray(meaning)?meaning:[meaning]})))))}
export function FormulaTip({text,symbols}){
 const [open,setOpen]=React.useState(false);const [place,setPlace]=React.useState(null);const id=React.useId();const rows=symbolRows(symbols);
 const touch=React.useRef(null);const tip=React.useRef(null);const pop=React.useRef(null);const face=React.useRef(null);
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
  const away=e=>{if(tip.current&&!tip.current.contains(e.target))setOpen(false)};
  document.addEventListener('pointerdown',away);return()=>document.removeEventListener('pointerdown',away);
 },[open]);
 const lines=()=>resolveConstants(text).split(/ {3,}/).map((line,i)=>React.createElement('div',{key:i},...mathNotation(line)));
 return React.createElement('div',{ref:tip,className:'formula-tip'+(open?' open':'')+(place?.above?' above':''),
  onPointerEnter:e=>{if(e.pointerType==='mouse')setOpen(true)},onPointerLeave:e=>{if(e.pointerType==='mouse')setOpen(false)},
  onPointerDown:e=>{touch.current=e.pointerType==='mouse'?null:{wasOpen:open}},
  onClick:()=>{if(touch.current){const w=touch.current.wasOpen;touch.current=null;setOpen(!w)}},
  onFocus:()=>setOpen(true),onBlur:e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)},
  onKeyDown:e=>{if(e.key==='Escape'){setOpen(false);face.current&&face.current.focus()}}},
  React.createElement('div',{ref:face,className:'display-math',dir:'ltr',tabIndex:0,'aria-describedby':id,'aria-label':'נוסחה, עם הסבר לסמלים'},...lines()),
  React.createElement('span',{className:'formula-hint','aria-hidden':'true'},'ⓘ'),
  React.createElement('div',{ref:pop,className:'formula-pop',id,role:'tooltip',style:place&&!place.above?{maxHeight:place.max}:place?{maxHeight:place.max}:undefined},
   React.createElement('div',{className:'formula-pop-head'},React.createElement('div',{className:'formula-pop-title'},'מקרא סמלים'),React.createElement('button',{type:'button',className:'formula-pop-close','aria-label':'סגירת המקרא',onClick:e=>{e.stopPropagation();touch.current=null;setOpen(false);face.current&&face.current.focus()}},'✕')),
   React.createElement('div',{className:'formula-pop-eq',dir:'ltr'},...lines()),
   React.createElement(SymbolList,{rows})),
  React.createElement('div',{className:'formula-print-key'},React.createElement('div',{className:'formula-pop-title'},'מקרא סמלים'),React.createElement(SymbolList,{rows})));
}
