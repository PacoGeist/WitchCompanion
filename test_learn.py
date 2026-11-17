import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1200)
        await pg.evaluate("document.querySelector('.home-grid').lastElementChild.scrollIntoView({block:'end'})"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='shots/l0.png')
        for r in ['learn','learn/lesson/4','learn/symbols','learn/flash']:
            await pg.evaluate(f"location.hash='#/{r}'"); await pg.wait_for_timeout(800)
            await pg.screenshot(path='shots/l_'+r.replace('/','_')+'.png')
        await pg.click('#fr'); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/l_flash2.png')
        await pg.evaluate("location.hash='#/card/'+encodeURIComponent('Two of Wands')"); await pg.wait_for_timeout(700)
        await pg.evaluate("document.querySelector('.sym-row').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='shots/l_card.png')
        print('learn cards:', await pg.evaluate("1"))
        await pg.evaluate("location.hash='#/learn'"); await pg.wait_for_timeout(500)
        print('tiles on learn:', await pg.locator('.deck-grid .deck-card').count())
        print(errs); await b.close()
asyncio.run(main())
