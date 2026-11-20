// Central physical constants. Edit a value or its displayed precision HERE only.
// `value` is the number used for display; `digits` is the number of significant
// digits shown in tooltips, symbol keys, glossary entries and print keys.
// Calculations inside worked examples and quiz answers keep their own authored
// numbers: changing `digits` here never rounds or alters any computed answer.
// Variants share one constant but differ in unit or in the value the course
// states (for example the exam sheet's R = 0.082 L·atm/(mol·K)).
export const CONSTANTS={
 R:{he:'קבוע הגזים האוניברסלי',value:8.314462618,unit:'J/(mol·K)',digits:4,variants:{
  latm:{value:0.082057366,unit:'L·atm/(mol·K)',digits:4},
  latm5:{value:0.082057366,unit:'L·atm/(mol·K)',digits:5},
  cal:{value:1.98720425864083,unit:'cal/(mol·K)',digits:4,note:'לחישובי חום בקלוריות'},
  value:{value:8.314462618,unit:'',digits:4,note:'המספר בלבד, כשהיחידה כבר מצוינת במשפט'},
  sheet:{value:0.082,unit:'L·atm/(mol·K)',digits:2,note:'הערך שבדף הבוחן'}}},
 'Nₐ':{he:'קבוע אבוגדרו',value:6.02214076e23,unit:'mol⁻¹',digits:4,variants:{count:{value:6.02214076e23,unit:'',digits:4,note:'המספר בלבד, כשהמשפט כבר מציין חלקיקים'}}},
 k:{he:'קבוע בולצמן',value:1.380649e-23,unit:'J/K',digits:4,variants:{}},
};
const sup={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
export function formatNumber(value,digits){
 const s=Number(value).toExponential(digits-1);const [m,e]=s.split('e');const exp=Number(e);
 if(exp>=-3&&exp<=4)return String(Number(value.toPrecision(digits)));
 return m+'×10'+String(exp).split('').map(c=>sup[c]).join('');
}
// ref is 'R', 'R@latm' or 'k'. Returns display text such as '8.314 J/(mol·K)'.
export function formatConstant(ref){
 const [id,variant]=ref.split('@');const c=CONSTANTS[id];if(!c)throw new Error('unknown constant '+ref);
 const v=variant?c.variants[variant]:c;if(!v)throw new Error('unknown constant variant '+ref);
 return (formatNumber(v.value,v.digits)+' '+v.unit).trim();
}
// Replace {R@latm}-style references in authored equation text.
export function resolveConstants(text){return String(text).replace(/\{([^{}]+)\}/g,(m,ref)=>{const [id,v]=ref.split('@');const c=CONSTANTS[id];return c&&(!v||c.variants[v])?formatConstant(ref):m})}
