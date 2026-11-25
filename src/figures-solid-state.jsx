import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Dot,Box,Fig} from './figures-core.jsx';

// Original didactic drawings for Introduction to Solid State Chemistry. Concepts
// follow the lessons and public references; no lecture artwork is reproduced.

// SS2: Born-Haber energy ladder for NaCl, rounded textbook values in kJ/mol.
export function BornHaberNaCl({accent}){
  const Y=v=>160-(v)*0.26; // 0 kJ/mol at y=200, higher energy up
  const steps=[
    {v:0,a:['Na(s)','+ ½Cl₂(g)'],c:C.mut},
    {v:107,a:['Na(g)','+ ½Cl₂(g)'],c:'#f0c978',d:'+107'},
    {v:603,a:['Na⁺(g) + e⁻','+ ½Cl₂(g)'],c:'#f09797',d:'+496'},
    {v:724,a:['Na⁺(g) + e⁻','+ Cl(g)'],c:'#f0c978',d:'+121'},
    {v:375,a:['Na⁺(g)','+ Cl⁻(g)'],c:'#7aa7f0',d:'−349'},
    {v:-411,a:['NaCl(s)'],c:accent,d:'−786'}];
  const names=['סובלימציה','יינון','אטומיזציה','זיקה אלקטרונית','יצירת סריג'];
  const X=i=>505-i*86;
  return <Fig label="מעגל בורן-האבר ל-NaCl בערכים מעוגלים ב-kJ/mol: סובלימציה 107, יינון 496, אטומיזציה 121, זיקה אלקטרונית מינוס 349, יצירת סריג מינוס 786, ובסך הכול יצירה מהיסודות מינוס 411" viewBox="0 -90 560 410">
    <L x1={44} y1={Y(0)} x2={545} y2={Y(0)} stroke={C.soft} dash="3 4"/>
    {steps.map((s,i)=><g key={i}>
      {i>0&&<L x1={X(i-1)-26} y1={Y(steps[i-1].v)} x2={X(i)+26} y2={Y(steps[i-1].v)} stroke={C.soft} dash="2 4"/>}
      <L x1={X(i)-26} y1={Y(s.v)} x2={X(i)+26} y2={Y(s.v)} stroke={s.c} w={3}/>
      {i>0&&<Arrow x1={X(i)+43} y1={Y(steps[i-1].v)} x2={X(i)+43} y2={Y(s.v)+(s.v>steps[i-1].v?3:-3)} stroke={s.c} id={'bh'+i}/>}
      {i>0&&<T x={X(i)+43} y={Y(Math.min(s.v,steps[i-1].v))+16} size={11} ltr fill={s.c}>{i+': '+s.d}</T>}
      {s.a.map((t,j)=>i<5?<T key={j} x={X(i)} y={Y(s.v)-22+j*12} size={10} ltr fill={C.ink}>{t}</T>:<T key={j} x={X(i)} y={Y(s.v)+16} size={10.5} ltr fill={C.ink}>{t}</T>)}
    </g>)}
    <Arrow x1={22} y1={Y(0)+4} x2={22} y2={Y(-411)-4} stroke="#c79af0" dash="5 4" id="bhf"/>
    <T x={28} y={Y(-200)} size={11} anchor="start" ltr fill="#c79af0">ΔHf = −411</T>
    <T x={545} y={Y(0)+14} size={10} anchor="end" ltr>0 kJ/mol</T>
    {names.map((n,i)=><T key={n} x={540-i*106} y={Y(-411)+52} size={11} anchor="end" fill={C.mut}>{(i+1)+' '+n}</T>)}
  </Fig>;
}

// SS3: radius-ratio ranges and coordination geometry, with the lesson's four worked examples.
export function RadiusRatioLadder({accent}){
  const X=r=>40+480*r;
  const B=[[0.155,0.225,3,'משולש מישורי',null,'#f09797'],[0.225,0.414,4,'טטרהדרלי','ZnS','#f0c978'],[0.414,0.732,6,'אוקטהדרלי','NaCl',accent],[0.732,1,8,'קובייתי','CsCl','#c79af0']];
  const E=[['NiS',0.375],['NiO',0.493],['KI',0.627],['CsI',0.759]];
  return <Fig label="טווחי יחס הרדיוסים ומספר הקואורדינציה: 0.155 עד 0.225 משולש מישורי, 0.225 עד 0.414 טטרהדרלי, 0.414 עד 0.732 אוקטהדרלי, 0.732 עד 1 קובייתי; הדוגמאות NiS 0.375, NiO 0.493, KI 0.627 ו-CsI 0.759" viewBox="0 -90 560 370">
    {B.map(([a,b,n,g,ex,c])=><g key={n}>
      <Box x={X(a)} y={0} w={X(b)-X(a)} h={54} fill={C.faint} stroke={c}/>
      <T x={(X(a)+X(b))/2} y={34} size={20} weight="bold" ltr fill={C.ink}>{n}</T>
      <L x1={X(a)} y1={54} x2={X(a)} y2={196} stroke={C.soft} dash="3 4"/>
      <T x={(X(a)+X(b))/2} y={n%6===3?78:96} size={n===3?11:12} fill={c}>{g}</T>
      {ex&&<T x={(X(a)+X(b))/2} y={n%6===3?96:114} size={12} ltr fill={C.mut}>{ex}</T>}
    </g>)}
    <T x={22} y={34} size={12} anchor="end" ltr fill={C.mut}>CN</T>
    <L x1={X(1)} y1={54} x2={X(1)} y2={196} stroke={C.soft} dash="3 4"/>
    <L x1={X(0.155)} y1={200} x2={X(1)} y2={200}/>
    {[0.155,0.225,0.414,0.732,1].map(r=><g key={r}><L x1={X(r)} y1={200} x2={X(r)} y2={206}/><T x={X(r)} y={268} size={10.5} ltr>{r}</T></g>)}
    {E.map(([n,r],i)=><g key={n}>
      <Dot cx={X(r)} cy={200} r={5} fill="#f2d049"/>
      <T x={X(r)} y={224+(i%2)*0} size={12} ltr fill="#f2d049">{n}</T>
      <T x={X(r)} y={238} size={10.5} ltr fill={C.mut}>{r}</T>
    </g>)}
    <T x={280} y={296} size={12} ltr>ρ = r(cation) / r(anion)</T>
  </Fig>;
}

