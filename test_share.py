import asyncio, json
from playwright.async_api import async_playwright
CH='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path=CH)
    ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, accept_downloads=True)
    pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
    # make a user tincture
    await pg.evaluate("""Store.save({id:uid('tincture'),type:'tincture',name:'Moonwater Calm Tincture',description:'A gentle evening drop.',ingredients:[{item:'Lavender, dried',amount:'1 tbsp'}],steps:['Steep','Strain'],metaphysical:['calm'],caution:'Test caution'})""")
    tid = await pg.evaluate("Object.values(Store.user)[0].id")
    await pg.evaluate(f"location.hash='#/view/{tid}'"); await pg.wait_for_timeout(600)
    await pg.screenshot(path='shots/s_detail.png', full_page=True)
    await pg.click('#sendf'); await pg.wait_for_timeout(400); await pg.fill('#sfrom','Patrick'); await pg.fill('#snote','Try this!')
    await pg.wait_for_timeout(600)
    print('link enabled:', await pg.evaluate("!document.querySelector('#slink').disabled"))
    await pg.screenshot(path='shots/s_modal.png')
    # message link -> falls back to copy (desktop chromium has no navigator.share files) ; capture text via clipboard stub
    await pg.evaluate("window.__copied=null; window.copyText=(t)=>{window.__copied=t}")
    await pg.evaluate("navigator.share=undefined")
    await pg.click('#slink'); await pg.wait_for_timeout(700)
    msg = await pg.evaluate("window.__copied"); print('message:', msg[:160], '... len', len(msg))
    link = msg.split('your app: ')[1]
    # file
    await pg.evaluate(f"location.hash='#/view/{tid}'"); await pg.wait_for_timeout(500)
    await pg.click('#sendf'); await pg.wait_for_timeout(300)
    async with pg.expect_download() as dl:
      await pg.click('#sfile')
    fpath = await (await dl.value).path(); d=json.load(open(fpath)); print('file:', d['app'], d['from'], [i['name'] for i in d['items']])
    # friend: open link (web, in-browser) and file
    ctx2 = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2); f2 = await ctx2.new_page(); e2=[]; f2.on('pageerror', lambda e: e2.append(str(e)))
    local = link.replace('https://pacogeist.github.io/WitchCompanion/app/','http://localhost:8765/index.html')
    await f2.goto(local); await f2.wait_for_timeout(1800)
    await f2.screenshot(path='shots/s_landing.png')
    await f2.click('#rhere'); await f2.wait_for_timeout(800)
    await f2.screenshot(path='shots/s_preview.png')
    await f2.click('#radd'); await f2.wait_for_timeout(800)
    print('friend got:', await f2.evaluate("Object.values(Store.user).map(i=>[i.name,i.sharedBy])"), await f2.evaluate("location.hash"))
    await f2.screenshot(path='shots/s_added.png')
    # file import via receive page
    await f2.evaluate("location.hash='#/receive'"); await f2.wait_for_timeout(500)
    async with f2.expect_file_chooser() as fc: await f2.click('#rfile')
    await (await fc.value).set_files(fpath); await f2.wait_for_timeout(800); await f2.click('#radd'); await f2.wait_for_timeout(600)
    print('after file:', await f2.evaluate("Object.values(Store.user).map(i=>i.name)"))
    # paste box
    await f2.evaluate("location.hash='#/receive'"); await f2.wait_for_timeout(400)
    await f2.fill('#rcode', msg); await f2.click('#rgo'); await f2.wait_for_timeout(700)
    print('paste preview:', await f2.evaluate("document.querySelector('.modal h2')?.textContent")); await f2.click('#rcx'); await f2.wait_for_timeout(300)
    # malicious item sanitising
    await f2.evaluate("""receiveFileText(JSON.stringify({app:'witches-companion-share',items:[{type:'sigil',name:'X',svg:'<img src=x onerror=alert(1)>',image:'javascript:alert(1)'},{type:'tarot',name:'Bad',positions:[{n:1,name:'a',x:'1\\"><img src=x onerror=alert(2)>',y:0}]}]}))""")
    await f2.wait_for_timeout(500); await f2.click('#radd'); await f2.wait_for_timeout(500)
    print('sanitised:', await f2.evaluate("Object.values(Store.user).filter(i=>['X','Bad'].includes(i.name)).map(i=>[i.svg, i.image, i.positions && i.positions[0].x])"))
    # print button
    await f2.evaluate("window.__printed=0; window.print=()=>window.__printed++"); await f2.click('#printBtn'); print('printed', await f2.evaluate("window.__printed"))
    await f2.emulate_media(media='print'); await f2.evaluate(f"location.hash='#/view/'+Object.values(Store.user)[0].id"); await f2.wait_for_timeout(500); await f2.screenshot(path='shots/s_print.png', full_page=True)
    await f2.pdf(path='shots/s_print.pdf') if False else None
    print('errs', errs[:3], e2[:3]); await b.close()
asyncio.run(main())
