import {bidiElement} from './bidi-react.js';
import React from 'react';
import {C,T,L,Arrow,Axis,Curve,Dot,Box,Fig} from './figures-core.jsx';

// P1: ladder of length units as powers of ten.
export function UnitLadder({accent}){
  const steps=[['km','10³'],['m','10⁰'],['mm','10⁻³'],['µm','10⁻⁶'],['nm','10⁻⁹'],['pm','10⁻¹²']];
  return <Fig viewBox="0 0 560 290" label="סולם יחידות אורך מקילומטר עד פיקומטר בחזקות של עשר">
    {steps.map(([u,p],i)=>{const x=60+i*88;return <g key={u}>
      <Dot cx={x} cy={160} r={6} fill={i===0||i===5?accent:'#0a1322'} stroke={accent}/>
      <T x={x} y={140} fill={C.ink} weight="bold" ltr>{u}</T>
      <T x={x} y={190} ltr>{p}</T>
      {i<steps.length-1&&<Arrow x1={x+12} y1={160} x2={x+76} y2={160} stroke={C.dim} id={'l'+i}/>}
    </g>})}
    <T x={280} y={245}>כל שלב למטה מחלק באלף; כל שלם למעלה מכפיל באלף</T>
    <T x={280} y={270} ltr size={12}>1 nm = 10 Å , 1 Å = 10⁻¹⁰ m = 100 pm</T>
  </Fig>;
}

// P2: the electromagnetic spectrum on a logarithmic wavelength axis.
export function EmSpectrum({accent}){
  const bands=[['רנטגן / γ',0],['UV',1],['נראה',2],['IR',3],['מיקרו',4],['רדיו',5]];
  const x=w=>60+(Math.log10(w)+12)/(16)*440; // 1e-12 .. 1e4 m
  const edges=[1e-12,1e-9,3.8e-7,7.5e-7,1e-3,1e-1,1e4];
  return <Fig label="הספקטרום האלקטרומגנטי מקרני גמא עד גלי רדיו, עם רצועת הנראה מודגשת">
    {bands.map(([b,i])=>{
      const x1=x(edges[i]),x2=x(edges[i+1]);
      const vis=i===2;
      return <g key={b}>
        <rect x={x1} y={120} width={x2-x1} height={34} fill={vis?'url(#visgrad)':C.faint} stroke={C.soft}/>
        <T x={(x1+x2)/2} y={vis?178:142} size={12} fill={vis?C.ink:C.mut} dy={vis?0:2}>{b}</T>
      </g>;})}
    <defs><linearGradient id="visgrad" x1="0" x2="1"><stop offset="0" stopColor="#7b5cff"/><stop offset=".35" stopColor="#3f9fe8"/><stop offset=".6" stopColor="#4ed97a"/><stop offset=".8" stopColor="#f2d049"/><stop offset="1" stopColor="#e0492f"/></linearGradient></defs>
    <L x1={x(4e-7)} y1={154} x2={x(4e-7)} y2={162} stroke={C.dim}/>
    <L x1={x(7e-7)} y1={154} x2={x(7e-7)} y2={162} stroke={C.dim}/>
    <T x={x(5.5e-7)} y={200} size={12} ltr>400-700 nm</T>
    <Arrow x1={x(6.56e-7)} y1={105} x2={x(6.56e-7)} y2={118} stroke={accent} id="ha"/>
    <T x={x(6.56e-7)} y={96} size={12} fill={accent} ltr>656 nm (Hα)</T>
    <Arrow x1={x(1e4)} y1={70} x2={x(1e-12)} y2={70} stroke={C.dim} id="wl"/>
    <T x={280} y={58} ltr>אורך גל λ גדל →</T>
    <Arrow x1={x(1e-12)} y1={250} x2={x(1e4)} y2={250} stroke={C.dim} id="en"/>
    <T x={280} y={270} ltr>← אנרגיית הפוטון E = hc/λ גדלה</T>
  </Fig>;
}

