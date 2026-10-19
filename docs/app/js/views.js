/* Pages */
const DIV = `<div class="divider">${ART.divider}</div>`;
const WEEKDAYS = [
  ['Sunday', 'Sun', 'success, vitality, fame, healing, joy', 'gold, yellow, orange'],
  ['Monday', 'Moon', 'intuition, dreams, psychic work, home, fertility', 'silver, white, pale blue'],
  ['Tuesday', 'Mars', 'courage, strength, victory, protection, passion', 'red'],
  ['Wednesday', 'Mercury', 'communication, study, travel, divination, luck', 'orange, purple, grey'],
  ['Thursday', 'Jupiter', 'prosperity, money, expansion, legal matters', 'green, royal blue'],
  ['Friday', 'Venus', 'love, beauty, friendship, pleasure, harmony', 'pink, green'],
  ['Saturday', 'Saturn', 'banishing, binding, protection, endings, ancestors', 'black, indigo'],
];

function rowHTML(it, extra = '') {
  const sub = it.type === 'herb' ? (it.latin || '') + (arr(it.folkNames).length ? ' · ' + arr(it.folkNames).slice(0, 2).join(', ') : '')
    : it.type === 'crystal' ? (arr(it.folkNames)[0] || it.colors || '') : it.type === 'deity' ? [it.title, it.pantheon].filter(Boolean).join(' · ') : (it.description || '');
  return `<a class="row" href="#/view/${encodeURIComponent(it.id)}">
    <div class="thumb">${pictureHTML(it)}</div>
    <div class="txt"><div class="nm">${esc(it.name)}</div><div class="sb">${extra || esc(sub)}</div></div>
    ${Store.favs.has(it.id) ? `<span class="fav">${ART.starFill}</span>` : ''}
  </a>`;
}
function chipsHTML(list, cls = '', link = true) {
  return `<div class="chips">${arr(list).map(k => link ? `<a class="chip ${cls}" href="#/search?k=1&q=${encodeURIComponent(k)}">${esc(k)}</a>` : `<span class="chip ${cls}">${esc(k)}</span>`).join('')}</div>`;
}
function phaseChips(list) {
  return `<div class="chips">${arr(list).map(p => {
    const f = p === 'Dark Moon' ? 0.995 : ({ 'New Moon': 0.0, 'Waxing Crescent': .14, 'First Quarter': .25, 'Waxing Gibbous': .37, 'Full Moon': .5, 'Waning Gibbous': .63, 'Last Quarter': .75, 'Waning Crescent': .86 }[p] ?? .5);
    return `<a class="chip gold" href="#/phase/${encodeURIComponent(p)}"><span style="width:18px;height:18px;display:inline-block">${MOON.svg(f, 18)}</span>${esc(p)}</a>`;
  }).join('')}</div>`;
}
function timingBlock(it) {
  if (!it.bestTime && !arr(it.moonPhases).length && !it.timing) return '';
  return `<div class="block frame"><h3>${ART.moon} Best Time to Work</h3>
    ${it.bestTime ? `<p><b class="fell">Time of year:</b> ${esc(it.bestTime)}</p>` : ''}
    ${arr(it.moonPhases).length ? `<p style="margin-bottom:4px"><b class="fell">Moon phase:</b></p>${phaseChips(it.moonPhases)}` : ''}
    ${it.timing ? `<p class="small muted" style="margin-top:8px">${esc(it.timing)}</p>` : ''}
  </div>`;
}

