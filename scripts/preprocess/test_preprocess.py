#!/usr/bin/env python3
"""Tests for preprocess.py. Pure parser tests run anywhere; integration tests
need PREPROCESS_SOURCES (a private directory of source PDFs) and are skipped
without it. No source content is embedded in this file."""
import json, os, shutil, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import preprocess as pp

FAIL = []
def T(name, got, want):
    if got != want:
        FAIL.append(f'{name}: got {got!r}, want {want!r}')
        print('FAIL', FAIL[-1])
    else:
        print('ok  ', name)

def parse1(f):
    """Single unambiguous reading, or 'AMBIGUOUS' marker."""
    rs, ok = pp.parse_formula_readings(f)
    if not ok:
        return None, None, False
    if len(rs) != 1:
        return sorted(rs, key=str), 'AMBIGUOUS', True
    counts, charge = rs[0]
    return counts, charge, True

def readings(f):
    rs, ok = pp.parse_formula_readings(f)
    return sorted(((dict(c), ch) for c, ch in rs), key=lambda r: (r[1], str(r[0]))), ok

# ---- parse_formula_readings: unambiguous forms give exactly one reading ----
T('Fe2O3', parse1('Fe2O3'), ({'Fe': 2, 'O': 3}, 0, True))
T('Ca3(PO4)2 nested parens', parse1('Ca3(PO4)2'), ({'Ca': 3, 'P': 2, 'O': 8}, 0, True))
T('hydrate CuSO4·5H2O', parse1('CuSO4·5H2O'), ({'Cu': 1, 'S': 1, 'O': 9, 'H': 10}, 0, True))
T('charge 2+ (Fe2+ digit-before-sign is ambiguous: charge 2 / subscript 2)',
  readings('Fe2+'), ([({'Fe': 2}, 1), ({'Fe': 1}, 2)], True))
T('charge +2', parse1('Fe+2'), ({'Fe': 1}, 2, True))
T('charge -', parse1('Cl-'), ({'Cl': 1}, -1, True))
T('H3O+', parse1('H3O+'), ({'H': 3, 'O': 1}, 1, True))
T('VO+2', parse1('VO+2'), ({'V': 1, 'O': 1}, 2, True))
T('electron e-', parse1('e-'), ({}, -1, True))
T('electron bare e', parse1('e'), ({}, -1, True))
T('state-only (aq)', parse1('(aq)'), ({}, 0, True))
T('state stripped', parse1('CO2(g)'), ({'C': 1, 'O': 2}, 0, True))

# ---- ambiguous digit-before-sign ions: BOTH readings returned, none picked ----
T('SO42- both readings', readings('SO42-'),
  ([({'S': 1, 'O': 4}, -2), ({'S': 1, 'O': 42}, -1)], True))
T('NO3- both readings', readings('NO3-'),
  ([({'N': 1, 'O': 1}, -3), ({'N': 1, 'O': 3}, -1)], True))
T('MnO4- both readings', readings('MnO4-'),
  ([({'Mn': 1, 'O': 1}, -4), ({'Mn': 1, 'O': 4}, -1)], True))
T('HCO3- both readings', readings('HCO3-'),
  ([({'H': 1, 'C': 1, 'O': 1}, -3), ({'H': 1, 'C': 1, 'O': 3}, -1)], True))
T('NH4+ both readings', readings('NH4+'),
  ([({'N': 1, 'H': 4}, 1), ({'N': 1, 'H': 1}, 4)], True))
T('H2PO4- both readings', readings('H2PO4-'),
  ([({'H': 2, 'P': 1, 'O': 1}, -4), ({'H': 2, 'P': 1, 'O': 4}, -1)], True))
T('CO32- both readings', readings('CO32-'),
  ([({'C': 1, 'O': 3}, -2), ({'C': 1, 'O': 32}, -1)], True))
T('Fe(CN)63- both readings', readings('Fe(CN)63-'),
  ([({'Fe': 1, 'C': 6, 'N': 6}, -3), ({'Fe': 1, 'C': 63, 'N': 63}, -1)], True))

# ---- split_side: coefficients and separators ----
T('split coeffs', pp.split_side('Fe2O3(s) + 3 CO(g)'), [(1, 'Fe2O3(s)'), (3, 'CO(g)')])
T('split attached coeff', pp.split_side('2N2H4(l) + N2O4(l)'), [(2, 'N2H4(l)'), (1, 'N2O4(l)')])
T('split electron coeff', pp.split_side('6e- + KClO3'), [(6, 'e-'), (1, 'KClO3')])

