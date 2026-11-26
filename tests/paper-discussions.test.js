import catalogueSource from '#catalogue';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {papers,paperSources,paperFromRoute} from '../src/paper-discussions.js';
const catalogue=structuredClone(catalogueSource);
test('only the two selected nano papers have independent discussion routes',()=>{
 assert.deepEqual(papers.map(p=>p.id),['shape-2026','pbse-2017']);
 for(const p of papers){assert.equal(paperFromRoute('course/nano/papers/'+p.id),p);assert.equal(paperFromRoute('/course/nano/papers/'+p.id),p)}
 for(const r of ['course/84101/papers/pbse-2017','course/nano/N8','course/nano/papers/turkevich','course/nano/papers/pbse-2017/extra'])assert.equal(paperFromRoute(r),null);
 assert.equal(catalogue.courses.find(c=>c.id==='nano').topics.length,13);
});
test('paper guides include sourced argument, figure analysis, worked reasoning and oral checkpoints',()=>{
 for(const p of papers){assert.ok(p.opener.length>300);assert.ok(p.sections.length>=10);assert.equal(p.figures.length,4);assert.ok(p.examples.length>=3);assert.equal(p.oral.length,10);assert.ok(paperSources[p.source]);
 for(const s of p.sections){assert.ok(s.ref);assert.ok(s.paragraphs.length>=2);for(const t of s.paragraphs)assert.ok(t.length>90)}
 for(const f of p.figures)for(const k of ['title','ref','observe','claim','limit','question'])assert.ok(f[k]?.length>(k==='ref'?0:10),p.id+'/'+k);
 for(const q of p.oral){assert.equal(q.length,3);assert.ok(q[0].endsWith('?'));assert.ok(q[1].length>80);assert.ok(q[2].length>20)}
 }
 for(const s of Object.values(paperSources))assert.match(s.url,/^https:\/\//);
});
test('load-bearing distinctions stay explicit in both paper guides',()=>{
 const shape=JSON.stringify(papers[0]),pbse=JSON.stringify(papers[1]);
 for(const term of ['UPD','EDS','Pd','reliable','אינה','ליגנד'])assert.ok(shape.includes(term),term);
 for(const term of ['0.5-2%','73-83%','400 nm','2 ns','83-97%','כתב-היד','גאוסיאנ','אינו מודד ישירות'])assert.ok(pbse.includes(term),term);
 assert.ok(Math.abs(100/8**(1/3)-50)<1e-10);assert.equal(4*.02,.08);assert.equal(Math.sqrt(100**2-80**2),60);assert.ok(Math.abs(Math.log(2)/.1-6.9314718056)<1e-9);
});
