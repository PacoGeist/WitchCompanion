import asyncio
from playwright.async_api import async_playwright
async def drag(pg,box,a,b):
    await pg.locator("canvas").scroll_into_view_if_needed(); box=await pg.locator("canvas").bounding_box()
    X=lambda f:box['x']+box['width']*f; Y=lambda f:box['y']+box['height']*f
    await pg.mouse.move(X(a[0]),Y(a[1])); await pg.mouse.down()
    await pg.mouse.move(X(b[0]),Y(b[1]),steps=8); await pg.mouse.up()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/edit/sigil'); await pg.wait_for_timeout(1000)
        await pg.fill('[data-field=name] input','Shape test')
        box = await pg.locator('canvas').bounding_box()
        async def tool(t): await pg.click(f'#tools [data-t={t}]')
        await tool('circle'); await drag(pg,box,(.51,.49),(.5,.07))   # snaps to centre + outer ring
        await tool('pentagram'); await drag(pg,box,(.5,.5),(.5,.1))
        await tool('circle'); await drag(pg,box,(.5,.5),(.5,.28))
        await tool('triplemoon'); await drag(pg,box,(.5,.5),(.5,.42))
        await tool('line'); await drag(pg,box,(.1,.9),(.9,.88))
        await pg.click('[data-a=fill]'); await tool('star'); await drag(pg,box,(.15,.4),(.15,.32))
        await tool('heart'); await drag(pg,box,(.85,.4),(.85,.32))
        await tool('crescent'); await drag(pg,box,(.12,.75),(.12,.67))
        await pg.click('[data-a=fill]')
        await tool('spiral'); await drag(pg,box,(.88,.75),(.88,.67))
        import base64
        d=await pg.evaluate("document.querySelector('canvas').toDataURL()")
        open('shots/canvas.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.evaluate("document.querySelector('.canvas-wrap').scrollIntoView()")
        await pg.screenshot(path='shots/sh1.png')
        await pg.evaluate("window.scrollBy(0,330)"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='shots/sh2.png')
        await pg.click('#ef button[type=submit]'); await pg.wait_for_timeout(800)
        await pg.screenshot(path='shots/sh3.png')
        print(errs); await b.close()
asyncio.run(main())