// SS4: polar bonds do not guarantee a polar molecule (bond dipoles add as vectors).
export function NetDipole({accent}){
  const cl='#7aa7f0',si='#f0c978';
  const vs=[[-1,-1],[1,-1],[-1,1],[1,1]];
  return <Fig label="קשרים קוטביים אינם מבטיחים מולקולה קוטבית: ב-HCl הדיפול נטו שונה מאפס, ב-SiCl4 ארבעה דיפולי קשר בגיאומטריה טטרהדרלית מבטלים זה את זה בדיוק" viewBox="0 -90 560 300">
    <Box x={300} y={0} w={240} h={190} fill={C.faint} stroke={accent}/>
    <T x={420} y={26} size={14} weight="bold" fill={C.ink}>מולקולה קוטבית</T>
    <Dot cx={360} cy={100} r={14} fill={C.line} stroke={C.mut}/><T x={360} y={105} size={13} ltr fill={C.ink}>H</T>
    <Dot cx={470} cy={100} r={20} fill={C.line} stroke={cl}/><T x={470} y={105} size={14} ltr fill={C.ink}>Cl</T>
    <Arrow x1={382} y1={100} x2={444} y2={100} stroke={cl} id="hcl"/>
    <T x={368} y={72} size={12} ltr fill={C.mut}>δ+</T><T x={478} y={64} size={12} ltr fill={cl}>δ−</T>
    <T x={420} y={148} size={12} fill={C.ink}>דיפול נטו קיים</T>
    <T x={420} y={168} size={11} ltr fill={C.mut}>HCl</T>
    <Box x={20} y={0} w={240} h={190} fill={C.faint} stroke={C.line}/>
    <T x={140} y={26} size={14} weight="bold" fill={C.ink}>מולקולה לא קוטבית</T>
    <Dot cx={140} cy={110} r={14} fill={C.line} stroke={si}/><T x={140} y={115} size={13} ltr fill={C.ink}>Si</T>
    {[[0,-1,'p'],[-0.87,0.5,'p'],[0.87,0.5,'w'],[0.87,-0.5,'d']].map(([dx,dy,k],i)=>{
      const x2=140+dx*54,y2=110+dy*54,x1=140+dx*14,y1=110+dy*14,nx=-dy,ny=dx;
      return <g key={i}>
        {k==='p'&&<L x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.mut} w={2}/>}
        {k==='d'&&<L x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.mut} w={2} dash="3 3"/>}
        {k==='w'&&<polygon points={`${x1},${y1} ${x2+nx*6},${y2+ny*6} ${x2-nx*6},${y2-ny*6}`} fill={C.mut}/>}
        <Arrow x1={140+dx*24+nx*11} y1={110+dy*24+ny*11} x2={140+dx*44+nx*11} y2={110+dy*44+ny*11} stroke={cl} id={'sicl'+i}/>
        <Dot cx={140+dx*58} cy={110+dy*58} r={11} fill={C.line} stroke={cl}/><T x={140+dx*58} y={110+dy*58+4} size={11} ltr fill={C.ink}>Cl</T>
      </g>;})}
    <T x={140} y={168} size={12} fill={C.ink}>סכום הדיפולים 0</T>
    <T x={140} y={184} size={11} ltr fill={C.mut}>SiCl₄</T>
  </Fig>;
}

// SS1: three forms of solid (schematic atom arrangements).
export function SolidForms({accent}){
  const lat=(ox,oy,ang,keep,sp=22)=>{const o=[],ca=Math.cos(ang),sa=Math.sin(ang);for(let i=-14;i<=14;i++)for(let j=-14;j<=14;j++){const x=ox+(i*ca-j*sa)*sp,y=oy+(i*sa+j*ca)*sp;if(keep(x,y))o.push([x,y]);}return o;};
  const f1=(x,y)=>x-(284-0.04*(y-4)),f2=(x,y)=>y-(112-0.136*(x-276));
  const inP=(x,y)=>x>=206&&x<=352&&y>=16&&y<=192;
  const g1=lat(210,30,0,(x,y)=>inP(x,y)&&f1(x,y)<-10);
  const g2=lat(300,30,0.5,(x,y)=>inP(x,y)&&f1(x,y)>10&&f2(x,y)<-10);
  const g3=lat(300,150,-0.4,(x,y)=>inP(x,y)&&f1(x,y)>10&&f2(x,y)>10);
  const cr=lat(32,22,0,(x,y)=>x>=30&&x<=160&&y>=20&&y<=176,25);
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const am=[];let guard=0;while(am.length<30&&guard++<4000){const x=392+rnd()*138,y=20+rnd()*172;if(am.every(([u,v])=>Math.hypot(u-x,v-y)>21))am.push([x,y]);}
  const R=7;
  return <Fig label="שלוש צורות של מוצק: גבישי עם סידור תקופתי ארוך טווח, פולי גבישי עם גבישונים וגבולות גרעין ביניהם, ואמורפי ללא סידור תקופתי ארוך טווח" viewBox="0 -10 560 250">
    <Box x={12} y={4} w={170} h={200} fill={C.faint} stroke={accent}/>
    {cr.map(([x,y],i)=><Dot key={'a'+i} cx={x} cy={y} r={R} fill={C.line} stroke={accent}/>)}
    <T x={97} y={226} size={13} fill={C.ink}>גבישי: סידור תקופתי</T>
    <Box x={194} y={4} w={170} h={200} fill={C.faint} stroke="#f0c978"/>
    <L x1={284} y1={4} x2={276} y2={204} stroke={C.mut} dash="4 3"/>
    <L x1={278} y1={112} x2={364} y2={100} stroke={C.mut} dash="4 3"/>
    {g1.map(([x,y],i)=><Dot key={'b'+i} cx={x} cy={y} r={R-1} fill={C.line} stroke="#f0c978"/>)}
    {g2.map(([x,y],i)=><Dot key={'c'+i} cx={x} cy={y} r={R-1} fill={C.line} stroke="#7aa7f0"/>)}
    {g3.map(([x,y],i)=><Dot key={'d'+i} cx={x} cy={y} r={R-1} fill={C.line} stroke="#f09797"/>)}
    <T x={279} y={226} size={13} fill={C.ink}>פולי־גבישי: גבישונים וגבולות</T>
    <Box x={376} y={4} w={170} h={200} fill={C.faint} stroke={C.line}/>
    {am.map(([x,y],i)=><Dot key={'e'+i} cx={x} cy={y} r={R} fill={C.line} stroke={C.mut}/>)}
    <T x={461} y={226} size={13} fill={C.ink}>אמורפי: ללא סידור ארוך טווח</T>
  </Fig>;
}

