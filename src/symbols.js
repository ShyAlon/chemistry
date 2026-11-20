import {SYMBOLS} from './symbol-defs.js';
import {formatConstant,resolveConstants} from './constants.js';
export {resolveConstants};
// A symbol reference is an id of SYMBOLS. Its meaning is a list of runs: plain
// Hebrew strings, {math} runs (always left-to-right) and {const} runs that read
// their displayed value from constants.js, so one edit updates every key.
export function symbolRow(id){const s=SYMBOLS[id];if(!s)throw new Error('unknown symbol '+id);
 return [s.sym,s.meaning.map(r=>typeof r==='string'||!r.const?r:{math:formatConstant(r.const)})]}
export const symbolRows=ids=>ids.map(symbolRow);
export function symbolText(id){const [sym,m]=symbolRow(id);return sym+' = '+m.map(r=>typeof r==='string'?r:r.math).join('')}
