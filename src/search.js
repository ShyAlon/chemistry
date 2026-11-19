// Ranked site search, fully client-side.
// The index is built lazily from the bundled course/reference data, so it is
// always in sync with the shipped content, works offline in the PWA and costs
// nothing: no server, no API, no model download. Lexical BM25-style ranking is
// the right tool here because site search is term lookup over ~60 known pages;
// see PR notes for the vector-search comparison.
import catalogue from './courses.json' with {type:'json'};
import {papers} from './paper-discussions.js';
import {sessions} from './practice-sessions.js';
import {pages as referencePages} from './reference-pages.js';
import {constants,courses as formulaCourses} from './reference-formulas.js';
import {exam84101} from './exam-84101.js';
import {glossaryDocs} from './glossary-data.js';

// Normalize scientific notation and Hebrew spelling variants so that "H₂O",
// "H2O", "מים" typed with non-final letters and Latin in any case all match.
const SUBSUP={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','₊':'+','⁻':'-','⁺':'+','₋':'-'};
const FINALS={'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};
export function normalizeText(text){
 return String(text||'')
  .replace(/[₀-₉⁰-⁹¹²³₊⁻⁺₋]/g,ch=>SUBSUP[ch]||ch)
  .toLowerCase()
  .replace(/[ךםןףץ]/g,ch=>FINALS[ch]);
}
export function tokenize(text){
 // Hebrew letters only (U+05D0-U+05EA): maqaf and cantillation split tokens.
 return normalizeText(text).match(/[a-z0-9]+|[\u05d0-\u05ea]+/g)||[];
}
// Hebrew tokens are often written with or without a one-letter prefix
// (ו/ה/ב/כ/ל/מ/ש). Index both forms so either spelling finds the page.
const HEBREW_PREFIXES='והבכלמש';
// Note: tokenize() runs after final-letter normalization, so a plural ים/ן
// ending reaches us as ימ/נ; suffix variants cover plural/suffix spelling
// differences (קיבול vs קיבולי, התנגשות vs התנגשויות) at reduced weight.
const HEBREW_SUFFIXES=['ימ','ות','י'];
function variants(token){
 if(!/^[\u05d0-\u05ea]/.test(token)||token.length<4)return [token];
 const out=[token];
 if(HEBREW_PREFIXES.includes(token[0]))out.push(token.slice(1));
 const cut=HEBREW_SUFFIXES.find(s=>token.endsWith(s));
 if(cut&&token.length-cut.length>=3)out.push(token.slice(0,-cut.length));
 return out;
}
// Cross-language aliases: the content teaches these scientists' laws in Hebrew
// transliteration only, so a Latin query would otherwise miss them. Each alias
// is verified against the shipped content; extend only with terms that appear.
const ALIASES={
 clausius:['קלאוזיוס'],clapeyron:['קלפירון'],graham:['גרהם'],effusion:['אפוזיה'],
 bohr:['בוהר'],planck:['פלנק'],photoelectric:['פוטואלקטרי'],maxwell:['מקסוול'],
 rydberg:['רידברג'],raoult:['ראול'],dalton:['דלטון'],avogadro:['אבוגדרו'],
 boltzmann:['בולצמן'],osmosis:['אוסמוזה'],
};
// Aliases must be normalized like indexed tokens (final letters, case).
const NORMALIZED_ALIASES=Object.fromEntries(Object.entries(ALIASES).map(([k,v])=>[k,v.flatMap(a=>tokenize(a))]));
// Query forms with weights: exact spelling 1, cross-language alias 0.9,
// prefix-stripped Hebrew variant 0.5 (recall without letting "יקוע" from
// "שיקוע" outrank a real match).
function queryForms(term){
 const forms=[{form:term,weight:1}];
 for(const alias of NORMALIZED_ALIASES[term]||[])forms.push({form:alias,weight:0.9});
 for(const variant of variants(term))if(variant!==term)forms.push({form:variant,weight:0.5});
 return forms;
}

const WEIGHTS={title:6,head:3,body:1};
const K1=1.2,B=0.75;

function makeDoc({route,kind,context,title,head=[],body=[],titleBoost}){
 return {route,kind,context,title,head,body,titleBoost};
}
function collectDocs(){
 const docs=[];
 for(const course of catalogue.courses){
  docs.push(makeDoc({
   route:'course/'+course.id,kind:'קורס',context:course.name,title:course.name,
   head:[course.englishName||''],
   body:[course.description||''],
  }));
  for(const topic of course.topics){
   const content=topic.content||{theory:[],worked:[],quiz:[]};
   docs.push(makeDoc({
    route:'course/'+course.id+'/'+topic.id,kind:'נושא',context:course.name,
    title:topic.name,
    head:[topic.id,topic.title||'',...(content.theory||[]).filter(p=>p.style==='Heading').map(p=>p.text||'')],
    body:[
     ...(content.theory||[]).filter(p=>p.style!=='Heading').map(p=>p.text||''),
     ...(content.worked||[]).flatMap(w=>[w.title||'',...(w.content||[])]),
     ...(content.quiz||[]).flatMap(q=>[q.prompt||'',...(q.options||[]),q.answer||'']),
    ],
   }));
  }
 }
 // One doc per glossary term: the term names are heading-weight fields and the
 // definition is the body, so a topic whose title matches still outranks a term,
 // while the term's stable deep link (course/<id>/glossary/<slug>) is the result
 // users can land on and share. Kind chip: מונח.
 const courseNames=Object.fromEntries(catalogue.courses.map(c=>[c.id,c.name]));
 for(const g of glossaryDocs()){
  docs.push(makeDoc({
   route:g.route,kind:g.kind,context:courseNames[g.course]||g.course,
   title:g.title,head:g.headings,body:[g.body],
   // Term names carry heading weight, not title weight: a topic whose title
   // matches the query still outranks the glossary term that names it.
   titleBoost:WEIGHTS.body,
  }));
 }
 for(const paper of papers){
  docs.push(makeDoc({
   route:'course/nano/papers/'+paper.id,kind:'מאמר',context:'ננו-חומרים',
   title:paper.title,
   head:[paper.short||'',paper.subtitle||'',paper.kind||'',...(paper.sections||[]).map(s=>s.title||'')],
   body:[
    paper.opener||'',
    ...(paper.sections||[]).flatMap(s=>s.paragraphs||[]),
    ...(paper.figures||[]).flatMap(f=>[f.title||'',f.caption||'']),
    ...(paper.examples||[]).flatMap(e=>[e.title||'',...(e.steps||[])]),
    ...(paper.oral||[]).map(q=>typeof q==='string'?q:(q.q||q.prompt||'')),
   ],
  }));
 }
 docs.push(makeDoc({
  route:'course/84102/practice',kind:'תרגול',context:'כימיה אי-אורגנית',
  title:'תרגולים מעורבים לבוחן',
  head:sessions.map((s,i)=>'תרגול '+(i+1)),
  body:sessions.flatMap(s=>(s.questions||[]).flatMap(q=>[q.prompt||'',...(q.options||[]),q.explanation||''])),
 }));
 docs.push(makeDoc({
  route:'course/84101/practice',kind:'בחינה',context:'כימיה כללית א׳',
  title:'שאלות ברמת בחינה',
  head:exam84101.flatMap(p=>[p.id+' '+p.title,p.topics||'']),
  body:exam84101.flatMap(p=>[p.given||'',...p.parts.flatMap(part=>[part.question||'',...(part.solution||[])])]),
 }));
 for(const page of referencePages){
  const extra=[];
  if(page.id==='formulas'){
   extra.push(...constants.map(([label,formula,note])=>[label,formula,note||''].join(' ')));
   for(const fc of formulaCourses)for(const t of fc.topics)extra.push(t.title,...t.items.map(([label,formula,note])=>[label,formula,note||''].join(' ')));
  }
  docs.push(makeDoc({
   route:'references/'+page.id,kind:'מקרא',context:'מקראות',
   title:page.title,head:[],body:[page.desc,...extra],
  }));
 }
 return docs;
}

let cache=null;
export function buildSearchIndex(){
 if(cache)return cache;
 const docs=collectDocs();
 const df=new Map();
 for(const doc of docs){
  doc.titleTokens=doc.title?tokenize(doc.title).flatMap(variants):[];
  doc.headTokens=doc.head.flatMap(t=>tokenize(t).flatMap(variants));
  doc.bodyTokens=doc.body.flatMap(t=>tokenize(t).flatMap(variants));
  doc.length=doc.titleTokens.length+doc.headTokens.length+doc.bodyTokens.length;
  doc.plainTitle=normalizeText(doc.title);
  doc.plainBody=normalizeText(doc.body.join(' '));
  const seen=new Set([...doc.titleTokens,...doc.headTokens,...doc.bodyTokens]);
  for(const token of seen)df.set(token,(df.get(token)||0)+1);
 }
 const total=docs.reduce((n,d)=>n+d.length,0);
 cache={docs,df,avg:total/docs.length||1};
 return cache;
}

// Whole-phrase aliases for English names of concepts taught only in Hebrew.
// Single-word equivalents live in ALIASES; these key the normalized full query.
const PHRASE_ALIASES={
 'mean free path':'מהלך חופשי',
 'collision frequency':'מהלך חופשי ומספר התנגשויות',
 'dew point':'נקודת טל',
};

export function searchSite(query,{limit=12}={}){
 const terms=[...new Set(tokenize(query))].filter(t=>t.length>1||/^[a-z0-9]/i.test(t));
 const normalizedQuery=normalizeText(query).replace(/\s+/g,' ').trim();
 const aliasPhrase=PHRASE_ALIASES[normalizedQuery];
 if(aliasPhrase)for(const t of tokenize(aliasPhrase))if(!terms.includes(t))terms.push(t);
 if(!terms.length)return [];
 const {docs,df,avg}=buildSearchIndex();
 const idf=t=>Math.log(1+(docs.length-(df.get(t)||0)+0.5)/((df.get(t)||0)+0.5));
 const phrase=aliasPhrase?normalizeText(aliasPhrase):normalizeText(terms.join(' '));
 const idfSum=terms.reduce((n,t)=>n+Math.max(idf(t),idf(t.slice(1))||0),0);
 const scored=[];
 for(const doc of docs){
  let score=0;
  for(const term of terms){
   const forms=queryForms(term);
   const present=forms.filter(f=>df.has(f.form));
   if(!present.length)continue;
   const counts=(tokens,form)=>tokens.reduce((n,c)=>n+(c===form?1:0),0);
   const tfW=present.reduce((n,f)=>n+f.weight*((doc.titleBoost||WEIGHTS.title)*counts(doc.titleTokens,f.form)+WEIGHTS.head*counts(doc.headTokens,f.form)+WEIGHTS.body*counts(doc.bodyTokens,f.form)),0);
   if(!tfW)continue;
   score+=Math.max(...present.map(f=>idf(f.form)))*(tfW*(K1+1))/(tfW+K1*(1-B+B*doc.length/avg));
  }
  if(!score)continue;
  if(terms.length>1){
   if(doc.plainTitle.includes(phrase))score+=idfSum*2;
   else if(doc.plainBody.includes(phrase))score+=idfSum*0.5;
  }
  scored.push({doc,score});
 }
 // Contract: a title match on a real page outranks glossary-term docs, so a
 // topic that names the concept in its title is never buried under its own
 // glossary entries. Term pages lead only when no page title matches.
 const titleHit=doc=>terms.some(t=>queryForms(t).some(f=>f.weight>=0.9&&doc.titleTokens.includes(f.form)));
 scored.sort((a,b)=>{
  const ta=a.doc.kind!=='מונח'&&titleHit(a.doc),tb=b.doc.kind!=='מונח'&&titleHit(b.doc);
  if(ta!==tb)return ta?-1:1;
  return b.score-a.score;
 });
 return scored.slice(0,limit).map(({doc,score})=>({
  route:doc.route,kind:doc.kind,context:doc.context,title:doc.title,score,
  snippet:pickSnippet(doc,terms),
 }));
}

function pickSnippet(doc,terms){
 const forms=[...new Set(terms.flatMap(t=>queryForms(t).map(f=>f.form)))];
 const hit=text=>forms.some(f=>tokenize(text).includes(f));
 const source=[...doc.head,...doc.body].filter(Boolean);
 const found=source.find(hit)||source[0]||'';
 const text=String(found).replace(/\s+/g,' ').trim();
 if(text.length<=160)return text;
 const lower=normalizeText(text);
 let at=lower.length;
 for(const f of forms){const i=lower.indexOf(f);if(i>=0&&i<at)at=i}
 const start=Math.max(0,at-60);
 return (start>0?'…':'')+text.slice(start,start+160).trim()+(start+160<text.length?'…':'');
}
