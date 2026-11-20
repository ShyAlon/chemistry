// Pure chat helpers: no Firebase imports, hermetically testable.
import {searchSite} from './search.js';

// Free-tier entitlements VERIFIED LIVE on spectra-chemistry (2026-11-20,
// not Service Usage ceilings): gemini-3.8-flash is limited to 20 requests
// per DAY (QuotaFailure GenerateRequestsPerDayPerProjectPerModel-FreeTier,
// quotaValue 20), which makes it untenable as the primary model.
// gemini-3.5-flash-lite answers within quota, so it is the primary; on a
// transient failure the chat retries once on 3.8-flash and SAYS SO in the
// UI — a silent model fallback is a defect. 2.5-flash is retired for new
// projects.
export const CHAT_MODELS={primary:'gemini-3.5-flash-lite',fallback:'gemini-3.8-flash'};

// A stalled generation (observed live: 200 headers, body never streams)
// must become a retryable failure, not a spinner forever.
export const CHAT_TIMEOUT_MS=45000;

// The chat is a study companion for THIS site, not an unconstrained
// tutor: brief plain-text answers, no Markdown, and it never claims what
// the site does or does not cover — subject routing is computed from the
// real catalogue and rendered by the app, so coverage statements the
// model invents can never be grounded.
export const SYSTEM_INSTRUCTION=[
  'אתה עוזר לימוד לכימיה באתר SPECTRA, אתר עברי לתלמידי תיכון בישראל לקראת הבגרות.',
  'עונה בעברית תמציתית: עד 4 משפטים, בטקסט פשוט בלבד, בלי עיצוב Markdown - בלי כוכביות, בלי כותרות, בלי רשימות מעוצבות.',
  'לעולם אל תטען שהאתר מכסה או לא מכסה נושא מסוים, ואל תפנה לפרקים או לנושאים באתר - ההפניות לנושאים הקיימים מוצגות בנפרד על ידי המערכת.',
  'אם אין לך תשובה בטוחה - אמור זאת במפורש ובקצרה.',
].join(' ');

// Retryable: transient server/load states worth one retry on the fallback
// model. Auth and request-shape errors are not retried.
export function isRetryable(error){
  const status=error?.status??error?.code??'';
  const message=String(error?.message||'');
  return [408,429,500,503].includes(Number(status))
    ||/(overloaded|high demand|unavailable|try again later|RESOURCE_EXHAUSTED|INTERNAL|UNAVAILABLE)/i.test(message);
}

export function isQuotaError(error){
  const status=Number(error?.status??error?.code)||0;
  return status===429||/quota|RESOURCE_EXHAUSTED/i.test(String(error?.message||''));
}

// Which model to try after a failure, or null when retrying is pointless.
export function modelAfterFailure(current,error){
  if(current===CHAT_MODELS.primary&&isRetryable(error))return CHAT_MODELS.fallback;
  return null;
}

// Defensive cleanup for model output: the instruction forbids Markdown,
// and this strips what slips through anyway, so the UI never shows
// literal asterisks or hashes.
export function stripMarkdown(text){
  return String(text||'')
    .replace(/\*\*(.+?)\*\*/gs,'$1')
    .replace(/__(.+?)__/gs,'$1')
    .replace(/`([^`]*)`/g,'$1')
    .replace(/^#{1,6}\s+/gm,'')
    .replace(/^\s*[-*+]\s+/gm,'• ')
    .replace(/[ \t]+$/gm,'')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

export const SUBJECT_CARD_LIMIT=4;

// Intent-to-subject routing over the real site catalogue (BM25 search
// with Hebrew normalization and aliases). Returns navigable cards.
export function matchSubjects(query,{limit=SUBJECT_CARD_LIMIT}={}){
  return searchSite(query,{limit}).map(r=>({route:r.route,kind:r.kind,title:r.title}));
}

// Missing-topic detection: the learner asked about something the
// catalogue does not contain. Weak-match heuristics are a quality trap;
// only a true zero is treated as a miss.
export function isMiss(cards){
  return !cards||cards.length===0;
}

export const MISS_QUESTION_MAX=2000;

// Shapes a missing-topic report to exactly what the deployed Firestore
// rules allow: question (string, <=2000), optional answer/course strings,
// uid pinned by the caller. createdAt is added by the caller as
// serverTimestamp(). Throws on an empty question — the UI disables the
// button, this is the belt-and-braces check.
export function buildMissPayload({question,answer,course,uid}){
  const q=String(question||'').trim();
  if(!q)throw new Error('missing-topic report requires a question');
  const payload={question:q.slice(0,MISS_QUESTION_MAX),uid:String(uid)};
  if(typeof answer==='string'&&answer.trim())payload.answer=answer;
  if(typeof course==='string'&&course.trim())payload.course=course;
  return payload;
}

// Chat failures in the site's Error / Next pattern.
export function chatErrorMessage(error){
  if(isQuotaError(error)){
    return {
      error:'שירות הצ\'אט הגיע לתקרת השימוש כרגע.',
      next:'אפשר לנסות שוב מאוחר יותר, או לחפש את הנושא ישירות בחיפוש האתר:',
    };
  }
  return {
    error:'השאלה לא נשלחה.',
    next:'בודקים את החיבור ומנסים שוב.',
  };
}
