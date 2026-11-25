import {bidiElement} from './bidi-react.js';
import React,{useEffect,useRef,useState} from 'react';

// Shared animation framework. One behavior for every animated figure:
//  - the figure opens on its finished "poster" frame, so the page, print and
//    screen readers see a complete picture and nothing moves on its own;
//  - one control bar: play/pause, replay, previous/next stage, a scrubber and a
//    speed button;
//  - a frame is a pure function of time, frame(t), so scrubbing, stepping and
//    tests are deterministic;
//  - playback pauses when the figure leaves the screen or the tab is hidden;
//  - with reduced motion, play steps from stage to stage instead of animating.
export const SPEEDS=[0.5,1,2];
export const clamp01=x=>Math.max(0,Math.min(1,x));
export const lerp=(a,b,p)=>a+(b-a)*p;
// Progress of a stage that runs from t=a to t=b, eased.
export const seg=(t,a,b)=>{const p=clamp01((t-a)/(b-a));return p*p*(3-2*p)};
const EPS=0.001;

export function useReducedMotion(){
  const [r,setR]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{if(typeof matchMedia!=='function')return;const m=matchMedia('(prefers-reduced-motion: reduce)');const f=()=>setR(m.matches);m.addEventListener('change',f);return()=>m.removeEventListener('change',f)},[]);
  return r;
}

// spec: {id, duration (seconds at 1x), poster (0..1, default 1), viewBox, label,
//        stages:[{at,label}] sorted by at, first at = 0, frame(t,{accent,stage})}
export function AnimatedFigure({spec,accent}){
  const poster=spec.poster??1;
  const [t,setT]=useState(poster);const [playing,setPlaying]=useState(false);const [speed,setSpeed]=useState(1);
  const root=useRef(null);const tRef=useRef(t);const reduced=useReducedMotion();
  const stages=spec.stages;
  const stageAt=x=>{let k=0;stages.forEach((s,i)=>{if(x>=s.at-1e-9)k=i});return k};
  const ends=stages.map((s,i)=>i<stages.length-1?stages[i+1].at-EPS:1);
  const stage=stageAt(t);
  const set=x=>{const v=clamp01(x);tRef.current=v;setT(v)};
  useEffect(()=>{
    if(!playing)return;let raf,last=performance.now();
    const tick=now=>{const dt=(now-last)/1000;last=now;const next=clamp01(tRef.current+dt*speed/spec.duration);set(next);if(next>=1){setPlaying(false);return}raf=requestAnimationFrame(tick)};
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[playing,speed,spec.duration]);
  useEffect(()=>{
    const stop=()=>setPlaying(false);const el=root.current;let io;
    if(el&&typeof IntersectionObserver==='function'){io=new IntersectionObserver(es=>{if(es.some(e=>!e.isIntersecting))stop()},{threshold:0.1});io.observe(el)}
    const vis=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',vis);
    return()=>{io&&io.disconnect();document.removeEventListener('visibilitychange',vis)};
  },[]);
  const next=()=>{setPlaying(false);const e=ends.find(x=>x>tRef.current+EPS*2);set(e===undefined?1:e)};
  const prev=()=>{setPlaying(false);const e=[...ends].reverse().find(x=>x<tRef.current-EPS*2);set(e===undefined?0:e)};
  const play=()=>{
    if(reduced){if(tRef.current>=1-EPS)set(ends[0]);else next();return}
    if(playing){setPlaying(false);return}
    if(tRef.current>=1-EPS)set(0);setPlaying(true);
  };
  const replay=()=>{set(0);if(reduced){set(ends[0]);setPlaying(false)}else setPlaying(true)};
  const atEnd=t>=1-EPS,atStart=t<=EPS;
  const playLabel=reduced?'השלב הבא':playing?'עצירה':atEnd?'הפעלה מחדש':'הפעלה';
  return <div className="anim" ref={root} data-anim-id={spec.id} data-anim-t={t.toFixed(3)} data-anim-playing={playing?'1':'0'} data-anim-stage={stage}>
    <svg viewBox={spec.viewBox} role="img" aria-label={spec.label} className="fig-svg">{spec.frame(t,{accent,stage})}</svg>
    <div className="anim-controls" role="group" aria-label="בקרי ההנפשה" dir="ltr">
      <button type="button" className="anim-btn" onClick={prev} disabled={atStart} aria-label="השלב הקודם">‹</button>
      <button type="button" className="anim-btn anim-play" onClick={play} aria-label={playLabel} aria-pressed={playing}>{reduced?'›':playing?'❚❚':'▶'}</button>
      <button type="button" className="anim-btn" onClick={next} disabled={atEnd} aria-label="השלב הבא">›</button>
      <input className="anim-scrub" type="range" min="0" max="1000" step="1" value={Math.round(t*1000)} onChange={e=>{setPlaying(false);set(Number(e.target.value)/1000)}} aria-label="ציר הזמן של ההנפשה" aria-valuetext={stages[stage].label}/>
      <button type="button" className="anim-btn anim-speed" onClick={()=>setSpeed(s=>SPEEDS[(SPEEDS.indexOf(s)+1)%SPEEDS.length])} aria-label={'מהירות ההנפשה, כעת פי '+speed} disabled={reduced}>{speed}×</button>
      <button type="button" className="anim-btn" onClick={replay} aria-label="מההתחלה">↺</button>
      <span className="anim-stage" dir="rtl" aria-live={playing?'off':'polite'}>{stages[stage].label}</span>
    </div>
  </div>;
}
