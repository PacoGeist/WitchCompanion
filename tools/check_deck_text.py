"""Checks the Marseille and Thoth meaning and symbol files: every card present once, all 15 positions,
keywords, no em dashes, never a reversed reading. Usage: python3 tools/check_deck_text.py marseille|thoth"""
import glob, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
deck = sys.argv[1]
names = json.load(open(os.path.join(ROOT, 'data', 'tarot-card-names.json')))
names = [n if isinstance(n, str) else n['name'] for n in names]
CTX = ['past', 'present', 'future', 'challenge', 'advice', 'self', 'others', 'hopes', 'love', 'work', 'spirit', 'release', 'shadow', 'foundation', 'gift']
problems, M, S = [], {}, {}
def text_ok(where, t):
    if not isinstance(t, str) or not t.strip(): problems.append(f'{where}: empty'); return
    if '—' in t or '– ' in t: problems.append(f'{where}: dash')
    if re.search(r'revers', t, re.I): problems.append(f'{where}: mentions reversals')
for f in sorted(glob.glob(os.path.join(ROOT, 'data', f'tarot-meanings-{deck}-*.json'))):
    for c in json.load(open(f)):
        n = c.get('name')
        if n not in names: problems.append(f'{os.path.basename(f)}: unknown name {n!r}'); continue
        if n in M: problems.append(f'duplicate {n}')
        M[n] = c
        for k in ['title', 'imagery', 'meaning', 'element', 'astrology', 'numerology', 'yesNo', 'affirmation']: text_ok(f'{n}.{k}', c.get(k))
        if c.get('yesNo') not in ('Yes', 'No', 'Maybe'): problems.append(f'{n}: yesNo')
        kw = c.get('keywords') or []
        if not 5 <= len(kw) <= 8: problems.append(f'{n}: {len(kw)} keywords')
        ctx = c.get('ctx') or {}
        for k in CTX: text_ok(f'{n}.ctx.{k}', ctx.get(k))
        extra = set(ctx) - set(CTX)
        if extra: problems.append(f'{n}: extra ctx {extra}')
for f in sorted(glob.glob(os.path.join(ROOT, 'data', f'tarot-symbols-{deck}-*.json'))):
    for c in json.load(open(f)):
        n = c.get('name')
        if n not in names: problems.append(f'{os.path.basename(f)}: unknown name {n!r}'); continue
        S[n] = c
        if len(c.get('symbols') or []) < 3: problems.append(f'{n}: few symbols')
        for i, s in enumerate(c.get('symbols') or []):
            for k in ('feature', 'meaning'): text_ok(f'{n}.symbols[{i}].{k}', s.get(k))
words = sum(len(' '.join([c['meaning'], c['imagery'], *c['ctx'].values()]).split()) for c in M.values())
print(f'{deck}: meanings {len(M)}/78, symbols {len(S)}/78, {words} words')
missing = [n for n in names if n not in M]
if missing: print('  not yet written:', len(missing))
for p in problems[:40]: print('  PROBLEM', p)
sys.exit(1 if problems else 0)
