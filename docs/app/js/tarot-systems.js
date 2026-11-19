/* ---------- BUILT-IN DECKS: Rider–Waite–Smith, Tarot de Marseille and Thoth ----------
   Every card keeps its Rider–Waite–Smith name as its identity (TAROT_DECK, the Journal and Card Stats use it).
   Each deck adds its own title for the card, its own picture, back, meanings and symbols.
   Thoth's paintings are still under copyright, so its cards show plain title faces made here. */
TAROT_DECK.forEach(c => { c.code = (c.img.match(/([a-z]\d\d)\.jpg$/) || [])[1]; c.imgRWS = c.imgRWS || c.img; });

const ROMAN = n => ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'][n];
const RANK_WORDS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];
const cardIndex = name => TAROT_DECK.findIndex(c => c.name === name);
const cardRank = c => RANK_WORDS.indexOf(c.name.split(' ')[0]);

// Marseille: Strength is XI and Justice VIII, numbers are written the old way (IIII, VIIII), suits are Batons, Cups, Swords, Coins
const TDM_MAJOR = [['', 'The Fool', 'Le Mat'], ['I', 'The Magician', 'Le Bateleur'], ['II', 'The Popess', 'La Papesse'], ['III', 'The Empress', "L'Impératrice"], ['IIII', 'The Emperor', "L'Empereur"],
  ['V', 'The Pope', 'Le Pape'], ['VI', 'The Lover', "L'Amoureux"], ['VII', 'The Chariot', 'Le Chariot'], ['XI', 'Strength', 'La Force'], ['VIIII', 'The Hermit', "L'Hermite"],
  ['X', 'The Wheel of Fortune', 'La Roue de Fortune'], ['VIII', 'Justice', 'La Justice'], ['XII', 'The Hanged Man', 'Le Pendu'], ['XIII', 'The Nameless Arcanum', ''], ['XIIII', 'Temperance', 'Tempérance'],
  ['XV', 'The Devil', 'Le Diable'], ['XVI', 'The House of God', 'La Maison Dieu'], ['XVII', 'The Star', "L'Étoile"], ['XVIII', 'The Moon', 'La Lune'], ['XVIIII', 'The Sun', 'Le Soleil'],
  ['XX', 'Judgement', 'Le Jugement'], ['XXI', 'The World', 'Le Monde']];
const TDM_SUIT = { Wands: 'Batons', Cups: 'Cups', Swords: 'Swords', Pentacles: 'Coins' };
const TDM_COURT = { Page: 'Valet', Knight: 'Knight', Queen: 'Queen', King: 'King' };

