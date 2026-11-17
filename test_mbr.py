import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/'); await pg.wait_for_timeout(1500)
        print('tiles', await pg.evaluate("[...document.querySelectorAll('.home-grid .tile b')].map(x=>x.textContent).join(', ')"))
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(800)
        await pg.locator('#mbr').scroll_into_view_if_needed()
        await pg.evaluate("const r=document.querySelector('#mbr');r.value='1.5';r.dispatchEvent(new Event('input'));r.dispatchEvent(new Event('change'))"); await pg.wait_for_timeout(400)
        await pg.locator('.moon-bright').screenshot(path='shots/mbr.png')
        print('saved', await pg.evaluate("Store.settings.moonBright"), 'order list', await pg.evaluate("[...document.querySelectorAll('#tord b')].map(x=>x.textContent).join(', ')"))
        await pg.reload(); await pg.wait_for_timeout(1200); print('after reload bright', await pg.evaluate("MOON.bright"))
        await pg.evaluate("location.hash='#/moon'"); await pg.wait_for_timeout(600); print(await pg.evaluate("document.getElementById('moonlive').innerText"))
        print(errs); await b.close()
asyncio.run(main())
