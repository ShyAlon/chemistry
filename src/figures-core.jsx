import {bidiElement} from './bidi-react.js';
import React from 'react';
// Shared atoms for didactic SVG figures. Dark-theme, RTL-safe: numbers and
// formulas are isolated LTR text elements; Hebrew labels are standalone runs.
export const C={line:'#3d5068',soft:'#26344a',faint:'#1b2637',ink:'#e8edf6',mut:'#93a5b8',dim:'#61748a',warn:'#f09797'};
// Children arrive pre-wrapped in bidi <span> elements by the component-level
// bidi normalization; those spans do not render inside SVG <text>. Flatten back
// to a plain string - the text element itself applies the needed direction.
const flatText=c=>Array.isArray(c)?c.map(flatText).join(''):(c&&c.props?flatText(c.props.children):String(c??''));
export function T({x,y,children,size=13,fill=C.mut,anchor='middle',dir,weight,ltr=false,dy=0}){
  return <text x={x} y={y} dy={dy} textAnchor={anchor} fontSize={size} fontFamily="Arial,'Helvetica Neue',sans-serif" fill={fill} fontWeight={weight} direction={ltr?'ltr':undefined} style={ltr?{unicodeBidi:'embed'}:undefined}>{flatText(children)}</text>;
}
export function L({x1,y1,x2,y2,stroke=C.line,w=1.5,dash,marker,opacity}){
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={w} strokeDasharray={dash} markerEnd={marker} opacity={opacity}/>;
}
export function Arrow({x1,y1,x2,y2,stroke,w=1.6,dash,id}){
  const m='arr'+(id||stroke.replace(/[^a-z0-9]/gi,''));
  return <>
    <defs><marker id={m} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill={stroke}/></marker></defs>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={w} strokeDasharray={dash} markerEnd={`url(#${m})`}/>
  </>;
}
// (x1,y1) is the top-left corner, (x2,y2) the bottom-right: draws an L-shaped
// axis pair with arrows at the top of the y-axis and right of the x-axis.
export function Axis({x1,y1,x2,y2,xLabel,yLabel,x2Label}){
  return <>
    <L x1={x1} y1={y1} x2={x1} y2={y2}/>
    <L x1={x1} y1={y2} x2={x2} y2={y2}/>
    <Arrow x1={x2-1} y1={y2} x2={x2+8} y2={y2} stroke={C.line}/>
    <Arrow x1={x1} y1={y1+1} x2={x1} y2={y1-8} stroke={C.line}/>
    {xLabel&&<T x={(x1+x2)/2} y={y2+34} ltr>{xLabel}</T>}
    {x2Label&&<T x={x2} y={y2+18} anchor="end" ltr>{x2Label}</T>}
    {yLabel&&<T x={x1-8} y={y1} anchor="end" ltr>{yLabel}</T>}
  </>;
}
export function Curve({d,stroke,w=2,dash,fill='none',opacity}){
  return <path d={d} stroke={stroke} strokeWidth={w} fill={fill} strokeDasharray={dash} opacity={opacity} strokeLinecap="round"/>;
}
export function Dot({cx,cy,r=4,fill,stroke,w=1.5,opacity}){
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={w} opacity={opacity}/>;
}
export function Box({x,y,w,h,stroke=C.line,fill='none',dash,rx=6,opacity}){
  return <rect x={x} y={y} width={w} height={h} rx={rx} stroke={stroke} fill={fill} strokeDasharray={dash} opacity={opacity}/>;
}
export function Fig({viewBox='0 0 560 320',children,label}){
  return <svg viewBox={viewBox} role="img" aria-label={label} className="fig-svg">{children}</svg>;
}
