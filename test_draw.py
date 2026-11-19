# Drawing: review, Draw & reveal, Walk through; card backs; choosing the deck in My Decks
import asyncio, sys
from playwright.async_api import async_playwright
W = int(sys.argv[1]) if len(sys.argv) > 1 else 360
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        ctx = await b.new_context(viewport={'width': W, 'height': 800}, device_scale_factor=2)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        over = lambda: pg.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        await pg.goto('http://localhost:8765/index.html#/tarot'); await pg.wait_for_timeout(1500)
        # ---- Card of the Day, Draw & reveal ----
        await pg.click('a[href="#/reading/tarot-one-card-daily"]'); await pg.wait_for_timeout(700)
        print('ready:', await pg.inner_text('.dhead h1'), '| journal before', await pg.evaluate("Journal.list.length"), '| overflow', await over())
        await pg.screenshot(path=f'shots/d1_{W}.png', full_page=True)
        await pg.fill('#rq', 'What do I need today?'); await pg.click('#dreveal'); await pg.wait_for_timeout(900)
        print('face down:', await pg.evaluate("[...document.querySelectorAll('#fd .layout .card')].map(c=>c.classList.contains('back')+':'+!!c.dataset.card)"), '| hint:', await pg.inner_text('#hint'))
        print('saved with question:', await pg.evaluate("Journal.list[0].question"), '| url', await pg.evaluate("location.hash"))
        await pg.screenshot(path=f'shots/d2_{W}.png', full_page=True)
        await pg.click('#fd .layout .card'); await pg.wait_for_timeout(1600)
        print('after reveal:', await pg.inner_text('.dhead h1'), '| positions', await pg.evaluate("document.querySelectorAll('.positions.reading .pos').length"), '| overflow', await over())
        # reload keeps the same reading
        rid = await pg.evaluate("Journal.list[0].id"); await pg.reload(); await pg.wait_for_timeout(1200)
        print('reload same reading:', await pg.evaluate(f"location.hash.includes('{rid}')"), await pg.inner_text('.dhead h1'))
        await pg.click('#again'); await pg.wait_for_timeout(500); print('draw again ->', await pg.inner_text('.dhead h1'), '| question kept:', await pg.input_value('#rq'))
        # ---- Today's Three, Walk through ----
        await pg.evaluate("location.hash='#/reading/tarot-daily-three'"); await pg.wait_for_timeout(700)
        await pg.click('#dwalk'); await pg.wait_for_timeout(900)
        print('walk hint:', await pg.inner_text('#hint'))
        await pg.click('#fd .layout .card[data-i="1"]'); await pg.wait_for_timeout(700)
        print('after card 2:', await pg.inner_text('#hint'), '| steps', await pg.evaluate("document.querySelectorAll('#walked .walk-step').length"))
        await pg.screenshot(path=f'shots/d3_{W}.png', full_page=True)
        await pg.click('#fd .layout .card[data-i="0"]'); await pg.wait_for_timeout(500)
        await pg.click('#fd .layout .card[data-i="2"]'); await pg.wait_for_timeout(700)
        print('all turned:', await pg.inner_text('#hint'), '| button', await pg.inner_text('#after'), '| overflow', await over())
        await pg.screenshot(path=f'shots/d4_{W}.png', full_page=True)
        # a turned card opens its picture large
        await pg.click('#fd .layout .card[data-i="0"]'); await pg.wait_for_timeout(500)
        print('lightbox open:', await pg.evaluate("!!document.querySelector('.lb, .lightbox')"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('.lb, .lightbox')?.remove()")
        await pg.click('#whole'); await pg.wait_for_timeout(700); print('whole reading:', await pg.inner_text('.dhead h1'))
        # ---- My Decks with a photographed deck and back ----
        await pg.evaluate("""(async()=>{ await Decks.load(); const c=document.createElement('canvas'); c.width=60;c.height=104; const g=c.getContext('2d'); g.fillStyle='#226';g.fillRect(0,0,60,104); g.fillStyle='#e8c';g.fillRect(10,10,40,84);
          Decks.list.push({id:'deck-test',name:'Moonlit Test Deck',creator:'',since:'',notes:'',image:'',cards:[],back:c.toDataURL()}); await Decks.save(); })()""")
        await pg.evaluate("location.hash='#/decks'"); await pg.wait_for_timeout(800)
        print('choices:', await pg.evaluate("[...document.querySelectorAll('.deck-choice b')].map(b=>b.textContent)"), '| overflow', await over())
        await pg.click('.deck-choice:has-text("Moonlit") input'); await pg.wait_for_timeout(700)
        print('active deck:', await pg.evaluate("Store.settings.activeDeck"), '| back now', (await pg.evaluate("cardBack()"))[:22])
        await pg.screenshot(path=f'shots/d5_{W}.png', full_page=True)
        await pg.evaluate("location.hash='#/reading/tarot-daily-three'"); await pg.wait_for_timeout(700)
        print('ready shows deck:', await pg.inner_text('.small.muted.center b'))
        await pg.click('#dreveal'); await pg.wait_for_timeout(800)
        print('uses own back:', await pg.evaluate("[...document.querySelectorAll('#fd .card.back img')].every(i=>i.src.startsWith('data:image/png'))"))
        await pg.evaluate("location.hash='#/decks/deck-test'"); await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'shots/d6_{W}.png', full_page=True); print('deck page overflow', await over())
        await pg.click('#dback'); await pg.wait_for_timeout(400); print('back sheet buttons:', await pg.evaluate("[...document.querySelectorAll('.modal button, .sheet button')].map(b=>b.textContent.trim())"))
        await pg.click('[data-extra]'); await pg.wait_for_timeout(600); print('back removed:', await pg.evaluate("Decks.get('deck-test').back===''"), '| default back again', (await pg.evaluate("cardBack()"))[:22])
        await pg.evaluate("location.hash='#/decks'"); await pg.wait_for_timeout(500)
        await pg.click('.deck-choice:has-text("Rider") input'); await pg.wait_for_timeout(500); print('back to built-in:', repr(await pg.evaluate("Store.settings.activeDeck")))
        print('errors:', errs); await b.close()
asyncio.run(main())
