import readings from './equation-readings.json' with {type:'json'};
import {proseSpeech} from './speech.js';
export function topicNarration(topicId,theory){
 return theory.map((block,index)=>{
  const key=topicId+':'+index,reading=readings[key];
  if(block.layout==='equation'&&(!reading||reading.source!==block.text))throw Error('Theory speech source needs review: '+key);
  const spoken=block.layout==='equation'?(reading.dynamicConstant?proseSpeech(block.text):reading.spoken):proseSpeech((block.style==='Figure'?'תרשים. ':'')+block.text);
  return {id:'84101-'+topicId+'-theory-'+index,display:block.text,spoken,style:block.style,sourceIndex:index};
 });
}
