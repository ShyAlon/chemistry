// Deterministic seeded RNG (mulberry32) so one attempt keeps its exact numbers
// through navigation, reload and across devices.
export function hashSeed(str){
 let h=2166136261>>>0;
 for(const c of String(str)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}
 return h>>>0;
}
export function rng(seed){
 let a=typeof seed==='number'?seed>>>0:hashSeed(seed);
 return function(){
  a=(a+0x6D2B79F5)>>>0;
  let t=a;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
export function range(rand,min,max,step=0.01){
 const steps=Math.round((max-min)/step);
 return min+step*Math.floor(rand()*(steps+1));
}
export function intRange(rand,min,max){return min+Math.floor(rand()*(max-min+1));}
export function pick(rand,arr){return arr[Math.floor(rand()*arr.length)];}
