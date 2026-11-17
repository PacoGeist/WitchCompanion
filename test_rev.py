import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/reading/tarot-celtic-cross'); await pg.wait_for_timeout(1000)
        revs=0
        for i in range(30):
            revs += await pg.locator('.reading .rev, .card.rev').count()
            await pg.click('#again'); await pg.wait_for_timeout(50)
        print('reversed seen in 30 draws:', revs, 'upright meanings shown:', await pg.locator('.reading .pos').count())
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(400)
        print('reversal toggle present:', await pg.locator('text=Tarot reversals').count())
        print(errs); await b.close()
asyncio.run(main())
