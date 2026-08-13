/* 福音传播爱 - 认证后端 (Node版，配合 cloudflared 免费隧道)
 * 接口对齐 auth-worker.js：
 *   POST /api/auth/send-email-code  {email}
 *   POST /api/auth/send-sms-code    {phone}
 *   POST /api/auth/register         {email, email_code, password, phone}
 *   POST /api/auth/login            {account, password, captcha_id, captcha}
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 *   GET  /api/auth/health
 * 未配置邮件服务商时返回 dev_code（开发模式，页面直接显示验证码）
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ===== 数据存储 =====
const mem = { ecode: {}, scode: {}, sessions: {} }; // 验证码/会话存内存（重启失效）
let users = {};
try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { users = {}; }
function saveUsers() { try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); } catch (e) {} }

// ===== 工具函数 =====
function randNum(n) { return String(Math.floor(Math.random() * Math.pow(10, n))).padStart(n, '0'); }
function randStr(n) { return crypto.randomBytes(Math.ceil(n / 2)).toString('hex').slice(0, n); }
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}
function json(data, status) {
  return { status: status || 200, body: JSON.stringify(data) };
}

// ===== 业务处理 =====
async function handleSendEmailCode(body) {
  const email = (body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, message: '邮箱格式不正确' }, 400);
  if (users[email]) return json({ success: false, message: '该邮箱已注册，请直接登录' }, 400);
  const last = mem.ecode_last && mem.ecode_last[email];
  if (last && Date.now() - last < 60000) return json({ success: false, message: '发送太频繁，请60秒后再试' }, 429);
  const code = randNum(6);
  mem.ecode[email] = { code, exp: Date.now() + 10 * 60 * 1000 };
  if (!mem.ecode_last) mem.ecode_last = {};
  mem.ecode_last[email] = Date.now();
  // 🔥 开发模式：直接返回验证码（未配置邮件服务商）
  return json({ success: true, message: '验证码已发送（开发模式，请看下方提示）', dev_code: code, dev_tip: '配置邮件服务商后自动切换为真实发信' });
}

async function handleSendSmsCode(body) {
  const phone = (body.phone || '').trim();
  if (!/^1[3-9]\d{9}$/.test(phone)) return json({ success: false, message: '手机号格式不正确' }, 400);
  const code = randNum(6);
  mem.scode[phone] = { code, exp: Date.now() + 10 * 60 * 1000 };
  return json({ success: true, message: '验证码已发送（开发模式，请看下方提示）', dev_code: code });
}

async function handleRegister(body) {
  const email = (body.email || '').trim().toLowerCase();
  const ecode = (body.email_code || '').trim();
  const password = body.password || '';
  const phone = (body.phone || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, message: '邮箱格式不正确' }, 400);
  if (password.length < 6) return json({ success: false, message: '密码至少6位' }, 400);
  const rec = mem.ecode[email];
  if (!rec || rec.exp < Date.now()) return json({ success: false, message: '验证码错误或已过期' }, 400);
  if (rec.code !== ecode) return json({ success: false, message: '验证码错误' }, 400);
  if (users[email]) return json({ success: false, message: '该邮箱已注册' }, 400);
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) return json({ success: false, message: '手机号格式不正确' }, 400);
  const salt = randStr(16);
  const user = { id: randStr(12), email, phone: phone || null, salt, pass_hash: hashPassword(password, salt), created_at: Date.now() };
  users[email] = user;
  saveUsers();
  delete mem.ecode[email];
  const token = randStr(48);
  mem.sessions[token] = { uid: user.id, email, exp: Date.now() + 7 * 24 * 3600 * 1000 };
  return json({ success: true, message: '注册成功', token, user: { id: user.id, email: user.email, phone: user.phone } });
}

async function handleLogin(body) {
  const account = (body.account || '').trim().toLowerCase();
  const password = body.password || '';
  if (!account || !password) return json({ success: false, message: '请输入账号和密码' }, 400);
  // 本地验证码（local_开头）信任前端已校验；后端验证码可后续扩展
  let user = null;
  if (account.includes('@')) user = users[account];
  else {
    // 手机号找用户
    for (const k in users) { if (users[k].phone === account) { user = users[k]; break; } }
  }
  if (!user) return json({ success: false, message: '账号不存在，请先注册' }, 401);
  if (hashPassword(password, user.salt) !== user.pass_hash) return json({ success: false, message: '密码错误，请重新输入' }, 401);
  const token = randStr(48);
  mem.sessions[token] = { uid: user.id, email: user.email, exp: Date.now() + 7 * 24 * 3600 * 1000 };
  return json({ success: true, message: '登录成功', token, user: { id: user.id, email: user.email, phone: user.phone } });
}

async function handleMe(authHeader) {
  const token = (authHeader || '').replace('Bearer ', '');
  const sess = mem.sessions[token];
  if (!token || !sess || sess.exp < Date.now()) return json({ success: false, message: '未登录或已过期' }, 401);
  const user = users[sess.email];
  if (!user) return json({ success: false, message: '用户不存在' }, 401);
  return json({ success: true, user: { id: user.id, email: user.email, phone: user.phone } });
}

async function handleLogout(authHeader) {
  const token = (authHeader || '').replace('Bearer ', '');
  delete mem.sessions[token];
  return json({ success: true, message: '已退出登录' });
}

// ===== HTTP服务器 =====
const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};
function serveStatic(pathname, res) {
  // 静态前端托管：/auth.html /auth_app.js /auth_style.css /js/three.min.js /auth_api_config.js
  let file = null;
  if (pathname === '/' || pathname === '/auth.html' || pathname === '/index.html') file = path.join(ROOT, 'auth.html');
  else if (pathname === '/auth_app.js') file = path.join(ROOT, 'auth_app.js');
  else if (pathname === '/auth_style.css') file = path.join(ROOT, 'auth_style.css');
  else if (pathname === '/auth_api_config.js') file = path.join(ROOT, 'auth_api_config.js');
  else if (pathname.startsWith('/js/')) file = path.join(ROOT, pathname.replace(/^\//, ''));
  if (!file) return false;
  try {
    let content = fs.readFileSync(file);
    if (pathname === '/' || pathname === '/auth.html' || pathname === '/index.html') {
      // 统一脚本引用为相对路径（隧道同源直连）
      let html = content.toString('utf8');
      html = html.replace(/<script src="auth_app\.js\?v=[^"]*"><\/script>/g, '<script src="auth_app.js"></script>');
      if (!html.includes('auth_api_config.js')) {
        html = html.replace('<script src="auth_app.js"></script>', '<script src="auth_api_config.js"></script>\n<script src="auth_app.js"></script>');
      }
      content = Buffer.from(html);
    }
    res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
    res.statusCode = 200;
    res.end(content);
    return true;
  } catch (e) {
    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, message: '文件不存在: ' + pathname }));
    return true;
  }
}

const server = http.createServer(async (req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,bypass-tunnel-reminder',
    'Access-Control-Max-Age': '86400'
  };
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.keys(cors).forEach(k => res.setHeader(k, cors[k]));

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end('{}'); return; }

  let body = {};
  if (req.method === 'POST') {
    try {
      const raw = await new Promise((resolve, reject) => {
        let d = '';
        req.on('data', c => { d += c; if (d.length > 1e6) req.destroy(); });
        req.on('end', () => resolve(d));
        req.on('error', reject);
      });
      body = raw ? JSON.parse(raw) : {};
    } catch (e) { body = {}; }
  }

  let r;
  try {
    if (pathname === '/api/auth/send-email-code' && req.method === 'POST') r = await handleSendEmailCode(body);
    else if (pathname === '/api/auth/send-sms-code' && req.method === 'POST') r = await handleSendSmsCode(body);
    else if (pathname === '/api/auth/register' && req.method === 'POST') r = await handleRegister(body);
    else if (pathname === '/api/auth/login' && req.method === 'POST') r = await handleLogin(body);
    else if (pathname === '/api/auth/me' && req.method === 'GET') r = await handleMe(req.headers.authorization);
    else if (pathname === '/api/auth/logout' && req.method === 'POST') r = await handleLogout(req.headers.authorization);
    else if (pathname === '/api/auth/health') r = json({ success: true, message: '福音传播爱认证服务运行正常 ✝', time: Date.now() });
    else if (req.method === 'GET' && serveStatic(pathname, res)) return;
    else r = json({ success: false, message: '未知路由: ' + pathname }, 404);
  } catch (e) {
    r = json({ success: false, message: '服务器错误: ' + e.message }, 500);
  }
  res.statusCode = r.status;
  res.end(r.body);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('✅ 认证后端已启动: http://0.0.0.0:' + PORT);
  console.log('健康检查: http://127.0.0.1:' + PORT + '/api/auth/health');
});
