// Pure chat helpers: no Firebase imports, hermetically testable.

// Free-tier entitlements VERIFIED LIVE on spectra-chemistry (2026-11-20,
// not Service Usage ceilings): gemini-3.8-flash is limited to 20 requests
// per DAY (QuotaFailure GenerateRequestsPerDayPerProjectPerModel-FreeTier,
// quotaValue 20), which makes it untenable as the primary model.
// gemini-3.5-flash-lite answers within quota, so it is the primary; on a
// transient failure the chat retries once on 3.8-flash and SAYS SO in the
// UI — a silent model fallback is a defect. 2.5-flash is retired for new
// projects.
export const CHAT_MODELS={primary:'gemini-3.5-flash-lite',fallback:'gemini-3.1-flash-lite'};

// A stalled generation (observed live: 200 headers, body never streams)
// must become a retryable failure, not a spinner forever.
export const CHAT_TIMEOUT_MS=20000;

// The chat is a study companion for THIS site, not an unconstrained
// tutor: brief plain-text answers, no Markdown, and it never claims what
// the site does or does not cover — subject routing is computed from the
// real catalogue and rendered by the app, so coverage statements the
// model invents can never be grounded.
// Retryable: transient server/load states worth one retry on the fallback
// model. Auth and request-shape errors are not retried.
export function isRetryable(error){
  const status=error?.status??error?.code??'';
  const message=String(error?.message||'');
  return [408,429,500,502,503].includes(Number(status))
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

// Structured intent routing, conservative by design (Shy's steering
// 2026-11-20): ONE model call per learner message returns JSON with a
// short answer and 1-5 intent search terms - pronouns and paraphrases are
// resolved by the model using the conversation, so "ומה הקשר שלו ללחות?"
// becomes real chemistry terms. The APP then matches those terms against
// the local catalogue deterministically: cards can only ever be subjects
// that exist, and a missing topic is simply "the understood intent has no
// local match". The model never emits IDs, so invented coverage is
// structurally impossible, not instruction-deep. No calls while typing,
// no separate tutoring-answer call.

export function buildRoutingSystemInstruction(){
  return [
    'אתה עוזר לימוד לכימיה באתר SPECTRA, אתר עברי לתלמידי תיכון בישראל לקראת הבגרות.',
    'בכל תשובה אתה מחזיר אך ורק אובייקט JSON תקני עם שני שדות:',
    '"answer" - תשובה קצרה בעברית, עד 4 משפטים, טקסט פשוט בלבד בלי עיצוב Markdown. לעולם אל תטען שהאתר מכסה או לא מכסה נושא, ואל תפנה לנושאים או לפרקים באתר.',
    '"terms" - מערך של 1 עד 5 מונחי חיפוש כימיים מדויקים (בעברית, או באנגלית כשהמונח אנגלי מקובל) המייצגים את כוונת השאלה, אחרי פירוש כינויי גוף וניסוחים עקיפים בעזרת ההקשר מהשיחה. המונחים משמשים חיפוש מקומי בקטלוג האתר.',
    'אם אין לך תשובה בטוחה - אמור זאת במפורש ובקצרה, ועדיין החזר מונחים.',
  ].join('\n');
}

// JSON-mode generation config for the single routing call.
export const ROUTING_GENERATION_CONFIG={
  responseMimeType:'application/json',
  responseSchema:{
    type:'object',
    properties:{
      answer:{type:'string',description:'תשובה קצרה בעברית, עד 4 משפטים, טקסט פשוט'},
      terms:{type:'array',items:{type:'string'},description:'1-5 מונחי חיפוש כימיים מדויקים המייצגים את כוונת השאלה'},
    },
    required:['answer','terms'],
  },
};

// Matches intent terms against the catalogue ONE TERM AT A TIME (joining
// them into a single query dilutes the match), earliest term first, deduped
// by route, capped at SUBJECT_CARD_LIMIT. Deterministic and fixture-testable.
export function matchIntentTerms(terms,searchFn){
  const seen=new Set();const cards=[];
  for(const term of terms){
    for(const hit of searchFn(term,{limit:3})){
      if(seen.has(hit.route))continue;
      seen.add(hit.route);
      cards.push({route:hit.route,kind:hit.kind,title:hit.title});
      if(cards.length>=SUBJECT_CARD_LIMIT)return cards;
    }
  }
  return cards;
}

// Parses the structured response and matches the understood intent terms
// against the local catalogue via the injected matcher. Malformed JSON
// yields {ok:false}; cards come only from the matcher, so every card is a
// real subject by construction.
export function parseRoutingResponse(raw,matchTerms){
  let data;
  try{
    const text=String(raw||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
    data=JSON.parse(text);
  }catch{return {ok:false,answer:'',terms:[],cards:[],missing:false}}
  const answer=typeof data.answer==='string'?data.answer.trim():'';
  const terms=(Array.isArray(data.terms)?data.terms:[]).filter(t=>typeof t==='string'&&t.trim()).map(t=>t.trim()).slice(0,5);
  const cards=matchIntentTerms(terms,matchTerms);
  return {ok:true,answer,terms,cards,missing:terms.length>0&&cards.length===0};
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
