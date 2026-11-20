// Merge the enrichment layers into src/courses.json. Idempotent: strips blocks
// marked enrich:true before appending the current enrichment content.
import fs from 'node:fs';
import {enrichment84102} from '../src/enrichment-84102.js';
import {enrichment84101} from '../src/enrichment-84101.js';
import {applyNotation} from '../src/notation-apply.js';

const path=new URL('../src/courses.json',import.meta.url);
const catalogue=JSON.parse(fs.readFileSync(path,'utf8'));
const layers={'84102':enrichment84102,'84101':enrichment84101};
let added={theory:0,worked:0};
for(const course of catalogue.courses){
  const layer=layers[course.id];
  if(!layer)continue;
  for(const topic of course.topics){
    const add=layer[topic.id];
    if(!add)continue;
    topic.content.theory=topic.content.theory.filter(b=>!b.enrich);
    topic.content.worked=topic.content.worked.filter(b=>!b.enrich);
    topic.content.theory.push(...add.theory);
    if(add.worked)topic.content.worked.push(...add.worked);
    added.theory+=add.theory.length;
    added.worked+=(add.worked||[]).length;
  }
}
const blocks=JSON.parse(fs.readFileSync(new URL('../src/notation-blocks.json',import.meta.url),'utf8'));
console.log('notation blocks restored:',applyNotation(catalogue,blocks));
fs.writeFileSync(path,JSON.stringify(catalogue,null,1)+'\n');
console.log('enrichment merged:',added);
