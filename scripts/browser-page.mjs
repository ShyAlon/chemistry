// A matching selector in the old document is not reload completion.
export async function reloadDocument(call,evaluate,{attempts=200,wait=()=>new Promise(r=>setTimeout(r,50))}={}){
 const previous=await evaluate('performance.timeOrigin');await call('Page.reload');
 for(let i=0;i<attempts;i++){
  try{if(await evaluate(`performance.timeOrigin!==${JSON.stringify(previous)} && document.readyState==='complete'`))return;}
  catch(error){if(!/Execution context was destroyed|Cannot find context|Inspected target navigated/.test(error.message))throw error;}
  await wait();
 }
 throw Error('Reload did not produce a complete new document');
}
