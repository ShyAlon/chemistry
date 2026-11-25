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

# ---- parse_formula: coefficients are caller-side; here formulas + charges ----
T('Fe2O3', pp.parse_formula('Fe2O3'), ({'Fe': 2, 'O': 3}, 0, True))
T('Ca3(PO4)2 nested parens', pp.parse_formula('Ca3(PO4)2'), ({'Ca': 3, 'P': 2, 'O': 8}, 0, True))
T('hydrate CuSO4·5H2O', pp.parse_formula('CuSO4·5H2O'), ({'Cu': 1, 'S': 1, 'O': 9, 'H': 10}, 0, True))
T('charge 2+', pp.parse_formula('Fe2+'), ({'Fe': 1}, 2, True))
T('charge +2', pp.parse_formula('Fe+2'), ({'Fe': 1}, 2, True))
T('charge -', pp.parse_formula('Cl-'), ({'Cl': 1}, -1, True))
T('charge 2-', pp.parse_formula('SO42-'), ({'S': 1, 'O': 4}, -2, True))
T('H3O+', pp.parse_formula('H3O+'), ({'H': 3, 'O': 1}, 1, True))
T('VO+2', pp.parse_formula('VO+2'), ({'V': 1, 'O': 1}, 2, True))
T('electron e-', pp.parse_formula('e-'), ({}, -1, True))
T('electron bare e', pp.parse_formula('e'), ({}, -1, True))
T('state-only (aq)', pp.parse_formula('(aq)'), ({}, 0, True))
T('state stripped', pp.parse_formula('CO2(g)'), ({'C': 1, 'O': 2}, 0, True))

# ---- split_side: coefficients and separators ----
T('split coeffs', pp.split_side('Fe2O3(s) + 3 CO(g)'), [(1, 'Fe2O3(s)'), (3, 'CO(g)')])
T('split attached coeff', pp.split_side('2N2H4(l) + N2O4(l)'), [(2, 'N2H4(l)'), (1, 'N2O4(l)')])
T('split electron coeff', pp.split_side('6e- + KClO3'), [(6, 'e-'), (1, 'KClO3')])

# ---- check_equation: classification incl. false-balanced negatives ----
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

# ---- check_arith ----
T('arith ok with label', pp.check_arith('x = 0.10 - 0.04 = 0.06'), ('ok', 'x = 0.10 - 0.04 = 0.06'))
T('arith ok float noise', pp.check_arith('0.1 + 0.2 = 0.3')[0], 'ok')
T('arith mismatch flagged', pp.check_arith('1.5 + 1.5 = 3.1')[0], 'mismatch')
T('arith non-match', pp.check_arith('pH = 2.4'), None)
T('arith scientific notation skipped', pp.check_arith('1.8*10^-5 = 0.000018'), None)

# ---- accounting invariant on synthetic input ----
res = {'counts': {k: 0 for k in pp.CLASSES}}
for line in ['Fe2O3(s) + 3 CO(g) → 2 Fe(l) + 3 CO2(g)', 'H2 + O2 → H2O',
             '2Cr + 7(-2) = -2 → Cr = +6', '(aq) → V+3', 'Cr2O7 = -2',
             'weird *3 / line → nowhere']:
    st, _ = pp.check_equation(line)
    res['counts'][st] += 1
cand = sum(res['counts'][k] for k in ('balanced', 'unbalanced', 'unparsed', 'notation', 'fragment'))
T('partition: candidates', cand, 4)
T('partition: total classified', cand + res['counts']['not-equation'], 6)

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
