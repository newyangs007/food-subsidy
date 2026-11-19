# -*- coding: utf-8 -*-
"""지자체 누리집 게시글 수집 → gov_posts.json  (GitHub Actions에서 2시간마다)

'보조금 뉴스' 탭에는 언론 기사·블로그를 쓰지 않고, 각 지자체 공식 누리집에서 찾은 게시글만 싣는다.
  1) 지자체 누리집 첫 화면(팝업·새소식)과 누리집 통합검색에서
     '감량기', '음식물처리기', '음식물 처리기 보조금/지원금' 등 연관검색어로 게시글을 찾고
  2) 제목에 사업연도(2026/26년, 2027/27년)가 들어간 글만 고른 뒤
  3) 게시글을 최대 3번까지 다시 열어 (접속 · 음식물처리기/감량기 내용 · 연도) 를 확인한 글만 남긴다.
2027년 글은 제목·본문에 '2027' 또는 '27년'이 들어간 것만 2027년으로 분류한다.
"""
import json, os, re, sys, ssl, html, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check_sites import HOME, SEARCH

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "gov_posts.json")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36", "Accept-Language": "ko-KR,ko;q=0.9"}
CTX = ssl.create_default_context()
LAX = ssl.create_default_context(); LAX.check_hostname = False; LAX.verify_mode = ssl.CERT_NONE
GOV = re.compile(r"(\.go\.kr|\.seoul\.kr|\.daegu\.kr|(^|\.)suseong\.kr)$")
DEV = re.compile(r"감량기|음식물\s*(?:쓰레기|류\s*폐기물)?\s*처리기")
PROG = re.compile(r"지원|보조|보급|구매|구입|설치|신청|모집|선정|공고|안내")
SKIP = re.compile(r"(?i)download|fileDown|filedown|\.hwp|\.pdf|\.xlsx?|\.zip|javascript:|mailto:|blog\.naver|youtube|instagram|facebook")
NOT_HOME = re.compile(r"공동주택|RFID|대형\s*감량기|다량배출|음식점|경진대회|임차")      # 가정용 지원사업이 아닌 글
YR = {2026: re.compile(r"2026|(?<!\d)26년|['’‘]26\."), 2027: re.compile(r"2027|(?<!\d)27년|['’‘]27\.")}
KW = {2026: ["감량기", "음식물처리기", "음식물 처리기 보조금", "음식물 처리기 지원금"],
      2027: ["2027 감량기", "2027 음식물처리기", "2027년 음식물처리기 보조금", "2027년 음식물처리기 지원금"]}


def get(url, data=None, timeout=20):
    req = urllib.request.Request(url, data=data, headers=UA)
    for c in (CTX, LAX):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=c) as r:
                return r.status, r.read(3_000_000), r.headers.get("Content-Type", ""), r.geturl()
        except ssl.SSLError:
            continue
    raise OSError("ssl")


def decode(raw, ct):
    m = re.search(r"charset=([\w-]+)", ct or "") or re.search(rb'charset=["\']?([\w-]+)', raw[:5000])
    enc = m.group(1).decode() if m and isinstance(m.group(1), bytes) else (m.group(1) if m else None)
    for e in [enc, "utf-8", "euc-kr", "cp949"]:
        if not e: continue
        try: return raw.decode(e)
        except Exception: pass
    return raw.decode("utf-8", "ignore")


def plain(s):
    s = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


A_RE = re.compile(r'(?is)<a\b([^>]*)>(.*?)</a>')
HREF = re.compile(r'(?is)href\s*=\s*["\']([^"\']+)["\']')
TITLE = re.compile(r'(?is)title\s*=\s*["\']([^"\']+)["\']')
DATE = re.compile(r"(20\d\d)\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})")


def anchors(page, base):
    """페이지의 링크 중 음식물처리기(감량기) 관련 글 제목을 가진 것만"""
    out = []
    for m in A_RE.finditer(page):
        attrs, inner = m.group(1), m.group(2)
        h = HREF.search(attrs)
        if not h: continue
        href = html.unescape(h.group(1)).strip()
        if SKIP.search(href) or href.startswith("#"): continue
        t = plain(inner) or (TITLE.search(attrs).group(1) if TITLE.search(attrs) else "")
        t = re.sub(r"\s+", " ", html.unescape(t)).strip()
        if len(t) < 8 or not DEV.search(t) or NOT_HOME.search(t): continue
        url = urllib.parse.urljoin(base, href)
        if not GOV.search(urllib.parse.urlparse(url).hostname or ""): continue
        tail = page[m.end(): m.end() + 400]
        dm = DATE.search(plain(tail[:400]))
        out.append({"title": t[:120], "link": url, "date": f"{dm.group(1)}-{int(dm.group(2)):02d}-{int(dm.group(3)):02d}" if dm else ""})
    return out


