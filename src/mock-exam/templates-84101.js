// Variable-number mock-exam templates for General Chemistry I (84101).
// Derived from question TYPES in the course example set and supplied past exams;
// no lecturer text is copied. Constants follow the professor's current formula
// sheet: R = 0.08206 L·atm/(mol·K) = 8.314 J/(mol·K), Nₐ = 6.022e23.
// Every generate() returns unrounded answers; display rounds to 3 sig figs.
import {rng,intRange,pick} from './rng.js';

const R_ATM=0.08206,R_J=8.314,NA=6.022e23,KB=R_J/NA;
// Real van der Waals constants (L,atm). Never copied from source errors.
const GASES=[
 {name:'CO₂',M:44.01,a:3.592,b:0.04267,d:368e-12,linear:true},
 {name:'N₂',M:28.02,a:1.370,b:0.0387,d:368e-12,linear:true},
 {name:'CH₄',M:16.04,a:2.253,b:0.04278,d:380e-12,linear:false},
 {name:'He',M:4.00,a:0.0341,b:0.0237,d:260e-12,mono:true},
 {name:'NH₃',M:17.03,a:4.170,b:0.0371,d:290e-12,linear:false},
];
const fmt=(x,sig=3)=>Number(x.toPrecision(sig));
const fmtHe=(x,sig=3)=>{
 if(x!==0&&(Math.abs(x)<0.001||Math.abs(x)>=10000)){
  const [m,e]=x.toExponential(sig-1).split('e');
  return `${Number(m)}·10^(${Number(e)})`;
 }
 return String(fmt(x,sig));
};
const vdW=(n,T,V,a,b)=>R_ATM*n*T/(V-n*b)-a*n*n/(V*V);

// RG1: pressure from density via van der Waals, compressibility factor, meaning.
function genRG1(rand){
 const g=pick(rand,GASES.filter(x=>!x.mono));
 let n,T,tries=0,P;
 do{
  n=intRange(rand,2,12)/10;                 // mol in a 1.00 L vessel
  T=intRange(rand,280,450);
  P=vdW(n,T,1,g.a,g.b);
 }while((P<2||P>120)&&++tries<50);
 const Z=P*1/(n*R_ATM*T);
 return {
  __meta:{gas:g.name,n,T,a:g.a,b:g.b},
  given:`כלי בנפח 1.00 L מכיל ${fmtHe(n)} mol של ${g.name} בטמפרטורה ${T} K. מקדמי ואן דר ואלס: a = ${g.a} L²·atm/mol², b = ${g.b} L/mol. R = 0.08206 L·atm/(mol·K).`,
  parts:[
   {label:'א',kind:'numeric',unit:'atm',
    question:'מהו הלחץ בכלי לפי משוואת ואן דר ואלס?',
    answer:P,
    solution:[
     `P = nRT/(V − nb) − an²/V²`,
     `האיבר הראשון: ${fmtHe(n)}·0.08206·${T}/(1.00 − ${fmtHe(n)}·${g.b}) = ${fmtHe(R_ATM*n*T/(1-n*g.b))} atm.`,
     `תיקון המשיכה: ${g.a}·${fmtHe(n)}²/1.00² = ${fmtHe(g.a*n*n)} atm.`,
     `P = ${fmtHe(P)} atm.`]},
   {label:'ב',kind:'numeric',unit:'',
    question:'מהו מקדם הדחיסות Z בתנאים אלה?',
    answer:Z,
    solution:[
     `Z = PV/(nRT) = ${fmtHe(P)}·1.00/(${fmtHe(n)}·0.08206·${T}) = ${fmtHe(Z)}.`,
     Z>1?`Z > 1: תיקון הנפח (דחייה) שולט כאן.`:`Z < 1: תיקון המשיכה שולט כאן.`]},
   {label:'ג',kind:'concept',
    question:'הסבירו בשלוש שורות לכל היותר: מה לומד מקדם הדחיסות על הכוחות הדומיננטיים בגז בתנאים אלה?',
    modelAnswer:Z>1
     ?`Z = ${fmtHe(Z)} גדול מ-1, כלומר הלחץ גבוה מהתחזית האידיאלית: כוחות הדחייה (נפח עצמי של המולקולות) דומיננטיים בתנאים אלה.`
     :`Z = ${fmtHe(Z)} קטן מ-1, כלומר הלחץ נמוך מהתחזית האידיאלית: כוחות המשיכה בין המולקולות דומיננטיים בתנאים אלה.`},
  ]};
}

// RG2: same mass, two gases, different corrections (E9 family).
function genRG2(rand){
 const light=GASES.find(g=>g.name==='He');
 const heavy=pick(rand,GASES.filter(g=>['CO₂','N₂','CH₄'].includes(g.name)));
 let m,V,T,tries=0,pIdH,pVdH,pIdL,pVdL;
 do{
  m=intRange(rand,4,40);                    // grams of EACH gas
  V=intRange(rand,5,20)/10;                 // L
  T=intRange(rand,280,330);
  const nH=m/heavy.M,nL=m/light.M;
  pIdH=nH*R_ATM*T/V;pVdH=vdW(nH,T,V,heavy.a,heavy.b);
  pIdL=nL*R_ATM*T/V;pVdL=vdW(nL,T,V,light.a,light.b);
 }while((pVdH<1||pVdL>250)&&++tries<50);
 const nH=m/heavy.M,nL=m/light.M;
 return {
  __meta:{heavy:heavy.name,m,V,T},
  given:`שתי דגימות נפרדות: ${m} g של ${heavy.name} ו-${m} g של He. כל דגימה בכלי ${fmtHe(V)} L בטמפרטורה ${T} K. M(${heavy.name}) = ${heavy.M}, M(He) = 4.00 g/mol. ואן דר ואלס: ${heavy.name} עם a = ${heavy.a}, b = ${heavy.b}; He עם a = 0.0341, b = 0.0237 (L ו-atm). R = 0.08206.`,
  parts:[
   {label:'א',kind:'numeric',unit:'atm',
    question:'מהו הלחץ האידיאלי של כל דגימה? (רשמו את הלחץ של ה-He)',
    answer:pIdL,
    solution:[
     `n(${heavy.name}) = ${m}/${heavy.M} = ${fmtHe(nH)} mol; n(He) = ${m}/4.00 = ${fmtHe(nL)} mol. מסות שוות אינן מולים שווים.`,
     `P(He) = nRT/V = ${fmtHe(nL)}·0.08206·${T}/${fmtHe(V)} = ${fmtHe(pIdL)} atm.`,
     `(ולהשוואה: P(${heavy.name}) האידיאלי הוא ${fmtHe(pIdH)} atm.)`]},
   {label:'ב',kind:'numeric',unit:'atm',
    question:`מהו הלחץ של דגימת ה-${heavy.name} לפי ואן דר ואלס?`,
    answer:pVdH,
    solution:[
     `P = nRT/(V − nb) − an²/V² עם n = ${fmtHe(nH)} mol.`,
     `האיבר הראשון: ${fmtHe(R_ATM*nH*T/(V-nH*heavy.b))} atm; תיקון המשיכה: ${fmtHe(heavy.a*nH*nH/(V*V))} atm.`,
     `P = ${fmtHe(pVdH)} atm, מול ${fmtHe(pIdH)} atm במודל האידיאלי - סטייה של ${fmtHe(100*(pVdH-pIdH)/pIdH,2)}%.`]},
   {label:'ג',kind:'concept',
    question:'הסבירו בקצרה: מדוע הסטייה מהאידיאליות שונה בין שתי הדגימות, אף שהמסה, הנפח והטמפרטורה זהים?',
    modelAnswer:`הסטייה תלויה במספר המולים ובמקדמי a ו-b של כל גז: ל-He מולים רבים אך a זעיר (משיכה זניחה), ול-${heavy.name} מולים מעטים אך a משמעותי. לכן התיקונים שונים בגודלם ובכיוונם היחסי.`},
  ]};
}

// RG3: recover a and b from two pressure measurements (E10 family).
function genRG3(rand){
 const g=pick(rand,GASES.filter(x=>!x.mono));
 const n=intRange(rand,5,20)/10,T=intRange(rand,280,360);
 let V1,V2,tries=0,P1,P2;
 do{
  V1=intRange(rand,10,30)/10;V2=V1+intRange(rand,5,20)/10;
  P1=vdW(n,T,V1,g.a,g.b);P2=vdW(n,T,V2,g.a,g.b);
 }while((P1<2||P1>150)&&++tries<50);
 return {
  __meta:{gas:g.name,n,T,V1,V2},
  given:`דגימה של ${fmtHe(n)} mol גז לא ידוע בטמפרטורה קבועה ${T} K נמדדה בשני נפחים: בנפח ${fmtHe(V1)} L נמדד לחץ ${fmtHe(P1)} atm, ובנפח ${fmtHe(V2)} L נמדד לחץ ${fmtHe(P2)} atm. הגז מציית למשוואת ואן דר ואלס. R = 0.08206.`,
  parts:[
   {label:'א',kind:'numeric',unit:'L/mol',
    question:'שחזרו את המקדם b של הגז. (רמז: בידוד b ממערכת שתי המשוואות)',
    answer:g.b,
    solution:[
     `שתי משוואות: Pᵢ(Vᵢ − nb) = nRT − a·n²(Vᵢ − nb)/Vᵢ². מציבים את שני המדדים.`,
     `פתרון מספרי של המערכת (או חסם על b מכל משוואה בנפרד) נותן b = ${g.b} L/mol.`,
     `בדיקת שפיות: b חיובי וקטן בהרבה מנפח הכלי למול, כמצופה.`]},
   {label:'ב',kind:'numeric',unit:'L²·atm/mol²',
    question:'שחזרו את המקדם a של הגז.',
    answer:g.a,
    solution:[
     `לאחר ש-b = ${g.b} ידוע, מציבים באחת המשוואות: a = (nRT/(V − nb) − P)·V²/n².`,
     `עם הנפח ${fmtHe(V1)} L: a = ${g.a} L²·atm/mol².`,
     `הגז המתאים לערכים אלה הוא ${g.name} - אבל השאלה דרשה רק את השחזור המספרי.`]},
  ]};
}

