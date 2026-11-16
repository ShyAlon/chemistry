import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('header and footer live in the shared App layout, not in individual pages',()=>{
 const main=read('src/main.jsx'),refs=read('src/references.jsx');
 assert.equal((main.match(/<header /g)||[]).length,1);
 assert.equal((main.match(/<footer /g)||[]).length,1);
 assert.ok(!/<header|<footer/.test(refs));
 // The footer sits at App level, after every route's content and inside the .app container.
 assert.ok(main.indexOf('<footer className="site-footer">')>main.indexOf('<References route={route}/>'));
});
test('shared header and footer are sticky and anchors clear them',()=>{
 const css=read('src/style.css');
 assert.match(css,/\.header\{position:sticky;top:0;/);
 assert.match(css,/\.site-footer\{position:sticky;bottom:0;/);
 assert.match(css,/html\{scroll-padding-top:\d+px;scroll-padding-bottom:\d+px\}/);
 assert.match(css,/max-height:520px\)\{\.header\{height:56px\}\.brand-sub\{display:none\}\.site-footer\{display:flex/); // short screens: both bars stay visible in a compact form
});
