/* Build-generated, project-scoped cache. Never touches progress/localStorage. */
const VERSION=__VERSION__;
const PREFIX='spectra-chemistry-';
const CACHE=PREFIX+VERSION;
const FILES=__FILES__;
const base=new URL('./',self.location);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{await cache.addAll(FILES.map(f=>new Request(new URL(f,base),{cache:'reload'})))}
 catch(error){await caches.delete(CACHE);throw error}
 // Updated workers wait. Activation is requested by the user, not during a quiz.
})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=(await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE);
 // Retain one previous edition for already-open tabs and their lazy chunks.
 await Promise.all(keys.slice(0,-1).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
 if(url.pathname===new URL('sw.js',base).pathname)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(request.mode==='navigate')return (await cache.match(new URL('index.html',base)))||fetch(request);
  // Hashed bundle URLs can belong to an already-open previous edition.
  return (await cache.match(request))||(await caches.match(request))||fetch(request);
 })());
});
