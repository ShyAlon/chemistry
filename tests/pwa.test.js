import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
const source=f=>read(new URL('../'+f,import.meta.url),'utf8');
test('PWA remains within the existing GitHub Pages project and standalone identity',()=>{
 const manifest=JSON.parse(source('public/site.webmanifest'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
 assert.ok(source('src/PwaControls.jsx').includes("updateViaCache:'none'"));
 assert.ok(source('scripts/pwa-build.mjs').includes("createHash('sha256')"));
});
test('offline worker never mutates saved progress or intercepts external/post traffic',()=>{
 const sw=source('src/service-worker.template.js');
 assert.ok(!/localStorage\.(setItem|removeItem|clear)\s*\(/.test(sw));assert.ok(sw.includes("request.method!=='GET'"));assert.ok(sw.includes('url.origin!==base.origin'));assert.ok(sw.includes('!url.pathname.startsWith(base.pathname)'));
 assert.ok(sw.includes("k.startsWith(PREFIX)"));assert.ok(sw.includes('catch(error){await caches.delete(CACHE);throw error}'));
});
test('updates need a deliberate activation and the UI warns about unsent drafts',()=>{
 const sw=source('src/service-worker.template.js'),ui=source('src/PwaControls.jsx');
 assert.equal((sw.match(/self.skipWaiting\(/g)||[]).length,1);
 assert.ok(sw.includes("event.data?.type==='ACTIVATE_UPDATE'"));
 assert.ok(ui.includes('if(confirm('));assert.ok(ui.includes('טיוטת תשובה'));assert.ok(ui.includes('שמירה מקומית אינה גיבוי'));
});