// SS1: three material families and the bonding behind them, with the properties listed in the lesson.
export function BondingFamilies({accent}){
  const F=[
    {x:392,t:'מתכות',b:'קישור מתכתי',s:'ים אלקטרונים',p:['חזקות ודקטיליות','מוליכות חשמלית ותרמית גבוהה'],c:'#f0c978',k:'m'},
    {x:204,t:'פולימרים',b:'קישור קוולנטי',s:'שיתוף אלקטרונים',p:['רכים ודקטיליים','מבודדים, חוזק וצפיפות נמוכים'],c:'#7aa7f0',k:'c'},
    {x:16,t:'קרמיקות',b:'קישור יוני',s:'מתן וקבלת אלקטרונים',p:['שבירות ומבודדות','תרכובות של מתכת ולא מתכת'],c:'#f09797',k:'i'}];
  return <Fig label="שלוש משפחות חומרים והקישור שמאחוריהן: מתכות עם קישור מתכתי, פולימרים עם קישור קוולנטי וקרמיקות עם קישור יוני, ותכונות אופייניות לכל משפחה" viewBox="0 -10 560 266">
    {F.map(f=><g key={f.k}>
      <Box x={f.x} y={4} w={152} h={232} fill={C.faint} stroke={f.c}/>
      <T x={f.x+76} y={30} size={15} weight="bold" fill={C.ink}>{f.t}</T>
      <g>{f.k==='m'&&[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]].map(([i,j],n)=><Dot key={n} cx={f.x+36+i*40} cy={64+j*34} r={10} fill={C.line} stroke={f.c}/>)}
      {f.k==='m'&&[[56,81],[96,64],[76,98],[116,81],[40,64]].map(([x,y],n)=><Dot key={'e'+n} cx={f.x+x} cy={y} r={3} fill="#e8edf6"/>)}
      {f.k==='c'&&[0,1,2,3].map(n=><g key={n}><Dot cx={f.x+34+n*28} cy={78} r={9} fill={C.line} stroke={f.c}/>{n<3&&<L x1={f.x+43+n*28} y1={78} x2={f.x+53+n*28} y2={78} stroke={f.c} w={3}/>}</g>)}
      {f.k==='i'&&[[0,0,1],[1,0,0],[0,1,0],[1,1,1]].map(([i,j,a],n)=><Dot key={n} cx={f.x+52+i*48} cy={64+j*40} r={a?14:9} fill={C.line} stroke={a?'#7aa7f0':f.c}/>)}</g>
      <T x={f.x+76} y={142} size={12} fill={f.c}>{f.b}</T>
      <T x={f.x+76} y={158} size={11} fill={C.mut}>{f.s}</T>
      <L x1={f.x+16} y1={170} x2={f.x+136} y2={170} stroke={C.soft}/>
      <T x={f.x+76} y={184} size={10} fill={C.dim}>מגמות אופייניות, לא תמיד</T>
      {f.p.map((p,i)=><T key={i} x={f.x+76} y={202+i*16} size={11} fill={C.ink}>{p}</T>)}
    </g>)}
  </Fig>;
}

// SS1: ionic bond as electron transfer, with relative ion sizes (schematic).
export function IonicTransfer({accent}){
  return <Fig label="קישור יוני כמעבר אלקטרון: אטום נתרן מוסר אלקטרון והופך לקטיון קטן, אטום כלור קולט אותו והופך לאניון גדול, והיונים נמשכים זה לזה" viewBox="0 -10 560 230">
    <Dot cx={64} cy={80} r={30} fill={C.line} stroke="#f0c978"/><T x={64} y={85} size={14} ltr fill={C.ink}>Na</T>
    <Dot cx={200} cy={80} r={22} fill={C.line} stroke="#f0c978"/><T x={200} y={85} size={13} ltr fill={C.ink}>Na⁺</T>
    <Dot cx={330} cy={80} r={26} fill={C.line} stroke="#7aa7f0"/><T x={330} y={85} size={14} ltr fill={C.ink}>Cl</T>
    <Dot cx={488} cy={80} r={36} fill={C.line} stroke="#7aa7f0"/><T x={488} y={85} size={14} ltr fill={C.ink}>Cl⁻</T>
    <Arrow x1={100} y1={80} x2={168} y2={80} stroke="#f0c978" id="ss1na"/>
    <T x={134} y={66} size={12} ltr fill="#f0c978">− e⁻</T>
    <Arrow x1={366} y1={80} x2={444} y2={80} stroke="#7aa7f0" id="ss1cl"/>
    <T x={405} y={66} size={12} ltr fill="#7aa7f0">+ e⁻</T>
    <Dot cx={262} cy={80} r={5} fill="#e8edf6"/>
    <Arrow x1={228} y1={100} x2={296} y2={100} stroke={C.mut} dash="4 3" id="ss1e"/>
    <T x={262} y={122} size={11} fill={C.mut}>האלקטרון עובר</T>
    <T x={64} y={146} size={12} fill={C.ink}>מתכת מוסרת</T>
    <T x={488} y={146} size={12} fill={C.ink}>לא־מתכת קולטת</T>
    <T x={132} y={176} size={12} fill={C.mut}>קטיון קטן מהאטום</T>
    <T x={410} y={176} size={12} fill={C.mut}>אניון גדול מהאטום</T>
    <T x={280} y={204} size={13} ltr fill={C.ink}>Na⁺ ··· Cl⁻</T>
  </Fig>;
}

