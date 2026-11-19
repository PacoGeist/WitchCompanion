/* ---------- MOON REMINDERS ----------
   Android app: the page works out the coming reminders (moon.js) and hands them to the app, which
   schedules them with Android's alarm service and shows a notification at the chosen time, even when
   the app is closed. Nothing goes online.
   Web / iPhone app: a web page can't wake itself up offline, so it makes a calendar file instead and
   the phone's own calendar does the reminding. */
const Reminders = {
  PHASES: ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'],
  DAYS: 400,                 // how far ahead reminders are scheduled; refreshed every time the app opens
  SABBAT_INFO: {
    Imbolc: 'The first stirrings of spring. Hearth, home and Brigid.',
    Ostara: 'The spring equinox. Balance, new growth and fresh starts.',
    Beltane: 'Fire and blossom. Fertility, passion and joy.',
    Litha: 'Midsummer. The sun at its height; strength and abundance.',
    Lughnasadh: 'The first harvest. Gratitude for what has grown.',
    Mabon: 'The autumn equinox. The second harvest, balance and thanks.',
    Samhain: 'The veil is thin. Ancestors, endings and divination.',
    Yule: 'The winter solstice. The return of the light.',
  },
  android: () => !!(window.AndroidBridge && AndroidBridge.setReminders),
  prefs() {
    const r = Store.settings.reminders || {};
    return {
      on: !!r.on,
      phases: Array.isArray(r.phases) ? r.phases.filter(p => this.PHASES.includes(p)) : ['New Moon', 'Full Moon'],
      sabbats: !!r.sabbats,
      when: ['day', 'before', 'both'].includes(r.when) ? r.when : 'day',
      time: /^\d{1,2}:\d{2}$/.test(r.time || '') ? r.time : '19:00',
    };
  },
  async save(patch) { await Store.setSetting('reminders', { ...this.prefs(), ...patch }); this.sync(); },

  // the moments worth reminding about: chosen moon phases and (optionally) sabbats
  occasions(from, to) {
    const p = this.prefs(), out = [];
    MOON.phasesBetween(from, to).filter(x => p.phases.includes(x.phase)).forEach(x => out.push({
      kind: x.phase, date: x.date, timed: true, name: x.phase + (x.moonName ? ` (${x.moonName})` : ''),
      info: MOON.PHASE_INFO[x.phase],
    }));
    if (p.sabbats) for (let y = from.getFullYear(); y <= to.getFullYear(); y++)
      MOON.sabbats(y).filter(s => s.date >= new Date(from.getFullYear(), from.getMonth(), from.getDate()) && s.date <= to)
        .forEach(s => out.push({ kind: s.name, date: s.date, timed: false, name: s.name, info: this.SABBAT_INFO[s.name] || 'A sabbat on the Wheel of the Year.' }));
    return out.sort((a, b) => a.date - b.date);
  },
  // the notifications to show, each at the chosen time on the day itself and/or the day before
  upcoming(now = new Date(), days = this.DAYS) {
    const p = this.prefs(); if (!p.on) return [];
    const [hh, mm] = p.time.split(':').map(Number);
    const offsets = p.when === 'both' ? [-1, 0] : p.when === 'before' ? [-1] : [0];
    const out = [];
    this.occasions(new Date(now.getTime() - 2 * 864e5), new Date(now.getTime() + days * 864e5)).forEach(o => {
      offsets.forEach(off => {
        const d = o.date, at = new Date(d.getFullYear(), d.getMonth(), d.getDate() + off, hh, mm);
        if (at <= now) return;
        const exact = !o.timed ? '' : off ? `Exact at ${fmtTime(d)} on ${fmtDate(d)}. ` : d < at ? `Exact earlier today at ${fmtTime(d)}. ` : `Exact at ${fmtTime(d)}. `;
        out.push({
          at: at.getTime(), id: this.hash(o.kind + d.toDateString() + off),
          title: `${o.name} ${off ? 'tomorrow' : 'today'}`,
          body: exact + o.info,
        });
      });
    });
    return out.sort((a, b) => a.at - b.at).slice(0, 250);
  },
  hash(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 1000000 + 1000; },

  // hand the schedule to the Android app (an empty list cancels everything)
  sync() {
    if (!this.android()) return;
    try { AndroidBridge.setReminders(JSON.stringify(this.upcoming())); } catch (e) { }
  },
  permission() { try { return this.android() && AndroidBridge.notifyPermission ? AndroidBridge.notifyPermission() : 'granted'; } catch (e) { return 'granted'; } },
  _permWait: null,
  askPermission() {
    if (this.permission() === 'granted') return Promise.resolve(true);
    return new Promise(res => {
      const t = setTimeout(() => { this._permWait = null; res(this.permission() === 'granted'); }, 60000);
      this._permWait = ok => { clearTimeout(t); this._permWait = null; res(ok); };
      AndroidBridge.requestNotifyPermission();
    });
  },

  // an .ics calendar file: one all-day event per occasion, with alerts at the chosen time
  ics(now = new Date()) {
    const p = this.prefs(), [hh, mm] = p.time.split(':').map(Number), mins = hh * 60 + mm;
    const pad = n => String(n).padStart(2, '0');
    const ymd = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const txt = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const dur = m => { const neg = m < 0; m = Math.abs(m); return `${neg ? '-' : ''}PT${Math.floor(m / 60)}H${m % 60}M`; };
    const alarm = (trig, d) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${txt(d)}`, `TRIGGER:${trig}`, 'END:VALARM'];
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', "PRODID:-//PacoGeist//Witches' Companion//EN", 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Moon and Sabbats'];
    this.occasions(new Date(now.getFullYear(), now.getMonth(), now.getDate()), new Date(now.getTime() + 366 * 864e5)).forEach(o => {
      const d = o.date, next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      L.push('BEGIN:VEVENT', `UID:${o.kind.replace(/\W+/g, '-').toLowerCase()}-${ymd(d)}@pacogeist.github.io`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(next)}`, `SUMMARY:${txt(o.name + (o.timed ? ' ' + fmtTime(d) : ''))}`,
        `DESCRIPTION:${txt((o.timed ? `Exact at ${fmtTime(d)}. ` : '') + o.info)}`, 'TRANSP:TRANSPARENT');
      if (p.when !== 'before') L.push(...alarm(dur(mins), o.name + ' today'));
      if (p.when !== 'day') L.push(...alarm(dur(mins - 1440), o.name + ' tomorrow'));
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    // fold long lines at 75 bytes, as the calendar format asks
    const fold = line => { const out = []; let cur = '', n = 0; for (const ch of line) { const b = new TextEncoder().encode(ch).length; if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; n = 0; } cur += ch; n += b; } out.push(cur); return out.join('\r\n '); };
    return L.map(fold).join('\r\n') + '\r\n';
  },
  summary() {
    const p = this.prefs();
    if (!p.on) return 'Off';
    const what = [...p.phases, ...(p.sabbats ? ['sabbats'] : [])];
    return what.length ? what.join(', ') : 'Nothing chosen yet';
  },
};
window.onNotifyPermission = ok => { if (Reminders._permWait) Reminders._permWait(!!ok); };

