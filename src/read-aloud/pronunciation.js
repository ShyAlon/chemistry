// Reviewed pronunciation hints for ambiguous Hebrew words, applied to the SPOKEN
// string only. The displayed text never changes.
//
// Each entry is a reviewed PHRASE whose context makes the composition sense of
// הרכב unambiguous (e.g. "הרכב הנוזל", "והנוזל באותו הרכב"). A bare הרכב is never
// pointed: in a vehicle sentence ("הרכב נסע") it stays unpointed and the voice
// decides, exactly as before. Unreviewed new contexts stay unmapped until they
// are reviewed and added here; tests/pronunciation.test.js locks this coverage.
// Look-alike words are never touched: הרכבה / בהרכבה / להרכבות ("assembly").
//
// Pointing: composition = הֶרְכֵּב per dictionary sources (pealim.com,
// milononline.net); vehicle = רֶכֶב, a different word. Prefixes (ו/ב/ל/ה) are
// left as written; only the stem carries the hint.
const entries=[
 ['והנוזל באותו הרכב','והנוזל באותו הֶרְכֵּב'],
 ['אותו הרכב לאורך כל זמן','אותו הֶרְכֵּב לאורך כל זמן'],
 ['הרכב + סידור אטומי','הֶרְכֵּב + סידור אטומי'],
 ['ההתחלתי של ההרכב','ההתחלתי של ההֶרְכֵּב'],
 ['לחץ והרכב משפיעים','לחץ והֶרְכֵּב משפיעים'],
 ['להרכב האזאוטרופי','להֶרְכֵּב האזאוטרופי'],
 ['טמפרטורה־הרכב','טמפרטורה־הֶרְכֵּב'],
 ['בהרכב ההתחלתי','בהֶרְכֵּב ההתחלתי'],
 ['שני ההרכבים','שני ההֶרְכֵּבים'],
 ['הרכב אלמנטרי','הֶרְכֵּב אלמנטרי'],
 ['הרכב התערובת','הֶרְכֵּב התערובת'],
 ['את ההרכב הזה','את ההֶרְכֵּב הזה'],
 ['בהרכב היוצא','בהֶרְכֵּב היוצא'],
 ['והרכב קבועים','והֶרְכֵּב קבועים'],
 ['הרכב תערובת','הֶרְכֵּב תערובת'],
 ['הרכב הגרעין','הֶרְכֵּב הגרעין'],
 ['ההרכב היסודי','ההֶרְכֵּב היסודי'],
 ['שמוצאים הרכב','שמוצאים הֶרְכֵּב'],
 ['הרכב הנוזל','הֶרְכֵּב הנוזל'],
 ['הרכב האדים','הֶרְכֵּב האדים'],
 ['והרכב אדים','והֶרְכֵּב אדים'],
 ['הרכב משטח','הֶרְכֵּב משטח'],
 ['הרכב יסודי','הֶרְכֵּב יסודי'],
 ['הרכב נוזל','הֶרְכֵּב נוזל'],
];
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const pronunciationEntries=entries
 .map(([written,spoken])=>({written,spoken,pattern:new RegExp('(?<![א-ת])'+escape(written)+'(?![א-ת])','g')}))
 .sort((a,b)=>b.written.length-a.written.length);
export function applyPronunciation(text){
 let out=text;
 for(const e of pronunciationEntries)out=out.replace(e.pattern,e.spoken);
 return out;
}
