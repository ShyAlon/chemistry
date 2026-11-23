import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Axis,Curve,Dot,Box,Fig} from './figures-core.jsx';

// G1: classification of matter tree.
export function MatterTree({accent}){
  return <Fig label="עץ סיווג החומר: תערובות מול חומרים טהורים, יסודות מול תרכובות">
    <Box x={235} y={40} w={90} h={30} fill={C.faint} stroke={accent}/>
    <T x={280} y={60} fill={C.ink} weight="bold">חומר</T>
    <Arrow x1={255} y1={72} x2={160} y2={106} stroke={C.dim} id="mt1"/>
    <Arrow x1={305} y1={72} x2={400} y2={106} stroke={C.dim} id="mt2"/>
    <Box x={55} y={110} w={210} h={30} fill={C.faint}/>
    <T x={160} y={130}>תערובת (ניתנת להפרדה פיזיקלית)</T>
    <Box x={295} y={110} w={210} h={30} fill={C.faint}/>
    <T x={400} y={130}>חומר טהור</T>
    <Arrow x1={120} y1={142} x2={73} y2={176} stroke={C.dim} id="mt3"/>
    <Arrow x1={200} y1={142} x2={211} y2={176} stroke={C.dim} id="mt4"/>
    <Box x={8} y={180} w={130} h={30} fill="none"/>
    <T x={73} y={200} size={12}>הומוגנית (תמיסה)</T>
    <Box x={146} y={180} w={130} h={30} fill="none"/>
    <T x={211} y={200} size={12}>הטרוגנית</T>
    <Arrow x1={360} y1={142} x2={349} y2={176} stroke={C.dim} id="mt5"/>
    <Arrow x1={440} y1={142} x2={487} y2={176} stroke={C.dim} id="mt6"/>
    <Box x={284} y={180} w={130} h={30} fill="none" stroke={accent}/>
    <T x={349} y={200} size={12} fill={accent}>יסוד (סוג אטום אחד)</T>
    <Box x={422} y={180} w={130} h={30} fill="none" stroke={accent}/>
    <T x={487} y={200} size={12} fill={accent}>תרכובת</T>
    <T x={280} y={252} size={12}>תרכובת מתפרקת רק בדרך כימית; תערובת — גם פיזיקלית (ניקוי, זיקוק)</T>
    <T x={280} y={278} size={12} ltr>דוגמה: מי מלח = תערובת הומוגנית · מים = תרכובת · חמצן O₂ = יסוד</T>
  </Fig>;
}

// G1: density = mass per volume.
export function DensityCubes({accent}){
  return <Fig label="צפיפות: אותו נפח, מסה שונה — צפיפות שונה">
    <Box x={90} y={110} w={90} h={90} fill={C.faint} stroke={C.line} rx={2}/>
    <T x={135} y={150} ltr size={12}>1 cm³</T>
    <T x={135} y={168} ltr size={12}>2.7 g (Al)</T>
    <Box x={340} y={110} w={90} h={90} fill={accent} stroke={accent} rx={2} opacity=".5"/>
    <T x={385} y={150} ltr size={12}>1 cm³</T>
    <T x={385} y={168} ltr size={12}>19.3 g (Au)</T>
    <T x={280} y={250} ltr fill={C.ink} size={14}>d = m / V</T>
    <T x={280} y={278}>צפיפות היא תכונה אינטנסיבית: לא תלויה בכמות, ולכן מזהה חומר</T>
  </Fig>;
}

