import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/list/tarot'); await pg.wait_for_timeout(1200)
        await pg.click('#dailyBtn'); await pg.wait_for_timeout(400)
        print('daily:', await pg.evaluate("[...document.querySelectorAll('#lst .nm')].map(x=>x.textContent)"))
        await pg.screenshot(path='shots/d1.png')
        await pg.evaluate("location.hash='#/search?q=cough'"); await pg.wait_for_timeout(600)
        print('cough results:', await pg.locator('#sres .row').count())
        await pg.evaluate("location.hash='#/list/brew?f=nausea'"); await pg.wait_for_timeout(600)
        await pg.screenshot(path='shots/d2.png')
        print(errs); await b.close()
asyncio.run(main())
