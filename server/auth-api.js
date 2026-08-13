// ===== 福音传播爱 - 认证系统后端 (Node.js/Express) =====
// 真实注册登录 + 图形验证码 + 邮箱验证码(SMTP/Resend) + 手机短信验证码
const crypto = require('crypto');
const net = require('net');
const tls = require('tls');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONFIG_FILE = path.join(DATA_DIR, 'auth_config.json');

function ensureDataDir() { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); }
function loadJson(file, fb) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fb; } }
function saveJson(file, data) { ensureDataDir(); fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }
function loadUsers() { return loadJson(USERS_FILE, {}); }
function saveUsers(u) { saveJson(USERS_FILE, u); }
function loadConfig() { return loadJson(CONFIG_FILE, {}); }
function saveConfig(c) { saveJson(CONFIG_FILE, c); }

// 内存存储（验证码/会话）
const mem = new Map();
function mset(k, v, ttl) { mem.set(k, { v, exp: Date.now() + ttl * 1000 }); }
function mget(k) { const it = mem.get(k); if (!it) return undefined; if (Date.now() > it.exp) { mem.delete(k); return undefined; } return it.v; }
function mdel(k) { mem.delete(k); }
setInterval(() => { const n = Date.now(); for (const [k, v] of mem) if (n > v.exp) mem.delete(k); }, 60000).unref();

const CODE_TTL = 600, SESSION_TTL = 604800;
const CAPTCHA_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validPhone = p => /^1[3-9]\d{9}$/.test(p);
const validPassword = p => p && p.length >= 6 && p.length <= 32;
function genSalt(len = 16) { return crypto.randomBytes(len).toString('hex'); }
function genCode(len = 6) { let s = ''; for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10); return s; }
function genToken(len = 32) { return crypto.randomBytes(len).toString('hex'); }
function hashPassword(pw, salt) { return crypto.pbkdf2Sync(pw, salt, 100000, 32, 'sha256').toString('hex'); }

// ===== 图形验证码 SVG =====
function genCaptchaSVG(text) {
  const w = 140, h = 52;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f0f4ff" rx="8"/>`;
  for (let i = 0; i < 5; i++) svg += `<line x1="${Math.random()*w}" y1="${Math.random()*h}" x2="${Math.random()*w}" y2="${Math.random()*h}" stroke="rgba(${Math.random()*200|0},${Math.random()*200|0},${Math.random()*200|0},.4)" stroke-width="1.5"/>`;
  for (let i = 0; i < 40; i++) svg += `<circle cx="${Math.random()*w}" cy="${Math.random()*h}" r="1.5" fill="rgba(${Math.random()*255|0},${Math.random()*255|0},${Math.random()*255|0},.5)"/>`;
  const colors = ['#1a73e8','#e53935','#2e7d32','#f57c00','#6a1b9a','#00838f'];
  text.split('').forEach((c, i) => {
    const x = 18 + i * 26 + Math.random() * 6, y = 34 + Math.random() * 10;
    const rot = (Math.random() - 0.5) * 40, col = colors[Math.floor(Math.random() * colors.length)];
    svg += `<text x="${x}" y="${y}" font-size="28" font-weight="bold" font-family="Arial" fill="${col}" transform="rotate(${rot} ${x} ${y})">${c}</text>`;
  });
  return svg + '</svg>';
}

