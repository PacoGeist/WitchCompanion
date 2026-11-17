import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/moon'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='shots/m1.png')
        # render a set of phases on a test page
        await pg.evaluate("""document.querySelector('#view').innerHTML='<div style=\"display:flex;flex-wrap:wrap;gap:6px;background:#000;padding:8px\">'+[0.02,0.08,0.15,0.25,0.35,0.45,0.5,0.6,0.75,0.85,0.95].map(f=>MOON.photo(f,110)).join('')+'</div>'""")
        await pg.wait_for_timeout(500); await pg.screenshot(path='shots/m2.png')
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(800)
        await pg.click('#tord [data-k="journal"] [data-a="top"]'); await pg.click('#tord [data-k="more"] [data-a="eye"]'); await pg.click('#tord [data-k="craft"] [data-a="eye"]')
        await pg.locator('#tord').scroll_into_view_if_needed(); await pg.screenshot(path='shots/m3.png')
        await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(800)
        print('tiles:', await pg.evaluate("[...document.querySelectorAll('.home-grid .tile b')].map(x=>x.textContent)"))
        print('banner last:', await pg.evaluate("!!document.querySelector('.home-grid ~ .craft-banner, .craft-banner')"), await pg.evaluate("[...document.querySelector('#view').children].map(x=>x.className).slice(-4)"))
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(600); await pg.click('#treset'); await pg.click('#hemi [data-h=south]')
        await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(800)
        print('reset tiles:', await pg.evaluate("[...document.querySelectorAll('.home-grid .tile b')].map(x=>x.textContent).join(',')"))
        await pg.screenshot(path='shots/m4.png')
        print(errs); await b.close()
asyncio.run(main())
