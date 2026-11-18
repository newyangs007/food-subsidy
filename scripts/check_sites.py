# -*- coding: utf-8 -*-
"""지자체 공식 누리집 더블체크 → site_check.json  (GitHub Actions에서 2시간마다)

공고가 있는 모든 지자체의 공식 누리집을 실제로 열어
  1) 접속(HTTP 200)  2) 페이지에 해당 지자체 이름이 있는지(엉뚱한 사이트 연결 방지)
  3) 하단의 대표전화 번호
를 확인합니다. 바로가기 공고문이 없거나 접속 불가일 때 이 누리집과 대표번호를 씁니다.
해외 서버에서 막히는 누리집은 이전 결과(브라우저로 직접 확인한 값 포함)를 유지합니다.
"""
import json, os, re, sys, ssl, html, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HOME = {
 "서울|강남구": "https://www.gangnam.go.kr/", "서울|강동구": "https://www.gangdong.go.kr/", "서울|강북구": "https://www.gangbuk.go.kr/",
 "서울|강서구": "https://www.gangseo.seoul.kr/", "서울|관악구": "https://www.gwanak.go.kr/", "서울|광진구": "https://www.gwangjin.go.kr/",
 "서울|구로구": "https://www.guro.go.kr/", "서울|금천구": "https://www.geumcheon.go.kr/", "서울|도봉구": "https://www.dobong.go.kr/",
 "서울|동대문구": "https://www.ddm.go.kr/", "서울|동작구": "https://www.dongjak.go.kr/", "서울|마포구": "https://www.mapo.go.kr/",
 "서울|서대문구": "https://www.sdm.go.kr/", "서울|서초구": "https://www.seocho.go.kr/", "서울|성동구": "https://www.sd.go.kr/",
 "서울|성북구": "https://www.sb.go.kr/", "서울|송파구": "https://www.songpa.go.kr/", "서울|양천구": "https://www.yangcheon.go.kr/",
 "서울|영등포구": "https://www.ydp.go.kr/", "서울|용산구": "https://www.yongsan.go.kr/", "서울|은평구": "https://www.ep.go.kr/",
 "서울|중구": "https://www.junggu.seoul.kr/", "서울|중랑구": "https://www.jungnang.go.kr/",
 "부산|강서구": "https://www.bsgangseo.go.kr/", "부산|금정구": "https://www.geumjeong.go.kr/", "부산|기장군": "https://www.gijang.go.kr/",
 "부산|동구": "https://www.bsdonggu.go.kr/", "부산|동래구": "https://www.dongnae.go.kr/", "부산|부산진구": "https://www.busanjin.go.kr/",
 "부산|사상구": "https://www.sasang.go.kr/", "부산|서구": "https://www.bsseogu.go.kr/", "부산|수영구": "https://www.suyeong.go.kr/",
 "부산|연제구": "https://www.yeonje.go.kr/", "부산|영도구": "https://www.yeongdo.go.kr/", "부산|중구": "https://www.bsjunggu.go.kr/",
 "부산|해운대구": "https://www.haeundae.go.kr/",
 "인천|강화군": "https://www.ganghwa.go.kr/", "인천|남동구": "https://www.namdong.go.kr/", "인천|미추홀구": "https://www.michuhol.go.kr/",
 "인천|부평구": "https://www.icbp.go.kr/", "인천|서해구": "https://www.seohae.go.kr/", "인천|연수구": "https://www.yeonsu.go.kr/",
 "인천|옹진군": "https://www.ongjin.go.kr/", "인천|제물포구": "https://www.jemulpo.go.kr/",
 "대전|대덕구": "https://www.daedeok.go.kr/", "대전|동구": "https://www.donggu.go.kr/", "대전|서구": "https://www.seogu.go.kr/",
 "대전|유성구": "https://www.yuseong.go.kr/", "대전|중구": "https://www.djjunggu.go.kr/",
 "대구|동구": "https://dong.daegu.kr/", "대구|북구": "https://www.buk.daegu.kr/", "대구|수성구": "https://www.suseong.kr/",
 "경기|남양주시": "https://www.nyj.go.kr/", "경기|동두천시": "https://www.ddc.go.kr/", "경기|포천시": "https://www.pocheon.go.kr/",
 "강원|동해시": "https://www.dh.go.kr/", "강원|삼척시": "https://www.samcheok.go.kr/", "강원|양구군": "https://www.yanggu.go.kr/",
 "강원|영월군": "https://www.yw.go.kr/", "강원|철원군": "https://www.cwg.go.kr/", "강원|평창군": "https://www.pc.go.kr/",
 "충북|진천군": "https://www.jincheon.go.kr/", "충북|청주시": "https://www.cheongju.go.kr/",
 "충남|계룡시": "https://www.gyeryong.go.kr/", "충남|부여군": "https://www.buyeo.go.kr/", "충남|청양군": "https://www.cheongyang.go.kr/",
 "전남광주|영광군": "https://www.yeonggwang.go.kr/", "전남광주|함평군": "https://www.hampyeong.go.kr/", "전남광주|해남군": "https://www.haenam.go.kr/",
 "경북|경산시": "https://www.gbgs.go.kr/", "경북|경주시": "https://www.gyeongju.go.kr/", "경북|구미시": "https://www.gumi.go.kr/",
 "경북|안동시": "https://www.andong.go.kr/", "경북|울릉군": "https://www.ulleung.go.kr/", "경북|울진군": "https://www.uljin.go.kr/",
 "경북|포항시": "https://www.pohang.go.kr/",
 "경남|거창군": "https://www.geochang.go.kr/", "경남|고성군": "https://www.goseong.go.kr/", "경남|김해시": "https://www.gimhae.go.kr/",
 "경남|남해군": "https://www.namhae.go.kr/", "경남|산청군": "https://www.sancheong.go.kr/", "경남|의령군": "https://www.uiryeong.go.kr/",
 "경남|창녕군": "https://www.cng.go.kr/", "경남|통영시": "https://www.tongyeong.go.kr/",
}

