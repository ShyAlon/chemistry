// Renderer regression: a reaction inside a Hebrew sentence becomes its own LTR run; text without an arrow is untouched.
import test from 'node:test';import assert from 'node:assert/strict';
import {build} from 'esbuild';
const src=(await build({entryPoints:['src/SolutionText.jsx'],bundle:true,write:false,format:'esm',jsx:'automatic',platform:'node',loader:{'.json':'json','.css':'empty'}})).outputFiles[0].text;
import {mkdtempSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const f=join(mkdtempSync(join(tmpdir(),'rx-')),'m.mjs');writeFileSync(f,src);
const mod=await import(f);
const {splitReactionRuns}=mod;
test('reaction in Hebrew sentence is isolated and spaced',()=>{
  const parts=splitReactionRuns('בוחן Na+H₂O→NaOH+H₂ ואז כך');
  const r=parts.filter(p=>p.reaction);
  assert.equal(r.length,1);assert.equal(r[0].text,'Na + H₂O → NaOH + H₂');
  assert.ok(parts.every(p=>p.reaction||/[\u0590-\u05FF]/.test(p.text)));
});
test('text without an arrow passes through unchanged',()=>{
  const t='כמה גרם Fe דרושים ל-100 g NaBr? M(HCl)=36.5.';
  assert.deepEqual(splitReactionRuns(t),[{text:t}]);
});
