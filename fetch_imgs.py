import json,re,time,urllib.request,urllib.parse,os,sys,io
from PIL import Image
UA="WitchCompanionApp/1.0 (+https://github.com/PacoGeist/WitchCompanion) python-urllib"
API="https://commons.wikimedia.org/w/api.php?"
def get(url,raw=False):
    for i in range(5):
        try:
            r=urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":UA}),timeout=60).read()
            if b"too many requests" in r[:300].lower(): raise Exception("rate")
            return r if raw else json.loads(r)
        except Exception as e:
            print("  retry",e,file=sys.stderr); time.sleep(10*(i+1))
    return None
def search(q):
    d=get(API+urllib.parse.urlencode({"action":"query","list":"search","srnamespace":6,"srsearch":q,"format":"json","srlimit":10}))
    time.sleep(1.5)
    return [s["title"] for s in (d or {}).get("query",{}).get("search",[]) if re.search(r"\.(jpe?g|png)$",s["title"],re.I)]
herbs=[]
for f in "abc": herbs+=json.load(open(f"data/herbs-{f}.json"))
credits=json.load(open("www/img/herbs/credits.json")) if os.path.exists("www/img/herbs/credits.json") else {}
override={"Rose":"Rosa gallica","Copal":"Bursera","Dragon's Blood":"Dracaena cinnabari","Cedar":"Cedrus libani","Pine":"Pinus sylvestris","Chamomile":"Matricaria chamomilla","Cinnamon":"Cinnamomum verum","High John the Conqueror":"Ipomoea purga","Devil's Shoestring":"Viburnum","Frankincense":"Boswellia sacra","Benzoin":"Styrax benzoin","Jasmine":"Jasminum officinale","Ginseng":"Panax ginseng","Solomon's Seal":"Polygonatum multiflorum","Rosemary":"Rosmarinus officinalis","Wood Betony":"Stachys officinalis","Black Cohosh":"Cimicifuga racemosa","Vetiver":"Vetiveria zizanioides","Lemon Verbena":"Aloysia citrodora","Sweetgrass":"Hierochloe odorata","Bayberry":"Myrica cerifera","Orange Peel":"Citrus sinensis","Blackberry":"Rubus fruticosus","Apple":"Malus domestica"}
for h in herbs:
    hid=h["id"]
    if hid in credits: continue
    latin=override.get(h["name"]) or re.split(r"[;(/]",h["latin"])[0].replace(" spp.","").strip()
    titles=[]
    for q in [f'Köhler Medizinal-Pflanzen "{latin}"', f'Thomé "{latin}"', f'"{latin}" flower', f'"{latin}"']:
        t=search(q)
        if "Köhler" in q: t=[x for x in t if "hler" in x or "Medizinal" in x]
        if "Thomé" in q: t=[x for x in t if "Thom" in x]
        if t: titles=t; break
    if not titles: print("NONE",h["name"]); continue
    d=get(API+urllib.parse.urlencode({"action":"query","titles":titles[0],"prop":"imageinfo","iiprop":"url|extmetadata","iiurlwidth":520,"format":"json"}))
    time.sleep(1.5)
    try:
        ii=list(d["query"]["pages"].values())[0]["imageinfo"][0]
        raw=get(ii["thumburl"],raw=True); time.sleep(1)
        im=Image.open(io.BytesIO(raw)).convert("RGB"); im.thumbnail((520,520))
        im.save(f"www/img/herbs/{hid}.jpg",quality=78,optimize=True)
        m=ii.get("extmetadata",{})
        clean=lambda s:re.sub("<[^>]+>","",s or "").strip()
        credits[hid]={"file":titles[0],"artist":clean(m.get("Artist",{}).get("value")),"license":clean(m.get("LicenseShortName",{}).get("value")),"url":ii.get("descriptionurl")}
        print("OK",h["name"],"->",titles[0])
        json.dump(credits,open("www/img/herbs/credits.json","w"),indent=1,ensure_ascii=False)
    except Exception as e: print("FAIL",h["name"],e)