/* ---------- HOME ---------- */
/* home grid tiles: order and visibility can be changed in Settings */
const HOME_TILES = [
  ['spell', 'Spells'], ['tarot', 'Tarot'], ['moon', 'Moon Tracker'], ['oil', 'Oils'], ['incense', 'Incense'], ['tincture', 'Tinctures'],
  ['brew', 'Brews'], ['herb', 'Herbs'], ['crystal', 'Crystals'], ['candles', 'Candles'], ['sigil', 'Sigils'], ['more', 'More'],
  ['deity', 'Deities'], ['journal', 'Journal'], ['favs', 'Favourites'],
  ['craft', 'Learn Witchcraft'],
];
const HOME_DEFAULT_HIDDEN = ['craft'];
function homeTileOrder() {
  // Herb Tables left the home page in v3.9; Candles takes its place in a saved order
  const saved = arr(Store.settings.homeOrder).map(k => k === 'tables' ? 'candles' : k).filter(k => HOME_TILES.some(t => t[0] === k));
  return [...saved, ...HOME_TILES.map(t => t[0]).filter(k => !saved.includes(k))];
}
const homeTileHidden = () => Array.isArray(Store.settings.homeHidden) ? Store.settings.homeHidden : HOME_DEFAULT_HIDDEN;
route('', async v => {
  setTitle('', false);
  await Craft.load();
  const now = new Date(), m = MOON.current(now);
  const next = MOON.phasesBetween(now, new Date(now.getTime() + 40 * 864e5)).slice(0, 2);
  const wd = WEEKDAYS[now.getDay()];
  const nowPhase = m.dark ? 'Dark Moon' : m.name;
  const forPhase = Store.all().filter(i => arr(i.moonPhases).includes(nowPhase) && i.type !== 'herb' && i.type !== 'crystal');
  const pick = forPhase.length ? forPhase[(now.getDate() * 7) % forPhase.length] : null;
  const favs = [...Store.favs].map(id => Store.get(id)).filter(Boolean);
  const T = t => `<a class="tile" href="${t === 'tarot' ? '#/tarot' : '#/list/' + t}">${ART[TYPES[t].art]}<b>${t === 'tarot' ? 'Tarot' : TYPES[t].label}</b><span>${t === 'tarot' ? 'readings, layouts & more' : Store.all(t).length + ' entries'}</span></a>`;
  const jAll = Journal.list.length + Workings.list.length, jWait = [...Journal.list, ...Workings.list].filter(e => !e.results && !e.outcome).length;
  const extra = {
    moon: `<a class="tile" href="#/moon">${ART.triplemoon}<b>Moon Tracker</b><span>phases & full moons</span></a>`,
    tables: `<a class="tile" href="#/tables/meta">${ART.table}<b>Herb Tables</b><span>by magical & medical use</span></a>`,
    candles: `<a class="tile" href="#/candles">${ART.candle}<b>Candles</b><span>basics, spells & dressings</span></a>`,
    more: `<a class="tile" href="#/more">${ART.pentacle}<b>More</b><span>settings, backup</span></a>`,
    learn: `<a class="tile" href="#/learn">${ART.book}<b>Learn Tarot</b><span>cards, symbols & lessons</span></a>`,
    deck: `<a class="tile" href="#/deck">${ART.tarot}<b>The Deck</b><span>all 78 cards</span></a>`,
    record: `<a class="tile" href="#/record">${ART.edit}<b>Record Reading</b><span>from your own deck</span></a>`,
    journal: `<a class="tile" href="#/journal">${ART.book}<b>Journal</b><span>${jWait ? `${jWait} awaiting results` : `${jAll} entr${jAll === 1 ? 'y' : 'ies'}`}</span></a>`,
    favs: `<a class="tile" href="#/favorites">${ART.star}<b>Favourites</b><span>${Store.favs.size} saved</span></a>`,
    craft: `<a class="tile" href="#/craft">${ART.pentacle}<b>Learn Witchcraft</b><span>${Craft.count()} of ${Craft.lessons().length} lessons</span></a>`,
  };
  const tiles = homeTileOrder().filter(k => !homeTileHidden().includes(k)).map(k => extra[k] || (TYPES[k] ? T(k) : '')).filter(Boolean);
  v.innerHTML = `
    <div class="hero"><h1>${esc(Store.settings.title || "Paco Morningstar's Witches' Companion")}</h1><div class="sub">${esc(Store.settings.motto || 'A grimoire of herb, stone, smoke & starlight')}</div></div>
    ${DIV}
    <a class="frame moonbox" href="#/moon" style="color:inherit">
      <div class="moonpic">${MOON.photo(m.fraction, 86)}</div>
      <div><div class="ph">${m.dark ? 'Dark Moon · ' : ''}${esc(m.name)}</div>
      <p>${Math.round(m.illum * 100)}% illuminated · ${m.waxing ? 'waxing' : 'waning'}</p>
      ${next.map(p => `<p class="small">${esc(p.phase)}${p.moonName ? ` (${esc(p.moonName)})` : ''}: <b style="color:var(--gold2)">${fmtDate(p.date)}</b></p>`).join('')}</div>
    </a>
    <div class="frame" style="margin-top:12px">
      <h3>${esc(wd[0])} · Day of ${esc(wd[1])}</h3>
      <p class="small" style="margin:6px 0 2px">Favoured workings: <i>${esc(wd[2])}</i></p>
      <p class="small muted" style="margin:0">Candle colours: ${esc(wd[3])}</p>
      <p class="small" style="margin:8px 0 0"><a href="#/reading/tarot-daily-three">✶ Draw today's three cards — what you need to know today ›</a></p>
      ${pick ? `<p class="small" style="margin:8px 0 0">For tonight's ${esc(nowPhase)}: <a href="#/view/${pick.id}">${esc(pick.name)}</a> · <a href="#/phase/${encodeURIComponent(nowPhase)}">see all ${forPhase.length}</a></p>` : ''}
    </div>
    <div class="section-title"><h2>The Grimoire</h2></div>
    <div class="grid home-grid">${tiles.join('')}</div>
    ${favs.length ? `<div class="section-title"><h2>Favourites</h2></div><div class="list">${favs.slice(0, 8).map(i => rowHTML(i)).join('')}</div>` : ''}
    ${craftBannerHTML()}
    ${DIV}<p class="disclaimer">Folk & traditional lore for spiritual practice. Not medical advice — consult a qualified practitioner before using any herb medicinally.</p>`;
});

/* ---------- LIST ---------- */
route('list/:type', async (v, [type], q) => {
  const T = TYPES[type]; if (!T) return (location.hash = '#/');
  setTitle(T.label);
  const OIL_KINDS = [['formula', 'Formulary Oils', 'Oils you make: anointing, altar & condition oils'], ['essential', 'Essential Oils', 'Single essential oils and their magic'], ['carrier', 'Carrier & Base Oils', 'The base oils every blend is built on']];
  let oilKind = type === 'oil' ? (OIL_KINDS.some(k => k[0] === q.o) ? q.o : 'formula') : '';
  const allItems = Store.all(type);
  let items = type === 'oil' ? allItems.filter(i => (i.kind || 'formula') === oilKind) : allItems;
  const kwCount = {};
  items.forEach(i => arr(i.metaphysical).forEach(k => kwCount[k] = (kwCount[k] || 0) + 1));
  const topKw = Object.entries(kwCount).sort((a, b) => b[1] - a[1]).slice(0, 24).map(e => e[0]);
  const m = MOON.current(); const nowPhase = m.dark ? 'Dark Moon' : m.name;
  let filter = q.f || '', kw = q.k || '', phaseOnly = q.p === '1', dailyOnly = q.d === '1', holOnly = q.h === '1';
  const isDaily = i => /daily|card of the day|today/i.test(i.name + ' ' + i.id);
  const HOL_BD = ['newyear', 'valentine', 'shamrock', 'spring', 'easter', 'summer', 'autumn', 'halloween', 'harvest', 'winter', 'yuletide'];
  const isHoliday = i => HOL_BD.includes(i.backdrop);
  v.innerHTML = `
    <div class="searchbar">${ART.search}<input id="lf" type="search" placeholder="Search ${esc(T.label.toLowerCase())}…" value="${esc(filter)}"></div>
    <div class="chips scroll" id="kws"><button class="chip gold ${phaseOnly ? 'on' : ''}" data-phase>${esc(nowPhase)} now</button>${topKw.map(k => `<button class="chip ${k === kw ? 'on' : ''}" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>
    ${type === 'oil' ? `<div class="oil-tabs" id="otabs">${OIL_KINDS.map(([k, l]) => `<button class="btn ${k === oilKind ? 'primary' : ''}" data-o="${k}">${l} <span class="small">(${allItems.filter(i => (i.kind || 'formula') === k).length})</span></button>`).join('')}</div><p class="small muted center" style="margin:2px 0 6px">${esc(OIL_KINDS.find(k => k[0] === oilKind)[2])}</p>` : ''}
    ${(() => { const src = type === 'oil' ? (oilKind === 'formula' ? 'oil' : oilKind === 'essential' ? 'eo' : 'carrier') : type; return TABLE_SOURCES[src] ? `<div class="actions" style="margin:6px 0 10px"><a class="btn small ghost" href="#/tables/meta?s=${src}">${ART.table} Magical uses table</a>${TABLE_SOURCES[src].med ? `<a class="btn small ghost" href="#/tables/med?s=${src}">${ART.table} Medical uses table</a>` : ''}</div>` : ''; })()}
    ${type === 'tarot' ? `<div class="daily-row"><button class="btn ${dailyOnly ? 'primary' : ''} daily-btn" id="dailyBtn">${ART.sun} Daily <span class="small">(${items.filter(isDaily).length})</span></button><button class="btn ${holOnly ? 'primary' : ''} daily-btn" id="holBtn">${ART.leaf} Holiday &amp; Seasonal <span class="small">(${items.filter(isHoliday).length})</span></button></div>` : ''}
    ${type === 'tarot' ? `<div class="actions" style="margin:6px 0 10px"><a class="btn small ghost" href="#/journal?t=tarot">${ART.book} Tarot Journal</a><a class="btn small ghost" href="#/record">${ART.edit} Record a reading</a><a class="btn small ghost" href="#/deck">${ART.tarot} The Deck</a><a class="btn small ghost" href="#/learn">${ART.book} Learn Tarot</a></div>` : ''}
    <div class="count" id="cnt"></div><div class="list" id="lst"></div>
    <a class="fab" href="#/edit/${type}${type === 'oil' && oilKind !== 'formula' ? '?kind=' + oilKind : ''}" aria-label="Add">${ART.plus}</a>`;
  const ot = $('#otabs', v); if (ot) ot.onclick = e => { const b = e.target.closest('[data-o]'); if (b) location.hash = `#/list/oil?o=${b.dataset.o}`; };
  const draw = () => {
    let list = items;
    if (filter) { const r = search(filter, { types: [type] }); list = r.map(x => x.it).filter(i => !oilKind || (i.kind || 'formula') === oilKind); }
    if (kw) list = list.filter(i => arr(i.metaphysical).includes(kw));
    if (phaseOnly) list = list.filter(i => arr(i.moonPhases).includes(nowPhase));
    if (dailyOnly) list = list.filter(isDaily);
    if (holOnly) list = list.filter(isHoliday).sort((a, b) => HOL_BD.indexOf(a.backdrop) - HOL_BD.indexOf(b.backdrop));
    $('#cnt', v).textContent = `${list.length} ${oilKind ? ({ formula: 'formulary oil', essential: 'essential oil', carrier: 'carrier oil' }[oilKind] + (list.length === 1 ? '' : 's')) : list.length === 1 ? T.one.toLowerCase() : T.label.toLowerCase()}`;
    $('#lst', v).innerHTML = list.length ? list.map(i => rowHTML(i, filter ? snippet(i, filter) : '')).join('') : `<div class="empty">${ART[T.art]}Nothing found in the shadows…</div>`;
    history.replaceState(null, '', `#/list/${type}?${oilKind ? 'o=' + oilKind + '&' : ''}f=${encodeURIComponent(filter)}&k=${encodeURIComponent(kw)}&p=${phaseOnly ? 1 : ''}&d=${dailyOnly ? 1 : ''}&h=${holOnly ? 1 : ''}`);
  };
  $('#lf', v).addEventListener('input', e => { filter = e.target.value; draw(); });
  const db = $('#dailyBtn', v), hb = $('#holBtn', v);
  if (db) db.onclick = () => { dailyOnly = !dailyOnly; holOnly = false; db.classList.toggle('primary', dailyOnly); hb.classList.remove('primary'); draw(); };
  if (hb) hb.onclick = () => { holOnly = !holOnly; dailyOnly = false; hb.classList.toggle('primary', holOnly); db.classList.remove('primary'); draw(); };
  $('#kws', v).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.phase !== undefined) { phaseOnly = !phaseOnly; b.classList.toggle('on', phaseOnly); }
    else { kw = kw === b.dataset.k ? '' : b.dataset.k; $$('#kws [data-k]', v).forEach(x => x.classList.toggle('on', x.dataset.k === kw)); }
    draw();
  });
  draw();
});

/* ---------- DETAIL ---------- */
// ---- safety: banner at the top of a page, full safety block at the bottom ----
function safetyBanner(it) {
  if (it.toxic) return `<div class="toxic-banner">☠ ${it.type === 'crystal' ? 'Toxic mineral · never in elixirs or drinking water' : 'Poisonous if swallowed'} · keep away from children & pets</div>`;
  if (it.externalOnly) return `<div class="toxic-banner ext-banner">✋ External use only · do not eat or drink</div>`;
  return '';
}
const srcHost = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
function safetyHTML(it, label) {
  const parts = [];
  if (it.caution) parts.push(`<p><b>${label || 'Caution'} · </b>${esc(it.caution)}</p>`);
  if (it.interactions) parts.push(`<p><b>Drug interactions · </b>${esc(it.interactions)}</p>`);
  if (it.pets) parts.push(`<p><b>Pets · </b>${esc(it.pets)}</p>`);
  if (!parts.length) return '';
  const src = arr(it.sources);
  return `<div class="block caution safety"><h3>${ART.hand}Safety</h3>${parts.join('')}
    ${src.length ? `<details class="srcs"><summary>Sources checked (${src.length})</summary><ul>${src.map(u => `<li><b>${esc(srcHost(u))}</b><br><span>${esc(u)}</span></li>`).join('')}</ul></details>` : ''}
    <p class="small muted" style="margin:6px 0 0">Traditional use only, not medical advice. Ask a doctor or pharmacist before using herbs if you are pregnant, nursing, taking medicine or treating a child.</p></div>`;
}

