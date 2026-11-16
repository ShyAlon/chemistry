import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
test('icon metadata stays within GitHub Pages project base',()=>{
 const html=read('index.html').toString();
 for(const path of ['icons/helium-circle.svg','icons/helium-circle-32.png','icons/helium-180.png','site.webmanifest']){
  assert.ok(html.includes('/chemistry/'+path));
  assert.ok(existsSync(new URL('public/'+path,root)));
 }
 const manifest=JSON.parse(read('public/site.webmanifest'));
 assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.id,'./');
 assert.equal(manifest.short_name,'SPECTRA');
 assert.deepEqual(manifest.icons.map(i=>i.sizes+' '+i.purpose),['192x192 any','512x512 any','192x192 maskable','512x512 maskable']);
 for(const icon of manifest.icons)assert.ok(existsSync(new URL('public/'+icon.src,root)));
});
test('PNG icons have declared pixel dimensions and SVG retains two electrons',()=>{
 for(const f of ['circle-32','180','192','512','circle-192','circle-512']){
  const n=parseInt(f.replace('circle-',''));
  const png=read('public/icons/helium-'+f+'.png');
  assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),n);assert.equal(png.readUInt32BE(20),n);
  if(f.startsWith('circle'))assert.equal(png[25],6); // RGBA: transparent corners for the circular crop
 }
 const svg=read('public/icons/helium-circle.svg').toString();
 assert.equal((svg.match(/cx="26"/g)||[]).length,2);
 assert.equal((svg.match(/<circle/g)||[]).length,9);
 assert.ok(!svg.includes('<animate'));
});
