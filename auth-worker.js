// ============================================================
// 🚀 福音传播爱 - 认证后端 (Cloudflare Workers + KV)
// 部署：
// 1. dash.cloudflare.com → Workers & Pages → 创建 Worker → 粘贴本文件
// 2. 设置 → 绑定 KV：变量名 AUTH_KV（需先创建 KV Namespace）
// 3. 设置 → 环境变量：RESEND_API_KEY（邮箱发信，resend.com 免费注册）
//    不配置时自动"开发模式"：验证码直接返回（便于先测试）
// 4. 前端配置：localStorage.setItem('auth_api_base','https://你的worker域名')
// ============================================================

function json(data, status){
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json;charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization' }
  });
}

function randStr(n){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  for(let i=0;i<n;i++) s += chars[arr[i] % chars.length];
  return s;
}
function randNum(n){
  let s = '';
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  for(let i=0;i<n;i++) s += (arr[i] % 10);
  return s;
}

async function hashPassword(password, salt){
  let hash = salt + ':' + password;
  for(let i=0;i<1000;i++){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hash));
    hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  return hash;
}
async function verifyPassword(password, salt, storedHash){
  const h = await hashPassword(password, salt);
  return h === storedHash;
}

async function kvGet(env, key){
  try { return JSON.parse(await env.AUTH_KV.get(key)); } catch(e){ return null; }
}
async function kvSet(env, key, val, ttl){
  await env.AUTH_KV.put(key, JSON.stringify(val), ttl ? { expirationTtl: ttl } : undefined);
}

function genCaptchaSvg(code){
  const colors = ['#d4af37','#4ade80','#60a5fa','#f472b6','#fbbf24'];
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="116" height="44" viewBox="0 0 116 44">';
  svg += '<rect width="116" height="44" fill="#101736" rx="8"/>';
  for(let i=0;i<5;i++){
    svg += '<line x1="'+(randNum(2)%116)+'" y1="'+(randNum(2)%44)+'" x2="'+(randNum(2)%116)+'" y2="'+(randNum(2)%44)+'" stroke="'+colors[i%5]+'" stroke-width="1" opacity="0.5"/>';
  }
  for(let i=0;i<25;i++){
    svg += '<circle cx="'+(randNum(2)%116)+'" cy="'+(randNum(2)%44)+'" r="1" fill="'+colors[i%5]+'" opacity="0.6"/>';
  }
  code.split('').forEach((ch, i) => {
    const x = 14 + i*24 + (randNum(1)%6);
    const y = 29 + (randNum(1)%6);
    const rot = ((randNum(1)%40) - 20);
    svg += '<text x="'+x+'" y="'+y+'" fill="'+colors[(i+2)%5]+'" font-size="24" font-family="Arial" font-weight="bold" transform="rotate('+rot+' '+x+' '+y+')">'+ch+'</text>';
  });
  svg += '</svg>';
  return svg;
}

async function handleCaptcha(env){
  const code = randNum(4);
  const id = randStr(24);
  await kvSet(env, 'captcha:' + id, { code, exp: Date.now() + 10*60*1000 }, 600);
  return json({ success: true, captcha_id: id, svg: genCaptchaSvg(code) });
}

async function verifyCaptcha(env, id, code){
  if(!id || !code) return false;
  const rec = await kvGet(env, 'captcha:' + id);
  if(!rec || rec.exp < Date.now()) return false;
  if(rec.code !== code.trim()) return false;
  await env.AUTH_KV.delete('captcha:' + id);
  return true;
}

async function handleSendEmailCode(env, body){
  const email = (body.email || '').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success:false, message:'邮箱格式不正确' }, 400);
  const exist = await kvGet(env, 'user:' + email);
  if(exist) return json({ success:false, message:'该邮箱已注册，请直接登录' }, 400);
  const last = await env.AUTH_KV.get('ecode_last:' + email);
  if(last && Date.now() - parseInt(last) < 60000) return json({ success:false, message:'发送太频繁，请60秒后再试' }, 429);

  const code = randNum(6);
  await kvSet(env, 'ecode:' + email, { code, exp: Date.now() + 10*60*1000 }, 600);
  await env.AUTH_KV.put('ecode_last:' + email, String(Date.now()), { expirationTtl: 60 });

  const apiKey = env.RESEND_API_KEY;
  if(apiKey){
    try{
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.MAIL_FROM || '福音传播爱 <onboarding@resend.dev>',
          to: [email],
          subject: '【福音传播爱】注册验证码',
          html: '<div style="font-family:sans-serif;background:#0b1026;padding:30px;border-radius:12px;color:#e8e6f0;text-align:center"><h2 style="color:#d4af37">✝ 福音传播爱</h2><p>你的注册验证码是：</p><div style="font-size:36px;letter-spacing:8px;font-weight:bold;color:#f0d878;background:#141b3d;padding:16px;border-radius:10px;display:inline-block">' + code + '</div><p style="color:#8f96c0;font-size:13px">10分钟内有效，请勿泄露给他人。</p></div>'
        })
      });
      if(!resp.ok) throw new Error('Resend: ' + resp.status);
      return json({ success:true, message:'验证码已发送' });
    }catch(e){
      return json({ success:false, message:'邮件发送失败: ' + e.message }, 500);
    }
  }
  return json({ success:true, message:'验证码已发送（开发模式）', dev_code: code, dev_tip:'配置 RESEND_API_KEY 后自动切换为真实发信' });
}

