import json,re,time,urllib.request,urllib.parse,os,io,sys
from PIL import Image
herbs=[]
for f in "abcde": herbs+=json.load(open(f"data/herbs-{f}.json"))
override={"Fern":"Dryopteris filix-mas","Rush":"Juncus effusus","Shiitake Mushroom":"Lentinula edodes","Rose":"Rosa gallica","Copal":"Bursera","Dragon's Blood":"Dracaena cinnabari","Cedar":"Cedrus libani","Pine":"Pinus sylvestris","Chamomile":"Matricaria chamomilla","Cinnamon":"Cinnamomum verum","High John the Conqueror":"Ipomoea purga","Devil's Shoestring":"Viburnum lantanoides","Frankincense":"Boswellia sacra","Benzoin":"Styrax benzoin","Jasmine":"Jasminum officinale","Ginseng":"Panax ginseng","Solomon's Seal":"Polygonatum multiflorum","Rosemary":"Salvia rosmarinus","Wood Betony":"Betonica officinalis","Black Cohosh":"Actaea racemosa","Vetiver":"Chrysopogon zizanioides","Lemon Verbena":"Aloysia citrodora","Sweetgrass":"Anthoxanthum nitens","Bayberry":"Morella cerifera","Orange Peel":"Citrus sinensis","Blackberry":"Rubus fruticosus","Apple":"Malus domestica","Blue Lotus":"Nymphaea caerulea","Cayenne":"Capsicum annuum","Holy Basil":"Ocimum tenuiflorum","Mexican Marigold":"Tagetes erecta","Orris Root":"Iris germanica","Poppy":"Papaver somniferum","Witch Hazel":"Hamamelis virginiana","Yew":"Taxus baccata","Tobacco":"Nicotiana tabacum","Bee Balm":"Monarda didyma","Linden":"Tilia cordata","Magnolia":"Magnolia grandiflora","Lilac":"Syringa vulgaris","Sunflower":"Helianthus annuus","Yerba Santa":"Eriodictyon californicum","Self-Heal":"Prunella vulgaris","Horsetail":"Equisetum arvense","Galangal":"Alpinia galanga","Anise":"Pimpinella anisum"}
cpath="www/img/herbs/credits.json"
credits=json.load(open(cpath)) if os.path.exists(cpath) else {}
def get(u,raw=False):
    for i in range(4):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"PacoWitchesCompanion/3.4 (offline grimoire app)"}),timeout=60).read()
            return r if raw else json.loads(r)
        except Exception as e:
            print(" retry",u[:80],e,file=sys.stderr); time.sleep(5*(i+1))
for h in herbs:
    hid=h["id"]
    if hid in credits: continue
    latin=override.get(h["name"]) or re.split(r"[;(/]",h["latin"])[0].replace(" spp.","").strip()
    d=get("https://api.inaturalist.org/v1/taxa?"+urllib.parse.urlencode({"q":latin,"per_page":5,"is_active":"true"}))
    time.sleep(1.1)
    res=[r for r in (d or {}).get("results",[]) if r.get("default_photo")]
    exact=[r for r in res if r["name"].lower()==latin.lower()]
    r=(exact or res or [None])[0]
    if not r: print("NONE",h["name"],latin,flush=True); continue
    p=r["default_photo"]
    url=p["url"].replace("/square.","/medium.")
    raw=get(url,raw=True); time.sleep(0.5)
    if not raw: print("FAIL",h["name"],flush=True); continue
    im=Image.open(io.BytesIO(raw)).convert("RGB"); im.thumbnail((560,560))
    im.save(f"www/img/herbs/{hid}.jpg",quality=80,optimize=True)
    credits[hid]={"taxon":r["name"],"attribution":p.get("attribution",""),"license":p.get("license_code",""),"url":f"https://www.inaturalist.org/taxa/{r['id']}"}
    json.dump(credits,open(cpath,"w"),indent=1,ensure_ascii=False)
    print("OK",h["name"],"->",r["name"],p.get("license_code"),flush=True)
