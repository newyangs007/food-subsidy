# -*- coding: utf-8 -*-
"""검증된 2026년 지자체 음식물처리기(가정용 소형감량기) 보조금 데이터 → data.json
verify 등급
  official : 지자체 공식 공고/홈페이지 본문을 직접 확인
  news     : 언론 보도(구청 보도자료 기반)로 확인
  secondary: 공식 공고 링크는 확보했거나 민간 집계 사이트에서만 확인 → 전화 확인 권장
"""
import json, sys
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
VERIFIED_AT = "2026-11-18"
FWS = "https://foodwastesubsidy.kr/"
JAB = "https://jab-guyver.co.kr/7817"

E = []
def add(sido, sgg, start, end, rate, maxwon, year=2026, **kw):
    """year: 사업연도. 2027년 공고는 add(..., year=2027)로 추가하면 2027년 화면에 따로 표시됩니다."""
    e = dict(year=year, sido=sido, sigungu=sgg, start=start, end=end, rate=rate, max=maxwon)
    e.update(kw)
    e.setdefault("verify", "secondary")
    e.setdefault("closed", False)
    e.setdefault("target", "")
    e.setdefault("docs", "")
    e.setdefault("how", "")
    e.setdefault("phone", "")
    e.setdefault("url", "")
    e.setdefault("sources", [])
    e.setdefault("note", "")
    e.setdefault("round", "")
    e.setdefault("posted", "")
    e.setdefault("force", "")
    e["verified_at"] = VERIFIED_AT
    E.append(e)

# ───────────── 서울 ─────────────
add("서울", "서초구", "2026-11-09", "2026-11-20", 30, 21, round="추가모집", posted="2026-11-03",
    verify="official", notice="서초구 공고 제2026-2207호",
    target="2026년 가정용 소형감량기를 구매했거나 구매 예정인 서초구민 · 100세대 내외(예산 범위), 접수 마감 후 접수순 선정",
    docs="구매 보조금 신청서(서식1), 주민등록등본 · 선정 후 구매 증빙자료(서식2)·준수사항 서약서(서식3)·사용실적(서식4)",
    how="전자우편(foodwr99@seocho.go.kr) 또는 청소행정과 방문(평일 09–18시, 점심시간 제외)",
    phone="02-2155-6746",
    url="https://eminwon.seocho.go.kr/emwp/gov/mogaha/ntis/web/ofr/action/OfrAction.do?jndinm=OfrNotAncmtEJB&context=NTIS&method=selectOfrNotAncmt&methodnm=selectOfrNotAncmtRegst&homepage_pbs_yn=Y&subCheck=Y&not_ancmt_mgt_no=46456")
add("서울", "서초구", "2026-06-01", "2026-06-19", 30, 21, round="상반기",
    url="https://www.seocho.go.kr/site/seocho/ex/bbs/View.do?bcIdx=409216&cbIdx=57", sources=[JAB, FWS])
add("서울", "강남구", "2026-10-12", "2026-10-16", 50, 35, round="하반기",
    target="강남구민(세부 조건은 공고문)", sources=["https://www.make2t.kr/2026/10/seoul-food-waste-disposer-subsidy-2026.html", FWS])
add("서울", "강동구", "2026-10-05", "2026-10-23", 30, 20, verify="official", posted="2026-09-30",
    note="기초생활수급자·차상위·한부모가족 20세대는 50%, 최대 35만원",
    target="2026.1.1 이후 KC 안전인증 + 품질인증(K·Q마크 등) 소형감량기를 구매한 강동구민 · 일반 140세대(추첨) + 취약계층 20세대",
    how="강동구청 누리집 온라인 신청", phone="02-3425-5860",
    url="https://www.gangdong.go.kr/web/newportal/bbs/b_068/157730",
    sources=["https://www.gangdong.go.kr/web/newportal/press/15506"])