// ===== 注册 =====
async function handleRegister(env, body){
  const email = (body.email || '').trim().toLowerCase();
  const ecode = (body.email_code || '').trim();
  const password = body.password || '';
  const phone = (body.phone || '').trim();

  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success:false, message:'邮箱格式不正确' }, 400);
  if(password.length < 6) return json({ success:false, message:'密码至少6位' }, 400);

  const rec = await kvGet(env, 'ecode:' + email);
  if(!rec || rec.exp < Date.now()) return json({ success:false, message:'验证码错误或已过期' }, 400);
  if(rec.code !== ecode) return json({ success:false, message:'验证码错误' }, 400);

  if(await kvGet(env, 'user:' + email)) return json({ success:false, message:'该邮箱已注册' }, 400);
  if(phone){
    if(!/^1[3-9]\d{9}$/.test(phone)) return json({ success:false, message:'手机号格式不正确' }, 400);
    if(await kvGet(env, 'phone:' + phone)) return json({ success:false, message:'该手机号已注册' }, 400);
  }

  const salt = randStr(16);
  const passHash = await hashPassword(password, salt);
  const user = { id: randStr(12), email, phone: phone || null, salt, pass_hash: passHash, created_at: Date.now() };
  await kvSet(env, 'user:' + email, user);
  if(phone) await kvSet(env, 'phone:' + phone, email);
  await env.AUTH_KV.delete('ecode:' + email);

  const token = randStr(48);
  await kvSet(env, 'session:' + token, { uid: user.id, email, exp: Date.now() + 7*24*3600*1000 }, 7*24*3600);
  return json({ success:true, message:'注册成功', token, user: { id: user.id, email: user.email, phone: user.phone } });
}

// ===== 登录 =====
async function handleLogin(env, body){
  const account = (body.account || '').trim().toLowerCase();
  const password = body.password || '';
  if(!account || !password) return json({ success:false, message:'请输入账号和密码' }, 400);

  const capOk = await verifyCaptcha(env, body.captcha_id, body.captcha);
  if(!capOk) return json({ success:false, message:'验证码错误，请重新输入' }, 400);

  let user = null;
  if(account.includes('@')) user = await kvGet(env, 'user:' + account);
  else {
    const email = await kvGet(env, 'phone:' + account);
    if(email) user = await kvGet(env, 'user:' + email);
  }
  if(!user) return json({ success:false, message:'账号不存在，请先注册' }, 401);

  const ok = await verifyPassword(password, user.salt, user.pass_hash);
  if(!ok) return json({ success:false, message:'密码错误，请重新输入' }, 401);

  const token = randStr(48);
  await kvSet(env, 'session:' + token, { uid: user.id, email: user.email, exp: Date.now() + 7*24*3600*1000 }, 7*24*3600);
  return json({ success:true, message:'登录成功', token, user: { id: user.id, email: user.email, phone: user.phone } });
}

// ===== 当前用户 =====
async function handleMe(env, headers){
  const auth = headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if(!token) return json({ success:false, message:'未登录' }, 401);
  const sess = await kvGet(env, 'session:' + token);
  if(!sess || sess.exp < Date.now()) return json({ success:false, message:'登录已过期' }, 401);
  const user = await kvGet(env, 'user:' + sess.email);
  if(!user) return json({ success:false, message:'用户不存在' }, 401);
  return json({ success:true, user: { id: user.id, email: user.email, phone: user.phone } });
}

// ===== 登出 =====
async function handleLogout(env, headers){
  const auth = headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if(token) await env.AUTH_KV.delete('session:' + token);
  return json({ success:true, message:'已退出登录' });
}

// ===== 手机验证码（预留：配置短信服务商后激活） =====
async function handleSendSmsCode(env, body){
  const phone = (body.phone || '').trim();
  if(!/^1[3-9]\d{9}$/.test(phone)) return json({ success:false, message:'手机号格式不正确' }, 400);
  if(!env.SMS_PROVIDER || !env.SMS_ACCESS_KEY){
    return json({ success:false, message:'短信服务未配置：请在 Worker 环境变量中配置 SMS_PROVIDER 和 SMS_ACCESS_KEY' }, 501);
  }
  const code = randNum(6);
  await kvSet(env, 'scode:' + phone, { code, exp: Date.now() + 10*60*1000 }, 600);
  return json({ success:true, message:'短信验证码已发送', dev_code: code });
}

