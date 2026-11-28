import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
const store={ready:false,error:false,online:navigator.onLine},subs=new Set();
function publish(next){Object.assign(store,next);subs.forEach(f=>f({...store}))}
function usePwaStatus(){const [v,setV]=useState({...store});useEffect(()=>{subs.add(setV);setV({...store});return()=>subs.delete(setV)},[]);return v}
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
 useEffect(()=>{publish({ready,error,online})},[ready,error,online]);
 const bar=useRef(null);
 useEffect(()=>{const el=bar.current;if(!waiting||!el)return;const set=()=>document.documentElement.style.setProperty('--notice-h',el.offsetHeight+'px');set();const ro=typeof ResizeObserver==='function'?new ResizeObserver(set):null;ro?.observe(el);addEventListener('resize',set);return()=>{ro?.disconnect();removeEventListener('resize',set);document.documentElement.style.removeProperty('--notice-h')}},[waiting]);
 if(!waiting)return null;
 return <section ref={bar} className="pwa-controls" aria-label="עדכון גרסה">
  <div className="pwa-update" role="status"><span>גרסה חדשה מוכנה. השאלות שנשמרו יישארו; טקסט שעדיין לא נשלח עלול להיעלם.</span><button disabled={applying} onClick={()=>{if(confirm('לעדכן ולטעון מחדש עכשיו? ההתקדמות שנשמרה תישאר, אך טיוטת תשובה שלא נשלחה עלולה להיעלם.'))dispatchEvent(new CustomEvent('spectra-update',{detail:'apply'}))}}>{applying?'מעדכן…':'עדכון וטעינה מחדש'}</button></div>
 </section>;
}

// Offline and iPhone instructions, opened from the avatar menu.
export function PwaDialog({onClose}){
 const {ready,error,online}=usePwaStatus(),box=useRef(null);
 useEffect(()=>{box.current?.focus({preventScroll:true})},[]);
 useEffect(()=>{const esc=e=>{if(e.key==='Escape'){e.preventDefault();onClose()}};document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc)},[onClose]);
 return createPortal(<div className="ra-overlay" onPointerDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section ref={box} tabIndex={-1} className="ra-dialog panel pwa-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-title">
   <h2 id="pwa-title">שמירה באייפון ושימוש ללא רשת</h2>
   <p role="status" className="pwa-status">{error?'השמירה לשימוש ללא רשת לא הושלמה. אפשר להמשיך ללמוד עם חיבור ולנסות שוב בפתיחה הבאה.':ready?(online?'מוכן ללמידה ללא רשת במכשיר הזה.':'אין חיבור לרשת. לומדים מהגרסה השמורה במכשיר.'):(online?'מכין את חומר הלימוד לשימוש ללא רשת…':'אין חיבור. השמירה לשימוש ללא רשת עדיין לא אושרה.')}</p>
   <p>באייפון: פתחו ב־Safari, לחצו שיתוף, ואז ״הוסף למסך הבית״. אם מופיעה האפשרות ״פתיחה כיישום אינטרנט״, הפעילו אותה. פתחו פעם אחת מהאייקון עם חיבור וחכו לאישור שהחומר מוכן ללא רשת.</p>
   <p>ההתקדמות משויכת לחשבון המחובר ומסתנכרנת כשיש חיבור. עותק מקומי ושינויים ממתינים נשמרים לפי חשבון בדפדפן הזה. דפדפן או התקנה נפרדים עשויים להשתמש בעותק מקומי אחר. אל תמחקו את נתוני הדפדפן או האפליקציה. האחסון המקומי אינו מוצפן. שמירה מקומית אינה גיבוי מובטח; המערכת עשויה לפנות אחסון.</p>
   <p>ההתקדמות שייכת לחשבון. עותק מקומי ושינויים ממתינים נשמרים במכשיר; הם אינם מוצפנים. אין איסוף ביקורים או זמן צפייה.</p>
   <p>עדכונים נבדקים בפתיחה ובחזרה לאפליקציה עם חיבור. גרסה חדשה מוצעת לעדכון, בלי טעינה מחדש באמצע תרגול. קישורים למקורות חיצוניים דורשים רשת.</p>
   <button className="secondary ra-close" onClick={onClose}>סגירה</button>
  </section>
 </div>,document.body);
}
