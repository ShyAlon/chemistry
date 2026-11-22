import topic from '../content/84101/topics/G1.json' with {type:'json'};
const theory=topic.content.theory;
const sentences=text=>text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
const chunk=(id,display,spoken=display,extra={})=>({id,display,spoken,...extra});
const formulas=theory[6].text.trim().split(/\s{3,}/);
if(formulas.length!==3||theory[6].symbols.join('|')!=='ρ|m|V#2')throw Error('Pilot source mapping needs review');
const units=sentences(theory[7].text),temperature=sentences(theory[8].text);
export const sections=[
 {id:'matter',title:'מהו חומר?',source:'כימיה כללית 1 · חומר, יחידות וצפיפות',chunks:sentences(theory[1].text).map((text,i)=>chunk('84101-G1-theory1-'+i,text))},
 {id:'density',title:'צפיפות וטמפרטורה',source:'כימיה כללית 1 · חומר, יחידות וצפיפות',chunks:[
  chunk('84101-G1-theory5',theory[5].text),
  ...formulas.map((display,i)=>chunk('84101-G1-theory6-'+i,display,[
   'הצפיפות, רוֹ, שווה למסה, אֶם, חלקי הנפח, וִי.',
   'המסה, אֶם, שווה לצפיפות, רוֹ, כפול הנפח, וִי.',
   'הנפח, וִי, שווה למסה, אֶם, חלקי הצפיפות, רוֹ.'
  ][i],{equation:true,symbols:theory[6].symbols})),
  ...units.map((display,i)=>chunk('84101-G1-theory7-'+i,display,i===0?'יש להתאים יחידות: גרם למיליליטר עם גרם ומיליליטר, או קילוגרם למטר מעוקב עם קילוגרם ומטר מעוקב.':display)),
  ...temperature.map((display,i)=>chunk('84101-G1-theory8-'+i,display,i===0?'טמפרטורה מוחלטת: הטמפרטורה בקלווין שווה לטמפרטורה במעלות צלזיוס ועוד מאתיים שבעים ושלוש נקודה אחת חמש.':display,i===0?{math:display.slice(display.indexOf(':')+1).trim().replace(/\.$/,''),label:'טמפרטורה מוחלטת',symbols:['T','t@celsius']}:{}))
 ]}
];
if(sections[0].chunks.length!==3||units.length!==2||temperature.length!==3)throw Error('Pilot sentence mapping needs review');
