import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/list/tarot'); await pg.wait_for_timeout(1200)
        await pg.click('#holBtn'); await pg.wait_for_timeout(400)
        print(await pg.evaluate("[...document.querySelectorAll('#lst .nm')].map(x=>x.textContent)"))
        await pg.screenshot(path='shots/hl.png')
        await pg.evaluate("location.hash='#/reading/tarot-jack-o-lantern-carved-face'"); await pg.wait_for_timeout(1500)
        print('reading bd:', await pg.evaluate("document.querySelector('.spread-stage')?.className"))
        await pg.screenshot(path='shots/hr.png')
        await pg.click('.bd-sw-moon'); await pg.wait_for_timeout(300)
        print('after moon:', await pg.evaluate("document.querySelector('.spread-stage').className"))
        await pg.click('.bd-sw-auto'); await pg.wait_for_timeout(300)
        print('after auto:', await pg.evaluate("document.querySelector('.spread-stage').className"))
        print(errs); await b.close()
asyncio.run(main())
