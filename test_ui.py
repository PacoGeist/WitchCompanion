import sys, asyncio
from playwright.async_api import async_playwright
ROUTES = sys.argv[1:] or ['', 'list/spell', 'view/herb-lavender', 'view/oil-four-thieves-oil', 'moon', 'tables/meta', 'search?q=protection', 'view/tarot-celtic-cross', 'reading/tarot-celtic-cross', 'edit/sigil', 'list/crystal', 'view/crystal-amethyst', 'edit/spell', 'view/sigil-algiz', 'settings', 'tables/med', 'phase/Full%20Moon', 'edit/tarot']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs = []
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html')
        await pg.wait_for_timeout(1200)
        for r in ROUTES:
            await pg.evaluate(f"location.hash='#/{r}'")
            await pg.wait_for_timeout(700)
            name = (r or 'home').replace('/', '_').replace('?', '_').replace('%20', '_')
            await pg.screenshot(path=f'shots/{name}.png', full_page=False)
            print(r, 'errors so far:', len(errs))
        for e in errs: print('ERR', e)
        await b.close()
asyncio.run(main())
