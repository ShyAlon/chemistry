import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Dot,Box,Fig} from './figures-core.jsx';

// Original didactic drawings for Introduction to Nuclear Energy. Concepts follow
// the lessons and public references (NRC, World Nuclear Association, REMM);
// no lecture artwork is traced or reproduced.

// E5: what stops each radiation type. Qualitative, not to scale.
export function RadiationPenetration({accent}){
  const rows=[
    {y:62,sym:'α',stop:'דף נייר',c:'#f09797',x:190,pass:false},
    {y:132,sym:'β',stop:'לוח אלומיניום דק',c:'#f0c978',x:300,pass:false},
    {y:202,sym:'γ',stop:'עופרת או בטון עבה',c:accent,x:410,pass:true}];
  return <Fig label="חדירות קרינה: אלפא נעצרת בדף נייר, בטא בלוח אלומיניום דק, גמא רק מוחלשת בעופרת או בבטון עבה" viewBox="0 -36 560 286">
    {rows.map(r=><g key={r.sym}>
      <Dot cx={40} cy={r.y} r={10} fill={r.c}/>
      <T x={40} y={r.y+30} size={14} fill={C.ink}>{r.sym}</T>
      <Arrow x1={54} y1={r.y} x2={r.x-6} y2={r.y} stroke={r.c} id={'pen'+r.sym}/>
      <Box x={r.x} y={r.y-26} w={14} h={52} fill={C.faint} stroke={C.mut} rx={2}/>
      <T x={r.x+7} y={r.y-34} size={12} fill={C.ink}>{r.stop}</T>
      {r.pass&&<Arrow x1={r.x+20} y1={r.y} x2={r.x+100} y2={r.y} stroke={r.c} dash="2 5" id="pengam"/>}
      {r.pass&&<T x={r.x+60} y={r.y+24} size={11}>נחלשת, לא נעצרת</T>}
    </g>)}
  </Fig>;
}

// E6: front end of the fuel cycle, then the reactor and spent fuel.
export function FuelCycle({accent}){
  const W=118,H=64,xs=[430,296,162,28];
  const top=[['כרייה','עפרת אורניום'],['טחינה','U₃O₈'],['המרה','UF₆'],['העשרה','UF₆ מועשר']];
  const bot=[['ייצור דלק','UO₂ בכדורים'],['כור','הפקת חשמל'],['דלק משומש','אחסון או עיבוד']];
  const Cell=({x,y,a,b,hi})=><g>
    <Box x={x} y={y} w={W} h={H} fill={C.faint} stroke={hi?accent:C.line}/>
    <T x={x+W/2} y={y+26} size={14} fill={C.ink} weight="bold">{a}</T>
    <T x={x+W/2} y={y+48} size={11}>{b}</T>
  </g>;
  return <Fig label="שלבי מעגל הדלק של כור מים קלים: כרייה, טחינה, המרה, העשרה, ייצור דלק, כור ודלק משומש" viewBox="0 -36 580 286">
    {top.map(([a,b],i)=><g key={a}><Cell x={xs[i]} y={30} a={a} b={b}/>{i<3&&<Arrow x1={xs[i]-2} y1={62} x2={xs[i+1]+W+4} y2={62} stroke={C.dim} id={'ft'+i}/>}</g>)}
    <Arrow x1={xs[3]+W/2} y1={96} x2={xs[3]+W/2} y2={150} stroke={C.dim} id="ftturn"/>
    {bot.map(([a,b],i)=>{const x=[28,162,296][i];return <g key={a}><Cell x={x} y={160} a={a} b={b} hi={a==='כור'}/>{i<2&&<Arrow x1={x+W+2} y1={192} x2={[162,296][i]-4} y2={192} stroke={C.dim} id={'fb'+i}/>}</g>;})}
  </Fig>;
}

// E8: pressurized water reactor, two separate water loops.
export function PwrLoops({accent}){
  const HOT='#f09797',COLD='#7aa7f0',STEAM='#f0c978',FEED='#6fd0c0';
  return <Fig label="כור מים בלחץ: מעגל ראשוני סגור בין הליבה לצד הצינורות של מחולל הקיטור, ומעגל משני סגור נפרד: מחולל קיטור, טורבינה, מעבה, משאבת מי הזנה וחזרה למחולל הקיטור" viewBox="0 -70 580 405">
    <Box x={470} y={90} w={100} h={160} fill={C.faint} stroke={accent}/>
    <T x={520} y={158} size={15} fill={C.ink} weight="bold">כור</T>
    <T x={520} y={180} size={11}>ליבה עם דלק</T>
    <Box x={220} y={90} w={150} h={160} fill={C.faint} stroke={C.mut}/>
    <T x={295} y={80} size={14} fill={C.ink} weight="bold">מחולל קיטור</T>
    <path d="M370 120 H300 V172" fill="none" stroke={HOT} strokeWidth="2.2"/>
    <path d="M300 172 V225 H370" fill="none" stroke={COLD} strokeWidth="2.2"/>
    <T x={335} y={148} size={11} fill={C.mut}>צינורות</T>
    <T x={258} y={168} size={11}>ללא ערבוב</T>
    <Arrow x1={296} y1={192} x2={232} y2={192} stroke="#e8a86a" id="heat"/>
    <T x={262} y={212} size={11} fill="#e8a86a">חום</T>
    <Arrow x1={468} y1={120} x2={372} y2={120} stroke={HOT} id="phot"/>
    <Arrow x1={372} y1={225} x2={468} y2={225} stroke={COLD} id="pcold"/>
    <Dot cx={420} cy={225} r={11} stroke={C.mut} fill={C.faint}/>
    <T x={420} y={229} size={11} ltr>P</T>
    <T x={440} y={105} size={12} ltr fill={HOT}>325 °C</T>
    <T x={420} y={254} size={12} ltr fill={COLD}>290 °C</T>
    <Box x={355} y={28} w={80} h={34} fill={C.faint}/>
    <T x={395} y={50} size={12}>מייצב לחץ</T>
    <T x={395} y={21} size={11} ltr fill={C.mut}>pressurizer</T>
    <L x1={395} y1={62} x2={395} y2={120} stroke={C.dim} dash="4 4"/>
    <Box x={20} y={90} w={100} h={50} fill={C.faint}/>
    <T x={70} y={120} size={14} fill={C.ink}>טורבינה</T>
    <Dot cx={70} cy={48} r={17} stroke={C.mut} fill="none"/>
    <T x={70} y={53} size={13} ltr>G</T>
    <L x1={70} y1={65} x2={70} y2={90}/>
    <Box x={20} y={190} w={100} h={50} fill={C.faint}/>
    <T x={70} y={220} size={14} fill={C.ink}>מעבה</T>
    <Arrow x1={218} y1={115} x2={122} y2={115} stroke={STEAM} id="steam"/>
    <T x={170} y={105} size={11} fill={STEAM}>קיטור</T>
    <Arrow x1={70} y1={142} x2={70} y2={188} stroke={C.dim} id="exh"/>
    <Arrow x1={122} y1={225} x2={150} y2={225} stroke={FEED} id="feed1"/>
    <Dot cx={162} cy={225} r={11} stroke={C.mut} fill={C.faint}/>
    <T x={162} y={229} size={11} ltr>P</T>
    <Arrow x1={174} y1={225} x2={218} y2={225} stroke={FEED} id="feed2"/>
    <T x={170} y={250} size={11} fill={FEED}>מי הזנה</T>
    <T x={500} y={283} size={12} fill={C.ink}>מעגל ראשוני סגור: מים בלחץ</T>
    <T x={500} y={302} size={12} ltr fill={C.ink}>~150 atm</T>
    <T x={500} y={321} size={11}>(אדום חם, כחול קר)</T>
    <T x={150} y={283} size={12} fill={C.ink}>מעגל משני סגור: מים וקיטור, נפרד</T>
  </Fig>;
}

