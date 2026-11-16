import React from 'react';
// Authored scientific labels may use ASCII subscripts where Unicode lacks letters
// (for example H_vap). Convert only the subscript suffix, never source data.
// A short temperature quantity is atomic even inside a longer, breakable relation.
function quantities(text){return text.split(/([+−-]?\d+(?:\.\d+)?[ \u00a0]?°[CF])/g).map((part,i)=>i%2?React.createElement('span',{key:i,className:'math-unit'},part):part)}
export function mathNotation(text){
 const parts=String(text).split(/(_(?:\{[A-Za-z0-9]+\}|[A-Za-z0-9]+))/g);
 return parts.map((part,i)=>i%2?React.createElement('sub',{key:i},part.slice(1).replace(/[{}]/g,'')):quantities(part));
}