// G2: the mole bridge between mass, moles and particles.
export function MoleBridge({accent}){
  return <Fig label="גשר המול: מסה, מספר מולים ומספר חלקיקים מחוברים דרך המסה המולרית ומספר אבוגדרו">
    <Box x={40} y={120} w={130} h={46} fill={C.faint} stroke={C.line}/>
    <T x={105} y={140} fill={C.ink}>מסה (גרם)</T>
    <T x={105} y={158} ltr size={12}>m</T>
    <Box x={215} y={120} w={130} h={46} fill={accent} opacity=".3" stroke={accent}/>
    <T x={280} y={140} fill={C.ink} weight="bold">מול (mol)</T>
    <T x={280} y={158} ltr size={12}>n</T>
    <Box x={390} y={120} w={130} h={46} fill={C.faint} stroke={C.line}/>
    <T x={455} y={140} fill={C.ink}>חלקיקים</T>
    <T x={455} y={158} ltr size={12}>N</T>
    <Arrow x1={170} y1={132} x2={215} y2={132} stroke={accent} id="mb1"/>
    <Arrow x1={215} y1={156} x2={170} y2={156} stroke={C.dim} id="mb2"/>
    <T x={192} y={120} size={12} ltr>÷ M</T>
    <T x={192} y={176} size={12} ltr>× M</T>
    <Arrow x1={345} y1={132} x2={390} y2={132} stroke={accent} id="mb3"/>
    <Arrow x1={390} y1={156} x2={345} y2={156} stroke={C.dim} id="mb4"/>
    <T x={367} y={120} size={12} ltr>× Nₐ</T>
    <T x={367} y={176} size={12} ltr>÷ Nₐ</T>
    <T x={280} y={230} ltr size={12}>M = מסה מולרית (g/mol) מהטבלה המחזורית</T>
    <T x={280} y={252} ltr size={12}>Nₐ = 6.022×10²³ חלקיקים למול</T>
    <T x={280} y={286}>כמעט כל חישוב בקורס עובר דרך הגשר הזה</T>
  </Fig>;
}

// G3: empirical formula from percent composition, as a flowchart.
export function EmpiricalFlow({accent}){
  const step=(y,he,en)=>{
    return <g>
      <Box x={90} y={y} w={380} h={40} fill={C.faint} rx={8}/>
      <T x={280} y={y+19} fill={C.ink} size={13}>{he}</T>
      {en&&<T x={280} y={y+34} ltr size={12}>{en}</T>}
    </g>;
  };
  return <Fig label="תרשים זרימה למציאת נוסחה אמפירית מאחוזי מסה">
    {step(40,'מניחים 100 גרם — האחוזים הופכים לגרמים','40% C ← 40 g')}
    <Arrow x1={280} y1={82} x2={280} y2={102} stroke={accent} id="ef1"/>
    {step(106,'מחלקים כל יסוד במסה המולרית שלו','40/12.01 = 3.33 mol')}
    <Arrow x1={280} y1={148} x2={280} y2={168} stroke={accent} id="ef2"/>
    {step(172,'מחלקים הכול בערך הקטן ביותר','3.33/3.33 : 6.6/3.33 : 3.33/3.33')}
    <Arrow x1={280} y1={214} x2={280} y2={234} stroke={accent} id="ef3"/>
    {step(238,'אם לא שלמים — מכפילים במכנה משותף','1 : 2 : 1  ←  CH₂O')}
  </Fig>;
}

