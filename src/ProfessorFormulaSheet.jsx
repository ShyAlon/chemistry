import React from 'react';
import {bidiElement} from './bidi-react.js';
import {PageTitle} from './PageTitle.jsx';
import {ScientificText} from './ScientificContent.js';
import {Formula} from './Formula.js';
import {professorFormulaGroups} from './professor-formulas-84101.js';

export function ProfessorFormulaSheet(){
 return <main className="topic-page ref-page professor-formulas">
  <button className="back quiet" onClick={()=>{location.hash='references/formulas/84101'}}>→ לדף הנוסחאות הקיים של כימיה כללית א׳</button>
  <div className="eyebrow"><bdi dir="ltr">84101</bdi> / דף נוסף לפי המסמך שסופק</div>
  <PageTitle className="ref-title">דף נוסחאות נוסף: כימיה כללית א׳</PageTitle>
  <p className="ref-lead">כימיה כללית לכימאים, סמסטר א׳. נוסחאות מהדף שסופק ב־<bdi dir="ltr">22.11.2026</bdi>, עם מקרא סמלים בלחיצה, בריחוף או במיקוד מקלדת. דף הנוסחאות הקיים לא הוחלף.</p>
  <div className="panel professor-sheet-note"><p>במסמך המקור לא מצוינים שנת לימודים, תאריך בחינה או מהדורה. יש לבדוק מול הקורס איזה דף מותר לבחינה. ערכי הקבועים המודפסים נשמרו כאן בנפרד; קבועים ותשובות קיימים באתר לא השתנו.</p><p>הנוסחאות הוקלדו מחדש. הערות היחידות ותחומי התוקף הן הסברים באתר, לא ציטוט מהמסמך. המקור עצמו אינו מצורף להורדה.</p></div>
  <nav className="ref-nav" aria-label="קפיצה לחלק בדף">{professorFormulaGroups.map(g=><button key={g.id} onClick={()=>document.getElementById('professor-'+g.id)?.scrollIntoView({behavior:'smooth',block:'start'})}>{g.title}</button>)}</nav>
  <div className="formula-grid">{professorFormulaGroups.map(g=><section key={g.id} id={'professor-'+g.id} className="panel ref-topic"><h2>{g.title}</h2><dl className="ref-items">{g.items.map(([id,label,expr,note,symbols])=><div key={id} data-sheet-formula={id}><dt>{label}</dt><dd><Formula expr={expr} context={{kind:'equation',symbols,explanation:note}} variant="compact"/>{note&&<small><ScientificText runs={[note]}/></small>}</dd></div>)}</dl></section>)}</div>
 </main>;
}
