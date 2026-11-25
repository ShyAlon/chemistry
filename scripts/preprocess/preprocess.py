#!/usr/bin/env python3
"""Reusable source preprocessing for course ingestion (prototype, local dev tool).

Stages:
  extract  - pull per-page text and page images from source PDFs once, cached
  skeleton - draft a coverage-map skeleton (per-page headings, key lines) from the cache
  check    - flag review leads: atom/charge imbalance in text-layer equations,
             arithmetic mismatches in simple numeric equalities

Every arrow line with chemistry is classified into exactly one class and the
classes partition the candidate set:
  balanced | balanced-ambiguous | unbalanced | unparsed | notation | fragment
  (plus not-equation, which is not a candidate)

The digit(s)-before-sign charge form is inherently ambiguous in plain text
('SO42-' = SO4 with charge 2-, but 'NO3-' = NO3 with charge 1-). The parser
returns BOTH readings and the equation is checked under every combination:
  - all combinations balance      -> balanced
  - no combination balances       -> unbalanced
  - combinations disagree         -> balanced-ambiguous (cannot judge; human
                                     review decides which reading the slide meant)
No reading is ever silently picked because it balances.

Arithmetic claims ('a op b = c') are checked with exact Decimal arithmetic and
compared at the claim's stated precision: the computed value is rounded to the
claim's decimal places and must equal the claim exactly. There is no absolute
tolerance floor. Residual limit: operands carry their own rounding uncertainty,
which is not modeled (e.g. 0.763 + 1.10 = 1.86 passes because 1.863 rounds to
1.86 at the claim's stated decimals).

Flags are review LEADS, never science sign-off; the full human review and
release gate are unchanged.

Cache layout (outside the repo; sources stay private). The cache directory name
carries the tool version, image DPI and extraction mode, so a change to any of
them misses the old cache instead of silently reusing stale pages:
  <cache>/<sha256>-v<ver>-dpi<N>-text/page-0001.txt, page-0001.png, meta.json
--force (or a config mismatch) clears the directory before re-extracting, so no
stale page files survive.

Requires: pymupdf (pip). No network. No source content enters the repo.
"""
import argparse, hashlib, json, os, re, shutil, sys, time
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation, getcontext

import pymupdf

getcontext().prec = 50

TOOL_VERSION = '2'
CACHE_MODE = 'text'
IMG_DPI = 110

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

def cache_dir_for(cache_root, sha):
    return os.path.join(cache_root, f'{sha}-v{TOOL_VERSION}-dpi{IMG_DPI}-{CACHE_MODE}')

def extract(pdf, cache_root, force=False):
    s = sha256(pdf)
    d = cache_dir_for(cache_root, s)
    meta_p = os.path.join(d, 'meta.json')
    if os.path.exists(meta_p) and not force:
        meta = json.load(open(meta_p))
        if (meta.get('toolVersion') == TOOL_VERSION and meta.get('dpi') == IMG_DPI
                and meta.get('mode') == CACHE_MODE):
            return d, meta, True
        # config changed since this cache was written: fall through, re-extract
    if force and os.path.isdir(cache_root):
        # remove every cache dir for this source, including other config tags
        for name in os.listdir(cache_root):
            if name.startswith(s) and os.path.isdir(os.path.join(cache_root, name)):
                shutil.rmtree(os.path.join(cache_root, name))
    if os.path.isdir(d):
        shutil.rmtree(d)  # no stale page files survive a re-extract
    os.makedirs(d)
    doc = pymupdf.open(pdf)
    meta = {'file': os.path.basename(pdf), 'sha256': s, 'pageCount': len(doc),
            'dpi': IMG_DPI, 'toolVersion': TOOL_VERSION, 'mode': CACHE_MODE}
    for i in range(len(doc)):
        page = doc[i]
        with open(os.path.join(d, f'page-{i+1:04d}.txt'), 'w') as f:
            f.write(page.get_text(CACHE_MODE))
        pix = page.get_pixmap(dpi=IMG_DPI)
        pix.save(os.path.join(d, f'page-{i+1:04d}.png'))
    json.dump(meta, open(meta_p, 'w'), indent=1)
    return d, meta, False