def year_of(text):
    if YR[2027].search(text): return 2027
    if YR[2026].search(text): return 2026
    return None


def search_pages(rid):
    """지자체 첫 화면 + 누리집 통합검색 결과 페이지들"""
    pages = []
    home = HOME.get(rid)
    if home: pages.append(("home", home, None))
    cfg = SEARCH.get(rid)
    if cfg:
        for y, kws in KW.items():
            for q in kws:
                if cfg.get("u"):
                    pages.append(("search", cfg["u"].replace("{q}", urllib.parse.quote(q)), None))
                else:
                    body = urllib.parse.urlencode({k: str(v).replace("{q}", q) for k, v in cfg["p"].items()}).encode()
                    pages.append(("search", cfg["post"], body))
    return pages


def scan_region(rid):
    found = {}
    for kind, url, body in search_pages(rid):
        try:
            st, raw, ct, final = get(url, body)
            if st != 200: continue
            for a in anchors(decode(raw, ct), final):
                y = year_of(a["title"])
                if not y: continue
                a.update(year=y, sido=rid.split("|")[0], sigungu=rid.split("|")[1], via=kind)
                found.setdefault(a["link"], a)
        except Exception:
            continue
        time.sleep(0.3)
    return list(found.values())


def verify(item):
    """게시글을 최대 3번 열어 확인: 접속 · 음식물처리기/감량기 내용 · 연도"""
    ok = 0
    for i in range(3):
        try:
            st, raw, ct, final = get(item["link"], timeout=20)
            txt = plain(decode(raw, ct))
            if st == 200 and DEV.search(txt) and YR[item["year"]].search(txt) and PROG.search(txt):
                ok += 1
                if not item.get("date"):
                    m = re.search(r"(?:작성일|등록일|게시일|작성일자|등록일자)\s*[:：]?\s*" + DATE.pattern, txt)
                    if m: item["date"] = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
                if ok >= 2: break               # 2번 연속 확인되면 충분(최대 3번 시도)
        except Exception:
            pass
        time.sleep(1)
    item["checks"] = ok
    return ok >= 1


def main():
    prev = {}
    try:
        for x in json.load(open(OUT, encoding="utf-8")).get("items", []): prev[x["link"]] = x
    except Exception:
        pass
    regions = sorted(set(HOME) | set(SEARCH))
    with ThreadPoolExecutor(10) as ex:
        hits = [h for hs in ex.map(scan_region, regions) for h in hs]
    cand = {h["link"]: h for h in hits}
    for link, x in prev.items():                    # 이전에 확인한 글도 다시 확인(삭제된 글은 빠짐)
        cand.setdefault(link, x)
    with ThreadPoolExecutor(10) as ex:
        res = list(ex.map(lambda it: (it, verify(it)), cand.values()))
    now = datetime.now(KST).strftime("%Y-%m-%dT%H:%M:%S+09:00")
    items = []
    for it, good in res:
        if good:
            it["checked_at"] = now
            it.setdefault("first_seen", prev.get(it["link"], {}).get("first_seen", now))
            items.append(it)
        elif it["link"] in prev and prev[it["link"]].get("checked_at", "") > (datetime.now(KST) - timedelta(days=2)).strftime("%Y-%m-%d"):
            items.append(prev[it["link"]])           # 해외 서버에서 일시적으로 막힌 경우 이틀간 유지
    items.sort(key=lambda x: (x.get("date") or x.get("first_seen", "")), reverse=True)
    json.dump({"updated_at": now, "rule": "지자체 누리집 게시글만 · 제목에 사업연도 포함 · 최대 3회 재확인",
               "items": items}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"regions {len(regions)} · candidates {len(cand)} · verified {len(items)}")


if __name__ == "__main__":
    main()