// SS2: melting points of NaCl, MgO and RbI with the charge product and ion distance.
export function IonicMelting({accent}){
  const D=[['MgO',2852,'±2, 4','212',accent],['NaCl',801,'±1, 1','283','#f0c978'],['RbI',642,'±1, 1','372','#7aa7f0']];
  const H=v=>v/2852*150;
  return <Fig label="טמפרטורות התכה של תרכובות יוניות: MgO כ-2852 מעלות, NaCl כ-801 ו-RbI כ-642; ב-MgO מכפלת המטענים 4 והמרחק קצר יותר" viewBox="0 -10 560 260">
    <L x1={40} y1={180} x2={540} y2={180}/>
    {D.map(([n,v,q,d,c],i)=>{const x=110+i*160,h=H(v);return <g key={n}>
      <Box x={x-34} y={180-h} w={68} h={h} fill={C.faint} stroke={c} rx={3}/>
      <T x={x} y={174-h} size={14} ltr weight="bold" fill={C.ink}>{v}</T>
      <T x={x} y={198} size={14} ltr fill={C.ink}>{n}</T>
      <T x={x} y={216} size={11} ltr fill={C.mut}>{'q·q = '+q.split(', ')[1]}</T>
      <T x={x} y={232} size={11} ltr fill={C.mut}>{'r ≈ '+d+' pm'}</T>
    </g>;})}
    <T x={540} y={20} size={12} anchor="end" ltr fill={C.mut}>°C</T>
  </Fig>;
}

// SS3: coordination sketches for CN 6, 8 and 4 (NaCl, CsCl, ZnS), schematic.
export function CoordinationSketches({accent}){
  const cat='#f0c978',an='#7aa7f0';
  return <Fig label="שרטוטי קואורדינציה: ב-NaCl קטיון מוקף שישה אניונים, ב-CsCl קטיון מוקף שמונה אניונים וב-ZnS קטיון מוקף ארבעה אניונים" viewBox="0 -10 560 250">
    <Box x={380} y={4} w={168} h={190} fill={C.faint} stroke={accent}/>
    <g>{[[-56,0],[56,0],[0,-56],[0,56]].map(([dx,dy],i)=><g key={i}><L x1={464} y1={100} x2={464+dx} y2={100+dy} stroke={C.mut} w={2}/><Dot cx={464+dx} cy={100+dy} r={10} fill={C.line} stroke={an}/></g>)}
    {[[-30,-30,'d'],[30,30,'d']].map(([dx,dy],i)=><g key={'o'+i}><L x1={464} y1={100} x2={464+dx} y2={100+dy} stroke={C.mut} w={2} dash="3 3"/><Dot cx={464+dx} cy={100+dy} r={8} fill={C.line} stroke={an} dash="2 2"/></g>)}
    <Dot cx={464} cy={100} r={14} fill={C.line} stroke={cat}/></g>
    <T x={464} y={216} size={13} ltr fill={C.ink}>NaCl: CN = 6</T>
    <Box x={196} y={4} w={168} h={190} fill={C.faint} stroke="#c79af0"/>
    <g>
      <path d="M228,60 H306 V138 H228 Z" fill="none" stroke={C.mut} strokeWidth={1.6}/>
      <path d="M250,38 H328 V116 H250 Z" fill="none" stroke={C.mut} strokeWidth={1.6} strokeDasharray="4 3"/>
      {[[228,60,250,38],[306,60,328,38],[228,138,250,116],[306,138,328,116]].map(([a,b,c,d],i)=><L key={i} x1={a} y1={b} x2={c} y2={d} stroke={C.mut} w={1.6} dash={i===2||i===0?'4 3':undefined}/>)}
      {[[228,60],[306,60],[228,138],[306,138],[250,38],[328,38],[250,116],[328,116]].map(([x,y],i)=><Dot key={i} cx={x} cy={y} r={8} fill={C.line} stroke={an}/>)}
      <Dot cx={278} cy={88} r={11} fill={C.line} stroke={cat}/>
    </g>
    <T x={280} y={216} size={13} ltr fill={C.ink}>CsCl: CN = 8</T>
    <Box x={12} y={4} w={168} h={190} fill={C.faint} stroke="#f09797"/>
    <g>
      {[[96,40,'p'],[52,148,'p'],[140,148,'p'],[96,120,'d']].map(([x,y,k],i)=><g key={i}><L x1={96} y1={96} x2={x} y2={y} stroke={C.mut} w={2} dash={k==='d'?'3 3':undefined}/><Dot cx={x} cy={y} r={10} fill={C.line} stroke={an}/></g>)}
      <Dot cx={96} cy={96} r={14} fill={C.line} stroke={cat}/>
    </g>
    <T x={96} y={216} size={13} ltr fill={C.ink}>ZnS: CN = 4</T>
  </Fig>;
}

// SS4: typical ranges of four intermolecular interactions on a log axis (ranges overlap; no universal order).
export function ForceRanges({accent}){
  const X=v=>40+(Math.log10(v)+2)/5*480; // 0.01 to 1000
  const R=[['פיזור לונדון',0.05,40,'#93a5b8'],['דיפול-דיפול',5,25,'#f0c978'],['קשר מימן',10,40,'#7aa7f0'],['יון-דיפול',40,600,'#f09797']];
  return <Fig label="טווחים אופייניים של ארבעה כוחות בין מולקולריים בציר לוגריתמי ב-kJ/mol: לונדון 0.05 עד 40, דיפול-דיפול 5 עד 25, קשר מימן 10 עד 40, יון-דיפול 40 עד 600; הטווחים חופפים ואין דירוג אוניברסלי" viewBox="0 -10 560 250">
    {R.map(([n,a,b,c],i)=><g key={n}>
      <Box x={X(a)} y={14+i*42} w={X(b)-X(a)} h={26} fill={C.faint} stroke={c} rx={4}/>
      <T x={X(a)+(X(b)-X(a))/2} y={32+i*42} size={12} ltr fill={C.ink}>{a+'-'+b}</T>
      <T x={X(a)-6} y={32+i*42} size={12} anchor="end" fill={c}>{n}</T>
    </g>)}
    <L x1={40} y1={190} x2={520} y2={190}/>
    {[0.01,0.1,1,10,100,1000].map(v=><g key={v}><L x1={X(v)} y1={190} x2={X(v)} y2={196}/><T x={X(v)} y={212} size={11} ltr>{v}</T></g>)}
    <T x={280} y={232} size={11} ltr fill={C.mut}>kJ/mol, log scale</T>
  </Fig>;
}

