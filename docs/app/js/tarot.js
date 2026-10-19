/* Picture deck (Rider–Waite–Smith, public domain), card picker and recording readings done by hand */
const ARCANA = ['Major', 'Wands', 'Cups', 'Swords', 'Pentacles'];

// tap any card picture to see it large with its meaning (all cards are read upright)
document.addEventListener('click', e => {
  const el = e.target.closest('[data-card]');
  if (!el || el.closest('.picker') || el.closest('.no-zoom')) return;
  const c = TAROT_BY_NAME[el.dataset.card]; if (!c || !c.img) return;
  e.preventDefault(); e.stopPropagation();
  openLightbox({ src: c.img, caption: `${c.name} — ${c.up}` });
}, true);

/* ---------- the deck ---------- */
route('deck', async (v, a, qs) => {
  setTitle('The Deck');
  let arc = qs.a || '', f = '';
  v.innerHTML = `<p class="center fell" style="margin:6px 0 2px"><i>The Rider–Waite–Smith tarot, illustrated by Pamela Colman Smith (1909)</i></p>
    <p class="center small muted" style="margin:0 0 10px">Tap a card for its full meaning. All cards are read upright.</p>
    <div class="searchbar">${ART.search}<input id="df" type="search" placeholder="Search cards or meanings…"></div>
    <div class="chips scroll" id="da"><button class="chip ${!arc ? 'on' : ''}" data-a="">All 78</button>${ARCANA.map(x => `<button class="chip ${arc === x ? 'on' : ''}" data-a="${x}">${x === 'Major' ? 'Major Arcana' : x}</button>`).join('')}</div>
    <div class="deck-grid" id="dg"></div>`;
  const draw = () => {
    const n = norm(f);
    const list = TAROT_DECK.filter(c => (!arc || c.arcana === arc) && (!n || norm(c.name + ' ' + c.up).includes(n)));
    $('#dg', v).innerHTML = list.map(c => `<a class="deck-card" href="#/card/${encodeURIComponent(c.name)}"><img src="${c.img}" alt="" loading="lazy"><b>${esc(c.name.replace(/^[0IVXL]+ · /, ''))}</b><span>${esc(c.up)}</span></a>`).join('') || '<div class="empty">No cards match.</div>';
  };
  $('#df', v).oninput = e => { f = e.target.value; draw(); };
  $('#da', v).onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; arc = b.dataset.a; $$('#da .chip', v).forEach(x => x.classList.toggle('on', x === b)); draw(); };
  draw();
});

/* ---------- card picker ---------- */
function pickCard(title, taken, current) {
  return new Promise(res => {
    let arc = '', f = '', done = false;
    const close = modal(`<h2>${esc(title)}</h2>
      <div class="picker">
        <div class="searchbar" style="margin-top:0">${ART.search}<input id="pf" type="search" placeholder="Type a card name…" autocomplete="off"></div>
        <div class="chips scroll" id="pa"><button class="chip on" data-a="">All</button>${ARCANA.map(x => `<button class="chip" data-a="${x}">${x === 'Major' ? 'Major' : x}</button>`).join('')}</div>
        <div class="deck-grid small-grid" id="pg"></div>
        <div class="actions">${current ? `<button type="button" class="btn small danger" id="pclear">Clear this position</button>` : ''}<button type="button" class="btn small ghost" id="pcancel">Cancel</button></div>
      </div>`, (m, cl) => {
      const draw = () => {
        const n = norm(f);
        const list = TAROT_DECK.filter(c => (!arc || c.arcana === arc) && (!n || norm(c.name).includes(n)));
        $('#pg', m).innerHTML = list.map(c => {
          const used = taken[c.name];
          return `<button type="button" class="deck-card ${c.name === current ? 'on' : ''} ${used ? 'used' : ''}" data-pick="${esc(c.name)}"><img src="${c.img}" alt="" loading="lazy"><b>${esc(c.name.replace(/^[0IVXL]+ · /, ''))}</b>${used ? `<span>in position ${used}</span>` : ''}</button>`;
        }).join('') || '<div class="empty">No cards match.</div>';
      };
      $('#pf', m).oninput = e => { f = e.target.value; draw(); };
      $('#pa', m).onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; arc = b.dataset.a; $$('#pa .chip', m).forEach(x => x.classList.toggle('on', x === b)); draw(); };
      $('#pg', m).onclick = e => { const b = e.target.closest('[data-pick]'); if (!b) return; done = true; cl(); res(b.dataset.pick); };
      $('#pcancel', m).onclick = () => { done = true; cl(); res(undefined); };
      const pc = $('#pclear', m); if (pc) pc.onclick = () => { done = true; cl(); res(null); };
      draw();
      setTimeout(() => $('#pf', m).focus(), 80);
    });
  });
}