// KT1: kinetic theory end to end (E2 family).
function genKT1(rand){
 const g=pick(rand,GASES.filter(x=>!x.mono));
 const V=intRange(rand,20,80)/10,T=intRange(rand,273,320),P=intRange(rand,4,12)/10;
 const n=P*V/(R_ATM*T);
 const Mkg=g.M/1000;
 const speeds={vmp:Math.sqrt(2*R_J*T/Mkg),vavg:Math.sqrt(8*R_J*T/(Math.PI*Mkg)),urms:Math.sqrt(3*R_J*T/Mkg)};
 const sKey=pick(rand,Object.keys(speeds));
 const sName={vmp:'המסתברת ביותר',vavg:'הממוצעת',urms:'הריבועית־ממוצעת־שורש'}[sKey];
 const sFormula={vmp:'√(2RT/M)',vavg:'√(8RT/πM)',urms:'√(3RT/M)'}[sKey];
 const lambda=R_J*T/(Math.SQRT2*Math.PI*g.d*g.d*NA*(P*101325));
 const z=speeds.vavg/lambda;
 return {
  __meta:{M:g.M,V,T,P,sKey,d:g.d},
  given:`בלון מכיל ${g.name} (M = ${g.M} g/mol) בנפח ${fmtHe(V)} L, בטמפרטורה ${T} K ובלחץ ${fmtHe(P)} atm. קוטר המולקולרי האפקטיבי: ${Math.round(g.d*1e12)} pm. R = 0.08206 L·atm/(mol·K) = 8.314 J/(mol·K); Nₐ = 6.022·10²³.`,
  parts:[
   {label:'א',kind:'numeric',unit:'mol',
    question:'כמה מולים של הגז יש בבלון?',
    answer:n,
    solution:[`n = PV/(RT) = ${fmtHe(P)}·${fmtHe(V)}/(0.08206·${T}) = ${fmtHe(n)} mol.`]},
   {label:'ב',kind:'numeric',unit:'m/s',
    question:`מהי המהירות ${sName} של המולקולות?`,
    answer:speeds[sKey],
    solution:[
     `M ביחידות kg/mol: ${Mkg}.`,
     `v = ${sFormula} = ${fmtHe(speeds[sKey])} m/s.`,
     `בדיקת סדר: v_mp < v_avg < u_rms (${fmtHe(speeds.vmp)} < ${fmtHe(speeds.vavg)} < ${fmtHe(speeds.urms)}).`]},
   {label:'ג',kind:'numeric',unit:'nm',
    question:'מהו המהלך החופשי הממוצע? (ענו ב-nm)',
    answer:lambda*1e9,
    solution:[
     `P בפסקל: ${fmtHe(P)} atm = ${fmtHe(P*101325,4)} Pa.`,
     `λ = RT/(√2·π·d²·Nₐ·P) = ${fmtHe(lambda*1e9)} nm.`,
     `סדר גודל שפוי: מאות פעמים קוטר המולקולה.`]},
   {label:'ד',kind:'numeric',unit:'1/s',
    question:'מה מספר ההתנגשויות לשנייה של מולקולה ממוצעת?',
    answer:z,
    solution:[
     `z = v_avg/λ = ${fmtHe(speeds.vavg)}/${fmtHe(lambda*1e9)} nm = ${fmtHe(z)} התנגשויות בשנייה.`]},
  ]};
}


// KT2: effusion and Graham's law, including an unknown-gas identification.
function genKT2(rand){
 const a=pick(rand,GASES), b=pick(rand,GASES.filter(g=>g.name!==a.name));
 const tA=intRange(rand,20,90);            // seconds for gas A
 const ratio=Math.sqrt(b.M/a.M);           // rA/rB
 const tB=tA*Math.sqrt(b.M/a.M);           // same amount through same hole
 return {
  __meta:{Ma:a.M,Mb:b.M,tA},
  given:`שני גזים, ${a.name} (M = ${a.M} g/mol) ו-${b.name} (M = ${b.M} g/mol), מחלחלים (אפוזיה) דרך אותו נקב זעיר באותה טמפרטורה. לאותה כמות של ${a.name} לוקח ${tA} שניות לחלחל.`,
  parts:[
   {label:'א',kind:'numeric',unit:'',
    question:`מהו היחס בין קצבי החלחול r(${a.name})/r(${b.name})?`,
    answer:ratio,
    solution:[
     `חוק גרהם: הקצב פרופורציוני למהירות הממוצעת, ולכן r(${a.name})/r(${b.name}) = √(M(${b.name})/M(${a.name})).`,
     `√(${b.M}/${a.M}) = ${fmtHe(ratio)}.`]},
   {label:'ב',kind:'numeric',unit:'s',
    question:`כמה שניות ייקח לאותה כמות של ${b.name} לחלחל דרך אותו נקב?`,
    answer:tB,
    solution:[
     `הזמן פרופורציוני ל-√M: t(${b.name}) = t(${a.name})·√(M(${b.name})/M(${a.name})).`,
     `t = ${fmtHe(tB)} שניות. ככל שהגז כבד יותר, החלחול איטי יותר.`]},
   {label:'ג',kind:'concept',
    question:'הסבירו מדוע קצב החלחול תלוי במסה המולרית אך לא (בקירוב טוב) בגודל הנקב.',
    modelAnswer:`מהירות התנועה התרמית של מולקולה נקבעת על ידי האנרגיה הקינטית הממוצעת 3kT/2, ולכן פרופורציונית ל-1/√M. גודל הנקב קובע כמה מולקולות עוברות בו זמנית (גורם משותף לשני הגזים), אבל יחס הקצבים בין שני גזים דרך אותו נקב תלוי רק ביחס המהירויות, כלומר ביחס המסות.`},
  ]};
}

// KT3: Maxwell-Boltzmann speeds and population ratio at two speeds.
function genKT3(rand){
 const g=pick(rand,GASES);
 const T=intRange(rand,250,600);
 const Mkg=g.M/1000;
 const vmp=Math.sqrt(2*R_J*T/Mkg);
 const f=Math.sqrt(1+intRange(rand,2,5)*intRange(rand,2,5)/10); // spread factor
 const v1=Math.round(vmp/50)*50, v2=v1+intRange(rand,2,5)*50;
 const ratioPop=(v1*v1*Math.exp(-Mkg*v1*v1/(2*R_J*T)))/(v2*v2*Math.exp(-Mkg*v2*v2/(2*R_J*T)));
 return {
  __meta:{M:g.M,T,v1,v2},
  given:`גז ${g.name} (M = ${g.M} g/mol) בטמפרטורה ${T} K. התפלגות המהירויות של מקסוול-בולצמן: f(v) פרופורציונית ל-v²·exp(−Mv²/2RT), כאשר M בקילוגרמים למול ו-R = 8.314 J/(mol·K).`,
  parts:[
   {label:'א',kind:'numeric',unit:'m/s',
    question:'מהי המהירות ההסתברות ביותר v_mp?',
    answer:vmp,
    solution:[
     `v_mp = √(2RT/M) עם M = ${fmtHe(Mkg,4)} kg/mol.`,
     `v_mp = √(2·8.314·${T}/${fmtHe(Mkg,4)}) = ${fmtHe(vmp)} m/s.`]},
   {label:'ב',kind:'numeric',unit:'',
    question:`מהו היחס בין מספר המולקולות בעלות מהירות ${v1} m/s לבין אלה בעלות מהירות ${v2} m/s (יחס ערכי f)?`,
    answer:ratioPop,
    solution:[
     `f(${v1})/f(${v2}) = (${v1}/${v2})²·exp(M(${v2}² − ${v1}²)/(2RT)).`,
     `המעריך: ${fmtHe(Mkg,4)}·(${v2*v2-v1*v1})/(2·8.314·${T}) = ${fmtHe(Mkg*(v2*v2-v1*v1)/(2*R_J*T),4)}.`,
     `היחס: ${fmtHe(ratioPop)}.`]},
   {label:'ג',kind:'concept',
    question:'מה קורה לצורת ההתפלגות כשמעלים את הטמפרטורה, ומדוע?',
    modelAnswer:'ההתפלגות מתרחבת ונעה ימינה: v_mp עולה כמו √T והזנב הארוך במהירויות גבוהות מתמלא. הסיבה: התוספת התרמית מחלקת אנרגיה קינטית רבה יותר, ומכיוון שהאנרגיה פרופורציונית ל-v², גדל גם הפיזור ולא רק הממוצע.'},
  ]};
}

