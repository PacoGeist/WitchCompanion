import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
    pg = await b.new_page(viewport={'width':320,'height':740}, device_scale_factor=2); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
    tabs = lambda: pg.evaluate("[...document.querySelectorAll('.tabbar a')].map(a=>a.textContent.trim()+(a.classList.contains('on')?'*':''))")
    print('default', await tabs())
    await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(500)
    print('settings has button:', await pg.evaluate("!!document.querySelector('a[href=\"#/settings/home\"]')"), 'old list gone:', await pg.evaluate("!document.querySelector('#tord')"))
    await pg.click('a[href="#/settings/home"]'); await pg.wait_for_timeout(500)
    await pg.screenshot(path='shots/t_page.png', full_page=True)
    await pg.select_option('select[data-slot="0"]', 'spell'); await pg.wait_for_timeout(300)
    await pg.select_option('select[data-slot="1"]', 'tarot'); await pg.wait_for_timeout(300)
    await pg.select_option('select[data-slot="2"]', 'tincture'); await pg.wait_for_timeout(300)
    print('custom', await tabs())
    await pg.click('.tabbar a[data-tab=tarot]'); await pg.wait_for_timeout(500); print('on tarot', await tabs(), await pg.evaluate('location.hash'))
    await pg.click('.tabbar a[data-tab=tincture]'); await pg.wait_for_timeout(500); print('on tincture', await tabs())
    # reorder still works
    await pg.evaluate("location.hash='#/settings/home'"); await pg.wait_for_timeout(400)
    await pg.click('#tord [data-k=moon] [data-a=top]'); await pg.wait_for_timeout(300)
    print('order', await pg.evaluate("homeTileOrder().slice(0,3)"))
    await pg.reload(); await pg.wait_for_timeout(1500); print('after reload', await tabs())
    await pg.screenshot(path='shots/t_home.png')
    await pg.evaluate("location.hash='#/settings/home'"); await pg.wait_for_timeout(400); await pg.click('#tbreset'); await pg.wait_for_timeout(400); print('reset', await tabs())
    print('errs', errs); await b.close()
asyncio.run(main())
