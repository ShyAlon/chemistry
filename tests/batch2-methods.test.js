import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const topic=id=>JSON.parse(fs.readFileSync(new URL(`../src/content/84101/topics/${id}.json`,import.meta.url),'utf8'));
const added=(t,k)=>topic(t).content[k].filter(b=>b.batch5);
const near=(a,b,tol)=>assert.ok(Math.abs(a-b)<=tol,`${a} vs ${b}`);
// Independent recomputation of the GC1 batch-2 additions (sample-final Q1, Q4, Q10, Q12d types).
// Assumptions stated in the items: ideal gas, course STP molar volume 22.4 L/mol. Author-computed, not an official key.
test('G3 sulfur combustion analysis: Q10-type chain recomputes',()=>{
 const g3=topic('G3').content;
 const hMass=10.8*2/18, mBaSO4=137.3+32+64, nS=35/mBaSO4, fracS=nS*32/9.3;
 near(hMass,1.2,1e-9);near(fracS,0.516,0.001);
 const s=12.4*fracS, c=12.4-hMass-s;
 near(s/32,0.2,0.002);near(c/12,0.4,0.002);near(hMass,1.2,1e-9);
 const q=id=>g3.quiz.find(x=>x.id===id);
 near(q(6).fields[0].value,fracS*100,0.01);
 near(q(7).fields[0].value,2.77*22.4,0.001);
 assert.equal(q(8).fields[0].value,0.2*9/2*32);
 // empirical C2H6S, M=62; O2 balance 2C2H6S+9O2->4CO2+6H2O+2SO2
 assert.equal(2*12+6+32,62);assert.equal(4*2+6+2*2,9*2);
 const w=g3.worked.find(x=>x.batch5);assert.match(w.content.join(' '),/C₂H₆S/);assert.match(w.content.join(' '),/28\.8/);
});
test('G3 two-sample SO2/SO3 analysis (Q1 type) recomputes to C3H8S2',()=>{
 const hFrac=5.993*2/18/8.900, h=5.680*hFrac, s=4.207/80+3.366/64, sm=s*32, c=5.680-h-sm;
 const r=[c/12,h,s].map(x=>x/s);
 near(r[0]*2,3,0.02);near(r[1]*2,8.08,0.02);near(r[2]*2,2,1e-9);
 near(3*12+8+2*32,4.818*22.4,0.2);
 const q=topic('G3').content.quiz.find(x=>x.id===9);assert.match(q.answer,/C₃H₈S₂/);
});
test('G9 Q4-type partial pressures and Q12d Avogadro item recompute',()=>{
 const co2=175,so2=200,h2o=150,cs2=so2/2,hcC=co2-cs2,hcH=2*h2o;
 assert.equal(hcC*4,hcH);near(hcC/(hcC+cs2),0.4285,0.001);
 const oAtoms=2*co2+2*so2+h2o, n=(oAtoms/2/760)*10/(0.08206*723.15);
 near(n*32,3.19,0.005);near(76/22.4,3.39,0.005);
 const g9=topic('G9').content.quiz;
 assert.match(g9.find(x=>x.id===11).answer,/3\.19/);
 const x=3;assert.equal(2+x+5,2*(2+x));assert.equal(g9.find(x2=>x2.id===12).fields[0].value,x*4);
});
test('batch5 additions to G3 and G9 are append-only and carry unique ids',()=>{
 for(const t of['G3','G9']){const ids=topic(t).content.quiz.map(q=>q.id);assert.equal(new Set(ids).size,ids.length);}
 assert.equal(added('G3','quiz').length,4);assert.equal(added('G9','quiz').length,6);
 assert.equal(added('G3','theory').length,4);assert.equal(added('G3','worked').length,1);
});
test('G14 condensation-at-given-pressure and G15 HgCl molecular-formula items recompute',()=>{
 const PB=95.1,PT=28.4,nB=.848/78.11,nT=1/92.14,xB=nB/(nB+nT);
 const P1=xB*PB+(1-xB)*PT,y1=xB*PB/P1,x2=(70-PT)/(PB-PT),y2=x2*PB/70;
 near(xB,0.5,0.001);near(P1,61.75,0.01);near(y1,0.770,0.001);near(y1*PB+(1-y1)*PT,79.8,0.05);
 near(x2,0.6237,0.0001);near(y2,0.8473,0.0001);assert.ok(x2<y1&&y1<y2);near((y2-y1)/(y2-x2),0.345,0.001);
 const g14=topic('G14').content.quiz.filter(q=>q.batch5);
 const v=g14.slice(-2).map(q=>q.fields[0].value);near(v[0],x2,0.0001);near(v[1],y2,0.0001);
 const M=.849/(1.24/34.3*.05);near(M,469.7,0.05);near(M/(200.59+35.45),2,0.02);
 const g15=topic('G15').content.quiz.filter(q=>q.batch5).slice(-2);near(g15[0].fields[0].value,M,0.01);assert.equal(g15[1].fields[0].value,2);
});

// Map-target contract (scripts/check-coverage.mjs blockExists): worked = ONE-based position, quiz = stable quiz id,
// theory = stable block id. Existence alone lets a wrong-but-existing item pass, so pin each changed unit to its new item.
const mapOf=t=>JSON.parse(fs.readFileSync(new URL(`../ingest/84101/coverage/${t}.json`,import.meta.url),'utf8'));
const resolve=(t,ref)=>{const [k,v]=ref.split(':');const c=topic(t).content;return k==='worked'?c.worked[Number(v)-1]:k==='quiz'?c.quiz.find(q=>String(q.id)===v):c.theory.find(b=>b.id===v)};
const unitTargets=(t,label)=>{const out=[];const walk=o=>{if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object'){if((o.id===label||o.ref===label)&&Array.isArray(o.targets)&&o.use==='data-and-method')out.push(...o.targets);Object.values(o).forEach(walk)}};walk(mapOf(t));return out};
for(const [t,label,expect] of [['G14','Q8ג',['worked:9','quiz:12','quiz:13']],['G15','Q10',['worked:14','quiz:16','quiz:17']]])
 test(`${t} map ${label} targets resolve to the new batch5 method items`,()=>{
  assert.deepEqual(unitTargets(t,label),expect);
  for(const r of expect){const b=resolve(t,r);assert.ok(b&&b.batch5,`${t} ${r} is not a new batch5 item`)}
 });

test('G9 pressure/density/volume-ratio/airbag additions recompute',()=>{
 const q=id=>topic('G9').content.quiz.find(x=>x.id===id);
 const R=.08206;
 near(1.25*101.325,q(13).fields[0].value,.05);assert.equal(750+85,q(14).fields[0].value);
 near(4/(R*298.15),q(15).fields[0].value,.0001);near(1.5*2/3,q(16).fields[0].value,1e-9);
 const n=70/(22.99+3*14.007),V=1.5*n*R*299.15/(735/760);near(V,41.0,.05);
 const w=topic('G9').content.worked[7];assert.ok(w.batch5&&w.content[1].includes('41.0 L'));
});
