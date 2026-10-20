/* ---------- DECK PHOTOS: photograph your own tarot deck, adjust each card, share the deck ----------
   Card pictures are stored one per key in kv: deckimg:<deckId>:<cardIndex> (index into TAROT_DECK).
   Each deck keeps `cards`: the list of indexes that have a picture. */
const CARD_W = 600, CARD_H = 1036;               // tarot proportions (2.75 x 4.75 in)
const DeckImg = {
  key: (d, n) => `deckimg:${d}:${n}`,
  get: (d, n) => DB.get(DeckImg.key(d, n), null),
  async all(d) { const o = await DB.prefixed(`deckimg:${d}:`), out = {}; for (const k in o) out[+k.split(':')[2]] = o[k]; return out; },
  async set(deck, n, url) { await DB.set(DeckImg.key(deck.id, n), url); deck.cards = [...new Set([...(deck.cards || []), n])].sort((a, b) => a - b); await Decks.save(); },
  async del(deck, n) { await DB.delKey(DeckImg.key(deck.id, n)); deck.cards = (deck.cards || []).filter(x => x !== n); await Decks.save(); },
  async delAll(deck) { for (const n of deck.cards || []) await DB.delKey(DeckImg.key(deck.id, n)); },
};
// show the active deck's pictures everywhere the app draws a card (falls back to Rider–Waite–Smith)
async function applyDeckImages() {
  if (!window.TAROT_DECK) return;
  TAROT_DECK.forEach(c => { if (!c.imgRWS) c.imgRWS = c.img; c.img = c.imgRWS; });
  await Decks.load();
  const d = Decks.get(Store.settings.activeDeck);
  if (!d || !(d.cards || []).length) return;
  const imgs = await DeckImg.all(d.id);
  TAROT_DECK.forEach((c, i) => { if (imgs[i]) c.img = imgs[i]; });
}
const cardShort = c => c.name.replace(/^[0IVXL]+ · /, '');