// IG1: gas collected over water; partial pressure and moles of dry gas.
function genIG1(rand){
 const T=intRange(rand,278,318);            // K
 const tc=T-273;
 const pH2Omm=intRange(rand,12,40);         // mmHg, plausible 5-45 °C
 const Vml=intRange(rand,150,600);          // mL collected
 const pTotmm=intRange(rand,74,78)*10;      // barometric, mmHg
 const pDry=(pTotmm-pH2Omm)/760;            // atm
 const n=pDry*(Vml/1000)/(R_ATM*T);
 return {
  __meta:{T,pH2Omm,Vml,pTotmm},
  given:`גז נאסף מעל מים בטמפרטורה ${tc}°C. נפח הגז שנאסף ${Vml} mL, והברומטר מראה ${pTotmm} mmHg. לחץ אדי המים הרווי ב-${tc}°C הוא ${pH2Omm} mmHg.`,
  parts:[
   {label:'א',kind:'numeric',unit:'mmHg',
    question:'מהו הלחץ החלקי של הגז היבש?',
    answer:pTotmm-pH2Omm,
    solution:[
     `חוק דלטון: P(גז יבש) = P(כולל) − P(אדי מים) = ${pTotmm} − ${pH2Omm} = ${pTotmm-pH2Omm} mmHg.`]},
   {label:'ב',kind:'numeric',unit:'mol',
    question:'כמה מולים של גז יבש נאספו?',
    answer:n,
    solution:[
     `P = ${pTotmm-pH2Omm} mmHg = ${fmtHe(pDry,4)} atm; V = ${fmtHe(Vml/1000)} L; T = ${T} K.`,
     `n = PV/(RT) = ${fmtHe(pDry,4)}·${fmtHe(Vml/1000)}/(0.08206·${T}) = ${fmtHe(n,4)} mol.`]},
   {label:'ג',kind:'concept',
    question:'מדוע אסיפה מעל מים מתאימה רק לגזים שאינם מסיסים במים?',
    modelAnswer:'אם הגז מסיס, חלקו נמס במים במהלך האסיפה והנפח הנמדד קטן מהכמות שנוצרה בפועל, כך שהחישוב ייתן תוצאה נמוכה מדי. בנוסף, אדי המים תמיד נוכחים בנפח הנאסף ולכן מחסירים את לחץ האדים הרווי לקבלת הלחץ של הגז עצמו.'},
  ]};
}

// CC1: Clausius-Clapeyron in both directions.
function genCC1(rand){
 const substances=[
  {name:'מים',Hvap:40700,T1:298,P1:23.8},     // mmHg
  {name:'אתנול',Hvap:38600,T1:298,P1:59.0},
  {name:'אצטון',Hvap:31000,T1:298,P1:231},
 ];
 const s=pick(rand,substances);
 const T2=s.T1+intRange(rand,15,45);
 const lnP2=Math.log(s.P1)+(-s.Hvap/R_J)*(1/T2-1/s.T1);
 const P2=Math.exp(lnP2);
 return {
  __meta:{Hvap:s.Hvap,T1:s.T1,P1:s.P1,T2},
  given:`לחץ האדים הרווי של ${s.name} ב-${s.T1} K הוא ${s.P1} mmHg. משוואת קלאוזיוס-קלפירון: ln(P₂/P₁) = −(ΔHvap/R)·(1/T₂ − 1/T₁), R = 8.314 J/(mol·K).`,
  parts:[
   {label:'א',kind:'numeric',unit:'kJ/mol',
    question:`נמדד שב-${T2} K לחץ האדים הוא ${fmt(P2,4)} mmHg. חשבו את אנתלפיית האידוי ΔHvap.`,
    answer:s.Hvap/1000,
    solution:[
     `ln(${fmt(P2,4)}/${s.P1}) = ${fmtHe(Math.log(P2/s.P1),4)}; (1/${T2} − 1/${s.T1}) = ${fmtHe(1/T2-1/s.T1,4)} K⁻¹.`,
     `ΔHvap = −R·ln(P₂/P₁)/(1/T₂ − 1/T₁) = ${fmtHe(s.Hvap,4)} J/mol = ${fmt(s.Hvap/1000)} kJ/mol.`]},
   {label:'ב',kind:'numeric',unit:'mmHg',
    question:`בעזרת ΔHvap שמצאתם, חשבו את לחץ האדים הרווי ב-${T2+10} K.`,
    answer:Math.exp(Math.log(s.P1)+(-s.Hvap/R_J)*(1/(T2+10)-1/s.T1)),
    solution:[
     `ln(P/${s.P1}) = −(${fmtHe(s.Hvap,4)}/8.314)·(1/${T2+10} − 1/${s.T1}) = ${fmtHe((-s.Hvap/R_J)*(1/(T2+10)-1/s.T1),4)}.`,
     `P = ${s.P1}·e^(${fmtHe((-s.Hvap/R_J)*(1/(T2+10)-1/s.T1),4)}) = ${fmtHe(Math.exp(Math.log(s.P1)+(-s.Hvap/R_J)*(1/(T2+10)-1/s.T1)),4)} mmHg.`]},
   {label:'ג',kind:'concept',
    question:'מדוע לחץ האדים גדל עם הטמפרטורה בקצב מהיר יותר מליניארי?',
    modelAnswer:'מאזן אדים-נוזל הוא שיווי משקל, ולפי קלאוזיוס-קלפירון ln(P) תלוי ב-−ΔHvap/(RT): הלחץ גדל אקספוננציאלית בטמפרטורה. מבחינה מולקולרית, ככל שהטמפרטורה עולה גדלה משמעותית שבר המולקולות עם אנרגיה המספיקה להתגבר על כוחות המשיכה בנוזל.'},
  ]};
}

// CL1: colligative properties with a stated van 't Hoff factor.
function genCL1(rand){
 const salts=[
  {f:'NaCl',M:58.44,i:2},{f:'MgCl₂',M:95.21,i:3},{f:'FeCl₃',M:162.2,i:4},{f:'KNO₃',M:101.1,i:2},
 ];
 const s=pick(rand,salts);
 const grams=intRange(rand,20,80)/10;         // g
 const water=intRange(rand,40,90);            // g
 const n=grams/s.M;
 const molal=n/(water/1000);
 const dTf=s.i*1.86*molal;
 const C=n/((water+grams)/1000);              // approx volume in L ~ mass in kg for dilute
 const osm=s.i*C*R_ATM*298;
 return {
  __meta:{M:s.M,i:s.i,grams,water},
  given:`ממיסים ${fmtHe(grams)} גרם ${s.f} (M = ${s.M} g/mol) ב-${water} גרם מים. מניחים פירוק מלא (i = ${s.i}). Kf של מים 1.86 °C·kg/mol, R = 0.08206 L·atm/(mol·K), והטמפרטורה 25°C.`,
  parts:[
   {label:'א',kind:'numeric',unit:'°C',
    question:'בכמה מעלות מתחת לאפס תקפא התמיסה?',
    answer:dTf,
    solution:[
     `n = ${fmtHe(grams)}/${s.M} = ${fmtHe(n,4)} mol; מולליות = ${fmtHe(n,4)}/${fmtHe(water/1000)} = ${fmtHe(molal,4)} mol/kg.`,
     `ΔTf = i·Kf·m = ${s.i}·1.86·${fmtHe(molal,4)} = ${fmtHe(dTf)} °C, כלומר קיפאון ב-−${fmtHe(dTf)}°C.`]},
   {label:'ב',kind:'numeric',unit:'atm',
    question:'מהו הלחץ האוסמוטי של התמיסה ב-25°C (בקירוב: נפח התמיסה בליטרים שווה למסתה בקילוגרמים)?',
    answer:osm,
    solution:[
     `C ≈ ${fmtHe(n,4)}/${fmtHe((water+grams)/1000)} = ${fmtHe(C,4)} mol/L.`,
     `Π = i·C·R·T = ${s.i}·${fmtHe(C,4)}·0.08206·298 = ${fmtHe(osm)} atm.`]},
   {label:'ג',kind:'concept',
    question:'מדוע מלח מוריד את נקודת הקיפאון של מים אך כמות קטנה שלו כמעט אינה משנה את נקודת הרתיחה של כלוריד הכסף הלא-נדיף? …(ניסוח חלופי: מדוע ההשפעה על הקיפאון מורגשת יותר מעליית הרתיחה?)',
    modelAnswer:'שתי התכונות נובעות מירידת הלחץ הכימי של הממס, אבל המקדמים שונים: Kf של מים (1.86) גדול מ-Kb (0.512), ולכן באותה מולליות הירידה בקיפאון גדולה פי 3.6 מעליית הרתיחה. בנוסף, באלקטרוליטים מופיע גורם i המכפיל את שתי ההשפעות.'},
  ]};
}

