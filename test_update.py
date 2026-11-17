import asyncio, json
from playwright.async_api import async_playwright
CH='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CH)
        # 1) web app from the GitHub Pages build: landing page, app, service worker, offline
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8790/'); await pg.wait_for_timeout(800)
        print('landing links', await pg.evaluate("[...document.querySelectorAll('.btn')].map(a=>a.getAttribute('href'))"))
        await pg.screenshot(path='shots/u_landing.png', full_page=True)
        await pg.goto('http://localhost:8790/app/'); await pg.wait_for_timeout(1500)
        await pg.evaluate("navigator.serviceWorker.ready.then(()=>1)"); await pg.wait_for_timeout(6000)
        print('sw controller', await pg.evaluate("!!navigator.serviceWorker.controller"), 'cached', await pg.evaluate("caches.keys().then(async ks=>{const c=await caches.open(ks[0]);return [ks, (await c.keys()).length]})"))
        await ctx.set_offline(True)
        await pg.reload(); await pg.wait_for_timeout(2000)
        await pg.evaluate("location.hash='#/view/herb-garlic'"); await pg.wait_for_timeout(800)
        print('offline page ok', await pg.evaluate("document.querySelector('.dhead h1')?.textContent"), 'img loaded', await pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length"))
        await ctx.set_offline(False)
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(600)
        print('web settings:', (await pg.evaluate("[...document.querySelectorAll('.section-title')].map(x=>x.textContent).join(' | ')")))
        await pg.screenshot(path='shots/u_web_settings.png', full_page=True)
        print('web errs', errs[:3]); await ctx.close()
        # 2) Android updater UI with a fake bridge
        ctx = await b.new_context(viewport={'width':360,'height':800}, device_scale_factor=2)
        VJ=open('dist/WitchCompanion/docs/version.json').read()
        await ctx.add_init_script("window.__VJ="+json.dumps(VJ)+";")
        await ctx.add_init_script("""
          window.__calls=[];
          window.AndroidBridge={ appInfo:()=>JSON.stringify({code:32,name:'3.6.1'}), saveFile(){},setTheme(){},
            checkUpdate(){ __calls.push('check'); const t=window.__VJ; setTimeout(()=>onUpdateInfo(t,null),100); },
            installUpdate(u){ __calls.push('install:'+u); let p=0; const iv=setInterval(()=>{p+=25; onUpdateStatus('downloading',String(p)); if(p>=100){clearInterval(iv); onUpdateStatus('installing',''); setTimeout(()=>onUpdateStatus('confirm',''),200);}},100); },
            openUrl(){} };""")
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(6500)
        print('auto-check calls', await pg.evaluate("__calls"), 'modal', await pg.evaluate("document.querySelector('.modal h2')?.textContent"))
        await pg.screenshot(path='shots/u_modal.png')
        await pg.click('#un'); await pg.wait_for_timeout(1200)
        print('progress msg', await pg.evaluate("document.querySelector('#updProg .msg').textContent"), await pg.evaluate("__calls"))
        await pg.screenshot(path='shots/u_progress.png')
        await pg.evaluate("document.querySelector('.modal')?.remove(); location.hash='#/settings'"); await pg.wait_for_timeout(600)
        await pg.click('#cupd'); await pg.wait_for_timeout(800)
        print('manual check modal', await pg.evaluate("document.querySelector('.modal h2')?.textContent"))
        await pg.evaluate("document.querySelector('.modal')?.remove()")
        # up to date case
        await pg.evaluate("AndroidBridge.appInfo=()=>JSON.stringify({code:33,name:'3.7'})")
        await pg.click('#cupd'); await pg.wait_for_timeout(900)
        print('toast', await pg.evaluate("document.querySelector('#toast').textContent"))
        el = await pg.query_selector('.form'); 
        await pg.screenshot(path='shots/u_and_settings.png', full_page=True)
        print('android errs', errs[:3]); await b.close()
asyncio.run(main())