// SS4: electronegativity difference as a trend for the main bond type.
export function BondTypeScale({accent}){
  const X=d=>40+d*150;
  return <Fig label="הפרש אלקטרושליליות כמגמה לסוג הקשר הראשי: בין 0.5 ל-1.8 קשר קוולנטי, מעל 1.8 קשר יוני; HCl כ-0.96 ו-NaCl כ-2.23; הגבולות הם מגמה ולא קו חד" viewBox="0 -10 560 220">
    <Box x={X(0)} y={30} w={X(0.5)-X(0)} h={44} fill={C.faint} stroke={C.line} dash="3 3"/>
    <Box x={X(0.5)} y={30} w={X(1.8)-X(0.5)} h={44} fill={C.faint} stroke="#7aa7f0"/>
    <Box x={X(1.8)} y={30} w={X(3.2)-X(1.8)} h={44} fill={C.faint} stroke="#f09797"/>
    <T x={X(0)} y={22} size={11} anchor="start" fill={C.mut}>מתחת ל-0.5: קוטביות נמוכה</T>
    <T x={(X(0.5)+X(1.8))/2} y={56} size={14} weight="bold" fill={C.ink}>קוולנטי</T>
    <T x={(X(1.8)+X(3.2))/2} y={56} size={14} weight="bold" fill={C.ink}>יוני</T>
    <L x1={X(0)} y1={100} x2={X(3.2)} y2={100}/>
    {[0,0.5,1,1.8,3].map(d=><g key={d}><L x1={X(d)} y1={100} x2={X(d)} y2={106}/><T x={X(d)} y={122} size={11} ltr>{d}</T></g>)}
    <L x1={X(0.5)} y1={30} x2={X(0.5)} y2={100} stroke={C.mut} dash="3 3"/>
    <L x1={X(1.8)} y1={30} x2={X(1.8)} y2={100} stroke={C.mut} dash="3 3"/>
    <Dot cx={X(0.96)} cy={100} r={5} fill="#f2d049"/><T x={X(0.96)} y={156} size={12} ltr fill="#f2d049">HCl 0.96</T>
    <L x1={X(0.96)} y1={106} x2={X(0.96)} y2={142} stroke="#f2d049" dash="2 3"/>
    <Dot cx={X(2.23)} cy={100} r={5} fill="#f2d049"/><T x={X(2.23)} y={156} size={12} ltr fill="#f2d049">NaCl 2.23</T>
    <L x1={X(2.23)} y1={106} x2={X(2.23)} y2={142} stroke="#f2d049" dash="2 3"/>
    <T x={X(3.2)} y={22} size={12} anchor="end" ltr fill={C.mut}>Δχ = |χA − χB|</T>
  </Fig>;
}

// SS5: bonding and antibonding molecular orbitals from two atomic orbitals (LCAO sketch).
export function MoBonding({accent}){
  const a='#7aa7f0',b='#f0c978';
  return <Fig label="צירוף לינארי של שני אורביטלים אטומיים: חפיפה באותה פאזה נותנת אורביטל קושר באנרגיה נמוכה, וחפיפה בפאזה מנוגדת נותנת אורביטל אנטי קושר באנרגיה גבוהה עם מישור אפס" viewBox="0 -10 560 250">
    <Arrow x1={14} y1={190} x2={14} y2={14} stroke={C.line} id="mo-e"/>
    <T x={26} y={16} size={11} anchor="start" fill={C.mut}>אנרגיה</T>
    <L x1={470} y1={110} x2={546} y2={110} stroke={C.ink} w={2.5}/><T x={508} y={130} size={12} ltr fill={C.ink}>φB</T>
    <L x1={60} y1={110} x2={136} y2={110} stroke={C.ink} w={2.5}/><T x={98} y={130} size={12} ltr fill={C.ink}>φA</T>
    <L x1={136} y1={110} x2={200} y2={170} stroke={C.mut} dash="3 4"/><L x1={470} y1={110} x2={400} y2={170} stroke={C.mut} dash="3 4"/>
    <L x1={136} y1={110} x2={200} y2={50} stroke={C.mut} dash="3 4"/><L x1={470} y1={110} x2={400} y2={50} stroke={C.mut} dash="3 4"/>
    <L x1={200} y1={170} x2={400} y2={170} stroke={accent} w={3}/>
    <L x1={200} y1={50} x2={400} y2={50} stroke="#f09797" w={3}/>
    <T x={300} y={192} size={13} fill={accent}>אורביטל קושר, אנרגיה נמוכה</T>
    <T x={300} y={36} size={13} fill="#f09797">אורביטל אנטי־קושר, אנרגיה גבוהה</T>
    <Dot cx={270} cy={150} r={14} fill={C.line} stroke={a}/><Dot cx={300} cy={150} r={14} fill={C.line} stroke={a}/>
    <T x={270} y={155} size={14} ltr fill={C.ink}>+</T><T x={300} y={155} size={14} ltr fill={C.ink}>+</T>
    <Dot cx={266} cy={82} r={14} fill={C.line} stroke={a}/><Dot cx={306} cy={82} r={14} fill={C.line} stroke={b}/>
    <T x={266} y={87} size={14} ltr fill={C.ink}>+</T><T x={306} y={87} size={14} ltr fill={C.ink}>−</T>
    <L x1={286} y1={62} x2={286} y2={104} stroke="#f09797" dash="3 3"/>
    <T x={286} y={118} size={11} fill="#f09797">מישור אפס</T>
  </Fig>;
}