// E5: which photon interaction dominates at which energy. Lesson ranges, log axis.
export function PhotonInteractions({accent}){
  const X=k=>40+120*(Math.log10(k)-1); // energy in keV, 10 keV..100 MeV
  const bars=[
    {y:30,a:X(10),b:X(100),t:'אפקט פוטואלקטרי',f:'Z⁴⁻⁵ / E³⁻³·⁵',c:'#f0c978'},
    {y:92,a:X(100),b:X(10000),t:'פיזור קומפטון',f:'Z/E',c:accent},
    {y:154,a:X(10000),b:X(100000),t:'יצירת זוגות',f:'Z²·lnE',c:'#c79af0'}];
  return <Fig label="אינטראקציות פוטונים בחומר לפי אנרגיה, קירוב כללי: אפקט פוטואלקטרי עד כ-100 keV, פיזור קומפטון מכ-100 keV עד כ-10 MeV, יצירת זוגות שולטת מעל כ-10 MeV; יצירת זוגות אפשרית כבר מעל הסף 1.022 MeV" viewBox="0 -90 560 346">
    <Box x={X(1022)} y={154} w={X(10000)-X(1022)} h={52} fill="none" stroke="#c79af0" dash="4 4" opacity={0.7}/>
    <T x={(X(1022)+X(10000))/2} y={185} size={12} fill={C.mut}>אפשרית, לא שולטת</T>
    {bars.map(r=><g key={r.t}>
      <Box x={r.a} y={r.y} w={r.b-r.a} h={52} fill={C.faint} stroke={r.c}/>
      <T x={(r.a+r.b)/2} y={r.y+22} size={13} fill={C.ink}>{r.t}</T>
      <T x={(r.a+r.b)/2} y={r.y+41} size={12} ltr fill={r.c}>{r.f}</T>
    </g>)}
    <L x1={X(1022)} y1={14} x2={X(1022)} y2={222} stroke={C.dim} dash="4 4"/>
    <T x={X(1022)} y={-6} size={12} fill={C.ink}>סף יצירת זוגות</T><T x={X(1022)} y={8} size={12} ltr fill={C.ink}>1.022 MeV</T>
    <L x1={40} y1={222} x2={520} y2={222}/>
    {[[10,'10 keV'],[100,'100 keV'],[1000,'1 MeV'],[10000,'10 MeV'],[100000,'100 MeV']].map(([k,l])=><g key={l}><L x1={X(k)} y1={222} x2={X(k)} y2={228}/><T x={X(k)} y={244} size={12} ltr>{l}</T></g>)}
  </Fig>;
}

// E7: neutron energy families on a log axis (lesson values).
export function NeutronFamilies({accent}){
  const X=ev=>40+480*(Math.log10(ev)+2)/11; // 0.01 eV .. 1 GeV
  return <Fig label="משפחות אנרגיה של ניטרונים: תרמיים כ-0.025 eV, מהירים 0.2 עד 20 MeV, ואנרגיה גבוהה מעל 100 MeV; האטה במאט מורידה ניטרון מהיר לתרמי" viewBox="0 -90 560 280">
    <Dot cx={X(0.025)} cy={92} r={7} fill="#7aa7f0"/>
    <T x={X(0.025)+50} y={62} size={13} fill="#7aa7f0">תרמיים</T>
    <T x={X(0.025)+50} y={78} size={11} ltr fill="#7aa7f0">0.025 eV</T>
    <Box x={X(2e5)} y={84} w={X(2e7)-X(2e5)} h={16} fill="#f0c97855" stroke="#f0c978"/>
    <T x={(X(2e5)+X(2e7))/2} y={62} size={13} fill="#f0c978">מהירים</T>
    <T x={(X(2e5)+X(2e7))/2} y={78} size={11} ltr fill="#f0c978">0.2-20 MeV</T>
    <Box x={X(1e8)} y={84} w={520-X(1e8)} h={16} fill="#f0979755" stroke="#f09797"/>
    <T x={500} y={34} size={13} anchor="end" fill="#f09797">אנרגיה גבוהה</T>
    <T x={500} y={50} size={11} anchor="end" ltr fill="#f09797">&gt;100 MeV</T>
    <Arrow x1={X(2e5)-4} y1={122} x2={X(0.025)+10} y2={122} stroke={C.mut} id="mod"/>
    <T x={200} y={142} size={12}>האטה בהתנגשויות אלסטיות במאט, למשל מים</T>
    <L x1={40} y1={160} x2={520} y2={160}/>
    {[[0.01,'0.01 eV'],[1,'1 eV'],[1e3,'1 keV'],[1e6,'1 MeV'],[1e9,'1 GeV']].map(([k,l])=><g key={l}><L x1={X(k)} y1={160} x2={X(k)} y2={166}/><T x={X(k)} y={182} size={12} ltr>{l}</T></g>)}
  </Fig>;
}

// E7: binding energy per nucleon, schematic shape with maximum near iron.
export function BindingCurve({accent}){
  return <Fig label="עקומת אנרגיית הקשר לנוקלאון בצורה סכמטית: מקסימום סביב ברזל; היתוך של גרעינים קלים וביקוע של גרעינים כבדים מתקרבים למקסימום ומשחררים אנרגיה" viewBox="0 -90 560 310">
    <L x1={50} y1={20} x2={50} y2={170}/>
    <L x1={50} y1={170} x2={530} y2={170}/>
    <Arrow x1={49} y1={30} x2={49} y2={14} stroke={C.line} id="bey"/>
    <Arrow x1={520} y1={170} x2={534} y2={170} stroke={C.line} id="bex"/>
    <T x={290} y={198} size={12} ltr>A</T>
    <T x={290} y={214} size={12}>מספר המסה</T>
    <path d="M52 150 C 75 70 110 38 175 34 C 280 36 400 52 515 66" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round"/>
    <Dot cx={175} cy={34} r={5} fill={accent}/>
    <T x={175} y={22} size={13} fill={C.ink}>ברזל</T>
    <Arrow x1={72} y1={118} x2={150} y2={62} stroke="#7aa7f0" id="fus"/>
    <T x={105} y={140} size={13} fill="#7aa7f0">היתוך</T>
    <T x={105} y={156} size={11}>גרעינים קלים</T>
    <Arrow x1={498} y1={92} x2={210} y2={52} stroke="#f09797" id="fis"/>
    <T x={400} y={112} size={13} fill="#f09797">ביקוע</T>
    <T x={400} y={128} size={11}>גרעין כבד נשבר</T>
    <T x={150} y={4} size={11} anchor="end">אנרגיית קשר לנוקלאון</T>
  </Fig>;
}

