import asyncio
from playwright.async_api import async_playwright
SEED = """
(async()=>{
 const sp=Store.get('tarot-past-present-future'); const ps=sp.positions;
 const sets=[['Ten of Swords','Five of Cups','XVI · The Tower'],['Three of Swords','Four of Cups','Seven of Wands'],['Five of Pentacles','Six of Swords','XIV · Temperance'],['Eight of Swords','Six of Cups','XIX · The Sun']];
 const day=864e5; let t=Date.now()-30*day;
 for(const s of sets){ t+=7*day; await Journal.add({id:newId('reading'),spreadId:sp.id,spreadName:sp.name,at:t,moon:'Full Moon',manual:true,question:'',notes:'',results:'',outcome:'',
   positions:ps.map(p=>({n:p.n,x:p.x,y:p.y,rotate:0,name:p.name})),
   cards:ps.map((p,i)=>({n:p.n,pos:p.name,posMeaning:p.meaning,card:s[i],arcana:TAROT_BY_NAME[s[i]].arcana,meaning:TAROT_BY_NAME[s[i]].up}))}); }
 Journal.list.sort((a,b)=>b.at-a.at); await Journal.persist(); return Journal.list.length;})()
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1200)
        print('seeded', await pg.evaluate(SEED))
        await pg.evaluate("location.hash='#/trends/tarot-past-present-future'"); await pg.wait_for_timeout(800)
        await pg.screenshot(path='shots/tr1.png', full_page=True)
        rid = await pg.evaluate("Journal.list[0].id")
        await pg.evaluate(f"location.hash='#/journal/{rid}'"); await pg.wait_for_timeout(700)
        await pg.evaluate("document.querySelector('.analysis').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='shots/tr2.png')
        await pg.evaluate("location.hash='#/reading/tarot-witches-road'"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='shots/tr3.png', full_page=True)
        await pg.evaluate("location.hash='#/reading/tarot-daily-three'"); await pg.wait_for_timeout(1200)
        await pg.evaluate("document.querySelector('.analysis').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='shots/tr4.png')
        print(errs); await b.close()
asyncio.run(main())
