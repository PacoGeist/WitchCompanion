/* ---------- TAROT HUB: the page behind the home screen's "Tarot Layouts" button ---------- */
const HOLIDAY_BD = ['halloween', 'yuletide', 'newyear', 'valentine', 'shamrock', 'easter', 'harvest', 'winter', 'spring', 'summer', 'autumn'];
const isDailySpread = i => /daily|card of the day|today/i.test(i.name + ' ' + i.id);
const isHolidaySpread = i => HOLIDAY_BD.includes(i.backdrop);

// what each moon phase is especially good for in tarot
const TAROT_PHASE_TIPS = {
  'New Moon': 'Draw for intentions and fresh starts. Ask what wants to begin, and keep the reading simple.',
  'Waxing Crescent': 'Ask about what is growing: new love, new projects, first steps. Look for the card that shows your next small move.',
  'First Quarter': 'A time for decision spreads. Ask what is in the way and what action will push you through.',
  'Waxing Gibbous': 'Refine and adjust. Ask what needs fine-tuning before something comes to fruition.',
  'Full Moon': 'The strongest time for divination. Big spreads, deep questions, and readings about what has come to light.',
  'Waning Gibbous': 'Ask what you have learned and what to share. Good for gratitude and reflection readings.',
  'Last Quarter': 'Ask what to release, forgive or finish. Release and obstacle spreads work beautifully now.',
  'Waning Crescent': 'Rest and listen. Gentle, intuitive one or three card draws, shadow work and dream readings.',
  'Dark Moon': 'The veiled face. Shadow work, ancestor messages and quiet, private questions.',
};

// one featured spread for the current phase, chosen from spreads that are specific to it (not the everyday ones)
function phaseFeature(phase, date) {
  const all = Store.all('tarot').filter(i => arr(i.moonPhases).includes(phase));
  const specific = all.filter(i => !isDailySpread(i) && !isHolidaySpread(i) && arr(i.moonPhases).length <= 4);
  const pool = specific.length ? specific : all;
  return { all, pick: pool.length ? pool[(date.getDate() + date.getMonth() * 31) % pool.length] : null };
}

route('tarot', async v => {
  await Journal.load(); await Decks.load();
  setTitle('Tarot');
  const now = new Date(), m = MOON.current(now), wd = WEEKDAYS[now.getDay()];
  const phase = m.dark ? 'Dark Moon' : m.name, { all, pick } = phaseFeature(phase, now);
  const layouts = Store.all('tarot');
  const mine = Object.values(Store.user).filter(i => i.type === 'tarot').length;
  const nWait = Journal.list.filter(e => !e.results && !e.outcome).length;
  const tile = (href, icon, b, s) => `<a class="tile" href="${href}">${ART[icon]}<b>${b}</b><span>${s}</span></a>`;
  v.innerHTML = `
    <div class="frame today-box" style="margin-top:6px">
      <h3>${esc(wd[0])} · Day of ${esc(wd[1])}</h3>
      <p class="small" style="margin:6px 0 2px">Today is a good day to ask about: <i>${esc(wd[2])}</i></p>
      <div class="actions" style="margin:10px 0 4px"><a class="btn primary" href="#/reading/tarot-one-card-daily">${ART.tarot} Card of the Day</a><a class="btn" href="#/reading/tarot-daily-three">${ART.sun} Today's Three</a></div>
      ${pick ? `<p class="small" style="margin:8px 0 0">For the ${esc(phase)}: <a href="#/view/${pick.id}"><b>${esc(pick.name)}</b></a> · <a href="#/list/tarot?p=1">all ${all.length} spreads for this phase ›</a></p>` : ''}
    </div>
    <a class="frame moonbox" href="#/moon" style="color:inherit;margin-top:12px">
      <div class="moonpic">${MOON.photo(m.fraction, 86)}</div>
      <div><div class="ph">${esc(phase)}</div>
        <p>${(m.illum * 100).toFixed(0)}% illuminated · ${m.waxing ? 'waxing' : 'waning'}</p>
        <p class="small" style="margin:4px 0 0">${esc(MOON.PHASE_INFO[phase] || '')}</p>
        <p class="small" style="margin:6px 0 0;color:var(--gold2)"><i>For your readings: ${esc(TAROT_PHASE_TIPS[phase] || '')}</i></p></div>
    </a>
    <div class="section-title"><h2>The Tarot</h2></div>
    <div class="grid home-grid">
      ${tile('#/list/tarot', 'tarot', 'All Layouts', `${layouts.length} spreads`)}
      ${tile('#/list/tarot?d=1', 'sun', 'Daily Layouts', `${layouts.filter(isDailySpread).length} quick draws`)}
      ${tile('#/list/tarot?h=1', 'leaf', 'Holiday & Seasonal', `${layouts.filter(isHolidaySpread).length} themed spreads`)}
      ${tile('#/deck', 'eye', 'Card by Card', 'all 78 cards')}
      ${tile('#/learn/lessons', 'book', 'Tarot Basics', `${(window.TAROT_LESSONS || []).length} lessons`)}
      ${tile('#/record', 'edit', 'Record a Reading', 'from your own deck')}
      ${tile('#/journal?t=tarot', 'book', 'Journal', nWait ? `${nWait} awaiting results` : `${Journal.list.length} readings`)}
      ${tile('#/moon', 'triplemoon', 'Moon Tracker', 'phases & full moons')}
      ${tile('#/mine?t=tarot', 'plus', 'My Spreads', mine ? `${mine} of your own` : 'design your own')}
      ${tile('#/decks', 'crystal', 'My Decks', Decks.list.length ? `${Decks.list.length} deck${Decks.list.length === 1 ? '' : 's'} · photograph & share` : 'photograph your own deck')}
      ${tile('#/tarot/stats', 'star', 'Card Stats', 'trends in your cards')}
    </div>`;
});

