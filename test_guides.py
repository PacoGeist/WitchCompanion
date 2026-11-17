import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/view/tarot-celtic-cross'); await pg.wait_for_timeout(1500)
        print('spread page guides:', await pg.evaluate("document.querySelectorAll('.positions .pos i').length"))
        await pg.evaluate("location.hash='#/reading/tarot-daily-focus'"); await pg.wait_for_timeout(1200)
        print('reading guides:', await pg.evaluate("[...document.querySelectorAll('.pos-guide')].map(x=>x.textContent.slice(0,50))"))
        await pg.click('.walk-btn'); await pg.wait_for_timeout(500)
        print('walk:', await pg.evaluate("document.querySelector('.walk-guide')?.textContent"))
        await pg.screenshot(path='shots/g2.png')
        await pg.goto('http://localhost:8765/index.html#/view/tarot-daily-focus'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='shots/g3.png', full_page=False)
        print(errs); await b.close()
asyncio.run(main())
