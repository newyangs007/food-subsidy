# -*- coding: utf-8 -*-
"""전국 음식물처리기 보조금 자동 점검기 — GitHub Actions에서 2시간마다 실행

1) 전국 230개 기초지자체(regions.json)를 하나도 빠짐없이 순회하며
   지역명 × 연관검색어(keywords.json)로 검색합니다.
2) 서로 독립된 두 검색 경로로 교차 확인(더블체크)합니다.
     A. 네이버 검색 API (뉴스·웹문서·블로그)  — NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 필요
        (NAVER API HUB 키·개발자센터 키 모두 사용 가능, 자동 판별)
     B. Google 뉴스 RSS                       — 키 불필요
3) 결과
     coverage.json   : 지자체별 마지막 점검 시각, 경로별 결과 수, 감지 여부, 더블체크 여부
     candidates.json : data.json에 아직 없는 새 공고·보도(검증 대기, 최초 감지 시각 보존)
4) 검색 실패(네트워크·한도 초과)한 지역은 이전 점검 결과를 그대로 유지합니다.
   '공고 없음'은 두 경로가 모두 정상 동작하고 결과가 0일 때만 기록합니다.

자동 결과는 사람이 공고문을 확인하기 전까지 '검증 대기'입니다.
확인 후 scripts/build_data.py에 추가하면 정식 목록이 됩니다.
"""
import json, os, re, sys, time, html, urllib.parse, urllib.request, urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_AGE_DAYS = int(os.environ.get("MAX_AGE_DAYS", "400"))

def target_years(now, data):
    """점검할 사업연도: 올해 + (11월부터는) 내년. data.json 의 years 에 있는 해만."""
    ys = [now.year] + ([now.year + 1] if now.month >= 11 else [])
    allowed = set(data.get("years", [now.year]))
    return [y for y in ys if y in allowed] or [now.year]

def hit_year(hit, years):
    """기사·공고가 어느 사업연도 것인지 판정: 본문의 연도 표기 → 없으면 게시일 기준"""
    t = hit["title"] + " " + hit["desc"]
    named = [y for y in years if str(y) in t]
    if named: return max(named)
    if hit["published"]:
        y, m = int(hit["published"][:4]), int(hit["published"][5:7])
        if m == 12 and re.search(r"(내년|새해)", t): y += 1
        return y if y in years else None
    return None
NAVER_KINDS = ("news", "webkr", "blog")

def load(name, default=None):
    try: return json.load(open(os.path.join(ROOT, name), encoding="utf-8"))
    except Exception: return default

KW = load("keywords.json")
DEVICE = re.compile("|".join(sorted({re.escape(w.replace(" ", "")) for w in KW["device"]} |
                                    {r"음식물.{0,8}처리기", r"음식물.{0,10}감량", r"소멸기"}, key=len, reverse=True)))
PROGRAM = re.compile(r"(보조|지원|보급|모집|공고|구매비|구입비|신청)")
EXCLUDE = re.compile("|".join(map(re.escape, KW["exclude"])))
OTHER_YEAR = re.compile(r"20(1\d|2\d)년")

