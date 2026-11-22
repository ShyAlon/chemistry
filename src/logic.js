export function wavelengthColor(w) {
 let r=0,g=0,b=0;
 if(w<440){r=-(w-440)/60;b=1}else if(w<490){g=(w-440)/50;b=1}else if(w<510){g=1;b=-(w-510)/20}else if(w<580){r=(w-510)/70;g=1}else if(w<645){r=1;g=-(w-645)/65}else{r=1}
 const factor=w<420?.3+.7*(w-380)/40:w>700?.3+.7*(780-w)/80:1;
 return `rgb(${[r,g,b].map(c=>Math.round(255*Math.pow(Math.max(0,c*factor),.8))).join(',')})`;
}
export function parseNumber(input){
 const supers={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+'};
 let s=String(input).trim().replace(/[−–]/g,'-').replace(/,/g,'').replace(/\s/g,'');
 s=s.replace(/10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+)/g,(_,x)=>'10^'+[...x].map(c=>supers[c]).join(''));
 s=s.replace(/[×xX·*]10\^?([+-]?\d+)/g,'e$1');
 if(/^10\^[+-]?\d+$/.test(s))return 10**Number(s.slice(3));
 if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(s))return NaN;
 return Number(s);
}
// Dimensionally equivalent units the answer dropdowns can offer together. Factors
// convert to the group's base unit (m for length, J for energy), so a physically
// correct answer passes in any supported unit of the same dimension, while a unit
// from another dimension is rejected. 1 eV = 1.602176634e-19 J (exact SI);
// 1 cal = 4.184 J (course convention, P1); 1 MeV = 1e6 eV.
const unitDimensions={
 m:['length',1],nm:['length',1e-9],pm:['length',1e-12],
 J:['energy',1],eV:['energy',1.602176634e-19],cal:['energy',4.184],MeV:['energy',1.602176634e-13]
};
function convertUnits(n,from,to){
 if(from===to)return n;
 const a=unitDimensions[from],b=unitDimensions[to];
 if(!a||!b||a[0]!==b[0])return NaN;
 return n*a[1]/b[1];
}
export function numericCorrect(values,units,fields){return fields.every((f,i)=>{const n=parseNumber(values[i]);if(!Number.isFinite(n))return false;const v=convertUnits(n,units[i],f.unit);return Number.isFinite(v)&&Math.abs(v-f.value)<=Math.max(Math.abs(f.value)*.015,1e-30)})}
export function configuration(n){let left=Math.max(0,n);const result=[];for(const [shell,capacity] of [['1s',2],['2s',2],['2p',6],['3s',2],['3p',6],['4s',2],['3d',10],['4p',6],['5s',2],['4d',10],['5p',6],['6s',2],['4f',14],['5d',10],['6p',6],['7s',2],['5f',14],['6d',10],['7p',6]]){if(!left)break;const count=Math.min(left,capacity);result.push([shell,count]);left-=count}return result}

export function parseRoute(hash,courses){const parts=hash.replace(/^#/,'').split('/').filter(Boolean);if(parts[0]==='course'){const course=courses.find(c=>c.id===parts[1]);return {course:course||null,topicId:parts[2]||null,invalid:!course||!!parts[2]&&!course.topics.some(t=>t.id===parts[2])}}const legacy=courses.find(c=>c.id==='84102');if(legacy?.topics.some(t=>t.id===parts[0]))return {course:legacy,topicId:parts[0],invalid:false};return {course:null,topicId:null,invalid:parts.length>0}}
