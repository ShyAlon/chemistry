import {sections as readAloudSections} from '../src/read-aloud/sections.js';
// Build/test-only coverage checks. This module never guesses a scientific meaning.
import {createHash} from 'node:crypto';
import catalogue from './content-store.mjs';
import {courses,constants} from '../src/reference-formulas.js';
import {formulaMetadata,exerciseFormulaContexts} from '../src/formula-metadata.js';
import {SYMBOLS} from '../src/symbol-defs.js';
import {professorFormulaGroups} from '../src/professor-formulas-84101.js';
import {resolveConstants} from '../src/constants.js';
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
export const fingerprint=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
export function collectFormulaRecords(){
 const rows=[];
 const add=(key,expression,metadata)=>{if(typeof expression==='string')rows.push({key,expression,metadata})};
 for(const c of catalogue.courses)for(const t of c.topics)for(const [i,b]of t.content.theory.entries())if(b.layout==='equation')add(`${c.id}/${t.id}/theory/${i}`,b.text,formulaMetadata(b.text,{symbols:b.symbols}));
 for(const c of courses)for(const t of c.topics)for(const [label,expr,,symbols]of t.items)add(`${c.id}/${t.id}/${label}`,expr,formulaMetadata(expr,{symbols}));
 for(const [label,expr]of constants)add('constant/'+label,expr,formulaMetadata(expr));
 for(const [title,context]of Object.entries(exerciseFormulaContexts))for(const [i,expr]of context.expressions.entries())add(title+'/'+i,expr,context);
 for(const group of professorFormulaGroups)for(const [id,,expression,note,symbols]of group.items)add(`professor/84101/${group.id}/${id}`,resolveConstants(expression),{kind:'equation',symbols,explanation:note});
 for(const section of readAloudSections)for(const chunk of section.chunks)if(chunk.equation||chunk.math)add(`read-aloud/${chunk.id}`,chunk.math||chunk.display,formulaMetadata(chunk.math||chunk.display,{symbols:chunk.symbols}));
 return rows;
}
export function recordFingerprint(row,definitions=SYMBOLS){return fingerprint({...row,definitions:(row.metadata?.symbols||[]).map(id=>[id,definitions[id]])})}
export function validateCoverage(row,contract,definitions=SYMBOLS){
 const fail=message=>{throw new Error(row.key+': '+message)};
 const ids=row.metadata?.symbols||[];
 if(!contract||typeof contract.bindings!=='object')fail('missing reviewed quantity bindings');
 if(row.expression!==contract.expression)fail('expression changed; review quantity coverage');
 if(fingerprint({kind:row.metadata?.kind,explanation:row.metadata?.explanation})!==contract.contextDigest)fail('context explanation changed; review quantity coverage');
 if(!Array.isArray(contract.allowedSymbols))fail('missing reviewed context boundary');
 for(const id of ids)if(!contract.allowedSymbols.includes(id))fail('unreviewed context ID '+id);
 const tokens=[];
 for(const [text,id]of Object.entries(contract.bindings)){
  if(!text)fail('empty binding token');
  if(!definitions[id])fail('unknown definition '+id);
  if(!ids.includes(id))fail('missing required definition '+id+' for '+text);
  if(!row.expression.includes(text))fail('unused binding '+text);
  tokens.push(text);
 }
 for(const literal of contract.literals||[]){
  if(!literal.text||!['unit','function','label'].includes(literal.kind))fail('untyped notation literal');
  if(Object.hasOwn(contract.bindings,literal.text))fail('quantity also marked literal '+literal.text);
  if(!row.expression.includes(literal.text))fail('unused notation literal '+literal.text);
  tokens.push(literal.text);
 }
 tokens.sort((a,b)=>b.length-a.length);
 let rest=row.expression;
 while(rest){
  const token=tokens.find(t=>rest.startsWith(t));
  if(token){rest=rest.slice(token.length);continue}
  const number=rest.match(/^\d+(?:\.\d+)?/);
  if(number){rest=rest.slice(number[0].length);continue}
  if(/^[\s=+−\-×·*/()\[\]{}.,:;<>≤≥∝≈√^|…⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/u.test(rest)){rest=rest.slice(1);continue}
  fail('unclassified quantity or notation at '+rest.slice(0,45));
 }
 return true;
}
export function validateCoverageManifest(rows,manifest,definitions=SYMBOLS){
 if(manifest.version!==1)throw new Error('Unknown formula coverage manifest');
 const seen=new Set();let reviewed=0,legacy=0;
 for(const row of rows){
  if(seen.has(row.key))throw new Error('Duplicate formula record '+row.key);seen.add(row.key);
  if(manifest.reviewed[row.key]){validateCoverage(row,manifest.reviewed[row.key],definitions);reviewed++}
  else if(manifest.legacyUnreviewed[row.key]){
   if(recordFingerprint(row,definitions)!==manifest.legacyUnreviewed[row.key])throw new Error(row.key+': legacy record changed; add explicit quantity coverage, do not refresh the legacy hash');legacy++;
  }else throw new Error(row.key+': new display record needs explicit quantity coverage');
 }
 for(const key of [...Object.keys(manifest.reviewed),...Object.keys(manifest.legacyUnreviewed)])if(!seen.has(key))throw new Error('Removed or moved display record needs review: '+key);
 for(const [id,hash]of Object.entries(manifest.definitionDigests))if(fingerprint(definitions[id])!==hash)throw new Error('Reviewed definition changed; review its bindings: '+id);
 return {reviewed,legacy,total:rows.length};
}
