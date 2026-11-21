import missing from './formula-metadata.json' with {type:'json'};
import contexts from './formula-exercise-contexts.json' with {type:'json'};
// Metadata is explicit, reviewed content. No token/glyph recognition chooses a meaning.
// Inline text and SVG labels do not call this display-record resolver.
export function formulaMetadata(value,{symbols,context}={}){
 if(context)return context;
 if(symbols?.length)return {kind:'equation',symbols};
 const key=typeof value==='string'?value:JSON.stringify(value);
 return missing[key]||null;
}
export function exerciseFormulaContext(id){
 const record=contexts[id];
 if(!record)throw new Error('Missing exercise formula context: '+id);
 return record;
}
export {missing as explicitFormulaMetadata,contexts as exerciseFormulaContexts};
