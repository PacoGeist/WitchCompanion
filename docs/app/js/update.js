/* ---------- APP UPDATES ----------
   Android app: asks GitHub (version.json) for a newer build, downloads the APK and hands it to Android's installer.
   Web / iPhone app: the service worker (sw.js) keeps itself up to date; we just offer a reload. */
const SITE_URL = 'https://pacogeist.github.io/WitchCompanion/';
const Updater = {
  android: () => !!(window.AndroidBridge && AndroidBridge.checkUpdate),
  current() {
    if (this.android()) { try { const i = JSON.parse(AndroidBridge.appInfo()); if (i.code) return i; } catch (e) { } }
    return window.APP_VERSION || { code: 0, name: '?' };
  },
  _wait: null,
  check() {                       // -> Promise<{info, newer} | {error}>
    if (!this.android()) return Promise.resolve({ error: 'web' });
    return new Promise(res => {
      const t = setTimeout(() => { this._wait = null; res({ error: 'timeout' }); }, 25000);
      this._wait = r => { clearTimeout(t); this._wait = null; res(r); };
      AndroidBridge.checkUpdate();
    });
  },
};
window.onUpdateInfo = (txt, err) => {
  let r;
  if (err || !txt) r = { error: err || 'no data' };
  else { try { const info = JSON.parse(txt); r = { info, newer: +info.versionCode > +Updater.current().code }; } catch (e) { r = { error: 'bad version file' }; } }
  if (Updater._wait) Updater._wait(r);
};
window.onUpdateStatus = (state, detail) => {
  const box = document.querySelector('#updProg'); if (!box) { if (state === 'failed') toast('Update failed: ' + detail); return; }
  const bar = box.querySelector('i'), msg = box.querySelector('.msg');
  if (state === 'downloading') { bar.style.width = (+detail || 0) + '%'; msg.textContent = `Downloading… ${+detail || 0}%`; }
  else if (state === 'installing') { bar.style.width = '100%'; msg.textContent = 'Opening the installer…'; }
  else if (state === 'confirm') msg.innerHTML = 'Tap <b>Update</b> (or <b>Install</b>) on the Android screen. If Android asks, allow this app to install updates, then come back and tap Update again.';
  else if (state === 'done') msg.textContent = 'Updated! The app will restart.';
  else if (state === 'cancelled') { msg.textContent = 'Update cancelled. You can try again any time from Settings.'; box.dataset.done = 1; }
  else if (state === 'failed') { msg.textContent = 'The update could not be completed: ' + detail + '. Try again later, or download it from the website.'; box.dataset.done = 1; }
};
function notesHTML(info) {
  const n = Array.isArray(info.notes) ? info.notes : info.notes ? [info.notes] : [];
  return n.length ? `<ul class="uses" style="text-align:left">${n.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
}
function updateModal(info) {
  const cur = Updater.current();
  modal(`<h2>A new version is ready ✶</h2>
    <p class="center">Version <b>${esc(info.versionName)}</b> is available. You have ${esc(cur.name)}.</p>
    ${notesHTML(info)}
    <p class="small muted center">Your entries, readings and settings stay safe; updates install over the app.</p>
    <div id="updProg" class="upd-prog" hidden><div class="bar"><i style="width:0"></i></div><p class="small msg center"></p></div>
    <div class="actions" id="updBtns"><button class="btn ghost" id="ul">Later</button><button class="btn primary" id="un">Update now</button></div>`, (m, close) => {
    $('#ul', m).onclick = close;
    $('#un', m).onclick = () => {
      $('#updProg', m).hidden = false; $('#un', m).disabled = true; $('#un', m).textContent = 'Updating…';
      AndroidBridge.installUpdate(info.apk);
      const iv = setInterval(() => { const p = $('#updProg', m); if (!p || !document.body.contains(p)) return clearInterval(iv); if (p.dataset.done) { clearInterval(iv); delete p.dataset.done; $('#un', m).disabled = false; $('#un', m).textContent = 'Try again'; } }, 500);
    };
  });
}
async function checkForUpdates(manual) {
  if (!Updater.android()) {
    if (manual) {
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration().catch(() => null);
      if (reg) { try { await reg.update(); } catch (e) { } toast(reg.waiting ? 'An update is ready, reloading…' : 'You have the latest version'); if (reg.waiting) { reg.waiting.postMessage('skip'); } }
      else toast('Updates arrive automatically when you are online');
    }
    return;
  }
  if (manual) toast('Checking for updates…');
  const r = await Updater.check();
  await Store.setSetting('lastUpdateCheck', Date.now());
  if (r.error) { if (manual) toast(r.error === 'timeout' ? 'Could not reach GitHub. Are you online?' : 'Could not check for updates right now'); return; }
  if (r.newer) updateModal(r.info); else if (manual) toast(`You have the latest version (${Updater.current().name})`);
}
// once a day, a few seconds after opening (Android app only)
function autoUpdateCheck() {
  if (!Updater.android() || Store.settings.autoUpdate === false) return;
  if (Date.now() - (+Store.settings.lastUpdateCheck || 0) < 20 * 3600 * 1000) return;
  setTimeout(() => checkForUpdates(false), 4000);
}
function updatesSettingsHTML() {
  const cur = Updater.current(), a = Updater.android();
  return `<div class="section-title"><h2>App Updates</h2></div>
    <p class="small">You have version <b>${esc(cur.name)}</b>${cur.code ? ` (build ${esc(cur.code)})` : ''}. ${a ? 'Updates come from the official GitHub page. Checking is the only time the app goes online.' : 'This web app updates itself whenever you open it while online.'}</p>
    ${a ? `<div class="switch"><div><b class="fell">Check automatically</b><div class="small muted">Once a day, when the app opens</div></div><div class="seg" id="aupd"><button data-v="on">On</button><button data-v="off">Off</button></div></div>` : ''}
    <div class="actions"><button class="btn" id="cupd">Check for updates</button>${a ? '' : `<a class="btn ghost" href="${SITE_URL}" target="_blank" rel="noopener">Get the Android app</a>`}</div>`;
}
function wireUpdatesSettings(v) {
  const s = $('#aupd', v);
  if (s) {
    const paint = () => $$('#aupd button', v).forEach(b => b.classList.toggle('on', (b.dataset.v === 'on') === (Store.settings.autoUpdate !== false)));
    paint(); s.onclick = async e => { const b = e.target.closest('button'); if (!b) return; await Store.setSetting('autoUpdate', b.dataset.v === 'on'); paint(); };
  }
  $('#cupd', v).onclick = () => checkForUpdates(true);
}
// ---- web app (iPhone / browsers): register the offline service worker ----
if ('serviceWorker' in navigator && !window.AndroidBridge && (location.protocol === 'https:' || location.hostname === 'localhost') && !window.claude && /github\.io$|localhost/.test(location.hostname) && window.self === window.top) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      const ready = w => { if (!w) return; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offerReload(w); }); };
      if (reg.waiting && navigator.serviceWorker.controller) offerReload(reg.waiting);
      reg.addEventListener('updatefound', () => ready(reg.installing));
    }).catch(() => { });
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
  });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
}
function offerReload(w) {
  modal(`<h2>Update ready ✶</h2><p class="center">A new version of the Companion has downloaded.</p><div class="actions"><button class="btn ghost" id="rl">Later</button><button class="btn primary" id="rn">Restart now</button></div>`,
    (m, close) => { $('#rl', m).onclick = close; $('#rn', m).onclick = () => w.postMessage('skip'); });
}
