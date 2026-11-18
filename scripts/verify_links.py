# -*- coding: utf-8 -*-
"""공고문 바로가기 링크 더블체크 → link_check.json  (GitHub Actions에서 2시간마다)

data.json 의 모든 공고 링크(url)를 실제로 열어 확인합니다.
  1) 접속: HTTP 200 으로 열리는지
  2) 내용: 본문에 '음식물' + (처리기|감량기|소멸기) 가 있는지 → 링크와 공고 내용이 맞는지
  3) 연도: 사업연도(2026 등) 표기가 있는지
  4) 기관: 공공기관 도메인(.go.kr / .kr 지자체)인지 — 블로그·카페·뉴스는 바로가기로 쓰지 않음
  5) 전화: 본문에서 담당부서 전화번호(문의·담당·연락처 주변)를 뽑아 data.json 의 번호와 대조

결과 판정
  ok      : 접속 + 내용 일치
  mismatch: 접속은 되지만 음식물처리기 내용이 없음(삭제·다른 글로 바뀜) → 화면에서 링크 숨김
  gone    : 404/410 → 화면에서 링크 숨김
  unreach : 네트워크 차단·시간 초과(해외 서버에서 막히는 지자체가 있음) → 이전 판정 유지
"""
import json, os, re, sys, ssl, html, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEVICE = re.compile(r"음식물.{0,12}(처리기|감량기|소멸기|처리 기기|감량 기기)|감량기")
PHONE = re.compile(r"(?<!\d)(0(?:2|[3-6][1-5]|70))[-.)\s]?(\d{3,4})[-.\s](\d{4})(?!\d)")
NEAR = re.compile(r"(문의|담당|연락처|전화|☎|TEL|Tel|tel)")
OFFICIAL = re.compile(r"(\.go\.kr|\.seoul\.kr|\.daegu\.kr|suseong\.kr)(/|$|:)")

CTX = ssl.create_default_context()
CTX_LAX = ssl.create_default_context(); CTX_LAX.check_hostname = False; CTX_LAX.verify_mode = ssl.CERT_NONE  # 일부 지자체 인증서 체인 불완전

def get(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9"})
    for ctx in (CTX, CTX_LAX):
        try:
            with urllib.request.urlopen(req, timeout=25, context=ctx) as r:
                raw, ct = r.read(3_000_000), r.headers.get("Content-Type", "")
                return r.status, raw, ct
        except urllib.error.HTTPError as ex:
            return ex.code, b"", ""
        except ssl.SSLError:
            continue
    raise OSError("ssl")

def text_of(raw, ct):
    enc = (re.search(r"charset=([\w-]+)", ct) or re.search(rb'charset=["\']?([\w-]+)', raw[:4000]) or [None, None])[1]
    enc = enc.decode() if isinstance(enc, bytes) else enc
    for e in [enc, "utf-8", "euc-kr", "cp949"]:
        if not e: continue
        try: s = raw.decode(e); break
        except Exception: pass
    else: s = raw.decode("utf-8", "ignore")
    s = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s)))

def phones(t):
    out = []
    for m in PHONE.finditer(t):
        n = f"{m[1]}-{m[2]}-{m[3]}"
        near = bool(NEAR.search(t[max(0, m.start() - 40):m.start()]))
        out.append((not near, n))
    seen, res = set(), []
    for _, n in sorted(out, key=lambda x: x[0]):
        if n not in seen: seen.add(n); res.append(n)
    return res[:6]

def digits(s): return re.sub(r"\D", "", s or "")

DEPT = re.compile(r"(담당자?\s*/?\s*연락처|담당자|연락처|문의처?|문\s*의|전화번호)[^0-9]{0,25}?" +
                  r"(0(?:2|[3-6][1-5]))\s*[-.)]?\s*(\d{3,4})\s*[-.]\s*(\d{4})")
def dept_phone(t):
    """공고 본문에서 '담당·문의·연락처' 바로 뒤에 적힌 번호(대표전화·팩스 제외)"""
    for m in DEPT.finditer(t):
        before = t[max(0, m.start() - 12):m.start()]
        if re.search(r"(대표|FAX|팩스|Fax)", before + m.group(0)[:len(m.group(1)) + 8]): continue
        return f"{m.group(2)}-{m.group(3)}-{m.group(4)}"
    return None

def date_marks(d):
    """'2026-03-16' → 본문에서 찾을 날짜 표기들"""
    if not d: return None
    y, mo, da = d.split("-"); mo, da = int(mo), int(da)
    return re.compile(rf"(?<!\d)0?{mo}\s*[.월/-]\s*0?{da}(?!\d)")

def main():
    data = json.load(open(os.path.join(ROOT, "data.json"), encoding="utf-8"))
    path = os.path.join(ROOT, "link_check.json")
    try: old = json.load(open(path, encoding="utf-8")).get("links", {})
    except Exception: old = {}
    now = datetime.now(KST).isoformat(timespec="seconds")
    res, summary = {}, {"ok": 0, "mismatch": 0, "gone": 0, "unreach": 0, "not_official": 0}
    targets = []
    for e in data["items"]:
        for u in [e.get("url")] + list(e.get("sources", [])):
            if u and OFFICIAL.search(u) and u not in [x[0] for x in targets]: targets.append((u, e))
    for u, e in targets:
        r = {"region": f"{e['sido']}|{e['sigungu']}", "year": e.get("year"), "official": bool(OFFICIAL.search(u))}
        if not r["official"]:
            r.update(state="not_official", checked_at=now); res[u] = r; summary["not_official"] += 1; continue
        try:
            st, raw, ct = get(u)
            if st in (404, 410): r.update(state="gone", http=st)
            elif st != 200: raise OSError(f"http {st}")
            else:
                t = text_of(raw, ct)
                dev = bool(DEVICE.search(t))
                yr = str(e.get("year", "")) in t or str(e.get("year", 0) - 1)[2:] + "년" in t
                ph = phones(t)
                listed = digits(e.get("phone", "").split("(")[0])
                dm = date_marks(e.get("start"))
                r.update(dept_phone=dept_phone(t), date_match=bool(dm and dm.search(t)))
                r.update(state="ok" if dev else "mismatch", http=st, device=dev, year_mark=yr, phones=ph,
                         phone_listed=e.get("phone") or "", phone_in_page=bool(listed and any(digits(p) == listed for p in ph)))
            r["checked_at"] = now
        except Exception as ex:
            prev = old.get(u)
            r = dict(prev, stale=True, last_error=str(ex)[:120]) if prev and prev.get("state") != "unreach" else \
                dict(r, state="unreach", error=str(ex)[:120], checked_at=now)
        res[u] = r
        summary[r["state"]] = summary.get(r["state"], 0) + 1
        print(f"{r['state']:9} {r['region']:12} {u[:90]}")
    json.dump({"updated_at": now, "summary": summary, "links": res}, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("link check:", summary)

if __name__ == "__main__":
    main()
