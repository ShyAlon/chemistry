import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Dot} from './figures-core.jsx';
import {seg,lerp,clamp01} from './anim-core.jsx';

// Animated versions of existing figures, keyed by the same figure id the
// lessons already use, so no lesson text changes when a figure gains motion.
// Every frame at the poster time (t = 1) is a finished picture of the idea.

// SS6: absorb 2 eV, shed 0.3 eV as heat, optionally emit 1.7 eV (Eg = 1.7 eV).
const Y=e=>200-e*60;
const fillc='#2d4a6b';
function exciteFrame(t){
  const p1=seg(t,0,0.33),p2=seg(t,0.34,0.66),p3=seg(t,0.67,1);
  const row=i=>t>=1-1e-9?1:(i===0?(t<0.34?1:0.4):i===1?(t>=0.34&&t<0.67?1:0.4):(t>=0.67?1:0.4));
  const y0=Y(0)-2,y2=Y(2.0),y17=Y(1.7);
  // electron: rises in stage 1, slides down in stage 2, falls into the hole in stage 3
  const ex=t<0.34?90:t<0.67?lerp(90,150,p2):lerp(150,210,p3);
  const ey=t<0.34?lerp(y0,y2,p1):t<0.67?lerp(y2,y17,p2):lerp(y17,Y(0)+2,p3);
  const wave=[];for(let i=0;i<=24;i++){const x=230+i*(62/24)*p3;wave.push(`${x.toFixed(1)},${(Y(1.2)+Math.sin(i*1.3)*5*p3).toFixed(1)}`)}
  return <>
    <rect x={50} y={Y(2.7)} width={200} height={Y(1.7)-Y(2.7)} fill="none" stroke={C.mut} strokeWidth={1.6}/>
    <rect x={50} y={Y(0)} width={200} height={40} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
    <T x={70} y={Y(2.7)+16} size={12} anchor="start" ltr fill={C.ink}>CB</T><T x={70} y={Y(0)+26} size={12} anchor="start" ltr fill={C.ink}>VB</T>
    <L x1={250} y1={Y(1.7)} x2={286} y2={Y(1.7)} stroke={C.soft} dash="3 3"/>
    {p1>0.04&&<Arrow x1={90} y1={y0} x2={90} y2={lerp(y0,y2,p1)} stroke="#a58bf0" id="ere1"/>}
    {p2>0.04&&<Arrow x1={150} y1={y2} x2={150} y2={lerp(y2,y17+3,p2)} stroke="#f09797" dash="4 3" id="ere2"/>}
    {p3>0.04&&<Arrow x1={210} y1={y17} x2={210} y2={lerp(y17,Y(0)+3,p3)} stroke="#7aa7f0" id="ere3"/>}
    {p3>0.04&&<polyline points={wave.join(' ')} fill="none" stroke="#7aa7f0" strokeWidth={2}/>}
    <Dot cx={ex} cy={ey} r={5} fill={t<0.34?'#a58bf0':t<0.67?'#f09797':'#7aa7f0'}/>
    {p1>0.5&&<T x={100} y={Y(1.0)} size={13} anchor="start" ltr fill="#a58bf0">1</T>}
    {p2>0.5&&<T x={160} y={Y(1.85)} size={13} anchor="start" ltr fill="#f09797">2</T>}
    {p3>0.5&&<T x={220} y={Y(0.9)} size={13} anchor="start" ltr fill="#7aa7f0">3</T>}
    <g opacity={row(0)}><T x={298} y={36} size={12} anchor="start" fill={C.ink}>בליעה של פוטון</T><T x={540} y={36} size={12} anchor="end" ltr fill="#a58bf0">2 eV</T></g>
    <g opacity={row(1)}><T x={298} y={76} size={12} anchor="start" fill={C.ink}>רגיעה תרמית, חום</T><T x={540} y={76} size={12} anchor="end" ltr fill="#f09797">0.3 eV</T></g>
    <g opacity={row(2)}><T x={298} y={116} size={12} anchor="start" fill={C.ink}>פליטה, אם מתרחשת</T><T x={540} y={116} size={12} anchor="end" ltr fill="#7aa7f0">1.7 eV</T></g>
    <T x={298} y={160} size={12} anchor="start" ltr fill={C.mut}>Eg = 1.7 eV</T>
    <T x={298} y={180} size={11} anchor="start" fill={C.mut}>הפוטון הנפלט ארוך גל יותר מהנבלע</T>
  </>;
}

export const animations={
  'excite-relax-emit':{
    id:'excite-relax-emit',duration:9,viewBox:'0 -10 560 250',
    label:'הנפשה של דוגמת הקורס עם פער 1.7 eV: אלקטרון בולע פוטון של 2 eV ועולה, מאבד 0.3 eV כחום, ואז יכול לפלוט פוטון של 1.7 eV',
    stages:[{at:0,label:'1. בליעה של פוטון'},{at:0.34,label:'2. רגיעה תרמית'},{at:0.67,label:'3. פליטה, אם מתרחשת'}],
    frame:t=>exciteFrame(t)
  }
};