# 지자체 대표번호 — 각 지자체 공식 누리집 하단/전화번호 안내 페이지에서 직접 확인(2026-11-18).
# 자동 추출값과 다르면 이 값을 우선합니다(자동 추출은 페이지 구조에 따라 다른 번호를 잡을 수 있음).
REP_PHONE = {
 "서울|강남구": "02-3423-5114", "서울|구로구": "02-860-2114", "서울|광진구": "02-450-1114", "서울|동작구": "02-820-1114",
 "서울|용산구": "02-2199-6114", "서울|은평구": "02-351-6114", "서울|강서구": "02-2600-6114", "서울|강북구": "02-901-6114",
 "서울|중구": "02-3396-4114", "서울|성동구": "02-2286-5114",
 "부산|강서구": "051-970-4000", "부산|금정구": "051-519-4000", "부산|기장군": "051-709-4000", "부산|동구": "051-440-4000",
 "부산|동래구": "051-550-4000", "부산|부산진구": "051-605-4000", "부산|서구": "051-240-4000", "부산|영도구": "051-419-4000",
 "부산|중구": "051-600-4000", "부산|해운대구": "051-749-4000", "부산|연제구": "051-665-4000", "부산|사상구": "051-310-4000",
 "인천|강화군": "032-930-3114", "인천|부평구": "032-504-2114",
 "대전|동구": "042-251-4114", "대전|서구": "042-288-2114", "대전|유성구": "042-611-2114",
 "대구|북구": "053-665-2000", "대구|수성구": "053-666-2000",
 "경기|남양주시": "031-590-2114", "경기|포천시": "031-538-2114",
 "강원|동해시": "033-530-2114", "강원|양구군": "033-481-2191", "강원|영월군": "1577-0545",
 "충북|진천군": "043-539-3114",
 "전남광주|영광군": "061-350-5114", "전남광주|해남군": "061-530-5114",
 "경북|경산시": "053-811-2231", "경북|울릉군": "054-791-2191", "경북|포항시": "054-270-8282",
 "경남|고성군": "055-670-2114", "경남|산청군": "055-970-6000", "경남|의령군": "055-570-2114",
}