// E7: where the ~200 MeV of a U-235 fission goes (lesson values).
export function FissionEnergySplit({accent}){
  const rows=[['אנרגיה קינטית של התוצרים',166,accent,'חום שמיש'],['ניטרונים',5,'#f0c978'],['גמא מיידית',7,'#c79af0'],['גמא מתוצרי הביקוע',7,'#c79af0'],['בטא מתוצרי הביקוע',5,'#7aa7f0'],['ניטרינו',10,'#f09797','אובד']];
  const s=1.5;
  return <Fig label="לאן הולכות כ-200 MeV של ביקוע אורניום 235: 166 MeV אנרגיה קינטית של התוצרים, 5 ניטרונים, 7 גמא מיידית, 7 גמא מתוצרים, 5 בטא, 10 ניטרינו שאובדים" viewBox="0 -90 560 375">
    {rows.map(([n,v,c,note],i)=>{const y=14+i*38;return <g key={n}>
      <T x={550} y={y+17} size={13} anchor="end" fill={C.ink}>{n}</T>
      <Box x={30} y={y} w={v*s} h={24} fill={C.faint} stroke={c} dash={n==='ניטרינו'?'4 3':undefined} rx={3}/>
      <T x={30+v*s+8} y={y+17} size={12} anchor="start" ltr fill={c}>{v+' MeV'}</T>
      {note&&<T x={30+v*s+70} y={y+17} size={11} anchor="start" fill={C.mut}>{note}</T>}
    </g>;})}
    <L x1={30} y1={246} x2={550} y2={246} stroke={C.soft}/>
    <T x={550} y={270} size={13} anchor="end" fill={C.ink}>סך הכול לביקוע</T>
    <T x={30} y={270} size={13} anchor="start" ltr fill={C.ink}>~200 MeV</T>
  </Fig>;
}

// E7: subcritical, critical and supercritical chains, neutrons causing fission per generation.
export function ChainReaction({accent}){
  const P=[{x:380,t:'על־קריטית',k:'k > 1',rows:[1,2,4],n:'גדלה מעריכית',c:'#f09797'},{x:195,t:'קריטית',k:'k = 1',rows:[1,1,1],n:'קצב ביקועים קבוע',c:accent},{x:10,t:'תת־קריטית',k:'k < 1',rows:[4,2,1],n:'דועכת',c:'#7aa7f0'}];
  return <Fig label="תגובת שרשרת: תת-קריטית דועכת, קריטית יציבה, על-קריטית גדלה מעריכית; מציג כמה ביקועים בכל דור" viewBox="0 -90 560 345">
    {P.map(p=><g key={p.t}>
      <Box x={p.x} y={0} w={170} h={218} fill={C.faint} stroke={p.c}/>
      <T x={p.x+85} y={26} size={14} weight="bold" fill={C.ink}>{p.t}</T>
      <T x={p.x+85} y={46} size={12} ltr fill={p.c}>{p.k}</T>
      {p.rows.map((m,r)=><g key={r}>
        {Array.from({length:m}).map((_,j)=><Dot key={j} cx={p.x+85+(j-(m-1)/2)*30} cy={82+r*42} r={7} fill={p.c}/>)}
        {r<2&&<L x1={p.x+85} y1={92+r*42} x2={p.x+85} y2={110+r*42} stroke={C.dim}/>}
      </g>)}
      <T x={p.x+85} y={204} size={12} fill={C.mut}>{p.n}</T>
    </g>)}
    <T x={280} y={238} size={11}>כל נקודה היא ביקוע; השורות הן דורות עוקבים</T>
  </Fig>;
}

// E6: natural versus enriched uranium composition.
export function UraniumIsotopes({accent}){
  return <Fig label="הרכב האיזוטופי של אורניום: טבעי כ-99.27 אחוז אורניום 238, כ-0.72 אחוז אורניום 235 ועקבות אורניום 234; מועשר לכור מים קלים כ-5 אחוז אורניום 235" viewBox="0 -90 560 310">
    <T x={540} y={10} size={14} anchor="end" fill={C.ink}>אורניום טבעי</T>
    <Box x={40} y={24} w={480} h={36} fill={C.faint} stroke={C.line} rx={3}/>
    <T x={280} y={48} size={14} ltr fill={C.ink}>U-238 99.27%</T>
    <Box x={516} y={24} w={4} h={36} fill="#f0c978" stroke="#f0c978" rx={1}/>
    <L x1={518} y1={60} x2={518} y2={74} stroke="#f0c978"/>
    <T x={518} y={88} size={13} anchor="end" ltr fill="#f0c978">U-235 0.72%</T>
    <T x={420} y={106} size={11} anchor="end" fill={C.mut}>עקבות U-234</T>
    <T x={540} y={132} size={14} anchor="end" fill={C.ink}>מועשר לכור מים קלים</T>
    <Box x={40} y={146} w={480} h={36} fill={C.faint} stroke={C.line} rx={3}/>
    <T x={270} y={170} size={14} ltr fill={C.ink}>U-238 ~95%</T>
    <Box x={496} y={146} w={24} h={36} fill="#f0c97866" stroke="#f0c978" rx={2}/>
    <T x={508} y={199} size={13} anchor="end" ltr fill="#f0c978">U-235 ~5%</T>
  </Fig>;
}

