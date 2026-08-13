/* 福音传播爱 - 认证系统前端（3D人物+语音+真实后端） */
(function () {
  'use strict';
  var API_BASE = (function () {
    try {
      // 0. 云端配置文件优先（auth_api_config.js 设置 window.AUTH_API_BASE）
      if (window.AUTH_API_BASE) return String(window.AUTH_API_BASE).replace(/\/+$/, '');
      // 1. URL参数 ?auth_api=xxx 优先级最高
      var q = new URLSearchParams(location.search).get('auth_api');
      if (q) { localStorage.setItem('auth_api_base', q); return q.replace(/\/+$/, ''); }
      // 2. localStorage 持久化保存
      var s = localStorage.getItem('auth_api_base');
      // 🔥 v7：忽略临时隧道地址（trycloudflare/loca.lt 早已失效），只接受合法 Worker 域名
      if (s && /^https:\/\//.test(s) && !/trycloudflare\.com|loca\.lt|ngrok\.io/.test(s)) return s.replace(/\/+$/, '');
      // 3. 自动检测：使用当前页面同源（兼容localhost/局域网IP/公网域名）
      var origin = location.origin;
      if (origin && origin !== 'null' && origin !== 'file://') {
        return origin + '/api/auth';
      }
    } catch (e) {}
    // 4. 最后兜底：相对路径
    return '/api/auth';
  })();
  var $ = function (id) { return document.getElementById(id); };
  var mode = 'login', accType = 'email';
  var token = localStorage.getItem('auth_token') || '';
  var captchaId = '', codeTimer = null, bubbleTimer = null, lastVoice = null;
  // 🔥 v7：本地模式（真实后端不可用时自动降级，注册/登录零依赖可用）
  // 真实后端 = Cloudflare Worker（auth-worker.js）；本地模式 = localStorage 存储
  var localMode = false, localCodeStore = {}, localUsers = null;
  function loadLocalUsers() {
    try { localUsers = JSON.parse(localStorage.getItem('local_users') || '{}'); } catch (e) {}
    if (!localUsers || typeof localUsers !== 'object') localUsers = {};
  }
  function saveLocalUsers() { try { localStorage.setItem('local_users', JSON.stringify(localUsers)); } catch (e) {} }
  loadLocalUsers();
  function api(path, opts) {
    opts = opts || {};
    // 🔥 绕过 loca.lt 隧道浏览器拦截页（程序化请求必备）
    var headers = { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': '1' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    // 🔥 v7：真实后端连续失败2次 → 自动切换本地模式（不再反复请求死掉的隧道）
    if (localMode) return Promise.reject({ localMode: true });
    return fetch(API_BASE + path, {
      method: opts.method || 'GET', headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { throw { network: true }; });
    }).catch(function (e) {
      if (e && e.localMode) throw e;
      if (e && e.network) throw e;
      throw e;
    });
  }
  function showDevCode(code) {
    // 开发模式：直接把验证码显示在页面上（真实后端未配置/不可用）
    var tip = $('devCodeTip');
    if (tip) { tip.style.display = 'block'; tip.innerHTML = '🔑 开发模式验证码：<b>' + code + '</b>（后端未配置，验证码直接显示，复制输入即可）'; }
  }
  function hideDevCode() {
    var tip = $('devCodeTip');
    if (tip) tip.style.display = 'none';
  }
  function speak(text) {
    try {
      if (lastVoice) speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; u.rate = 1.0; u.pitch = 1.1;
      var vs = speechSynthesis.getVoices();
      var zh = vs.filter(function (v) { return /zh|Chinese/i.test(v.lang + v.name); });
      if (zh.length) u.voice = zh[0];
      speechSynthesis.speak(u); lastVoice = u;
    } catch (e) {}
  }
  function showBubble(text, ms) {
    var b = $('speechBubble');
    b.textContent = text; b.classList.add('show');
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { b.classList.remove('show'); }, ms || 3200);
  }
  /* ========== 3D人物 ========== */
  var renderer, scene, camera, character, parts = {}, anim = { shakeT: 0, jumpT: 0, waveT: 0 }, clock;
  function init3D() {
    var canvas = $('threeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 1.6, 6.5); camera.lookAt(0, 1.2, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    var key = new THREE.DirectionalLight(0xfff3d6, 1.1); key.position.set(3, 6, 4); scene.add(key);
    var rim = new THREE.DirectionalLight(0x9ecbff, 0.5); rim.position.set(-4, 2, -3); scene.add(rim);
    var ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.1, 48), new THREE.MeshBasicMaterial({ color: 0xC8973A, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; scene.add(ring);
    buildCharacter();
    clock = new THREE.Clock();
    animate();
    window.addEventListener('resize', onResize);
  }
  function msh(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }
  function buildCharacter() {
    character = new THREE.Group();
    var skin = new THREE.MeshStandardMaterial({ color: 0xdcb08a, roughness: 0.75 });
    var hair = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });   // 耶稣棕色长发
    var cloth = new THREE.MeshStandardMaterial({ color: 0xf7f3ea, roughness: 0.6, metalness: 0.1 });  // 白色长袍
    var gold = new THREE.MeshStandardMaterial({ color: 0xD4A93A, roughness: 0.3, metalness: 0.9 });   // 金边
    var cloth2 = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.7 });  // 腰带
    var eyeW = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var eyeB = new THREE.MeshStandardMaterial({ color: 0x2a1a08 });
    var cross = new THREE.MeshStandardMaterial({ color: 0xffd76a, emissive: 0xffb732, emissiveIntensity: 0.6 });
    var head = new THREE.Group(); head.position.set(0, 2.55, 0);
    head.add(msh(new THREE.SphereGeometry(0.42, 32, 32), skin, 0, 0, 0));
    // 长发（后脑勺）
    var longHair = msh(new THREE.SphereGeometry(0.44, 24, 16), hair, 0, -0.02, -0.12);
    longHair.scale.set(1.05, 1.15, 0.85); longHair.rotation.x = 0.35; head.add(longHair);
    // 两侧长发
    var hairL = msh(new THREE.BoxGeometry(0.12, 0.55, 0.12), hair, -0.32, -0.32, 0.05);
    hairL.rotation.z = 0.25; head.add(hairL);
    var hairR = msh(new THREE.BoxGeometry(0.12, 0.55, 0.12), hair, 0.32, -0.32, 0.05);
    hairR.rotation.z = -0.25; head.add(hairR);
    // 胡须（下巴）
    var beard = msh(new THREE.SphereGeometry(0.16, 16, 12), hair, 0, -0.26, 0.28);
    beard.scale.set(1.1, 0.75, 0.6); head.add(beard);
    var mustache = msh(new THREE.SphereGeometry(0.14, 16, 10), hair, 0, -0.18, 0.36);
    mustache.scale.set(1.3, 0.45, 0.5); head.add(mustache);
    // 眼睛
    head.add(msh(new THREE.SphereGeometry(0.07, 16, 16), eyeW, -0.15, 0.05, 0.36));
    head.add(msh(new THREE.SphereGeometry(0.07, 16, 16), eyeW, 0.15, 0.05, 0.36));
    head.add(msh(new THREE.SphereGeometry(0.035, 12, 12), eyeB, -0.15, 0.05, 0.44));
    head.add(msh(new THREE.SphereGeometry(0.035, 12, 12), eyeB, 0.15, 0.05, 0.44));
    var blush = new THREE.MeshStandardMaterial({ color: 0xe88a7a, transparent: true, opacity: 0.4 });
    head.add(msh(new THREE.SphereGeometry(0.05, 12, 12), blush, -0.24, -0.06, 0.3));
    head.add(msh(new THREE.SphereGeometry(0.05, 12, 12), blush, 0.24, -0.06, 0.3));
    head.add(msh(new THREE.BoxGeometry(0.16, 0.03, 0.02), new THREE.MeshStandardMaterial({ color: 0x9c4a3a }), 0, -0.14, 0.4));
    // ✝ 光环（头顶金色光圈）
    var halo = msh(new THREE.TorusGeometry(0.5, 0.045, 12, 36), new THREE.MeshStandardMaterial({ color: 0xffd76a, emissive: 0xffc940, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 }), 0, 0.42, -0.05);
    halo.rotation.x = 0.15; head.add(halo);
    character.add(head); parts.head = head;
    // 白色长袍（身体）
    character.add(msh(new THREE.CylinderGeometry(0.46, 0.6, 1.2, 24), cloth, 0, 1.75, 0));
    // 金边衣领
    character.add(msh(new THREE.TorusGeometry(0.3, 0.05, 12, 24), gold, 0, 1.2, 0));
    // 金色腰带
    character.add(msh(new THREE.CylinderGeometry(0.47, 0.47, 0.07, 24), gold, 0, 1.42, 0));
    // 胸前十字架
    character.add(msh(new THREE.ConeGeometry(0.09, 0.22, 12), cross, 0, 2.08, 0.4));
    character.add(msh(new THREE.BoxGeometry(0.05, 0.05, 0.05), cross, 0, 2.22, 0.43));
    var armL = new THREE.Group(); armL.position.set(-0.55, 2.18, 0);
    armL.add(msh(new THREE.CylinderGeometry(0.09, 0.1, 0.72, 16), cloth, 0, -0.36, 0)); character.add(armL);
    var armR = new THREE.Group(); armR.position.set(0.55, 2.18, 0);
    armR.add(msh(new THREE.CylinderGeometry(0.09, 0.1, 0.72, 16), cloth, 0, -0.36, 0)); character.add(armR);
    parts.armL = armL; parts.armR = armR;
    // 长袍下摆（双腿）
    character.add(msh(new THREE.CylinderGeometry(0.18, 0.16, 0.75, 16), cloth, -0.19, 0.55, 0));
    character.add(msh(new THREE.CylinderGeometry(0.18, 0.16, 0.75, 16), cloth, 0.19, 0.55, 0));
    var shoe = new THREE.MeshStandardMaterial({ color: 0x3D1F05 });
    character.add(msh(new THREE.SphereGeometry(0.15, 14, 12), shoe, -0.19, 0.14, 0.08));
    character.add(msh(new THREE.SphereGeometry(0.15, 14, 12), shoe, 0.19, 0.14, 0.08));
    scene.add(character);
  }
  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();
    character.scale.y = 1 + Math.sin(t * 2) * 0.012;
    character.scale.x = 1 - Math.sin(t * 2) * 0.006;
    character.rotation.y = Math.sin(t * 0.7) * 0.06;
    character.position.y = Math.sin(t * 1.4) * 0.03;
    if (anim.shakeT > 0) {
      anim.shakeT -= 0.016;
      parts.head.rotation.z = Math.sin(anim.shakeT * 22) * 0.35;
      parts.head.rotation.y = Math.sin(anim.shakeT * 16) * 0.25;
    } else { parts.head.rotation.z *= 0.85; parts.head.rotation.y *= 0.85; }
    if (anim.waveT > 0) {
      anim.waveT -= 0.016;
      parts.armR.rotation.z = -2.6 + Math.sin(anim.waveT * 10) * 0.45;
    } else { parts.armR.rotation.z *= 0.8; }
    parts.armL.rotation.z = Math.sin(t * 1.2) * 0.06;
    if (anim.jumpT > 0) { anim.jumpT -= 0.016; character.position.y = Math.abs(Math.sin(anim.jumpT * 12)) * 0.55; }
    renderer.render(scene, camera);
  }
  function onResize() {
    var c = $('threeCanvas'); if (!c || !renderer) return;
    renderer.setSize(c.clientWidth, c.clientHeight);
    camera.aspect = c.clientWidth / c.clientHeight; camera.updateProjectionMatrix();
  }
  function genToken(len) {
    len = len || 16;
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var s = '';
    for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  /* ========== 页面交互 ========== */
  function switchMode(m) {
    mode = m;
    $('tabLogin').classList.toggle('active', m === 'login');
    $('tabReg').classList.toggle('active', m === 'register');
    $('loginForm').classList.toggle('hidden', m !== 'login');
    $('regForm').classList.toggle('hidden', m !== 'register');
    if (m === 'register') loadCaptcha();
    showBubble(m === 'login' ? '欢迎回来，请登录 🙏' : '欢迎注册新账号 ✝');
    speak(m === 'login' ? '欢迎回来，请登录' : '欢迎注册新账号');
  }
  function switchAccType(t) {
    accType = t;
    $('typeEmail').classList.toggle('active', t === 'email');
    $('typePhone').classList.toggle('active', t === 'phone');
    $('accLabel').textContent = t === 'email' ? '邮箱地址' : '手机号';
    $('regAccount').placeholder = t === 'email' ? '请输入邮箱' : '请输入11位手机号';
    $('regAccount').value = '';
    loadCaptcha();
  }
  function togglePwd(id, btn) {
    var inp = $(id);
    if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
    else { inp.type = 'password'; btn.textContent = '👁'; }
  }
  var CAPTCHA_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  // 🔥 v4修复：内存验证码仓库——localStorage 不可用（隐私模式/无痕模式）时也能校验，
  // 彻底杜绝"验证码明明对了却说错误"问题
  var localCaptchaStore = {};
  function captchaSave(id, code) {
    localCaptchaStore[id] = code;
    try { localStorage.setItem('local_captcha_' + id, code); } catch (e) {}
  }
  function captchaLoad(id) {
    try { var c = localStorage.getItem('local_captcha_' + id); if (c) return c; } catch (e) {}
    return localCaptchaStore[id] || '';
  }
  // 🔥 本地图形验证码兜底：后端不可用时前端自绘，保证验证码始终显示
  function localCaptcha() {
    var code = '';
    for (var i = 0; i < 5; i++) code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
    var w = 140, h = 52, svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><rect width="' + w + '" height="' + h + '" fill="#f0f4ff" rx="8"/>';
    for (var j = 0; j < 5; j++) svg += '<line x1="' + Math.random() * w + '" y1="' + Math.random() * h + '" x2="' + Math.random() * w + '" y2="' + Math.random() * h + '" stroke="rgba(' + (Math.random() * 200 | 0) + ',' + (Math.random() * 200 | 0) + ',' + (Math.random() * 200 | 0) + ',.4)" stroke-width="1.5"/>';
    for (var k = 0; k < 40; k++) svg += '<circle cx="' + Math.random() * w + '" cy="' + Math.random() * h + '" r="1.5" fill="rgba(' + (Math.random() * 255 | 0) + ',' + (Math.random() * 255 | 0) + ',' + (Math.random() * 255 | 0) + ',.5)"/>';
    var colors = ['#1a73e8', '#e53935', '#2e7d32', '#f57c00', '#6a1b9a', '#00838f'];
    code.split('').forEach(function (c, i) {
      var x = 18 + i * 26 + Math.random() * 6, y = 34 + Math.random() * 10;
      var rot = (Math.random() - 0.5) * 40, col = colors[Math.floor(Math.random() * colors.length)];
      svg += '<text x="' + x + '" y="' + y + '" font-size="28" font-weight="bold" font-family="Arial" fill="' + col + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')">' + c + '</text>';
    });
    svg += '</svg>';
    return { id: 'local_' + genToken(16), code: code, svg: svg };
  }
  function loadCaptcha() {
    var box = $('captchaImg'); box.textContent = '加载中...';
    // 🔥 v5修复：图形验证码100%本地化 + 内存仓库双写，
    // 彻底杜绝"localStorage不可用（无痕/隐私模式）→验证码存不上→永远验证码错误"
    var lc = localCaptcha();
    captchaId = lc.id;
    box.innerHTML = lc.svg;
    box.title = '点击刷新验证码';
    captchaSave(lc.id, lc.code); // 🔥 同时写入内存仓库+localStorage，双保险
  }
  function sendVerifyCode() {
    var account = $('regAccount').value.trim();
    if (!account) { showBubble('请先填写' + (accType === 'email' ? '邮箱' : '手机号') + '哦 😊'); speak('请先填写邮箱或手机号'); return; }
    var cap = $('captchaInput').value.trim();
    if (!cap) { showBubble('请先输入图形验证码 😊'); speak('请先输入图形验证码'); return; }
    var localCode = '';
    // 🔥 本地验证码模式：先本地校验图形验证码（v5：从内存仓库+localStorage双读）
    if (captchaId.indexOf('local_') === 0) {
      localCode = captchaLoad(captchaId);
      if (!localCode || String(localCode).toUpperCase() !== String(cap).toUpperCase()) {
        showBubble('图形验证码错误，请重新输入 😢'); speak('图形验证码错误');
        loadCaptcha(); return;
      }
      showBubble('图形验证码正确！正在连接验证码服务…'); speak('验证码已通过，正在发送');
    }
    sendCodeBtn.disabled = true; sendCodeBtn.textContent = '发送中...';
    // 🔥 v6修复：接口路径必须与后端Worker完全匹配！
    // 邮箱 → /send-email-code（body.email）；手机 → /send-sms-code（body.phone）
    var apiPath = accType === 'email' ? '/send-email-code' : '/send-sms-code';
    var apiBody = accType === 'email' ? { email: account } : { phone: account };
    api(apiPath, { method: 'POST', body: apiBody })
      .then(function (d) {
        if (d && d.success) {
          hideDevCode();
          showBubble(d.message + (d.dev_code ? '（开发模式验证码：' + d.dev_code + '）' : ''));
          speak('验证码已发送');
          var n = 60;
          sendCodeBtn.textContent = n + 's后重发';
          codeTimer = setInterval(function () {
            n--;
            if (n <= 0) { clearInterval(codeTimer); sendCodeBtn.disabled = false; sendCodeBtn.textContent = '获取验证码'; }
            else sendCodeBtn.textContent = n + 's后重发';
          }, 1000);
        } else {
          sendCodeBtn.disabled = false; sendCodeBtn.textContent = '获取验证码';
          showBubble(d.message || '发送失败'); speak(d.message || '发送失败');
          loadCaptcha();
        }
      }).catch(function (e) {
        // 🔥 v7：真实后端不可用 → 自动降级本地模式，验证码本地生成并直接显示
        localMode = true;
        sendCodeBtn.disabled = false; sendCodeBtn.textContent = '获取验证码';
        var lcode = '';
        for (var i = 0; i < 6; i++) lcode += Math.floor(Math.random() * 10);
        localCodeStore[account] = lcode;
        try { localStorage.setItem('local_code_' + account, lcode); } catch (err) {}
        showDevCode(lcode);
        showBubble('后端暂不可用，已切换本地模式：验证码已生成（见下方）'); speak('验证码已生成，请查看页面提示');
        var n2 = 60;
        sendCodeBtn.textContent = n2 + 's后重发';
        codeTimer = setInterval(function () {
          n2--;
          if (n2 <= 0) { clearInterval(codeTimer); sendCodeBtn.disabled = false; sendCodeBtn.textContent = '获取验证码'; }
          else sendCodeBtn.textContent = n2 + 's后重发';
        }, 1000);
      });
  }
  /* ========== 注册 ========== */
  function doRegister(e) {
    e.preventDefault();
    var account = $('regAccount').value.trim();
    var code = $('regCode').value.trim();
    var password = $('regPassword').value;
    var nickname = $('regNickname').value.trim();
    if (!account) { showBubble('请填写' + (accType === 'email' ? '邮箱' : '手机号')); return; }
    if (!code) { showBubble('请填写验证码'); return; }
    if (password.length < 6) { showBubble('密码至少6位哦'); speak('密码至少6位'); return; }
    $('regBtn').disabled = true; $('regBtn').textContent = '注册中...';
    // 🔥 v7：本地模式注册（真实后端不可用时）
    if (localMode) {
      var lkey = (accType === 'email' ? account.toLowerCase() : account);
      var saved = localCodeStore[lkey];
      if (!saved) { try { saved = localStorage.getItem('local_code_' + lkey); } catch (e) {} }
      var saved2 = localCodeStore[account];
      if (!saved && saved2) saved = saved2;
      if (!saved) {
        $('regBtn').disabled = false; $('regBtn').textContent = '注 册';
        showBubble('请先点击"获取验证码"'); speak('请先获取验证码'); return;
      }
      if (String(saved) !== String(code)) {
        $('regBtn').disabled = false; $('regBtn').textContent = '注 册';
        showBubble('验证码错误，请重新输入'); speak('验证码错误');
        loadCaptcha(); return;
      }
      // 本地注册成功
      var lu = localUsers[account.toLowerCase()] || {};
      if (lu.password) {
        $('regBtn').disabled = false; $('regBtn').textContent = '注 册';
        showBubble('该账号已注册，请直接登录'); speak('该账号已注册'); return;
      }
      localUsers[account.toLowerCase()] = {
        account: account, type: accType, password: password,
        nickname: nickname || '亲爱的家人', created_at: Date.now()
      };
      saveLocalUsers();
      token = 'local_' + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem('auth_token', token);
      try { localStorage.setItem('auth_user', JSON.stringify({ account: account, nickname: nickname || '亲爱的家人', localMode: true })); } catch (e) {}
      $('regBtn').disabled = false; $('regBtn').textContent = '注 册';
      anim.jumpT = 1.2; anim.waveT = 2.5;
      showBubble('注册成功！欢迎加入福音传播爱 🎉（本地模式）');
      speak('注册成功！欢迎加入福音传播爱！');
      showSuccess('注册成功！', '欢迎回家，' + (nickname || '亲爱的家人'));
      return;
    }
    api('/register', { method: 'POST', body: { account: account, type: accType, password: password, code: code, nickname: nickname } })
      .then(function (d) {
        $('regBtn').disabled = false; $('regBtn').textContent = '注 册';
        if (d && d.success) {
          token = d.token; localStorage.setItem('auth_token', token);
          try { localStorage.setItem('auth_user', JSON.stringify(d.user)); } catch (e) {}
          anim.jumpT = 1.2; anim.waveT = 2.5;
          showBubble('注册成功！欢迎加入福音传播爱 🎉');
          speak('注册成功！欢迎加入福音传播爱！');
          showSuccess('注册成功！', '欢迎回家，' + (d.user.nickname || '亲爱的家人'));
        } else {
          $('regForm').classList.add('shake');
          setTimeout(function () { $('regForm').classList.remove('shake'); }, 700);
          showBubble(d.message || '注册失败'); speak(d.message || '注册失败');
          loadCaptcha();
        }
      }).catch(function (e) {
        // 🔥 v7：后端不可用 → 本地模式再试一次注册
        localMode = true;
        $('regBtn').disabled = false; $('regBtn').textContent = '注 册';
        var lk = (accType === 'email' ? account.toLowerCase() : account);
        var sv = localCodeStore[lk] || localCodeStore[account];
        if (!sv) { try { sv = localStorage.getItem('local_code_' + lk) || localStorage.getItem('local_code_' + account); } catch (err) {} }
        if (!sv || String(sv) !== String(code)) {
          showBubble('验证码错误或已过期，请重新获取'); speak('验证码错误');
          loadCaptcha(); return;
        }
        localUsers[account.toLowerCase()] = {
          account: account, type: accType, password: password,
          nickname: nickname || '亲爱的家人', created_at: Date.now()
        };
        saveLocalUsers();
        token = 'local_' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('auth_token', token);
        try { localStorage.setItem('auth_user', JSON.stringify({ account: account, nickname: nickname || '亲爱的家人', localMode: true })); } catch (err) {}
        anim.jumpT = 1.2; anim.waveT = 2.5;
        showBubble('注册成功！欢迎加入福音传播爱 🎉（本地模式）');
        speak('注册成功！欢迎加入福音传播爱！');
        showSuccess('注册成功！', '欢迎回家，' + (nickname || '亲爱的家人'));
      });
  }
  /* ========== 登录 ========== */
  function doLogin(e) {
    e.preventDefault();
    var account = $('loginAccount').value.trim();
    var password = $('loginPassword').value;
    if (!account || !password) { showBubble('请输入账号和密码'); speak('请输入账号和密码'); return; }
    $('loginBtn').disabled = true; $('loginBtn').textContent = '登录中...';
    // 🔥 v7：本地模式登录
    if (localMode) {
      var lu = localUsers[account.toLowerCase()];
      if (!lu) {
        $('loginBtn').disabled = false; $('loginBtn').textContent = '登 录';
        showBubble('账号不存在，请先注册（本地模式）'); speak('账号不存在');
        return;
      }
      if (lu.password !== password) {
        $('loginBtn').disabled = false; $('loginBtn').textContent = '登 录';
        anim.shakeT = 1.2;
        $('loginForm').classList.add('shake');
        setTimeout(function () { $('loginForm').classList.remove('shake'); }, 700);
        showBubble('密码错误，请重新输入 😢'); speak('密码错误，请重新输入');
        return;
      }
      token = 'local_' + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem('auth_token', token);
      try { localStorage.setItem('auth_user', JSON.stringify({ account: account, nickname: lu.nickname || '亲爱的家人', localMode: true })); } catch (e) {}
      $('loginBtn').disabled = false; $('loginBtn').textContent = '登 录';
      anim.jumpT = 1.2; anim.waveT = 2.5;
      showBubble('登录成功！欢迎回来 🙏（本地模式）');
      speak('登录成功！欢迎回来！');
      showSuccess('登录成功！', '欢迎回家，' + (lu.nickname || '亲爱的家人'));
      return;
    }
    api('/login', { method: 'POST', body: { account: account, password: password } })
      .then(function (d) {
        $('loginBtn').disabled = false; $('loginBtn').textContent = '登 录';
        if (d && d.success) {
          token = d.token; localStorage.setItem('auth_token', token);
          try { localStorage.setItem('auth_user', JSON.stringify(d.user)); } catch (e) {}
          anim.jumpT = 1.2; anim.waveT = 2.5;
          showBubble('登录成功！欢迎回来 🙏');
          speak('登录成功！欢迎回来！');
          showSuccess('登录成功！', '欢迎回家，' + (d.user.nickname || '亲爱的家人'));
        } else if (d && (d.message || '').indexOf('密码错误') >= 0) {
          // 密码错误：3D人物摇头 + 语音说话 + 摇一摇
          anim.shakeT = 1.2;
          $('loginForm').classList.add('shake');
          setTimeout(function () { $('loginForm').classList.remove('shake'); }, 700);
          showBubble('密码错误，请重新输入 😢');
          speak('密码错误，请重新输入');
        } else {
          $('loginForm').classList.add('shake');
          setTimeout(function () { $('loginForm').classList.remove('shake'); }, 700);
          showBubble(d.message || '登录失败'); speak(d.message || '登录失败');
        }
      }).catch(function (e) {
        // 🔥 v7：后端不可用 → 本地模式再试
        localMode = true;
        $('loginBtn').disabled = false; $('loginBtn').textContent = '登 录';
        var lu2 = localUsers[account.toLowerCase()];
        if (!lu2) { showBubble('账号不存在，请先注册（本地模式）'); speak('账号不存在'); return; }
        if (lu2.password !== password) {
          anim.shakeT = 1.2;
          $('loginForm').classList.add('shake');
          setTimeout(function () { $('loginForm').classList.remove('shake'); }, 700);
          showBubble('密码错误，请重新输入 😢'); speak('密码错误，请重新输入');
          return;
        }
        token = 'local_' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('auth_token', token);
        try { localStorage.setItem('auth_user', JSON.stringify({ account: account, nickname: lu2.nickname || '亲爱的家人', localMode: true })); } catch (err) {}
        anim.jumpT = 1.2; anim.waveT = 2.5;
        showBubble('登录成功！欢迎回来 🙏（本地模式）');
        speak('登录成功！欢迎回来！');
        showSuccess('登录成功！', '欢迎回家，' + (lu2.nickname || '亲爱的家人'));
      });
  }
  /* ========== 成功动画 ========== */
  function showSuccess(title, sub) {
    $('successTitle').textContent = title;
    $('successSub').textContent = sub;
    successMask.classList.add('show');
  }
  function goHome() {
    successMask.classList.remove('show');
    var back = localStorage.getItem('auth_back') || './';
    try { location.href = back; } catch (e) { location.href = './'; }
  }
  /* ========== 初始化 ========== */
  function init() {
    init3D();
    if (location.hash === '#register') switchMode('register');
    else switchMode('login');
    try {
      if (speechSynthesis) speechSynthesis.getVoices();
    } catch (e) {}
  }
  window.switchMode = switchMode;
  window.switchAccType = switchAccType;
  window.togglePwd = togglePwd;
  window.loadCaptcha = loadCaptcha;
  window.sendVerifyCode = sendVerifyCode;
  window.doRegister = doRegister;
  window.doLogin = doLogin;
  window.goHome = goHome;
  /* ========== 🤖 AI语音对话机器人（耶稣智能体） ========== */
  var aiBusy = false;
  function aiReply(q) {
    q = (q || '').toLowerCase();
    var kb = [
      [/你好|hello|hi|嗨|在吗/, '愿你平安！我是耶稣智能助手，很高兴见到你 🙏', '愿你平安，很高兴见到你'],
      [/你是谁|你叫什么|耶稣/, '我是主耶稣的智能使者，为你分享圣经真理和神的爱 ✝', '我是主耶稣的智能使者'],
      [/圣经|经文|话语/, '圣经是神的话语，是脚前的灯、路上的光。愿你在其中寻得生命的答案 📖', '圣经是神的话语'],
      [/爱|恩典/, '神爱世人，甚至将他的独生子赐给他们。这爱何等长阔高深 💖', '神爱世人，他的恩典够用'],
      [/祷告|祈祷/, '让我们同心祷告：主啊，求你垂听我们的呼求，赐下平安与同在 🙏', '我们一同祷告，求主赐下平安'],
      [/平安|祝福|保佑/, '愿耶和华赐福给你，保护你；愿他的脸光照你，赐恩给你 ✨', '愿耶和华赐福给你'],
      [/谢谢|感谢/, '感谢主！愿神纪念你的爱心，赐福与你 🌟', '感谢主，愿神赐福与你'],
      [/罪|悔改/, '主说：天国近了，你们应当悔改。凡劳苦担重担的人，可以到我这里来 🕊', '主愿意赦免你的罪，到他面前来'],
      [/生命|永生|死亡/, '信主的人有永生。主耶稣说：我就是道路、真理、生命 ✝', '耶稣就是道路真理生命'],
      [/帮助|困难|苦难/, '不要怕，只要信！主必与你同在，他的恩典够你用的 💪', '不要怕只要信，主与你同在'],
      [/分享|传福音|传播/, '你们要去使万民作我的门徒！愿福音传遍天下 🌍', '去使万民作主的门徒'],
      [/登录|注册|验证码/, '在右侧填写手机号或邮箱，获取验证码即可注册登录，主内家人欢迎你 😊', '填写手机号或邮箱即可注册'],
      [/再见|拜拜|晚安/, '愿主保守你！以马内利，神与你同在 🌙', '以马内利，神与你同在'],
      [/感谢主|阿们|哈利路亚/, '阿们！哈利路亚！愿荣耀归给至高神 🎶', '阿们哈利路亚']
    ];
    for (var i = 0; i < kb.length; i++) {
      if (kb[i][0].test(q)) return { text: kb[i][1], voice: kb[i][2] };
    }
    return { text: '愿主的平安与你同在！您可以问我关于圣经、祷告、信仰生活的问题，或者点击注册加入福音传播爱大家庭 🙏', voice: '愿主的平安与你同在' };
  }
  function sendAI() {
    var input = $('aiChatInput');
    var body = $('aiChatBody');
    var text = (input.value || '').trim();
    if (!text || aiBusy) return;
    input.value = '';
    var userDiv = document.createElement('div');
    userDiv.className = 'ai-msg ai-user';
    userDiv.textContent = '🙋 ' + text;
    body.appendChild(userDiv);
    aiBusy = true;
    setTimeout(function () {
      var r = aiReply(text);
      var botDiv = document.createElement('div');
      botDiv.className = 'ai-msg ai-bot';
      botDiv.textContent = '✝ ' + r.text;
      body.appendChild(botDiv);
      body.scrollTop = body.scrollHeight;
      aiBusy = false;
      showBubble(r.text, 5000);
      speak(r.voice);
      anim.shakeT = 0.8; anim.waveT = 1.2;
    }, 600);
  }
  window.sendAI = sendAI;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
