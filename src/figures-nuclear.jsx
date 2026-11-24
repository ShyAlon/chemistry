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
    <T x={395} y={50} size={12}>מרסן לחץ</T>
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
    {y:30,a:X(10),b:X(100),t:'אפקט פוטואלקטרי',f:'Z⁵/E³·⁵',c:'#f0c978'},
    {y:92,a:X(100),b:X(10000),t:'פיזור קומפטון',f:'Z/E',c:accent},
    {y:154,a:X(1022),b:X(100000),t:'יצירת זוגות',f:'Z²·lnE',c:'#c79af0'}];
  return <Fig label="אינטראקציות פוטונים בחומר לפי אנרגיה: אפקט פוטואלקטרי עד כ-100 keV, פיזור קומפטון מכ-100 keV עד כ-10 MeV, יצירת זוגות מעל 1.022 MeV" viewBox="0 -90 560 346">
    {bars.map(r=><g key={r.t}>
      <Box x={r.a} y={r.y} w={r.b-r.a} h={52} fill={C.faint} stroke={r.c}/>
      <T x={(r.a+r.b)/2} y={r.y+22} size={13} fill={C.ink}>{r.t}</T>
      <T x={(r.a+r.b)/2} y={r.y+41} size={12} ltr fill={r.c}>{r.f}</T>
    </g>)}
    <L x1={X(1022)} y1={14} x2={X(1022)} y2={222} stroke={C.dim} dash="4 4"/>
    <T x={X(1022)} y={6} size={12} ltr fill={C.ink}>1.022 MeV</T>
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

// E8: reactor generations I to V.
export function ReactorGenerations({accent}){
  const g=[{x:450,r:'I',a:'שנות',b:'50-60',d:'ניסיוני'},{x:345,r:'II',a:'שנות',b:'70-90',d:'מסחרי'},{x:240,r:'III',a:'סוף שנות',b:'90s+',d:'בטיחות פסיבית'},{x:135,r:'IV',a:'בפיתוח',d:'פחות פסולת'},{x:30,r:'V',a:'עתידי',d:'היתוך'}];
  return <Fig label="דורות הכורים: דור 1 שנות ה-50 וה-60 ניסיוני, דור 2 שנות ה-70 עד ה-90 מסחרי, דור 3 בטיחות פסיבית, דור 4 בפיתוח, דור 5 עתידי על בסיס היתוך" viewBox="0 -90 560 285">
    {g.map(e=><g key={e.r}>
      <Box x={e.x} y={0} w={98} h={130} fill={C.faint} stroke={e.r==='III'?accent:C.line}/>
      <T x={e.x+49} y={20} size={11}>דור</T>
      <T x={e.x+49} y={46} size={22} weight="bold" ltr fill={C.ink}>{e.r}</T>
      <T x={e.x+49} y={72} size={12}>{e.a}</T>
      {e.b&&<T x={e.x+49} y={90} size={12} ltr>{e.b}</T>}
      <T x={e.x+49} y={116} size={12} fill={C.ink}>{e.d}</T>
    </g>)}
    <Arrow x1={540} y1={152} x2={20} y2={152} stroke={C.dim} id="gentime"/>
    <T x={280} y={172} size={12}>זמן</T>
  </Fig>;
}
