"""Builds data/tarot-symbols-marseille-2.json: symbol notes for the 56 Marseille minor cards,
composed from per-suit, per-number and per-rank notes (the Marseille pips repeat these patterns)."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUIT = {
 'Wands': ('Batons', 'Crossed batons', 'Rough wooden staves crossing in a lattice, ends trimmed with small flowers', 'Fire and will: energy, desire and the drive to act. Their interlacing shows forces meeting and working together.'),
 'Cups': ('Cups', 'Stacked cups', 'Golden cups arranged in rows and columns, linked by leafy stems', 'Water and feeling: love, emotion and receptivity. Each cup is a vessel for what the heart holds.'),
 'Swords': ('Swords', 'Curved blades', 'Bowed swords bending into an oval or almond shape around a flower', 'Air and mind: thought, decisions and conflict. The curved blades protect the flower within like a shield of thought.'),
 'Pentacles': ('Coins', 'Flowered coins', 'Round coins patterned like flowers or suns, framed by stems and leaves', 'Earth and matter: money, work, body and home. The flower patterns show material life as something living and growing.'),
}
NUM = {
 2: 'Two: a pair, the first encounter of forces. Partnership, choice and balance.',
 3: 'Three: growth and the first results. Two forces produce something new.',
 4: 'Four: the square and stability. Things settle into a solid form.',
 5: 'Five: the square broken by a fifth element. Change, challenge and testing.',
 6: 'Six: harmony and exchange. Balance is found again.',
 7: 'Seven: effort and striving toward a goal.',
 8: 'Eight: order, power and balance perfected.',
 9: 'Nine: near completion, the last step before the end of the cycle.',
 10: 'Ten: completion, fullness and the turn toward a new cycle.',
}
CENTER = {
 'Wands': ('Central upright baton', 'In odd-numbered Batons a single straight staff stands through the middle of the lattice, a spine of will cutting through the pattern.'),
 'Swords': ('Central straight sword', 'In odd-numbered Swords a straight blade runs through the oval of curved ones: a decisive thought or a cut that breaks into what was protected.'),
 'Cups': ('A cup set apart', 'An odd cup sits apart from the others, often in the center: one feeling or wish that stands out.'),
 'Pentacles': ('The central coin', 'An odd coin sits in the center of the pattern: a focus of value, attention or resources.'),
}
EVEN = {
 'Wands': ('Closed lattice', 'With an even number the staves form a complete, balanced lattice with no single staff dominating.'),
 'Swords': ('Closed oval', 'With an even number the curved blades meet without a straight sword through the middle: the mind protects rather than cuts.'),
 'Cups': ('Balanced rows', 'With an even number the cups stand in matching rows: feelings shared and in balance.'),
 'Pentacles': ('Balanced columns', 'With an even number the coins pair off evenly: resources in steady balance.'),
}
ACES = {
 'Wands': [('Hand from a cloud', 'top center', 'A gift from beyond: raw energy offered to you.'), ('Rough-cut club', 'gripped by the hand', 'Living wood with cut branch stubs: wild, natural force not yet shaped.'), ('Falling sparks', 'around the club', 'Fire released, inspiration scattering in all directions.')],
 'Cups': [('Great ornate cup', 'center', 'Shaped like a small cathedral: the heart as a sacred vessel.'), ('Towers and arches', 'on the cup', 'Love that builds a home and shelters what it holds.'), ('Open top', 'the cup', 'Receptivity; the vessel waits to be filled and to overflow.')],
 'Swords': [('Hand from a cloud', 'bottom', 'Clarity offered as a gift.'), ('Sword through a crown', 'center', 'Truth and decision crowned with victory.'), ('Branches on the crown', 'hanging from it', 'Rewards of a clear mind, often read as palm for victory and laurel or olive for peace.')],
 'Pentacles': [('Great flowered coin', 'center', 'The full potential of Earth in one round form: wealth, health and the body.'), ('Leafy stems', 'above and below', 'Growth; material life that is alive and can flourish.'), ('Circle', 'the coin', 'Wholeness and completion in the physical world.')],
}
COURT = {
 'Page': ('Standing valet', 'He stands on foot, the youngest of the court: a student, messenger or beginner learning to hold the suit.'),
 'Knight': ('Rider on horseback', 'He rides out into the world: the suit in motion, carrying its energy toward a goal.'),
 'Queen': ('Seated queen', 'She sits and holds the suit close: its power felt from within, mature and receptive.'),
 'King': ('Seated king', 'He sits in authority holding the suit: its power mastered and directed outward.'),
}
COURT_ITEM = {
 'Wands': 'The great club he or she holds is the same living wood as the Ace, now in human hands.',
 'Cups': 'The cup held shows how this person carries feeling: offered, guarded, studied or ruled.',
 'Swords': 'The sword held shows how this person uses thought and decision.',
 'Pentacles': 'The coin held shows this person\'s relationship with money, work and the material world.',
}
RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King']
out = []
for suit, (fr, motif, where, mean) in SUIT.items():
    for i, r in enumerate(RANKS):
        name = f'{r} of {suit}'
        if i == 0:
            syms = [{'feature': f, 'where': w, 'meaning': m} for f, w, m in ACES[suit]]
        elif i < 10:
            n = i + 1
            extra = CENTER[suit] if n % 2 else EVEN[suit]
            syms = [{'feature': motif, 'where': where, 'meaning': mean},
                    {'feature': f'{n} {fr.lower()}', 'where': 'the count', 'meaning': NUM[n]},
                    {'feature': extra[0], 'where': 'center of the pattern', 'meaning': extra[1]},
                    {'feature': 'Flowers and leaves', 'where': 'woven between the suit signs', 'meaning': 'Life growing through the pattern. In the Marseille pips, the flourishes soften or energize the number.'}]
        else:
            f, m = COURT[r]
            syms = [{'feature': f, 'where': 'center', 'meaning': m},
                    {'feature': f'The {fr.lower()[:-1] if fr.endswith("s") else fr.lower()} in hand', 'where': 'held by the figure', 'meaning': COURT_ITEM[suit]},
                    {'feature': 'Rich clothing in red, blue and yellow', 'where': 'the figure', 'meaning': 'The Marseille colors: red for action and passion, blue for receptivity and spirit, yellow for light and intelligence.'}]
        out.append({'name': name, 'symbols': syms})
json.dump(out, open(os.path.join(ROOT, 'data', 'tarot-symbols-marseille-2.json'), 'w'), indent=1, ensure_ascii=False)
print(len(out), 'cards')