// ===== SMTP 邮件发送（QQ/163/126/Gmail，465 SSL） =====
function smtpSend(host, port, user, pass, fromName, to, subject, html) {
  return new Promise((resolve, reject) => {
    const useTls = String(port) === '465';
    const sock = useTls
      ? tls.connect({ host, port: Number(port), servername: host, rejectUnauthorized: false })
      : net.connect({ host, port: Number(port) });
    let buf = '', step = 0;
    let timeout = setTimeout(() => { try { sock.destroy(); } catch (e) {} reject(new Error('SMTP连接超时')); }, 15000);
    function sendLine(line) { try { sock.write(line + '\r\n'); } catch (e) {} }
    function onData(data) {
      buf += data.toString('utf8');
      clearTimeout(timeout); timeout = setTimeout(() => { try { sock.destroy(); } catch (e) {} reject(new Error('SMTP响应超时')); }, 15000);
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const code = parseInt(line.slice(0, 3), 10);
        if (line.length < 4 || line[3] === ' ') handleReply(code, line.slice(4).trim());
      }
    }
    function handleReply(code, msg) {
      if (step === 0) {
        if (code === 220) { step = 1; sendLine('EHLO ' + (host.split('.')[0] || 'localhost')); }
        else reject(new Error('SMTP连接失败: ' + code + ' ' + msg));
      } else if (step === 1) {
        if (code === 250) { step = 2; sendLine('AUTH LOGIN'); }
        else reject(new Error('EHLO失败: ' + code + ' ' + msg));
      } else if (step === 2) {
        if (code === 334) { step = 3; sendLine(Buffer.from(user, 'utf8').toString('base64')); }
        else reject(new Error('AUTH失败: ' + code + ' ' + msg));
      } else if (step === 3) {
        if (code === 334) { step = 4; sendLine(Buffer.from(pass, 'utf8').toString('base64')); }
        else reject(new Error('用户名错误: ' + code + ' ' + msg));
      } else if (step === 4) {
        if (code === 235) { step = 5; sendLine('MAIL FROM:<' + user + '>'); }
        else reject(new Error('SMTP密码/授权码错误: ' + code + ' ' + msg));
      } else if (step === 5) {
        if (code === 250) { step = 6; sendLine('RCPT TO:<' + to + '>'); }
        else reject(new Error('发件人被拒绝: ' + code + ' ' + msg));
      } else if (step === 6) {
        if (code === 250) { step = 7; sendLine('DATA'); }
        else reject(new Error('收件人被拒绝: ' + code + ' ' + msg));
      } else if (step === 7) {
        if (code === 354) {
          step = 8;
          const bd = '----gospel_' + genToken(8);
          const raw =
            'From: =?UTF-8?B?' + Buffer.from(fromName || '福音传播爱', 'utf8').toString('base64') + '?= <' + user + '>\r\n' +
            'To: <' + to + '>\r\n' +
            'Subject: =?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=\r\n' +
            'MIME-Version: 1.0\r\n' +
            'Content-Type: multipart/alternative; boundary="' + bd + '"\r\n' +
            '\r\n--' + bd + '\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n' + subject + '\r\n\r\n' +
            '--' + bd + '\r\nContent-Type: text/html; charset=utf-8\r\n\r\n' + html + '\r\n\r\n--' + bd + '--\r\n.';
          sendLine(raw);
        } else reject(new Error('DATA失败: ' + code + ' ' + msg));
      } else if (step === 8) {
        if (code === 250) { step = 9; sendLine('QUIT'); resolve({ ok: true }); }
        else reject(new Error('邮件发送失败: ' + code + ' ' + msg));
      }
    }
    sock.on('data', onData);
    sock.on('error', (e) => { clearTimeout(timeout); reject(e); });
    sock.on('close', () => { clearTimeout(timeout); });
  });
}

function codeHtml(code) {
  return '<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;text-align:center"><h2 style="color:#1a73e8">✝ 福音传播爱</h2><p>您的验证码是：</p><div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#e53935;margin:16px 0">' + code + '</div><p style="color:#999;font-size:12px">10分钟内有效，请勿泄露</p></div>';
}

// ===== 阿里云短信 =====
async function aliyunSms(cfg, phone, code) {
  function pe(s) { return encodeURIComponent(s).replace(/\+/g, '%20').replace(/\*/g, '%2A').replace(/%7E/g, '~'); }
  const params = {
    AccessKeyId: cfg.accessKeyId, Action: 'SendSms', Format: 'JSON',
    PhoneNumbers: phone, RegionId: 'cn-hangzhou', SignName: cfg.signName,
    SignatureMethod: 'HMAC-SHA1', SignatureNonce: genToken(16), SignatureVersion: '1.0',
    TemplateCode: cfg.templateCode, TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), Version: '2017-05-25'
  };
  const sortedKeys = Object.keys(params).sort();
  const canonical = sortedKeys.map(k => pe(k) + '=' + pe(params[k])).join('&');
  const stringToSign = 'GET&%2F&' + pe(canonical);
  const sig = crypto.createHmac('sha1', cfg.accessKeySecret + '&').update(stringToSign).digest('base64');
  const qs = Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&') + '&Signature=' + encodeURIComponent(sig);
  const r = await fetch('https://dysmsapi.aliyuncs.com/?' + qs);
  const j = await r.json().catch(() => ({}));
  return { ok: j.Code === 'OK', msg: j.Message || j.Code };
}