/* ----- one deck: its 78 card slots ----- */
route('decks/:id', async (v, [id]) => {
  await Decks.load();
  const d = Decks.get(id); if (!d) return (location.hash = '#/decks');
  setTitle('My Deck');
  const imgs = await DeckImg.all(d.id), have = Object.keys(imgs).length, active = Store.settings.activeDeck === d.id;
  const groups = ['Major', 'Wands', 'Cups', 'Swords', 'Pentacles'];
  v.innerHTML = `<div class="deck-head"><button type="button" class="deck-cover" id="dcov" aria-label="Deck cover photo">${d.image ? `<img src="${d.image}" alt="">` : `${ART.image}<span class="small">cover</span>`}</button>
      <div><h1>${esc(d.name)}</h1><div class="small muted">${esc([d.creator, d.since ? 'since ' + d.since : ''].filter(Boolean).join(' · '))}</div>
      <div class="craft-prog" style="margin-top:6px"><div class="bar"><i style="width:${Math.round(have / 78 * 100)}%"></i></div><span>${have} of 78 cards photographed</span></div></div></div>
    <div class="actions">
      <button class="btn primary big" id="dshoot">${ART.image} ${have ? (have < 78 ? `Photograph the next card (${78 - have} to go)` : 'Retake a card') : 'Photograph my 78 cards'}</button>
      <button class="btn ghost" id="dedit">${ART.edit} Edit details</button></div>
    <div class="switch"><div><b class="fell">Show my deck in the app</b></div>
      <div class="seg" id="duse"><button data-v="on" class="${active ? 'on' : ''}">On</button><button data-v="off" class="${active ? '' : 'on'}">Off</button></div></div>
    <p class="small muted" style="margin:-4px 2px 8px">When on, readings, card pages and Learn Tarot use your photos${have < 78 ? '; cards not yet photographed stay Rider–Waite–Smith' : ''}.</p>
    <div class="actions"><button class="btn ghost" id="dexp" ${have ? '' : 'disabled'}>${ART.share || ART.book} Export to share</button></div>
    <p class="small muted center" style="margin:2px 6px 8px">Tap any card to photograph it, adjust it, or remove it. Faded cards still show the Rider–Waite–Smith picture.</p>
    <div id="dslots">${groups.map(g => `<div class="section-title"><h2>${g === 'Major' ? 'Major Arcana' : g}</h2></div>
      <div class="deck-grid small-grid">${TAROT_DECK.map((c, i) => c.arcana !== g ? '' : `<button type="button" class="deck-card ${imgs[i] ? '' : 'missing'}" data-n="${i}"><img src="${imgs[i] || c.imgRWS || c.img}" alt="" loading="lazy"><b>${esc(cardShort(c))}</b>${imgs[i] ? '' : '<span>tap to photograph</span>'}</button>`).join('')}</div>`).join('')}</div>`;
  $('#dedit', v).onclick = () => deckEditor(d);
  $('#dcov', v).onclick = () => photoChoice('Deck cover', d.image, () => captureCard(d, -1, false), async () => { const f = await pickFile('image/*'); if (!f) return; adjustCard(d, -1, await readImageFile(f, 2000, .9), false); });
  $('#dshoot', v).onclick = () => { const first = TAROT_DECK.findIndex((c, i) => !imgs[i]); captureCard(d, first < 0 ? 0 : first, first >= 0); };
  $('#duse', v).onclick = async e => { const b = e.target.closest('button'); if (!b) return; await Store.setSetting('activeDeck', b.dataset.v === 'on' ? d.id : ''); await applyDeckImages(); toast(b.dataset.v === 'on' ? `Showing ${d.name} in the app ✶` : 'Showing Rider–Waite–Smith'); render(); };
  $('#dexp', v).onclick = () => exportDeck(d);
  $('#dslots', v).onclick = e => {
    const b = e.target.closest('[data-n]'); if (!b) return;
    const n = +b.dataset.n, c = TAROT_DECK[n];
    modal(`<h2>${esc(cardShort(c))}</h2><div class="deck-slot-prev"><img src="${imgs[n] || c.imgRWS || c.img}" alt=""></div>
      <div class="actions" style="flex-direction:column">
        <button class="btn primary" id="sc">${ART.image} Take a photo</button>
        <button class="btn" id="sp">Choose a picture</button>
        ${imgs[n] ? `<button class="btn" id="sa">Adjust this picture</button><button class="btn danger" id="sr">${ART.trash} Remove picture</button>` : ''}
        <button class="btn ghost" id="sx">Cancel</button></div>`, (m, close) => {
      $('#sx', m).onclick = close;
      $('#sc', m).onclick = () => { close(); captureCard(d, n, false); };
      $('#sp', m).onclick = async () => { close(); const f = await pickFile('image/*'); if (!f) return; const url = await readImageFile(f, 2000, .9); adjustCard(d, n, url, false); };
      if (imgs[n]) {
        $('#sa', m).onclick = () => { close(); adjustCard(d, n, imgs[n], false); };
        $('#sr', m).onclick = async () => { close(); await DeckImg.del(d, n); if (Store.settings.activeDeck === d.id) await applyDeckImages(); toast('Picture removed'); render(); };
      }
    });
  };
});

// a small sheet: take a photo with the camera, or choose one already on the phone
function photoChoice(title, current, onCamera, onPick, extra = '') {
  modal(`<h2>${esc(title)}</h2>${current ? `<div class="deck-slot-prev"><img src="${current}" alt=""></div>` : ''}
    <div class="actions" style="flex-direction:column"><button class="btn primary" id="pc">${ART.image} Take a photo</button><button class="btn" id="pp">Choose a picture</button>${extra}<button class="btn ghost" id="px">Cancel</button></div>`,
    (m, close) => { $('#px', m).onclick = close; $('#pc', m).onclick = () => { close(); onCamera(); }; $('#pp', m).onclick = () => { close(); onPick(); }; });
}

