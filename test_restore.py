import asyncio, json
from playwright.async_api import async_playwright
CH='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path=CH)
    # "old app": make data and export a backup
    c1 = await b.new_context(accept_downloads=True); a = await c1.new_page(); e=[]; a.on('pageerror', lambda x: e.append(str(x)))
    await a.goto('http://localhost:8765/index.html#/reading/tarot-daily-three'); await a.wait_for_timeout(1500)
    await a.evaluate("""Store.save({id:uid('spell'),type:'spell',name:'My Test Spell',description:'x'})""")
    await a.evaluate("Store.toggleFav('herb-lavender')")
    await a.evaluate("Decks.load().then(async()=>{Decks.list.push({id:'deck-old',name:'Old Deck',cards:[0]});await Decks.save();await DB.set('deckimg:deck-old:0','data:image/jpeg;base64,AAAA');await Store.setSetting('activeDeck','deck-old');await Store.setSetting('tabbar',['spell','tarot','moon'])})")
    await a.evaluate("location.hash='#/settings'"); await a.wait_for_timeout(700)
    async with a.expect_download() as dl: await a.click('#exp')
    f = await (await dl.value).path()
    # "new app": empty; open the backup file as if tapped from Downloads
    c2 = await b.new_context(); n = await c2.new_page(); n.on('pageerror', lambda x: e.append(str(x)))
    await n.goto('http://localhost:8765/index.html'); await n.wait_for_timeout(1500)
    txt = open(f).read()
    await n.evaluate("t => { setTimeout(() => receiveFileText(t), 0); }", txt); await n.wait_for_timeout(800)
    print('confirm:', (await n.evaluate("document.querySelector('.modal p')?.textContent"))[:120])
    await n.click('[data-yes]'); await n.wait_for_timeout(1200)
    print('restored:', await n.evaluate("[Object.values(Store.user).map(i=>i.name), Journal.list.length, [...Store.favs], Decks.list.map(d=>d.name), TAROT_DECK[0].img.slice(0,15), [...document.querySelectorAll('.tabbar a')].map(a=>a.textContent.trim())]"))
    print('errs', e); await b.close()
asyncio.run(main())
