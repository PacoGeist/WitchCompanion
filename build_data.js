// Bundles all JSON content + timing + image paths into www/js/data.js
const fs = require('fs'), D = __dirname + '/data/';
const J = f => JSON.parse(fs.readFileSync(D + f));
const timing = { ...J('timing-herbs.json'), ...J('timing-spells.json'), ...J('timing-formulas.json') };
const hc = fs.existsSync(__dirname + '/www/img/herbs/credits.json') ? JSON.parse(fs.readFileSync(__dirname + '/www/img/herbs/credits.json')) : {};
const cc = fs.existsSync(__dirname + '/www/img/crystals/credits.json') ? JSON.parse(fs.readFileSync(__dirname + '/www/img/crystals/credits.json')) : {};
const lic = l => !l ? 'all rights reserved' : l.toUpperCase().replace(/^CC-?/, 'CC ').replace(/-/g, ' ');
const SEED = {
  herb: [...J('herbs-a.json'), ...J('herbs-b.json'), ...J('herbs-c.json'), ...J('herbs-d.json'), ...(fs.existsSync(D + 'herbs-e.json') ? J('herbs-e.json') : [])],
  crystal: J('crystals.json'), spell: J('spells.json'), sigil: J('sigils.json'), oil: J('oils.json'), incense: J('incense.json'),
  tincture: J('tinctures.json'), brew: J('brews.json'), tarot: J('tarot.json'),
  deity: [...J('deities-a.json'), ...J('deities-b.json')],
};
const dc = fs.existsSync(__dirname + '/www/img/deities/credits.json') ? JSON.parse(fs.readFileSync(__dirname + '/www/img/deities/credits.json')) : {};
// expansion files: <name>-2.json
for (const [t, f] of [['crystal', 'crystals'], ['spell', 'spells'], ['sigil', 'sigils'], ['oil', 'oils'], ['incense', 'incense'], ['tincture', 'tinctures'], ['brew', 'brews'], ['tarot', 'tarot']])
  for (const n of [2, 3]) if (fs.existsSync(D + f + '-' + n + '.json')) SEED[t].push(...J(f + '-' + n + '.json'));
// candle magic spells
if (fs.existsSync(D + 'spells-candle.json')) SEED.spell.push(...J('spells-candle.json'));
// oils: formulas, plus single essential oils and carrier/base oils
for (const f of ['oils-essential.json', 'oils-carrier.json']) if (fs.existsSync(D + f)) SEED.oil.push(...J(f));
SEED.oil.forEach(o => { if (!o.kind) o.kind = 'formula'; });
for (const t in SEED) { const ids = new Set(); SEED[t].forEach(it => { if (ids.has(it.id)) throw new Error('duplicate id ' + it.id); ids.add(it.id); }); }
let missing = 0;
for (const t in SEED) SEED[t].forEach(it => {
  delete it.type;
  const tm = timing[it.id];
  if (tm) { if (!it.bestTime) it.bestTime = tm.bestTime; if (!it.moonPhases) it.moonPhases = tm.moonPhases; }
  else if (!it.bestTime) { missing++; console.warn('no timing', it.id); }
  if (t === 'herb' && hc[it.id] && fs.existsSync(__dirname + `/www/img/herbs/${it.id}.jpg`)) { it.image = `img/herbs/${it.id}.jpg`; it.credit = hc[it.id].credit || `${hc[it.id].attribution.replace(/\s*\(CC[^)]*\)|, some rights reserved|, all rights reserved/gi, '')} · ${lic(hc[it.id].license)} · iNaturalist`; }
  if (t === 'deity' && dc[it.id] && fs.existsSync(__dirname + `/www/img/deities/${it.id}.jpg`)) { const c = dc[it.id]; it.image = `img/deities/${it.id}.jpg`; it.credit = c.credit || `${c.title ? c.title + ' — ' : ''}${c.creator || 'unknown'} · ${lic(c.license)} ${c.license_version || ''} · ${c.via}`.replace(/\s+/g, ' '); }
  if (t === 'deity' && !it.image) it.image = 'art:' + ({ 'deity-arianrhod': 'silverwheel', 'deity-frigg': 'spindle', 'deity-hel': 'halfface', 'deity-odin': 'eye' }[it.id] || 'deity');
  if (t === 'crystal' && cc[it.id] && fs.existsSync(__dirname + `/www/img/crystals/${it.id}.jpg`)) { const c = cc[it.id]; it.image = `img/crystals/${it.id}.jpg`; it.credit = c.credit || `${c.creator || 'unknown'} · ${lic(c.license)} ${c.license_version || ''} · via ${c.via || 'Openverse'}`.replace(/\s+/g, ' '); }
});
// single oils: their own plant photo if we have one, otherwise the photo of the linked herb
const oc = fs.existsSync(__dirname + '/www/img/oils/credits.json') ? JSON.parse(fs.readFileSync(__dirname + '/www/img/oils/credits.json')) : {};
SEED.oil.forEach(o => { const c = oc[o.id]; if (c && fs.existsSync(__dirname + `/www/img/oils/${o.id}.jpg`)) { o.image = `img/oils/${o.id}.jpg`; o.credit = (c.credit || `${String(c.attribution || '').replace(/\s*\(CC[^)]*\)|, some rights reserved|, all rights reserved/gi, '')} · ${lic(c.license)} · iNaturalist`) + ' (the plant)'; } });
SEED.oil.forEach(o => { if (o.kind !== 'formula' && o.herb && !o.image) { const h = SEED.herb.find(x => x.id === o.herb); if (h && h.image) { o.image = h.image; o.credit = h.credit + ' (the plant)'; } } });
fs.writeFileSync(__dirname + '/www/js/data.js', 'window.SEED=' + JSON.stringify(SEED) + ';window.WITCH_LESSONS=' + JSON.stringify(J('witch-lessons.json')) + ';window.CANDLE_LESSONS=' + JSON.stringify(J('candle-lessons.json')) + ';window.CANDLE_DRESSINGS=' + JSON.stringify(J('candle-dressings.json')) + ';');
console.log(Object.entries(SEED).map(([k, v]) => k + ':' + v.length).join(' '), 'missing timing', missing, Math.round(fs.statSync(__dirname + '/www/js/data.js').size / 1024) + 'KB');
// tarot interpretations + position contexts
{
  const M = {}; for (let i = 1; i <= 6; i++) for (const c of J(`tarot-meanings-${i}.json`)) M[c.name] = c;
  const SY = {}; for (let i = 1; i <= 6; i++) for (const c of J(`tarot-symbols-${i}.json`)) SY[c.name] = c.symbols;
  fs.writeFileSync(__dirname + '/www/js/tarot-meanings.js', 'window.TAROT_MEANINGS=' + JSON.stringify(M) + ';window.POS_CTX=' + JSON.stringify(J('tarot-position-context.json')) + ';window.TAROT_SYMBOLS=' + JSON.stringify(SY) + ';window.SYMBOL_DICT=' + JSON.stringify(J('tarot-symbol-dictionary.json')) + ';window.TAROT_LESSONS=' + JSON.stringify(J('tarot-lessons.json')) + ';window.TAROT_TONE=' + JSON.stringify(J('tarot-tone.json')) + ';');
  console.log('symbols for', Object.keys(SY).length, 'cards');
  console.log('tarot meanings', Object.keys(M).length, Math.round(fs.statSync(__dirname + '/www/js/tarot-meanings.js').size / 1024) + 'KB');
}
