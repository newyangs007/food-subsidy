# -*- coding: utf-8 -*-
"""전국 기초지자체 마스터 목록(2026.11 기준) → regions.json
기준: 통계청 2018 시군구 경계 + 이후 변경사항
  - 2018.07 인천 남구 → 미추홀구
  - 2023.07 경북 군위군 → 대구광역시 편입
  - 2026.07 인천 행정체제 개편: 중구·동구 → 제물포구·영종구, 서구 → 서해구·검단구
  - 2026.07 광주광역시+전라남도 → 전남광주통합특별시 (자치구·시군은 유지)
  - 일반구(수원시 장안구 등)는 보조금 사업 주체가 '시'이므로 시 단위로 묶음
  - 세종특별자치시(단층), 제주특별자치도 제주시·서귀포시(행정시) 포함
"""
import json, re, sys
from collections import Counter

PROV = {'11':'서울','21':'부산','22':'대구','23':'인천','24':'전남광주','25':'대전','26':'울산','29':'세종',
        '31':'경기','32':'강원','33':'충북','34':'충남','35':'전북','36':'전남광주','37':'경북','38':'경남','39':'제주'}
LEGACY = {'24':'광주','36':'전남'}         # 검색어 접두어(언론·공고는 여전히 '광주 북구', '전남 함평군'을 씀)
SHORT = {'서울':'서울','부산':'부산','대구':'대구','인천':'인천','대전':'대전','울산':'울산','세종':'세종','경기':'경기',
         '강원':'강원','충북':'충북','충남':'충남','전북':'전북','경북':'경북','경남':'경남','제주':'제주'}

muni = json.load(open(sys.argv[1]))
regions, poly_map = {}, {}
for f in muni['features']:
    code, name = f['properties']['code'], f['properties']['name']
    p2 = code[:2]
    sido = PROV[p2]
    m = re.match(r'^([가-힣]+시)[가-힣]+구$', name)
    base = m.group(1) if m else name
    if p2 == '29': base = '세종특별자치시'
    if p2 == '37' and base == '군위군': sido, p2 = '대구', '22'
    if sido == '인천':
        base = {'남구':'미추홀구', '중구':'영종구', '동구':'제물포구', '서구':'서해구'}.get(base, base)
    rid = f'{sido}|{base}'
    poly_map[f'{PROV[code[:2]]}|{name}'] = rid
    regions.setdefault(rid, dict(id=rid, sido=sido, name=base, legacy=LEGACY.get(code[:2], SHORT.get(sido, sido))))
# 경계 데이터에 없는 2026 신설 자치구
regions['인천|검단구'] = dict(id='인천|검단구', sido='인천', name='검단구', legacy='인천', note='2026.7.1 신설(구 서구 북부)')
regions['인천|제물포구']['note'] = '2026.7.1 신설(구 중구 내륙+동구)'
regions['인천|영종구']['note'] = '2026.7.1 신설(구 중구 영종·용유)'
regions['인천|서해구']['note'] = '2026.7.1 신설(구 서구 남부)'
regions['인천|미추홀구']['note'] = '구 남구'
regions['대구|군위군']['note'] = '2023.7.1 경북→대구 편입'

dup = Counter(r['name'] for r in regions.values())
for r in regions.values():
    nm = r['name']
    r['q'] = nm if (dup[nm] == 1 and nm != '세종특별자치시') else (nm if nm == '세종특별자치시' else f"{r['legacy']} {nm}")
    if nm == '세종특별자치시': r['q'] = '세종시'
    if nm == '광주시': r['q'] = '경기 광주시'

ORDER = ['서울','부산','대구','인천','대전','울산','세종','경기','강원','충북','충남','전북','전남광주','경북','경남','제주']
out = sorted(regions.values(), key=lambda r: (ORDER.index(r['sido']), r['name']))
json.dump({"basis": "2026-11 기준 기초자치단체(세종·제주 행정시 포함)", "count": len(out), "regions": out,
           "poly": poly_map}, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
print(len(out), Counter(r['sido'] for r in out))