add("서울", "마포구", "2026-10-26", "2026-10-30", 30, 17.5, verify="news",
    target="공고일 기준 2년 이상 연속 거주, 2026.1.1 이후 구매·구매예정 · 100세대 전자추첨(4인 이상 30세대 우선) · 디스포저 제외",
    docs="(선정 후 2주 내) 구매영수증, 제품 인증자료, 설치 사진, 본인 명의 통장 사본",
    how="마포구청 청소행정과 방문 또는 전자우편",
    url="https://biz.heraldcorp.com/article/10915096",
    sources=["https://www.dailian.co.kr/news/view/1706054/%EC%84%9C%EC%9A%B8-%EB%A7%88%ED%8F%AC%EA%B5%AC-%EC%9D%8C%EC%8B%9D%EB%AC%BC-%EC%86%8C%ED%98%95%EA%B0%90%EB%9F%89%EA%B8%B0-%EA%B5%AC%EB%A7%A4%EB%B9%84-2026", "https://www.sijung.co.kr/news/articleView.html?idxno=439817"])
add("서울", "은평구", "2026-09-29", "2026-10-02", 30, 21, notice="은평구 공고 제2026-1655호",
    url="https://www.ep.go.kr/www/selectEminwonView.do?pageUnit=10&pageIndex=1&searchCnd=notAncmtSj&searchKrwd=%EC%9D%8C%EC%8B%9D%EB%AC%BC&key=754&notAncmtMgtNo=50503&notAncmtSeCode=01",
    sources=[JAB, "https://mobile.newsis.com/view/NISX20260716_0003712164"])
add("서울", "양천구", "2026-08-18", "2026-09-01", 30, 21, round="하반기", verify="news",
    url="https://mbiz.heraldcorp.com/article/10832359", sources=[FWS])
add("서울", "양천구", "2026-03-30", "2026-04-17", 30, 21, round="상반기", verify="official",
    target="공고일(3.9.) 기준 양천구 주민등록, 2026.1.1 이후 구매·구매예정 · 250대 추첨",
    how="양천구 통합예약포털 온라인 또는 청소행정과 방문", phone="02-2620-3441",
    url="https://www.yangcheon.go.kr/reservation/reservation/ex/reservationEtc/reservationView.do?riIdx=RI001960")
add("서울", "강서구", "2026-05-18", "2026-05-22", 30, 21, verify="news",
    target="공고일 기준 6개월 이상 거주 · 추첨(4인 이상·RFID 미설치 주택 30% 우선) · 1~5kg/일 건조·분쇄·미생물 방식, 품질인증+KC",
    how="방문 또는 이메일", url="https://biz.heraldcorp.com/article/10737456")
add("서울", "관악구", "2026-03-24", "2026-04-10", 30, 21, verify="official", notice="관악구 공고 제2026-622호",
    target="2026년 구매·구매예정 관악구민 · 4인 이상 가구 우선 후 접수순 · 렌탈·중고·디스포저 제외",
    docs="지원 신청서·개인정보 제공동의서, 주민등록등본 · 선정 후 보조금 신청서·구매 증빙, 사용실적·만족도 조사",
    how="관악구청 청소행정과 방문",
    url="https://www.gwanak.go.kr/site/gwanak/ex/bbsNew/View.do?not_ancmt_mgt_no=40515&typeCode=1",
    sources=["https://www.heraldk.com/article/2026031900301635792"])
add("서울", "성북구", "2026-04-13", "2026-04-20", 50, 21, verify="official", notice="성북구 공고 제2026-594호",
    target="품질인증 제품을 구매·설치한 성북구민 · 274대 · 세대원 많은 순 우선 · '22~'25년 수혜 세대 제외",
    docs="보조금 신청서, 영수증, 설치사진, 명판사진",
    how="성북통합예약포털 온라인 또는 청소행정과·주민센터 방문",
    url="https://www.sb.go.kr/www/selectBbsNttView.do?key=6350&bbsNo=41&nttNo=9579819")
add("서울", "송파구", "2026-03-16", "2026-04-03", 30, 21, verify="official", notice="송파구 공고 제2026-334호",
    target="2026년 소형감량기를 구매한 송파구민 · 166대(4인 이상 130대 우선)",
    docs="지원신청서, 인증제품 구매 증빙(설치사진 등), 사용실적서",
    url="https://www.songpa.go.kr/www/selectGosiData.do?not_ancmt_mgt_no=32146&searchCnd=SJ&searchKrwd=%EC%9D%8C%EC%8B%9D%EB%AC%BC&pageIndex=1&key=2776")