/* ---------- MY DECKS: the physical decks you own ---------- */
const Decks = {
  list: [], loaded: false,
  async load() { if (this.loaded) return; try { this.list = await DB.get('decks', []) || []; } catch (e) { this.list = []; } this.loaded = true; },
  async save() { await DB.set('decks', this.list); },
  get(id) { return this.list.find(d => d.id === id); },
  label(id) { if (!id) return 'Drawn in the app'; const d = this.get(id); return d ? d.name : 'A deck no longer listed'; },
};
const deckOfReading = r => r.deck || (r.manual ? 'unknown' : '');

route('decks', async v => {
  await Decks.load(); await Journal.load();
  setTitle('My Decks');
  const used = id => Journal.list.filter(r => r.deck === id).length;
  v.innerHTML = `<p class="center small muted" style="margin:6px 4px 10px">Keep a record of the decks you own. When you record a reading, choose which deck you used, and Card Stats can show the trends for each deck.</p>
    <div class="actions" style="margin-top:0"><button class="btn primary big" id="dphoto">${ART.image} Photograph a deck</button></div>
    <div class="list">${Decks.list.map(d => `<a class="row" href="#/decks/${d.id}"><div class="thumb">${d.image ? `<img src="${d.image}" alt="" style="object-fit:cover">` : ART.tarot}</div>
      <div class="txt"><div class="nm">${esc(d.name)}</div><div class="sb">${esc([d.creator, d.since ? 'since ' + d.since : ''].filter(Boolean).join(' · '))}</div><div class="small" style="color:var(--gold2)">${(d.cards || []).length}/78 cards photographed · open to photograph ›</div><div class="small muted">${used(d.id)} recorded reading${used(d.id) === 1 ? '' : 's'}${d.isDefault ? ' · your usual deck' : ''}${Store.settings.activeDeck === d.id ? ' · shown in the app' : ''}</div></div></a>`).join('') || `<div class="empty">${ART.tarot}No decks yet. Add the first one you love.</div>`}</div>
    <div class="actions"><button class="btn primary" id="dadd">${ART.plus} Add a deck</button><button class="btn ghost" id="dimp">Install a shared deck</button></div>
    <p class="small muted center">Open a deck to photograph its 78 cards, show them in your readings, or export the deck as a file to give to a friend.</p>`;
  $('#dadd', v).onclick = () => deckEditor(null);
  $('#dphoto', v).onclick = () => {
    if (!Decks.list.length) return deckEditor(null, true);
    modal(`<h2>Photograph a Deck</h2><p class="small center">Which deck are you photographing?</p><div class="list">${Decks.list.map(d => `<a class="row" href="#/decks/${d.id}" data-shoot="${d.id}"><div class="thumb">${d.image ? `<img src="${d.image}" alt="" style="object-fit:cover">` : ART.tarot}</div><div class="txt"><div class="nm">${esc(d.name)}</div><div class="sb">${(d.cards || []).length}/78 photographed</div></div></a>`).join('')}</div>
      <div class="actions"><button class="btn" id="pnew">${ART.plus} A new deck</button><button class="btn ghost" id="pcx">Cancel</button></div>`, (m, close) => {
      $('#pcx', m).onclick = close; $('#pnew', m).onclick = () => { close(); deckEditor(null, true); };
      m.querySelector('.list').onclick = e => { const a = e.target.closest('[data-shoot]'); if (!a) return; e.preventDefault(); close(); const d = Decks.get(a.dataset.shoot); location.hash = '#/decks/' + d.id; const first = TAROT_DECK.findIndex((c, i) => !(d.cards || []).includes(i)); setTimeout(() => captureCard(d, first < 0 ? 0 : first, first >= 0), 300); };
    });
  };
  $('#dimp', v).onclick = () => importDeckFile();
});
function deckEditor(d, thenShoot) {
  const x = d ? { ...d } : { id: newId('deck'), name: '', creator: '', since: '', notes: '', image: '' };
  modal(`<h2>${d ? 'Edit Deck' : 'Add a Deck'}</h2><div class="form">
      ${d ? `<div class="deck-photo" id="dph">${x.image ? `<img src="${x.image}" alt="">` : `${ART.image}<span class="small">Add a cover photo</span>`}</div>` : `<p class="small muted center" style="margin:0 0 6px">Name your deck, then save. Next the camera opens to photograph all 78 cards, one at a time. Tap the cover box on the deck page any time to add a cover photo.</p>`}
      <label for="dn">Deck name</label><input type="text" id="dn" value="${esc(x.name)}" placeholder="e.g. Rider–Waite–Smith, Wild Unknown…">
      <label for="dc">Creator or publisher (optional)</label><input type="text" id="dc" value="${esc(x.creator)}">
      <label for="ds">Owned since (optional)</label><input type="text" id="ds" value="${esc(x.since)}" placeholder="e.g. 2019, or a birthday gift">
      <label for="dnt">Notes</label><textarea id="dnt" placeholder="How it reads for you, how you cleanse it, its personality…">${esc(x.notes)}</textarea>
      <label class="small" style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="ddef" ${x.isDefault ? 'checked' : ''}> This is my usual deck (chosen automatically when I record a reading)</label>
      <div class="actions">${d ? `<button class="btn danger" id="ddel">${ART.trash} Remove</button>` : ''}<button class="btn ghost" id="dcan">Cancel</button><button class="btn primary" id="dsav">${d ? 'Save' : 'Save & photograph cards'}</button></div></div>`, (m, close) => {
    if (d) $('#dph', m).onclick = () => { close(); photoChoice('Deck cover', d.image, () => captureCard(d, -1, false), async () => { const f = await pickFile('image/*'); if (!f) return; adjustCard(d, -1, await readImageFile(f, 2000, .9), false); }); };
    $('#dcan', m).onclick = close;
    if (d) $('#ddel', m).onclick = async () => { close(); if (!await confirmBox(`Remove “${d.name}”? Readings recorded with it are kept.`, 'Remove')) return; await DeckImg.delAll(d); Decks.list = Decks.list.filter(y => y.id !== d.id); await Decks.save(); if (Store.settings.activeDeck === d.id) { await Store.setSetting('activeDeck', ''); await applyDeckImages(); } location.hash = '#/decks'; render(); };
    $('#dsav', m).onclick = async () => {
      x.name = $('#dn', m).value.trim(); if (!x.name) { toast('Give the deck a name'); return; }
      x.creator = $('#dc', m).value.trim(); x.since = $('#ds', m).value.trim(); x.notes = $('#dnt', m).value.trim(); x.isDefault = $('#ddef', m).checked;
      if (x.isDefault) Decks.list.forEach(y => y.isDefault = false);
      const i = Decks.list.findIndex(y => y.id === x.id); if (i >= 0) Decks.list[i] = x; else Decks.list.push(x);
      await Decks.save(); close(); toast('Deck saved ✶');
      if (!d) { location.hash = '#/decks/' + x.id; setTimeout(() => captureCard(Decks.get(x.id), 0, true), 400); } else render();
    };
  });
}

