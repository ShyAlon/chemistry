import React from 'react';
import {bidiElement} from './bidi-react.js';
import {exerciseFormulaContext} from './formula-metadata.js';
import {Formula} from './Formula.js';
// Explicit authored blocks only. Historical lessons and bidi inference are unchanged.
export function FinalPrepSolution({blocks,contextId}){return <>{blocks.map((b,i)=>b.math?<Formula key={i} text={b.math} context={b.formulaContext||exerciseFormulaContext(contextId)}/>:<p key={i}>{b.text}</p>)}</>}
