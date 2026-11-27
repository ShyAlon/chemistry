import React from 'react';
import {C,T,L,Dot,Fig} from './figures-core.jsx';
// GC1 additions kept outside figures.jsx so general-chemistry-2 figure-bound reviews are unaffected.
// Schematic drawings, not to scale.
export function MoleculeViews({accent}){
 const rows=[{y:112,pts:[[0,12],[42,-12],[84,12],[126,-12]],ed:[[0,1],[1,2],[2,3]],hs:[3,2,2,3],name:'בוטאן: שרשרת'},{y:262,pts:[[0,24],[42,0],[84,24],[42,-40]],ed:[[0,1],[1,2],[1,3]],hs:[3,1,3,3],name:'מתילפרופאן: מסועף'}];
 const hpos=[[-12,-18],[12,-18],[0,20]];
 return <Fig viewBox="0 0 560 360" label="Two isomers with formula C4H10, butane as a chain and methylpropane as a branch, each drawn as a structural formula, a ball-and-stick model and a space-filling model.">
 <T x={100} y={26} size={18} fill={accent}>מבנית</T><T x={290} y={26} size={18} fill={accent}>כדורים ומקלות</T><T x={470} y={26} size={18} fill={accent}>מילוי חלל</T>
 {rows.map((r,ri)=><g key={ri}>
  <T x={280} y={r.y-(ri?76:58)} size={20}>{r.name}</T>
  {[110,290,470].map((ox,vi)=>{const P=r.pts.map(([x,y])=>[ox-63+x,r.y+y]);return <g key={vi}>
   {vi<2&&r.ed.map(([a,b],k)=><L key={k} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke={vi?C.ink:C.mut} w={vi?5:2}/>)}
   {P.map(([x,y],k)=>vi===0?<T key={k} x={x} y={y+7} size={20} ltr fill={C.ink}>{'C'+(r.hs[k]?'H'+(r.hs[k]>1?r.hs[k]:''):'')}</T>:<Dot key={k} cx={x} cy={y} r={vi===1?13:24} fill={vi===1?C.soft:C.line} stroke={vi===1?C.ink:accent} opacity={vi===1?1:.8}/>)}
   {vi===1&&P.map(([x,y],k)=>hpos.slice(0,r.hs[k]).map(([dx,dy],j)=><Dot key={k+'h'+j} cx={x+dx*1.3} cy={y+dy*1.3} r={5} fill={C.mut}/>))}
  </g>})}
 </g>)}
 <T x={280} y={348} size={18}>אותה נוסחה מולקולרית, מבנה שונה, חומר שונה</T>
 </Fig>;
}
export function ExampleMolecules({accent}){
 const A=(x,y,s,k)=><T key={k} x={x} y={y+7} size={20} ltr fill={C.ink}>{s}</T>;
 return <Fig viewBox="0 0 560 340" label="Structural formulas of hydrogen peroxide, chloroethane, isopropanol and formic acid, plus a note on the cage shape of P4O10.">
 <T x={110} y={30} size={20} fill={accent}>H₂O₂</T>{A(40,80,'H',1)}<L x1={56} y1={76} x2={80} y2={76}/>{A(94,80,'O',2)}<L x1={110} y1={76} x2={134} y2={76}/>{A(148,80,'O',3)}<L x1={164} y1={76} x2={188} y2={76}/>{A(202,80,'H',4)}
 <T x={430} y={30} size={20} fill={accent}>CH₃CH₂Cl</T>{A(350,80,'CH₃',5)}<L x1={376} y1={76} x2={398} y2={76}/>{A(420,80,'CH₂',6)}<L x1={446} y1={76} x2={468} y2={76}/>{A(486,80,'Cl',7)}
 <T x={120} y={140} size={20} fill={accent}>CH₃CH(OH)CH₃</T>{A(40,215,'CH₃',8)}<L x1={66} y1={211} x2={96} y2={211}/>{A(116,215,'CH',9)}<L x1={136} y1={211} x2={166} y2={211}/>{A(192,215,'CH₃',10)}<L x1={116} y1={196} x2={116} y2={176}/>{A(116,165,'OH',11)}
 <T x={430} y={140} size={20} fill={accent}>HCO₂H</T>{A(366,215,'H',12)}<L x1={380} y1={211} x2={404} y2={211}/>{A(418,215,'C',13)}<L x1={414} y1={196} x2={414} y2={176}/><L x1={422} y1={196} x2={422} y2={176}/>{A(418,165,'O',14)}<L x1={432} y1={211} x2={456} y2={211}/>{A(470,215,'O',15)}<L x1={484} y1={211} x2={508} y2={211}/>{A(520,215,'H',16)}
 <T x={280} y={300} size={18}>P₄O₁₀: ארבעה אטומי זרחן בתוך כלוב של עשרה אטומי חמצן</T>
 </Fig>;
}
export const extraFigures={'molecule-views':MoleculeViews,'example-molecules':ExampleMolecules};
export const extraSchematic=new Set(['molecule-views','example-molecules']);
export function FigureX({id,accent,Base}){const F=extraFigures[id];return F?<F accent={accent||'#71e4f4'}/>:<Base id={id} accent={accent}/>}
