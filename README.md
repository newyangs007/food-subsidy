# 전국 음식물처리기 보조금 지도

전국 시·도·시군구의 음식물처리기(가정용 소형감량기) 구매 보조금 공고를 지도·지역 검색으로 찾는 정적 웹사이트입니다.
서버가 필요 없고, GitHub Pages·Netlify·Cloudflare Pages 어디에나 그대로 올릴 수 있습니다.

## 파일 구성
| 파일 | 역할 |
|---|---|
| `index.html` | 홈페이지 (데이터가 내장돼 있어 이 파일 하나만 열어도 동작) |
| `data.json` | 팩트체크한 공고 목록 — 접속할 때마다 캐시 없이 다시 읽음 |
| `products.json` | 지원 대상 인증 제품(브랜드·모델) 목록 |
| `candidates.json` | 자동 감지된 새 공고·보도(검증 대기) |
| `regions.json` | 전국 230개 기초지자체 마스터 목록(2026.11 기준, 누락 방지 기준표) |
| `coverage.json` | 지자체별 자동 점검 결과(마지막 점검 시각·두 검색 경로 결과·더블체크) |
| `keywords.json` | 연관검색어 사전(음식물처리기·음식물폐기물 감량기·소형감량기·보조금·지원금 등) |
| `geo.json` | 지도 경계(통계청 2018 행정경계 기반, 2026 행정구역 개편은 별칭으로 반영) |
| `scripts/build_data.py` | 공고 원본 데이터(여기를 수정 → `data.json` 생성) |
| `scripts/update.py` | 유사 키워드 자동 수집기 |
| `scripts/build_html.py` | JSON을 `index.html`에 내장 |
| `.github/workflows/update.yml` | 2시간마다 전국 자동 점검 실행 |
| `scripts/build_regions.py` | 지자체 목록 생성(행정구역 개편 반영) |

## 누구나 접속할 수 있게 공개하기 (GitHub Pages, 무료)
1. github.com에서 새 저장소(Public)를 만듭니다. 예: `food-subsidy-map`
2. 이 폴더의 파일을 모두 업로드합니다(“Add file → Upload files”, `.github` 폴더 포함).
3. 저장소 **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save
4. 1~2분 뒤 `https://<아이디>.github.io/food-subsidy-map/` 로 누구나 접속할 수 있습니다.
5. **Settings → Actions → General → Workflow permissions**를 `Read and write`로 바꿔야 자동 수집 결과가 저장됩니다.
6. (권장) 네이버 검색 API 키 등록 — 2026.7.31부터 신규 키는 **NAVER API HUB(네이버 클라우드 플랫폼)**에서 발급합니다.
   1) ncloud.com 가입·로그인 → 콘솔 → Services → Application Services → **NAVER API HUB** → 이용 신청
   2) Subscription에서 **검색** API 구독 → Application 등록(검색 API 선택, 이름 입력)
   3) Application 목록에서 **인증 정보** → Client ID / Client Secret 복사
   4) GitHub 저장소 **Settings → Secrets and variables → Actions → New repository secret**에
      `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 이름으로 각각 등록
   (기존 네이버 개발자센터 키도 2027.6.30까지는 그대로 사용 가능 — 수집기가 자동 판별합니다.)
   키가 없어도 Google 뉴스로 점검하지만, 더블체크(두 경로 교차)를 하려면 키 등록이 필요합니다.
7. (선택) 내 도메인 연결: Settings → Pages → Custom domain.

다른 방법: Netlify Drop(app.netlify.com/drop)에 폴더를 끌어다 놓으면 즉시 공개 주소가 생깁니다(자동 수집은 GitHub Actions를 함께 써야 함).

## 실시간 업데이트가 동작하는 방식
- **상태(진행 중/종료/예정)**: 접속할 때마다 오늘 날짜(한국 시간)로 다시 계산합니다.
- **최신 데이터**: 페이지가 열릴 때마다 `data.json`·`candidates.json`을 캐시 없이 새로 받아옵니다. ‘실시간 업데이트’ 버튼으로 다시 받을 수도 있습니다.
- **전국 전수 점검**: GitHub Actions가 2시간마다 230개 지자체를 하나씩 `지역명 × 연관검색어`로 검색하고, 네이버 검색 API(뉴스·웹·블로그)와 Google 뉴스 두 경로 결과를 교차합니다. 결과는 `전국 점검표` 탭과 지도 색으로 바로 반영됩니다.
- **더블체크 기준**: 공고 있음 = 공식·언론 출처 + 서로 다른 출처 2곳 이상 / 공고 없음 = 두 경로 모두 정상 동작하고 0건. 검색이 실패한 지역은 이전 결과를 유지하고 ‘공고 없음’으로 바꾸지 않습니다.
- **네이버 API 사용량**: 1회 약 1,420건 × 하루 12회 ≈ 17,000건으로 무료 한도(하루 25,000건) 안입니다.
- **최종 업데이트 표시**: `index.html` 맨 위 HTML 주석, `<meta name="last-updated">`, 화면 하단 ‘최종 업데이트’에 매 실행마다 기록됩니다.
- **신규 공고 감지**: 새로 찾은 공고·보도는 `신규 감지` 탭에 ‘검증 대기’로 올라갑니다.
  브라우저가 지자체 사이트를 직접 긁어오는 것은 보안 정책(CORS) 때문에 불가능해서, 서버 쪽 정기 수집 방식을 씁니다.
- **팩트체크**: 자동 수집 결과는 정식 목록에 바로 넣지 않습니다. 공고문을 확인한 뒤 `scripts/build_data.py`에 한 줄 추가 →
  `python scripts/build_data.py data.json && python scripts/build_html.py` 실행 → 커밋하면 반영됩니다.

## 검증 등급
- 공식 공고: 지자체 공고 본문과 직접 대조
- 언론 보도: 구청 보도자료 기반 기사와 대조
- 2차 출처: 공식 링크 또는 민간 집계로만 확인 → 화면에 ‘확인 필요’로 표시, 전화 확인 권장

## 사업연도(2026년 / 2027년) 구분
- 화면 상단 **사업연도** 버튼으로 2026년과 2027년을 완전히 따로 봅니다. 지도 색, 지역 검색, 공고 목록, 전국 점검표, 지원 제품, 신규 감지가 모두 선택한 연도 기준으로 바뀝니다.
- **2027년 1월 1일 00:00(KST)**부터 접속하면 자동으로 2027년 화면이 기본으로 열립니다. 2026년은 버튼으로 언제든 비교할 수 있습니다.
- 자동 점검기는 11~12월에는 올해와 내년을 함께 점검합니다. 기사·공고에 적힌 연도(없으면 게시일, '내년' 표현)로 어느 해 사업인지 판정해 연도별로 따로 기록합니다.
- **2027년 공고 추가**: `scripts/build_data.py`에서 `add(..., year=2027)`로 추가합니다.
- **2027년 지원 제품 추가**: `scripts/build_products.py`에서 `add(..., years=(2027,))`로 추가합니다. 우리 회사 제품은 `mine=True`를 붙이면 '등록 제품' 배지와 함께 맨 위에 표시됩니다.
- 2028년을 추가하려면 `build_data.py`의 `years` 목록에 2028을 넣고 `default_switch`를 `2028-01-01`로 바꿉니다.