// E6: enrichment cascade of centrifuges (schematic).
export function EnrichmentCascade({accent}){
  const xs=[350,250,150];
  return <Fig label="מפל צנטריפוגות להעשרה: UF6 טבעי נכנס, זרם מועשר יותר עובר שלב אחר שלב עד מוצר מועשר, וזרם דל יותר חוזר ואורניום דל יוצא בצד ההזנה" viewBox="0 -90 560 320">
    <Box x={470} y={70} w={80} h={60} fill={C.faint}/>
    <T x={510} y={96} size={13} weight="bold" fill={C.ink}>הזנה</T>
    <T x={510} y={116} size={11}>UF₆ טבעי</T>
    <Arrow x1={468} y1={100} x2={422} y2={100} stroke={C.dim} id="enfeed"/>
    {xs.map((x,i)=><g key={x}>
      <Box x={x} y={70} w={70} h={60} fill={C.faint} stroke={C.mut}/>
      <T x={x+35} y={96} size={12} fill={C.ink}>שלב</T>
      <T x={x+35} y={116} size={11}>צנטריפוגות</T>
      {i<2&&<><Arrow x1={x-2} y1={86} x2={xs[i+1]+72} y2={86} stroke="#f0c978" id={'enup'+i}/><Arrow x1={xs[i+1]+72} y1={118} x2={x-2} y2={118} stroke="#7aa7f0" id={'endn'+i}/></>}
    </g>)}
    <Arrow x1={148} y1={100} x2={112} y2={100} stroke="#f0c978" id="enprod"/>
    <Box x={20} y={70} w={90} h={60} fill={C.faint} stroke="#f0c978"/>
    <T x={65} y={96} size={13} weight="bold" fill={C.ink}>מוצר</T>
    <T x={65} y={116} size={11} ltr fill="#f0c978">~5% U-235</T>
    <Arrow x1={385} y1={132} x2={385} y2={168} stroke="#7aa7f0" id="entail"/>
    <Box x={320} y={170} w={130} h={44} fill={C.faint} stroke="#7aa7f0"/>
    <T x={385} y={190} size={13} fill={C.ink}>אורניום דל</T>
    <T x={385} y={207} size={11} ltr fill="#7aa7f0">&lt;0.711% U-235</T>
    <T x={230} y={160} size={12} fill={C.mut}>מפל: שלבים בטור</T>
    <T x={230} y={26} size={12} fill="#f0c978">מועשר יותר</T>
    <T x={230} y={46} size={12} fill="#7aa7f0">דל יותר</T>
  </Fig>;
}

// E8: boiling water reactor, a single water circuit.
export function BwrLoop({accent}){
  return <Fig label="כור מים רותחים: מעגל יחיד, המים רותחים בליבה והקיטור מסובב את הטורבינה ישירות, אחר כך מעבה ומשאבת מי הזנה חזרה לכור" viewBox="0 -90 560 360">
    <Box x={440} y={60} w={100} h={150} fill={C.faint} stroke={accent}/>
    <T x={490} y={124} size={15} weight="bold" fill={C.ink}>כור</T>
    <T x={490} y={146} size={11}>המים רותחים בליבה</T>
    <Box x={200} y={60} w={100} h={50} fill={C.faint}/>
    <T x={250} y={90} size={14} fill={C.ink}>טורבינה</T>
    <Dot cx={250} cy={22} r={17} stroke={C.mut} fill="none"/>
    <T x={250} y={27} size={13} ltr>G</T>
    <L x1={250} y1={39} x2={250} y2={60}/>
    <Box x={200} y={160} w={100} h={50} fill={C.faint}/>
    <T x={250} y={190} size={14} fill={C.ink}>מעבה</T>
    <Arrow x1={438} y1={85} x2={302} y2={85} stroke="#f0c978" id="bwrsteam"/>
    <T x={370} y={75} size={12} fill="#f0c978">קיטור</T>
    <Arrow x1={250} y1={112} x2={250} y2={158} stroke={C.dim} id="bwrex"/>
    <Arrow x1={298} y1={195} x2={362} y2={195} stroke="#6fd0c0" id="bwrf1"/>
    <Dot cx={374} cy={195} r={11} stroke={C.mut} fill={C.faint}/>
    <T x={374} y={199} size={11} ltr>P</T>
    <Arrow x1={386} y1={195} x2={438} y2={195} stroke="#6fd0c0" id="bwrf2"/>
    <T x={374} y={226} size={12} fill="#6fd0c0">מי הזנה</T>
    <T x={280} y={250} size={13} fill={C.ink}>מעגל יחיד: אותם מים בליבה ובטורבינה</T>
  </Fig>;
}

// E8: moderator and fuel in PWR, BWR and CANDU (as the lesson states them).
export function ReactorTypes({accent}){
  const cols=[{x:380,n:'PWR',m:['מים רגילים'],f:'אורניום מועשר'},{x:200,n:'BWR',m:['מים רגילים'],f:'אורניום מועשר'},{x:20,n:'CANDU',m:['מים כבדים'],d2o:true,f:'אורניום טבעי',hi:true}];
  return <Fig label="השוואת סוגי כורים: PWR ו-BWR עם מים רגילים ואורניום מועשר, CANDU עם מים כבדים ואורניום טבעי" viewBox="0 -90 560 290">
    {cols.map(c=><g key={c.n}>
      <Box x={c.x} y={0} w={160} h={170} fill={C.faint} stroke={c.hi?accent:C.line}/>
      <T x={c.x+80} y={30} size={16} weight="bold" ltr fill={C.ink}>{c.n}</T>
      <T x={c.x+80} y={62} size={11}>מאט</T>
      <T x={c.x+80} y={82} size={14} fill={C.ink}>{c.m[0]}</T>
      {c.d2o&&<T x={c.x+80} y={100} size={12} ltr>D₂O</T>}
      <T x={c.x+80} y={128} size={11}>דלק</T>
      <T x={c.x+80} y={150} size={14} fill={C.ink}>{c.f}</T>
    </g>)}
  </Fig>;
}

// E8: reactor generations I to IV (WNA usage); "V" is not an official generation.
export function ReactorGenerations({accent}){
  const g=[{x:430,r:'I',t:['1950-60s',null,'הסתיים']},{x:322,r:'II',t:[null,'רוב הצי','הקיים']},{x:214,r:'III',t:[null,'פועל בכמה','מדינות'],hi:true},{x:106,r:'IV',t:[null,'בפיתוח, כמה','יחידות הדגמה']}];
  return <Fig label="דורות הכורים: דור 1 היה בשנות ה-50 וה-60 והסתיים, דור 2 רוב הצי הקיים, דור 3 פועל בכמה מדינות, דור 4 בפיתוח עם יחידות הדגמה, " viewBox="0 -90 560 300">
    {g.map(e=><g key={e.r}>
      <Box x={e.x} y={0} w={98} h={118} fill={C.faint} stroke={e.hi?accent:C.line} dash={e.dash?'5 4':undefined}/>
      <T x={e.x+49} y={20} size={11}>דור</T>
      <T x={e.x+49} y={46} size={22} weight="bold" ltr fill={C.ink}>{e.r}</T>
      {e.t[0]&&<T x={e.x+49} y={72} size={12} ltr>{e.t[0]}</T>}
      {e.t[1]&&<T x={e.x+49} y={78} size={12} fill={C.ink}>{e.t[1]}</T>}
      <T x={e.x+49} y={e.t[1]?98:98} size={12} fill={C.ink}>{e.t[2]}</T>
    </g>)}
    <Arrow x1={540} y1={140} x2={60} y2={140} stroke={C.dim} id="gentime"/>
    <T x={280} y={160} size={12}>זמן</T>
    <T x={280} y={184} size={12}>בין דור שני לשלישי אין הבחנה חדה</T>
  </Fig>;
}

