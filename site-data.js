/* ============================================================
 * 福音传播爱 - 社交数据层 v1.0（评论/点赞/收藏/转发/弹幕/用户）
 * 双模运行：
 *   1) 云端模式：AUTH_API_BASE 配置了 Cloudflare Worker → 全站真实数据
 *   2) 本地模式：无后端 → localStorage 持久化，功能完整可用
 * 自动探测，无需人工干预。
 * ============================================================ */
(function(){
  'use strict';
  if(window.__siteData) return;
  window.__siteData = true;

  var API = (function(){
    try{
      if(window.AUTH_API_BASE) return String(window.AUTH_API_BASE).replace(/\/+$/,'');
      var s = localStorage.getItem('auth_api_base');
      if(s && /^https:\/\//.test(s) && !/trycloudflare\.com|loca\.lt|ngrok\.io/.test(s)) return s.replace(/\/+$/,'');
    }catch(e){}
    return '';
  })();

  var online = false;          // 是否云端
  var localStore = {};         // 本地缓存

  function lsGet(key, def){
    try{
      var v = localStorage.getItem('sd_' + key);
      return v ? JSON.parse(v) : (def !== undefined ? def : null);
    }catch(e){ return def !== undefined ? def : null; }
  }
  function lsSet(key, val){
    localStore[key] = val;
    try{ localStorage.setItem('sd_' + key, JSON.stringify(val)); }catch(e){}
  }

  /* ===== 当前用户 ===== */
  function currentUser(){
    try{
      var raw = localStorage.getItem('auth_user');
      if(raw){
        var u = JSON.parse(raw);
        if(u && (u.account || u.email || u.nickname)) return u;
      }
      var u2 = lsGet('site_user', null);
      if(u2) return u2;
    }catch(e){}
    return null;
  }
  function isLogin(){ return !!currentUser(); }
  function loginUser(user){
    try{ localStorage.setItem('auth_user', JSON.stringify(user)); }catch(e){}
    lsSet('site_user', user);
  }
  function logout(){
    try{
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_api_base');
    }catch(e){}
    lsSet('site_user', null);
  }

  /* ===== 云端请求 ===== */
  function req(path, opts){
    opts = opts || {};
    var headers = { 'Content-Type':'application/json', 'bypass-tunnel-reminder':'1' };
    var token = '';
    try{ token = localStorage.getItem('auth_token') || ''; }catch(e){}
    if(token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function(r){ return r.json().catch(function(){ return null; }); })
      .catch(function(){ return null; });
  }

  /* 探测后端是否在线 */
  function detect(){
    return new Promise(function(resolve){
      if(!API){ online = false; resolve(false); return; }
      req('/health').then(function(d){
        online = !!(d && (d.success !== false));
        resolve(online);
      }).catch(function(){ online = false; resolve(false); });
    });
  }

  /* ===== 评论 ===== */
  function getComments(videoKey){
    return new Promise(function(resolve){
      if(online){
        req('/social/comments?video=' + encodeURIComponent(videoKey)).then(function(d){
          if(d && d.success){ resolve(d.list || []); return; }
          resolve([]);
        });
      } else {
        var all = lsGet('comments', {});
        resolve(all[videoKey] || []);
      }
    });
  }
  function addComment(videoKey, text){
    return new Promise(function(resolve){
      var user = currentUser() || {};
      var name = user.nickname || user.account || user.email || '匿名家人';
      var avatar = user.avatar || '';
      var item = {
        id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
        video: videoKey,
        user: name,
        avatar: avatar,
        text: String(text).slice(0,500),
        time: Date.now(),
        likes: 0
      };
      if(online){
        req('/social/comments', { method:'POST', body:{ video:videoKey, text:item.text, user:name, avatar:avatar, email:(user.email||user.account||'') } }).then(function(d){
          if(d && d.success){ item.id = d.id || item.id; resolve({ ok:true, item:item }); return; }
          resolve({ ok:false, msg:(d && d.message) || '评论失败' });
        });
      } else {
        var all = lsGet('comments', {});
        var list = all[videoKey] || [];
        list.unshift(item);
        all[videoKey] = list.slice(0,200);
        lsSet('comments', all);
        resolve({ ok:true, item:item });
      }
    });
  }
  function delComment(videoKey, id){
    return new Promise(function(resolve){
      if(online){
        req('/social/comments/' + id, { method:'DELETE' }).then(function(d){
          resolve(!!(d && d.success));
        });
      } else {
        var all = lsGet('comments', {});
        var list = all[videoKey] || [];
        all[videoKey] = list.filter(function(c){ return c.id !== id; });
        lsSet('comments', all);
        resolve(true);
      }
    });
  }
  function likeComment(id, videoKey){
    return new Promise(function(resolve){
      if(online){
        req('/social/comments/' + id + '/like', { method:'POST' }).then(function(d){
          resolve(d || { ok:true });
        });
      } else {
        var all = lsGet('comments', {});
        var list = all[videoKey] || [];
        for(var i=0;i<list.length;i++){
          if(list[i].id === id){ list[i].likes = (list[i].likes||0) + 1; break; }
        }
        all[videoKey] = list;
        lsSet('comments', all);
        resolve({ ok:true });
      }
    });
  }

  /* ===== 点赞 / 收藏 / 转发 / 分享 ===== */
  function toggleAction(videoKey, type){
    return new Promise(function(resolve){
      var key = 'acts_' + type;
      var acts = lsGet(key, {});
      var now = !!acts[videoKey];
      if(online){
        var cu = currentUser() || {};
        req('/social/' + type, { method:'POST', body:{ video:videoKey, on:!now, user:(cu.nickname||cu.account||''), email:(cu.email||cu.account||'') } }).then(function(d){
          if(d && d.success){ resolve({ on:!!d.on, count:d.count }); return; }
          resolve({ on:!now, count:(acts[videoKey] ? 1 : 0) });
        });
      } else {
        if(now){ delete acts[videoKey]; } else { acts[videoKey] = Date.now(); }
        lsSet(key, acts);
        var cnt = lsGet('cnt_' + type, {});
        cnt[videoKey] = Math.max(0, (cnt[videoKey]||0) + (now ? -1 : 1));
        lsSet('cnt_' + type, cnt);
        resolve({ on:!now, count:cnt[videoKey] });
      }
    });
  }
  function getActions(videoKey){
    var out = {};
    ['like','fav','fwd','share'].forEach(function(type){
      var acts = lsGet('acts_' + type, {});
      var cnt = lsGet('cnt_' + type, {});
      out[type] = { on:!!acts[videoKey], count:cnt[videoKey] || (acts[videoKey] ? 1 : 0) };
    });
    return out;
  }
  /* 本地收藏列表（个人中心用） */
  function getFavs(){
    var acts = lsGet('acts_fav', {});
    return Object.keys(acts).map(function(k){ return k; });
  }

  /* ===== 弹幕 ===== */
  function getDanmaku(videoKey){
    return new Promise(function(resolve){
      if(online){
        req('/social/danmaku?video=' + encodeURIComponent(videoKey)).then(function(d){
          if(d && d.success){ resolve(d.list || []); return; }
          resolve([]);
        });
      } else {
        var all = lsGet('danmaku', {});
        resolve(all[videoKey] || []);
      }
    });
  }
  function addDanmaku(videoKey, text, time){
    return new Promise(function(resolve){
      var user = currentUser() || {};
      var name = user.nickname || user.account || user.email || '匿名家人';
      var item = { id:'d_'+Date.now()+'_'+Math.random().toString(36).slice(2,6), video:videoKey, text:String(text).slice(0,50), time:time||0, user:name };
      if(online){
        req('/social/danmaku', { method:'POST', body:{ video:videoKey, text:item.text, time:item.time, user:name } }).then(function(d){
          if(d && d.success){ item.id = d.id || item.id; resolve({ ok:true, item:item }); return; }
          resolve({ ok:false });
        });
      } else {
        var all = lsGet('danmaku', {});
        var list = all[videoKey] || [];
        list.push(item);
        if(list.length > 500) list = list.slice(-500);
        all[videoKey] = list;
        lsSet('danmaku', all);
        resolve({ ok:true, item:item });
      }
    });
  }

  /* ===== 播放历史 ===== */
  function addHistory(v){
    try{
      var h = JSON.parse(localStorage.getItem('fuyin_hist') || '[]');
      h = h.filter(function(x){ return x.movid !== (v.movid||v.id); });
      h.unshift(v);
      localStorage.setItem('fuyin_hist', JSON.stringify(h.slice(0,50)));
    }catch(e){}
  }

  /* ===== 统计（后台用） ===== */
  function getStats(){
    return {
      comments: Object.keys(lsGet('comments',{})).length,
      danmaku: Object.keys(lsGet('danmaku',{})).length,
      likes: Object.keys(lsGet('acts_like',{})).length,
      favs: Object.keys(lsGet('acts_fav',{})).length,
      forwards: Object.keys(lsGet('acts_fwd',{})).length,
      shares: Object.keys(lsGet('acts_share',{})).length,
      history: (function(){ try{ return JSON.parse(localStorage.getItem('fuyin_hist')||'[]').length; }catch(e){ return 0; } })(),
      online: online,
      apiBase: API
    };
  }
  /* 全部评论（后台管理用） */
  function getAllComments(){
    var all = lsGet('comments', {});
    var out = [];
    for(var k in all){
      (all[k]||[]).forEach(function(c){ out.push(c); });
    }
    out.sort(function(a,b){ return b.time - a.time; });
    return out;
  }
  /* 全站用户（后台管理用：本地模式只有当前用户） */
  function getAllUsers(){
    var users = [];
    try{
      var lu = JSON.parse(localStorage.getItem('local_users') || '{}');
      for(var k in lu){
        if(lu[k] && lu[k].account){
          users.push({ account:lu[k].account, type:lu[k].type||'email', nickname:lu[k].nickname||'', created_at:lu[k].created_at||Date.now(), role:'user' });
        }
      }
    }catch(e){}
    var cur = currentUser();
    if(cur && cur.account){
      if(!users.find(function(u){ return u.account === cur.account; })){
        users.push({ account:cur.account, nickname:cur.nickname||'', role:'user', created_at:Date.now() });
      }
    }
    return users;
  }

  window.SiteData = {
    API: API, online: online, detect: detect,
    currentUser: currentUser, isLogin: isLogin, loginUser: loginUser, logout: logout,
    getComments: getComments, addComment: addComment, delComment: delComment, likeComment: likeComment,
    toggleAction: toggleAction, getActions: getActions, getFavs: getFavs,
    getDanmaku: getDanmaku, addDanmaku: addDanmaku,
    addHistory: addHistory,
    getStats: getStats, getAllComments: getAllComments, getAllUsers: getAllUsers
  };

  // 启动自动探测
  detect();
})();