// P2: photoelectric effect energy budget.
export function Photoelectric({accent}){
  return <Fig label="האפקט הפוטואלקטרי: פוטון פוגע במתכת ופולט אלקטרון; האנרגיה מתחלקת לפונקציית עבודה ואנרגיה קינטית">
    <Box x={70} y={190} w={180} h={60} fill={C.faint}/>
    <T x={160} y={225}>משטח מתכת</T>
    <Arrow x1={90} y1={90} x2={150} y2={170} stroke={accent} id="ph"/>
    <T x={80} y={76} fill={accent} ltr>hν</T>
    <T x={80} y={60} size={12}>פוטון נכנס</T>
    <Arrow x1={190} y1={170} x2={250} y2={80} stroke="#f2d049" id="el"/>
    <T x={268} y={76} fill="#f2d049" ltr>e⁻</T>
    <T x={268} y={60} size={12}>אלקטרון נפלט</T>
    <g>
      <Box x={330} y={70} w={46} h={160} fill="none"/>
      <rect x={330} y={130} width={46} height={100} fill={accent} opacity=".28"/>
      <rect x={330} y={70} width={46} height={60} fill="#f2d049" opacity=".3"/>
      <T x={392} y={104} ltr size={12}>Eₖ = hν − φ</T>
      <T x={392} y={184} ltr size={12}>φ (פונקציית עבודה)</T>
      <L x1={330} y1={130} x2={392} y2={130} stroke={C.ink} dash="3 3"/>
      <T x={353} y={58} size={12} ltr>hν</T>
    </g>
    <T x={280} y={285}>אם hν קטן מ-φ לא יפלט אלקטרון בכלל, גם בעוצמה חזקה</T>
  </Fig>;
}

// P3: Bohr energy levels with the three transition series.
export function BohrLevels({accent}){
  // Explicit heights keep the real crowding toward ionization without label collisions.
  const ys={'-13.6':245,'-3.4':150,'-1.51':105,'-0.85':80,'-0.54':62,'0':42};
  const y=e=>ys[String(e)];
  const levels=[[1,-13.6],[2,-3.40],[3,-1.51],[4,-0.85],[5,-0.54]];
  return <Fig label="רמות האנרגיה של אטום המימן לפי בוהר וסדרות המעברים ליימן, בלמר ופאשנ">
    {levels.map(([n,e])=><g key={n}>
      <L x1={80} y1={y(e)} x2={330} y2={y(e)} stroke={C.line} w={n===1?2.5:1.5}/>
      <T x={66} y={y(e)+4} anchor="end" ltr>n={n}</T>
      <T x={344} y={y(e)+4} anchor="start" ltr size={12}>{e.toFixed(2)} eV</T>
    </g>)}
    <L x1={80} y1={y(0)} x2={330} y2={y(0)} stroke={C.dim} dash="4 4"/>
    <T x={344} y={y(0)+4} anchor="start" ltr size={12}>0 (יינון)</T>
    {/* Lyman: down to n=1 */}
    <Arrow x1={130} y1={y(-3.40)-3} x2={130} y2={y(-13.6)+3} stroke={accent} id="ly"/>
    {/* Balmer */}
    <Arrow x1={190} y1={y(-1.51)-3} x2={190} y2={y(-3.40)+3} stroke="#4ed97a" id="ba"/>
    <Arrow x1={215} y1={y(-0.85)-3} x2={215} y2={y(-3.40)+3} stroke="#4ed97a" id="ba2" dash="3 2"/>
    {/* Paschen */}
    <Arrow x1={285} y1={y(-0.85)-3} x2={285} y2={y(-1.51)+3} stroke="#f2d049" id="pa"/>
    <T x={130} y={292} fill={accent} size={12} ltr>Lyman (UV)</T>
    <T x={202} y={292} fill="#4ed97a" size={12} ltr>Balmer (נראה)</T>
    <T x={320} y={292} fill="#f2d049" size={12} ltr>Paschen (IR)</T>
    <T x={430} y={192} ltr size={12}>E = −13.6/n² eV</T>
    <T x={430} y={210} size={12}>כל מעבר מטה = פוטון נפלט</T>
    <T x={430} y={228} size={12}>ΔE = hc/λ</T>
  </Fig>;
}

