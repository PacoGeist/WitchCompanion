/* ---------- CANDLE MAGIC: the Candles section (basics lessons, candle spells, dressings) ---------- */
const CandleData = {
  lessons: () => window.CANDLE_LESSONS || [],
  dressings: () => window.CANDLE_DRESSINGS || [],
  spells: () => Store.all('spell').filter(s => s.category === 'candle'),
  // other spells in the grimoire that also call for a candle
  otherSpells: () => Store.all('spell').filter(s => s.category !== 'candle' && arr(s.ingredients).some(g => /candle/i.test(typeof g === 'string' ? g : g.item || ''))),
};
const CANDLE_COLORS = [
  ['White', '#f4efe6', 'purity, peace, protection, truth, cleansing; stands in for any color'],
  ['Black', '#1b1720', 'banishing, absorbing negativity, protection, breaking curses, endings'],
  ['Red', '#b3242c', 'passion, courage, strength, vitality, fast action'],
  ['Pink', '#e79ab4', 'self-love, romance, friendship, kindness, emotional healing'],
  ['Orange', '#e07b28', 'success, opportunity, creativity, attraction, encouragement'],
  ['Yellow', '#e8c337', 'communication, study, confidence, joy, the sun'],
  ['Green', '#3f8f4e', 'money, prosperity, luck, growth, fertility, healing'],
  ['Light Blue', '#9cc7e8', 'calm, peace, gentle healing, patience, sleep'],
  ['Blue', '#2f5fa8', 'healing, truth, wisdom, protection of the home, tranquility'],
  ['Purple', '#7a4ca0', 'psychic power, spirituality, wisdom, ambition, ancestors'],
  ['Brown', '#7a5232', 'grounding, home, animals, steady work, stability'],
  ['Gold', '#d4ad5a', 'success, wealth, the sun, victory, the God'],
  ['Silver', '#c9cdd6', 'the moon, intuition, dreams, the Goddess, reflection'],
  ['Gray', '#8c8a90', 'neutrality, balance, canceling, quiet endings'],
];

function candleTile(href, icon, title, sub) {
  return `<a class="tile" href="${href}">${ART[icon] || ART.candle}<b>${title}</b><span>${sub}</span></a>`;
}

route('candles', async v => {
  await Craft.load();
  setTitle('Candles');
  const L = CandleData.lessons(), S = CandleData.spells(), D = CandleData.dressings(), O = CandleData.otherSpells();
  const next = L.find(l => !Craft.done[l.id]);
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.35rem">Candle Magic</h1><div class="sub">Flame, color, oil and intention</div></div>
    <p class="small muted center" style="margin:0 6px 10px">A candle gathers your intention, holds it while it burns, and carries it out into the world as light and heat. Start with the basics, then choose a spell or dress a candle of your own.</p>
    <a class="frame craft-banner" href="#/candles/basics">
      <div class="cb-ic">${ART.candle}</div>
      <div><h3 style="margin:0">Candle Basics</h3>
        <p class="small" style="margin:2px 0 6px">${next ? `Next lesson: <b style="color:var(--gold2)">${esc(next.title)}</b>` : 'Every lesson complete. Blessed be!'}</p>
        ${craftProgressHTML(L)}</div></a>
    <div class="grid" style="margin-top:12px">
      ${candleTile('#/candles/basics', 'book', 'Candle Basics', `${L.length} lessons`)}
      ${candleTile('#/candles/spells', 'candle', 'Candle Spells', `${S.length} spells`)}
      ${candleTile('#/candles/dressings', 'dropper', 'Candle Dressings', `${D.length} recipes`)}
      ${candleTile('#/candles/colors', 'pentacle', 'Candle Colors', 'what each color means')}
      ${candleTile('#/candles/spells?more=1', 'cauldron', 'More with Candles', `${O.length} other spells`)}
      ${candleTile('#/list/oil?o=formula', 'bottle', 'Dressing Oils', 'formulary oils')}
    </div>
    <div class="block caution" style="margin-top:14px"><h3>${ART.hand}Candle Safety</h3>
      <p>Never leave a flame unattended or burning while you sleep. Use a sturdy holder on a heatproof plate, 12 inches from anything that can burn, away from children and pets. Keep oil off the wick and herbs to a light dusting low on the candle or in a ring on the plate. Snuff, don't blow, and never throw water on burning wax.</p>
      <p class="small" style="margin:0"><a href="#/candles/basics/${esc((L[L.length - 1] || {}).id || '')}">Read the full safety lesson ›</a></p></div>`;
});

route('candles/basics', async v => {
  await Craft.load();
  setTitle('Candle Basics');
  const L = CandleData.lessons();
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.35rem">Candle Basics</h1><div class="sub">Lessons in candle magic, one flame at a time</div></div>
    ${craftProgressHTML(L)}
    <p class="small muted center" style="margin:10px 4px 4px">Each lesson has a practice to try, a step-by-step guided mode, journal prompts and a short quiz.</p>
    <div class="list craft-list">${L.map((l, i) => `<a class="row" href="#/candles/basics/${l.id}"><div class="thumb craft-num ${Craft.done[l.id] ? 'done' : ''}">${Craft.done[l.id] ? '✓' : i + 1}</div>
      <div class="txt"><div class="nm">${esc(l.title)}</div><div class="sb">${esc(l.subtitle)}</div><div class="small muted">~${l.minutes} min</div></div></a>`).join('')}</div>
    <p class="disclaimer">Candle magic is a spiritual practice. Fire is real: please read every Safety box.</p>`;
});
route('candles/basics/:id', async (v, [id]) => lessonPage(v, id, CandleData.lessons(), 'candles/basics'));

