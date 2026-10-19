/* ---------- LEARN WITCHCRAFT: lessons in the basics of the craft ---------- */
const Craft = {
  done: {}, notes: {}, loaded: false,
  async load() { if (this.loaded) return; try { const d = await DB.get('craft', {}) || {}; this.done = d.done || {}; this.notes = d.notes || {}; } catch (e) { } this.loaded = true; },
  async save() { await DB.set('craft', { done: this.done, notes: this.notes }); },
  lessons: () => window.WITCH_LESSONS || [],
  count() { return this.lessons().filter(l => this.done[l.id]).length; },
};
const practicesFor = id => Workings.list.filter(w => w.lessonId === id);

function craftProgressHTML(L) {
  L = L || Craft.lessons();
  const n = L.filter(l => Craft.done[l.id]).length, t = L.length, pct = t ? Math.round(n / t * 100) : 0;
  return `<div class="craft-prog"><div class="bar"><i style="width:${pct}%"></i></div><span>${n} of ${t} lessons complete</span></div>`;
}
// the banner on the home page
function craftBannerHTML() {
  const L = Craft.lessons(); if (!L.length) return '';
  const next = L.find(l => !Craft.done[l.id]);
  return `<a class="frame craft-banner" href="#/craft">
    <div class="cb-ic">${ART.book}</div>
    <div><h3 style="margin:0">Learn Witchcraft</h3>
      <p class="small" style="margin:2px 0 6px">${next ? `Next lesson: <b style="color:var(--gold2)">${esc(next.title)}</b>` : 'Every lesson complete. Blessed be!'}</p>
      ${craftProgressHTML()}</div></a>`;
}

