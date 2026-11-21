import React from 'react';
import {Formula} from './Formula.js';
export const isFormula=t=>/[=≥≤≈→<>]|[+−·×√]/.test(t);
export const Chips=({text})=><Formula text={text} variant="print"/>;
export const Expr=({expr,symbols,variant='compact'})=><Formula expr={expr} symbols={symbols} variant={variant}/>;
