import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Curve,Dot,Fig} from './figures-core.jsx';
// Original drawings. Maxwell density is calculated, other diagrams are labeled sketches.
export function MaxwellSpeedBand({accent}){
 const R=8.314462618,M=.028,temp=300;
 const f=v=>4*Math.PI*(M/(2*Math.PI*R*temp))**1.5*v*v*Math.exp(-M*v*v/(2*R*temp));
 const x=v=>70+v*.4,y=v=>245-f(v)*85000;
 const curve=Array.from({length:241},(_,i)=>`${i?'L':'M'}${x(i*5)},${y(i*5)}`).join(' ');
 const band=`M${x(400)},245 `+Array.from({length:21},(_,i)=>`L${x(400+i)},${y(400+i)}`).join(' ')+` L${x(420)},245 Z`;
 const speeds=[Math.sqrt(2*R*temp/M),Math.sqrt(8*R*temp/(Math.PI*M)),Math.sqrt(3*R*temp/M)];
 return <Fig label="Calculated Maxwell speed density for nitrogen at 300 K. Shaded area:400-420 m/s. Most probable422, mean476, RMS517 m/s.">
 <L x1={70} y1={40} x2={70} y2={245}/><L x1={70} y1={245} x2={550} y2={245}/>
 <Curve d={band} stroke="none" fill={C.warn} opacity={.65}/><Curve d={curve} stroke={accent} w={3}/>
 {speeds.map((v,i)=><g key={i}><L x1={x(v)} y1={y(v)} x2={x(v)} y2={245} dash="4 4" stroke={[C.warn,accent,C.ink][i]}/><T x={[135,315,470][i]} y={34} size={18} ltr fill={[C.warn,accent,C.ink][i]}>{['mp:422','avg:476','rms:517'][i]}</T></g>)}
 {[0,400,800,1200].map(v=><T key={v} x={x(v)} y={271} size={18} ltr anchor={v===1200?'end':'middle'}>{v}</T>)}
 <T x={155} y={68} size={18} ltr>f(v) / (s/m)</T><T x={38} y={166} size={18} ltr>0.001</T><T x={38} y={81} size={18} ltr>0.002</T>
 <T x={420} y={305} size={20} ltr>v / (m/s)</T><T x={175} y={305} size={18} ltr>400-420 m/s</T>
 </Fig>;
}
export function EffusionQuantities({accent}){return <Fig label="At fixed source pressure and temperature: molar flow is proportional to P divided by square root of M; mass flow is proportional to P times square root of M.">
 <T x={280} y={38} size={22}>אותו נקב, אותה טמפרטורה ולחץ</T>
 <L x1={280} y1={60} x2={280} y2={255}/>
 <T x={145} y={85} size={20}>קצב מולי</T><T x={415} y={85} size={20}>קצב מסה</T>
 <T x={145} y={132} size={24} fill={accent} ltr>r ∝ 1/√M</T><T x={415} y={132} size={24} fill={accent} ltr>ṁ ∝ √M</T>
 <T x={145} y={180} size={20}>יותר מולים מהגז הקל</T><T x={415} y={180} size={20}>יותר גרמים מהגז הכבד</T>
 <T x={145} y={230} size={20} ltr>mol/s</T><T x={415} y={230} size={20} ltr>g/s</T>
 <T x={280} y={295} size={20}>זמן = כמות מבוקשת / קצב באותה יחידה</T>
 </Fig>}
export function HydrationOrientation({accent}){
 const water=(cx,cy,angle,key)=>{
  // local oxygen points towards center at x=0, positive H atoms point away.
  return <g key={key} transform={`translate(${cx} ${cy}) rotate(${angle})`}>
   <L x1={0} y1={0} x2={26} y2={-17}/><L x1={0} y1={0} x2={26} y2={17}/>
   <Dot cx={0} cy={0} r={15} fill={C.soft} stroke={accent}/><g transform={`rotate(${-angle})`}><T x={0} y={6} size={18} fill={C.ink} ltr>O</T></g>
   {[-17,17].map(y=><g key={y}><Dot cx={26} cy={y} r={10} fill={C.faint} stroke={C.mut}/><g transform={`translate(26 ${y}) rotate(${-angle})`}><T x={0} y={6} size={18} ltr>H</T></g></g>)}
  </g>
 };
 return <Fig label="Schematic planar hydration: oxygen ends point toward positive ions; hydrogen ends point toward negative ions. Not a coordination-number model.">
 <T x={140} y={34} size={22}>קטיון</T><T x={420} y={34} size={22}>אניון</T>
 {[140,420].map((cx,i)=><g key={cx}><Dot cx={cx} cy={157} r={28} fill={C.soft} stroke={accent}/><T x={cx} y={165} size={26} ltr fill={C.ink}>{i?'−':'+'}</T>
 {[0,90,180,270].map(a=>{const r=a*Math.PI/180;return water(cx+Math.cos(r)*(i?110:70),157+Math.sin(r)*(i?85:70),a+(i?180:0),a)})}
 </g>)}
 <T x={280} y={285} size={20} ltr>O:δ− ; H:δ+</T><T x={280} y={314} size={18}>הכיוון הוא העיקר; מספר המים להמחשה בלבד</T>
 </Fig>
}
