import fs from 'node:fs';
import {finalPrep84101} from '../src/final-prep-84101.js';
// Deterministic append-only content integration; safe to run repeatedly.
const path=new URL('../src/courses.json',import.meta.url);
const catalogue=JSON.parse(fs.readFileSync(path,'utf8'));
const course=catalogue.courses.find(c=>c.id==='84101');
const sources={G10:'תרגול 5ב, עמ׳ 2–28; תרגיל בית 7, שאלות 1–4. נוספו דוגמאות מקוריות ותרגול הפוך; משוואת ואן דר ואלס היא מודל, לא הבטחת פאזה.',G12:'תרגיל בית 6א+ב, שאלות 7–9. חישובי צפיפות ורדיוס נבדקו בנפרד.',G13:'תרגול 6א, עמ׳ 10–15; תרגיל בית 6א+ב, שאלות 3–6. קירוב אנתלפיה קבועה מסומן במפורש.',G15:'תרגיל בית 6א+ב, שאלות 10–22. תרגול מקורי בספירת חלקיקים, פירוק ומספר ממסים; לא מפתח רשמי.'};
for(const topic of course.topics){const layer=finalPrep84101[topic.id];if(!layer)continue;
 for(const key of ['theory','worked','quiz'])topic.content[key]=[...topic.content[key].filter(b=>!b.finalPrep),...layer[key]];
 topic.source=topic.source.split(' תוספת הכנה למבחן:')[0]+' תוספת הכנה למבחן: '+sources[topic.id];
}
fs.writeFileSync(path,JSON.stringify(catalogue,null,1)+'\n');
console.log('Final preparation applied: 4 existing topics; original topic/question IDs preserved.');
