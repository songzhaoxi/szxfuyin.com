// ============================================================
// 福音传播爱 - 管理后台社交模块（接口状态/用户/评论/弹幕）
// 依赖：../site-data.js（SiteData 数据层）
// ============================================================
(function(){
'use strict';
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'"');}
function msg(s){var t=$('toast');if(t){t.textContent=s;t.style.display='block';setTimeout(function(){t.style.display='none';},2500);}}
function fmtTime(ts){try{var d=new Date(ts);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}catch(e){return '';}}

function apiBase(){
  try{
    if(window.AUTH_API_BASE) return String(window.AUTH_API_BASE).replace(/\/+$/,'');
    var s=localStorage.getItem('auth_api_base');
    if(s&&/^https:\/\//.test(s)) return s.replace(/\/+$/,'');
  }catch(e){}
  return '';
}
function cloudReq(path){
  var base=apiBase();
  if(!base) return Promise.resolve(null);
  return fetch(base+path,{headers:{'Content-Type':'application/json','bypass-tunnel-reminder':'1'}})
    .then(function(r){return r.json().catch(function(){return null;});})
    .catch(function(){return null;});
}

/* ===== 🔌 接口状态检测 ===== */
window.checkApis=function(){
  var base=apiBase();
  var box=$('apiStatusList');
  var st=$('apiStats');
  if(!box)return;
  box.innerHTML='<div style="font-size:12px;color:#8a7a6a;padding:8px;">⏳ 正在检测接口...</div>';
  var endpoints=[
    {name:'认证服务 /health', path:'/health'},
    {name:'评论接口 /social/comments', path:'/social/comments?video=1'},
    {name:'弹幕接口 /social/danmaku', path:'/social/danmaku?video=1'},
    {name:'统计接口 /social/stats', path:'/social/stats'},
    {name:'用户接口 /social/users', path:'/social/users'},
    {name:'全部评论 /social/all-comments', path:'/social/all-comments?limit=1'}
  ];
  if(st){
    st.innerHTML='<div class="stat-card"><div class="num">'+(base?'☁️':'🏠')+'</div><div class="label">'+(base?'云端模式':'本地模式')+'</div></div>';
  }
  if(!base){
    box.innerHTML='<div style="padding:12px;border-left:4px solid #c8973a;background:#fdf3e0;border-radius:6px;font-size:13px;color:#6b5a4a;">'+
      '当前为 <b>本地模式</b>（localStorage 持久化）——所有社交功能已可用，数据保存在访客浏览器。<br>'+
      '如需全站真实云端数据，请在上方填入 Cloudflare Worker 地址（部署 <code>auth-worker.js</code> 后获得），点击"保存"即自动切换云端模式 ✝</div>';
    return;
  }
  var html='';
  endpoints.forEach(function(ep,i){
    html+='<div id="apiRow'+i+'" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #f0ebe3;font-size:13px;">'+
      '<span>'+ep.name+'</span><span style="color:#8a7a6a;font-size:11px;">检测中...</span></div>';
  });
  box.innerHTML=html;
  endpoints.forEach(function(ep,i){
    cloudReq(ep.path).then(function(d){
      var row=$('apiRow'+i);
      if(!row)return;
      var ok=!!(d&&d.success!==false);
      row.querySelector('span:last-child').innerHTML=ok
        ? '<span style="color:#2e8b57;font-weight:600;">✅ 正常</span>'
        : '<span style="color:#c0392b;font-weight:600;">❌ 异常</span>';
    });
  });
};

window.saveApiBase=function(){
  var inp=$('apiBaseInput');
  if(!inp)return;
  var v=inp.value.trim().replace(/\/+$/,'');
  if(v && !/^https:\/\//.test(v)){ msg('请输入 https:// 开头的 Worker 地址'); return; }
  try{
    if(v) localStorage.setItem('auth_api_base',v);
    else localStorage.removeItem('auth_api_base');
  }catch(e){}
  msg(v?'云端模式已启用，接口重新检测中...':'已切换回本地模式');
  setTimeout(checkApis,300);
  setTimeout(function(){ if(window.SiteData && SiteData.detect) SiteData.detect(); },300);
};

/* ===== 👥 用户管理 ===== */
var allUsers=[];
window.renderUsers=function(){
  var box=$('userList'); if(!box)return;
  var q=($('userSearch')?$('userSearch').value:'').trim().toLowerCase();
  allUsers=[];
  // 本地用户
  try{
    var lu=JSON.parse(localStorage.getItem('local_users')||'{}');
    for(var k in lu){ if(lu[k]&&lu[k].account) allUsers.push({account:lu[k].account,nickname:lu[k].nickname||'',role:'user',created_at:lu[k].created_at||Date.now(),src:'本地'}); }
  }catch(e){}
  // 当前登录用户
  try{
    var cu=JSON.parse(localStorage.getItem('auth_user')||'null');
    if(cu&&cu.account&&!allUsers.find(function(u){return u.account===cu.account;}))
      allUsers.push({account:cu.account,nickname:cu.nickname||'',role:'user',created_at:Date.now(),src:'本地'});
  }catch(e){}
  // 云端用户
  cloudReq('/social/users').then(function(d){
    if(d&&d.success&&d.list){
      d.list.forEach(function(u){
        if(!allUsers.find(function(x){return x.account===u.email;}))
          allUsers.push({account:u.email,nickname:u.nickname||'',role:u.role||'user',created_at:u.created_at||0,src:'云端'});
      });
    }
    _drawUsers(q);
  });
  _drawUsers(q);
};
function _drawUsers(q){
  var box=$('userList'); if(!box)return;
  var list=allUsers.filter(function(u){ return !q || (u.account||'').toLowerCase().indexOf(q)>=0 || (u.nickname||'').toLowerCase().indexOf(q)>=0; });
  box.innerHTML=list.map(function(u,i){
    return '<tr><td>'+esc(u.account)+' <span style="font-size:10px;color:#8a7a6a;">['+(u.src||'')+']</span></td>'+
      '<td>'+esc(u.nickname||'-')+'</td>'+
      '<td>'+esc(u.role||'user')+'</td>'+
      '<td>'+fmtTime(u.created_at)+'</td>'+
      '<td class="actions"><button class="btn-d" onclick="delUser('+i+')">🗑️</button></td></tr>';
  }).join('')||'<tr><td colspan="5" style="text-align:center;color:#8a7a6a;">暂无用户</td></tr>';
  var info=$('userInfo');
  if(info) info.textContent='共 '+allUsers.length+' 位用户（本地 '+allUsers.filter(u=>u.src==='本地').length+' / 云端 '+allUsers.filter(u=>u.src==='云端').length+'）';
}
window.delUser=function(idx){
  var u=allUsers[idx]; if(!u)return;
  if(!confirm('确定删除用户 '+u.account+' ？（仅本地数据可删，云端请到 Worker 管理）'))return;
  if(u.src==='本地'){
    try{
      var lu=JSON.parse(localStorage.getItem('local_users')||'{}');
      delete lu[u.account.toLowerCase()];
      localStorage.setItem('local_users',JSON.stringify(lu));
      msg('用户已删除');
      renderUsers();
    }catch(e){ msg('删除失败'); }
  }else{
    msg('云端用户请在 Cloudflare Worker 后台管理');
  }
};

/* ===== 💬 评论管理 ===== */
var allComments=[];
window.renderComments=function(){
  var box=$('commentList'); if(!box)return;
  var q=($('commentSearch')?$('commentSearch').value:'').trim().toLowerCase();
  allComments=[];
  // 本地评论
  try{
    var cm=JSON.parse(localStorage.getItem('sd_comments')||'{}');
    for(var k in cm){
      (cm[k]||[]).forEach(function(c){ c.videoKey=k; c.src='本地'; allComments.push(c); });
    }
  }catch(e){}
  // 云端评论
  cloudReq('/social/all-comments?limit=200').then(function(d){
    if(d&&d.success&&d.list){
      d.list.forEach(function(c){ if(!allComments.find(function(x){return x.id===c.id;})){ c.src='云端'; allComments.push(c); } });
    }
    _drawComments(q);
  });
  _drawComments(q);
};
function _drawComments(q){
  var box=$('commentList'); if(!box)return;
  var list=allComments.filter(function(c){ return !q || (c.text||'').toLowerCase().indexOf(q)>=0 || (c.user||'').toLowerCase().indexOf(q)>=0; });
  box.innerHTML=list.slice(0,200).map(function(c,i){
    return '<tr><td>'+esc(c.user||'匿名')+'</td>'+
      '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+esc(c.videoKey||'')+'">'+esc(c.videoKey||'-')+'</td>'+
      '<td style="max-width:260px;">'+esc(c.text)+'</td>'+
      '<td>'+fmtTime(c.time)+'</td>'+
      '<td>'+(c.likes||0)+'</td>'+
      '<td class="actions"><button class="btn-d" onclick="delComment('+i+')">🗑️</button></td></tr>';
  }).join('')||'<tr><td colspan="6" style="text-align:center;color:#8a7a6a;">暂无评论</td></tr>';
  var info=$('commentInfo');
  if(info) info.textContent='共 '+allComments.length+' 条评论（本地 '+allComments.filter(c=>c.src==='本地').length+' / 云端 '+allComments.filter(c=>c.src==='云端').length+'）';
}
window.delComment=function(idx){
  var c=allComments[idx]; if(!c)return;
  if(!confirm('确定删除这条评论？'))return;
  if(c.src==='本地'){
    try{
      var cm=JSON.parse(localStorage.getItem('sd_comments')||'{}');
      cm[c.videoKey]=(cm[c.videoKey]||[]).filter(function(x){return x.id!==c.id;});
      localStorage.setItem('sd_comments',JSON.stringify(cm));
      msg('评论已删除');
      renderComments();
    }catch(e){ msg('删除失败'); }
  }else{
    var base=apiBase();
    if(!base){ msg('云端评论需配置 Worker 地址'); return; }
    fetch(base+'/social/comments/'+encodeURIComponent(c.id)+'?video='+encodeURIComponent(c.videoKey),{method:'DELETE',headers:{'Content-Type':'application/json'}})
      .then(function(r){return r.json().catch(function(){return{};});})
      .then(function(d){ if(d&&d.success){msg('评论已删除');renderComments();} else msg('删除失败'); });
  }
};

/* ===== 💥 弹幕管理 ===== */
var allDanmaku=[];
window.renderDanmaku=function(){
  var box=$('danmakuList'); if(!box)return;
  allDanmaku=[];
  try{
    var dm=JSON.parse(localStorage.getItem('sd_danmaku')||'{}');
    for(var k in dm){
      (dm[k]||[]).forEach(function(d){ d.videoKey=k; d.src='本地'; allDanmaku.push(d); });
    }
  }catch(e){}
  // 云端弹幕统计
  cloudReq('/social/stats').then(function(d){
    if(d&&d.success&&d.stats){
      var st=$('danmakuStats');
      if(st){
        st.innerHTML='<div class="stat-card"><div class="num">'+d.stats.danmaku+'</div><div class="label">云端弹幕视频数</div></div>'+
          '<div class="stat-card"><div class="num">'+d.stats.comments+'</div><div class="label">云端评论视频数</div></div>'+
          '<div class="stat-card"><div class="num">'+d.stats.likes+'</div><div class="label">云端点赞</div></div>'+
          '<div class="stat-card"><div class="num">'+d.stats.favs+'</div><div class="label">云端收藏</div></div>';
      }
    }
  });
  var h='<div class="stat-card"><div class="num">'+allDanmaku.length+'</div><div class="label">本地弹幕总数</div></div>';
  var st=$('danmakuStats');
  if(st) st.innerHTML=h;
  box.innerHTML=allDanmaku.slice(-200).reverse().map(function(d,i){
    return '<tr><td>'+esc(d.user||'匿名')+'</td>'+
      '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+esc(d.videoKey||'')+'">'+esc(d.videoKey||'-')+'</td>'+
      '<td style="max-width:260px;">'+esc(d.text)+'</td>'+
      '<td>'+Math.floor(d.time||0)+'s</td>'+
      '<td class="actions"><button class="btn-d" onclick="delDanmaku('+i+')">🗑️</button></td></tr>';
  }).join('')||'<tr><td colspan="5" style="text-align:center;color:#8a7a6a;">暂无弹幕</td></tr>';
};
window.delDanmaku=function(idx){
  var d=allDanmaku[idx]; if(!d)return;
  if(!confirm('确定删除这条弹幕？'))return;
  if(d.src==='本地'){
    try{
      var dm=JSON.parse(localStorage.getItem('sd_danmaku')||'{}');
      dm[d.videoKey]=(dm[d.videoKey]||[]).filter(function(x){return x.id!==d.id;});
      localStorage.setItem('sd_danmaku',JSON.stringify(dm));
      msg('弹幕已删除');
      renderDanmaku();
    }catch(e){ msg('删除失败'); }
  }else{
    msg('云端弹幕删除请到 Cloudflare Worker 后台管理');
  }
};

// 初始化：默认加载接口状态
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){checkApis();});}
else{setTimeout(checkApis,100);}
})();
