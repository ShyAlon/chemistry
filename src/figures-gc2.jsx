import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Dot,Box,Fig,Axis,Curve} from './figures-core.jsx';
// General Chemistry II (E1) didactic figures. Original drawings; shapes are schematic, not measured data.

// Concentration against time: unequal starting amounts never have to meet, and three different starts
// settle on different plateaus that share one K.
export function EqConcTime({accent}){
  return <Fig viewBox="0 0 600 310" label="ריכוז מול זמן עד שיווי משקל: משמאל תגובה אחת שבה H₂ ו-I₂ מתחילים בכמויות שונות ואינם נפגשים, מימין שלושה ניסויים עם התחלות שונות שמגיעים לרמות שונות">
    <T x={140} y={26} size={12}>תגובה אחת: יותר H₂ מאשר I₂ בהתחלה</T>
    <Axis x1={40} y1={44} x2={230} y2={230} xLabel="זמן"/>
    <Curve d="M40,70 C80,98 120,120 165,125 L230,125" stroke={accent} w={2.2}/>
    <Curve d="M40,100 C80,128 120,150 165,155 L230,155" stroke="#4ed97a" w={2.2}/>
    <Curve d="M40,228 C80,150 120,125 165,120 L230,120" stroke={C.warn} w={2.2}/>
    <L x1={165} y1={44} x2={165} y2={230} stroke={C.mut} dash="4 4"/>
    <T x={165} y={248} size={11}>שיווי משקל</T>
    <T x={238} y={131} ltr size={12} anchor="start" fill={accent}>[H₂]</T>
    <T x={238} y={160} ltr size={12} anchor="start" fill="#4ed97a">[I₂]</T>
    <T x={238} y={113} ltr size={12} anchor="start" fill={C.warn}>[HI]</T>
    <T x={430} y={26} size={12}>אותה תגובה, שלוש התחלות</T>
    <Axis x1={330} y1={44} x2={520} y2={230} xLabel="זמן"/>
    <Curve d="M330,228 C370,200 400,172 435,166 L520,166" stroke={accent} w={2.2}/>
    <Curve d="M330,150 C370,142 400,134 435,131 L520,131" stroke="#4ed97a" w={2.2}/>
    <Curve d="M330,64 C370,90 400,108 435,112 L520,112" stroke={C.warn} w={2.2}/>
    <L x1={435} y1={44} x2={435} y2={230} stroke={C.mut} dash="4 4"/>
    <T x={564} y={170} size={12} anchor="middle" fill={accent}>ניסוי 1</T>
    <T x={564} y={135} size={12} anchor="middle" fill="#4ed97a">ניסוי 3</T>
    <T x={564} y={116} size={12} anchor="middle" fill={C.warn}>ניסוי 2</T>
    <T x={300} y={292} size={12}>הקווים נעצרים בשיווי משקל ולא בהכרח נפגשים; רמות שונות יכולות לתת אותו K</T>
  </Fig>;
}

// Solid or liquid amount does not change the gas pressure at equilibrium (same T).
export function EqFlaskPressure({accent}){
  const dots=(x0,y0)=>[[0,0],[22,10],[44,2],[10,24],[36,28],[58,16]].map(([dx,dy],i)=><Dot key={i} cx={x0+dx} cy={y0+dy} r={3.2} fill={accent} opacity={0.9}/>);
  return <Fig viewBox="0 0 600 300" label="הלחץ של הגז בשיווי משקל זהה בשני כלים שבהם כמות המוצק (משמאל) או הנוזל (מימין) שונה, באותה טמפרטורה">
    <T x={150} y={26} ltr size={12}>CaCO₃(s) ⇌ CaO(s) + CO₂(g)</T>
    <Box x={50} y={44} w={90} h={130} stroke={C.line}/>
    <Curve d="M58,172 L132,172 L124,160 L66,160 Z" fill={C.soft} stroke={C.mut} w={1.5}/>
    {dots(62,64)}
    <Box x={170} y={44} w={90} h={130} stroke={C.line}/>
    <Curve d="M178,172 L252,172 L244,126 L186,126 Z" fill={C.soft} stroke={C.mut} w={1.5}/>
    {dots(182,64)}
    <T x={95} y={198} size={12}>כלי a: מעט מוצק</T>
    <T x={215} y={198} size={12}>כלי b: הרבה מוצק</T>
    <T x={155} y={226} ltr size={12} fill={C.warn}>P(CO₂) זהה בשני הכלים</T>
    <T x={450} y={26} ltr size={12}>H₂O(l) ⇌ H₂O(g)</T>
    <Box x={350} y={44} w={70} h={130} stroke={C.line}/>
    <Curve d="M352,172 L418,172 L418,150 L352,150 Z" fill={C.soft} stroke={C.mut} w={1.5}/>
    {dots(358,64)}
    <Box x={460} y={44} w={70} h={130} stroke={C.line}/>
    <Curve d="M462,172 L528,172 L528,112 L462,112 Z" fill={C.soft} stroke={C.mut} w={1.5}/>
    {dots(468,64)}
    <T x={385} y={198} size={12}>מעט נוזל</T>
    <T x={495} y={198} size={12}>הרבה נוזל</T>
    <T x={440} y={226} size={12} fill={C.warn}>אותו לחץ אדים באותה טמפרטורה</T>
    <T x={300} y={282} size={12}>מוצק או נוזל טהור אינם מופיעים בביטוי של K, כי כמותם אינה משנה את הלחץ</T>
  </Fig>;
}

