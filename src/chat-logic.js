// Pure chat helpers: no Firebase imports, hermetically testable.

// Current-gen free-tier models verified live on spectra-chemistry
// (2026-11-20): 3.8-flash is the primary; on a transient failure the chat
// retries once on 3.5-flash-lite and SAYS SO in the UI — a silent model
// fallback is a defect. 2.5-flash is retired for new projects.
export const CHAT_MODELS={primary:'gemini-3.8-flash',fallback:'gemini-3.5-flash-lite'};

export const SYSTEM_INSTRUCTION=[
  'אתה מורה לכימיה באתר SPECTRA, אתר לימוד עברי לתלמידי תיכון בישראל לקראת הבגרות.',
  'עונה תמיד בעברית, בקצרה ובבהירות, ברמה של תלמיד תיכון.',
  'כשאפשר, מקשר את התשובה לחומר הלימוד שקיים באתר.',
  'אם אין לך תשובה בטוחה — אומר זאת במפורש ומציע לחפש באתר או לשאול מורה.',
].join(' ');

// Retryable: transient server/load states worth one retry on the fallback
// model. Auth and request-shape errors are not retried.
export function isRetryable(error){
  const status=error?.status??error?.code??'';
  const message=String(error?.message||'');
  return [429,500,503].includes(Number(status))
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
