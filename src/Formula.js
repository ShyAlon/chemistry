import React from 'react';
import {mathNotation} from './math-notation.js';
import {normalizeBidiText} from './bidi.js';
import {resolveConstants,symbolRows} from './symbols.js';
import {ScientificText,Definition} from './ScientificContent.js';
import {formulaMetadata} from './formula-metadata.js';
import {formulaPresentation} from './formula-presentation.js';

// The only public formula-display decision point. Callers supply content and
// context, never choose a tooltip implementation, parse math or assemble styles.
export function Formula({text,expr,symbols,context,variant='block'}){
 const value=expr??text;
 const metadata=formulaMetadata(value,{symbols,context});
 symbols=metadata?.symbols;
 const explanation=metadata?.explanation;
 if(value?.def)return React.createElement(Definition,{definition:value.def});
 if(value?.order)return React.createElement('div',{className:'orbital-order',dir:'ltr'},...value.order.map((line,i)=>React.createElement('div',{key:i,className:'fx'},...mathLine(line))));
 const source=String(value??'');
 if(variant==='block'&&source.includes(' ; ')&&!explanation)return React.createElement(React.Fragment,null,...source.split(' ; ').map((part,i)=>React.createElement(Formula,{key:i,text:part,symbols,context:metadata,variant})));
 const typeset=formulaPresentation(source);
 return (symbols?.length||explanation)&&variant!=='print'?React.createElement(SymbolFormula,{text:source,typeset,symbols,explanation,variant}):React.createElement(PlainDisplay,{text:source,typeset,variant});
}
// Compatibility API for existing tests/consumers. Both route into Formula.
export const DisplayMath=props=>React.createElement(Formula,props);
export const FormulaTip=props=>React.createElement(Formula,props);

const isFormula=t=>/[=≥≤≈→<>]|[+−·×√]/.test(t);
function CompactFace({text}){
 if(text.includes('frac{')&&/ {3,}/.test(text))return React.createElement('span',{className:'chips'},React.createElement('bdi',{dir:'ltr',className:'chip fx authored-math-lines'},...resolveConstants(text).split(/ {3,}/).map((line,i)=>React.createElement('span',{key:i,className:'authored-math-line'},...mathLine(line)))));
 const parts=resolveConstants(text).split(/ ; /).map(x=>x.trim()).filter(Boolean);
 if(parts.length===1&&!isFormula(parts[0]))return React.createElement('span',{className:'ref-prose'},parts[0]);
 return React.createElement('span',{className:'chips'},...parts.map((c,i)=>{
  if(c.includes(' → '))return React.createElement('span',{key:i,className:'chain'},...c.split(' → ').flatMap((x,j)=>[j>0&&React.createElement('span',{key:'a'+j,className:'chain-arrow','aria-hidden':'true'},'←'),React.createElement('bdi',{key:j,dir:'ltr',className:'chip fx'},...mathLine(x))]));
  const hp=c.match(/^([\u0590-\u05ff][\u0590-\u05ff ]*): (.+)$/);
  if(hp&&isFormula(hp[2]))return React.createElement('span',{key:i,className:'chip-group'},React.createElement('span',{className:'chip-label'},hp[1]+':'),React.createElement('bdi',{dir:'ltr',className:'chip fx'},...mathLine(hp[2])));
  return isFormula(c)?React.createElement('bdi',{key:i,dir:'ltr',className:'chip fx'},...mathLine(c)):React.createElement('span',{key:i,className:'chip chip-text'},c);
 }));
}
// Equations are LTR; items that mix Hebrew prose (sheet alternatives like
// 'כליאה ∝ 1/R²') get an RTL paragraph direction, with each math run LTR-isolated
// by normalizeBidiText so reciprocals and operators keep their order and meaning.
const mathDir=text=>/[\u0590-\u05ff]/.test(text)?'rtl':'ltr';
const mathLine=line=>/[\u0590-\u05ff]/.test(line)?mathNotation(normalizeBidiText(line)):mathNotation(line);
function PlainDisplay({text,typeset,variant}){if(variant==='compact'||variant==='print')return React.createElement(CompactFace,{text:typeset||text});return React.createElement('div',{className:'display-math',dir:mathDir(text),tabIndex:0,'aria-label':'נוסחה'},...resolveConstants(typeset||text).split(/ {3,}/).map((line,i)=>React.createElement('div',{key:i},...mathLine(line))));}

