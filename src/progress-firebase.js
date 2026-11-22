import {doc,collection,query,limit,getDocsFromServer,setDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
import {SCHEMA,MAX_RECORDS,matchesScope} from './progress-model.js';
export function firebaseProgressGateway(uid,manifest,{db,account}){
 const records=collection(db,`users/${uid}/studyProgress`),own=()=>{if(account()?.uid!==uid)throw Object.assign(Error('Account changed'),{code:'progress/account-changed'});};
 async function load(){own();const s=await getDocsFromServer(query(records,limit(MAX_RECORDS+1)));own();if(s.size>MAX_RECORDS)throw Error('Unexpected progress size');const out={};for(const d of s.docs){if(!manifest[d.id]||d.data().schema!==SCHEMA)throw Error('Unexpected progress schema');out[d.id]=d.data();}return out;}
 async function commit(op,m){own();const patch={schema:SCHEMA,course:m.course,topic:m.topic,kind:m.kind,updatedAt:serverTimestamp(),...(m.kind==='topic'?{answers:{[op.item]:op.value},changedQuestion:op.item}:{value:op.value})};await setDoc(doc(records,op.record),patch,{merge:true});own();}
 async function reset(scope){own();if(scope!=='all'&&!Object.values(manifest).some(m=>matchesScope(m,scope)))throw Error('Unknown reset scope');const current=await load(),batch=writeBatch(db);for(const [id,r] of Object.entries(current))if(matchesScope(r,scope))batch.delete(doc(records,id));own();await batch.commit();own();if(Object.values(await load()).some(r=>matchesScope(r,scope)))throw Error('Reset raced with another device; retry');}
 return {load,commit,reset};
}
