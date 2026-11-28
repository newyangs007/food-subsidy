# -*- coding: utf-8 -*-
"""쿠팡 파트너스 인기 제품 → coupang.json

'지원 제품 찾기' 화면의 롤링 캐러셀에 쓰는 데이터입니다.
보조금 인증 목록(products.json)에 있는 모델 중, 쿠팡 검색 랭킹 상위에 올라온(=잘 팔리는) 제품만 남깁니다.

두 가지 입력을 합칩니다.
 ① 쿠팡 파트너스 Open API (GitHub Secrets에 COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 등록 시)
    - '음식물처리기' 등 대표 검색어로 쿠팡 랭킹 상위 10개씩 받아 인증 모델과 대조
    - 받은 productUrl은 이미 내 파트너스 추적 링크입니다.
    - 호출 제한(시간당 약 10회, 초과 시 이용 정지) 때문에 하루 1회·검색어 5개만 호출합니다.
 ② coupang_links.json (직접 입력) — 파트너스 사이트에서 만든 단축 링크(link.coupang.com/a/...)
    - API 권한이 없을 때(최종 승인 전 등)도 이 파일만 채우면 캐러셀이 나옵니다.
    - 적은 순서가 인기 순위로 쓰이며, API 결과보다 먼저 나옵니다.
"""
import hashlib, hmac, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone, timedelta

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KST = timezone(timedelta(hours=9))
OUT = os.path.join(R, 'coupang.json')
MANUAL = os.path.join(R, 'coupang_links.json')
HOST = 'https://api-gateway.coupang.com'
SEARCH = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search'
DEEPLINK = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink'
KEYWORDS = ['음식물처리기', '가정용 음식물처리기', '음식물처리기 미생물', '음식물처리기 건조', '음식물쓰레기 처리기']
MIN_HOURS = 20          # API는 하루 1회만
MAX_ITEMS = 12
DISCLOSURE = '이 영역은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
# 보조금 대상이 아닌 판매글(부속품·소모품·렌탈·중고)은 제외
EXCLUDE = re.compile(r'렌탈|대여|중고|리퍼|전시|필터|리필|소모품|교체용|부품|전용\s*미생물|미생물제|배양|케이스|커버|받침|매트|스티커')
OK_URL = re.compile(r'^https://(link\.coupang\.com|www\.coupang\.com|m\.coupang\.com|coupa\.ng)/')


def load(path, default):
    try:
        return json.load(open(path, encoding='utf-8'))
    except Exception:
        return default


def norm(s):
    return re.sub(r'[^0-9A-Z가-힣]', '', str(s or '').upper())


def model_keys(model):
    """'400 PRO2 (SC-D0208)' → ['400PRO2', 'SCD0208'] / 'EC-100(SG,WG)' → ['EC100']"""
    main = re.sub(r'\(.*?\)', '', model)
    keys = [norm(main)]
    for inner in re.findall(r'\((.*?)\)', model):
        for part in re.split(r'[,/]', inner):
            k = norm(part)
            if len(k) >= 4 and re.search(r'[A-Z]', k) and re.search(r'\d', k):
                keys.append(k)
    return [k for k in keys if len(k) >= 3]


def brand_keys(p):
    ks = {norm(p['brand'])}
    mk = norm(re.sub(r'㈜|\(주\)|주식회사', '', p.get('maker', '')))
    if len(mk) >= 2:
        ks.add(mk)
        ks.add(re.sub(r'전자$', '', mk))
    return {k for k in ks if len(k) >= 2}


def match(name, products):
    """상품명 → 인증 모델(products.json item). 브랜드 + 모델명이 모두 들어 있어야 인정"""
    n = norm(name)
    best, blen = None, 0
    for p in products:
        if not any(b in n for b in brand_keys(p)):
            continue
        for k in model_keys(p['model']):
            if k in n and len(k) > blen:
                best, blen = p, len(k)
    return best


def sign(method, path, query, ak, sk):
    dt = time.strftime('%y%m%dT%H%M%SZ', time.gmtime())
    msg = dt + method + path + query
    sig = hmac.new(sk.encode(), msg.encode(), hashlib.sha256).hexdigest()
    return f'CEA algorithm=HmacSHA256, access-key={ak}, signed-date={dt}, signature={sig}'


def call(method, path, query='', body=None):
    ak, sk = os.environ.get('COUPANG_ACCESS_KEY', ''), os.environ.get('COUPANG_SECRET_KEY', '')
    url = HOST + path + ('?' + query if query else '')
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        'Authorization': sign(method, path, query, ak, sk), 'Content-Type': 'application/json;charset=UTF-8'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode('utf-8'))


def search(keyword, sub_id):
    q = urllib.parse.urlencode({'keyword': keyword, 'limit': 10, 'imageSize': '320x320', **({'subId': sub_id} if sub_id else {})})
    j = call('GET', SEARCH, q)
    if str(j.get('rCode')) != '0':
        raise RuntimeError(f"{keyword}: {j.get('rCode')} {j.get('rMessage')}")
    return (j.get('data') or {}).get('productData') or []


def deeplink(urls, sub_id):
    body = {'coupangUrls': urls, **({'subId': sub_id} if sub_id else {})}
    j = call('POST', DEEPLINK, body=body)
    return {d.get('originalUrl'): d.get('shortenUrl') for d in (j.get('data') or [])}


