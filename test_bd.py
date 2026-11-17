import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/view/tarot-witches-road'); await pg.wait_for_timeout(1500)
        st = pg.locator('.spread-stage').first
        await st.scroll_into_view_if_needed()
        for k in ['night','altar','moon','grove','none']:
            await pg.click(f'.bd-sw-{k}'); await pg.wait_for_timeout(300)
            await pg.locator('.block.frame').filter(has=pg.locator('.spread-stage')).first.screenshot(path=f'shots/bd-{k}.png')
        await pg.click('.bd-sw-night')
        await pg.evaluate("location.hash='#/reading/tarot-witches-road'"); await pg.wait_for_timeout(1800)
        await pg.locator('.block.frame').first.screenshot(path='shots/bd-read.png')
        await pg.evaluate("location.hash='#/reading/tarot-celtic-cross'"); await pg.wait_for_timeout(1800)
        await pg.click('.bd-sw-altar'); await pg.wait_for_timeout(300)
        await pg.locator('.block.frame').first.screenshot(path='shots/bd-cc.png')
        print('overflow:', await pg.evaluate("document.documentElement.scrollWidth"))
        print(errs); await b.close()
asyncio.run(main())