/* ---------- record a reading done by hand ---------- */
route('record', async (v, a, qs) => {
  await Journal.load(); await Decks.load();
  const editing = qs.edit ? Journal.get(qs.edit) : null;
  setTitle(editing ? 'Edit Recorded Reading' : 'Record a Reading');
  const spreads = Store.all('tarot');
  let spread = editing ? (Store.get(editing.spreadId) || { id: editing.spreadId, name: editing.spreadName, positions: editing.positions.map((p, i) => ({ ...p, meaning: (editing.cards[i] || {}).posMeaning || '' })) }) : (Store.get(qs.s) || null);
  let picks = editing ? editing.cards.map(c => c.card || null) : [];
  const toLocal = t => { const d = new Date(t); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  v.innerHTML = `
    <p class="center small muted" style="margin:6px 0 0">Log a reading you did with your own deck: choose the spread, then the card that landed in each position.</p>
    <div class="form">
      <label for="rs">Spread</label>
      <select id="rs"><option value="">Choose a spread…</option>${spreads.map(s => `<option value="${esc(s.id)}" ${spread && spread.id === s.id ? 'selected' : ''}>${esc(s.name)} (${arr(s.positions).length} cards)</option>`).join('')}${editing && !Store.get(editing.spreadId) ? `<option value="${esc(editing.spreadId)}" selected>${esc(editing.spreadName)}</option>` : ''}</select>
      <label for="rw">When was the reading?</label>
      <input type="datetime-local" id="rw" value="${toLocal(editing ? editing.at : Date.now())}" style="width:100%;background:var(--input);border:1px solid var(--line2);border-radius:10px;color:var(--ink);font:inherit;padding:9px 11px">
      ${Decks.list.length ? `<label for="rd">Deck used</label><select id="rd"><option value="">Not specified</option>${Decks.list.map(d => `<option value="${d.id}" ${(editing ? editing.deck === d.id : d.isDefault) ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>` : `<p class="small muted" style="margin:6px 0 0">Tip: add your decks in <a href="#/decks">My Decks</a> to note which deck you used.</p>`}
      <label for="rq">Question (optional)</label>
      <input type="text" id="rq" value="${esc(editing ? editing.question || '' : '')}" placeholder="What did you ask the cards?">
    </div>
    <div id="rbody"></div>
    <div class="form"><label for="rn">Notes & impressions</label><textarea id="rn" placeholder="What stood out at the time…">${esc(editing ? editing.notes || '' : '')}</textarea>
      <div class="hint">You can add the results later from your Journal.</div></div>
    <div class="actions"><button class="btn ghost" id="rcancel">Cancel</button><button class="btn primary" id="rsave">${ART.book} Save to Journal</button></div>`;
  const body = () => {
    const box = $('#rbody', v);
    if (!spread) { box.innerHTML = `<div class="empty" style="padding:16px">${ART.tarot}Choose a spread above to lay out its positions.</div>`; return; }
    const ps = arr(spread.positions);
    picks.length = ps.length;
    const drawn = ps.map((p, i) => picks[i] ? { card: { name: picks[i] } } : null);
    const filled = picks.filter(Boolean).length;
    box.innerHTML = `<div class="block frame no-zoom"><h3>${ART.tarot}${esc(spread.name)}</h3><p class="small muted" style="margin-top:0">Tap a position to choose its card · ${filled} of ${ps.length} chosen</p>${layoutHTML(ps, drawn, spread.lines, spread.backdrop)}</div>
      <div class="positions record-list">${ps.map((p, i) => `<button type="button" class="pos rec-pos" data-pos="${i}">
        ${picks[i] ? `<img class="pos-card" src="${tarotImg(picks[i])}" alt="">` : `<span class="pos-card empty-card">?</span>`}
        <span class="n">${p.n}</span><div style="text-align:left"><b>${esc(p.name)}</b>${picks[i] ? ` — <span class="card-name">${esc(picks[i])}</span><br><span class="small">${esc(interpret(picks[i], p.name, p.meaning).text)}</span>` : `<br><span class="small muted">${esc(p.meaning || '')}</span><br><span class="small" style="color:var(--gold2)">Tap to choose the card</span>`}</div></button>`).join('')}</div>`;
  };
  const choose = async i => {
    const ps = arr(spread.positions);
    const taken = {}; picks.forEach((c, k) => { if (c && k !== i) taken[c] = ps[k].n; });
    const c = await pickCard(`Position ${ps[i].n}: ${ps[i].name}`, taken, picks[i]);
    if (c === undefined) return;
    if (c && taken[c]) { const k = picks.indexOf(c); if (k >= 0) picks[k] = null; toast(`Moved ${c.replace(/^[0IVXL]+ · /, '')} here from position ${taken[c]}`); }
    picks[i] = c; body();
  };
  $('#rbody', v).addEventListener('click', e => {
    const b = e.target.closest('[data-pos]') || e.target.closest('.layout .card');
    if (!b || !spread) return;
    e.preventDefault(); e.stopPropagation();
    choose(+(b.dataset.pos ?? b.dataset.i));
  });
  $('#rs', v).onchange = async e => {
    const next = Store.get(e.target.value);
    if (picks.some(Boolean) && !(await confirmBox('Changing the spread clears the cards you have chosen.', 'Change spread'))) { e.target.value = spread ? spread.id : ''; return; }
    spread = next || null; picks = []; body();
  };
  $('#rcancel', v).onclick = () => history.back();
  $('#rsave', v).onclick = async () => {
    if (!spread) { toast('Choose a spread first'); return; }
    const ps = arr(spread.positions);
    const filled = picks.filter(Boolean).length;
    if (!filled) { toast('Choose at least one card'); return; }
    if (filled < ps.length && !(await confirmBox(`Only ${filled} of ${ps.length} positions have a card. Save anyway?`, 'Save'))) return;
    const at = $('#rw', v).value ? new Date($('#rw', v).value).getTime() : Date.now();
    const m = MOON.current(new Date(at));
    const data = {
      spreadId: spread.id, spreadName: spread.name, at, moon: m.dark ? 'Dark Moon' : m.name, manual: true, deck: ($('#rd', v) || {}).value || '',
      question: $('#rq', v).value.trim(), notes: $('#rn', v).value.trim(),
      positions: ps.map(p => ({ n: p.n, x: p.x, y: p.y, rotate: p.rotate || 0, name: p.name })),
      cards: ps.map((p, i) => { const c = picks[i] && TAROT_BY_NAME[picks[i]]; return { n: p.n, pos: p.name, posMeaning: p.meaning || '', card: c ? c.name : '', arcana: c ? c.arcana : '', meaning: c ? c.up : '' }; }),
    };
    let id;
    if (editing) { await Journal.update(editing.id, data); Journal.list.sort((x, y) => y.at - x.at); await Journal.persist(); id = editing.id; }
    else { id = newId('reading'); await Journal.add({ id, results: '', outcome: '', ...data }); Journal.list.sort((x, y) => y.at - x.at); await Journal.persist(); }
    toast(editing ? 'Reading updated ✶' : 'Reading saved to your Journal ✶');
    location.replace(`#/journal/${id}`);
  };
  body();
});

/* ---------- interpretation: card meaning read through the lens of its position ---------- */
const CTX_LABEL = { past: 'Looking back', present: 'Here and now', future: 'What is unfolding', challenge: 'The challenge', advice: 'Guidance', self: 'You', others: 'Those around you', hopes: 'Hopes & fears', love: 'Love & the heart', work: 'Work, money & craft', spirit: 'Spirit', release: 'What to release', shadow: 'The hidden side', foundation: 'The foundation', gift: 'The gift' };
const CTX_RULES = [
  ['challenge', /obstacle|challeng|block|crossing|weed|problem|difficult|drain|trigger|wound|price|warning|severity/i],
  ['hopes', /hope|fear|wish|desire|longing/i],
  ['advice', /advice|action|next step|how to|lesson|what to do|guidance|\bkey\b|way through|practice|medicine|what it asks|approach|honou?r/i],
  ['release', /release|let go|leave|ends?\b|ended|banish|outgr|griev|\blost\b|drop|discard|remove|quit|cut/i],
  ['shadow', /shadow|hidden|secret|subconscious|unconscious|blind|beneath|veil|dark/i],
  ['foundation', /foundation|\broots?\b|core|\bbase\b|source|underl|soil|beneath the/i],
  ['gift', /gift|strength|blessing|help|opportunit|celebrat|\bjoy\b|victory|abundant/i],
  ['love', /love|relationship|partner|heart|\bbond\b|romance|soulmate|we meet/i],
  ['work', /work|career|money|financ|\bjob\b|craft|creativ|abundance|prosper/i],
  ['spirit', /spirit|guide|divine|\bsoul\b|higher|message|goddess|ancest|beyond|crown|wisdom/i],
  ['others', /others|environment|outside|external|influence|\bthem\b|they\b|people|how .* see/i],
  ['self', /\byou\b|\byour\b|self|yourself|\bmy\b|\bi\b|inner|attitude|mind/i],
  ['past', /\bpast\b|before|behind|history|recent|was\b|old\b/i],
  ['future', /future|outcome|result|leads|coming|\bwill\b|potential|destination|ahead|month|week|year|next/i],
  ['present', /present|\bnow\b|situation|current|today|\bday\b/i],
];
function posContext(name, meaning) {
  const known = window.POS_CTX && POS_CTX[name];
  if (known) return known;
  for (const src of [name || '', meaning || '']) for (const [ctx, re] of CTX_RULES) if (re.test(src)) return { ctx, lens: '' };
  return { ctx: 'present', lens: '' };
}
function interpret(cardName, posName, posMeaning) {
  const m = window.TAROT_MEANINGS && TAROT_MEANINGS[cardName];
  const pc = posContext(posName, posMeaning);
  if (!m) return { ...pc, text: (TAROT_BY_NAME[cardName] || {}).up || '', m: null };
  return { ...pc, text: (m.ctx && m.ctx[pc.ctx]) || m.meaning, m };
}
// fallback guiding prompts for spreads without a written guide (e.g. ones made in the app)
const CTX_GUIDE = {
  past: 'Think back. Where have you met the energy of this card before, and what did it teach you?',
  present: 'Breathe and take in the whole card. What part of today does it mirror back to you?',
  future: 'Picture yourself stepping into this card. What would you need to carry with you to meet it well?',
  challenge: 'Look for the tension in this card. Is this obstacle outside you, or one you keep feeding?',
  advice: 'Read this card as a friend speaking to you. What one small step is it asking you to take?',
  self: 'Find the figure or detail you relate to most. What does it say about how you see yourself?',
  others: 'Bring someone to mind as you look. How does this card describe them, or how they see you?',
  hopes: 'Notice whether this card stirs hope or worry. Could it be both at once?',
  love: 'Place a hand on your heart as you look. What does this card ask of you in love?',
  work: 'Think of your work, money or craft. Where does this card point to something practical to change?',
  spirit: 'Soften your gaze and listen. What message might your guides be sending through this card?',
  release: 'Name what this card shows you are ready to let go. Can you feel it loosen as you breathe out?',
  shadow: 'Look at what is half-hidden in the image. What part of you have you been avoiding?',
  foundation: 'Imagine this card as the ground beneath your feet. Is it holding you steady?',
  gift: 'Receive this card as a gift. What strength or blessing is it placing in your hands?'
};
function guideFor(spread, n, name, meaning) {
  const p = spread && arr(spread.positions).find(x => x.name === name || x.n === n);
  return (p && p.guide) || CTX_GUIDE[posContext(name, meaning).ctx] || '';
}
const shortName = n => String(n || '').replace(/^[0IVXL]+ · /, '');
// one position of a reading, with the card read through the position's meaning
function positionHTML(c) {
  if (!c.card) return `<div class="pos interp"><span class="pos-card empty-card">?</span><div><div><span class="n">${c.n}</span> <b>${esc(c.pos)}</b></div><div class="small muted">${esc(c.posMeaning || '')}</div><div class="small muted"><i>No card recorded</i></div></div></div>`;
  const it = interpret(c.card, c.pos, c.posMeaning);
  const kw = it.m ? it.m.keywords.slice(0, 4) : String(c.meaning || '').split(',').map(s => s.trim()).filter(Boolean);
  return `<div class="pos interp">
    <img class="pos-card" src="${tarotImg(c.card)}" data-card="${esc(c.card)}" alt="">
    <div class="interp-body">
      <div class="interp-head"><span class="n">${c.n}</span><b>${esc(c.pos)}</b></div>
      ${c.posMeaning ? `<div class="small muted">${esc(c.posMeaning)}</div>` : ''}
      ${c.guide ? `<div class="pos-guide">${esc(c.guide)}</div>` : ''}
      <div class="card-name">${esc(c.card)}</div>
      <div class="chips" style="gap:4px;margin:4px 0">${kw.map(k => `<span class="chip" style="font-size:.72rem;padding:0 8px">${esc(k)}</span>`).join('')}</div>
      <div class="interp-lens">${esc(CTX_LABEL[it.ctx] || '')}${it.lens ? ` · <i>${esc(it.lens)}</i>` : ''}</div>
      <p class="interp-text">${esc(it.text)}</p>
      <a class="small" href="#/card/${encodeURIComponent(c.card)}">More about ${esc(shortName(c.card))} ›</a>
    </div></div>`;
}
const NUM_MEANING = { 1: 'new beginnings and raw potential', 2: 'choices, balance and partnership', 3: 'growth, creativity and collaboration', 4: 'stability, structure and rest', 5: 'conflict, change and challenge', 6: 'harmony, healing and generosity', 7: 'reflection, tests and inner work', 8: 'movement, power and mastery', 9: 'nearing completion and fruition', 10: 'endings, fulfilment and a cycle completing' };
const SUIT_MEANING = {
  Wands: ['Fire', 'passion, drive, creativity and action — the matter is about will and what you are willing to go for'],
  Cups: ['Water', 'feelings, relationships, intuition and the heart — emotions are at the centre of this'],
  Swords: ['Air', 'thoughts, words, conflict and decisions — clarity of mind (and what worries it) shapes this'],
  Pentacles: ['Earth', 'money, work, the body and the material world — practical, tangible matters are in focus'],
};
function readingOverviewHTML(cards) {
  const list = cards.filter(Boolean).map(n => TAROT_BY_NAME[n]).filter(Boolean);
  const n = list.length; if (n < 2) return '';
  const notes = [];
  const majors = list.filter(c => c.arcana === 'Major');
  if (majors.length >= Math.ceil(n / 2)) notes.push(`<b>${majors.length} of ${n} cards are Major Arcana.</b> This reading touches big life lessons and forces larger than day-to-day choices — pay close attention to ${majors.map(c => shortName(c.name)).slice(0, 3).join(', ')}.`);
  else if (!majors.length && n >= 3) notes.push(`<b>No Major Arcana appeared.</b> This situation is in your hands — everyday choices, not fate, will shape how it unfolds.`);
  else if (majors.length) notes.push(`<b>Major Arcana present:</b> ${majors.map(c => shortName(c.name)).join(', ')} — these mark the deeper lessons at work.`);
  const tally = {}; list.filter(c => c.arcana !== 'Major').forEach(c => tally[c.arcana] = (tally[c.arcana] || 0) + 1);
  const suits = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (suits.length && suits[0][1] >= 2 && (!suits[1] || suits[0][1] > suits[1][1])) {
    const [el, txt] = SUIT_MEANING[suits[0][0]];
    notes.push(`<b>${suits[0][1]} ${suits[0][0]} (${el}).</b> The reading leans toward ${txt}.`);
  }
  if (n >= 6) { const missing = Object.keys(SUIT_MEANING).filter(s => !tally[s]); if (missing.length === 1) notes.push(`<b>No ${missing[0]}.</b> ${({ Wands: 'Passion or the will to act may be missing — what would light your fire?', Cups: 'Feelings may be overlooked — how do you truly feel about this?', Swords: 'Clear thinking or honest words may be needed — what have you not yet said or decided?', Pentacles: 'The practical side may be neglected — what concrete step grounds this?' })[missing[0]]}`); }
  const courts = list.filter(c => /^(Page|Knight|Queen|King) /.test(c.name));
  if (courts.length >= 2) notes.push(`<b>${courts.length} court cards.</b> Other people — or different sides of yourself — play a strong role here (${courts.map(c => shortName(c.name)).join(', ')}).`);
  const nums = {}; list.forEach(c => { const r = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'].indexOf(c.name.split(' ')[0]); if (r >= 0 && c.arcana !== 'Major') nums[r + 1] = (nums[r + 1] || 0) + 1; });
  Object.entries(nums).filter(([, k]) => k >= 2).forEach(([num, k]) => notes.push(`<b>${['', '', 'Two', 'Three', 'Four', 'Five', 'Six'][k] || k} ${['', 'Aces', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens'][num]}.</b> A repeated theme of ${NUM_MEANING[num]}.`));
  if (!notes.length) return '';
  return `<div class="block frame overview"><h3>${ART.eye}Reading at a Glance</h3>${notes.map(t => `<p class="small" style="margin:6px 0">${t}</p>`).join('')}</div>`;
}

/* ---------- one card ---------- */
route('card/:name', async (v, [name]) => {
  const c = TAROT_BY_NAME[name]; if (!c) return (location.hash = '#/deck');
  const m = (window.TAROT_MEANINGS || {})[name] || {};
  setTitle(shortName(name));
  v.innerHTML = `<div class="card-hero"><img src="${c.img}" alt="" data-card="${esc(name)}"></div>
    <div class="dhead" style="margin-top:10px"><div class="type">${c.arcana === 'Major' ? 'Major Arcana' : c.arcana}</div><h1>${esc(shortName(name))}</h1>${m.affirmation ? `<div class="latin">“${esc(m.affirmation)}”</div>` : ''}</div>
    <div class="chips" style="justify-content:center;margin:10px 0">${(m.keywords || c.up.split(', ')).map(k => `<span class="chip gold">${esc(k)}</span>`).join('')}</div>
    <div class="facts">${[['ELEMENT', m.element], ['ASTROLOGY', m.astrology], ['YES OR NO', m.yesNo]].filter(f => f[1]).map(f => `<div class="fact"><small>${f[0]}</small><span>${esc(f[1])}</span></div>`).join('')}</div>
    ${m.meaning ? `<p class="lead">${esc(m.meaning)}</p>` : `<p>${esc(c.up)}</p>`}
    ${m.imagery ? `<div class="block"><h3>${ART.eye}The Imagery</h3><p>${esc(m.imagery)}</p></div>` : ''}
    ${(window.TAROT_SYMBOLS || {})[name] ? `<div class="block frame"><h3>${ART.eye}Symbols & Features</h3><p class="small muted" style="margin-top:0">Every detail on this card carries meaning. Tap the card above to zoom in and find each one.</p>
      ${TAROT_SYMBOLS[name].map(s => `<div class="sym-row"><div class="sym-f">${esc(s.feature)}</div>${s.where ? `<div class="small muted">${esc(s.where)}</div>` : ''}<p>${esc(s.meaning)}</p></div>`).join('')}
      ${(() => { const rel = (window.SYMBOL_DICT || []).filter(d => arr(d.seenIn).includes(name)); return rel.length ? `<div class="small muted" style="margin-top:8px">Explore these symbols across the deck:</div><div class="chips" style="margin-top:4px">${rel.map(d => `<a class="chip" href="#/learn/symbols?f=${encodeURIComponent(d.symbol)}">${esc(d.symbol)}</a>`).join('')}</div>` : ''; })()}
    </div>` : ''}
    ${m.numerology ? `<div class="block"><h3>${ART.star}The Number</h3><p>${esc(m.numerology)}</p></div>` : ''}
    ${m.ctx ? `<div class="block frame"><h3>${ART.tarot}Reading It in Different Positions</h3>${Object.keys(CTX_LABEL).filter(k => m.ctx[k]).map(k => `<details class="ctx-d"><summary>${esc(CTX_LABEL[k])}</summary><p>${esc(m.ctx[k])}</p></details>`).join('')}</div>` : ''}
    ${cardHistoryHTML(name)}
    <p class="disclaimer">All cards are read upright. Rider–Waite–Smith artwork by Pamela Colman Smith (1909), public domain.</p>`;
});

/* ---------- Learning Tarot ---------- */
const SUIT_GROUPS = [['Major', 'Major Arcana', 'The 22 great archetypes — the soul’s journey from the Fool to the World'], ['Wands', 'Wands · Fire', 'Passion, creativity, drive and action'], ['Cups', 'Cups · Water', 'Feelings, love, intuition and relationships'], ['Swords', 'Swords · Air', 'Thought, truth, conflict and decisions'], ['Pentacles', 'Pentacles · Earth', 'Money, work, the body and the material world']];
function cardTile(c) { return `<a class="deck-card" href="#/card/${encodeURIComponent(c.name)}"><img src="${c.img}" alt="" loading="lazy"><b>${esc(shortName(c.name))}</b></a>`; }
const symAnchor = s => 'sym-' + norm(s).replace(/[^a-z0-9]+/g, '-');
route('learn', async v => {
  setTitle('Learn Tarot');
  const L = window.TAROT_LESSONS || [];
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.35rem">Learning the Tarot</h1><div class="sub">The classic Rider–Waite–Smith deck, card by card and symbol by symbol</div></div>
    <div class="grid home-grid" style="margin:12px 0">
      <a class="tile" href="#/learn/lessons">${ART.book}<b>Tarot Basics</b><span>${L.length} beginner lessons</span></a>
      <a class="tile" href="#/learn/symbols">${ART.eye}<b>Symbols</b><span>${(window.SYMBOL_DICT || []).length} meanings</span></a>
      <a class="tile" href="#/learn/flash">${ART.shuffle}<b>Flashcards</b><span>test yourself</span></a>
    </div>
    <div class="chips scroll" id="lj">${SUIT_GROUPS.map(g => `<a class="chip gold" href="javascript:void 0" data-j="${g[0]}">${g[0] === 'Major' ? 'Major Arcana' : g[0]}</a>`).join('')}</div>
    ${SUIT_GROUPS.map(([k, title, sub]) => `<div class="section-title" id="g-${k}"><h2>${esc(title)}</h2></div><p class="small muted" style="margin:-4px 0 8px">${esc(sub)}</p>
      <div class="deck-grid">${TAROT_DECK.filter(c => c.arcana === k).map(cardTile).join('')}</div>`).join('')}
    <p class="disclaimer">Rider–Waite–Smith artwork by Pamela Colman Smith (1909), public domain. All cards are read upright.</p>`;
  $('#lj', v).onclick = e => { const a = e.target.closest('[data-j]'); if (!a) return; const t = $('#g-' + a.dataset.j, v); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' }); };
});
route('learn/lessons', async v => {
  setTitle('Tarot Basics');
  v.innerHTML = `<div class="list">${(window.TAROT_LESSONS || []).map((l, i) => `<a class="row" href="#/learn/lesson/${i}"><div class="thumb" style="font-family:'Cinzel Decorative';color:var(--gold);font-size:1.3rem">${i + 1}</div><div class="txt"><div class="nm">${esc(l.title)}</div><div class="sb">${esc(l.body.split('\n')[0])}</div></div></a>`).join('')}</div>`;
});
route('learn/lesson/:i', async (v, [i]) => {
  const L = window.TAROT_LESSONS || [], l = L[+i]; if (!l) return (location.hash = '#/learn/lessons');
  setTitle(`Lesson ${+i + 1}`);
  // link card names mentioned in the lesson
  const linkCards = t => { let h = esc(t); TAROT_DECK.forEach(c => { const n = shortName(c.name); if (n.length > 4) h = h.replace(new RegExp(`\\b(${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`), `<a href="#/card/${encodeURIComponent(c.name)}">$1</a>`); }); return h; };
  v.innerHTML = `<div class="dhead" style="margin-top:8px"><div class="type">Lesson ${+i + 1} of ${L.length}</div><h1>${esc(l.title)}</h1></div>${DIV}
    ${l.body.split(/\n\s*\n/).map((p, k) => `<p class="${k ? '' : 'lead'}">${linkCards(p)}</p>`).join('')}
    <div class="actions">${+i > 0 ? `<a class="btn ghost" href="#/learn/lesson/${+i - 1}">‹ Previous</a>` : ''}${+i < L.length - 1 ? `<a class="btn primary" href="#/learn/lesson/${+i + 1}">Next lesson ›</a>` : `<a class="btn primary" href="#/learn/flash">Try the flashcards ›</a>`}</div>`;
});
route('learn/symbols', async (v, a, qs) => {
  setTitle('Symbol Dictionary');
  const D = window.SYMBOL_DICT || [];
  const cats = [...new Set(D.map(d => d.category))];
  let cat = qs.c || '', f = qs.f || '';
  v.innerHTML = `<p class="center small muted" style="margin:6px 0 8px">What the recurring pictures in the Rider–Waite–Smith deck mean — skies, landscapes, colours, animals and more.</p>
    <div class="searchbar">${ART.search}<input id="sf" type="search" placeholder="Search symbols… e.g. mountains, grey sky" value="${esc(f)}"></div>
    <div class="chips scroll" id="sc"><button class="chip ${!cat ? 'on' : ''}" data-c="">All</button>${cats.map(c => `<button class="chip ${cat === c ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div id="sl"></div>`;
  const draw = () => {
    const n = norm(f);
    const list = D.filter(d => (!cat || d.category === cat) && (!n || norm(d.symbol + ' ' + d.meaning).includes(n)));
    const groups = {}; list.forEach(d => (groups[d.category] = groups[d.category] || []).push(d));
    $('#sl', v).innerHTML = Object.keys(groups).map(g => `<div class="group-h">${esc(g)}</div>${groups[g].map(d => `<div class="block frame sym-entry" id="${symAnchor(d.symbol)}"><h3>${esc(d.symbol)}</h3><p style="margin-top:0">${esc(d.meaning)}</p>
      ${arr(d.seenIn).length ? `<div class="small muted">Seen in:</div><div class="sym-cards">${arr(d.seenIn).filter(x => TAROT_BY_NAME[x]).map(x => `<a href="#/card/${encodeURIComponent(x)}" title="${esc(x)}"><img src="${tarotImg(x)}" alt="" loading="lazy"><span>${esc(shortName(x))}</span></a>`).join('')}</div>` : ''}</div>`).join('')}`).join('') || '<div class="empty">No symbols match.</div>';
    history.replaceState(null, '', `#/learn/symbols?c=${encodeURIComponent(cat)}&f=${encodeURIComponent(f)}`);
  };
  $('#sf', v).oninput = e => { f = e.target.value; draw(); };
  $('#sc', v).onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; $$('#sc .chip', v).forEach(x => x.classList.toggle('on', x === b)); draw(); };
  draw();
});
route('learn/flash', async (v, a, qs) => {
  setTitle('Flashcards');
  let arc = qs.a || '', known = 0, learning = 0, card = null, shown = false;
  const deck = () => TAROT_DECK.filter(c => !arc || c.arcana === arc);
  const next = () => { const d = deck(); let c; do { c = d[Math.floor(Math.random() * d.length)]; } while (d.length > 1 && card && c.name === card.name); card = c; shown = false; draw(); };
  v.innerHTML = `<div class="chips scroll" id="fa"><button class="chip ${!arc ? 'on' : ''}" data-a="">All 78</button>${ARCANA.map(x => `<button class="chip ${arc === x ? 'on' : ''}" data-a="${x}">${x === 'Major' ? 'Major Arcana' : x}</button>`).join('')}</div>
    <p class="center small muted" id="fs"></p><div id="fc"></div>`;
  const draw = () => {
    const m = (window.TAROT_MEANINGS || {})[card.name] || {};
    $('#fs', v).textContent = `Knew it: ${known} · Still learning: ${learning}`;
    $('#fc', v).innerHTML = `<div class="flash"><img src="${card.img}" alt="" class="${shown ? '' : 'hide-title'}" ${shown ? `data-card="${esc(card.name)}"` : ''}></div>
      ${shown ? `<div class="center fade-in"><h2 style="margin-top:10px">${esc(shortName(card.name))}</h2>
        <div class="chips" style="justify-content:center;margin:8px 0">${(m.keywords || card.up.split(', ')).slice(0, 6).map(k => `<span class="chip gold">${esc(k)}</span>`).join('')}</div>
        <p>${esc(m.meaning || card.up)}</p>
        <div class="actions"><button class="btn ghost" id="fl">Still learning</button><button class="btn primary" id="fk">I knew it ✶</button></div>
        <a class="small" href="#/card/${encodeURIComponent(card.name)}">Study this card ›</a></div>`
      : `<p class="center fell" style="margin-top:10px"><i>What is this card, and what does it mean to you?</i></p><div class="actions"><button class="btn primary" id="fr">Reveal</button><button class="btn ghost" id="fn">Skip</button></div>`}`;
    const b = id => $('#' + id, v);
    if (b('fr')) b('fr').onclick = () => { shown = true; draw(); };
    if (b('fn')) b('fn').onclick = next;
    if (b('fk')) b('fk').onclick = () => { known++; next(); };
    if (b('fl')) b('fl').onclick = () => { learning++; next(); };
  };
  $('#fa', v).onclick = e => { const x = e.target.closest('[data-a]'); if (!x) return; arc = x.dataset.a; $$('#fa .chip', v).forEach(y => y.classList.toggle('on', y === x)); next(); };
  next();
});

/* ---------- guided walk-through: one card at a time ---------- */
function walkButtonHTML(r) {
  const sp = Store.get(r.spreadId);
  return `<div class="actions" style="margin:4px 0 10px"><button class="btn primary walk-btn" data-walk="${r.id}">${ART.moon} Guided walk, card by card</button></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-walk]'); if (b) { const r = Journal.get(b.dataset.walk); if (r) guidedWalk(r); } });
function guidedWalk(r) {
  const sp = Store.get(r.spreadId);
    const steps = r.cards.filter(c => c.card);
  let i = 0; const turned = new Set();
  modal(`<div class="walk" id="walk"></div>`, (m, close) => {
    const draw = () => {
      if (i >= steps.length) {
        $('#walk', m).innerHTML = `<h2>The Whole Path</h2>${readingAnalysisHTML(r)}<div class="actions"><button class="btn ghost" id="wb">‹ Back</button><button class="btn primary" id="wd">Done</button></div>`;
        $('#wb', m).onclick = () => { i--; draw(); }; $('#wd', m).onclick = close; return;
      }
      const c = steps[i], it = interpret(c.card, c.pos, c.posMeaning), g = guideFor(sp, c.n, c.pos, c.posMeaning), up = turned.has(i);
      $('#walk', m).innerHTML = `<div class="walk-prog">Card ${i + 1} of ${steps.length}</div>
        <h2 style="margin:4px 0 2px">${esc(c.pos)}</h2>
        <p class="small muted center" style="margin:0 0 8px">${esc(c.posMeaning || '')}</p>
        ${g ? `<p class="walk-guide">${esc(g)}</p>` : ''}
        <div class="walk-card ${up ? 'up' : ''}" id="wc">${up ? `<img src="${tarotImg(c.card)}" alt="">` : `<div class="walk-back">${ART.moon}<span>Tap to turn the card</span></div>`}</div>
        ${up ? `<div class="center fade-in"><div class="card-name" style="font-family:'Cinzel Decorative';color:var(--violet);font-weight:700;margin-top:8px">${esc(c.card)}</div>
          <div class="interp-lens">${esc(CTX_LABEL[it.ctx] || '')}${it.lens ? ` · <i>${esc(it.lens)}</i>` : ''}</div>
          <p style="text-align:left">${esc(it.text)}</p></div>` : ''}
        <div class="actions"><button class="btn ghost" id="wp" ${i ? '' : 'disabled'}>‹ Back</button><button class="btn primary" id="wn">${up ? (i === steps.length - 1 ? 'See the whole path ›' : 'Next card ›') : 'Turn the card'}</button></div>`;
      const turn = () => { turned.add(i); draw(); };
      $('#wc', m).onclick = () => { if (!up) turn(); };
      $('#wn', m).onclick = () => { if (!up) turn(); else { i++; draw(); } };
      $('#wp', m).onclick = () => { if (i) { i--; draw(); } };
      m.querySelector('.sheet').scrollTop = 0;
    };
    draw();
  });
}
