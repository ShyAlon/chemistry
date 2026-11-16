import React from 'react';
import {normalizeBidiText} from './bidi.js';
// Direction is independent of layout. All inferred runs stay inline.
function isolateTree(text){const root=[];const stack=[root];for(let i=0;i<text.length;){const ch=text[i];if(ch==='\u2066'||ch==='\u2067'){const n={dir:ch==='\u2066'?'ltr':'rtl',children:[]};stack.at(-1).push(n);stack.push(n.children);i++}else if(ch==='\u2069'){if(stack.length>1)stack.pop();i++}else{let end=i+1;while(end<text.length&&!/[\u2066-\u2069]/.test(text[end]))end++;stack.at(-1).push(text.slice(i,end));i=end}}return root}
function renderTree(nodes){return nodes.map((n,i)=>{if(typeof n==='string')return n;const raw=n.children.filter(c=>typeof c==='string').join('');const atomic=n.dir==='ltr'&&raw.length<=18&&(!/\s/.test(raw)||/[=≈<>≤≥]/.test(raw));return React.createElement('bdi',{key:i,dir:n.dir,className:atomic?'bidi-run bidi-short':'bidi-run'},...renderTree(n.children))})}
const normalizeChild=child=>typeof child==='string'?renderTree(isolateTree(normalizeBidiText(child))):Array.isArray(child)?child.map(normalizeChild):child;
const inlineChild=child=>typeof child==='string'?normalizeBidiText(child):Array.isArray(child)?child.map(inlineChild):child;
// Explicit directional elements already establish the correct boundary. Keep
// their strings raw; SVG text gets Unicode isolates, never invalid HTML nodes.
export function bidiElement(type,props,...children){const render=type==='text'||type==='tspan'?inlineChild:type==='bdi'||type==='bdo'||(props?.dir==='ltr'&&props?.className==='display-math')?x=>x:normalizeChild;return React.createElement(type,props,...children.map(render))}
