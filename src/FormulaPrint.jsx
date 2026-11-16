import React,{useLayoutEffect,useRef,useState} from 'react';
import {bidiElement} from "./bidi-react.js";
import {ScientificText} from './scientific-text.js';

// Measured, lossless pagination. The screen preview and print output share nodes.
// Nothing reads or writes course progress, selections reset with this page.
export function FormulaPrint({course,constants,Expr}){
 const [picked,setPicked]=useState(()=>Object.fromEntries(course.topics.map(t=>[t.id,true])));
 const [withConstants,setWithConstants]=useState(true),[open,setOpen]=useState(false);
 const [columns,setColumns]=useState(null),[problem,setProblem]=useState('');
 const measure=useRef(null),epoch=useRef(0);
 const topics=course.topics.filter(t=>picked[t.id]);
 const groups=[...topics,...(withConstants?[{id:'constants',title:'קבועים וערכי המרה',items:constants}]:[])];
 const row=([label,expr,note],key)=><div key={key} className="fp-row"><div className="fp-label">{label}</div><Expr expr={expr}/>{note&&<p className="fp-note"><ScientificText runs={[note]}/></p>}</div>;
 const title=(g,continued=false)=><h2><bdi dir="ltr">{g.id==='constants'?'':g.id}</bdi> {g.title}{continued?' (המשך)':''}</h2>;
 const signature=JSON.stringify([course.id,picked,withConstants,open]);
 useLayoutEffect(()=>{
  const token=++epoch.current;if(!open){setColumns(null);return}
  setColumns(null);setProblem('');
  document.fonts.ready.then(()=>requestAnimationFrame(()=>{
   if(token!==epoch.current||!measure.current)return;
   const root=measure.current,limit=root.clientHeight;
   const measured=groups.map(g=>({g,h:root.querySelector(`[data-head="${g.id}"]`).getBoundingClientRect().height,ch:root.querySelector(`[data-cont="${g.id}"]`).getBoundingClientRect().height,rows:g.items.map((item,i)=>({item,key:g.id+'-'+i,height:root.querySelector(`[data-row="${g.id}-${i}"]`).getBoundingClientRect().height}))}));
   if(measured.some(m=>m.rows.some(r=>r.height+Math.max(m.h,m.ch)>limit))){setProblem('נוסחה אחת גבוהה מעמודה שלמה. יש לבדוק את העיצוב לפני הדפסה.');return}
   const pack=height=>{
    const cols=[[]];let used=0;
    for(const {g,h,ch,rows} of measured){let first=true;
     for(const r of rows){
      if(used+r.height+(first?h:0)>height&&used){cols.push([]);used=0;cols.at(-1).push({kind:'head',g,continued:!first});used+=first?h:ch;}
      else if(first){cols.at(-1).push({kind:'head',g});used+=h;}
      cols.at(-1).push({kind:'row',item:r.item,key:r.key});used+=r.height;first=false;
     }
    }
    return cols;
   };
   let cols=pack(limit);
   // Balance a fitting selection over four columns without shrinking type.
   if(cols.length<=4){let low=Math.max(...measured.flatMap(m=>m.rows.map(r=>r.height+Math.max(m.h,m.ch))),0),high=limit;for(let i=0;i<18;i++){const mid=(low+high)/2;if(pack(mid).length<=4)high=mid;else low=mid;}cols=pack(Math.min(limit,high+1));}
   setColumns(cols);
  }));
  return ()=>{epoch.current++};
 },[signature]);
 const count=groups.reduce((n,g)=>n+g.items.length,0);
 const pages=columns?Math.max(2,Math.ceil(columns.length/2)):0;
 const canPrint=count>0&&columns&&pages===2&&!problem;
 return <section className="formula-print-tool" aria-labelledby="formula-print-title">
  <details><summary id="formula-print-title">דף להדפסה: בחירת נושאים · 2 עמודים</summary>
   <p>בוחרים נושאים מהקורס הנבחר ובודקים תצוגה של שני עמודים. כל הנוסחאות וההערות נשמרות, בגודל כתב קבוע. אם התוכן לא נכנס, ההדפסה נחסמת עד שמסירים נושאים. אין השמטה או הקטנה אוטומטית.</p>
   <div className="fp-select-actions"><button type="button" onClick={()=>setPicked(Object.fromEntries(course.topics.map(t=>[t.id,true])))}>כל הנושאים</button><button type="button" onClick={()=>setPicked({})}>ניקוי נושאים</button></div>
   <fieldset><legend>נושאים ב־{course.name}</legend><div className="fp-topic-picker">{course.topics.map(t=><label key={t.id}><input type="checkbox" checked={!!picked[t.id]} onChange={e=>setPicked({...picked,[t.id]:e.target.checked})}/><bdi dir="ltr">{t.id}</bdi> {t.title}</label>)}</div><label className="fp-constants"><input type="checkbox" checked={withConstants} onChange={e=>setWithConstants(e.target.checked)}/>קבועים וערכי המרה</label></fieldset>
   <p className="fp-selection-summary">נבחרו {topics.length} נושאים{withConstants?' וקבועים':''} · {count} שורות נוסחה. גופן ההדפסה 14 נקודות, A4 לאורך, שתי עמודות בכל עמוד.</p>
   <button type="button" className="primary" disabled={!count} onClick={()=>setOpen(true)}>בדיקת תצוגה לפני הדפסה</button>
  </details>
  {open&&<div className="fp-preview-area">
   <div className="fp-toolbar"><button type="button" onClick={()=>setOpen(false)}>סגירת תצוגת ההדפסה</button><button type="button" className="primary" disabled={!canPrint} onClick={()=>window.print()}>הדפסה / שמירה כ־PDF</button></div>
   <p role="status" className={!count||pages>2||problem?'fp-overflow':'fp-status'}>{!count?'בחרו לפחות נושא אחד או קבועים.':problem||(!columns?'מחשב חלוקה לפי גודל הטקסט…':pages>2?`התוכן דורש ${pages} עמודים, יותר מ־2. ההדפסה חסומה. הסירו נושאים או קבועים ובדקו שוב. שום נוסחה לא הושמטה.`:'התוכן נכנס בשני עמודים. בדקו גם בתיבת ההדפסה: A4, קנה מידה 100%, ללא כותרות עליונות ותחתונות של הדפדפן.')}</p>
   <p className="fp-preview-hint">תצוגת A4 בגודל קבוע. במסך צר אפשר לגלול את העמודים אופקית. החלפת קורס מאפסת את בחירת הנושאים.</p>
   <div className="fp-paper-scroll">{columns&&Array.from({length:pages},(_,pi)=><article key={pi} className="fp-paper" aria-label={'עמוד הדפסה '+(pi+1)}><header><div><strong>{course.name} | דף נוסחאות</strong><div className="fp-scope">נושאים: <bdi dir="ltr">{topics.map(t=>t.id).join(", ")}</bdi>{withConstants?" · קבועים":""}</div></div><bdi dir="ltr">{pi+1} / {pages}</bdi></header><div className="fp-columns">{[0,1].map(ci=><div key={ci} className="fp-column">{(columns[pi*2+ci]||[]).map((b,i)=>b.kind==='head'?<React.Fragment key={'h'+i}>{title(b.g,b.continued)}</React.Fragment>:row(b.item,b.key))}</div>)}</div></article>)}</div>
   <div className="fp-measure fp-column" ref={measure} aria-hidden="true">{groups.map(g=><React.Fragment key={g.id}><div data-head={g.id}>{title(g)}</div><div data-cont={g.id}>{title(g,true)}</div>{g.items.map((it,i)=><div key={i} data-row={g.id+'-'+i}>{row(it,i)}</div>)}</React.Fragment>)}</div>
  </div>}
 </section>
}
