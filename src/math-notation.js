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
  else if(after[0]==='{'){const group=balancedGroup(after,0);if(group){body=group.body;consumed=group.end}}
  else{const m=after.match(/^[A-Za-z0-9.,]+/);if(m){body=m[0];consumed=m[0].length}}
  if(body===null){out.push('^');rest=after;continue}
  out.push(React.createElement('sup',{key:'s'+(n++)},...mathNotation(body)));
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
// Explicit fractions are opt-in authored notation, never guessed from a slash.
// The same recursive renderer works in inline math, equation faces, popups and print.
// Every body is React text/children, never HTML. Incomplete notation stays literal.
function balancedGroup(text,start){
 if(text[start]!=='{')return null;
 let depth=0;
 for(let i=start;i<text.length;i++){
  if(text[i]==='{')depth++;
  else if(text[i]==='}'&&!--depth)return {body:text.slice(start+1,i),end:i+1};
 }
 return null;
}
export function mathNotation(text){
 text=String(text);
 // Parse exponents before fractions so a fraction inside an exponent stays raised.
 const out=[];let rest=text,n=0;
 while(rest.length){
  const f=rest.indexOf('frac{'),power=rest.indexOf('^');
  if(power>=0&&(f<0||power<f)){
   const after=rest.slice(power+1);let body=null,consumed=0;
   if(after[0]==='{'){const g=balancedGroup(after,0);if(g){body=g.body;consumed=g.end}}
   else if(after[0]==='('){let depth=0;for(let i=0;i<after.length;i++){if(after[i]==='(')depth++;else if(after[i]===')'&&!--depth){body=after.slice(1,i);consumed=i+1;break}}}
   else {const m=after.match(/^[A-Za-z0-9.,]+/);if(m){body=m[0];consumed=m[0].length}}
   if(body!==null){out.push(...roots(rest.slice(0,power)),React.createElement('sup',{key:'p'+n++},...mathNotation(body)));rest=after.slice(consumed);continue}
  }
  if(f<0){out.push(...roots(rest));break}
  const a=balancedGroup(rest,f+4),b=a&&balancedGroup(rest,a.end);
  if(!a||!b){out.push(...roots(rest));break}
  const fenced=rest[f-1]==='('&&rest[b.end]===')';
  const fraction=React.createElement('span',{key:'f'+n++,className:'math-fraction'},
   React.createElement('span',{className:'math-numerator'},...mathNotation(a.body)),
   React.createElement('span',{className:'math-denominator'},...mathNotation(b.body)));
  out.push(...roots(rest.slice(0,f-(fenced?1:0))),fenced?React.createElement('span',{key:'g'+n++,className:'math-fenced'},
   React.createElement('span',{className:'math-fence'},'('),fraction,React.createElement('span',{className:'math-fence'},')')):fraction);
  rest=rest.slice(b.end+(fenced?1:0));
 }
 return out;
}
