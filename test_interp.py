import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/reading/tarot-celtic-cross'); await pg.wait_for_timeout(1500)
        await pg.evaluate("document.querySelector('.overview, .positions').scrollIntoView()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/i1.png')
        await pg.evaluate("window.scrollBy(0,700)"); await pg.screenshot(path='shots/i2.png')
        print('interp texts:', await pg.locator('.interp-text').count())
        await pg.evaluate("location.hash='#/card/'+encodeURIComponent('XVII · The Star')"); await pg.wait_for_timeout(700)
        await pg.screenshot(path='shots/i3.png')
        await pg.click('.ctx-d summary >> nth=2'); await pg.evaluate("window.scrollBy(0,600)"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='shots/i4.png')
        await pg.evaluate("location.hash='#/deck'"); await pg.wait_for_timeout(600)
        await pg.click('.deck-card >> nth=5'); await pg.wait_for_timeout(500)
        print('deck->', await pg.evaluate('decodeURIComponent(location.hash)'))
        print(errs); await b.close()
asyncio.run(main())