// G4: the stoichiometry map.
export function StoichMap({accent}){
  return <Fig viewBox="0 0 560 250" label="מפת הסטויכיומטריה: מגרמי מגיב לגרמי תוצר דרך המולים ויחס המקדמים">
    <Box x={30} y={70} w={110} h={44} fill={C.faint}/>
    <T x={85} y={89} fill={C.ink} size={13}>גרם A (נתון)</T>
    <T x={85} y={106} ltr size={12}>m(A)</T>
    <Arrow x1={142} y1={92} x2={182} y2={92} stroke={accent} id="sm1"/>
    <T x={162} y={60} size={12} ltr>÷ M(A)</T>
    <Box x={185} y={70} w={100} h={44} fill={C.faint}/>
    <T x={235} y={89} fill={C.ink} size={13}>מול A</T>
    <T x={235} y={106} ltr size={12}>n(A)</T>
    <Arrow x1={287} y1={92} x2={327} y2={92} stroke={accent} id="sm2"/>
    <T x={307} y={60} size={12}>יחס מקדמים</T>
    <Box x={330} y={70} w={100} h={44} fill={accent} opacity=".3" stroke={accent}/>
    <T x={380} y={89} fill={C.ink} size={13}>מול B</T>
    <T x={380} y={106} ltr size={12}>n(B)</T>
    <Arrow x1={432} y1={92} x2={472} y2={92} stroke={accent} id="sm3"/>
    <T x={452} y={60} size={12} ltr>× M(B)</T>
    <Box x={475} y={70} w={70} h={44} fill={C.faint}/>
    <T x={510} y={89} fill={C.ink} size={13}>גרם B</T>
    <T x={510} y={106} ltr size={12}>m(B)</T>
    <T x={280} y={160}>המקדמים במשוואה המאוזנת הם היחס בין המולים — לא בין הגרמים</T>
    <T x={280} y={184} size={12}>דוגמה: כל 2 מול H₂ נותנים 2 מול H₂O</T>
    <T x={280} y={208} ltr size={13} fill={C.ink}>2H₂ + O₂ → 2H₂O</T>
    <T x={280} y={232} size={12}>מאזנים תמיד קודם; רק אחרי איזון היחסים נכונים</T>
  </Fig>;
}

// G5: limiting reagent sandwich analogy and decision table.
export function Limiting({accent}){
  return <Fig label="מגיב מגביל: חמש פרוסות לחם ושתי פרוסות גבינה מספיקות רק לשני כריכים">
    {[0,1,2,3,4].map(i=><Box key={i} x={40+i*26} y={70} w={22} h={16} fill="#d8b26a" opacity=".8" rx={3}/>)}
    <T x={110} y={104} size={12}>5 לחם</T>
    {[0,1].map(i=><Box key={i} x={200+i*26} y={70} w={22} h={16} fill={accent} opacity=".8" rx={3}/>)}
    <T x={220} y={104} size={12}>2 גבינה</T>
    <Arrow x1={260} y1={80} x2={310} y2={80} stroke={C.dim} id="lm1"/>
    {[0,1].map(i=><g key={i}><Box x={320+i*34} y={64} w={30} h={12} fill="#d8b26a" rx={3}/><Box x={320+i*34} y={76} w={30} h={8} fill={accent} rx={2}/><Box x={320+i*34} y={84} w={30} h={12} fill="#d8b26a" rx={3}/></g>)}
    <T x={355} y={120} size={12}>2 כריכים</T>
    <Box x={420} y={56} w={110} h={56} fill="none" stroke={C.warn}/>
    <T x={475} y={80} size={12} fill={C.warn}>נשאר עודף:</T>
    <T x={475} y={98} size={12}>1 לחם</T>
    <T x={280} y={165}>הגבינה "נגמרת ראשונה" — היא המגיב המגביל, והיא קובעת את כמות התוצר</T>
    <Box x={90} y={190} w={380} h={80} fill={C.faint} rx={8}/>
    <T x={280} y={212} fill={C.ink} weight="bold" size={13}>השיטה במספרים</T>
    <T x={280} y={234} size={12}>מחשבים כמה מול תוצר יכול לצאת מכל מגיב בנפרד</T>
    <T x={280} y={254} size={12}>מי שנותן פחות — הוא המגביל; לפיו מחשבים הכול</T>
  </Fig>;
}