def http_get(url, headers=None, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (subsidy-monitor; +github actions)", **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def clean(t):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html.unescape(t or ""))).strip()

def to_iso(s):
    if not s: return None
    try: return parsedate_to_datetime(s).astimezone(KST).isoformat(timespec="seconds")
    except Exception: pass
    m = re.match(r"(\d{4})(\d{2})(\d{2})$", s)  # 블로그 postdate
    return f"{m[1]}-{m[2]}-{m[3]}T00:00:00+09:00" if m else None

class Engine:
    ok = True
    def __init__(self): self.calls = 0; self.errors = 0

class Naver(Engine):
    """네이버 검색 API — 두 발급처 모두 지원
       · NAVER API HUB(네이버 클라우드, 2026.7.31 이후 신규 발급처)  https://naverapihub.apigw.ntruss.com/search/v1/{kind}
       · 네이버 개발자센터(기존 키, 2027.6.30까지 동작)            https://openapi.naver.com/v1/search/{kind}.json
       같은 GitHub Secret 이름(NAVER_CLIENT_ID / NAVER_CLIENT_SECRET)을 쓰고, 어느 쪽 키인지는 자동으로 판별합니다.
       NAVER_API=hub 또는 NAVER_API=developers 로 고정할 수도 있습니다."""
    name = "naver"
    def __init__(self):
        super().__init__()
        self.cid, self.sec = os.environ.get("NAVER_CLIENT_ID"), os.environ.get("NAVER_CLIENT_SECRET")
        self.ok = bool(self.cid and self.sec)
        self.mode = os.environ.get("NAVER_API", "auto").lower()   # auto | hub | developers
    def _url(self, mode, kind, q):
        sort = "&sort=date" if kind in ("news", "blog") else ""
        if mode == "hub":
            return f"https://naverapihub.apigw.ntruss.com/search/v1/{kind}?display=30{sort}&query={urllib.parse.quote(q)}", \
                   {"X-NCP-APIGW-API-KEY-ID": self.cid, "X-NCP-APIGW-API-KEY": self.sec}
        return f"https://openapi.naver.com/v1/search/{kind}.json?display=30{sort}&query={urllib.parse.quote(q)}", \
               {"X-Naver-Client-Id": self.cid, "X-Naver-Client-Secret": self.sec}
    def _get(self, kind, q):
        modes = [self.mode] if self.mode in ("hub", "developers") else ["hub", "developers"]
        last = None
        for m in modes:
            url, hdr = self._url(m, kind, q)
            try:
                d = json.loads(http_get(url, hdr))
                if self.mode == "auto":
                    self.mode = m; print("naver api mode:", m)
                return d
            except urllib.error.HTTPError as ex:
                last = ex
                if ex.code in (401, 403) and self.mode == "auto": continue   # 다른 발급처 키일 수 있음
                raise
        raise last
    def search(self, q):
        out, failed = [], 0
        for kind in NAVER_KINDS:
            try:
                self.calls += 1
                d = self._get(kind, q)
            except Exception as ex:
                self.errors += 1; failed += 1; print("naver", kind, q, ex, file=sys.stderr); continue
            for it in d.get("items", []):
                out.append(dict(title=clean(it.get("title")), link=it.get("originallink") or it.get("link"),
                                desc=clean(it.get("description")), published=to_iso(it.get("pubDate") or it.get("postdate")),
                                via=f"naver-{kind}"))
            time.sleep(0.12)
        return out, failed == len(NAVER_KINDS)

class GoogleNews(Engine):
    name = "google"
    def search(self, q):
        url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q, "hl": "ko", "gl": "KR", "ceid": "KR:ko"})
        try:
            self.calls += 1
            raw = http_get(url)
        except Exception as ex:
            self.errors += 1; print("google", q, ex, file=sys.stderr); return [], True
        finally:
            time.sleep(1.0)
        out = []
        for it in ET.fromstring(raw).iter("item"):
            out.append(dict(title=clean(it.findtext("title")), link=(it.findtext("link") or "").strip(),
                            desc=clean(it.findtext("description")), published=to_iso(it.findtext("pubDate")), via="google-news"))
        return out, False

def region_tokens(r):
    toks = [r["name"]]
    if " " in r["q"]: toks.append(r["q"].split(" ")[0])   # 동명 지역은 시도명도 함께 있어야 인정
    return toks

YEARS = []
def relevant(hit, region, cutoff):
    t = (hit["title"] + " " + hit["desc"]).replace(" ", "")
    if not DEVICE.search(t) or not PROGRAM.search(t): return False
    if EXCLUDE.search(hit["title"]): return False                 # 업소용·사업장용 제외(가정용 사업만)
    if hit["published"] and hit["published"] < cutoff: return False
    if OTHER_YEAR.search(t) and not any(str(y) in t for y in YEARS): return False   # 지난해 공고 제외
    hit["year"] = hit_year(hit, YEARS)
    if hit["year"] is None: return False
    if region and not all(tok.replace(" ", "") in t for tok in region_tokens(region)): return False
    return True

