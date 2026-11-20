import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

// Starts headless Chrome and waits for its DevTools endpoint. CI runners sometimes
// start Chrome very slowly or not at all on first launch, so a slow or silent start
// is retried with a fresh Chrome process and profile directory. A launch that
// really cannot start still fails, after the last attempt, with sanitized stderr.
export async function launchChrome(profile,{attempts=3,timeoutMs=20000,bin=process.env.CHROME_BIN||'google-chrome'}={}){
 const failures=[];
 for(let attempt=1;attempt<=attempts;attempt++){
  const dir=path.join(profile,`launch-${attempt}`);
  await mkdir(dir,{recursive:true});
  const chrome=spawn(bin,['--headless','--no-sandbox','--disable-gpu','--remote-allow-origins=*','--remote-debugging-port=0',`--user-data-dir=${dir}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
  let text='',exit='not observed';
  const clean=()=>text.replaceAll(profile,'[temporary-profile]').replace(/wss?:\/\/[^\s]+/g,'[debug-endpoint]').replace(/https?:\/\/[^\s]+/g,'[url]').slice(-3000);
  try{
   const endpoint=await new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(Error(`Chrome startup timeout after ${timeoutMs}ms; process exit: ${exit}; stderr:\n${clean()||'[empty]'}`)),timeoutMs);
    chrome.stderr.on('data',x=>{text=(text+x).slice(-12000);const m=text.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(t);resolve(m[1])}});
    chrome.on('exit',(code,signal)=>{exit=`code=${code}, signal=${signal}`;clearTimeout(t);reject(Error(`Chrome exited before DevTools was ready (${exit}); stderr:\n${clean()||'[empty]'}`))});
    chrome.on('error',error=>{clearTimeout(t);reject(error)});
   });
   if(failures.length)console.warn(`Chrome started on attempt ${attempt} after ${failures.length} failed start(s):\n${failures.join('\n')}`);
   chrome.removeAllListeners('exit');
   return {chrome,endpoint};
  }catch(error){
   failures.push(`attempt ${attempt}: ${error.message}`);
   chrome.kill('SIGKILL');
  }
 }
 throw Error(`Chrome did not start in ${attempts} attempts:\n${failures.join('\n')}`);
}
