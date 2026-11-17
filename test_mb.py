import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        await pg.goto('http://localhost:8765/index.html#/moon'); await pg.wait_for_timeout(1500)
        await pg.evaluate("""document.querySelector('#view').innerHTML='<div style=\"display:flex;flex-wrap:wrap;gap:6px;padding:8px\">'+[0.5,0.3,0.15,0.75].map(f=>MOON.photo(f,170)).join('')+'</div>'""")
        await pg.wait_for_timeout(600); await pg.screenshot(path='shots/mb.png'); await b.close()
asyncio.run(main())
