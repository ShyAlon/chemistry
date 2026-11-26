import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Dot,Box} from './figures-core.jsx';
import {seg,lerp,clamp01} from './anim-core.jsx';

// Animated versions of existing figures, keyed by the same figure id the
// lessons already use, so no lesson text changes when a figure gains motion.
// Every frame at the poster time (t = 1) is a finished picture of the idea.

// SS6: absorb 2 eV, shed 0.3 eV as heat, optionally emit 1.7 eV (Eg = 1.7 eV).
const Y=e=>200-e*60;
const fillc='#2d4a6b';
const EG=1.7;
function exciteFrame(t,{params}){
  const E=params.photonE,N=params.count;const absorbed=E>=EG-1e-9;const heat=Math.max(0,E-EG);const hasHeat=heat>0.04;
  const p1=seg(t,0,0.33),p2=seg(t,0.34,0.66),p3=seg(t,0.67,1);
  const done=t>=1-1e-9;
  const row=i=>done?1:(i===0?(t<0.34?1:0.4):i===1?(t>=0.34&&t<0.67?1:0.4):(t>=0.67?1:0.4));
  const y0=Y(0)-2,yE=Y(E),y17=Y(EG);
  const yEnd=absorbed?(hasHeat?y17:yE):y0;
  const ex=t<0.34?90:t<0.67?lerp(90,150,p2):lerp(150,210,p3);
  const ey=!absorbed?y0:t<0.34?lerp(y0,yE,p1):t<0.67?lerp(yE,y17,p2):lerp(y17,Y(0)+2,p3);
  const wave=[];for(let i=0;i<=24;i++){const x=230+i*(62/24)*p3;wave.push(`${x.toFixed(1)},${(Y(1.2)+Math.sin(i*1.3)*5*p3).toFixed(1)}`)}
  const col=!absorbed?'#a58bf0':t<0.34?'#a58bf0':t<0.67?'#f09797':'#7aa7f0';
  const extra=[];for(let k=1;k<N;k++)extra.push(<Dot key={k} cx={ex+k*9} cy={ey} r={4} fill={col}/>);
  const mid=(E+EG)/2;
  const pass=[];for(let i=0;i<=40;i++){const x=i*(250/40)*p1;pass.push(`${x.toFixed(1)},${(yE+Math.sin(i*1.3)*5).toFixed(1)}`)}
  const jumping=absorbed&&((t>0&&t<0.34&&p1<0.999)||(t>=0.67&&t<1&&p3<0.999));
  return <>
    <rect x={50} y={Y(2.7)} width={200} height={Y(1.7)-Y(2.7)} fill="none" stroke={C.mut} strokeWidth={1.6}/>
    <rect x={50} y={Y(0)} width={200} height={40} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
    <T x={70} y={Y(2.7)+16} size={12} anchor="start" ltr fill={C.ink}>CB</T><T x={70} y={Y(0)+26} size={12} anchor="start" ltr fill={C.ink}>VB</T>
    <L x1={250} y1={Y(1.7)} x2={286} y2={Y(1.7)} stroke={C.soft} dash="3 3"/>
    {absorbed&&p1>0.04&&<Arrow x1={90} y1={y0} x2={90} y2={lerp(y0,yE,p1)} stroke="#a58bf0" id="ere1"/>}
    {!absorbed&&p1>0.04&&<polyline points={pass.join(' ')} fill="none" stroke="#a58bf0" strokeWidth={2} strokeDasharray="2 3" opacity={0.7}/>}
    {absorbed&&hasHeat&&p2>0.04&&<Arrow x1={150} y1={yE} x2={150} y2={lerp(yE,y17+3,p2)} stroke="#f09797" dash="4 3" id="ere2"/>}
    {absorbed&&p3>0.04&&<Arrow x1={210} y1={y17} x2={210} y2={lerp(y17,Y(0)+3,p3)} stroke="#7aa7f0" id="ere3"/>}
    {absorbed&&p3>0.04&&<polyline points={wave.join(' ')} fill="none" stroke="#7aa7f0" strokeWidth={2}/>}
    {extra}
    <g opacity={jumping?0.3:1}><Dot cx={ex} cy={ey} r={5} fill={col}/></g>
    {absorbed&&p1>0.5&&<T x={100} y={lerp(y0,yE,0.5)+4} size={13} anchor="start" ltr fill="#a58bf0">1</T>}
    {absorbed&&hasHeat&&p2>0.5&&<T x={160} y={Y(mid)} size={13} anchor="start" ltr fill="#f09797">2</T>}
    {absorbed&&p3>0.5&&<T x={220} y={Y(0.9)} size={13} anchor="start" ltr fill="#7aa7f0">3</T>}
    <g opacity={row(0)}><T x={298} y={36} size={12} anchor="start" fill={C.ink}>{absorbed?'בליעה של פוטון':'פוטון, אין בליעה'}</T><T x={540} y={36} size={12} anchor="end" ltr fill="#a58bf0">{E.toFixed(1)} eV</T></g>
    <g opacity={absorbed?row(1):0.4}><T x={298} y={76} size={12} anchor="start" fill={C.ink}>רגיעה תרמית, חום</T><T x={540} y={76} size={12} anchor="end" ltr fill="#f09797">{absorbed?heat.toFixed(1)+' eV':'—'}</T></g>
    <g opacity={absorbed?row(2):0.4}><T x={298} y={116} size={12} anchor="start" fill={C.ink}>פליטה, אם מתרחשת</T><T x={540} y={116} size={12} anchor="end" ltr fill="#7aa7f0">{absorbed?'1.7 eV':'—'}</T></g>
    <T x={298} y={160} size={12} anchor="start" ltr fill={C.mut}>Eg = 1.7 eV</T>
    {t>0&&t<1&&absorbed&&<T x={298} y={202} size={11} anchor="start" fill={C.mut}>בזמן המעבר האלקטרון אינו נמצא בפער האסור</T>}
    <T x={298} y={180} size={11} anchor="start" fill={C.mut}>{!absorbed?'אנרגיית הפוטון נמוכה מהפער, אין בליעה (מודל אידיאלי)':hasHeat?'הפוטון הנפלט ארוך גל יותר מהנבלע':'הפוטון הנפלט באורך גל זהה לנבלע'}</T>
  </>;
}