def skeleton(cache_dir, meta):
    pages = []
    for n in range(1, meta['pageCount'] + 1):
        txt = open(os.path.join(cache_dir, f'page-{n:04d}.txt')).read()
        lines = [l.strip() for l in txt.splitlines() if l.strip()]
        eq = [l for l in lines if ARROW.search(l)]
        pages.append({'page': n, 'firstLines': lines[:2], 'lineCount': len(lines),
                      'equationLines': len(eq)})
    return {'file': meta['file'], 'sha256': meta['sha256'],
            'pageCount': meta['pageCount'], 'pages': pages}

# ---------- equation parsing ----------
ARROW = re.compile(r'(→|⟶|⟵|⇌|⇋|->|<->)')
STATE = re.compile(r'\((s|l|g|aq)\)')
ASSIGN_NUM = re.compile(r'=\s*-?\d+\s*$')  # oxidation-sum assignments, not equations
ELEM = re.compile(r'([A-Z][a-z]?)(\d*)')
MAX_READING_COMBOS = 64  # per side; above this the side is reported unparsed

def merge_into(dst, src, mult=1):
    for el, n in src.items():
        dst[el] = dst.get(el, 0) + mult * n

def _walk(s, counts, mult):
    """Add the atom counts of formula body s (no charge) into counts.

    Handles () nesting and hydrates with middle dot (CuSO4·5H2O).
    Raises ValueError/IndexError on unparseable input."""
    i = 0
    while i < len(s):
        if s[i] == '(':
            j = s.index(')', i)
            k = j + 1
            num = ''
            while k < len(s) and s[k].isdigit():
                num += s[k]; k += 1
            _walk(s[i+1:j], counts, mult * int(num or 1))
            i = k
        elif s[i] in '·•*':
            i += 1
            num = ''
            while i < len(s) and s[i].isdigit():
                num += s[i]; i += 1
            # hydrate water multiplier applies to the following group
            j = i
            depth = 0
            while j < len(s):
                if s[j] == '(':
                    depth += 1
                elif s[j] == ')':
                    depth -= 1
                elif depth == 0 and s[j] in '·•*':
                    break
                j += 1
            _walk(s[i:j], counts, mult * int(num or 1))
            i = j
        else:
            m2 = ELEM.match(s, i)
            if not m2:
                raise ValueError('bad element at %r in %r' % (s[i:], s))
            counts[m2.group(1)] = counts.get(m2.group(1), 0) + mult * int(m2.group(2) or 1)
            i = m2.end()

def parse_formula_readings(f):
    """Return (readings, ok): every plausible (counts, charge) parse of one formula.

    The digit(s)-before-sign charge form is ambiguous in plain text: 'SO42-'
    reads as SO4^2- (reading B) or SO42^1- (reading A); 'NO3-' reads as NO3^1-
    (reading A) or NO^3- (reading B). Both are returned; the equation checker
    decides. Sign-then-digits ('Fe+2', 'VO+2') and a bare sign ('Cl-') are
    unambiguous. A reading whose body cannot parse is dropped; ok is False only
    when no reading parses.
    """
    f = STATE.sub('', f).strip()
    bodies = []
    m = re.search(r'(\d+)([+-])$', f)
    if m:
        digits, sign = m.group(1), m.group(2)
        sgn = 1 if sign == '+' else -1
        body = f[:m.start()]
        bodies.append((body + digits, sgn))                    # A: digits = subscript
        bodies.append((body + digits[:-1], sgn * int(digits[-1])))  # B: last digit = charge
    else:
        m = re.search(r'([+-])(\d+)$', f)
        if m:
            sgn = 1 if m.group(1) == '+' else -1
            bodies.append((f[:m.start()], sgn * int(m.group(2))))
        elif f.endswith(('+', '-')):
            bodies.append((f[:-1], 1 if f.endswith('+') else -1))
        else:
            bodies.append((f, 0))
    readings, seen = [], set()
    for body, charge in bodies:
        if not body:
            # state marker only (bare '(aq)') or a charge fragment split off by
            # a text-layer line break ('2-', '-(aq)'). A lone charge is not a
            # species: discard it so split lines stay honest fragments.
            counts, charge = {}, 0
        elif body == 'e':
            counts, charge = {}, (charge if charge else -1)  # electron: e or e-
        else:
            counts = {}
            try:
                _walk(body, counts, 1)
            except (ValueError, IndexError):
                continue  # this reading is unparseable; another may still parse
        key = (tuple(sorted(counts.items())), charge)
        if key not in seen:
            seen.add(key)
            readings.append((counts, charge))
    if not readings:
        return [], False
    return readings, True

