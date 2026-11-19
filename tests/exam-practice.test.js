import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exam84101,examNote} from '../src/exam-84101.js';

const jsx=readFileSync(new URL('../src/ExamPractice.jsx',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');

test('exam practice section: eight multi-part problems wired to a route and a course-map entry',()=>{
 assert.equal(exam84101.length,8);
 assert.deepEqual(exam84101.map(p=>p.id),['E1','E2','E3','E4','E5','E6','E7','E8']);
 assert.ok(examNote.length>50);
 for(const p of exam84101){
  assert.ok(p.title&&p.given&&p.topics,p.id);
  assert.ok(p.parts.length>=3,p.id+' has too few parts');
  const labels=p.parts.map(x=>x.label);
  assert.deepEqual([...labels].sort(),labels,p.id+' labels out of order');
  for(const part of p.parts){assert.ok(part.question.length>10);assert.ok(part.solution.length>=1);for(const s of part.solution)assert.ok(s.length>10)}
 }
 assert.ok(jsx.includes('exam84101')&&jsx.includes('חשבתי')===false&&jsx.includes('נסיתי. מציגים פתרון'));
 assert.ok(main.includes("course/84101/practice")&&main.includes('<ExamPractice/>'));
});

test('every exam answer independently recomputes',()=>{
 const Rl=0.08206,R=8.314;
 // E1: combustion of 3.00 g C,H,O giving 0.150 mol CO2 and 0.200 mol H2O
 const mO=3-0.150*12.011-0.400*1.008;
 assert.ok(Math.abs(mO/15.999-0.0497)<0.001,'E1 oxygen moles');
 assert.ok(Math.abs(2.677*22.414-60.0)<0.1,'E1 molar mass');
 assert.ok(Math.abs(0.05*4.5*22.414-5.04)<0.01,'E1 oxygen volume');
 const p150=0.35*Rl*423.15/8,p25=0.150*Rl*298.15/8+23.76/760;
 const e1=exam84101[0];
 assert.ok(e1.parts[3].solution.join(' ').includes(p150.toFixed(2)),'E1 hot pressure');
 assert.ok(e1.parts[4].solution.join(' ').includes(p25.toFixed(3)),'E1 cold pressure');
 assert.ok(e1.parts[4].solution[0].includes('23.76'),'E1 condensation check cites saturation pressure');
 // E2: CO2 5.00 L, 27C, 0.60 atm, d=340 pm
 const n=0.6*5/(Rl*300.15);
 const lam=R*300.15/(Math.SQRT2*Math.PI*(340e-12)**2*6.022e23*0.6*101325);
 const vavg=Math.sqrt(8*R*300.15/(Math.PI*0.04401));
 const q=n*2.5*R*100;
 const e2=exam84101[1].parts.map(p=>p.solution.join(' ')).join(' ');
 for(const v of [n.toFixed(3),(n*44.01/5).toFixed(2),'337','380','412',(lam*1e9).toFixed(0),'2.9×10⁹',q.toFixed(0),(q/4.184).toFixed(1)])assert.ok(e2.includes(v),'E2 value '+v);
 // E3: benzene/toluene three evaporation-condensation cycles
 let x=(5/78.11)/(5/78.11+5/92.14);const Pb=95.1,Pt=28.4;const ys=[];
 for(let i=0;i<3;i++){const P=x*Pb+(1-x)*Pt;const y=x*Pb/P;ys.push(y);x=y}
 const e3=exam84101[2].parts.map(p=>p.solution.join(' ')).join(' ');
 for(const y of ys)assert.ok(e3.includes(y.toFixed(3)),'E3 y='+y.toFixed(3));
 // E4: FeCl3 colligative properties
 const nFe=3/162.2,dtf=4*1.86*nFe/0.05,C=nFe/0.0505,osm=4*C*Rl*298.15;
 const xw=(50/18.015)/(50/18.015+4*nFe);
 const e4=exam84101[3].parts.map(p=>p.solution.join(' ')).join(' ');
 for(const v of [dtf.toFixed(2),C.toFixed(3),osm.toFixed(1),xw.toFixed(3),(xw*23.76).toFixed(1)])assert.ok(e4.includes(v),'E4 value '+v);
 // E5: nuclear mass defect from AME2020 masses
 const dm=7.01600343+1.00782503-2*4.00260325;
 const e5=exam84101[4].parts.map(p=>p.solution.join(' ')).join(' ');
 assert.ok(Math.abs(dm*931.5-17.35)<0.01,'E5 MeV');
 assert.ok(e5.includes('17.3')&&e5.includes('1.67×10⁹'),'E5 energy values');
 assert.ok(e5.includes('96.9109'),'E5 cites AME2020 97Zr mass');
 assert.ok(e5.includes('⁹⁶Zr'),'E5 explains the mislabeled isotope');
 // E6: dew point of benzene/toluene vapor y_B=0.600 compressed at 25C
 const pDew=1/(0.6/95.1+0.4/28.4);
 const e6=exam84101[5].parts.map(p=>p.solution.join(' ')).join(' ');
 assert.ok(Math.abs(pDew-49.0)<0.1,'E6 dew pressure');
 for(const v of ['49.0','0.309','0.691','0.474','0.751','45.5%'])assert.ok(e6.includes(v),'E6 value '+v);
 const xB6=(60-28.4)/(95.1-28.4),yB6=xB6*95.1/60,beta=(0.6-xB6)/(yB6-xB6);
 assert.ok(Math.abs(xB6-0.474)<0.001&&Math.abs(yB6-0.751)<0.001&&Math.abs(beta-0.455)<0.001,'E6 two-phase state');
 // E7: reverse Raoult solve and non-ideality judgment
 const e7=exam84101[6].parts.map(p=>p.solution.join(' ')).join(' ');
 assert.ok(Math.abs((460+2*220)/3-300)<1e-9&&Math.abs((460+220)/2-340)<1e-9,'E7 solve checks');
 assert.ok(Math.abs(0.5*460/340-0.676)<0.001,'E7 vapor composition');
 assert.ok(Math.abs(0.4*127+0.6*23.76-65.1)<0.1,'E7 Raoult prediction');
 for(const v of ['460','220','0.676','65.1','74.0'])assert.ok(e7.includes(v),'E7 value '+v);
 // E8: measured Cv and conditional inference
 const e8=exam84101[7].parts.map(p=>p.solution.join(' ')).join(' ');
 assert.ok(Math.abs(520/(0.5*50)-20.8)<0.05,'E8 Cv');
 assert.ok(Math.abs(0.5*1.5*8.314*50-312)<1,'E8 monoatomic comparison');
 for(const v of ['20.8','5R/2','312 J'])assert.ok(e8.includes(v),'E8 value '+v);
 assert.ok(e8.includes('מותנית'),'E8 states the inference is conditional');
});

test('exam solutions never copy the raw example set wording',()=>{
 // The PDF questions stay private; exam problems are derived scenarios only.
 const pdf=readFileSync(new URL('../src/exam-84101.js',import.meta.url),'utf8');
 assert.ok(!pdf.includes('file-c'),'no source file references');
 for(const p of exam84101)assert.ok(!p.given.includes('95.908286'),'mislabeled mass appears only inside the E5ד discussion');
});
