/* ---------- SEND TO A FRIEND: share your own entries as a small file, and receive them ----------
   File: { app: 'witches-companion-share', version: 1, from, note, sent, items: [...] } */
const SHARE_APP = 'witches-companion-share';
const SHARE_TYPES = () => Object.keys(TYPES);

// a clean copy of an entry for sending (nothing app-internal)
function shareCopy(it) {
  const x = JSON.parse(JSON.stringify(it));
  ['builtin', 'edited', 'updated', 'svg'].forEach(k => delete x[k]);
  if (x.image && !/^(data:image\/|art:|img\/)/.test(x.image)) delete x.image;
  return x;
}
// hand a file to the phone's share sheet (Messages, WhatsApp, email…), or save it
async function sendFileToFriend(name, text, message) {
  if (window.AndroidBridge && AndroidBridge.shareFile) {
    AndroidBridge.shareFile(name, 'application/json', btoa(unescape(encodeURIComponent(text))), message || '');
    return true;
  }
  try {
    const file = new File([text], name, { type: 'application/json' });
    if (!window.claude && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name, text: message || '' }); return true;
    }
  } catch (e) { if (e && e.name === 'AbortError') { toast('Sending cancelled'); return false; } }
  return saveFile(name, 'application/json', text);
}

// share codes: the entries squeezed into a link that can travel by text message
const SHARE_LINK_MAX = 6000;
const b64url = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64url = str => { const b = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function streamBytes(bytes, stream) { const r = new Response(new Blob([bytes]).stream().pipeThrough(stream)); return new Uint8Array(await r.arrayBuffer()); }
async function encodeShare(data) {
  const raw = new TextEncoder().encode(JSON.stringify(data));
  if (window.CompressionStream) return 'z' + b64url(await streamBytes(raw, new CompressionStream('deflate-raw')));
  return 'j' + b64url(raw);
}
async function decodeShare(code) {
  const kind = code[0], bytes = unb64url(code.slice(1));
  const raw = kind === 'z' ? await streamBytes(bytes, new DecompressionStream('deflate-raw')) : bytes;
  return JSON.parse(new TextDecoder().decode(raw));
}
const shareLink = code => `${SITE_URL}app/#/receive/${code}`;

// the "Send to a friend" sheet for one or more entries
function shareItemsModal(items) {
  items = items.filter(Boolean); if (!items.length) return;
  const label = items.length === 1 ? `“${items[0].name}”` : `${items.length} entries`;
  modal(`<h2>Send to a Friend</h2>
    <p class="center small">Send ${esc(label)} to someone with the Witches' Companion. They tap it and add it to their own copy of the app.</p>
    <div class="form"><label for="sfrom">Your name (optional)</label><input type="text" id="sfrom" value="${esc(Store.settings.shareName || '')}" placeholder="so they know who it's from">
      <label for="snote">A note (optional)</label><textarea id="snote" placeholder="e.g. The tincture I told you about. Blessed be!"></textarea></div>
    <div class="send-ways">
      <button class="btn primary" id="sfile">${ART.share || ART.star} Send as a file<small>email, Facebook Messenger, WhatsApp, Drive…</small></button>
      <button class="btn" id="slink">${ART.edit} Send as a message<small>text message (SMS), Messenger or any chat, as a tap-to-add link</small></button>
      <p class="small muted center" id="snolink" hidden>This is too big for a message link (pictures make it large). Send it as a file instead.</p>
      <button class="btn ghost" id="scx">Cancel</button></div>`, (m, close) => {
    $('#scx', m).onclick = close;
    const build = async () => {
      const from = $('#sfrom', m).value.trim(), note = $('#snote', m).value.trim();
      if (from !== (Store.settings.shareName || '')) await Store.setSetting('shareName', from);
      return { data: { app: SHARE_APP, version: 1, sent: new Date().toISOString(), from, note, items: items.map(shareCopy) }, from };
    };
    const what = items.length === 1 ? `“${items[0].name}”` : `${items.length} entries`;
    // links only for entries small enough to travel in a text message
    build().then(({ data }) => encodeShare(data)).then(code => { if (code.length > SHARE_LINK_MAX) { $('#slink', m).disabled = true; $('#snolink', m).hidden = false; } }).catch(() => { });
    $('#sfile', m).onclick = async () => {
      const { data, from } = await build();
      const base = items.length === 1 ? items[0].name : 'Witches-Companion-entries';
      const fname = `${base.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'entry'}.witch.json`;
      const msg = `${from ? from + ' sent you' : 'Here is'} ${what} from Paco Morningstar's Witches' Companion. Open the attached file with the app, or in the app go to More → Receive from a Friend. Get the free app: ${SITE_URL}`;
      close(); if (await sendFileToFriend(fname, JSON.stringify(data), msg)) toast('Choose who to send it to ✶');
    };
    $('#slink', m).onclick = async () => {
      const { data, from } = await build(), code = await encodeShare(data);
      const text = `${from ? from + ' sent you' : 'Here is'} ${what} from Paco Morningstar's Witches' Companion ✶ Tap to add it to your app: ${shareLink(code)}`;
      close();
      if (window.AndroidBridge && AndroidBridge.shareText) { AndroidBridge.shareText(text); return; }
      try { if (!window.claude && navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      copyText(text, 'Message copied: paste it into a text or chat');
    };
  });
}

/* ----- receiving ----- */
const okImage = s => typeof s === 'string' && (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(s) || /^art:\w+$/.test(s) || /^img\/[\w\/.-]+\.(jpe?g|png|webp)$/.test(s));
function cleanIncoming(raw) {
  if (!raw || typeof raw !== 'object' || !TYPES[raw.type] || typeof raw.name !== 'string' || !raw.name.trim()) return null;
  const x = JSON.parse(JSON.stringify(raw));
  ['builtin', 'edited', 'svg', 'updated'].forEach(k => delete x[k]);
  if (x.image !== undefined && !okImage(x.image)) delete x.image;
  if (x.color !== undefined && !/^#[0-9a-f]{3,8}$/i.test(String(x.color))) delete x.color;
  if (x.backdrop !== undefined && !/^[a-z-]{1,24}$/.test(String(x.backdrop))) delete x.backdrop;
  if (x.type === 'tarot') {
    x.positions = arr(x.positions).map((p, i) => ({ n: +p.n || i + 1, name: String(p.name || ''), meaning: String(p.meaning || ''), guide: p.guide ? String(p.guide) : undefined, x: +p.x || 0, y: +p.y || 0, rotate: +p.rotate === 90 ? 90 : 0 }));
    x.lines = arr(x.lines).filter(l => Array.isArray(l) && l.length === 2).map(([a, b]) => [+a || 0, +b || 0]);
  }
  return x;
}
function previewShare(data) {
  const items = arr(data.items).map(cleanIncoming).filter(Boolean);
  if (!items.length) { toast('There was nothing in that file to add'); return; }
  modal(`<h2>${data.from ? `From ${esc(String(data.from).slice(0, 60))}` : 'Shared with You'} ✶</h2>
    ${data.note ? `<div class="chant frame" style="margin-bottom:10px">${esc(String(data.note).slice(0, 600))}</div>` : ''}
    <p class="small center">Choose what to add to your grimoire. Entries you add appear in <b>My Book of Shadows</b> and in their sections.</p>
    <div class="share-list">${items.map((it, i) => `<label class="share-row"><input type="checkbox" data-i="${i}" checked><span class="thumb">${pictureHTML(it)}</span><span><b>${esc(it.name)}</b><br><span class="small muted">${esc(TYPES[it.type].one)}${Store.get(it.id) ? ' · you already have one with this name' : ''}</span></span></label>`).join('')}</div>
    <div class="actions"><button class="btn ghost" id="rcx">Not now</button><button class="btn primary" id="radd">Add to my grimoire</button></div>`, (m, close) => {
    $('#rcx', m).onclick = close;
    $('#radd', m).onclick = async () => {
      const pick = $$('input[data-i]', m).filter(c => c.checked).map(c => items[+c.dataset.i]);
      if (!pick.length) { close(); return; }
      for (const it of pick) {
        if (Store.get(it.id) || !it.id) it.id = uid(it.type);     // never overwrite something already in the app
        if (data.from) it.sharedBy = String(data.from).slice(0, 60);
        await Store.save(it);
      }
      close(); toast(`Added ${pick.length} entr${pick.length === 1 ? 'y' : 'ies'} ✶`);
      location.hash = pick.length === 1 ? '#/view/' + encodeURIComponent(pick[0].id) : '#/mine';
    };
  });
}
// one door for every file the app understands: a friend's entries, a shared deck, or a backup
async function receiveFileText(text) {
  let data; try { data = JSON.parse(text); } catch (e) { toast('That file could not be read'); return; }
  if (data && data.app === SHARE_APP) return previewShare(data);
  if (data && data.app === 'witches-companion-deck') return installDeckData(data);
  if (data && Array.isArray(data.items)) { try { return await importBackupData(data); } catch (e) { toast('That backup could not be restored'); return; } }
  toast('That file is not from the Witches\' Companion');
}
async function receiveFromFriend() { location.hash = '#/receive'; }
async function receiveFromFile() {
  const f = await pickFile('application/json,.json,text/plain,*/*'); if (!f) return;
  receiveFileText(await f.text());
}
route('receive', async v => {
  setTitle('Receive from a Friend');
  v.innerHTML = `<p class="center small muted" style="margin:6px 4px 12px">When a friend sends you a spell, recipe, spread or deck from the Witches' Companion, add it here.</p>
    <div class="block frame"><h3>${ART.book}A file</h3><p class="small">Sent by email, Facebook Messenger, WhatsApp or Drive? Save the attachment, then choose it here.${window.AndroidBridge ? ' On Android you can also tap the file and choose <b>Witches\' Companion</b>.' : ''}</p>
      <div class="actions" style="margin:4px 0 0"><button class="btn primary" id="rfile">Choose the file</button></div></div>
    <div class="block frame"><h3>${ART.edit}A message link</h3><p class="small">Got a text with a link? Copy the whole message (or just the link) and paste it here.</p>
      <div class="form"><textarea id="rcode" placeholder="Paste the message or link here"></textarea></div>
      <div class="actions" style="margin:4px 0 0"><button class="btn" id="rpaste">Paste</button><button class="btn primary" id="rgo">Add it</button></div></div>`;
  $('#rfile', v).onclick = receiveFromFile;
  $('#rgo', v).onclick = () => receiveCodeText($('#rcode', v).value);
  $('#rpaste', v).onclick = async () => { try { $('#rcode', v).value = await navigator.clipboard.readText(); } catch (e) { toast('Long-press the box and choose Paste'); } };
});
// someone tapped a message link: show what was sent, with ways to add it to an installed app too
route('receive/:code', async (v, [code]) => {
  setTitle('Shared with You');
  const inBrowser = !window.AndroidBridge && !(window.matchMedia && matchMedia('(display-mode: standalone)').matches) && !navigator.standalone;
  const android = /Android/i.test(navigator.userAgent);
  v.innerHTML = `<div class="hero" style="padding-top:4px"><h1 style="font-size:1.3rem">Something was shared with you ✶</h1></div>
    ${inBrowser ? `<div class="block frame"><p class="small" style="margin-top:0">${android ? 'Have the Android app? Tap below to add this to it.' : 'Using the Witches\' Companion from your Home Screen? Tap <b>Copy</b>, open the app, then go to <b>More → Receive from a Friend</b> and paste.'}</p>
      <div class="actions" style="margin:4px 0 0">${android ? `<a class="btn primary" href="intent://receive/${esc(code)}#Intent;scheme=witchcompanion;package=io.github.pacogeist.witchcompanion;end">Open in the Android app</a>` : ''}<button class="btn" id="rcopy">Copy</button><button class="btn ghost" id="rhere">Add it here instead</button></div></div>` : ''}
    <div class="actions"><a class="btn ghost" href="#/">Home</a></div>`;
  const c = $('#rcopy', v); if (c) c.onclick = () => copyText(location.href, 'Copied. Now paste it in the app ✶');
  const h = $('#rhere', v); if (h) h.onclick = () => receiveCodeText(code);
  if (!inBrowser) receiveCodeText(code);
});
// a link or code someone texted ("…/app/#/receive/<code>", "witchcompanion://receive/<code>" or the bare code)
async function receiveCodeText(text) {
  const m = String(text).match(/receive\/([zj][A-Za-z0-9_-]{8,})/) || String(text).trim().match(/^([zj][A-Za-z0-9_-]{8,})$/);
  if (!m) { toast('No Witches\' Companion link found in that'); return false; }
  try { const data = await decodeShare(m[1]); if (!data || data.app !== SHARE_APP) throw 0; previewShare(data); return true; }
  catch (e) { toast('That link is incomplete or damaged. Ask for it to be sent again.'); return false; }
}
// Android: a file opened with the app, or a link shared into it
window.receiveIncoming = s => {
  if (!s) return;
  if (s.startsWith('file:')) { try { const b = atob(s.slice(5)), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); receiveFileText(new TextDecoder().decode(u)); } catch (e) { toast('That file could not be read'); } }
  else if (s.startsWith('text:')) receiveCodeText(s.slice(5));
};
function checkIncomingShare() {
  if (window.AndroidBridge && AndroidBridge.takeIncoming) { const s = AndroidBridge.takeIncoming(); if (s) setTimeout(() => window.receiveIncoming(s), 300); }
}

// pick several of your own entries to send at once
route('share', async (v, a, qs) => {
  setTitle('Send to a Friend');
  const mine = Object.values(Store.user).sort((x, y) => (TYPES[x.type].label).localeCompare(TYPES[y.type].label) || x.name.localeCompare(y.name));
  v.innerHTML = `<p class="center small muted" style="margin:6px 4px 10px">Choose any of your own spells, recipes, spreads, sigils and other entries, then send them together. Your friend opens the file with their Witches' Companion.</p>
    ${mine.length ? `<div class="actions" style="margin-top:0"><button class="btn small ghost" id="sall">Select all</button><button class="btn small ghost" id="snone">Clear</button></div>
    <div class="share-list">${mine.map(it => `<label class="share-row"><input type="checkbox" data-id="${esc(it.id)}" ${qs.id === it.id ? 'checked' : ''}><span class="thumb">${pictureHTML(it)}</span><span><b>${esc(it.name)}</b><br><span class="small muted">${esc(TYPES[it.type].one)}${it.edited ? ' · your edit' : ''}</span></span></label>`).join('')}</div>
    <div class="actions"><button class="btn primary" id="ssend">${ART.share || ART.star} Send selected</button></div>`
    : `<div class="empty">${ART.book}You haven't written any entries yet. Make one in My Book of Shadows, then send it here.</div>`}
    <div class="actions"><button class="btn ghost" id="srecv">Receive from a friend</button></div>`;
  const boxes = () => $$('input[data-id]', v);
  if (mine.length) {
    $('#sall', v).onclick = () => boxes().forEach(b => b.checked = true);
    $('#snone', v).onclick = () => boxes().forEach(b => b.checked = false);
    $('#ssend', v).onclick = () => { const ids = boxes().filter(b => b.checked).map(b => b.dataset.id); if (!ids.length) return toast('Tick at least one entry'); shareItemsModal(ids.map(id => Store.get(id))); };
  }
  $('#srecv', v).onclick = receiveFromFriend;
});