// P4: de Broglie standing wave around an orbit.
export function DeBroglie({accent}){
  const pts=[];const cx=140,cy=160,R=80,n=4;
  for(let a=0;a<=360;a+=3){const t=a*Math.PI/180;const r=R+9*Math.sin(n*t);pts.push(`${(cx+r*Math.cos(t)).toFixed(1)},${(cy+r*Math.sin(t)).toFixed(1)}`)}
  return <Fig label="ג הנייל של דה-ברויי: גל עומד שסובב את המסלול עם ארבעה אורכי גל שלמים">
    <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.soft} strokeDasharray="3 5"/>
    <polyline points={pts.join(' ')} fill="none" stroke={accent} strokeWidth="2"/>
    <Dot cx={cx} cy={cy} r={5} fill={accent}/>
    <T x={cx} y={292}>n=4: ההיקף = 4λ בדיוק — הגל נסגר על עצמו</T>
    <g>
      <polyline points={(()=>{const p=[];for(let a=0;a<=360;a+=4){const t=a*Math.PI/180;const r=60+8*Math.sin(4.5*t);p.push(`${(420+r*Math.cos(t)).toFixed(1)},${(160+r*Math.sin(t)).toFixed(1)}`)}return p.join(' ')})()} fill="none" stroke={C.warn} strokeWidth="1.6" opacity=".8"/>
      <L x1={375} y1={230} x2={465} y2={90} stroke={C.warn} w={2}/>
      <L x1={375} y1={90} x2={465} y2={230} stroke={C.warn} w={2}/>
      <T x={420} y={292}>4.5λ לא נסגר — מסלול אסור</T>
    </g>
    <T x={280} y={36} ltr size={12}>2πr = nλ , λ = h/mv</T>
  </Fig>;
}

// P4: uncertainty trade-off between position and momentum.
export function Uncertainty({accent}){
  return <Fig label="עקרון אי-הוודאות: צמצום אי-הוודאות במיקום מגדיל את אי-הוודאות בתנע">
    <T x={140} y={70}>חבילת גל צרה</T>
    <Curve d="M60,180 C90,178 100,100 140,100 C180,100 190,178 220,180" stroke={accent}/>
    <L x1={55} y1={180} x2={225} y2={180} stroke={C.dim}/>
    <T x={140} y={224} size={12}>Δx קטן</T>
    <T x={140} y={242} size={12}>Δp גדול</T>
    <T x={420} y={70}>חבילת גל רחבה</T>
    <Curve d="M320,180 C340,150 360,130 420,130 C480,130 500,150 520,180" stroke="#4ed97a"/>
    <L x1={315} y1={180} x2={525} y2={180} stroke={C.dim}/>
    <T x={420} y={224} size={12}>Δx גדול</T>
    <T x={420} y={242} size={12}>Δp קטן</T>
    <T x={280} y={285} ltr>Δx·Δp ≥ ħ/2</T>
  </Fig>;
}

// P5: the quantum-number tree for n=3.
export function QuantumTree({accent}){
  const y0=70;
  return <Fig label="עץ המספרים הקוונטיים עבור רמה n=3: תתי-קליפות, אורביטלים וספירה כוללת">
    <Box x={235} y={y0-22} w={90} h={30} fill={C.faint} stroke={accent}/>
    <T x={280} y={y0} ltr fill={C.ink} weight="bold">n = 3</T>
    {[['l = 0 (s)','mₗ = 0','1 אורביטל',100],['l = 1 (p)','mₗ = −1, 0, +1','3 אורביטלים',280],['l = 2 (d)','mₗ = −2..+2','5 אורביטלים',460]].map(([a,b,c,x],i)=>{
      return <g key={a}>
        <Arrow x1={280} y1={y0+10} x2={x} y2={y0+66} stroke={C.dim} id={'qt'+i}/>
        <Box x={x-70} y={y0+70} w={140} h={30} fill={C.faint}/>
        <T x={x} y={y0+90} ltr fill={C.ink}>{a}</T>
        <Arrow x1={x} y1={y0+102} x2={x} y2={y0+136} stroke={C.dim} id={'qm'+i}/>
        <Box x={x-80} y={y0+140} w={160} h={30} fill="none"/>
        <T x={x} y={y0+160} ltr>{b}</T>
        <T x={x} y={y0+196} fill={accent}>{c}</T>
      </g>;})}
    <T x={280} y={y0+236} ltr fill={C.ink}>סה״כ 9 = n² אורביטלים, עד 18 = 2n² אלקטרונים</T>
  </Fig>;
}