// G6: dilution M1V1 = M2V2.
export function Dilution({accent}){
  return <Fig label="מיהול: מספר המולים של המומס נשמר; רק הנפח גדל">
    <Box x={80} y={90} w={90} h={130} fill="none" rx={4}/>
    {[0,1,2,3,4,5].map(i=><Dot key={i} cx={100+(i%3)*26} cy={120+Math.floor(i/3)*40} r={6} fill={accent}/>)}
    <T x={125} y={245} ltr size={12}>M₁ V₁</T>
    <T x={125} y={70} size={12}>תמיסה מרוכזת</T>
    <Arrow x1={190} y1={155} x2={250} y2={155} stroke={C.dim} id="dl"/>
    <T x={220} y={140} size={12}>+ מים</T>
    <Box x={270} y={60} w={180} h={160} fill="none" rx={4}/>
    {[0,1,2,3,4,5].map(i=><Dot key={i} cx={300+(i%3)*60} cy={95+Math.floor(i/3)*70} r={6} fill={accent}/>)}
    <T x={360} y={245} ltr size={12}>M₂ V₂</T>
    <T x={360} y={44} size={12}>תמיסה ממהולת</T>
    <T x={280} y={290} ltr fill={C.ink} size={14}>M₁V₁ = M₂V₂</T>
  </Fig>;
}

// G7: net ionic - precipitation of AgCl.
export function NetIonic({accent}){
  return <Fig label="שיקוע: יוני כסף וכלוריד נפגשים ויוצרים משקע; יוני הצופים נשארים בתמיסה">
    <Dot cx={80} cy={90} r={9} fill={accent}/><T x={80} y={72} ltr size={12}>Ag⁺</T>
    <Dot cx={150} cy={130} r={9} fill="#4ed97a"/><T x={150} y={112} ltr size={12}>Cl⁻</T>
    <Dot cx={90} cy={170} r={7} fill={C.dim}/><T x={90} y={194} ltr size={12}>Na⁺</T>
    <Dot cx={170} cy={70} r={7} fill={C.dim}/><T x={170} y={52} ltr size={12}>NO₃⁻</T>
    <T x={120} y={230}>לפני: כל היונים חופשיים</T>
    <Arrow x1={215} y1={120} x2={265} y2={120} stroke={C.dim} id="ni"/>
    <Box x={280} y={60} w={120} h={120} fill="none"/>
    <Dot cx={330} cy={120} r={9} fill={accent}/>
    <Dot cx={346} cy={128} r={9} fill="#4ed97a"/>
    <T x={340} y={165} ltr size={12}>AgCl(s)</T>
    <Dot cx={295} cy={85} r={7} fill={C.dim}/><Dot cx={375} cy={95} r={7} fill={C.dim}/>
    <T x={340} y={230}>אחרי: משקע + יוני צופים</T>
    <T x={280} y={272} ltr fill={C.ink}>Ag⁺(aq) + Cl⁻(aq) → AgCl(s)</T>
    <T x={280} y={296} size={12}>משוואה יונית נטו: רק מי שבאמת משתנה</T>
  </Fig>;
}

// G8: titration curve of strong acid with strong base.
export function TitrationCurve({accent}){
  return <Fig label="עקומת טיטרציה של חומצה חזקה בבסיס חזק; קפיצת ה-pH סביב נקודת השקילות">
    <Axis x1={70} y1={40} x2={460} y2={250} xLabel="נפח בסיס שנוסף" yLabel="pH"/>
    <Curve d="M70,235 C160,230 200,222 232,210 C244,200 246,150 250,110 C254,75 300,55 460,50" stroke={accent} w={2.4}/>
    <L x1={247} y1={250} x2={247} y2={45} stroke={C.warn} dash="4 4"/>
    <Dot cx={247} cy={132} r={5} fill={C.warn}/>
    <T x={247} y={272} fill={C.warn} size={12}>נקודת שקילות</T>
    <T x={340} y={150} size={12}>הקפיצה התלולה: שם</T>
    <T x={340} y={168} size={12}>האינדיקטור מחליף צבע</T>
    <T x={280} y={305} ltr size={12}>n(H⁺) = n(OH⁻) ← C₁V₁ = C₂V₂ (חומצה חד־פרוטית מול בסיס חד־הידרוקסי)</T>
  </Fig>;
}

