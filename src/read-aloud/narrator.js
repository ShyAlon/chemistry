// Local-only controller. No DOM scraping, network, storage or analytics.
export const isLocalHebrew = voice => voice?.localService === true && /^(he|iw)(?:[-_]|$)/i.test(voice.lang || '');
export class Narrator {
 constructor({engine, Utterance, onChange=()=>{}, isVisible=()=>true, timer=(fn,ms)=>setTimeout(fn,ms), clear=id=>clearTimeout(id)}) {
  Object.assign(this,{engine,Utterance,onChange,isVisible,timer,clear});
  this.chunks=[];this.voices=[];this.voice=null;this.index=0;this.active=null;this.rate=1;this.status='idle';this.message='';this.token=0;
  this.voiceListener=()=>this.refreshVoices();engine?.addEventListener?.('voiceschanged',this.voiceListener);this.refreshVoices();
 }
 snapshot(){return {index:this.index,active:this.active,rate:this.rate,status:this.status,message:this.message,voices:this.voices,voice:this.voice,available:!!this.voice&&!!this.Utterance};}
 emit(){this.onChange(this.snapshot());}
 reset(){this.token++;this.clear(this.watch);this.watch=null;this.active=null;this.engine?.cancel();}
 refreshVoices(){
  const previous=this.voice;try{this.voices=(this.engine?.getVoices()||[]).filter(isLocalHebrew);}catch{this.voices=[];}
  this.voice=this.voices.find(v=>v.voiceURI===previous?.voiceURI)||this.voices.find(v=>/^he[-_]IL$/i.test(v.lang))||this.voices[0]||null;
  if(previous&&!this.voices.some(v=>v.voiceURI===previous.voiceURI)&&['starting','playing'].includes(this.status))this.stop('הקול שנבחר אינו זמין עוד. ההקראה נעצרה.');
  this.emit();
 }
 load(chunks){this.reset();this.chunks=chunks;this.index=0;this.status='idle';this.message='';this.emit();}
 selectVoice(uri){this.reset();this.voice=this.voices.find(v=>v.voiceURI===uri)||null;this.status='idle';this.message='';this.emit();}
 setRate(rate){if(![0.75,1,1.25,1.5].includes(rate))return;this.rate=rate;this.emit();}
 stop(message=''){this.reset();this.status='idle';this.message=message;this.emit();}
 pause(){if(!['starting','playing'].includes(this.status))return;this.reset();this.status='paused';this.message='ההקראה מושהית. בהמשך, המשפט הנוכחי יתחיל מחדש.';this.emit();}
 jump(index){if(index<0||index>=this.chunks.length)return;const running=['starting','playing'].includes(this.status);this.reset();this.index=index;this.status='idle';this.message='';if(running)this.play(index);else this.emit();}
 fail(token,message){if(token!==this.token)return;this.reset();this.status='error';this.message=message;this.emit();}
 play(index=this.index){
  if(!this.isVisible()){this.stop('ההקראה פועלת רק כשהחלון בחזית.');return;}
  if(!this.voice||!this.Utterance){this.status='error';this.message='לא נמצא קול עברי מקומי זמין. לא נבחר קול חלופי.';this.emit();return;}
  if(!this.chunks[index])return;
  this.reset();this.index=index;this.status='starting';this.message='';const token=this.token;let started=false;
  const utterance=new this.Utterance(this.chunks[index].spoken);utterance.voice=this.voice;utterance.lang=this.voice.lang;utterance.rate=this.rate;
  utterance.onstart=()=>{if(token!==this.token)return;if(!this.isVisible()){this.stop();return;}started=true;this.clear(this.watch);this.watch=this.timer(()=>this.fail(token,'ההקראה התעכבה ונעצרה. אפשר לנסות שוב.'),90000);this.status='playing';this.active=index;this.emit();};
  utterance.onend=()=>{if(token!==this.token)return;this.clear(this.watch);this.active=null;if(!this.isVisible()){this.stop();return;}if(!started){this.fail(token,'לא התקבל אישור לתחילת ההקראה. אפשר לנסות שוב.');return;}if(index+1<this.chunks.length)this.play(index+1);else{this.status='finished';this.emit();}};
  utterance.onerror=()=>this.fail(token,'ההקראה נעצרה בגלל שגיאה בקול המקומי. לא הופעל שירות חלופי.');
  this.watch=this.timer(()=>this.fail(token,'הקול לא התחיל להקריא. אפשר לבדוק את הקול במכשיר ולנסות שוב.'),10000);
  this.emit();try{this.engine.speak(utterance);}catch{this.fail(token,'לא ניתן להתחיל את ההקראה בקול המקומי.');}
 }
 dispose(){this.reset();this.engine?.removeEventListener?.('voiceschanged',this.voiceListener);this.onChange=()=>{};}
}
