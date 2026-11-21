import React from 'react';
// Authored scientific labels may use ASCII subscripts where Unicode lacks letters
// (for example H_vap). Convert only the subscript suffix, never source data.
// A short temperature quantity is atomic even inside a longer, breakable relation.
function quantities(text){return text.split(/([+−-]?\d+(?:\.\d+)?[ \u00a0]?°[CF])/g).map((part,i)=>i%2?React.createElement('span',{key:i,className:'math-unit'},part):part)}
function subscripts(part){return part.split(/(_(?:\{[A-Za-z0-9]+\}|[A-Za-z0-9]+))/g).map((p,i)=>i%2?React.createElement('sub',{key:i},p.slice(1).replace(/[{}]/g,'')):quantities(p))}
// Caret exponents mirror subscripts: ^(…), ^{…} or a bare short token render as a
// superscript. Parenthesized bodies are balanced, so nested bodies stay whole; an
// unbalanced ^ keeps its literal glyph. Authored strings keep the caret; only
// rendering changes, so theory equations and formula-sheet items share output.
function superscripts(part){
 const out=[];let rest=part,n=0;
 for(;;){
  const j=rest.indexOf('^');
  if(j<0){out.push(subscripts(rest));break}
  out.push(subscripts(rest.slice(0,j)));
  const after=rest.slice(j+1);
  let body=null,consumed=0;
  if(after[0]==='('){let depth=0,close=-1;for(let i=0;i<after.length;i++){const c=after[i];if(c==='(')depth++;else if(c===')'&&!--depth){close=i;break}}if(close>0){body=after.slice(1,close);consumed=close+1}}
  else if(after[0]==='{'){const close=after.indexOf('}');if(close>0){body=after.slice(1,close);consumed=close+1}}
  else{const m=after.match(/^[A-Za-z0-9.,]+/);if(m){body=m[0];consumed=m[0].length}}
  if(body===null){out.push('^');rest=after;continue}
  out.push(React.createElement('sup',{key:'s'+(n++)},...subscripts(body)));
  rest=after.slice(consumed);
 }
 return out;
}
// A square root reads as a radical with a bar (vinculum) over its body, not as
// √ followed by brackets: √(3RT/M) renders 3RT/M under the bar and the authored
// parentheses disappear. Parentheses are balanced, so nested bodies such as
// √(8RT/(πM)) stay whole, and a bare short token (√2, √M, √265,000) gets the bar
// too. An unbalanced √ keeps its literal glyph. Source strings are never changed.
const SUBSCRIPTS='₀₁₂₃₄₅₆₇₈₉ₐₑₒₓₔₕₖₗₘₙₚₛₜᵢᵣᵤᵥ';
function bareRoot(after){const m=after.match(new RegExp('^(?:\\d[\\d.,]*|[A-Za-zΑ-Ωα-ω](?:_[A-Za-z0-9]+|['+SUBSCRIPTS+']+)?)'));return m?m[0]:null}
function roots(text){
 const out=[];let rest=text,n=0;
 for(;;){
  const j=rest.indexOf('√');
  if(j<0){out.push(superscripts(rest));break}
  out.push(superscripts(rest.slice(0,j)));
  const after=rest.slice(j+1);
  if(after[0]==='('){
   let depth=0,close=-1;
   for(let i=0;i<after.length;i++){const c=after[i];if(c==='(')depth++;else if(c===')'&&!--depth){close=i;break}}
   if(close>0){
    out.push(React.createElement('span',{key:'r'+(n++),className:'math-root'},'√',React.createElement('span',{className:'math-root-body'},mathNotation(after.slice(1,close)))));
    rest=after.slice(close+1);continue;
   }
  }else{
   const token=bareRoot(after);
   if(token){
    out.push(React.createElement('span',{key:'r'+(n++),className:'math-root'},'√',React.createElement('span',{className:'math-root-body'},mathNotation(token))));
    rest=after.slice(token.length);continue;
   }
  }
  out.push('√');rest=after;
 }
 return out;
}
export function mathNotation(text){
 return roots(String(text));
}