// SS7: three ways to create an electron-hole pair. The temperature parameter
// drives the thermal panel. Physics (see the per-animation sources sheet):
// ni = sqrt(Nc*Nv)*exp(-Eg/2kBT) is continuous and nonzero at EVERY finite
// temperature, so the thermal pair is never removed; low temperature only
// makes it faint and rare. The panel shows a didactic pair count (1, +1 at
// 400 K, +2 at 500 K) and, under the figure, the actual computed ratio
// ni(T)/ni(300 K) for the course sample gap Eg = 1.7 eV, so the discrete
// picture is never mistaken for a quantitative prediction.
// Normalized-model assumptions: fixed gap (real Eg(T) shrinks slightly with
// T), effective densities of states scaled as T^(3/2) (the prefactor in
// niRel), non-degenerate Maxwell-Boltzmann statistics. A normalized teaching
// ratio, not a material prediction.
const CC_PANELS=[
  {x:380,n:'עירור אופטי',sub:'hν ≥ Eg',ltrSub:true,c:'#a58bf0',seg:[0,0.33]},
  {x:200,n:'עירור חשמלי',sub:'שדה חזק',ltrSub:false,c:'#f0c978',seg:[0.34,0.66]},
  {x:20,n:'עירור תרמי',sub:'חימום',ltrSub:false,c:'#f09797',seg:[0.67,1],thermal:true},
];
const KB=8.617e-5,EG7=1.7;
const niRel=temp=>Math.pow(temp/300,1.5)*Math.exp(EG7/(2*KB)*(1/300-1/temp));
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const fmtRel=r=>{if(r>=0.05&&r<20)return r.toFixed(1).replace(/\.0$/,'')+'×';
  let e=Math.floor(Math.log10(r)),m=Math.round(r/Math.pow(10,e));if(m===10){m=1;e+=1}
  return m+'·10'+String(e).split('').map(d=>SUP[d]).join('')+'×';};