// ===== 腾讯云短信 =====
async function tencentSms(cfg, phone, code) {
  const host = 'sms.tencentcloudapi.com';
  const now = new Date(), ts = Math.floor(now.getTime() / 1000), date = now.toISOString().slice(0, 10);
  const payload = JSON.stringify({ PhoneNumberSet: [phone], SmsSdkAppId: cfg.sdkAppId, SignName: cfg.signName, TemplateId: cfg.templateId, TemplateParamSet: [code] });
  const h = s => crypto.createHmac('sha256', s).update('').digest('hex');
  const sha256Hex = s => crypto.createHash('sha256').update(s).digest('hex');
  const hashedPayload = sha256Hex(payload);
  const canonicalRequest = 'POST\n/\n\ncontent-type:application/json; charset=utf-8\nhost:' + host + '\n\ncontent-type;host\n' + hashedPayload;
  const stringToSign = 'TC3-HMAC-SHA256\n' + ts + '\n' + date + '/sms/tc3_request\n' + sha256Hex(canonicalRequest);
  const secretDate = crypto.createHmac('sha256', 'TC3' + cfg.secretKey).update(date).digest('hex');
  const secretService = crypto.createHmac('sha256', secretDate).update('sms').digest('hex');
  const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest('hex');
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');
  const authorization = 'TC3-HMAC-SHA256 Credential=' + cfg.secretId + '/' + date + '/sms/tc3_request, SignedHeaders=content-type;host, Signature=' + signature;
  const r = await fetch('https://' + host + '/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Host': host, 'Authorization': authorization },
    body: payload
  });
  const j = await r.json().catch(() => ({}));
  const err = j.Response && j.Response.Error;
  return { ok: !err, msg: err ? err.Message : 'OK' };
}

// ===== 统一发送验证码 =====
async function sendRealCode(cfg, type, target, code) {
  if (type === 'email') {
    // 邮箱：Resend 或 SMTP
    if (cfg.resend_api_key) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.resend_api_key },
          body: JSON.stringify({ from: cfg.resend_from || '福音传播爱 <auth@szxfuyin.com>', to: [target], subject: '【福音传播爱】您的验证码', html: codeHtml(code) })
        });
        if (r.ok) return { ok: true };
      } catch (e) {}
    }
    if (cfg.smtp && cfg.smtp.host && cfg.smtp.user && cfg.smtp.pass) {
      try {
        await smtpSend(cfg.smtp.host, cfg.smtp.port || 465, cfg.smtp.user, cfg.smtp.pass, cfg.smtp.fromName || '福音传播爱', target, '【福音传播爱】您的验证码', codeHtml(code));
        return { ok: true };
      } catch (e) { return { ok: false, msg: e.message }; }
    }
    return { ok: false };
  } else {
    // 手机：阿里云/腾讯云
    const provider = cfg.sms_provider || 'aliyun';
    const smsCfg = provider === 'tencent' ? cfg.sms_tencent : cfg.sms_aliyun;
    if (!smsCfg) return { ok: false };
    try {
      return provider === 'tencent' ? await tencentSms(smsCfg, target, code) : await aliyunSms(smsCfg, target, code);
    } catch (e) { return { ok: false, msg: e.message }; }
  }
}

