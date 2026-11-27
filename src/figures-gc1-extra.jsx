import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Dot,Fig} from './figures-core.jsx';
// GC1 additions kept outside figures.jsx so general-chemistry-2 figure-bound reviews are unaffected.
// Schematic drawings, not to scale.
// Hydrogen dots sit on the side of each carbon away from its bonds, so they never touch a neighbouring atom.
const hDots=(P,r)=>P.map(([x,y],j)=>{const nb=r.ed.filter(e=>e.includes(j)).map(e=>P[e[0]===j?e[1]:e[0]]);let ux=0,uy=0;nb.forEach(([a,b])=>{const dx=a-x,dy=b-y,l=Math.hypot(dx,dy)||1;ux-=dx/l;uy-=dy/l});const m=Math.hypot(ux,uy)||1;ux/=m;uy/=m;const n=r.hs[j],sp=n===1?[0]:n===2?[-.6,.6]:[-.85,0,.85];return sp.map((a,h)=>{const c=Math.cos(a),sn=Math.sin(a);return <Dot key={j+'h'+h} cx={x+(ux*c-uy*sn)*22} cy={y+(ux*sn+uy*c)*22} r={4.5} fill={C.mut}/>})});
// Shorten a bond so the line stops before the atom labels at both ends.
const trimEdge=(p,q,d)=>{const dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1,f=Math.min(d,l*.4)/l;return [p[0]+dx*f,p[1]+dy*f,q[0]-dx*f,q[1]-dy*f]};
export function MoleculeViews({accent}){
 const rows=[{y:136,pts:[[0,12],[42,-12],[84,12],[126,-12]],ed:[[0,1],[1,2],[2,3]],hs:[3,2,2,3],name:'בוטאן: שרשרת'},{y:300,pts:[[0,24],[42,0],[84,24],[42,-40]],ed:[[0,1],[1,2],[1,3]],hs:[3,1,3,3],name:'מתילפרופאן: מסועף'}];
 const hpos=[[-12,-18],[12,-18],[0,20]];
 return <Fig viewBox="0 -44 570 454" label="Two isomers with formula C4H10, butane as a chain and methylpropane as a branch, each drawn as a structural formula, a ball-and-stick model and a space-filling model.">
 <T x={100} y={28} size={24} fill={accent}>מבנית</T><T x={290} y={28} size={24} fill={accent}>כדורים ומקלות</T><T x={470} y={28} size={24} fill={accent}>מילוי חלל</T>
 {rows.map((r,ri)=><g key={ri}>
  <T x={280} y={r.y-(ri?84:66)} size={28}>{r.name}</T>
  {[110,290,470].map((ox,vi)=>{const k2=vi===0?1.5:1;const P=r.pts.map(([x,y])=>[ox+(vi===0?-2:0)-63*k2+x*k2+(vi===0?16:0),r.y+y*(vi===0?1.5:1)]);return <g key={vi}>
   {vi<2&&r.ed.map(([a,b],k)=>{const e=vi?[P[a][0],P[a][1],P[b][0],P[b][1]]:trimEdge(P[a],P[b],25);return <L key={k} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} stroke={vi?C.ink:C.mut} w={vi?5:2}/>})}
   {P.map(([x,y],k)=>vi===0?<T key={k} x={x} y={y+8} size={26} ltr fill={C.ink}>{'C'+(r.hs[k]?'H'+(r.hs[k]>1?r.hs[k]:''):'')}</T>:<Dot key={k} cx={x} cy={y} r={vi===1?13:24} fill={vi===1?C.soft:C.line} stroke={vi===1?C.ink:accent} opacity={vi===1?1:.8}/>)}
   {vi===1&&hDots(P,r)}
  </g>})}
 </g>)}
 <T x={280} y={395} size={28}>אותה נוסחה, מבנה שונה, חומר שונה</T>
 </Fig>;
}
export function ExampleMolecules({accent}){
 const A=(x,y,s,k)=><T key={k} x={x} y={y+8} size={26} ltr fill={C.ink}>{s}</T>;
 return <Fig viewBox="10 0 540 345" label="Structural formulas of hydrogen peroxide, chloroethane, isopropanol and formic acid, plus a note on the cage shape of P4O10.">
 <T x={110} y={30} size={26} fill={accent}>H₂O₂</T>{A(40,80,'H',1)}<L x1={56} y1={76} x2={80} y2={76}/>{A(94,80,'O',2)}<L x1={110} y1={76} x2={134} y2={76}/>{A(148,80,'O',3)}<L x1={164} y1={76} x2={188} y2={76}/>{A(202,80,'H',4)}
 <T x={430} y={30} size={26} fill={accent}>CH₃CH₂Cl</T>{A(350,80,'CH₃',5)}<L x1={376} y1={76} x2={398} y2={76}/>{A(420,80,'CH₂',6)}<L x1={446} y1={76} x2={468} y2={76}/>{A(486,80,'Cl',7)}
 <T x={120} y={140} size={26} fill={accent}>CH₃CH(OH)CH₃</T>{A(40,215,'CH₃',8)}<L x1={66} y1={211} x2={96} y2={211}/>{A(116,215,'CH',9)}<L x1={136} y1={211} x2={166} y2={211}/>{A(192,215,'CH₃',10)}<L x1={116} y1={196} x2={116} y2={176}/>{A(116,165,'OH',11)}
 <T x={430} y={140} size={26} fill={accent}>HCO₂H</T>{A(366,215,'H',12)}<L x1={380} y1={211} x2={404} y2={211}/>{A(418,215,'C',13)}<L x1={414} y1={196} x2={414} y2={176}/><L x1={422} y1={196} x2={422} y2={176}/>{A(418,165,'O',14)}<L x1={432} y1={211} x2={456} y2={211}/>{A(470,215,'O',15)}<L x1={484} y1={211} x2={508} y2={211}/>{A(520,215,'H',16)}
 <T x={280} y={282} size={28}>P₄O₁₀: ארבעה אטומי זרחן</T><T x={280} y={322} size={28}>בתוך כלוב של עשרה אטומי חמצן</T>
 </Fig>;
}

