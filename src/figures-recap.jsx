import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Box} from './figures-core.jsx';

// Original, compact diagrams. A narrow viewBox keeps labels readable on phones.
export function ElectronAffinitySigns({accent}){return <svg viewBox="0 0 240 365" role="img" aria-label="קליטת אלקטרון לכלור: שינוי אנרגיית המערכת שלילי ואנרגיית הזיקה לפי הגדרת החזרה חיובית" className="fig-svg" style={{maxWidth:320,margin:'auto'}}>
 <T x={120} y={66} size={24} fill={C.ink} ltr>Cl(g) + e⁻</T>
 <L x1={25} y1={85} x2={215} y2={85} stroke={accent} w={3}/>
 <Arrow x1={45} y1={100} x2={45} y2={205} stroke={accent} id="ea-down"/>
 <T x={142} y={140} size={24} fill={C.ink} ltr>ΔE = −349</T>
 <T x={142} y={175} size={23} ltr>kJ/mol</T>
 <L x1={25} y1={220} x2={215} y2={220} stroke={C.warn} w={3}/>
 <T x={120} y={254} size={24} fill={C.ink} ltr>Cl⁻(g)</T>
 <T x={120} y={300} size={23} fill={C.ink} ltr>EA = +349 kJ/mol</T>
 <T x={120} y={340} size={22} ltr>EA = −ΔE</T>
 </svg>}
export function ExamMethodMap({accent}){return <svg viewBox="0 0 240 530" role="img" aria-label="בחירת נוסחה לפי סוג הנתון: פוטון, חלקיק מסיבי, רמות אנרגיה, או קונפיגורציה" className="fig-svg" style={{maxWidth:320,margin:'auto'}}>
 {[[65,'פוטון','E = hc/λ'],[165,'חלקיק מסיבי','λ = h/p'],[265,'רמות אנרגיה','E(photon) = |ΔE|'],[365,'קונפיגורציה','N(e) = Z − q']].map(([y,label,formula])=><g key={label}>
  <Box x={10} y={y} w={220} h={85} stroke={accent}/><T x={120} y={y+30} size={24} fill={C.ink}>{label}</T><T x={120} y={y+64} size={23} ltr>{formula}</T>
 </g>)}
 <T x={120} y={490} size={23}>בודקים יחידות וסימן</T>
 <T x={120} y={522} size={23}>ומציינים מודל</T>
 </svg>}
