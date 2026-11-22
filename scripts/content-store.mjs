import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assembleCatalogue} from '../src/catalogue-contract.js';
export const contentRoot=fileURLToPath(new URL('../src/content/',import.meta.url));
export function readDocuments(root=contentRoot){
 const documents={};
 const walk=(dir,prefix='')=>{
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   const name=prefix+entry.name,absolute=path.join(dir,entry.name);
   if(entry.isSymbolicLink())throw new Error('Course catalogue: symlink data file');
   if(entry.isDirectory())walk(absolute,name+'/');
   else if(entry.isFile()&&name.endsWith('.json'))documents[name]=JSON.parse(fs.readFileSync(absolute,'utf8'));
   else throw new Error('Course catalogue: unexpected data entry: '+name);
  }
 };
 walk(root);return documents;
}
export function loadCatalogue(root=contentRoot){return assembleCatalogue(readDocuments(root))}
// Existing content-editing scripts write through the manifest, never a monolith.
export function writeCatalogue(catalogue,root=contentRoot){
 const documents=readDocuments(root),current=assembleCatalogue(documents),writes=[];
 if(JSON.stringify(catalogue.courses.map(c=>[c.id,c.topics.map(t=>t.id)]))!==JSON.stringify(current.courses.map(c=>[c.id,c.topics.map(t=>t.id)])))throw new Error('Course catalogue: structural edits require explicit manifest changes');
 const manifest={courses:catalogue.courses.map(course=>Object.fromEntries(Object.entries(course).map(([key,value])=>key==='topics'?['topicCatalogue',course.id+'/topics.json']:[key,value])))};
 const next={...documents,'courses.json':manifest};
 for(const course of catalogue.courses)for(const topic of course.topics)next[course.id+'/topics/'+topic.id+'.json']=topic;
 assembleCatalogue(next); // Validate the entire set before the first write.
 for(const [name,value] of Object.entries(next)){
  const text=JSON.stringify(value,null,1)+'\n',file=path.join(root,name);
  if(text!==fs.readFileSync(file,'utf8'))writes.push([file,text]);
 }
 for(const [file,text] of writes)fs.writeFileSync(file,text);
 return writes.length;
}
export default loadCatalogue();
