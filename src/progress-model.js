// Existing outcomes only. No visits, drafts or analytics.
export const SCHEMA=1,MAX_RECORDS=66,clone=x=>structuredClone(x);
export const recordId=(course,topic)=>`${course}~${topic}`;
export function buildManifest(courses,sessions){
 const out={};for(const c of courses)for(const t of c.topics)out[recordId(c.id,t.id)]={course:c.id,topic:t.id,kind:'topic',questions:Object.fromEntries(t.quiz.map(q=>[q.id,q.type]))};
 for(const s of sessions)out[recordId('84102',s.id)]={course:'84102',topic:s.id,kind:'practice',questions:Object.fromEntries(s.questions.map(q=>[q.id,'mcq'])),correct:s.questions.map(q=>q.correct)};
 return out;
}
export const matchesScope=(m,scope)=>scope==='all'||scope===`course.${m.course}`||scope===`topic.${m.course}.${m.topic}`;
export function apply(record,op,m){return {schema:SCHEMA,course:m.course,topic:m.topic,kind:m.kind,...(m.kind==='topic'?{answers:{...(record?.answers||{}),[op.item]:clone(op.value)}}:{value:clone(op.value)})};}
export function toView(records,manifest){const out={};for(const [id,r] of Object.entries(records)){const m=manifest[id];if(!m)continue;const c=out[m.course]??={};if(m.kind==='practice'){const v=r.value;if(v)(c._practice??={})[m.topic]={score:v.score,total:10,answers:Object.fromEntries(Object.keys(m.questions).map((q,i)=>[q,v.choices[i]])),at:v.at,attempts:v.attempts};}else{const answers=Object.fromEntries(Object.entries(r.answers||{}).filter(([q])=>q in m.questions));c[m.topic]={answers,complete:Object.keys(m.questions).every(q=>answers[q]),score:Object.values(answers).filter(a=>a.correct).length};}}return out;}
export function validValue(m,item,v){if(!m||!v||typeof v.at!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v.at))return false;if(m.kind==='topic')return item in m.questions&&typeof v.correct==='boolean'&&v.kind===m.questions[item]&&Object.keys(v).every(k=>['correct','kind','at'].includes(k));return item==='result'&&Number.isInteger(v.score)&&v.score>=0&&v.score<=10&&Array.isArray(v.choices)&&v.choices.length===10&&v.choices.every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&Number.isInteger(v.attempts)&&v.attempts>0&&Object.keys(v).every(k=>['choices','score','at','attempts'].includes(k));}
