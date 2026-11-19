"""Downloads the Tarot de Marseille card scans listed in data/marseille-sources.json from Wikimedia Commons
into www/img/tarot-marseille/<code>.jpg (run once by the 'Fetch Marseille pictures' GitHub workflow)."""
import json, os, sys, time, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'www', 'img', 'tarot-marseille'); os.makedirs(OUT, exist_ok=True)
src = json.load(open(os.path.join(ROOT, 'data', 'marseille-sources.json'), encoding='utf-8'))
UA = "WitchesCompanion/1.0 (https://github.com/PacoGeist/WitchCompanion; tarot card images)"
bad = []
for code, name in src['files'].items():
    dest = os.path.join(OUT, code + '.jpg')
    if os.path.exists(dest) and os.path.getsize(dest) > 5000: continue
    # 500 px is one of Wikimedia's standard thumbnail sizes (about 50 KB a card); other sizes can be refused
    url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(name) + '?width=500'
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            data = urllib.request.urlopen(req, timeout=60).read()
            if len(data) < 5000 or data[:3] != b'\xff\xd8\xff': raise ValueError(f'not a JPEG ({len(data)} bytes)')
            open(dest, 'wb').write(data); break
        except Exception as e:
            print('retry', code, e); time.sleep(5 * (attempt + 1))
    else:
        bad.append(code); continue
    print('ok', code, len(data)); time.sleep(1)
print('done,', len(src['files']) - len(bad), 'of', len(src['files']), 'pictures;', 'missing: ' + ', '.join(bad) if bad else 'none missing')
sys.exit(1 if bad else 0)
