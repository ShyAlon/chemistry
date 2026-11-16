// Charge states for the periodic-table configuration controls. Pure logic, no storage.
// Neutral atoms: reference-data.js (NIST Z<=108, Z 104-108 flagged pred = calculated, not measured).
// Cations: NIST ground shells of the free gas-phase ion (ion-data.js, Z<=103). Nothing is derived for cations.
// Anions: formal educational filling seeded from the neutral configuration.
// This is electron bookkeeping, not an ab initio prediction or a stability test.
const GAS=[2,10,18,36,54,86,118];
const CAP={s:2,p:6,d:10,f:14};
export const MODEL_MAX_ELECTRONS=118;
export const FILL_ORDER=['1s','2s','2p','3s','3p','4s','3d','4p','5s','4d','5p','6s','4f','5d','6p','7s','5f','6d','7p'];
const CORE_COUNT={'':0,He:2,Ne:10,Ar:18,Kr:36,Xe:54,Rn:86};
const nextGas=z=>GAS.find(g=>g>=z);
// Preserve the source neutral arrangement, including its exceptions. Add into
// the first unfilled subshell in the explicitly stated model order.
export function calculatedAnion(e,k){
 if(!Number.isInteger(k)||k<1||e.z+k>MODEL_MAX_ELECTRONS)return {kind:'unsupported',reason:'model-range'};
 if(!e.cfg.length||CORE_COUNT[e.core]===undefined)return {kind:'unsupported',reason:'no-neutral'};
 let filledCore=CORE_COUNT[e.core];const counts=new Map(e.cfg);let left=k;const cfg=[];
 for(const shell of FILL_ORDER){
  const cap=CAP[shell[1]];
  if(filledCore>=cap){filledCore-=cap;continue}
  const n=counts.get(shell)||0,add=Math.min(cap-n,left);left-=add;
  if(n+add)cfg.push([shell,n+add]);
 }
 if(left)return {kind:'unsupported',reason:'model-range'};
 const familiar=!e.pred&&['nonmetal','halogen'].includes(e.cat)&&nextGas(e.z)-e.z<=3&&k<=nextGas(e.z)-e.z;
 return {kind:familiar?'derived':'model',core:e.core,cfg,method:'neutral-seeded-aufbau',seedPredicted:!!e.pred};
}
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
 return calculatedAnion(e,-q);
}
