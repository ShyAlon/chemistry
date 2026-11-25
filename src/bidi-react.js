import React from 'react';
import {mathNotation} from './math-notation.js';
import {normalizeBidiText} from './bidi.js';
// Direction is independent of layout. All inferred runs stay inline.
function isolateTree(text){const root=[];const stack=[root];for(let i=0;i<text.length;){const ch=text[i];if(ch==='\u2066'||ch==='\u2067'){const n={dir:ch==='\u2066'?'ltr':'rtl',children:[]};stack.at(-1).push(n);stack.push(n.children);i++}else if(ch==='\u2069'){if(stack.length>1)stack.pop();i++}else{let end=i+1;while(end<text.length&&!/[\u2066-\u2069]/.test(text[end]))end++;stack.at(-1).push(text.slice(i,end));i=end}}return root}
// A long left-to-right equation renders as an inline-block (see .bidi-eq): its own lines read top to bottom, left to right, instead of interleaving with the surrounding RTL text. Text content is unchanged.
function renderTree(input){const nodes=input.slice();return nodes.map((n,i)=>{if(typeof n==='string')return n;const raw=n.children.filter(c=>typeof c==='string').join('');const atomic=n.dir==='ltr'&&raw.length<=18&&(!/\s/.test(raw)||/[=≈<>≤≥\u2192]/.test(raw));const eq=!atomic&&n.dir==='ltr'&&/[=\u2248\u2264\u2265<>\u2192]/.test(raw)&&!/[A-Za-z]{4,}/.test(raw);
 // A sentence mark right after an equation block stays with it, so it cannot wrap onto a line of its own. Text order is unchanged.
 let tail='';if(eq&&typeof nodes[i+1]==='string'){const m=nodes[i+1].match(/^[.,;:]+/);if(m){tail=m[0];nodes[i+1]=nodes[i+1].slice(tail.length)}}
 return React.createElement('bdi',{key:i,dir:n.dir,className:atomic?'bidi-run bidi-short':eq?'bidi-run bidi-eq':'bidi-run'},...renderTree(n.children).flatMap(c=>n.dir==='ltr'&&typeof c==='string'?mathNotation(c):[c]),tail)})}
const normalizeChild=child=>typeof child==='string'?renderTree(isolateTree(normalizeBidiText(child))):Array.isArray(child)?child.map(normalizeChild):child;
const inlineChild=child=>typeof child==='string'?normalizeBidiText(child):Array.isArray(child)?child.map(inlineChild):child;
// Explicit directional elements already establish the correct boundary. Keep
// their strings raw; SVG text gets Unicode isolates, never invalid HTML nodes.
export function bidiElement(type,props,...children){const render=type==='text'||type==='tspan'?inlineChild:type==='bdi'||type==='bdo'||(props?.dir==='ltr'&&props?.className==='display-math')?x=>x:normalizeChild;return React.createElement(type,props,...children.map(render))}