// G9: the three gas-law relationships.
export function GasLaws({accent}){
  return <Fig label="שלושת חוקי הגזים: בויל, שארל וגיי-לוסאק כגרפים">
    <T x={120} y={46} ltr fill={C.ink}>Boyle: P·V</T>
    <Axis x1={45} y1={60} x2={195} y2={170}/>
    <Curve d="M55,80 C90,120 130,150 190,162" stroke={accent}/>
    <T x={120} y={192} ltr size={12}>P vs V</T>
    <T x={120} y={206} size={12}>(T קבועה)</T>
    <T x={300} y={46} ltr fill={C.ink}>Charles: V/T</T>
    <Axis x1={225} y1={60} x2={375} y2={170}/>
    <Curve d="M235,160 L365,72" stroke="#4ed97a"/>
    <T x={300} y={192} ltr size={12}>V vs T (K)</T>
    <T x={300} y={206} size={12}>(P קבוע)</T>
    <T x={465} y={46} ltr fill={C.ink}>Gay-Lussac: P/T</T>
    <Axis x1={390} y1={60} x2={530} y2={170}/>
    <Curve d="M400,160 L520,76" stroke="#f2d049"/>
    <T x={460} y={192} ltr size={12}>P vs T (K)</T>
    <T x={460} y={206} size={12}>(V קבוע)</T>
    <T x={280} y={250} ltr fill={C.ink} size={14}>PV = nRT</T>
    <T x={280} y={280} ltr size={12}>R = 0.08206 L·atm/(mol·K) · הטמפרטורה תמיד בקלווין!</T>
  </Fig>;
}

// G10: Maxwell-Boltzmann distribution at two temperatures.
export function MaxwellBoltzmann({accent}){
  return <Fig label="התפלגות מקסוול-בולצמן: בטמפרטורה גבוהה יותר המולקולות מהירות יותר בממוצע">
    <Axis x1={70} y1={45} x2={490} y2={240} xLabel="מהירות המולקולות" yLabel="שכיחות"/>
    <Curve d="M80,238 C120,235 140,120 185,110 C230,100 260,190 340,225 C380,235 420,238 480,239" stroke={accent} w={2.2}/>
    <Curve d="M80,239 C150,238 200,170 280,160 C340,152 380,205 480,232" stroke="#f2d049" w={2.2}/>
    <T x={185} y={96} fill={accent} ltr size={12}>T₁ (קר)</T>
    <T x={330} y={140} fill="#f2d049" ltr size={12}>T₂ > T₁ (חם)</T>
    <T x={280} y={285}>חימום לא "ממהיר מולקולה אחת" — הוא מזיז את כל ההתפלגות</T>
    <T x={280} y={307} ltr size={12}>u_rms = √(3RT/M) · אפוזיה: קצב ∝ √(1/M) (גרהם)</T>
  </Fig>;
}

// G11: intermolecular force ladder with boiling-point consequences.
export function ImfLadder({accent}){
  const rows=[['London (פיזור)','כל המולקולות','CH₄: −161 °C',0],['Dipole-dipole','מולקולות קוטביות','HCl: −85 °C',1],['קשר מימן','N,O,F עם H','H₂O: 100 °C',2],['Ion-dipole','יונים בתמיסה','מי מלח',3]];
  return <Fig label="סולם הכוחות הבין-מולקולריים והשפעתם על נקודת הרתיחה">
    {rows.map(([n,w,ex,i])=>{
      const y=90+i*52;
      return <g key={n}>
        <Box x={70+i*22} y={y-26} w={340-i*22} h={44} fill={i===2?accent:C.faint} opacity={i===2?.35:1} stroke={i===2?accent:C.line}/>
        <T x={90+i*22} y={y-4} anchor="start" fill={C.ink} size={13} ltr>{n}</T>
        <T x={90+i*22} y={y+12} anchor="start" size={12}>{w} · <tspan>{ex}</tspan></T>
      </g>;})}
    <Arrow x1={520} y1={66} x2={520} y2={230} stroke={accent} id="imf"/>
    <T x={534} y={150} size={12} fill={accent}>חוזק עולה</T>
    <T x={280} y={290}>בהשוואת חומרים דומים: כוחות חזקים יותר = נקודת רתיחה גבוהה יותר (צריך יותר אנרגיה להפרדה)</T>
  </Fig>;
}

