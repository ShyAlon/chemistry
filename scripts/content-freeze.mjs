// Byte-freeze check for src/content: no npm/build/test/CI step may mutate course content.
//   node scripts/content-freeze.mjs --record FILE   Record sha256 of every content file.
//   node scripts/content-freeze.mjs --check FILE    Fail if any content file differs from the record.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fileHash} from './import-lib.mjs';
const args=process.argv.slice(2);
const flag=name=>{const i=args.indexOf('--'+name);return i<0?undefined:args[i+1]};
const root=flag('root')?path.resolve(flag('root')):fileURLToPath(new URL('..',import.meta.url));
const contentDir=path.join(root,'src','content');
const snap=()=>{const out={};const walk=(dir,prefix='')=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const name=prefix+e.name,abs=path.join(dir,e.name);if(e.isDirectory())walk(abs,name+'/');else out[name]=fileHash(abs)}};walk(contentDir);return out};
if(args[0]==='--record'){
 fs.writeFileSync(flag('record'),JSON.stringify(snap(),null,1));
 console.log('content freeze recorded: '+Object.keys(snap()).length+' files');
}else if(args[0]==='--check'){
 const before=JSON.parse(fs.readFileSync(flag('check'),'utf8')),after=snap();
 const diff=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>before[k]!==after[k]);
 if(diff.length){console.error('content freeze FAILED - build/test mutated src/content:');for(const d of diff)console.error('  '+d);process.exit(1)}
 console.log('content freeze OK: '+Object.keys(after).length+' files byte-identical');
}else{console.error('usage: node scripts/content-freeze.mjs --record|--check FILE [--root DIR]');process.exit(1)}
