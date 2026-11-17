import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/'); await pg.wait_for_timeout(1500)
        await pg.locator('.craft-banner').scroll_into_view_if_needed(); await pg.screenshot(path='shots/c0.png')
        await pg.evaluate("location.hash='#/craft'"); await pg.wait_for_timeout(600); await pg.screenshot(path='shots/c1.png')
        await pg.evaluate("location.hash='#/craft/grounding'"); await pg.wait_for_timeout(600); await pg.screenshot(path='shots/c2.png', full_page=True)
        await pg.click('.quiz-o >> nth=0'); await pg.click('#done'); await pg.fill('#cn','test note'); await pg.wait_for_timeout(800)
        await pg.click('#guide'); await pg.wait_for_timeout(400); await pg.screenshot(path='shots/c3.png')
        await pg.click('.modal', position={'x':5,'y':5}); await pg.wait_for_timeout(300)
        await pg.click('#logp'); await pg.wait_for_timeout(300); await pg.fill('#lw-notes','felt calm'); await pg.click('#lw-s'); await pg.wait_for_timeout(800)
        print('practised:', await pg.evaluate("document.querySelector('.craft-practice').innerText.slice(-80)"))
        await pg.evaluate("location.hash='#/journal'"); await pg.wait_for_timeout(800)
        print('journal tabs:', await pg.evaluate("[...document.querySelectorAll('#jt .chip')].map(x=>x.textContent)"))
        w = await pg.evaluate("Workings.list[0].id"); await pg.evaluate(f"location.hash='#/journal/{w}'"); await pg.wait_for_timeout(600)
        print('entry:', await pg.evaluate("document.querySelector('#view').innerText.slice(0,200)"))
        await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(800)
        print('home:', await pg.evaluate("document.querySelector('.hero h1').textContent"), await pg.evaluate("document.querySelector('.craft-banner').innerText"))
        for l in await pg.evaluate("WITCH_LESSONS.map(l=>l.id)"):
            await pg.evaluate(f"location.hash='#/craft/{l}'"); await pg.wait_for_timeout(250)
        print(errs); await b.close()
asyncio.run(main())
