import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
        ids = await pg.evaluate("Store.all().map(i=>i.id)")
        bad=[]
        for i in ids:
            n=len(errs)
            await pg.evaluate(f"location.hash='#/view/{i}'"); await pg.wait_for_timeout(25)
            ok = await pg.evaluate("!!document.querySelector('.dhead h1')")
            if not ok or len(errs)>n: bad.append(i)
        print('items', len(ids), 'bad', bad[:10], errs[:3])
        for r in ['list/sigil','view/sigil-thurisaz','view/sigil-helm-of-awe','list/tarot','view/tarot-wheel-of-the-year','view/herb-mexican-marigold','list/crystal','view/crystal-moldavite','tables/meta']:
            await pg.evaluate(f"location.hash='#/{r}'"); await pg.wait_for_timeout(600)
            await pg.screenshot(path='shots/x_'+r.replace('/','_')+'.png')
        print(await pg.evaluate("Store.all('sigil').filter(s=>s.id.includes('helm')||s.id.includes('thur')).map(s=>s.id)"), await pg.evaluate("Store.all('tarot').filter(s=>s.name.includes('Wheel')).map(s=>s.id)"))
        await b.close()
asyncio.run(main())