// ============================================================
// 💬 社交数据 API（评论/弹幕/点赞/收藏/转发/分享 + 后台统计）
// 所有数据存入同一 KV（AUTH_KV），与认证数据共享命名空间
// ============================================================

function randId(prefix){
  return (prefix||'') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
}

// KV 辅助：直接读写 JSON
async function kvGetRaw(env, key){ try{ return JSON.parse(await env.AUTH_KV.get(key)); }catch(e){ return null; } }
async function kvSetRaw(env, key, val){ await env.AUTH_KV.put(key, JSON.stringify(val)); }

// 获取单个视频的评论列表
async function handleGetComments(env, url){
  const video = url.searchParams.get('video') || '';
  const list = await kvGetRaw(env, 'social:comments:' + video) || [];
  list.sort((a,b)=>b.time-a.time);
  return json({ success:true, list });
}
// 发表评论
async function handleAddComment(env, body){
  const video = (body.video||'').trim();
  const text = String(body.text||'').trim().slice(0,500);
  if(!video || !text) return json({ success:false, message:'参数不完整' }, 400);
  const item = {
    id: randId('c_'),
    video,
    user: (body.user||'匿名家人').slice(0,30),
    avatar: body.avatar||'',
    text,
    time: Date.now(),
    likes: 0
  };
  const list = await kvGetRaw(env, 'social:comments:' + video) || [];
  list.unshift(item);
  if(list.length > 500) list.length = 500;
  await kvSetRaw(env, 'social:comments:' + video, list);
  return json({ success:true, id:item.id, item });
}
// 删除评论
async function handleDelComment(env, video, id){
  if(!video || !id) return json({ success:false, message:'参数不完整' }, 400);
  const list = await kvGetRaw(env, 'social:comments:' + video) || [];
  const idx = list.findIndex(c=>c.id===id);
  if(idx < 0) return json({ success:false, message:'评论不存在' }, 404);
  list.splice(idx,1);
  await kvSetRaw(env, 'social:comments:' + video, list);
  return json({ success:true });
}
// 点赞评论
async function handleLikeComment(env, video, id){
  const list = await kvGetRaw(env, 'social:comments:' + video) || [];
  const c = list.find(x=>x.id===id);
  if(!c) return json({ success:false, message:'评论不存在' }, 404);
  c.likes = (c.likes||0) + 1;
  await kvSetRaw(env, 'social:comments:' + video, list);
  return json({ success:true, likes:c.likes });
}

// 弹幕
async function handleGetDanmaku(env, url){
  const video = url.searchParams.get('video') || '';
  const list = await kvGetRaw(env, 'social:danmaku:' + video) || [];
  return json({ success:true, list });
}
async function handleAddDanmaku(env, body){
  const video = (body.video||'').trim();
  const text = String(body.text||'').trim().slice(0,50);
  const time = Number(body.time) || 0;
  if(!video || !text) return json({ success:false, message:'参数不完整' }, 400);
  const item = {
    id: randId('d_'),
    video,
    text,
    time,
    user: (body.user||'匿名家人').slice(0,20)
  };
  const list = await kvGetRaw(env, 'social:danmaku:' + video) || [];
  list.push(item);
  if(list.length > 1000) list.splice(0, list.length - 1000);
  await kvSetRaw(env, 'social:danmaku:' + video, list);
  return json({ success:true, id:item.id, item });
}

// 动作：like/fav/fwd/share
const SOCIAL_TYPES = ['like','fav','fwd','share'];
async function handleToggleAction(env, type, body){
  if(!SOCIAL_TYPES.includes(type)) return json({ success:false, message:'未知动作类型' }, 400);
  const video = (body.video||'').trim();
  const on = !!body.on;
  if(!video) return json({ success:false, message:'参数不完整' }, 400);
  const key = 'social:act:' + type + ':' + video;
  const rec = await kvGetRaw(env, key) || { count:0, users:[] };
  const user = (body.user || (body.email || '')).trim();
  if(on){
    rec.count = (rec.count||0) + 1;
    if(user && !rec.users.includes(user)) rec.users.push(user);
  } else {
    rec.count = Math.max(0, (rec.count||0) - 1);
    if(user){ rec.users = rec.users.filter(u=>u!==user); }
  }
  await kvSetRaw(env, key, rec);
  return json({ success:true, on, count:rec.count });
}

