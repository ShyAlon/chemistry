import {SCHEMA,clone,apply,toView,validValue,matchesScope} from './progress-model.js';
// One small account cache. Last successful same-answer write wins.
export const progressPrefix=uid=>'spectra-account-progress-v1:'+encodeURIComponent(uid)+':';
export function createProgressStore({uid,storage,gateway,manifest,changed=()=>{},id=()=>crypto.randomUUID(),online=()=>true}){
 const key=progressPrefix(uid)+'cache';let closed=false,busy=false,resetting=false,again=false,records={},pending={},state={phase:'loading',storageFailed:false,error:''};
 try{const c=JSON.parse(storage.getItem(key));if(c?.schema===SCHEMA&&c.uid===uid){records=c.records||{};for(const [k,o] of Object.entries(c.pending||{}))if(validValue(manifest[o.record],o.item,o.value))pending[k]=o;}}catch{state.storageFailed=true;}
 function persist(){try{storage.setItem(key,JSON.stringify({schema:SCHEMA,uid,records,pending}));state.storageFailed=false;}catch{state.storageFailed=true;}}
 function snapshot(){const visible=clone(records);for(const o of Object.values(pending))visible[o.record]=apply(visible[o.record],o,manifest[o.record]);return {...state,pending:Object.keys(pending).length,volatile:state.storageFailed&&Object.keys(pending).length>0,progress:toView(visible,manifest)};}
 const emit=()=>{if(!closed)changed(snapshot());};
 async function sync(refresh=true){if(closed)return;if(!online()){state.phase=state.storageFailed?'attention':'device';emit();return;}if(busy||resetting){again=true;return;}busy=true;state.phase='syncing';emit();
  try{if(refresh){const r=await gateway.load();if(closed)return;records=r;}
   for(const [k,o] of Object.entries(pending)){await gateway.commit(o,manifest[o.record]);if(closed)return;records[o.record]=apply(records[o.record],o,manifest[o.record]);if(pending[k]?.id===o.id)delete pending[k];persist();}
   persist();state.error='';state.phase=state.storageFailed?'attention':Object.keys(pending).length?'device':'saved';
  }catch(e){if(closed)return;state.error=e.code||'progress/unavailable';state.phase=state.storageFailed||state.error.includes('permission')?'attention':'device';}
  finally{busy=false;emit();if(again&&!closed){again=false;void sync();}}
 }
 function enqueue(record,item,value){if(closed||resetting)throw Error('Account closed or reset in progress');item=String(item);const m=manifest[record];if(m?.kind==='practice')value={...value,attempts:(snapshot().progress[m.course]?._practice?.[m.topic]?.attempts||0)+1};if(!validValue(m,item,value))throw Error('Invalid progress');const k=record+'/'+item;pending[k]={id:id(),record,item,value:clone(value)};persist();state.phase=state.storageFailed?'attention':'device';emit();void sync(false);return pending[k]?.id;}
 async function reset(scope){if(closed||busy||resetting||!online())throw Error('Connect and finish pending synchronization before reset');resetting=true;state.phase='syncing';emit();try{await gateway.reset(scope);if(closed)return;records=await gateway.load();if(closed)return;for(const [k,o] of Object.entries(pending))if(matchesScope(manifest[o.record],scope))delete pending[k];persist();state.error='';state.phase=state.storageFailed?'attention':'saved';}catch(e){state.phase='attention';state.error='progress/reset-unconfirmed';throw e;}finally{resetting=false;emit();}}
 return {start:sync,sync,enqueue,reset,snapshot,close(){closed=true;},storageChanged(){if(!closed)void sync();}};
}
