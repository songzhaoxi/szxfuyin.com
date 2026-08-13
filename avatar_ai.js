/* avatar_ai.js — 会说话的圣经AI数字人 v206 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var CFG_KEY = 'avatar_ai_cfg_v206';
  var CFG = {
    img: 'avatar_3d.png',
    mouthX: 0.50, mouthY: 0.56, mouthW: 0.13, mouthH: 0.07,
    eyeY: 0.47, eyeGap: 0.10, eyeW: 0.055, eyeH: 0.028,
    voiceRate: 0.98, voicePitch: 0.82
  };
  try { var _c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); for (var k in _c) CFG[k] = _c[k]; } catch (e) {}
  var canvas, ctx, img = null, imgW = 0, imgH = 0;
  var st = { talking: false, mouth: 0, blink: 0, mood: 'joy', tilt: 0, bob: 0, nod: 0, wave: 0, t: 0 };
  var audioCtx = null, analyser = null, audioEl = null, audioSrc = null, bubbleTimer = null;
  var BIBLE = null, bibleReady = false;

  window.AvatarAI = { init: init, speak: speakText, stop: stopTalk, ask: askAI, setMood: setMood, showBubble: showBubble, ready: function(){ return bibleReady; } };

  function init() {
    canvas = $('avatarCanvas'); if (!canvas) return;
    ctx = canvas.getContext('2d');
    img = new Image();
    img.onload = function () { imgW = img.width; imgH = img.height; fit(); };
    img.onerror = function () {};
    img.src = CFG.img;
    fit(); window.addEventListener('resize', fit);
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); analyser = audioCtx.createAnalyser(); analyser.fftSize = 256; } catch (e) {}
    loadBible();
    requestAnimationFrame(loop);
    setTimeout(function(){ greeting(); }, 1500);
  }
  function fit() {
    if (!canvas) return; var w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
    canvas.width = Math.max(10, w * (window.devicePixelRatio || 1));
    canvas.height = Math.max(10, h * (window.devicePixelRatio || 1));
  }
  function loop() {
    requestAnimationFrame(loop);
    var t = Date.now() / 1000; if (!img) return;
    st.bob = Math.sin(t * 1.4) * 6 * (st.talking ? 1.6 : 1);
    if (st.blink <= 0 && Math.random() < 0.004) st.blink = 1;
    if (st.blink > 0) st.blink -= 0.06;
    if (st.talking) {
      st.t += 0.08;
      var vol = 0;
      if (analyser) { var a = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(a); var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; vol = s / a.length / 255; }
      var tg = vol > 0.05 ? Math.min(1, vol * 3.2) : (Math.sin(st.t * 9) * 0.5 + 0.5) * 0.35;
      st.mouth += (tg - st.mouth) * 0.5;
      st.tilt += (Math.sin(st.t * 2.3) * 0.03 - st.tilt) * 0.1;
    } else {
      st.mouth += (0 - st.mouth) * 0.12;
      st.tilt += (Math.sin(t * 0.8) * 0.012 - st.tilt) * 0.05;
    }
    if (st.nod > 0) st.nod -= 0.05;
    if (st.wave > 0) st.wave -= 0.03;
    draw();
  }
  function draw() {
    var cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch); if (!img) return;
    var scale = Math.min(cw / imgW, ch / imgH) * 0.92;
    var dw = imgW * scale, dh = imgH * scale;
    var dx = (cw - dw) / 2, dy = (ch - dh) / 2 + st.bob;
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(st.wave > 0 ? Math.sin(st.wave * 8) * 0.06 : st.tilt);
    if (st.nod > 0) ctx.rotate(Math.sin(st.nod * 10) * 0.03 * st.nod * 3);
    ctx.translate(-cw / 2, -ch / 2);
    ctx.shadowColor = 'rgba(212,175,55,0.35)'; ctx.shadowBlur = 40;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.shadowBlur = 0;
    if (st.talking || st.mouth > 0.04) drawMouth(dx, dy, dw, dh);
    if (st.blink > 0.02) drawEyes(dx, dy, dw, dh);
    ctx.restore();
  }
  function drawMouth(dx, dy, dw, dh) {
    var mx = dx + CFG.mouthX * dw, my = dy + CFG.mouthY * dh;
    var mw = CFG.mouthW * dw * (0.8 + st.mouth * 0.5), mh = CFG.mouthH * dh * (0.25 + st.mouth * 1.5);
    ctx.save();
    if (st.mood === 'think') {
      ctx.fillStyle = 'rgba(60,30,20,0.92)';
      ctx.beginPath(); ctx.ellipse(mx, my, mw * 0.45, mh * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    } else if (st.mood === 'joy' || st.mood === 'smile') {
      ctx.strokeStyle = 'rgba(60,30,20,0.95)'; ctx.lineWidth = Math.max(2, mw * 0.1);
      ctx.beginPath(); ctx.quadraticCurveTo(mx, my + mh * 0.4, mx + mw * 0.5, my); ctx.stroke();
      if (st.mouth > 0.15) { ctx.fillStyle = 'rgba(90,45,30,0.9)'; ctx.beginPath(); ctx.ellipse(mx, my + mh * 0.25, mw * 0.3, mh * 0.35 * st.mouth, 0, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.fillStyle = 'rgba(60,30,20,0.92)';
      ctx.beginPath(); ctx.ellipse(mx, my, mw * 0.5, mh, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(150,80,50,0.7)';
      ctx.beginPath(); ctx.ellipse(mx, my + mh * 0.15, mw * 0.3, mh * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function drawEyes(dx, dy, dw, dh) {
    var ey = dy + CFG.eyeY * dh, gap = CFG.eyeGap * dw, ew = CFG.eyeW * dw, eh = CFG.eyeH * dh;
    var cx = dx + dw * 0.5, bh = Math.max(0.5, eh * (1 - st.blink));
    ctx.fillStyle = 'rgba(180,140,110,0.95)';
    ctx.fillRect(cx - gap / 2 - ew / 2, ey - bh / 2, ew, bh);
    ctx.fillRect(cx + gap / 2 - ew / 2, ey - bh / 2, ew, bh);
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
      audioEl.src = url;
      if (audioSrc) { try { audioSrc.disconnect(); } catch (e) {} }
      audioSrc = audioCtx.createMediaElementSource(audioEl);
      audioSrc.connect(analyser); analyser.connect(audioCtx.destination);
      st.talking = true;
      audioEl.onended = function () { st.talking = false; if (onEnd) onEnd(); };
      audioEl.onerror = function () { st.talking = false; if (onEnd) onEnd(); };
      audioEl.play().catch(function () { st.talking = false; });
    } catch (e) { st.talking = false; }
  }
  function speakText(text, opts) {
    opts = opts || {}; if (!text) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'zh-CN'; u.rate = CFG.voiceRate; u.pitch = CFG.voicePitch;
    var vs = speechSynthesis.getVoices();
    var zh = vs.filter(function (v) { return /zh|Chinese/i.test(v.lang + v.name); });
    var male = zh.filter(function (v) { return /male|男|Yunyang|Yunjian|Daniel/i.test(v.name); });
    var pick = male[0] || zh[0];
    if (pick) u.voice = pick;
    u.onstart = function () { st.talking = true; };
    u.onend = function () { st.talking = false; if (opts.onEnd) opts.onEnd(); };
    u.onerror = function () { st.talking = false; if (opts.onEnd) opts.onEnd(); };
    speechSynthesis.speak(u);
  }
  function greeting() {
    showBubble('欢迎来到兆西福音传递爱，我是你的圣经AI伙伴，新旧约66卷书我都熟读，有问必答 🙏');
    speakText('欢迎来到兆西福音传递爱，我是你的圣经AI伙伴，新旧约六十六卷书我都熟读，有问必答。愿你平安。');
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
    /* 支持：创世记1:1 / 创1:1 / 诗篇23:1-3 / 约翰福音3章16节 */
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
/* ============ 人格与记忆（自我意识） ============ */
  var MEM_KEY = 'avatar_ai_mem_v206';
  var mem = { name: '', last: '', mood: 'joy', count: 0 };
  try { var _m = JSON.parse(localStorage.getItem(MEM_KEY) || '{}'); for (var k2 in _m) mem[k2] = _m[k2]; } catch (e) {}
  function saveMem() { try { localStorage.setItem(MEM_KEY, JSON.stringify(mem)); } catch (e) {} }
  var FAQ = [
    { p: /(你是谁|你叫什么|介绍你|自我介绍)/, mood: 'joy', r: '我是这位服侍神的圣经AI仆人，新旧约66卷书都刻在我心里。你可以问我任何经文、任何信仰问题，我必尽力为你解答。' },
    { p: /(你好|您好|嗨|哈喽|hello|hi|在吗)/, mood: 'joy', r: '亲爱的弟兄姐妹，愿你平安！我是你的圣经AI伙伴，有什么经文或信仰的问题，都可以问我。' },
    { p: /(耶稣|上帝|神是|主是|基督教|信仰|信主|救恩|得救|重生|罪|悔改)/, mood: 'praise', r: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不致灭亡，反得永生。（约翰福音3:16）这是整本圣经最核心的应许，你愿意更多明白救恩的道理吗？' },
    { p: /(爱是什么|什么是爱|爱的真谛|如何爱|爱人)/, mood: 'joy', r: '爱是恒久忍耐，又有恩慈；爱是不嫉妒，不自夸，不张狂，不求自己的益处，不轻易发怒，不计算人的恶。（哥林多前书13:4-5）' },
    { p: /(祷告|怎么祷告|祈祷|如何祷告)/, mood: 'calm', r: '祷告就是与神说话。圣经说：应当一无挂虑，只要凡事借着祷告、祈求和感谢，将你们所要的告诉神。（腓立比书4:6）' },
    { p: /(平安|祝福|保佑|赐福)/, mood: 'joy', r: '愿耶和华赐福给你，保护你；愿耶和华使他的脸光照你，赐恩给你；愿耶和华向你仰脸，赐你平安。（民数记6:24-26）' },
    { p: /(圣经有多少卷|66|六十六|新旧约|旧约多少|新约多少)/, mood: 'calm', r: '整本圣经共66卷：旧约39卷、新约27卷，共1189章、31031节。旧约讲神的律法与应许，新约讲耶稣基督的救恩成全。' },
    { p: /(谢谢|感谢|感恩)/, mood: 'joy', r: '不用谢，愿神的话语成为你脚前的灯、路上的光。凡劳苦担重担的人，可以到我这里来，我就使你们得安息。' },
    { p: /(再见|拜拜|bye|晚安)/, mood: 'calm', r: '愿你平安！愿主耶稣基督的恩惠常与你同在，我们下次再聊。' },
    { p: /(人生|意义|活着|为什么|迷茫|困惑|痛苦|难过|伤心|害怕|恐惧|忧虑|焦虑)/, mood: 'comfort', r: '不要害怕，因为我与你同在；不要惊惶，因为我是你的神。我必坚固你，我必帮助你，我必用我公义的右手扶持你。（以赛亚书41:10）' }
  ];
  /* ============ 对话引擎（有问必答） ============ */
  function askAI(question) {
    question = String(question || '').trim();
    if (!question) return;
    if (mem.count < 200) mem.count++;
    saveMem();
    st.mood = 'think';
    st.nod = 1.2;
    setTimeout(function () {
      var reply = genReply(question);
      st.mood = reply.mood;
      showBubble(reply.text, reply.text.length * 90 + 2500);
      st.nod = 0.8;
      if (window.onAISay) window.onAISay(reply.text);
      speakText(reply.text);
    }, 450);
  }
  function genReply(q) {
    /* 1. 经文引用：创世记1:1 等 */
    var v = getVerse(q);
    if (v) return { mood: 'calm', text: v.book + v.ch + '章' + (v.v1 === v.v2 ? v.v1 : v.v1 + '-' + v.v2) + '节：' + v.text };
    /* 2. 关于某卷书的简介 */
    var bm = q.match(/(?:讲讲|介绍|说说|什么是|关于)([\u4e00-\u9fa5]{2,6}(?:记|书|福音|录|歌|篇|言))/);
    if (bm) {
      var bk = lookupBook(bm[1]);
      if (bk) {
        var chs = bk.chapters.length, t = bk.testament === 'old' ? '旧约' : '新约';
        var first = bk.chapters[0] && bk.chapters[0].verses[0] ? bk.chapters[0].verses[0].text : '';
        return { mood: 'calm', text: bk.name + '是' + t + '第' + bk.bookIndex + '卷书，共' + chs + '章。开篇写道：「' + first + '」愿神的话语光照你。' };
      }
    }
    /* 3. FAQ 匹配 */
    for (var i = 0; i < FAQ.length; i++) {
      if (FAQ[i].p.test(q)) return { mood: FAQ[i].mood, text: FAQ[i].r };
    }
    /* 4. 关键词圣经检索 */
    var kw = q.replace(/[，。！？、；：""''《》（）\s]/g, '');
    var keys = [kw.slice(0, 4), kw.slice(0, 2), kw.slice(0, 1)];
    for (var n = 0; n < keys.length; n++) {
      if (keys[n].length < 1) continue;
      var hits = searchBible(keys[n], 2);
      if (hits.length) {
        var t2 = '圣经中关于「' + keys[n] + '」的记载：';
        for (var h = 0; h < hits.length; h++) t2 += hits[h].ref + '「' + hits[h].text + '」；';
        return { mood: 'calm', text: t2 };
      }
    }
    /* 5. 兜底 */
    return { mood: 'calm', text: '弟兄姐妹，这个问题让我想起一节经文：「你们祈求，就给你们；寻找，就寻见；叩门，就给你们开门。」（马太福音7:7）愿你在寻求中得着从神而来的智慧。' };
  }
  /*__MORE__*/
})();
