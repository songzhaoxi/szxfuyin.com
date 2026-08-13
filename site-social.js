/* 福音传播爱 - 社交UI组件 v1.0（依赖 site-data.js） */
(function(){
'use strict';
if(window.SocialUI) return;
var SD=window.SiteData||null;
var curVideoKey='',curVideoTitle='',danmakuList=[],danmakuTimer=null,danmakuOn=true,lastDanmakuIdx=0;

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'"').replace(/'/g,'&#39;');}
function fmtTime(ts){try{var d=new Date(ts);return ('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}catch(e){return '';}}
function toast(msg){var t=document.getElementById('socialToast');if(!t){t=document.createElement('div');t.id='socialToast';t.style.cssText='position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(0,0,0,0.82);color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;pointer-events:none;transition:opacity .3s;';document.body.appendChild(t);}t.textContent=msg;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(function(){t.style.opacity='0';},2200);}

/* ===== 顶栏用户区 ===== */
function initTopbar(){
  var user=SD.currentUser();
  var avatar=document.querySelector('.topbar-right .avatar');
  var loginBtn=document.querySelector('.topbar-right .login-btn');
  if(!avatar)return;
  if(user){
    avatar.innerHTML=user.avatar?'<img src="'+esc(user.avatar)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">':esc((user.nickname||user.account||'👤').slice(0,1));
    avatar.title=user.nickname||user.account||'个人中心';
    avatar.onclick=function(){openMine();};
    if(loginBtn){loginBtn.textContent=user.nickname||user.account||'我的';loginBtn.onclick=function(){openMine();};}
  }else{
    avatar.innerHTML='👤';
    avatar.onclick=function(){try{location.href='auth.html';}catch(e){}};
    if(loginBtn){loginBtn.textContent='登录/注册';loginBtn.onclick=function(){try{location.href='auth.html';}catch(e){}};}
  }
  var sidebar=document.getElementById('sidebar');
  if(sidebar&&!document.getElementById('sidebarMineLink')){
    var mine=document.createElement('a');
    mine.id='sidebarMineLink';mine.href='#';
    mine.onclick=function(e){e.preventDefault();openMine();};
    mine.innerHTML='<span class="s-icon">👤</span>我的个人中心';
    var otherSec=sidebar.querySelector('.sidebar-section:last-child');
    if(otherSec)otherSec.appendChild(mine);
  }
}

/* ===== 个人中心 ===== */
function openMine(){
  var user=SD.currentUser();
  if(!user){toast('请先登录 🙏');try{location.href='auth.html';}catch(e){}return;}
  var main=document.getElementById('mainContent');
  if(!main)return;
  var favs=SD.getFavs();
  var h=[];try{h=JSON.parse(localStorage.getItem('fuyin_hist')||'[]');}catch(e){}
  var nick=user.nickname||'亲爱的家人';
  var acc=user.account||user.email||'';
  main.innerHTML='';
  main.innerHTML='<div class="notice-bar"><span class="notice-tag">个人中心</span><span class="notice-text">欢迎回家，'+esc(nick)+' 🙏</span></div>'+
    '<div style="background:linear-gradient(135deg,#3D1F05,#7A4A1E);border-radius:14px;padding:26px 22px;margin-bottom:18px;display:flex;align-items:center;gap:18px;color:#fff;">'+
    '<div style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:32px;border:2px solid rgba(232,185,106,0.6);flex-shrink:0;">'+(user.avatar?'<img src="'+esc(user.avatar)+'" style="width:100%;height:100%;object-fit:cover;">':esc((nick||'👤').slice(0,1)))+'</div>'+
    '<div style="flex:1;min-width:0;">'+
    '<div style="font-size:20px;font-weight:700;color:#E8B96A;">'+esc(nick)+'</div>'+
    '<div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;">用户名：'+esc(acc)+'</div>'+
    '<div style="font-size:12px;color:rgba(255,255,255,0.45);margin-top:6px;">收藏 '+favs.length+' 部 · 看过 '+h.length+' 部</div>'+
    '</div>'+
    '<button onclick="SocialUI.logout()" style="flex-shrink:0;padding:8px 16px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;background:rgba(255,255,255,0.08);color:#fff;font-size:12px;cursor:pointer;">退出登录</button>'+
    '</div>';
  main.innerHTML+='<div class="section-header"><div class="left"><div class="s-icon">⭐</div><h3>我的收藏</h3></div></div>';
  if(favs.length){
    main.innerHTML+='<div class="albums-grid" id="mineFavGrid"></div>';
    var grid=document.getElementById('mineFavGrid');
    favs.slice(0,24).forEach(function(k){
      var parts=k.split('|');
      var title=decodeURIComponent(parts[1]||'')||'收藏的视频';
      var movid=parts[0]||'';
      grid.innerHTML+='<div class="album-card fade-in" onclick="try{openPlayer('+(parseInt(movid)||0)+',\''+esc(title).replace(/'/g,"\\'")+'\')}catch(e){}">'+
        '<div class="thumb" style="background:linear-gradient(135deg,#3D1F05,#7A4A1E);display:flex;align-items:center;justify-content:center;font-size:34px;">⭐</div>'+
        '<div class="card-body"><div class="card-title">'+esc(title)+'</div><div class="card-author">已收藏</div></div></div>';
    });
  }else{
    main.innerHTML+='<div style="text-align:center;padding:26px;color:#8A7A6A;background:rgba(255,255,255,0.5);border-radius:10px;font-size:13px;">还没有收藏视频，去视频页点"⭐ 收藏"吧</div>';
  }
  main.innerHTML+='<div class="section-header" style="margin-top:20px;"><div class="left"><div class="s-icon">🕘</div><h3>播放历史</h3></div></div>';
  if(h.length){
    main.innerHTML+='<div class="albums-list" id="mineHistList"></div>';
    var hl=document.getElementById('mineHistList');
    h.slice(0,12).forEach(function(v){
      var t=v.title||v.t||'未知视频';
      var a=v.actor||v.author||'';
      var pic=(v.pic||'').replace(/\\/g,'/');
      hl.innerHTML+='<div class="list-item" onclick="try{openPlayer('+(v.movid||0)+',\''+esc(t).replace(/'/g,"\\'")+'\',\''+esc(a).replace(/'/g,"\\'")+'\')}catch(e){}">'+
        '<div class="list-thumb"><img src="'+(pic||'https://picsum.photos/seed/'+(v.movid||0)+'/180/112')+'" loading="lazy" onerror="this.src=\'https://picsum.photos/seed/'+(v.movid||0)+'/180/112\'"></div>'+
        '<div class="list-info"><div class="list-title">'+esc(t)+'</div><div class="list-author">'+esc(a)+'</div></div></div>';
    });
  }else{
    main.innerHTML+='<div style="text-align:center;padding:26px;color:#8A7A6A;background:rgba(255,255,255,0.5);border-radius:10px;font-size:13px;">暂无播放记录</div>';
  }
  try{window.scrollTo({top:0});}catch(e){}
  try{closeSidebar();}catch(e){}
}
function logout(){SD.logout();toast('已退出登录');setTimeout(function(){try{location.reload();}catch(e){}},600);}

/* ===== 播放器社交区 ===== */
function onPlayerOpen(movid,title){
  curVideoKey=String(movid||0)+'|'+encodeURIComponent(title||'');
  curVideoTitle=title||'视频';
  ensureDanmakuLayer();loadDanmaku();loadComments();loadActions();
  try{
    var q=window._playQueue||[],cur=null;
    for(var i=0;i<q.length;i++){if(String(q[i].movid)===String(movid)){cur=q[i];break;}}
    SD.addHistory(cur||{movid:movid,title:title,actor:''});
  }catch(e){}
}

/* ---- 弹幕层 ---- */
function ensureDanmakuLayer(){
  var videoWrap=document.querySelector('.player-video');
  if(!videoWrap)return;
  if(document.getElementById('danmakuLayer'))return;
  var layer=document.createElement('div');
  layer.id='danmakuLayer';
  layer.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:4;';
  videoWrap.appendChild(layer);
}
function loadDanmaku(){
  var layer=document.getElementById('danmakuLayer');
  if(!layer)return;
  layer.innerHTML='';lastDanmakuIdx=0;
  SD.getDanmaku(curVideoKey).then(function(list){danmakuList=list||[];});
}
function sendDanmaku(){
  var inp=document.getElementById('danmakuInput');
  if(!inp)return;
  var text=inp.value.trim();
  if(!text){toast('请输入弹幕内容');return;}
  var v=document.getElementById('playerVideo');
  var t=v?(v.currentTime||0):0;
  SD.addDanmaku(curVideoKey,text,t).then(function(r){
    if(r&&r.ok){if(danmakuOn)fireDanmaku(r.item);inp.value='';toast('弹幕已发送 ✝');}
    else toast('弹幕发送失败');
  });
}
function fireDanmaku(d){
  var layer=document.getElementById('danmakuLayer');
  if(!layer)return;
  var el=document.createElement('div');
  el.textContent=d.text;
  el.style.cssText='position:absolute;top:'+(Math.random()*75)+'%;left:100%;white-space:nowrap;color:#fff;font-size:14px;font-weight:500;text-shadow:0 0 3px #000,0 0 3px #000;';
  layer.appendChild(el);
  var dur=9000;
  var speed=(layer.clientWidth+el.offsetWidth+40);
  var start=performance.now();
  function step(now){
    var p=(now-start)/dur;
    if(p>=1){if(el.parentNode)el.parentNode.removeChild(el);return;}
    el.style.transform='translateX(-'+(speed*p)+'px)';
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},dur+500);
}
function startDanmakuLoop(){
  stopDanmakuLoop();
  danmakuTimer=setInterval(function(){
    if(!danmakuOn||!danmakuList.length)return;
    var v=document.getElementById('playerVideo');
    if(!v||v.paused)return;
    var t=v.currentTime||0;
    for(var i=lastDanmakuIdx;i<danmakuList.length;i++){
      var d=danmakuList[i];
      if(d.time<=t+0.3){fireDanmaku(d);lastDanmakuIdx=i+1;}
      else break;
    }
  },250);
}
function stopDanmakuLoop(){
  if(danmakuTimer){clearInterval(danmakuTimer);danmakuTimer=null;}
}

/* ===== 评论 ===== */
function loadComments(){
  var box=document.getElementById('commentList');
  if(!box)return;
  box.innerHTML='<div style="text-align:center;padding:14px;color:#8A7A6A;font-size:12px;">⏳ 加载评论中...</div>';
  SD.getComments(curVideoKey).then(function(list){
    box.innerHTML='';
    if(!list||!list.length){
      box.innerHTML='<div style="text-align:center;padding:14px;color:#8A7A6A;font-size:12px;">还没有评论，快来抢沙发 ✝</div>';
      return;
    }
    list.forEach(function(c){
      box.innerHTML+='<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">'+
        '<div style="width:32px;height:32px;border-radius:50%;background:rgba(200,151,58,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;color:#E8B96A;">'+(c.avatar?'<img src="'+esc(c.avatar)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">':esc((c.user||'家').slice(0,1)))+'</div>'+
        '<div style="flex:1;min-width:0;">'+
        '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:12px;color:#E8B96A;font-weight:600;">'+esc(c.user||'匿名家人')+'</span><span style="font-size:10px;color:rgba(255,255,255,0.3);">'+fmtTime(c.time)+'</span></div>'+
        '<div style="font-size:13px;color:#E8E0D0;margin-top:4px;line-height:1.6;">'+esc(c.text)+'</div>'+
        '<div style="margin-top:6px;display:flex;gap:12px;">'+
        '<button onclick="SocialUI.likeComment(\''+esc(c.id)+'\')" style="font-size:11px;color:rgba(255,255,255,0.45);cursor:pointer;">👍 赞 ('+(c.likes||0)+')</button>'+
        '<button onclick="SocialUI.delComment(\''+esc(c.id)+'\')" style="font-size:11px;color:rgba(255,120,120,0.7);cursor:pointer;">🗑 删除</button>'+
        '</div>'+
        '</div></div>';
    });
  });
}
function submitComment(){
  var inp=document.getElementById('commentInput');
  if(!inp)return;
  var text=inp.value.trim();
  if(!text){toast('请输入评论内容');return;}
  var user=SD.currentUser();
  if(!user){toast('请先登录再评论 🙏');try{location.href='auth.html';}catch(e){}return;}
  SD.addComment(curVideoKey,text).then(function(r){
    if(r&&r.ok){inp.value='';loadComments();toast('评论成功 ✝');}
    else toast((r&&r.msg)||'评论失败');
  });
}
function likeComment(id){
  SD.likeComment(id,curVideoKey).then(function(){loadComments();});
}
function delComment(id){
  if(!confirm('确定删除这条评论？'))return;
  SD.delComment(curVideoKey,id).then(function(){loadComments();toast('评论已删除');});
}

/* ===== 点赞/收藏/转发/分享 ===== */
function loadActions(){
  var acts=SD.getActions(curVideoKey);
  updateActionBtn('likeBtn','👍 点赞',acts.like);
  updateActionBtn('favBtn','⭐ 收藏',acts.fav);
  updateActionBtn('fwdBtn','🔄 转发',acts.fwd);
  updateActionBtn('shareBtn','📤 分享',acts.share);
}
function updateActionBtn(id,label,act){
  var b=document.getElementById(id);
  if(!b)return;
  var on=act&&act.on;
  b.innerHTML=label+' ('+(act?act.count:0)+')';
  b.style.background=on?'rgba(200,151,58,0.3)':'rgba(255,255,255,0.08)';
  b.style.borderColor=on?'var(--gold)':'rgba(255,255,255,0.15)';
  b.style.color=on?'var(--gold-light)':'rgba(255,255,255,0.7)';
}
function doAction(type){
  var names={like:'点赞',fav:'收藏',fwd:'转发',share:'分享'};
  SD.toggleAction(curVideoKey,type).then(function(r){
    if(r&&r.on!==undefined){
      loadActions();
      toast((r.on?'已':'取消')+names[type]+(type==='share'&&r.on?'：'+location.href:''));
      if(type==='share'&&r.on){
        try{
          var url=location.href.split('#')[0];
          if(navigator.share){navigator.share({title:curVideoTitle,text:'我在福音传播爱看到好视频：「'+curVideoTitle+'」',url:url});}
          else{
            var ta=document.createElement('textarea');
            ta.value=url;document.body.appendChild(ta);ta.select();
            try{document.execCommand('copy');toast('链接已复制，快去分享吧 ✝');}catch(e){}
            document.body.removeChild(ta);
          }
        }catch(e){}
      }
    }
  });
}

/* ===== 初始化 ===== */
function init(){
  SD=window.SiteData||SD;
  initTopbar();
  var v=document.getElementById('playerVideo');
  if(v){
    v.addEventListener('play',startDanmakuLoop);
    v.addEventListener('pause',stopDanmakuLoop);
  }
  // 顶栏个人中心
  var mineLink=document.querySelector('a[href="#mine"]');
  if(mineLink)mineLink.onclick=function(e){e.preventDefault();openMine();};
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
else{init();}

window.SocialUI={
  initTopbar:initTopbar,openMine:openMine,logout:logout,
  onPlayerOpen:onPlayerOpen,
  sendDanmaku:sendDanmaku,
  submitComment:submitComment,likeComment:likeComment,delComment:delComment,
  doAction:doAction
};
})();