// A formula with a symbol popup. The trigger is the formula itself: hovering it
// (mouse) for half a second opens the popup, keyboard focus opens it at once and
// a tap (touch) toggles it; it stays open while the pointer or focus is inside,
// Escape closes it. The popup fades in over a second and fades out in half that
// time. The ⓘ hint and the ✕ button exist only where hover does not. Printing
// hides the popup and prints the same list under the formula.
export const FORMULA_TIP_HOVER_MS=500;
const LEAVE_GRACE_MS=180;
export function SymbolList({rows}){return React.createElement('dl',null,...rows.map(([sym,meaning],i)=>React.createElement('div',{key:i},React.createElement('dt',null,React.createElement('bdi',{dir:'ltr'},...mathNotation(sym))),React.createElement('dd',null,React.createElement(ScientificText,{runs:Array.isArray(meaning)?meaning:[meaning]})))))}
function SymbolFormula({text,symbols=[],explanation,typeset,variant}){
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
  const update=()=>{
   if(window.innerWidth<=700){setPlace(null);return}
   const r=tip.current.getBoundingClientRect();const below=window.innerHeight-r.bottom-72,above=r.top-84,need=pop.current.scrollHeight+10;
   const next=need<=below?{above:false,max:below}:above>below?{above:true,max:Math.max(Math.min(above,need),180)}:{above:false,max:Math.max(below,180)};
   setPlace(previous=>previous?.above===next.above&&previous?.max===next.max?previous:next);
  };
  update();
  // Native keyboard focus can scroll after the opening layout effect. Keep the
  // same placement rules, but refresh them after that scroll and later resizes.
  const frame=window.requestAnimationFrame(update);
  // Collapsing sidebars can reflow earlier paragraphs without another scroll.
  const observer=new ResizeObserver(update);observer.observe(tip.current);
  const article=tip.current.closest('article');if(article)observer.observe(article);
  window.addEventListener('scroll',update,true);window.addEventListener('resize',update);
  return()=>{window.cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',update,true);window.removeEventListener('resize',update)};
 },[open]);
 React.useEffect(()=>{
  if(!open)return;
  const away=e=>{if(tip.current&&!tip.current.contains(e.target)){cancel();setOpen(false)}};
  document.addEventListener('pointerdown',away);return()=>document.removeEventListener('pointerdown',away);
 },[open]);
 const heading=symbols.length?'מקרא סמלים':'הסבר הסימון';
 const legend=()=>React.createElement(React.Fragment,null,explanation&&React.createElement('p',{className:'formula-explanation'},React.createElement(ScientificText,{runs:[explanation]})),symbols.length>0&&React.createElement(SymbolList,{rows}));
 const lines=()=>resolveConstants(typeset||text).split(explanation&&!symbols.length?/ {3,}| ; /:/ {3,}/).map((line,i)=>React.createElement('div',{key:i},...mathLine(line)));
 return React.createElement('div',{ref:tip,className:'formula-tip'+(variant==='compact'?' formula-compact':'')+(open?' open':'')+(place?.above?' above':''),
  onFocus:()=>{cancel();setOpen(true)},onBlur:e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)},
  onKeyDown:e=>{if(e.key==='Escape'){cancel();setOpen(false);face.current&&face.current.focus()}}},
  React.createElement('div',{className:'formula-face'},
   React.createElement('div',{ref:face,className:variant==='compact'?'display-math formula-compact-face':'display-math',dir:mathDir(text),tabIndex:0,'aria-describedby':id,'aria-label':'נוסחה, עם הסבר לסמלים',
    onPointerEnter:e=>{if(e.pointerType==='mouse')scheduleOpen()},onPointerLeave:e=>{if(e.pointerType==='mouse')scheduleClose()},
    onPointerDown:e=>{touch.current=e.pointerType==='mouse'?null:{wasOpen:open}},
    onClick:()=>{if(touch.current){const w=touch.current.wasOpen;touch.current=null;cancel();setOpen(!w)}}},
    ...(variant==='compact'?[React.createElement(CompactFace,{key:'compact',text:typeset||text})]:lines()),
    React.createElement('span',{className:'formula-hint','aria-hidden':'true'},'ⓘ'))),
  React.createElement('div',{ref:pop,className:'formula-pop',id,role:'tooltip',style:place&&!place.above?{maxHeight:place.max}:place?{maxHeight:place.max}:undefined,
   onPointerEnter:e=>{if(e.pointerType==='mouse')cancel()},onPointerLeave:e=>{if(e.pointerType==='mouse')scheduleClose()}},
   React.createElement('div',{className:'formula-pop-head'},React.createElement('div',{className:'formula-pop-title'},heading),React.createElement('button',{type:'button',className:'formula-pop-close','aria-label':'סגירת המקרא',onClick:e=>{e.stopPropagation();touch.current=null;cancel();setOpen(false);face.current&&face.current.focus()}},'✕')),
   React.createElement('div',{className:'formula-pop-eq',dir:mathDir(text)},...lines()),
   legend()),
  React.createElement('div',{className:'formula-print-key'},React.createElement('div',{className:'formula-pop-title'},heading),legend()));
}