def from_api(products, prev):
    """대표 검색어 랭킹 → 인증 모델과 대조. 점수 = Σ(11 - 순위), 여러 검색어에서 상위일수록 높음"""
    sub_id = os.environ.get('COUPANG_SUB_ID', 'foodsubsidy')
    found, calls, errors = {}, 0, []
    for kw in KEYWORDS:
        try:
            rows = search(kw, sub_id); calls += 1
        except Exception as e:
            errors.append(str(e)[:200]); calls += 1
            if '429' in str(e) or 'rate' in str(e).lower():
                break
            continue
        for i, d in enumerate(rows):
            name = d.get('productName', '')
            if EXCLUDE.search(name):
                continue
            p = match(name, products)
            if not p:
                continue
            rank = int(d.get('rank') or i + 1)
            key = str(d.get('productId') or name)
            x = found.setdefault(key, dict(
                pid=p['id'], brand=p['brand'], model=p['model'], cert=p['cert'], name=name,
                price=d.get('productPrice'), image=d.get('productImage', ''), url=d.get('productUrl', ''),
                rocket=bool(d.get('isRocket')), free=bool(d.get('isFreeShipping')),
                product_id=d.get('productId'), best=rank, hits=0, score=0, via='api'))
            x['hits'] += 1; x['score'] += 11 - min(rank, 10); x['best'] = min(x['best'], rank)
        time.sleep(2)
    items = sorted(found.values(), key=lambda x: (-x['score'], x['best']))
    # 같은 모델 판매글이 여러 개면 가장 잘 팔리는 것 하나만
    seen, out = set(), []
    for x in items:
        if x['pid'] in seen:
            continue
        seen.add(x['pid']); out.append(x)
    return out, calls, errors


def from_manual(products):
    m = load(MANUAL, {})
    out = []
    for i, e in enumerate(m.get('items') or []):
        url = (e.get('url') or '').strip()
        if not OK_URL.match(url):
            continue
        p = None
        if e.get('model'):
            km = norm(e['model'])
            p = next((q for q in products if km and (km in model_keys(q['model']) or km == norm(q['model']))), None) \
                or next((q for q in products if km and any(km in k or k in km for k in model_keys(q['model']))), None)
        p = p or match(e.get('name', ''), products)
        if not p:
            print('  수동 링크: 인증 목록에서 모델을 찾지 못해 건너뜀 →', e.get('model') or e.get('name'), file=sys.stderr)
            continue
        out.append(dict(pid=p['id'], brand=p['brand'], model=p['model'], cert=p['cert'],
                        name=e.get('name') or f"{p['brand']} {p['model']} 음식물처리기",
                        price=e.get('price') or None, image=e.get('image') or '', url=url,
                        rocket=bool(e.get('rocket')), free=bool(e.get('free')), best=i + 1, via='manual'))
    return out


def main():
    products = (load(os.path.join(R, 'products.json'), {}) or {}).get('items') or []
    prev = load(OUT, {})
    now = datetime.now(KST)
    has_key = bool(os.environ.get('COUPANG_ACCESS_KEY') and os.environ.get('COUPANG_SECRET_KEY'))
    api_items, api_at, calls, errors = prev.get('api_items') or [], prev.get('api_at'), 0, []
    due = True
    if api_at:
        try:
            due = (now - datetime.fromisoformat(api_at)).total_seconds() >= MIN_HOURS * 3600
        except Exception:
            due = True
    if has_key and (due or '--force' in sys.argv):
        got, calls, errors = from_api(products, prev)
        if got or not errors:               # 실패하면 이전 결과 유지
            api_items, api_at = got, now.isoformat(timespec='seconds')
        print(f'쿠팡 API: 검색 {calls}회, 인증 모델 일치 {len(got)}개', ('· 오류 ' + ' | '.join(errors)) if errors else '')
    elif not has_key:
        print('쿠팡 API 키 없음 → coupang_links.json(직접 입력)만 반영')
    else:
        print(f'쿠팡 API: 마지막 호출 {api_at} — {MIN_HOURS}시간 뒤 다시 호출')

    manual = from_manual(products)
    if manual and has_key:              # coupang.com 일반 주소는 파트너스 링크로 변환
        plain = [x['url'] for x in manual if 'link.coupang.com' not in x['url'] and 'coupa.ng' not in x['url']]
        if plain:
            try:
                mp = deeplink(plain, os.environ.get('COUPANG_SUB_ID', 'foodsubsidy'))
                for x in manual:
                    x['url'] = mp.get(x['url']) or x['url']
            except Exception as e:
                print('딥링크 변환 실패:', e, file=sys.stderr)

    items, seen = [], set()
    for x in manual + api_items:
        if x['pid'] in seen:
            continue
        seen.add(x['pid']); items.append(x)
    items = items[:MAX_ITEMS]
    for i, x in enumerate(items):
        x['rank'] = i + 1

    out = dict(updated_at=now.isoformat(timespec='seconds'), disclosure=DISCLOSURE,
               source=('api+manual' if api_items and manual else 'api' if api_items else 'manual' if manual else 'none'),
               keywords=KEYWORDS, api_at=api_at, api_items=api_items, items=items)
    if errors:
        out['errors'] = errors
    old = {k: v for k, v in prev.items() if k != 'updated_at'}
    new = {k: v for k, v in out.items() if k != 'updated_at'}
    if old == new and prev.get('updated_at'):
        out['updated_at'] = prev['updated_at']    # 내용이 같으면 커밋하지 않도록 시각 유지
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('coupang.json', len(items), '개 제품', out['source'])


if __name__ == '__main__':
    main()
