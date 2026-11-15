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
export function loadProgress(storage){try{const data=JSON.parse(storage.getItem('spectra-progress-v1')||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}}
export function configuration(n){return [['1s',Math.min(n,2)],['2s',Math.min(Math.max(n-2,0),2)],['2p',Math.max(n-4,0)]].filter(x=>x[1]>0)}