// P6: radial probability distribution curves with nodes.
export function RpdCurves({accent}){
  const X=r=>70+r*38, Y=p=>235-p*170;
  const mk=f=>{let m=0;for(let i=0;i<=110;i++)m=Math.max(m,f(i/10));let d='';for(let i=0;i<=110;i++){const r=i/10;const v=f(r)/m*0.95;d+=(i?'L':'M')+X(r).toFixed(1)+','+Y(Math.max(0,v)).toFixed(1)}return d};
  const r1s=r=>r*r*Math.exp(-r);                 // peaks ~2
  const r2s=r=>{const t=1-r/3.9;return r*r*t*t*Math.exp(-r/1.6)}; // node ~3.9
  const r2p=r=>r*r*r*r*Math.exp(-r/1.35);        // no radial node
  return <Fig label="התפלגות ההסתברות הרדיאלית של האורביטלים 1s, 2s ו-2p, עם סימון הנודה הרדיאלית של 2s">
    <Axis x1={70} y1={60} x2={490} y2={235} xLabel="r (מרחק מהגרעין)" yLabel="4πr²R²"/>
    <Curve d={mk(r1s)} stroke={accent}/>
    <Curve d={mk(r2s)} stroke="#4ed97a"/>
    <Curve d={mk(r2p)} stroke="#f2d049"/>
    <Dot cx={X(3.9)} cy={Y(0)} r={4} fill="#4ed97a"/>
    <T x={X(3.9)} y={Y(0)+20} size={12} fill="#4ed97a">נודה רדיאלית</T>
    <T x={X(1.6)} y={Y(0.98)-6} fill={accent} ltr size={12}>1s</T>
    <T x={X(8.2)} y={Y(0.62)} fill="#4ed97a" ltr size={12}>2s</T>
    <T x={X(5.0)} y={Y(0.98)-6} fill="#f2d049" ltr size={12}>2p</T>
    <T x={280} y={285}>בין הנודות הסתברות אפסית לחלוטין למצוא את האלקטרון</T>
  </Fig>;
}

// P7: Aufbau filling order as a serpentine over (n+l) diagonals.
export function Aufbau({accent}){
  const rows=[['1s'],['2s'],['2p','3s'],['3p','4s'],['3d','4p','5s']];
  const pos={};rows.forEach((r,ri)=>r.forEach((s,ci)=>{pos[s]=[90+ci*80,60+ri*44]}));
  const seq=rows.flat();
  return <Fig label="סדר האכלוס לפי כלל n+l: קוראים שורה אחר שורה, וכל שורה משמאל לימין">
    {rows.map((r,ri)=>r.map((s,ci)=>{const [x,y]=pos[s];return <g key={s}>
      <Box x={x-26} y={y-18} w={52} h={30} fill={C.faint} stroke={C.soft} rx={6}/>
      <T x={x} y={y+3} ltr size={13} fill={C.ink} weight="bold">{s}</T>
    </g>}))}
    {seq.slice(0,-1).map((s,i)=>{
      const [x1,y1]=pos[s],[x2,y2]=pos[seq[i+1]];
      const same=y1===y2;
      return <Arrow key={s} x1={same?x1+28:x1} y1={same?y1:y1+20} x2={same?x2-28:x2} y2={same?y2:y2-20} stroke={accent} id={'ab'+i} w={1.4}/>;
    })}
    <T x={430} y={80} size={12}>כלל האצבע:</T>
    <T x={430} y={102} ltr size={12} fill={C.ink}>n+l קטן קודם;</T>
    <T x={430} y={124} size={12}>בתיקו — n קטן קודם</T>
    <T x={430} y={168} ltr size={12}>4s (4+0) לפני 3d (3+2)</T>
    <T x={430} y={210} size={12}>חריגים ידועים:</T>
    <T x={430} y={230} ltr size={12} fill={accent}>Cr, Cu</T>
  </Fig>;
}