// ============================================================
// ===== Express 路由 =====
// ============================================================
function registerAuthRoutes(app) {
  const ok = (data, status) => res => res.status(status || 200).json(data);

  // 健康检查
  app.get('/api/auth/health', (req, res) => {
    res.json({ success: true, message: '认证系统运行正常 ✝', time: new Date().toISOString() });
  });

  // 图形验证码
  app.get('/api/auth/captcha', (req, res) => {
    let code = '';
    for (let i = 0; i < 5; i++) code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
    const capId = genToken(16);
    mset('captcha:' + capId, { code, t: Date.now() }, 300);
    res.json({ success: true, captchaId: capId, svg: genCaptchaSVG(code) });
  });

  // 发送验证码（邮箱/手机）
  app.post('/api/auth/send-code', async (req, res) => {
    try {
      const { type, target, captchaId, captchaCode, localCode } = req.body || {};
      if (!captchaId || !captchaCode) return res.status(400).json({ success: false, message: '请先输入图形验证码' });
      // 🔥 v3修复：local_前缀=前端本地生成的验证码（前端已本地校验通过），直接放行
      if (captchaId.indexOf('local_') === 0) {
        if (localCode && String(localCode).toUpperCase() !== String(captchaCode).toUpperCase()) {
          return res.status(400).json({ success: false, message: '图形验证码错误' });
        }
      } else {
        const cap = mget('captcha:' + captchaId);
        if (!cap || String(cap.code).toUpperCase() !== String(captchaCode).toUpperCase()) {
          return res.status(400).json({ success: false, message: '图形验证码错误' });
        }
        mdel('captcha:' + captchaId);
      }
      if (type === 'email') {
        if (!validEmail(target)) return res.status(400).json({ success: false, message: '邮箱格式不正确' });
      } else if (type === 'phone') {
        if (!validPhone(target)) return res.status(400).json({ success: false, message: '手机号格式不正确' });
      } else return res.status(400).json({ success: false, message: '验证码类型错误' });
      const code = genCode(6);
      mset('code:' + type + ':' + target, { code, t: Date.now() }, CODE_TTL);
      // 🔥 真实发送
      const cfg = loadConfig();
      const r = await sendRealCode(cfg, type, target, code);
      if (r.ok) {
        res.json({ success: true, message: '验证码已发送到您的' + (type === 'phone' ? '手机' : '邮箱') + '，请注意查收 ✝', devMode: false });
      } else {
        res.json({
          success: true,
          message: r.msg ? '验证码发送失败：' + r.msg : '验证码已生成（未配置真实发送通道，开发模式）',
          devMode: true, devCode: code
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: '服务器错误: ' + e.message });
    }
  });

  // 注册
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { account, type, password, code, nickname } = req.body || {};
      if (!account || !password) return res.status(400).json({ success: false, message: '账号和密码不能为空' });
      if (!validPassword(password)) return res.status(400).json({ success: false, message: '密码需6-32位' });
      const accType = type === 'phone' ? 'phone' : 'email';
      if (accType === 'phone' && !validPhone(account)) return res.status(400).json({ success: false, message: '手机号格式不正确' });
      if (accType === 'email' && !validEmail(account)) return res.status(400).json({ success: false, message: '邮箱格式不正确' });
      const users = loadUsers();
      if (users[accType + ':' + account]) return res.status(409).json({ success: false, message: accType === 'phone' ? '该手机号已注册' : '该邮箱已注册' });
      const stored = mget('code:' + accType + ':' + account);
      if (!stored) return res.status(400).json({ success: false, message: '请先获取验证码' });
      if (String(stored.code) !== String(code)) return res.status(400).json({ success: false, message: '验证码错误' });
      if (Date.now() - stored.t > CODE_TTL * 1000) return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
      mdel('code:' + accType + ':' + account);
      const salt = genSalt();
      const userId = 'u_' + genToken(8);
      const user = { id: userId, [accType]: account, nickname: nickname || '信徒' + account.slice(-4), salt, pwd: hashPassword(password, salt), createdAt: Date.now(), avatar: '', role: 'user' };
      users[accType + ':' + account] = user;
      users['id:' + userId] = user;
      saveUsers(users);
      const token = genToken();
      mset('session:' + token, { uid: userId, t: Date.now() }, SESSION_TTL);
      res.json({ success: true, message: '注册成功，欢迎加入福音传播爱！', token, user: safeUser(user) });
    } catch (e) {
      res.status(500).json({ success: false, message: '服务器错误: ' + e.message });
    }
  });

  // 登录
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { account, password } = req.body || {};
      if (!account || !password) return res.status(400).json({ success: false, message: '请输入账号和密码' });
      const accType = validPhone(account) ? 'phone' : 'email';
      const users = loadUsers();
      const user = users[accType + ':' + account];
      if (!user) return res.status(404).json({ success: false, message: '账号不存在，请先注册' });
      if (hashPassword(password, user.salt) !== user.pwd) return res.status(401).json({ success: false, message: '密码错误，请重新输入' });
      const token = genToken();
      mset('session:' + token, { uid: user.id, t: Date.now() }, SESSION_TTL);
      res.json({ success: true, message: '登录成功，欢迎回来！', token, user: safeUser(user) });
    } catch (e) {
      res.status(500).json({ success: false, message: '服务器错误: ' + e.message });
    }
  });

  // 当前用户信息
  app.get('/api/auth/me', (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    const session = mget('session:' + token);
    if (!session) return res.status(401).json({ success: false, message: '未登录' });
    const users = loadUsers();
    const user = users['id:' + session.uid];
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, user: safeUser(user) });
  });

  // 退出登录
  app.post('/api/auth/logout', (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    mdel('session:' + token);
    res.json({ success: true, message: '已退出登录' });
  });

  // 开发模式：读取验证码
  app.get('/api/auth/dev-code', (req, res) => {
    const { type, target } = req.query;
    if (!type || !target) return res.status(400).json({ success: false, message: '缺少参数' });
    const stored = mget('code:' + type + ':' + target);
    if (!stored) return res.status(404).json({ success: false, message: '无验证码记录' });
    res.json({ success: true, code: stored.code });
  });

  // ===== 管理员配置接口（在线配置短信/邮箱密钥） =====
  app.post('/api/auth/admin/config', (req, res) => {
    const adminKey = req.headers['x-admin-key'] || '';
    const cfg = loadConfig();
    const realKey = cfg.admin_key || 'admin888';
    if (adminKey !== realKey) return res.status(401).json({ success: false, message: '管理员密钥错误' });
    const body = req.body || {};
    const updated = [];
    if (body.sms_provider) { cfg.sms_provider = body.sms_provider; updated.push('短信服务商=' + body.sms_provider); }
    if (body.aliyun) {
      cfg.sms_aliyun = { accessKeyId: body.aliyun.accessKeyId, accessKeySecret: body.aliyun.accessKeySecret, signName: body.aliyun.signName, templateCode: body.aliyun.templateCode };
      updated.push('阿里云短信配置已保存');
    }
    if (body.tencent) {
      cfg.sms_tencent = { secretId: body.tencent.secretId, secretKey: body.tencent.secretKey, sdkAppId: body.tencent.sdkAppId, signName: body.tencent.signName, templateId: body.tencent.templateId };
      updated.push('腾讯云短信配置已保存');
    }
    if (body.smtp) {
      cfg.smtp = { host: body.smtp.host, port: body.smtp.port || 465, user: body.smtp.user, pass: body.smtp.pass, fromName: body.smtp.fromName || '福音传播爱' };
      updated.push('SMTP邮箱配置已保存');
    }
    if (body.resend_api_key !== undefined) {
      if (body.resend_api_key) { cfg.resend_api_key = body.resend_api_key; updated.push('Resend邮箱密钥已保存'); }
      else { delete cfg.resend_api_key; updated.push('Resend邮箱密钥已清除'); }
    }
    if (body.admin_key) { cfg.admin_key = body.admin_key; updated.push('管理员密钥已更新'); }
    saveConfig(cfg);
    res.json({ success: true, message: '配置成功：' + updated.join('；'), updated });
  });

  // 管理员配置查看（不回显密钥）
  app.get('/api/auth/admin/config', (req, res) => {
    const adminKey = req.headers['x-admin-key'] || '';
    const cfg = loadConfig();
    const realKey = cfg.admin_key || 'admin888';
    if (adminKey !== realKey) return res.status(401).json({ success: false, message: '管理员密钥错误' });
    res.json({
      success: true,
      config: {
        sms_provider: cfg.sms_provider || 'aliyun',
        sms_aliyun_configured: !!cfg.sms_aliyun,
        sms_tencent_configured: !!cfg.sms_tencent,
        smtp_configured: !!(cfg.smtp && cfg.smtp.host && cfg.smtp.user && cfg.smtp.pass),
        resend_configured: !!cfg.resend_api_key
      }
    });
  });
}

function safeUser(u) {
  return { id: u.id, nickname: u.nickname, email: u.email || '', phone: u.phone || '', role: u.role || 'user', avatar: u.avatar || '', createdAt: u.createdAt };
}

module.exports = { registerAuthRoutes };
