import catalogueSource from '#catalogue';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const catalogue=structuredClone(catalogueSource);
const registry=fs.readFileSync(new URL('../src/figures.jsx',import.meta.url),'utf8');

test('every topic in both enriched courses carries enrichment theory and at least one figure',()=>{
  for(const course of catalogue.courses.filter(c=>c.id==='84101'||c.id==='84102')){
    for(const t of course.topics){
      const extra=t.content.theory.filter(b=>b.enrich);
      assert.ok(extra.length>=4,course.id+'/'+t.id+' has only '+extra.length+' enrichment blocks');
      const figs=t.content.theory.filter(b=>b.style==='Figure');
      assert.ok(figs.length>=1,course.id+'/'+t.id+' has no figure');
      for(const f of figs){
        assert.ok(f.text.length>20,'figure caption missing in '+t.id);
        assert.ok(registry.includes(`'${f.figure}':`),'figure id not registered: '+f.figure);
      }
      const callouts=t.content.theory.filter(b=>b.style==='Callout');
      assert.ok(callouts.length>=1,course.id+'/'+t.id+' has no callout');
    }
  }
});

test('enrichment blocks are marked and idempotently mergeable',()=>{
  let enriched=0,original=0;
  for(const course of catalogue.courses)for(const t of course.topics)for(const b of t.content.theory)(b.enrich?enriched++:original++);
  assert.ok(enriched>=100);
  assert.ok(original>0,'original verbatim content must remain');
});

test('General Chemistry gained one additional worked pair per topic with verified numbers',()=>{
  const c=catalogue.courses.find(c=>c.id==='84101');
  for(const t of c.topics){
    // batch3 (exam-gap) worked examples are a later reviewed layer on top of the pair.
    const added=t.content.worked.filter(w=>w.enrich&&!w.batch3);
    assert.equal(added.length,2,t.id);
    for(const w of added){assert.ok(w.title);assert.equal(w.content.length,2)}
  }
});

test('figure ids are unique across the catalogue',()=>{
  const seen=new Map();
  for(const course of catalogue.courses)for(const t of course.topics)for(const b of t.content.theory){
    if(b.style!=='Figure')continue;
    assert.ok(!seen.has(b.figure),'figure reused: '+b.figure+' in '+seen.get(b.figure)+' and '+t.id);
    seen.set(b.figure,t.id);
  }
  assert.ok(seen.size>=22);
});