function carrierFrame(t,{params}){
  const temp=params.temp;
  const extrasN=temp>=500?2:temp>=400?1:0;
  const faint=temp<300;
  const done=t>=1-1e-9;
  const fillc='#2d4a6b';
  return <>
    {CC_PANELS.map((p,i)=>{
      const pr=seg(t,p.seg[0],p.seg[1]);
      const active=t>=p.seg[0]-1e-9&&(i===2||t<CC_PANELS[i+1].seg[0]-1e-9);
      const dim=done?1:(active?1:0.45);
      const pairOp=p.thermal&&faint?0.35:1;
      const ey=lerp(140,44,pr);
      const holeOp=seg(pr,0.25,0.6)*pairOp;
      const extras=[];
      if(p.thermal)for(let k=1;k<=extrasN;k++)extras.push(<g key={k}>
        <Dot cx={p.x+58+k*18} cy={44} r={5} fill="#7aa7f0" opacity={holeOp}/>
        <Dot cx={p.x+94-k*18} cy={128} r={6} fill="none" stroke="#f09797" w={2} opacity={holeOp}/>
      </g>);
      return <g key={i} opacity={dim}>
        <Box x={p.x} y={4} w={160} h={190} fill={C.faint} stroke={p.c}/>
        <rect x={p.x+24} y={22} width={90} height={44} fill="none" stroke={C.mut} strokeWidth={1.6}/>
        <rect x={p.x+24} y={120} width={90} height={56} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
        <T x={p.x+30} y={58} size={11} anchor="start" ltr fill={C.ink}>CB</T>
        <T x={p.x+30} y={168} size={11} anchor="start" ltr fill={C.ink}>VB</T>
        {pr>0.02&&<g opacity={pairOp}><Arrow x1={p.x+58} y1={118} x2={p.x+58} y2={lerp(118,50,pr)} stroke={p.c} dash={p.thermal?'2 3':undefined} w={p.thermal?2.4:1.6} id={'cc'+i}/></g>}
        {pr>0.02&&<Dot cx={p.x+58} cy={ey} r={p.thermal?5:6} fill="#7aa7f0" opacity={pairOp}/>}
        {pr>0.9&&<T x={p.x+80} y={36} size={10} ltr fill="#7aa7f0" opacity={pairOp}>e⁻</T>}
        {holeOp>0.02&&<Dot cx={p.x+94} cy={128} r={6} fill="none" stroke="#f09797" w={2} opacity={holeOp}/>}
        {holeOp>0.9&&<T x={p.x+94} y={148} size={10} ltr fill="#f09797">h⁺</T>}
        {extras}
        {p.thermal&&faint&&pr>0.9&&<T x={p.x+80} y={100} size={9} anchor="middle" fill={C.mut}>הסתברות זעירה, לא אפס</T>}
        {p.thermal&&extrasN>0&&<T x={p.x+80} y={100} size={9} anchor="middle" fill={C.mut}>מספר סכמתי של זוגות</T>}
        <T x={p.x+80} y={214} size={13} weight="bold" fill={C.ink}>{p.n}</T>
        {p.ltrSub?<T x={p.x+80} y={232} size={12} ltr fill={p.c}>{p.sub}</T>:<T x={p.x+80} y={232} size={12} fill={p.c}>{p.sub}</T>}
      </g>;
    })}
    <T x={300} y={256} size={11} anchor="middle" ltr fill={C.mut}>{'ni(T)/ni(300K) ≈ '+fmtRel(niRel(temp))}</T>
  </>;
}

export const animations={
  'excite-relax-emit':{
    id:'excite-relax-emit',duration:9,viewBox:'0 -10 560 250',
    label:o=>o.photonE>=EG-1e-9?'הנפשה של דוגמת הקורס עם פער 1.7 eV: אלקטרון בולע פוטון של 2 eV ועולה, מאבד 0.3 eV כחום, ואז יכול לפלוט פוטון של 1.7 eV':'הנפשה: פוטון שאנרגיתו נמוכה מהפער 1.7 eV אינו נבלע, והאלקטרון נשאר בפס הערכיות',
    stages:[{at:0,label:'1. בליעה של פוטון'},{at:0.34,label:'2. רגיעה תרמית'},{at:0.67,label:'3. פליטה, אם מתרחשת'}],
    params:[{id:'photonE',label:'אנרגיית הפוטון',min:1.0,max:2.5,step:0.1,value:2.0,unit:'eV'},{id:'count',label:'מספר אלקטרונים (להמחשה)',min:1,max:6,step:1,value:1}],
    stageLabel:(i,o)=>o.photonE>=EG-1e-9?['1. בליעה של פוטון','2. רגיעה תרמית','3. פליטה, אם מתרחשת'][i]:['1. הפוטון אינו נבלע','2. אין רגיעה תרמית','3. אין פליטה'][i],
    frame:(t,o)=>exciteFrame(t,o)
  },
  'carrier-creation':{
    id:'carrier-creation',duration:9,viewBox:'0 -10 560 276',
    label:o=>'הנפשה: שלוש דרכים ליצור זוג אלקטרון-חור במוליך למחצה - בליעת פוטון, שדה חשמלי חזק וחימום; צפיפות הזוגות התרמית גדלה מעריכית עם הטמפרטורה (ni פרופורציונית ל-T^1.5 כפול e בחזקת מינוס Eg חלקי 2kBT) ואינה מתאפסת באף טמפרטורה; כעת '+Math.round(o.temp)+' קלווין',
    stages:[{at:0,label:'1. עירור אופטי (פוטון)'},{at:0.34,label:'2. עירור חשמלי (שדה חזק)'},{at:0.67,label:'3. עירור תרמי (חימום)'}],
    params:[{id:'temp',label:'הטמפרטורה',min:200,max:500,step:50,value:300,unit:'K'}],
    stageLabel:(i,o)=>i<2?['1. עירור אופטי (פוטון)','2. עירור חשמלי (שדה חזק)'][i]:(o.temp<300?'3. עירור תרמי (חימום): מעט זוגות, לא אפס':'3. עירור תרמי (חימום): יותר זוגות ככל שחם יותר'),
    frame:(t,o)=>carrierFrame(t,o)
  }
};