// CL2: effective van 't Hoff factor and degree of dissociation from a measurement.
function genCL2(rand){
 const salts=[
  {f:'NaCl',M:58.44,nu:2},{f:'KCl',M:74.55,nu:2},{f:'MgCl₂',M:95.21,nu:3},{f:'CaCl₂',M:110.98,nu:3},
 ];
 const s=pick(rand,salts);
 const alpha=intRange(rand,60,95)/100;        // degree of dissociation
 const ieff=1+(s.nu-1)*alpha;
 const molal=intRange(rand,5,30)/100;         // mol/kg
 const dTf=ieff*1.86*molal;
 const dTfR=Math.round(dTf*100)/100;          // measured, 2 decimals
 const iBack=dTfR/(1.86*molal);
 const aBack=(iBack-1)/(s.nu-1);
 return {
  __meta:{nu:s.nu,alpha,molal},
  given:`תמיסה של ${s.f} במולליות ${fmtHe(molal)} mol/kg נקפאת ב-−${dTfR}°C. Kf של מים 1.86 °C·kg/mol. אילו הייתה התמיסה אידיאלית עם פירוק מלא, i היה ${s.nu}.`,
  parts:[
   {label:'א',kind:'numeric',unit:'',
    question:'מהו גורם ואן \'ט הוף האפקטיבי i בתמיסה?',
    answer:iBack,
    solution:[
     `i = ΔTf/(Kf·m) = ${dTfR}/(1.86·${fmtHe(molal)}) = ${fmtHe(iBack,4)}.`,
     `i < ${s.nu}: הפירוק אינו מלא.`]},
   {label:'ב',kind:'numeric',unit:'',
    question:'מהי מידת הפירוק α (בין 0 ל-1)?',
    answer:aBack,
    solution:[
     `i = 1 + (ν−1)·α עם ν = ${s.nu}, ולכן α = (i − 1)/(ν − 1) = (${fmtHe(iBack,4)} − 1)/${s.nu-1} = ${fmtHe(aBack,4)}.`,
     `כ-${Math.round(aBack*100)}% מהמלח מפורק בפועל.`]},
   {label:'ג',kind:'concept',
    question:'מה הגורם המולקולרי העיקרי לכך ש-i הנמדד קטן מהערך האידיאלי?',
    modelAnswer:'אטרקציות בין יונים מנוגדים במטען יוצרים "זוגות יונים" ומסך הידרסטטי סביב כל יון, כך שחלק מהיונים אינם מתנהגים כחלקיקים חופשיים. מספר החלקיקים האפקטיבי קטן מ-ν ולכן i < ν, והפער גדל עם הריכוז ועם מטען היונים.'},
  ]};
}

// NC1: nuclear chemistry, the full E5 method: complete the reaction by
// balancing mass number and charge, then mass defect, energy per reaction and
// energy per mole. Reactions are exothermic; constants from AME2020-style values.
function genNC1(rand){
 const reactions=[
  {text:'²H + ³H → ⁴He + n',shown:'²H + ³H → ⁴He + ?',missing:'נייטרון ¹n',
   balance:'מאזן מספרי מסה: 2 + 3 = 5 = 4 + 1. מאזן מטען: 1 + 1 = 2 = 2 + 0.',
   why:'זו תגובת היתוך: ²H + ³H → ⁴He + ¹n.',
   react:[2.01410,3.01605],prod:[4.00260,1.00866]},
  {text:'²³⁸U → ²³⁴Th + ⁴He',shown:'²³⁸U → ²³⁴Th + ?',missing:'גרעין הליום ⁴He',
   balance:'מאזן מסה: 238 = 234 + 4. מאזן מטען: 92 = 90 + 2.',
   why:'זו התפרקות אלפא: ²³⁸U → ²³⁴Th + ⁴He.',
   react:[238.05079],prod:[234.04360,4.00260]},
  {text:'⁷Li + ¹H → 2·⁴He',shown:'⁷Li + ¹H → 2 × ?',missing:'גרעין הליום ⁴He',
   balance:'מאזן מסה: 7 + 1 = 8 = 2×4. מאזן מטען: 3 + 1 = 4 = 2×2.',
   why:'התגובה המאוזנת: ⁷Li + ¹H → 2·⁴He.',
   react:[7.01600,1.00783],prod:[2*4.00260]},
 ];
 const r=pick(rand,reactions);
 const sum=a=>a.reduce((x,y)=>x+y,0);
 const dm=sum(r.react)-sum(r.prod);           // u
 const E=dm*931.5;                            // MeV per reaction
 const Emol=E*96.485e6;                       // kJ per mole (1 eV/molecule = 96.485 kJ/mol)
 return {
  __meta:{react:r.react,prod:r.prod,missing:r.missing},
  given:`נתונה התגובה הגרעינית (בצורתה המלאה): ${r.text}. מסות אטומיות (u): H-1 = 1.00783; H-2 = 2.01410; H-3 = 3.01605; He-4 = 4.00260; Li-7 = 7.01600; n = 1.00866; Th-234 = 234.04360; U-238 = 238.05079. ההמרה: 1 u = 931.5 MeV, ו-1 eV לחלקיק שווה 96.485 kJ/mol.`,
  parts:[
   {label:'א',kind:'concept',
    question:`השלימו את התגובה: ${r.shown} נמקו במאזן מספר מסה ומטען.`,
    modelAnswer:`${r.balance} החלקיק החסר הוא ${r.missing}. ${r.why}`},
   {label:'ב',kind:'numeric',unit:'u',
    question:'מהו שינוי המסה בתגובה (חסר המסה, בסימן חיובי אם נפלטת אנרגיה)?',
    answer:dm,
    solution:[
     `מסת מגיבים: ${r.react.map(x=>x.toFixed(5)).join(' + ')} = ${sum(r.react).toFixed(5)} u.`,
     `מסת תוצרים: ${r.prod.map(x=>x.toFixed(5)).join(' + ')} = ${sum(r.prod).toFixed(5)} u.`,
     `Δm = ${dm.toFixed(5)} u.`]},
   {label:'ג',kind:'numeric',unit:'MeV',
    question:'מהי האנרגיה הנפלטת בתגובה אחת?',
    answer:E,
    solution:[
     `E = Δm·931.5 = ${dm.toFixed(5)}·931.5 = ${fmtHe(E,4)} MeV.`]},
   {label:'ד',kind:'numeric',unit:'kJ/mol',
    question:'מהי האנרגיה הנפלטת למול מגיבים, ב-kJ/mol?',
    answer:Emol,
    solution:[
     `כל MeV לחלקיק בודד שווה 96.485·10⁶ kJ/mol.`,
     `E = ${fmtHe(E,4)}·96.485·10⁶ = ${fmtHe(Emol,4)} kJ/mol — סדר גודל של מיליארד, כמיליון פעמים מתגובה כימית טיפוסית.`]},
   {label:'ה',kind:'concept',
    question:'מדוע משתמשים במסות אטומיות (עם אלקטרונים) ולא במסות גרעינים, ומתי הקירוב תקף?',
    modelAnswer:'מסות אטומיות כוללות את האלקטרונים של כל אטום. כאשר מספר האלקטרונים הכולל שווה בשני צידי התגובה, מסות האלקטרונים מצטמצמות בהפרש והקירוב תקף. בתגובות בהן משתנה מספר האלקטרונים (למשל לכידת אלקטרון או בטא פלוס) יש לתקן.'},
  ]};
}

// NC2: isotope abundance from average atomic mass.
function genNC2(rand){
 const pairs=[
  {el:'כסף',m1:106.905,m2:108.905,avg:107.868,a1:'¹⁰⁷Ag',a2:'¹⁰⁹Ag'},
  {el:'נחושת',m1:62.9296,m2:64.9278,avg:63.546,a1:'⁶³Cu',a2:'⁶⁵Cu'},
  {el:'ברום',m1:78.9183,m2:80.9163,avg:79.904,a1:'⁷⁹Br',a2:'⁸¹Br'},
  {el:'כלור',m1:34.96885,m2:36.96590,avg:35.453,a1:'³⁵Cl',a2:'³⁷Cl'},
 ];
 const p=pick(rand,pairs);
 const x1=(p.avg-p.m2)/(p.m1-p.m2);
 return {
  __meta:{m1:p.m1,m2:p.m2,avg:p.avg},
  given:`ליסוד ${p.el} שני איזוטופים טבעיים: ${p.a1} במסה ${p.m1} u ו-${p.a2} במסה ${p.m2} u. המסה האטומית הממוצעת בטבע היא ${p.avg} u.`,
  parts:[
   {label:'א',kind:'numeric',unit:'',
    question:`מהו השבר המולרי של ${p.a1} בטבע?`,
    answer:x1,
    solution:[
     `x·${p.m1} + (1−x)·${p.m2} = ${p.avg}.`,
     `x = (${p.avg} − ${p.m2})/(${p.m1} − ${p.m2}) = ${fmtHe(x1,4)}.`]},
   {label:'ב',kind:'numeric',unit:'%',
    question:`מהו האחוז הטבעי של ${p.a2}?`,
    answer:100*(1-x1),
    solution:[
     `100·(1 − ${fmtHe(x1,4)}) = ${fmtHe(100*(1-x1),4)}%.`]},
   {label:'ג',kind:'concept',
    question:'מדוע המסה האטומית בטבלה המחזורית אינה מספר שלם, בעוד מספר המסה של כל איזוטופ כן שלם (בקירוב)?',
    modelAnswer:'הטבלה נותנת ממוצע משוקלל של האיזוטופים הטבעיים לפי שכיחותם, ולכן הערך בדרך כלל שברי. כל איזוטופ בנפרד מכיל מספר שלם של פרוטונים ונייטרונים, ולכן מספר המסה שלו שלם; הסטייה הקטנה מהשלמות נובעת מחסר המסה של אנרגיית הקשירה ומהפרשי מסת פרוטון-נייטרון.'},
  ]};
}

