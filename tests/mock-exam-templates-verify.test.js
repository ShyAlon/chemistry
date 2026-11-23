// Independent arithmetic verification for the mock-exam templates.
// Every formula below is written here from the physics (ideal gas, vdW, Raoult,
// Clausius-Clapeyron, kinetic theory, colligatives, nuclear), NOT imported from
// the generators. Each template exposes its raw sampled parameters as __meta;
// the test recomputes every numeric answer from those parameters and compares.
// This catches wrong formulas even when generator and test seeds match.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {templates84101} from '../src/mock-exam/templates-84101.js';
import {rng} from '../src/mock-exam/rng.js';

const R_ATM=0.08206,R_J=8.314,NA=6.022e23;
const vdW=(n,T,V,a,b)=>R_ATM*n*T/(V-n*b)-a*n*n/(V*V);
// Reference van der Waals constants (L, atm), independent of the generator table.
const VDW={
 'CO₂':{M:44.01,a:3.592,b:0.04267},
 'N₂':{M:28.02,a:1.370,b:0.0387},
 'CH₄':{M:16.04,a:2.253,b:0.04278},
 'He':{M:4.00,a:0.0341,b:0.0237},
 'NH₃':{M:17.03,a:4.170,b:0.0371},
};
const byId=id=>templates84101.find(t=>t.id===id);
const parts=v=>Object.fromEntries(v.parts.map(p=>[p.label,p]));
const gen=(id,seed)=>byId(id).generate(rng(`verify:${seed}:${id}`));
const SEEDS=['v1','v2','v3'];
function close(actual,expected,rel=1e-9,msg=''){
 assert.ok(Number.isFinite(actual),`${msg}: not finite (${actual})`);
 assert.ok(Math.abs(actual-expected)<=rel*Math.max(1,Math.abs(expected)),
  `${msg}: ${actual} vs ${expected}`);
}
// Every template: shape invariants over many seeds (all parts present, finite,
// concept parts carry a model answer, numeric answers finite).
test('all 23 templates: shape invariants over 300 seeds each',()=>{
 for(const t of templates84101){
  for(let s=0;s<300;s++){
   const v=t.generate(rng('smoke:'+s+':'+t.id));
   assert.ok(typeof v.given==='string'&&v.given.length>10,t.id);
   assert.ok(v.parts.length>=2,t.id);
   for(const p of v.parts){
    if(p.kind==='numeric')assert.ok(Number.isFinite(p.answer),`${t.id} ${p.label}`);
    else assert.ok(typeof p.modelAnswer==='string'&&p.modelAnswer.length>20,`${t.id} ${p.label}`);
   }
  }
 }
});

test('RG1: vdW pressure and Z from meta',()=>{
 for(const s of SEEDS){
  const v=gen('RG1',s),m=v.__meta,p=parts(v);
  assert.equal(m.a,VDW[m.gas].a);assert.equal(m.b,VDW[m.gas].b);
  close(p['א'].answer,vdW(m.n,m.T,1,m.a,m.b),1e-12,'RG1 P');
  close(p['ב'].answer,p['א'].answer/(m.n*R_ATM*m.T),1e-12,'RG1 Z');
 }
});

test('RG2: ideal He pressure and vdW heavy-gas pressure',()=>{
 for(const s of SEEDS){
  const v=gen('RG2',s),m=v.__meta,p=parts(v);
  const g=VDW[m.heavy];
  close(p['א'].answer,(m.m/4.00)*R_ATM*m.T/m.V,1e-12,'RG2 pIdL');
  close(p['ב'].answer,vdW(m.m/g.M,m.T,m.V,g.a,g.b),1e-12,'RG2 pVdH');
  assert.ok(p['א'].answer>p['ב'].answer,'RG2: He moles dominate');
 }
});