// Phone composition: each isomer gets a full-width structural row, then the two 3D models side by side, so every label has room.
export function MoleculeViewsNarrow({accent}){
 const rows=[{pts:[[0,12],[42,-12],[84,12],[126,-12]],ed:[[0,1],[1,2],[2,3]],hs:[3,2,2,3],name:'בוטאן: שרשרת'},{pts:[[0,24],[42,0],[84,24],[42,-40]],ed:[[0,1],[1,2],[1,3]],hs:[3,1,3,3],name:'מתילפרופאן: מסועף'}];
 const hpos=[[-12,-18],[12,-18],[0,20]];
 return <Fig viewBox="0 0 360 830" label="Two isomers with formula C4H10, butane as a chain and methylpropane as a branch, each drawn as a structural formula, a ball-and-stick model and a space-filling model.">
 {rows.map((r,ri)=>{const y0=ri*390+44;return <g key={ri}>
  <T x={180} y={y0+30} size={26} fill={accent}>{r.name}</T>
  {r.pts.length&&(()=>{const k=1.6;const P=r.pts.map(([x,y])=>[180-63*k+x*k,y0+(ri?150:112)+y*1.5*(ri?1.1:1)]);return <g>{r.ed.map(([a,b],j)=>{const e=trimEdge(P[a],P[b],25);return <L key={j} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} stroke={C.mut} w={2}/>})}{P.map(([x,y],j)=><T key={j} x={x} y={y+8} size={22} ltr fill={C.ink}>{'C'+(r.hs[j]?'H'+(r.hs[j]>1?r.hs[j]:''):'')}</T>)}</g>})()}
  {[90,265].map((ox,vi)=>{const sc=1;const P=r.pts.map(([x,y])=>[ox-63*sc+x*sc,y0+262+y*sc]);return <g key={vi}>
   {vi===0&&r.ed.map(([a,b],j)=><L key={j} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke={C.ink} w={5}/>)}
   {P.map(([x,y],j)=><Dot key={j} cx={x} cy={y} r={vi===0?13:24} fill={vi===0?C.soft:C.line} stroke={vi===0?C.ink:accent} opacity={vi===0?1:.8}/>)}
   {vi===0&&hDots(P,r)}
  </g>})}
  <T x={95} y={y0+342} size={20}>כדורים ומקלות</T><T x={265} y={y0+342} size={20}>מילוי חלל</T>
 </g>})}
 <T x={180} y={814} size={22}>אותה נוסחה, מבנה שונה, חומר שונה</T>
 </Fig>;
}
export function ExampleMoleculesNarrow({accent}){
 const A=(x,y,s,k)=><T key={k} x={x} y={y+8} size={24} ltr fill={C.ink}>{s}</T>;
 const G=(dx,dy,k,ch)=><g key={k} transform={`translate(${dx} ${dy})`}>{ch}</g>;
 return <Fig viewBox="0 0 360 650" label="Structural formulas of hydrogen peroxide, chloroethane, isopropanol and formic acid, plus a note on the cage shape of P4O10.">
 {G(55,0,1,<><T x={110} y={30} size={26} fill={accent}>H₂O₂</T>{A(40,80,'H',1)}<L x1={56} y1={76} x2={80} y2={76}/>{A(94,80,'O',2)}<L x1={110} y1={76} x2={134} y2={76}/>{A(148,80,'O',3)}<L x1={164} y1={76} x2={188} y2={76}/>{A(202,80,'H',4)}</>)}
 {G(-245,112,2,<><T x={430} y={30} size={26} fill={accent}>CH₃CH₂Cl</T>{A(350,80,'CH₃',5)}<L x1={376} y1={76} x2={398} y2={76}/>{A(420,80,'CH₂',6)}<L x1={446} y1={76} x2={468} y2={76}/>{A(486,80,'Cl',7)}</>)}
 {G(52,142,3,<><T x={120} y={140} size={26} fill={accent}>CH₃CH(OH)CH₃</T>{A(40,215,'CH₃',8)}<L x1={66} y1={211} x2={96} y2={211}/>{A(116,215,'CH',9)}<L x1={136} y1={211} x2={166} y2={211}/>{A(192,215,'CH₃',10)}<L x1={116} y1={196} x2={116} y2={176}/>{A(116,165,'OH',11)}</>)}
 {G(-238,292,4,<><T x={430} y={140} size={26} fill={accent}>HCO₂H</T>{A(366,215,'H',12)}<L x1={380} y1={211} x2={404} y2={211}/>{A(418,215,'C',13)}<L x1={414} y1={196} x2={414} y2={176}/><L x1={422} y1={196} x2={422} y2={176}/>{A(418,165,'O',14)}<L x1={432} y1={211} x2={456} y2={211}/>{A(470,215,'O',15)}<L x1={484} y1={211} x2={508} y2={211}/>{A(520,215,'H',16)}</>)}
 <T x={180} y={590} size={24}>P₄O₁₀: ארבעה אטומי זרחן</T><T x={180} y={626} size={24}>בתוך כלוב של עשרה אטומי חמצן</T>
 </Fig>;
}
export const extraFigures={'molecule-views':MoleculeViews,'example-molecules':ExampleMolecules};
export const extraSchematic=new Set(['molecule-views','example-molecules']);
const narrowFigures={'molecule-views':MoleculeViewsNarrow,'example-molecules':ExampleMoleculesNarrow};
export function FigureX({id,accent,Base}){const F=extraFigures[id],N=narrowFigures[id];const a=accent||'#71e4f4';return F?<><div className="gc1-wide"><F accent={a}/></div><div className="gc1-narrow"><N accent={a}/></div></>:<Base id={id} accent={accent}/>}
