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
  var walkClip = null, walkAction = null, idleAction = null, isWalkingAnim = false;
  var anim = { shakeT: 0, jumpT: 0, waveT: 0, smile: 0, talk: 0, blinkT: 0 };
  function init3D() {
    var canvas = $('threeCanvas');
    if (!canvas) return;
    /* three.js 加载失败：直接回退Canvas2D程序化人物（avatar_ai.js接管），绝不空白舞台 */
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
      try { showCanvasFallback(); } catch (e) {}
      return;
    }
    try {
      var pw = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      var ph = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      canvas.width = Math.max(10, pw * (window.devicePixelRatio || 1));
      canvas.height = Math.max(10, ph * (window.devicePixelRatio || 1));
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
      if (THREE.ACESFilmicToneMapping !== undefined) renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.setSize(pw, ph);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
      camera.position.set(0, 0.95, 3.6); camera.lookAt(0, 1.05, 0);
      scene.add(new THREE.AmbientLight(0xfff2dd, 0.9));
      var key = new THREE.DirectionalLight(0xfff3d6, 1.4); key.position.set(3, 5, 4); scene.add(key);
      var fill = new THREE.DirectionalLight(0xbcd4ff, 0.6); fill.position.set(-4, 2, 3); scene.add(fill);
      var rim = new THREE.DirectionalLight(0xffd9a0, 0.7); rim.position.set(0, 3, -3); scene.add(rim);
      var ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.42, 48), new THREE.MeshBasicMaterial({ color: 0xC8973A, transparent: true, opacity: 0.28, side: THREE.DoubleSide }));
      ring.rotation.x = -0.35; ring.position.set(0, 1.0, -0.9); scene.add(ring);
      /* GLB加载超时保护：30秒未成功才回退Canvas2D（手机网络慢，8秒太短会导致3D模型未加载完就被误判失败） */
      var glbTimer = setTimeout(function () {
        if (!character) { try { showCanvasFallback(); } catch (e) {} }
      }, 30000);
      loadModel(glbTimer);
      clock = new THREE.Clock();
      animate();
      window.addEventListener('resize', onResize);
    } catch (e) { console.error('3D init error', e); try { showCanvasFallback(); } catch (e2) {} }
  }
  function showCanvasFallback() {
    /* 隐藏threeCanvas，显示Canvas2D程序化全身人物（avatar_ai.js持续绘制） */
    try {
      var c3 = $('threeCanvas'); if (c3) c3.style.display = 'none';
      var c2 = $('avatarCanvas'); if (c2) c2.style.display = 'block';
      if (window.AvatarAI && AvatarAI.set3DReady) AvatarAI.set3DReady(false);
    } catch (e) {}
  }
  function loadModel(glbTimer) {
    var loader = new THREE.GLTFLoader();
    /* 中年男性模型优先：XBot（男性，动画最丰富：走/跑/同意/摇头/伤心）→ Soldier（男性士兵）→ CesiumMan（人形）→ Michelle（女性兜底）
       本地模型加载失败时，自动切换网上CDN备用源（three.js官方GitHub托管，确保任何网络环境下都能加载全身模型） */
    var tryUrls = [
      /* ===== 中年男性模型优先：xbot（男性+走路/跑/点头/摇头/挥手动画最丰富，真实自然走动行走） =====
         本地xbot加载失败才依次降级 soldier（男性士兵，有走路动画）→ cesium_man（438KB人形无动画兜底）→ michelle（女性兜底） */
      'js/xbot.glb', 'auth/js/xbot.glb', 'szxfuyin/js/xbot.glb', './js/xbot.glb',
      'js/soldier.glb', 'auth/js/soldier.glb', 'szxfuyin/js/soldier.glb', './js/soldier.glb',
      'js/cesium_man.glb', 'auth/js/cesium_man.glb', 'szxfuyin/js/cesium_man.glb', './js/cesium_man.glb',
      'js/michelle.glb', 'auth/js/michelle.glb', 'szxfuyin/js/michelle.glb', './js/michelle.glb',
      /* ===== 网上备用源：国内可达的jsdelivr优先（raw.githubusercontent.com在国内经常超时） ===== */
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Soldier.glb',
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Xbot.glb',
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Michelle.glb',
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb',
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb',
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb'
    ];
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
          /* 给模型头部添加五官（眼睛/眉毛/鼻子/嘴）——解决用户反馈的"没五官"问题 */
          addFaceFeatures(character);
          character.traverse(function (o) {
            if (o.isMesh && o.morphTargetDictionary) {
              morphMesh = o; morphDict = o.morphTargetDictionary;
            }
          });
          if (gltf.animations && gltf.animations.length) {
            avatarMixer = new THREE.AnimationMixer(character);
            var idle = gltf.animations.filter(function (a) { return /idle|pose|talk|wave|hello/i.test(a.name); });
            var clip = idle[0] || gltf.animations[0];
            if (clip) { idleAction = avatarMixer.clipAction(clip); idleAction.play(); }
            /* 预载走路/跑步动画（AvatarAI走路时切换） */
            var walkAnim = gltf.animations.filter(function (a) { return /walk|run/i.test(a.name); });
            if (walkAnim.length) { walkClip = walkAnim[0]; try { walkAction = avatarMixer.clipAction(walkClip); walkAction.setLoop(THREE.LoopRepeat); walkAction.stop(); } catch (e2) { walkAction = null; } }
            /* 预载表情动作动画：agree(点头) / headShake(摇头) / sad_pose(伤心) 等，无morph模型用骨骼动画表达情绪 */
            var clipMap = {};
            var animList = gltf.animations || [];
            for (var ai = 0; ai < animList.length; ai++) {
              var an = animList[ai].name || '';
              if (/agree|nod/i.test(an)) clipMap.nod = animList[ai];
              else if (/headShake|shake/i.test(an)) clipMap.shake = animList[ai];
              else if (/sad|sorrow|worry/i.test(an)) clipMap.sad = animList[ai];
              else if (/wave|hello|hi/i.test(an)) clipMap.wave = animList[ai];
            }
            try { window._avatarClipMap = clipMap; } catch (e) {}
          }
          /* 3D模型渲染成功：通知AvatarAI隐藏Canvas2D人物，只保留语音/AI/气泡 */
          try { if (glbTimer) clearTimeout(glbTimer); } catch (e) {}
          try { if (window.AvatarAI && AvatarAI.set3DReady) AvatarAI.set3DReady(true); } catch (e) {}
          showBubble('欢迎来到兆西福音传递爱，愿你平安 🙏', 5000);
          /* 欢迎语只由AvatarAI统一播报一次（彻底杜绝双声音） */
        } catch (e) { console.error('model setup err', e); tryLoad(); }
      }, undefined, function () { tryLoad(); });
    }
    tryLoad();
  }
  function buildFallback() {
    /* 3D模型全部加载失败：隐藏threeCanvas，交还Canvas2D程序化人物接管 */
    try {
      var c3 = $('threeCanvas'); if (c3) c3.style.display = 'none';
      if (window.AvatarAI && AvatarAI.set3DReady) AvatarAI.set3DReady(false);
      var c2 = $('avatarCanvas'); if (c2) c2.style.display = 'block';
    } catch (e) {}
    var g = new THREE.Group();
    var mat = new THREE.MeshBasicMaterial({ color: 0xE8B96A, transparent: true, opacity: 0.16 });
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 32), mat);
    sphere.position.set(0, 1.0, 0); g.add(sphere);
    scene.add(g); character = g;
  }
  /* ===== 给3D模型添加五官（眼睛/眉毛/鼻子/嘴）：任何GLB模型都有清晰人脸 ===== */
  function addFaceFeatures(gltfScene) {
    try {
      if (!THREE || !THREE.CanvasTexture || !THREE.SpriteMaterial || !THREE.Sprite) return;
      /* 用包围盒定位头部（模型最高处偏下一点=脸部区域） */
      var box = new THREE.Box3().setFromObject(gltfScene);
      var size = box.getSize(new THREE.Vector3());
      var center = box.getCenter(new THREE.Vector3());
      if (!size.y || size.y < 0.3) return;
      var headY = box.max.y - size.y * 0.10;   // 头顶略下方=脸
      var headW = Math.max(size.x * 0.55, size.z * 0.45, 0.12); // 头部宽度估算
      var headH = size.y * 0.16;
      /* 生成五官贴图（透明背景，只画眼/眉/鼻/嘴） */
      var cv = document.createElement('canvas');
      cv.width = 512; cv.height = 256;
      var c = cv.getContext('2d');
      c.clearRect(0, 0, 512, 256);
      /* 脸型底色（半透明肤色，贴合模型头部） */
      c.fillStyle = 'rgba(224,172,120,0.55)';
      c.beginPath(); c.ellipse(256, 150, 225, 100, 0, 0, Math.PI * 2); c.fill();
      /* 眉毛 */
      c.strokeStyle = '#4a3220'; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(160, 86); c.quadraticCurveTo(200, 76, 240, 86); c.stroke();
      c.beginPath(); c.moveTo(272, 86); c.quadraticCurveTo(312, 76, 352, 86); c.stroke();
      /* 眼睛（白眼球+黑瞳孔+高光） */
      c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(200, 112, 40, 26, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(312, 112, 40, 26, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#241a12';
      c.beginPath(); c.ellipse(200, 112, 19, 17, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(312, 112, 19, 17, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(194, 105, 6, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(306, 105, 6, 0, Math.PI * 2); c.fill();
      /* 鼻子（柔和阴影） */
      c.fillStyle = 'rgba(120,80,50,0.45)';
      c.beginPath(); c.ellipse(256, 148, 16, 22, 0, 0, Math.PI * 2); c.fill();
      /* 嘴巴（微笑） */
      c.strokeStyle = '#8a4a32'; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.moveTo(208, 190); c.quadraticCurveTo(256, 216, 304, 190); c.stroke();
      /* 耳朵 */
      c.fillStyle = 'rgba(200,150,105,0.6)';
      c.beginPath(); c.ellipse(42, 140, 20, 34, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(470, 140, 20, 34, 0, 0, Math.PI * 2); c.fill();
      var tex = new THREE.CanvasTexture(cv);
      tex.needsUpdate = true;
      var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
      var sprite = new THREE.Sprite(mat);
      sprite.scale.set(headW * 0.92, headH * 1.05, 1);
      sprite.position.set(center.x, headY, box.max.z + (size.z * 0.05) + 0.01);
      gltfScene.add(sprite);
      /* 记录到window，供动画微调使用 */
      try { window._faceSprite = sprite; window._faceBox = box; } catch (e) {}
    } catch (e) { /* 五官贴图失败不影响3D主体 */ }
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
    /* 走路动画自动切换：AvatarAI空闲时走动（walking=true），说话时站定（idle） */
    if (avatarMixer && character) {
      var walkingNow = false;
      try { if (window.AvatarAI && AvatarAI.isWalking) walkingNow = !!AvatarAI.isWalking(); } catch (e) {}
      if (walkingNow !== isWalkingAnim) {
        isWalkingAnim = walkingNow;
        if (walkAction || idleAction) {
          var from = walkingNow ? idleAction : walkAction;
          var to = walkingNow ? walkAction : idleAction;
          if (from) { from.fadeOut(0.35); }
          if (to) { to.reset(); to.fadeIn(0.35); to.play(); }
        }
      }
      if (isWalkingAnim && character) {
        if (walkAction) {
          /* 真实自然走动：播放走路骨骼动画 + 缓慢前行转身（不再左右平移） */
          character.position.x = Math.sin(t * 0.35) * 0.5;
          character.position.z = 0.12 + Math.sin(t * 0.35 - Math.PI / 2) * 0.32;
          character.rotation.y = Math.sin(t * 0.35) * 0.45;
        } else {
          /* 无走路动画的模型（如cesium_man）：小幅左右踱步+转身兜底 */
          character.position.x = Math.sin(t * 0.9) * 0.4;
          character.rotation.y = Math.sin(t * 0.9) * 0.22;
        }
      }
      avatarMixer.update(0.016);
    }
    if (!character) return;
    character.position.y = 0.02 + Math.sin(t * 1.6) * 0.008;
    if (!isWalkingAnim) character.rotation.y = Math.sin(t * 0.6) * 0.05;
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
    /* 骨骼动画情绪表达：根据AvatarAI当前情绪播放点头/摇头/伤心动画（无morph模型的替代方案） */
    try {
      if (window.AvatarAI && window._avatarClipMap && avatarMixer) {
        var cm = window._avatarClipMap;
        var moodNow = '';
        try { moodNow = window.AvatarAI.getMood ? window.AvatarAI.getMood() : ''; } catch (e) {}
        var wantClip = null;
        if (moodNow === 'praise' && cm.nod) wantClip = cm.nod;
        else if (moodNow === 'comfort' && cm.nod) wantClip = cm.nod;
        else if (moodNow === 'sad' && cm.sad) wantClip = cm.sad;
        else if (moodNow === 'joy' && cm.wave) wantClip = cm.wave;
        if (wantClip && wantClip !== window._avatarMoodClip) {
          var moodAction = avatarMixer.clipAction(wantClip);
          if (window._avatarMoodAction) { try { window._avatarMoodAction.stop(); } catch (e) {} }
          moodAction.reset(); moodAction.setLoop(THREE.LoopRepeat); moodAction.play();
          window._avatarMoodAction = moodAction; window._avatarMoodClip = wantClip;
        } else if (!wantClip && window._avatarMoodAction) {
          try { window._avatarMoodAction.stop(); } catch (e) {}
          window._avatarMoodAction = null; window._avatarMoodClip = null;
        }
      }
    } catch (e) {}
    anim.blinkT -= 0.016;
    if (anim.blinkT <= 0) { anim.blinkT = 2.2 + Math.random() * 3; }
    var blink = anim.blinkT < 0.12 ? Math.abs(Math.sin(anim.blinkT * 40)) : 0;
    setMorphLerp('eyeBlinkLeft', blink, 0.9);
    setMorphLerp('eyeBlinkRight', blink, 0.9);
    setMorphLerp('eyeSquintLeft', blink * 0.4, 0.5);
    setMorphLerp('eyeSquintRight', blink * 0.4, 0.5);
    /* 3D模型嘴型联动：直接读取AvatarAI说话状态（语音统一走AvatarAI后animTalk回调不再触发） */
    try {
      var aiTalking = false;
      if (window.AvatarAI && AvatarAI.getTalking) aiTalking = !!AvatarAI.getTalking();
      if (aiTalking) anim.talk = Math.min(1, anim.talk + 0.35);
    } catch (e) {}
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
