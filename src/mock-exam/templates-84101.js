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
  return `${Number(m)}·10^${Number(e)}`;
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
 const tB=tA*Math.sqrt(a.M/b.M);           // same amount through same hole
 return {
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
     `הזמן פרופורציוני ל-√M: t(${b.name}) = t(${a.name})·√(M(${b.name})/M(${b.name===a.name?a.name:b.name})) — כלומר ${tA}·√(${b.M}/${a.M}).`,
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

// NC1: nuclear reaction energy from atomic masses.
function genNC1(rand){
 const reactions=[
  {text:'²⁷Al + ⁴He → ³⁰P + n',react:[26.98154,4.00260],prod:[29.97831,1.00866]},
  {text:'²³⁸U → ²³⁴Th + ⁴He',react:[238.05079],prod:[234.04360,4.00260]},
  {text:'⁷Li + ¹H → 2·⁴He',react:[7.01600,1.00783],prod:[2*4.00260]},
 ];
 const r=pick(rand,reactions);
 const sum=a=>a.reduce((x,y)=>x+y,0);
 const dm=sum(r.react)-sum(r.prod);           // u
 const E=dm*931.5;                            // MeV
 return {
  given:`נתונה התגובה הגרעינית: ${r.text}. מסות אטומיות (u): Al-27 = 26.98154; He-4 = 4.00260; P-30 = 29.97831; n = 1.00866; U-238 = 238.05079; Th-234 = 234.04360; Li-7 = 7.01600; H-1 = 1.00783. ההמרה: 1 u = 931.5 MeV.`,
  parts:[
   {label:'א',kind:'numeric',unit:'u',
    question:'מהו שינוי המסה בתגובה (חסר המסה, בסימן חיובי אם נפלטת אנרגיה)?',
    answer:dm,
    solution:[
     `מסת מגיבים: ${r.react.map(x=>x.toFixed(5)).join(' + ')} = ${sum(r.react).toFixed(5)} u.`,
     `מסת תוצרים: ${r.prod.map(x=>x.toFixed(5)).join(' + ')} = ${sum(r.prod).toFixed(5)} u.`,
     `Δm = ${dm.toFixed(5)} u.`]},
   {label:'ב',kind:'numeric',unit:'MeV',
    question:'מהי האנרגיה הנפלטת בתגובה אחת?',
    answer:E,
    solution:[
     `E = Δm·931.5 = ${dm.toFixed(5)}·931.5 = ${fmtHe(E,4)} MeV.`]},
   {label:'ג',kind:'concept',
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
];
export const _internals={GASES,vdW,fmtHe,R_ATM,R_J,NA,KB};
