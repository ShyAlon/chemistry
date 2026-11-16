#!/usr/bin/env python3
"""Generate src/reference-data.js. Run: python3 scripts/build-reference-data.py > src/reference-data.js
Sources fetched live (public data), each field has one owner:
  atomic weights (abridged, with uncertainty): CIAAW https://ciaaw.org/abridged-atomic-weights.htm
  mass number of longest-lived isotope (no standard weight): CIAAW https://ciaaw.org/radioactive-elements.htm
  ground-state configurations Z<=103: NIST ASD ionization-energy table https://physics.nist.gov/cgi-bin/ASD/ie.pl
  Pauling electronegativity: PubChem periodic table CSV https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/CSV
Hebrew names, grid layout and categories are authored here. No manual value overrides."""
import csv,sys,re,json,html,io,urllib.request
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=90).read().decode('utf-8','ignore')
# Hebrew names: Academy of the Hebrew Language terms database (inorganic chemistry nomenclature, 1979;
# a few names there are from the 1951 list). Looked up per element at terms.hebrew-academy.org.il.
# Elements 104-118 have no Academy entry found: they are shown with the English name.
HE_ACADEMY={1:"מימן",2:"הליום",3:"ליתיום",4:"בריליום",5:"בור",6:"פחמן",7:"חנקן",8:"חמצן",9:"פלואור",10:"נאון",11:"נתרן",12:"מגנזיום",13:"אלומיניום",14:"צורן",15:"זרחן",16:"גופרית",17:"כלור",18:"ארגון",19:"אשלגן",20:"סידן",21:"סקנדיום",22:"טיטניום",23:"ונדיום",24:"כרום",25:"מנגן",26:"ברזל",27:"קובלט",28:"ניקל",29:"נחושת",30:"אבץ",31:"גליום",32:"גרמניום",33:"ארסן",34:"סלניום",35:"ברום",36:"קריפטון",37:"רובידיום",38:"סטרונטיום",39:"איטריום",40:"זירקוניום",41:"ניוביום",42:"מוליבדן",43:"טכנטיום",44:"רותניום",45:"רודיום",46:"פלדיום",47:"כסף",48:"קדמיום",49:"אינדיום",50:"בדיל",51:"אנטימון",52:"טלוריום",53:"יוד",54:"קסנון",55:"צסיום",56:"בריום",57:"לנתן",58:"צריום",59:"פרסאודימיום",60:"נאודימיום",61:"פרומתיום",62:"סמריום",63:"אירופיום",64:"גדוליניום",65:"טרביום",66:"דיספרוסיום",67:"הולמיום",68:"ארביום",69:"תוליום",70:"איטרביום",71:"לוטטיום",72:"הפניום",73:"טנטל",74:"וולפרם",75:"רניום",76:"אוסמיום",77:"אירידיום",78:"פלטינה",79:"זהב",80:"כספית",81:"תליום",82:"עופרת",83:"ביסמוט",84:"פולוניום",85:"אסטט",86:"רדון",87:"פרנסיום",88:"רדיום",89:"אקטיניום",90:"תוריום",91:"פרוטקטיניום",92:"אורניום",93:"נפטוניום",94:"פלוטוניום",95:"אמריקיום",96:"קוריום",97:"ברקליום",98:"קליפורניום",99:"איינשטייניום",100:"פרמיום",101:"מנדלביום",102:"נובליום",103:"לורנסיום"}
# standard atomic weights (conventional, 2 decimals) where the CSV is low precision
_UNUSED={3:6.94,5:10.81,6:12.011,18:39.95,26:55.85,29:63.55,30:65.38,16:32.06,17:35.45,20:40.08,35:79.90,36:83.80,
 42:95.95,44:101.07,62:150.36,76:190.23,82:207.2,52:127.60,34:78.97,53:126.90,10:20.18,80:200.59,1:1.008}
PERIOD_START=[1,3,11,19,37,55,87]
def pos(z):
    if 57<=z<=71: return (9,z-57+3)
    if 89<=z<=103: return (10,z-89+3)
    p=max(i for i,s in enumerate(PERIOD_START) if z>=s)+1
    off=z-PERIOD_START[p-1]
    if p==1: return (1,1 if z==1 else 18)
    if p in(2,3): return (p,off+1 if off<2 else off+11)
    if p in(4,5): return (p,off+1)
    base=PERIOD_START[p-1]
    # periods 6,7: s block 2, f block skipped, then d/p from group 3 (Lu/Lr or Hf/Rf at group 4)
    if off<2: return (p,off+1)
    fcount=14
    o2=off-2-fcount-1  # La/Ac handled above; Lu->index
    dstart=off-2
    # elements after La (off=2) : Ce..Yb f-block(14) then Lu,... Hf at group 4
    after=off-2-14   # 0 for Lu(71), 1 for Hf
    return (p,after+3)
CAT={}
def cat(z,g,p):
    if z==1: return 'nonmetal'
    if 57<=z<=71: return 'lanthanide'
    if 89<=z<=103: return 'actinide'
    if g==1: return 'alkali'
    if g==2: return 'alkaline'
    if g==18: return 'noble'
    if g==17: return 'halogen'
    if 3<=g<=12: return 'transition'
    if z in(5,14,32,33,51,52): return 'metalloid'
    if z in(6,7,8,15,16,34): return 'nonmetal'
    return 'post'