// 后台：全站统计
async function handleStats(env){
  const stats = { comments:0, danmaku:0, likes:0, favs:0, forwards:0, shares:0, videos:0, users:0 };
  try{
    const keys = await env.AUTH_KV.list({ prefix:'social:' });
    for(const k of keys.keys){
      if(k.name.startsWith('social:comments:')) stats.comments++;
      else if(k.name.startsWith('social:danmaku:')) stats.danmaku++;
      else if(k.name.startsWith('social:act:like:')) stats.likes++;
      else if(k.name.startsWith('social:act:fav:')) stats.favs++;
      else if(k.name.startsWith('social:act:fwd:')) stats.forwards++;
      else if(k.name.startsWith('social:act:share:')) stats.shares++;
    }
  }catch(e){}
  return json({ success:true, stats });
}

// 后台：全部评论（分页）
async function handleAllComments(env, url){
  const page = parseInt(url.searchParams.get('page')||'1')||1;
  const limit = parseInt(url.searchParams.get('limit')||'50')||50;
  const all = [];
  try{
    const keys = await env.AUTH_KV.list({ prefix:'social:comments:' });
    for(const k of keys.keys){
      const list = await kvGetRaw(env, k.name) || [];
      list.forEach(c=>{ c.videoKey = k.name.replace('social:comments:',''); all.push(c); });
    }
  }catch(e){}
  all.sort((a,b)=>b.time-a.time);
  const start = (page-1)*limit;
  return json({ success:true, list:all.slice(start,start+limit), total:all.length, page, limit });
}

// 后台：用户列表
async function handleAdminUsers(env){
  const users = [];
  try{
    const keys = await env.AUTH_KV.list({ prefix:'user:' });
    for(const k of keys.keys){
      const u = await kvGetRaw(env, k.name);
      if(u && u.email) users.push({ id:u.id, email:u.email, phone:u.phone||'', role:'user', created_at:u.created_at||0 });
    }
  }catch(e){}
  users.sort((a,b)=>b.created_at-a.created_at);
  return json({ success:true, list:users, total:users.length });
}

// ===== 主路由 =====
async function handleRequest(request, env){
  const url = new URL(request.url);
  const path = url.pathname;
  if(request.method === 'OPTIONS') return json({ success:true });

  // ===== 健康检查（site-data.js 探测用） =====
  if(path === '/health' && request.method === 'GET') return json({ success:true, message:'福音传播爱服务运行正常 ✝' });

  // ===== 社交 API =====
  const sm = path.match(/^\/social\/comments\/([^\/]+)\/like$/);
  const dm = path.match(/^\/social\/comments\/([^\/]+)$/);
  const vm = path.match(/^\/social\/(like|fav|fwd|share)$/);
  if(path === '/social/comments' && request.method === 'GET') return handleGetComments(env, url);
  if(path === '/social/comments' && request.method === 'POST') return handleAddComment(env, await request.json().catch(()=>({})));
  if(sm && request.method === 'POST') return handleLikeComment(env, url.searchParams.get('video')||'', sm[1]);
  if(dm && request.method === 'DELETE') return handleDelComment(env, url.searchParams.get('video')||'', dm[1]);
  if(path === '/social/danmaku' && request.method === 'GET') return handleGetDanmaku(env, url);
  if(path === '/social/danmaku' && request.method === 'POST') return handleAddDanmaku(env, await request.json().catch(()=>({})));
  if(vm && request.method === 'POST') return handleToggleAction(env, vm[1], await request.json().catch(()=>({})));
  // 后台统计与管理
  if(path === '/social/stats' && request.method === 'GET') return handleStats(env);
  if(path === '/social/all-comments' && request.method === 'GET') return handleAllComments(env, url);
  if(path === '/social/users' && request.method === 'GET') return handleAdminUsers(env);

  if(path === '/api/auth/captcha' && request.method === 'POST') return handleCaptcha(env);

  if(path === '/api/auth/send-email-code' && request.method === 'POST'){
    return handleSendEmailCode(env, await request.json().catch(()=>({})));
  }
  if(path === '/api/auth/send-sms-code' && request.method === 'POST'){
    return handleSendSmsCode(env, await request.json().catch(()=>({})));
  }
  if(path === '/api/auth/register' && request.method === 'POST'){
    return handleRegister(env, await request.json().catch(()=>({})));
  }
  if(path === '/api/auth/login' && request.method === 'POST'){
    return handleLogin(env, await request.json().catch(()=>({})));
  }
  if(path === '/api/auth/me' && request.method === 'GET') return handleMe(env, request.headers);
  if(path === '/api/auth/logout' && request.method === 'POST') return handleLogout(env, request.headers);

  if(path === '/api/auth/health') return json({ success:true, message:'福音传播爱认证服务运行正常 ✝' });
  return json({ success:false, message:'未知路由: ' + path }, 404);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env || {}));
});