// E1: ionizing threshold. Schematic ordering only, not a measured axis.
export function IonizingScale({accent}){
  const L1=[{x:420,a:'רדיו',b:'ואנטנת סלולר'},{x:300,a:'מיקרוגל',b:''},{x:180,a:'אור נראה',b:''}];
  const H=[{x:60,a:'קרני X',b:''},{x:-60,a:'קרינת גמא',b:''}];
  return <Fig label="סולם אנרגיית הפוטון: רדיו, מיקרוגל ואור נראה אינם מייננים. מעל סף של עשרות אלקטרון-וולט נמצאות קרני X וגמא, וגם חלקיקי אלפא ובטא מייננים" viewBox="-90 -90 680 270">
    <Box x={160} y={0} w={400} h={70} fill={C.faint} stroke={C.line}/>
    <Box x={-90} y={0} w={240} h={70} fill={C.faint} stroke={accent}/>
    {[{x:510,a:'רדיו'},{x:390,a:'מיקרוגל'},{x:270,a:'אור נראה'},{x:100,a:'קרני X'},{x:-30,a:'קרינת גמא'}].map(e=><T key={e.a} x={e.x} y={40} size={13} fill={C.ink}>{e.a}</T>)}
    <T x={360} y={90} size={12}>לא מייננת</T>
    <T x={30} y={90} size={12} fill={accent}>מייננת</T>
    <L x1={155} y1={-8} x2={155} y2={78} stroke={accent} w={2} dash="5 4"/>
    <T x={155} y={-44} size={11}>סף היינון: עשרות אלקטרון-וולט</T>
    <Arrow x1={560} y1={120} x2={-80} y2={120} stroke={C.dim} id="ionen"/>
    <T x={240} y={146} size={12}>אנרגיית פוטון עולה</T>
    <T x={240} y={170} size={12}>חלקיקי אלפא ובטא מייננים גם הם</T>
  </Fig>;
}

// E2: discovery order from the lesson text. Only years given in the lesson are shown.
export function DiscoveryTimeline({accent}){
  const ev=[{x:500,y:'1859',a:'קרני קתודה',b:'פליקר והיטורף'},{x:380,y:'1895',a:'קרני X',b:'רנטגן'},{x:260,y:'1896',a:'רדיואקטיביות',b:'בקרל'},{x:140,y:'',a:'פולוניום ורדיום',b:'בני הזוג קירי'},{x:20,y:'',a:'אלפא, בטא וגמא',b:'רתרפורד'}];
  return <Fig label="ציר זמן של הגילויים: קרני קתודה 1859, קרני X של רנטגן 1895, רדיואקטיביות של בקרל 1896, פולוניום ורדיום של בני הזוג קירי, וסוגי הקרינה של רתרפורד" viewBox="-20 -90 640 230">
    <L x1={560} y1={40} x2={-10} y2={40} stroke={C.dim} w={2}/>
    {ev.map((e,i)=><g key={i}>
      <Dot cx={e.x+50} cy={40} r={6} fill={i===1||i===2?accent:C.line} stroke={C.ink}/>
      {e.y&&<T x={e.x+50} y={18} size={14} weight="bold" ltr fill={C.ink}>{e.y}</T>}
      <T x={e.x+50} y={70} size={13} fill={C.ink}>{e.a}</T>
      <T x={e.x+50} y={92} size={12}>{e.b}</T>
    </g>)}
    <T x={280} y={125} size={12}>לשנים אין סולם מדוד. הציור מציג סדר בלבד.</T>
  </Fig>;
}

// E3: four families of questions and the methods the lesson lists for each.
export function TechniqueChooser({accent}){
  const q=[{x:420,t:'מדידות גרעיניות',m:['ספקטרוסקופיה α β γ','מונה גייגר','NAA']},{x:285,t:'הרכב יסודי',m:['XRF','SEM-EDS','ICP-AES','ICP-MS']},{x:150,t:'יחס איזוטופים',m:['MC-ICP-MS','TOF-SIMS']},{x:15,t:'מבנה האטומים',m:['XRD','Raman','IR']}];
  return <Fig label="בחירת שיטה לפי השאלה: מדידות גרעיניות, הרכב יסודי, יחס איזוטופים ומבנה, עם השיטות שהשיעור מונה לכל שאלה" viewBox="0 -90 580 290">
    {q.map(c=><g key={c.t}>
      <Box x={c.x} y={0} w={130} h={170} fill={C.faint} stroke={C.line}/>
      <T x={c.x+65} y={30} size={14} weight="bold" fill={C.ink}>{c.t}</T>
      <L x1={c.x+14} y1={46} x2={c.x+116} y2={46}/>
      {c.m.map((m,i)=><T key={m} x={c.x+65} y={74+i*24} size={13} ltr fill={C.ink}>{m}</T>)}
    </g>)}
    <T x={290} y={196} size={12}>מה רוצים לדעת? זו נקודת המוצא לבחירת השיטה.</T>
  </Fig>;
}

// E9: typical doses in mSv on a log scale. Exam values are approximate lesson examples;
// background is an annual average; limits are ICRP recommendations (national rules vary).
export function TypicalDoses({accent}){
  const EX='#8aa0b8',BG='#f0c978';
  const r=[['צילום חזה',0.02,EX],['טיסה לניו יורק',0.05,EX],['גבול שנתי לציבור',1,accent],['רקע טבעי בשנה (קירוב)',2,BG],['מיפוי עצמות',3,EX],['CT בטן',10,EX],['גבול לעובד, ממוצע רב-שנתי',20,accent]];
  const x0=190,k=80; const px=v=>x0+k*(Math.log10(v)+2);
  return <Fig label="מנות טיפוסיות בסולם לוגריתמי: דוגמאות לבדיקות בקירוב, רקע טבעי שנתי וגבולות שנתיים של ICRP. צילום חזה 0.02, טיסה לניו יורק 0.05, גבול לציבור 1, רקע טבעי 2, מיפוי עצמות 3, CT בטן 10 וגבול לעובד קרינה 20 מילי-זיוורט" viewBox="-90 -90 640 420">
    {[0.01,0.1,1,10,100].map(v=><g key={v}>
      <L x1={px(v)} y1={-6} x2={px(v)} y2={226} stroke={C.soft} dash="3 4"/>
      <T x={px(v)} y={246} size={12} ltr>{v}</T>
    </g>)}
    {r.map((e,i)=>{const y=i*32;return <g key={e[0]}>
      <T x={x0-10} y={y+16} anchor="end" size={13} fill={C.ink}>{e[0]}</T>
      <rect x={x0} y={y+2} width={px(e[1])-x0} height={20} rx={3} fill={e[2]}/>
      <T x={px(e[1])+8} y={y+17} anchor="start" size={13} ltr fill={C.ink}>{e[1]}</T>
    </g>;})}
    <L x1={x0} y1={-6} x2={x0} y2={226}/>
    <L x1={x0} y1={226} x2={px(100)} y2={226}/>
    <T x={x0+160} y={268} size={12} ltr>mSv</T>
    <T x={x0+160} y={288} size={12}>ציר לוגריתמי: כל שנתון גדול פי עשר מקודמו</T>
    <rect x={400} y={300} width={12} height={12} fill={EX}/><T x={392} y={311} anchor="end" size={12}>דוגמה בקירוב</T>
    <rect x={245} y={300} width={12} height={12} fill={BG}/><T x={237} y={311} anchor="end" size={12}>ממוצע שנתי</T>
    <rect x={110} y={300} width={12} height={12} fill={accent}/><T x={102} y={311} anchor="end" size={12}>גבול שנתי</T><T x={30} y={311} anchor="end" size={12} ltr>ICRP</T>
  </Fig>;
}