/* ---------- CARD STATS ---------- */
const COURT_RE = /^(Page|Knight|Queen|King) of /, NUM_WORDS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const SUITS = ['Major', 'Wands', 'Cups', 'Swords', 'Pentacles'];
const SUIT_LABEL = { Major: 'Major Arcana', Wands: 'Wands', Cups: 'Cups', Swords: 'Swords', Pentacles: 'Pentacles' };

route('tarot/stats', async (v, a, qs) => {
  await Journal.load(); await Decks.load();
  setTitle('Card Stats');
  let period = qs.p || 'all', deck = qs.d || 'all';
  const draw = () => {
    history.replaceState(null, '', `#/tarot/stats?p=${period}&d=${encodeURIComponent(deck)}`);
    const since = { all: 0, '30': Date.now() - 30 * 864e5, '90': Date.now() - 90 * 864e5, year: new Date(new Date().getFullYear(), 0, 1).getTime() }[period];
    const rs = Journal.list.filter(r => r.at >= since && (deck === 'all' || (deck === 'app' ? !r.manual : r.deck === deck)));
    const draws = []; rs.forEach(r => r.cards.forEach(c => { if (c.card && TAROT_BY_NAME[c.card]) draws.push({ r, c, card: TAROT_BY_NAME[c.card] }); }));
    const filters = `<div class="stat-filters"><div class="chips scroll">${[['all', 'All time'], ['30', '30 days'], ['90', '90 days'], ['year', 'This year']].map(([k, l]) => `<button class="chip ${period === k ? 'on' : ''}" data-p="${k}">${l}</button>`).join('')}</div>
      <select id="sdeck"><option value="all">All decks</option><option value="app" ${deck === 'app' ? 'selected' : ''}>Drawn in the app</option>${Decks.list.map(d => `<option value="${d.id}" ${deck === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>`;
    if (!draws.length) {
      v.innerHTML = filters + `<div class="empty">${ART.star}<p>No cards to count yet.</p><p class="small">Every reading you draw or record is counted here. After a few readings you will see which cards keep coming back to you.</p></div><div class="actions"><a class="btn primary" href="#/reading/tarot-one-card-daily">${ART.tarot} Draw the Card of the Day</a></div>`;
      bind(); return;
    }
    const count = {}, readingsWith = {}; draws.forEach(d => { count[d.card.name] = (count[d.card.name] || 0) + 1; (readingsWith[d.card.name] = readingsWith[d.card.name] || new Set()).add(d.r.id); });
    const top = Object.entries(count).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 12);
    const N = draws.length, distinct = Object.keys(count).length;
    const avgTone = draws.reduce((s, d) => s + toneOf(d.card.name), 0) / N;
    // suits vs what chance alone would give
    const suitN = {}; SUITS.forEach(s => suitN[s] = 0); draws.forEach(d => suitN[d.card.arcana]++);
    const expected = { Major: 22 / 78 }; ['Wands', 'Cups', 'Swords', 'Pentacles'].forEach(s => expected[s] = 14 / 78);
    const maxShare = Math.max(...SUITS.map(s => suitN[s] / N), .3);
    const bar = (label, n, exp, max) => { const pct = n / N; return `<div class="sbar" title="${esc(label)}: ${n} of ${N} cards (${(pct * 100).toFixed(0)}%). By chance you'd expect about ${(exp * 100).toFixed(0)}%.">
        <span class="sb-l">${esc(label)}</span><span class="sb-t"><i style="width:${(pct / max * 100).toFixed(1)}%"></i><em style="left:${(exp / max * 100).toFixed(1)}%"></em></span><span class="sb-v">${(pct * 100).toFixed(0)}%</span></div>`; };
    const lean = SUITS.map(s => ({ s, d: suitN[s] / N - expected[s] })).sort((x, y) => y.d - x.d)[0];
    const SUIT_MSG = { Major: 'big life lessons and turning points', Wands: 'passion, drive and creative fire', Cups: 'feelings, love and relationships', Swords: 'thoughts, conflict and decisions', Pentacles: 'money, work, body and home' };
    // courts and numbers
    const courtN = draws.filter(d => COURT_RE.test(d.card.name)).length;
    const numN = NUM_WORDS.map(w => draws.filter(d => d.card.name.startsWith(w + ' of ')).length), numMax = Math.max(...numN, 1);
    // cards that keep returning lately
    const recent = Journal.list.filter(r => r.at >= Date.now() - 30 * 864e5);
    const rc = {}; recent.forEach(r => new Set(r.cards.map(c => c.card).filter(Boolean)).forEach(n => rc[n] = (rc[n] || 0) + 1));
    const returning = Object.entries(rc).filter(([, n]) => n >= 3).sort((x, y) => y[1] - x[1]).slice(0, 6);
    // which card most often lands in each kind of position
    const byCtx = {}; draws.forEach(d => { const k = posContext(d.c.pos, d.c.posMeaning).ctx; (byCtx[k] = byCtx[k] || {}); byCtx[k][d.card.name] = (byCtx[k][d.card.name] || 0) + 1; });
    const ctxRows = ['present', 'challenge', 'advice', 'future', 'past', 'love', 'work', 'spirit'].filter(k => byCtx[k]).map(k => { const [n, c] = Object.entries(byCtx[k]).sort((x, y) => y[1] - x[1])[0]; return { k, n, c }; }).filter(x => x.c >= 2);
    // tone over time: monthly average
    const months = {}; rs.slice().reverse().forEach(r => { const cs = r.cards.filter(c => c.card && TAROT_BY_NAME[c.card]); if (!cs.length) return; const key = new Date(r.at).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }); (months[key] = months[key] || []).push(cs.reduce((s, c) => s + toneOf(c.card), 0) / cs.length); });
    const mPts = Object.entries(months).map(([k, a]) => ({ v: a.reduce((x, y) => x + y, 0) / a.length, label: `${k}: ${toneWord(a.reduce((x, y) => x + y, 0) / a.length)} (${a.length} reading${a.length === 1 ? '' : 's'})` }));
    const never = TAROT_DECK.filter(c => !count[c.name]);
    v.innerHTML = filters + `
      <div class="facts" style="margin-top:10px">
        <div class="fact"><small>READINGS</small><span>${rs.length}</span></div>
        <div class="fact"><small>CARDS DRAWN</small><span>${N}</span></div>
        <div class="fact"><small>DIFFERENT CARDS</small><span>${distinct} of 78</span></div>
        <div class="fact"><small>OVERALL TONE</small><span>${esc(TONE_LABEL[Math.round(avgTone)])}</span></div>
      </div>
      ${returning.length ? `<div class="block frame" style="margin-top:12px"><h3>${ART.eye}Keeps Coming Back</h3><p class="small muted" style="margin-top:0">These cards turned up in three or more of your readings in the last 30 days. When a card keeps returning, its message is asking to be heard.</p>
        <div class="deck-grid stat-grid">${returning.map(([n, k]) => `<a class="deck-card stat-card" href="#/card/${encodeURIComponent(n)}"><img src="${TAROT_BY_NAME[n].img}" alt="" loading="lazy"><b>${esc(shortName(n))}</b><span class="badge">${k} readings</span></a>`).join('')}</div></div>` : ''}
      <div class="section-title"><h2>Your Most Drawn Cards</h2></div>
      <div class="deck-grid stat-grid">${top.map(([n, k]) => `<a class="deck-card stat-card" href="#/card/${encodeURIComponent(n)}" title="${esc(shortName(n))}: drawn ${k} time${k === 1 ? '' : 's'}"><img src="${TAROT_BY_NAME[n].img}" alt="" loading="lazy"><b>${esc(shortName(n))}</b><span class="badge">×${k}</span></a>`).join('')}</div>
      <p class="small muted center">By chance alone, any one card would turn up about ${(N / 78).toFixed(1)} time${N / 78 >= 1.05 || N / 78 < .95 ? 's' : ''} in ${N} cards.</p>
      <div class="block frame"><h3>${ART.pentacle}Suits & Arcana</h3>
        ${SUITS.map(s => bar(SUIT_LABEL[s], suitN[s], expected[s], maxShare)).join('')}
        <p class="small muted" style="margin:6px 0 0">The thin gold mark on each bar shows what chance alone would give.</p>
        ${N >= 10 && lean.d > 0.05 ? `<p style="margin:8px 0 0">Your cards lean toward <b>${esc(SUIT_LABEL[lean.s])}</b>: ${esc(SUIT_MSG[lean.s])} ${lean.s === 'Major' ? 'are' : 'is'} where your energy has been.</p>` : ''}
      </div>
      <div class="block frame"><h3>${ART.star}Numbers & Court Cards</h3>
        <div class="num-bars">${NUM_WORDS.map((w, i) => `<div class="nb" title="${w}s: drawn ${numN[i]} time${numN[i] === 1 ? '' : 's'}"><i style="height:${(numN[i] / numMax * 100).toFixed(0)}%"></i><span>${i ? i + 1 : 'A'}</span></div>`).join('')}</div>
        <p class="small" style="margin:8px 0 0">Court cards (Pages, Knights, Queens, Kings): <b>${courtN}</b> of ${N} (${(courtN / N * 100).toFixed(0)}%, about ${(16 / 78 * 100).toFixed(0)}% by chance). ${courtN / N > .3 && N >= 10 ? 'Lots of people energy: other people are playing a big part in your questions.' : ''}</p>
      </div>
      ${ctxRows.length ? `<div class="block frame"><h3>${ART.tarot}Cards and Their Places</h3><p class="small muted" style="margin-top:0">The card that most often lands in each kind of position.</p>
        ${ctxRows.map(x => `<div class="ctx-stat"><span>${esc(CTX_LABEL[x.k])}</span><a href="#/card/${encodeURIComponent(x.n)}"><b>${esc(shortName(x.n))}</b></a><span class="muted small">×${x.c}</span></div>`).join('')}</div>` : ''}
      ${mPts.length >= 2 ? `<div class="block frame"><h3>${ART.moon}Tone Over Time</h3><p class="small muted" style="margin-top:0">The average mood of your cards each month, from difficult (bottom) to very favourable (top). Tap a dot for details.</p>${sparkSVG(mPts, 90)}
        <div class="small muted" style="display:flex;justify-content:space-between"><span>${esc(Object.keys(months)[0])}</span><span>${esc(Object.keys(months).slice(-1)[0])}</span></div>
        <p style="margin:6px 0 0">Trend: <b>${esc(trendOf(mPts.map(p => p.v)).label)}</b></p></div>` : ''}
      <details class="block frame"><summary><b>Cards you haven't drawn yet · ${never.length}</b></summary><div class="deck-grid" style="margin-top:8px">${never.map(cardTile).join('')}</div></details>`;
    bind();
  };
  const bind = () => {
    v.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { period = b.dataset.p; draw(); });
    $('#sdeck', v).onchange = e => { deck = e.target.value; draw(); };
  };
  draw();
});