test('RG3: recovered a,b match the constants and solve the 2x2 system',()=>{
 for(const s of SEEDS){
  const v=gen('RG3',s),m=v.__meta,p=parts(v);
  const g=VDW[m.gas];
  assert.equal(p['א'].answer,g.b);assert.equal(p['ב'].answer,g.a);
  // Independent recovery: eliminate a, bisect b in (0, 0.2) using my own vdW.
  const P1=vdW(m.n,m.T,m.V1,g.a,g.b),P2=vdW(m.n,m.T,m.V2,g.a,g.b);
  const aOf=b=>(R_ATM*m.n*m.T/(m.V1-m.n*b)-P1)*m.V1*m.V1/(m.n*m.n);
  const f=b=>R_ATM*m.n*m.T/(m.V2-m.n*b)-aOf(b)*m.n*m.n/(m.V2*m.V2)-P2;
  let lo=1e-6,hi=0.19;
  assert.ok(f(lo)*f(hi)<0,'RG3: bracket');
  for(let i=0;i<200;i++){const mid=(lo+hi)/2;if(f(lo)*f(mid)<=0)hi=mid;else lo=mid;}
  close((lo+hi)/2,p['א'].answer,1e-6,'RG3 b recovered');
 }
});

test('KT1: moles, three speeds, mean free path, collision rate',()=>{
 for(const s of SEEDS){
  const v=gen('KT1',s),m=v.__meta,p=parts(v);
  const Mkg=m.M/1000;
  close(p['א'].answer,m.P*m.V/(R_ATM*m.T),1e-12,'KT1 n');
  const speeds={vmp:Math.sqrt(2*R_J*m.T/Mkg),vavg:Math.sqrt(8*R_J*m.T/(Math.PI*Mkg)),
   urms:Math.sqrt(3*R_J*m.T/Mkg)};
  close(p['ב'].answer,speeds[m.sKey],1e-12,'KT1 speed');
  assert.ok(speeds.vmp<speeds.vavg&&speeds.vavg<speeds.urms,'KT1 order');
  const lambda=R_J*m.T/(Math.SQRT2*Math.PI*m.d*m.d*NA*(m.P*101325));
  close(p['ג'].answer,lambda*1e9,1e-12,'KT1 lambda');
  close(p['ד'].answer,speeds.vavg/lambda,1e-12,'KT1 z');
 }
});

test('KT2: Graham ratio and effusion time scale with sqrt(M)',()=>{
 for(const s of SEEDS){
  const v=gen('KT2',s),m=v.__meta,p=parts(v);
  close(p['א'].answer,Math.sqrt(m.Mb/m.Ma),1e-12,'KT2 ratio');
  close(p['ב'].answer,m.tA*Math.sqrt(m.Mb/m.Ma),1e-12,'KT2 tB');
  // Heavier gas must take LONGER for the same amount through the same hole.
  assert.equal(p['ב'].answer>m.tA,m.Mb>m.Ma,'KT2 monotonicity');
 }
});

test('KT3: most probable speed and MB population ratio',()=>{
 for(const s of SEEDS){
  const v=gen('KT3',s),m=v.__meta,p=parts(v);
  const Mkg=m.M/1000;
  close(p['א'].answer,Math.sqrt(2*R_J*m.T/Mkg),1e-12,'KT3 vmp');
  const f=x=>x*x*Math.exp(-Mkg*x*x/(2*R_J*m.T));
  close(p['ב'].answer,f(m.v1)/f(m.v2),1e-12,'KT3 ratio');
 }
});

test('IG1: Dalton subtraction and dry-gas moles',()=>{
 for(const s of SEEDS){
  const v=gen('IG1',s),m=v.__meta,p=parts(v);
  close(p['א'].answer,m.pTotmm-m.pH2Omm,1e-12,'IG1 pDry');
  close(p['ב'].answer,((m.pTotmm-m.pH2Omm)/760)*(m.Vml/1000)/(R_ATM*m.T),1e-12,'IG1 n');
 }
});

