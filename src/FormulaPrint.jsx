import React,{useLayoutEffect,useRef,useState} from 'react';
import {bidiElement} from "./bidi-react.js";
import {paginateFormulaGroups} from './formula-print-layout.js';
import {compactFormulaTopics,printRowGroups} from './formula-print-data.js';
import {ScientificText} from './scientific-text.js';

// Measured pagination of the explicitly abridged print edition. The screen preview and print output share nodes.
// Nothing reads or writes course progress, selections reset with this page.
export function FormulaPrint({course,constants,Expr}){
 const [picked,setPicked]=useState(()=>Object.fromEntries(course.topics.map(t=>[t.id,true])));
 const [withConstants,setWithConstants]=useState(true),[open,setOpen]=useState(false);
 const [columns,setColumns]=useState(null),[problem,setProblem]=useState('');
 const measure=useRef(null),constantMeasure=useRef(null),epoch=useRef(0);
 const [constantHeight,setConstantHeight]=useState(0);
 const topics=compactFormulaTopics(course).filter(t=>picked[t.id]);
 const groups=topics;
 const row=([label,expr,note],key)=><div key={key} className="fp-row"><div className="fp-label">{label}</div><Expr expr={expr}/>{note&&<p className="fp-note"><ScientificText runs={[note]}/></p>}</div>;
 const groupedRow=(cells,key)=><div key={key} className={'fp-row-group'+(cells.length>1?' fp-side-by-side':'')} style={{'--cells':cells.length}}>{cells.map(c=>row(c.item,c.key))}</div>;
 const title=(g,continued=false)=><h2><bdi dir="ltr">{g.id==='constants'?'':g.id}</bdi> {g.title}{continued?' (המשך)':''}</h2>;
 const constantBlock=()=> <section className="fp-constant-band fp-column"><h2>קבועים וערכי המרה</h2><div className="fp-constant-grid">{constants.map((item,i)=>row(item,'constant-'+i))}</div></section>;
 const signature=JSON.stringify([course.id,picked,withConstants,open]);
 useLayoutEffect(()=>{
  const token=++epoch.current;if(!open){setColumns(null);return}
  setColumns(null);setProblem('');
  document.fonts.ready.then(()=>requestAnimationFrame(()=>{
   if(token!==epoch.current||!measure.current)return;
   const root=measure.current,limit=root.clientHeight;
   const band=withConstants?constantMeasure.current.getBoundingClientRect().height+10:0;setConstantHeight(band);
   const measured=groups.map(g=>({g,h:root.querySelector(`[data-head="${g.id}"]`).getBoundingClientRect().height,ch:root.querySelector(`[data-cont="${g.id}"]`).getBoundingClientRect().height,rows:printRowGroups(g).map((cells,i)=>({item:cells,key:g.id+'-'+i,height:root.querySelector(`[data-row="${g.id}-${i}"]`).getBoundingClientRect().height}))}));
   if(measured.some(m=>m.rows.some(r=>r.height+Math.max(m.h,m.ch)>limit))){setProblem('נוסחה אחת גבוהה מעמודה שלמה. יש לבדוק את העיצוב לפני הדפסה.');return}
   const cols=paginateFormulaGroups(measured,limit,band);
   const rowHeights=new Map(measured.flatMap(m=>m.rows.map(r=>[r.key,r.height])));
   const headingHeights=new Map(measured.map(m=>[m.g.id,m]));
   const clipped=cols.some((col,i)=>col.reduce((sum,b)=>sum+(b.kind==='row'?rowHeights.get(b.key):headingHeights.get(b.g.id)[b.continued?'ch':'h']),0)>limit-(i===2||i===3?band:0)+1);
   if(clipped||band>limit){setProblem('התוכן גבוה מהשטח הזמין. יש להסיר נושאים או קבועים ולבדוק שוב. אין השמטה אוטומטית.');return}
   setColumns(cols);
  }));
  return ()=>{epoch.current++};
 },[signature]);
 const count=groups.reduce((n,g)=>n+g.items.length,0)+(withConstants?constants.length:0);
 const pages=columns?Math.max(2,Math.ceil(columns.length/2)):0;
 const canPrint=count>0&&columns&&pages===2&&!problem;
 return <section className="formula-print-tool" aria-labelledby="formula-print-title">
  <details><summary id="formula-print-title">דף להדפסה: בחירת נושאים · 2 עמודים</summary>
   <p>גרסת הדפסה תמציתית בשני עמודים: נוסחאות, יחידות ותנאי שימוש חיוניים. ללא דוגמאות פתורות, הפניות ופרטי הסבר חוזרים. כל נושאי הקורס מסומנים כברירת מחדל; אפשר לבחור רק את נושאי הבוחן. הדף המלא על המסך אינו משתנה.</p>
   <div className="fp-select-actions"><button type="button" onClick={()=>setPicked(Object.fromEntries(course.topics.map(t=>[t.id,true])))}>כל הנושאים</button><button type="button" onClick={()=>setPicked({})}>ניקוי נושאים</button></div>
   <fieldset><legend>נושאים ב־{course.name}</legend><div className="fp-topic-picker">{course.topics.map(t=><label key={t.id}><input type="checkbox" checked={!!picked[t.id]} onChange={e=>setPicked({...picked,[t.id]:e.target.checked})}/><bdi dir="ltr">{t.id}</bdi> {t.title}</label>)}</div><label className="fp-constants"><input type="checkbox" checked={withConstants} onChange={e=>setWithConstants(e.target.checked)}/>קבועים וערכי המרה</label></fieldset>
   <p className="fp-selection-summary">נבחרו {topics.length} נושאים{withConstants?' וקבועים':''} · {count} שורות נוסחה. נוסחאות 12 נקודות, תוויות 11.5 והערות וקבועים 10.5; A4 בשתי עמודות וקבועים בשלוש עמודות.</p>
   <button type="button" className="primary" disabled={!count} onClick={()=>setOpen(true)}>בדיקת תצוגה לפני הדפסה</button>
  </details>
  {open&&<div className="fp-preview-area">
   <div className="fp-toolbar"><button type="button" onClick={()=>setOpen(false)}>סגירת תצוגת ההדפסה</button><button type="button" className="primary" disabled={!canPrint} onClick={()=>window.print()}>הדפסה / שמירה כ־PDF</button></div>
   <p role="status" className={!count||pages>2||problem?'fp-overflow':'fp-status'}>{!count?'בחרו לפחות נושא אחד או קבועים.':problem||(!columns?'מחשב חלוקה לפי גודל הטקסט…':pages>2?`התוכן דורש ${pages} עמודים, יותר מ־2. ההדפסה חסומה. הסירו נושאים או קבועים ובדקו שוב. אין השמטה אוטומטית.`:'התוכן נכנס בשני עמודים. בדקו גם בתיבת ההדפסה: A4, קנה מידה 100%, ללא כותרות עליונות ותחתונות של הדפדפן.')}</p>
   <p className="fp-preview-hint">תצוגת A4 בגודל קבוע. במסך צר אפשר לגלול את העמודים אופקית. החלפת קורס מאפסת את בחירת הנושאים.</p>
   <div className="fp-paper-scroll">{columns&&Array.from({length:pages},(_,pi)=><article key={pi} className="fp-paper" aria-label={'עמוד הדפסה '+(pi+1)}><div className="fp-columns" style={pi===1?{height:`calc(277mm - ${constantHeight}px)`}:undefined}>{[0,1].map(ci=><div key={ci} className="fp-column">{(columns[pi*2+ci]||[]).map((b,i)=>b.kind==='head'?<React.Fragment key={'h'+i}>{title(b.g,b.continued)}</React.Fragment>:groupedRow(b.item,b.key))}</div>)}</div>{pi===1&&withConstants&&constantBlock()}</article>)}</div>
   <div className="fp-constant-measure" ref={constantMeasure} aria-hidden="true">{withConstants&&constantBlock()}</div>
   <div className="fp-measure fp-column" ref={measure} aria-hidden="true">{groups.map(g=><React.Fragment key={g.id}><div data-head={g.id}>{title(g)}</div><div data-cont={g.id}>{title(g,true)}</div>{printRowGroups(g).map((cells,i)=><div key={i} data-row={g.id+'-'+i}>{groupedRow(cells,i)}</div>)}</React.Fragment>)}</div>
  </div>}
 </section>
}
