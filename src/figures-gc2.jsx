import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Dot,Box,Fig,Axis,Curve} from './figures-core.jsx';
// General Chemistry II (E1) didactic figures. Original drawings; shapes are schematic, not measured data.

// Concentration against time (top) and Q against time (bottom), stacked so both stay legible on a phone.
// Top: H2 + I2 <-> 2HI with unequal starting amounts. Bottom: three different starts of the same reaction
// at one temperature; Q = [HI]^2/([H2][I2]) of every run settles on the same K line. Illustrative shapes only.
export function EqConcTime({accent}){
  return <Fig viewBox="0 0 460 640" label="שני תרשימים. למעלה: ריכוז מול זמן בתגובה H₂ + I₂ ⇌ 2HI כש-H₂ ו-I₂ מתחילים בכמויות שונות, והקווים אינם נפגשים. למטה: מנת התגובה Q מול זמן בשלושה ניסויים עם התחלות שונות באותה טמפרטורה, וכולם מתייצבים על אותו K">
    <T x={230} y={26} size={14}>תגובה אחת: יותר H₂ מאשר I₂ בהתחלה</T>
    <Axis x1={70} y1={44} x2={380} y2={240} xLabel="זמן" yLabel="ריכוז"/>
    <Curve d="M70,76 C130,106 190,128 260,134 L380,134" stroke={accent} w={2.4}/>
    <Curve d="M70,108 C130,138 190,160 260,166 L380,166" stroke="#4ed97a" w={2.4}/>
    <Curve d="M70,238 C130,160 190,128 260,122 L380,122" stroke={C.warn} w={2.4}/>
    <L x1={260} y1={44} x2={260} y2={240} stroke={C.mut} dash="4 4"/>
    <T x={260} y={258} size={12}>שיווי משקל</T>
    <T x={388} y={138} ltr size={13} anchor="start" fill={accent}>[H₂]</T>
    <T x={388} y={170} ltr size={13} anchor="start" fill="#4ed97a">[I₂]</T>
    <T x={388} y={118} ltr size={13} anchor="start" fill={C.warn}>[HI]</T>
    <T x={230} y={316} size={14}>אותה תגובה, שלוש התחלות: Q מתכנס לאותו K</T>
    <Axis x1={70} y1={334} x2={380} y2={540} xLabel="זמן" yLabel="Q"/>
    <L x1={70} y1={440} x2={380} y2={440} stroke={C.mut} dash="5 4"/>
    <T x={376} y={428} ltr size={13} anchor="end" fill={C.mut}>K</T>
    <Curve d="M70,538 C120,500 170,460 240,444 L380,440" stroke={accent} w={2.4}/>
    <Curve d="M70,360 C120,390 170,424 240,436 L380,440" stroke={C.warn} w={2.4}/>
    <Curve d="M70,486 C120,470 170,452 240,442 L380,440" stroke="#4ed97a" w={2.4}/>
    <T x={290} y={522} size={12} fill={accent}>ניסוי 1: רק מגיבים בהתחלה</T>
    <T x={200} y={372} size={12} fill={C.warn}>ניסוי 2: בעיקר HI</T>
    <T x={290} y={478} size={12} fill="#4ed97a">ניסוי 3: תערובת</T>
    <T x={230} y={606} size={12}>הקווים נעצרים בשיווי משקל ולא בהכרח נפגשים; ריכוזי שיווי משקל שונים נותנים אותו K</T>
  </Fig>;
}

