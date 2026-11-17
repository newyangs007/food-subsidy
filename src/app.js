(function(){
"use strict";
var EMB = {}; try { EMB = JSON.parse(document.getElementById('embed').textContent); } catch(e) {}
var D, P, C, G, R, K, V;            // data, products, candidates, geo, regions, keywords, coverage
var S = {year:null, rpage:1, view:'subsidy', status:'all', sido:null, sgg:null, q:'', page:1, ps:12, pm:'all', pc:'all', brand:null, cs:'all', csido:'', cdbl:'', cpage:1};
var $ = function(s){return document.querySelector(s)};
var esc = function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var ST = {on:'진행 중', chk:'확인 필요', soon:'예정', off:'종료'};
var RANK = {on:0, soon:1, chk:2, off:3};
var VF = {official:['o','공식 공고'], news:['n','언론 보도'], secondary:['s','2차 출처']};
var RS = {on:'접수 중', soon:'접수 예정', done:'운영·마감', none:'확인된 공고 없음', unk:'점검 대기'};
var RS_ORDER = ['on','soon','done','none','unk'];
var RS_COL = {on:'#34D399', soon:'#60A5FA', chk:'#FBBF24', auto:'#FBBF24', done:'#B6C2D2', none:'#E9EEF4', unk:'url(#hatch)'};
var SYN = [];
var today, nowD;

function kst(){ return new Date(Date.now()+(9*60+new Date().getTimezoneOffset())*60000); }
function ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function fmtDT(iso){ if(!iso) return null; var m=String(iso).match(/(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/); if(!m) return iso; return m[2]+'.'+m[3]+(m[4]?' '+m[4]+':'+m[5]:''); }
function md(s){ if(!s) return ''; var p=s.split('-'); return +p[1]+'.'+ +p[2]; }
function days(a,b){ return Math.round((new Date(b)-new Date(a))/864e5); }
var BLOGS=/(^|\.)(blog\.naver\.com|tistory\.com|brunch\.co\.kr|velog\.io|wikidocs\.net|tilnote\.io|make2t\.kr|jab-guyver\.co\.kr|foodwastesubsidy\.kr|yellowit\.co\.kr|studygov\.kr|glasswallet\.com|dikr\.co\.kr|icems2021\.com|naturelove40\.com|ajd\.co\.kr|gusle\.kr|thecheck\.co\.kr|wooyupost\.com|braindetox\.kr|post\.naver\.com|cafe\.naver\.com|medium\.com)$|blog/i;
function tier(u){ var h=host(u); if(!h) return 9; if (/\.go\.kr$/.test(h)) return 0; if (BLOGS.test(h)) return 2; return 1; }
var TIER=['공고문','뉴스','블로그'];
function bestLink(e){
  var c=[e.url].concat(e.sources||[]).filter(Boolean).filter(function(u,i,a){return a.indexOf(u)===i}).sort(function(a,b){return tier(a)-tier(b)});
  if (c.length) return {u:c[0], t:tier(c[0])};
  var r=REG[e.sido+'|'+e.sigungu]||{q:e.sigungu};
  return {u:'https://www.google.com/search?q='+encodeURIComponent('"'+r.q+'" 음식물처리기 감량기 보조금 '+(e.year||S.year)+' 공고 site:go.kr'), t:3};
}
function linkHTML(e, cls){ var b=bestLink(e); var lbl=b.t<3?TIER[b.t]+' 보기':'공고 찾기';
  return '<a class="go '+(cls||'')+' t'+b.t+'" href="'+esc(b.u)+'" target="_blank" rel="noopener" data-stop="1">'+lbl+' ↗</a>'; }
function host(u){ try{ return new URL(u).hostname.replace(/^www\.|^m\./,''); }catch(e){ return ''; } }

/* ── 공고 단위 상태 ── */
function status(e){
  if (e.closed) return 'off';
  if (e.start && e.start > today) return 'soon';
  if (e.end && e.end < today) return 'off';
  if (e.force) return e.force;
  if (e.verify === 'secondary') return 'chk';
  return 'on';
}
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
function rsl(k){ return k==='done' ? S.year+'년 운영·마감' : RS[k]; }
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
    if (S.status==='new') return isNew(e);
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
  var b=base(), c={all:b.length,on:0,new:0,chk:0,off:0,soon:0};
  b.forEach(function(e){ c[status(e)]++; if (isNew(e)) c.new++; });
  var defs=[['all','전체 공고',''],['on','진행 중','d-on'],['new','신규','d-new'],['off','종료','d-off']];
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
      return '<button class="chip" type="button" data-sgg="'+esc(r.name)+'" aria-pressed="'+(S.sgg===r.name)+'" title="'+rsl(st)+'"><i class="sw'+(st==='unk'?' unk':'')+'" style="width:9px;height:9px;'+(st!=='unk'?'background:'+RS_COL[st]:'')+'"></i>'+esc(r.name)+'</button>'; }).join('');
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
    var s=status(e), a=amount(e), v=VF[e.verify];
    var per = e.start ? md(e.start)+' ~ '+(e.end?md(e.end):'예산 소진 시') : '공고문 확인';
    var sub = s==='on' && e.end ? 'D-'+Math.max(0,days(today,e.end)) : s==='soon' ? days(today,e.start)+'일 후 시작' : (e.round||'');
    return '<tr data-id="'+e.id+'"><td class="rg"><b>'+esc(e.sigungu)+(isNew(e)?'<span class="new">신규</span>':'')+'</b><small>'+esc(sidoName(e.sido))+(e.round?' · '+esc(e.round):'')+'</small></td>'+
      '<td class="amt"><b>'+a.b+'</b><small>'+esc(a.s)+(e.note&&/최대/.test(e.note)?' · 우대 있음':'')+'</small></td>'+
      '<td class="per">'+per+'<small>'+esc(sub)+'</small></td>'+
      '<td><span class="st '+s+'"'+(s==='chk'?' title="'+CHK_TIP+'"':'')+'><i class="dot d-'+s+'"></i>'+ST[s]+'</span>'+(s==='chk'?'<span class="why">'+why(e)+'</span>':'')+'</td>'+
      '<td class="hide-m"><span class="vf '+v[0]+'"><i></i>'+v[1]+'</span></td>'+
      '<td>'+linkHTML(e)+'</td></tr>';
  }).join('');
  var card = S.sgg ? regionCard(S.sido+'|'+S.sgg) : '';
  if (!yItems().length){ var prev=(D.years||[]).filter(function(y){return y<S.year && yearStats(y).items}).pop(), st=yearStats(S.year);
    card = '<div class="rcard yempty"><h4>'+S.year+'년 음식물처리기 보조금 공고를 기다리는 중입니다</h4><p>'+esc(((D.year_meta||{})[S.year]||{}).note||'')+'</p>'+
      '<p>전국 '+R.regions.length+'개 지자체를 2시간마다 자동 점검해, '+S.year+'년 공고가 감지되면 지도와 목록에 바로 표시합니다.'+(st.auto?' 현재 <b>'+st.auto+'곳</b>에서 새 공고 신호가 감지됐어요 — 보조금 뉴스 탭에서 확인하세요.':'')+'</p>'+
      (prev?'<p style="margin-top:10px"><button class="btn" type="button" data-year="'+prev+'">'+prev+'년 공고 '+yearStats(prev).items+'건 보기</button></p>':'')+'</div>'+card; }
  $('#rows').innerHTML = rows || (yItems().length ? '<tr><td colspan="6" class="empty">'+S.year+'년 조건에 맞는 공고가 없습니다.</td></tr>' : '');
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
  var svg=$('#map'); FULL={x:-6,y:-6,w:G.w+12,h:G.h+12}; VB=Object.assign({},FULL);
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
  else { var fs=(13/z).toFixed(2), sw=(3.2/z).toFixed(2);
    R.regions.forEach(function(r){ if (r.sido!==S.sido) return; var c=G.cent[r.id]; if(!c) return; var st=rstate(r.id);
      lab+='<text class="ml" x="'+c[0]+'" y="'+c[1]+'" text-anchor="middle" font-size="'+fs+'" stroke-width="'+sw+'"'+(st==='unk'||st==='none'?' style="fill:#94A3B8;font-weight:500"':'')+'>'+esc(r.name)+'</text>'; }); }
  $('#labels').innerHTML=lab;
  var mk=''; R.regions.forEach(function(r){ if (rstate(r.id)!=='on' || !matchR(r.id)) return; var c=G.cent[r.id]; if(!c) return; var rr=(5.5/Math.pow(z,.8)).toFixed(2);
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
  var w=b.x2-b.x, h=b.y2-b.y, pad=Math.max(w,h)*0.12+4, ar=FULL.w/FULL.h;
  w+=pad*2; h+=pad*2; if (w/h>ar) h=w/ar; else w=h*ar;
  animateVB({x:(b.x+b.x2)/2-w/2, y:(b.y+b.y2)/2-h/2, w:w, h:h});
}
function zoom(f){ var cx=VB.x+VB.w/2, cy=VB.y+VB.h/2, w=Math.min(FULL.w,Math.max(30,VB.w*f)), h=w*FULL.h/FULL.w; animateVB({x:cx-w/2,y:cy-h/2,w:w,h:h}); }

/* ── 상세 패널 ── */
function openDrawer(id){
  var e=D.items.filter(function(x){return x.id===id})[0]; if(!e) return;
  var s=status(e), a=amount(e), v=VF[e.verify], rid=e.sido+'|'+e.sigungu, lv=dlevel(rid);
  var per = e.start ? e.start.replace(/-/g,'.')+' ~ '+(e.end?e.end.replace(/-/g,'.'):'예산 소진 시') : '공고문 확인';
  var f=function(lbl,val){ return '<dt>'+lbl+'</dt><dd>'+(val?esc(val):'<span style="color:var(--faint)">공고문에서 확인</span>')+'</dd>'; };
  var srcs=[e.url].concat(e.sources||[]).filter(Boolean).filter(function(u,i,arr){return arr.indexOf(u)===i}).sort(function(a,b){return tier(a)-tier(b)}), bl=bestLink(e);
  $('#drawer').innerHTML =
    '<button class="x2" type="button" id="dx" aria-label="닫기">×</button>'+
    '<div class="dh"><div class="r">'+esc(sidoName(e.sido))+(e.round?' · '+esc(e.round):'')+'</div><h3>'+esc(e.sigungu)+(isNew(e)?'<span class="new">신규</span>':'')+'</h3>'+
    '<span class="st '+s+'"><i class="dot d-'+s+'"></i>'+ST[s]+'</span> <span class="vf '+v[0]+'" style="margin-left:6px"><i></i>'+v[1]+' · '+esc(e.verified_at)+' 확인</span> <span class="dbl d'+lv+'" style="margin-left:4px">'+DL[lv]+'</span></div>'+
    '<div class="db"><div class="big"><div><small>지원금</small><b>'+a.b+'</b><small>'+esc(a.s)+'</small></div><div><small>신청기간</small><b style="font-size:15px">'+per+'</b><small>'+(s==='on'&&e.end?'마감까지 '+Math.max(0,days(today,e.end))+'일':'')+'</small></div></div>'+
    '<dl>'+(e.note?f('비고',e.note):'')+f('지원 대상',e.target)+f('필요 서류',e.docs)+f('신청 방법',e.how)+
    '<dt>전화번호</dt><dd>'+(e.phone?esc(e.phone):'<span style="color:var(--faint)">공고문·시군구청 대표번호로 문의</span>')+'</dd>'+
    (e.notice?f('공고 번호',e.notice):'')+
    '<dt>출처 (공고문 → 뉴스 → 블로그 순)</dt><dd class="srcs">'+srcs.map(function(u){return '<a href="'+esc(u)+'" target="_blank" rel="noopener"><b style="color:var(--ink2)">['+(TIER[tier(u)]||'기타')+']</b> '+esc(u.replace(/^https?:\/\//,'').slice(0,70))+'</a>'}).join('')+'</dd></dl>'+
    (e.verify==='secondary'?'<div class="warn">이 공고는 이미 마감된 것으로 확인된 2026년 사업입니다. 다음 모집은 해당 지자체 공고를 확인하세요.</div>':
      '<div class="ok">'+(e.verify==='official'?'지자체 공식 공고 본문과 대조했습니다.':'구청 보도자료 기반 언론 보도와 대조했습니다.')+' 예산 소진 시 조기 마감될 수 있습니다.</div>')+
    '</div><div class="df"><a class="btn dark" href="'+esc(bl.u)+'" target="_blank" rel="noopener">'+(bl.t<3?TIER[bl.t]+' 바로가기':'공고문 찾기')+' ↗</a>'+(e.phone?'<a class="btn" href="tel:'+esc(e.phone.replace(/[^0-9-]/g,''))+'">전화 '+esc(e.phone.replace(/\(.*\)/,''))+'</a>':'')+'</div>';
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
  $('#prows').innerHTML = grp.map(function(p){ return '<tr style="cursor:default"'+(p.mine?' class="mine"':'')+'><td><b>'+esc(p.brand)+'</b>'+(p.mine?'<span class="new" style="background:var(--soon)">등록 제품</span>':'')+'</td><td><div class="mdl">'+p.models.map(function(m){return '<span>'+esc(m)+'</span>'}).join('')+'</div></td><td style="font-size:13px">'+esc(p.method)+'</td><td><span class="cert '+esc(p.cert)+'">'+esc(p.cert)+'</span><div class="ls">'+esc(p.body)+'</div></td><td class="hide-m" style="font-size:12.5px">'+esc(p.maker)+'<div class="ls">'+esc(p.phone||'')+'</div></td><td class="hide-m"><span class="ls">'+({L26:'2026 공고',L25:'2025.6 목록',L27:'2027 공고'}[p.list]||p.list)+'</span></td></tr>'; }).join('') || (all.length?'':yearChecklist()) || '<tr><td colspan="6" class="empty">일치하는 모델이 없습니다. 목록에 없더라도 품질인증+KC를 받았다면 대상일 수 있으니 초록누리·제조사에 인증서를 확인하세요.</td></tr>';
  var L=P.lists; $('#plist').innerHTML='출처: <a href="'+L.L26.url+'" target="_blank" rel="noopener">'+L.L26.name+'</a> · <a href="'+L.L25.url+'" target="_blank" rel="noopener">'+L.L25.name+'</a> — 지자체마다 인정 목록이 다를 수 있습니다.';
}

function yearChecklist(){
  var m=(P.year_meta||{})[S.year]||{}, prev=(D.years||[]).filter(function(y){return y<S.year}).pop();
  return '<tr><td colspan="6" style="padding:0"><div class="rcard yempty"><h4>'+S.year+'년 지원 대상 제품 목록 — 공개 전</h4><p>'+esc(m.note||'')+'</p>'+
    (m.checklist?'<p style="margin-top:10px;font-weight:700;color:var(--ink)">'+S.year+'년 지원 대상이 되려면 (제조사 체크리스트)</p><ol class="ck">'+m.checklist.map(function(c){return '<li>'+esc(c)+'</li>'}).join('')+'</ol>':'')+
    (prev?'<p style="margin-top:10px"><button class="btn" type="button" data-year="'+prev+'">'+prev+'년 인증 제품 목록 참고하기</button></p>':'')+'</div></td></tr>';
}

/* ── 신규 감지: 공고문 → 뉴스 → 블로그 순, 10개씩 ── */
function ctier(c){
  if (/naver-blog/.test(c.via||'')) return 2;
  var src=(c.source||'')+' '+(String(c.title).split(' - ').pop()||'');
  if (c.source_url) { var t=tier(c.source_url); if (t===0||t===2) return t; }
  if (/브런치|블로그|티스토리|tistory|brunch|네이버 포스트|카페/i.test(src)) return 2;
  if (/(시청|구청|군청|도청|특별시|광역시)$/.test(src.trim()) || /\.go\.kr/.test(c.source_url||'')) return 0;
  return tier(c.link);
}
function renderRadar(){
  var it=((C&&C.items)||[]).filter(function(c){ return (c.year||2026)===S.year; });
  $('#radarN').textContent = it.length? ' '+it.length : '';
  $('#radarMeta').textContent = C&&C.updated_at ? '마지막 수집 '+fmtDT(C.updated_at)+' · 공고문 → 뉴스 → 블로그 순' : '';
  var q=regionTokens(S.q);
  var list=it.filter(function(c){ var h=norm(c.title+' '+c.sido+' '+c.sigungu); return q.every(function(w){return h.indexOf(w)>=0}); })
    .map(function(c){ c._t = ctier(c); return c; })
    .sort(function(a,b){ return (a._t-b._t) || ((b.published||'')>(a.published||'')?1:-1); });
  var ps=10, pages=Math.max(1,Math.ceil(list.length/ps)); if (S.rpage>pages) S.rpage=pages;
  $('#cand').innerHTML = list.length ? list.slice((S.rpage-1)*ps, S.rpage*ps).map(function(c){
    var nw = c.first_seen && days(c.first_seen.slice(0,10),today)<=3;
    return '<div class="ci"><span class="tg t'+c._t+'">'+(TIER[c._t]||'기타')+'</span><div><a href="'+esc(c.link)+'" target="_blank" rel="noopener">'+esc(c.title)+'</a>'+(nw?'<span class="new">신규</span>':'')+
      '<div class="m">'+[c.sido,c.sigungu].filter(Boolean).join(' ')+(c.published?' · '+fmtDT(c.published):'')+'</div>'+(c.desc?'<div class="d">'+esc(c.desc.slice(0,140))+'</div>':'')+'</div></div>';
  }).join('') : '<div class="empty"><b style="color:var(--ink)">아직 모인 보조금 뉴스가 없습니다.</b><br><small>2시간마다 전국 '+R.regions.length+'개 지자체를 점검해 새 공고·뉴스를 이곳에 모아 보여줍니다.</small></div>';
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
function render(){
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
  var t=ev.target.closest('button,tr,circle,path,a'); if(!t) return;
  if (t.matches('a')) return;
  if (t.dataset.year){ S.year=+t.dataset.year; S.page=1; S.cpage=1; S.status='all'; indexRegions(); render(); return; }
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
  if (t.dataset.rpg){ var rp=+t.dataset.rpg; if (rp>=1){ S.rpage=rp; renderRadar(); } return; }
  if (t.dataset.view){ setView(t.dataset.view); return; }
  if (t.dataset.pm){ S.pm=t.dataset.pm; renderProducts(); return; }
  if (t.dataset.pc){ S.pc = S.pc===t.dataset.pc?'all':t.dataset.pc; renderProducts(); return; }
  if (t.dataset.brand!=null){ S.brand=t.dataset.brand||null; renderProducts(); return; }
  if (t.dataset.i!=null && t.closest('#sugg')){ pick($('#sugg')._o[+t.dataset.i]); return; }
  if (t.id==='dx'){ closeDrawer(); return; }
  if (t.id==='qx'){ $('#q').value=''; S.q=''; $('#searchBox').classList.remove('has'); S.page=1; render(); return; }
  if (t.id==='zin'){ zoom(0.6); return; } if (t.id==='zout'){ zoom(1/0.6); return; }
  if (t.id==='refresh'){ load(true); return; }
  if (t.id==='kwToggle'){ var l=$('#kwList'); l.hidden=!l.hidden; t.textContent=l.hidden?'연관검색어 사전 보기':'접기'; return; }
});
$('#scrim').addEventListener('click', closeDrawer);
document.addEventListener('keydown', function(e){ if (e.key==='Escape'){ closeDrawer(); $('#sugg').classList.remove('on'); } });
var qT; $('#q').addEventListener('input', function(){ clearTimeout(qT); qT=setTimeout(function(){ S.q=$('#q').value; S.page=1; S.cpage=1; S.rpage=1; render(); suggest(); }, 120); });
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
function getJSON(name){
  return fetch(name+'?t='+Date.now(), {cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .catch(function(){ return EMB[name.replace('.json','')] || null; });
}
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
  var btn=$('#refresh'); btn.disabled=true; btn.style.opacity=.6;
  Promise.all(['data.json','products.json','candidates.json','geo.json','regions.json','keywords.json','coverage.json'].map(getJSON)).then(function(r){
    D=r[0]; P=r[1]; C=r[2]||{items:[]}; R=r[4]; K=r[5]||{}; V=r[6]||{regions:{}};
    if (!G) { G=r[3]; buildMap(); }
    nowD=kst(); today=ymd(nowD);
    if (!S.year || (D.years||[]).indexOf(S.year)<0) S.year=autoYear();
    buildSyn(); indexRegions(); renderKw(); stamp(); render(); if (isRefresh) focusSido(S.sido);
  }).finally(function(){ btn.disabled=false; btn.style.opacity=1; });
}
var h0=location.hash.slice(1); if (['products','radar'].indexOf(h0)>=0) S.view=h0;
setView(S.view);
load(false);
setInterval(function(){ var d=ymd(kst()); if (d!==today && D){ var was=autoYear(); stamp(); if (S.year===was && autoYear()!==was){ S.year=autoYear(); indexRegions(); } render(); } }, 60000);
})();
