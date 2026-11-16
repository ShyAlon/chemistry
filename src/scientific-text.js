import React from 'react';
import {bidiElement} from './bidi-react.js';
// Optional, explicit authored runs. Source strings stay intact for searching,
// provenance, answers and storage. No HTML parsing or DOM rewriting.
export function ScientificText({runs}){return React.createElement(React.Fragment,null,...runs.map((run,i)=>typeof run==='string'?bidiElement(React.Fragment,{key:i},run):run.keep?React.createElement('span',{key:i,className:'math-unit'},React.createElement(ScientificText,{runs:run.keep})):React.createElement('bdi',{key:i,dir:run.dir||'ltr',className:'inline-math'},run.math)));}
export function Definition({definition}){return React.createElement('div',{className:'scientific-definition'},
 React.createElement('p',null,React.createElement(ScientificText,{runs:definition.intro})),
 React.createElement('p',null,React.createElement(ScientificText,{runs:definition.range})),
 React.createElement('dl',{className:'math-definitions'},...definition.mappings.map(([term,value])=>React.createElement('div',{key:term},React.createElement('dt',null,React.createElement('bdi',{dir:'ltr'},term)),React.createElement('dd',null,React.createElement('bdi',{dir:'ltr'},value))))));}
export function DisplayMath({text}){return React.createElement('div',{className:'display-math',dir:'ltr',tabIndex:0,'aria-label':'נוסחה'},...text.split(/ {3,}/).map((line,i)=>React.createElement('div',{key:i},line)));}