// SS5: band pictures for a metal, a semiconductor and an insulator.
export function BandClasses({accent}){
  const P=[{x:380,n:'מתכת',t:'אין פער',k:'m',c:'#f0c978'},{x:200,n:'מוליך למחצה',t:'פער קטן',k:'s',c:accent},{x:20,n:'מבודד',t:'פער גדול',k:'i',c:'#f09797'}];
  const fillc='#2d4a6b';
  return <Fig label="מבנה פסים של מתכת, מוליך למחצה ומבודד: במתכת פס מלא חלקית ואין פער, במוליך למחצה פער קטן בין פס הערכיות לפס ההולכה, ובמבודד פער גדול מאוד" viewBox="0 -10 560 260">
    {P.map(p=><g key={p.k}>
      <Box x={p.x} y={4} w={160} h={190} fill={C.faint} stroke={p.c}/>
      {p.k==='m'&&<g>
        <rect x={p.x+30} y={30} width={70} height={64} fill="none" stroke={C.mut} strokeWidth={1.6}/>
        <rect x={p.x+30} y={94} width={70} height={64} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
        <T x={p.x+132} y={66} size={11} fill={C.mut}>ריק</T><T x={p.x+132} y={130} size={11} fill={C.mut}>מלא</T>
      </g>}
      {p.k==='s'&&<g>
        <rect x={p.x+30} y={24} width={70} height={46} fill="none" stroke={C.mut} strokeWidth={1.6}/>
        <rect x={p.x+30} y={110} width={70} height={60} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
        <T x={p.x+65} y={52} size={12} ltr fill={C.ink}>CB</T><T x={p.x+65} y={144} size={12} ltr fill={C.ink}>VB</T>
        <Arrow x1={p.x+120} y1={72} x2={p.x+120} y2={108} stroke="#f2d049" id="bc-s1"/><Arrow x1={p.x+120} y1={108} x2={p.x+120} y2={72} stroke="#f2d049" id="bc-s2"/>
        <T x={p.x+137} y={95} size={12} ltr fill="#f2d049">Eg</T>
      </g>}
      {p.k==='i'&&<g>
        <rect x={p.x+30} y={14} width={70} height={30} fill="none" stroke={C.mut} strokeWidth={1.6}/>
        <rect x={p.x+30} y={134} width={70} height={46} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
        <T x={p.x+65} y={34} size={12} ltr fill={C.ink}>CB</T><T x={p.x+65} y={162} size={12} ltr fill={C.ink}>VB</T>
        <Arrow x1={p.x+120} y1={46} x2={p.x+120} y2={132} stroke="#f2d049" id="bc-i1"/><Arrow x1={p.x+120} y1={132} x2={p.x+120} y2={46} stroke="#f2d049" id="bc-i2"/>
        <T x={p.x+137} y={92} size={12} ltr fill="#f2d049">Eg</T>
      </g>}
      <T x={p.x+80} y={216} size={14} weight="bold" fill={C.ink}>{p.n}</T>
      <T x={p.x+80} y={234} size={12} fill={p.c}>{p.t}</T>
    </g>)}
  </Fig>;
}

// SS6: photon energy from wavelength with the course shortcut E(eV) = 1240 / wavelength(nm).
export function PhotonEnergyRuler({accent}){
  const X=l=>40+(l-350)/900*480;
  const M=[[400,'3.10'],[500,'2.48'],[600,'2.07'],[700,'1.77'],[1107,'1.12']];
  return <Fig label="אנרגיית פוטון לפי אורך גל, E בקירוב 1240 חלקי אורך הגל בננומטר: 400 ננומטר 3.10 eV, 500 ננומטר 2.48, 600 ננומטר 2.07, 700 ננומטר 1.77, וקצה הפס של סיליקון בכ-1107 ננומטר 1.12 eV" viewBox="0 -10 560 230">
    <defs><linearGradient id="ss6vis" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#7a5cf0"/><stop offset="0.25" stopColor="#4f8df0"/><stop offset="0.5" stopColor="#5fd08a"/><stop offset="0.75" stopColor="#f0d050"/><stop offset="1" stopColor="#f06060"/></linearGradient></defs>
    <rect x={X(400)} y={96} width={X(700)-X(400)} height={22} fill="url(#ss6vis)" opacity={0.85}/>
    <L x1={40} y1={118} x2={520} y2={118}/>
    <T x={(X(400)+X(700))/2} y={86} size={12} fill={C.ink}>אור נראה</T>
    {M.map(([l,e])=><g key={l}>
      <L x1={X(l)} y1={118} x2={X(l)} y2={126}/>
      <T x={X(l)} y={142} size={12} ltr fill={C.ink}>{l}</T>
      <T x={X(l)} y={36} size={13} ltr weight="bold" fill={l===1107?'#f2d049':accent}>{e}</T>
      <L x1={X(l)} y1={44} x2={X(l)} y2={96} stroke={C.soft} dash="2 4"/>
    </g>)}
    <T x={520} y={160} size={11} anchor="end" ltr fill={C.mut}>λ (nm)</T>
    <T x={40} y={16} size={11} anchor="start" ltr fill={C.mut}>E (eV) ≈ 1240 / λ (nm)</T>
    <T x={X(1107)} y={176} size={11} fill="#f2d049">קצה הפס של סיליקון</T>
    <T x={X(1107)} y={192} size={11} fill={C.mut}>בערך, באינפרא־אדום</T>
  </Fig>;
}

