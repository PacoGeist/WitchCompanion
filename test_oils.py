import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/list/oil'); await pg.wait_for_timeout(1500)
        print('formula count', await pg.evaluate("document.querySelector('#cnt').textContent"))
        await pg.click('[data-o=essential]'); await pg.wait_for_timeout(500); print('eo count', await pg.evaluate("document.querySelector('#cnt').textContent"))
        await pg.screenshot(path='shots/o1.png')
        await pg.click('[data-o=carrier]'); await pg.wait_for_timeout(500); print('carrier count', await pg.evaluate("document.querySelector('#cnt').textContent"))
        await pg.evaluate("location.hash='#/view/oil-eo-lavender'"); await pg.wait_for_timeout(600); await pg.screenshot(path='shots/o2.png', full_page=True)
        print('used in', await pg.evaluate("[...document.querySelectorAll('.block h3')].map(h=>h.textContent).filter(t=>/Used in/.test(t))"))
        await pg.evaluate("location.hash='#/view/oil-carrier-olive'"); await pg.wait_for_timeout(500); print('olive used', await pg.evaluate("[...document.querySelectorAll('.block h3')].map(h=>h.textContent).filter(t=>/Used in/.test(t))"))
        await pg.evaluate("location.hash='#/view/oil-protection'"); await pg.wait_for_timeout(500)
        print('formula links', await pg.evaluate("[...document.querySelectorAll('.ingredients a.linked')].map(a=>a.textContent+'→'+a.getAttribute('href').slice(7)).join(' | ')"))
        for s in ['eo','carrier','tincture','brew','incense','oil']:
            for k in ['meta','med']:
                await pg.evaluate(f"location.hash='#/tables/{k}?s={s}'"); await pg.wait_for_timeout(300)
                print(k, s, await pg.evaluate("document.querySelectorAll('.ktable tbody tr').length"), await pg.evaluate("document.querySelector('#src').value"))
        await pg.evaluate("location.hash='#/tables/meta?s=eo'"); await pg.wait_for_timeout(400); await pg.screenshot(path='shots/o3.png')
        await pg.evaluate("location.hash='#/edit/oil?kind=essential'"); await pg.wait_for_timeout(400); print('edit title', await pg.evaluate("document.querySelector('#title').textContent"))
        await pg.evaluate("location.hash='#/list/tincture'"); await pg.wait_for_timeout(400); print('tincture table btns', await pg.evaluate("[...document.querySelectorAll('.actions a')].map(a=>a.textContent).join(',')"))
        print(errs[:4]); await b.close()
asyncio.run(main())
