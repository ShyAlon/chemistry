#!/usr/bin/env python3
"""Reusable source preprocessing for course ingestion (prototype, local dev tool).

Stages:
  extract  - pull per-page text and page images from source PDFs once, cache by sha256
  skeleton - draft a coverage-map skeleton (per-page headings, key lines) from the cache
  check    - flag calculation-impacting equation issues: atom/charge imbalance

Cache layout (outside the repo; sources stay private):
  <cache>/<pdf-sha256>/page-0001.txt, page-0001.png, meta.json

Requires: pymupdf (pip), poppler not needed. No network. No source content enters the repo.
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

HEAD_RE = re.compile(r'^[\w\W]{3,90}$')

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

# ---------- equation checking ----------
ARROW = re.compile(r'(→|⟶|⟵|⇌|⇋|->|<->)')
STATE = re.compile(r'\((s|l|g|aq)\)')
ASSIGN_NUM = re.compile(r'=\s*-?\d+\s*$')  # oxidation-sum assignments, not equations
ELEM = re.compile(r'([A-Z][a-z]?)(\d*)')

def parse_formula(f):
    """Return ({element: count}, charge, ok). Handles () nesting, charges 2+/+2/+/-/e-."""
    f = STATE.sub('', f).strip()
    charge = 0
    m = re.search(r'(\d*)([+-])$', f)
    if m:
        charge = int(m.group(1) or 1) * (1 if m.group(2) == '+' else -1)
        f = f[:m.start()]
    elif re.search(r'[+-]\d+$', f):
        m = re.search(r'([+-])(\d+)$', f)
        charge = int(m.group(2)) * (1 if m.group(1) == '+' else -1)
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
    """Tokens; '+' alone is a species separator; leading numbers are coefficients."""
    toks = side.replace('→', ' → ').split()
    species, cur = [], []
    for t in toks:
        if t in ('+', '\u2013', '\u2212'):
            if cur: species.append(cur); cur = []
        else:
            cur.append(t)
    if cur: species.append(cur)
    out = []
    sign = 1
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
        for el, n in counts.items():
            atoms[el] = atoms.get(el, 0) + coef * n
        tot_c += coef * c
    return atoms, tot_c, nonempty, True

def check_equation(line):
    """Return (status, detail): balanced | unbalanced | unparsed | notation | fragment | not-equation."""
    s = line.strip()
    s = re.sub(r'^[A-Za-z]{2,10}:\s+(?=[A-Z0-9(])', '', s)  # "Forward:" style labels
    if not ARROW.search(s) or ASSIGN_NUM.search(s):
        return 'not-equation', None
    arrow_at = ARROW.search(s).start()
    if '=' in s[:arrow_at]:
        return 'notation', None  # oxidation-sum arithmetic, not an equation
    if not re.search(r'[A-Z][a-z]?', s):
        return 'not-equation', None
    parts = ARROW.split(s, maxsplit=1)
    left, right = parts[0], parts[-1]
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

def run_check(cache_dir, meta):
    res = {'balanced': 0, 'unbalanced': [], 'unparsed': [], 'candidates': 0}
    for n in range(1, meta['pageCount'] + 1):
        txt = open(os.path.join(cache_dir, f'page-{n:04d}.txt')).read()
        for line in txt.splitlines():
            if not ARROW.search(line):
                continue
            st, det = check_equation(line)
            if st in ('not-equation', 'notation', 'fragment'):
                res.setdefault(st, 0)
                res[st] += 1
                continue
            res['candidates'] += 1
            if st == 'balanced':
                res['balanced'] += 1
            else:
                res[st].append({'page': n, **(det if isinstance(det, dict) else {'line': det})})
    return res

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['extract', 'skeleton', 'check', 'all'])
    ap.add_argument('pdf')
    ap.add_argument('--cache', default='/tmp/preprocess-cache')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    t0 = time.time()
    d, meta, reused = extract(a.pdf, a.cache, a.force)
    t1 = time.time()
    out = {'extract': {'reused': reused, 'seconds': round(t1 - t0, 2),
                       'pageCount': meta['pageCount']}}
    if a.cmd in ('skeleton', 'all'):
        t2 = time.time()
        sk = skeleton(d, meta)
        out['skeleton'] = {'seconds': round(time.time() - t2, 2), 'pages': sk['pages']}
    if a.cmd in ('check', 'all'):
        t3 = time.time()
        out['check'] = run_check(d, meta)
        out['check']['seconds'] = round(time.time() - t3, 2)
    print(json.dumps(out, ensure_ascii=False, indent=1))

if __name__ == '__main__':
    main()
