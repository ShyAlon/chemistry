import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Curve,Fig} from './figures-core.jsx';
// Calculated van der Waals curves, not a trace of course artwork or measured data.
export function RealGasBoyle({accent}){
 const a=3.592,b=.04267,R=.08206,TB=a/(R*b);
 const x=c=>80+100*c,y=z=>245-(z-.65)*220;
 const series=[{temp:320,color:C.warn,label:'320 K'},{temp:TB,color:accent,label:'T_B ≈ 1026 K'},{temp:1400,color:C.ink,label:'1400 K'}];
 return <Fig label="Calculated van der Waals model: Z versus molar density 0 to 4 mol/L, at 320 K, Boyle temperature about 1026 K, and 1400 K. Not measured data.">
 <T x={280} y={28} size={22}>התיקונים מתחרים; הביטול אינו מוחלט</T>
 <T x={57} y={70} size={20} ltr>Z</T>
 {[.75,1,1.25].map(z=><g key={z}><L x1={80} y1={y(z)} x2={480} y2={y(z)} dash={z===1?'5 4':'2 6'}/><T x={64} y={y(z)+6} size={18} ltr anchor="end">{z.toFixed(2)}</T></g>)}
 <L x1={80} y1={80} x2={80} y2={245}/><L x1={80} y1={245} x2={480} y2={245}/>
 {[0,1,2,3,4].map(c=><T key={c} x={x(c)} y={266} size={18} ltr>{c}</T>)}
 {series.map(s=><Curve key={s.temp} d={Array.from({length:161},(_,i)=>{const c=i/40;const z=1/(1-b*c)-a*c/(R*s.temp);return `${i?'L':'M'}${x(c)},${y(z)}`}).join(' ')} stroke={s.color} w={2.6}/>)}
 {series.map((s,i)=><T key={s.temp} x={[135,305,465][i]} y={65} size={18} ltr fill={s.color}>{s.label}</T>)}
 <T x={280} y={300} size={20} ltr>c = n/V (mol/L)</T>
 </Fig>;
}
