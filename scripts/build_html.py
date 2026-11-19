# -*- coding: utf-8 -*-
"""JSON 데이터와 app.js를 index.html 한 파일에 내장하고, 최종 업데이트 시각을 주석·메타·화면에 기록"""
import json, os
from datetime import datetime, timezone, timedelta
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KST = timezone(timedelta(hours=9))
def J(n):
    try: return json.load(open(os.path.join(R, n + '.json'), encoding='utf-8'))
    except Exception: return None
emb = {k: J(k) for k in ['data', 'products', 'candidates', 'geo', 'regions', 'keywords', 'coverage', 'bestshops', 'link_check', 'site_check', 'gov_posts']}
if emb['regions']: emb['regions'] = {k: v for k, v in emb['regions'].items() if k != 'poly'}
now = datetime.now(KST).strftime('%Y-%m-%d %H:%M')
ver = (emb['data'] or {}).get('updated_at', '')[:16].replace('T', ' ')
col = ((emb['coverage'] or {}).get('updated_at') or '')[:16].replace('T', ' ') or '첫 실행 대기'
t = open(os.path.join(R, 'src/index.template.html'), encoding='utf-8').read()
app = open(os.path.join(R, 'src/app.js'), encoding='utf-8').read()
js = json.dumps(emb, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
comment = (f"<!--\n  전국 음식물처리기 보조금 대동여지도\n  최종 업데이트(페이지 생성): {now} KST\n  공고 데이터 검증: {ver} KST\n"
           f"  자동 점검(2시간 주기): {col}\n  점검 대상: 전국 {(emb['regions'] or {}).get('count','')}개 기초지자체 × 연관검색어 사전(keywords.json)\n-->")
t = t.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + comment + '\n', 1)
t = t.replace('<meta charset="utf-8">', f'<meta charset="utf-8">\n<meta name="last-updated" content="{now} KST">', 1)
t = t.replace('/*__LASTUPD__*/', f'{now} (KST)')
t = t.replace('/*__APP__*/', '<script>\n' + app + '\n</script>')
t = t.replace('/*__EMBED__*/', js)
open(os.path.join(R, 'index.html'), 'w', encoding='utf-8').write(t)
print('index.html', os.path.getsize(os.path.join(R, 'index.html')), now)
