// Hermetic browser-only Firebase double. Production never includes this module.
let cloud=new Map();try{cloud=new Map(JSON.parse(sessionStorage.getItem('stub-progress-cloud')||'[]'))}catch{}
const save=()=>sessionStorage.setItem('stub-progress-cloud',JSON.stringify([...cloud]));
let failure=null;try{failure=sessionStorage.getItem('stub-progress-failure')}catch{}let delay=0;const gate=async()=>{if(delay)await new Promise(r=>setTimeout(r,delay));if(failure)throw Object.assign(Error(failure),{code:failure});};
if(typeof window!=='undefined')window.__progressTest={fail:code=>{failure=code;if(code)sessionStorage.setItem('stub-progress-failure',code);else sessionStorage.removeItem('stub-progress-failure')},delay:n=>{delay=n},cloud:()=>Object.fromEntries(cloud),seed:(path,value)=>{cloud.set(path,structuredClone(value));save();},clear:()=>{cloud.clear();save();}};
export function getFirestore(){return {stub:true}}
const pathOf=args=>args.flatMap(x=>typeof x==='string'?[x]:x?.path?[x.path]:[]).join('/');
export function doc(...args){return {stub:true,path:pathOf(args)}}
export function collection(...args){return {stub:true,path:pathOf(args)}}
export function query(ref,...constraints){return {...ref,constraints}}
export function limit(n){return {limit:n}}
export function serverTimestamp(){return {stub:'serverTimestamp'}}
const snap=ref=>({id:ref.path.split('/').at(-1),exists:()=>cloud.has(ref.path),data:()=>structuredClone(cloud.get(ref.path))});
export async function getDoc(ref){return ref.path?.split('/').length===2?{exists:()=>true,data:()=>({adultConfirmed:true})}:snap(ref)}
export async function getDocsFromServer(ref){await gate();const docs=[...cloud].filter(([p])=>p.startsWith(ref.path+'/')&&!p.slice(ref.path.length+1).includes('/')).slice(0,ref.constraints?.find(c=>c.limit)?.limit||1000).map(([path])=>snap({path}));return {docs,size:docs.length};}
export async function setDoc(ref,value,options={}){await gate();const merge=(a,b)=>Object.fromEntries([...new Set([...Object.keys(a||{}),...Object.keys(b)])].map(k=>[k,k in b?(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?merge(a?.[k],b[k]):structuredClone(b[k])):a[k]]));cloud.set(ref.path,options.merge?merge(cloud.get(ref.path),value):structuredClone(value));save();}
export function writeBatch(){const refs=[];return {delete:ref=>refs.push(ref),commit:async()=>{await gate();for(const ref of refs)cloud.delete(ref.path);save();}};}
export function addDoc(){return Promise.resolve({id:'stub-miss'})}
let tail=Promise.resolve();
export function runTransaction(_db,callback){const run=tail.then(async()=>{await gate();const writes=[];const result=await callback({get:async ref=>snap(ref),set:(ref,value)=>writes.push(()=>cloud.set(ref.path,structuredClone(value))),delete:ref=>writes.push(()=>cloud.delete(ref.path))});writes.forEach(f=>f());save();return result;});tail=run.catch(()=>{});return run;}
