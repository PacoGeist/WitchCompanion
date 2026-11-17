import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        ctx = await b.new_context(viewport={'width': 400, 'height': 860}, accept_downloads=True); pg = await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/reading/tarot-daily-three'); await pg.wait_for_timeout(1500)
        await pg.evaluate("Decks.load().then(async()=>{Decks.list.push({id:'deck-bk',name:'Bk',cards:[3]});await Decks.save();await DB.set('deckimg:deck-bk:3','data:image/jpeg;base64,AAAA')})")
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(800)
        async with pg.expect_download() as dl:
            await pg.click('#exp')
        d = json.load(open(await (await dl.value).path()))
        print('readings in backup:', len(d['readings']), 'craft' in d, 'deck images:', list(d.get('deckImages', {})))
        print(errs); await b.close()
asyncio.run(main())
