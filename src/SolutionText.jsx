import './solution-steps.css';
import React from 'react';
import {bidiElement} from './bidi-react.js';
import {Formula} from './Formula.js';
import {splitSolutionSteps,isCalculationStep,solutionDisplayText,splitSignedQuantities,splitEquationRuns,glueCalculation} from './solution-steps.js';
// Same display rule as lessons: one idea per block. Calculations use the lesson equation block (Formula),
// so a quantity and its unit never break apart; conclusions stay Hebrew text with the sign inside the number.
// A signed quantity in Hebrew prose is one left-to-right unit, so the minus cannot drift to the other side of the number.
const Plain=({text,Rich})=><>{splitSignedQuantities(text).map((part,i)=>part.quantity?<bdi key={i} dir="ltr" className="signed-quantity">{part.text}</bdi>:<Rich key={i} text={part.text}/>)}</>;
const Prose=({text,Rich})=><>{splitEquationRuns(solutionDisplayText(text)).map((part,i)=>part.equation?<bdi key={i} dir="ltr" className="inline-equation">{part.text}</bdi>:<Plain key={i} text={part.text} Rich={Rich}/>)}</>;
export function SolutionText({text,Rich}){
 const steps=splitSolutionSteps(text);
 if(steps.length<2)return <p><Prose text={text} Rich={Rich}/></p>;
 return <div className="solution-steps">{steps.map((s,i)=>isCalculationStep(s)?<div key={i} className="solution-step solution-calc"><Formula text={glueCalculation(s.replace(/\.$/,''))}/></div>:<p key={i} className="solution-step"><Prose text={s} Rich={Rich}/></p>)}</div>;
}