/* ----- the camera: a live viewfinder with a card-shaped guide ----- */
let camStream = null;
function stopCamera() { if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; } }
async function captureCard(deck, n, sequence) {
  const c = n < 0 ? { name: 'Deck cover', img: '', imgRWS: '' } : TAROT_DECK[n];
  const ov = document.createElement('div'); ov.className = 'cam';
  ov.innerHTML = `<div class="cam-top"><b>${esc(cardShort(c))}</b><span>${n < 0 ? 'The box, or your favorite card' : `Card ${n + 1} of 78`}</span></div>
    <div class="cam-view"><video playsinline muted autoplay></video><div class="cam-frame">${n < 0 ? '' : `<img src="${c.imgRWS || c.img}" alt="">`}</div><p class="cam-msg">Starting the camera…</p></div>
    <div class="cam-tip">Lay the card flat in good light and line it up inside the frame.</div>
    <div class="cam-bar"><button class="btn ghost" id="cx">Done</button><button class="cam-shoot" id="cs" aria-label="Take photo"></button><button class="btn ghost" id="cp">Photos</button></div>
    ${sequence ? `<div class="cam-skip"><button class="btn small ghost" id="ck">Skip this card ›</button></div>` : ''}`;
  document.body.appendChild(ov);
  const video = $('video', ov), msg = $('.cam-msg', ov);
  const close = () => { stopCamera(); ov.remove(); window.removeEventListener('hashchange', close); render(); };
  window.addEventListener('hashchange', close);
  const fromFile = async () => { const f = await pickFile('image/*'); if (!f) return; const url = await readImageFile(f, 2000, .9); stopCamera(); ov.remove(); window.removeEventListener('hashchange', close); adjustCard(deck, n, url, sequence); };
  $('#cx', ov).onclick = close;
  $('#cp', ov).onclick = fromFile;
  if (sequence) $('#ck', ov).onclick = () => { stopCamera(); ov.remove(); window.removeEventListener('hashchange', close); nextCard(deck, n); };
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera');
    stopCamera();
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    video.srcObject = camStream; await video.play().catch(() => { });
    msg.textContent = '';
  } catch (e) {
    msg.innerHTML = `The camera isn't available here${e && e.name === 'NotAllowedError' ? ' (permission was not given)' : ''}.<br>Tap <b>Photos</b> to choose or take a picture instead.`;
    $('#cs', ov).disabled = true;
  }
  $('#cs', ov).onclick = () => {
    if (!video.videoWidth) return;
    const cv = document.createElement('canvas'); cv.width = video.videoWidth; cv.height = video.videoHeight;
    cv.getContext('2d').drawImage(video, 0, 0);
    // start the editor with the photo already cropped to the on-screen guide
    const vr = video.getBoundingClientRect(), fr = $('.cam-frame', ov).getBoundingClientRect();
    const s = Math.max(vr.width / cv.width, vr.height / cv.height);          // object-fit: cover
    const ox = (vr.width - cv.width * s) / 2, oy = (vr.height - cv.height * s) / 2;
    const guide = { x: (fr.left - vr.left - ox) / s, y: (fr.top - vr.top - oy) / s, w: fr.width / s, h: fr.height / s };
    const url = cv.toDataURL('image/jpeg', .92);
    stopCamera(); ov.remove(); window.removeEventListener('hashchange', close);
    adjustCard(deck, n, url, sequence, guide);
  };
}
function nextCard(deck, n) {
  const have = new Set(deck.cards || []);
  for (let k = n + 1; k < 78; k++) if (!have.has(k)) return captureCard(deck, k, true);
  toast(have.size >= 78 ? 'All 78 cards photographed ✶' : 'Reached the end of the deck'); render();
}