def split_side(side):
    """Tokens; a standalone '+', en-dash or minus is a species separator;
    leading numbers are coefficients (also when attached: 2Fe, 6e-)."""
    toks = side.split()
    species, cur = [], []
    for t in toks:
        if t in ('+', '–', '−'):
            if cur:
                species.append(cur); cur = []
        else:
            cur.append(t)
    if cur:
        species.append(cur)
    out = []
    for sp in species:
        coef = 1
        if sp and re.fullmatch(r'\d+', sp[0]):
            coef = int(sp[0]); sp = sp[1:]
        if sp:
            m = re.match(r'^(\d+)([A-Z(].*|e-?)$', sp[0])
            if m:
                coef *= int(m.group(1)); sp[0] = m.group(2)
        if sp:
            out.append((coef, ' '.join(sp)))
    return out

def side_readings(side):
    """Return (combos, ok): every (atoms, charge, nonempty) interpretation of the
    side across the per-species ambiguous readings; ok False when a species has
    no parseable reading or the combination count exceeds MAX_READING_COMBOS."""
    combos = [({}, 0, 0)]
    for coef, f in split_side(side):
        rs, ok = parse_formula_readings(f)
        if not ok:
            return None, False
        new = []
        for atoms, tot, ne in combos:
            for counts, charge in rs:
                a2 = dict(atoms)
                merge_into(a2, counts, coef)
                new.append((a2, tot + coef * charge,
                            ne + (1 if counts or charge else 0)))
        if len(new) > MAX_READING_COMBOS:
            return None, False
        combos = new
    return combos, True

def check_equation(line):
    """Classify one arrow line: balanced | balanced-ambiguous | unbalanced |
    unparsed | notation | fragment | not-equation."""
    s = line.strip()
    s = re.sub(r'^[A-Za-z]{2,10}:\s+(?=[A-Z0-9(])', '', s)  # "Forward:" style labels
    if not ARROW.search(s) or ASSIGN_NUM.search(s):
        return 'not-equation', None
    arrow_at = ARROW.search(s).start()
    if '=' in s[:arrow_at]:
        return 'notation', None  # oxidation-sum arithmetic, not an equation
    if not re.search(r'[A-Z][a-z]?', s):
        return 'not-equation', None
    left, right = ARROW.split(s, maxsplit=1)[0], ARROW.split(s, maxsplit=1)[-1]
    cl, ok_l = side_readings(left)
    cr, ok_r = side_readings(right)
    if not (ok_l and ok_r):
        return 'unparsed', s
    if cl[0][2] == 0 or cr[0][2] == 0:
        return 'fragment', None  # one side empty: equation split across text lines
    outcomes = set()
    for al, chl, _ in cl:
        for ar, chr_, _ in cr:
            outcomes.add(al == ar and chl == chr_)
    if outcomes == {True}:
        return 'balanced', s
    if outcomes == {False}:
        al, chl, _ = cl[0]
        ar, chr_, _ = cr[0]
        diff = {e: (al.get(e, 0), ar.get(e, 0))
                for e in set(al) | set(ar) if al.get(e, 0) != ar.get(e, 0)}
        return 'unbalanced', {'line': s, 'atomDiff': diff, 'charge': (chl, chr_)}
    return 'balanced-ambiguous', {'line': s, 'readingPairs': len(cl) * len(cr)}

# ---------- arithmetic checking ----------
ARITH = re.compile(
    r'^\s*(?:[A-Za-z\[\]()]+\s*=\s*)?'           # optional label like x =
    r'(-?\d+(?:\.\d+)?)\s*([-+×x*/])\s*(-?\d+(?:\.\d+)?)'   # a op b
    r'\s*=\s*(-?\d+(?:\.\d+)?)\s*$')              # = c
