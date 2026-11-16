import {bidiElement} from './bidi-react.js';
import React,{useEffect,useRef} from 'react';

// Decorative orbital/bond sketches, not diagrams used to teach a chemical model.
export function ChemistryBackdrop(){
 const ref=useRef(null);
 useEffect(()=>{
  let frame;const media=matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{frame=null;ref.current?.style.setProperty('--backdrop-scroll',media.matches?'0px':`${Math.min(scrollY,6000)}px`)};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  addEventListener('scroll',schedule,{passive:true});media.addEventListener('change',schedule);update();
  return()=>{removeEventListener('scroll',schedule);media.removeEventListener('change',schedule);cancelAnimationFrame(frame)};
 },[]);
 return <div className="chemistry-backdrop" ref={ref} aria-hidden="true">
  <svg className="chemistry-layer chemistry-far" width="100%" height="100%"><defs>
   <pattern id="chemistry-bonds" width="620" height="700" patternUnits="userSpaceOnUse">
    <g fill="none" stroke="#71e4f4" strokeWidth="1.4">
     <path d="M60 160l48-28 48 28v56l-48 28-48-28z M156 160l48-28 48 28v56l-48 28-48-28 M108 132v-45 M252 216l40 23 M60 216l-38 22"/>
     <circle cx="108" cy="80" r="7"/><circle cx="300" cy="244" r="7"/>
     <path d="M410 480l48-28 48 28v56l-48 28-48-28z M418 486v44 M458 461l39 23 M497 530l-39 25"/>
    </g>
    <g fill="#b48be0"><circle cx="340" cy="80" r="2"/><circle cx="550" cy="300" r="2"/><circle cx="140" cy="550" r="2"/></g>
   </pattern>
  </defs><rect width="100%" height="100%" fill="url(#chemistry-bonds)"/></svg>
  <svg className="chemistry-layer chemistry-near" width="100%" height="100%"><defs>
   <pattern id="chemistry-orbitals" width="980" height="940" patternUnits="userSpaceOnUse">
    <g transform="translate(750 290)" fill="none" stroke="#8ab6d6" strokeWidth="1.3">
     <ellipse rx="105" ry="35" transform="rotate(-28)"/><ellipse rx="105" ry="35" transform="rotate(32)"/><ellipse rx="105" ry="35" transform="rotate(90)"/>
     <circle r="5" fill="#71e4f4" stroke="none"/>
    </g>
    <g strokeWidth="2"><path stroke="#71e4f4" d="M120 710v46m10-24v24m14-60v60"/><path stroke="#b48be0" d="M165 720v36m14-24v24"/></g>
   </pattern>
  </defs><rect width="100%" height="100%" fill="url(#chemistry-orbitals)"/></svg>
 </div>;
}