// E9: deterministic effects have a threshold and rising severity; stochastic
// effects have rising probability, no known threshold (LNT assumption).
export function DoseEffects({accent}){
  return <Fig label="אפקט דטרמיניסטי: יש סף וחומרת הנזק עולה עם המנה. אפקט סטוכסטי: ההסתברות עולה עם המנה, ללא סף ידוע, ובחומרה לא משתנה" viewBox="-20 -90 640 300">
    <g>
      <L x1={330} y1={0} x2={330} y2={150}/><L x1={330} y1={150} x2={580} y2={150}/>
      <path d="M335,150 L420,150 C460,150 500,100 520,75 L570,15" stroke={accent} strokeWidth={2.5} fill="none"/>
      <L x1={420} y1={150} x2={420} y2={160} stroke={C.ink}/>
      <T x={420} y={178} size={12}>סף</T>
      <T x={455} y={-10} size={14} weight="bold" fill={C.ink}>דטרמיניסטי</T>
      <T x={452} y={200} size={12}>חומרת הנזק מול המנה</T>
    </g>
    <g>
      <L x1={20} y1={0} x2={20} y2={150}/><L x1={20} y1={150} x2={270} y2={150}/>
      <L x1={20} y1={150} x2={265} y2={20} stroke={accent} w={2.5}/>
      <T x={145} y={-10} size={14} weight="bold" fill={C.ink}>סטוכסטי</T>
      <T x={150} y={178} size={12}>ההסתברות מול המנה</T>
      <T x={150} y={200} size={12}>בלי סף ידוע (הנחת LNT)</T>
    </g>
  </Fig>;
}

// E4: valley of stability, schematic. n/p about 1 for light nuclei, about 1.5 for heavy.
export function StabilityValley({accent}){
  const d="M40,200 L120,176 C190,140 215,128 240,116 C300,80 340,62 380,46";
  return <Fig label="עמק היציבות: מספר ניטרונים מול מספר פרוטונים. בגרעינים קלים היחס בערך 1 ובכבדים בערך 1.5. מעל העמק דועכים בבטא מינוס, מתחתיו בבטא פלוס" viewBox="-60 -90 600 330">
    <L x1={40} y1={200} x2={40} y2={-10}/><L x1={40} y1={200} x2={500} y2={200}/>
    <Arrow x1={499} y1={200} x2={510} y2={200} stroke={C.line} id="svx"/><Arrow x1={40} y1={-9} x2={40} y2={-20} stroke={C.line} id="svy"/>
    <T x={270} y={232} size={13} ltr>Z</T><T x={20} y={-16} size={13} ltr>N</T>
    <L x1={40} y1={200} x2={500} y2={62} stroke={C.dim} dash="5 4"/>
    <T x={480} y={86} size={12} ltr fill={C.mut}>N = Z</T>
    <path d={d} stroke={accent} strokeWidth={14} fill="none" opacity={0.35} strokeLinecap="round"/>
    <path d={d} stroke={accent} strokeWidth={2.5} fill="none"/>
    <T x={290} y={20} size={13} fill={C.ink}>עמק היציבות</T>
    <T x={140} y={50} size={12} fill={C.ink}>יותר מדי ניטרונים</T>
    <T x={140} y={68} size={12} ltr>β−</T>
    <T x={400} y={150} size={12} fill={C.ink}>יותר מדי פרוטונים</T>
    <T x={400} y={168} size={12} ltr>β+</T>
    <T x={110} y={104} size={11}>קלים: ניטרונים לפרוטונים</T>
    <T x={110} y={120} size={11} ltr>~ 1</T>
    <T x={440} y={20} size={11}>כבדים</T>
    <T x={440} y={36} size={11} ltr>~ 1.5</T>
  </Fig>;
}

// E10: three-column poster layout wireframe, following the lesson's anatomy list.
export function PosterWireframe({accent}){
  const col=(x,items)=><g>{items.map((it,i)=><g key={i}><Box x={x} y={it.y} w={150} h={it.h} fill={it.f?C.soft:C.faint} stroke={it.f?accent:C.line}/><T x={x+75} y={it.y+it.h/2+4} size={12} fill={C.ink}>{it.t}</T></g>)}</g>;
  return <Fig label="מבנה פוסטר בשלוש עמודות: כותרת ופתיחה למעלה, מבוא ותכונות, יישומים ואיור עם כיתוב, השוואה לחלופות ורשימת מקורות" viewBox="-20 -90 520 400">
    <Box x={0} y={-10} w={480} h={44} fill={C.soft} stroke={accent}/>
    <T x={240} y={18} size={15} weight="bold" fill={C.ink}>כותרת מדויקת ושם המציג</T>
    <Box x={0} y={44} w={480} h={34} fill={C.faint} stroke={C.line}/>
    <T x={240} y={66} size={12} fill={C.ink}>פתיחה קצרה: המסר המרכזי</T>
    {col(330,[{y:90,h:50,t:'מבוא'},{y:150,h:70,t:'מקטע עם כותרת-מסר'},{y:230,h:40,t:'מקורות'}])}
    {col(165,[{y:90,h:80,t:'איור עם כיתוב-מסקנה',f:true},{y:180,h:90,t:'מקטע עם כותרת-מסר'}])}
    {col(0,[{y:90,h:60,t:'נקודות קצרות עם מספרים'},{y:160,h:50,t:'השוואה לחלופות'},{y:220,h:50,t:'איור נוסף',f:true}])}
    <T x={240} y={296} size={12}>סכמת מבנה בלבד</T>
  </Fig>;
}

// Label on a faint chip so the geometry guard can declare and check its box.
const Lab=({x,y,children,size=12,fill,ltr=false,w})=>{const n=[...String(children)].length;const ww=w||Math.ceil(n*size*0.58+14);return <g><Box x={x-ww/2} y={y-size-3} w={ww} h={size+9} fill={C.faint} stroke="none" rx={4} opacity={0.92}/><T x={x} y={y} size={size} ltr={ltr} fill={fill}>{children}</T></g>;};