// SS6: absorb 2 eV, shed 0.3 eV as heat, optionally emit 1.7 eV (course example, Eg = 1.7 eV).
export function ExciteRelaxEmit({accent}){
  const Y=e=>200-e*60;
  const fillc='#2d4a6b';
  return <Fig label="דוגמת הקורס עם פער 1.7 eV: אלקטרון בולע פוטון של 2 eV ועולה, מאבד 0.3 eV כחום, ואז יכול לפלוט פוטון של 1.7 eV" viewBox="0 -10 560 250">
    <rect x={50} y={Y(2.7)} width={200} height={Y(1.7)-Y(2.7)} fill="none" stroke={C.mut} strokeWidth={1.6}/>
    <rect x={50} y={Y(0)} width={200} height={40} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
    <T x={70} y={Y(2.7)+16} size={12} anchor="start" ltr fill={C.ink}>CB</T><T x={70} y={Y(0)+26} size={12} anchor="start" ltr fill={C.ink}>VB</T>
    <L x1={250} y1={Y(1.7)} x2={286} y2={Y(1.7)} stroke={C.soft} dash="3 3"/>
    <Arrow x1={90} y1={Y(0)-2} x2={90} y2={Y(2.0)} stroke="#a58bf0" id="ere1"/>
    <Dot cx={90} cy={Y(2.0)} r={5} fill="#a58bf0"/>
    <Arrow x1={150} y1={Y(2.0)} x2={150} y2={Y(1.7)+3} stroke="#f09797" dash="4 3" id="ere2"/>
    <Arrow x1={210} y1={Y(1.7)} x2={210} y2={Y(0)+3} stroke="#7aa7f0" id="ere3"/>
    <T x={100} y={Y(1.0)} size={13} anchor="start" ltr fill="#a58bf0">1</T>
    <T x={160} y={Y(1.85)} size={13} anchor="start" ltr fill="#f09797">2</T>
    <T x={220} y={Y(0.9)} size={13} anchor="start" ltr fill="#7aa7f0">3</T>
    <T x={298} y={36} size={12} anchor="start" fill={C.ink}>בליעה של פוטון</T><T x={540} y={36} size={12} anchor="end" ltr fill="#a58bf0">2 eV</T>
    <T x={298} y={76} size={12} anchor="start" fill={C.ink}>רגיעה תרמית, חום</T><T x={540} y={76} size={12} anchor="end" ltr fill="#f09797">0.3 eV</T>
    <T x={298} y={116} size={12} anchor="start" fill={C.ink}>פליטה, אם מתרחשת</T><T x={540} y={116} size={12} anchor="end" ltr fill="#7aa7f0">1.7 eV</T>
    <T x={298} y={160} size={12} anchor="start" ltr fill={C.mut}>Eg = 1.7 eV</T>
    <T x={298} y={180} size={11} anchor="start" fill={C.mut}>הפוטון הנפלט ארוך גל יותר מהנבלע</T>
  </Fig>;
}

// SS7: three ways to make carriers; each excitation makes exactly one electron-hole pair.
export function CarrierCreation({accent}){
  const P=[{x:380,n:'עירור אופטי',t:'hν ≥ Eg',tl:true,c:'#a58bf0'},{x:200,n:'עירור חשמלי',t:'שדה חזק',tl:false,c:'#f0c978'},{x:20,n:'עירור תרמי',t:'חימום',tl:false,c:'#f09797'}];
  const fillc='#2d4a6b';
  return <Fig label="שלוש דרכים ליצור נושאי מטען במוליך למחצה: בליעת פוטון, שדה חשמלי חזק וחימום; בציור כל דרך מראה אירוע עירור בודד שיוצר אלקטרון בפס ההולכה וחור בפס הערכיות" viewBox="0 -10 560 250">
    {P.map((p,i)=><g key={i}>
      <Box x={p.x} y={4} w={160} h={190} fill={C.faint} stroke={p.c}/>
      <rect x={p.x+24} y={22} width={90} height={44} fill="none" stroke={C.mut} strokeWidth={1.6}/>
      <rect x={p.x+24} y={120} width={90} height={56} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
      <T x={p.x+30} y={58} size={11} anchor="start" ltr fill={C.ink}>CB</T><T x={p.x+30} y={168} size={11} anchor="start" ltr fill={C.ink}>VB</T>
      <Arrow x1={p.x+58} y1={118} x2={p.x+58} y2={50} stroke={p.c} dash={i===2?'2 3':undefined} w={i===2?2.4:1.6} id={'cc'+i}/>
      <Dot cx={p.x+58} cy={44} r={6} fill="#7aa7f0"/><T x={p.x+80} y={36} size={10} ltr fill="#7aa7f0">e⁻</T>
      <Dot cx={p.x+94} cy={128} r={6} fill="none" stroke="#f09797" w={2}/><T x={p.x+94} y={148} size={10} ltr fill="#f09797">h⁺</T>
      <T x={p.x+80} y={214} size={13} weight="bold" fill={C.ink}>{p.n}</T>
      {p.tl?<T x={p.x+80} y={232} size={12} ltr fill={p.c}>{p.t}</T>:<T x={p.x+80} y={232} size={12} fill={p.c}>{p.t}</T>}
    </g>)}
  </Fig>;
}

// SS7: qualitative conductivity vs temperature for a metal, an intrinsic semiconductor and an insulator.
export function ConductivityVsT({accent}){
  const m='#f0c978',s='#7aa7f0',i='#f09797';
  const pts=f=>{const o=[];for(let x=70;x<=500;x+=10)o.push(`${x},${f(x).toFixed(1)}`);return 'M'+o.join(' L');};
  const metal=x=>40+(x-70)*0.22;
  const semi=x=>200-165*(Math.exp((x-70)/95)-1)/(Math.exp(430/95)-1)-4;
  const ins=x=>206-(x-70)*0.012;
  return <Fig label="מוליכות מול טמפרטורה, באופן איכותי: במתכת המוליכות יורדת עם הטמפרטורה, במוליך למחצה אינטרינסי היא עולה, ובמבודד היא נמוכה מאוד ועולה מעט" viewBox="0 -10 560 250">
    <L x1={60} y1={210} x2={520} y2={210}/><L x1={60} y1={210} x2={60} y2={10}/>
    <Arrow x1={510} y1={210} x2={526} y2={210} stroke={C.line} id="cvt-x"/><Arrow x1={60} y1={22} x2={60} y2={8} stroke={C.line} id="cvt-y"/>
    <T x={290} y={236} size={12} fill={C.mut}>טמפרטורה T</T><T x={40} y={16} size={13} ltr fill={C.mut}>σ</T>
    <path d={pts(metal)} stroke={m} strokeWidth={2.4} fill="none" strokeLinecap="round"/>
    <path d={pts(semi)} stroke={s} strokeWidth={2.4} fill="none" strokeLinecap="round"/>
    <path d={pts(ins)} stroke={i} strokeWidth={2.4} fill="none" strokeLinecap="round"/>
    <T x={500} y={78} size={12} anchor="end" fill={m}>מתכת: יורדת</T>
    <T x={500} y={18} size={12} anchor="end" fill={s}>מוליך למחצה אינטרינסי: עולה</T>
    <T x={500} y={194} size={12} anchor="end" fill={i}>מבודד: נמוכה מאוד, עולה מעט</T>
  </Fig>;
}