/* ----- the editor: pinch, drag and twist the photo inside the card frame ----- */
function adjustCard(deck, n, src, sequence, guide) {
  const c = n < 0 ? { name: 'Deck cover', img: '', imgRWS: '' } : TAROT_DECK[n];
  const img = new Image();
  img.onload = () => {
    const ov = document.createElement('div'); ov.className = 'cam adj';
    ov.innerHTML = `<div class="cam-top"><b>${esc(cardShort(c))}</b><span>Pinch to size · drag to center · twist to straighten</span></div>
      <div class="adj-stage"><canvas></canvas></div>
      <div class="adj-ctl">
        <label>Size <input type="range" id="az" min="0.2" max="4" step="0.01"></label>
        <label>Turn <input type="range" id="ar" min="-45" max="45" step="0.5"><output id="arv"></output></label>
        <div class="adj-btns"><button class="btn small ghost" id="al">⟲ 90°</button><button class="btn small ghost" id="af">Fit</button><button class="btn small ghost" id="ag">Fill</button><button class="btn small ghost" id="arr">90° ⟳</button></div>
      </div>
      <div class="cam-bar"><button class="btn ghost" id="ax">Cancel</button><button class="btn ghost" id="are">Retake</button><button class="btn primary" id="as">${sequence ? 'Save & next' : 'Save'}</button></div>`;
    document.body.appendChild(ov);
    const cv = $('canvas', ov), ctx = cv.getContext('2d'), stage = $('.adj-stage', ov);
    let W, H, fw, fh, fx, fy;       // canvas size and card frame
    const st = { s: 1, r: 0, quarter: 0, x: 0, y: 0 };   // scale (relative to frame), rotation, centre offset in frame units
    const layout = () => {
      const dpr = window.devicePixelRatio || 1, r = stage.getBoundingClientRect();
      W = Math.round(r.width * dpr); H = Math.round(r.height * dpr); cv.width = W; cv.height = H;
      fh = Math.min(H * .86, W * .86 / (CARD_W / CARD_H)); fw = fh * CARD_W / CARD_H; fx = (W - fw) / 2; fy = (H - fh) / 2;
    };
    const fit = cover => {           // fit or fill the frame with the (rotated) photo
      const q = st.quarter % 2, iw = q ? img.height : img.width, ih = q ? img.width : img.height;
      st.s = cover ? Math.max(CARD_W / iw, CARD_H / ih) : Math.min(CARD_W / iw, CARD_H / ih); st.x = st.y = 0; st.r = 0;
    };
    const drawTo = (g, ox, oy, sc) => {   // sc: pixels per card-unit (frame is CARD_W x CARD_H units)
      g.save(); g.translate(ox + (CARD_W / 2 + st.x) * sc, oy + (CARD_H / 2 + st.y) * sc);
      g.rotate((st.quarter * 90 + st.r) * Math.PI / 180); g.scale(st.s * sc, st.s * sc);
      g.drawImage(img, -img.width / 2, -img.height / 2); g.restore();
    };
    const draw = () => {
      ctx.fillStyle = '#0b0812'; ctx.fillRect(0, 0, W, H);
      const sc = fw / CARD_W; drawTo(ctx, fx, fy, sc);
      ctx.fillStyle = 'rgba(11,8,18,.72)';            // dim everything outside the card
      ctx.fillRect(0, 0, W, fy); ctx.fillRect(0, fy + fh, W, H - fy - fh); ctx.fillRect(0, fy, fx, fh); ctx.fillRect(fx + fw, fy, W - fx - fw, fh);
      ctx.strokeStyle = '#d4ad5a'; ctx.lineWidth = 2 * (window.devicePixelRatio || 1); ctx.strokeRect(fx, fy, fw, fh);
      ctx.strokeStyle = 'rgba(240,212,138,.25)'; ctx.lineWidth = 1;   // rule-of-thirds guide for straightening
      for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(fx + fw * k / 3, fy); ctx.lineTo(fx + fw * k / 3, fy + fh); ctx.moveTo(fx, fy + fh * k / 3); ctx.lineTo(fx + fw, fy + fh * k / 3); ctx.stroke(); }
      $('#az', ov).value = st.s * Math.max(img.width, img.height) / CARD_H; $('#ar', ov).value = st.r; $('#arv', ov).textContent = (st.r > 0 ? '+' : '') + st.r.toFixed(1) + '°';
    };
    layout();
    if (guide) {                     // camera shot: start already cropped to the guide frame
      st.s = CARD_W / guide.w; st.x = (img.width / 2 - (guide.x + guide.w / 2)) * st.s; st.y = (img.height / 2 - (guide.y + guide.h / 2)) * st.s;
    } else fit(true);
    draw();
    window.addEventListener('resize', () => { if (document.body.contains(ov)) { layout(); draw(); } });
    // touch / mouse gestures
    const pts = new Map(); let g0 = null;
    const snap = () => { const p = [...pts.values()]; if (p.length === 1) return { x: p[0].x, y: p[0].y }; const [a, b] = p; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x) }; };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); g0 = { ...snap(), st: { ...st } }; });
    cv.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = snap(), unit = CARD_W / (fw / (window.devicePixelRatio || 1));   // screen px -> card units
      st.x = g0.st.x + (g.x - g0.x) * unit; st.y = g0.st.y + (g.y - g0.y) * unit;
      if (g.d && g0.d) { st.s = Math.max(.02, g0.st.s * g.d / g0.d); st.r = Math.max(-45, Math.min(45, g0.st.r + (g.ang - g0.ang) * 180 / Math.PI)); }
      draw();
    });
    const up = e => { pts.delete(e.pointerId); g0 = pts.size ? { ...snap(), st: { ...st } } : null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); st.s *= e.deltaY < 0 ? 1.05 : 1 / 1.05; draw(); }, { passive: false });
    $('#az', ov).oninput = e => { st.s = +e.target.value * CARD_H / Math.max(img.width, img.height); draw(); };
    $('#ar', ov).oninput = e => { st.r = +e.target.value; draw(); };
    $('#al', ov).onclick = () => { st.quarter = (st.quarter + 3) % 4; draw(); };
    $('#arr', ov).onclick = () => { st.quarter = (st.quarter + 1) % 4; draw(); };
    $('#af', ov).onclick = () => { fit(false); draw(); };
    $('#ag', ov).onclick = () => { fit(true); draw(); };
    const done = () => { ov.remove(); };
    $('#ax', ov).onclick = () => { done(); render(); };
    $('#are', ov).onclick = () => { done(); captureCard(deck, n, sequence); };
    $('#as', ov).onclick = async () => {
      const out = document.createElement('canvas'); out.width = CARD_W; out.height = CARD_H;
      const g = out.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, CARD_W, CARD_H); drawTo(g, 0, 0, 1);
      if (n < 0) { deck.image = out.toDataURL('image/jpeg', .8); const i = Decks.list.findIndex(y => y.id === deck.id); if (i >= 0) Decks.list[i].image = deck.image; await Decks.save(); }
      else await DeckImg.set(deck, n, out.toDataURL('image/jpeg', .85));
      if (Store.settings.activeDeck === deck.id) await applyDeckImages();
      done(); toast(`${cardShort(c)} saved ✶`);
      if (sequence) nextCard(deck, n); else render();
    };
  };
  img.onerror = () => toast('That picture could not be opened');
  img.src = src;
}