route('view/:id', async (v, [id]) => {
  const it = Store.get(id); if (!it) return (location.hash = '#/');
  const T = TYPES[it.type];
  setTitle(it.type === 'oil' && it.kind === 'essential' ? 'Essential Oil' : it.type === 'oil' && it.kind === 'carrier' ? 'Carrier Oil' : T.one);
  const isFav = Store.favs.has(id);
  const sub = it.type === 'herb' || (it.type === 'oil' && it.latin) ? `<div class="latin">${esc(it.latin || '')}</div>` : it.type === 'crystal' ? `<div class="latin">${esc(it.mineral || '')}</div>` : it.type === 'sigil' && it.origin ? `<div class="latin">${esc(it.origin)}</div>` : it.type === 'deity' ? `<div class="latin">${esc([it.title, it.pantheon].filter(Boolean).join(' · '))}</div>` : '';
  let banner;
  if (it.type === 'sigil') banner = `<div class="banner sigil"><div class="sigil-svg">${it.image && it.image.startsWith('data:') ? `<img src="${it.image}" style="width:100%;height:100%;object-fit:contain">` : (it.svg || ART.eye)}</div></div>`;
  else banner = `<div class="banner">${pictureHTML(it, true)}${(it.type === 'herb' || it.type === 'crystal' || it.type === 'deity' || it.type === 'oil') && it.credit && it.image && !it.image.startsWith('art:') && !it.image.startsWith('data:') ? `<div class="credit">Photo: ${esc(it.credit)}</div>` : ''}</div>`;
  const credit = '';
  let body = '';
  const P = (t, icon, html) => html ? `<div class="block"><h3>${ART[icon] || ''}${t}</h3>${html}</div>` : '';
  const para = s => s ? `<p>${esc(s).replace(/\n/g, '<br>')}</p>` : '';
  const used = (Store.usedIn[id] || []).map(x => Store.get(x)).filter(Boolean);
  const sacred = (Store.sacredTo[id] || []).map(x => Store.get(x)).filter(Boolean);
  const sacredHTML = sacred.length ? P('Sacred to', 'deity', `<div class="chips">${sacred.map(d => `<a class="chip gold" href="#/view/${d.id}">${esc(d.name)}</a>`).join('')}</div>`) : '';
  const usedHTML = sacredHTML + (used.length ? P(`Used in ${used.length} formula${used.length > 1 ? 's' : ''}`, 'cauldron', `<div class="list">${used.map(u => rowHTML(u, `<span class="muted">${TYPES[u.type].one}</span>`)).join('')}</div>`) : '');

  const singleOil = it.type === 'oil' && (it.kind === 'essential' || it.kind === 'carrier');
  if (singleOil) {
    const facts = [['NOTE', it.note], ['EXTRACTION', it.extraction], ['PLANET', it.planet], ['ELEMENT', it.element], ['GENDER', it.gender], ['FROM', it.partsUsed], ['DEITIES', arr(it.deities).join(', ')], ['TEXTURE', it.texture], ['SHELF LIFE', it.shelfLife], ['SUITS', it.skinTypes]].filter(f => f[1]);
    const blend = arr(it.blendsWith).map(n => { const b = Store.all('oil').find(o => o.kind === 'essential' && norm(o.name.replace(/\s*essential oil$/i, '').replace(/\s*\(.*?\)/g, '')).trim() === norm(n.replace(/\s*essential oil$/i, '')).trim()); return b ? `<a class="chip" href="#/view/${b.id}">${esc(n)}</a>` : `<span class="chip">${esc(n)}</span>`; }).join('');
    const herb = it.herb && Store.get(it.herb);
    body = `
      ${safetyBanner(it)}
      ${arr(it.folkNames).length ? `<div class="block"><h3>${ART.book}Also Known As</h3>${chipsHTML(it.folkNames, 'gold', false)}</div>` : ''}
      <div class="facts">${facts.map(f => `<div class="fact"><small>${f[0]}</small><span>${esc(f[1])}</span></div>`).join('')}</div>
      ${it.description ? `<p class="lead">${esc(it.description)}</p>` : ''}
      ${it.aroma ? `<p class="intention">${esc(it.aroma)}</p>` : ''}
      ${DIV}
      ${P('Metaphysical Uses', 'pentacle', chipsHTML(it.metaphysical) + para(it.metaphysicalUses))}
      ${P(it.kind === 'essential' ? 'Aromatherapy & Folk Medicine' : 'Medicinal Uses', 'leaf', (arr(it.medical).length ? chipsHTML(it.medical, 'med') : '') + para(it.medicalUses) + `<p class="disclaimer" style="text-align:left">Traditional and aromatherapy use only — not medical advice.</p>`)}
      ${it.dilution ? `<div class="block frame"><h3>${ART.dropper}Safe Dilution</h3><p>${esc(it.dilution)}</p><p class="small muted" style="margin:0">Always dilute essential oils in a <a href="#/list/oil?o=carrier">carrier oil</a> before they touch skin.</p></div>` : ''}
      ${blend ? P('Blends Well With', 'bottle', `<div class="chips">${blend}</div>`) : ''}
      ${arr(it.uses).length ? P('Ways to Use', 'hand', `<ul class="uses">${arr(it.uses).map(u => `<li>${esc(u)}</li>`).join('')}</ul>`) : ''}
      ${herb ? P('The Plant', 'leaf', `<div class="list">${rowHTML(herb, '<span class="muted">Herb</span>')}</div>`) : ''}
      ${P('Where to Find', 'broom', para(it.whereToFind))}
      ${timingBlock(it)}
      ${safetyHTML(it)}
      ${usedHTML}`;
  } else if (FORMULA_TYPES.includes(it.type)) {
    body = `
      ${safetyBanner(it)}
      ${it.category === 'candle' ? `<a class="chip gold candle-link" href="#/candles">${ART.candle} Candle Magic · basics, dressings & more</a>` : ''}
      ${it.description ? `<p class="lead">${esc(it.description)}</p>` : ''}
      ${it.intention ? `<p class="intention">“${esc(it.intention)}”</p>` : ''}
      ${DIV}
      ${arr(it.ingredients).length ? `<div class="block frame"><h3>${ART.mortar}Ingredients</h3><ul class="ingredients">${arr(it.ingredients).map(g => typeof g === 'string' ? `<li><span>${linkify(g)}</span></li>` : `<li><span>${linkify(g.item)}</span><span class="amt">${esc(g.amount || '')}</span></li>`).join('')}</ul></div>` : ''}
      ${arr(it.steps).length ? P('Preparation', 'cauldron', `<ol class="steps">${arr(it.steps).map(s => `<li>${esc(s)}</li>`).join('')}</ol>`) : ''}
      ${P(it.type === 'spell' ? 'Working the Spell' : 'How to Use', 'hand', para(it.howToUse))}
      ${it.chant ? `<div class="block"><h3>${ART.candle}Words to Speak</h3><div class="chant frame">${esc(it.chant)}</div></div>` : ''}
      ${timingBlock(it)}
      ${P('Metaphysical Uses', 'pentacle', arr(it.metaphysical).length ? chipsHTML(it.metaphysical) : '')}
      ${P('Medicinal Uses', 'leaf', arr(it.medical).length ? chipsHTML(it.medical, 'med') + `<p class="disclaimer" style="text-align:left">Traditional folk use only — not medical advice.</p>` : '')}
      ${safetyHTML(it)}`;
  } else if (it.type === 'sigil') {
    body = `
      ${it.description ? `<p class="lead">${esc(it.description)}</p>` : ''}
      ${it.intention ? `<div class="block"><h3>${ART.candle}Words of Intention</h3><div class="chant frame">${esc(it.intention)}</div></div>` : ''}
      ${P('Directions for Use', 'hand', para(it.directions))}
      ${timingBlock(it)}
      ${P('Metaphysical Uses', 'pentacle', arr(it.metaphysical).length ? chipsHTML(it.metaphysical) : '')}
      <div class="actions"><button class="btn small ghost" id="saveSig">${ART.image} Save sigil image</button></div>`;
  } else if (it.type === 'tarot') {
    body = `
      ${it.description ? `<p class="lead">${esc(it.description)}</p>` : ''}
      <div class="facts"><div class="fact"><small>CARDS</small><span>${arr(it.positions).length}</span></div>${it.difficulty ? `<div class="fact"><small>LEVEL</small><span>${esc(it.difficulty)}</span></div>` : ''}</div>
      <div class="block frame"><h3>${ART.tarot}The Layout</h3>${layoutHTML(it.positions, null, it.lines, it.backdrop)}</div>
      <div class="actions"><a class="btn primary" href="#/reading/${encodeURIComponent(id)}">${ART.shuffle} Draw a Reading</a><a class="btn ghost" href="#/record?s=${encodeURIComponent(id)}">${ART.edit} Record a reading I did</a>${Journal.forSpread(id).length ? `<a class="btn ghost" href="#/journal?t=tarot&s=${encodeURIComponent(id)}">${ART.book} Past readings (${Journal.forSpread(id).length})</a>` : ''}${Journal.forSpread(id).length >= 2 ? `<a class="btn ghost" href="#/trends/${encodeURIComponent(id)}">${ART.star} Trends</a>` : ''}</div>
      ${P('Positions', 'star', `<div class="positions">${arr(it.positions).map(p => `<div class="pos"><span class="n">${p.n}</span><div><b>${esc(p.name)}</b><br><span class="small">${esc(p.meaning)}</span>${p.guide ? `<br><span class="small" style="color:var(--gold2)"><i>${esc(p.guide)}</i></span>` : ''}</div></div>`).join('')}</div>`)}
      ${it.intention ? `<div class="block"><h3>${ART.candle}Before You Draw</h3><div class="chant frame">${esc(it.intention)}</div></div>` : ''}
      ${P('How to Use', 'hand', para(it.howToUse))}
      ${timingBlock(it)}
      ${P('Metaphysical Uses', 'pentacle', arr(it.metaphysical).length ? chipsHTML(it.metaphysical) : '')}`;
  } else if (it.type === 'herb') {
    const facts = [['PLANET', it.planet], ['ELEMENT', it.element], ['GENDER', it.gender], ['PARTS USED', it.partsUsed], ['DEITIES', arr(it.deities).join(', ')]].filter(f => f[1]);
    body = `
      ${safetyBanner(it)}
      ${arr(it.folkNames).length ? `<div class="block"><h3>${ART.book}Witch & Folk Names</h3>${chipsHTML(it.folkNames, 'gold', false)}</div>` : ''}
      <div class="facts">${facts.map(f => `<div class="fact"><small>${f[0]}</small><span>${esc(f[1])}</span></div>`).join('')}</div>
      ${it.description ? `<p class="lead">${esc(it.description)}</p>` : ''}
      ${DIV}
      ${P('Metaphysical Uses', 'pentacle', chipsHTML(it.metaphysical) + para(it.metaphysicalUses))}
      ${P('Medicinal Uses', 'leaf', (arr(it.medical).length ? chipsHTML(it.medical, 'med') : '') + para(it.medicalUses) + `<p class="disclaimer" style="text-align:left">Traditional folk use only — not medical advice.</p>`)}
      ${arr(it.uses).length ? P('Ways to Use', 'hand', `<ul class="uses">${arr(it.uses).map(u => `<li>${esc(u)}</li>`).join('')}</ul>`) : ''}
      ${P('Where to Find', 'broom', para(it.whereToFind))}
      ${timingBlock(it)}
      ${safetyHTML(it)}
      ${usedHTML}`;
  } else if (it.type === 'deity') {
    const facts = [['PANTHEON', it.pantheon], ['PLANET', it.planet], ['ELEMENT', it.element], ['ANIMALS', arr(it.animals).join(', ')], ['COLOURS', arr(it.colors).join(', ')], ['SACRED DAYS', it.sacredDays]].filter(f => f[1]);
    const linkChips = (names, type) => `<div class="chips">${arr(names).map(n => { const m = Store.all(type).find(x => norm(x.name) === norm(n)); return m ? `<a class="chip ${type === 'crystal' ? 'gold' : 'med'}" href="#/view/${m.id}">${esc(n)}</a>` : `<span class="chip">${esc(n)}</span>`; }).join('')}</div>`;
    body = `
      ${arr(it.altNames).length ? `<div class="block"><h3>${ART.book}Also Known As</h3>${chipsHTML(it.altNames, 'gold', false)}</div>` : ''}
      <div class="facts">${facts.map(f => `<div class="fact"><small>${f[0]}</small><span>${esc(f[1])}</span></div>`).join('')}</div>
      ${P('What They Represent', 'pentacle', chipsHTML(it.metaphysical) + para(it.represents))}
      ${DIV}
      ${it.description ? `<div class="block"><h3>${ART.book}History & Lore</h3>${String(it.description).split(/\n\s*\n/).map((pp, k) => `<p class="${k ? '' : 'lead'}">${esc(pp)}</p>`).join('')}</div>` : ''}
      ${arr(it.gems).length ? P('Sacred Gems & Stones', 'crystal', linkChips(it.gems, 'crystal')) : ''}
      ${arr(it.herbs).length ? P('Sacred Herbs & Plants', 'leaf', linkChips(it.herbs, 'herb')) : ''}
      ${arr(it.items).length ? P('Sacred Symbols & Items', 'candle', `<ul class="uses">${arr(it.items).map(u => `<li>${esc(u)}</li>`).join('')}</ul>`) : ''}
      ${P('How to Invoke', 'hand', para(it.howToInvoke))}
      ${it.invocation ? `<div class="block"><h3>${ART.candle}Words of Invocation</h3><div class="chant frame">${esc(it.invocation)}</div></div>` : ''}
      ${timingBlock(it)}
      ${arr(it.offerings).length ? `<div class="block frame"><h3>${ART.cauldron}Offerings They Love</h3><ul class="uses">${arr(it.offerings).map(u => `<li>${esc(u)}</li>`).join('')}</ul>${it.avoid ? `<p class="small"><b style="color:var(--crimson)">Avoid · </b>${esc(it.avoid)}</p>` : ''}</div>` : ''}
      ${it.caution ? `<div class="block caution"><b>With respect · </b>${esc(it.caution)}</div>` : ''}`;
  } else if (it.type === 'crystal') {
    const facts = [['COLOURS', it.colors], ['CHAKRA', it.chakra], ['ELEMENT', it.element], ['PLANET', it.planet], ['ZODIAC', arr(it.zodiac).join(', ')], ['HARDNESS', it.hardness]].filter(f => f[1]);
    const subs = arr(it.substitutes).map(n => Store.all('crystal').find(c => norm(c.name) === norm(n)) || { name: n });
    body = `
      ${safetyBanner(it)}
      ${arr(it.folkNames).length ? `<div class="block"><h3>${ART.book}Witch & Metaphysical Names</h3>${chipsHTML(it.folkNames, 'gold', false)}</div>` : ''}
      <div class="facts">${facts.map(f => `<div class="fact"><small>${f[0]}</small><span>${esc(f[1])}</span></div>`).join('')}</div>
      ${it.description ? `<p class="lead">${esc(it.description)}</p>` : ''}
      ${DIV}
      ${P('Metaphysical Uses', 'pentacle', chipsHTML(it.metaphysical) + para(it.metaphysicalUses))}
      ${arr(it.uses).length ? P('Ways to Use', 'hand', `<ul class="uses">${arr(it.uses).map(u => `<li>${esc(u)}</li>`).join('')}</ul>`) : ''}
      ${subs.length ? `<div class="block frame"><h3>${ART.crystal}Substitutes</h3><p class="small muted" style="margin-top:0">Don't have ${esc(it.name)}? Any of these can stand in:</p>
        <div class="list">${subs.map(s => s.id ? rowHTML(s, esc(arr(s.metaphysical).slice(0, 4).join(', '))) : `<div class="row"><div class="txt"><div class="nm">${esc(s.name)}</div></div></div>`).join('')}</div>
        ${it.substituteNotes ? `<p class="small">${esc(it.substituteNotes)}</p>` : ''}</div>` : ''}
      ${P('Cleansing & Charging', 'moon', para(it.cleansing))}
      ${P('Where to Find', 'broom', para(it.whereToFind))}
      ${timingBlock(it)}
      ${safetyHTML(it)}
      ${usedHTML}`;
  }
  v.innerHTML = `${banner}${credit}
    <div class="dhead"><div class="type">${esc(singleOil ? (it.kind === 'essential' ? 'Essential Oil' : 'Carrier Oil') : T.one)}${it.builtin ? '' : it.edited ? ' · edited' : ' · your own'}</div><h1>${esc(it.name)}</h1>${sub}</div>
    ${body}
    ${it.type !== 'tarot' ? journalSectionHTML(it) : ''}
    ${DIV}
    <div class="actions">
      <button class="btn" id="fav">${isFav ? ART.starFill : ART.star} ${isFav ? 'Favourite' : 'Add to favourites'}</button>
      <a class="btn ghost" href="#/edit/${it.type}/${encodeURIComponent(id)}">${ART.edit} Edit</a>
      ${it.edited && Store.seed[id] ? `<button class="btn ghost" id="revert">Restore original</button>` : ''}
      <button class="btn danger" id="del">${ART.trash} ${it.builtin && !Store.user[id] ? 'Hide' : 'Delete'}</button>
    </div>`;
  $('#fav', v).onclick = async () => { const f = await Store.toggleFav(id); toast(f ? 'Added to favourites ✶' : 'Removed from favourites'); render(); };
  $('#del', v).onclick = async () => {
    if (await confirmBox(`${Store.seed[id] ? 'Hide' : 'Delete'} “${it.name}”?${Store.seed[id] ? ' (Built-in entries can be restored from Settings.)' : ''}`, Store.seed[id] ? 'Hide' : 'Delete')) {
      await Store.remove(id); toast('Banished.'); history.back();
    }
  };
  makeZoomable($('.banner', v), it.name + (it.credit && it.image && !String(it.image).startsWith('art:') && !String(it.image).startsWith('data:') ? ' · Photo: ' + it.credit : ''));
  const lw = $('#logw', v); if (lw) lw.onclick = () => logWorkingModal(it, () => render());
  const rv = $('#revert', v); if (rv) rv.onclick = async () => { await Store.revert(id); toast('Original restored'); render(); };
  const ss = $('#saveSig', v); if (ss) ss.onclick = () => exportSigil(it);
});