// SS8: donor and acceptor levels near the band edges (not to scale).
export function DopantLevels({accent}){
  const fillc='#2d4a6b';
  return <Fig label="רמות סימום: רמת תורם קרובה לתחתית פס ההולכה בסימום n, רמת מקלט קרובה לראש פס הערכיות בסימום p; רמת פרמי זזה לכיוון הפס הדומיננטי" viewBox="0 -10 560 260">
    <Box x={290} y={4} w={250} h={196} fill={C.faint} stroke={accent}/>
    <rect x={314} y={22} width={150} height={60} fill="none" stroke={C.mut} strokeWidth={1.6}/>
    <rect x={314} y={134} width={150} height={52} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
    <T x={330} y={44} size={11} anchor="start" ltr fill={C.ink}>CB</T><T x={330} y={170} size={11} anchor="start" ltr fill={C.ink}>VB</T>
    <L x1={346} y1={106} x2={420} y2={106} stroke="#f0c978" w={2.5} dash="6 3"/>
    <T x={500} y={110} size={11} anchor="middle" ltr fill="#f0c978">donor</T>
    <Dot cx={366} cy={106} r={5} fill="#7aa7f0"/>
    <Arrow x1={366} y1={100} x2={366} y2={56} stroke="#7aa7f0" id="dl-n"/>
    <L x1={314} y1={92} x2={464} y2={92} stroke="#c79af0" w={1.5} dash="2 3"/>
    <T x={500} y={88} size={11} ltr fill="#c79af0">EF</T>
    <T x={415} y={220} size={13} weight="bold" fill={C.ink}>סימום מסוג n</T><T x={415} y={238} size={11} fill={C.mut}>תורם: אלקטרון נייד ויון קבוע</T>
    <Box x={20} y={4} w={250} h={196} fill={C.faint} stroke="#f09797"/>
    <rect x={44} y={22} width={150} height={52} fill="none" stroke={C.mut} strokeWidth={1.6}/>
    <rect x={44} y={142} width={150} height={44} fill={fillc} stroke={C.mut} strokeWidth={1.6}/>
    <T x={60} y={44} size={11} anchor="start" ltr fill={C.ink}>CB</T><T x={60} y={172} size={11} anchor="start" ltr fill={C.ink}>VB</T>
    <L x1={76} y1={122} x2={150} y2={122} stroke="#f0c978" w={2.5} dash="6 3"/>
    <T x={230} y={118} size={11} anchor="middle" ltr fill="#f0c978">acceptor</T>
    <L x1={44} y1={133} x2={194} y2={133} stroke="#c79af0" w={1.5} dash="2 3"/>
    <T x={230} y={137} size={11} ltr fill="#c79af0">EF</T>
    <Dot cx={96} cy={152} r={5} fill="#7aa7f0"/>
    <Arrow x1={96} y1={148} x2={96} y2={128} stroke="#7aa7f0" id="dl-p"/>
    <Dot cx={130} cy={152} r={6} fill="none" stroke="#f09797" w={2}/>
    <T x={145} y={220} size={13} weight="bold" fill={C.ink}>סימום מסוג p</T><T x={145} y={238} size={11} fill={C.mut}>מקלט: חור נייד ויון קבוע</T>
  </Fig>;
}

// SS8: conductivity of a doped semiconductor vs temperature; the extrinsic plateau meets the intrinsic curve above T0.
export function DopedConductivity({accent}){
  const si=x=>2+150*(Math.exp((x-70)/70)-1)/(Math.exp(430/70)-1);
  const Y=v=>205-v;
  const pts=f=>{const o=[];for(let x=70;x<=500;x+=6)o.push(`${x},${Y(f(x)).toFixed(1)}`);return 'M'+o.join(' L');};
  const N=26;
  const T0=70+70*Math.log((N-2)/150*(Math.exp(430/70)-1)+1);
  return <Fig label="מוליכות מול טמפרטורה במוליך למחצה מסומם: סביב טמפרטורת החדר נושאי הזיהום שולטים המוליכות כמעט אינה גדלה ואף יורדת קצת בגלל ירידת הניידות, ומעל T0 הנושאים התרמיים שולטים והעקומה מתכנסת לעקומה האינטרינסית" viewBox="0 -10 560 250">
    <L x1={60} y1={210} x2={520} y2={210}/><L x1={60} y1={210} x2={60} y2={10}/>
    <Arrow x1={510} y1={210} x2={526} y2={210} stroke={C.line} id="dcv-x"/><Arrow x1={60} y1={22} x2={60} y2={8} stroke={C.line} id="dcv-y"/>
    <T x={290} y={236} size={12} fill={C.mut}>טמפרטורה T</T><T x={40} y={16} size={13} ltr fill={C.mut}>σ</T>
    <path d={pts(si)} stroke={C.mut} strokeWidth={2} fill="none" strokeDasharray="5 4"/>
    <path d={pts(x=>N*(1-0.3*Math.min(1,(x-70)/(T0-70)))+si(x))} stroke={accent} strokeWidth={2.6} fill="none" strokeLinecap="round"/>
    <L x1={T0} y1={30} x2={T0} y2={210} stroke="#f2d049" dash="3 4"/>
    <T x={T0} y={24} size={13} ltr fill="#f2d049">T0</T>
    <T x={150} y={150} size={12} fill={accent}>נושאי זיהום שולטים</T>
    <T x={150} y={168} size={11} fill={C.mut}>סביב טמפרטורת החדר</T>
    <T x={330} y={100} size={12} fill={C.ink}>נושאים תרמיים שולטים</T>
    <T x={150} y={60} size={11} fill={accent}>קו מלא: מסומם</T><T x={150} y={78} size={11} fill={C.mut}>קו מקווקו: אינטרינסי</T>
  </Fig>;
}
