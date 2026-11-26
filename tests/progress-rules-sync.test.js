import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {MAX_RECORDS} from '../src/progress-model.js';

const repo=fileURLToPath(new URL('..',import.meta.url));
const run=(...args)=>spawnSync(process.execPath,['scripts/build-progress-rules.mjs',...args],{cwd:repo,encoding:'utf8'});

// Cheap guard that runs in `npm test`, so a catalogue change cannot reach CI
// with stale generated Rules or a client record cap below the catalogue size.
test('generated progress Rules match the catalogue and the client record cap covers it',()=>{
 const r=run('--check');
 assert.equal(r.status,0,'run npm run rules:generate and commit operations/firestore/progress.rules: '+r.stderr.split('\n').slice(0,4).join(' '));
 const n=Number(/(\d+) bounded records/.exec(r.stdout)?.[1]);
 assert.ok(Number.isInteger(n)&&n>0,'record count not reported');
 assert.ok(MAX_RECORDS>=n,`MAX_RECORDS (${MAX_RECORDS}) must cover ${n} catalogue records`);
 assert.ok(MAX_RECORDS-n<=1,`MAX_RECORDS (${MAX_RECORDS}) should stay within 1 of the catalogue size (${n}); the rules tests pin the count`);
});
