"""Builds data/tarot-symbols-thoth-2.json: symbol notes for the 56 Thoth minor cards, from the
imagery in data/tarot-meanings-thoth-*.json plus per-suit and per-rank notes."""
import glob, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = {c['name']: c for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'tarot-meanings-thoth-*.json'))) for c in json.load(open(f))}
SUIT = {'Wands': ('Wands', 'Fire', 'will, energy and spirit'), 'Cups': ('Cups', 'Water', 'love, feeling and the unconscious'),
        'Swords': ('Swords', 'Air', 'mind, thought and conflict'), 'Pentacles': ('Disks', 'Earth', 'body, work and the material world')}
COURT = {'Page': ('Princess', 'Earth of', 'the element made solid: the throne and fertile ground of the suit'),
         'Knight': ('Prince', 'Air of', 'the element in motion, riding a chariot: intellect and drive'),
         'Queen': ('Queen', 'Water of', 'the element received and reflected: inner power and maturity'),
         'King': ('Knight', 'Fire of', 'the element at its swiftest and most active, on horseback')}
RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King']
out = []
for suit, (ts, el, about) in SUIT.items():
    for i, r in enumerate(RANKS):
        name = f'{r} of {suit}'; m = M[name]
        first = re.split(r'(?<=\.)\s', m['imagery'])[0].rstrip('.')
        syms = [{'feature': 'The painted scene', 'where': 'the whole card', 'meaning': first + '. ' + m['meaning'].split('. ')[0].rstrip('.') + '.'}]
        if i == 0:
            syms.append({'feature': f'Root of {el}', 'where': 'the title', 'meaning': f'The Ace is the source of {el}: {about}, in its purest form.'})
        elif i < 10:
            title = m['title'].split(': ')[1]
            syms.append({'feature': f'Title: {title}', 'where': 'bottom of the card', 'meaning': f'Every Thoth number card is named. {title} is the key to reading it: {", ".join(m["keywords"][:3])}.'})
            syms.append({'feature': m['astrology'], 'where': 'astrological sign on the card', 'meaning': f'The planet and sign that color this card, a ten-day stretch of the zodiac.'})
        else:
            rank, pre, note = COURT[r]
            syms.append({'feature': f'{rank} of {ts}', 'where': 'the court title', 'meaning': f'{pre} {el}: {note}.'})
        syms.append({'feature': f'{el} colors', 'where': 'background and suit signs', 'meaning': f'The suit of {ts} belongs to {el}: {about}.'})
        out.append({'name': name, 'symbols': syms})
json.dump(out, open(os.path.join(ROOT, 'data', 'tarot-symbols-thoth-2.json'), 'w'), indent=1, ensure_ascii=False)
print(len(out))
