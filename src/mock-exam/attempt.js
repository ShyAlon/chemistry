// Mock-exam attempt logic: paper composition, marking, scoring, retention.
// Pure functions, no DOM/Firebase, so unit tests cover everything here.
import {rng} from './rng.js';
import {parseNumber} from '../logic.js';

export const TOLERANCE=0.05;              // Shy's decision: 5% relative error
export const PAPER_SIZE=5;                // one question per topic area
export const MAX_COMPLETED=10;            // per course
export const RETENTION_MONTHS=3;          // calendar months, not 90 days

// Draw a paper: one template per topic area, fresh numbers per attempt.
export function createAttempt(templates,{seed,course='84101',id,now=new Date()}){
 const rand=rng('paper:'+seed);
 const byArea=new Map();
 for(const t of templates){if(!byArea.has(t.area))byArea.set(t.area,[]);byArea.get(t.area).push(t);}
 const areas=[...byArea.keys()];
 for(let i=areas.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[areas[i],areas[j]]=[areas[j],areas[i]];}
 const chosen=[];
 for(const area of areas){
  const pool=byArea.get(area);
  chosen.push(pool[Math.floor(rand()*pool.length)]);
  if(chosen.length>=PAPER_SIZE)break;
 }
 const questions=chosen.map((t,i)=>{
  const variant=t.generate(rng(`q:${seed}:${i}:${t.id}`));
  return {templateId:t.id,area:t.area,title:t.title,given:variant.given,
   parts:variant.parts.map(p=>({unit:null,answer:null,solution:null,modelAnswer:null,...p}))};
 });
 return {id,course,seed:String(seed),status:'open',createdAt:now.toISOString(),
  questions,drafts:{},selfMarks:{},elapsedSec:0,timerRunning:false,submittedAt:null,expireAt:null};
}

export function markNumeric(input,answer,tol=TOLERANCE){
 const n=parseNumber(input);
 if(!Number.isFinite(n))return false;
 return Math.abs(n-answer)<=Math.max(Math.abs(answer)*tol,1e-30);
}

// Equal weight for every part of every question, per Shy's decision.
// kind 'numeric' parts are auto-marked; kind 'concept' parts are self-marked.
export function scoreAttempt(attempt){
 let total=0,autoCorrect=0,autoTotal=0,selfCorrect=0,selfTotal=0;
 for(const q of attempt.questions){
  for(const p of q.parts){
   total++;
   if(p.kind==='concept'){
    selfTotal++;
    if(attempt.selfMarks?.[q.templateId]?.[p.label])selfCorrect++;
   }else{
    autoTotal++;
    if(markNumeric(attempt.drafts?.[q.templateId]?.[p.label]??'',p.answer))autoCorrect++;
   }
  }
 }
 return {total,correct:autoCorrect+selfCorrect,autoCorrect,autoTotal,selfCorrect,selfTotal,
  percent:total?Math.round(100*(autoCorrect+selfCorrect)/total):0};
}

// Three CALENDAR months after submission (his stated requirement, not 90 days).
export function expiryFor(submittedAt){
 const d=new Date(submittedAt);
 const day=d.getUTCDate();
 const target=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+RETENTION_MONTHS,1,
  d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds(),d.getUTCMilliseconds()));
 // Clamp to the last day of the target month (Nov 30 + 3 months is Feb 28, not Mar 2).
 const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 target.setUTCDate(Math.min(day,last));
 return target.toISOString();
}

// Retention, applied at load time (free enforcement: hide at expiry, delete on
// next use after expiry; keep the newest MAX_COMPLETED completed attempts).
// Returns {keep, drop}: attempts to retain vs delete now.
export function applyRetention(attempts,now=new Date()){
 const t=now.getTime();
 const isExpired=a=>a.expireAt&&new Date(a.expireAt).getTime()<=t;
 const expired=attempts.filter(isExpired);                       // delete on this use
 const live=attempts.filter(a=>!isExpired(a));
 const completed=live.filter(a=>a.status==='submitted')
  .sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));
 const excess=completed.slice(MAX_COMPLETED);                    // trim oldest beyond 10
 const dropIds=new Set([...expired,...excess].map(a=>a.id));
 return {keep:attempts.filter(a=>!dropIds.has(a.id)),
  drop:attempts.filter(a=>dropIds.has(a.id))};
}

export function submitAttempt(attempt,now=new Date()){
 return {...attempt,status:'submitted',submittedAt:now.toISOString(),
  timerRunning:false,expireAt:expiryFor(now)};
}