/* ----- share a deck as a file, and install one someone gave you ----- */
async function exportDeck(d) {
  toast('Preparing your deck…');
  const imgs = await DeckImg.all(d.id), cards = {};
  for (const i in imgs) cards[TAROT_DECK[i].name] = imgs[i];
  const data = { app: 'witches-companion-deck', version: 1, exported: new Date().toISOString(), deck: { name: d.name, creator: d.creator || '', since: d.since || '', notes: d.notes || '', image: d.image || '' }, cards };
  const fname = `${d.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'tarot'}-deck.json`;
  const n = Object.keys(cards).length;
  const ok = await saveFile(fname, 'application/json', JSON.stringify(data));
  if (ok) toast(`Deck saved: ${n} card${n === 1 ? '' : 's'}. Send the file to a friend to install.`);
}
async function importDeckFile() {
  const f = await pickFile('application/json,.json,text/plain,*/*'); if (!f) return;
  let data;
  try { data = JSON.parse(await f.text()); if (data.app !== 'witches-companion-deck' || !data.deck || !data.cards) throw 0; }
  catch (e) { toast('That file is not a Witches\' Companion deck'); return; }
  await Decks.load();
  const names = new Set(Decks.list.map(x => x.name));
  let name = String(data.deck.name || 'Shared deck'); if (names.has(name)) { let k = 2; while (names.has(`${name} (${k})`)) k++; name = `${name} (${k})`; }
  const deck = { id: newId('deck'), name, creator: data.deck.creator || '', since: '', notes: data.deck.notes || '', image: String(data.deck.image || '').startsWith('data:image/') ? data.deck.image : '', cards: [], shared: true };
  Decks.list.push(deck); await Decks.save();
  let count = 0;
  for (const [cardName, url] of Object.entries(data.cards)) {
    const i = TAROT_DECK.findIndex(c => c.name === cardName);
    if (i < 0 || typeof url !== 'string' || !url.startsWith('data:image/')) continue;
    await DB.set(DeckImg.key(deck.id, i), url); deck.cards.push(i); count++;
  }
  deck.cards.sort((a, b) => a - b); await Decks.save();
  toast(`Installed “${name}” with ${count} card${count === 1 ? '' : 's'} ✶`);
  location.hash = '#/decks/' + deck.id;
}