// ST1: combustion analysis with clean stoichiometry.
function genST1(rand){
 const compounds=[
  {f:'C₃H₈O',M:60.10,co2:3,h2o:4,o2:4.5,grams:3.00},
  {f:'C₂H₆O',M:46.07,co2:2,h2o:3,o2:3,grams:2.30},
  {f:'C₄H₁₀O',M:74.12,co2:4,h2o:5,o2:6,grams:3.70},
 ];
 const c=pick(rand,compounds);
 const grams=Math.round(c.grams*(90+intRange(rand,0,20)))/100;  // +/-10% sample size
 const n=grams/c.M;
 const nCO2=Math.round(n*c.co2*1000)/1000, nH2O=Math.round(n*c.h2o*1000)/1000;
 const mC=nCO2*12.011, mH=2*nH2O*1.008, mO=grams-mC-mH;
 const VO2=n*c.o2*22.414;
 return {
  __meta:{M:c.M,co2:c.co2,h2o:c.h2o,o2:c.o2,grams,nCO2,nH2O},
  given:`${fmtHe(grams)} גרם של תרכובת אורגנית המכילה C, H ו-O בלבד נשרפו לחלוטין. התקבלו ${nCO2} mol של CO₂ ו-${nH2O} mol של H₂O. (מסות אטומיות: C = 12.011, H = 1.008, O = 15.999; נפח מולרי ב-STP: 22.414 L.)`,
  parts:[
   {label:'א',kind:'numeric',unit:'g',
    question:'כמה גרמים של חמצן היו בדגימה?',
    answer:mO,
    solution:[
     `m(C) = ${nCO2}·12.011 = ${fmtHe(mC)} g; m(H) = 2·${nH2O}·1.008 = ${fmtHe(mH)} g.`,
     `m(O) = ${fmtHe(grams)} − ${fmtHe(mC)} − ${fmtHe(mH)} = ${fmtHe(mO)} g.`]},
   {label:'ב',kind:'concept',
    question:'מהי הנוסחה האמפירית של התרכובת?',
    modelAnswer:`n(C) = ${nCO2} mol, n(H) = ${fmtHe(2*nH2O,4)} mol, n(O) = ${fmtHe(mO)}/15.999 = ${fmtHe(mO/15.999,4)} mol. חלוקה בקטן ביותר נותנת את היחסים השלמים של ${c.f}, ולכן הנוסחה האמפירית היא ${c.f}.`},
   {label:'ג',kind:'numeric',unit:'L',
    question:'מה נפח החמצן (ב-STP) שנדרש לשריפה המלאה של הדגימה?',
    answer:VO2,
    solution:[
     `משוואת השריפה של ${c.f} דורשת ${c.o2} mol O₂ לכל מול תרכובת.`,
     `n(תרכובת) = ${fmtHe(grams)}/${c.M} = ${fmtHe(n,4)} mol, ולכן n(O₂) = ${fmtHe(n*c.o2,4)} mol.`,
     `V = ${fmtHe(n*c.o2,4)}·22.414 = ${fmtHe(VO2)} L.`]},
  ]};
}


// DS1: multi-cycle Raoult distillation (derived from the E3 type).
function genDS1(rand){
 const pairs=[
  {a:{name:'בנזן',M:78.11,P:95.1},b:{name:'טולואן',M:92.14,P:28.4}},
  {a:{name:'אתנול',M:46.07,P:59.0},b:{name:'פרופנול',M:60.10,P:23.0}},
  {a:{name:'אצטון',M:58.08,P:231},b:{name:'מים',M:18.02,P:23.8}},
 ];
 const p=pick(rand,pairs);
 const mA=intRange(rand,3,9),mB=intRange(rand,3,9);
 const nA=mA/p.a.M,nB=mB/p.b.M,xA=nA/(nA+nB);
 const P1=xA*p.a.P+(1-xA)*p.b.P, y1=xA*p.a.P/P1;
 const P2=y1*p.a.P+(1-y1)*p.b.P, y2=y1*p.a.P/P2;
 return {
  __meta:{Pa:p.a.P,Pb:p.b.P,Ma:p.a.M,Mb:p.b.M,mA,mB},
  given:`מערבבים ${mA} גרם ${p.a.name} (M = ${p.a.M} g/mol) עם ${mB} גרם ${p.b.name} (M = ${p.b.M} g/mol). התמיסה אידיאלית. לחצני האדים הרוויים: ${p.a.name} ${p.a.P} mmHg, ${p.b.name} ${p.b.P} mmHg.`,
  parts:[
   {label:'א',kind:'numeric',unit:'mmHg',
    question:'מה לחץ האדים הכולל מעל התמיסה?',
    answer:P1,
    solution:[
     `n(${p.a.name}) = ${mA}/${p.a.M} = ${fmtHe(nA,4)} mol; n(${p.b.name}) = ${fmtHe(nB,4)} mol; x = ${fmtHe(xA,4)}.`,
     `P = x·P°(${p.a.name}) + (1−x)·P°(${p.b.name}) = ${fmtHe(xA*p.a.P,4)} + ${fmtHe((1-xA)*p.b.P,4)} = ${fmtHe(P1,4)} mmHg.`]},
   {label:'ב',kind:'numeric',unit:'',
    question:`מה השבר המולרי של ${p.a.name} באדים מעל התמיסה?`,
    answer:y1,
    solution:[
     `y = x·P°(${p.a.name})/P = ${fmtHe(xA*p.a.P,4)}/${fmtHe(P1,4)} = ${fmtHe(y1,4)}.`,
     'האדים עשירים ברכיב הנדיף יותר.']},
   {label:'ג',kind:'numeric',unit:'',
    question:`מעבים את האדים לנוזל חדש ומאדים שוב באותה טמפרטורה. מה השבר המולרי של ${p.a.name} באדים החדשים?`,
    answer:y2,
    solution:[
     `הנוזל החדש הוא x = ${fmtHe(y1,4)}. מפעילים את ראול שוב: P₂ = ${fmtHe(P2,4)} mmHg.`,
     `y₂ = ${fmtHe(y1*p.a.P,4)}/${fmtHe(P2,4)} = ${fmtHe(y2,4)}.`,
     'כל מחזור אידוי-עיבוי מעשיר עוד את הרכיב הנדיף; על כך מבוססת עמודת הזיקוק.']},
   {label:'ד',kind:'concept',
    question:'מדוע מספר מחזורי אידוי-עיבוד מפריד טוב יותר ממחזור אחד ארוך?',
    modelAnswer:'כל מחזור מעשיר את האדים ברכיב הנדיף בגורם קבוע בקירוב, ולכן ההעשרה מצטברת אקספוננציאלית במספר המחזורים. מחזור אחד, ארוך ככל שיהיה, מסתפק בהפרדה של שלב שיווי-משקל יחיד; עמודת זיקוק מממשת שרשרת רציפה של שיוויי משקל כאלה.'},
  ]};
}

// DS2: dew point under isothermal compression (derived from the E6 type).
function genDS2(rand){
 const pairs=[
  {a:{name:'בנזן',P:95.1},b:{name:'טולואן',P:28.4}},
  {a:{name:'אצטון',P:231},b:{name:'מים',P:23.8}},
 ];
 const p=pick(rand,pairs);
 const yA=intRange(rand,30,70)/100;
 const Pdew=1/(yA/p.a.P+(1-yA)/p.b.P);
 const xA=Pdew*yA/p.a.P;
 return {
  __meta:{Pa:p.a.P,Pb:p.b.P,yA},
  given:`תערובת אדים של ${p.a.name} ו-${p.b.name} עם שבר מולרי ${p.a.name} y = ${fmtHe(yA)} נדחסת באטיות בטמפרטורה קבועה. לחצני הרוויה: ${p.a.name} ${p.a.P} mmHg, ${p.b.name} ${p.b.P} mmHg. התמיסה אידיאלית.`,
  parts:[
   {label:'א',kind:'numeric',unit:'mmHg',
    question:'באיזה לחץ מתחילה הטיפה הראשונה להתעבות (נקודת הטל)?',
    answer:Pdew,
    solution:[
     `בנקודת הטל: 1/P = y₁/P°₁ + y₂/P°₂ (סכום הלחצים החלקיים שווי הרוויה).`,
     `1/P = ${fmtHe(yA)}/${p.a.P} + ${fmtHe(1-yA)}/${p.b.P} = ${fmtHe(1/Pdew,4)} mmHg⁻¹.`,
     `P = ${fmtHe(Pdew,4)} mmHg.`]},
   {label:'ב',kind:'numeric',unit:'',
    question:`מה השבר המולרי של ${p.a.name} בטיפה הראשונה שמתעבה?`,
    answer:xA,
    solution:[
     `הלחץ החלקי בנקודת הטל: P·y = ${fmtHe(Pdew*yA,4)} mmHg, ומראול: x = P·y/P° = ${fmtHe(Pdew*yA,4)}/${p.a.P} = ${fmtHe(xA,4)}.`,
     `הטיפה ענייה ב-${p.a.name} הנדיף ועשירה ברכיב הכבד.`]},
   {label:'ג',kind:'concept',
    question:'מדוע הטיפה הראשונה עשירה דווקא ברכיב פחות נדיף?',
    modelAnswer:'עם הדחיסה שני הלחצים החלקיים עולים יחד באותו יחס, אבל לחץ הרוויה של הרכיב פחות הנדיף נמוך יותר, ולכן הוא מגיע קודם לרוויה ביחס לחלקו באדים. שיווי המשקל מחייב שהנוזל הראשון יהיה עשיר ברכיב בעל לחץ הרוויה הנמוך.'},
  ]};
}