// Thoth: Lust is XI, Adjustment VIII; Disks for Pentacles; the courts are Princess, Prince, Queen and Knight
const THOTH_MAJOR = ['The Fool', 'The Magus', 'The Priestess', 'The Empress', 'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot', 'Lust', 'The Hermit', 'Fortune', 'Adjustment',
  'The Hanged Man', 'Death', 'Art', 'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'The Aeon', 'The Universe'];
const THOTH_NUM = [0, 1, 2, 3, 4, 5, 6, 7, 11, 9, 10, 8, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const THOTH_SUIT = { Wands: 'Wands', Cups: 'Cups', Swords: 'Swords', Pentacles: 'Disks' };
const THOTH_COURT = { Page: 'Princess', Knight: 'Prince', Queen: 'Queen', King: 'Knight' };
const THOTH_TITLES = {
  Wands: ['Dominion', 'Virtue', 'Completion', 'Strife', 'Victory', 'Valour', 'Swiftness', 'Strength', 'Oppression'],
  Cups: ['Love', 'Abundance', 'Luxury', 'Disappointment', 'Pleasure', 'Debauch', 'Indolence', 'Happiness', 'Satiety'],
  Swords: ['Peace', 'Sorrow', 'Truce', 'Defeat', 'Science', 'Futility', 'Interference', 'Cruelty', 'Ruin'],
  Pentacles: ['Change', 'Works', 'Power', 'Worry', 'Success', 'Failure', 'Prudence', 'Gain', 'Wealth'],
};

/* ----- Thoth title faces and the generic backs ----- */
const svgURL = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const SUIT_LOOK = { Major: ['#2b1846', '#0f0820', '#e7c66d'], Wands: ['#5a1a10', '#1d0806', '#f0a54a'], Cups: ['#123a5c', '#06121f', '#8fd0f0'], Swords: ['#4a4a2a', '#15150b', '#f2e27a'], Pentacles: ['#1f4426', '#09170c', '#cfe08a'] };
function suitGlyph(arc, col) {
  if (arc === 'Wands') return `<g stroke="${col}" stroke-width="7" stroke-linecap="round" fill="none"><line x1="150" y1="330" x2="150" y2="200"/><path d="M150 196c-14-18 6-30 0-52 18 16 22 34 0 52z" fill="${col}" stroke="none"/></g>`;
  if (arc === 'Cups') return `<g fill="none" stroke="${col}" stroke-width="6" stroke-linejoin="round"><path d="M112 190h76c0 48-16 70-38 74-22-4-38-26-38-74z"/><line x1="150" y1="264" x2="150" y2="306"/><path d="M124 316h52"/></g>`;
  if (arc === 'Swords') return `<g stroke="${col}" stroke-width="6" stroke-linecap="round" fill="none"><line x1="150" y1="170" x2="150" y2="300"/><line x1="122" y1="290" x2="178" y2="290"/><line x1="150" y1="300" x2="150" y2="330"/><circle cx="150" cy="336" r="6" fill="${col}"/></g>`;
  if (arc === 'Pentacles') return `<g fill="none" stroke="${col}" stroke-width="5"><circle cx="150" cy="250" r="56"/><circle cx="150" cy="250" r="22"/>${Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return `<line x1="${(150 + 22 * Math.cos(a)).toFixed(1)}" y1="${(250 + 22 * Math.sin(a)).toFixed(1)}" x2="${(150 + 56 * Math.cos(a)).toFixed(1)}" y2="${(250 + 56 * Math.sin(a)).toFixed(1)}"/>`; }).join('')}</g>`;
  return `<g fill="none" stroke="${col}" stroke-width="3"><circle cx="150" cy="250" r="62"/><circle cx="150" cy="250" r="44" opacity=".6"/><path d="M150 196l12 40 40 14-40 14-12 40-12-40-40-14 40-14z" fill="${col}" fill-opacity=".85" stroke="none"/></g>`;
}
function thothFace(c) {
  const i = cardIndex(c.name), [bg1, bg2, col] = SUIT_LOOK[c.arcana];
  let top, title, sub;
  if (c.arcana === 'Major') { top = ROMAN(THOTH_NUM[i]); title = THOTH_MAJOR[i]; sub = 'Major Arcana'; }
  else {
    const r = cardRank(c), s = THOTH_SUIT[c.arcana];
    if (r === 0) { top = 'Ace'; title = 'Ace of ' + s; sub = 'Root of the element'; }
    else if (r < 10) { top = String(r + 1); title = THOTH_TITLES[c.arcana][r - 1]; sub = `${RANK_WORDS[r]} of ${s}`; }
    else { top = THOTH_COURT[RANK_WORDS[r]]; title = `${THOTH_COURT[RANK_WORDS[r]]} of ${s}`; sub = 'Court card'; }
  }
  const T = String(title).toUpperCase(), fs = T.length > 16 ? 19 : T.length > 11 ? 23 : 28;
  const esc2 = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 518"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
<rect width="300" height="518" fill="url(#g)"/><rect x="10" y="10" width="280" height="498" rx="12" fill="none" stroke="${col}" stroke-width="2.5"/><rect x="20" y="20" width="260" height="478" rx="8" fill="none" stroke="${col}" stroke-width=".8" opacity=".6"/>
<text x="150" y="78" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="${col}">${esc2(top)}</text>
${suitGlyph(c.arcana, col)}
<text x="150" y="410" text-anchor="middle" font-family="Georgia,serif" font-size="${fs}" letter-spacing="1.5" fill="${col}">${esc2(T)}</text>
<text x="150" y="444" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-style="italic" fill="${col}" opacity=".8">${esc2(sub)}</text>
<text x="150" y="486" text-anchor="middle" font-family="Georgia,serif" font-size="11" letter-spacing="3" fill="${col}" opacity=".55">THOTH</text></svg>`);
}
const THOTH_BACK = svgURL(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 518"><defs><radialGradient id="b" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#1d3b4a"/><stop offset="1" stop-color="#07131a"/></radialGradient></defs>
<rect width="300" height="518" fill="url(#b)"/><rect x="10" y="10" width="280" height="498" rx="12" fill="none" stroke="#c9a85a" stroke-width="2.5"/>
${Array.from({ length: 7 }, (_, k) => `<circle cx="150" cy="259" r="${24 + k * 16}" fill="none" stroke="#c9a85a" stroke-width="${k % 2 ? .7 : 1.4}" opacity="${1 - k * .1}"/>`).join('')}
${Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8; return `<line x1="${(150 + 24 * Math.cos(a)).toFixed(1)}" y1="${(259 + 24 * Math.sin(a)).toFixed(1)}" x2="${(150 + 120 * Math.cos(a)).toFixed(1)}" y2="${(259 + 120 * Math.sin(a)).toFixed(1)}" stroke="#c9a85a" stroke-width=".6" opacity=".5"/>`; }).join('')}
<circle cx="150" cy="259" r="10" fill="#c9a85a"/></svg>`);

const SYSTEMS = {
  rws: {
    id: 'rws', name: 'Rider–Waite–Smith', blurb: 'Illustrated by Pamela Colman Smith in 1909. Every card has a full picture scene.',
    credit: 'Rider–Waite–Smith artwork by Pamela Colman Smith (1909), public domain.',
    title: c => c.name, img: c => c.imgRWS, back: () => DEFAULT_BACK,
    M: () => window.TAROT_MEANINGS || {}, S: () => window.TAROT_SYMBOLS || {},
  },
  marseille: {
    id: 'marseille', name: 'Tarot de Marseille', blurb: 'The classic French pattern, here in the 1890s Camoin edition of Nicolas Conver’s 1760 design. The numbered cards show patterns rather than scenes.',
    credit: 'Tarot de Marseille: A. Camoin edition (Marseille, 1890–1900) of Nicolas Conver’s design, Bibliothèque nationale de France, via Wikimedia Commons, public domain.',
    title: c => { const i = cardIndex(c.name); if (c.arcana === 'Major') { const [n, en, fr] = TDM_MAJOR[i]; return `${n ? n + ' · ' : ''}${en}${fr ? ` (${fr})` : ''}`; } const r = cardRank(c), w = RANK_WORDS[r]; return `${TDM_COURT[w] || w} of ${TDM_SUIT[c.arcana]}`; },
    img: c => `img/tarot-marseille/${c.code}.jpg`, back: () => 'img/tarot-marseille/back.jpg',
    M: () => window.MARSEILLE_MEANINGS || {}, S: () => window.MARSEILLE_SYMBOLS || {},
  },
  thoth: {
    id: 'thoth', name: 'Thoth', blurb: 'Designed by Aleister Crowley and painted by Lady Frieda Harris (1938–1943). Its paintings are still under copyright, so the app shows plain title cards. Photograph your own Thoth deck in My Decks to see the real pictures.',
    credit: 'Thoth card names and titles after Aleister Crowley’s Book of Thoth. The card faces here are plain title cards, not the copyrighted paintings by Lady Frieda Harris.',
    title: c => { const i = cardIndex(c.name); if (c.arcana === 'Major') return `${ROMAN(THOTH_NUM[i])} · ${THOTH_MAJOR[i]}`; const r = cardRank(c), s = THOTH_SUIT[c.arcana]; if (r === 0) return `Ace of ${s}`; if (r < 10) return `${RANK_WORDS[r]} of ${s}: ${THOTH_TITLES[c.arcana][r - 1]}`; return `${THOTH_COURT[RANK_WORDS[r]]} of ${s}`; },
    img: c => thothFace(c), back: () => THOTH_BACK,
    M: () => window.THOTH_MEANINGS || {}, S: () => window.THOTH_SYMBOLS || {},
  },
};
const SYSTEM_IDS = ['rws', 'marseille', 'thoth'];
const sysOf = id => SYSTEMS[id] || SYSTEMS.rws;
// which deck the app is using: a built-in one ("sys:<id>"), or one of the person's own decks with its chosen system
function activeSystemId() {
  const a = (typeof Store !== 'undefined' && Store.settings && Store.settings.activeDeck) || '';
  if (a.startsWith('sys:')) return SYSTEMS[a.slice(4)] ? a.slice(4) : 'rws';
  const d = typeof Decks !== 'undefined' && Decks.get(a);
  return (d && SYSTEMS[d.system] && d.system) || 'rws';
}
// a card's name in a deck, with or without its number
function cardTitle(name, sys) { const c = TAROT_BY_NAME[name]; return c ? sysOf(sys || activeSystemId()).title(c) : String(name || ''); }
const cardShortTitle = (name, sys) => cardTitle(name, sys).replace(/^[0IVXL]+ · /, '');
// a card's picture in a deck: the active deck's (with the person's own photos), or any built-in deck's
function cardImg(name, sys) { const c = TAROT_BY_NAME[name]; if (!c) return ''; return !sys || sys === activeSystemId() ? c.img : sysOf(sys).img(c); }
const meaningsFor = sys => { const m = sysOf(sys).M(); return Object.keys(m).length ? m : SYSTEMS.rws.M(); };
const symbolsFor = sys => sysOf(sys).S();
