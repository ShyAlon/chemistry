// Dependency setup, separate from hermetic tests. No credentials or Google APIs.
import {mkdir,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
export const emulatorVersion='1.19.8',emulatorSha='9d43599ed6151199e8d604dc87fac51218e49e5f3a48519b1ae560bbe5e3382d';
export const emulatorJar=new URL('../.local-test/firestore-emulator.jar',import.meta.url);
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
if(process.argv[1]===new URL(import.meta.url).pathname){
 let bytes;try{bytes=await readFile(emulatorJar)}catch{}
 if(!bytes||digest(bytes)!==emulatorSha){const response=await fetch(`https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v${emulatorVersion}.jar`);if(!response.ok)throw Error('Emulator dependency download failed');bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>100_000_000||digest(bytes)!==emulatorSha)throw Error('Emulator digest mismatch; nothing executed');await mkdir(new URL('../.local-test/',import.meta.url),{recursive:true});await writeFile(emulatorJar,bytes);}
 console.log('Pinned Firestore emulator dependency verified. Tests use only loopback/demo-chem-progress.');
}
