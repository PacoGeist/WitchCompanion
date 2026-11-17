import asyncio
from playwright.async_api import async_playwright
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'); pg=await b.new_page(viewport={'width':360,'height':800},device_scale_factor=2); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
    print('home tiles', await pg.evaluate("[...document.querySelectorAll('.tile b')].map(b=>b.textContent).join(', ')"))
    for r in ['candles','candles/basics','candles/spells','candles/spells?more=1','candles/dressings','candles/colors']:
      await pg.evaluate(f"location.hash='#/{r}'"); await pg.wait_for_timeout(500)
      print(r, await pg.evaluate("document.querySelectorAll('#view .row').length"), await pg.evaluate("document.documentElement.scrollWidth"))
      await pg.screenshot(path='shots/c_'+r.replace('/','_').replace('?','_')+'.png', full_page=True)
    ids=await pg.evaluate("CANDLE_LESSONS.map(l=>l.id)")
    for i in ids:
      await pg.evaluate(f"location.hash='#/candles/basics/{i}'"); await pg.wait_for_timeout(120)
      assert await pg.evaluate("!!document.querySelector('.dhead h1')"), i
    await pg.screenshot(path='shots/c_lesson.png', full_page=True)
    ds=await pg.evaluate("CANDLE_DRESSINGS.map(l=>l.id)")
    un=set()
    for i in ds:
      await pg.evaluate(f"location.hash='#/candles/dressing/{i}'"); await pg.wait_for_timeout(100)
      un.update(await pg.evaluate("[...document.querySelectorAll('.ingredients li')].filter(li=>!li.querySelector('a')).map(li=>li.firstElementChild.textContent)"))
    await pg.screenshot(path='shots/c_dressing.png', full_page=True)
    print('unlinked in dressings:', sorted(un))
    await pg.evaluate("location.hash='#/view/'+Store.all('spell').find(s=>s.category==='candle').id"); await pg.wait_for_timeout(400)
    await pg.screenshot(path='shots/c_spell.png', full_page=True)
    print('errs', errs[:3]); await b.close()
asyncio.run(m())