# ---- check_equation: unambiguous equations ----
T('balanced blast furnace', pp.check_equation('Fe2O3(s) + 3 CO(g) → 2 Fe(l) + 3 CO2(g)')[0], 'balanced')
T('balanced 2H2+O2', pp.check_equation('2 H2 + O2 → 2 H2O')[0], 'balanced')
T('NEGATIVE H2+O2->H2O must not be balanced', pp.check_equation('H2 + O2 → H2O')[0], 'unbalanced')
T('charge bookkeeping balanced', pp.check_equation('Cl+5 + 6e- → Cl-')[0], 'balanced')
T('hydrate dehydration balanced', pp.check_equation('CuSO4·5H2O(s) → CuSO4(s) + 5 H2O(g)')[0], 'balanced')
T('E12 skeleton flagged', pp.check_equation('VO+2 + Sn+2 + H3O+ → V+3 + Sn+4 + H2O')[0], 'unbalanced')
T('partial step flagged', pp.check_equation('KClO3 + 6e- → KCl')[0], 'unbalanced')
T('oxidation-sum arithmetic is notation', pp.check_equation('2Cr + 7(-2) = -2 → Cr = +6')[0], 'notation')
T('split-line fragment', pp.check_equation('(aq) → V+3')[0], 'fragment')
T('charge-spec line is not-equation', pp.check_equation('Cr2O7 = -2')[0], 'not-equation')
T('label stripped', pp.check_equation('Forward: CO(g) + 2 H2(g) → CH3OH(g)')[0], 'balanced')

# ---- check_equation: ambiguous-ion equations, reviewer probe set ----
# Real, correct equations: no longer false-flagged unbalanced, and NOT silently
# passed as balanced either - the parser cannot tell which reading the slide
# meant, so they go to human review as balanced-ambiguous.
T('NO3- redox (reviewer probe)', pp.check_equation('NO3- + 3e- + 4H+ → NO + 2H2O')[0], 'balanced-ambiguous')
T('HCO3- + H+ (reviewer probe)', pp.check_equation('HCO3- + H+ → H2CO3')[0], 'balanced-ambiguous')
T('NH4+ + OH- (reviewer probe)', pp.check_equation('NH4+ + OH- → NH3 + H2O')[0], 'balanced-ambiguous')
T('H2PO4- deprotonation (reviewer probe)', pp.check_equation('H2PO4- → HPO42- + H+')[0], 'balanced-ambiguous')
T('MnO4- permanganate half rxn', pp.check_equation('MnO4- + 8H+ + 5e- → Mn+2 + 4H2O')[0], 'balanced-ambiguous')
T('CO32- + H+ step', pp.check_equation('CO32- + H+ → HCO3-')[0], 'balanced-ambiguous')
# adversarial negatives: wrong equations with ambiguous ions must NOT pass
T('NEGATIVE NO3- → NO2 all readings wrong', pp.check_equation('NO3- → NO2')[0], 'unbalanced')
T('NEGATIVE NH4+ → NH3 all readings wrong', pp.check_equation('NH4+ → NH3')[0], 'unbalanced')
T('NEGATIVE MnO4- → Mn+2 all readings wrong', pp.check_equation('MnO4- → Mn+2')[0], 'unbalanced')
# adversarial: a line that only balances under one reading stays a lead
T('one-reading-balances stays ambiguous', pp.check_equation('SO42- + 2H+ → H2SO4')[0], 'balanced-ambiguous')
# split-line charge fragments are not species: the equation tail stays a
# fragment lead, not a chemical error flag (regression for 12 real slides lines)
T('charge fragment 2- is not a species', parse1('2-'), ({}, 0, True))
T('charge fragment - is not a species', parse1('-'), ({}, 0, True))
T('split tail 2-(aq) stays fragment', pp.check_equation('2-(aq) → NH3 + HCO3')[0], 'fragment')
T('split tail -(aq) stays fragment', pp.check_equation('-(aq)  →   SO4')[0], 'fragment')
T('split tail 2-(aq) before Mn stays fragment', pp.check_equation('-(aq)  →  2 Mn2+(aq) + 8 H2O(l)')[0], 'fragment')

# ---- check_arith: exact Decimal, claim-precision comparison, no abs floor ----
T('arith ok with label', pp.check_arith('x = 0.10 - 0.04 = 0.06'), ('ok', 'x = 0.10 - 0.04 = 0.06'))
T('arith ok decimal exact', pp.check_arith('0.1 + 0.2 = 0.3')[0], 'ok')
T('arith mismatch flagged', pp.check_arith('1.5 + 1.5 = 3.1')[0], 'mismatch')
T('arith non-match', pp.check_arith('pH = 2.4'), None)
T('arith scientific notation skipped', pp.check_arith('1.8*10^-5 = 0.000018'), None)
# reviewer defect probes: the old 0.005 floor passed these; they must fail now
T('arith tiny product false ok fixed', pp.check_arith('0.010 × 0.020 = 0.0001')[0], 'mismatch')
T('arith small-sum false ok fixed', pp.check_arith('2.5 + 2.5 = 5.1')[0], 'mismatch')
T('arith rounding at claim precision ok', pp.check_arith('1 / 3 = 0.33')[0], 'ok')
T('arith division exact ok', pp.check_arith('10 / 4 = 2.5')[0], 'ok')
T('arith wrong last digit flagged', pp.check_arith('10 / 4 = 2.6')[0], 'mismatch')
T('arith div by zero cannot judge', pp.check_arith('1 / 0 = 0'), None)