// Approach to K from both sides for n-butane <-> iso-butane (K = 2.5 is a given illustrative value).
export function EqKApproach({accent}){
  return <Fig viewBox="0 0 560 320" label="היחס [iso]/[n] מתקרב ל-K = 2.5 משני הצדדים: מלמטה כשמתחילים רק מבוטאן ישר ומלמעלה כשמתחילים רק מאיזובוטאן">
    <Axis x1={70} y1={40} x2={500} y2={240} xLabel="זמן" yLabel="[iso]/[n]"/>
    <Curve d="M70,240 C140,200 200,160 280,146 C340,141 420,140 500,140" stroke={accent} w={2.4}/>
    <Curve d="M70,52 C130,92 190,122 270,134 C330,139 420,140 500,140" stroke="#4ed97a" w={2.4}/>
    <L x1={70} y1={140} x2={500} y2={140} stroke={C.warn} dash="5 4"/>
    <T x={496} y={128} ltr anchor="end" fill={C.warn} size={12}>K = 2.5</T>
    <T x={300} y={206} size={12} fill={accent}>מתחילים רק מבוטאן ישר: היחס עולה</T>
    <T x={300} y={78} size={12} fill="#4ed97a">מתחילים רק מאיזובוטאן: היחס יורד</T>
    <T x={280} y={302} size={12}>בשני המסלולים היחס מתייצב על אותו K, כשהטמפרטורה קבועה</T>
  </Fig>;
}

// Reaction quotient against K: the direction of net change from Q = 0 to Q = infinity.
export function EqQStrip({accent}){
  return <Fig viewBox="0 0 560 260" label="ציר של מנת התגובה Q: משמאל Q קטן מ-K והתגובה מתקדמת קדימה, באמצע Q שווה ל-K ושיווי משקל, מימין Q גדול מ-K והתגובה מתקדמת אחורה">
    <L x1={60} y1={150} x2={500} y2={150} stroke={C.line} w={2.4}/>
    <Dot cx={60} cy={150} r={5} fill={accent}/>
    <Dot cx={280} cy={150} r={6} fill={C.warn}/>
    <Dot cx={500} cy={150} r={5} fill={accent}/>
    <Arrow x1={110} y1={112} x2={250} y2={112} stroke={accent}/>
    <Arrow x1={450} y1={112} x2={310} y2={112} stroke="#4ed97a"/>
    <T x={180} y={96} size={12} fill={accent}>Q קטן מ-K: התגובה מתקדמת קדימה</T>
    <T x={380} y={96} size={12} fill="#4ed97a">Q גדול מ-K: התגובה מתקדמת אחורה</T>
    <T x={60} y={178} ltr size={12}>Q = 0</T>
    <T x={280} y={178} ltr size={12} fill={C.warn}>Q = K</T>
    <T x={500} y={178} ltr size={12}>Q → ∞</T>
    <T x={60} y={198} size={12}>רק מגיבים</T>
    <T x={280} y={198} size={12} fill={C.warn}>שיווי משקל</T>
    <T x={500} y={198} size={12}>רק תוצרים</T>
    <T x={280} y={238} size={12}>הכיוון תמיד לכיוון Q = K, ושם אין שינוי נטו</T>
  </Fig>;
}