add("서울", "도봉구", "2026-03-16", "2026-04-24", 30, 21, verify="official",
    target="소형감량기를 구매한 도봉구민 · 100대",
    docs="보조금 지원 신청서 및 구비서류", how="동 주민센터 방문 또는 자원순환센터 등기우편",
    url="https://m.dobong.go.kr/majorWork/MajorView.asp?rmode=M&rcode=742&lidx=652")
add("서울", "성동구", "2026-03-20", "2026-04-08", 30, 21, verify="official",
    target="공고일 현재 성동구 주민등록 · 300대 선착순 · 2026.1.1 이후 구매 · 사용실적(전·후 각 2개월) 제출 세대",
    how="동 주민센터 방문 또는 성동구 신속예약 온라인",
    url="https://www.sd.go.kr/booking/contents.do?key=5364")
add("서울", "금천구", "2026-04-13", "2026-04-17", 30, 21, verify="official",
    note="법정 복지대상자는 50%, 최대 35만원(별도 모집)",
    target="2026.1.1 이후 품질인증+KC 제품 구매·구매예정 금천구민 60세대 선착순 · 2년 내 처분 시 환수",
    docs="보조금 신청서, 개인정보 제공동의서(스캔본) · 선정 후 구매 증빙, 사용 전·후 배출량·설문",
    how="금천구청 홈페이지 게시판 제출", phone="02-2627-1493",
    url="https://www.geumcheon.go.kr/portal/contents.do?key=4622")
add("서울", "서대문구", "2026-03-10", None, 30, 21, verify="news", closed=True,
    target="공고일 기준 서대문구 주민등록, 2026.1.1 이후 구매·구매예정 · 530세대 접수순 · 디스포저 제외",
    note="예산 소진으로 접수 마감",
    url="https://m.news.nate.com/view/20260306n19473")
add("서울", "중구", "2026-03-03", "2026-03-31", 30, 21, verify="news",
    target="2026.1.1 이후 구매·구매예정 중구민 · 약 100세대(거주기간·가구원 수 우선) · 1~5kg 가열·건조·미생물 방식",
    how="관할 동 주민센터 방문 또는 이메일·팩스",
    url="https://www.heraldk.com/article/2026031221203832670", sources=[FWS])
add("서울", "동대문구", "2026-03-16", "2026-03-27", 30, 21, verify="news",
    target="175대 · 4인 이상 가구 우선 후 접수순", docs="공고일 이후 발급 주민등록등본(PDF)",
    how="동대문구 온라인 접수", url="https://www.heraldk.com/article/2026030322583927937", sources=[FWS])
add("서울", "강북구", "2026-03-16", "2026-04-30", 30, 21, verify="news",
    target="공고일 기준 강북구 주민등록 세대(아파트 포함) · 250세대 선착순 · '22~'25 수혜 세대 제외",
    how="강북구청 청소행정과 방문 또는 이메일", url="https://m.news.nate.com/view/20260316n31043")
add("서울", "영등포구", "2026-05-18", "2026-05-22", 30, 15,
    url="https://www.ydp.go.kr/www/selectBbsNttView.do?bbsNo=40&nttNo=414009&&pageUnit=10&key=2848&pageIndex=1", sources=[JAB, FWS])
add("서울", "구로구", "2026-03-16", "2026-04-03", 30, 20, notice="구로구 공고 제2026-428호",
    url="https://www.guro.go.kr/www/selectBbsNttGosiView.do?bbsNo=663&nttNo=49602&rowNum=147&&pageUnit=10&searchCnd=SJ&searchKrwd=%EC%9D%8C%EC%8B%9D%EB%AC%BC&key=1791&pageIndex=1", sources=[FWS])
add("서울", "광진구", "2026-04-06", "2026-04-24", 30, 21, notice="광진구 공고 제2026-460호",
    url="https://www.gwangjin.go.kr/portal/bbs/B0000378/view.do?notAncmtMgtNo=15924&menuNo=200192&menuNo=200192&noticeType=&searchCnd=&searchWrd=%EC%9D%8C%EC%8B%9D%EB%AC%BC&pageIndex=1", sources=[FWS])
