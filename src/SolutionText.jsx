import './solution-steps.css';
import React from 'react';
import {bidiElement} from './bidi-react.js';
import {Formula} from './Formula.js';
import {splitSolutionSteps,isCalculationStep,solutionDisplayText,splitSignedQuantities,splitEquationRuns,splitQuantities,glueCalculation,breakMath} from './solution-steps.js';
// Same display rule as lessons: one idea per block. Calculations use the lesson equation block (Formula),
// so a quantity and its unit never break apart; conclusions stay Hebrew text with the sign inside the number.
// A signed quantity in Hebrew prose is one left-to-right unit, so the minus cannot drift to the other side of the number.
const Quantity=({q,k})=><bdi key={k} dir="ltr" className="signed-quantity">{q.text}</bdi>;
const Plain=({text,Rich,prefixOnly})=><>{splitQuantities(text,prefixOnly).map((q,j)=>q.quantity?<Quantity key={j} q={q}/>:splitSignedQuantities(q.text).map((part,i)=>part.quantity?<Quantity key={j+'-'+i} q={part}/>:<Rich key={j+'-'+i} text={part.text}/>))}</>;
const gluePunct=parts=>{const o=[];for(const p of parts){const prev=o[o.length-1];const m=prev&&prev.equation&&!p.equation&&p.text.match(/^[.,;:?!]+/);if(m){o[o.length-1]={...prev,text:prev.text+m[0]};if(p.text.length>m[0].length)o.push({...p,text:p.text.slice(m[0].length)})}else o.push(p)}return o};
// A chunk wider than the column scrolls on its own; then it is keyboard-focusable and named, like the lesson equation block.
const EqChunk=({children})=>{const ref=React.useRef(null);const [wide,setWide]=React.useState(false);
 React.useLayoutEffect(()=>{const el=ref.current;if(!el)return;const f=()=>setWide(el.scrollWidth>el.clientWidth+1);f();if(typeof ResizeObserver==='undefined')return;const ro=new ResizeObserver(f);ro.observe(el);return()=>ro.disconnect()},[children]);
 return <span ref={ref} className="eq-chunk" {...(wide?{tabIndex:0,role:'group','aria-label':'נוסחה, אפשר לגלול הצידה'}:{})}>{children}</span>};
const Prose=({text,Rich,prefixOnly})=><>{gluePunct(splitEquationRuns(solutionDisplayText(text))).map((part,i)=>part.equation?<bdi key={i} dir="ltr" className="inline-equation">{part.text.split(/(?<=\u200b)/).flatMap(c=>c.length>24?breakMath(c).split(/(?<=\u200b)/):[c]).map((c,k)=><EqChunk key={k}>{c}</EqChunk>)}</bdi>:<Plain key={i} text={part.text} Rich={Rich} prefixOnly={prefixOnly}/>)}</>;
// A reaction written inside a Hebrew sentence is shown as its own left-to-right block, so its terms keep their order and never
// split from their subscripts. Text without a reaction arrow is rendered exactly as before.
export function splitReactionRuns(text){
  const out=[];let last=0;const re=/[^\u0590-\u05FF\n]+/g;let m;
  while((m=re.exec(text))){
    const run=m[0];if(!/→/.test(run))continue;
    const lead=run.match(/^[\s,;:.\-–]*/)[0].length;const core=run.slice(lead).replace(/\s+$/,'');if(!core)continue;
    const start=m.index+lead;if(start>last)out.push({text:text.slice(last,start)});
    const spaced=core.replace(/\s*→\s*/g,' → ').replace(/(?<=[A-Za-z0-9₀-₉)\]])\+(?=[A-Za-z0-9(])/g,' + ');
    out.push({text:spaced,reaction:true});last=start+core.length;
  }
  if(last<text.length)out.push({text:text.slice(last)});
  return out;
}
export const ReactionText=({text,Rich,Plainer})=>{const parts=splitReactionRuns(text);if(!parts.some(p=>p.reaction))return Plainer?<Plainer text={text}/>:<Rich text={text}/>;
 return <>{parts.map((p,i)=>p.reaction?<bdi key={i} dir="ltr" className="problem-reaction">{p.text}</bdi>:(p.text.trim()?(Plainer?<Plainer key={i} text={p.text}/>:<Rich key={i} text={p.text}/>):null))}</>};
export const ProblemText=({text,Rich})=><ReactionText text={text} Rich={Rich} Plainer={({text:t})=><Prose text={t} Rich={Rich} prefixOnly/>}/>;
export const PromptText=({text,Rich})=><ReactionText text={text} Rich={Rich}/>;
export function SolutionText({text,Rich}){
 const steps=splitSolutionSteps(text);
 if(steps.length<2)return <p><Prose text={text} Rich={Rich}/></p>;
 return <div className="solution-steps">{steps.map((s,i)=>isCalculationStep(s)?<div key={i} className="solution-step solution-calc"><Formula text={glueCalculation(s.replace(/\.$/,''))}/></div>:<p key={i} className="solution-step"><Prose text={s} Rich={Rich}/></p>)}</div>;
}

// Display glue (NBSP, zero-width break after "=") must not leak into copied text.
if(typeof document!=='undefined'&&!globalThis.__solutionCopyClean){globalThis.__solutionCopyClean=true;document.addEventListener('copy',e=>{const t=String(window.getSelection?.()||'');if(/[\u200b\u2060\u00a0]/.test(t)&&e.clipboardData){e.clipboardData.setData('text/plain',t.replace(/[\u200b\u2060]/g,'').replace(/\u00a0/g,' '));e.preventDefault()}})}