test('CC1: recover Hvap, then extrapolate vapour pressure',()=>{
 for(const s of SEEDS){
  const v=gen('CC1',s),m=v.__meta,p=parts(v);
  const P2=m.P1*Math.exp((-m.Hvap/R_J)*(1/m.T2-1/m.T1));
  const Hback=-R_J*Math.log(P2/m.P1)/(1/m.T2-1/m.T1);
  close(p['א'].answer,Hback/1000,1e-9,'CC1 Hvap kJ');
  close(p['א'].answer,m.Hvap/1000,1e-9,'CC1 Hvap vs meta');
  close(p['ב'].answer,m.P1*Math.exp((-m.Hvap/R_J)*(1/(m.T2+10)-1/m.T1)),1e-12,'CC1 P(T2+10)');
  assert.ok(p['ב'].answer>P2,'CC1: P grows with T');
 }
});

test('CL1: freezing point and osmotic pressure with stated i',()=>{
 for(const s of SEEDS){
  const v=gen('CL1',s),m=v.__meta,p=parts(v);
  const n=m.grams/m.M,molal=n/(m.water/1000);
  close(p['א'].answer,m.i*1.86*molal,1e-12,'CL1 dTf');
  close(p['ב'].answer,m.i*(n/((m.water+m.grams)/1000))*R_ATM*298,1e-12,'CL1 osm');
 }
});

test('CL2: i and alpha recovered from a rounded measurement',()=>{
 for(const s of SEEDS){
  const v=gen('CL2',s),m=v.__meta,p=parts(v);
  const ieff=1+(m.nu-1)*m.alpha;
  const dTfR=Math.round(ieff*1.86*m.molal*100)/100;
  const iBack=dTfR/(1.86*m.molal);
  close(p['א'].answer,iBack,1e-12,'CL2 i');
  close(p['ב'].answer,(iBack-1)/(m.nu-1),1e-12,'CL2 alpha');
  close(p['ב'].answer,m.alpha,0.12,'CL2 alpha within rounding');
  assert.ok(Math.abs(iBack-ieff)<0.1,'CL2: rounding noise bounded');
 }
});

test('NC1: balance completion, mass defect, energy per reaction and per mole',()=>{
 for(const s of SEEDS){
  const v=gen('NC1',s),m=v.__meta,p=parts(v);
  const sum=a=>a.reduce((x,y)=>x+y,0);
  const dm=sum(m.react)-sum(m.prod);
  // Full E5 method: completion (concept) then dm, MeV, kJ/mol.
  assert.equal(p['א'].kind,'concept');
  assert.ok(p['א'].modelAnswer.includes(m.missing),'NC1 completion names the particle');
  assert.ok(p['א'].modelAnswer.includes('מאזן מטען'),'NC1 completion shows charge balance');
  close(p['ב'].answer,dm,1e-12,'NC1 dm');
  close(p['ג'].answer,dm*931.5,1e-12,'NC1 E MeV');
  close(p['ד'].answer,dm*931.5*96.485e6,1e-12,'NC1 E kJ/mol');
  assert.ok(dm>0,'NC1: listed reactions release energy');
 }
});

test('NC2: isotope fractions from the weighted average',()=>{
 for(const s of SEEDS){
  const v=gen('NC2',s),m=v.__meta,p=parts(v);
  const x1=(m.avg-m.m2)/(m.m1-m.m2);
  close(p['א'].answer,x1,1e-12,'NC2 x1');
  close(p['ב'].answer,100*(1-x1),1e-12,'NC2 pct');
  assert.ok(x1>0&&x1<1,'NC2 fraction in range');
  close(x1*m.m1+(1-x1)*m.m2,m.avg,1e-12,'NC2 average recovered');
 }
});

test('ST1: combustion masses, empirical formula, O2 volume',()=>{
 for(const s of SEEDS){
  const v=gen('ST1',s),m=v.__meta,p=parts(v);
  const mC=m.nCO2*12.011,mH=2*m.nH2O*1.008,mO=m.grams-mC-mH;
  close(p['א'].answer,mO,1e-12,'ST1 mO');
  assert.ok(mO>0,'ST1: oxygen mass positive');
  close(p['ג'].answer,(m.grams/m.M)*m.o2*22.414,1e-12,'ST1 VO2');
  // Empirical ratio must be near-integer (generator rounds moles to 3 dp).
  const ns=[m.nCO2,2*m.nH2O,mO/15.999],mn=Math.min(...ns);
  for(const x of ns)close(x/mn,Math.round(x/mn),0.06,'ST1 integer ratio');
 }
});

