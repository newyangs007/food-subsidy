(function(){
"use strict";
var EMB = {}; try { EMB = JSON.parse(document.getElementById('embed').textContent); } catch(e) {}
var D, P, C, G, R, K, V, B, L, W, GP, CP;      // CP: 쿠팡 파트너스 인기 제품(coupang.json)      // data, products, candidates, geo, regions, keywords, coverage, bestshops, link_check
var S = {year:null, rpage:1, ppage:1, view:'subsidy', status:'on', sido:null, sgg:null, q:'', page:1, ps:8, pm:'all', pc:'all', brand:null, cs:'all', csido:'', cdbl:'', cpage:1};
var $ = function(s){return document.querySelector(s)};
var esc = function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var ST = {on:'진행 중', chk:'확인 필요', soon:'예정', off:'종료'};
var RANK = {on:0, soon:1, chk:2, off:3};
var VF = {official:['o','공식 공고'], news:['n','언론 보도'], secondary:['s','2차 출처']};
var RS = {on:'접수 중', soon:'접수 중', done:'접수 마감', none:'공고 없음', unk:'공고 없음'};
var RS_ORDER = ['on','soon','done','none','unk'];
var RS_COL = {on:'#34D399', soon:'#34D399', chk:'#34D399', auto:'#34D399', done:'#94A3B8', none:'#EEF2F6', unk:'#EEF2F6'};
var SYN = [];
var today, nowD;

function kst(){ return new Date(Date.now()+(9*60+new Date().getTimezoneOffset())*60000); }
function ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function fmtDT(iso){ if(!iso) return null; var m=String(iso).match(/(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/); if(!m) return iso; return m[2]+'.'+m[3]+(m[4]?' '+m[4]+':'+m[5]:''); }
function md(s){ if(!s) return ''; var p=s.split('-'); return +p[1]+'.'+ +p[2]; }
function days(a,b){ return Math.round((new Date(b)-new Date(a))/864e5); }
var BLOGS=/(^|\.)(blog\.naver\.com|tistory\.com|brunch\.co\.kr|velog\.io|wikidocs\.net|tilnote\.io|make2t\.kr|jab-guyver\.co\.kr|foodwastesubsidy\.kr|yellowit\.co\.kr|studygov\.kr|glasswallet\.com|dikr\.co\.kr|icems2021\.com|naturelove40\.com|ajd\.co\.kr|gusle\.kr|thecheck\.co\.kr|wooyupost\.com|braindetox\.kr|post\.naver\.com|cafe\.naver\.com|medium\.com)$|blog/i;
function gov(u){ var h=host(u); return /(\.go\.kr|\.seoul\.kr|\.daegu\.kr|(^|\.)suseong\.kr)$/.test(h); }      // 공공기관(시·도청, 구·군청) 누리집만
function tier(u){ var h=host(u); if(!h) return 9; if (gov(u)) return 0; if (BLOGS.test(h)) return 2; return 1; }
var TIER=['공고문','뉴스','블로그'];
function lcheck(u){ return (L && L.links && L.links[u]) || null; }
function linkOK(u, e){ var c=lcheck(u); if (!c) return true; if (c.state==='gone') return false;
  if (c.state==='mismatch') return !!(e && e.url_ok && e.url===u);   // 직접 대조한 공고는 자동 판독 실패(스크립트 화면 등)로 숨기지 않음
  return true; }   // 더블체크에서 삭제·내용 불일치로 판정되면 숨김
/* 바로가기: ① 공공기관 공고문(더블체크 통과) → ② 지자체 공식 누리집(더블체크 통과) — 뉴스·블로그는 쓰지 않음 */
function site(e){ return (W && W.sites && W.sites[e.sido+'|'+e.sigungu]) || null; }
function bestLink(e){
  var c=[e.url].concat(e.sources||[]).filter(Boolean).filter(function(u,i,a){return a.indexOf(u)===i && gov(u) && linkOK(u,e);});
  if (c.length) return {u:c[0], t:0};
  var w=site(e), h=(w&&w.home)||e.home;
  if (h) return {u:h, t:4};                                             // 누리집 주소는 직접 확인한 목록(check_sites.HOME)
  return null;
}
/* 전화번호: ① 확인된 담당부서 번호 → ② 공고문 본문의 담당·문의 번호(자동 추출) → ③ 지자체 대표번호(누리집 하단, 자동 확인) */
var AREA={'서울':['02'],'부산':['051'],'대구':['053'],'인천':['032'],'대전':['042'],'울산':['052'],'세종':['044'],'경기':['031'],'강원':['033'],
  '충북':['043'],'충남':['041','042'],'전북':['063'],'전남광주':['061','062'],'경북':['054','053'],'경남':['055'],'제주':['064']};
function localNo(e,p){ var a=AREA[e.sido]||[]; return a.some(function(x){ return p.indexOf(x+'-')===0; }); }
function phoneOf(e){
  if (e.phone) return e.phone;                                         // ① 직접 확인한 담당부서 번호
  var c=e.url&&lcheck(e.url);                                          // ② 공고 본문 '담당·문의' 번호(자동, 지역번호 일치할 때만)
  if (c && c.state==='ok' && c.dept_phone && localNo(e,c.dept_phone)) return c.dept_phone;
  return e.rep_phone || '';                                           // ③ 지자체 대표번호(누리집에서 확인)
}
var ICO={
  arrow:'<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M5 11L11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search:'<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><circle cx="7" cy="7" r="4.3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10.3 10.3L13.5 13.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  phone:'<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4.2 2.2l1.6-.4 1.3 3-1.2.9a7 7 0 0 0 3.4 3.4l.9-1.2 3 1.3-.4 1.6c-.2.7-.8 1.1-1.5 1C6.4 11.2 3.8 8.6 3.2 3.7c-.1-.7.3-1.3 1-1.5z" fill="currentColor"/></svg>',
  caret:'<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cal:'<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
};
function phoneHTML(e){ var p=phoneOf(e); return p ? '<span class="telc" data-stop="1">'+ICO.phone+'<span>'+esc(p)+'</span></span>' : ''; }
/* 종료 + 2차 출처 → 해당 지자체 누리집 통합검색 결과로 바로가기 (검색어: 감량기 기본, ▾로 바꿔 검색) */
var SKW=['감량기','음식물처리기','음식물 보조금','음식물 지원금'];
/* 지자체 누리집에서 찾은 실제 게시글이 있으면 그 글로 바로 가고, 게시글을 못 찾은 곳만 누리집 통합검색으로 보낸다 */
function hasPost(e){ var b=bestLink(e); return !!(b && b.t===0); }
function useSearch(e){ return !!e.search && status(e)==='off' && vkey(e)==='secondary' && !hasPost(e); }
function openSearch(rid, q){
  var e=(D.items||[]).filter(function(x){return x.sido+'|'+x.sigungu===rid && x.search})[0]; if(!e) return;
  var c=e.search;
  if (c.u){ window.open(c.u.split('{q}').join(encodeURIComponent(q)), '_blank', 'noopener'); return; }
  var f=document.createElement('form'); f.method='post'; f.action=c.post; f.target='_blank'; f.acceptCharset='UTF-8'; f.style.display='none';
  Object.keys(c.p).forEach(function(k){ var i=document.createElement('input'); i.type='hidden'; i.name=k; i.value=String(c.p[k]).split('{q}').join(q); f.appendChild(i); });
  document.body.appendChild(f); f.submit(); setTimeout(function(){ f.remove(); }, 1000);
}
function goHTML(e){
  var rid=e.sido+'|'+e.sigungu;
  if (useSearch(e)) return '<span class="gobox"><button type="button" class="gobtn" data-srch="'+esc(rid)+'" data-q="감량기" title="'+esc(e.sigungu)+' 누리집에서 \'감량기\' 검색">'+ICO.search+'<span>바로가기</span></button>'+
    '<button type="button" class="gomore" data-pop="srch" data-rid="'+esc(rid)+'" aria-label="다른 검색어로 찾기">'+ICO.caret+'</button></span>';
  var b=bestLink(e);
  return b ? '<a class="gobtn" href="'+esc(b.u)+'" target="_blank" rel="noopener" data-stop="1"><span>바로가기</span>'+ICO.arrow+'</a>' : '<span class="none">공고 확인 중</span>';
}
/* LG전자 베스트샵 상담예약: 같은 시·군·구 매장 1곳이면 바로, 여러 곳이면 매장 선택, 없으면 매장 직접 선택 화면 */
function lgHTML(e){
  var rid=e.sido+'|'+e.sigungu, list=shopsIn(rid);
  if (list.length===1) return '<a class="lgbtn" data-rsv="1" href="'+esc(list[0].reserve)+'" target="_blank" rel="noopener" data-stop="1" title="'+esc(list[0].name)+' 상담예약">'+ICO.cal+'<span><i class="lgw">베스트샵 </i>상담예약</span></a>';
  if (list.length>1) return '<button type="button" class="lgbtn" data-pop="lg" data-rid="'+esc(rid)+'">'+ICO.cal+'<span><i class="lgw">베스트샵 </i>상담예약</span><em>'+list.length+'</em>'+ICO.caret+'</button>';
  return '<a class="lgbtn ghost" data-rsv="1" href="'+esc((B&&B.reserve_any)||'https://bestshop.lge.co.kr/shop/findBestshop')+'" target="_blank" rel="noopener" data-stop="1" title="같은 지역 매장이 없어 상담예약 화면에서 매장을 직접 고릅니다">'+ICO.cal+'<span><i class="lgw">베스트샵 </i>상담예약</span></a>';
}
function linkHTML(e){ return '<div class="act">'+goHTML(e)+phoneHTML(e)+lgHTML(e)+'</div>'; }
/* 작은 선택 메뉴(검색어 / 매장) */
function popClose(){ var p=$('#pop'); if(p){ p.hidden=true; p.innerHTML=''; } }
function popOpen(btn){
  var p=$('#pop'), kind=btn.dataset.pop, rid=btn.dataset.rid, html='';
  if (kind==='srch') html='<div class="ph">'+esc((REG[rid]||{name:rid.split('|')[1]}).name)+' 누리집에서 검색</div>'+SKW.map(function(q){return '<button type="button" class="pi" data-srch="'+esc(rid)+'" data-q="'+esc(q)+'">'+ICO.search+'<span>'+esc(q)+'</span></button>'}).join('');
  else html='<div class="ph">'+esc((REG[rid]||{name:rid.split('|')[1]}).name)+' LG전자 베스트샵</div>'+shopsIn(rid).map(function(x){return '<a class="pi shop1" data-rsv="1" href="'+esc(x.reserve)+'" target="_blank" rel="noopener"><b>'+esc(x.name)+'</b><small>'+esc((x.dong?x.dong+' · ':'')+(x.tel||''))+'</small><i>상담예약 '+ICO.arrow+'</i></a>'}).join('');
  p.innerHTML=html; p.hidden=false;
  var r=btn.getBoundingClientRect(), w=p.offsetWidth, h=p.offsetHeight;
  var left=Math.min(window.innerWidth-w-10, Math.max(10, r.right-w)), top=r.bottom+6; if (top+h>window.innerHeight-10) top=Math.max(10, r.top-h-6);
  p.style.left=left+'px'; p.style.top=top+'px';
}
/* 베스트샵 상담예약은 전체 창이 아닌 작은 창(가로 520px)으로 연다 — 팝업이 막히면 새 탭으로 */
function openRsv(u){
  var w=Math.min(520, screen.availWidth-40), h=Math.min(780, screen.availHeight-60);
  var x=(window.screenX||window.screenLeft||0)+Math.max(0,(window.outerWidth-w)/2), y=(window.screenY||window.screenTop||0)+Math.max(0,(window.outerHeight-h)/2);
  var win=window.open(u, 'lgReserve', 'popup=yes,width='+w+',height='+h+',left='+Math.round(x)+',top='+Math.round(y)+',resizable=yes,scrollbars=yes');
  if (!win) return false; try{ win.opener=null; win.focus(); }catch(_e){} return true;
}
document.addEventListener('click', function(ev){
  var rv=ev.target.closest('a[data-rsv]'); if (rv && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey){ if (openRsv(rv.href)){ ev.preventDefault(); ev.stopPropagation(); popClose(); } return; }
  var sb=ev.target.closest('[data-srch]'); if (sb){ ev.preventDefault(); ev.stopPropagation(); popClose(); openSearch(sb.dataset.srch, sb.dataset.q); return; }
  var pb=ev.target.closest('[data-pop]'); if (pb){ ev.preventDefault(); ev.stopPropagation(); var p=$('#pop'); if(!p.hidden && p._src===pb){ popClose(); return; } popOpen(pb); p._src=pb; return; }
  if (!ev.target.closest('#pop')) popClose();
}, true);
window.addEventListener('scroll', popClose, {passive:true}); window.addEventListener('resize', popClose);
document.addEventListener('keydown', function(ev){ if(ev.key==='Escape') popClose(); });
/* 검증 표시: 공식 공고(직접 대조) 또는 자동 점검에서 공고 본문·신청 시작일까지 일치 → 공식 공고 */
function vkey(e){ var c=e.url&&lcheck(e.url);
  if (e.verify==='official' || hasPost(e) || (c && c.state==='ok' && c.device && c.date_match)) return 'official';   // 지자체 누리집 게시글로 바로 연결되면 공식 공고
  return e.verify; }
function host(u){ try{ return new URL(u).hostname.replace(/^www\.|^m\./,''); }catch(e){ return ''; } }

/* ── 공고 단위 상태 ── */
function status(e){
  if (e.closed) return 'off';
  if (e.start && e.start > today) return 'soon';
  if (e.end && e.end < today) return 'off';
  if (!e.end && e.start && days(e.start,today) > 60) return 'off';   // '예산 소진 시까지' 공고는 두 달이 지나면 마감으로 보고, 접수 여부는 전화로 확인하도록 안내
  return 'on';                                                         // 모든 공고가 지자체 누리집 게시글로 확인됨 → 진행 중 / 종료 두 가지

}
/* '예산 소진 시까지' 공고: 시작 후 두 달이 지나면 '종료 예상'(접수 여부는 전화 확인) */
function expEnd(e){ return !e.end && !e.closed && !!e.start && days(e.start,today) > 60; }
function stl(e,s){ return s==='off' && expEnd(e) ? '종료 예상' : ST[s]; }
function why(e){
  if (status(e)!=='chk') return '';
  if (e.force) return '기간·금액 미공개';
  if (!e.end) return '예산 소진 여부 미확인';
  return '공식 공고 본문 미확인';
}
var CHK_TIP='마감일 전이지만 공식 공고 본문을 직접 확인하지 못했거나, 예산 소진 시까지 접수라 현재 접수 여부를 알 수 없는 공고';
function isNew(e){ var s=status(e); return s!=='off' && e.posted && days(e.posted,today) <= 14 && days(e.posted,today) >= 0; }
function sidoName(k){ for (var i=0;i<D.sido.length;i++) if (D.sido[i][0]===k) return D.sido[i][1]; return k; }
function amount(e){ if (e.max==null) return {b:'공고문 확인', s:''}; return {b:'최대 '+e.max+'만원', s:(e.rate? '구매가의 '+e.rate+'%' : '')}; }

/* ── 사업연도 ── */
function sure(e){ return status(e)!=='chk'; }
function yItems(){ return D.items.filter(function(e){ return (e.year||2026)===S.year && sure(e); }); }
function autoYear(){ var y=+today.slice(0,4), ys=D.years||[2026]; if (ys.indexOf(y)>=0) return y; var past=ys.filter(function(x){return x<=y}); return past.length?Math.max.apply(null,past):ys[0]; }
function yearStats(y){ var it=D.items.filter(function(e){return (e.year||2026)===y && sure(e)}), rs={}, on=0;
  it.forEach(function(e){ rs[e.sido+'|'+e.sigungu]=1; if (status(e)==='on') on++; });
  var cv=(V&&V.years&&V.years[y]&&V.years[y].regions)||{}, auto=0;
  return {items:it.length, regions:Object.keys(rs).length, on:on, auto:auto, checked:Object.keys(cv).length}; }
function renderYearBar(){
  var y0=autoYear(), sw=D.default_switch||'', ys=D.years||[2026];
  var btns=ys.map(function(y){ var st=yearStats(y);
    var sub = st.items ? '공고 '+st.items+'건 · 운영 '+st.regions+'곳'+(st.on?' · 접수 중 '+st.on:'') : (st.auto ? '새 공고 감지 '+st.auto+'곳' : (y>+today.slice(0,4)?'공고 수집 준비 중':'확인된 공고 없음'));
    return '<button type="button" class="yb" data-year="'+y+'" aria-pressed="'+(S.year===y)+'"><b>'+y+'년</b>'+(y===y0?'<span class="cur">운영 중</span>':'')+'<small>'+sub+'</small></button>'; }).join('');
  var note = (sw && today < sw.slice(0,10)) ? '<span class="yn">'+sw.slice(0,4)+'.'+sw.slice(5,7)+'.'+sw.slice(8,10)+' 00:00에 '+sw.slice(0,4)+'년 화면으로 자동 전환 · D-'+days(today,sw.slice(0,10))+'</span>'
           : '<span class="yn">'+y0+'년 자료가 기본으로 표시됩니다 · 지난 연도는 언제든 눌러서 비교할 수 있어요</span>';
  $('#yearBar').innerHTML='<span class="yl">사업연도</span><div class="ybs">'+btns+'</div>'+note;
}

/* ── 지자체 단위 상태 + 더블체크 ── */
var REG = {}, BYR = {};
function indexRegions(){
  REG = {}; BYR = {};
  R.regions.forEach(function(r){ REG[r.id]=r; BYR[r.id]=[]; });
  yItems().forEach(function(e){ var id=e.sido+'|'+e.sigungu; (BYR[id]=BYR[id]||[]).push(e); });
}
function cov(id){ var y=V && V.years && V.years[S.year]; if (y && y.regions) return y.regions[id]||null; return (S.year===2026 && V && V.regions && V.regions[id]) || null; }
function rsl(k){ return RS[k]; }
function rstate(id){
  var es=BYR[id]||[], c=cov(id);
  if (es.length){
    var best=Math.min.apply(null, es.map(function(e){return RANK[status(e)]}));
    return ['on','soon','on','done'][best];
  }
  if (c && c.signal) return 'none';
  return 'unk';
}
function dlevel(id){            // 2 = 2중 확인, 1 = 1차 확인, 0 = 미확인
  var es=BYR[id]||[], c=cov(id);
  if (es.length){
    var strong = es.some(function(e){return e.verify!=='secondary'});
    var hs={}; es.forEach(function(e){ [e.url].concat(e.sources||[]).forEach(function(u){ var h=host(u); if(h) hs[h]=1; }); });
    if (c && c.hits) c.hits.forEach(function(h){ var x=host(h.link); if(x) hs[x]=1; });
    return (strong && Object.keys(hs).length>=2) ? 2 : 1;
  }
  if (c && c.signal==='none') return c.double ? 2 : 1;
  return 0;
}
var DL = ['미확인','1차 확인','2중 확인'];
/* ── 검색어 정규화(연관검색어 사전) ── */
function norm(s){ return String(s||'').toLowerCase().replace(/\s+/g,''); }
function buildSyn(){
  var w = (K.device||[]).concat(K.program||[], ['음식물','음식물쓰레기','음식물류','폐기물','처리기','지원','보조','구매','설치','보급','가정용','공고','2026','2026년']);
  SYN = w.map(norm).filter(function(x,i,a){return x && a.indexOf(x)===i}).sort(function(a,b){return b.length-a.length});
}
function regionTokens(q){
  return String(q||'').trim().split(/\s+/).filter(Boolean).map(function(w){
    w=norm(w); var changed=true;
    while (changed && w){ changed=false; for (var i=0;i<SYN.length;i++){ var k=SYN[i];
      if (w===k){ w=''; changed=true; break; }
      if (w.length>k.length && w.endsWith(k)){ w=w.slice(0,-k.length); changed=true; break; }
      if (w.length>k.length && w.startsWith(k)){ w=w.slice(k.length); changed=true; break; } } }
    return w;
  }).filter(Boolean);
}
function rhay(id){ var r=REG[id]||{}; var s=id.split('|')[0];
  return norm([s, sidoName(s), r.name, r.q, r.legacy, r.note, s==='전남광주'?'광주 전남 전라남도 광주광역시':'', s==='강원'?'강원도':'', s==='전북'?'전라북도':''].join(' ')); }
function hay(e){ return rhay(e.sido+'|'+e.sigungu)+norm([e.round,e.notice].join(' ')); }
function matchQ(e){ var t=regionTokens(S.q); if(!t.length) return true; var h=hay(e); return t.every(function(w){return h.indexOf(w)>=0}); }
function matchR(id){ var t=regionTokens(S.q); if(!t.length) return true; var h=rhay(id); return t.every(function(w){return h.indexOf(w)>=0}); }

/* ── 공고 목록 필터 ── */
function base(){ return yItems().filter(function(e){ return (!S.sido || e.sido===S.sido) && (!S.sgg || e.sigungu===S.sgg) && matchQ(e); }); }
function filtered(){
  return base().filter(function(e){
    if (S.status==='all') return true;
    if (S.status==='on') return status(e)==='on' || status(e)==='soon';
    return status(e)===S.status;
  }).sort(function(a,b){
    var ra=RANK[status(a)], rb=RANK[status(b)]; if (ra!==rb) return ra-rb;
    if (isNew(a)!==isNew(b)) return isNew(a)?-1:1;
    var s=status(a);
    if (s==='on'||s==='chk'){ var ea=a.end||'9999', eb=b.end||'9999'; if (ea!==eb) return ea<eb?-1:1; }
    var xa=a.end||a.start||'', xb=b.end||b.start||''; return xa<xb?1:xa>xb?-1:0;
  });
}

/* ── KPI ── */
function renderKPI(){
  var b=base(), c={all:b.length,on:0,chk:0,off:0,soon:0};
  b.forEach(function(e){ c[status(e)]++; }); c.on+=c.soon;
  var defs=[['all','전체 공고',''],['on','진행 중','d-on'],['off','종료','d-off']];
  $('#kpis').innerHTML = defs.map(function(d){
    return '<button class="kpi" type="button" data-st="'+d[0]+'" aria-pressed="'+(S.status===d[0])+'"'+(d[0]==='chk'?' title="'+CHK_TIP+'"':'')+'><span class="l">'+(d[2]?'<i class="dot '+d[2]+'"></i>':'')+d[1]+'</span><span class="v">'+c[d[0]]+'<small>건</small></span></button>';
  }).join('');
  $('#seg').innerHTML = defs.map(function(d){ return '<button type="button" data-st="'+d[0]+'" aria-pressed="'+(S.status===d[0])+'">'+d[1]+' '+c[d[0]]+'</button>'; }).join('');
}

/* ── 지역 검색 ── */
function sidoStats(){
  var m={}; D.sido.forEach(function(s){ m[s[0]]={on:0,ran:0,tot:0,chk:0,all:0}; });
  R.regions.forEach(function(r){ var x=m[r.sido]; if(!x||!matchR(r.id)) return; x.tot++; var st=rstate(r.id);
    if (st==='on') x.on++; if (st==='chk'||st==='auto') x.chk++; if (BYR[r.id].length) x.ran++; x.all+=BYR[r.id].length; });
  return m;
}
function renderIndex(){
  var m=sidoStats(), list=D.sido.slice().sort(function(a,b){ var A=m[a[0]],B=m[b[0]]; return (B.on-A.on)||(B.chk-A.chk)||(B.ran-A.ran); });
  var tot=0,on=0,ran=0; list.forEach(function(s){ tot+=m[s[0]].tot; on+=m[s[0]].on; ran+=m[s[0]].ran; });
  $('#sidoGrid').innerHTML = '<button class="sb all" type="button" data-sido="" aria-pressed="'+(!S.sido)+'">전국 전체<span class="c">'+(on?'<em>'+on+'</em>':'')+ran+'/'+tot+'</span></button>' +
    list.map(function(s){ var x=m[s[0]];
      return '<button class="sb'+(x.ran||x.chk?'':' zero')+'" type="button" data-sido="'+s[0]+'" aria-pressed="'+(S.sido===s[0])+'" title="'+s[1]+' · 2026년 운영 확인 '+x.ran+'곳 / 전체 '+x.tot+'곳">'+s[0]+'<span class="c">'+(x.on?'<em>'+x.on+'</em>':'')+x.ran+'/'+x.tot+'</span></button>'; }).join('');
  var box=$('#sggBox');
  if (S.sido){
    var rs=R.regions.filter(function(r){return r.sido===S.sido && matchR(r.id)});
    rs.sort(function(a,b){ return (RS_ORDER.indexOf(rstate(a.id))-RS_ORDER.indexOf(rstate(b.id))) || a.name.localeCompare(b.name,'ko'); });
    $('#sggTitle').textContent = sidoName(S.sido);
    $('#sggCnt').textContent = rs.length+'개 지자체 전체';
    $('#sggChips').innerHTML = rs.map(function(r){ var st=rstate(r.id);
      return '<button class="chip" type="button" data-sgg="'+esc(r.name)+'" aria-pressed="'+(S.sgg===r.name)+'" title="'+rsl(st)+'"><i class="sw" style="width:9px;height:9px;background:'+RS_COL[st]+'"></i>'+esc(r.name)+'</button>'; }).join('');
    box.classList.add('on');
  } else box.classList.remove('on');
}

/* ── 공고 목록 ── */
function regionCard(id){
  var r=REG[id]; if(!r) return ''; var st=rstate(id), c=cov(id), lv=dlevel(id);
  if (BYR[id] && BYR[id].length) return '';
  return '<div class="rcard"><h4>'+esc(sidoName(r.sido))+' '+esc(r.name)+' <span class="rs '+st+'">'+rsl(st)+'</span> <span class="dbl d'+lv+'">'+DL[lv]+'</span></h4>'+
    (r.note?'<p>'+esc(r.note)+'</p>':'')+
    '<p>'+(st==='unk'?S.year+'년 확인된 공고가 아직 없습니다. 자동 점검(2시간마다)에서 확인되는 대로 표시됩니다.':
          '최근 점검('+fmtDT(c.checked_at)+') 기준 '+S.year+'년 공식 공고가 확인되지 않았습니다.')+'</p></div>';
}
function renderList(){
  var f=filtered(), n=f.length, pages=Math.max(1,Math.ceil(n/S.ps)); if (S.page>pages) S.page=pages;
  var title = S.sgg ? sidoName(S.sido)+' '+S.sgg : S.sido ? sidoName(S.sido) : '전국';
  $('#listTitle').innerHTML = esc(title)+' '+S.year+'년 공고 <span>'+n+'건</span>';
  var rows = f.slice((S.page-1)*S.ps, S.page*S.ps).map(function(e){
    var s=status(e), a=amount(e), v=VF[vkey(e)];
    var per = e.start ? md(e.start)+' ~ '+(e.end?md(e.end):'예산 소진 시') : '공고문 확인';
    var sub = s==='on' && e.end ? 'D-'+Math.max(0,days(today,e.end)) : s==='soon' ? days(today,e.start)+'일 후 시작' : (expEnd(e) ? '예산 소진 여부 전화 확인' : (e.round||''));
    return '<tr data-id="'+e.id+'"><td class="rg"><b>'+esc(e.sigungu)+(isNew(e)?'<span class="new">신규</span>':'')+'</b><small>'+esc(sidoName(e.sido))+(e.round?' · '+esc(e.round):'')+'</small></td>'+
      '<td class="amt"><b>'+a.b+'</b><small>'+esc(a.s)+(e.note&&/최대/.test(e.note)?' · 우대 있음':'')+'</small></td>'+
      '<td class="per">'+per+'<small>'+esc(sub)+'</small></td>'+
      '<td class="stc"><span class="st '+s+'"'+(s==='chk'?' title="'+CHK_TIP+'"':'')+'><i class="dot d-'+s+'"></i>'+stl(e,s)+'</span>'+(s==='chk'?'<span class="why">'+why(e)+'</span>':'')+'<span class="vf '+v[0]+'"><i></i>'+v[1]+'</span></td>'+
      '<td class="ac">'+linkHTML(e)+'</td></tr>';
  }).join('');
  var card = S.sgg ? regionCard(S.sido+'|'+S.sgg) : '';
  if (!yItems().length){ var prev=(D.years||[]).filter(function(y){return y<S.year && yearStats(y).items}).pop(), st=yearStats(S.year);
    card = '<div class="rcard yempty"><h4>'+S.year+'년 음식물처리기 보조금 공고를 기다리는 중입니다</h4><p>'+esc(((D.year_meta||{})[S.year]||{}).note||'')+'</p>'+
      '<p>전국 '+R.regions.length+'개 지자체를 2시간마다 자동 점검해, '+S.year+'년 공고가 감지되면 지도와 목록에 바로 표시합니다.'+(st.auto?' 현재 <b>'+st.auto+'곳</b>에서 새 공고 신호가 감지됐어요 — 보조금 뉴스 탭에서 확인하세요.':'')+'</p>'+
      (prev?'<p style="margin-top:10px"><button class="btn" type="button" data-year="'+prev+'">'+prev+'년 공고 '+yearStats(prev).items+'건 보기</button></p>':'')+'</div>'+card; }
  $('#rows').innerHTML = rows || (yItems().length ? '<tr><td colspan="6" class="empty">'+(S.status==='on'?'지금 접수 중인 '+S.year+'년 공고가 없습니다. <button class="btn" type="button" data-st="all" style="margin-left:6px">전체 공고 보기</button>':S.year+'년 조건에 맞는 공고가 없습니다.')+'</td></tr>' : '');
  $('#rows').closest('table').hidden = !yItems().length;
  $('#regionCard') ? ($('#regionCard').innerHTML=card) : $('#rows').closest('div').insertAdjacentHTML('beforebegin','<div id="regionCard">'+card+'</div>');
  $('#pinfo').textContent = '총 '+n+'건 · '+S.page+'/'+pages+'페이지';
  $('#pg').innerHTML = pager(S.page,pages,'pg');
}
function pager(p,pages,key){
  var h='<button type="button" data-'+key+'="'+(p-1)+'" '+(p<=1?'disabled':'')+' aria-label="이전">‹</button>';
  for (var i=1;i<=pages;i++) if (pages<=7 || Math.abs(i-p)<=2 || i===1 || i===pages) h+='<button type="button" data-'+key+'="'+i+'" aria-current="'+(i===p)+'">'+i+'</button>';
  return h+'<button type="button" data-'+key+'="'+(p+1)+'" '+(p>=pages?'disabled':'')+' aria-label="다음">›</button>';
}

/* ── 지도: 전국 지자체를 운영 상태로 색칠 ── */
var VB, FULL;
function provKey(code){ return code==='gwangju' ? '전남광주' : G.prov[code]; }
function buildMap(){
  var svg=$('#map'); FULL={x:12,y:-2,w:408,h:728}; VB=Object.assign({},FULL);   // 본토+제주 기준으로 잘라 지도를 크게(울릉·먼 섬은 확대 시 표시)
  svg.setAttribute('viewBox',[VB.x,VB.y,VB.w,VB.h].join(' '));
  var h='<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#DCE3EC" stroke-width="2.4"/></pattern></defs><g id="rgs">';
  Object.keys(G.mp).forEach(function(id){ h+='<path class="rg2" data-r="'+esc(id)+'" d="'+G.mp[id]+'"/>'; });
  h+='</g><g id="pvs">'; Object.keys(G.paths).forEach(function(code){ h+='<path class="pvo" data-sido="'+provKey(code)+'" d="'+G.paths[code]+'"/>'; });
  h+='</g><g id="labels"></g><g id="marks"></g>';
  svg.innerHTML=h;
  var acc={}; Object.keys(G.cent).forEach(function(k){ var s=k.split('|')[0], p=G.cent[k]; if (k==='경북|울릉군'||k==='인천|옹진군') return; acc[s]=acc[s]||[0,0,0]; acc[s][0]+=p[0]; acc[s][1]+=p[1]; acc[s][2]++; });
  G.anchor={}; Object.keys(acc).forEach(function(s){ G.anchor[s]=[acc[s][0]/acc[s][2], acc[s][1]/acc[s][2]]; });
  var adj={'서울':[0,-4],'인천':[-14,10],'경기':[40,-50],'세종':[-8,-8],'울산':[8,0],'부산':[10,6],'전남광주':[-16,30],'충남':[-12,0],'경북':[10,0],'대구':[0,4]};
  Object.keys(adj).forEach(function(s){ if (G.anchor[s]){ G.anchor[s][0]+=adj[s][0]; G.anchor[s][1]+=adj[s][1]; } });
}
function renderMap(){
  var m=sidoStats(), z=FULL.w/VB.w;
  document.querySelectorAll('#map path.rg2').forEach(function(p){
    var id=p.getAttribute('data-r'), st=rstate(id), hit=matchR(id), sido=id.split('|')[0];
    p.setAttribute('fill', RS_COL[st]); p.style.opacity = (!hit || (S.sido && sido!==S.sido)) ? .28 : 1;
    p.setAttribute('class','rg2'+(S.sido===sido && S.sgg===id.split('|')[1]?' on2':''));
  });
  document.querySelectorAll('#map path.pvo').forEach(function(p){ p.setAttribute('class','pvo'+(S.sido===p.getAttribute('data-sido')?' sel':'')); });
  var lab='';
  if (!S.sido) D.sido.forEach(function(s){ var a=G.anchor[s[0]]; if(!a) return; var x=m[s[0]];
    lab+='<text class="lb" x="'+a[0].toFixed(1)+'" y="'+a[1].toFixed(1)+'" text-anchor="middle">'+s[0]+(x.on?' <tspan class="cnt">●'+x.on+'</tspan>':'')+'</text>'; });
  else { var fs=(16/z).toFixed(2), sw=(3.6/z).toFixed(2);
    R.regions.forEach(function(r){ if (r.sido!==S.sido) return; var c=G.cent[r.id]; if(!c) return; var st=rstate(r.id);
      lab+='<text class="ml" x="'+c[0]+'" y="'+c[1]+'" text-anchor="middle" font-size="'+fs+'" stroke-width="'+sw+'"'+(st==='unk'||st==='none'?' style="fill:#94A3B8;font-weight:500"':'')+'>'+esc(r.name)+'</text>'; }); }
  $('#labels').innerHTML=lab;
  var mk=''; R.regions.forEach(function(r){ if (rstate(r.id)!=='on' || !matchR(r.id)) return; var c=G.cent[r.id]; if(!c) return; var rr=(7/Math.pow(z,.8)).toFixed(2);
    mk+='<circle class="mk" data-k="'+esc(r.id)+'" cx="'+c[0]+'" cy="'+(S.sido?c[1]+9/z:c[1])+'" r="'+rr+'" fill="#059669" stroke-width="'+(1.6/Math.pow(z,.8)).toFixed(2)+'"><animate attributeName="opacity" values="1;.45;1" dur="1.8s" repeatCount="indefinite"/></circle>'; });
  $('#marks').innerHTML=mk;
  var tot=0, ran=0; R.regions.forEach(function(r){ if(!matchR(r.id)) return; if(S.sido && r.sido!==S.sido) return; tot++; if (BYR[r.id].length) ran++; });
  $('#crumb').innerHTML = S.sido ? '<button type="button" id="mapAll">← 전국</button>'+esc(sidoName(S.sido))+(S.sgg?' › '+esc(S.sgg):'')+' · 운영 '+ran+'/'+tot : '<span>'+S.year+'년 운영 확인 '+ran+' / '+tot+'개 지자체</span>';
}
function animateVB(to){
  var from=Object.assign({},VB), t0=performance.now(), svg=$('#map');
  function step(t){ var k=Math.min(1,(t-t0)/320), e=1-Math.pow(1-k,3);
    ['x','y','w','h'].forEach(function(p){ VB[p]=from[p]+(to[p]-from[p])*e; });
    svg.setAttribute('viewBox',[VB.x,VB.y,VB.w,VB.h].join(' ')); if (k<1) requestAnimationFrame(step); else renderMap(); }
  requestAnimationFrame(step);
}
function focusSido(s){
  if (!s){ animateVB(FULL); return; }
  var b=null; document.querySelectorAll('#map path.pvo[data-sido="'+s+'"]').forEach(function(p){ var r=p.getBBox(); if(!b) b={x:r.x,y:r.y,x2:r.x+r.width,y2:r.y+r.height}; else { b.x=Math.min(b.x,r.x); b.y=Math.min(b.y,r.y); b.x2=Math.max(b.x2,r.x+r.width); b.y2=Math.max(b.y2,r.y+r.height);} });
  if(!b) return; if (s==='경북') b.x2=Math.min(b.x2, 470); if (s==='인천') b.x=Math.max(b.x, 20);
  var w=b.x2-b.x, h=b.y2-b.y, pad=Math.max(w,h)*0.06+3, ar=FULL.w/FULL.h;
  w+=pad*2; h+=pad*2; if (w/h>ar) h=w/ar; else w=h*ar;
  animateVB({x:(b.x+b.x2)/2-w/2, y:(b.y+b.y2)/2-h/2, w:w, h:h});
}
function zoom(f){ var cx=VB.x+VB.w/2, cy=VB.y+VB.h/2, w=Math.min(FULL.w,Math.max(30,VB.w*f)), h=w*FULL.h/FULL.w; animateVB({x:cx-w/2,y:cy-h/2,w:w,h:h}); }

/* ── 상세 패널 ── */
/* ── LG전자 베스트샵: 접수 중인 지역과 같은 시·군·구(동) 매장만 ── */
function shopsIn(rid){ return (B && B.items || []).filter(function(x){ return x.region===rid; }); }
function shopHTML(x, tag){
  return '<div class="shop">'+(tag?'<div class="rgtag">'+esc(tag)+'</div>':'')+'<div class="nm">'+esc(x.name)+'<span class="'+(x.type==='베스트샵'?'lg':'')+'">'+esc(x.type)+'</span>'+(x.dong?'<span>'+esc(x.dong)+'</span>':'')+'</div>'+
    '<div class="ad">'+esc(x.addr)+'</div>'+
    '<div class="acts">'+(x.tel?'<span class="btn tel">☎ '+esc(x.tel)+'</span>':'')+
    '<a class="btn rsv" data-rsv="1" href="'+esc(x.reserve)+'" target="_blank" rel="noopener">상담예약 ↗</a>'+
    '<a class="btn" href="'+esc(x.page)+'" target="_blank" rel="noopener">매장 정보</a></div></div>';
}
function rname(rid){ var r=REG[rid]||{name:rid.split('|')[1]}; return sidoName(rid.split('|')[0])+' '+r.name; }
function shopsHTML(rid, inDrawer){
  var r=REG[rid]||{name:rid.split('|')[1]}, list=shopsIn(rid);
  if (inDrawer) return '<dt>같은 지역 LG전자 베스트샵</dt><dd>'+(list.length?'<div class="shops" style="padding:6px 0 0;grid-template-columns:1fr">'+list.map(function(x){return shopHTML(x)}).join('')+'</div>':'<span style="color:var(--faint)">'+esc(r.name)+' 안에 있는 베스트샵이 없습니다.</span>')+'</dd>';
  return '';
}
function renderShops(){
  var el=$('#shopCard'); if(!el) return;
  var ids={}; yItems().filter(function(e){ return status(e)==='on' && (!S.sido||e.sido===S.sido) && (!S.sgg||e.sigungu===S.sgg); })
    .forEach(function(e){ ids[e.sido+'|'+e.sigungu]=1; });
  var keys=Object.keys(ids);
  if (!keys.length){ el.innerHTML='<div class="ch"><h2>보조금 접수 중인 지역의 LG전자 베스트샵</h2><small>'+(S.sgg||S.sido?'선택한 지역은 현재 접수 중인 보조금이 없습니다':'현재 접수 중인 지역이 없습니다')+'</small></div><div class="shopnote">보조금 접수가 진행 중인 시·군·구가 생기면, 그 지역 안에 있는 매장만 자동으로 보여 드립니다.</div>'; return; }
  var cards=[], none=[];
  keys.forEach(function(k){ var l=shopsIn(k); if (!l.length) none.push(k); l.forEach(function(x){ cards.push(shopHTML(x, rname(k))); }); });   // 지역 구분 없이 한 줄에 5개씩 이어서
  el.innerHTML='<div class="ch"><h2>보조금 접수 중인 지역의 LG전자 베스트샵</h2><small>접수 중 '+keys.length+'개 지역 · 매장 '+cards.length+'곳 · 같은 시·군·구 매장만 · 매장 정보 '+(B&&B.updated_at?fmtDT(B.updated_at)+' 기준':'')+'</small></div>'+
    (cards.length?'<div class="shops">'+cards.join('')+'</div>':'')+
    (none.length?'<div class="shopnote">'+none.map(function(k){return '<b>'+esc(rname(k))+'</b>에는 LG전자 베스트샵이 없습니다'}).join(' · ')+' — <a data-rsv="1" href="'+esc((B&&B.reserve_any)||'https://bestshop.lge.co.kr/shop/findBestshop')+'" target="_blank" rel="noopener">상담예약에서 매장 직접 선택 ↗</a></div>':'');
}
function openDrawer(id){
  var e=D.items.filter(function(x){return x.id===id})[0]; if(!e) return;
  var s=status(e), a=amount(e), v=VF[vkey(e)], rid=e.sido+'|'+e.sigungu, lv=dlevel(rid), ph=phoneOf(e);
  var per = e.start ? e.start.replace(/-/g,'.')+' ~ '+(e.end?e.end.replace(/-/g,'.'):'예산 소진 시') : '공고문 확인';
  var f=function(lbl,val){ return '<dt>'+lbl+'</dt><dd>'+(val?esc(val):'<span style="color:var(--faint)">공고문에서 확인</span>')+'</dd>'; };
  var srcs=[e.url].concat(e.sources||[]).filter(Boolean).filter(function(u,i,arr){return arr.indexOf(u)===i && gov(u) && linkOK(u,e)}), bl=bestLink(e), lc=e.url?lcheck(e.url):null;
  $('#drawer').innerHTML =
    '<button class="x2" type="button" id="dx" aria-label="닫기">×</button>'+
    '<div class="dh"><div class="r">'+esc(sidoName(e.sido))+(e.round?' · '+esc(e.round):'')+'</div><h3>'+esc(e.sigungu)+(isNew(e)?'<span class="new">신규</span>':'')+'</h3>'+
    '<span class="st '+s+'"><i class="dot d-'+s+'"></i>'+stl(e,s)+'</span> <span class="vf '+v[0]+'" style="margin-left:6px"><i></i>'+v[1]+' · '+esc(e.verified_at)+' 확인</span> <span class="dbl d'+lv+'" style="margin-left:4px">'+DL[lv]+'</span></div>'+
    '<div class="db"><div class="big"><div><small>지원금</small><b>'+a.b+'</b><small>'+esc(a.s)+'</small></div><div><small>신청기간</small><b style="font-size:15px">'+per+'</b><small>'+(s==='on'&&e.end?'마감까지 '+Math.max(0,days(today,e.end))+'일':'')+'</small></div></div>'+
    '<dl>'+(e.note?f('비고',e.note):'')+f('지원 대상',e.target)+f('필요 서류',e.docs)+f('신청 방법',e.how)+
    '<dt>전화번호</dt><dd>'+(ph?'☎ '+esc(ph):'<span style="color:var(--faint)">공고문에서 확인</span>')+'</dd>'+
    (e.notice?f('공고 번호',e.notice):'')+
    '<dt>공공기관 공고 (더블체크)</dt><dd class="srcs">'+(srcs.length?srcs.map(function(u){var c=lcheck(u);return '<a href="'+esc(u)+'" target="_blank" rel="noopener"><b style="color:var(--ink2)">[공공기관]</b> '+esc(u.replace(/^https?:\/\//,'').slice(0,70))+'</a>'+(c&&c.state==='ok'?'<small style="color:#059669;display:block">✓ 자동 점검 '+esc(fmtDT(c.checked_at))+' — 링크 열림 · 음식물처리기 내용 일치</small>':'')}).join(''):(bl?'<a href="'+esc(bl.u)+'" target="_blank" rel="noopener"><b style="color:var(--ink2)">[지자체 누리집]</b> '+esc(bl.u.replace(/^https?:\/\//,''))+'</a>':'<span style="color:var(--faint)">확인 중</span>'))+'</dd></dl>'+
    (s==='on'?shopsHTML(rid,true):'')+
    (e.verify==='secondary'?'<div class="warn">이 공고는 이미 마감된 것으로 확인된 2026년 사업입니다. 다음 모집은 해당 지자체 공고를 확인하세요.</div>':
      '<div class="ok">'+(e.verify==='official'?'지자체 공식 공고 본문과 대조했습니다.':'구청 보도자료 기반 언론 보도와 대조했습니다.')+' 예산 소진 시 조기 마감될 수 있습니다.</div>')+
    '</div><div class="df">'+'<div class="act row">'+goHTML(e)+phoneHTML(e)+lgHTML(e)+'</div>'+'</div>';
  $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); $('#drawer').setAttribute('aria-hidden','false');
}
function closeDrawer(){ $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); $('#drawer').setAttribute('aria-hidden','true'); }

/* ── 제품 ── */
function pMethod(p){ return /미생물/.test(p.method)?'bio':'dry'; }
function renderProducts(){
  var q=norm(S.q);
  var all=P.items.filter(function(p){ return (p.years||[2026]).indexOf(S.year)>=0; }), brands={}; all.forEach(function(p){ brands[p.brand]=(brands[p.brand]||0)+1; });
  var bk=Object.keys(brands).sort(function(a,b){return a.localeCompare(b,'ko')});
  $('#brandCnt').textContent=bk.length+'개 브랜드';
  $('#brandChips').innerHTML='<button class="chip" type="button" data-brand="" aria-pressed="'+(!S.brand)+'">전체</button>'+bk.map(function(b){return '<button class="chip" type="button" data-brand="'+esc(b)+'" aria-pressed="'+(S.brand===b)+'">'+esc(b)+' <span class="ls">'+brands[b]+'</span></button>'}).join('');
  var f=all.filter(function(p){
    if (S.brand && p.brand!==S.brand) return false;
    if (S.pm!=='all' && pMethod(p)!==S.pm) return false;
    if (S.pc!=='all' && p.cert!==S.pc) return false;
    if (q && norm([p.brand,p.maker,p.model,p.method,p.cert].join(' ')).indexOf(q)<0) return false;
    return true; });
  var segs=[['m','all','전체 방식'],['m','dry','건조·분쇄'],['m','bio','미생물'],['c','환경표지','환경표지'],['c','K마크','K마크'],['c','Q마크','Q마크'],['c','단체표준','단체표준']];
  $('#pseg').innerHTML=segs.map(function(s){ var on = s[0]==='m'? S.pm===s[1] : S.pc===s[1]; return '<button type="button" data-p'+s[0]+'="'+s[1]+'" aria-pressed="'+on+'">'+s[2]+'</button>'; }).join('');
  $('#pCount').innerHTML='<span style="color:var(--brand)">'+f.length+'개 모델</span>';
  f.sort(function(a,b){ return (b.mine?1:0)-(a.mine?1:0); });
  var grp=[], gi={}; f.forEach(function(p){ var k=[p.brand,p.cert,p.method,p.list].join('|'); if (gi[k]==null){ gi[k]=grp.length; grp.push(Object.assign({models:[]},p)); } grp[gi[k]].models.push(p.model); });
  var pps=8, ppages=Math.max(1,Math.ceil(grp.length/pps)); if (S.ppage>ppages) S.ppage=ppages;
  $('#pinfo2').textContent = grp.length ? '제품 '+grp.length+'개(모델 '+f.length+'개) · '+S.ppage+'/'+ppages+'페이지' : '';
  $('#ppg').innerHTML = grp.length>pps ? pager(S.ppage,ppages,'ppg') : '';
  $('#prows').innerHTML = grp.slice((S.ppage-1)*pps, S.ppage*pps).map(function(p){ return '<tr style="cursor:default"'+(p.mine?' class="mine"':'')+'><td><b>'+esc(p.brand)+'</b>'+(p.mine?'<span class="new" style="background:var(--soon)">등록 제품</span>':'')+'</td><td><div class="mdl">'+p.models.map(function(m){return '<span>'+esc(m)+'</span>'}).join('')+'</div></td><td style="font-size:13px">'+esc(p.method)+'</td><td><span class="cert '+esc(p.cert)+'">'+esc(p.cert)+'</span><div class="ls">'+esc(p.body)+'</div></td><td class="hide-m" style="font-size:12.5px">'+esc(p.maker)+'<div class="ls">'+esc(p.phone||'')+'</div></td><td class="hide-m"><span class="ls">'+({L26:'2026 공고',L25:'2025.6 목록',L27:'2027 공고'}[p.list]||p.list)+'</span></td></tr>'; }).join('') || (all.length?'':yearChecklist()) || '<tr><td colspan="6" class="empty">일치하는 모델이 없습니다. 목록에 없더라도 품질인증+KC를 받았다면 대상일 수 있으니 초록누리·제조사에 인증서를 확인하세요.</td></tr>';
  renderDeals();
  var L=P.lists; $('#plist').innerHTML='출처: <a href="'+L.L26.url+'" target="_blank" rel="noopener">'+L.L26.name+'</a> · <a href="'+L.L25.url+'" target="_blank" rel="noopener">'+L.L25.name+'</a> — 지자체마다 인정 목록이 다를 수 있습니다.';
}

/* ── 쿠팡 인기 제품 롤링: 인증 목록 모델 중 쿠팡 랭킹 상위(=잘 팔리는) 제품만, 자동으로 한 칸씩 넘김 ── */
var DL={sig:'', timer:null, paused:false, hold:false, idx:0};
var DL_OK=/^https:\/\/(link\.coupang\.com|www\.coupang\.com|m\.coupang\.com|coupa\.ng)\//;
var DL_IMG=/^https:\/\/([a-z0-9-]+\.)*(coupangcdn\.com|coupang\.com)\//i;   // 쿠팡 이미지 서버(ads-partners.coupang.com, thumbnail*.coupangcdn.com 등)
function dealList(){
  var it=((CP&&CP.items)||[]).filter(function(x){ return x && DL_OK.test(x.url||''); }), basis=S.year;
  var ids=function(y){ var o={}; P.items.forEach(function(p){ if ((p.years||[2026]).indexOf(y)>=0) o[p.id]=1; }); return o; };
  var ok=ids(S.year);
  if (!Object.keys(ok).length){ var ys=(D&&D.years||[2026]).filter(function(y){return y<S.year}); basis=ys.length?ys[ys.length-1]:2026; ok=ids(basis); }   // 다음 연도 목록 공개 전 → 직전 연도 인증 목록 기준
  return {items:it.filter(function(x){ return ok[x.pid]; }), basis:basis};
}
function won(n){ n=+n; return n>0 ? n.toLocaleString('ko-KR') : ''; }
function renderDeals(){
  var box=$('#deals'); if (!box) return;
  var r=dealList(), it=r.items;
  var sig=S.year+'|'+r.basis+'|'+it.map(function(x){return x.url+x.price+x.rank}).join(',')+'|'+(CP&&CP.updated_at);
  if (sig===DL.sig) return; DL.sig=sig;
  if (!it.length){ box.hidden=true; dStop(); return; }
  box.hidden=false;
  $('#dealsN').textContent=it.length+'개';
  $('#dtrack').innerHTML=it.map(function(x,i){
    var img=DL_IMG.test(x.image||'') ? '<img src="'+esc(x.image)+'" alt="'+esc(x.brand+' '+x.model)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=ph>'+esc((x.brand||'?').slice(0,2))+'</span>\'">' : '<span class="ph">'+esc((x.brand||'?').slice(0,2))+'</span>';
    var pr=won(x.price);
    return '<a class="deal" href="'+esc(x.url)+'" target="_blank" rel="sponsored nofollow noopener" role="group" aria-roledescription="slide" aria-label="'+(i+1)+'위 '+esc(x.brand+' '+x.model)+'">'+
      '<span class="drk'+(i<3?' top':'')+'">'+(i+1)+'</span><div class="dimg">'+img+'</div><div class="dbody">'+
      '<div class="dbr">'+esc(x.brand)+(x.cert?'<span class="cert '+esc(x.cert)+'">'+esc(x.cert)+'</span>':'')+'</div>'+
      '<div class="dnm">'+esc(x.name||x.brand+' '+x.model)+'</div><div class="dmd">인증 모델 '+esc(x.model)+'</div>'+
      '<div class="dpr">'+(pr?'<b>'+pr+'</b>원':'<b style="font-size:13.5px">쿠팡 최저가 확인</b>')+(x.rocket?'<span class="rkt">로켓배송</span>':'')+'</div>'+
      '<span class="dgo">쿠팡에서 보기 ↗</span></div></a>';
  }).join('');
  $('#ddots').innerHTML=it.map(function(x,i){ return '<button type="button" data-dot="'+i+'" aria-label="'+(i+1)+'위 제품 보기"'+(i===0?' aria-current="true"':'')+'></button>'; }).join('');
  var at=CP&&(CP.api_at||CP.updated_at);
  $('#ddisc').innerHTML='<b>'+esc((CP&&CP.disclosure)||'이 영역은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.')+'</b><br>'+
    (r.basis!==S.year?esc(r.basis)+'년 인증 목록 기준(' + S.year + '년 목록 공개 전) · ':'')+
    '\'음식물처리기\' 등 쿠팡 검색 랭킹 상위 제품 중 지자체 인증 목록에 있는 모델만 골랐습니다'+(at?' · '+fmtDT(at)+' 기준':'')+'. 가격·재고는 수시로 바뀝니다. 보조금 인정 여부는 거주지 공고의 인증제품 목록과 영수증 요건을 꼭 확인하세요.';
  var v=$('#dview'); v.style.scrollBehavior='auto'; v.scrollLeft=0; v.style.scrollBehavior=''; DL.idx=0;
  dStart();
}
function dStep(){ var v=$('#dview'), c=v.querySelector('.deal'); if (!c) return 0; return c.getBoundingClientRect().width+12; }
function dGo(i){
  var v=$('#dview'), n=v.querySelectorAll('.deal').length, w=dStep(); if (!n||!w) return;
  var max=v.scrollWidth-v.clientWidth-2;
  if (i<0) i = v.scrollLeft<=2 ? n-1 : 0;
  if (i>=n || (i>DL.idx && v.scrollLeft>=max)) i=0;               // 끝까지 가면 처음으로
  v.scrollTo({left:i*w, behavior:'smooth'}); DL.idx=i; dDots(i);
}
function dDots(i){ [].forEach.call(document.querySelectorAll('#ddots button'), function(b,k){ b.setAttribute('aria-current', k===i?'true':'false'); }); }
function dStart(){ dStop(); if (DL.paused || DL.hold || document.hidden || $('#deals').hidden) return;
  DL.timer=setInterval(function(){ if (S.view==='products' && !document.hidden) dGo(DL.idx+1); }, 3500); }
function dStop(){ if (DL.timer){ clearInterval(DL.timer); DL.timer=null; } }
function dPlayLbl(){ var b=$('#dPlay'); b.textContent=DL.paused?'▶':'❚❚'; b.setAttribute('aria-label', DL.paused?'자동 넘김 시작':'자동 넘김 멈춤'); b.setAttribute('aria-pressed', DL.paused?'true':'false'); }
(function(){
  var box=$('#deals'), v=$('#dview'); if (!box) return;
  try{ if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) DL.paused=true; }catch(_e){}
  dPlayLbl();
  $('#dPrev').addEventListener('click', function(){ dGo(DL.idx-1); dStart(); });
  $('#dNext').addEventListener('click', function(){ dGo(DL.idx+1); dStart(); });
  $('#dPlay').addEventListener('click', function(){ DL.paused=!DL.paused; dPlayLbl(); DL.paused?dStop():dStart(); });
  $('#ddots').addEventListener('click', function(e){ var b=e.target.closest('[data-dot]'); if (b){ dGo(+b.dataset.dot); dStart(); } });
  ['mouseenter','focusin','touchstart'].forEach(function(n){ box.addEventListener(n, function(){ DL.hold=true; dStop(); }, {passive:true}); });
  box.addEventListener('mouseleave', function(){ DL.hold=false; dStart(); });
  box.addEventListener('focusout', function(e){ if (!box.contains(e.relatedTarget)){ DL.hold=false; dStart(); } });
  box.addEventListener('touchend', function(){ setTimeout(function(){ DL.hold=false; dStart(); }, 5000); }, {passive:true});
  var sT; v.addEventListener('scroll', function(){ clearTimeout(sT); sT=setTimeout(function(){ var w=dStep(); if (w){ DL.idx=Math.round(v.scrollLeft/w); dDots(DL.idx); } }, 80); }, {passive:true});
  document.addEventListener('visibilitychange', function(){ document.hidden?dStop():dStart(); });
})();

function yearChecklist(){
  var m=(P.year_meta||{})[S.year]||{}, prev=(D.years||[]).filter(function(y){return y<S.year}).pop();
  return '<tr><td colspan="6" style="padding:0"><div class="rcard yempty"><h4>'+S.year+'년 지원 대상 제품 목록 — 공개 전</h4><p>'+esc(m.note||'')+'</p>'+
    (m.checklist?'<p style="margin-top:10px;font-weight:700;color:var(--ink)">'+S.year+'년 지원 대상이 되려면 (제조사 체크리스트)</p><ol class="ck">'+m.checklist.map(function(c){return '<li>'+esc(c)+'</li>'}).join('')+'</ol>':'')+
    (prev?'<p style="margin-top:10px"><button class="btn" type="button" data-year="'+prev+'">'+prev+'년 인증 제품 목록 참고하기</button></p>':'')+'</div></td></tr>';
}

/* ── 보조금 뉴스: 지자체 누리집 게시글만(언론 기사·블로그 제외), 8개씩 ──
   ① 지도·목록에 올린 공고의 실제 게시글  ② 2시간마다 지자체 누리집 검색에서 찾아 3회까지 재확인한 게시글
   2027년은 제목에 2027·27년이 들어간 게시글만 */
var YRX={2026:/2026|(^|[^0-9])26년|[‘’']26\./, 2027:/2027|(^|[^0-9])27년|[‘’']27\./};
function ctier(c){ return 0; }
function govNews(){
  var out=[], seen={};
  function add(x){ if (!x.link || seen[x.link] || !gov(x.link)) return; seen[x.link]=1; out.push(x); }
  D.items.filter(function(e){ return (e.year||2026)===S.year && sure(e); }).forEach(function(e){
    var b=bestLink(e); if (!b || b.t!==0) return;
    var t=e.notice && /감량|처리기|음식물/.test(e.notice) ? e.notice : e.sigungu+' '+S.year+'년 가정용 음식물처리기(감량기) 구매 지원'+(e.round?' · '+e.round:'');
    if (!YRX[S.year].test(t)) t=S.year+'년 '+t;
    add({title:t, link:b.u, sido:e.sido, sigungu:e.sigungu, date:e.posted||e.start||'', st:status(e), via:'목록 공고'}); });
  ((GP&&GP.items)||[]).forEach(function(x){ if (x.year!==S.year || !YRX[S.year].test(x.title)) return;
    add({title:x.title, link:x.link, sido:x.sido, sigungu:x.sigungu, date:x.date||(x.first_seen||'').slice(0,10), via:'누리집 검색', checks:x.checks}); });
  return out;
}
function renderRadar(){
  var it=govNews();
  $('#radarN').textContent = it.length? ' '+it.length : '';
  $('#radarMeta').textContent = '지자체 누리집 게시글만 · 뉴스·블로그 제외'+(GP&&GP.updated_at?' · 누리집 검색 '+fmtDT(GP.updated_at):'');
  var q=regionTokens(S.q);
  var list=it.filter(function(c){ var h=norm(c.title+' '+c.sido+' '+sidoName(c.sido)+' '+c.sigungu); return q.every(function(w){return h.indexOf(w)>=0}); })
    .sort(function(a,b){ return (b.date||'')>(a.date||'')?1:(b.date||'')<(a.date||'')?-1:0; });
  var ps=8, pages=Math.max(1,Math.ceil(list.length/ps)); if (S.rpage>pages) S.rpage=pages;
  $('#cand').innerHTML = list.length ? list.slice((S.rpage-1)*ps, S.rpage*ps).map(function(c){
    var nw = (c.date||'').slice(0,7)===today.slice(0,7);   // 이번 달 게시글만 New
    return '<div class="ci"><span class="src">지자체</span><div><a href="'+esc(c.link)+'" target="_blank" rel="noopener">'+esc(c.title)+'</a>'+(nw?'<span class="new">New</span>':'')+
      '<div class="m">'+esc(sidoName(c.sido)+' '+c.sigungu)+(c.date?' · '+esc(c.date.replace(/-/g,'.')):'')+(c.st?' · '+(c.st==='off'?'접수 마감':'접수 중'):'')+' · '+esc(host(c.link))+'</div></div></div>';
  }).join('') : '<div class="empty"><b style="color:var(--ink)">'+(S.year>+today.slice(0,4)?S.year+'년 음식물처리기 보조금 게시글이 아직 지자체 누리집에 없습니다.':'조건에 맞는 지자체 게시글이 없습니다.')+'</b><br><small>2시간마다 지자체 누리집에서 \'음식물처리기·감량기 보조금·지원금\'을 검색해 '+S.year+'년 게시글이 올라오면 이곳에 보여줍니다.</small></div>';
  $('#radarInfo').textContent = list.length ? list.length+'건 · '+S.rpage+'/'+pages+'페이지' : '';
  $('#radarPg').innerHTML = list.length>ps ? pager(S.rpage,pages,'rpg') : '';
}

/* ── 자동완성 ── */
var sIdx=-1;
function suggest(){
  var v=$('#q').value; $('#searchBox').classList.toggle('has',!!v);
  var t=regionTokens(v), box=$('#sugg');
  if (!t.length || S.view==='products'){ box.classList.remove('on'); return; }
  var out=[];
  D.sido.forEach(function(s){ if (norm(s[0]+s[1]+(s[0]==='전남광주'?'광주전남전라남도':'')).indexOf(t[0])>=0) out.push({sido:s[0],sgg:null,l:s[1],c:R.regions.filter(function(r){return r.sido===s[0]}).length+'개 지자체'}); });
  R.regions.forEach(function(r){ var h=rhay(r.id); if (t.every(function(w){return h.indexOf(w)>=0})) out.push({sido:r.sido,sgg:r.name,l:r.name,s:sidoName(r.sido),c:rsl(rstate(r.id))}); });
  out=out.slice(0,8); sIdx=-1;
  box.innerHTML = out.map(function(o,i){ return '<button type="button" data-i="'+i+'"><span>'+esc(o.l)+(o.s?' <small>'+esc(o.s)+'</small>':'')+'</span><small>'+esc(o.c)+'</small></button>'; }).join('');
  box._o=out; box.classList.toggle('on', out.length>0 && document.activeElement===$('#q'));
}
function pick(o){ S.sido=o.sido; S.sgg=o.sgg; S.q=''; $('#q').value=''; $('#searchBox').classList.remove('has'); $('#sugg').classList.remove('on'); S.page=1; if (S.view!=='subsidy') setView('subsidy'); render(); focusSido(S.sido); }

/* ── 렌더 ── */
function render(){ try{ renderShops(); }catch(_e){}
  if (!D || !R) return;
  renderYearBar(); $('#yearLbl').textContent='· '+S.year+'년 사업';
  if (S.view==='subsidy'){ renderKPI(); renderIndex(); renderList(); renderMap(); }
  if (S.view==='products') renderProducts();
  renderRadar();
}
function setView(v){
  S.view=v; ['subsidy','products','radar'].forEach(function(k){ $('#v-'+k).hidden = k!==v; });
  document.querySelectorAll('.tab').forEach(function(t){ t.setAttribute('aria-selected', t.dataset.view===v); });
  $('#q').placeholder = v==='products' ? '브랜드·모델명 검색 — 예: 린클, 스마트카라, MNFD, 미생물' : '지역 또는 연관검색어 — 예: 서초구, 부산 연제 감량기, 함평 음식물처리기 지원금';
  $('#hint').hidden = v==='products';
  if (location.hash.slice(1)!==v){ try{ history.replaceState(null,'','#'+v); }catch(e){ location.hash=v; } }
  render();
}
function renderKw(){
  $('#kwN').textContent = (K.device||[]).length+(K.program||[]).length;
  $('#kwList').innerHTML = '<div class="grp">기기 명칭</div>'+(K.device||[]).map(function(w){return '<span class="chip">'+esc(w)+'</span>'}).join('')+
    '<div class="grp">지원 형태</div>'+(K.program||[]).map(function(w){return '<span class="chip">'+esc(w)+'</span>'}).join('');
}

/* ── 이벤트 ── */
document.addEventListener('click', function(ev){
  if (ev.target.closest('.telc,.act')) return;           // 전화번호는 눌러도 아무 동작 없음 · 버튼 영역은 행 열기와 분리
  var t=ev.target.closest('button,tr,circle,path,a'); if(!t) return;
  if (t.matches('a')) return;
  if (t.dataset.year){ S.year=+t.dataset.year; S.page=1; S.cpage=1; S.rpage=1; S.ppage=1; S.status='on'; indexRegions(); render(); return; }
  if (t.dataset.st!=null){ S.status=t.dataset.st; S.page=1; render(); return; }
  if (t.dataset.sido!=null && t.matches('.sb')){ S.sido=t.dataset.sido||null; S.sgg=null; S.page=1; render(); focusSido(S.sido); return; }
  if (t.dataset.sgg!=null){ S.sgg = S.sgg===t.dataset.sgg?null:t.dataset.sgg; S.page=1; render(); return; }
  if (t.matches('path.rg2')){ var p=t.dataset.r.split('|'); var nz=S.sido!==p[0];
    if (nz){ S.sido=p[0]; S.sgg=null; } else S.sgg = S.sgg===p[1]?null:p[1];
    S.page=1; render(); if (nz) focusSido(S.sido); return; }
  if (t.matches('circle.mk')){ var q=t.dataset.k.split('|'); S.sido=q[0]; S.sgg=q[1]; S.page=1; render(); var f=filtered(); if (f.length===1) openDrawer(f[0].id); return; }
  if (t.id==='mapAll'){ S.sido=null; S.sgg=null; S.page=1; render(); focusSido(null); return; }
  if (t.matches('tbody tr[data-id]')){ openDrawer(t.dataset.id); return; }
  if (false && t.matches('tbody tr[data-rid]')){ var x=t.dataset.rid.split('|'); S.sido=x[0]; S.sgg=x[1]; S.status='all'; S.page=1; setView('subsidy'); focusSido(S.sido); window.scrollTo({top:0,behavior:'smooth'}); return; }
  if (t.dataset.pg){ var pp=+t.dataset.pg; if (pp>=1){ S.page=pp; renderList(); } return; }
  if (t.dataset.ppg){ var pq=+t.dataset.ppg; if (pq>=1){ S.ppage=pq; renderProducts(); var tb=$('#prows'); if (tb) tb.closest('.card').scrollIntoView({behavior:'smooth',block:'start'}); } return; }
  if (t.dataset.rpg){ var rp=+t.dataset.rpg; if (rp>=1){ S.rpage=rp; renderRadar(); } return; }
  if (t.dataset.view){ setView(t.dataset.view); return; }
  if (t.dataset.pm){ S.pm=t.dataset.pm; S.ppage=1; renderProducts(); return; }
  if (t.dataset.pc){ S.pc = S.pc===t.dataset.pc?'all':t.dataset.pc; S.ppage=1; renderProducts(); return; }
  if (t.dataset.brand!=null){ S.brand=t.dataset.brand||null; S.ppage=1; renderProducts(); return; }
  if (t.dataset.i!=null && t.closest('#sugg')){ pick($('#sugg')._o[+t.dataset.i]); return; }
  if (t.id==='dx'){ closeDrawer(); return; }
  if (t.id==='qx'){ $('#q').value=''; S.q=''; $('#searchBox').classList.remove('has'); S.page=1; render(); return; }
  if (t.id==='zin'){ zoom(0.6); return; } if (t.id==='zout'){ zoom(1/0.6); return; }
  if (t.id==='refresh'){ load(true); return; }
  if (t.id==='kwToggle'){ var l=$('#kwList'); l.hidden=!l.hidden; t.textContent=l.hidden?'연관검색어 사전 보기':'접기'; return; }
});
$('#scrim').addEventListener('click', closeDrawer);
document.addEventListener('keydown', function(e){ if (e.key==='Escape'){ closeDrawer(); $('#sugg').classList.remove('on'); } });
var qT; $('#q').addEventListener('input', function(){ clearTimeout(qT); qT=setTimeout(function(){ S.q=$('#q').value; S.page=1; S.cpage=1; S.rpage=1; S.ppage=1; render(); suggest(); }, 120); });
$('#q').addEventListener('focus', suggest);
$('#q').addEventListener('blur', function(){ setTimeout(function(){ $('#sugg').classList.remove('on'); }, 150); });
$('#q').addEventListener('keydown', function(e){
  var b=$('#sugg'), o=b._o||[]; if (!b.classList.contains('on')||!o.length) return;
  if (e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); sIdx=(sIdx+(e.key==='ArrowDown'?1:-1)+o.length)%o.length; b.querySelectorAll('button').forEach(function(x,i){x.classList.toggle('act',i===sIdx)}); }
  if (e.key==='Enter' && sIdx>=0){ e.preventDefault(); pick(o[sIdx]); }
});
var tip=$('#tip');
$('#map').addEventListener('mousemove', function(ev){
  var t=ev.target, txt='';
  if (t.matches('path.rg2')||t.matches('circle.mk')){ var id=t.dataset.r||t.dataset.k, r=REG[id]; if (r){ var es=BYR[id]; txt=sidoName(r.sido)+' '+r.name+' · '+rsl(rstate(id))+(es.length?' · 공고 '+es.length+'건':''); } }
  if (!txt){ tip.classList.remove('on'); return; }
  var b=$('.mapbox').getBoundingClientRect(); tip.textContent=txt; tip.style.left=(ev.clientX-b.left)+'px'; tip.style.top=(ev.clientY-b.top)+'px'; tip.classList.add('on');
});
$('#map').addEventListener('mouseleave', function(){ tip.classList.remove('on'); });
window.addEventListener('hashchange', function(){ var h=location.hash.slice(1); if (['subsidy','products','radar'].indexOf(h)>=0 && h!==S.view) setView(h); });

/* ── 로드: 접속할 때마다 최신 JSON을 캐시 없이 다시 받음 ── */
/* 접속·새로고침할 때마다 GitHub 저장소의 최신 파일(자동 점검 결과)을 캐시 없이 직접 받음 → 실패 시 사이트 파일 → 페이지 내장본 */
var RAW='https://raw.githubusercontent.com/newyangs007/food-subsidy/main/';
function fetchJ(u){ return fetch(u+(u.indexOf('?')<0?'?':'&')+'t='+Date.now(), {cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }
function newer(a,b){ var ta=a&&a.updated_at||'', tb=b&&b.updated_at||''; return ta>=tb ? a : b; }
function getJSON(name){
  var emb=EMB[name.replace('.json','')]||null;
  return Promise.all([fetchJ(RAW+name).catch(function(){return null}), fetchJ(name).catch(function(){return null})])
    .then(function(r){ var x=r[0]&&r[1]?newer(r[0],r[1]):(r[0]||r[1]); return x? (emb&&x.updated_at&&emb.updated_at&&emb.updated_at>x.updated_at? emb : x) : emb; });
}
function toast(t){ var el=$('#toast'); if(!el) return; el.textContent=t; el.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(function(){el.classList.remove('on')},3200); }
function stamp(){
  nowD=kst(); today=ymd(nowD);
  $('#nowLbl').textContent = fmtDT(today+'T'+String(nowD.getHours()).padStart(2,'0')+':'+String(nowD.getMinutes()).padStart(2,'0'));
  $('#verLbl').textContent = D ? fmtDT(D.updated_at) : '–';
  $('#colLbl').textContent = V && V.updated_at ? fmtDT(V.updated_at) : '배포 후 2시간마다';
  var mt=(document.querySelector('meta[name=last-updated]')||{}).content||''; mt=mt.replace(' KST','').replace(' ','T');
  var lu=[D&&D.updated_at, V&&V.updated_at, C&&C.updated_at, mt].filter(Boolean).sort().pop();
  if (lu) $('#lastUpd').textContent = lu.slice(0,16).replace('T',' ').replace(/-/g,'.')+' (KST) · 공고 검증 '+fmtDT(D.updated_at)+' · 자동 점검 '+(V&&V.updated_at?fmtDT(V.updated_at):'배포 후 첫 실행 대기');
}
function load(isRefresh){
  var btn=$('#refresh'); btn.disabled=true; btn.classList.add('spin');
  var names=['data.json','products.json','candidates.json',G?null:'geo.json','regions.json','keywords.json','coverage.json','bestshops.json','link_check.json','site_check.json','gov_posts.json','coupang.json'];
  return Promise.all(names.map(function(n){ return n?getJSON(n):Promise.resolve(null); })).then(function(r){
    D=r[0]; P=r[1]; C=r[2]||{items:[]}; R=r[4]; K=r[5]||{}; V=r[6]||{regions:{}}; B=r[7]||{items:[]}; L=r[8]||{links:{}}; W=r[9]||{sites:{}}; GP=r[10]||{items:[]}; CP=r[11]||{items:[]};
    if (!G) { G=r[3]; buildMap(); }
    nowD=kst(); today=ymd(nowD);
    if (!S.year || (D.years||[]).indexOf(S.year)<0) S.year=autoYear();
    buildSyn(); indexRegions(); renderKw(); stamp(); render(); if (isRefresh===true) focusSido(S.sido);
    LAST=Date.now();
    if (isRefresh===true) toast('실시간 업데이트 완료 · 자동 점검 '+(V&&V.updated_at?fmtDT(V.updated_at):'대기')+' · 지금 '+$('#nowLbl').textContent+' 기준');
  }).catch(function(err){ try{console.error('load',err)}catch(_e){} if (isRefresh===true) toast('최신 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'); })
    .finally(function(){ btn.disabled=false; btn.classList.remove('spin'); });
}
/* 브라우저 확장 프로그램이 페이지 위에 끼워 넣는 '약관동의' 같은 버튼은 숨김(사이트가 만든 요소가 아님) */
(function(){
  var OWN={'scrim':1,'drawer':1,'pop':1,'toast':1};
  function txt(el){ var t=el.textContent||''; try{ if(el.shadowRoot) t+=el.shadowRoot.textContent||''; }catch(_e){} return t; }
  function sweep(){ [].slice.call(document.body.children).forEach(function(el){
    if (el.classList.contains('wrap') || OWN[el.id] || /^(SCRIPT|FORM|STYLE)$/.test(el.tagName)) return;
    if (/약관\s*동의/.test(txt(el))) el.style.setProperty('display','none','important'); }); }
  try{ new MutationObserver(sweep).observe(document.body,{childList:true}); }catch(_e){}
  sweep(); setTimeout(sweep,1500); setTimeout(sweep,5000);
})();
var h0=location.hash.slice(1); if (['products','radar'].indexOf(h0)>=0) S.view=h0;
setView(S.view);
var LAST=0;
load(false);
/* 페이지를 열어 둔 동안에도 5분마다, 그리고 다른 탭에서 돌아올 때 자동으로 최신화 */
setInterval(function(){ if (!document.hidden) load('auto'); }, 5*60*1000);
document.addEventListener('visibilitychange', function(){ if (!document.hidden && Date.now()-LAST>60*1000) load('auto'); });
setInterval(function(){ var d=ymd(kst()); if (d!==today && D){ var was=autoYear(); stamp(); if (S.year===was && autoYear()!==was){ S.year=autoYear(); indexRegions(); } render(); } }, 60000);
})();
