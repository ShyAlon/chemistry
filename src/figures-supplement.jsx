import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Curve,Dot,Box,Fig} from './figures-core.jsx';
// Original teaching drawings, not copied lecture artwork. All labels >=18 SVG units.
export function LiquidVapor({accent}){return <Fig label="שיווי משקל בין נוזל לאדים בכלי סגור">
 <Box x={70} y={35} w={420} h={215} stroke={C.mut}/><Box x={72} y={160} w={416} h={88} fill={C.soft}/>
 {[100,150,205,260,315,370,425,465].map((x,i)=><Dot key={x} cx={x} cy={185+(i%2)*35} r={6} fill={accent}/>)}
 {[125,220,340,440].map((x,i)=><Dot key={x} cx={x} cy={65+(i%2)*35} r={5} fill={accent}/>)}
 <Arrow x1={250} y1={175} x2={250} y2={95} stroke={accent} id="supp-evap"/>
 <Arrow x1={305} y1={95} x2={305} y2={175} stroke={C.warn} id="supp-cond"/>
 <T x={165} y={140} size={20} fill={C.ink}>אידוי</T><T x={390} y={140} size={20} fill={C.ink}>עיבוי</T>
 <T x={280} y={286} size={20}>בשיווי משקל: קצב האידוי = קצב העיבוי</T>
 </Fig>}
export function RaoultLines({accent}){return <Fig label="לחצי אדים מחושבים לתמיסה אידיאלית: P_A=100x_A; P_B=40(1−x_A), ביחידות kPa">
 <L x1={75} y1={35} x2={75} y2={245}/><L x1={75} y1={245} x2={470} y2={245}/>
 <L x1={75} y1={245} x2={470} y2={45} stroke={accent} w={3}/><L x1={75} y1={165} x2={470} y2={245} stroke={C.warn} w={3}/>
 <L x1={75} y1={165} x2={470} y2={45} stroke="#4ed97a" w={3}/>
 <T x={37} y={35} size={18} ltr>P / kPa</T><T x={50} y={52} size={18} ltr>100</T><T x={50} y={172} size={18} ltr>40</T>
 <T x={75} y={270} size={18} ltr>0</T><T x={470} y={270} size={18} ltr>1</T><T x={270} y={280} size={20} ltr>x(A)</T>
 <T x={270} y={80} fill="#4ed97a" size={20} ltr>P(total)</T><T x={375} y={147} fill={accent} size={20} ltr>P(A)</T><T x={265} y={229} fill={C.warn} size={20} ltr>P(B)</T>
 <T x={280} y={310} size={18}>לחץ כולל = סכום הלחצים החלקיים</T>
 </Fig>}
export function OsmosisFlow({accent}){return <Fig label="ממס עובר דרך קרום בררני מהצד המדולל לצד המרוכז">
 <Box x={60} y={55} w={440} h={185} stroke={C.mut}/><Box x={62} y={140} w={216} h={98} fill={C.soft}/><Box x={282} y={100} w={216} h={138} fill={C.soft}/>
 <L x1={280} y1={55} x2={280} y2={240} stroke={C.warn} w={4} dash="5 5"/>
 {[325,370,420,465].map((x,i)=><Dot key={x} cx={x} cy={130+(i%2)*65} r={7} fill={accent}/>)}
 <T x={165} y={85} size={20}>ממס טהור</T><T x={390} y={80} size={20}>תמיסה</T>
 <Arrow x1={190} y1={185} x2={355} y2={185} stroke={accent} w={3} id="supp-osm"/>
 <T x={280} y={270} size={20}>קרום שמעביר ממס ולא מומס</T><T x={280} y={305} size={18}>לחץ נגדי על התמיסה עוצר את הזרימה נטו</T>
 </Fig>}
export function DecayMap({accent}){const rows=[['α','A − 4','Z − 2'],['β−','A','Z + 1'],['β+ / EC','A','Z − 1'],['γ','A','Z']];return <Fig label="טבלת שינוי מספר מסה ומספר אטומי בסוגי דעיכה">
 <T x={110} y={40} size={20}>דעיכה</T><T x={285} y={40} size={20}>מספר מסה</T><T x={455} y={40} size={20}>מספר אטומי</T>
 {rows.map((r,i)=><g key={i}><L x1={40} y1={60+i*56} x2={520} y2={60+i*56}/>{r.map((s,j)=><T key={j} x={[110,285,455][j]} y={96+i*56} ltr size={22} fill={j===0?accent:C.ink}>{s}</T>)}</g>)}
 <T x={280} y={310} size={18}>גמא מורידה אנרגיה; לכידת אלקטרון מורידה מטען</T>
 </Fig>}
export function HalfLifeCurve({accent}){const points=Array.from({length:101},(_,i)=>`${i===0?'M':'L'}${80+3.6*i},${245-190*Math.pow(.5,i/25)}`).join(' ');return <Fig label="עקומה מחושבת N/N0=2 בחזקת מינוס t חלקי זמן מחצית החיים">
 <L x1={80} y1={40} x2={80} y2={245}/><L x1={80} y1={245} x2={460} y2={245}/><Curve d={points} stroke={accent} w={3}/>
 {[0,1,2,3,4].map(n=><g key={n}><Dot cx={80+90*n} cy={245-190*Math.pow(.5,n)} fill={accent}/><T x={80+90*n} y={271} size={18} ltr>{n}</T></g>)}
 <T x={45} y={55} size={18} ltr>1</T><T x={42} y={155} size={18} ltr>0.5</T><T x={42} y={205} size={18} ltr>0.25</T>
 <T x={130} y={25} size={18} ltr>N / N₀</T><T x={300} y={307} size={20} ltr>t / t½</T>
 </Fig>}