test('DS1: Raoult distillation enrichment across two cycles',()=>{
 for(const s of SEEDS){
  const v=gen('DS1',s),m=v.__meta,p=parts(v);
  const nA=m.mA/m.Ma,nB=m.mB/m.Mb,xA=nA/(nA+nB);
  const P1=xA*m.Pa+(1-xA)*m.Pb,y1=xA*m.Pa/P1;
  const P2=y1*m.Pa+(1-y1)*m.Pb,y2=y1*m.Pa/P2;
  close(p['א'].answer,P1,1e-12,'DS1 P1');
  close(p['ב'].answer,y1,1e-12,'DS1 y1');
  close(p['ג'].answer,y2,1e-12,'DS1 y2');
  assert.ok(y1>xA&&y2>y1,'DS1: monotonic enrichment');
 }
});

test('DS2: dew point and first-drop composition',()=>{
 for(const s of SEEDS){
  const v=gen('DS2',s),m=v.__meta,p=parts(v);
  const Pdew=1/(m.yA/m.Pa+(1-m.yA)/m.Pb);
  close(p['א'].answer,Pdew,1e-12,'DS2 Pdew');
  close(p['ב'].answer,Pdew*m.yA/m.Pa,1e-12,'DS2 xA');
  assert.ok(p['ב'].answer<m.yA,'DS2: first drop lean in volatile');
 }
});

test('RA1: 2x2 Raoult solve recovers saturation pressures within rounding',()=>{
 for(const s of SEEDS){
  const v=gen('RA1',s),m=v.__meta,p=parts(v);
  const N1=m.nA1+m.nB1,P1=(m.nA1/N1)*m.PA+(m.nB1/N1)*m.PB;
  const N2=N1+m.addA,P2=((m.nA1+m.addA)/N2)*m.PA+(m.nB1/N2)*m.PB;
  const P1r=Math.round(P1*10)/10,P2r=Math.round(P2*10)/10;
  const xa1=m.nA1/N1,xb1=m.nB1/N1,xa2=(m.nA1+m.addA)/N2,xb2=m.nB1/N2;
  const det=xa1*xb2-xa2*xb1;
  assert.ok(Math.abs(det)>1e-3,'RA1: system well conditioned');
  const PAs=(P1r*xb2-P2r*xb1)/det,PBs=(xa1*P2r-xa2*P1r)/det;
  close(p['א'].answer,PAs,1e-12,'RA1 PAs');
  close(p['ב'].answer,PBs,1e-12,'RA1 PBs');
  close(PAs,m.PA,0.02,'RA1 PAs vs true');
  close(PBs,m.PB,0.05,'RA1 PBs vs true');
  close(p['ג'].answer,xa2*PAs/P2r,1e-12,'RA1 y2');
  assert.ok(p['ג'].answer>0&&p['ג'].answer<1,'RA1 y in range');
 }
});

test('HC1: heat capacity back-out and monatomic comparison',()=>{
 for(const s of SEEDS){
  const v=gen('HC1',s),m=v.__meta,p=parts(v);
  close(p['א'].answer,m.q/(m.n*m.dT),1e-12,'HC1 cv');
  close(p['א'].answer,m.cv,2e-3,'HC1 cv vs kind');
  close(p['ב'].answer,m.n*1.5*R_J*m.dT,1e-12,'HC1 qMono');
 }
});

