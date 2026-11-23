// Mock-exam persistence: localStorage cache plus account sync, retention at load.
// Pure logic (no DOM/Firebase imports) so unit tests cover it with fakes.
import {applyRetention} from './attempt.js';

export const mockPrefix=uid=>'spectra-mock-exam-v1:'+encodeURIComponent(uid)+':';
export const SCHEMA=1;

// Cache shape: {schema, uid, attempts: {id: {...attempt, _synced: bool}}}.
export function createMockExamStore({uid,storage,gateway,online=()=>true,changed=()=>{}}){
 const key=mockPrefix(uid)+'cache';
 let closed=false,busy=false,again=false,attempts={},state={phase:'loading',storageFailed:false,error:''};
 try{const c=JSON.parse(storage.getItem(key));if(c?.schema===SCHEMA&&c.uid===uid)attempts=c.attempts||{};}catch{state.storageFailed=true;}
 function persist(){try{storage.setItem(key,JSON.stringify({schema:SCHEMA,uid,attempts}));state.storageFailed=false;}catch{state.storageFailed=true;}}
 function visible(){const out={};for(const [id,a] of Object.entries(attempts)){const {_synced,...rest}=a;out[id]=rest;}return out;}
 function snapshot(){return {...state,pending:Object.values(attempts).filter(a=>!a._synced).length,attempts:visible()};}
 const emit=()=>{if(!closed)changed(snapshot());};
 // Merge server truth with unsynced local work, then apply retention:
 // expired attempts are deleted now (delete-on-next-use), as are the oldest
 // completed beyond the cap.
 async function sync(){if(closed)return;if(!online()){state.phase=state.storageFailed?'attention':'device';emit();return;}if(busy){again=true;return;}busy=true;state.phase='syncing';emit();
  try{
   for(const a of Object.values(attempts))if(!a._synced){const {_synced,...doc}=a;await gateway.save(doc);if(closed)return;a._synced=true;}
   const server=await gateway.load();if(closed)return;
   for(const a of server)attempts[a.id]={...a,_synced:true};
   const {keep,drop}=applyRetention(Object.values(attempts).map(({_synced,...a})=>a));
   const keepIds=new Set(keep.map(a=>a.id));
   const dropSynced=drop.filter(a=>attempts[a.id]?._synced).map(a=>a.id);
   for(const id of Object.keys(attempts))if(!keepIds.has(id))delete attempts[id];
   if(dropSynced.length)await gateway.remove(dropSynced);
   if(closed)return;
   persist();state.error='';state.phase=state.storageFailed?'attention':'saved';
  }catch(e){if(closed)return;state.error=e.code||'mock-exam/unavailable';state.phase=state.storageFailed||String(state.error).includes('permission')?'attention':'device';}
  finally{busy=false;emit();if(again&&!closed){again=false;void sync();}}
 }
 // Local write: cache immediately, push in the background when online.
 function save(attempt){if(closed)throw Error('Store closed');attempts[attempt.id]={...attempt,_synced:false};persist();state.phase=state.storageFailed?'attention':'device';emit();void sync();}
 return {start:sync,sync,save,snapshot,close(){closed=true;},storageChanged(){if(!closed)void sync();}};
}