PHONE = r"(0(?:2|[3-6][1-5]))\s*[-.)]?\s*(\d{3,4})\s*[-.]\s*(\d{4})"
REP = re.compile(r"(대표\s*전화|대표\s*번호|대표\s*TEL|TEL|Tel|tel|전화|☎)\s*[:：.]?\s*(\(?\s*)" + PHONE)
CTX = ssl.create_default_context()
LAX = ssl.create_default_context(); LAX.check_hostname = False; LAX.verify_mode = ssl.CERT_NONE

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36",
                                               "Accept-Language": "ko-KR,ko;q=0.9"})
    for c in (CTX, LAX):
        try:
            with urllib.request.urlopen(req, timeout=25, context=c) as r:
                return r.status, r.read(4_000_000), r.headers.get("Content-Type", ""), r.geturl()
        except ssl.SSLError:
            continue
    raise OSError("ssl")

def text_of(raw, ct):
    m = re.search(r"charset=([\w-]+)", ct) or re.search(rb'charset=["\']?([\w-]+)', raw[:5000])
    enc = (m.group(1).decode() if m and isinstance(m.group(1), bytes) else (m.group(1) if m else None))
    for e in [enc, "utf-8", "euc-kr", "cp949"]:
        if not e: continue
        try: s = raw.decode(e); break
        except Exception: pass
    else: s = raw.decode("utf-8", "ignore")
    s = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s)))

def main():
    path = os.path.join(ROOT, "site_check.json")
    try: old = json.load(open(path, encoding="utf-8")).get("sites", {})
    except Exception: old = {}
    now = datetime.now(KST).isoformat(timespec="seconds")
    out, summ = {}, {"ok": 0, "unreach": 0, "mismatch": 0}
    for rid, url in HOME.items():
        sido, name = rid.split("|")
        r = {"home": url}
        try:
            st, raw, ct, final = get(url)
            t = text_of(raw, ct)
            title = (re.search(r"(?is)<title[^>]*>(.*?)</title>", raw.decode("utf-8", "ignore")) or [None, ""])[1].strip()[:80]
            short = re.sub(r"(특별자치시|광역시|특별시|시|군|구)$", "", name) or name
            match = name in t or short in title or name in title
            reps = []
            for m in REP.finditer(t[-6000:]):                 # 대표번호는 페이지 하단에 있음
                n = f"{m.group(3)}-{m.group(4)}-{m.group(5)}"
                if n not in reps: reps.append((m.group(1), n))
            rep = next((n for k, n in reps if "대표" in k), None) or (reps[0][1] if reps else None)
            r.update(state="ok" if (st == 200 and match) else "mismatch", http=st, title=title, name_match=match,
                     rep_phone=REP_PHONE.get(rid), auto_phone=rep, phones=[n for _, n in reps][:4], checked_at=now)
        except Exception as ex:
            prev = old.get(rid)
            r = dict(prev, stale=True, last_error=str(ex)[:100], rep_phone=REP_PHONE.get(rid)) if prev and prev.get("state") == "ok" else \
                dict(r, state="unreach", error=str(ex)[:100], checked_at=now, rep_phone=REP_PHONE.get(rid))
        out[rid] = r; summ[r["state"]] = summ.get(r["state"], 0) + 1
        print(f"{r['state']:8} {rid:14} {r.get('rep_phone')}  {r.get('title','')[:40]}")
    json.dump({"updated_at": now, "summary": summ, "sites": out}, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("site check:", summ)

if __name__ == "__main__":
    main()