add("서울", "동작구", "2026-03-09", "2026-03-13", 30, 21, sources=[FWS])
add("서울", "중랑구", "2026-03-16", "2026-04-03", 30, 21, sources=[FWS])
add("서울", "용산구", "2026-03-09", None, 30, 21, closed=True, note="예산 소진 시 마감(집계 사이트 기준 종료)", sources=[FWS])

# ───────────── 부산 ─────────────
add("부산", "연제구", "2026-11-09", "2026-11-23", 70, 70, round="재공고", posted="2026-11-06", verify="official",
    notice="연제구 공고 제2026-1358호",
    target="단독주택·150세대 미만 소규모 공동주택 거주 구민(와이파이 가능 세대) · 일반세대 4대",
    docs="공고문 첨부 서식 참조", how="자원순환과 방문 또는 등기우편(11.23. 소인분까지), 평일 10–17시",
    phone="051-665-4000(구 대표)",
    url="https://www.yeonje.go.kr/portal/saeol/gosi/view.do?notAncmtMgtNo=43822&isLinkage=Y&mId=0206030000")
add("부산", "기장군", "2026-11-04", "2026-11-13", 70, 70, notice="기장군 공고 제2026-1971호",
    note="기초생활수급세대 90%, 최대 90만원", url="https://eminwon.gijang.go.kr/emwp/gov/mogaha/ntis/web/ofr/action/OfrAction.do?jndinm=OfrNotAncmtEJB&context=NTIS&method=selectOfrNotAncmt&methodnm=selectOfrNotAncmtRegst&not_ancmt_mgt_no=53035&homepage_pbs_yn=Y&subCheck=Y&ofr_pageSize=10&not_ancmt_se_code=01,02,03,04,05&title=%EA%B3%A0%EC%8B%9C%EA%B3%B5%EA%B3%A0&initValue=Y&countYn=Y&Key=B_Subject", sources=[JAB])
add("부산", "해운대구", "2026-10-27", "2026-11-13", 90, 90, round="저소득층", notice="해운대구 공고 제2026-1430호",
    target="저소득층 세대", url="https://eminwon.haeundae.go.kr/emwp/gov/mogaha/ntis/web/ofr/action/OfrAction.do?jndinm=OfrNotAncmtEJB&context=NTIS&method=selectOfrNotAncmt&methodnm=selectOfrNotAncmtRegst&not_ancmt_mgt_no=54136&homepage_pbs_yn=Y&subCheck=Y&ofr_pageSize=10&not_ancmt_se_code=01,02,03,04,05&title=%EA%B3%A0%EC%8B%9C%EA%B3%B5%EA%B3%A0&initValue=Y&countYn=Y&Key=B_Subject", sources=[JAB])
add("부산", "해운대구", "2026-10-01", "2026-10-16", 70, 70, round="일반", sources=[FWS])
add("부산", "강서구", "2026-09-28", "2026-10-16", 70, 70, round="하반기", note="기초생활수급세대 90%, 최대 90만원",
    url="https://www.bsgangseo.go.kr/portal/board/post/view.do?bcIdx=500&mid=0501010000&idx=409746", sources=[JAB, FWS])
add("부산", "강서구", "2026-02-20", None, 50, 40, round="상반기", verify="news", closed=True,
    target="일반가정 1차 100여 세대(총사업비 4,000만원)", url="https://www.kukinews.com/article/view/kuk202602200242")
add("부산", "수영구", "2026-10-06", "2026-10-23", 70, 70, sources=[FWS])
add("부산", "동래구", "2026-10-19", "2026-10-23", 70, 70, sources=[FWS])
add("부산", "영도구", "2026-09-01", "2026-09-11", 70, 70, sources=[FWS])
add("부산", "중구", "2026-09-07", "2026-09-18", 70, 70, sources=[FWS])
add("부산", "서구", "2026-09-03", "2026-09-17", 70, 70, sources=[FWS])
add("부산", "동구", "2026-08-06", "2026-09-18", 70, 70, note="선정 후 지정 모델 구매",
    sources=[FWS, "https://www.ajd.co.kr/contents/basic-tip/detail/%EC%9D%8C%EC%8B%9D%EB%AC%BC%EC%B2%98%EB%A6%AC%EA%B8%B0_%EC%B6%94%EC%B2%9C_2026_%EA%B0%80%EA%B2%A9%C2%B7%EB%AF%B8%EC%83%9D%EB%AC%BC_%EB%B0%A9%EC%8B%9D%C2%B7%EC%A7%80%EC%9B%90%EA%B8%88%EA%B9%8C%EC%A7%80-94468"])
