# -*- coding: utf-8 -*-
"""지도 데이터: 시도 경계 + 기초지자체 경계(regions.json 기준으로 일반구 병합) → geo.json
사용: python build_geo.py prov_simplified.json muni_points.json regions.json muni_simplified.json geo.json
"""
import json, math, sys
prov, pts, reg, mun = (json.load(open(a)) for a in sys.argv[1:5])
PROV = {'11':'서울','21':'부산','22':'대구','23':'인천','24':'전남광주','25':'대전','26':'울산','29':'세종','31':'경기','32':'강원','33':'충북','34':'충남','35':'전북','36':'전남광주','37':'경북','38':'경남','39':'제주'}
POLY = reg['poly']
LON0, LAT0, LAT1 = 125.75, 38.65, 33.05
K = math.cos(math.radians(36)); W = 560
sx = W / ((131.0-LON0)*K)
def P(lon, lat):
    return round((min(lon,131.0)-LON0)*K*sx,1), round((LAT0-lat)*sx,1)
H = P(130,LAT1)[1]
def ring(r):
    out=[]; last=None
    for lon,lat in r:
        p=P(lon,lat)
        if p!=last: out.append(p); last=p
    return 'M'+'L'.join(f'{x},{y}' for x,y in out)+'Z' if len(out)>=3 else ''
def gpaths(g, west=None):
    polys = g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    return ''.join(ring(poly[0]) for poly in polys if poly and poly[0][0][0] < 131.5)
paths={}
for f in prov['features']:
    code=f['properties']['code']; paths['gwangju' if code=='24' else code]=gpaths(f['geometry'])
mp={}
for f in mun['features']:
    c,n=f['properties']['code'],f['properties']['name']
    if not f['geometry']: continue
    rid=POLY[f"{PROV[c[:2]]}|{n}"]
    mp[rid]=mp.get(rid,'')+gpaths(f['geometry'])
acc={}
for f in pts['features']:
    c,n=f['properties']['code'],f['properties']['name']
    rid=POLY[f"{PROV[c[:2]]}|{n}"]; x,y=P(*f['geometry']['coordinates'])
    a=acc.setdefault(rid,[0,0,0]); a[0]+=max(x,8); a[1]+=y; a[2]+=1
cent={k:[round(v[0]/v[2],1),round(v[1]/v[2],1)] for k,v in acc.items()}
cent['인천|검단구']=[cent['인천|서해구'][0]+2, cent['인천|서해구'][1]-9]
json.dump({'w':W,'h':round(H),'paths':paths,'prov':PROV,'cent':cent,'mp':mp},open(sys.argv[5],'w'),ensure_ascii=False,separators=(',',':'))
print('geo', len(cent), len(mp))