def main():
    now = datetime.now(KST)
    cutoff = (now - timedelta(days=MAX_AGE_DAYS)).isoformat()
    regions = load("regions.json")["regions"]
    data = load("data.json")
    YEARS[:] = target_years(now, data)
    print("target years:", YEARS)
    known = {u.split("#")[0] for e in data["items"] for u in [e.get("url")] + e.get("sources", []) if u}
    old_cov = load("coverage.json", {}) or {}
    old_cand = {c["link"]: c for c in (load("candidates.json", {}) or {}).get("items", [])}

    nv, gg = Naver(), GoogleNews()
    engines = [e for e in (nv, gg) if e.ok]
    print("engines:", [e.name for e in engines])
    cands = {}
    cov = {str(y): {} for y in YEARS}
    old_years = old_cov.get("years", {})

    def keep(hit, region_id, q):
        if not hit["link"] or hit["link"].split("#")[0] in known: return
        k = re.sub(r"[^가-힣a-z0-9]", "", hit["title"].lower())[:48]
        if k in cands: return
        sido, name = (region_id.split("|") if region_id else ("", ""))
        cands[k] = dict(hit, keyword=q, region=region_id or "", sido=sido, sigungu=name, year=hit.get("year"),
                        gov=bool(re.search(r"\.go\.kr", hit["link"])),
                        first_seen=old_cand.get(hit["link"], {}).get("first_seen", now.isoformat(timespec="seconds")))

    # 1) 전국 단위 연관검색어
    for q in KW["national_queries"]:
        for eng in engines:
            hits, _ = eng.search(q if eng is nv else f"{q} when:60d")
            for h in hits:
                if not relevant(h, None, cutoff): continue
                t = h["title"] + h["desc"]
                r = next((r for r in regions if all(tok in t for tok in region_tokens(r))), None)
                keep(h, r["id"] if r else None, q)

    # 2) 230개 지자체 전수 점검
    dev_or = " OR ".join(f'"{w}"' for w in ["음식물처리기", "감량기", "음식물 처리기", "음식물폐기물", "소형감량기"])
    for i, r in enumerate(regions):
        engines_st, all_hits = {}, []
        any_ok = False
        for eng in engines:
            found, failed_all = [], True
            qs = [tpl.format(q=r["q"]) for tpl in KW["region_queries"]] if eng is nv else \
                 [f'"{r["q"]}" ({dev_or}) (보조금 OR 지원금 OR 지원) when:180d']
            for q in qs:
                hits, failed = eng.search(q)
                failed_all = failed_all and failed
                for h in hits:
                    if relevant(h, r, cutoff):
                        found.append(h); keep(h, r["id"], q)
            if failed_all:
                engines_st[eng.name] = "error"; continue
            any_ok = True
            engines_st[eng.name] = "ok"
            all_hits += [dict(h, engine=eng.name) for h in found]
        for y in YEARS:                                   # 사업연도별로 따로 기록
            ys = str(y)
            prev = old_years.get(ys, {}).get("regions", {}).get(r["id"])
            if not any_ok:                                # 이번에 못 봤으면 이전 결과 유지
                if prev: cov[ys][r["id"]] = dict(prev, stale=True)
                continue
            hy = [h for h in all_hits if h.get("year") == y]
            hits = sorted({h["link"]: h for h in hy}.values(), key=lambda h: h["published"] or "", reverse=True)
            domains = {urllib.parse.urlparse(h["link"]).netloc for h in hits}
            oks = [n for n, v in engines_st.items() if v == "ok"]
            found_by = {h["engine"] for h in hy}
            cov[ys][r["id"]] = dict(
                checked_at=now.isoformat(timespec="seconds"),
                engines={n: {"status": v, "n": len({h["link"] for h in hy if h["engine"] == n})} for n, v in engines_st.items()},
                signal="found" if hits else "none", n=len(hits),
                gov=any(".go.kr" in d for d in domains),
                # 더블체크: 감지 → 서로 다른 출처 2곳 이상(또는 두 경로 모두 감지) / 미감지 → 두 경로 모두 정상 0건
                double=(len(domains) >= 2 or len(found_by) >= 2) if hits else (len(oks) >= 2),
                hits=[{k: h[k] for k in ("title", "link", "published", "via")} for h in hits[:5]])
        if i % 20 == 0: print(f"{i+1}/{len(regions)} {r['q']} → " + ", ".join(f"{y}:{cov[str(y)].get(r['id'],{}).get('n','-')}" for y in YEARS))

    items = sorted(cands.values(), key=lambda x: x["published"] or "", reverse=True)[:300]
    years_out = {k: v for k, v in old_years.items()}          # 점검 대상이 아닌 해(지난해)는 마지막 결과 보존
    for y in YEARS: years_out[str(y)] = {"updated_at": now.isoformat(timespec="seconds"), "regions": cov[str(y)]}
    meta = {"updated_at": now.isoformat(timespec="seconds"), "target_years": YEARS,
            "engines": {e.name: {"calls": e.calls, "errors": e.errors} for e in (nv, gg)},
            "naver_enabled": nv.ok, "regions_total": len(regions)}
    json.dump(dict(meta, years=years_out), open(os.path.join(ROOT, "coverage.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    json.dump({"updated_at": meta["updated_at"], "keywords": KW["national_queries"], "items": items},
              open(os.path.join(ROOT, "candidates.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for y in YEARS:
        c = cov[str(y)]; found = sum(1 for v in c.values() if v.get("signal") == "found")
        print(f"[{y}] checked {len(c)}/{len(regions)} regions · found {found}")
    print(f"candidates {len(items)} · {meta['engines']}")

if __name__ == "__main__":
    main()
