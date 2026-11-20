import React from 'react';
import {bidiElement} from './bidi-react.js';
import {DisplayMath} from './scientific-text.js';
// Explicit authored blocks only. Historical lessons and bidi inference are unchanged.
export function FinalPrepSolution({blocks}){return <>{blocks.map((b,i)=>b.math?<DisplayMath key={i} text={b.math}/>:<p key={i}>{b.text}</p>)}</>}
