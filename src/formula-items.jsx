import React from 'react';
import {bidiElement} from './bidi-react.js';
import {mathNotation as sub} from './math-notation.js';
import {Definition} from './scientific-text.js';

// Shared rendering for a reference-formula item's expression: independently
// readable relations become no-wrap chips, prose stays text. Used by the
// References sheet, the print tool and the per-topic formulas tab.
export const isFormula=t=>/[=≥≤≈→<>]|[+−·×√]/.test(t);
export function Chips({text}){
 const parts=text.split(/ ; /).map(x=>x.trim()).filter(Boolean);
 if(parts.length===1&&!isFormula(parts[0]))return <span className="ref-prose">{parts[0]}</span>;
 return <span className="chips">{parts.map((c,i)=>{
  if(c.includes(' → '))return <span key={i} className="chain">{c.split(' → ').map((x,j)=>[j>0&&<span key={'a'+j} className="chain-arrow" aria-hidden="true">←</span>,<bdi key={j} dir="ltr" className="chip fx">{sub(x)}</bdi>])}</span>;
  const hp=c.match(/^([\u0590-\u05ff][\u0590-\u05ff ]*): (.+)$/);
  if(hp&&isFormula(hp[2]))return <span key={i} className="chip-group"><span className="chip-label">{hp[1]}:</span><bdi dir="ltr" className="chip fx">{sub(hp[2])}</bdi></span>;
  return isFormula(c)?<bdi key={i} dir="ltr" className="chip fx">{sub(c)}</bdi>:<span key={i} className="chip chip-text">{c}</span>})}</span>}
export function Expr({expr}){if(expr?.order)return <div className="orbital-order" dir="ltr">{expr.order.map((line,i)=><div key={i} className="fx">{sub(line)}</div>)}</div>;return expr&&expr.def?<Definition definition={expr.def}/>:<Chips text={expr}/>}
