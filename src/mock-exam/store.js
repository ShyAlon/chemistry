// Mock-exam persistence: localStorage cache plus account sync, retention at load.
// Pure logic (no DOM/Firebase imports) so unit tests cover it with fakes.
import {applyRetention,validateAttempt} from './attempt.js';
import {isItemError,BLOCK_COOLDOWN_MS} from '../progress-store.js';

export const mockPrefix=uid=>'spectra-mock-exam-v1:'+encodeURIComponent(uid)+':';
export const SCHEMA=1;

// Cache shape: {schema, uid, attempts: {id: {...attempt, _synced: bool}}}.
export function createMockExamStore({uid,storage,gateway,online=()=>true,changed=()=>{},now=()=>Date.now()}){
 const key=mockPrefix(uid)+'cache';
 let closed=false,busy=false,again=false,attempts={},blocked=new Map(),state={phase:'loading',storageFailed:false,error:''};
 try{const c=JSON.parse(storage.getItem(key));if(c?.schema===SCHEMA&&c.uid===uid)attempts=Object.fromEntries(Object.entries(c.attempts||{}).map(([k,v])=>[k,validateAttempt(v)]).filter(([,v])=>v));}catch{state.storageFailed=true;}
 function persist(){try{storage.setItem(key,JSON.stringify({schema:SCHEMA,uid,attempts}));state.storageFailed=false;}catch{state.storageFailed=true;}}
 function visible(){const out={};for(const [id,a] of Object.entries(attempts)){const {_synced,...rest}=a;out[id]=rest;}return out;}
 function snapshot(){return {...state,pending:Object.values(attempts).filter(a=>!a._synced).length,blocked:blocked.size,attempts:visible()};}
 const emit=()=>{if(!closed)changed(snapshot());};
 // Merge server truth with unsynced local work, then apply retention:
 // expired attempts are deleted now (delete-on-next-use), as are the oldest
 // completed beyond the cap.
 async function sync(){if(closed)return;if(!online()){state.phase=state.storageFailed?'attention':'device';emit();return;}if(busy){again=true;return;}busy=true;state.phase='syncing';emit();
  try{
   // An attempt the server refuses (rules/data) is set aside for this session so it cannot stop the others; network/auth errors still stop the pass.
   for(const a of Object.values(attempts))if(!a._synced&&!(blocked.has(a.id)&&now()-blocked.get(a.id).at<BLOCK_COOLDOWN_MS)){const {_synced,...doc}=a;try{await gateway.save(doc);}catch(e){if(closed)return;if(!isItemError(e))throw e;blocked.set(a.id,{code:String(e.code).replace(/^firestore\//,''),at:now()});continue;}if(closed)return;a._synced=true;}
   const server=await gateway.load();if(closed)return;
   // Server copies never replace local work the account has not accepted (e.g. a refused submission of an attempt that exists on the server as open).
   for(const a of server)if(!(attempts[a.id]&&!attempts[a.id]._synced))attempts[a.id]={...a,_synced:true};
   // The completed-attempt cap counts only attempts the account holds, so unsynced work neither is evicted by it nor evicts synced attempts. Expiry (the data-lifetime rule) applies to all.
   const expired=a=>a.expireAt&&new Date(a.expireAt).getTime()<=now();
   const plain=({_synced,...a})=>a,all=Object.values(attempts);
   const {keep,drop}=applyRetention(all.filter(a=>a._synced).map(plain),new Date(now()));
   const keepIds=new Set([...keep.map(a=>a.id),...all.filter(a=>!a._synced&&!expired(a)).map(a=>a.id)]);
   const dropSynced=drop.map(a=>a.id);
   for(const id of Object.keys(attempts))if(!keepIds.has(id))delete attempts[id];
   if(dropSynced.length)await gateway.remove(dropSynced);
   if(closed)return;
   persist();for(const id of [...blocked.keys()])if(!attempts[id]||attempts[id]._synced)blocked.delete(id);state.error=blocked.size?'mock-exam/'+[...blocked.values()][0].code:'';state.phase=state.storageFailed||blocked.size?'attention':Object.values(attempts).some(a=>!a._synced)?'device':'saved';
  }catch(e){if(closed)return;state.error=e.code||'mock-exam/unavailable';state.phase=state.storageFailed||String(state.error).includes('permission')?'attention':'device';}
  finally{busy=false;emit();if(again&&!closed){again=false;void sync();}}
 }
 // Local write: cache immediately, push in the background when online.
 function save(attempt){if(closed)throw Error('Store closed');blocked.delete(attempt.id);attempts[attempt.id]={...attempt,_synced:false};persist();state.phase=state.storageFailed?'attention':'device';emit();void sync();}
 function retry(){if(closed)return Promise.resolve();blocked.clear();return sync();}
 return {start:sync,sync,retry,save,snapshot,close(){closed=true;},storageChanged(){if(!closed)void sync();}};
}
