import json,glob,sys
A=sys.argv[1]
files={}; idx={}
for f in glob.glob('data/*.json'):
  try: d=json.load(open(f))
  except: continue
  if isinstance(d,list):
    files[f]=d
    for i,x in enumerate(d):
      if isinstance(x,dict) and 'id' in x: idx[x['id']]=(f,i)
def rep(val,find,new):
  """replace find in str, list of str, or list of dicts (any string value). returns (newval, hit)"""
  if isinstance(val,str):
    return (val.replace(find,new,1),True) if find in val else (val,False)
  if isinstance(val,list):
    for j,el in enumerate(val):
      nv,h=rep(el,find,new)
      if h: val[j]=nv; return val,True
    return val,False
  if isinstance(val,dict):
    for k in val:
      nv,h=rep(val[k],find,new)
      if h: val[k]=nv; return val,True
  return val,False
ok=bad=0; fails=[]
for of in sorted(glob.glob(A+'out-*.json')):
  for id_,v in json.load(open(of)).items():
    f,i=idx[id_]; x=files[f][i]
    for k in ('caution','interactions','pets'):
      if v.get(k) is not None: x[k]=v[k].replace('—',', ').strip()
    x['toxic']=bool(v.get('toxic')); x['externalOnly']=bool(v.get('externalOnly'))
    src=[s for s in dict.fromkeys(v.get('sources') or []) if s.startswith('http')]
    if src: x['sources']=src
    for e in v.get('edits',[]):
      fld=e['field']
      if fld not in x: fails.append((id_,fld,'nofield')); bad+=1; continue
      x[fld],h=rep(x[fld],e['find'],e['replace'])
      if h: ok+=1
      else: bad+=1; fails.append((id_,fld,e['find'][:60]))
for f,d in files.items():
  if f.startswith('data/tarot') or f.startswith('data/timing'): continue
  json.dump(d,open(f,'w'),indent=1,ensure_ascii=False)
print('edits ok',ok,'failed',bad); [print(' ',x) for x in fails]