// P7: Hund's rule orbital boxes for C, N, O (2p subshell).
export function HundBoxes({accent}){
  const atom=(x0,label,electrons)=>{
    const boxes=[0,1,2];
    return <g>
      {boxes.map(b=>{
        const x=x0+b*44;
        const els=electrons.filter(e=>e.box===b);
        return <g key={b}>
          <Box x={x} y={120} w={34} h={30} fill={C.faint} rx={2}/>
          {els.map((e,i)=><Arrow key={i} x1={x+10+i*14} y1={e.up?140:128} x2={x+10+i*14} y2={e.up?126:142} stroke={accent} id={`h${x0}${b}${i}`}/>)}
        </g>;})}
      <T x={x0+49} y={178} ltr fill={C.ink} weight="bold">{label}</T>
    </g>;
  };
  return <Fig label="כלל הונד: אלקטרונים ממלאים קודם אורביטלים נפרדים עם ספין מקביל">
    <T x={200} y={80}>תת-קליפת 2p</T>
    {atom(60,'C (2p²)',[{box:0,up:true},{box:1,up:true}])}
    {atom(230,'N (2p³)',[{box:0,up:true},{box:1,up:true},{box:2,up:true}])}
    {atom(400,'O (2p⁴)',[{box:0,up:true},{box:1,up:true},{box:2,up:true},{box:0,up:false}])}
    <T x={280} y={230}>רק כשכל אורביטל מאוכלס ביחיד — מתחילים לזווג עם ספין הפוך</T>
    <T x={280} y={258} size={12}>זיווג עולה אנרגיה (דחייה), ולכן האכלוס הזול הוא הפרדה מקסימלית</T>
  </Fig>;
}

// P8: shielding and effective nuclear charge.
export function Shielding({accent}){
  return <Fig label="מיסוך: אלקטרוני הליבה מסננים את משיכת הגרעין מאלקטרון הערכיות">
    <Dot cx={180} cy={150} r={16} fill={accent}/>
    <T x={180} y={155} ltr fill="#08131c" weight="bold" size={12}>+Z</T>
    <circle cx={180} cy={150} r={52} fill="#4ed97a" opacity=".18" stroke="#4ed97a" strokeDasharray="4 4"/>
    {[30,150,270].map(a=>{const t=a*Math.PI/180;return <Dot key={a} cx={180+52*Math.cos(t)} cy={150+52*Math.sin(t)} r={5} fill="#4ed97a"/>})}
    <T x={180} y={228} fill="#4ed97a" size={12}>אלקטרוני ליבה (מסכים)</T>
    <circle cx={180} cy={150} r={105} fill="none" stroke={C.soft} strokeDasharray="3 6"/>
    <Dot cx={180+105*Math.cos(-0.6)} cy={150+105*Math.sin(-0.6)} r={6} fill={accent}/>
    <T x={180+105*Math.cos(-0.6)} y={150+105*Math.sin(-0.6)-14} size={12} fill={accent}>אלקטרון ערכיות</T>
    <Arrow x1={196} y1={150} x2={272} y2={117} stroke={C.warn} id="pull" dash="6 4"/>
    <T x={410} y={120} ltr fill={C.ink} size={14}>Z_eff = Z − S</T>
    <T x={410} y={145} size={12}>S ≈ מספר אלקטרוני הליבה</T>
    <T x={410} y={170} size={12}>אלקטרון הערכיות "מרגיש"</T>
    <T x={410} y={190} size={12}>רק את המטען הלא ממוסך</T>
  </Fig>;
}

