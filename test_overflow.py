import asyncio, json, sys
from playwright.async_api import async_playwright
W = int(sys.argv[1]) if len(sys.argv) > 1 else 360
CHECK = """(W)=>{const out=[];const vw=document.documentElement.clientWidth;
 const scrollAnc=el=>{for(let p=el.parentElement;p;p=p.parentElement){const s=getComputedStyle(p);if(/(auto|scroll|hidden)/.test(s.overflowX)&&p.scrollWidth>p.clientWidth+1&&p!==document.body&&p!==document.documentElement)return true;}return false};
 for(const el of document.querySelectorAll('#view *, .modal *')){const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
  if(r.right>vw+1||r.left<-1){if(scrollAnc(el))continue;out.push((el.className&&typeof el.className==='string'?el.tagName+'.'+el.className.split(' ')[0]:el.tagName)+' r='+Math.round(r.right)+' '+(el.textContent||'').trim().slice(0,40));}}
 return {sw:document.documentElement.scrollWidth,vw,bad:out.slice(0,6),n:out.length}}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
        pg = await b.new_page(viewport={'width': W, 'height': 800})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#/'); await pg.wait_for_timeout(1500); await pg.evaluate("Decks.load().then(()=>{if(!Decks.get('deck-t1')){Decks.list.push({id:'deck-t1',name:'A Very Long Deck Name For Testing Wrapping Here',creator:'Somebody Publisher',cards:[]});return Decks.save()}})")
        ids = await pg.evaluate("Store.all().map(i=>i.id)")
        routes = ['#/','#/tarot','#/tarot/stats','#/decks','#/list/tarot','#/list/herb','#/list/crystal','#/list/spell','#/list/brew','#/deck','#/learn','#/learn/lessons','#/learn/lesson/0','#/learn/symbols','#/learn/flash','#/record?s=tarot-celtic-cross','#/journal','#/moon','#/moon/reminders','#/reading/tarot-daily-three','#/decks','#/deck?d=thoth','#/deck?d=marseille','#/card/VIII%20%C2%B7%20Strength?d=thoth','#/card/Ten%20of%20Pentacles?d=marseille','#/phase/Full%20Moon','#/favorites','#/mine','#/more','#/settings','#/credits','#/citations','#/settings/home','#/share','#/receive','#/receive/zAAAAAAAAAAA','#/decks','#/decks/deck-t1','#/candles','#/candles/basics','#/candles/spells','#/candles/spells?more=1','#/candles/dressings','#/candles/colors','#/candles/basics/candle-colors','#/candles/dressing/dressing-money-drawing','#/search?q=love','#/tables/meta','#/tables/med','#/craft','#/craft/grounding','#/craft/spell-casting','#/card/XVI%20%C2%B7%20The%20Tower','#/edit/spell','#/edit/herb','#/edit/tarot','#/edit/sigil','#/trends/tarot-daily-three']
        routes += ['#/view/'+i for i in ids] + ['#/edit/'+i for i in ids[::25]] + ['#/reading/tarot-celtic-cross','#/reading/tarot-year-ahead','#/reading/tarot-jack-o-lantern-carved-face']
        bad = {}
        for r in routes:
            await pg.evaluate(f"location.hash={json.dumps(r)}"); await pg.wait_for_timeout(40)
            res = await pg.evaluate(CHECK, W)
            if res['n'] or res['sw'] > res['vw']: bad[r] = res
        print(W, 'pages checked', len(routes), 'with overflow', len(bad))
        # summarise by element type
        from collections import Counter
        c = Counter(x.split(' r=')[0] for v in bad.values() for x in v['bad'])
        print(c.most_common(20))
        for k in list(bad)[:12]: print(k, bad[k]['sw'], bad[k]['bad'][:3])
        print(errs[:3]); await b.close()
asyncio.run(main())
