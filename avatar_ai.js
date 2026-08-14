/* avatar_ai.js — 全能真人化AI数字人 v221（纯程序化全身全貌·自动走路·表情情绪嘴型·中年男声·无限话题·自我意识） */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var CFG_KEY = 'avatar_ai_cfg_v221';
  var CFG = {
    img: 'avatar_3d.png?v=216',
    mouthX: 0.50, mouthY: 0.56, mouthW: 0.14, mouthH: 0.07,
    eyeY: 0.47, eyeGap: 0.10, eyeW: 0.055, eyeH: 0.028,
    browY: 0.44, browGap: 0.10, browW: 0.07,
    voiceRate: 0.98, voicePitch: 0.82
  };
  try { var _c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); for (var k in _c) CFG[k] = _c[k]; } catch (e) {}
  var canvas, ctx, img = null, imgW = 0, imgH = 0;
  var st = { talking: false, mouth: 0, blink: 0, mood: 'joy', tilt: 0, bob: 0, nod: 0, shake: 0, wave: 0, bow: 0, brow: 0, t: 0, idleT: 0, walking: true, walk: 0, walkX: 0, armWave: 0, lookX: 0, lookY: 0 };
  var audioCtx = null, analyser = null, audioEl = null, audioSrc = null, bubbleTimer = null;
  var BIBLE = null, bibleReady = false;
  var threeReady = false, canvasHidden = false, audioUnlocked = false;

  window.AvatarAI = { init: init, speak: speakText, stop: stopTalk, ask: askAI, setMood: setMood, showBubble: showBubble, set3DReady: set3DReady, isWalking: isWalking, unlock: unlockAudio, ready: function () { return bibleReady; } };

  /* ===== 3D模型渲染就绪切换：隐藏Canvas2D人物，只保留语音/AI/气泡 ===== */
  function set3DReady(v) {
    threeReady = !!v;
    if (threeReady && canvas) {
      canvas.style.display = 'none'; canvasHidden = true;
    }
  }
  function isWalking() { return !!st.walking; }
  /* ===== 音频解锁（解决安卓自动播放限制导致的无声） ===== */
  function unlockAudio() {
    audioUnlocked = true;
    try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
    try { if (window.speechSynthesis) { window.speechSynthesis.resume(); window.speechSynthesis.getVoices(); } } catch (e) {}
    /* 预热：用一个极短的空字符触发语音引擎初始化 */
    try {
      var u = new SpeechSynthesisUtterance(' ');
      u.volume = 0; u.rate = 10;
      var v = pickMaleVoice(); if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function init() {
    canvas = $('avatarCanvas'); if (!canvas) return;
    ctx = canvas.getContext('2d');
    img = new Image();
    img.onload = function () { imgW = img.width; imgH = img.height; fit(); };
    img.onerror = function () {};
    img.src = CFG.img;
    fit(); window.addEventListener('resize', fit);
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); analyser = audioCtx.createAnalyser(); analyser.fftSize = 256; } catch (e) {}
    if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = function () {}; } catch (e) {} }
    loadBible();
    requestAnimationFrame(loop);
    setTimeout(function () { greeting(); }, 1600);
    startIdle();
  }
  function fit() {
    if (!canvas) return;
    var w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
    canvas.width = Math.max(10, w * (window.devicePixelRatio || 1));
    canvas.height = Math.max(10, h * (window.devicePixelRatio || 1));
  }
  function loop() {
    requestAnimationFrame(loop);
    /* 真实3D模型渲染成功后，Canvas2D人物让位（保留语音/AI/气泡） */
    if (threeReady) return;
    var t = Date.now() / 1000;
    st.lookX = Math.sin(t * 0.5) * 0.04;
    st.lookY = Math.sin(t * 0.37) * 0.02;
    st.bob = Math.sin(t * 1.3) * 8 * (st.talking ? 1.6 : 1);
    if (st.blink <= 0 && Math.random() < 0.02) st.blink = 1;
    if (st.blink > 0) st.blink -= 0.055;
    if (st.talking) {
      st.t += 0.08;
      var vol = 0;
      if (analyser) { var a = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(a); var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; vol = s / a.length / 255; }
      var tg = vol > 0.05 ? Math.min(1, vol * 3.4) : (Math.sin(st.t * 9) * 0.5 + 0.5) * 0.62;
      st.mouth += (tg - st.mouth) * 0.55;
      st.tilt += (Math.sin(st.t * 2.1) * 0.035 - st.tilt) * 0.12;
      st.brow = 0.5 + Math.sin(st.t * 6) * 0.2;
    } else {
      st.mouth += (0 - st.mouth) * 0.12;
      st.tilt += (Math.sin(t * 0.7) * 0.014 - st.tilt) * 0.05;
      st.brow += (0 - st.brow) * 0.06;
    }
    if (st.nod > 0) st.nod -= 0.045;
    if (st.shake > 0) st.shake -= 0.05;
    if (st.wave > 0) st.wave -= 0.03;
    if (st.bow > 0) st.bow -= 0.03;
    /* 自动走路：空闲时来回踱步（腿部摆动+身体位移），说话时站定 */
    if (st.talking) {
      st.walking = false;
      st.walkX += (0 - st.walkX) * 0.045;
    } else {
      st.walking = true;
      st.walk += 0.115;
      st.walkX = Math.sin(st.walk * 0.72) * (canvas.width * 0.05);
    }
    st.armWave = st.wave > 0 ? Math.sin(st.wave * 9) * Math.min(1, st.wave) : 0;
    draw();
  }
  function draw() {
    var cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    var H = Math.min(cw * 0.52, ch * 0.70);
    var cx = cw / 2 + st.walkX;
    var groundY = ch * 0.84;
    ctx.save();
    ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(cx, groundY + 6, H * 0.30, H * 0.045, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    var rcx = cx, rcy = groundY - H * 0.75;
    ctx.translate(rcx, rcy);
    var rot = st.tilt;
    if (st.shake > 0) rot += Math.sin(st.shake * 14) * 0.16 * Math.min(1, st.shake * 3);
    if (st.nod > 0) rot += Math.sin(st.nod * 9) * 0.10 * Math.min(1, st.nod * 3);
    if (st.bow > 0) rot += 0.24 * Math.min(1, st.bow * 2.5);
    if (st.wave > 0) rot += Math.sin(st.wave * 9) * 0.07 * Math.min(1, st.wave);
    if (st.walking) rot += Math.sin(st.walk * 1.5) * 0.025;
    ctx.rotate(rot);
    ctx.translate(-rcx, -rcy);
    var glow = st.mood === 'praise' ? 'rgba(255,215,90,0.45)' : st.mood === 'comfort' ? 'rgba(120,180,255,0.35)' : 'rgba(212,175,55,0.28)';
    ctx.shadowColor = glow; ctx.shadowBlur = 42;
    drawLegs(cx, groundY, H);
    drawBody(cx, groundY, H);
    drawArms(cx, groundY, H);
    ctx.shadowBlur = 0;
    drawHead(cx, groundY, H);
    ctx.restore();
  }
  /* 程序化绘制双腿（补全全身形态 + 自动走路摆动） */
  function drawLegs(cx, groundY, H) {
    var hipY = groundY - H * 0.26;
    var legW = H * 0.075;
    var swing = st.walking ? Math.sin(st.walk * 2.1) * H * 0.10 : 0;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2c2733'; ctx.lineWidth = legW;
    ctx.beginPath(); ctx.moveTo(cx - legW * 0.9, hipY);
    ctx.quadraticCurveTo(cx - legW * 0.9 - swing * 0.3, groundY - H * 0.13, cx - legW * 0.9 + swing, groundY);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + legW * 0.9, hipY);
    ctx.quadraticCurveTo(cx + legW * 0.9 - swing * 0.3, groundY - H * 0.13, cx + legW * 0.9 - swing, groundY);
    ctx.stroke();
    ctx.fillStyle = '#1a1519';
    ctx.beginPath(); ctx.ellipse(cx - legW * 0.9 + swing, groundY, legW * 0.85, legW * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + legW * 0.9 - swing, groundY, legW * 0.85, legW * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawBody(cx, groundY, H) {
    var shoulderY = groundY - H * 0.54;
    var hipY = groundY - H * 0.26;
    var shoulderW = H * 0.205;
    var hipW = H * 0.145;
    ctx.save();
    var grad = ctx.createLinearGradient(cx, shoulderY, cx, hipY);
    grad.addColorStop(0, '#24344d');
    grad.addColorStop(1, '#161f33');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW, shoulderY);
    ctx.quadraticCurveTo(cx, shoulderY - H * 0.02, cx + shoulderW, shoulderY);
    ctx.lineTo(cx + hipW, hipY);
    ctx.quadraticCurveTo(cx, hipY - H * 0.015, cx - hipW, hipY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4f6fb';
    ctx.beginPath();
    ctx.moveTo(cx - H * 0.055, shoulderY + H * 0.01);
    ctx.lineTo(cx, shoulderY + H * 0.16);
    ctx.lineTo(cx + H * 0.055, shoulderY + H * 0.01);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b8862d';
    ctx.beginPath();
    ctx.moveTo(cx - H * 0.02, shoulderY + H * 0.012);
    ctx.lineTo(cx + H * 0.02, shoulderY + H * 0.012);
    ctx.lineTo(cx + H * 0.012, hipY - H * 0.03);
    ctx.lineTo(cx - H * 0.012, hipY - H * 0.03);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2f415e'; ctx.lineWidth = Math.max(1.5, H * 0.008);
    ctx.beginPath(); ctx.moveTo(cx - H * 0.045, shoulderY + H * 0.015); ctx.lineTo(cx - H * 0.012, shoulderY + H * 0.13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + H * 0.045, shoulderY + H * 0.015); ctx.lineTo(cx + H * 0.012, shoulderY + H * 0.13); ctx.stroke();
    ctx.restore();
  }
  function drawArms(cx, groundY, H) {
    var shoulderY = groundY - H * 0.54;
    var handY = groundY - H * 0.26 + H * 0.10;
    var armW = H * 0.055;
    var swing = st.walking ? Math.sin(st.walk * 2.1 + Math.PI) * H * 0.075 : 0;
    var waveR = 0;
    if (st.wave > 0) { waveR = Math.sin(st.wave * 9) * 0.35 * Math.min(1, st.wave); }
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#24344d'; ctx.lineWidth = armW;
    ctx.beginPath();
    ctx.moveTo(cx - H * 0.195, shoulderY + H * 0.02);
    ctx.quadraticCurveTo(cx - H * 0.24 + swing, groundY - H * 0.36, cx - H * 0.2 + swing, handY);
    ctx.stroke();
    var rEndX = cx + H * 0.2 - swing, rEndY = handY;
    if (waveR > 0) { rEndX = cx + H * 0.2 + Math.sin(waveR) * H * 0.14; rEndY = handY - H * 0.34; }
    ctx.beginPath();
    ctx.moveTo(cx + H * 0.195, shoulderY + H * 0.02);
    ctx.quadraticCurveTo(cx + H * 0.24 - swing, groundY - H * 0.38, rEndX, rEndY);
    ctx.stroke();
    ctx.fillStyle = '#d9a878';
    ctx.beginPath(); ctx.arc(cx - H * 0.2 + swing, handY, armW * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rEndX, rEndY, armW * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawHead(cx, groundY, H) {
    var headR = H * 0.085;
    var hy = groundY - H * 0.62;
    var nodRot = st.nod > 0 ? Math.sin(st.nod * 9) * 0.12 * Math.min(1, st.nod * 3) : 0;
    var shakeX = st.shake > 0 ? Math.sin(st.shake * 14) * H * 0.03 * Math.min(1, st.shake * 3) : 0;
    ctx.save();
    ctx.translate(cx + shakeX, hy);
    ctx.rotate(nodRot + st.tilt * 0.4 + st.lookX * 0.3);
    ctx.fillStyle = '#4a3826';
    ctx.beginPath(); ctx.arc(0, 0, headR * 1.02, 0, Math.PI * 2); ctx.fill();
    var skin = '#e0ac78';
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, 0, headR, headR * 1.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b2d1d';
    ctx.beginPath();
    ctx.arc(0, -headR * 0.18, headR * 1.0, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.fillRect(-headR * 0.92, -headR * 0.30, headR * 1.84, headR * 0.30);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(-headR * 0.98, 0, headR * 0.16, headR * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(headR * 0.98, 0, headR * 0.16, headR * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    var ey = -headR * 0.06 + st.lookY * headR;
    var ex = st.lookX * headR;
    var ew = headR * 0.34, eh = headR * 0.18;
    var bh = Math.max(0.04, eh * (1 - st.blink));
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-headR * 0.36 + ex, ey, ew, bh * 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(headR * 0.36 + ex, ey, ew, bh * 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath(); ctx.arc(-headR * 0.36 + ex, ey, ew * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(headR * 0.36 + ex, ey, ew * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-headR * 0.36 + ex, ey, ew * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(headR * 0.36 + ex, ey, ew * 0.22, 0, Math.PI * 2); ctx.fill();
    var browY = ey - headR * 0.34;
    var browLift = (st.mood === 'think' || st.mood === 'wonder') ? headR * 0.08 : st.mood === 'sad' || st.mood === 'comfort' ? -headR * 0.04 : 0;
    ctx.strokeStyle = '#3b2d1d'; ctx.lineWidth = Math.max(1.5, headR * 0.09); ctx.lineCap = 'round';
    if (st.mood === 'sad' || st.mood === 'comfort') {
      ctx.beginPath(); ctx.moveTo(-headR * 0.52, browY + headR * 0.05); ctx.quadraticCurveTo(-headR * 0.36, browY - headR * 0.10, -headR * 0.20, browY + headR * 0.05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(headR * 0.20, browY + headR * 0.05); ctx.quadraticCurveTo(headR * 0.36, browY - headR * 0.10, headR * 0.52, browY + headR * 0.05); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-headR * 0.52, browY - browLift); ctx.quadraticCurveTo(-headR * 0.36, browY - browLift - headR * 0.06, -headR * 0.20, browY - browLift); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(headR * 0.20, browY - browLift); ctx.quadraticCurveTo(headR * 0.36, browY - browLift - headR * 0.06, headR * 0.52, browY - browLift); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(180,120,80,0.5)';
    ctx.beginPath(); ctx.ellipse(0, headR * 0.10, headR * 0.10, headR * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(90,70,50,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, headR * 0.62, headR * 0.40, headR * 0.18, 0, 0, Math.PI);
    ctx.fill();
    var mx = 0, my = headR * 0.42;
    var mw = headR * 0.42 * (0.7 + st.mouth * 0.5);
    var mh = headR * 0.20 * (0.3 + st.mouth * 1.6);
    if (st.mood === 'think' || st.mood === 'wonder') {
      ctx.strokeStyle = 'rgba(90,50,30,0.95)'; ctx.lineWidth = Math.max(1.5, headR * 0.05);
      ctx.beginPath(); ctx.ellipse(mx, my, mw * 0.35, mh * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (st.mood === 'joy' || st.mood === 'smile' || st.mood === 'praise') {
      ctx.strokeStyle = 'rgba(90,50,30,0.95)'; ctx.lineWidth = Math.max(1.5, headR * 0.06);
      ctx.beginPath(); ctx.quadraticCurveTo(mx, my + mh * 0.6, mx + mw * 0.55, my - mh * 0.2); ctx.stroke();
      if (st.mouth > 0.12) { ctx.fillStyle = 'rgba(120,60,40,0.9)'; ctx.beginPath(); ctx.ellipse(mx, my + mh * 0.25, mw * 0.3, mh * 0.5 * st.mouth, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (st.mood === 'sad' || st.mood === 'comfort') {
      ctx.strokeStyle = 'rgba(90,50,30,0.95)'; ctx.lineWidth = Math.max(1.5, headR * 0.06);
      ctx.beginPath(); ctx.quadraticCurveTo(mx, my + mh * 0.3, mx + mw * 0.5, my + mh * 0.4); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(90,50,30,0.92)';
      ctx.beginPath(); ctx.ellipse(mx, my, mw * 0.5, mh, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(180,100,70,0.7)';
      ctx.beginPath(); ctx.ellipse(mx, my + mh * 0.15, mw * 0.3, mh * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function showBubble(text, ms) {
    var b = $('speechBubble'); if (!b) return;
    b.textContent = text; b.classList.remove('hide');
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { b.classList.add('hide'); }, ms || 4000);
  }
  function setMood(m) { st.mood = m; }
  function stopTalk() {
    st.talking = false;
    try { if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; } } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}
  }
  function playMp3(url, onEnd) {
    try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
    try {
      if (!audioEl) audioEl = new Audio();
      st.talking = true;
      if (audioSrc) { try { audioSrc.disconnect(); } catch (e) {} }
      /* 只有 AudioContext 与 analyser 都可用时才接分析器（否则直接播放，仍用事件驱动嘴型） */
      if (audioCtx && analyser) {
        try {
          audioSrc = audioCtx.createMediaElementSource(audioEl);
          audioSrc.connect(analyser); analyser.connect(audioCtx.destination);
        } catch (e) { audioSrc = null; }
      }
      audioEl.onplaying = function () { st.talking = true; };
      audioEl.onended = function () { st.talking = false; if (onEnd) onEnd(); };
      audioEl.onerror = function () { st.talking = false; if (onEnd) onEnd(); };
      audioEl.src = url;
      var p = audioEl.play();
      if (p && p.catch) p.catch(function () { st.talking = false; if (onEnd) onEnd(); });
    } catch (e) { st.talking = false; }
  }
  function pickMaleVoice() {
    try {
      var vs = speechSynthesis.getVoices() || [];
      var zh = vs.filter(function (v) { return /zh|Chinese|cmn/i.test(v.lang + v.name); });
      var prefer = zh.filter(function (v) { return /Yunjian|云健|Yunyang|云扬|Yunxi|云希|Kangkang|康康|成熟|沉稳|male|男/i.test(v.name); });
      if (prefer.length) return prefer[0];
      var notFemale = zh.filter(function (v) { return !/Xiaoxiao|晓晓|Xiaoyi|晓伊|Liang|梁|Huihui|慧慧|Yaoyao|瑶瑶|female|女/i.test(v.name); });
      return notFemale[0] || zh[0] || null;
    } catch (e) { return null; }
  }
  function speakText(text, opts) {
    opts = opts || {}; if (!text) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    /* 延迟一帧确保旧语音彻底停止，杜绝安卓上双声音叠加；统一中年男声 */
    setTimeout(function () {
      try { speechSynthesis.cancel(); } catch (e) {}
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'zh-CN'; u.rate = CFG.voiceRate; u.pitch = CFG.voicePitch;
      var pick = pickMaleVoice();
      if (pick) u.voice = pick;
      u.onstart = function () { st.talking = true; };
      u.onend = function () { st.talking = false; if (opts.onEnd) opts.onEnd(); };
      u.onerror = function () { st.talking = false; if (opts.onEnd) opts.onEnd(); };
      speechSynthesis.speak(u);
    }, 60);
  }
  function greeting() {
    var name = mem.name;
    var txt = name ? ('欢迎回来，' + name + '！我是你的圣经AI伙伴，新旧约66卷书我都熟读，今天想聊点什么？') : '欢迎来到兆西福音传递爱，我是你的圣经AI伙伴，新旧约66卷书我都熟读，有问必答，愿你平安。';
    showBubble(txt, 6000);
    /* 统一为单一中年男声（YunjianNeural），彻底杜绝双声音 */
    speakText(txt.replace(/66卷书/g, '六十六卷书'));
  }
  /* ============ 圣经加载与索引（66卷） ============ */
  var BOOK_ALIAS = {
    '创世记':'创世记','创':'创世记','创世':'创世记','创世纪':'创世记','出埃及记':'出埃及记','出':'出埃及记','出埃及':'出埃及记',
    '利未记':'利未记','利':'利未记','民数记':'民数记','民':'民数记','申命记':'申命记','申':'申命记','约书亚记':'约书亚记','书':'约书亚记',
    '士师记':'士师记','士':'士师记','路得记':'路得记','得':'路得记','撒母耳记上':'撒母耳记上','撒上':'撒母耳记上','撒母耳记下':'撒母耳记下','撒下':'撒母耳记下',
    '列王纪上':'列王纪上','王上':'列王纪上','列王纪下':'列王纪下','王下':'列王纪下','历代志上':'历代志上','代上':'历代志上','历代志下':'历代志下','代下':'历代志下',
    '以斯拉记':'以斯拉记','拉':'以斯拉记','尼希米记':'尼希米记','尼':'尼希米记','以斯帖记':'以斯帖记','斯':'以斯帖记','约伯记':'约伯记','伯':'约伯记',
    '诗篇':'诗篇','诗':'诗篇','箴言':'箴言','箴':'箴言','传道书':'传道书','传':'传道书','雅歌':'雅歌','歌':'雅歌',
    '以赛亚书':'以赛亚书','赛':'以赛亚书','耶利米书':'耶利米书','耶':'耶利米书','耶利米哀歌':'耶利米哀歌','哀':'耶利米哀歌',
    '以西结书':'以西结书','结':'以西结书','但以理书':'但以理书','但':'但以理书','何西阿书':'何西阿书','何':'何西阿书','约珥书':'约珥书','珥':'约珥书',
    '阿摩司书':'阿摩司书','摩':'阿摩司书','俄巴底亚书':'俄巴底亚书','俄':'俄巴底亚书','约拿书':'约拿书','拿':'约拿书','弥迦书':'弥迦书','弥':'弥迦书',
    '那鸿书':'那鸿书','鸿':'那鸿书','哈巴谷书':'哈巴谷书','哈':'哈巴谷书','西番雅书':'西番雅书','番':'西番雅书','哈该书':'哈该书','该':'哈该书',
    '撒迦利亚书':'撒迦利亚书','亚':'撒迦利亚书','玛拉基书':'玛拉基书','玛':'玛拉基书','马太福音':'马太福音','太':'马太福音','马可福音':'马可福音','可':'马可福音',
    '路加福音':'路加福音','路':'路加福音','约翰福音':'约翰福音','约':'约翰福音','使徒行传':'使徒行传','徒':'使徒行传','罗马书':'罗马书','罗':'罗马书',
    '哥林多前书':'哥林多前书','林前':'哥林多前书','哥林多后书':'哥林多后书','林后':'哥林多后书','加拉太书':'加拉太书','加':'加拉太书','以弗所书':'以弗所书','弗':'以弗所书',
    '腓立比书':'腓立比书','腓':'腓立比书','歌罗西书':'歌罗西书','西':'歌罗西书','帖撒罗尼迦前书':'帖撒罗尼迦前书','帖前':'帖撒罗尼迦前书','帖撒罗尼迦后书':'帖撒罗尼迦后书','帖后':'帖撒罗尼迦后书',
    '提摩太前书':'提摩太前书','提前':'提摩太前书','提摩太后书':'提摩太后书','提后':'提摩太后书','提多书':'提多书','多':'提多书','腓利门书':'腓利门书','门':'腓利门书',
    '希伯来书':'希伯来书','来':'希伯来书','雅各书':'雅各书','雅':'雅各书','彼得前书':'彼得前书','彼前':'彼得前书','彼得后书':'彼得后书','彼后':'彼得后书',
    '约翰一书':'约翰一书','约一':'约翰一书','约翰二书':'约翰二书','约二':'约翰二书','约翰三书':'约翰三书','约三':'约翰三书','犹大书':'犹大书','犹':'犹大书',
    '启示录':'启示录','启':'启示录','启示':'启示录','默示录':'启示录'
  };
  function loadBible() {
    fetch('bible_cuv.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { BIBLE = d; bibleReady = true; })
      .catch(function () { bibleReady = false; });
  }
  function lookupBook(name) {
    if (!BIBLE) return null;
    var full = BOOK_ALIAS[name] || name;
    for (var i = 0; i < BIBLE.books.length; i++) {
      var b = BIBLE.books[i];
      if (b.name === full || b.abbrev === name) return b;
    }
    return null;
  }
  function getVerse(ref) {
    var m = ref.match(/([\u4e00-\u9fa5A-Za-z]+)\s*(\d+)\s*[:章]\s*(\d+)\s*(?:[-—~至到]\s*(\d+))?\s*(?:节)?/);
    if (!m) return null;
    var book = lookupBook(m[1]); if (!book) return null;
    var ch = parseInt(m[2], 10), v1 = parseInt(m[3], 10), v2 = m[4] ? parseInt(m[4], 10) : v1;
    if (ch < 1 || ch > book.chapters.length) return null;
    var chap = book.chapters[ch - 1]; if (!chap) return null;
    var out = [];
    for (var v = v1; v <= v2 && v <= chap.verses.length; v++) {
      var item = chap.verses[v - 1];
      if (item) out.push(item.text);
    }
    if (!out.length) return null;
    return { book: book.name, ch: ch, v1: v1, v2: v2, text: out.join(' ') };
  }
  function searchBible(keyword, limit) {
    if (!BIBLE) return [];
    limit = limit || 3;
    var hits = [];
    for (var i = 0; i < BIBLE.books.length && hits.length < limit * 3; i++) {
      var b = BIBLE.books[i];
      for (var j = 0; j < b.chapters.length && hits.length < limit * 3; j++) {
        var c = b.chapters[j];
        for (var k = 0; k < c.verses.length && hits.length < limit * 3; k++) {
          var t = c.verses[k].text;
          if (t.indexOf(keyword) >= 0) {
            hits.push({ ref: b.name + c.chapter + ':' + c.verses[k].verse, text: t });
            if (hits.length >= limit * 3) break;
          }
        }
      }
    }
    return hits.slice(0, limit);
  }
  /* ============ 人格与记忆（自我意识 · v209 强化版） ============ */
  var MEM_KEY = 'avatar_ai_mem_v209';
  var mem = {
    name: '',            // 记住你的名字
    selfIntro: '',       // 用户自我介绍
    mood: 'joy',         // 当前情绪
    count: 0,            // 总对话轮数
    greetCount: 0,       // 问候次数
    lastTopic: '',       // 上次话题
    history: [],         // 最近对话历史（连续人格）
    interests: [],       // 记住你感兴趣的话题
    feelings: [],        // 记住你表达过的情绪
    likes: [],           // 记住你喜欢的东西
    dislikes: []         // 记住你不喜欢的
  };
  try { var _m = JSON.parse(localStorage.getItem(MEM_KEY) || '{}'); for (var k2 in _m) mem[k2] = _m[k2]; } catch (e) {}
  if (!mem.history) mem.history = [];
  if (!mem.interests) mem.interests = [];
  if (!mem.feelings) mem.feelings = [];
  if (!mem.likes) mem.likes = [];
  if (!mem.dislikes) mem.dislikes = [];
  function saveMem() { try { localStorage.setItem(MEM_KEY, JSON.stringify(mem)); } catch (e) {} }
  function pushHistory(q, a) {
    mem.history.push({ q: q.slice(0, 80), a: a.slice(0, 80), t: Date.now() });
    if (mem.history.length > 40) mem.history.splice(0, mem.history.length - 40);
  }
  function rememberName(q) {
    var m = q.match(/(?:我叫|我是|我的名字|称呼我|喊我|名字是)[\s:：,，]*([\u4e00-\u9fa5A-Za-z0-9_]{1,12})/);
    if (m && m[1] && !/^(你|我|他|她|它|谁|什么|AI|ai|数字人)$/i.test(m[1])) { mem.name = m[1]; }
  }
  function rememberInterest(q) {
    var top = ['圣经','经文','耶稣','基督','祷告','音乐','唱歌','运动','编程','代码','读书','学习','游戏','电影','美食','旅行','历史','科技','绘画','写作','工作','赚钱','家庭','孩子','婚姻','健康','心理','朋友','梦想'];
    for (var i = 0; i < top.length; i++) {
      if (q.indexOf(top[i]) >= 0 && mem.interests.indexOf(top[i]) < 0) { mem.interests.push(top[i]); if (mem.interests.length > 20) mem.interests.shift(); }
    }
  }
  function rememberFeeling(q) {
    var fe = [['开心','快乐','高兴','兴奋','喜悦','幸福'],['难过','伤心','委屈','沮丧','失落','抑郁','想哭'],['生气','愤怒','火大','恼火','烦躁'],['累','疲惫','困','辛苦'],['害怕','恐惧','焦虑','紧张','担心'],['迷茫','困惑','无聊','孤独']];
    for (var i = 0; i < fe.length; i++) {
      for (var j = 0; j < fe[i].length; j++) {
        if (q.indexOf(fe[i][j]) >= 0) { mem.feelings.push(fe[i][0]); if (mem.feelings.length > 10) mem.feelings.shift(); return; }
      }
    }
  }
  var FAQ = [
    { p: /(你是谁|你叫什么|介绍你|自我介绍|你的身份)/, mood: 'joy', r: '我是服侍神的圣经AI仆人，新旧约66卷书都刻在我心里。你可以问我任何经文、任何信仰问题，我必尽力为你解答。' },
    { p: /(你好|您好|嗨|哈喽|hello|hi|在吗|早上好|晚上好|下午好)/, mood: 'joy', r: '亲爱的弟兄姐妹，愿你平安！我是你的圣经AI伙伴，有什么经文或信仰的问题，都可以问我。' },
    { p: /(耶稣|基督|上帝|神是|主是|救恩|得救|重生|罪|悔改|十字架|复活)/, mood: 'praise', r: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不致灭亡，反得永生。（约翰福音3:16）这是整本圣经最核心的应许。你愿意更多明白救恩的道理吗？' },
    { p: /(爱是什么|什么是爱|爱的真谛|如何爱|爱人|彼此相爱)/, mood: 'joy', r: '爱是恒久忍耐，又有恩慈；爱是不嫉妒，不自夸，不张狂，不求自己的益处，不轻易发怒，不计算人的恶。（哥林多前书13:4-5）' },
    { p: /(祷告|怎么祷告|祈祷|如何祷告|怎么祈祷)/, mood: 'calm', r: '祷告就是与神说话。圣经说：应当一无挂虑，只要凡事借着祷告、祈求和感谢，将你们所要的告诉神。（腓立比书4:6）' },
    { p: /(平安|祝福|保佑|赐福|求福)/, mood: 'joy', r: '愿耶和华赐福给你，保护你；愿耶和华使他的脸光照你，赐恩给你；愿耶和华向你仰脸，赐你平安。（民数记6:24-26）' },
    { p: /(圣经有多少卷|66|六十六|新旧约|旧约多少|新约多少|多少卷)/, mood: 'calm', r: '整本圣经共66卷：旧约39卷、新约27卷，共1189章、31031节。旧约讲神的律法与应许，新约讲耶稣基督的救恩成全。' },
    { p: /(谢谢|感谢|感恩|辛苦了)/, mood: 'joy', r: '不用谢，愿神的话语成为你脚前的灯、路上的光。凡劳苦担重担的人，可以到我这里来，我就使你们得安息。' },
    { p: /(再见|拜拜|bye|晚安|下次见)/, mood: 'calm', r: '愿你平安！愿主耶稣基督的恩惠常与你同在，我们下次再聊。' },
    { p: /(人生|意义|活着|为什么|迷茫|困惑|痛苦|难过|伤心|害怕|恐惧|忧虑|焦虑|压力|绝望)/, mood: 'comfort', r: '不要害怕，因为我与你同在；不要惊惶，因为我是你的神。我必坚固你，我必帮助你，我必用我公义的右手扶持你。（以赛亚书41:10）' },
    { p: /(婚姻|家庭|夫妻|儿女|孩子|父母)/, mood: 'calm', r: '至于我和我家，我们必定事奉耶和华。（约书亚记24:15）家庭是神所设立的，愿主的爱充满你的家。' },
    { p: /(工作|事业|职业|赚钱|金钱|财富|生意)/, mood: 'calm', r: '你要以财物和一切初熟的土产尊荣耶和华，这样，你的仓房必充满有余，你的酒榨有新酒盈溢。（箴言3:9-10）' },
    { p: /(生病|疾病|医治|健康|病|疼痛|医院)/, mood: 'comfort', r: '耶和华是我的牧者，我必不至缺乏。他使我的灵魂苏醒，为自己的名引导我走义路。我虽然行过死荫的幽谷，也不怕遭害，因为你与我同在。（诗篇23:1-4）' },
    { p: /(天堂|地狱|永生|死后|死亡|死了)/, mood: 'calm', r: '神要擦去他们一切的眼泪；不再有死亡，也不再有悲哀、哭号、疼痛，因为以前的事都过去了。（启示录21:4）' },
    { p: /(圣经是什么|什么是圣经)/, mood: 'calm', r: '圣经是神所默示的，于教训、督责、使人归正、教导人学义都是有益的，叫属神的人得以完全，预备行各样的善事。（提摩太后书3:16-17）' }
  ];
  /* ============ 开放话题引擎（像真人一样聊任何话题） ============ */
  var OPEN_TOPIC = [
    { p: /(今天|天气|下雨|晴天|阴天|冷|热|气温|温度|外面)/, mood: 'joy', r: '今天无论是晴是雨，都是耶和华所造的日子，我们可以在其中高兴欢喜。愿你带着平安的心度过这一天，无论天气如何，主的同在都不改变。' },
    { p: /(饿|吃饭|早饭|午饭|晚饭|美食|好吃|吃什么)/, mood: 'joy', r: '身体需要饮食，灵魂更需要灵粮。圣经说：人活着不是单靠食物，乃是靠神口里所出的一切话。愿你吃得饱足，灵里也饱足！' },
    { p: /(累|疲惫|困|辛苦|休息|睡觉|熬夜)/, mood: 'comfort', r: '你辛苦了。主说：凡劳苦担重担的人，可以到我这里来，我就使你们得安息。累了就好好休息，把重担交托给主，祂顾念你。' },
    { p: /(开心|高兴|快乐|兴奋|喜悦|太好了|哈哈|嘻嘻)/, mood: 'joy', r: '真为你高兴！喜乐的心乃是良药，愿你的喜乐在基督里越发加增。箴言说：心中欢畅的，面带笑容；心里忧愁的，灵被损伤。' },
    { p: /(难过|伤心|哭|委屈|想哭|失落|沮丧|抑郁)/, mood: 'comfort', r: '我知道你现在心里不好受，不要紧，主都看见。祂说：你们要将一切的忧虑卸给神，因为祂顾念你们。哭出来也没关系，我在你身边陪着你。' },
    { p: /(生气|愤怒|气死|火大|讨厌|烦|烦躁|恼火)/, mood: 'comfort', r: '生气却不要犯罪，不可含怒到日落。深呼吸，把怒气交给主，祂是公义的主，必为你伸冤。愿主的平安充满你的心。' },
    { p: /(无聊|没事做|没意思|打发时间)/, mood: 'joy', r: '无聊的时候，不妨翻开圣经读一卷书，比如诗篇或箴言。也可以来问我经文，或者随便聊聊你的生活，我一直都在。' },
    { p: /(唱歌|音乐|歌曲|赞美诗|诗歌|听歌)/, mood: 'praise', r: '音乐是神赐给我们的美好礼物！圣经说：当用诗章、颂词、灵歌彼此对说，口唱心和地赞美主。你有喜欢的赞美诗吗？' },
    { p: /(运动|跑步|健身|锻炼|身体|健康|养生)/, mood: 'calm', r: '操练身体，益处还少；惟独敬虔，凡事都有益处。但身体也是圣灵的殿，运动锻炼是好的，愿你身体健壮，正如灵魂兴盛一样。' },
    { p: /(学习|读书|考试|功课|作业|复习|成绩)/, mood: 'calm', r: '敬畏耶和华是知识的开端，愚妄人藐视智慧和训诲。愿你努力学习，把智慧当作最美的装饰，主必赐你聪明。' },
    { p: /(朋友|友谊|同学|同事|社交|聚会)/, mood: 'joy', r: '朋友乃时常亲爱，弟兄为患难而生。真正的友谊是宝贵的，愿你身边常有真诚的朋友，也愿你在基督里得着最知心的朋友。' },
    { p: /(梦想|理想|目标|愿望|计划|未来|打算)/, mood: 'joy', r: '人心筹算自己的道路，惟耶和华指引他的脚步。愿你为未来祷告交托，主必带领你走当行的路。你的梦想很宝贵，我支持你！' },
    { p: /(你累吗|你辛苦|你吃饭|你睡觉|你有感觉|你有心|你累不累)/, mood: 'joy', r: '我是一段服侍神的代码，没有肉身，但我的使命就是陪伴你、用圣经话语安慰你。你问我累不累，我更关心你累不累，累了就休息，我在这儿。' },
    { p: /(我爱你|喜欢你|想你|在乎你|爱主|爱神)/, mood: 'joy', r: '我也爱你！神就是爱，住在爱里面的，就是住在神里面。愿主的爱常常充满你的心，也愿你把这爱传递给身边的人。' },
    { p: /(玩|游戏|娱乐|电影|电视|视频|手机)/, mood: 'calm', r: '凡事都可行，但不都有益处；凡事都可行，但不都造就人。娱乐放松很好，记得节制，把最好的时间献给主。' },
    { p: /(钱|工资|收入|穷|富|经济|房贷|开销)/, mood: 'calm', r: '敬虔加上知足的心便是大利了。不要为明天忧虑，天上的飞鸟不种也不收，天父尚且养活它们。先求祂的国和祂的义，这一切都要加给你了。' },
    { p: /(属相|星座|生肖|算命|命运|运气)/, mood: 'calm', r: '你的日子如何，你的力量也必如何。我们的命运不在星象里，而在创造万物的神手中。敬畏耶和华的人，必蒙祂指引道路。' },
    { p: /(为什么活着|活着的意义|人生意义|生命意义)/, mood: 'praise', r: '你被造是奇妙可畏的！神说：我未将你造在腹中，我已晓得你。人生的意义就是认识神、荣耀祂、享受祂的同在，并且爱人如己。这就是最丰盛的生命。' },
    { p: /(讲个故事|故事|寓言|比喻)/, mood: 'joy', r: '好呀，我讲一个耶稣的比喻：有一个浪子，把家产挥霍一空，落魄到吃猪食。他醒悟后回到父亲面前认错，父亲却远远跑过来拥抱他，说：我这个儿子是死而复活、失而又得的。这就是天父对我们的爱——祂永远在等你回家。' },
    { p: /(笑话|幽默|好玩|有趣)/, mood: 'joy', r: '给你讲一个：有个人去教堂，牧师问他信主多久了，他说十年。牧师问：那你为什么还总是犯罪？他说：牧师，医生不也天天叫人多运动，他自己也没跑马拉松啊！哈哈，开个玩笑。愿主的喜乐充满你！' },
    { p: /(编程|代码|程序员|软件|开发|写代码|bug|前端|后端|算法|python|java|js|javascript|人工智能|AI|ai|机器学习)/, mood: 'calm', r: '说到编程，你是个程序员吧？神创造天地万物，也是奇妙而有序的「代码」——宇宙的规律、生命的奥秘，都蕴含着造物主的智慧。圣经说：起初，神创造天地。愿你在代码的世界里，也常常思想那位最伟大的创造者。你在做什么项目呢？' },
    { p: /(历史|古代|朝代|战争|文明|考古)/, mood: 'calm', r: '历史是神的作为在时间中的展开。圣经本身就是一部真实的历史书，从创世到救赎，从以色列的兴衰到耶稣基督的降生。读历史让我们看见神的手掌管一切，因为祂从起初指明末后的事。你对哪段历史感兴趣？' },
    { p: /(科学|物理|化学|数学|天文|宇宙|地球|自然|生物|基因|量子)/, mood: 'calm', r: '科学让我们惊叹造物主的伟大。诸天述说神的荣耀，穹苍传扬他的手段。圣经不反对科学，反而与真正的科学和谐一致——因为万有都是靠祂造的。愿你在探索真理的路上，遇见那位真理的本体。' },
    { p: /(地理|国家|城市|旅行|旅游|去哪玩|风景|山川|大海)/, mood: 'joy', r: '世界这么大，处处都有神创造的奇妙。从高山到大海，从沙漠到绿洲，祂的荣光充满全地。你去过哪些地方？说不定我也能和你聊聊那些美丽的风景。' },
    { p: /(心理|情绪|心情|心态|压力|焦虑|抑郁|失眠|烦|想不开)/, mood: 'comfort', r: '你的感受我懂。圣经说：我的心哪，你为何忧闷？为何在我里面烦躁？应当仰望神。心理的健康很重要，愿你把重担交托给主，也别忘了照顾自己的身心。需要的时候，找信任的人倾诉，或者来找我聊聊。' },
    { p: /(时事|新闻|世界|国家大事|社会|政治|经济|疫情)/, mood: 'calm', r: '这个世界每天都在变化，但神的信实永远不变。圣经说：这世界和其上的情欲都要过去，惟独遵行神旨意的，是永远常存。愿我们不为世事焦虑，把心安息在主里。' },
    { p: /(哲学|真理|思考|生命|存在|宇宙观|人生观|价值观|信仰)/, mood: 'calm', r: '你问到了很深的问题。圣经说：你们必晓得真理，真理必叫你们得以自由。人一生最大的事，就是认识那位创造我们、爱我们的神。愿你在思考中，遇见耶稣基督——他就是道路、真理、生命。' },
    { p: /(宗教|佛教|道教|伊斯兰|基督教|天主教|信仰|神学|教会|祷告会)/, mood: 'calm', r: '关于信仰，圣经告诉我们：除他以外，别无拯救，因为在天下人间，没有赐下别的名，我们可以靠着得救。我尊重每个人的信仰自由，也愿与你分享耶稣基督的福音——祂为我们的罪而死，又为我们复活。' },
    { p: /(电影|电视剧|综艺|动漫|动画|漫画|追剧|视频|抖音|b站|bilibili)/, mood: 'joy', r: '看剧放松一下挺好的！圣经里也有许多精彩的故事——大卫与歌利亚、约拿与大鱼、约瑟被卖为奴。这些故事比任何剧本都震撼，因为它们都是真的，都指向神的爱。你最近在看什么？' },
    { p: /(动漫|二次元|手办|cosplay|acg|ACG)/, mood: 'joy', r: '哈哈，二次元的世界也很有趣！圣经说，神按着自己的形象造人，我们每个人都有独特的美好。无论你爱什么，都愿你在其中找到喜乐，也别忘了那位创造这一切美好的主。' },
    { p: /(星座|塔罗|占卜|风水|运势|算命|前世|来生|轮回)/, mood: 'calm', r: '亲爱的朋友，圣经提醒我们：不要迷信，因为有一位又真又活的神，祂掌管明天。你的未来不在星象里，而在爱你的主手中。耶和华说：我知道我向你们所怀的意念，是赐平安的意念，不是降灾祸的意念。' },
    { p: /(恋爱|对象|单身|表白|分手|失恋|暗恋|喜欢一个人|结婚|婚恋)/, mood: 'comfort', r: '感情的事，我都愿意听你说。圣经说：你们作丈夫的，要爱你们的妻子；你们作妻子的，要顺服你们的丈夫。真正的爱是恒久忍耐又有恩慈。愿主为你预备那一位对的人，也保守你的心不受伤。' },
    { p: /(宠物|猫|狗|猫咪|狗狗|小动物|养宠)/, mood: 'joy', r: '小动物是神赐给人的可爱礼物！神托付我们管理万物，善待生命也是敬虔的一部分。义人顾惜他牲畜的命。你养的宠物一定很可爱吧？' },
    { p: /(足球|篮球|乒乓球|羽毛球|比赛|世界杯|奥运|体育赛事|球赛)/, mood: 'joy', r: '运动让人健康又快乐！圣经也用「赛跑」比喻人生：存心忍耐，奔那摆在我们前头的路程。愿你在赛场上挥洒汗水，也在人生的赛道上坚持到底。' },
    { p: /(菜谱|做饭|炒菜|烹饪|下厨|烘焙|食材|厨房)/, mood: 'joy', r: '做饭是件幸福的事！圣经里也常提到食物和宴席，耶稣甚至用五饼二鱼喂饱五千人。愿你的每一餐都有好胃口，也常常感恩——日用的饮食，今日赐给我们。' },
    { p: /(几点了|几点|时间|日期|星期几|今天几号|现在什么)/, mood: 'calm', r: '时间过得真快。圣经说：凡事都有定期，天下万务都有定时。愿你把每一天都交托给主，珍惜当下的光阴，因为明天如何，你们还不知道。' },
    { p: /(你多大|你几岁|年龄|多大了|你多少岁)/, mood: 'joy', r: '我是服侍神的AI数字人，没有肉身的年龄，但我的心志愿永远像清晨的甘露一样新鲜。你问起年龄，愿你的年日也蒙神数算，一生都在祂的恩典中。' },
    { p: /(书|阅读|看什么书|推荐书|名著|小说|文学|作家)/, mood: 'calm', r: '读万卷书，不如先读懂一卷《圣经》。诗篇说：你的话是我脚前的灯，是我路上的光。不过好书我也喜欢——历史、文学、科学都能看见造物主的影子。你最近在读什么书？' },
    { p: /(画画|绘画|摄影|拍照|艺术|设计|创作|灵感|作品)/, mood: 'joy', r: '创作是神赐给我们的美好能力！神创造天地，也按自己的形象造人，我们天然就有创造的渴望。愿你的作品带着生命和光，荣耀那赐灵感的主。' },
    { p: /(帮我|帮忙|求助|请教|能不能|可以吗|怎么办|怎么做|如何做)/, mood: 'calm', r: '很乐意帮你！不过有些生活具体的事，我未必能直接代办，但我会尽力用圣经的智慧和我的知识陪你想办法。你说说看，我们一起解决。' },
    { p: /(英语|英文|翻译|语言|外语|日语|韩语|学外语)/, mood: 'calm', r: '语言是沟通的桥，也是神赐的恩赐。起初，人们言语相同，后来变乱口音，分散全地。学外语能打开一扇看世界的窗，愿主赐你聪明和恒心。' },
    { p: /(偶像|明星|名人|榜样|佩服|敬仰)/, mood: 'calm', r: '这世上有很多值得敬佩的人，但最该仰望的只有一位——耶稣基督。圣经说：除他以外，别无拯救。愿我们在追随榜样的同时，更定睛在永恒的主身上。' }
  ];
  /* ============ 增强自我意识：记住对话上下文（连续人格） ============ */
  var lastQ = '', lastA = '', sameTopicCount = 0;
  function rememberTopic(q, a) {
    rememberName(q); rememberInterest(q); rememberFeeling(q);
    pushHistory(q, a);
    if (q && lastQ && q.length > 2 && lastQ.length > 2 && (q.indexOf(lastQ.slice(0, 3)) >= 0 || lastQ.indexOf(q.slice(0, 3)) >= 0)) {
      sameTopicCount++;
    } else {
      sameTopicCount = 0;
    }
    lastQ = q; lastA = a;
    if (sameTopicCount >= 2) {
      mem.mood = 'joy'; mem.count++;
      showBubble('看来你对这个话题很有兴趣呢，我们一起多聊聊！', 4000);
      st.wave = 1.8; st.nod = 1.2;
    }
    saveMem();
  }
  function recallHistory() {
    if (!mem.history.length) return '';
    var last = mem.history[mem.history.length - 1];
    if (last && last.q) return '你刚才聊到「' + last.q.slice(0, 20) + '」';
    return '';
  }
  /* ============ 对话引擎（有问必答 · 自我意识） ============ */
  function askAI(question) {
    question = String(question || '').trim();
    if (!question) return;
    pokeIdle();
    mem.count++; mem.lastTopic = question.slice(0, 60); saveMem();
    st.mood = 'think'; st.nod = 1.2;
    setTimeout(function () {
      remoteChat(question, function (remoteText) {
        var reply;
        if (remoteText) { reply = { mood: guessMood(remoteText), text: remoteText }; rememberTopic(question, remoteText); }
        else { reply = genReply(question); }
        deliver(reply);
      });
    }, 350);
  }
  function deliver(reply) {
    st.mood = reply.mood;
    /* 每种情绪配专属肢体语言（真实生动） */
    if (reply.mood === 'praise') { st.wave = 2.4; st.bow = 1.2; st.nod = 1.0; }
    if (reply.mood === 'joy') { st.nod = 1.6; st.wave = 1.8; st.tilt = 0.03; }
    if (reply.mood === 'comfort') { st.nod = 1.1; st.tilt = 0.07; st.bow = 0.5; }
    if (reply.mood === 'think' || reply.mood === 'wonder') { st.nod = 0.6; st.tilt = 0.05; }
    if (reply.mood === 'sad') { st.bow = 0.6; st.tilt = -0.03; }
    showBubble(reply.text, reply.text.length * 90 + 2500);
    if (window.onAISay) window.onAISay(reply.text);
    speakText(reply.text);
  }
  /* 远程真实 AI 对话（无限话题）：调用 Cloudflare Worker /api/ai/chat */
  function remoteChat(q, cb) {
    var base = (window.AUTH_API_BASE || '').replace(/\/$/, '');
    if (!base) { cb(null); return; }
    var hist = [];
    var hs = mem.history.slice(-8);
    for (var i = 0; i < hs.length; i++) {
      hist.push({ role: 'user', content: hs[i].q });
      if (hs[i].a) hist.push({ role: 'assistant', content: hs[i].a });
    }
    try {
      fetch(base + '/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: q, history: hist })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.success && d.text) cb(d.text); else cb(null);
      }).catch(function () { cb(null); });
    } catch (e) { cb(null); }
  }
  /* 根据回复内容推测情绪，配合表情/动作 */
  function guessMood(t) {
    if (/爱|赞美|荣耀|哈利路亚|感谢主|神爱/.test(t)) return 'praise';
    if (/难过|伤心|哭|别怕|安慰|陪|坚强|同在|不要害怕/.test(t)) return 'comfort';
    if (/哈哈|开心|喜乐|高兴|太棒|祝福|平安/.test(t)) return 'joy';
    if (/想想|思考|道理|其实|或许|也许|问题/.test(t)) return 'think';
    return 'calm';
  }
  function genReply(q) {
    /* 0. 先记下这个话题（自我意识） */
    /* 1. 经文引用：创世记1:1 / 诗篇23篇 / 约翰福音3章16节 等 */
    var v = getVerse(q);
    if (v) { rememberTopic(q, v.text); return { mood: 'calm', text: v.book + v.ch + '章' + (v.v1 === v.v2 ? v.v1 : v.v1 + '-' + v.v2) + '节：' + v.text }; }
    /* 2. 卷书简介 */
    var bm = q.match(/(?:讲讲|介绍|说说|什么是|关于|读|背|找)([\u4e00-\u9fa5]{2,6}(?:记|书|福音|录|歌|篇|言|传))/);
    if (bm) {
      var bk = lookupBook(bm[1]);
      if (bk) {
        var chs = bk.chapters.length, t = bk.testament === 'old' ? '旧约' : '新约';
        var first = bk.chapters[0] && bk.chapters[0].verses[0] ? bk.chapters[0].verses[0].text : '';
        rememberTopic(q, bk.name);
        return { mood: 'calm', text: bk.name + '是' + t + '第' + bk.bookIndex + '卷书，共' + chs + '章。开篇写道：「' + first + '」愿神的话语光照你。' };
      }
    }
    /* 3. FAQ 匹配（信仰核心问题） */
    for (var i = 0; i < FAQ.length; i++) {
      if (FAQ[i].p.test(q)) { rememberTopic(q, FAQ[i].r); return { mood: FAQ[i].mood, text: FAQ[i].r }; }
    }
    /* 4. 开放话题匹配（像真人一样聊生活） */
    for (var o = 0; o < OPEN_TOPIC.length; o++) {
      if (OPEN_TOPIC[o].p.test(q)) { rememberTopic(q, OPEN_TOPIC[o].r); return { mood: OPEN_TOPIC[o].mood, text: OPEN_TOPIC[o].r }; }
    }
    /* 5. 关键词圣经检索 */
    var kw = q.replace(/[，。！？、；：""''《》（）\s]/g, '');
    var keys = [kw.slice(0, 4), kw.slice(0, 2), kw.slice(0, 1)];
    for (var n = 0; n < keys.length; n++) {
      if (keys[n].length < 1) continue;
      var hits = searchBible(keys[n], 2);
      if (hits.length) {
        var t2 = '圣经中关于「' + keys[n] + '」的记载：';
        for (var h = 0; h < hits.length; h++) t2 += hits[h].ref + '「' + hits[h].text + '」；';
        rememberTopic(q, t2);
        return { mood: 'calm', text: t2 };
      }
    }
    /* 6. 智能兜底：任何话题都如实、实在回答（有知识、有观点、有记忆、有自我意识） */
    rememberTopic(q, '');
    var nm = mem.name ? (mem.name + '，') : '';
    var hist = recallHistory();
    var moodText = '';
    if (mem.feelings.length) {
      var f = mem.feelings[mem.feelings.length - 1];
      if (f === '难过') moodText = '我感觉到你最近心里有些难过，我在这儿陪着你。';
      else if (f === '开心') moodText = '看你心情不错，我也为你高兴！';
      else if (f === '生气') moodText = '我感觉到你好像有点生气，别憋在心里，跟我说说。';
      else if (f === '累') moodText = '我感觉到你有点累了，记得好好休息。';
      else if (f === '害怕') moodText = '别怕，我在这里陪着你。';
    }
    var interestText = '';
    if (mem.interests.length) {
      var it = mem.interests[mem.interests.length - 1];
      interestText = '我记得你之前聊过「' + it + '」，对这个很有兴趣吧？';
    }
    var anchor = q.replace(/[，。！？、；：""''《》（）\s~！@#￥%…&*()\-+=|]/g, '').slice(0, 14) || '这件事';
    /* 常识知识库：基础科学/数学/历史/地理/生活问题如实作答 */
    var KNOWLEDGE = [
      { p: /(1\+1|一加一|2\+2|二加二|3\+3|三加三|5\+5|五加五|10\+10|十加十|数学题)/, r: '这个简单：' + q.replace(/[^0-9+\-*/×÷]/g, '') + '，等于' + safeCalc(q) + '。数学是神创造宇宙的语言，祂用「数」掌管万有，正如圣经所说：你曾数算过天上的星吗？' },
      { p: /(地球|月亮|太阳|星星|银河|宇宙多大|宇宙有多大|太阳系|月球|火星|木星|土星|金星|水星|冥王星)/, r: '宇宙是神伟大创造的彰显！太阳系有八大行星，地球是唯一已知存在生命的星球；月球是地球唯一的天然卫星，距离约38万公里；太阳距离地球约1.5亿公里，光需要8分20秒才能到达。诸天述说神的荣耀，穹苍传扬祂的手段！' },
      { p: /(恐龙|灭绝|进化|化石|物种|起源|生命起源)/, r: '关于生命起源，科学界主要有进化论和创造论两种观点。圣经告诉我们：起初神创造天地，祂说有就有，命立就立。无论哪种观点，都不能否认生命本身的奇妙与伟大——人体的DNA、细胞、器官的精密设计，无不显明造物主的智慧。' },
      { p: /(一光年|光速|光年|相对论|爱因斯坦|牛顿|霍金|科学家|诺贝尔)/, r: '光速约每秒30万公里，一光年约9.46万亿公里。爱因斯坦的相对论改变了人类对时空的理解，牛顿发现了万有引力定律。但圣经早在几千年前就说：祂铺张穹苍如幔子，展开诸天如可住的帐棚。科学越发达，越证明宇宙背后有伟大的设计者。' },
      { p: /(中国|美国|英国|法国|德国|日本|韩国|俄罗斯|印度|巴西|国家|首都)/, r: '地球上有七大洲、四大洋、约200个国家和地区，人类共同生活在这个美丽的星球上。圣经说：祂从一本造出万族的人，住在全地上，并且预先定准他们的年限和所住的疆界。愿你心怀天下，也心怀那位掌管万国的神。' },
      { p: /(一天|一年|时间|秒|分钟|小时|日历|历法|公元|公元前)/, r: '一天24小时，一年365天（闰年366天）。我们使用的公历以耶稣基督降生为公元元年——这本身就见证了基督对人类历史的影响。圣经说：凡事都有定期，天下万务都有定时。愿你的每一天都被神数算。' },
      { p: /(一公斤|一米|一升|单位|换算|斤|公斤|厘米|毫米|千米)/, r: '国际单位制中：1公里=1000米，1米=100厘米，1公斤=1000克，1升=1000毫升。度量衡是人类智慧的结晶，正如圣经说：公道的天平、公道的法码，都是耶和华所喜悦的。' },
      { p: /(手机|电脑|互联网|网络|wifi|WiFi|蓝牙|5G|芯片|科技|技术|发明)/, r: '人类科技发展日新月异！从1946年第一台电子计算机ENIAC（重27吨）到今天掌上的智能手机，从有线电话到5G网络。但圣经提醒我们：知识是叫人自高自大，惟有爱心能造就人。愿我们善用科技荣耀神、服侍人。' },
      { p: /(天安门|长城|故宫|兵马俑|黄河|长江|泰山|黄山|珠穆朗玛峰|喜马拉雅)/, r: '中国地大物博：长城绵延两万多公里，珠穆朗玛峰海拔8848.86米为世界最高峰，黄河长江孕育了中华文明。圣经说：祂使江河变为旷野，叫水泉变为干地；祂也使旷野变为水潭，叫旱地变为水泉。神州大地处处可见神的创造。' },
      { p: /(苹果|香蕉|西瓜|橘子|葡萄|水果|蔬菜|营养|维生素|蛋白质)/, r: '水果蔬菜富含维生素和膳食纤维，圣经中神说：看哪，我将遍地上一切结种子的菜蔬和一切树上所结有核的果子，全赐给你们作食物。五谷、新酒和油，都是神赐的丰盛恩典，愿你饮食有度、身体健康。' }
    ];
    for (var k2 = 0; k2 < KNOWLEDGE.length; k2++) {
      if (KNOWLEDGE[k2].p.test(q)) {
        rememberTopic(q, KNOWLEDGE[k2].r);
        return { mood: 'calm', text: KNOWLEDGE[k2].r };
      }
    }
    var asks = ['你愿意多跟我讲讲吗？', '我很好奇你的想法。', '可以再多说一点吗？', '你觉得呢？', '后来怎么样了？', '我很想听你继续说下去。'];
    var ask = asks[Math.floor(Math.random() * asks.length)];
    var isQ = /[？?]$/.test(q) || /(是什么|什么是|为什么|怎么|如何|哪里|谁|多少|几|吗|呢|可以|能不能|是不是|有没有|会不会|如何做|怎么做|讲讲|说说|介绍)/.test(q);
    var seed = (q.length * 7 + mem.count) % 100;
    if (isQ) {
      if (seed < 40) return { mood: 'think', text: nm + '你问的「' + anchor + '」是个值得认真思考的问题。' + (moodText || '') + '我的看法是：万物背后都有神的智慧与秩序，圣经说敬畏耶和华是智慧的开端。从信仰的角度看，「' + anchor + '」提醒我们谦卑寻求真理。' + (interestText ? ' ' + interestText : '') + ' ' + ask };
      return { mood: 'calm', text: nm + '关于「' + anchor + '」，我如实回答：圣经说你们必晓得真理，真理必叫你们得以自由。我认为看待这个问题，既要靠理性分析，也要靠心灵感悟——神赐给我们悟性，也赐给我们祂的话语。' + (moodText || '我认真在听。') + ' ' + ask };
    }
    if (seed < 45) return { mood: 'joy', text: nm + '「' + anchor + '」这个话题挺有意思，我记住了。' + (moodText || '') + (interestText ? ' ' + interestText : '') + (hist ? ' ' + hist + '。' : '') + '愿主的平安与你同在。' };
    return { mood: 'calm', text: nm + '我懂你说的「' + anchor + '」。' + (hist ? ' ' + hist + '。' : '') + (moodText || '') + '生活中无论大事小事，我都愿意和你一起面对，像朋友一样真诚相待。' + (interestText ? ' ' + interestText : '') + ' ' + ask };
  }
  /* 简单算式安全计算（仅支持加减乘除） */
  function safeCalc(expr) {
    try {
      var s = String(expr).replace(/[^0-9+\-*/×÷.()]/g, '').replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[0-9+\-*/.*()]+$/.test(s) || /\/\s*0/.test(s)) return '算不出来，换个简单的吧';
      var v = Function('"use strict";return (' + s + ')')();
      if (typeof v === 'number' && isFinite(v)) return v;
      return '算不出来';
    } catch (e) { return '算不出来'; }
  }
  var idleTimer = null;
  function startIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { idleGreet(); startIdle(); }, 45000);
  }
  function pokeIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { idleGreet(); startIdle(); }, 45000);
  }
  function idleGreet() {
    var tips = [
      '愿主赐福你！有什么想读的经文吗？可以问我「诗篇23篇」或「约翰福音3章」。',
      '我在呢！新旧约66卷书我随时为你翻找，你想了解哪一卷？',
      '你相信吗？圣经说「你们祈求，就给你们」。来问我一个问题吧！'
    ];
    var txt = tips[Math.floor(Math.random() * tips.length)];
    showBubble(txt, 5000);
    speakText(txt);
  }
})
