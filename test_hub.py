import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/'); await pg.wait_for_timeout(1500)
        print('home tarot href', await pg.evaluate("[...document.querySelectorAll('.home-grid a')].find(a=>a.querySelector('b').textContent==='Tarot').getAttribute('href')"))
        await pg.evaluate("location.hash='#/tarot/stats'"); await pg.wait_for_timeout(500); await pg.screenshot(path='shots/st0.png')
        # seed readings
        await pg.evaluate("""(async()=>{const names=TAROT_DECK.map(c=>c.name);const sp=Store.get('tarot-daily-three');
          for(let k=0;k<25;k++){const at=Date.now()-k*3*864e5;const cs=sp.positions.map((p,i)=>({n:p.n,pos:p.name,posMeaning:p.meaning,card:i==0&&k%3==0?'XVI · The Tower':names[(k*7+i*13)%78]}));
          Journal.list.push({id:'reading-t'+k,spreadId:sp.id,spreadName:sp.name,at,moon:'Full Moon',question:'',notes:'',results:'',outcome:'',positions:sp.positions,cards:cs,manual:k%2==0,deck:k%2==0?'deck-x':''});}
          Decks.list=[{id:'deck-x',name:'Wild Unknown',creator:'Kim Krans',isDefault:true}];await Decks.save();Journal.list.sort((a,b)=>b.at-a.at);await Journal.persist();})()""")
        await pg.evaluate("location.hash='#/tarot'"); await pg.wait_for_timeout(700); await pg.screenshot(path='shots/hub.png', full_page=True)
        await pg.evaluate("location.hash='#/tarot/stats?p=all&d=all'"); await pg.wait_for_timeout(700); await pg.screenshot(path='shots/st1.png', full_page=True)
        await pg.select_option('#sdeck','deck-x'); await pg.wait_for_timeout(300); print('deck filter facts', await pg.evaluate("document.querySelector('.facts').innerText.replace(/\\n/g,' ')"))
        await pg.evaluate("location.hash='#/card/XVI%20%C2%B7%20The%20Tower'"); await pg.wait_for_timeout(500); print('history:', await pg.evaluate("[...document.querySelectorAll('.block h3')].map(h=>h.textContent).filter(t=>t.includes('History'))"))
        await pg.evaluate("location.hash='#/decks'"); await pg.wait_for_timeout(500); await pg.screenshot(path='shots/decks.png')
        await pg.click('#dadd'); await pg.fill('#dn','Moonchild'); await pg.click('#dsav'); await pg.wait_for_timeout(500)
        print('decks', await pg.evaluate("Decks.list.map(d=>d.name)"))
        await pg.evaluate("location.hash='#/record?s=tarot-daily-three'"); await pg.wait_for_timeout(600); print('deck select default', await pg.evaluate("document.querySelector('#rd').selectedOptions[0].textContent"))
        await pg.evaluate("location.hash='#/mine?t=tarot'"); await pg.wait_for_timeout(400); print('mine title', await pg.evaluate("document.querySelector('#title').textContent"))
        for r in ['#/list/tarot?p=1','#/learn/lessons','#/journal?t=tarot']:
            await pg.evaluate(f"location.hash={json.dumps(r)}"); await pg.wait_for_timeout(300)
        print(errs); await b.close()
asyncio.run(main())
