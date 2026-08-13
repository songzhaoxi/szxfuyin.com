/* 福音传播爱 - 认证系统前端 v8（真实3D人物+语音+表情+真实后端） */
(function () {
  'use strict';
  var API_BASE = (function () {
    try {
      if (window.AUTH_API_BASE) return String(window.AUTH_API_BASE).replace(/\/+$/, '');
      var q = new URLSearchParams(location.search).get('auth_api');
      if (q) { localStorage.setItem('auth_api_base', q); return q.replace(/\/+$/, ''); }
      var s = localStorage.getItem('auth_api_base');
      if (s && /^https:\/\//.test(s) && !/trycloudflare\.com|loca\.lt|ngrok\.io/.test(s)) return s.replace(/\/+$/, '');
      var origin = location.origin;
      if (origin && origin !== 'null' && origin !== 'file://') {
        return origin + '/api/auth';
      }
    } catch (e) {}
    return '/api/auth';
  })();
  var $ = function (id) { return document.getElementById(id); };
  var mode = 'login', accType = 'email';
  var token = localStorage.getItem('auth_token') || '';
  var captchaId = '', codeTimer = null, bubbleTimer = null, lastVoice = null;
  var localMode = false, localCodeStore = {}, localUsers = null;
  function loadLocalUsers() {
    try { localUsers = JSON.parse(localStorage.getItem('local_users') || '{}'); } catch (e) {}
    if (!localUsers || typeof localUsers !== 'object') localUsers = {};
  }
  function saveLocalUsers() { try { localStorage.setItem('local_users', JSON.stringify(localUsers)); } catch (e) {} }
  loadLocalUsers();
  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': '1' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
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
    var tip = $('devCodeTip');
    if (tip) { tip.style.display = 'block'; tip.innerHTML = '🔑 开发模式验证码：<b>' + code + '</b>（后端未配置，验证码直接显示，复制输入即可）'; }
  }
  function hideDevCode() {
    var tip = $('devCodeTip');
    if (tip) tip.style.display = 'none';
  }
  function speak(text, onEnd) {
    /* ===== 统一语音出口：全部交给3D数字人引擎（AvatarAI），彻底杜绝双声音 ===== */
    if (window.AvatarAI && window.AvatarAI.speak) {
      try { window.AvatarAI.speak(text, { onEnd: onEnd }); } catch (e) {}
      return;
    }
    try {
      if (lastVoice) speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      /* 与3D数字人完全一致的中年男声 */
      u.lang = 'zh-CN'; u.rate = 0.98; u.pitch = 0.82;
      var vs = speechSynthesis.getVoices() || [];
      var zh = vs.filter(function (v) { return /zh|Chinese|cmn/i.test(v.lang + v.name); });
      var prefer = zh.filter(function (v) { return /Yunjian|云健|Yunyang|云扬|Yunxi|云希|Kangkang|康康|male|男/i.test(v.name); });
      var notFemale = zh.filter(function (v) { return !/Xiaoxiao|晓晓|Xiaoyi|晓伊|Liang|梁|Huihui|慧慧|Yaoyao|瑶瑶|female|女/i.test(v.name); });
      if (prefer.length) u.voice = prefer[0];
      else if (notFemale.length) u.voice = notFemale[0];
      else if (zh.length) u.voice = zh[0];
      u.onstart = function () { animTalk(1); };
      u.onend = function () { animTalk(0); if (onEnd) onEnd(); };
      u.onerror = function () { animTalk(0); if (onEnd) onEnd(); };
      speechSynthesis.speak(u); lastVoice = u;
    } catch (e) {}
  }
  function showBubble(text, ms) {
    var b = $('speechBubble');
    if (!b) return;
    b.textContent = text; b.classList.remove('hide');
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { b.classList.add('hide'); }, ms || 3200);
  }
  /* ========== 真实3D人物（GLB模型+表情融合+语音口型） ========== */
  var renderer, scene, camera, character, morphMesh = null, morphDict = {}, clock, avatarMixer = null;
  var anim = { shakeT: 0, jumpT: 0, waveT: 0, smile: 0, talk: 0, blinkT: 0 };
  function init3D() {
    var canvas = $('threeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
      if (THREE.ACESFilmicToneMapping !== undefined) renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
      camera.position.set(0, 0.85, 3.2); camera.lookAt(0, 1.0, 0);
      scene.add(new THREE.AmbientLight(0xfff2dd, 0.9));
      var key = new THREE.DirectionalLight(0xfff3d6, 1.4); key.position.set(3, 5, 4); scene.add(key);
      var fill = new THREE.DirectionalLight(0xbcd4ff, 0.6); fill.position.set(-4, 2, 3); scene.add(fill);
      var rim = new THREE.DirectionalLight(0xffd9a0, 0.7); rim.position.set(0, 3, -3); scene.add(rim);
      var ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.42, 48), new THREE.MeshBasicMaterial({ color: 0xC8973A, transparent: true, opacity: 0.28, side: THREE.DoubleSide }));
      ring.rotation.x = -0.35; ring.position.set(0, 1.0, -0.9); scene.add(ring);
      loadModel();
      clock = new THREE.Clock();
      animate();
      window.addEventListener('resize', onResize);
    } catch (e) { console.error('3D init error', e); }
  }
  function loadModel() {
    var loader = new THREE.GLTFLoader();
    var tryUrls = ['js/michelle.glb', 'auth/js/michelle.glb', 'szxfuyin/js/michelle.glb', 'js/xbot.glb'];
    var tried = 0;
    function tryLoad() {
      var u = tryUrls[tried++];
      if (!u) { buildFallback(); return; }
      loader.load(u, function (gltf) {
        try {
          character = gltf.scene;
          character.scale.setScalar(1.0);
          character.position.set(0, 0, 0);
          var box = new THREE.Box3().setFromObject(character);
          var size = box.getSize(new THREE.Vector3());
          var center = box.getCenter(new THREE.Vector3());
          character.position.x -= center.x;
          character.position.y -= box.min.y;
          var targetH = 1.9;
          var s = targetH / (size.y || 1);
          character.scale.setScalar(s);
          character.position.y = 0.02;
          scene.add(character);
          character.traverse(function (o) {
            if (o.isMesh && o.morphTargetDictionary) {
              morphMesh = o; morphDict = o.morphTargetDictionary;
            }
          });
          if (gltf.animations && gltf.animations.length) {
            avatarMixer = new THREE.AnimationMixer(character);
            var idle = gltf.animations.filter(function (a) { return /idle|pose|talk|wave|hello/i.test(a.name); });
            var clip = idle[0] || gltf.animations[0];
            if (clip) avatarMixer.clipAction(clip).play();
          }
          showBubble('欢迎来到兆西福音传递爱，愿你平安 🙏', 5000);
          speak('欢迎来到兆西福音传递爱，愿你平安');
        } catch (e) { console.error('model setup err', e); tryLoad(); }
      }, undefined, function () { tryLoad(); });
    }
    tryLoad();
  }
  function buildFallback() {
    var g = new THREE.Group();
    var mat = new THREE.MeshBasicMaterial({ color: 0xE8B96A, transparent: true, opacity: 0.16 });
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 32), mat);
    sphere.position.set(0, 1.0, 0); g.add(sphere);
    scene.add(g); character = g;
  }
  function setMorph(name, v) {
    if (!morphMesh || !morphDict) return;
    var idx = morphDict[name];
    if (idx === undefined) return;
    morphMesh.morphTargetInfluences[idx] = v;
  }
  function setMorphLerp(name, target, speed) {
    if (!morphMesh || !morphDict) return;
    var idx = morphDict[name];
    if (idx === undefined) return;
    var cur = morphMesh.morphTargetInfluences[idx] || 0;
    morphMesh.morphTargetInfluences[idx] = cur + (target - cur) * (speed || 0.12);
  }
  function animTalk(on) { anim.talk = on ? 1 : 0; }
  function animate() {
    requestAnimationFrame(animate);
    if (!clock) return;
    var t = clock.getElapsedTime();
    if (avatarMixer) avatarMixer.update(0.016);
    if (!character) return;
    character.position.y = 0.02 + Math.sin(t * 1.6) * 0.008;
    character.rotation.y = Math.sin(t * 0.6) * 0.05;
    if (anim.shakeT > 0) {
      anim.shakeT -= 0.016;
      character.rotation.z = Math.sin(anim.shakeT * 20) * 0.18;
      character.rotation.y = Math.sin(anim.shakeT * 14) * 0.22;
    } else if (character.rotation.z !== undefined && Math.abs(character.rotation.z) > 0.002) {
      character.rotation.z *= 0.85;
    }
    if (anim.jumpT > 0) {
      anim.jumpT -= 0.016;
      character.position.y = Math.abs(Math.sin(anim.jumpT * 10)) * 0.35 + 0.02;
    }
    if (anim.waveT > 0) anim.waveT -= 0.016;
    anim.blinkT -= 0.016;
    if (anim.blinkT <= 0) { anim.blinkT = 2.2 + Math.random() * 3; }
    var blink = anim.blinkT < 0.12 ? Math.abs(Math.sin(anim.blinkT * 40)) : 0;
    setMorphLerp('eyeBlinkLeft', blink, 0.9);
    setMorphLerp('eyeBlinkRight', blink, 0.9);
    setMorphLerp('eyeSquintLeft', blink * 0.4, 0.5);
    setMorphLerp('eyeSquintRight', blink * 0.4, 0.5);
    if (anim.talk > 0) {
      anim.talk -= 0.05;
      var m = Math.max(0, Math.sin(t * 14) * 0.5 + 0.5);
      setMorph('jawOpen', m * 0.85);
      setMorph('mouthOpen', m * 0.8);
      setMorph('mouthSmile', 0.12);
      setMorph('viseme_AA', m * 0.4);
      setMorph('viseme_E', (1 - m) * 0.3);
      setMorph('viseme_O', m * 0.25);
      setMorph('viseme_U', m * 0.2);
    } else {
      setMorphLerp('jawOpen', 0, 0.25);
      setMorphLerp('mouthOpen', 0, 0.25);
      setMorphLerp('mouthSmile', anim.smile > 0 ? 0.35 : 0.08, 0.08);
      setMorphLerp('viseme_AA', 0, 0.3);
      setMorphLerp('viseme_E', 0, 0.3);
      setMorphLerp('viseme_O', 0, 0.3);
      setMorphLerp('viseme_U', 0, 0.3);
    }
    anim.smile *= 0.96;
    setMorphLerp('browInnerUp', 0.06, 0.05);
    setMorphLerp('browDownLeft', 0, 0.08);
    setMorphLerp('browDownRight', 0, 0.08);
    setMorphLerp('mouthFrown', 0, 0.08);
    if (renderer) renderer.render(scene, camera);
  }
  function onResize() {
    var c = $('threeCanvas'); if (!c || !renderer) return;
    renderer.setSize(c.clientWidth, c.clientHeight);
    camera.aspect = c.clientWidth / c.clientHeight; camera.updateProjectionMatrix();
  }
  /* ========== 页面交互 ========== */
  function switchMode(m, silent) {
    mode = m;
    $('tabLogin').classList.toggle('active', m === 'login');
    $('tabReg').classList.toggle('active', m === 'register');
    $('loginForm').classList.toggle('hidden', m !== 'login');
    $('regForm').classList.toggle('hidden', m !== 'register');
    if (m === 'register') loadCaptcha();
    showBubble(m === 'login' ? '欢迎回来，请登录 🙏' : '欢迎注册新账号 ✝');
    /* 初始加载时不说话，统一交给3D数字人欢迎语，避免双声音 */
    if (!silent) speak(m === 'login' ? '欢迎回来，请登录' : '欢迎注册新账号');
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
  var localCaptchaStore = {};
  function captchaSave(id, code) {
    localCaptchaStore[id] = code;
    try { localStorage.setItem('local_captcha_' + id, code); } catch (e) {}
  }
  function captchaLoad(id) {
    try { var c = localStorage.getItem('local_captcha_' + id); if (c) return c; } catch (e) {}
    return localCaptchaStore[id] || '';
  }
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
    var box = $('captchaImg'); if (!box) return;
    box.textContent = '加载中...';
    var lc = localCaptcha();
    captchaId = lc.id;
    box.innerHTML = lc.svg;
    box.title = '点击刷新验证码';
    captchaSave(lc.id, lc.code);
  }
  function sendVerifyCode() {
    var account = $('regAccount').value.trim();
    if (!account) { showBubble('请先填写' + (accType === 'email' ? '邮箱' : '手机号') + '哦 😊'); speak('请先填写邮箱或手机号'); return; }
    var cap = $('captchaInput').value.trim();
    if (!cap) { showBubble('请先输入图形验证码 😊'); speak('请先输入图形验证码'); return; }
    var localCode = '';
    if (captchaId.indexOf('local_') === 0) {
      localCode = captchaLoad(captchaId);
      if (!localCode || String(localCode).toUpperCase() !== String(cap).toUpperCase()) {
        showBubble('图形验证码错误，请重新输入 😢'); speak('图形验证码错误');
        loadCaptcha(); return;
      }
      showBubble('图形验证码正确！正在连接验证码服务…'); speak('验证码已通过，正在发送');
    }
    var sendCodeBtn = $('sendCodeBtn');
    sendCodeBtn.disabled = true; sendCodeBtn.textContent = '发送中...';
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
      }).catch(function () {
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
  function genToken(len) {
    len = len || 16;
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var s = '';
    for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
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
    if (localMode) {
      var lkey = (accType === 'email' ? account.toLowerCase() : account);
      var saved = localCodeStore[lkey] || localCodeStore[account];
      if (!saved) { try { saved = localStorage.getItem('local_code_' + lkey) || localStorage.getItem('local_code_' + account); } catch (e) {} }
      if (!saved) {
        $('regBtn').disabled = false; $('regBtn').textContent = '注 册';
        showBubble('请先点击"获取验证码"'); speak('请先获取验证码'); return;
      }
      if (String(saved) !== String(code)) {
        $('regBtn').disabled = false; $('regBtn').textContent = '注 册';
        showBubble('验证码错误，请重新输入'); speak('验证码错误');
        loadCaptcha(); return;
      }
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
      anim.jumpT = 1.2; anim.waveT = 2.5; anim.smile = 1.2;
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
          anim.jumpT = 1.2; anim.waveT = 2.5; anim.smile = 1.2;
          showBubble('注册成功！欢迎加入福音传播爱 🎉');
          speak('注册成功！欢迎加入福音传播爱！');
          showSuccess('注册成功！', '欢迎回家，' + (d.user.nickname || '亲爱的家人'));
        } else {
          $('regForm').classList.add('shake');
          setTimeout(function () { $('regForm').classList.remove('shake'); }, 700);
          showBubble(d.message || '注册失败'); speak(d.message || '注册失败');
          loadCaptcha();
        }
      }).catch(function () {
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
        anim.jumpT = 1.2; anim.waveT = 2.5; anim.smile = 1.2;
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
      anim.jumpT = 1.2; anim.waveT = 2.5; anim.smile = 1.2;
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
          anim.jumpT = 1.2; anim.waveT = 2.5; anim.smile = 1.2;
          showBubble('登录成功！欢迎回来 🙏');
          speak('登录成功！欢迎回来！');
          showSuccess('登录成功！', '欢迎回家，' + (d.user.nickname || '亲爱的家人'));
        } else if (d && (d.message || '').indexOf('密码错误') >= 0) {
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
      }).catch(function () {
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
        anim.jumpT = 1.2; anim.waveT = 2.5; anim.smile = 1.2;
        showBubble('登录成功！欢迎回来 🙏（本地模式）');
        speak('登录成功！欢迎回来！');
        showSuccess('登录成功！', '欢迎回家，' + (lu2.nickname || '亲爱的家人'));
      });
  }
  /* ========== 成功动画 ========== */
  function showSuccess(title, sub) {
    $('successTitle').textContent = title;
    $('successSub').textContent = sub;
    $('successMask').classList.add('show');
  }
  function goHome() {
    $('successMask').classList.remove('show');
    var back = localStorage.getItem('auth_back') || './';
    try { location.href = back; } catch (e) { location.href = './'; }
  }
  /* ========== 初始化 ========== */
  function init() {
    init3D();
    if (location.hash === '#register') switchMode('register', true);
    else switchMode('login', true);
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
