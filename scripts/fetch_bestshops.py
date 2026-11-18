# -*- coding: utf-8 -*-
"""LG전자 베스트샵 전국 매장 목록 갱신 → bestshops.json

출처: https://bestshop.lge.co.kr/shop/findBestshop 이 사용하는 매장 검색 API
각 매장의 주소를 시·도 / 시·군·구 / 읍·면·동으로 나눠 regions.json 의 지역 id 와 맞춥니다.
API 호출이 실패하면 기존 bestshops.json 을 그대로 둡니다(빈 목록으로 덮어쓰지 않음).
"""
import json, os, re, sys, urllib.request
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = ("https://apiv2.lge.co.kr/bestsvc/ajax/v1/shops?srchType=MAP&mapCenterLat=36.3&mapCenterLng=127.8"
       "&mapCenterDistance=700&initYn=N&page=1&pageSize=2000")
BASE = "https://bestshop.lge.co.kr"
EVENT = "MC11804002"

SIDO = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
        "광주광역시": "전남광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
        "경기도": "경기", "강원특별자치도": "강원", "강원도": "강원", "충청북도": "충북", "충청남도": "충남",
        "전북특별자치도": "전북", "전라북도": "전북", "전라남도": "전남광주", "전남광주통합특별시": "전남광주",
        "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주"}

# 인천 행정체제 개편(2026.7.1): 옛 주소로 표기된 매장을 새 구로 연결
YEONGJONG = re.compile(r"^(운서|운남|운북|중산|을왕|남북|덕교|무의|영종|용유)")
GEOMDAN = re.compile(r"^(검단|불로|대곡|마전|당하|원당|오류|왕길|금곡|백석|아라)")

def fetch():
    req = urllib.request.Request(API, headers={
        "User-Agent": "Mozilla/5.0", "Referer": BASE + "/shop/findBestshop", "Origin": BASE,
        "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        d = json.loads(r.read())
    lst = d.get("data")
    if isinstance(lst, dict): lst = lst.get("list") or lst.get("shops") or []
    return lst or []

def parse(addr, road, ids):
    t = (addr or road or "").replace(",", " ").split()
    if not t: return None, None, ""
    sido = SIDO.get(t[0])
    if not sido: return None, None, ""
    rest = t[1:]
    if sido == "세종":
        sgg, rest = "세종특별자치시", rest
    else:
        if not rest: return sido, None, ""
        sgg, rest = rest[0], rest[1:]
        if sgg.endswith("시") and rest and re.match(r".+구$", rest[0]):   # 일반구는 상위 시로 합침
            rest = rest[1:]
    dong = rest[0] if rest and re.search(r"(동|읍|면|리|가)\d*$", rest[0]) else ""
    if not dong:
        m = re.search(r"\(([^)]*?(동|가))[,)\s]", (road or "") + ")")
        if m: dong = m.group(1)
    dong = re.sub(r"\d+(-\d+)?$", "", dong) if re.search(r"(동|가)\d", dong) else dong
    if sido == "인천":
        if sgg == "중구": sgg = "영종구" if YEONGJONG.match(dong) else "제물포구"
        elif sgg == "동구": sgg = "제물포구"
        elif sgg == "서구": sgg = "검단구" if GEOMDAN.match(dong) else "서해구"
        elif sgg == "남구": sgg = "미추홀구"
    if sido == "대구" and sgg == "군위군": pass
    rid = f"{sido}|{sgg}"
    return (sido, sgg, dong) if rid in ids else (sido, None, dong)

def build(lst, ids):
    out, miss = [], []
    for s in lst:
        sid = s.get("storeId")
        if not sid: continue
        addr, road = (s.get("addressBasicName") or "").strip(), (s.get("addressBasicRoadName") or "").strip()
        sido, sgg, dong = parse(addr, road, ids)
        if not sgg: sido2, sgg2, dong2 = parse(road, road, ids); sido, sgg, dong = sido2 or sido, sgg2, dong or dong2
        if not sgg: miss.append(f"{sid} {s.get('hrOrgName')} {addr}"); continue
        link = s.get("counselReserveLink") or f"/storehub/dtl-{sid}/reserve?counselEventNo={EVENT}"
        out.append(dict(id=sid, name=s.get("hrOrgName", "").strip(), tel=(s.get("telNo") or "").strip(),
                        region=f"{sido}|{sgg}", dong=dong,
                        addr=re.sub(r"\s+", " ", road or addr), lat=s.get("gpsY"), lng=s.get("gpsX"),
                        type="백화점·몰" if s.get("storeFormType") == "department" else "베스트샵",
                        reserve=BASE + link if link.startswith("/") else link,
                        page=f"{BASE}/storehub/dtl-{sid}"))
    return out, miss

def main():
    ids = {r["id"] for r in json.load(open(os.path.join(ROOT, "regions.json"), encoding="utf-8"))["regions"]}
    path = os.path.join(ROOT, "bestshops.json")
    try:
        lst = fetch()
    except Exception as ex:
        print("bestshop api failed — keep previous bestshops.json:", ex, file=sys.stderr); return
    if len(lst) < 100:
        print("bestshop api returned too few stores — keep previous:", len(lst), file=sys.stderr); return
    shops, miss = build(lst, ids)
    for m in miss: print("unmatched:", m, file=sys.stderr)
    shops.sort(key=lambda x: (x["region"], x["type"] != "베스트샵", x["name"]))
    json.dump({"updated_at": datetime.now(KST).isoformat(timespec="seconds"),
               "source": BASE + "/shop/findBestshop", "event": EVENT,
               "reserve_any": BASE + "/counselReserve/store/MC11804002?apartCode=&modelId=&managerCode=&device=w&inputUrl=L2NvdW5zZWxSZXNlcnZlL21haW4vTUMxMTgwNDAwMj9zdG9yZUlkPSZhcGFydENvZGU9Jm1hbmFnZXJDb2RlPSZtb2RlbElkPSZldmVudEhhbGxGbGFnPQ%3D%3D&eventHallFlag=",
               "count": len(shops), "items": shops},
              open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"bestshops: {len(shops)} stores ({len(miss)} unmatched)")

if __name__ == "__main__":
    main()
