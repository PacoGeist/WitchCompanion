import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
        for r in ['view/herb-comfrey','view/brew-fire-cider','view/crystal-malachite','view/oil-eo-eucalyptus','citations','settings']:
            await pg.evaluate(f"location.hash='#/{r}'"); await pg.wait_for_timeout(700)
            if r=='citations': await pg.evaluate("document.querySelector('.cite').open=true")
            w=await pg.evaluate("document.documentElement.scrollWidth")
            print(r,'width',w, await pg.evaluate("(document.querySelector('.toxic-banner')||{}).textContent||''"))
            await pg.screenshot(path='shots/s_'+r.replace('/','_')+'.png', full_page=True)
        await pg.evaluate("location.hash='#/view/herb-comfrey'"); await pg.wait_for_timeout(500)
        el=await pg.query_selector('.safety'); await el.screenshot(path='shots/s_safety.png')
        print('errs',errs[:3]); await b.close()
asyncio.run(main())
