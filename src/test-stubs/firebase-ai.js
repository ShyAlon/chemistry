export class GoogleAIBackend{}
export function getAI(){return {stub:true}}
export function getGenerativeModel(){
  return {startChat:()=>({sendMessage:async text=>({response:{text:()=>'תשובת בדיקה הרמטית לשאלה: '+text}})})};
}