route('candles/spells', async (v, a, qs) => {
  const more = qs.more === '1';
  setTitle(more ? 'More with Candles' : 'Candle Spells');
  const list = more ? CandleData.otherSpells() : CandleData.spells();
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.35rem">${more ? 'More Spells with Candles' : 'Candle Spells'}</h1>
      <div class="sub">${more ? 'Other spells in the grimoire that use a candle' : 'Spells built around the flame'}</div></div>
    <div class="actions" style="margin-top:0">${more ? `<a class="btn small ghost" href="#/candles/spells">Candle Spells (${CandleData.spells().length})</a>` : `<a class="btn small ghost" href="#/candles/spells?more=1">More with candles (${CandleData.otherSpells().length})</a>`}<a class="btn small ghost" href="#/candles/dressings">Dressings</a></div>
    <div class="list">${list.map(s => rowHTML(s, esc(arr(s.metaphysical).slice(0, 4).join(', ')))).join('')}</div>`;
});

route('candles/dressings', async v => {
  setTitle('Candle Dressings');
  const D = CandleData.dressings();
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.35rem">Candle Dressings</h1><div class="sub">Oils, herbs and words to dress a candle</div></div>
    <p class="small muted center" style="margin:0 6px 10px">Dressing (anointing) a candle with oil and a little herb charges it for one purpose. Stroke toward you to draw something in, away from you to send it off.</p>
    <div class="list">${D.map(d => `<a class="row" href="#/candles/dressing/${d.id}">
      <div class="thumb candle-swatch">${d.candleColors.slice(0, 3).map(c => `<i style="background:${(CANDLE_COLORS.find(x => x[0].toLowerCase() === String(c).toLowerCase()) || [0, '#d4ad5a'])[1]}"></i>`).join('')}</div>
      <div class="txt"><div class="nm">${esc(d.name)}</div><div class="sb">${esc(d.purpose)}</div></div></a>`).join('')}</div>`;
});

