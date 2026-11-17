import asyncio, json
from playwright.async_api import async_playwright
# a stand-in for the Android app's bridge, recording what the page hands it
BRIDGE = """window.AndroidBridge = { _perm:'off', sent:[], tests:[],
  setReminders(j){ this.sent.push(JSON.parse(j)); }, notifyPermission(){ return this._perm; },
  requestNotifyPermission(){ this._perm='granted'; setTimeout(()=>onNotifyPermission(true),50); }, openNotifySettings(){},
  testReminder(t,b){ this.tests.push([t,b]); }, checkUpdate(){}, appInfo(){ return '{}'; }, takeIncoming(){ return ''; } };"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        errs = []
        # ---- Android ----
        ctx = await b.new_context(viewport={'width': 360, 'height': 800}, device_scale_factor=2, timezone_id='America/New_York')
        await ctx.add_init_script(BRIDGE)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/moon'); await pg.wait_for_timeout(1500)
        print('moon button:', await pg.inner_text('a[href="#/moon/reminders"]'))
        print('sync on start (off) ->', await pg.evaluate("AndroidBridge.sent.at(-1)"))
        await pg.click('a[href="#/moon/reminders"]'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='shots/r1.png', full_page=True)
        await pg.click('#ron [data-v=on]'); await pg.wait_for_timeout(600)
        last = await pg.evaluate("AndroidBridge.sent.at(-1)")
        print('after on:', len(last), 'reminders; first 3:'); [print('  ', json.dumps({**x, 'at': x['at']}), ) for x in last[:3]]
        print('dates:', await pg.evaluate("AndroidBridge.sent.at(-1).slice(0,4).map(x=>new Date(x.at).toString().slice(0,24))"))
        await pg.screenshot(path='shots/r2.png', full_page=True)
        # choose all four phases + sabbats, both days, 08:30
        await pg.check('[data-ph="First Quarter"]'); await pg.wait_for_timeout(200)
        await pg.check('#rsab'); await pg.wait_for_timeout(200)
        await pg.click('#rwhen [data-v=both]'); await pg.wait_for_timeout(200)
        await pg.fill('#rtime', '08:30'); await pg.dispatch_event('#rtime', 'change'); await pg.wait_for_timeout(300)
        last = await pg.evaluate("AndroidBridge.sent.at(-1)")
        print('after changes:', len(last), 'kinds:', sorted(set(x['title'].replace(' tomorrow','').replace(' today','').split(' (')[0] for x in last)))
        print('all at 08:30:', await pg.evaluate("AndroidBridge.sent.at(-1).every(x=>{const d=new Date(x.at);return d.getHours()==8&&d.getMinutes()==30})"))
        print('sorted & unique ids:', await pg.evaluate("(l=>l.every((x,i)=>!i||l[i-1].at<=x.at) && new Set(l.map(x=>x.id)).size===l.length)(AndroidBridge.sent.at(-1))"))
        print('samhain/yule sample:', [x['title']+' | '+x['body'] for x in last if 'Yule' in x['title']][:2])
        await pg.click('#rtest'); print('test sent:', await pg.evaluate("AndroidBridge.tests"))
        await pg.screenshot(path='shots/r3.png', full_page=True)
        # settings page section and the route from a tapped notification
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(500)
        print('settings text:', (await pg.inner_text('#view'))[:0] or await pg.evaluate("[...document.querySelectorAll('#view p.small')].map(p=>p.textContent).find(t=>t.includes('notification'))"))
        await pg.evaluate("receiveIncoming('route:#/moon')"); await pg.wait_for_timeout(400); print('route ->', await pg.evaluate("location.hash"))
        # turning off sends an empty list
        await pg.evaluate("location.hash='#/moon/reminders'"); await pg.wait_for_timeout(400); await pg.click('#ron [data-v=off]'); await pg.wait_for_timeout(300)
        print('after off:', await pg.evaluate("AndroidBridge.sent.at(-1).length"))
        await ctx.close()
        # ---- web / iPhone ----
        ctx = await b.new_context(viewport={'width': 320, 'height': 760}, device_scale_factor=2, timezone_id='America/New_York', accept_downloads=True)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/moon/reminders'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='shots/r4.png', full_page=True)
        await pg.check('#rsab'); await pg.click('#rwhen [data-v=both]'); await pg.wait_for_timeout(200)
        async with pg.expect_download() as dl: await pg.click('#rics')
        d = await dl.value; await d.save_as('shots/moon.ics'); print('ics file:', d.suggested_filename)
        print('errors:', errs); await b.close()
asyncio.run(main())
