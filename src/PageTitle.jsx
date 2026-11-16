import {bidiElement} from './bidi-react.js';
import React,{useEffect,useRef} from 'react';

// Compact the actual page title over the first 80px of scroll. Its reserved
// space prevents overlap, then it leaves with the page instead of staying pinned.
export function PageTitle({children,className='',...props}){
 const ref=useRef(null);
 useEffect(()=>{
  const title=ref.current;let frame;
  const update=()=>{
   frame=null;
   const font=parseFloat(getComputedStyle(title).fontSize);
   const range=80;
   const progress=Math.max(0,Math.min(1,scrollY/range));
   const minimum=Math.max(.62,24/font);
   const scale=matchMedia('(prefers-reduced-motion: reduce)').matches?1:1-(1-minimum)*progress;
   title.style.setProperty('--page-title-scale',String(scale));
   title.style.setProperty('--page-title-travel',Math.min(scrollY,80)+'px');
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
  return()=>{removeEventListener('scroll',schedule);removeEventListener('resize',schedule);cancelAnimationFrame(frame)};
 },[]);
 return <div className="page-title-frame"><h1 {...props} ref={ref} className={'page-title '+className}>{children}</h1></div>;
}