// RA1: Raoult in reverse — recover saturation pressures from two mixtures.
function genRA1(rand){
 const PA=intRange(rand,20,40)*10, PB=intRange(rand,5,14)*10;   // mmHg
 const nA1=intRange(rand,10,20)/10,nB1=intRange(rand,10,30)/10;
 const addA=intRange(rand,5,15)/10;
 const N1=nA1+nB1,P1=(nA1/N1)*PA+(nB1/N1)*PB;
 const N2=N1+addA,P2=((nA1+addA)/N2)*PA+(nB1/N2)*PB;
 const P1r=Math.round(P1*10)/10,P2r=Math.round(P2*10)/10;
 // Student solves the 2x2 linear system from the rounded measurements.
 const xa1=nA1/N1,xb1=nB1/N1,xa2=(nA1+addA)/N2,xb2=nB1/N2;
 const det=xa1*xb2-xa2*xb1;
 const PAs=(P1r*xb2-P2r*xb1)/det,PBs=(xa1*P2r-xa2*P1r)/det;
 return {
  __meta:{PA,PB,nA1,nB1,addA},
  given:`שני נוזלים A ו-B יוצרים תמיסה אידיאלית. תמיסה של ${fmtHe(nA1)} mol מ-A ו-${fmtHe(nB1)} mol מ-B נותנת לחץ אדים כולל ${P1r} mmHg. אחרי הוספת ${fmtHe(addA)} mol של A הלחץ הכולל הוא ${P2r} mmHg.`,
  parts:[
   {label:'א',kind:'numeric',unit:'mmHg',
    question:'מהו לחץ האדים הרווי של A הטהור?',
    answer:PAs,
    solution:[
     `שתי משוואות ראול: ${fmtHe(xa1,4)}·P°A + ${fmtHe(xb1,4)}·P°B = ${P1r} ו-${fmtHe(xa2,4)}·P°A + ${fmtHe(xb2,4)}·P°B = ${P2r}.`,
     `פתרון המערכת: P°A = ${fmtHe(PAs,4)} mmHg (הערך האמיתי: ${PA} mmHg; סטיית עיגול המדידות קטנה מהסובלנות).`]},
   {label:'ב',kind:'numeric',unit:'mmHg',
    question:'מהו לחץ האדים הרווי של B הטהור?',
    answer:PBs,
    solution:[
     `הצבה חוזרת: P°B = (${P1r} − ${fmtHe(xa1,4)}·${fmtHe(PAs,4)})/${fmtHe(xb1,4)} = ${fmtHe(PBs,4)} mmHg (אמיתי: ${PB} mmHg).`]},
   {label:'ג',kind:'numeric',unit:'',
    question:'מה השבר המולרי של A באדים מעל התמיסה השנייה?',
    answer:xa2*PAs/P2r,
    solution:[
     `y_A = x_A·P°A/P = ${fmtHe(xa2,4)}·${fmtHe(PAs,4)}/${P2r} = ${fmtHe(xa2*PAs/P2r,4)}.`]},
   {label:'ד',kind:'concept',
    question:'מה היה משתנה אילו התמיסה הייתה לא־אידיאלית עם אינטראקציות A-B חזקות במיוחד?',
    modelAnswer:'אינטראקציות A-B חזקות מורידות את הלחץ מתחת לתחזית ראול (סטייה שלילית): הלחצים הנמדדים היו נמוכים יותר, והפתרון הליניארי של שתי המשוואות לא היה מחזיר את לחצני הרוויה האמיתיים; היו נדרשים מקדמי פעילות.'},
  ]};
}

// HC1: measured heat capacity and what it implies (derived from the E8 type).
function genHC1(rand){
 const kinds=[
  {label:'חד־אטומי',cv:1.5*R_J,why:'שלוש דרגות חופש תנועה בלבד: Cv = 3R/2.'},
  {label:'דו־אטומי',cv:2.5*R_J,why:'תנועה + סיבוב (תנודה קפואה בטמפרטורות אלה): Cv = 5R/2.'},
  {label:'פולי־אטומי לא־קווי',cv:3*R_J,why:'תנועה + שלושה צירי סיבוב: Cv = 3R (בלי תנודות).'},
 ];
 const k=pick(rand,kinds);
 const n=intRange(rand,2,8)/10, dT=intRange(rand,3,8)*10;
 const q=Math.round(n*k.cv*dT);
 const cvBack=q/(n*dT);
 const qMono=n*1.5*R_J*dT;
 return {
  __meta:{cv:k.cv,n,dT,q},
  given:`${fmtHe(n)} mol של גז לא ידוע בכלי קשיח מחוממים ב-${dT} K, ונמדד שהחום הנדרש הוא ${q} J. הגז אידיאלי; R = 8.314 J/(mol·K).`,
  parts:[
   {label:'א',kind:'numeric',unit:'J/(mol·K)',
    question:'מהו קיבול החום המולרי בנפח קבוע של הגז?',
    answer:cvBack,
    solution:[
     `בכלי קשיח כל החום הופך לאנרגיה פנימית: q = n·Cv·ΔT.`,
     `Cv = ${q}/(${fmtHe(n)}·${dT}) = ${fmtHe(cvBack,4)} J/(mol·K).`]},
   {label:'ב',kind:'numeric',unit:'J',
    question:'כמה חום היה נדרש לאותו חימום אילו הגז היה חד־אטומי?',
    answer:qMono,
    solution:[
     `לגז חד־אטומי Cv = 3R/2 = ${fmtHe(1.5*R_J,4)} J/(mol·K).`,
     `q = ${fmtHe(n)}·${fmtHe(1.5*R_J,4)}·${dT} = ${fmtHe(qMono)} J.`]},
   {label:'ג',kind:'concept',
    question:'מה אפשר להסיק על המולקולה מן המדידה, ומה אי אפשר?',
    modelAnswer:`הערך ${fmtHe(cvBack,4)} J/(mol·K) מתאים לגז ${k.label}: ${k.why} אי אפשר להסיק את זהות הגז או מסתו — גזים רבים מאותו סוג חולקים את אותו Cv, ותנודות שמתעוררות בטמפרטורות גבוהות יותר אינן נראות במדידה בטווח צר.`},
  ]};
}

// RG4: partial reaction, separation, compression (derived from the E11 type).
function genRG4(rand){
 const V=intRange(rand,3,6),nCO=intRange(rand,10,16)/100,nO2=intRange(rand,8,13)/100;
 const T=intRange(rand,400,460);
 const xi=Math.min(nCO/2,nO2)*intRange(rand,55,85)/100;   // extent
 const nEnd=nCO-2*xi+(nO2-xi)+2*xi;
 const Pend=nEnd*R_ATM*T/V;
 const Pr=Math.round(Pend*1e4)/1e4;
 const nEndBack=Pr*V/(R_ATM*T);
 const xiBack=(nCO+nO2-nEndBack);                            // n decreases by xi
 const pct=100*2*xiBack/nCO;
 const V2=intRange(rand,10,16)/100,T2=intRange(rand,330,370);
 const g=GASES.find(x=>x.name==='CO₂');
 const nCO2=2*xiBack;
 const P2=vdW(nCO2,T2,V2,g.a,g.b);
 const Z2=P2*V2/(nCO2*R_ATM*T2);
 return {
  __meta:{V,nCO,nO2,T,Pr,V2,T2},
  given:`בכלי ${V}.00 L יש ${fmtHe(nCO)} mol CO ו-${fmtHe(nO2)} mol O₂ ב-${T} K. מתרחשת תגובה חלקית 2CO + O₂ → 2CO₂ והלחץ הסופי הוא ${Pr} atm (בקירוב אידיאלי). לאחר מכן מבודדים את כל ה-CO₂ ומעבירים לכלי ${fmtHe(V2)} L ב-${T2} K (שם: a = ${g.a}, b = ${g.b}).`,
  parts:[
   {label:'א',kind:'numeric',unit:'%',
    question:'אחוז ה-CO שהגיב?',
    answer:pct,
    solution:[
     `מולים בסוף: n = PV/(RT) = ${Pr}·${V}/(0.08206·${T}) = ${fmtHe(nEndBack,4)} mol.`,
     `כל מול O₂ שמגיב מוריד את המולים הכוללים ב-1: ξ = ${fmtHe(nCO+nO2,4)} − ${fmtHe(nEndBack,4)} = ${fmtHe(xiBack,4)} mol.`,
     `CO שהגיב: 2ξ = ${fmtHe(2*xiBack,4)} mol, כלומר ${fmtHe(pct)}%.`]},
   {label:'ב',kind:'numeric',unit:'mol',
    question:'כמה מולים של CO₂ הופרדו?',
    answer:nCO2,
    solution:[
     `מאזן: n(CO₂) = 2ξ = ${fmtHe(nCO2,4)} mol (שווה ל-CO שהגיב).`]},
   {label:'ג',kind:'numeric',unit:'atm',
    question:'מה הלחץ אחרי הדחיסה, לפי ואן דר ואלס?',
    answer:P2,
    solution:[
     `P = nRT/(V − nb) − an²/V² = ${fmtHe(R_ATM*nCO2*T2/(V2-nCO2*g.b),4)} − ${fmtHe(g.a*nCO2*nCO2/(V2*V2),4)} = ${fmtHe(P2,4)} atm.`,
     `Z = PV/(nRT) = ${fmtHe(Z2,4)}.`]},
   {label:'ד',kind:'concept',
    question:'מדוע חייבים לאזן מולים לפני החישוב הלא־אידיאלי, ולא להציב את הלחץ הראשון ישירות?',
    modelAnswer:'התגובה משנה את מספר המולים הכולל, ורק חלק מהגז (התוצר) עובר לכלי השני. ואן דר ואלס תלוי ב-n, ב-V ובקבועי הגז הספציפיים; הצבת הלחץ או הכמות של התערובת הראשונה הייתה נותנת תשובה על גז אחר בכלי אחר.'},
  ]};
}

