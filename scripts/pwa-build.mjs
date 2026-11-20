import {readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
export function pwaBuild(){let outDir='dist';return {name:'chemistry-offline',apply:'build',configResolved(config){outDir=config.build.outDir},async closeBundle(){
 const root=path.resolve(outDir);
 const walk=async dir=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.relative(root,path.join(dir,e.name)).replaceAll(path.sep,'/')]))).flat();
 const files=(await walk(root)).filter(f=>f!=='sw.js').sort();
 const hash=createHash('sha256');for(const f of files){hash.update(f);hash.update(await readFile(path.join(root,f)))}
 const version=hash.digest('hex').slice(0,16);
 const template=await readFile('src/service-worker.template.js','utf8');
 const {writeFile}=await import('node:fs/promises');
 await writeFile(path.join(root,'sw.js'),template.replace('__VERSION__',JSON.stringify(version)).replace('__FILES__',JSON.stringify(files)));
}}}
