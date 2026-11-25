import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {figuresHash,figuresHashFor,figureClosure,loadPolicy} from '../scripts/check-coverage.mjs';

function tree(files){
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'fig-'));
 for(const [f,t] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(d,f)),{recursive:true});fs.writeFileSync(path.join(d,f),t)}
 return d;
}
const base={
 'figures.jsx':"import {A} from './figures-core.jsx';\nimport {G} from './figures-gc2.jsx';\nexport const x=1;\n",
 'figures-core.jsx':"export const A=1;\n",
 'figures-gc2.jsx':"import {A} from './figures-core.jsx';\nexport const G=A;\n",
 'figures-nuclear.jsx':"export const N=1;\n",
 'unrelated.jsx':"export const U=1;\n",
};
const pol={figureBinding:{gc2:{roots:['figures.jsx']}}};
const h=(d,id='gc2')=>figuresHashFor(id,pol,d);

test('GC2 binding covers the import closure, sorted, and ignores unrelated files',()=>{
 const d=tree(base);
 assert.deepEqual(h(d).files,['figures-core.jsx','figures-gc2.jsx','figures.jsx']);
 const before=h(d).hash;
 fs.writeFileSync(path.join(d,'unrelated.jsx'),'export const U=2;\n');
 fs.writeFileSync(path.join(d,'figures-nuclear.jsx'),'export const N=2;\n');
 assert.equal(h(d).hash,before);
});
test('editing a GC2-only figure file or a shared dependency changes the GC2 hash',()=>{
 for(const f of ['figures-gc2.jsx','figures-core.jsx','figures.jsx']){
  const d=tree(base);const before=h(d).hash;
  fs.appendFileSync(path.join(d,f),'// edit\n');
  assert.notEqual(h(d).hash,before,f);
 }
});
test('a GC2-only file edit does not change the legacy hash used by courses without a binding',()=>{
 const d=tree(base);
 const real=figuresHash();
 assert.equal(figuresHashFor('nuclear',pol,d).hash,real);
 assert.equal(figuresHashFor('nuclear',pol,d).files,null);
});
test('missing root, missing import and src-escaping import fail closed',()=>{
 let d=tree({'figures.jsx':"import {G} from './figures-gc2.jsx';\n"});
 assert.match(h(d).errors.join('|'),/missing: figures-gc2\.jsx/);assert.equal(h(d).hash,null);
 d=tree({});assert.match(h(d).errors.join('|'),/missing: figures\.jsx/);
 d=tree({'figures.jsx':"import {G} from '../outside.js';\n"});assert.match(h(d).errors.join('|'),/escapes src/);
 assert.match(figuresHashFor('gc2',{figureBinding:{gc2:{roots:[]}}},d).errors.join('|'),/needs roots/);
});
test('a newly imported file joins the binding automatically',()=>{
 const d=tree(base);const before=h(d).hash;
 fs.writeFileSync(path.join(d,'figures-new.jsx'),'export const Q=1;\n');
 fs.appendFileSync(path.join(d,'figures-gc2.jsx'),"import {Q} from './figures-new.jsx';\n");
 assert.ok(h(d).files.includes('figures-new.jsx'));assert.notEqual(h(d).hash,before);
});
test('the real policy binds general-chemistry-2 to an existing closure and leaves nuclear on the legacy hash',()=>{
 const p=loadPolicy();
 assert.ok(p.figureBinding['general-chemistry-2']);assert.equal(p.figureBinding.nuclear,undefined);
 const r=figuresHashFor('general-chemistry-2',p);assert.deepEqual(r.errors,[]);assert.ok(r.files.includes('figures.jsx')&&r.files.includes('figures-core.jsx'));
 assert.equal(figuresHashFor('nuclear',p).hash,figuresHash());
});
