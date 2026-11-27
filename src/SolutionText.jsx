import './solution-steps.css';
import React from 'react';
import {bidiElement} from './bidi-react.js';
import {Formula} from './Formula.js';
import {splitSolutionSteps,isCalculationStep,solutionDisplayText,splitSignedQuantities,splitEquationRuns,splitQuantities,glueCalculation} from './solution-steps.js';
// Same display rule as lessons: one idea per block. Calculations use the lesson equation block (Formula),
// so a quantity and its unit never break apart; conclusions stay Hebrew text with the sign inside the number.
// A signed quantity in Hebrew prose is one left-to-right unit, so the minus cannot drift to the other side of the number.
const Plain=({text,Rich,prefixOnly})=><>{splitSignedQuantities(text).map((part,i)=>part.quantity?<bdi key={i} dir="ltr" className="signed-quantity">{part.text}</bdi>:splitQuantities(part.text,prefixOnly).map((q,j)=>q.quantity?<bdi key={i+'-'+j} dir="ltr" className="signed-quantity">{q.text}</bdi>:<Rich key={i+'-'+j} text={q.text}/>))}</>;
const Prose=({text,Rich,prefixOnly})=><>{splitEquationRuns(solutionDisplayText(text)).map((part,i)=>part.equation?<bdi key={i} dir="ltr" className="inline-equation">{part.text.split(/(?<=\u200b)/).map((c,k)=><span key={k} className="eq-chunk">{c}</span>)}</bdi>:<Plain key={i} text={part.text} Rich={Rich} prefixOnly={prefixOnly}/>)}</>;
export const ProblemText=({text,Rich})=><Prose text={text} Rich={Rich} prefixOnly/>;
export function SolutionText({text,Rich}){
 const steps=splitSolutionSteps(text);
 if(steps.length<2)return <p><Prose text={text} Rich={Rich}/></p>;
 return <div className="solution-steps">{steps.map((s,i)=>isCalculationStep(s)?<div key={i} className="solution-step solution-calc"><Formula text={glueCalculation(s.replace(/\.$/,''))}/></div>:<p key={i} className="solution-step"><Prose text={s} Rich={Rich}/></p>)}</div>;
}

// Display glue (NBSP, zero-width break after "=") must not leak into copied text.
if(typeof document!=='undefined'&&!globalThis.__solutionCopyClean){globalThis.__solutionCopyClean=true;document.addEventListener('copy',e=>{const t=String(window.getSelection?.()||'');if(/[\u200b\u2060\u00a0]/.test(t)&&e.clipboardData){e.clipboardData.setData('text/plain',t.replace(/[\u200b\u2060]/g,'').replace(/\u00a0/g,' '));e.preventDefault()}})}
