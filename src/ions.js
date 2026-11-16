// Charge states for the periodic-table configuration controls. Pure logic, no storage.
// Neutral atoms: reference-data.js (NIST Z<=108, Z 104-108 flagged pred = calculated, not measured).
// Cations: NIST ground shells of the free gas-phase ion (ion-data.js, Z<=103). Nothing is derived for cations.
// Anions: not in NIST. Only non-metals that reach the next noble-gas shell with at most 3 added electrons
// are offered, and the result is derived by filling the open subshell, labelled as derived (not measured).
const GAS=[2,10,18,36,54,86,118];
const CAP={s:2,p:6,d:10,f:14};
export const MAX_ANION=3;
const nextGas=z=>GAS.find(g=>g>=z);
export function parseIon(str){const parts=str.split(' ');let core='';if(/^[A-Z]/.test(parts[0]))core=parts.shift();return {core,cfg:parts.map(t=>[t.slice(0,2),+t.slice(2)])}}
export function ionState(e,q,ions){
 const N=e.z-q;
 if(N<1)return {kind:'none',reason:'bare'};
 if(q===0){
  if(!e.cfg.length)return {kind:'missing',core:'',cfg:[]};
  return {kind:e.pred?'predicted':'measured',core:e.core,cfg:e.cfg};
 }
 if(q>0){
  if(!e.cfg.length||e.z>103)return {kind:'unsupported',reason:'no-ion-data'};
  if(!ions)return {kind:'loading'};
  const s=ions[e.z]&&ions[e.z][q-1];
  if(!s)return {kind:'unsupported',reason:'no-ion-data'};
  return {kind:'nist',...parseIon(s)};
 }
 const k=-q;
 if(!e.cfg.length||e.pred)return {kind:'unsupported',reason:'no-neutral'};
 if(!['nonmetal','halogen'].includes(e.cat))return {kind:'unsupported',reason:'anion-scope'};
 const gap=nextGas(e.z)-e.z;
 if(gap>MAX_ANION||k>gap)return {kind:'unsupported',reason:'anion-scope'};
 const cfg=e.cfg.map(([s,n])=>[s,n]);
 let left=k;
 for(const t of cfg){const room=CAP[t[0][1]]-t[1];const add=Math.min(room,left);t[1]+=add;left-=add;if(!left)break}
 if(left)return {kind:'unsupported',reason:'anion-scope'};
 return {kind:'derived',core:e.core,cfg};
}