// RG5: Boyle temperature and model limits (derived from the E12 type).
function genRG5(rand){
 const g=pick(rand,GASES.filter(x=>!x.mono));
 const TB=g.a/(R_ATM*g.b);
 const rho=intRange(rand,4,12)/10;                             // mol/L
 const Z=1/(1-g.b*rho)-g.a*rho/(R_ATM*TB);
 return {
  __meta:{a:g.a,b:g.b,rho},
  given:`גז מודל עם a = ${g.a} L²·atm/mol² ו-b = ${g.b} L/mol (R = 0.08206).`,
  parts:[
   {label:'א',kind:'numeric',unit:'K',
    question:'מהי טמפרטורת בויל T_B של הגז?',
    answer:TB,
    solution:[
     `T_B = a/(R·b) = ${g.a}/(0.08206·${g.b}) = ${fmtHe(TB)} K.`,
     'בטמפרטורה זו המקדם הוויריאלי השני מתאפס: משיכה ודחייה מאוזנות בדילול גבוה.']},
   {label:'ב',kind:'numeric',unit:'',
    question:`ב-T_B, חשבו Z כשהצפיפות המולרית היא ${fmtHe(rho)} mol/L. האם הוא בדיוק 1?`,
    answer:Z,
    solution:[
     `ממשוואת ואן דר ואלס: Z = 1/(1 − b·ρ) − a·ρ/(RT) עם ρ = ${fmtHe(rho)} mol/L.`,
     `Z = ${fmtHe(1/(1-g.b*rho),4)} − ${fmtHe(g.a*rho/(R_ATM*TB),4)} = ${fmtHe(Z,4)}.`,
     'לא בדיוק 1: האיזון של בויל מדויק רק בגבול הדילול; בצפיפות סופית נותרת תרומת סדר שני.']},
   {label:'ג',kind:'concept',
    question:'חבר קיבל לחץ חיובי ממשוואת ואן דר ואלס ל-CO₂ ב-−130°C וטען שהוכיח שהחומר גז. מה שגיא בטענה?',
    modelAnswer:'משוואת ואן דר ואלס היא מודל גז; הצבת T נמוכה בהרבה מתחום התקפות שלו נותנת מספר חיובי מתמטית בלי משמעות פיזיקלית. ב-−130°C CO₂ אינו גז בלחצים רגילים. פלט של מודל אינו הוכחה למצב הצבירה; בודקים תחום תקפות ונתוני פאזות.'},
  ]};
}

// CR1: unit cell mass, radius and volume (derived from the E13 type).
function genCR1(rand){
 const metals=[
  {name:'ברזל',M:55.85,r:126,z:2,struct:'BCC'},
  {name:'נחושת',M:63.55,r:128,z:4,struct:'FCC'},
  {name:'טונגסטן',M:183.84,r:137,z:2,struct:'BCC'},
  {name:'אלומיניום',M:26.98,r:143,z:4,struct:'FCC'},
 ];
 const m=pick(rand,metals);
 const aBCC=4*m.r/Math.sqrt(3),aFCC=4*m.r/Math.sqrt(2);        // pm
 const rho=z=>(z*m.M)/(NA*Math.pow(z===2?aBCC:aFCC,3)*1e-30);   // g/cm³ (1 pm = 1e-10 cm)
 const rhoTrue=rho(m.z);
 const mass=intRange(rand,50,300);
 return {
  __meta:{M:m.M,r:m.r,z:m.z,mass},
  given:`מתכת ${m.name} עם M = ${m.M} g/mol ורדיוס אטומי ${m.r} pm. הצפיפות הנמדדת ${fmtHe(rhoTrue,5)} g/cm³. המבנה הוא BCC או FCC. Nₐ = 6.022×10²³.`,
  parts:[
   {label:'א',kind:'numeric',unit:'pm',
    question:'מהי צלע תא היחידה אם המבנה BCC?',
    answer:aBCC,
    solution:[
     `ב-BCC האלכסון הראשי הוא 4r: a√3 = 4r, לכן a = 4·${m.r}/√3 = ${fmtHe(aBCC)} pm.`]},
   {label:'ב',kind:'numeric',unit:'pm',
    question:'ומהי הצלע אם המבנה FCC?',
    answer:aFCC,
    solution:[
     `ב-FCC אלכסון הפאה הוא 4r: a√2 = 4r, לכן a = 4·${m.r}/√2 = ${fmtHe(aFCC)} pm.`]},
   {label:'ג',kind:'concept',
    question:'איזה מבנה מתאים לצפיפות הנמדדת? נמקו בחישוב.',
    modelAnswer:`צפיפות חזויה: ρ = Z·M/(Nₐ·a³). ל-BCC (Z=2, a = ${fmtHe(aBCC)} pm): ${fmtHe(rho(2),4)} g/cm³. ל-FCC (Z=4, a = ${fmtHe(aFCC)} pm): ${fmtHe(rho(4),4)} g/cm³. הערך ${fmtHe(rho(m.z),4)} תואם את המדידה, ולכן המבנה הוא ${m.struct}.`},
   {label:'ד',kind:'numeric',unit:'cm³',
    question:`מה נפחה של דגימת ${mass} גרם?`,
    answer:mass/rhoTrue,
    solution:[
     `V = m/ρ = ${mass}/${fmtHe(rhoTrue,5)} = ${fmtHe(mass/rhoTrue,4)} cm³.`]},
  ]};
}

// PH1: phases — compute first, then decide (derived from the E14 type).
function genPH1(rand){
 const Tc=intRange(rand,40,52)*10,Pc=intRange(rand,4,8);
 const Hvap=intRange(rand,26,40)*1000;
 const T1=300,P1=intRange(rand,15,30);
 const T2=T1+intRange(rand,2,5)*10;
 const P2=P1*Math.exp((-Hvap/R_J)*(1/T2-1/T1));
 const PextLow=Math.round(P2*intRange(rand,4,7)/10),PextHigh=Math.round(P2*intRange(rand,13,18)/10);
 return {
  __meta:{Hvap,T1,P1,T2,PextLow,PextHigh},
  given:`לחומר מודל T_c = ${Tc} K ו-P_c = ${Pc} MPa. בטווח ${T1}-${T2} K אין מוצק. P°(${T1} K) = ${P1} kPa ו-ΔHvap = ${fmtHe(Hvap/1000)} kJ/mol בקירוב קבוע. R = 8.314 J/(mol·K).`,
  parts:[
   {label:'א',kind:'numeric',unit:'kPa',
    question:`חשבו את לחץ האדים הרווי ב-${T2} K.`,
    answer:P2,
    solution:[
     `קלאוזיוס-קלפירון: ln(P₂/${P1}) = −(${fmtHe(Hvap,4)}/8.314)·(1/${T2} − 1/${T1}) = ${fmtHe((-Hvap/R_J)*(1/T2-1/T1),4)}.`,
     `P₂ = ${fmtHe(P2,4)} kPa.`]},
   {label:'ב',kind:'concept',
    question:`ב-${T2} K, באיזה צד של קו נוזל-גז נמצאים ${PextLow} kPa ו-${PextHigh} kPa?`,
    modelAnswer:`לחץ אדים רווי ב-${T2} K הוא ${fmtHe(P2,4)} kPa. ב-${PextLow} kPa (מתחת לקו) הכול אדים; ב-${PextHigh} kPa (מעל הקו) הכול נוזל. הלחץ החיצוני ביחס ל-P* קובע את הפאזה בטמפרטורה קבועה.`},
   {label:'ג',kind:'concept',
    question:'האם מותר להמשיך עם אותו ΔHvap עד לנקודה הקריטית כדי לקבל ערך מדויק?',
    modelAnswer:'לא. קלאוזיוס-קלפירון בקירוב קבוע מניח אדים אידיאליים ו-ΔHvap קבוע; בקירוב לנקודה הקריטית שני הנתחים קרים: ΔHvap שואף לאפס והאדים רחוקים מאידיאליות. אקסטרפולציה כזו נותנת סדר גודל בלבד, לא ערך מדויק.'},
  ]};
}

