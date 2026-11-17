import asyncio,json,sys
from playwright.async_api import async_playwright
ids=[s['id'] for s in json.load(open(sys.argv[1]))]
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'); pg=await b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
    un=set()
    for i in ids:
      await pg.evaluate(f"location.hash='#/view/{i}'"); await pg.wait_for_timeout(60)
      r=await pg.evaluate("[...document.querySelectorAll('.ingredients li')].filter(li=>!li.querySelector('a')).map(li=>li.firstElementChild.textContent)")
      un.update(r)
    print('\n'.join(sorted(un))); print('errs',errs[:2])
    await b.close()
asyncio.run(m())