add("부산", "기장군", "2026-08-24", "2026-09-02", 70, 70, round="상반기", sources=[FWS])
add("부산", "사상구", "2026-08-24", "2026-09-04", 70, 70, sources=[FWS])
add("부산", "부산진구", "2026-08-10", "2026-08-19", 70, 70, sources=[FWS])
add("부산", "금정구", "2026-08-18", "2026-08-31", 70, 70, sources=[FWS])

# ───────────── 인천 (2026.7.1 행정체제 개편 반영) ─────────────
add("인천", "제물포구", "2026-08-03", "2026-12-20", 50, 30, round="하반기", verify="official", posted="2026-07-28",
    notice="제물포구 공고 제2026-741호", note="예산 소진 시 조기 마감(선착순)",
    target="제물포구 주민등록 세대 중 품질인증 가정용 감량기 구입 세대(사업장 제외) · 161대 내외 · 세대당 1대",
    docs="보조금 신청서 및 구비서류(5년 이내 주소변동 포함 주민등록등본), 개인정보 수집·이용 동의서",
    how="자원순환과 재활용팀 방문(사전 유선연락) · 우편(원본) · 메일(dm0311@korea.kr)",
    phone="032-770-6493",
    url="https://www.jemulpo.go.kr/main/bbs/bbsMsgDetail.do?bcd=announce&keyfield=title&msg_seq=13984&pgno=7")
add("인천", "연수구", "2026-02-11", None, 50, 30, notice="연수구 공고 제2026-237호",
    note="예산 소진 시 마감 — 잔여 예산 전화 확인", sources=[JAB, FWS])
add("인천", "옹진군", "2026-01-12", None, 50, 30, notice="옹진군 공고 제2026-37호",
    note="예산 소진 시 마감 — 잔여 예산 전화 확인",
    url="https://www.ongjin.go.kr/open_content/main/eminwon/eminwonAnnounceDetail.do?mgt_no=36267&keyfield=title&keyword=%EC%9D%8C%EC%8B%9D%EB%AC%BC", sources=[JAB, FWS])
add("인천", "남동구", "2026-01-26", None, 50, 30, note="단독주택 1.26.~, 공동주택 2.2.~ 예산 소진 시까지",
    docs="음식물류 폐기물 감량기 설치 보조금 신청서 등",
    sources=["https://dikr.co.kr/2026%EB%85%84-%EC%9D%B8%EC%B2%9C-%EB%82%A8%EB%8F%99%EA%B5%AC-%EC%9D%8C%EC%8B%9D%EB%AC%BC%EC%B2%98%EB%A6%AC%EA%B8%B0-%EC%A7%80%EC%9B%90%EA%B8%88-50%EB%A7%8C%EC%9B%90-%EC%8B%A0%EC%B2%AD-%EC%A0%95/"])
add("인천", "부평구", "2026-06-10", None, 50, 30, closed=True, note="접수 당일 예산 소진",
    url="https://www.icbp.go.kr/bbs/bbsMsgDetail.do?bcd=notice&keyfield=title&msg_seq=37369&pgno=19", sources=[JAB])
add("인천", "서해구", "2026-02-26", None, 50, 30, closed=True, note="구 서구 · 접수 마감",
    url="https://www.seohae.go.kr/open_content/main/community/reserve/foodwaste.jsp", sources=[JAB])
add("인천", "강화군", "2026-01-23", "2026-10-30", 50, 30, sources=[FWS])
add("인천", "미추홀구", "2026-03-04", None, 50, 30, closed=True, sources=[FWS])