async function exportSigil(it) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const x = c.getContext('2d');
  x.fillStyle = Store.settings.theme === 'day' ? '#f3e9d2' : '#0b0812'; x.fillRect(0, 0, 1024, 1024);
  const src = it.image && it.image.startsWith('data:') ? it.image
    : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent((it.svg || '').replace(/currentColor/g, '#d4ad5a'));
  const img = new Image();
  img.onload = () => { x.shadowColor = 'rgba(212,173,90,.6)'; x.shadowBlur = 24; x.drawImage(img, 80, 80, 864, 864); saveFile(it.name.replace(/[^\w]+/g, '_') + '.png', 'image/png', c.toDataURL('image/png')); };
  img.src = src;
}

/* ---------- TAROT LAYOUT ---------- */
function layoutGeom(positions, maxW = 330) {
  const ps = arr(positions); if (!ps.length) return { cards: [], w: 0, h: 0, s: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  ps.forEach(p => {
    const w = p.rotate == 90 ? 1.5 : 1, h = p.rotate == 90 ? 1 : 1.5;
    const cx = +p.x + 0.5, cy = +p.y + 0.75;
    minX = Math.min(minX, cx - w / 2); maxX = Math.max(maxX, cx + w / 2); minY = Math.min(minY, cy - h / 2); maxY = Math.max(maxY, cy + h / 2);
  });
  const s = Math.min(maxW / (maxX - minX), 70, 420 / (maxY - minY));
  return { s, w: (maxX - minX) * s, h: (maxY - minY) * s, minX, minY, ps };
}
function layoutHTML(positions, drawn, lines, theme) {
  const g = layoutGeom(positions, 300); if (!g.s) return '<p class="muted">No positions yet.</p>';
  const P = 16, kind = backdropKind(theme), wide = true;
  // themed stages fill the frame so the scenery isn't hidden behind small spreads
  const W = Math.round(Math.max(g.w + 2 * P, wide ? 332 : 0)), H = Math.round(Math.max(g.h + 2 * P, wide ? 210 : 0)), OX = (W - g.w) / 2, OY = (H - g.h) / 2;
  const centre = n => { const p = g.ps.find(q => q.n == n); return p && [(+p.x - g.minX + 0.5) * g.s + OX, (+p.y - g.minY + 0.75) * g.s + OY]; };
  const segs = arr(lines).map(([a, b]) => [centre(a), centre(b)]).filter(x => x[0] && x[1]);
  // a card with a sideways card laid over it shows its number near the top so it stays visible
  const under = p => p.rotate != 90 && g.ps.some(q => q.rotate == 90 && Math.abs(q.x - p.x) < .6 && Math.abs(q.y - p.y) < .8);
  const cards = g.ps.map((p, i) => {
    const left = (+p.x - g.minX) * g.s, top = (+p.y - g.minY) * g.s;
    const d = drawn && drawn[i];
    const img = d && d.card && tarotImg(d.card.name);
    return `<div class="card ${d ? 'drawn' + (p.rotate == 90 ? '' : ' flip') : ''} ${img ? 'pic' : ''} ${!d && under(p) ? 'under' : ''} ${!d && p.rotate == 90 ? 'side' : ''} ${d && d.rev ? 'rev' : ''}" data-i="${i}" ${img ? `data-card="${esc(d.card.name)}"` : ''} style="left:${left}px;top:${top}px;width:${g.s}px;height:${g.s * 1.5}px;${p.rotate == 90 ? 'transform:rotate(90deg);' : ''}font-size:${d ? Math.max(8, g.s * .19) : Math.max(10, g.s * .32)}px;${d ? `animation-delay:${i * 0.12}s` : ''}">${img ? `<img src="${img}" alt="${esc(d.card.name)}" loading="lazy"><b class="pn">${p.n}</b>` : d ? `<span>${esc(d.card.name.replace(/^[0IVXL]+ · /, ''))}</span>` : `<span class="num">${p.n}</span>`}</div>`;
  }).join('');
  return `<div class="spread-stage bd-${kind}" data-theme="${esc(theme || '')}" data-w="${W}" data-h="${H}" data-lines='${JSON.stringify(segs)}' style="width:${W}px;height:${H}px">${backdropSVG(kind, W, H, segs)}<div class="layout" style="left:${OX}px;top:${OY}px;width:${g.w}px;height:${g.h}px">${cards}</div></div>${backdropPickerHTML()}`;
}
// a saved reading keeps its own positions; for built-in spreads use the current shape so fixes reach old readings too
function readingLayout(r) {
  const sp = Store.get(r.spreadId), ps = arr(r.positions);
  if (sp && sp.builtin && arr(sp.positions).length === ps.length) return arr(sp.positions).map(p => ({ n: p.n, x: p.x, y: p.y, rotate: p.rotate || 0, name: p.name }));
  return ps;
}
/* ---------- SEARCH ---------- */
route('search', async (v, a, q) => {
  setTitle('Search');
  let qq = q.q || '', exact = q.k === '1';
  v.innerHTML = `<div class="searchbar">${ART.search}<input id="sq" type="search" placeholder="Search everything… herbs, chants, uses" value="${esc(qq)}" autocomplete="off"></div>
    <div id="sres"></div>`;
  const input = $('#sq', v);
  const draw = () => {
    const box = $('#sres', v);
    if (!qq.trim()) {
      const sugg = ['protection', 'love', 'money', 'sleep', 'banishing', 'divination', 'full moon', 'healing', 'courage', 'anxiety', 'digestion', 'cleansing'];
      box.innerHTML = `<p class="muted center fell"><i>Speak a word and the book shall open…</i></p><div class="chips" style="justify-content:center">${sugg.map(s => `<a class="chip" href="#/search?q=${encodeURIComponent(s)}">${s}</a>`).join('')}</div>`;
      return;
    }
    let res = search(qq, { exactKeyword: exact });
    if (exact && !res.length) res = search(qq);
    const groups = {}; res.forEach(r => (groups[r.it.type] = groups[r.it.type] || []).push(r));
    box.innerHTML = `<div class="count">${res.length} result${res.length === 1 ? '' : 's'}${exact ? ` tagged “${esc(qq)}” · <a href="#/search?q=${encodeURIComponent(qq)}">search all text</a>` : ''}</div>` +
      (res.length ? TYPE_ORDER.filter(t => groups[t]).map(t => `<div class="group-h">${TYPES[t].label} · ${groups[t].length}</div><div class="list">${groups[t].slice(0, 60).map(r => rowHTML(r.it, snippet(r.it, qq))).join('')}</div>`).join('')
        : `<div class="empty">${ART.eye}The spirits find nothing for “${esc(qq)}”.</div>`);
  };
  let t; input.addEventListener('input', e => { qq = e.target.value; exact = false; clearTimeout(t); t = setTimeout(() => { history.replaceState(null, '', '#/search?q=' + encodeURIComponent(qq)); draw(); }, 160); });
  draw();
  if (!qq) setTimeout(() => input.focus(), 100);
});

/* ---------- TABLES ---------- */
const TABLE_SOURCES = {
  herb: { label: 'Herbs', get: () => Store.all('herb'), med: true },
  crystal: { label: 'Crystals', get: () => Store.all('crystal'), med: false },
  both: { label: 'Herbs & Crystals', get: () => [...Store.all('herb'), ...Store.all('crystal')], med: false },
  eo: { label: 'Essential Oils', get: () => Store.all('oil').filter(o => o.kind === 'essential'), med: true },
  carrier: { label: 'Carrier Oils', get: () => Store.all('oil').filter(o => o.kind === 'carrier'), med: true },
  oil: { label: 'Formulary Oils', get: () => Store.all('oil').filter(o => (o.kind || 'formula') === 'formula'), med: true },
  tincture: { label: 'Tinctures', get: () => Store.all('tincture'), med: true },
  brew: { label: 'Brews', get: () => Store.all('brew'), med: true },
  incense: { label: 'Incense', get: () => Store.all('incense'), med: false },
};
route('tables/:kind', async (v, [kind], q) => {
  const med = kind === 'med';
  let src = TABLE_SOURCES[q.s] ? q.s : 'herb', by = q.by || 'use', filter = '';
  if (med && !TABLE_SOURCES[src].med) src = 'herb';
  setTitle(med ? 'Medicinal Uses' : 'Magical Uses');
  const srcs = Object.keys(TABLE_SOURCES).filter(k => !med || TABLE_SOURCES[k].med);
  v.innerHTML = `
    <div class="center" style="margin:6px 0"><div class="seg" id="kind"><button data-k="meta" class="${!med ? 'on' : ''}">Magical</button><button data-k="med" class="${med ? 'on' : ''}">Medicinal</button></div></div>
    <div class="form" style="margin:8px 0"><select id="src" aria-label="What to show">${srcs.map(k => `<option value="${k}" ${k === src ? 'selected' : ''}>${TABLE_SOURCES[k].label}</option>`).join('')}</select></div>
    <div class="center" style="margin:8px 0"><div class="seg" id="by"><button data-b="use">By use</button><button data-b="item">A–Z</button></div></div>
    <div class="searchbar">${ART.search}<input id="tf" type="search" placeholder="Filter table…"></div>
    <div id="alpha" class="alpha"></div><div id="tbl"></div>
    <p class="disclaimer">${med ? 'Traditional & folk uses only — not medical advice. Always check cautions.' : 'Tap any name to open its page.'}</p>`;
  const draw = () => {
    $$('#by button', v).forEach(b => b.classList.toggle('on', b.dataset.b === by));
    const items = TABLE_SOURCES[src].get();
    const field = med ? 'medical' : 'metaphysical';
    const f = norm(filter);
    const label = TABLE_SOURCES[src].label;
    let rows = [];
    if (by === 'use') {
      const map = {};
      items.forEach(i => arr(i[field]).forEach(k => { k = k.toLowerCase().trim(); (map[k] = map[k] || []).push(i); }));
      rows = Object.keys(map).sort().map(k => ({ key: k, items: map[k].sort((a, b) => a.name.localeCompare(b.name)) }))
        .filter(r => !f || norm(r.key).includes(f) || r.items.some(i => norm(i.name).includes(f)));
      $('#tbl', v).innerHTML = rows.length ? `<table class="ktable"><thead><tr><th>${med ? 'Ailment / Use' : 'Magical Use'}</th><th>${esc(label)}</th></tr></thead><tbody>${rows.map(r =>
        `<tr id="k-${esc(r.key[0])}"><td class="k">${esc(r.key)}<small>${r.items.length}</small></td><td><div class="chips">${r.items.map(i => `<a class="chip ${med ? 'med' : i.type === 'crystal' ? 'gold' : ''}" href="#/view/${i.id}">${i.toxic ? '☠ ' : ''}${esc(i.name.replace(/ Essential Oil$/, ''))}</a>`).join('')}</div></td></tr>`).join('')}</tbody></table>` : `<div class="empty">${ART.table}Nothing listed yet.</div>`;
    } else {
      rows = items.slice().sort((a, b) => a.name.localeCompare(b.name)).map(i => ({ key: i.name, it: i })).filter(r => !f || norm(r.key).includes(f) || arr(r.it[field]).some(k => norm(k).includes(f)));
      $('#tbl', v).innerHTML = `<table class="ktable"><thead><tr><th>Name</th><th>${med ? 'Medicinal uses' : 'Magical uses'}</th></tr></thead><tbody>${rows.map(r =>
        `<tr id="k-${esc(r.key[0].toLowerCase())}"><td class="k"><a href="#/view/${r.it.id}">${r.it.toxic ? '☠ ' : ''}${esc(r.key.replace(/ Essential Oil$/, ''))}</a><small>${esc(r.it.latin || arr(r.it.folkNames)[0] || '')}</small></td><td>${arr(r.it[field]).length ? chipsHTML(r.it[field], med ? 'med' : '') : '<span class="muted small">—</span>'}</td></tr>`).join('')}</tbody></table>`;
    }
    const letters = [...new Set(rows.map(r => r.key[0].toLowerCase()))];
    $('#alpha', v).innerHTML = letters.map(l => `<a href="javascript:void 0" data-l="${l}">${l.toUpperCase()}</a>`).join('');
    history.replaceState(null, '', `#/tables/${kind}?s=${src}&by=${by}`);
  };
  $('#kind', v).onclick = e => { const b = e.target.closest('button'); if (b) location.hash = `#/tables/${b.dataset.k}?s=${src}&by=${by}`; };
  $('#src', v).onchange = e => { src = e.target.value; draw(); };
  $('#by', v).onclick = e => { const b = e.target.closest('button'); if (b) { by = b.dataset.b; draw(); } };
  $('#tf', v).oninput = e => { filter = e.target.value; draw(); };
  $('#alpha', v).onclick = e => { const a = e.target.closest('a'); if (!a) return; const row = $(`#k-${CSS.escape(a.dataset.l)}`, v); if (row) window.scrollTo({ top: row.getBoundingClientRect().top + scrollY - 110, behavior: 'smooth' }); };
  draw();
});

/* ---------- MOON ---------- */
// the illumination line on the Moon Tracker, refreshed every minute while the page is open
function moonLiveText(m, now) {
  return `<p class="fell" style="margin:4px 0"><i>${(m.illum * 100).toFixed(2)}% illuminated · ${m.age.toFixed(1)} days old · ${m.waxing ? 'waxing' : 'waning'}</i></p><p class="small muted" style="margin:0">Live for ${fmtDate(now)} at ${fmtTime(now)} · ${MOON.south ? 'southern' : 'northern'} hemisphere view</p>`;
}
let moonTimer = null;
route('moon', async v => {
  clearInterval(moonTimer);
  moonTimer = setInterval(() => {
    const hero = document.querySelector('.moon-hero'), live = document.getElementById('moonlive');
    if (!hero || !live) { clearInterval(moonTimer); return; }
    const t = new Date(), mm = MOON.current(t);
    hero.innerHTML = MOON.photo(mm.fraction, 230); live.innerHTML = moonLiveText(mm, t);
  }, 60000);
  setTitle('Moon Tracker');
  const now = new Date(), m = MOON.current(now);
  const end = new Date(now.getTime() + 380 * 864e5);
  const list = MOON.phasesBetween(new Date(now.getTime() - 864e5 * 0), end);
  const months = {};
  list.forEach(p => { const k = p.date.getFullYear() * 12 + p.date.getMonth(); (months[k] = months[k] || []).push(p); });
  const nowPhase = m.dark ? 'Dark Moon' : m.name;
  const works = Store.all().filter(i => arr(i.moonPhases).includes(nowPhase) && !['herb', 'crystal'].includes(i.type));
  const yr = now.getFullYear();
  const sab = [...MOON.sabbats(yr), ...MOON.sabbats(yr + 1)].filter(s => s.date >= new Date(now.toDateString())).slice(0, 8);
  const nextFull = list.find(p => p.q === 0.5), nextNew = list.find(p => p.q === 0);
  const daysTo = d => Math.max(0, Math.ceil((d - now) / 864e5));
  v.innerHTML = `
    <div class="center" style="margin-top:6px"><div class="moon-hero">${MOON.photo(m.fraction, 230)}</div>
    <h1 style="margin-top:10px">${m.dark ? 'Dark Moon' : esc(m.name)}</h1>
    <div id="moonlive">${moonLiveText(m, now)}</div></div>
    <div class="frame" style="margin:12px 0"><p style="margin:0">${esc(MOON.PHASE_INFO[nowPhase])}</p></div>
    <div class="facts">
      ${nextFull ? `<div class="fact"><small>NEXT FULL MOON</small><span>${fmtDate(nextFull.date)} · ${fmtTime(nextFull.date)}</span><div class="small muted">${esc(nextFull.moonName)} · in ${daysTo(nextFull.date)} days</div></div>` : ''}
      ${nextNew ? `<div class="fact"><small>NEXT NEW MOON</small><span>${fmtDate(nextNew.date)} · ${fmtTime(nextNew.date)}</span><div class="small muted">in ${daysTo(nextNew.date)} days</div></div>` : ''}
    </div>
    ${works.length ? `<div class="section-title"><h2>Workings for Now</h2></div><div class="list">${works.slice(0, 5).map(i => rowHTML(i, `<span class="muted">${TYPES[i.type].one}</span> · ${esc(i.bestTime || '')}`)).join('')}</div>
      <div class="actions"><a class="btn small ghost" href="#/phase/${encodeURIComponent(nowPhase)}">All ${works.length} for the ${esc(nowPhase)}</a></div>` : ''}
    <div class="section-title"><h2>Phase Guide</h2></div>
    <div class="list">${MOON.ALL_PHASES.map((p, i) => `<a class="row" href="#/phase/${encodeURIComponent(p)}"><div class="thumb" style="padding:4px;background:#07060b">${MOON.photo(p === 'Dark Moon' ? 0.995 : i / 8, 50)}</div><div class="txt"><div class="nm">${p}</div><div class="sb">${esc(MOON.PHASE_INFO[p])}</div></div></a>`).join('')}</div>
    <div class="section-title"><h2>The Coming Year</h2></div>
    ${Object.keys(months).map(k => {
    const ps = months[k], d0 = ps[0].date;
    return `<div class="frame" style="margin-bottom:10px"><h3>${d0.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
        ${ps.map(p => `<div class="pos" style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dashed var(--line)"><span style="width:28px;height:28px;flex:none">${MOON.svg(p.q, 28)}</span>
          <div style="flex:1"><b style="color:var(--gold2)">${esc(p.phase)}</b>${p.moonName ? ` <span class="chip gold" style="font-size:.72rem">${esc(p.moonName)}</span>` : ''}</div>
          <div class="small" style="text-align:right">${fmtDate(p.date)}<br><span class="muted">${fmtTime(p.date)}</span></div></div>`).join('')}</div>`;
  }).join('')}
    <div class="section-title"><h2>Wheel of the Year</h2></div>
    <div class="frame">${sab.map(s => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line)"><a href="#/search?q=${encodeURIComponent(s.name)}"><b>${s.name}</b></a><span class="small">${fmtDate(s.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>`).join('')}
    <p class="small muted">Sabbat dates are traditional northern-hemisphere approximations. Times shown in your phone's local time zone.</p></div>`;
});
route('phase/:p', async (v, [p]) => {
  setTitle(p);
  const items = Store.all().filter(i => arr(i.moonPhases).includes(p));
  const groups = {}; items.forEach(i => (groups[i.type] = groups[i.type] || []).push(i));
  const f = p === 'Dark Moon' ? 0.995 : MOON.ALL_PHASES.indexOf(p) / 8;
  v.innerHTML = `<div class="center" style="margin:8px 0"><div style="width:130px;margin:auto">${MOON.photo(f, 130)}</div><h1 style="margin-top:8px">${esc(p)}</h1><p>${esc(MOON.PHASE_INFO[p] || '')}</p></div>${DIV}
    ${TYPE_ORDER.filter(t => groups[t]).map(t => `<div class="group-h">${TYPES[t].label} · ${groups[t].length}</div><div class="list">${groups[t].map(i => rowHTML(i)).join('')}</div>`).join('') || '<div class="empty">Nothing yet for this phase.</div>'}`;
});