// E5: continuous beta energy spectrum. Schematic shape, not a real isotope.
export function BetaSpectrum({accent}){
  const x0=60,x1=500,yb=190,top=50;
  const f=u=>Math.pow(u,0.6)*Math.pow(1-u,1.8);
  const mx=Math.max(...Array.from({length:101},(_,i)=>f(i/100)));
  const pt=u=>[x0+u*(x1-x0),yb-(f(u)/mx)*(yb-top)];
  const d='M'+Array.from({length:101},(_,i)=>pt(i/100).map(v=>v.toFixed(1)).join(',')).join(' L');
  const mean=(()=>{let a=0,b=0;for(let i=0;i<=1000;i++){const u=i/1000;a+=u*f(u);b+=f(u)}return a/b})();const avgX=x0+mean*(x1-x0);
  return <Fig label="ספקטרום בטא רציף: מספר החלקיקים כפונקציה של האנרגיה, מאפס עד אנרגיית המקסימום; האנרגיה הממוצעת נמוכה מהמקסימום ותלויה בגרעין, למשל נתרן 22 כ-0.39 ואשלגן-יוד 131 כ-0.32 מהמקסימום; צורה סכמטית" viewBox="0 -10 560 250">
    <L x1={x0} y1={yb} x2={x1+20} y2={yb}/>
    <L x1={x0} y1={yb} x2={x0} y2={20}/>
    <path d={d} stroke={accent} strokeWidth={2.2} fill="none"/>
    <L x1={avgX} y1={yb} x2={avgX} y2={60} stroke={C.mut} dash="4 4"/>
    <Box x={avgX+90} y={8} w={240} h={70} fill={C.faint} stroke="none" rx={4} opacity={0.92}/>
    <T x={avgX+205} y={30} size={12} fill={C.ink}>אנרגיה ממוצעת: תלויה בגרעין</T>
    <T x={avgX+205} y={48} size={12} ltr fill={C.ink}>²²Na: 0.39·Emax ; ¹³¹I: 0.32·Emax</T><T x={avgX+205} y={66} size={11} fill={C.mut}>הקו המקווקו: הממוצע בצורה המצוירת, סכמטי</T>
    <L x1={x1} y1={yb} x2={x1} y2={yb-14} stroke={C.mut}/>
    <T x={x1} y={yb+18} size={12} ltr fill={C.ink}>Emax</T>
    <T x={x0} y={yb+18} size={12} ltr fill={C.ink}>0</T>
    <T x={(x0+x1)/2} y={yb+38} size={12}>אנרגיית החלקיק</T>
    <T x={x0+6} y={14} size={12} anchor="start">מספר חלקיקים</T>
  </Fig>;
}

// E5: schematic gamma energy spectrum in a detector for a 2 MeV photon.
export function PhotonSpectrum({accent}){
  const x0=60,x1=500,yb=190;
  const X=e=>x0+(e/2000)*(x1-x0);
  const edge=1773;
  const peak=(e,h,w=4)=>`M${X(e)-w},${yb} L${X(e)},${yb-h} L${X(e)+w},${yb}`;
  const cont=`M${X(0)},${yb-46} L${X(edge-40)},${yb-30} L${X(edge)},${yb-30} L${X(edge)},${yb-8} L${X(2000)-4},${yb-8}`;
  return <Fig label="ספקטרום פוטונים סכמטי בגלאי לפוטון של 2 מגה-אלקטרון-וולט: פסגת אניהילציה ב-511, פסגת בריחה כפולה ב-978, פסגת בריחה בודדת ב-1489, קצה קומפטון ב-1773 ופסגת כל האנרגיה ב-2000 קילו-אלקטרון-וולט" viewBox="0 -20 560 270">
    <L x1={x0} y1={yb} x2={x1+20} y2={yb}/>
    <L x1={x0} y1={yb} x2={x0} y2={20}/>
    <path d={cont} stroke={C.mut} strokeWidth={2} fill="none"/>
    <path d={peak(511,70)} stroke="#f0c978" strokeWidth={2.2} fill="none"/>
    <path d={peak(978,40)} stroke="#c79af0" strokeWidth={2.2} fill="none"/>
    <path d={peak(1489,48)} stroke="#c79af0" strokeWidth={2.2} fill="none"/>
    <path d={peak(2000,150,4)} stroke={accent} strokeWidth={2.4} fill="none"/>
    <Lab x={X(511)} y={yb-76} fill="#f0c978">אניהילציה</Lab>
    <Lab x={X(978)} y={yb-46} fill="#c79af0">בריחה כפולה</Lab>
    <Lab x={X(1489)-6} y={yb-70} fill="#c79af0">בריחה בודדת</Lab>
    <T x={X(edge)-20} y={yb-14} size={11} fill={C.mut} dy={-30}>קצה קומפטון</T>
    <Lab x={X(2000)} y={yb-158} fill={C.ink}>כל האנרגיה</Lab>
    {[[511,'511'],[978,'978'],[1489,'1489'],[1773,'1773'],[2000,'2000']].map(([e,l])=><g key={l}><L x1={X(e)} y1={yb} x2={X(e)} y2={yb+5}/><T x={X(e)} y={yb+20} size={11} ltr>{l}</T></g>)}
    <T x={(x0+x1)/2} y={yb+40} size={12}>keV, ציר אופקי ליניארי; גבהי הפסגות סכמטיים</T>
    <T x={x0+6} y={14} size={12} anchor="start">מספר אירועים</T>
  </Fig>;
}

// E5: electromagnetic spectrum by wavelength (log scale). Band edges are conventional and overlap;
// the ionizing edge (about 10 eV, 124 nm) comes from E[eV] = 1240 / lambda[nm].
export function EmBands({accent}){
  const x0=40,x1=520,yb=120,uMin=-1,uMax=13;
  const X=u=>x0+((u-uMin)/(uMax-uMin))*(x1-x0);
  const bands=[
    {a:-1,b:0,n:'רדיו',c:'#6aa7f5'},
    {a:0,b:3,n:'מיקרוגל',c:'#59c9c0'},
    {a:3,b:6.15,n:'אינפרא-אדום',c:'#e88b6d'},
    {a:6.15,b:6.4,n:'',c:'#7ddc7d'},
    {a:6.4,b:8,n:'UV',c:'#b48cf0'},
    {a:8,b:11,n:'X',c:'#f09797'},
    {a:11,b:13,n:'γ',c:accent}
  ];
  const ion=-Math.log10(1.24e-7);
  const ticks=[[0,'1 m'],[3,'1 mm'],[6,'1 μm'],[9,'1 nm'],[12,'1 pm']];
  return <Fig label="הספקטרום האלקטרומגנטי לפי אורך גל בסקאלה לוגריתמית: רדיו, מיקרוגל, אינפרא-אדום, אור נראה, אולטרה-סגול, קרני X וגמא. אורך גל קטן יותר פירושו אנרגיה גבוהה יותר. קו היינון בכעשרה אלקטרון-וולט, כ-124 ננומטר, הוא סף טיפוסי בלבד; הסף תלוי בחומר. גבולות הרצועות מקורבים וחופפים." viewBox="0 0 560 220">
    {bands.map((b,i)=><g key={i}><rect x={X(b.a)} y={yb-34} width={X(b.b)-X(b.a)} height={34} fill={b.c} opacity={0.75}/>{b.n?<T x={(X(b.a)+X(b.b))/2} y={yb-14} size={12} fill="#10131a">{b.n}</T>:null}</g>)}
    <T x={X(6.275)} y={yb-44} size={12} fill={C.ink}>נראה</T>
    <L x1={X(ion)} y1={yb-60} x2={X(ion)} y2={yb+6} stroke={C.ink} dash="4 4"/>
    <T x={X(ion)-6} y={yb-70} size={12} fill={C.ink}>סף יינון טיפוסי ≈10 eV, תלוי בחומר</T>
    <L x1={x0} y1={yb} x2={x1} y2={yb}/>
    {ticks.map(([u,l])=><g key={l}><L x1={X(u)} y1={yb} x2={X(u)} y2={yb+6}/><T x={X(u)} y={yb+22} size={11} ltr fill={C.ink}>{l}</T></g>)}
    <T x={(x0+x1)/2} y={yb+50} size={12}>אורך גל (סקאלה לוגריתמית): שמאלה אורך גל גדול ואנרגיה נמוכה, ימינה אנרגיה גבוהה</T>
    <T x={(x0+x1)/2} y={yb+72} size={11} fill={C.mut}>גבולות הרצועות מקורבים וחופפים; X וגמא נבדלות במקור, לא רק באנרגיה</T>
  </Fig>;
}

