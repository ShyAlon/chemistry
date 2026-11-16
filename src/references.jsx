import {bidiElement} from './bidi-react.js';
import {SourceTooltip} from './SourceTooltip.jsx';
import {mathNotation as sub} from './math-notation.js';
import React,{useState,useEffect,useRef} from 'react';
import catalogue from './courses.json';
import {elements} from './reference-data.js';
import {ionState} from './ions.js';
import {constants,courses as formulaCourses} from './reference-formulas.js';
import {Figure,schematicFigures} from './figures.jsx';
import {ScientificText,Definition} from './scientific-text.js';
import {enrichment84101} from './enrichment-84101.js';
import {enrichment84102} from './enrichment-84102.js';
// References: static study aids. Nothing here reads or writes saved progress.

export const pages=[
 {id:'formulas',title:'דף נוסחאות',desc:'כל הקשרים החשובים לפי נושא, לשני הקורסים, וקבועים במקום אחד.',icon:'∑'},
 {id:'periodic',title:'הטבלה המחזורית',desc:'118 יסודות, צביעה לפי קטגוריה, בלוק או אלקטרושליליות, וקונפיגורציה לכל יסוד.',icon:'⌬'},
 {id:'aufbau',title:'נחש האכלוס (Aufbau)',desc:'סדר מילוי תתי־הקליפות, קיבולת וגזים אצילים.',icon:'↙'},
 {id:'diagrams',title:'גלריית תרשימים',desc:'כל התרשימים מהקורסים במקום אחד, ומגמות בטבלה המחזורית.',icon:'▦'},
];
const isFormula=t=>/[=≥≤≈→<>]|[+−·×√]/.test(t);
// Each independently readable relation is its own no-wrap chip; prose stays text.
function Chips({text}){
 const parts=text.split(/ ; /).map(x=>x.trim()).filter(Boolean);
 if(parts.length===1&&!isFormula(parts[0]))return <span className="ref-prose">{parts[0]}</span>;
 return <span className="chips">{parts.map((c,i)=>{
  if(c.includes(' → '))return <span key={i} className="chain">{c.split(' → ').map((x,j)=>[j>0&&<span key={'a'+j} className="chain-arrow" aria-hidden="true">←</span>,<bdi key={j} dir="ltr" className="chip fx">{sub(x)}</bdi>])}</span>;
  const hp=c.match(/^([\u0590-\u05ff][\u0590-\u05ff ]*): (.+)$/);
  if(hp&&isFormula(hp[2]))return <span key={i} className="chip-group"><span className="chip-label">{hp[1]}:</span><bdi dir="ltr" className="chip fx">{sub(hp[2])}</bdi></span>;
  return isFormula(c)?<bdi key={i} dir="ltr" className="chip fx">{sub(c)}</bdi>:<span key={i} className="chip chip-text">{c}</span>})}</span>}
function Expr({expr}){return expr&&expr.def?<Definition definition={expr.def}/>:<Chips text={expr}/>}