// P9: first ionization energy across Z=1..20.
export function IeTrend({accent}){
  const vals=[[1,13.6],[2,24.6],[3,5.39],[4,9.32],[5,8.30],[6,11.26],[7,14.53],[8,13.62],[9,17.42],[10,21.56],[11,5.14],[12,7.65],[13,5.99],[14,8.15],[15,10.49],[16,10.36],[17,12.97],[18,15.76],[19,4.34],[20,6.11]];
  const names=['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca'];
  const X=z=>62+(z-1)*22.5, Y=e=>250-e*8.2;
  const path=vals.map(([z,e],i)=>(i?'L':'M')+X(z).toFixed(1)+','+Y(e).toFixed(1)).join(' ');
  return <Fig viewBox="0 0 560 330" label="אנרגיית יינון ראשונה לפי מספר אטומי; שיאים בגזים אצילים ובולטות ב-N וב-Be">
    <Axis x1={62} y1={45} x2={505} y2={250} xLabel="Z" yLabel="IE₁"/>
    <Curve d={path} stroke={accent} w={2}/>
    {vals.map(([z,e])=><Dot key={z} cx={X(z)} cy={Y(e)} r={2.6} fill={accent}/>)}
    {[2,10,18].map(z=><T key={z} x={X(z)} y={Y(vals[z-1][1])-10} fill={C.ink} ltr size={12} weight="bold">{names[z-1]}</T>)}
    <Dot cx={X(4)} cy={Y(9.32)} r={5} fill="none" stroke="#f2d049" w={2}/>
    <T x={X(4)} y={Y(9.32)-12} fill="#f2d049" ltr size={12}>Be>B</T>
    <Dot cx={X(7)} cy={Y(14.53)} r={5} fill="none" stroke="#f2d049" w={2}/>
    <T x={X(7)} y={Y(14.53)-12} fill="#f2d049" ltr size={12}>N>O</T>
    <T x={280} y={290}>חריגות: תת-קליפה מלאה (Be) וחצי-מלאה (N) יציבות במיוחד</T>
    <T x={280} y={312} ltr size={12}>עולה משמאל לימין (Z_eff) · קופצת מטה בתחילת שורה חדשה</T>
  </Fig>;
}

// P9: successive ionization energies of aluminium (jump after 3).
export function IeSuccessive({accent}){
  const vals=[[1,578],[2,1817],[3,2745],[4,11578]];
  const H=v=>Math.log10(v)*52-90;
  return <Fig label="אנרגיות היינון העוקבות של אלומיניום; קפיצה חדה אחרי שלושת אלקטרוני הערכיות">
    <Axis x1={80} y1={40} x2={460} y2={250} xLabel="מספר היינון" yLabel="kJ/mol"/>
    {vals.map(([n,v])=>{
      const x=110+(n-1)*100;
      return <g key={n}>
        <rect x={x} y={250-H(v)} width={46} height={H(v)} fill={n===4?C.warn:accent} opacity={n===4?.5:.75}/>
        <T x={x+23} y={266} ltr size={12}>IE{n}</T>
        <T x={x+23} y={242-H(v)} ltr size={12} fill={C.ink}>{v.toLocaleString('en')}</T>
      </g>;})}
    <T x={280} y={310}>הקפיצה ב-IE4 חושפת: לאלומיניום 3 אלקטרוני ערכיות בלבד</T>
  </Fig>;
}

// P10: schematic XPS/PES spectrum of magnesium.
export function XpsSpectrum({accent}){
  const peaks=[['1s',46,44],['2s',120,30],['2p',185,24],['3s',268,14]];
  const X=b=>60+b;
  return <Fig label="ספקטרום XPS סכמטי של מגנזיום: ארבע פסגות לפי תתי-הקליפות המאוכלסות">
    <Axis x1={60} y1={50} x2={430} y2={240} xLabel="אנרגיית קשירה — גדלה שמאלה" yLabel="עוצמה"/>
    {peaks.map(([s,b,h])=><g key={s}>
      <Curve d={`M${X(b)-16},240 Q${X(b)},${240-h*4.6} ${X(b)+16},240`} stroke={accent} w={2.2}/>
      <T x={X(b)} y={232-h*4.6} ltr fill={C.ink} weight="bold">{s}</T>
    </g>)}
    <T x={415} y={130} size={12}>אין פסגת 3p —</T>
    <T x={415} y={146} size={12}>תת-הקליפה ריקה ב-Mg</T>
    <T x={280} y={310} ltr size={12}>E_binding = hν − E_kinetic</T>
  </Fig>;
}
