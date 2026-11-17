import React,{useEffect,useState} from 'react';
import {bidiElement} from './bidi-react.js';
export function PwaControls(){
 const [ready,setReady]=useState(false),[waiting,setWaiting]=useState(null),[error,setError]=useState(false),[online,setOnline]=useState(navigator.onLine),[applying,setApplying]=useState(false);
 useEffect(()=>{
  if(!('serviceWorker' in navigator)||!import.meta.env.PROD)return;
  let alive=true,registration,reloading=false;
  const network=()=>setOnline(navigator.onLine);
  const change=()=>{if(reloading)location.reload();else if(alive)setReady(true)};
  addEventListener('online',network);addEventListener('offline',network);navigator.serviceWorker.addEventListener('controllerchange',change);
  const inspect=()=>{if(!alive||!registration)return;setReady(!!registration.active);setWaiting(registration.waiting||null)};
  navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{scope:import.meta.env.BASE_URL,updateViaCache:'none'}).then(reg=>{
   registration=reg;inspect();
   reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',inspect)});
   navigator.serviceWorker.ready.then(inspect);
  }).catch(()=>{if(alive)setError(true)});
  const check=()=>{if(document.visibilityState==='visible'&&navigator.onLine)registration?.update().catch(()=>{})};
  document.addEventListener('visibilitychange',check);
  const activate=event=>{if(event.detail==='apply'&&registration?.waiting){reloading=true;setApplying(true);registration.waiting.postMessage({type:'ACTIVATE_UPDATE'})}};
  addEventListener('spectra-update',activate);
  return()=>{alive=false;removeEventListener('online',network);removeEventListener('offline',network);removeEventListener('spectra-update',activate);document.removeEventListener('visibilitychange',check);navigator.serviceWorker.removeEventListener('controllerchange',change)};
 },[]);
 return <section className="pwa-controls" aria-label="שמירה באייפון ולמידה ללא רשת">
  {waiting&&<div className="pwa-update" role="status"><span>גרסה חדשה מוכנה. השאלות שנשמרו יישארו; טקסט שעדיין לא נשלח עלול להיעלם.</span><button disabled={applying} onClick={()=>{if(confirm('לעדכן ולטעון מחדש עכשיו? ההתקדמות שנשמרה תישאר, אך טיוטת תשובה שלא נשלחה עלולה להיעלם.'))dispatchEvent(new CustomEvent('spectra-update',{detail:'apply'}))}}>{applying?'מעדכן…':'עדכון וטעינה מחדש'}</button></div>}
  <details><summary>שמירה באייפון ושימוש ללא רשת</summary>
   <p role="status" className="pwa-status">{error?'השמירה לשימוש ללא רשת לא הושלמה. אפשר להמשיך ללמוד עם חיבור ולנסות שוב בפתיחה הבאה.':ready?(online?'מוכן ללמידה ללא רשת במכשיר הזה.':'אין חיבור לרשת. לומדים מהגרסה השמורה במכשיר.'):(online?'מכין את חומר הלימוד לשימוש ללא רשת…':'אין חיבור. השמירה לשימוש ללא רשת עדיין לא אושרה.')}</p>
   <p>באייפון: פתחו ב־Safari, לחצו שיתוף, ואז ״הוסף למסך הבית״. אם מופיעה האפשרות ״פתיחה כיישום אינטרנט״, הפעילו אותה. פתחו פעם אחת מהאייקון עם חיבור וחכו לאישור שהחומר מוכן ללא רשת.</p>
   <p>ההתקדמות נשמרת מקומית, בלי חשבון או סנכרון. דפדפן והתקנה נפרדת עשויים לא לשתף התקדמות; אל תמחקו את נתוני הדפדפן או האפליקציה. שמירה מקומית אינה גיבוי, והמערכת עשויה לפנות אחסון.</p>
   <p>עדכונים נבדקים בפתיחה ובחזרה לאפליקציה עם חיבור. גרסה חדשה מוצעת לעדכון, בלי טעינה מחדש באמצע תרגול. קישורים למקורות חיצוניים דורשים רשת.</p>
  </details>
 </section>;
}