// MX1: salt and sugar together (derived from the E15 type).
function genMX1(rand){
 const salt=pick(rand,[{f:'CaCl₂',i:3},{f:'MgCl₂',i:3},{f:'NaCl',i:2},{f:'KNO₃',i:2}]);
 const nSalt=intRange(rand,50,120)/10000,nSugar=intRange(rand,100,250)/10000;
 const water=intRange(rand,80,150);                             // g
 const particles=salt.i*nSalt+nSugar;
 const dTf=1.86*particles/(water/1000);
 const V=(water+10)/1000;                                       // ~L
 const nW=water/18.015;
 const xw=nW/(nW+particles);
 const P0=intRange(rand,23,30);
 return {
  __meta:{i:salt.i,nSalt,nSugar,water,P0},
  given:`תמיסה מכילה ${fmtHe(nSalt,4)} mol ${salt.f} בפירוק מלא (i = ${salt.i}) ו-${fmtHe(nSugar,4)} mol סוכר שאינו מתפרק, ב-${water} גרם מים. Kf = 1.86 °C·kg/mol; ב-300 K, P°(מים) = ${P0} mmHg ו-R = 0.08206.`,
  parts:[
   {label:'א',kind:'numeric',unit:'°C',
    question:'בכמה מעלות מתחת לאפס תקפא התמיסה?',
    answer:dTf,
    solution:[
     `חלקיקי מומס: ${salt.i}·${fmtHe(nSalt,4)} + ${fmtHe(nSugar,4)} = ${fmtHe(particles,4)} mol.`,
     `מולליות חלקיקים: ${fmtHe(particles/(water/1000),4)} mol/kg; ΔTf = 1.86·${fmtHe(particles/(water/1000),4)} = ${fmtHe(dTf,4)} °C.`]},
   {label:'ב',kind:'numeric',unit:'mmHg',
    question:'מה לחץ אדי המים מעל התמיסה ב-300 K?',
    answer:xw*P0,
    solution:[
     `n(מים) = ${water}/18.015 = ${fmtHe(nW,4)} mol; x(מים) = ${fmtHe(nW,4)}/(${fmtHe(nW,4)} + ${fmtHe(particles,4)}) = ${fmtHe(xw,5)}.`,
     `P = x·P° = ${fmtHe(xw,5)}·${P0} = ${fmtHe(xw*P0,4)} mmHg.`]},
   {label:'ג',kind:'concept',
    question:'מדוע מחברים את החלקיקים של שני המומסים במקום לחשב כל אחד בנפרד ולחבר את התשובות?',
    modelAnswer:'התכונות הקוליגטיביות תלויות במספר החלקיקים הכולל, לא בזהותם. חישוב נפרד וחיבור התשובות נותן אותה תוצאה ליניארית רק במקרה; הקשר הפיזיקלי הוא דרך השבר המולרי והמולליות המשותפים, ולכן מחברים חלקיקים קודם (עם i המתאים לכל מומס) ורק אז מציבים בנוסחה.'},
  ]};
}

// MX2: stepwise dissociation with charge balance (derived from the E16 type).
function genMX2(rand){
 const n0=intRange(rand,50,120)/1000;                             // mol NaHA
 const water=intRange(rand,300,500);                              // g
 const alpha=intRange(rand,15,60)/100;
 const i=2+alpha;
 const dTf=Math.round(i*1.86*(n0/(water/1000))*1e4)/1e4;
 const iBack=dTf/(1.86*(n0/(water/1000)));
 const aBack=iBack-2;
 const V=(water+20)/1000;
 const osm=iBack*(n0/V)*R_ATM*300;
 return {
  __meta:{n0,water,alpha},
  given:`${fmtHe(n0,4)} mol NaHA הומסו ב-${water} גרם מים. המלח מתפרק מלא ל-Na⁺ ו-HA⁻; חלק מה-HA⁻ מתפרק ל-H⁺ ו-A²⁻. נמדדה ירידת קיפאון ${dTf}°C (Kf = 1.86). נפח התמיסה ${fmtHe(V)} L.`,
  parts:[
   {label:'א',kind:'numeric',unit:'',
    question:'מהם i ודרגת הפירוק השניוני α?',
    answer:aBack,
    solution:[
     `i = ΔTf/(Kf·m) = ${dTf}/(1.86·${fmtHe(n0/(water/1000),4)}) = ${fmtHe(iBack,4)}.`,
     `הפירוק הראשון מלא (2 חלקיקים) והשני מוסיף α: i = 2 + α, לכן α = ${fmtHe(aBack,4)}.`]},
   {label:'ב',kind:'concept',
    question:'כתבו את ריכוזי היונים ובדקו שהמטען נשמר.',
    modelAnswer:`[Na⁺] = ${fmtHe(n0/V,4)} M; [HA⁻] = ${fmtHe(n0*(1-aBack)/V,4)} M; [H⁺] = [A²⁻] = ${fmtHe(n0*aBack/V,4)} M. בדיקה: חיובי ${fmtHe(n0/V,4)} + ${fmtHe(n0*aBack/V,4)} = ${fmtHe(n0*(1+aBack)/V,4)} M; שלילי ${fmtHe(n0*(1-aBack)/V,4)} + 2·${fmtHe(n0*aBack/V,4)} = ${fmtHe(n0*(1+aBack)/V,4)} M. שווים — המטען נשמר.`},
   {label:'ג',kind:'numeric',unit:'atm',
    question:'מהו הלחץ האוסמוטי ב-300 K?',
    answer:osm,
    solution:[
     `Π = i·C·R·T = ${fmtHe(iBack,4)}·${fmtHe(n0/V,4)}·0.08206·300 = ${fmtHe(osm,4)} atm.`]},
  ]};
}

export const templates84101=[
 {id:'RG1',area:'גזים ממשיים',title:'גז ממשי: לחץ, מקדם דחיסות ומשמעותו',generate:genRG1},
 {id:'RG2',area:'גזים ממשיים',title:'אותו משקל, תיקונים שונים',generate:genRG2},
 {id:'RG3',area:'גזים ממשיים',title:'משחזרים a ו-b ממדידות',generate:genRG3},
 {id:'KT1',area:'תורה קינטית',title:'התורה הקינטית מקצה לקצה',generate:genKT1},
 {id:'KT2',area:'תורה קינטית',title:'אפוזיה וחוק גרהם',generate:genKT2},
 {id:'KT3',area:'תורה קינטית',title:'התפלגות מקסוול-בולצמן ויחס אוכלוסיות',generate:genKT3},
 {id:'IG1',area:'גזים אידיאליים ותערובות',title:'אסיפת גז מעל מים',generate:genIG1},
 {id:'CC1',area:'נוזלים ולחץ אדים',title:'קלאוזיוס-קלפירון לשני הכיוונים',generate:genCC1},
 {id:'CL1',area:'תכונות קוליגטיביות',title:'קיפאון ואוסמוזה של אלקטרוליט',generate:genCL1},
 {id:'CL2',area:'תכונות קוליגטיביות',title:'גורם i אפקטיבי ומידת פירוק',generate:genCL2},
 {id:'NC1',area:'כימיה גרעינית',title:'חסר מסה ואנרגיית תגובה',generate:genNC1},
 {id:'NC2',area:'כימיה גרעינית',title:'שכיחות איזוטופים ממסה ממוצעת',generate:genNC2},
 {id:'ST1',area:'נוסחאות וסטויכיומטריה',title:'ניתוח שריפה מקצה לקצה',generate:genST1},
 {id:'DS1',area:'נוזלים ולחץ אדים',title:'זיקוק רב־שלבי',generate:genDS1},
 {id:'DS2',area:'נוזלים ולחץ אדים',title:'נקודת טל בדחיסה איזותרמית',generate:genDS2},
 {id:'RA1',area:'נוזלים ולחץ אדים',title:'חוק ראול מהצד השני',generate:genRA1},
 {id:'HC1',area:'תורה קינטית',title:'קיבול חום נמדד ומה מסיקים ממנו',generate:genHC1},
 {id:'RG4',area:'גזים ממשיים',title:'תגובה, הפרדה ודחיסה',generate:genRG4},
 {id:'RG5',area:'גזים ממשיים',title:'טמפרטורת בויל וגבולות המודל',generate:genRG5},
 {id:'CR1',area:'גבישים ופאזות',title:'גבישים: מסה, רדיוס ונפח תא',generate:genCR1},
 {id:'PH1',area:'גבישים ופאזות',title:'פאזות: מחשבים ואז מחליטים',generate:genPH1},
 {id:'MX1',area:'תכונות קוליגטיביות',title:'מלח וסוכר יחד',generate:genMX1},
 {id:'MX2',area:'תכונות קוליגטיביות',title:'פירוק מדורג ומטען נשמר',generate:genMX2},
];
export const _internals={GASES,vdW,fmtHe,R_ATM,R_J,NA,KB};
export {fmtHe};
