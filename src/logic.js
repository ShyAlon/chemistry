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
export function numericCorrect(values,units,fields){return fields.every((f,i)=>{const n=parseNumber(values[i]);return Number.isFinite(n)&&Math.abs(n-f.value)<=Math.max(Math.abs(f.value)*.015,1e-30)&&units[i]===f.unit})}
export function loadProgress(storage,key='spectra-progress-v1'){try{const data=JSON.parse(storage.getItem(key)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}}
export function configuration(n){let left=Math.max(0,n);const result=[];for(const [shell,capacity] of [['1s',2],['2s',2],['2p',6],['3s',2],['3p',6],['4s',2],['3d',10],['4p',6],['5s',2],['4d',10],['5p',6],['6s',2],['4f',14],['5d',10],['6p',6],['7s',2],['5f',14],['6d',10],['7p',6]]){if(!left)break;const count=Math.min(left,capacity);result.push([shell,count]);left-=count}return result}

export const courseProgressKey=id=>'spectra-course-'+id+'-progress-v1';
export function loadCourseProgress(storage,courses){
 const all={};
 for(const course of courses){const key=courseProgressKey(course.id);all[course.id]=loadProgress(storage,key);try{if(course.id==='84102'&&!storage.getItem(key)){const old=storage.getItem('spectra-progress-v1');if(old){all[course.id]=loadProgress(storage);storage.setItem(key,JSON.stringify(all[course.id]));}}}catch{}}
 return all;
}
export function parseRoute(hash,courses){const parts=hash.replace(/^#/,'').split('/').filter(Boolean);if(parts[0]==='course'){const course=courses.find(c=>c.id===parts[1]);return {course:course||null,topicId:parts[2]||null,invalid:!course||!!parts[2]&&!course.topics.some(t=>t.id===parts[2])}}const legacy=courses.find(c=>c.id==='84102');if(legacy?.topics.some(t=>t.id===parts[0]))return {course:legacy,topicId:parts[0],invalid:false};return {course:null,topicId:null,invalid:parts.length>0}}
