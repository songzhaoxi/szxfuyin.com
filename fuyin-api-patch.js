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

  function catCardHtml(c){
    return '<div class="album-card fade-in" style="cursor:pointer;" onclick="loadCat('+c.id+',1)">'+
      '<div class="thumb" style="height:120px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3A2310,#5C3A1A);font-size:52px;">'+c.icon+'</div>'+
      '<div class="card-body"><div class="card-title" style="text-align:center;font-size:14px;">'+c.name+'</div></div></div>';
  }

  /** 通用渲染辅助 */
  function renderHeader(icon, title, sub){
    var head = document.createElement('div');
    head.className = 'section-header';
    head.innerHTML = '<div class="left"><div class="s-icon">'+icon+'</div><h3>'+title+'</h3>'+(sub?'<span style="color:#8A7A6A;font-size:11px;margin-left:8px;">'+sub+'</span>':'')+'</div>';
    return head;
  }
  function makeGrid(){
    var g = document.createElement('div');
    g.className = 'albums-grid';
    return g;
  }
  function showLoading(main, txt){
    main.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7A6A;">'+(txt||'⏳ 正在加载...')+'</div>';
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

  /** 🗂️ 分类总览页（福音TV App「分类」标签） */
  function renderCatHome(){
    var main = document.getElementById('mainContent');
    if(!main) return;
    main.innerHTML = '';
    main.appendChild(renderHeader('🗂️','福音TV视频分类','点击分类进入全部视频 · 共3375+部'));
    var grid = makeGrid();
    grid.innerHTML = FUYIN_CATS.map(catCardHtml).join('');
    main.appendChild(grid);
    main.appendChild(renderHeader('🔥','分类热门预览','每个分类最新视频'));
    var box = makeGrid();
    box.id = 'catPreviewGrid';
    box.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#8A7A6A;">⏳ 正在加载...</div>';
    main.appendChild(box);
    var pend = FUYIN_CATS.length;
    FUYIN_CATS.forEach(function(cat){
      api('/api/movie/lists?catid='+cat.id+'&page=1&pagesize=4').then(function(d){
        pend--;
        if(d && d.data && d.data.length && document.getElementById('catPreviewGrid')){
          var sec = document.createElement('div');
          sec.style.gridColumn = '1/-1';
          sec.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0 8px;"><b>'+cat.icon+' '+cat.name+'</b><a href="javascript:void(0)" style="color:var(--gold);font-size:11px;" onclick="loadCat('+cat.id+',1)">查看全部 ›</a></div>';
          var g = makeGrid();
          g.innerHTML = d.data.map(cardHtml).join('');
          sec.appendChild(g);
          document.getElementById('catPreviewGrid').appendChild(sec);
        }
        if(pend<=0){ var el=document.getElementById('catPreviewGrid'); if(el && !el.querySelector('.album-card')) el.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:20px;color:#8A7A6A;">暂无数据</div>'; }
      });
    });
  }

  /** 📚 专题页：用福音TV搜索API按关键词加载真实视频 */
  function renderTopicPage(page){
    var t = FUYIN_TOPICS[page] || {name:'专题', kw:''};
    var main = document.getElementById('mainContent');
    if(!main) return;
    showLoading(main, '⏳ 正在加载专题「'+t.name+'」...');
    api('/api/search/all?kw='+encodeURIComponent(t.kw||t.name)).then(function(d){
      var hits = [];
      if(d && d.results){
        for(var i=0;i<d.results.length;i++){
          var grp = d.results[i];
          if(grp.indexUid==='movie' && grp.hits) hits = hits.concat(grp.hits);
        }
      }
      main.innerHTML = '';
      main.appendChild(renderHeader(t.icon||'📚', t.name+'（专题）', hits.length?('共'+hits.length+'部相关视频'):''));
      var grid = makeGrid();
      if(hits.length){
        grid.innerHTML = hits.slice(0,24).map(cardHtml).join('');
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#8A7A6A;">😕 专题暂无数据，为您推荐热门视频</div>';
        api('/api/movie/tops?did=0').then(function(dd){
          var list = (dd && dd.new_list) ? dd.new_list.slice(0,12) : [];
          grid.innerHTML = list.map(cardHtml).join('');
        });
      }
      main.appendChild(grid);
    });
  }

  /** 📡 频道/直播页：福音TV最新节目+分类快捷入口（真实可播） */
  function renderLivesPage(){
    var main = document.getElementById('mainContent');
    if(!main) return;
    showLoading(main, '⏳ 正在加载福音TV频道...');
    api('/api/movie/tops?did=0').then(function(d){
      var list = (d && d.new_list) ? d.new_list : [];
      main.innerHTML = '';
      main.appendChild(renderHeader('📡','福音TV频道','最新节目 · 点击立即播放'));
      var grid = makeGrid();
      grid.innerHTML = list.slice(0,12).map(cardHtml).join('');
      main.appendChild(grid);
      main.appendChild(renderHeader('🗂️','频道分类','全部10大分类'));
      var cg = makeGrid();
      cg.innerHTML = FUYIN_CATS.map(catCardHtml).join('');
      main.appendChild(cg);
    });
  }

  /** 📰 文章阅读页：真实福音文章（内置完整内容） */
  function renderArticlesPage(){
    var main = document.getElementById('mainContent');
    if(!main) return;
    var arts = [
      {t:'上帝的爱（约翰福音3:16）', d:'神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。这节经文被称为"福音的核心"，道出了上帝对人类最深的爱与救赎计划……', c:'约3:16'},
      {t:'人如何得救？', d:'你若口里认耶稣为主，心里信神叫他从死里复活，就必得救。因为人心里相信，就可以称义；口里承认，就可以得救。——罗马书10:9-10', c:'罗10:9-10'},
      {t:'罪的工价与神的恩赐', d:'因为罪的工价乃是死；惟有神的恩赐，在我们的主基督耶稣里，乃是永生。——罗马书6:23。世人都犯了罪，亏缺了神的荣耀，但神以他的恩典白白地称我们为义。', c:'罗6:23'},
      {t:'耶稣说：我就是道路', d:'耶稣说："我就是道路、真理、生命；若不藉着我，没有人能到父那里去。"——约翰福音14:6。这是耶稣最著名的宣告之一，揭示了他作为唯一中保的身份。', c:'约14:6'},
      {t:'新造的人', d:'若有人在基督里，他就是新造的人，旧事已过，都变成新的了。——哥林多后书5:17。信主之后，生命被更新，拥有全新的盼望与方向。', c:'林后5:17'},
      {t:'祷告的力量', d:'应当一无挂虑，只要凡事藉着祷告、祈求和感谢，将你们所要的告诉神。神所赐出人意外的平安，必在基督耶稣里保守你们的心怀意念。——腓立比书4:6-7', c:'腓4:6-7'}
    ];
    main.innerHTML = '';
    main.appendChild(renderHeader('📰','文章阅读','圣经真理 · 福音信息'));
    var box = document.createElement('div');
    box.className = 'albums-grid';
    box.innerHTML = arts.map(function(a, i){
      return '<div class="album-card fade-in" style="cursor:pointer;" onclick="openArticle('+i+')">'+
        '<div class="thumb" style="height:110px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3A2310,#5C3A1A);font-size:34px;">📖</div>'+
        '<div class="card-body"><div class="card-title">'+a.t+'</div><div class="card-author">'+a.c+'</div></div></div>';
    }).join('');
    box.innerHTML += '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#8A7A6A;">📖 更多文章持续更新中...</div>';
    main.appendChild(box);
    window.__articles = arts;
    window.openArticle = function(i){
      var a = window.__articles[i]; if(!a) return;
      var main2 = document.getElementById('mainContent');
      main2.innerHTML = '';
      var head = renderHeader('📖', a.t, a.c);
      main2.appendChild(head);
      var div = document.createElement('div');
      div.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:22px;line-height:2;color:#D8C8B0;font-size:15px;';
      div.textContent = a.d;
      main2.appendChild(div);
      var back = document.createElement('div');
      back.style.cssText = 'text-align:center;margin:18px 0 40px;';
      back.innerHTML = '<button onclick="renderArticlesPage()" style="padding:9px 22px;background:var(--gold);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;">⬅ 返回文章列表</button>';
      main2.appendChild(back);
      try{ main2.scrollIntoView({behavior:'smooth'}); }catch(e){}
    };
  }

  /** ✝️ 福音信息页：福音核心信息+真实视频 */
  function renderGospelPage(){
    var main = document.getElementById('mainContent');
    if(!main) return;
    showLoading(main, '⏳ 正在加载福音信息...');
    api('/api/search/all?kw='+encodeURIComponent('福音')).then(function(d){
      var hits = [];
      if(d && d.results){
        for(var i=0;i<d.results.length;i++){
          var grp = d.results[i];
          if(grp.indexUid==='movie' && grp.hits) hits = hits.concat(grp.hits);
        }
      }
      main.innerHTML = '';
      main.appendChild(renderHeader('✝️','福音信息','好消息：神爱世人'));
      var msg = [
        '「神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。」—— 约翰福音3:16',
        '「你若口里认耶稣为主，心里信神叫他从死里复活，就必得救。」—— 罗马书10:9',
        '「因为罪的工价乃是死；惟有神的恩赐，在我们的主基督耶稣里，乃是永生。」—— 罗马书6:23',
        '「耶稣说：我就是道路、真理、生命；若不藉着我，没有人能到父那里去。」—— 约翰福音14:6'
      ];
      var div = document.createElement('div');
      div.style.cssText = 'background:linear-gradient(135deg,rgba(200,151,58,0.12),rgba(200,151,58,0.04));border:1px solid rgba(200,151,58,0.3);border-radius:12px;padding:20px 22px;line-height:2;color:#E8D8B8;font-size:14px;margin-bottom:24px;';
      div.innerHTML = msg.map(function(m){ return '<div style="margin-bottom:10px;">✝️ '+m+'</div>'; }).join('');
      main.appendChild(div);
      main.appendChild(renderHeader('🎬','福音相关视频', hits.length?('共'+hits.length+'部'):''));
      var grid = makeGrid();
      grid.innerHTML = (hits.length?hits.slice(0,12):[]).map(cardHtml).join('') || '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#8A7A6A;">暂无</div>';
      main.appendChild(grid);
    });
  }
  /** 👤 我的页面：播放历史（本地存储）+ 功能入口 */
  function renderMinePage(){
    var main = document.getElementById('mainContent');
    if(!main) return;
    main.innerHTML = '';
    main.appendChild(renderHeader('👤','我的','播放历史 · 收藏 · 设置'));
    var hist = [];
    try{ hist = JSON.parse(localStorage.getItem('fuyin_hist')||'[]'); }catch(e){}
    var sec = document.createElement('div');
    sec.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:18px;margin-bottom:20px;';
    sec.innerHTML = '<div style="display:flex;align-items:center;gap:14px;"><div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#B8860B);display:flex;align-items:center;justify-content:center;font-size:26px;">👤</div><div><div style="font-size:15px;font-weight:600;">福音同路人</div><div style="font-size:11px;color:#8A7A6A;margin-top:3px;">已观看 '+(hist.length||0)+' 部视频 · 收藏 0 部</div></div></div>';
    main.appendChild(sec);
    if(hist.length){
      main.appendChild(renderHeader('🕘','播放历史',hist.length+'条'));
      var g = makeGrid();
      g.innerHTML = hist.map(function(h){
        var pic = (h.pic||'').replace(/\\/g,'/');
        return '<div class="album-card fade-in" style="cursor:pointer;" onclick="openPlayer('+(h.movid||0)+',\''+(h.title||'').replace(/'/g,"\\'")+'\',\''+(h.actor||'').replace(/'/g,"\\'")+'\')">'+
          '<div class="thumb"><img src="'+(pic||'https://picsum.photos/seed/h'+(h.movid||0)+'/300/186')+'" loading="lazy" onerror="this.src=\'https://picsum.photos/seed/h'+(h.movid||0)+'/300/186\'"><div class="play-btn"><div class="play-btn-circle">▶</div></div></div>'+
          '<div class="card-body"><div class="card-title">'+(h.title||'')+'</div></div></div>';
      }).join('');
      main.appendChild(g);
      var clearBtn = document.createElement('div');
      clearBtn.style.cssText = 'text-align:center;margin:16px 0 40px;';
      clearBtn.innerHTML = '<button onclick="try{localStorage.removeItem(\'fuyin_hist\');renderMinePage();}catch(e){}" style="padding:8px 20px;background:rgba(255,80,80,0.15);color:#FF8080;border:1px solid rgba(255,80,80,0.3);border-radius:8px;cursor:pointer;font-size:12px;">🗑 清空历史</button>';
      main.appendChild(clearBtn);
    } else {
      main.appendChild(renderHeader('🕘','播放历史',''));
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:30px;color:#8A7A6A;background:rgba(255,255,255,0.03);border-radius:10px;';
      empty.innerHTML = '暂无播放记录，<a href="javascript:void(0)" style="color:var(--gold);" onclick="navTo(\'cats\',null)">去分类看看 ▶</a>';
      main.appendChild(empty);
    }
    main.appendChild(renderHeader('⚙️','更多功能',''));
    var feats = [
      {n:'全部视频', i:'📚', p:'all'},{n:'热播排行', i:'🔥', p:'hot'},{n:'最新发布', i:'✨', p:'new'},
      {n:'讲员列表', i:'👨‍🏫', p:'authors'},{n:'文章阅读', i:'📰', p:'articles'},{n:'福音信息', i:'✝️', p:'gospel'}
    ];
    var fg = makeGrid();
    fg.innerHTML = feats.map(function(f){
      return '<div class="album-card fade-in" style="cursor:pointer;" onclick="navTo(\''+f.p+'\',null)">'+
        '<div class="thumb" style="height:90px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3A2310,#5C3A1A);font-size:34px;">'+f.i+'</div>'+
        '<div class="card-body"><div class="card-title" style="text-align:center;font-size:13px;">'+f.n+'</div></div></div>';
    }).join('');
    main.appendChild(fg);
  }

  /** ℹ️ 关于我们 */
  function renderAboutPage(){
    var main = document.getElementById('mainContent');
    if(!main) return;
    main.innerHTML = '';
    main.appendChild(renderHeader('ℹ️','关于我们','福音传播爱'));
    var div = document.createElement('div');
    div.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;line-height:2.2;color:#D8C8B0;font-size:14px;';
    div.innerHTML =
      '<div style="text-align:center;font-size:40px;margin-bottom:10px;">✝️</div>'+
      '<div style="text-align:center;font-size:18px;font-weight:700;color:#E8B96A;margin-bottom:16px;">福音传播爱 · GOSPEL OF LOVE</div>'+
      '<p>本网站致力于传播基督耶稣的救赎福音，将福音TV的全部视频资源（10大分类 · 3375+部）与全部功能完整呈现给每一位寻求真理的朋友。</p>'+
      '<p>📖 视频资源：福音慕道、福音证道、婚姻家庭、赞美诗歌、福音见证、福音视频、圣乐崇拜、初信造就、福音动漫、神学课程</p>'+
      '<p>📡 数据来源：福音TV官方API（data-api.sanmanuela.net）实时数据，与福音TV App完全同源。</p>'+
      '<p>🙏 愿上帝赐福与你！</p>';
    main.appendChild(div);
    main.appendChild(renderHeader('🎬','推荐视频',''));
    api('/api/movie/tops?did=0').then(function(d){
      var list = (d && d.new_list) ? d.new_list.slice(0,8) : [];
      var g = makeGrid();
      g.innerHTML = list.map(cardHtml).join('');
      main.appendChild(g);
    });
  }

  /** 🔥 顶栏Tab（福音TV App风格：首页/分类/频道/阅读/圣经/我的） */
  window.switchTab = function(tab, el){
    var links = document.querySelectorAll('.topbar-nav a');
    for(var i=0;i<links.length;i++){ links[i].classList.remove('active'); }
    if(el) el.classList.add('active');
    try{ closeSidebar(); }catch(e){}
    if(tab==='bible'){ try{ openBible(); }catch(e){} return; }
    if(tab==='home'){ location.reload(); return; }
    var pageMap = {'movies':'all','cats':'cats','lives':'lives','articles':'articles','gospel':'gospel','mine':'mine','hot':'hot','new':'new'};
    navTo(pageMap[tab]||tab, null);
  };

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
    if(page==='cats'){ renderCatHome(); return; }
    if(page==='mine'){ renderMinePage(); return; }
    if(page.indexOf('topic_')===0){ renderTopicPage(page); return; }
    if(page==='lives'){ renderLivesPage(); return; }
    if(page==='articles'){ renderArticlesPage(); return; }
    if(page==='gospel'){ renderGospelPage(); return; }
    if(page==='about'){ renderAboutPage(); return; }
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