OPS = {'+': lambda a, b: a + b, '-': lambda a, b: a - b,
       '×': lambda a, b: a * b, 'x': lambda a, b: a * b,
       '*': lambda a, b: a * b, '/': lambda a, b: a / b if b != 0 else None}

def check_arith(line):
    """Verify 'a op b = c' claims with exact Decimal arithmetic.

    The computed value is rounded (half-up) to the claim's stated decimal
    places and must equal the claim exactly - relative to the claim's own
    precision, with no absolute tolerance floor. Return (status, detail):
    ok | mismatch | None (line not a simple checkable equality)."""
    s = line.strip()
    if '10^' in s or '^-' in s or '%' in s:
        return None  # scientific notation / percentages: out of scope for now
    m = ARITH.match(s)
    if not m:
        return None
    try:
        a, b, c = Decimal(m.group(1)), Decimal(m.group(3)), Decimal(m.group(4))
    except InvalidOperation:
        return None
    v = OPS[m.group(2)](a, b)
    if v is None:
        return None  # division by zero: cannot judge
    q = Decimal(1).scaleb(min(c.as_tuple().exponent, 0))
    try:
        if v.quantize(q, rounding=ROUND_HALF_UP) == c:
            return 'ok', s
    except InvalidOperation:
        return None
    return 'mismatch', {'line': s, 'computed': str(v), 'claimed': str(c)}

# ---------- drivers ----------
CLASSES = ('balanced', 'balanced-ambiguous', 'unbalanced', 'unparsed',
           'notation', 'fragment', 'not-equation')
CANDIDATE_CLASSES = ('balanced', 'balanced-ambiguous', 'unbalanced',
                     'unparsed', 'notation', 'fragment')

def run_check(cache_dir, meta):
    eq = {k: [] for k in CLASSES}
    arith = {'ok': 0, 'mismatch': []}
    for n in range(1, meta['pageCount'] + 1):
        txt = open(os.path.join(cache_dir, f'page-{n:04d}.txt')).read()
        for line in txt.splitlines():
            if ARROW.search(line):
                st, det = check_equation(line)
                if det is None:
                    eq[st].append({'page': n})
                elif isinstance(det, dict):
                    eq[st].append({'page': n, **det})
                else:
                    eq[st].append({'page': n, 'line': det})
            else:
                r = check_arith(line)
                if r and r[0] == 'ok':
                    arith['ok'] += 1
                elif r and r[0] == 'mismatch':
                    arith['mismatch'].append({'page': n, **r[1]})
    candidates = sum(len(eq[k]) for k in CANDIDATE_CLASSES)
    return {
        'candidates': candidates,
        'reconcile': candidates + len(eq['not-equation']),
        'counts': {k: len(eq[k]) for k in CLASSES},
        'balancedAmbiguous': eq['balanced-ambiguous'],
        'unbalanced': eq['unbalanced'],
        'unparsed': eq['unparsed'],
        'arith': arith,
    }

def run(pdf, cache_root, force=False):
    t0 = time.time()
    d, meta, reused = extract(pdf, cache_root, force)
    t1 = time.time()
    sk = skeleton(d, meta)
    t2 = time.time()
    chk = run_check(d, meta)
    t3 = time.time()
    return {'file': meta['file'], 'sha256': meta['sha256'], 'pageCount': meta['pageCount'],
            'toolVersion': TOOL_VERSION,
            'seconds': {'extract': round(t1 - t0, 3), 'skeleton': round(t2 - t1, 3),
                        'check': round(t3 - t2, 3)},
            'reused': reused, 'check': chk}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf')
    ap.add_argument('--cache', default='/tmp/preprocess-cache')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--full', action='store_true', help='include skeleton page list')
    a = ap.parse_args()
    out = run(a.pdf, a.cache, a.force)
    if a.full:
        d = cache_dir_for(a.cache, out['sha256'])
        out['skeleton'] = skeleton(d, {'file': out['file'], 'sha256': out['sha256'],
                                       'pageCount': out['pageCount']})
    print(json.dumps(out, ensure_ascii=False, indent=1))

if __name__ == '__main__':
    main()
