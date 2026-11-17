import json,re,time,urllib.request,urllib.parse,io,os,sys
from PIL import Image,ImageDraw
Q={"crystal-aragonite": "Aragonite crystal", "crystal-apophyllite": "Apophyllite crystal", "crystal-chrysoprase": "Chrysoprase crystal", "crystal-dalmatian-jasper": "dalmatian jasper", "crystal-desert-rose": "desert rose selenite", "crystal-goldstone": "goldstone glass", "crystal-iolite": "Iolite crystal", "crystal-lemurian-quartz": "lemurian quartz", "crystal-ocean-jasper": "ocean jasper", "crystal-rutilated-quartz": "rutilated quartz", "crystal-septarian": "septarian nodule", "crystal-seraphinite": "Seraphinite crystal", "crystal-spirit-quartz": "spirit quartz cactus", "crystal-sugilite": "Sugilite crystal", "crystal-tanzanite": "Tanzanite crystal", "crystal-pink-tourmaline": "pink tourmaline", "crystal-watermelon-tourmaline": "watermelon tourmaline", "crystal-chiastolite": "chiastolite cross", "crystal-moldavite": "moldavite", "crystal-topaz": "topaz crystal", "crystal-bronzite": "bronzite", "crystal-mahogany-obsidian": "mahogany obsidian", "crystal-ammonite": "ammonite fossil", "crystal-petrified-wood": "petrified wood", "crystal-fulgurite": "fulgurite"}
ids=[c["id"] for c in json.load(open("data/crystals-2.json"))]
for k in Q: assert k in ids,k
out={}
for cid,q in Q.items():
    try: d=json.loads(urllib.request.urlopen(urllib.request.Request("https://api.openverse.org/v1/images/?"+urllib.parse.urlencode({"q":q,"page_size":20,"source":"flickr"}),headers={"User-Agent":"GrimoireApp/1.0"}),timeout=60).read())
    except Exception as e: print("fail",cid,e); time.sleep(10); continue
    time.sleep(1.5); cands=[]
    for r in d.get("results",[]):
        if len(cands)>=6: break
        u=r.get("url") or ""
        if "staticflickr" not in u: continue
        u=re.sub(r"_[a-z]\.jpg$","_z.jpg",u)
        try: im=Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"GrimoireApp/1.0"}),timeout=30).read())).convert("RGB")
        except Exception: continue
        p=f"cand/{cid}-c{len(cands)}.jpg"; im.save(p)
        cands.append({"path":p,"title":r.get("title"),"creator":r.get("creator"),"license":r.get("license"),"license_version":r.get("license_version"),"landing":r.get("foreign_landing_url"),"url":r.get("url"),"id":r["id"]})
    out[cid]=cands; print(cid,len(cands),flush=True)
json.dump(out,open("cand/cands3.json","w"),indent=1)
ids=list(out)
for s in range(0,len(ids),8):
    sheet=Image.new("RGB",(6*170+150,8*140),"white"); dr=ImageDraw.Draw(sheet)
    for row,cid in enumerate(ids[s:s+8]):
        dr.text((4,row*140+60),cid.replace("crystal-",""),fill="black")
        for j,cd in enumerate(out[cid]):
            im=Image.open(cd["path"]); im.thumbnail((165,135)); sheet.paste(im,(150+j*170,row*140)); dr.text((150+j*170+4,row*140+4),str(j),fill="red")
    sheet.save(f"cand/sheetC{s//8}.jpg",quality=80)
