// Print-only abridgment. The full on-screen reference is deliberately unchanged.
// Keep equations, unit conventions and validity conditions; omit worked examples,
// external navigation and repeated teaching prose. No automatic content dropping.
const omit=new Set(['P9/דוגמת סף','G11/מדריך']);
const notes={
 'P1/אנרגיה לחלקיק':'לפני hc/E: אנרגיה לחלקיק, לא למול.',
 'P1/יחידה בחזקה':'גם פקטור ההמרה בחזקה.',
 'P2/קיצור יחידות':'פוטון: eV ו־nm.',
 'P2/תחום נראה':'בקירוב; הגדרת השאלה קובעת.',
 'P3/רדיוס':'חד־אלקטרוני; במימן Z = 1.',
 'P3/שינוי אנרגיית האטום':'חד־אלקטרוני; פליטה: ΔE_atom < 0.',
 'P3/רידברג לפוטון':'חד־אלקטרוני; R∞ ביחידות m⁻¹.',
 'P3/סדרות':'Lyman: UV; Balmer: ראשונים בנראה, גבול UV; Paschen: IR.',
 'P4/דה־ברויי':'p = mv: מסיבי, לא־יחסותי. פוטון: p = E/c.',
 'P4/חסם מהירות מינימלי':'SI: kg, m; תנע ומהירות באותו ציר.',
 'P6/פסגות רדיאליות':'לא סופרים r = 0 או ∞ כנודה רדיאלית.',
 'P7/קיבולת':'עד 2 אלקטרונים לאורביטל.',
 'P7/כלל האכלוס':'בשוויון: n קטן קודם.',
 'P7/סדר האכלוס המלא':'משמאל לימין, מלמעלה למטה; חזקות = קיבולות. יש חריגי מצב יסוד.',
 'P7/אכלוס יונים':'q עם סימן; במעבר: ns לפני (n−1)d. Fe²⁺: [Ar]3d⁶',
 'P6/RPD בפחמן':'נודות רדיאליות; בגרף הקורס: r_mp(1s) < r_mp(2p) < r_mp(2s).',
 'P9/השוואת יינון':'IE₂: B⁺ מאבד 2s מלא, C⁺ מאבד 2p. משווים יונים.',
 'P7/ערכיות':'טורים ראשיים; He: שני אלקטרוני ערכיות.',
 'P7/רמת אכלוס':'קיצור אזורי, לא לחריגי מצב יסוד.',
 'P7/פאולי והונד':'הונד: אורביטלים מנוונים.',
 'P8/אנרגיה':'רב־אלקטרוני: קירוב דמוי־מימן.',
 'P8/מטען מתוך יינון':'קירוב קורסי; IE ו־R_H באותן יחידות.',
 'P8/אטום חד־אלקטרוני':'Z = מספר הפרוטונים, לא מטען היון.',
 'P9/אנרגיית יינון':'מהרמה הנתונה לרצף E = 0.',
 'P9/אורך גל סף ליינון':'אורך גל מרבי; IE לאלקטרון אחד, מאותה רמה.',
 'P9/קיצור ליינון':'λ קצר יותר: אפשרית KE עודפת.',
 'P9/דמוי־מימן':'חד־אלקטרוני; Z_eff ברב־אלקטרוני: קירוב.',
 'P9/אורך גל דמוי־מימן':'n רמת המוצא; Z פרוטונים, לא מטען היון.',
 'P9/קיצור דמוי־מימן':'חד־אלקטרוני; הצבת Z_eff: קירוב קורסי.',
 'P9/יינון עוקב':'מתחילים ב־X⁺, לא באטום ניטרלי.',
 'P11/מוסכמת הקורס':'אקסותרמי: ΔE_attach < 0; EA_course > 0.',
 'P11/קירוב Mulliken':'אותן יחידות אנרגיה; לא סולם Pauling.',
 'P12/מספר אלקטרונים':'q מטען מספרי עם סימן.',
 'P12/גל מתוך קינטיקה':'SI: אנרגיה ב־J; לא־יחסותי.',
 'P12/RPD':'חלק זוויתי מנורמל; P(r)dr הסתברות לקליפה.',
 'P10/יינון':'IE > 0; E_level < 0 ביחס לחופשי.',
 'P10/פיקים':'מודל סכמטי; בפועל ייתכנו פיצולים.',
 'G3/אחוז מסה':'n אטומי X בנוסחה; M מסה מולרית של התרכובת.',
 'G4/מסלול חישוב':null,
 'G10/טמפרטורת בויל':'מודל ואן דר ואלס; צפיפות נמוכה.',
 'G10/תחום צר':'קירוב; M ב־kg/mol, v ב־m/s.',
 'G10/אנרגיה תרגומית כוללת':'תרגום בלבד, ללא סיבוב ותנודה.',
 'G13/קלאוזיוס־קלפירון':'T בקלווין; אותן יחידות P; יחידות ΔH ו־R תואמות.',
 'G14/הנרי':'לחץ חלקי; k_H תלוי T ויחידות.',
 'G16/תיארוך':'מערכת סגורה; מדידה אמיתית דורשת כיול.',
};
export function compactFormulaTopics(course){
 return course.topics.map(t=>({...t,items:t.items.filter(([label])=>!omit.has(t.id+'/'+label)).map(([label,expr,note,symbols])=>{
  if(t.id==='P5'&&label==='תת־קליפות')expr='l = 0: s ; l = 1: p ; l = 2: d ; l = 3: f';
  const key=t.id+'/'+label;
  const item=[label,expr,Object.hasOwn(notes,key)?notes[key]:note];
  return symbols?[...item,symbols]:item;
 })}));
}

// Explicit short-item groups, in source order. They are measured and packed as
// whole rows, never inferred by text length or generated on the server.
const shortGroups={P7:[['קיבולת','כלל האכלוס']],P2:[['גל','מחזור']],P5:[['n','l']],P6:[['סך הנודות','נודות זוויתיות','נודות רדיאליות']],P12:[['מספר אלקטרונים','מסה מתוך גל']],G2:[['מולים','חלקיקים']],G9:[['מסה מולרית','צפיפות']]};
export function printRowGroups(topic){
 const result=[];
 for(let i=0;i<topic.items.length;i++){
  const labels=(shortGroups[topic.id]||[]).find(group=>group[0]===topic.items[i][0]);
  const size=labels&&labels.every((label,j)=>topic.items[i+j]?.[0]===label)?labels.length:1;
  result.push(topic.items.slice(i,i+size).map((item,j)=>({item,key:topic.id+'-'+(i+j)})));i+=size-1;
 }
 return result;
}
