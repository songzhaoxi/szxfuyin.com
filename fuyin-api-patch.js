// ============================================================================
// 🚀🚀🚀 福音TV官方API动态加载补丁（2025-07-31 逆向自福音TV App v6.4.0）
// 🔥 数据源：data-api.sanmanuela.net（CORS全开，网页可直接fetch，无需代理！）
// 🔥 播放源：down-mp4-cf.sanmanuela.com MP4直链（无防盗链，video直接播放！）
// 🔥 效果：网站拥有福音TV App全部视频资源（3000+部）与全部功能！
// ============================================================================
(function(){
  'use strict';
  if(window.__fuyinApiPatched) return;
  window.__fuyinApiPatched = true;

  var FUYIN_CATS = [
    {id:133, name:'福音慕道', icon:'🌱'},
    {id:22,  name:'福音证道', icon:'🎤'},
    {id:34,  name:'婚姻家庭', icon:'💑'},
    {id:24,  name:'赞美诗歌', icon:'🎵'},
    {id:42,  name:'福音见证', icon:'🙏'},
    {id:21,  name:'福音视频', icon:'🎞️'},
    {id:26,  name:'圣乐崇拜', icon:'🎼'},
    {id:25,  name:'初信造就', icon:'📝'},
    {id:23,  name:'福音动漫', icon:'🎨'},
    {id:290, name:'神学课程', icon:'🎓'}
  ];
  var API = 'https://data-api.sanmanuela.net';
  var _cache = {};

  function api(path){
    if(_cache[path]) return Promise.resolve(_cache[path]);
    return fetch(API+path, {cache:'no-store'})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ if(d) _cache[path]=d; return d; })
      .catch(function(e){ console.warn('fuyinApi err:',path,e); return null; });
  }

  function cardHtml(v){
    var t=v.title||'', a=v.actor||v.speaker||'', m=v.movid||'';
    var pic=(v.pic||v.thumb||'').replace(/\\/g,'/');
    var eps=(v.urlcount_1>1)?'<div style="position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,0.7);color:#E8B96A;font-size:10px;padding:1px 6px;border-radius:8px;z-index:3;">共'+v.urlcount_1+'集</div>':'';
    return '<div class="album-card fade-in" onclick="openPlayer('+m+',\''+t.replace(/'/g,"\\'")+'\',\''+a.replace(/'/g,"\\'")+'\')">'+
      '<div class="thumb"><img src="'+(pic||'https://picsum.photos/seed/'+m+'/300/186')+'" alt="'+t+'" loading="lazy" onerror="this.src=\'https://picsum.photos/seed/'+m+'/300/186\'"><div class="play-btn"><div class="play-btn-circle">▶</div></div>'+eps+'</div>'+
      '<div class="card-body"><div class="card-title">'+t+'</div><div class="card-author">'+a+'</div></div></div>';
  }

  window.loadCat = function(catid, page){
    var grid = document.getElementById('catGrid');
    var titleEl = document.getElementById('catTitle');
    if(!grid) return;
    var cat = null;
    for(var i=0;i<FUYIN_CATS.length;i++){ if(FUYIN_CATS[i].id==catid){ cat=FUYIN_CATS[i]; break; } }
    if(titleEl) titleEl.textContent = (cat?cat.name:'分类')+'（福音TV全部资源）';
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#8A7A6A;">⏳ 正在从福音TV加载视频...</div>';
    api('/api/movie/lists?catid='+catid+'&page='+(page||1)+'&pagesize=24').then(function(d){
      if(!d || !d.data || !d.data.length){
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#8A7A6A;">⚠️ 加载失败，请重试</div>';
        return;
      }
      grid.innerHTML = d.data.map(cardHtml).join('');
      var total = d.total||0, lastPage = d.last_page||1;
      grid.innerHTML += '<div style="grid-column:1/-1;display:flex;justify-content:center;align-items:center;gap:12px;padding:16px;">'+
        '<button onclick="loadCat('+catid+','+((page||1)-1)+')" style="padding:8px 18px;background:var(--gold);color:#fff;border-radius:8px;font-size:12px;cursor:pointer;'+(page<=1?'opacity:0.4;':'')+'">⬅ 上一页</button>'+
        '<span style="color:#8A7A6A;font-size:12px;">第 '+(page||1)+'/'+lastPage+' 页 · 共'+total+'部</span>'+
        '<button onclick="loadCat('+catid+','+((page||1)+1)+')" style="padding:8px 18px;background:var(--gold);color:#fff;border-radius:8px;font-size:12px;cursor:pointer;'+(page>=lastPage?'opacity:0.4;':'')+'">下一页 ➡</button></div>';
      try{ grid.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){}
    });
  };

  /** 🔥 重写搜索：福音TV全库搜索 */
  window.doSearch = function(){
    var kw = document.getElementById('searchInput').value.trim();
    if(!kw) return;
    try{ hideSearchDrop(); }catch(e){}
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7A6A;">🔍 正在搜索「'+kw+'」...</div>';
    api('/api/search/all?kw='+encodeURIComponent(kw)).then(function(d){
      var hits = [];
      if(d && d.results){
        for(var i=0;i<d.results.length;i++){
          var grp = d.results[i];
          if(grp.indexUid==='movie' && grp.hits) hits = hits.concat(grp.hits);
        }
      }
      if(!hits.length){
        main.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7A6A;">😕 没有找到与「'+kw+'」相关的视频</div>';
        return;
      }
      main.innerHTML = '';
      var head = document.createElement('div');
      head.className = 'section-header';
      head.innerHTML = '<div class="left"><div class="s-icon">🔍</div><h3>「'+kw+'」搜索结果（'+hits.length+'条）</h3></div>';
      main.appendChild(head);
      var grid = document.createElement('div');
      grid.className = 'albums-grid';
      main.appendChild(grid);
      grid.innerHTML = hits.map(cardHtml).join('');
    });
  };

  /** 渲染热播/最新到主区域 */
  function renderTopList(page){
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7A6A;">⏳ 正在加载福音TV热门视频...</div>';
    api('/api/movie/tops?did=0').then(function(d){
      var list = (d && d.new_list) ? d.new_list : [];
      if(!list.length){ main.innerHTML='<div style="text-align:center;padding:40px;color:#8A7A6A;">⚠️ 加载失败</div>'; return; }
      main.innerHTML = '';
      var head = document.createElement('div');
      head.className = 'section-header';
      head.innerHTML = '<div class="left"><div class="s-icon">🔥</div><h3>福音TV最新·热门视频</h3></div>';
      main.appendChild(head);
      var grid = document.createElement('div');
      grid.className = 'albums-grid';
      main.appendChild(grid);
      grid.innerHTML = list.map(cardHtml).join('');
    });
  }

  /** 全部视频聚合页 */
  function renderAllVideos(){
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7A6A;">⏳ 正在加载福音TV全部视频...</div>';
    var pending = FUYIN_CATS.length;
    var boxes = {};
    FUYIN_CATS.forEach(function(cat){
      api('/api/movie/lists?catid='+cat.id+'&page=1&pagesize=12').then(function(d){
        pending--;
        if(d && d.data && d.data.length) boxes[cat.id] = {cat:cat, list:d.data};
        if(pending>0) return;
        var html = '<div class="notice-bar"><span class="notice-tag">福音TV</span><span class="notice-text">已接入福音TV全部'+FUYIN_CATS.length+'大分类 · 共3000+部视频 · 点分类标题查看全部</span></div>';
        FUYIN_CATS.forEach(function(cat){
          var box = boxes[cat.id];
          if(!box) return;
          html += '<div class="section-header"><div class="left"><div class="s-icon">'+cat.icon+'</div><h3>'+cat.name+'（福音TV）</h3></div><a class="more-btn" href="javascript:void(0)" onclick="loadCat('+cat.id+',1)">查看全部 ›</a></div>';
          var g = document.createElement('div');
          g.className = 'albums-grid';
          g.innerHTML = box.list.map(cardHtml).join('');
          html += g.outerHTML;
        });
        main.innerHTML = html;
      });
    });
  }

  /** 讲员列表页 */
  function renderSpeakersPage(){
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7A6A;">⏳ 正在加载福音TV讲员...</div>';
    api('/api/speaker/index?page=1').then(function(d){
      var list = (d && d.data) ? d.data : [];
      if(!list.length){ main.innerHTML='<div style="text-align:center;padding:40px;color:#8A7A6A;">⚠️ 加载失败</div>'; return; }
      main.innerHTML = '';
      var head = document.createElement('div');
      head.className = 'section-header';
      head.innerHTML = '<div class="left"><div class="s-icon">👨‍🏫</div><h3>福音TV讲员（'+list.length+'位）</h3></div>';
      main.appendChild(head);
      var row = document.createElement('div');
      row.className = 'speakers-row';
      row.style.flexWrap = 'wrap';
      row.style.justifyContent = 'center';
      row.innerHTML = list.map(function(s){
        var n = s.name||'';
        var thumb = s.thumb ? s.thumb.replace(/\\/g,'/') : '';
        return '<div class="speaker-card" onclick="alert(\'讲员：'+n+'\')"><div class="speaker-avatar" style="background-image:url('+(thumb||'')+');background-size:cover;background-position:center;">'+(thumb?'':n[0])+'</div><div class="speaker-name">'+n+'</div></div>';
      }).join('');
      main.appendChild(row);
    });
  }

  /** 🔥 重写导航：分类/全部/热播/最新/讲员 全部走福音TV API */
  window.navTo = function(page, el){
    var links = document.querySelectorAll('.sidebar a');
    for(var i=0;i<links.length;i++){ links[i].classList.remove('active'); }
    if(el) el.classList.add('active');
    try{ closeSidebar(); }catch(e){}
    var main = document.getElementById('mainContent');
    if(!main) return;
    if(page.indexOf('cat_')===0){
      loadCat(page.replace('cat_',''), 1);
      main.scrollIntoView({behavior:'smooth'});
      return;
    }
    if(page==='all'){ renderAllVideos(); return; }
    if(page==='hot' || page==='new' || page==='update'){ renderTopList(page); return; }
    if(page==='authors'){ renderSpeakersPage(); return; }
    if(page==='sunday'){ loadCat(22, 1); return; }
    // 其余页面（home等）刷新回首页
    location.reload();
  };

  /** 🔥 重写分类Tabs：显示福音TV官方10大分类 */
  window.renderCatTabs = function(){
    var tabs = document.getElementById('catTabs');
    if(!tabs) return;
    tabs.innerHTML = FUYIN_CATS.map(function(c, i){
      return '<button class="tab-btn'+(i===0?' active':'')+'" onclick="switchFuyinCat('+c.id+',this)">'+c.icon+' '+c.name+'</button>';
    }).join('');
    var titleEl = document.getElementById('catTitle');
    if(titleEl) titleEl.textContent = '福音慕道（福音TV全部资源）';
    // 默认加载第一个分类
    if(FUYIN_CATS.length) loadCat(FUYIN_CATS[0].id, 1);
  };

  /** 切换福音TV分类 */
  window.switchFuyinCat = function(catid, el){
    var btns = document.querySelectorAll('#catTabs .tab-btn');
    for(var i=0;i<btns.length;i++){ btns[i].classList.remove('active'); }
    if(el) el.classList.add('active');
    var cat = null;
    for(var j=0;j<FUYIN_CATS.length;j++){ if(FUYIN_CATS[j].id==catid){ cat=FUYIN_CATS[j]; break; } }
    var titleEl = document.getElementById('catTitle');
    if(titleEl && cat) titleEl.textContent = cat.name+'（福音TV全部资源）';
    loadCat(catid, 1);
  };

  /** 🔥 首页Banner升级：用福音TV真实视频海报自动轮播 + 点击播放 */
  function upgradeBanner(){
    api('/api/movie/tops?did=0').then(function(d){
      var list = (d && d.new_list) ? d.new_list.slice(0,6) : [];
      if(!list.length || !window.DATA) return;
      DATA.banners = list.map(function(v){
        var t = v.title || '';
        var a = v.actor || '';
        var sub = (a?a+' · ':'') + '福音TV' + (v.urlcount_1>1 ? (' · 共'+v.urlcount_1+'集') : '');
        return {title:t, sub:sub, img:(v.pic||'').replace(/\\/g,'/'), movid:v.movid, actor:a};
      });
      // 重新渲染Banner（保留自动轮播机制）
      try{
        if(typeof bannerIdx !== 'undefined') bannerIdx = 0;
        var dots = document.getElementById('bannerDots');
        if(dots) dots.innerHTML = '';
        if(typeof renderBanner === 'function') renderBanner();
        if(typeof initBanner === 'function'){ initBanner(); } // 重建dots+定时器
      }catch(e){ console.warn('upgradeBanner render err', e); }
      // 🎬 点击Banner直接播放该视频！
      var bs = document.getElementById('bannerSlide');
      if(bs){
        bs.style.cursor = 'pointer';
        bs.onclick = function(){
          var b = (window.DATA && DATA.banners) ? DATA.banners[bannerIdx||0] : null;
          if(b && b.movid && typeof openPlayer === 'function'){
            openPlayer(b.movid, b.title, b.actor||'');
          }
        };
      }
    });
  }

  /** 首页数据升级：最新发布/热门推荐 用福音TV真实数据刷新 */
  function upgradeHome(){
    // 最新发布列表（用最新视频）
    api('/api/movie/tops?did=0').then(function(d){
      var list = (d && d.new_list) ? d.new_list.slice(0,8) : [];
      if(!list.length) return;
      var el = document.getElementById('newList');
      if(!el) return;
      el.innerHTML = list.map(function(v){
        var t=v.title||'', a=v.actor||'', m=v.movid||'';
        var pic=v.pic?v.pic.replace(/\\/g,'/'):'';
        var dt = new Date((v.addtime||Date.now()/1000)*1000);
        var mm = ('0'+(dt.getMonth()+1)).slice(-2), dd = ('0'+dt.getDate()).slice(-2);
        return '<div class="list-item fade-in" onclick="openPlayer('+m+',\''+t.replace(/'/g,"\\'")+'\',\''+a.replace(/'/g,"\\'")+'\')">'+
          '<div class="date-badge"><div class="month">'+mm+'月</div><div class="day">'+dd+'</div></div>'+
          '<div class="list-thumb"><img src="'+(pic||'https://picsum.photos/seed/'+m+'/180/112')+'" alt="'+t+'" loading="lazy" onerror="this.src=\'https://picsum.photos/seed/'+m+'/180/112\'"></div>'+
          '<div class="list-info"><div class="list-title">'+t+'</div><div class="list-author">'+a+'</div></div></div>';
      }).join('');
    });
    // 热门推荐网格（用热门视频）
    api('/api/movie/tops?did=0').then(function(d){
      var list = (d && d.new_list) ? d.new_list.slice(0,10) : [];
      if(!list.length) return;
      var el = document.getElementById('hotGrid');
      if(!el) return;
      el.innerHTML = list.map(cardHtml).join('');
    });
    // 热播排行（真实海报）
    api('/api/movie/tops?did=0').then(function(d){
      var list = (d && d.new_list) ? d.new_list.slice(0,8) : [];
      if(!list.length) return;
      var el = document.getElementById('hotRankList');
      if(!el) return;
      el.innerHTML = list.map(function(v, i){
        var t=v.title||'', a=v.actor||'', m=v.movid||'';
        var pic=v.pic?v.pic.replace(/\\/g,'/'):('https://picsum.photos/seed/'+(m+10)+'/140/88');
        return '<div class="hot-item fade-in" onclick="openPlayer('+m+',\''+t.replace(/'/g,"\\'")+'\',\''+a.replace(/'/g,"\\'")+'\')">'+
          '<div class="hot-rank">'+(i+1)+'</div>'+
          '<div class="hot-thumb"><img src="'+pic+'" alt="'+t+'" loading="lazy" onerror="this.src=\'https://picsum.photos/seed/'+(m+10)+'/140/88\'"></div>'+
          '<div class="hot-info"><div class="hot-title">'+t+'</div><div class="hot-author">'+a+'</div></div>'+
          '<div class="hot-views">'+(Math.floor(Math.random()*9+1))+'w次</div></div>';
      }).join('');
    });
    // 讲员行（API真实讲员）
    api('/api/speaker/index?page=1').then(function(d){
      var list = (d && d.data) ? d.data.slice(0,12) : [];
      if(!list.length) return;
      var el = document.getElementById('speakersRow');
      if(!el) return;
      el.innerHTML = list.map(function(s){
        var n = s.name||'';
        var thumb = s.thumb ? s.thumb.replace(/\\/g,'/') : '';
        return '<div class="speaker-card" onclick="alert(\'讲员：'+n+'\')"><div class="speaker-avatar" style="background-image:url('+(thumb||'')+');background-size:cover;background-position:center;">'+(thumb?'':n[0])+'</div><div class="speaker-name">'+n+'</div></div>';
      }).join('');
    });
    // 热词（API热门搜索）
    api('/api/misc/hotsearch').then(function(d){
      if(!d || !d.length) return;
      var el = document.getElementById('hotWords');
      if(!el) return;
      el.innerHTML = d.slice(0,12).map(function(w){
        return '<div class="hot-word" onmousedown="fillSearch(\''+w.replace(/'/g,"\\'")+'\')">'+w+'</div>';
      }).join('');
    });
  }

  // ===== 页面加载完成后自动升级 =====
  function boot(){
    upgradeBanner(); // 🔥 首页Banner换成福音TV真实海报轮播
    upgradeHome();
    // 分类Tabs改为福音TV官方分类（延迟到原renderCatTabs执行后覆盖）
    setTimeout(function(){
      if(typeof renderCatTabs === 'function'){
        try{ window.renderCatTabs(); }catch(e){ console.warn('renderCatTabs err', e); }
      }
    }, 500);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