# ───────────── 대전 ─────────────
for g, url in [("동구", "https://www.donggu.go.kr/dg/download/viewer/1773986565783/index.html"),
               ("중구", "https://www.djjunggu.go.kr/prog/saeolGosi/GOSI/sub03_06/view.do?notAncmtMgtNo=46738"),
               ("대덕구", "https://daedeok.go.kr/dpt/dpt04/DPT040204_cmmBoardView.do?boardId=DPT_000087&pageIndex=1&ntatcSeq=1103699006"),
               ("서구", ""), ("유성구", "")]:
    add("대전", g, "2026-03-09", "2026-03-13", 70, 70, url=url, note="선정 후 구매", sources=[JAB, FWS])

# ───────────── 대구 ─────────────
add("대구", "동구", "2026-02-02", "2026-05-03", 50, 30, sources=[FWS])
add("대구", "북구", "2026-05-26", "2026-06-10", 50, 30, sources=[FWS])
add("대구", "수성구", "2026-04-20", "2026-04-24", 50, 30, sources=[FWS])

# ───────────── 경기 ─────────────
add("경기", "남양주시", "2026-03-03", "2026-09-30", 50, 30, notice="남양주시 공고 제2026-231호",
    url="https://www.nyj.go.kr/www/selectEminwonWebView.do?sc1=SJ&sa1Join=01;02;04;05&sc2=%EC%9D%8C%EC%8B%9D%EB%AC%BC&key=2492&pk=84814", sources=[JAB, FWS])
add("경기", "포천시", "2026-03-03", "2026-03-27", 50, 20, sources=[FWS])
add("경기", "동두천시", "2026-04-20", "2026-11-30", 50, 30, note="예산 소진 여부 확인 필요", sources=[FWS])

# ───────────── 강원 ─────────────
add("강원", "영월군", "2026-03-17", "2026-04-06", 80, 70, notice="영월군 공고 제2026-428호",
    url="https://www.yw.go.kr/www/selectBbsNttView.do?key=273&bbsNo=17&nttNo=152269&searchCtgry=&searchCnd=SJ&searchKrwd=%EC%9D%8C%EC%8B%9D%EB%AC%BC&pageIndex=1&integrDeptCode=&pageUnit=10", sources=[JAB, FWS])
add("강원", "양구군", "2026-03-16", "2026-04-10", 70, 50, notice="양구군 공고 제2026-372호",
    url="https://www.yanggu.go.kr/user_sub?gfnc=www&pg=1&bk=DVCYN260316095654705&mu_idx=226&bt=rd&pgsize=10&bcd=announcement", sources=[JAB, FWS])
add("강원", "철원군", "2026-04-29", None, 70, 50, note="예산 소진 시 마감 — 잔여 예산 전화 확인", sources=[FWS])
add("강원", "동해시", "2026-03-03", "2026-09-30", 50, 50,
    url="https://www.dh.go.kr/www/selectBbsNttView.do?key=478&bbsNo=87&nttNo=198804&searchCtgry=&searchCnd=SJ&searchKrwd=%ec%9d%8c%ec%8b%9d%eb%ac%bc&integrDeptCode=&pageIndex=1", sources=[JAB, FWS])
add("강원", "삼척시", "2026-01-12", "2026-02-06", 50, 30, sources=[FWS])
add("강원", "평창군", "2026-02-02", "2026-02-27", 80, 50,
    url="https://www.pc.go.kr/portal/government/government-notification?noticeMgrNo=40679", sources=[FWS])

# ───────────── 충북 / 충남 ─────────────
add("충북", "청주시", "2026-02-20", "2026-03-31", 80, 50,
    url="https://www.cheongju.go.kr/www/selectEminwonNoticeView.do?key=281&nowDongGn=&notAncmtSeCd=&notAncmtMgtNo=151645", sources=[JAB, FWS])
add("충북", "진천군", "2026-01-12", "2026-02-13", 60, 50, sources=[FWS])
add("충남", "계룡시", "2026-03-18", "2026-03-31", 50, 20, notice="계룡시 공고 제2026-268호", note="대상자 선정 후 구입한 제품만 인정",
    url="https://gyeryong.go.kr/kr/html/sub03/030102.html?mode=V&mng_no=51ca4857f6802df765919bcd84c4e0ee", sources=[JAB])
