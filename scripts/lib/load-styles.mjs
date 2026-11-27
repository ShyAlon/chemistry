// One place that answers "which stylesheets does the app load?", so browser fixtures that inline CSS
// cannot drift from production (a new imported stylesheet was once missing from three fixtures).
// Discovery: main.jsx imports first, in import order, then every other .js/.jsx/.mjs file anywhere under src/
// (sorted by path, src/content excluded). Recognised forms: `import './x.css'` and `import name from './x.css'`
// with a relative string literal. Any form it cannot resolve (dynamic import of a .css, a .css `@import`, a
// `?inline`/`?url` suffix, a missing file) makes it THROW instead of silently skipping, so fixtures never get a
// partial stylesheet set. Limit: it lists what the source imports; it does not run Vite, so CSS order within
// Vite's own chunking is not reproduced beyond main.jsx-first.
import {readFile,readdir} from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
const STATIC=/^\s*import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+\.css)['"]/gm;
const ANY_CSS=/\.css\b/;
const cssImports=async file=>{
 const text=await readFile(file,'utf8');
 const out=[];
 for(const m of text.matchAll(STATIC)){
  if(!m[1].startsWith('.'))throw new Error('load-styles: non-relative css import '+m[1]+' in '+file);
  const p=path.normalize(path.join(path.dirname(file),m[1]));
  if(!fs.existsSync(p))throw new Error('load-styles: missing stylesheet '+m[1]+' imported by '+file);
  out.push(p);
 }
 const covered=[...text.matchAll(STATIC)].length;
 const mentions=[...text.matchAll(/\b(?:import|require)\s*\(?\s*['"`][^'"`]*\.css[^'"`]*['"`]|from\s+['"][^'"]*\.css\?[^'"]*['"]/g)].length;
 if(mentions>covered)throw new Error('load-styles: unrecognised css import form in '+file+' (dynamic, require or query suffix)');
 return out;
};
const walk=async dir=>{
 const out=[];
 for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:1)){
  const p=path.join(dir,e.name);
  if(e.isDirectory()){if(e.name!=='content')out.push(...await walk(p))}
  else if(/\.(jsx?|mjs)$/.test(e.name))out.push(p);
 }
 return out;
};
export async function stylesheetPaths(root){
 const src=path.join(root,'src');
 const out=[];const add=p=>{if(!out.includes(p))out.push(p)};
 const main=path.join(src,'main.jsx');
 for(const p of await cssImports(main))add(p);
 for(const f of await walk(src))if(f!==main)for(const p of await cssImports(f))add(p);
 for(const p of out){const t=await readFile(p,'utf8');if(/@import\b/.test(t))throw new Error('load-styles: '+p+' uses @import, which this loader does not follow')}
 return out;
}
export async function loadStyles(root){
 const parts=[];
 for(const p of await stylesheetPaths(root))parts.push(await readFile(p,'utf8'));
 return parts.join('\n');
}
