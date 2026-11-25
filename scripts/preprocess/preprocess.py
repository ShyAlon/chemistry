#!/usr/bin/env python3
"""Reusable source preprocessing for course ingestion (prototype, local dev tool).

Stages:
  extract  - pull per-page text and page images from source PDFs once, cache by sha256
  skeleton - draft a coverage-map skeleton (per-page headings, key lines) from the cache
  check    - flag review leads: atom/charge imbalance in text-layer equations,
             arithmetic mismatches in simple numeric equalities

Every arrow line with chemistry is classified into exactly one class and the
classes partition the candidate set: balanced | unbalanced | unparsed |
notation | fragment. Flags are review LEADS, never science sign-off; the full
human review and release gate are unchanged.

Cache layout (outside the repo; sources stay private):
  <cache>/<pdf-sha256>/page-0001.txt, page-0001.png, meta.json

Requires: pymupdf (pip). No network. No source content enters the repo.
"""
import argparse, hashlib, json, os, re, sys, time

import pymupdf

IMG_DPI = 110

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

def extract(pdf, cache_root, force=False):
    s = sha256(pdf)
    d = os.path.join(cache_root, s)
    meta_p = os.path.join(d, 'meta.json')
    if os.path.exists(meta_p) and not force:
        return d, json.load(open(meta_p)), True
    os.makedirs(d, exist_ok=True)
    doc = pymupdf.open(pdf)
    meta = {'file': os.path.basename(pdf), 'sha256': s, 'pageCount': len(doc), 'dpi': IMG_DPI}
    for i in range(len(doc)):
        page = doc[i]
        with open(os.path.join(d, f'page-{i+1:04d}.txt'), 'w') as f:
            f.write(page.get_text('text'))
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

def merge_into(dst, src, mult=1):
    for el, n in src.items():
        dst[el] = dst.get(el, 0) + mult * n

def parse_formula(f):
    """Return ({element: count}, charge, ok).

    Handles: coefficients handled by caller; () nesting; hydrates with middle
    dot (CuSO4·5H2O); charges 2+ / +2 / + / - / 2-; electrons e / e-.
    State markers (s)(l)(g)(aq) are stripped. A state-only species is empty.
    """
    f = STATE.sub('', f).strip()
    charge = 0
    m = re.search(r'(\d*)([+-])$', f)
    if m:
        digits = m.group(1)
        # ambiguity: SO42- means SO4 with charge 2-, not charge -42.
        if len(digits) > 1 and int(digits) > 8:
            charge = int(digits[-1]) * (1 if m.group(2) == '+' else -1)
            f = f[:m.start()] + digits[:-1]
        else:
            charge = int(digits or 1) * (1 if m.group(2) == '+' else -1)
            f = f[:m.start()]
    elif re.search(r'[+-]\d+$', f):
        m = re.search(r'([+-])(\d+)$', f)
        digits = m.group(2)
        if len(digits) > 1 and int(digits) > 8:
            charge = int(digits[-1]) * (1 if m.group(1) == '+' else -1)
            f = f[:m.start()] + digits[:-1]
        else:
            charge = int(digits) * (1 if m.group(1) == '+' else -1)
            f = f[:m.start()]
    if not f:
        return {}, 0, True  # state marker only, e.g. bare (aq)
    if f == 'e':
        return {}, charge if charge else -1, True  # electron: e or e-
    counts = {}
    def walk(s, mult):
        i = 0
        while i < len(s):
            if s[i] == '(':
                j = s.index(')', i)
                k = j + 1
                num = ''
                while k < len(s) and s[k].isdigit():
                    num += s[k]; k += 1
                walk(s[i+1:j], mult * int(num or 1))
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
                walk(s[i:j], mult * int(num or 1))
                i = j
            else:
                m2 = ELEM.match(s, i)
                if not m2:
                    raise ValueError('bad element at %r in %r' % (s[i:], f))
                counts[m2.group(1)] = counts.get(m2.group(1), 0) + mult * int(m2.group(2) or 1)
                i = m2.end()
    try:
        walk(f, 1)
    except (ValueError, IndexError):
        return {}, 0, False
    return counts, charge, True

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

def side_totals(side):
    """Return (atoms, charge, nonempty_species, ok)."""
    atoms, tot_c, nonempty = {}, 0, 0
    for coef, f in split_side(side):
        counts, c, good = parse_formula(f)
        if not good:
            return {}, 0, 0, False
        if counts or c:
            nonempty += 1
        merge_into(atoms, counts, coef)
        tot_c += coef * c
    return atoms, tot_c, nonempty, True

def check_equation(line):
    """Classify one arrow line: balanced | unbalanced | unparsed | notation | fragment | not-equation."""
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
    atoms_l, ch_l, ne_l, ok_l = side_totals(left)
    atoms_r, ch_r, ne_r, ok_r = side_totals(right)
    if not (ok_l and ok_r):
        return 'unparsed', s
    if ne_l == 0 or ne_r == 0:
        return 'fragment', None  # one side empty: equation split across text lines
    if atoms_l == atoms_r and ch_l == ch_r:
        return 'balanced', s
    diff = {e: (atoms_l.get(e, 0), atoms_r.get(e, 0))
            for e in set(atoms_l) | set(atoms_r) if atoms_l.get(e, 0) != atoms_r.get(e, 0)}
    return 'unbalanced', {'line': s, 'atomDiff': diff, 'charge': (ch_l, ch_r)}

# ---------- arithmetic checking ----------
ARITH = re.compile(
    r'^\s*(?:[A-Za-z\[\]()]+\s*=\s*)?'           # optional label like x =
    r'(-?\d+(?:\.\d+)?)\s*([-+×x*/])\s*(-?\d+(?:\.\d+)?)'   # a op b
    r'\s*=\s*(-?\d+(?:\.\d+)?)\s*$')              # = c
OPS = {'+': lambda a, b: a + b, '-': lambda a, b: a - b,
       '×': lambda a, b: a * b, 'x': lambda a, b: a * b,
       '*': lambda a, b: a * b, '/': lambda a, b: a / b if b else None}

def check_arith(line):
    """Verify 'a op b = c' claims. Return (status, detail): ok | mismatch | None."""
    s = line.strip()
    if '10^' in s or '^-' in s or '%' in s:
        return None  # scientific notation / percentages: out of scope for now
    m = ARITH.match(s)
    if not m:
        return None
    a, op, b, c = float(m.group(1)), m.group(2), float(m.group(3)), float(m.group(4))
    v = OPS[op](a, b)
    if v is None:
        return None
    tol = max(0.02 * abs(c), 0.005)  # slides round; flag only clear mismatches
    if abs(v - c) <= tol:
        return 'ok', s
    return 'mismatch', {'line': s, 'computed': round(v, 6), 'claimed': c}

# ---------- drivers ----------
CLASSES = ('balanced', 'unbalanced', 'unparsed', 'notation', 'fragment', 'not-equation')

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
    candidates = sum(len(eq[k]) for k in ('balanced', 'unbalanced', 'unparsed', 'notation', 'fragment'))
    return {
        'candidates': candidates,
        'reconcile': candidates + len(eq['not-equation']),
        'counts': {k: len(eq[k]) for k in CLASSES},
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
        d = os.path.join(a.cache, out['sha256'])
        out['skeleton'] = skeleton(d, {'file': out['file'], 'sha256': out['sha256'],
                                       'pageCount': out['pageCount']})
    print(json.dumps(out, ensure_ascii=False, indent=1))

if __name__ == '__main__':
    main()
