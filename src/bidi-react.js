import React from 'react';
import {normalizeBidiText} from './bidi.js';
// Render normalized isolates as a tree so equations can have their own lines,
// including equations inside Hebrew parentheses. Plain values/units stay inline.
function isolateTree(text){const root=[];const stack=[root];for(let i=0;i<text.length;){const ch=text[i];if(ch==='\u2066'||ch==='\u2067'){const n={dir:ch==='\u2066'?'ltr':'rtl',children:[]};stack.at(-1).push(n);stack.push(n.children);i++}else if(ch==='\u2069'){if(stack.length>1)stack.pop();i++}else{let end=i+1;while(end<text.length&&!/[\u2066-\u2069]/.test(text[end]))end++;stack.at(-1).push(text.slice(i,end));i=end}}return root}
const equation=/[=≈≃≡→⇌↔<>≤≥]/u;
function hasEquation(nodes){return nodes.some(n=>typeof n==='string'?equation.test(n):hasEquation(n.children))}
function renderTree(nodes,inline=false){return nodes.map((n,i)=>{if(typeof n==='string')return n;const raw=n.children.filter(x=>typeof x==='string').join('');const context=n.dir==='rtl'&&hasEquation(n.children);const formula=n.dir==='ltr'&&equation.test(raw)&&!inline;return React.createElement('span',{key:i,dir:n.dir,className:context?'formula-context':formula?'formula-block':'bidi-run'},...renderTree(n.children,inline||context))})}

const normalizeChild=child=>typeof child==='string'?renderTree(isolateTree(normalizeBidiText(child))):Array.isArray(child)?child.map(normalizeChild):child;
// The default JSX display boundary covers content and UI labels. Machine values,
// accessible names, identifiers and links stay raw. No DOM rewriting is used.
const inlineChild=child=>typeof child==='string'?normalizeBidiText(child):Array.isArray(child)?child.map(inlineChild):child;
export function bidiElement(type,props,...children){const render=type==='text'||type==='tspan'?inlineChild:normalizeChild;return React.createElement(type,props,...children.map(render))}
