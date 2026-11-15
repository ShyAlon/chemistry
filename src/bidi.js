// A single, idempotent display boundary. Stored answers, formulas and units stay raw.
const LRI='\u2066',RLI='\u2067',PDI='\u2069';
const hebrew=/[\u0590-\u05ff]/;
const ltr=/[A-Za-z0-9\u00b5\u00c0-\u02ff\u0370-\u03ff]/;
const closeFor={'(':')','[':']','{':'}'};
function closingAt(text,start){const stack=[];for(let i=start;i<text.length;i++){if(closeFor[text[i]])stack.push(closeFor[text[i]]);else if(Object.values(closeFor).includes(text[i])){if(text[i]!==stack.pop())return -1;if(!stack.length)return i}}return -1}
function plain(text){
 // The first strong LTR character starts a scientific/Latin run. Brackets with
 // Hebrew content are already separate, so delimiters cannot leak across runs.
 const parts=text.split(/([\u0590-\u05ff]+)/u);
 return parts.map(part=>{if(hebrew.test(part)||!ltr.test(part))return part;
   let start=part.search(/[A-Za-z0-9\u00b5\u00c0-\u02ff\u0370-\u03ff]/u);
   // Keep opening formula delimiters with the run, e.g. (SI), [Pa=kg/(m·s²)].
   while(start>0&&'([{'.includes(part[start-1]))start--;
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
