import asyncio, math, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/edit/sigil'); await pg.wait_for_timeout(1000)
        print('hexagram tool:', await pg.locator('#tools [data-t=hexagram]').count(), 'arc tool:', await pg.locator('#tools [data-t=arc]').count())
        await pg.click('#tools [data-t=arc]')
        await pg.locator('canvas').scroll_into_view_if_needed(); bx=await pg.locator('canvas').bounding_box()
        cx,cy,W=bx['x']+bx['width']/2,bx['y']+bx['height']/2,bx['width']
        async def arc(c, r, a0, a1, steps=30):
            await pg.mouse.move(c[0],c[1]); await pg.mouse.down()
            await pg.mouse.move(c[0]+r*math.cos(a0), c[1]+r*math.sin(a0), steps=6)
            for k in range(1,steps+1):
                a=a0+(a1-a0)*k/steps; await pg.mouse.move(c[0]+r*math.cos(a), c[1]+r*math.sin(a))
            await pg.mouse.up()
        await arc((cx,cy), W*0.44, math.pi, 2*math.pi)          # top half of outer ring
        await arc((cx,cy), W*0.22, 0.2, math.pi-0.2)            # lower inner arc
        await arc((cx-W*0.2,cy+W*0.25), W*0.1, -math.pi/2, math.pi*1.2)  # free arc, 300°
        d=await pg.evaluate("document.querySelector('canvas').toDataURL()")
        open('shots/arc.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.screenshot(path='shots/arc_tools.png')
        print(errs); await b.close()
asyncio.run(main())