// "your history with this card" on each card page
function cardHistoryHTML(name) {
  const hits = []; Journal.list.forEach(r => r.cards.forEach(c => { if (c.card === name) hits.push({ r, c }); }));
  if (!hits.length) return `<div class="block"><h3>${ART.star}Your History</h3><p class="small muted">You haven't drawn this card yet. Every time it turns up in a reading, it will be noted here.</p></div>`;
  const pos = {}; hits.forEach(h => pos[h.c.pos] = (pos[h.c.pos] || 0) + 1);
  const topPos = Object.entries(pos).sort((a, b) => b[1] - a[1]).slice(0, 4);
  return `<div class="block frame"><h3>${ART.star}Your History With This Card</h3>
    <p style="margin-top:0">Drawn <b>${hits.length}</b> time${hits.length === 1 ? '' : 's'}, most recently <b>${fmtDate(new Date(hits[0].r.at), { month: 'short', day: 'numeric', year: 'numeric' })}</b>.</p>
    <p class="small">Most often in: ${topPos.map(([p, n]) => `<span class="chip" style="font-size:.76rem;padding:0 8px">${esc(p)} ×${n}</span>`).join(' ')}</p>
    <div class="list">${hits.slice(0, 5).map(h => `<a class="row" href="#/journal/${h.r.id}"><div class="txt"><div class="nm">${esc(h.r.spreadName)}</div><div class="small muted">${fmtWhen(h.r.at)} · ${esc(h.c.pos)}${h.r.question ? ` · “${esc(h.r.question)}”` : ''}</div></div></a>`).join('')}</div>
    <div class="actions"><a class="btn small ghost" href="#/tarot/stats">${ART.star} All card stats</a></div></div>`;
}
