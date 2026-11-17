import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {courses,constants} from '../src/reference-formulas.js';
const topics=courses.find(c=>c.id==='84102').topics;
const rows=id=>topics.find(t=>t.id===id).items;
test('ionization threshold is explicit, positive and uses per-particle energy',()=>{
 const p9=rows('P9');
 assert.ok(p9.some(([l,e,n])=>l==='אורך גל סף ליינון'&&e==='λ_ion,max = h·c/IE'&&n.includes('לאלקטרון אחד')));
 assert.ok(p9.some(([l,e])=>e==='λ_ion,max(nm) ≈ 1240/IE(eV)'));
 for(const [energy,nm] of [[13.6,91.2],[7.9,157],[3.9902777778,310.8],[54.4,22.8]])assert.ok(Math.abs(1240/energy-nm)<.06);
 const h=6.62607015e-34,c=299792458,e=1.602176634e-19,Na=6.02214076e23;
 const perParticle=1312e3/Na;
 assert.ok(Math.abs(h*c/perParticle*1e9-91.2)<.1);
 assert.ok(Math.abs(h*c/(13.6*e)*1e9-91.2)<.1);
});
test('Rydberg constant, signs and hydrogenic limits are not conflated',()=>{
 assert.ok(constants.some(([l,e])=>l.includes('מספר גל')&&e==='R∞ = 1.097×10⁷ m⁻¹'));
 assert.ok(rows('P3').some(([l,e,n])=>e==='1/λ = R∞·Z²·|1/n_f² − 1/n_i²|'&&n.includes('חד־אלקטרונית')));
 assert.ok(Math.abs(1/(1.097e7*(1/4-1/25))*1e9-434)<.2);
 assert.ok(rows('P9').some(([l,e,n])=>e.includes('91.2')&&n.includes('קירוב')));
});
test('quiz audit supplies direct uncertainty, Zeff, peaks and modern valence rules',()=>{
 for(const [id,fragment] of [['P4','Δp_min = h/(4π·Δx)'],['P4','Δv_min = h/(4π·m·Δx)'],['P8','Z_eff ≈ n·√(IE/R_H)'],['P6','N_peaks = n − l']])assert.ok(rows(id).some(r=>r[1]===fragment));
 assert.ok(rows('P7').some(r=>r[0]==='ערכיות'&&r[1].includes('13–18')&&r[2].includes('הליום')));
 const h=6.62607015e-34,m=9.1093837139e-31;
 assert.ok(Math.abs(h/(4*Math.PI*m*.15e-9)-385892.12)<1);
 assert.ok(Math.abs(4*Math.sqrt(7.9/13.6)-3.04863)<.0001);
});
test('two-column presentation preserves section order and phone typography',()=>{
 const jsx=fs.readFileSync(new URL('../src/references.jsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.ok(jsx.includes('<div className="formula-grid">'));
 assert.ok(!jsx.includes('photon-shortcut-title'),'No duplicate photon banner');
 assert.ok(rows('P2').some(r=>r[1].includes('1240/λ(nm)')));
 assert.ok(css.includes('@media(min-width:1000px){.formula-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'));
 assert.ok(!/column-count/.test(css));
});

test('reference recommendations are present in the printable source, not external links',()=>{
 const order=rows('P7').find(r=>r[0]==='סדר האכלוס המלא');
 assert.ok(order[1].order[0].startsWith('1s²  2s²  2p⁶'));
 assert.ok(order[1].order.at(-1).endsWith('5f¹⁴  6d¹⁰  7p⁶'));
 assert.ok(rows('P7').some(r=>r[0]==='אכלוס יונים'&&r[2].includes('ns לפני')));
 assert.ok(rows('P6').some(r=>r[0]==='RPD בפחמן'));
 assert.ok(rows('P9').some(r=>r[0]==='השוואת יינון'&&r[1].includes('IE₂: B > C > Al > Be')));
});
