// A single, idempotent display boundary. Stored answers, formulas and units stay raw.
const LRI='\u2066',RLI='\u2067',PDI='\u2069';
const hebrew=/[\u0590-\u05ff]/;
const ltr=/[A-Za-z0-9\u00b5\u00bc-\u00be\u00c0-\u02ff\u0370-\u03ff]/;
const closeFor={'(':')','[':']','{':'}'};
function closingAt(text,start){const stack=[];for(let i=start;i<text.length;i++){if(closeFor[text[i]])stack.push(closeFor[text[i]]);else if(Object.values(closeFor).includes(text[i])){if(text[i]!==stack.pop())return -1;if(!stack.length)return i}}return -1}
// Split only unambiguous statement boundaries outside brackets. A comma in
// n=1,2,3 stays in the formula; the comma in "s, l=1" separates statements.
function scientificParts(part){const out=[];let depth=0,start=0;for(let i=0;i<part.length;i++){
 if('([{'.includes(part[i]))depth++;else if(')]}'.includes(part[i]))depth=Math.max(0,depth-1);
 if(!depth&&((/[,;]/.test(part[i])&&/^\s*[A-Za-z\u0370-\u03ff][A-Za-z0-9_\u0370-\u03ff]*\s*[=≈<>≤≥]/u.test(part.slice(i+1)))||(part[i]==='.'&&/^\s+[A-Za-z0-9\u0370-\u03ff]/u.test(part.slice(i+1))))){out.push(part.slice(start,i),part[i]);start=i+1}
 }out.push(part.slice(start));return out}
function plain(text){
 // The first strong LTR character starts a scientific/Latin run. Brackets with
 // Hebrew content are already separate, so delimiters cannot leak across runs.
 const parts=text.split(/([\u0590-\u05ff]+)/u).flatMap(part=>hebrew.test(part)?[part]:scientificParts(part));
 return parts.map((part,index)=>{if(hebrew.test(part)||!ltr.test(part))return part;
   let start=part.search(/[A-Za-z0-9\u00b5\u00bc-\u00be\u00c0-\u02ff\u0370-\u03ff]/u);
   // Keep opening formula delimiters with the run, e.g. (SI), [Pa=kg/(m·s²)].
   const connectedHyphen=part.startsWith('-')&&hebrew.test(parts[index-1]||'');
   while(start>0&&'([{+−-±'.includes(part[start-1])&&!(start===1&&connectedHyphen))start--;
   let end=part.length;
   while(end>start&&/[\s.,;:!?،]/u.test(part[end-1]))end--;
   // A connecting Hebrew hyphen is punctuation, not a minus sign in the formula.
   const prefix=part.slice(0,start),body=part.slice(start,end),suffix=part.slice(end);
   return prefix+LRI+body+PDI+suffix;
 }).join('');
}
function normalize(text){let out='',buffer='';for(let i=0;i<text.length;i++){
 if(closeFor[text[i]]){const end=closingAt(text,i);if(end>=0){const inside=text.slice(i+1,end);if(hebrew.test(inside)){out+=plain(buffer)+RLI+text[i]+normalize(inside)+text[end]+PDI;buffer='';i=end;continue}}}
 buffer+=text[i];
 }return out+plain(buffer)}
export function normalizeBidiText(value){if(typeof value!=='string')return value;return normalize(value.replace(/[\u2066-\u2069]/g,''))}