route('craft', async v => {
  await Craft.load(); await Workings.load();
  setTitle('Learn Witchcraft');
  const L = Craft.lessons();
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.35rem">Learning Witchcraft</h1><div class="sub">The foundations of the craft, one practice at a time</div></div>
    ${craftProgressHTML()}
    <p class="small muted center" style="margin:10px 4px 4px">Work through the lessons in order, or jump to the one you need. Each has a practice to try, a step-by-step guided mode, journal prompts and a short quiz.</p>
    <div class="list craft-list">${L.map((l, i) => {
      const p = practicesFor(l.id).length;
      return `<a class="row" href="#/craft/${l.id}"><div class="thumb craft-num ${Craft.done[l.id] ? 'done' : ''}">${Craft.done[l.id] ? '✓' : i + 1}</div>
        <div class="txt"><div class="nm">${esc(l.title)}</div><div class="sb">${esc(l.subtitle)}</div>
        <div class="small muted">${ART[l.icon] ? '' : ''}~${l.minutes} min practice${p ? ` · practised ${p}×` : ''}</div></div></a>`;
    }).join('')}</div>
    <p class="disclaimer">Witchcraft is a personal, varied practice. These lessons offer common, beginner-friendly ways of working; adapt them to your own path. Energy work is a spiritual practice, not a substitute for medical or mental health care.</p>`;
});

route('craft/:id', async (v, [id]) => lessonPage(v, id, Craft.lessons(), 'craft'));
// one lesson page; `base` is the route of its lesson list (craft, candles/basics)
async function lessonPage(v, id, L, base) {
  await Craft.load(); await Workings.load();
  const i = L.findIndex(l => l.id === id), l = L[i];
  if (!l) return (location.hash = '#/' + base);
  setTitle(`Lesson ${i + 1}`);
  const P = (t, icon, html) => html ? `<div class="block"><h3>${ART[icon] || ''}${t}</h3>${html}</div>` : '';
  const ul = a => a && a.length ? `<ul class="craft-ul">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  const links = arr(l.links).map(x => Store.get(x)).filter(Boolean);
  const done = !!Craft.done[l.id], prs = practicesFor(l.id);
  v.innerHTML = `<div class="dhead" style="margin-top:8px"><div class="type">Lesson ${i + 1} of ${L.length} · ~${l.minutes} min</div><h1>${esc(l.title)}</h1><div class="latin">${esc(l.subtitle)}</div></div>${DIV}
    ${l.intro.map((p, k) => `<p class="${k ? '' : 'lead'}">${esc(p)}</p>`).join('')}
    ${P('Key Ideas', 'star', ul(l.keyIdeas))}
    <div class="block craft-practice"><h3>${ART[l.icon] || ART.pentacle}Practice: ${esc(l.practice.name)}</h3>
      <ol class="craft-steps">${l.practice.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="actions"><button class="btn primary" id="guide">${ART.moon} Guide me through it</button><button class="btn" id="logp">${ART.edit} Log a practice</button></div>
      ${prs.length ? `<p class="small muted center" style="margin:6px 0 0">You've practised this ${prs.length}×, most recently ${fmtWhen(prs[0].at)} · <a href="#/journal?t=practice">see in Journal</a></p>` : ''}
    </div>
    ${P('Variations', 'leaf', l.variations.map(x => `<p><b class="fell" style="color:var(--gold2)">${esc(x.name)}.</b> ${esc(x.text)}</p>`).join(''))}
    ${P('Helpful Tools', 'mortar', ul(l.tools))}
    ${P('Correspondences', 'pentacle', `<div class="kv">${l.correspondences.map(c => `<div><b>${esc(c.label)}</b><span>${esc(c.value)}</span></div>`).join('')}</div>`)}
    ${P('Signs It Is Working', 'eye', ul(l.signs))}
    ${P('Common Pitfalls', 'broom', ul(l.pitfalls))}
    ${l.safety ? `<div class="block caution"><h3>${ART.hand}Safety</h3><p>${esc(l.safety)}</p></div>` : ''}
    ${P('Journal Prompts', 'book', ul(l.journal))}
    ${links.length ? `<div class="section-title"><h2>From the Grimoire</h2></div><div class="list">${links.map(x => rowHTML(x)).join('')}</div>` : ''}
    <div class="block"><h3>${ART.book}My Notes</h3><textarea id="cn" class="craft-notes" placeholder="Your own notes, adaptations and discoveries for this lesson…">${esc(Craft.notes[l.id] || '')}</textarea><div class="hint" id="cns"></div></div>
    <div class="block"><h3>${ART.star}Check Your Understanding</h3><div id="quiz">${l.quiz.map((q, k) => `<div class="quiz-q" data-k="${k}"><p><b>${k + 1}.</b> ${esc(q.q)}</p>${q.options.map((o, j) => `<button class="quiz-o" data-j="${j}">${esc(o)}</button>`).join('')}</div>`).join('')}</div></div>
    <div class="actions"><button class="btn ${done ? '' : 'primary'}" id="done">${done ? '✓ Lesson complete (tap to undo)' : 'Mark lesson complete'}</button></div>
    <div class="actions">${i > 0 ? `<a class="btn ghost" href="#/${base}/${L[i - 1].id}">‹ ${esc(L[i - 1].title)}</a>` : ''}${i < L.length - 1 ? `<a class="btn ghost" href="#/${base}/${L[i + 1].id}">${esc(L[i + 1].title)} ›</a>` : `<a class="btn ghost" href="#/${base}">All lessons ›</a>`}</div>`;

  let t; $('#cn', v).oninput = e => { clearTimeout(t); t = setTimeout(async () => { Craft.notes[l.id] = e.target.value; await Craft.save(); $('#cns', v).textContent = 'Saved'; }, 500); };
  $('#done', v).onclick = async () => {
    if (Craft.done[l.id]) delete Craft.done[l.id]; else Craft.done[l.id] = Date.now();
    await Craft.save(); const d = !!Craft.done[l.id];
    const b = $('#done', v); b.textContent = d ? '✓ Lesson complete (tap to undo)' : 'Mark lesson complete'; b.classList.toggle('primary', !d);
    if (d) toast(i < L.length - 1 ? 'Lesson complete ✶' : 'All lessons complete. Blessed be ✶');
  };
  $('#quiz', v).onclick = e => {
    const b = e.target.closest('.quiz-o'); if (!b) return;
    const qd = b.closest('.quiz-q'), q = l.quiz[+qd.dataset.k]; if (qd.dataset.answered) return;
    qd.dataset.answered = 1;
    $$('.quiz-o', qd).forEach((x, j) => { x.classList.toggle('right', j === q.answer); if (x === b && j !== q.answer) x.classList.add('wrong'); x.disabled = true; });
  };
  $('#logp', v).onclick = () => logWorkingModal({ id: 'lesson-' + l.id, lessonId: l.id, type: 'practice', name: `${l.practice.name}` }, () => render());
  $('#guide', v).onclick = () => guidedPractice(l);
}

// step-by-step guided practice: one step per screen, with an optional gentle timer
function guidedPractice(l) {
  const steps = l.practice.steps; let i = 0;
  modal(`<div class="walk" id="gp"></div>`, (m, close) => {
    const draw = () => {
      if (i >= steps.length) {
        $('#gp', m).innerHTML = `<h2>${esc(l.practice.name)}</h2><p class="walk-guide">Well done. Take a breath, wiggle your fingers and toes, and notice how you feel now.</p>
          <p class="small center muted">${esc(l.journal[0] || '')}</p>
          <div class="actions"><button class="btn ghost" id="gb">‹ Back</button><button class="btn" id="gl">${ART.edit} Log it</button><button class="btn primary" id="gd">Done</button></div>`;
        $('#gb', m).onclick = () => { i--; draw(); }; $('#gd', m).onclick = close;
        $('#gl', m).onclick = () => { close(); logWorkingModal({ id: 'lesson-' + l.id, lessonId: l.id, type: 'practice', name: l.practice.name }, () => render()); };
        return;
      }
      $('#gp', m).innerHTML = `<div class="walk-prog">Step ${i + 1} of ${steps.length}</div><h2 style="margin:4px 0 10px">${esc(l.practice.name)}</h2>
        <div class="gp-ring">${ART[l.icon] || ART.pentacle}</div>
        <p class="gp-step">${esc(steps[i])}</p>
        <div class="actions"><button class="btn ghost" id="gp-p" ${i ? '' : 'disabled'}>‹ Back</button><button class="btn primary" id="gp-n">${i === steps.length - 1 ? 'Finish ›' : 'Next step ›'}</button></div>`;
      $('#gp-p', m).onclick = () => { if (i) { i--; draw(); } };
      $('#gp-n', m).onclick = () => { i++; draw(); };
      m.querySelector('.sheet').scrollTop = 0;
    };
    draw();
  });
}