function timeLabel(t) { const [h, m] = t.split(':').map(Number); return fmtTime(new Date(2000, 0, 1, h, m)); }

route('moon/reminders', async v => {
  setTitle('Moon Reminders');
  const a = Reminders.android();
  const paint = () => {
    const p = Reminders.prefs(), perm = Reminders.permission();
    const next = Reminders.upcoming().slice(0, 6);
    v.innerHTML = `
      <div class="center" style="margin-top:6px"><div class="rem-bell">${ART.bell}</div></div>
      <p class="center small muted" style="margin:4px 6px 10px">${a
        ? 'Get a notification before the moon phases you work with, even when the app is closed. Everything is worked out on this phone; nothing goes online.'
        : 'This web app can\'t send notifications by itself while it is closed, so it makes a calendar file for you. Add it to your phone\'s calendar and the calendar reminds you.'}</p>
      <div class="form">
        ${a ? `<div class="switch"><div><b class="fell">Reminders</b><div class="small muted">${p.on ? 'On' : 'Off'}</div></div><div class="seg" id="ron"><button data-v="on">On</button><button data-v="off">Off</button></div></div>
        ${p.on && perm !== 'granted' ? `<div class="frame rem-warn"><p class="small" style="margin:0 0 8px">Notifications are turned off for this app, so reminders can't appear yet.</p><div class="actions" style="margin:0"><button class="btn small" id="rperm">Allow notifications</button></div></div>` : ''}` : ''}
        <div class="section-title"><h2>Remind me about</h2></div>
        <div class="rem-opts">
          ${Reminders.PHASES.map((ph, i) => `<label class="share-row"><input type="checkbox" data-ph="${esc(ph)}" ${p.phases.includes(ph) ? 'checked' : ''}><span class="rem-ico">${MOON.svg(i / 4, 30)}</span><span><b>${esc(ph)}</b><br><span class="small muted">${esc(MOON.PHASE_INFO[ph].split(/[.:;]/)[0])}</span></span></label>`).join('')}
          <label class="share-row"><input type="checkbox" id="rsab" ${p.sabbats ? 'checked' : ''}><span class="rem-ico">${ART.silverwheel}</span><span><b>Sabbats</b><br><span class="small muted">The Wheel of the Year (northern hemisphere dates)</span></span></label>
        </div>
        <div class="switch rem-when"><div><b class="fell">When</b><div class="small muted">At the time you choose below</div></div><div class="seg" id="rwhen"><button data-v="before">Day before</button><button data-v="day">On the day</button><button data-v="both">Both</button></div></div>
        <div class="switch"><div><b class="fell">Time</b><div class="small muted">${esc(timeLabel(p.time))}</div></div><input type="time" id="rtime" value="${esc(p.time)}" class="rem-time" aria-label="Reminder time"></div>
        ${a ? `<div class="section-title"><h2>Coming up</h2></div>
        ${p.on ? (next.length ? `<div class="frame">${next.map(n => `<div class="rem-next"><b>${esc(n.title)}</b><span class="small">${fmtDate(new Date(n.at))} · ${fmtTime(new Date(n.at))}</span></div>`).join('')}</div>`
          : '<div class="empty">Choose at least one phase above.</div>') : '<p class="small muted">Turn reminders on to see what is coming.</p>'}
        ${p.on && perm === 'granted' ? '<div class="actions"><button class="btn small ghost" id="rtest">Send a test reminder</button></div>' : ''}
        <p class="small muted">Reminders are planned about a year ahead and topped up each time you open the app. Times follow your phone's time zone.</p>`
        : `<div class="section-title"><h2>Your calendar</h2></div>
        <p class="small">The file holds the next twelve months. Save it, open it, and tap <b>Add All</b> (iPhone) or import it into your calendar app. Come back next year for a fresh one.</p>
        <div class="actions"><button class="btn primary" id="rics">${ART.moon} Add to my calendar</button></div>`}
      </div>`;
    $$('#ron button', v).forEach(b => b.classList.toggle('on', (b.dataset.v === 'on') === p.on));
    $$('#rwhen button', v).forEach(b => b.classList.toggle('on', b.dataset.v === p.when));
    wire();
  };
  const wire = () => {
    const ron = $('#ron', v);
    if (ron) ron.onclick = async e => {
      const b = e.target.closest('button'); if (!b) return;
      const on = b.dataset.v === 'on';
      if (on && !(await Reminders.askPermission())) toast('Allow notifications in Android settings to get reminders');
      await Reminders.save({ on }); paint(); toast(on ? 'Moon reminders on' : 'Moon reminders off');
    };
    const rp = $('#rperm', v);
    if (rp) rp.onclick = async () => {
      if (await Reminders.askPermission()) { Reminders.sync(); toast('Notifications allowed'); paint(); }
      else if (AndroidBridge.openNotifySettings) AndroidBridge.openNotifySettings();
    };
    $$('[data-ph]', v).forEach(c => c.onchange = async () => { await Reminders.save({ phases: $$('[data-ph]', v).filter(x => x.checked).map(x => x.dataset.ph) }); paint(); });
    $('#rsab', v).onchange = async e => { await Reminders.save({ sabbats: e.target.checked }); paint(); };
    $('#rwhen', v).onclick = async e => { const b = e.target.closest('button'); if (!b) return; await Reminders.save({ when: b.dataset.v }); paint(); };
    $('#rtime', v).onchange = async e => { if (/^\d{1,2}:\d{2}/.test(e.target.value)) { await Reminders.save({ time: e.target.value.slice(0, 5) }); paint(); } };
    const rt = $('#rtest', v);
    if (rt) rt.onclick = () => {
      const n = Reminders.upcoming()[0];
      AndroidBridge.testReminder(n ? n.title : 'Moon reminders are working', n ? n.body : 'You will hear from the moon at the time you chose.');
      toast('Test reminder sent');
    };
    const ri = $('#rics', v);
    if (ri) ri.onclick = async () => {
      const p = Reminders.prefs();
      if (!p.phases.length && !p.sabbats) { toast('Choose at least one phase first'); return; }
      const ok = await saveFile(`moon-reminders-${new Date().getFullYear()}.ics`, 'text/calendar', Reminders.ics());
      if (ok) toast('Calendar file ready');
    };
  };
  paint();
  // coming back from Android's notification settings
  const onVis = () => { if (document.visibilityState === 'visible' && location.hash.startsWith('#/moon/reminders')) { Reminders.sync(); paint(); } else if (!location.hash.startsWith('#/moon/reminders')) document.removeEventListener('visibilitychange', onVis); };
  document.addEventListener('visibilitychange', onVis);
});