add("충남", "부여군", "2026-01-12", "2026-11-30", 50, 35, closed=True, notice="부여군 공고 제2026-55호", note="공고 제목상 사업 종료 확인",
    url="https://www.buyeo.go.kr/html/kr/news/news_040202.html?mode=V&mng_no=1746454&page_size=10&skey=not_ancmt_sj&sval=%EC%9D%8C%EC%8B%9D%EB%AC%BC", sources=[JAB])
add("충남", "청양군", "2026-01-19", "2026-12-18", 50, 30, note="예산 소진 여부 확인 필요", sources=[FWS])

# ───────────── 전남광주 (2026.7.1 통합특별시) ─────────────
add("전남광주", "함평군", "2026-11-02", "2026-11-13", 50, 30, verify="official", posted="2026-10-29",
    notice="함평군 공고 제2026-1255호",
    target="공고일 기준 함평군 주민등록, 구매·구매예정 주민(사업장 제외) · 50세대 이내 · 수거구역 외 세대 우선 · 품질인증 1개 이상",
    phone="061-320-1833",
    url="https://www.hampyeong.go.kr/pg/GosiDetail.do?SEQ=32876&pageId=www273&listGubun=&notAncmtSeCode=01,02,03,04&search_Type=&search_Text=&pageIndex=1",
    sources=["https://www.hampyeong.go.kr/upload/file/work/2026/11.pdf", JAB])
add("전남광주", "영광군", "2026-01-22", "2026-02-27", 80, 56, notice="영광군 공고 제2026-132호",
    url="https://www.yeonggwang.go.kr/bbs/?b_id=gosigonggo&site=headquarter_new&mn=9059&type=view&sc_cate=&per_page=10&start_date=&end_date=&sc_key=subject&sc_word=%EC%9D%8C%EC%8B%9D%EB%AC%BC&bs_idx=27981", sources=[JAB, FWS])
add("전남광주", "해남군", "2026-01-08", "2026-02-04", 50, 30, sources=[FWS])

# ───────────── 경북 ─────────────
add("경북", "안동시", "2026-09-10", "2026-09-28", 50, 50, round="추가모집", verify="official", notice="안동시 고시 제2026-284호",
    target="공고일 현재 주민등록상 안동시민 · 약 40대 선착순 · K·Q마크/환경표지/단체표준 제품",
    docs="신청서(붙임1), 보조금 지급 신청서(붙임2)", phone="054-840-5288",
    url="https://www.andong.go.kr/portal/saeol/gosi/view.do?notAncmtMgtNo=64586&isLinkage=Y&mId=0401020100")
add("경북", "포항시", "2026-01-12", "2026-02-02", 50, 30, verify="official",
    target="감량기 구입 희망 포항시민 · 300대 · 세대당 최초 1대 · 선정기준표 고득점순",
    how="자원순환과 방문, 우편, 팩스",
    url="https://www.pohang.go.kr/portal/saeol/gosi/view.do?notAncmtMgtNo=69633&mid=0202010000")
add("경북", "경산시", "2026-01-19", "2026-01-30", 50, 40, verify="news",
    target="공고일 기준 경산시 주민등록 세대 · 200대 · 선정 이전 구매·렌탈·중고·디스포저 제외",
    how="자원순환과 방문", url="https://news.nate.com/view/20260117n05583")
add("경북", "경산시", "2026-07-06", "2026-07-31", 50, 40, round="2차", sources=[FWS])
add("경북", "구미시", "2026-05-21", None, 50, 30, round="2차 추가", notice="구미시 공고 제2026-1604호",
    target="RFID 종량기 미설치 세대", note="예산 소진 시 마감 — 잔여 예산 전화 확인",
    url="https://www.gumi.go.kr/portal/saeol/gosi/view.do?mid=0401040000&notAncmtMgtNo=71980", sources=[JAB])
add("경북", "경주시", "2026-03-04", "2026-03-10", 50, 30, target="공고일 전일 기준 세대주 · 약 28대",
    url="https://www.gyeongju.go.kr/open_content/ko/page.do?pageNo=1&pagePrvNxt=1&pageRef=0&pageOrder=0&step=258&parm_bod_uid=315110&srchVoteType=-1&parm_mnu_uid=0&srchEnable=1&srchBgpUid=-1&srchKeyword=&srchSDate=1960-01-01&srchColumn=&srchEDate=9999-12-31&mnu_uid=423&", sources=[JAB, FWS])