test('RG4: extent of reaction, separated CO2, vdW after compression',()=>{
 for(const s of SEEDS){
  const v=gen('RG4',s),m=v.__meta,p=parts(v);
  const nEnd=m.Pr*m.V/(R_ATM*m.T);
  const xi=m.nCO+m.nO2-nEnd;
  assert.ok(xi>0,'RG4: reaction advanced');
  assert.ok(2*xi<=m.nCO*1.001&&xi<=m.nO2*1.001,'RG4: within limiting reagent');
  close(p['א'].answer,100*2*xi/m.nCO,1e-9,'RG4 pct');
  assert.ok(p['א'].answer>0&&p['א'].answer<=100.5,'RG4 pct range');
  close(p['ב'].answer,2*xi,1e-12,'RG4 nCO2');
  close(p['ג'].answer,vdW(2*xi,m.T2,m.V2,VDW['CO₂'].a,VDW['CO₂'].b),1e-12,'RG4 P2');
  assert.ok(p['ג'].answer>0,'RG4 P2 positive');
 }
});

test('RG5: Boyle temperature and Z at finite density',()=>{
 for(const s of SEEDS){
  const v=gen('RG5',s),m=v.__meta,p=parts(v);
  const TB=m.a/(R_ATM*m.b);
  close(p['א'].answer,TB,1e-12,'RG5 TB');
  close(p['ב'].answer,1/(1-m.b*m.rho)-m.a*m.rho/(R_ATM*TB),1e-12,'RG5 Z');
  assert.ok(m.b*m.rho<1,'RG5: below close packing');
 }
});

test('CR1: cell edges, density, sample volume',()=>{
 for(const s of SEEDS){
  const v=gen('CR1',s),m=v.__meta,p=parts(v);
  const aBCC=4*m.r/Math.sqrt(3),aFCC=4*m.r/Math.sqrt(2);
  close(p['א'].answer,aBCC,1e-12,'CR1 aBCC');
  close(p['ב'].answer,aFCC,1e-12,'CR1 aFCC');
  const a=m.z===2?aBCC:aFCC;
  const rho=m.z*m.M/(NA*a*a*a*1e-30);          // a in pm → a³·1e-30 cm³
  assert.ok(rho>0.5&&rho<25,'CR1: density physical');
  close(p['ד'].answer,m.mass/rho,1e-6,'CR1 V');
 }
});

test('PH1: Clausius-Clapeyron pressure and phase sides',()=>{
 for(const s of SEEDS){
  const v=gen('PH1',s),m=v.__meta,p=parts(v);
  const P2=m.P1*Math.exp((-m.Hvap/R_J)*(1/m.T2-m.T1===0?0:1/m.T2-1/m.T1));
  close(p['א'].answer,P2,1e-12,'PH1 P2');
  assert.ok(m.PextLow<P2,'PH1: low side below saturation');
  assert.ok(m.PextHigh>P2,'PH1: high side above saturation');
 }
});

test('MX1: combined particles for freezing point and vapour pressure',()=>{
 for(const s of SEEDS){
  const v=gen('MX1',s),m=v.__meta,p=parts(v);
  const particles=m.i*m.nSalt+m.nSugar;
  close(p['א'].answer,1.86*particles/(m.water/1000),1e-12,'MX1 dTf');
  const nW=m.water/18.015,xw=nW/(nW+particles);
  close(p['ב'].answer,xw*m.P0,1e-12,'MX1 P');
  assert.ok(p['ב'].answer<m.P0,'MX1: vapour pressure lowered');
 }
});

test('MX2: stepwise i, alpha, charge balance, osmosis',()=>{
 for(const s of SEEDS){
  const v=gen('MX2',s),m=v.__meta,p=parts(v);
  const i=2+m.alpha,molal=m.n0/(m.water/1000);
  const dTf=Math.round(i*1.86*molal*1e4)/1e4;
  const iBack=dTf/(1.86*molal);
  close(p['א'].answer,iBack-2,1e-9,'MX2 alpha');
  close(p['א'].answer,m.alpha,1e-2,'MX2 alpha within rounding');
  const V=(m.water+20)/1000;
  close(p['ג'].answer,iBack*(m.n0/V)*R_ATM*300,1e-12,'MX2 osm');
  // Charge balance at the recovered alpha.
  const a=p['א'].answer;
  close(m.n0*(1+a)/V,m.n0*(1-a)/V+2*m.n0*a/V,1e-12,'MX2 charge balance');
 }
});
