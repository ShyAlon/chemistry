import {validateAttempt} from './attempt.js';
// Firestore gateway for mock-exam attempts. Mirrors progress-firebase.js:
// account-bound reads/writes under users/{uid}/mockExam, no shared collections.
import {doc,collection,query,limit,getDocsFromServer,setDoc,deleteDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
import {SCHEMA} from './store.js';
const MAX_ATTEMPTS=32;
export function firebaseMockExamGateway(uid,{db,account}){
 const records=collection(db,`users/${uid}/mockExam`),own=()=>{if(account()?.uid!==uid)throw Object.assign(Error('Account changed'),{code:'mock-exam/account-changed'});};
 async function load(){own();const s=await getDocsFromServer(query(records,limit(MAX_ATTEMPTS+1)));own();if(s.size>MAX_ATTEMPTS)throw Error('Unexpected mock-exam size');return s.docs.map(d=>{const {_ts,...a}=d.data();try{return validateAttempt({...a,questions:JSON.parse(a.questions)});}catch{return null;}}).filter(Boolean);}
 async function save(attempt){own();await setDoc(doc(records,attempt.id),{...attempt,questions:JSON.stringify(attempt.questions),schema:SCHEMA,_ts:serverTimestamp()},{merge:true});own();}
 async function remove(ids){own();const batch=writeBatch(db);for(const id of ids)batch.delete(doc(records,id));own();await batch.commit();own();}
 return {load,save,remove};
}