add("경북", "울진군", "2026-01-08", "2026-01-30", None, None, notice="울진군 공고 제2026-34호",
    note="지원금액 출처 간 불일치(집계 사이트: 50%·최대 40만원) — 공고문 확인",
    url="https://www.uljin.go.kr/index.uljin?menuCd=DOM_000000103002007002&type=view&ancmtMgtNo=33702&searchType=NOT_ANCMT_SJ&keyword=%EC%9D%8C%EC%8B%9D%EB%AC%BC&startPage=1", sources=[JAB])
add("경북", "울릉군", "2026-05-13", "2026-05-26", 60, 50, sources=[FWS])

# ───────────── 2027년 공고는 아래에 year=2027 로 추가 ─────────────
# 예) add("서울", "서초구", "2027-03-02", "2027-03-20", 30, 21, year=2027, verify="official", url="https://...")

# ───────────── 경남 ─────────────
add("경남", "거창군", "2026-01-21", None, None, None, verify="news", force="chk",
    note="2026년 가정용 음식물 감량기 설치 지원사업 시행 보도(1.21.) — 기간·금액은 군청 공고 확인",
    url="https://view.asiae.co.kr/en/article/2026012107493257159")
add("경남", "남해군", "2026-02-09", "2026-11-30", 50, 40, note="예산 소진 여부 확인 필요", sources=[FWS])
add("경남", "창녕군", "2026-01-07", None, 50, 30, note="예산 소진 시 마감 — 잔여 예산 전화 확인", sources=[FWS])
add("경남", "통영시", "2026-01-13", None, 50, 30, notice="통영시 공고 제2026-65호", note="예산 소진 시 마감 — 잔여 예산 전화 확인",
    url="https://www.tongyeong.go.kr/00852/00853/00858.web?amode=view&not_ancmt_mgt_no=49162&sstring=%EC%9D%8C%EC%8B%9D%EB%AC%BC&stype=all&cpage=1", sources=[JAB, FWS])
add("경남", "고성군", "2026-02-25", "2026-10-30", 50, 50, sources=[FWS])
add("경남", "김해시", "2026-01-14", "2026-02-13", 30, 20, sources=[FWS])
add("경남", "산청군", "2026-01-12", None, 50, 40, closed=True, sources=[FWS])
add("경남", "의령군", "2026-04-01", None, 50, 50, closed=True, sources=[FWS])

REG = {r["id"] for r in json.load(open(sys.argv[2], encoding="utf-8"))["regions"]}
for e in E:
    assert f'{e["sido"]}|{e["sigungu"]}' in REG, ("지자체 목록에 없음", e["sido"], e["sigungu"])
for i, e in enumerate(E):
    e["id"] = f"e{i+1:03d}"
    if not e["posted"]:
        e["posted"] = e["start"]

SIDO = [
 ["서울", "서울특별시"], ["부산", "부산광역시"], ["대구", "대구광역시"], ["인천", "인천광역시"],
 ["대전", "대전광역시"], ["울산", "울산광역시"], ["세종", "세종특별자치시"], ["경기", "경기도"],
 ["강원", "강원특별자치도"], ["충북", "충청북도"], ["충남", "충청남도"], ["전북", "전북특별자치도"],
 ["전남광주", "전남광주통합특별시"], ["경북", "경상북도"], ["경남", "경상남도"], ["제주", "제주특별자치도"]]

out = {
  "updated_at": datetime.now(KST).strftime("%Y-%m-%dT%H:%M:%S+09:00"),
  "verified_at": VERIFIED_AT,
  "years": [2026, 2027],
  "default_switch": "2027-01-01T00:00:00+09:00",
  "year_meta": {
    "2026": {"label": "2026년", "verified_at": VERIFIED_AT, "note": "2026년 공고 — 공식 공고·언론·2차 출처 대조 완료분"},
    "2027": {"label": "2027년", "verified_at": None, "note": "2027년 공고 수집 중 — 지자체 공고는 보통 1~3월에 집중됩니다"}
  },
  "sido": SIDO,
  "alias": {},
  "items": E,
}
json.dump(out, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(E), Counter(e["verify"] for e in E))
