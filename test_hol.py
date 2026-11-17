import asyncio, json
from playwright.async_api import async_playwright
IDS = json.load(open('/tmp/ids.json'))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 2200}, device_scale_factor=1)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/'); await pg.wait_for_timeout(1200)
        for i,sid in enumerate(IDS):
            await pg.evaluate(f"location.hash='#/view/{sid}'"); await pg.wait_for_timeout(500)
            await pg.locator('.spread-stage').first.screenshot(path=f'shots/h-{i:02d}.png')
        print(errs); await b.close()
asyncio.run(main())
