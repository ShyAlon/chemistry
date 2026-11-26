import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Dot,Box,Fig} from './figures-core.jsx';

// Original didactic drawings for Nanomaterials. No lecture artwork is reproduced.

// N1: the same volume, cut into 10 nm cubes, has a million times the surface area.
export function SurfaceAreaCut({accent}){
  const tiny=[];for(let i=0;i<8;i++)for(let j=0;j<8;j++)tiny.push(<rect key={i+'-'+j} x={330+i*20} y={44+j*20} width={16} height={16} fill="none" stroke={accent} strokeWidth={1.4}/>);
  return <Fig label="אותו נפח של סנטימטר מעוקב אחד: קובייה אחת עם שטח פנים של 6 סמ״ר, או 10 בחזקת 18 קוביות של 10 ננומטר עם שטח פנים כולל של בערך 600 מ״ר, פי מיליון" viewBox="0 -10 560 280">
    <Box x={30} y={40} w={150} h={150} fill={C.faint} stroke={C.mut}/>
    <T x={105} y={120} size={14} ltr fill={C.ink}>1 cm³</T>
    <T x={105} y={214} size={13} ltr fill={C.mut}>6 cm²</T>
    <T x={105} y={236} size={12} fill={C.mut}>שטח פנים</T>
    <Arrow x1={200} y1={115} x2={300} y2={115} stroke={accent} id="sac-arrow"/>
    <T x={250} y={100} size={12} fill={C.mut}>חיתוך</T>
    {tiny}
    <T x={410} y={214} size={13} ltr fill={accent}>≈ 600 m²</T>
    <T x={410} y={236} size={12} fill={C.mut}>שטח פנים כולל</T>
    <T x={410} y={256} size={11} ltr fill={C.mut}>10¹⁸ × (10 nm)³</T>
    <T x={280} y={40} size={14} ltr weight="bold" fill={accent}>×10⁶</T>
  </Fig>;
}

// N3: LaMer burst nucleation. Qualitative: monomer concentration against time.
export function LaMerBurst({accent}){
  return <Fig label="מודל LaMer: ריכוז המונומרים מול הזמן. בשלב I הריכוז עולה וחוצה את סף הגרעינות, בשלב II פרץ גרעינות קצר מוריד אותו מתחת לסף, ובשלב III יש גדילה בלבד והריכוז יורד לעבר ריכוז הרוויה" viewBox="0 -10 560 270">
    <rect x={70} y={10} width={125} height={200} fill={C.faint} opacity={0.55}/>
    <rect x={195} y={10} width={80} height={200} fill={accent} opacity={0.14}/>
    <rect x={275} y={10} width={245} height={200} fill={C.faint} opacity={0.55}/>
    <L x1={60} y1={210} x2={525} y2={210}/><L x1={60} y1={210} x2={60} y2={8}/>
    <Arrow x1={510} y1={210} x2={526} y2={210} stroke={C.line} id="lm-x"/><Arrow x1={60} y1={22} x2={60} y2={8} stroke={C.line} id="lm-y"/>
    <L x1={60} y1={90} x2={520} y2={90} stroke="#f0c978" dash="5 4"/>
    <L x1={60} y1={150} x2={520} y2={150} stroke="#f09797" dash="5 4"/>
    <path d="M70 205 C130 200 170 150 195 90 C205 62 215 45 235 42 C255 40 262 70 275 92 C300 130 340 142 380 146 C430 149 480 150 520 150" stroke={accent} strokeWidth={2.8} fill="none" strokeLinecap="round"/>
    <T x={84} y={84} size={11} ltr fill="#f0c978" anchor="start">C_min</T><T x={84} y={144} size={11} ltr fill="#f09797" anchor="start">C_s</T>
    <T x={430} y={80} size={12} fill="#f0c978">סף גרעינות</T><T x={430} y={170} size={12} fill="#f09797">ריכוז רוויה</T>
    <T x={132} y={30} size={13} weight="bold" ltr fill={C.ink}>I</T><T x={235} y={30} size={13} weight="bold" ltr fill={C.ink}>II</T><T x={350} y={30} size={13} weight="bold" ltr fill={C.ink}>III</T>
    <T x={132} y={50} size={11} fill={C.mut}>עלייה</T><T x={235} y={70} size={11} fill={accent}>פרץ גרעינות</T><T x={350} y={50} size={11} fill={C.mut}>גדילה בלבד</T>
    <T x={290} y={236} size={12} fill={C.mut}>זמן</T><T x={34} y={20} size={11} fill={C.mut}>ריכוז</T>
  </Fig>;
}
