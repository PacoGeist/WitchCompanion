import json,re,time,urllib.request,urllib.parse,io,os,sys
from PIL import Image,ImageDraw
UA={"User-Agent":"WitchCompanionApp/1.0 (+https://github.com/PacoGeist/WitchCompanion)"}
D={"cerridwen":["Cerridwen","Ceridwen cauldron"],"brigid":["Brigid goddess","Saint Brigid"],"the-morrigan":["Morrigan","Morrigan crow goddess"],
"cernunnos":["Cernunnos","Gundestrup cauldron"],"rhiannon":["Rhiannon","Rhiannon horse"],"arianrhod":["Arianrhod","Arianrhod goddess"],
"lugh":["Lugh","Lugh god"],"danu":["Danu goddess","Tuatha De Danann"],"hecate":["Hecate","Hekate"],"persephone":["Persephone","Proserpina"],
"demeter":["Demeter","Ceres goddess"],"artemis":["Artemis","Diana huntress"],"aphrodite":["Aphrodite","Venus goddess"],"hermes":["Hermes","Mercury god"],
"selene":["Selene","Selene Endymion"],"pan":["Pan god","satyr Pan"],"diana":["Diana goddess","Diana of Versailles"],"isis":["Isis goddess","Isis Egyptian"],
"bastet":["Bastet","Egyptian cat goddess"],"thoth":["Thoth","Thoth ibis"],"anubis":["Anubis","Anubis jackal"],"freyja":["Freyja","Freya goddess"],
"odin":["Odin","Odin Wotan"],"frigg":["Frigg","Frigga"],"hel":["Hel goddess","Hel Norse"],"inanna":["Inanna","Ishtar"]}
def get(u,raw=False):
    for i in range(3):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40).read()
            return r if raw else json.loads(r)
        except Exception as e: print(" retry",u[:70],e,file=sys.stderr); time.sleep(5*(i+1))
os.makedirs("cand/deity",exist_ok=True)
out={}
for k,qs in D.items():
    cands=[]
    def add(raw,meta):
        try: im=Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception: return
        if min(im.size)<150: return
        im.thumbnail((900,900)); p=f"cand/deity/{k}-{len(cands)}.jpg"; im.save(p,quality=85); meta["path"]=p; cands.append(meta)
    # Cleveland Museum of Art (CC0)
    for q in qs[:2]:
        d=get("https://openaccess-api.clevelandart.org/api/artworks/?"+urllib.parse.urlencode({"q":q,"has_image":1,"cc0":1,"limit":4}))
        for a in (d or {}).get("data",[])[:3]:
            u=((a.get("images") or {}).get("web") or {}).get("url")
            if not u or len(cands)>=4: continue
            raw=get(u,raw=True)
            if raw: add(raw,{"src":"cma","title":a.get("title"),"creator":(a.get("creators") or [{}])[0].get("description","") if a.get("creators") else "","license":"cc0","landing":a.get("url")})
        time.sleep(1)
    # Openverse / Flickr (CC)
    for q in qs:
        if len(cands)>=8: break
        d=get("https://api.openverse.org/v1/images/?"+urllib.parse.urlencode({"q":q,"page_size":12,"source":"flickr","mature":"false"}))
        time.sleep(1.5)
        for r in (d or {}).get("results",[]):
            if len(cands)>=8: break
            u=r.get("url") or ""
            if "staticflickr" not in u: continue
            u=re.sub(r"_[a-z]\.jpg$","_z.jpg",u)
            try: raw=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30).read()
            except Exception: continue
            add(raw,{"src":"openverse","title":r.get("title"),"creator":r.get("creator"),"license":r.get("license"),"license_version":r.get("license_version"),"landing":r.get("foreign_landing_url")})
    out[k]=cands; print(k,len(cands),flush=True)
    json.dump(out,open("cand/deity/cands.json","w"),indent=1)
ids=list(out)
for s in range(0,len(ids),6):
    sheet=Image.new("RGB",(8*150+110,6*170),"white"); dr=ImageDraw.Draw(sheet)
    for row,k in enumerate(ids[s:s+6]):
        dr.text((4,row*170+70),k,fill="black")
        for j,cd in enumerate(out[k]):
            im=Image.open(cd["path"]); im.thumbnail((146,166)); sheet.paste(im,(110+j*150,row*170)); dr.text((110+j*150+4,row*170+4),str(j)+("c" if cd["src"]=="cma" else ""),fill="red")
    sheet.save(f"cand/deity/sheet{s//6}.jpg",quality=82)
print("done")
