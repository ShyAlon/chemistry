export class GoogleAIBackend{}
export function getAI(){return {stub:true}}
// Mirrors the production structured-routing contract (JSON mode): a plain
// answer plus intent terms that match the real catalogue deterministically,
// so hermetic browser suites exercise the exact card/miss code paths.
export function getGenerativeModel(){
  return {startChat:()=>({sendMessage:async text=>{
    const off=text.includes('פוטוסינתזה');
    const payload=off
      ? {answer:'תשובת בדיקה הרמטית: הנושא אינו מכוסה.',terms:['פוטוסינתזה']}
      : {answer:'תשובת בדיקה הרמטית לשאלה: '+text,terms:['ליגנד','אוסמוזה']};
    return {response:{text:()=>JSON.stringify(payload)}};
  }})};
}
