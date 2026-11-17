import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/view/tarot-moonlit-path'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='shots/mp1.png')
        await pg.evaluate("location.hash='#/reading/tarot-moonlit-path'"); await pg.wait_for_timeout(1600)
        await pg.screenshot(path='shots/mp2.png')
        await pg.click('.walk-btn'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='shots/mp3.png')
        await pg.click('#wn'); await pg.wait_for_timeout(700)
        await pg.screenshot(path='shots/mp4.png')
        for i in range(19): await pg.click('#wn'); await pg.wait_for_timeout(80)
        await pg.wait_for_timeout(300); await pg.screenshot(path='shots/mp5.png')
        print(errs); await b.close()
asyncio.run(main())