// Solid or liquid amount does not change the gas pressure at equilibrium (same T), as long as every phase is present.
export function EqFlaskPressure({accent}){
  const dots=(x0,y0)=>[[0,0],[22,10],[44,2],[10,24],[36,28],[58,16]].map(([dx,dy],i)=><Dot key={i} cx={x0+dx} cy={y0+dy} r={3.2} fill={accent} opacity={0.9}/>);
  const solids=(x,hc,ho)=><>
    <Curve d={`M${x+6},172 L${x+44},172 L${x+44},${172-hc} L${x+6},${172-hc} Z`} fill={C.soft} stroke={C.mut} w={1.5}/>
    <Curve d={`M${x+48},172 L${x+84},172 L${x+84},${172-ho} L${x+48},${172-ho} Z`} fill="#4ed97a" opacity={0.35} stroke="#4ed97a" w={1.5}/>
  </>;
  return <Fig viewBox="0 0 600 330" label="הלחץ של הגז בשיווי משקל זהה בשני כלים שבכל אחד מהם יש גם CaCO₃(s) וגם CaO(s) בכמויות שונות (משמאל), או נוזל בכמויות שונות (מימין), באותה טמפרטורה">
    <T x={150} y={26} ltr size={12}>CaCO₃(s) ⇌ CaO(s) + CO₂(g)</T>
    <Box x={50} y={44} w={90} h={130} stroke={C.line}/>
    {solids(50,12,10)}
    {dots(62,64)}
    <Box x={170} y={44} w={90} h={130} stroke={C.line}/>
    {solids(170,44,36)}
    {dots(182,64)}
    <T x={95} y={198} size={12}>כלי a: מעט</T>
    <T x={215} y={198} size={12}>כלי b: הרבה</T>
    <T x={155} y={222} size={12} fill={C.mut}>בכל כלי שני מוצקים. אפור: CaCO₃, ירוק: CaO</T>
    <T x={155} y={248} ltr size={12} fill={C.warn}>P(CO₂) זהה בשני הכלים</T>
    <T x={450} y={26} ltr size={12}>H₂O(l) ⇌ H₂O(g)</T>
    <Box x={350} y={44} w={70} h={130} stroke={C.line}/>
    <Curve d="M352,172 L418,172 L418,150 L352,150 Z" fill={C.soft} stroke={C.mut} w={1.5}/>
    {dots(358,64)}
    <Box x={460} y={44} w={70} h={130} stroke={C.line}/>
    <Curve d="M462,172 L528,172 L528,112 L462,112 Z" fill={C.soft} stroke={C.mut} w={1.5}/>
    {dots(468,64)}
    <T x={385} y={198} size={12}>מעט נוזל</T>
    <T x={495} y={198} size={12}>הרבה נוזל</T>
    <T x={440} y={248} size={12} fill={C.warn}>אותו לחץ אדים באותה טמפרטורה</T>
    <T x={300} y={300} size={12}>כל עוד כל הפאזות נוכחות, כמות המוצק או הנוזל אינה משנה את הלחץ</T>
  </Fig>;
}

// Approach to K from both sides for n-butane <-> iso-butane. K = 2.5 is an invented illustrative value, not measured.
export function EqKApproach({accent}){
  return <Fig viewBox="0 0 560 340" label="היחס [iso]/[n] מתקרב לאותו K משני הצדדים (K = 2.5 הוא ערך לדוגמה): מלמטה כשמתחילים רק מבוטאן ישר, ומלמעלה כשמתחילים בעיקר מאיזובוטאן עם מעט בוטאן ישר">
    <Axis x1={70} y1={40} x2={500} y2={240} xLabel="זמן" yLabel="[iso]/[n]"/>
    <Curve d="M70,240 C140,200 200,160 280,146 C340,141 420,140 500,140" stroke={accent} w={2.4}/>
    <Curve d="M70,52 C130,92 190,122 270,134 C330,139 420,140 500,140" stroke="#4ed97a" w={2.4}/>
    <L x1={70} y1={140} x2={500} y2={140} stroke={C.warn} dash="5 4"/>
    <T x={496} y={128} ltr anchor="end" fill={C.warn} size={12}>K = 2.5</T>
    <T x={300} y={212} size={12} fill={accent}>רק בוטאן ישר בהתחלה: היחס מתחיל ב-0 ועולה</T>
    <T x={300} y={78} size={12} fill="#4ed97a">בעיקר איזובוטאן ומעט בוטאן ישר: היחס מתחיל גבוה ויורד</T>
    <T x={280} y={296} size={12}>בשני המסלולים היחס מתייצב על אותו K, כשהטמפרטורה קבועה</T>
    <T x={280} y={320} size={12} fill={C.mut}>K = 2.5 הוא הערך הנתון בדוגמת האיזומריזציה בשיעור, לא ערך שנמדד</T>
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
