import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Dot,Box,Curve} from './figures-core.jsx';
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

// Nuclear half-life: the ideal curve N/N0 = 2^(-t/t1/2) as in the lesson figure, plus one
// random sample of n nuclei. Every nucleus decays at its own random time (fixed seed, so a
// replay is identical); the staircase is ONE realization, not the expectation.
function rng(seed){let a=(seed*2654435761)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const decayTimes=(n,seed)=>{const r=rng(seed*7919+13);return Array.from({length:n},()=>-Math.log(1-r())/Math.LN2).sort((a,b)=>a-b)}; // in half-lives
function halfLifeFrame(t,{accent,params}){
  // Two displays of the same decay law N = N0*2^(-t/t1/2):
  //  - default (half-life 1 s): the lesson's normalized view, 0..4 t/t1/2, poster
  //    identical to the static lesson figure;
  //  - any other half-life: a FIXED physical window of 0..20 s independent of the
  //    half-life, so dragging the slider visibly changes how much decays in the
  //    same physical time - shorter half-life = faster decay over the same seconds.
  const n=params.count,seed=params.run,hl=params.halfLife;
  const norm=hl===1;
  const el=norm?4*t:20*t;                       // elapsed: half-lives (norm) or seconds (phys)
  const X=norm?(u=>80+90*u):(sec=>80+19*sec);
  const at=x=>norm?x:x/hl;                      // x-position time -> half-lives elapsed
  const upto=Math.round(el*(norm?25:5));
  const pts=Array.from({length:upto+1},(_,i)=>{const q=norm?i/25:i/5;return `${i===0?'M':'L'}${X(q).toFixed(1)},${Yf_(Math.pow(.5,at(q)))}`}).join(' ');
  function Yf_(f){return (245-190*f).toFixed(1)}
  const Yf=f=>245-190*f;
  let stair=null,left=0;
  if(n>0){const d=decayTimes(n,seed);const phys=k=>d[k]*hl;let k=0;while(k<n&&(norm?d[k]:phys(k))<=el)k++;left=n-k;
    const seg=[`M${X(0)},${Yf(1)}`];let prev=1;for(let i=0;i<k;i++){const f=(n-i-1)/n;const xt=X(norm?d[i]:d[i]*hl);seg.push(`L${xt.toFixed(1)},${Yf(prev).toFixed(1)}`,`L${xt.toFixed(1)},${Yf(f).toFixed(1)}`);prev=f}
    seg.push(`L${X(el).toFixed(1)},${Yf(prev).toFixed(1)}`);stair=seg.join(' ')}
  const exp=n*Math.pow(.5,norm?el:el/hl);
  const ticks=norm?[0,1,2,3,4].map(u=>({x:u,txt:''+u,lv:u})):[0,5,10,15,20].map(sec=>({x:sec,txt:sec+' s'}));
  const dots=norm?[]:[1,2,3,4,5,6,7,8,9,10,20].map(i=>i*hl).filter(sec=>sec<=20&&el>=sec-1e-9);
  return <>
    <L x1={80} y1={40} x2={80} y2={245}/><L x1={80} y1={245} x2={460} y2={245}/>
    {upto>0&&<Curve d={pts} stroke={accent} w={3}/>}
    {ticks.filter(q=>el>=q.x-1e-9).map(q=><T key={q.x} x={X(q.x)} y={271} size={18} ltr>{q.txt}</T>)}
    {(norm?ticks.filter(q=>q.lv!==undefined&&el>=q.x-1e-9).map(q=>({sec:q.lv,lv:q.lv})):dots.map(sec=>({sec,lv:sec/hl}))).map(q=><Dot key={'d'+q.sec} cx={X(q.sec)} cy={Yf(Math.pow(.5,q.lv))} fill={accent}/>)}
    <T x={45} y={55} size={18} ltr>1</T><T x={42} y={155} size={18} ltr>0.5</T><T x={42} y={205} size={18} ltr>0.25</T>
    <T x={130} y={25} size={18} ltr>N / N₀</T><T x={300} y={307} size={20} ltr>{norm?'t / t½':'t (s)'}</T>
    {stair&&<Curve d={stair} stroke="#f0c978" w={2} dash="0"/>}
    {n>0&&<g>
      <T x={540} y={107} size={13} anchor="end" fill="#f0c978">דגימה אקראית אחת (הרצה קבועה)</T>
      <T x={540} y={129} size={13} anchor="end" ltr fill="#f0c978">{left} / {n}</T>
      <T x={540} y={155} size={13} anchor="end" fill={accent}>ממוצע צפוי לדגימה כזו</T>
      <T x={540} y={177} size={13} anchor="end" ltr fill={accent}>{exp.toFixed(1)}</T>
    </g>}
  </>;
}

// The long honesty note about one random realization lives in the lesson caption
// (animFigureNotes in main.jsx), not in the plot, so it can wrap on narrow screens.

// Chain reaction: generations appear one after another. The middle panel follows k, the
// effective multiplication from one generation of fissions to the next (expected value,
// not the number of neutrons released per fission). Default k = 1 is the lesson's panel.
function chainFrame(t,{accent,params}){
  const k=params.k;const crit=Math.round(k*10)===10;
  const gens=[seg(t,0,0.2),seg(t,0.34,0.54),seg(t,0.67,0.87)];
  const mid={x:195,t:crit?'קריטית':k>1?'על־קריטית':'תת־קריטית',c:crit?accent:k>1?'#f09797':'#7aa7f0',n:crit?'קצב ביקועים קבוע':k>1?'גדלה מעריכית':'דועכת',vals:[1,k,k*k]};
  const P=[{x:380,t:'על־קריטית',k:'k > 1',vals:[1,2,4],n:'גדלה מעריכית',c:'#f09797'},mid,{x:10,t:'תת־קריטית',k:'k < 1',vals:[4,2,1],n:'דועכת',c:'#7aa7f0'}];
  const dots=(p,r)=>{const v=p.vals[r],full=Math.floor(v+1e-9),fr=v-full,m=full+(fr>0.02?1:0);const a=gens[r];if(a<=0.02)return null;
    return Array.from({length:m},(_,j)=>{const frac=j>=full;return <Dot key={j} cx={p.x+85+(j-(m-1)/2)*30} cy={82+r*42} r={(frac?7*Math.sqrt(fr):7)*a} fill={p.c} opacity={frac?0.6:1}/>})};
  return <>
    {P.map((p,i)=><g key={i}>
      <Box x={p.x} y={0} w={170} h={218} fill={C.faint} stroke={p.c}/>
      <T x={p.x+85} y={27} size={16} weight="bold" fill={C.ink}>{p.t}</T>
      {i===1?<T x={p.x+85} y={48} size={13} ltr fill={p.c}>{crit?'k = 1':'k = '+k.toFixed(1)}</T>:<T x={p.x+85} y={48} size={13} ltr fill={p.c}>{p.k}</T>}
      {[0,1,2].map(r=><g key={r}>{dots(p,r)}{r<2&&gens[r+1]>0.02&&<L x1={p.x+85} y1={92+r*42} x2={p.x+85} y2={110+r*42} stroke={C.dim}/>}</g>)}
      <T x={p.x+85} y={204} size={13} fill={C.mut}>{p.n}</T>
    </g>)}
    <T x={280} y={238} size={13}>כל נקודה היא ביקוע; השורות הן דורות עוקבים</T>
    {!crit&&<T x={280} y={256} size={12} fill={C.mut}>בלוח האמצעי: ממוצע צפוי, נקודה חלקית היא שבר של ביקוע</T>}
  </>;
}

// N3: LaMer burst nucleation (qualitative, no numeric values - the lesson figure
// is a didactic sketch). The monomer production rate decides the regime
// (LaMer & Dinegar 1950): slow production never crosses the nucleation
// threshold; the classic controlled rate gives one short burst; production
// faster than consumption re-builds supersaturation and nucleation repeats,
// giving non-uniform sizes. Default rate reproduces the static lesson figure.
const LAMER_D='M70 205 C130 200 170 150 195 90 C205 62 215 45 235 42 C255 40 262 70 275 92 C300 130 340 142 380 146 C430 149 480 150 520 150';
const LAMER_SEGS=[[[70,205],[130,200],[170,150],[195,90]],[[195,90],[205,62],[215,45],[235,42]],[[235,42],[255,40],[262,70],[275,92]],[[275,92],[300,130],[340,142],[380,146]],[[380,146],[430,149],[480,150],[520,150]]];
const bez=(p,s)=>{const q=1-s;return [q*q*q*p[0][0]+3*q*q*s*p[1][0]+3*q*s*s*p[2][0]+s*s*s*p[3][0],q*q*q*p[0][1]+3*q*q*s*p[1][1]+3*q*s*s*p[2][1]+s*s*s*p[3][1]]};
const LAMER_PTS=[];for(const g of LAMER_SEGS)for(let i=0;i<=40;i++)LAMER_PTS.push(bez(g,i/40));
const lamerY=(pts,x)=>{for(let i=1;i<pts.length;i++)if(pts[i][0]>=x){const a=pts[i-1],b=pts[i];return a[1]+(b[1]-a[1])*(x-a[0])/Math.max(1e-6,b[0]-a[0])}return pts[pts.length-1][1]};
// Fast-rate sawtooth: first burst at u1, drop, supersaturation rebuilds, burst repeats.
const fastY=(r,u)=>{const u1=0.28/r;if(u<=u1)return lamerY(LAMER_PTS,70+185*(u/u1));
  const p=0.45/r,v=(u-u1)%p,k=v/p;
  return k<0.75?100-58*(k/0.75):42+58*((k-0.75)/0.25)};
const slowY=u=>210-75*Math.pow(u,0.9);
function lamerFrame(t,{accent,params}){
  const r=params.regime===0?0.5:params.regime===2?2:1,done=t>=1-1e-9,slow=params.regime===0,fast=params.regime===2;
  const u=clamp01(t),clipW=70+460*u;
  let d=LAMER_D;
  if(slow){const p=[];for(let i=0;i<=40;i++){const uu=i/40;p.push((70+450*uu).toFixed(1)+','+slowY(uu).toFixed(1))}d='M'+p.join(' L')}
  if(fast){const p=[];for(let i=0;i<=160;i++){const uu=i/160;p.push((70+450*uu).toFixed(1)+','+fastY(r,uu).toFixed(1))}d='M'+p.join(' L')}
  const xb1=70+450*(0.28/r);
  const curX=70+450*u,curY=slow?slowY(u):fast?fastY(r,u):lamerY(LAMER_PTS,curX);
  const stageText=slow?'ייצור איטי: מתחת לרמה הקריטית - בלי פרץ גרעינות; היווצרות הדרגתית ולא אחידה':fast?'ייצור מהיר: הרוויה נבנית שוב ושוב והגרעינות חוזרת (ציור סכמטי) - הגדלים אינם אחידים':'';
  return <>
    <defs><clipPath id="lm-clip"><rect x={0} y={-10} width={clipW} height={290}/></clipPath></defs>
    {!slow&&!fast&&<>
      <rect x={70} y={10} width={125} height={200} fill={C.faint} opacity={0.55}/>
      <rect x={195} y={10} width={80} height={200} fill={accent} opacity={0.14}/>
      <rect x={275} y={10} width={245} height={200} fill={C.faint} opacity={0.55}/>
    </>}
    {slow&&<rect x={70} y={10} width={450} height={200} fill={C.faint} opacity={0.55}/>}
    {fast&&<><rect x={70} y={10} width={xb1-70} height={200} fill={C.faint} opacity={0.55}/><rect x={xb1} y={10} width={520-xb1} height={200} fill={accent} opacity={0.14}/></>}
    <L x1={60} y1={210} x2={525} y2={210}/><L x1={60} y1={210} x2={60} y2={8}/>
    <Arrow x1={510} y1={210} x2={526} y2={210} stroke={C.line} id="lm-x"/><Arrow x1={60} y1={22} x2={60} y2={8} stroke={C.line} id="lm-y"/>
    <L x1={60} y1={90} x2={520} y2={90} stroke="#f0c978" dash="5 4"/>
    <L x1={60} y1={150} x2={520} y2={150} stroke="#f09797" dash="5 4"/>
    <g clipPath="url(#lm-clip)"><path d={d} stroke={accent} strokeWidth={2.8} fill="none" strokeLinecap="round"/></g>
    <T x={84} y={84} size={11} ltr fill="#f0c978" anchor="start">C_min</T><T x={84} y={144} size={11} ltr fill="#f09797" anchor="start">C_s</T>
    <T x={430} y={80} size={12} fill="#f0c978">סף גרעינות</T><T x={430} y={170} size={12} fill="#f09797">ריכוז רוויה</T>
    {!slow&&!fast&&<>
      <T x={132} y={30} size={13} weight="bold" ltr fill={C.ink}>I</T><T x={235} y={30} size={13} weight="bold" ltr fill={C.ink}>II</T><T x={350} y={30} size={13} weight="bold" ltr fill={C.ink}>III</T>
      <T x={132} y={50} size={11} fill={C.mut}>עלייה</T><T x={235} y={70} size={11} fill={accent}>פרץ גרעינות</T><T x={350} y={50} size={11} fill={C.mut}>גדילה בלבד</T>
    </>}
    {slow&&<><T x={295} y={30} size={13} weight="bold" ltr fill={C.ink}>I</T><T x={295} y={50} size={11} fill={C.mut}>עלייה בלבד</T></>}
    {fast&&<><T x={(70+xb1)/2} y={30} size={13} weight="bold" ltr fill={C.ink}>I</T><T x={(xb1+520)/2} y={30} size={11} fill={accent}>פרצי גרעינות חוזרים</T></>}
    {stageText&&<T x={290} y={252} size={12} fill={accent}>{stageText}</T>}
    {!done&&u>0.02&&<Dot cx={curX} cy={curY} r={5} fill={accent}/>}
    <T x={290} y={236} size={12} fill={C.mut}>זמן</T><T x={34} y={20} size={11} fill={C.mut}>ריכוז</T>
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
    id:'carrier-creation',duration:9,viewBox:'0 -96 560 362',
    label:o=>'הנפשה: שלוש דרכים ליצור זוג אלקטרון-חור במוליך למחצה - בליעת פוטון, שדה חשמלי חזק וחימום; צפיפות הזוגות התרמית גדלה מעריכית עם הטמפרטורה (ni פרופורציונית ל-T^1.5 כפול e בחזקת מינוס Eg חלקי 2kBT) ואינה מתאפסת באף טמפרטורה; כעת '+Math.round(o.temp)+' קלווין',
    stages:[{at:0,label:'1. עירור אופטי (פוטון)'},{at:0.34,label:'2. עירור חשמלי (שדה חזק)'},{at:0.67,label:'3. עירור תרמי (חימום)'}],
    params:[{id:'temp',label:'הטמפרטורה',min:200,max:500,step:50,value:300,unit:'K'}],
    stageLabel:(i,o)=>i<2?['1. עירור אופטי (פוטון)','2. עירור חשמלי (שדה חזק)'][i]:(o.temp<300?'3. עירור תרמי (חימום): מעט זוגות, לא אפס':'3. עירור תרמי (חימום): יותר זוגות ככל שחם יותר'),
    frame:(t,o)=>carrierFrame(t,o)
  },
  'nuclear-half-life':{
    id:'nuclear-half-life',duration:10,viewBox:'0 0 560 320',
    label:o=>(o.halfLife===1?'עקומת דעיכה N חלקי N0 על ציר מנורמל t חלקי זמן מחצית החיים, 0 עד 4 זמני מחצית':'עקומת דעיכה N חלקי N0 בחלון פיזי קבוע של 20 שניות, זמן מחצית '+o.halfLife+' שניות - ככל שזמן המחצית קצר יותר, יותר דעך באותן 20 שניות')+(o.count>0?', עם דגימה אקראית אחת של גרעינים שנדעכים בזמנים אקראיים (הרצה קבועה)':', העקומה האידיאלית בלבד'),
    stages:[{at:0,label:'1. עד זמן מחצית ראשון'},{at:0.25,label:'2. עד זמן מחצית שני'},{at:0.5,label:'3. עד זמן מחצית שלישי'},{at:0.75,label:'4. עד זמן מחצית רביעי'}],
    stageLabel:(i,o)=>o.halfLife===1?['1. עד זמן מחצית ראשון','2. עד זמן מחצית שני','3. עד זמן מחצית שלישי','4. עד זמן מחצית רביעי'][i]:['1. עד 5 שניות','2. עד 10 שניות','3. עד 15 שניות','4. עד 20 שניות'][i],
    params:[{id:'count',label:'מספר גרעינים בדגימה',min:0,max:400,step:10,value:0},{id:'halfLife',label:'זמן מחצית',min:1,max:10,step:1,value:1,unit:'s'},{id:'run',label:'הרצה אקראית',min:1,max:9,step:1,value:1}],
    frame:(t,o)=>halfLifeFrame(t,o)
  },

  'lamer-burst':{
    id:'lamer-burst',duration:12,viewBox:'0 -10 560 270',
    label:o=>'מודל LaMer, ציור איכותי בלי ערכים מספריים: ריכוז מונומרים מול זמן. '+(o.regime===0?'ייצור מונומרים איטי - הרוויה נשארת מתחת לרמה הקריטית בזמן המוצג: אין פרץ גרעינות ואין אוכלוסיית גרעינים אחידה; אם נוצרים חלקיקים, ההיווצרות הדרגתית ולא אחידה':o.regime===2?'ייצור מונומרים מהיר - ציור סכמטי: הרוויה נבנית שוב ושוב, הגרעינות חוזרת והגדלים אינם אחידים; התוצאה האמיתית תלויה במערכת':'בשלב I הריכוז חוצה את סף הגרעינות, בשלב II פרץ קצר צורך את העודף, ובשלב III גדילה בלבד על הגרעינים הקיימים, ולכן הגדלים דומים'),
    stages:[{at:0,label:'1'},{at:0.3,label:'2'},{at:0.55,label:'3'}],
    stageLabel:(i,o)=>o.regime===0?['1. הרוויה עולה','2. נשארת מתחת לרמה הקריטית','3. בלי פרץ גרעינות'][i]:o.regime===2?['1. עלייה ראשונה','2. פרץ גרעינות ראשון','3. גרעינות חוזרת (סכמטי)'][i]:['1. שלב I - הריכוז עולה','2. שלב II - פרץ גרעינות','3. שלב III - גדילה בלבד'][i],
    params:[{id:'regime',label:'משטר ייצור המונומרים',min:0,max:2,step:1,value:1,options:['איטי','מבוקר (ציור השיעור)','מהיר']}],
    frame:(t,o)=>lamerFrame(t,o)
  },
  'chain-reaction':{
    id:'chain-reaction',duration:9,viewBox:'0 -90 560 352',
    label:o=>'תגובת שרשרת דור אחר דור: תת-קריטית דועכת, קריטית יציבה, על-קריטית גדלה מעריכית; בלוח האמצעי אפשר לשנות את מקדם ההכפלה האפקטיבי בין דורות',
    stages:[{at:0,label:'1. דור ראשון'},{at:0.34,label:'2. דור שני'},{at:0.67,label:'3. דור שלישי'}],
    params:[{id:'k',label:'מקדם הכפלה אפקטיבי בין דורות (לא נייטרונים לביקוע)',min:0.5,max:2,step:0.1,value:1}],
    frame:(t,o)=>chainFrame(t,o)
  }
};
