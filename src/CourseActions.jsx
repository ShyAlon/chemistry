import {bidiElement} from './bidi-react.js';
import React from 'react';
import {SourceTooltip} from './SourceTooltip.jsx';
import {papers} from './paper-discussions.js';

// Compact per-course shortcuts: one thin bar of chips, each with its
// explanation in a tap/hover tooltip instead of a stacked full-width panel.
export function CourseActions({course,glossaryCount}){
 const items=[];
 if(course.id==='nano')for(const p of papers)items.push({href:'course/nano/papers/'+p.id,paper:true,label:<>מדריך דיון · <bdi dir="ltr">{p.short}</bdi></>,title:'שני מאמרים. מעבר לתקציר.',body:'מה הטענה, איזו ראיה תומכת בה, מה עדיין לא הוכח ואיך מסבירים את זה בקול. ניתוח איורים, חישובים ושאלות המשך לדיון.',note:'מסלולי קריאה נפרדים. 12 נושאי הקורס וההתקדמות הקיימת נשארים כפי שהיו.'});
 if(course.id==='nuclear')items.push({href:'course/nuclear/E10',label:'משימת הפוסטר',title:'משימת הפוסטר - רוב הציון בקורס הזה',body:'מדריך מלא לבניית פוסטר מדעי: בחירת נושא, מבנה אפשרי שנלמד מניתוח הדוגמה שצורפה, עומק מול רוחב, איורים ומספרים, וצ\'ק-ליסט לפני ההגשה.'});
 if(course.id==='84101')items.push(
  {href:'course/84101/practice',label:'שאלות ברמת בחינה',title:'שאלות ברמת בחינה',body:'16 שאלות רב־שלביות. גזים ממשיים קודם: תיקוני לחץ, חישוב פרמטרים לאחור, בויל ותגובה לפני דחיסה. וגם גבישים, פאזות, תמיסות ושאלות הבחינה הקיימות. מנסים סעיף ורק אז חושפים פתרון.'},
  {href:'course/84101/mock-exam',label:'בחינה לדוגמה',title:'בחינה לדוגמה במספרים משתנים',body:'5 שאלות רב־שלביות עם מספרים חדשים בכל פעם, שעון עצר עם השהיה, בדיקה אוטומטית בסובלנות 5% וסימון עצמי לסעיפי הסבר אחרי חשיפת תשובות מודל. מבחנים נשמרים שלושה חודשים.'});
 if(course.id==='84102')items.push({href:'course/84102/practice',label:'תרגולים מעורבים לבוחן',title:'תרגולים מעורבים לבוחן',body:'8 תרגולים חדשים, 10 שאלות אמריקאיות בכל אחד. פתרונות והסברים אחרי הגשה.'});
 if(glossaryCount>0)items.push({href:'course/'+course.id+'/glossary',label:'מילון המונחים',title:'מילון המונחים של הקורס',body:`${glossaryCount} מונחים מוגדרים, מקובצים לפי נושאי הקורס, עם סינון בעברית ובאנגלית. כל מונח מקשר לנושא שמלמד אותו.`});
 if(!items.length)return null;
 return <nav className="action-bar" aria-label="קיצורי הקורס">{items.map(it=><span key={it.href} className={'action-item'+(it.paper?' paper-entry':'')}>
  <a className="action-chip" href={'#'+it.href}>{it.label} <span aria-hidden="true">←</span></a>
  <SourceTooltip label={it.title}><p>{it.body}</p>{it.note&&<p className="muted">{it.note}</p>}</SourceTooltip>
 </span>)}</nav>
}