def block(z,g):
    if 57<=z<=71 or 89<=z<=103: return 'f'
    if z==2: return 's'
    if g in(1,2): return 's'
    if 3<=g<=12: return 'd'
    return 'p'
def order(tok):
    n,l=int(tok[0]),'spdf'.index(tok[1]);return (n+l,n)

ciaaw=get('https://ciaaw.org/abridged-atomic-weights.htm')
W={}
for tr in re.findall(r'<tr[^>]*>(.*?)</tr>',ciaaw,re.S):
    tds=[html.unescape(re.sub(r'<[^>]+>','',x)).replace('\xa0',' ').strip() for x in re.findall(r'<td[^>]*>(.*?)</td>',tr,re.S)]
    if len(tds)>=4 and tds[0].isdigit():
        m=re.match(r'([\d.]+)\s*\u00b1\s*([\d.]+)',tds[3])
        W[int(tds[0])]=(m.group(1),m.group(2)) if m else None
rad=get('https://ciaaw.org/radioactive-elements.htm')
R={}
cur=None
for tr in re.findall(r'<tr[^>]*>(.*?)</tr>',rad,re.S):
    tds=[html.unescape(re.sub(r'<[^>]+>','',x)).replace('\xa0',' ').strip() for x in re.findall(r'<td[^>]*>(.*?)</td>',tr,re.S)]
    if len(tds)>=5 and tds[0].isdigit(): cur=int(tds[0]);R.setdefault(cur,[]).append(int(tds[3]))
    elif len(tds)>=2 and cur and tds[-2].isdigit(): R[cur].append(int(tds[-2]))
nist=get('https://physics.nist.gov/cgi-bin/ASD/ie.pl?biblio=on&e_out=0&el_name_out=on&format=0&ion_charge_out=on&ion_conf_out=on&level_out=on&order=0&seq_out=on&shells_out=on&spectra=H-Lr+I')
CFG={}
for r in re.findall(r'<tr class="bsl">(.*?)</tr>',nist,re.S):
    tds=re.findall(r'<td[^>]*>(.*?)</td>',r,re.S)
    sym=html.unescape(re.sub(r'<[^>]+>','',tds[2])).replace('\xa0','').strip()
    c=tds[3].replace('&nbsp;','')
    c=re.sub(r'<i>([spdf])</i><sup>(\d+)</sup>',r'\1\2,',c);c=re.sub(r'<i>([spdf])</i>',r'\g<1>1,',c)
    CFG[sym]=re.sub(r'<[^>]+>','',c)
def parse_cfg(c):
    m=re.match(r'\[(\w+)\]',c);core=None
    if m: core=m.group(1);c=c[m.end():]
    return core,[(a+b,int(n)) for a,b,n in re.findall(r'(\d)([spdf])(\d+),',c)]
rows=list(csv.DictReader(io.StringIO(get('https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/CSV'))))
out=[]
for r in rows:
    z=int(r['AtomicNumber']);p,g=pos(z)
    if z in range(72,87): g=z-72+4
    if z in range(104,119): g=z-104+4
    if z in range(5,11): g=z+8
    if z in range(13,19): g=z
    if z in (3,4,11,12): g={3:1,4:2,11:1,12:2}[z]
    if p in (4,5): g=z-PERIOD_START[p-1]+1
    if p in(6,7) and z in(55,56,87,88): g=1 if z in(55,87) else 2
    core='';cfg=[]
    if z<=103:
        c0,tk=parse_cfg(CFG[r['Symbol']])
        # present as noble-gas core + valence, in Madelung order
        if c0 is None and z>2:
            pass
        full=[]
        def expand(sym):
            c,t=parse_cfg(CFG[sym]);base=expand(c) if c else []
            return base+t
        toks=expand(r['Symbol']);d={}
        for s,n in toks:d[s]=d.get(s,0)+n
        gases=[('He',2),('Ne',10),('Ar',18),('Kr',36),('Xe',54),('Rn',86)]
        core=''
        for name,nz in gases:
            if nz<z: core=name
        keep=dict(d)
        if core:
            ce={};
            for s,n in expand(core):ce[s]=ce.get(s,0)+n
            for s,n in ce.items():
                keep[s]-=n
                if keep[s]==0: del keep[s]
        cfg=[[s,keep[s]] for s in sorted(keep,key=order)]
    w=W.get(z)
    mass=w[0] if w else None;unc=w[1] if w else None
    en=float(r['Electronegativity']) if r['Electronegativity'] and z<=92 else None
    out.append(dict(z=z,s=r['Symbol'],n=r['Name'],he=HE_ACADEMY.get(z),m=mass,u=unc,mn=None if w else R.get(z),p=p,g=g,cat=cat(z,g,p),b=block(z,g),core=core,cfg=cfg,en=en))
assert all(e['m'] or e['mn'] for e in out),[e['s'] for e in out if not(e['m'] or e['mn'])]
print('// Generated by scripts/build-reference-data.py. Do not edit by hand.')
print('// Weights: CIAAW abridged standard atomic weights (m, with +/- u). Elements without one: mn = mass number(s) of longest-lived isotope, CIAAW radioactive elements table.')
print('// Configurations (Z<=103): NIST Atomic Spectra Database. Pauling electronegativity (Z<=92): PubChem periodic table. Hebrew names and layout authored here.')
print('export const elements='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';')
