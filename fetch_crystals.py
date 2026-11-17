import json,re,time,urllib.request,urllib.parse,io,os,sys
from PIL import Image,ImageDraw
cr=json.load(open("data/crystals.json"))
Q={"Hag Stone":"hagstone holey stone","Pearl":"pearl gem","Jet":"jet gemstone whitby","Lodestone":"lodestone magnetite","Opal":"opal gemstone","Amber":"amber gemstone","Staurolite":"staurolite crystal","Jade":"jade nephrite stone","Ruby":"ruby mineral","Emerald":"emerald mineral","Sapphire":"sapphire mineral","Obsidian":"black obsidian","Apache Tear":"apache tears obsidian","Herkimer Diamond":"herkimer diamond quartz","Garnet":"garnet mineral","Pyrite":"pyrite cubes","Moonstone":"moonstone","Selenite":"selenite crystal","Shungite":"shungite","Clear Quartz":"quartz crystal cluster","Blue Kyanite":"kyanite blue","Orange Calcite":"orange calcite","Tiger's Eye":"tiger eye stone"}
os.makedirs("cand",exist_ok=True)
out=json.load(open("cand/cands.json")) if os.path.exists("cand/cands.json") else {}
def get(u,raw=False):
    for i in range(4):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"WitchCompanionApp/1.0 (+https://github.com/PacoGeist/WitchCompanion)"}),timeout=60).read()
            return r if raw else json.loads(r)
        except Exception as e: print(" retry",e,file=sys.stderr); time.sleep(6*(i+1))
for c in cr:
    if out.get(c["id"]): continue
    q=Q.get(c["name"],c["name"]+" mineral")
    d=get("https://api.openverse.org/v1/images/?"+urllib.parse.urlencode({"q":q,"page_size":12,"source":"flickr","mature":"false"}))
    time.sleep(1.5)
    cands=[]
    for r in (d or {}).get("results",[])[:12]:
        if len(cands)>=4: break
        u=r.get("url") or ""
        if "staticflickr" not in u: continue
        u=re.sub(r"_[a-z]\.jpg$","_z.jpg",u) if re.search(r"_[a-z]\.jpg$",u) else u
        try: raw=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"GrimoireApp/1.0"}),timeout=30).read()
        except Exception as e:
            print(" skip",e,file=sys.stderr); continue
        if not raw: continue
        try: im=Image.open(io.BytesIO(raw)).convert("RGB")
        except: continue
        if min(im.size)<120: continue
        p=f"cand/{c['id']}-{len(cands)}.jpg"; im.save(p)
        cands.append({"path":p,"title":r.get("title"),"creator":r.get("creator"),"license":r.get("license"),"license_version":r.get("license_version"),"landing":r.get("foreign_landing_url"),"url":r.get("url"),"id":r["id"]})
    out[c["id"]]=cands; print(c["name"],len(cands),flush=True)
    json.dump(out,open("cand/cands.json","w"),indent=1)
# contact sheets, 8 crystals per sheet
ids=list(out)
for s in range(0,len(ids),8):
    sheet=Image.new("RGB",(4*200+150,8*160),"white"); dr=ImageDraw.Draw(sheet)
    for row,cid in enumerate(ids[s:s+8]):
        dr.text((4,row*160+70),cid.replace("crystal-","")[:22],fill="black")
        for j,cd in enumerate(out[cid]):
            im=Image.open(cd["path"]); im.thumbnail((195,155)); sheet.paste(im,(150+j*200,row*160))
            dr.text((150+j*200+4,row*160+4),str(j),fill="red")
    sheet.save(f"cand/sheet{s//8}.jpg",quality=80)