/* ---------- MORE / SETTINGS ---------- */
route('more', async v => {
  setTitle('More');
  const L = (href, icon, b, s) => `<a href="${href}">${ART[icon]}<div><b>${b}</b><span>${s}</span></div></a>`;
  v.innerHTML = `<div class="menu-list">
    <a href="#/more" id="moreUpd">${ART.shuffle || ART.star}<div><b>Check for Updates</b><span>You have version ${esc(Updater.current().name)}${Updater.android() ? '. Tap to look for a newer one' : '. Updates arrive by themselves when online'}</span></div></a>
    ${L('#/journal', 'book', 'Journal', 'Your readings and workings, with notes and results')}
    ${L('#/craft', 'pentacle', 'Learn Witchcraft', 'Grounding, cleansing, circles, altars, spells, protection & more')}
    ${L('#/learn', 'book', 'Learn Tarot', 'Every card, its symbols, lessons and flashcards')}
    ${L('#/deck', 'tarot', 'The Tarot Deck', 'All 78 Rider–Waite–Smith cards with their meanings')}
    ${L('#/record', 'edit', 'Record a Tarot Reading', 'Log a reading you did with your own deck')}
    ${L('#/favorites', 'star', 'Favourites', 'Everything you have starred')}
    ${L('#/mine', 'book', 'My Book of Shadows', 'Entries you have written or edited')}
    ${L('#/tables/meta', 'table', 'Magical Uses Table', 'Herbs & crystals grouped by purpose')}
    ${L('#/tables/med', 'table', 'Medicinal Uses Table', 'Herbs grouped by folk remedy')}
    ${L('#/moon', 'triplemoon', 'Moon Tracker', 'Phases, full moon names, sabbats')}
    ${L('#/settings', 'gear', 'Settings & Backup', 'Theme, title, export & import')}
    ${L('#/citations', 'book', 'Citations', 'Where the information in this app comes from')}
    ${L('#/credits', 'hand', 'About & Credits', 'Photo credits, disclaimer')}
  </div>`;
  $('#moreUpd', v).onclick = e => { e.preventDefault(); checkForUpdates(true); };
});
route('favorites', async v => {
  setTitle('Favourites');
  const favs = [...Store.favs].map(id => Store.get(id)).filter(Boolean);
  v.innerHTML = favs.length ? `<div class="list">${favs.map(i => rowHTML(i, `<span class="muted">${TYPES[i.type].one}</span>`)).join('')}</div>` : `<div class="empty">${ART.star}Tap “Add to favourites” on any page to keep it here.</div>`;
});
route('mine', async (v, a, qs) => {
  const only = TYPES[qs.t] ? qs.t : '';
  setTitle(only === 'tarot' ? 'My Spreads' : 'My Book of Shadows');
  const mine = Object.values(Store.user).filter(i => !only || i.type === only).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  v.innerHTML = `<div class="grid" style="margin-bottom:14px">${(only ? [only] : TYPE_ORDER).map(t => `<a class="tile" href="#/edit/${t}" style="min-height:90px">${ART.plus}<b>New ${TYPES[t].one}</b></a>`).join('')}</div>` +
    (mine.length ? `<div class="list">${mine.map(i => rowHTML(i, `<span class="muted">${TYPES[i.type].one}${i.edited ? ' · edited' : ''}</span>`)).join('')}</div>` : `<div class="empty">${ART.book}Your own pages will appear here.</div>`);
});
route('settings', async v => {
  setTitle('Settings'); await Craft.load(); await Decks.load();
  const s = Store.settings;
  v.innerHTML = `<div class="form">
    <div class="switch"><div><b class="fell">Theme</b><div class="small muted">Night mode is easy on the eyes after dark</div></div><div class="seg" id="theme"><button data-t="night">Night</button><button data-t="day">Day</button></div></div>
    <label>Grimoire title</label><input type="text" id="title" value="${esc(s.title || "Paco Morningstar's Witches' Companion")}">
    <label>Motto</label><input type="text" id="motto" value="${esc(s.motto || 'A grimoire of herb, stone, smoke & starlight')}">
    <div class="switch"><div><b class="fell">Moon view</b><div class="small muted">Southern hemisphere skies see the moon turned around</div></div><div class="seg" id="hemi"><button data-h="north">North</button><button data-h="south">South</button></div></div>
    <div class="moon-bright"><div><b class="fell">Moon brightness</b><div class="small muted">How bright the sunlit part of the moon photo looks</div>
      <input type="range" id="mbr" min="0.5" max="1.8" step="0.05" value="${MOON.bright}" aria-label="Moon brightness"><div class="small" style="display:flex;justify-content:space-between"><span>Dimmer</span><b id="mbrv">${Math.round(MOON.bright * 100)}%</b><span>Brighter</span></div></div>
      <div class="mb-prev" id="mbp">${MOON.photo(MOON.current().fraction, 92)}</div><div class="mb-prev" id="mbf">${MOON.photo(0.5, 92)}</div></div>
    <div class="actions" style="margin-top:0"><button class="btn small ghost" id="mbreset">Reset moon brightness</button></div>
    <div class="section-title"><h2>Home Screen</h2></div>
    <p class="small">Arrange the Grimoire buttons on the home page in the order that matters most to you. Use the arrows to move a button, and the eye to show or hide it.</p>
    <div class="tile-order" id="tord"></div>
    <div class="actions"><button class="btn ghost" id="treset">Reset to the original order</button></div>
    <div class="section-title"><h2>Backup</h2></div>
    <p class="small">Everything you add lives only on this phone. Export a backup file now and then (and before uninstalling) to keep your Book of Shadows safe.</p>
    <div class="actions"><button class="btn" id="exp">Export backup</button><button class="btn ghost" id="imp">Import backup</button></div>
    ${updatesSettingsHTML()}
    <div class="section-title"><h2>Sources</h2></div>
    <p class="small">Where the safety, health and reference information in this app comes from.</p>
    <div class="actions"><a class="btn" href="#/citations">${ART.book} Citations</a><a class="btn ghost" href="#/credits">Photo credits</a></div>
    <div class="section-title"><h2>Hidden entries</h2></div>
    <p class="small">${Store.hidden.size} built-in entr${Store.hidden.size === 1 ? 'y is' : 'ies are'} hidden.</p>
    <div class="actions"><button class="btn ghost" id="unhide" ${Store.hidden.size ? '' : 'disabled'}>Restore hidden entries</button></div>
  </div>`;
  const paint = () => { $$('#theme button', v).forEach(b => b.classList.toggle('on', b.dataset.t === (Store.settings.theme || 'night'))); $$('#hemi button', v).forEach(b => b.classList.toggle('on', b.dataset.h === (Store.settings.hemisphere || 'north'))); };
  const paintMoon = () => { $('#mbrv', v).textContent = Math.round(MOON.bright * 100) + '%'; $('#mbp', v).innerHTML = MOON.photo(MOON.current().fraction, 92); $('#mbf', v).innerHTML = MOON.photo(0.5, 92); };
  $('#mbr', v).oninput = e => { MOON.bright = +e.target.value; paintMoon(); };
  wireUpdatesSettings(v);
  $('#mbr', v).onchange = e => Store.setSetting('moonBright', +e.target.value);
  $('#mbreset', v).onclick = async () => { MOON.bright = 1; $('#mbr', v).value = 1; paintMoon(); await Store.setSetting('moonBright', 1); toast('Moon brightness reset'); };
  $('#hemi', v).onclick = async e => { const b = e.target.closest('button'); if (!b) return; await Store.setSetting('hemisphere', b.dataset.h); MOON.south = b.dataset.h === 'south'; paint(); toast(b.dataset.h === 'south' ? 'Southern hemisphere moon' : 'Northern hemisphere moon'); };
  const label = k => (HOME_TILES.find(t => t[0] === k) || [k, k])[1];
  const paintTiles = (flash) => {
    const order = homeTileOrder(), hid = homeTileHidden();
    $('#tord', v).innerHTML = order.map((k, i) => `<div class="to-row ${hid.includes(k) ? 'off' : ''} ${flash === k ? 'flash' : ''}" data-k="${k}">
      <span class="to-n">${i + 1}</span><b>${esc(label(k))}</b>
      <button type="button" class="iconbtn to-eye" data-a="eye" aria-label="${hid.includes(k) ? 'Show' : 'Hide'} ${esc(label(k))}">${ART.eye}</button>
      <button type="button" class="iconbtn" data-a="top" aria-label="Move to top" ${i ? '' : 'disabled'}>⤒</button>
      <button type="button" class="iconbtn" data-a="up" aria-label="Move up" ${i ? '' : 'disabled'}>▲</button>
      <button type="button" class="iconbtn" data-a="down" aria-label="Move down" ${i < order.length - 1 ? '' : 'disabled'}>▼</button></div>`).join('');
  };
  $('#tord', v).onclick = async e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const k = b.closest('[data-k]').dataset.k, order = homeTileOrder(), i = order.indexOf(k);
    if (b.dataset.a === 'eye') { const hid = [...homeTileHidden()]; const j = hid.indexOf(k); j < 0 ? hid.push(k) : hid.splice(j, 1); await Store.setSetting('homeHidden', hid); }
    else {
      order.splice(i, 1); order.splice(b.dataset.a === 'top' ? 0 : b.dataset.a === 'up' ? i - 1 : i + 1, 0, k);
      await Store.setSetting('homeOrder', order);
    }
    paintTiles(k);
  };
  $('#treset', v).onclick = async () => { await Store.setSetting('homeOrder', []); await Store.setSetting('homeHidden', null); delete Store.settings.homeHidden; await Store.setSetting('homeOrder', []); paintTiles(); toast('Home screen order restored'); };
  paintTiles();
  paint();
  $('#theme', v).onclick = async e => { const b = e.target.closest('button'); if (!b) return; await Store.setSetting('theme', b.dataset.t); applyTheme(); paint(); };
  $('#title', v).onchange = e => Store.setSetting('title', e.target.value.trim());
  $('#motto', v).onchange = e => Store.setSetting('motto', e.target.value.trim());
  $('#exp', v).onclick = () => {
    const data = { app: 'witchcraft-companion', version: 1, exported: new Date().toISOString(), items: Object.values(Store.user), hidden: [...Store.hidden], favs: [...Store.favs], settings: Store.settings, readings: Journal.list, workings: Workings.list, craft: { done: Craft.done, notes: Craft.notes }, decks: Decks.list };
    const n = (data.readings || []).length, w = (data.workings || []).length;
    saveFile(`grimoire-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json', JSON.stringify(data))
      .then(ok => { if (ok) toast(`Backup saved: ${n} reading${n === 1 ? '' : 's'}, ${w} working${w === 1 ? '' : 's'}`); });
  };
  $('#imp', v).onclick = async () => {
    const f = await pickFile('application/json,.json,text/plain,*/*'); if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.items)) throw 0;
      if (!await confirmBox(`Import ${data.items.length} entries? Entries with the same id will be replaced.`, 'Import')) return;
      for (const it of data.items) if (it && it.id && TYPES[it.type]) { Store.user[it.id] = it; await DB.put(it); }
      if (data.hidden) { Store.hidden = new Set(data.hidden); await DB.set('hidden', data.hidden); }
      if (Array.isArray(data.readings)) { const have = new Set(Journal.list.map(r => r.id)); data.readings.forEach(r => { if (r && r.id && !have.has(r.id)) Journal.list.push(r); }); Journal.list.sort((a, b) => b.at - a.at); await Journal.persist(); }
      if (Array.isArray(data.workings)) { const have = new Set(Workings.list.map(r => r.id)); data.workings.forEach(r => { if (r && r.id && !have.has(r.id)) Workings.list.push(r); }); Workings.list.sort((a, b) => b.at - a.at); await Workings.persist(); }
      if (data.craft) { await Craft.load(); Craft.done = { ...Craft.done, ...(data.craft.done || {}) }; Craft.notes = { ...Craft.notes, ...(data.craft.notes || {}) }; await Craft.save(); }
      if (Array.isArray(data.decks)) { await Decks.load(); const have = new Set(Decks.list.map(d => d.id)); data.decks.forEach(d => { if (d && d.id && !have.has(d.id)) Decks.list.push(d); }); await Decks.save(); }
      if (data.favs) { Store.favs = new Set(data.favs); await DB.set('favs', data.favs); }
      if (data.settings) { Store.settings = { ...Store.settings, ...data.settings }; await DB.set('settings', Store.settings); applyTheme(); }
      Store.reindex(); toast('Backup restored ✶'); render();
    } catch (e) { toast('That file is not a grimoire backup'); }
  };
  $('#unhide', v).onclick = async () => { Store.hidden.clear(); await DB.set('hidden', []); Store.reindex(); toast('Restored'); render(); };
});
/* ---------- CITATIONS: every source cited by the built-in entries ---------- */
const SOURCE_NAMES = {
  'aspca.org': 'ASPCA Animal Poison Control (toxic & non-toxic plants)', 'aspcapro.org': 'ASPCA Pro', 'drugs.com': 'Drugs.com (natural products & interactions)',
  'nccih.nih.gov': 'NIH National Center for Complementary and Integrative Health', 'tisserandinstitute.org': 'Tisserand Institute (essential oil safety)',
  'poison.org': 'National Capital Poison Center (Poison Control)', 'cdc.gov': 'U.S. Centers for Disease Control and Prevention',
  'pubmed.ncbi.nlm.nih.gov': 'PubMed (peer-reviewed research)', 'pmc.ncbi.nlm.nih.gov': 'PubMed Central (peer-reviewed research)', 'ncbi.nlm.nih.gov': 'NIH National Library of Medicine (NCBI, LiverTox)',
  'merckvetmanual.com': 'Merck Veterinary Manual', 'merckmanuals.com': 'Merck Manual', 'cpsc.gov': 'U.S. Consumer Product Safety Commission',
  'vcahospitals.com': 'VCA Animal Hospitals', 'webmd.com': 'WebMD Vitamins & Supplements', 'rxlist.com': 'RxList Supplements',
  'petpoisonhelpline.com': 'Pet Poison Helpline', 'mskcc.org': 'Memorial Sloan Kettering Cancer Center: About Herbs', 'pdsa.org.uk': 'PDSA (UK veterinary charity)',
  'usfa.fema.gov': 'U.S. Fire Administration', 'nfpa.org': 'National Fire Protection Association', 'ema.europa.eu': 'European Medicines Agency herbal monographs',
  'medlineplus.gov': 'MedlinePlus (U.S. National Library of Medicine)', 'lung.org': 'American Lung Association', 'niaaa.nih.gov': 'NIH National Institute on Alcohol Abuse and Alcoholism',
  'rockngem.com': 'Rock & Gem Magazine', 'geology.com': 'Geology.com', 'mindat.org': 'Mindat.org mineral database', 'gemsociety.org': 'International Gem Society',
  'fda.gov': 'U.S. Food and Drug Administration', 'ods.od.nih.gov': 'NIH Office of Dietary Supplements', 'escop.com': 'ESCOP herbal monographs', 'hero.epa.gov': 'U.S. EPA HERO database',
  'healthychildren.org': 'American Academy of Pediatrics (HealthyChildren.org)', 'mayoclinic.org': 'Mayo Clinic', 'plants.ces.ncsu.edu': 'NC State Extension Plant Toolbox',
  'plants.usda.gov': 'USDA PLANTS database', 'ifrafragrance.org': 'International Fragrance Association (IFRA)', 'bfr.bund.de': 'German Federal Institute for Risk Assessment',
  'swissmedic.ch': 'Swissmedic', 'cot.food.gov.uk': 'UK Committee on Toxicity', 'nchfp.uga.edu': 'National Center for Home Food Preservation', 'mdanderson.org': 'MD Anderson Cancer Center',
  'vetmed.umn.edu': 'University of Minnesota College of Veterinary Medicine', 'mspca.org': 'MSPCA-Angell', 'rhs.org.uk': 'Royal Horticultural Society', 'link.springer.com': 'Springer (peer-reviewed research)',
  'dx.doi.org': 'Peer-reviewed article (DOI)', 'en.wikipedia.org': 'Wikipedia', 'clinicaltrials.gov': 'ClinicalTrials.gov', 'ebsco.com': 'EBSCO',
};
route('citations', async (v, a, qs) => {
  setTitle('Citations');
  const by = {};   // url -> [items]
  Object.values(Store.seed).forEach(i => arr(i.sources).forEach(u => (by[u] = by[u] || []).push(i)));
  const dom = {};  // host -> [urls]
  Object.keys(by).forEach(u => { const h = srcHost(u); (dom[h] = dom[h] || []).push(u); });
  const hosts = Object.keys(dom).sort((x, y) => dom[y].reduce((n, u) => n + by[u].length, 0) - dom[x].reduce((n, u) => n + by[u].length, 0));
  const nEntries = new Set(Object.values(by).flat().map(i => i.id)).size;
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.35rem">Citations</h1><div class="sub">Where the information in this app comes from</div></div>${DIV}
    <div class="frame"><p class="small" style="margin-top:0">In October 2026 every herb, crystal, spell, oil, incense, tincture and brew was checked against independent references (two or more for nearly every entry) for <b>poisons and toxicity</b>, <b>drug interactions</b>, <b>external-only use</b>, <b>pregnancy, children and pets</b>, and fire and smoke safety. Each entry lists the sources checked at the bottom of its Safety box.</p>
    <p class="small" style="margin-bottom:0"><b>${Object.keys(by).length}</b> sources from <b>${hosts.length}</b> organizations are cited across <b>${nEntries}</b> entries. Web addresses are shown for reference; the app itself works offline.</p></div>
    <div class="form" style="margin:12px 0 4px"><input type="search" id="cq" placeholder="Filter by source or entry…"></div>
    <div class="section-title"><h2>Safety & Health Sources</h2></div>
    <div id="clist">${hosts.map(h => {
      const urls = dom[h].sort((x, y) => by[y].length - by[x].length), n = urls.reduce((t, u) => t + by[u].length, 0);
      return `<details class="cite" data-q="${esc((h + ' ' + (SOURCE_NAMES[h] || '') + ' ' + urls.map(u => by[u].map(i => i.name).join(' ')).join(' ')).toLowerCase())}"><summary><b>${esc(SOURCE_NAMES[h] || h)}</b><br><span class="small muted">${esc(h)} · ${urls.length} page${urls.length > 1 ? 's' : ''} · cited ${n}×</span></summary>
        <ul>${urls.map(u => `<li><span class="cu">${esc(u)}</span><div class="chips">${by[u].map(i => `<a class="chip" href="#/view/${i.id}">${esc(i.name)}</a>`).join('')}</div></li>`).join('')}</ul></details>`;
    }).join('')}</div>
    <div class="section-title"><h2>Reference Works</h2></div>
    <div class="frame small"><ul class="uses" style="margin:0">
      <li><b>Moon phases and the moon picture:</b> Jean Meeus, <i>Astronomical Algorithms</i>, 2nd ed. (Willmann-Bell, 1998), chapters 25, 47, 48 and 49.</li>
      <li><b>Tarot card images:</b> the Rider–Waite–Smith deck, illustrated by Pamela Colman Smith (Rider, 1909), in the public domain.</li>
      <li><b>Tarot card meanings and symbols:</b> traditional readings in the line of Arthur Edward Waite, <i>The Pictorial Key to the Tarot</i> (Rider, 1910).</li>
      <li><b>Wheel of the Year, full moon names, magical correspondences, spells and deity lore:</b> traditional European folk magic, hoodoo and rootwork, Wiccan and herbal lore as widely published. These are presented as lore and were not part of the safety review.</li>
    </ul></div>
    <div class="section-title"><h2>Photos & Fonts</h2></div>
    <p class="small">Every photograph is credited on the <a href="#/credits">About & Credits</a> page. Fonts: Cinzel Decorative, Cormorant Garamond and IM Fell English (SIL Open Font License).</p>
    <p class="disclaimer">Traditional and folk use only, not medical advice. If someone swallows something poisonous, call Poison Control (US 1-800-222-1222) or your local emergency number.</p>`;
  $('#cq', v).oninput = e => { const q = e.target.value.trim().toLowerCase(); $$('.cite', v).forEach(d => { const m = !q || d.dataset.q.includes(q); d.style.display = m ? '' : 'none'; if (q && m) d.open = true; }); };
});

route('credits', async v => {
  setTitle('About');
  const herbs = Store.all('herb').filter(h => h.builtin && h.credit), crys = [...Store.all('crystal'), ...Store.all('deity')].filter(h => h.builtin && h.credit);
  v.innerHTML = `<div class="hero"><h1>${esc(Store.settings.title || "Paco Morningstar's Witches' Companion")}</h1></div>${DIV}
   <div class="frame"><p>An offline grimoire. Every entry, photo and font is stored inside the app; anything you write is kept privately on this device. The only time the app goes online is to check GitHub for updates, which you can turn off in Settings.</p>
   <p class="small">Correspondences draw on traditional European folk magic, hoodoo & rootwork, Wiccan and herbal lore. Medicinal notes reflect <b>traditional folk use</b> and are not medical advice — consult a qualified healthcare provider, especially when pregnant, nursing, on medication, or treating children. Plants marked ☠ are poisonous.</p>
   <p class="small">Moon phases are calculated on-device (Meeus algorithms) and shown in local time.</p></div>
   <div class="section-title"><h2>Photo Credits</h2></div>
   <p class="small muted">Herb photographs via iNaturalist; crystal and deity images via Openverse, Wikimedia Commons and the Cleveland Museum of Art Open Access (CC0). Used under their respective Creative Commons licences for personal, non-commercial use.</p>
   <div class="small"><div style="padding:4px 0;border-bottom:1px dashed var(--line)"><b>The Moon</b> — "Full Moon" photograph by Gregory H. Revera, CC BY-SA 3.0, via Wikimedia Commons. Phases are drawn by shading this photo to match the calculated sunlit fraction.</div>${[...herbs, ...crys].map(h => `<div style="padding:4px 0;border-bottom:1px dashed var(--line)"><b>${esc(h.name)}</b> — ${esc(h.credit)}</div>`).join('')}</div>
   <p class="small muted" style="margin-top:12px">Fonts: Cinzel Decorative, Cormorant Garamond & IM Fell English (SIL Open Font License).</p>`;
});