// E5: direction of each decay on the chart of nuclides (x = neutrons N, y = protons Z). Original drawing.
export function DecayDirections({accent}){
  const cx=300,cy=105,u=40;
  const arrows=[
    {dx:-2,dy:-2,c:'#f09797',n:'α',lx:-30,ly:16},
    {dx:-1,dy:1,c:'#6aa7f5',n:'β−',lx:-30,ly:-6},
    {dx:1,dy:-1,c:'#7ddc7d',n:'β+ / EC',lx:50,ly:16},
    {dx:0,dy:-1,c:'#f0c978',n:'p',lx:-18,ly:16},
    {dx:-1,dy:0,c:'#c79af0',n:'n',lx:-18,ly:-8}
  ];
  return <Fig label="כיוון הדעיכות על מפת הגרעינים: ציר אופקי מספר ניטרונים N וציר אנכי מספר פרוטונים Z. אלפא: N ו-Z יורדים ב-2. בטא מינוס: N יורד ב-1 ו-Z עולה ב-1. בטא פלוס ולכידת אלקטרון: N עולה ב-1 ו-Z יורד ב-1. פליטת פרוטון: Z יורד ב-1. פליטת ניטרון: N יורד ב-1. גמא לא משנה את N או Z." viewBox="0 0 560 250">
    <L x1={60} y1={220} x2={520} y2={220}/>
    <L x1={60} y1={220} x2={60} y2={20}/>
    <T x={540} y={220} size={12} ltr fill={C.ink}>N</T>
    <T x={60} y={12} size={12} ltr fill={C.ink}>Z</T>
    <Dot cx={cx} cy={cy} r={7} fill={accent}/>
    <Lab x={cx+62} y={cy-14} fill={C.ink}>גרעין האם</Lab>
    {arrows.map((a,i)=><g key={a.n}><Arrow x1={cx} y1={cy} x2={cx+a.dx*u} y2={cy-a.dy*u} stroke={a.c} id={'dd'+i}/><Lab x={cx+a.dx*u+a.lx} y={cy-a.dy*u+a.ly} ltr fill={a.c}>{a.n}</Lab></g>)}
    <Lab x={cx+130} y={60} fill={C.ink}>גמא: אותו גרעין, פחות אנרגיה</Lab>
  </Fig>;
}

// E5: X-ray tube spectrum = continuous bremsstrahlung plus characteristic K lines. Schematic, no energy scale.
export function XraySpectrum({accent}){
  const x0=60,x1=500,yb=190,top=40;
  const X=u=>x0+u*(x1-x0);
  const g=u=>(1-u)*(1-Math.exp(-u*10));
  const Y=u=>yb-g(u)*(yb-top); // same scale as the dashed line yb-(1-u)*(yb-top): filtering only lowers intensity
  const d='M'+Array.from({length:101},(_,i)=>`${X(i/100).toFixed(1)},${Y(i/100).toFixed(1)}`).join(' L');
  const spike=(u,h,c)=><path d={`M${X(u)-3},${Y(u)} L${X(u)},${Y(u)-h} L${X(u)+3},${Y(u)}`} stroke={c} strokeWidth={2.4} fill="none"/>;
  return <Fig label="ספקטרום שפופרת רנטגן סכמטי ללא סקאלה: עקומה רציפה של קרינת בלימה שעולה ויורדת עד האנרגיה המרבית Emax, וקו מקווקו לקרינת בלימה ללא סינון בוואקום. על העקומה שני פסים חדים של קרינה אופיינית: Kα מירידת אלקטרון מקליפה L ל-K, ו-Kβ מקליפה M ל-K, מעט באנרגיה גבוהה יותר וחלש יותר מ-Kα. העקומה המלאה אחרי סינון נמוכה מהקו המקווקו בכל אנרגיה ומתקרבת אליו באנרגיות הגבוהות." viewBox="0 0 560 250">
    <L x1={x0} y1={yb} x2={x1+20} y2={yb}/>
    <L x1={x0} y1={yb} x2={x0} y2={20}/>
    <L x1={X(0.0)} y1={top} x2={X(1)} y2={yb} stroke={C.mut} dash="5 4"/>
    <path d={d} stroke={accent} strokeWidth={2.4} fill="none"/>
    {spike(0.5,100,'#f0c978')}
    {spike(0.6,30,'#c79af0')}
    <Lab x={X(0.5)+26} y={Y(0.5)-92} ltr fill="#f0c978" w={34}>Kα</Lab>
    <Lab x={X(0.6)+28} y={Y(0.6)-22} ltr fill="#c79af0" w={34}>Kβ</Lab>
    <Lab x={X(0.84)} y={52} fill={C.ink}>קרינה אופיינית: פסים חדים</Lab>
    <Lab x={X(0.3)} y={yb-40} fill={C.ink}>קרינת בלימה: רציף</Lab>
    <Lab x={X(0.3)-10} y={42} fill={C.mut} size={11}>מקווקו: ללא סינון</Lab>
    <L x1={x1} y1={yb} x2={x1} y2={yb-12} stroke={C.mut}/>
    <T x={x1} y={yb+18} size={12} ltr fill={C.ink}>Emax</T>
    <T x={(x0+x1)/2} y={yb+38} size={12}>אנרגיית הפוטון (ציר סכמטי)</T>
    <T x={x0+6} y={14} size={12} anchor="start">עוצמה יחסית</T>
  </Fig>;
}