// G12: phase diagram with triple and critical points.
export function PhaseDiagram({accent}){
  return <Fig label="דיאגרמת פאזות: גבולות מוצק-נוזל-גז, נקודה משולשת ונקודה קריטית">
    <Axis x1={80} y1={40} x2={470} y2={250} xLabel="T" yLabel="P"/>
    <Curve d="M95,240 C120,190 150,150 190,120" stroke={accent} w={2.2}/>
    <Curve d="M190,120 C240,90 300,68 360,60" stroke="#4ed97a" w={2.2}/>
    <Curve d="M190,120 C260,140 340,180 430,225" stroke="#f2d049" w={2.2}/>
    <Dot cx={190} cy={120} r={5} fill={C.ink}/>
    <T x={190} y={140} size={12} fill={C.ink}>נקודה משולשת</T>
    <Dot cx={360} cy={60} r={5} fill={C.warn}/>
    <T x={360} y={44} size={12} fill={C.warn}>נקודה קריטית</T>
    <T x={115} y={110} size={13} fill={C.ink}>מוצק</T>
    <T x={270} y={100} size={13} fill={C.ink}>נוזל</T>
    <T x={300} y={200} size={13} fill={C.ink}>גז</T>
    <T x={280} y={285}>בנקודה המשולשת שלוש הפאזות בשיווי משקל; מעבר לקריטית — פלואיד על־קריטי</T>
    <T x={280} y={305} ltr size={12}>מים חריגים: שיפוע גבול מוצק/נוזל שלילי (קרח צף)</T>
  </Fig>;
}

// G12: Bragg diffraction from crystal planes.
export function Bragg({accent}){
  return <Fig label="עקיפת קרני X ממישורי גביש: הפרש הדרך בין הקרניים הוא 2d·sinθ">
    {[70,120,170].map(y=><L key={y} x1={60} y1={y} x2={500} y2={y} stroke={C.line} w={2}/>)}
    {[70,120,170].map(y=>[100,180,260,340,420].map(x=><Dot key={x} cx={x} cy={y} r={4} fill={C.dim}/>))}
    <L x1={140} y1={30} x2={300} y2={70} stroke={accent} w={2}/>
    <L x1={300} y1={70} x2={140} y2={110} stroke={accent} w={2}/>
    <L x1={190} y1={55} x2={350} y2={120} stroke="#4ed97a" w={2}/>
    <L x1={350} y1={120} x2={190} y2={185} stroke="#4ed97a" w={2}/>
    <L x1={300} y1={70} x2={300} y2={120} stroke={C.warn} dash="3 3"/>
    <L x1={350} y1={70} x2={350} y2={120} stroke={C.warn} dash="3 3"/>
    <T x={318} y={96} ltr size={12} fill={C.warn}>d·sinθ</T>
    <T x={368} y={96} ltr size={12} fill={C.warn}>d·sinθ</T>
    <T x={300} y={146} ltr size={12}>d</T>
    <T x={230} y={55} ltr size={12}>θ</T>
    <T x={280} y={230} ltr fill={C.ink} size={14}>nλ = 2d·sinθ</T>
    <T x={280} y={262}>כשהתנאי מתקיים — התאבכות בונה ומתקבלת פסגת עקיפה</T>
    <T x={280} y={290} size={12}>מהזווית מחשבים את המרחק בין מישורי הגביש</T>
  </Fig>;
}