route('candles/dressing/:id', async (v, [id]) => {
  const d = CandleData.dressings().find(x => x.id === id);
  if (!d) return (location.hash = '#/candles/dressings');
  setTitle('Candle Dressing');
  const P = (t, icon, html) => html ? `<div class="block"><h3>${ART[icon] || ''}${t}</h3>${html}</div>` : '';
  const ing = a => arr(a).length ? `<ul class="ingredients">${arr(a).map(g => `<li><span>${linkify(g.item)}</span><span class="amt">${esc(g.amount || '')}</span></li>`).join('')}</ul>` : '';
  const uses = CandleData.spells().filter(s => arr(s.metaphysical).some(t => arr(d.metaphysical).includes(t))).slice(0, 6);
  const src = arr(d.sources);
  v.innerHTML = `<div class="dhead" style="margin-top:8px"><div class="type">Candle Dressing</div><h1>${esc(d.name)}</h1><div class="latin">${esc(d.purpose)}</div></div>
    <div class="facts"><div class="fact"><small>CANDLE COLORS</small><span>${esc(arr(d.candleColors).join(', '))}</span></div>${d.carving ? `<div class="fact"><small>CARVE</small><span>${esc(d.carving)}</span></div>` : ''}</div>
    <p class="lead">${esc(d.description)}</p>${DIV}
    <div class="block frame"><h3>${ART.dropper}Oils</h3>${ing(d.oils)}</div>
    ${arr(d.herbs).length ? `<div class="block frame"><h3>${ART.leaf}Herbs</h3>${ing(d.herbs)}</div>` : ''}
    ${arr(d.extras).length ? `<div class="block frame"><h3>${ART.crystal}Also</h3>${ing(d.extras)}</div>` : ''}
    ${P('Which Way to Dress', 'hand', `<p>${esc(d.direction)}</p>`)}
    ${P('How to Dress the Candle', 'cauldron', `<ol class="steps">${arr(d.steps).map(s => `<li>${esc(s)}</li>`).join('')}</ol>`)}
    ${d.words ? `<div class="block"><h3>${ART.candle}Words to Speak</h3><div class="chant frame">${esc(d.words)}</div></div>` : ''}
    ${timingBlock(d)}
    ${P('Metaphysical Uses', 'pentacle', arr(d.metaphysical).length ? chipsHTML(d.metaphysical) : '')}
    <div class="block caution safety"><h3>${ART.hand}Safety</h3><p><b>Caution · </b>${esc(d.caution)}</p>${d.pets ? `<p><b>Pets · </b>${esc(d.pets)}</p>` : ''}
      ${src.length ? `<details class="srcs"><summary>Sources checked (${src.length})</summary><ul>${src.map(u => `<li><b>${esc(srcHost(u))}</b><br><span>${esc(u)}</span></li>`).join('')}</ul></details>` : ''}</div>
    ${uses.length ? `<div class="section-title"><h2>Spells to Pair With</h2></div><div class="list">${uses.map(s => rowHTML(s)).join('')}</div>` : ''}
    <div class="actions"><a class="btn ghost" href="#/candles/dressings">‹ All dressings</a><a class="btn ghost" href="#/candles">Candles ›</a></div>`;
});

route('candles/colors', async v => {
  setTitle('Candle Colors');
  const lesson = CandleData.lessons().find(l => /color/i.test(l.title));
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.35rem">Candle Colors</h1><div class="sub">Choose the color that matches your intention</div></div>
    <div class="list">${CANDLE_COLORS.map(([n, c, m]) => {
      const sp = CandleData.spells().filter(s => arr(s.ingredients).some(g => new RegExp('\\b' + n + '\\b', 'i').test(g.item || '') && /candle|taper|pillar|tealight|chime/i.test(g.item || ''))).length;
      return `<div class="row"><div class="thumb candle-swatch big"><i style="background:${c}"></i></div><div class="txt"><div class="nm">${n}</div><div class="sb">${esc(m)}</div>${sp ? `<div class="small muted">${sp} candle spell${sp > 1 ? 's' : ''}</div>` : ''}</div></div>`;
    }).join('')}</div>
    <p class="small muted center">No color to hand? A plain white candle can stand in for any color.</p>
    ${lesson ? `<div class="actions"><a class="btn" href="#/candles/basics/${lesson.id}">${ART.book} Read the lesson on colors</a></div>` : ''}`;
});