# ---- accounting invariant on synthetic input (includes ambiguous class) ----
res = {'counts': {k: 0 for k in pp.CLASSES}}
for line in ['Fe2O3(s) + 3 CO(g) → 2 Fe(l) + 3 CO2(g)', 'H2 + O2 → H2O',
             'NO3- + 3e- + 4H+ → NO + 2H2O',
             '2Cr + 7(-2) = -2 → Cr = +6', '(aq) → V+3', 'Cr2O7 = -2',
             'weird *3 / line → nowhere']:
    st, _ = pp.check_equation(line)
    res['counts'][st] += 1
cand = sum(res['counts'][k] for k in pp.CANDIDATE_CLASSES)
T('partition: candidates', cand, 5)
T('partition: total classified', cand + res['counts']['not-equation'], 7)
T('partition: ambiguous counted', res['counts']['balanced-ambiguous'], 1)

# ---- integration: reuse, invalidation, determinism, measured comparison ----
SRC = os.environ.get('PREPROCESS_SOURCES')
if SRC and os.path.isdir(SRC):
    pdfs = sorted(f for f in os.listdir(SRC) if f.endswith('.pdf'))[:3]
    tmp = tempfile.mkdtemp()
    cache = os.path.join(tmp, 'cache')
    r1 = [pp.run(os.path.join(SRC, f), cache) for f in pdfs]
    r2 = [pp.run(os.path.join(SRC, f), cache) for f in pdfs]
    T('first pass all fresh', all(not r['reused'] for r in r1), True)
    T('second pass all reused', all(r['reused'] for r in r2), True)
    T('deterministic check output', json.dumps([r['check'] for r in r1], sort_keys=True),
      json.dumps([r['check'] for r in r2], sort_keys=True))
    for a, b in zip(r1, r2):
        T(f'partition invariant {a["file"][:20]}',
          a['check']['candidates'] + a['check']['counts']['not-equation'], a['check']['reconcile'])

    # changed-one-source invalidation: only the modified source re-extracts
    mod = os.path.join(tmp, 'modified.pdf')
    shutil.copy(os.path.join(SRC, pdfs[0]), mod)
    with open(mod, 'ab') as fh:
        fh.write(b'\n% changed\n')
    r3 = pp.run(mod, cache)
    r3b = pp.run(os.path.join(SRC, pdfs[1]), cache)
    T('changed source re-extracted', r3['reused'], False)
    T('unchanged source still reused', r3b['reused'], True)
    T('changed source sha differs', r3['sha256'] != r1[0]['sha256'], True)

    # cache identity: a DPI change must NOT silently reuse stale pages
    real_dpi = pp.IMG_DPI
    pp.IMG_DPI = real_dpi + 1
    try:
        r4 = pp.run(os.path.join(SRC, pdfs[0]), cache)
        T('dpi change re-extracts', r4['reused'], False)
        r5 = pp.run(os.path.join(SRC, pdfs[0]), cache)
        T('new dpi then reused', r5['reused'], True)
    finally:
        pp.IMG_DPI = real_dpi
    r6 = pp.run(os.path.join(SRC, pdfs[0]), cache)
    T('dpi restored reuses original cache', r6['reused'], True)

    # cache identity: a tampered meta (stale tool version) must re-extract
    d0 = pp.cache_dir_for(cache, r1[0]['sha256'])
    meta_p = os.path.join(d0, 'meta.json')
    meta = json.load(open(meta_p))
    meta['toolVersion'] = '0-ancient'
    json.dump(meta, open(meta_p, 'w'))
    r7 = pp.run(os.path.join(SRC, pdfs[0]), cache)
    T('tool-version mismatch re-extracts', r7['reused'], False)

    # --force clears stale page files: plant junk, force, junk must be gone
    junk = os.path.join(d0, 'page-9999-stale.png')
    open(junk, 'w').write('stale')
    r8 = pp.run(os.path.join(SRC, pdfs[0]), cache, force=True)
    T('force re-extracts', r8['reused'], False)
    T('force cleared stale page file', os.path.exists(junk), False)

    # measured comparison: 3 prep passes, cache vs forced re-extract
    import time
    t0 = time.time()
    for _ in range(3):
        [pp.run(os.path.join(SRC, f), cache) for f in pdfs]
    cached_s = time.time() - t0
    t0 = time.time()
    for _ in range(3):
        [pp.run(os.path.join(SRC, f), cache, force=True) for f in pdfs]
    forced_s = time.time() - t0
    print(f'MEASURED 3-pass prep on {len(pdfs)} sources: cached {cached_s:.2f}s vs no-cache {forced_s:.2f}s')
    T('cache faster on repeated passes', cached_s < forced_s, True)
    shutil.rmtree(tmp)
else:
    print('SKIP integration: set PREPROCESS_SOURCES to the private sources dir')

print()
print('FAILURES:', len(FAIL))
sys.exit(1 if FAIL else 0)
