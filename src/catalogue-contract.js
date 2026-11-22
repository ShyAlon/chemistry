// Shared catalogue contract. File reading belongs to the browser/Node adapters.
const idPattern=/^[A-Za-z0-9_-]+$/;
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const fail=message=>{throw new Error('Course catalogue: '+message)};
export function assembleCatalogue(documents){
 const root=documents['courses.json'];
 if(!object(root)||!Array.isArray(root.courses)||Object.keys(root).some(k=>k!=='courses'))fail('invalid course catalogue');
 const used=new Set(['courses.json']),courseIds=new Set();
 const read=path=>{
  if(typeof path!=='string'||!path.split('/').every(p=>idPattern.test(p.replace(/\.json$/,'')))||!path.endsWith('.json'))fail('unsafe data path');
  if(used.has(path))fail('duplicate file reference: '+path);
  if(!own(documents,path))fail('missing file: '+path);
  used.add(path);return documents[path];
 };
 const courses=root.courses.map(entry=>{
  if(!object(entry)||typeof entry.id!=='string'||!idPattern.test(entry.id)||courseIds.has(entry.id))fail('invalid or duplicate course ID');
  courseIds.add(entry.id);
  if(entry.topicCatalogue!==entry.id+'/topics.json'||own(entry,'topics'))fail('invalid topic catalogue path: '+entry.id);
  const index=read(entry.topicCatalogue);
  if(!object(index)||!Array.isArray(index.topics)||Object.keys(index).some(k=>k!=='topics'))fail('invalid topic catalogue: '+entry.id);
  const topicIds=new Set();
  const topics=index.topics.map(ref=>{
   if(!object(ref)||typeof ref.id!=='string'||!idPattern.test(ref.id)||topicIds.has(ref.id)||Object.keys(ref).some(k=>!['id','file'].includes(k)))fail('invalid or duplicate topic ID: '+entry.id);
   topicIds.add(ref.id);
   if(ref.file!=='topics/'+ref.id+'.json')fail('invalid topic file path: '+entry.id+'/'+ref.id);
   const topic=read(entry.id+'/'+ref.file);
   if(!object(topic)||topic.id!==ref.id||!object(topic.content)||!['theory','worked','quiz'].every(k=>Array.isArray(topic.content[k])))fail('invalid topic content: '+entry.id+'/'+ref.id);
   return topic;
  });
  // Preserve the original property order as well as ordered course/topic arrays.
  return Object.fromEntries(Object.entries(entry).map(([key,value])=>key==='topicCatalogue'?['topics',topics]:[key,value]));
 });
 for(const path of Object.keys(documents))if(!used.has(path))fail('unreferenced data file: '+path);
 return {courses};
}