export function parseReferenceRoute(hash){const p=hash.replace(/^#/,'').split('/').filter(Boolean);return p[0]==='references'?{page:p[1]||'',valid:!p[1]||pages.some(x=>x.id===p[1])}:null}

function Shell({title,children,back='references'}){return <main className="topic-page ref-page"><button className="back quiet" onClick={()=>{location.hash=back}}>→ {back==='references'?'למקראות':'חזרה'}</button><h1 className="ref-title">{title}</h1>{children}</main>}

function Landing(){return <main className="topic-page ref-page"><button className="back quiet" onClick={()=>{location.hash=''}}>→ לקורסים</button><div className="eyebrow">עזרים ללימוד ולמבחן</div><h1 className="ref-title">מקראות</h1><p className="ref-lead">דפי עזר קבועים ליד הקורסים. הם לא משנים התקדמות, בחנים או תשובות שמורות.</p><section className="ref-cards">{pages.map(p=><button key={p.id} className="panel ref-card" onClick={()=>{location.hash='references/'+p.id}}><span className="ref-icon" aria-hidden="true">{p.icon}</span><h2>{p.title}</h2><p>{p.desc}</p><strong>לפתיחה ←</strong></button>)}</section></main>}

function Formulas(){
 const [cid,setCid]=useState(formulaCourses[0].id);const course=formulaCourses.find(c=>c.id===cid);
 const jump=id=>document.getElementById('ref-'+id)?.scrollIntoView({behavior:'smooth',block:'start'});
 return <Shell title="דף נוסחאות">
  <div className="ref-tabs" role="tablist" aria-label="קורס">{formulaCourses.map(c=><button key={c.id} role="tab" aria-selected={c.id===cid} className={c.id===cid?'on':''} onClick={()=>setCid(c.id)}>{c.name}</button>)}</div>
  <nav className="ref-nav" aria-label="קפיצה לנושא">{course.topics.map(t=><button key={t.id} onClick={()=>jump(t.id)}><bdi dir="ltr" className="ref-id">{t.id}</bdi><span>{t.title}</span></button>)}<button onClick={()=>jump('constants')}><bdi dir="ltr" className="ref-id">h, c</bdi><span>קבועים</span></button></nav>
  {course.topics.map(t=><section key={t.id} id={'ref-'+t.id} className="panel ref-topic"><h2><bdi dir="ltr" className="ref-id">{t.id}</bdi> {t.title}</h2><dl className="ref-items">{t.items.map(([label,expr,note],i)=><div key={i}><dt>{label}</dt><dd><Expr expr={expr}/>{note&&<small><ScientificText runs={[note]}/></small>}</dd></div>)}</dl></section>)}
  <section id="ref-constants" className="panel ref-topic"><h2>קבועים וערכי המרה</h2><dl className="ref-items">{constants.map(([l,e],i)=><div key={i}><dt>{l}</dt><dd><Expr expr={e}/></dd></div>)}</dl></section>
  <p className="ref-note">הערכים הם אלה שבקורס. אם דף הנוסחאות של הבוחן נותן ערך אחר, השתמשו בו.</p>
 </Shell>}

const catNames={alkali:'מתכות אלקליות',alkaline:'אלקליות־עפרוריות',transition:'מתכות מעבר',post:'מתכות אחרי המעבר',metalloid:'מטאלואידים',nonmetal:'אל־מתכות',halogen:'הלוגנים',noble:'גזים אצילים',lanthanide:'לנתנידים',actinide:'אקטינידים'};
const blockNames={s:'בלוק s',p:'בלוק p',d:'בלוק d',f:'בלוק f'};
const sup=n=>String(n).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
const ENs=elements.filter(e=>e.en).map(e=>e.en);const enMin=Math.min(...ENs),enMax=Math.max(...ENs);
function cellColor(e,mode){if(mode==='cat')return `var(--c-${e.cat})`;if(mode==='block')return `var(--b-${e.b})`;if(!e.en)return '#1b2637';const t=(e.en-enMin)/(enMax-enMin);return `hsl(${210-t*180} ${45+t*20}% ${22+t*20}%)`}
const fmtCfg=(core,cfg)=>(core?`[${core}]`:'')+cfg.map(([s,n])=>s+sup(n)).join('');
const chargeLabel=(sym,q)=>sym+(q===0?'':(Math.abs(q)>1?sup(Math.abs(q)):'')+(q>0?'⁺':'⁻'));
function Config({e,q=0,ions}){
 const st=ionState(e,q,ions);
 if(st.kind==='missing')return <span>אין ערך</span>;
 if(!st.cfg)return <span>אין קונפיגורציה לחלקיק הזה</span>;
 return <bdi dir="ltr" className="fx">{fmtCfg(st.core,st.cfg)}</bdi>}
const stateNote=(e,q,st)=>{
 if(st.kind==='missing')return 'אין לנו מקור לקונפיגורציה של האטום הזה, ולכן אי אפשר להוסיף או להסיר אלקטרונים. זו מגבלת מקור, לא קביעה שהקונפיגורציה לא קיימת.';
 if(st.kind==='measured')return 'לפי NIST.';
 if(st.kind==='predicted')return 'ערך מחושב (תיאורטי), לא נמדד. '+(e.z<=108?'לפי NIST.':'לפי סקירה של חישובים רלטיביסטיים (Russian Chemical Reviews). ל־NIST אין ערך ליסוד הזה.');
 if(st.kind==='nist')return 'ערך של NIST ליון גזי חופשי. יון בתרכובת או בתמיסה יכול להיראות אחרת.';
 if(st.kind==='derived'||st.kind==='model')return 'מודל אכלוס לימודי; מצב היסוד והיציבות לא אומתו.';
 if(st.kind==='loading')return 'טוען את נתוני היונים...';
 return '';
};
const blockedNote=(e,q,st)=>{
 if(st.kind==='none')return 'אין אלקטרונים נוספים להסיר.';
 if(st.reason==='no-ion-data')return e.z>103?'ל־NIST אין נתוני יונים ליסוד הזה.':'ל־NIST אין קונפיגורציה ליון הזה.';
 if(st.reason==='no-neutral')return 'אין ערך לאטום הניטרלי, ולכן אין נקודת מוצא לשינוי.';
 if(st.reason==='model-range')return 'גבול מודל האכלוס כאן: 118 אלקטרונים, עד תת־הקליפה 7p. זה גבול החישוב באתר, לא גבול פיזיקלי של יון יציב.';
 return '';
};
function ConfigurationNote({e,q,st}){
 const model=st.kind==='derived'||st.kind==='model';
 if(st.kind==='none')return null;
 return <SourceTooltip key={`${e.z}:${q}:${st.kind}`} label={model?'הערות ושיטת חישוב האכלוס':'מקור והערות לקונפיגורציה'}>
  <p>{stateNote(e,q,st)}</p>
  {e.z===103&&q===0&&<p>בספרים מופיע גם 6d¹ במקום 7p¹.</p>}
  {model&&<><p>מתחילים בקונפיגורציה של האטום הניטרלי ומוסיפים {-q} אלקטרונים לפי סדר אכלוס Aufbau, תוך שמירה על קיבולת תתי־הקליפות. אין כאן חישוב קוונטי של אנרגיות או יציבות.</p><p>במתכות מעבר וביסודות כבדים ייתכן סידור מחדש שהמודל אינו מנבא.{st.seedPredicted?' גם קונפיגורציית האטום הניטרלי היא מחושבת.':''}</p><p>טווח המודל: עד 118 אלקטרונים, בתתי־קליפות עד 7p.</p><a href="https://openstax.org/books/chemistry-2e/pages/6-4-electronic-structure-of-atoms-electron-configurations" target="_blank" rel="noreferrer">כלל האכלוס הלימודי ב-OpenStax ↗</a></>}
 </SourceTooltip>
}
function valence(e){if(e.b==='s'&&e.g<=2)return e.z===2?2:e.g;if(e.b==='p')return e.g-10;return null}
function Periodic(){
 const [mode,setMode]=useState('cat');const [sel,setSelRaw]=useState(elements[0]);const [q,setQ]=useState(0);const [ions,setIons]=useState(null);const [detailsOpen,setDetailsOpen]=useState(false);const [narrow,setNarrow]=useState(()=>matchMedia('(max-width:1279px)').matches);const workspaceAnchor=useRef(null),workspace=useRef(null),returnButton=useRef(null),detailsButton=useRef(null),lastCell=useRef(null);
 useEffect(()=>{let on=true;import('./ion-data.js').then(m=>{if(on)setIons(m.ions)});return()=>{on=false}},[]);
 useEffect(()=>{const mq=matchMedia('(max-width:1279px)');const change=()=>setNarrow(mq.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change)},[]);
 const alignWorkspace=()=>{if(narrow)requestAnimationFrame(()=>{const align=()=>{const top=workspaceAnchor.current.getBoundingClientRect().top+scrollY-document.querySelector('.header').getBoundingClientRect().height-12;window.scrollTo({top,behavior:'instant'})};align();requestAnimationFrame(align)})};
 const openDetails=()=>{setDetailsOpen(true);alignWorkspace()};
 const closeDetails=()=>{setDetailsOpen(false);alignWorkspace();requestAnimationFrame(()=>{(lastCell.current||detailsButton.current)?.focus({preventScroll:true})})};
 useEffect(()=>{if(narrow&&detailsOpen){workspace.current?.querySelector('.pt-detail')?.scrollTo(0,0);returnButton.current?.focus({preventScroll:true})}},[detailsOpen,narrow,sel.z]);
 const setSel=(e,button)=>{lastCell.current=button;setSelRaw(e);setQ(0);openDetails()};
 const cur=ionState(sel,q,ions),up=ionState(sel,q-1,ions),down=ionState(sel,q+1,ions);
 const ok=t=>t.kind==='measured'||t.kind==='predicted'||t.kind==='nist'||t.kind==='derived'||t.kind==='model';
 const canAdd=ok(up),canRemove=ok(down);
 const rowOf=e=>e.p>=9?e.p:e.p; // rows 9,10 are the f-block rows
 const marker=(p,g,text)=><div key={'m'+p} className="pt-cell pt-marker" style={{gridRow:p,gridColumn:g}} aria-hidden="true"><span>{text.split('–')[0]}–<br/>{text.split('–')[1]}</span></div>;
 const legend=mode==='cat'?Object.entries(catNames).map(([k,v])=>[`var(--c-${k})`,v]):mode==='block'?Object.entries(blockNames).map(([k,v])=>[`var(--b-${k})`,v]):[['hsl(210 45% 22%)',`נמוכה (${enMin})`],['hsl(30 65% 42%)',`גבוהה (${enMax})`]];
 const v=valence(sel);
 return <Shell title={<>הטבלה המחזורית<SourceTooltip label="מקורות והערות לטבלה המחזורית"><p>מספרי הטורים בשורה העליונה.</p><p>מסות אטומיות: הערכים המקוצרים (abridged) של CIAAW, עם אי־הוודאות שלהם. בליתיום, בור, פחמן, חנקן, חמצן, גופרית, כלור ועופרת (ובעוד יסודות) ההרכב האיזוטופי משתנה בטבע, ולכן המסה תלויה בדגימה. ייתכן שבקורס מעגלים אחרת, ולחישובים יש להשתמש בערכי הקורס.</p><p>ביסודות ללא איזוטופ יציב אין משקל אטומי תקני, ומוצג מספר המסה של האיזוטופ ארוך החיים בסוגריים מרובעים.</p><p>קונפיגורציות: מצב היסוד לפי NIST, כולל החריגים (למשל Cr ו־Cu), עד יסוד 103. אלקטרושליליות לפי סולם פאולינג, מ־PubChem, ליסודות עד 92 בלבד.</p><p>שמות עבריים: לפי מאגר המונחים של האקדמיה ללשון העברית (מילון הכימיה האי־אורגנית, תש"ם 1979). ליסודות 104 עד 118 לא נמצא שם באקדמיה, ולכן מוצג השם באנגלית.</p><p>מקורות: <bdi dir="ltr">ciaaw.org</bdi>, <bdi dir="ltr">physics.nist.gov/PhysRefData/ASD</bdi>, <bdi dir="ltr">pubchem.ncbi.nlm.nih.gov</bdi>, <bdi dir="ltr">terms.hebrew-academy.org.il</bdi>.</p></SourceTooltip></>}>
  <div className="ref-tabs" role="tablist" aria-label="צביעה">{[['cat','קטגוריות'],['block','בלוקים'],['en','אלקטרושליליות']].map(([k,l])=><button key={k} role="tab" aria-selected={mode===k} className={mode===k?'on':''} onClick={()=>setMode(k)}>{l}</button>)}</div>
  <div ref={workspaceAnchor} className="pt-workspace-anchor" aria-hidden="true"/><div ref={workspace} className="pt-layout" data-details-open={detailsOpen} onKeyDown={e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!e.target.closest('.source-tooltip,.source-popover')&&narrow&&detailsOpen){e.preventDefault();closeDetails()}}}>
  <section className="panel pt-detail" aria-label="פרטי היסוד - גלילה נפרדת" tabIndex={0} inert={narrow&&!detailsOpen?true:undefined} aria-live="polite"><div className="pt-pane-heading"><strong>פרטי היסוד <bdi>{sel.s}</bdi></strong><button ref={returnButton} className="secondary" onClick={closeDetails}>חזרה לטבלה →</button></div><div className="pt-big" style={{background:cellColor(sel,mode)}}><span className="pt-z">{sel.z}</span><span className="pt-sym" dir="ltr">{sel.s}</span></div>
   <dl className="pt-facts"><div><dt>שם</dt><dd>{sel.he?<>{sel.he} <bdi dir="ltr" className="fx">({sel.n})</bdi></>:<bdi dir="ltr" className="fx">{sel.n} ({sel.s})</bdi>}</dd></div><div><dt>{sel.m?'מסה אטומית (g/mol)':'מספר מסה'}<SourceTooltip label={sel.m?'מקור המסה האטומית':'מקור מספר המסה'}>{sel.m?'ערך מקוצר, CIAAW':<>אין משקל אטומי תקני. זה מספר המסה של האיזוטופ ארוך החיים{sel.mn.length>1?' (יותר מאיזוטופ אחד באורך חיים דומה)':''}, לפי CIAAW</>}</SourceTooltip></dt><dd>{sel.m?<><bdi dir="ltr" className="fx">{sel.m} ± {sel.u}</bdi></>:<><bdi dir="ltr" className="fx">{sel.mn.map(n=>`[${n}]`).join(' / ')}</bdi></>}</dd></div><div className="pt-cfg"><dt>קונפיגורציה<ConfigurationNote e={sel} q={q} st={cur}/></dt><dd><Config e={sel} q={q} ions={ions}/>{(cur.kind==='derived'||cur.kind==='model')&&<small className="pt-state-tag">מודל לימודי</small>}{cur.kind==='predicted'&&<small className="pt-state-tag">מחושב</small>}</dd></div><div className="pt-ion"><dt>מטען ואלקטרונים</dt><dd><bdi dir="ltr" className="fx">{chargeLabel(sel.s,q)}</bdi>{cur.cfg&&<small>{sel.z-q} אלקטרונים</small>}<span className="pt-btns"><button className="pt-step" onClick={()=>setQ(q-1)} disabled={!canAdd} aria-label="הוסף אלקטרון">+</button><button className="pt-step" onClick={()=>setQ(q+1)} disabled={!canRemove} aria-label="הסר אלקטרון">−</button>{q!==0&&<button className="pt-step pt-neutral" onClick={()=>setQ(0)}>אטום ניטרלי</button>}</span>{!canAdd&&cur.cfg&&<small>הוספה: {blockedNote(sel,q-1,up)}</small>}{!canRemove&&cur.cfg&&<small>הסרה: {blockedNote(sel,q+1,down)}</small>}</dd></div><div><dt>שורה / טור</dt><dd><bdi dir="ltr" className="fx">{sel.b==='f'?`${sel.p>=9?sel.p-3:sel.p} / f`:`${sel.p} / ${sel.g}`}</bdi></dd></div><div><dt>קטגוריה</dt><dd>{catNames[sel.cat]}, {blockNames[sel.b]}</dd></div>{v&&<div><dt>אלקטרוני ערכיות</dt><dd><bdi dir="ltr" className="fx">{v}</bdi></dd></div>}{sel.en&&<div><dt>אלקטרושליליות (פאולינג)</dt><dd><bdi dir="ltr" className="fx">{sel.en}</bdi></dd></div>}</dl></section>
  <div className="pt-main" inert={narrow&&detailsOpen?true:undefined}><button ref={detailsButton} className="secondary pt-open-details" aria-expanded={detailsOpen} onClick={openDetails}>פרטי היסוד <bdi>{sel.s}</bdi> ←</button>
  <div className="pt-legend">{legend.map(([c,l])=><span key={l}><i style={{background:c}}/>{l}</span>)}</div>
  <p className="pt-scroll-hint">במסך צר אפשר לגלול את הטבלה הצידה כדי לראות את כל 18 הטורים.</p>
  <div className="pt-scroll" tabIndex={0} aria-label="טבלה מחזורית, אפשר לגלול הצידה"><div className="pt-grid">
   {[...Array(18)].map((_,i)=><div key={'h'+i} className="pt-head" style={{gridRow:1,gridColumn:i+1}}>{i+1}</div>)}
   {elements.map(e=>{const row=e.p+1;return <button key={e.z} className={'pt-cell'+(sel.z===e.z?' sel':'')} style={{gridRow:row,gridColumn:e.g,background:cellColor(e,mode)}} onClick={event=>setSel(e,event.currentTarget)} aria-label={`${e.he||e.n}, ${e.z}`}><span className="pt-z">{e.z}</span><span className="pt-sym" dir="ltr">{e.s}</span></button>})}
   {marker(7,3,'57–71')}{marker(8,3,'89–103')}
  </div></div>
  </div>
  </div>

 </Shell>}

const seq=[['1s',1,0],['2s',2,0],['2p',2,1],['3s',3,0],['3p',3,1],['4s',4,0],['3d',3,2],['4p',4,1],['5s',5,0],['4d',4,2],['5p',5,1],['6s',6,0],['4f',4,3],['5d',5,2],['6p',6,1],['7s',7,0],['5f',5,3],['6d',6,2],['7p',7,1]];
const cap=l=>2*(2*l+1);const noble={'1s':'He','2p':'Ne','3p':'Ar','4p':'Kr','5p':'Xe','6p':'Rn','7p':'Og'};
const SW=170,SH=72,X0=150,Y0=96,bw=112,bh=52;const bx=l=>X0+l*SW,by=n=>Y0+(n-1)*SH;
function Aufbau(){
 let total=0;const rows=seq.map(([s,n,l],i)=>{total+=cap(l);return {s,n,l,i:i+1,total}});
 const diag=[...new Set(seq.map(([,n,l])=>n+l))].map(k=>seq.filter(([,n,l])=>n+l===k));
 return <Shell title="נחש האכלוס (Aufbau)">
  <p className="ref-lead">ממלאים לפי הסדר: קודם תת־הקליפה בעלת <bdi dir="ltr" className="fx">n + l</bdi> הקטן; בשוויון, <bdi dir="ltr" className="fx">n</bdi> הקטן קודם. קוראים את החיצים אחד אחרי השני, מלמעלה למטה.</p>
  <div className="fig-scroll aufbau-scroll" tabIndex={0}><svg className="aufbau-svg" width="840" height="620" viewBox="0 0 840 620" role="img" aria-label="תרשים אכלוס: תתי־הקליפות s, p, d, f לפי רמות, עם חיצים באלכסון לפי סדר המילוי">
   <defs><marker id="ab-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#71e4f4"/></marker></defs>
   {['s','p','d','f'].map((c,l)=><text key={c} x={bx(l)} y={44} textAnchor="middle" fontSize="22" fill="#e8edf6" fontFamily="Arial">{c} <tspan fill="#a4b0c4" fontSize="18">({cap(l)} e)</tspan></text>)}
   {[1,2,3,4,5,6,7].map(n=><text key={n} x={20} y={by(n)+7} fontSize="20" fill="#a4b0c4" fontFamily="Arial">n={n}</text>)}
   {diag.map((d,i)=>{const a=d[0],z=d.at(-1);const x1=bx(a[2])+SW*.36,y1=by(a[1])-SH*.36,x2=bx(z[2])-SW*.5,y2=by(z[1])+SH*.5;return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#71e4f4" strokeWidth="2.5" markerEnd="url(#ab-arrow)" opacity=".85"/>})}
   {rows.map(r=><g key={r.s}><rect x={bx(r.l)-bw/2} y={by(r.n)-bh/2} width={bw} height={bh} rx="10" fill="#10192b" stroke={`var(--b-${'spdf'[r.l]})`} strokeWidth="2.5"/><text x={bx(r.l)+8} y={by(r.n)+8} textAnchor="middle" fontSize="24" fontWeight="bold" fill="#e8edf6" fontFamily="Arial">{r.s}</text><text x={bx(r.l)-bw/2+10} y={by(r.n)-bh/2+20} fontSize="18" fill="#a4b0c4" fontFamily="Arial">{r.i}</text></g>)}
  </svg></div>
  <p className="ref-note">המספר הקטן בפינת כל תיבה הוא מקומה בסדר המילוי.</p>
  <section className="panel ref-topic"><h2>סדר מילוי וצבירה</h2><div className="ref-table-wrap"><table className="ref-table"><thead><tr><th>#</th><th>תת־קליפה</th><th>קיבולת</th><th>סך אלקטרונים</th><th>מסתיים ב</th></tr></thead><tbody>{rows.map(r=><tr key={r.s}><td><bdi dir="ltr">{r.i}</bdi></td><td><bdi dir="ltr" className="fx">{r.s}</bdi></td><td><bdi dir="ltr">{cap(r.l)}</bdi></td><td><bdi dir="ltr">{r.total}</bdi></td><td>{noble[r.s]?<>גז אציל <bdi dir="ltr" className="fx">{noble[r.s]}</bdi></>:''}</td></tr>)}</tbody></table></div></section>
  <section className="panel ref-topic"><h2>כללים לזכור</h2><ul className="ref-list"><li>פאולי: באורביטל אחד עד שני אלקטרונים, בספינים מנוגדים.</li><li>הונד: באורביטלים מנוונים ממלאים כל אורביטל באלקטרון בודד, ורק אחר כך מזווגים.</li><li>קיצור גז אציל: מחליפים את הרמות המלאות בסימן הגז, למשל <bdi dir="ltr" className="fx">[Ne] = 1s²2s²2p⁶</bdi>.</li><li>חריגים: <bdi dir="ltr" className="fx">Cr: [Ar]4s¹3d⁵</bdi> ו־<bdi dir="ltr" className="fx">Cu: [Ar]4s¹3d¹⁰</bdi>.</li><li>בכל מקום שהסדר נראה מוזר, בודקים <bdi dir="ltr" className="fx">n + l</bdi>: <bdi dir="ltr" className="fx">4s (4+0)</bdi> לפני <bdi dir="ltr" className="fx">3d (3+2)</bdi>.</li></ul></section>
 </Shell>}

function Trends(){const rows=[['מטען אפקטיבי Z_eff','עולה לאורך שורה, משמאל לימין'],['אנרגיית יינון','עולה לאורך שורה, ויורדת במורד טור'],['רדיוס אטומי','קטן לאורך שורה, וגדל במורד טור']];
 return <dl className="ref-items trend-list">{rows.map(([l,t])=><div key={l}><dt>{l}</dt><dd>{t}</dd></div>)}</dl>}

// Figure labels are 12-13 units in a 560-unit viewBox. At 840px wide (1.5x) the smallest
// label is 18px, so the gallery renders every figure at that width and scrolls sideways on phones.
function GalleryBlock({id,text,accent}){const note=schematicFigures.has(id)?' התרשים סכמטי ואינו בקנה מידה.':'';
 return <figure className="figure-block ref-fig"><div className="fig-scroll" tabIndex={0}><Figure id={id} accent={accent}/></div><p className="ref-hint">גוללים הצידה כדי לראות את כל התרשים בגודל קריאה.</p><figcaption>{text+note}</figcaption></figure>}
export const galleryGroups=()=>{const out=[];for(const [cid,enr,cname] of [['84102',enrichment84102,'כימיה אי־אורגנית 84102'],['84101',{...enrichment84101,...Object.fromEntries(catalogue.courses.find(c=>c.id==='84101').topics.filter(t=>!enrichment84101[t.id]).map(t=>[t.id,{theory:t.content.theory}]))},'כימיה כללית א׳ 84101']]){const topics=formulaCourses.find(c=>c.id===cid).topics;for(const t of topics){const figs=(enr[t.id]?.theory||[]).filter(p=>p.style==='Figure');if(figs.length)out.push({course:cname,id:t.id,title:t.title,figs})}}return out}
function Diagrams(){const [cid,setCid]=useState('84102');const groups=galleryGroups().filter(g=>(cid==='84102')===g.id.startsWith('P'));
 return <Shell title="גלריית תרשימים">
  <section className="panel ref-topic"><h2>מגמות בטבלה המחזורית</h2><Trends/><p className="ref-note">כיוון המגמה הכללי. יש חריגות, למשל Be מול B ו־N מול O באנרגיית היינון.</p></section>
  <div className="ref-tabs" role="tablist" aria-label="קורס">{[['84102','כימיה אי־אורגנית 84102'],['84101','כימיה כללית א׳ 84101']].map(([k,l])=><button key={k} role="tab" aria-selected={cid===k} className={cid===k?'on':''} onClick={()=>setCid(k)}>{l}</button>)}</div>
  {groups.map(g=><section key={g.id} className="ref-topic"><h2><bdi dir="ltr" className="ref-id">{g.id}</bdi> {g.title}</h2>{g.figs.map(f=><GalleryBlock key={f.figure} id={f.figure} text={f.text} accent="#71e4f4"/>)}</section>)}
 </Shell>}

export function References({route}){const r=parseReferenceRoute(route)||{page:'',valid:true};
 if(!r.valid)return <Landing/>;
 return r.page==='formulas'?<Formulas/>:r.page==='periodic'?<Periodic/>:r.page==='aufbau'?<Aufbau/>:r.page==='diagrams'?<Diagrams/>:<Landing/>}
