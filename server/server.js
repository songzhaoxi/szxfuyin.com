// ===== 福音传播爱 - 完整后端服务器 =====
// 运行: node server/server.js
// 访问: http://localhost:3000

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(cors());
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true, limit:'50mb'}));

// 静态文件 - 主站前端
app.use(express.static(path.join(__dirname, '..')));

// 管理后台静态文件
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// ===== 数据文件路径 =====
const DATA_PATH = path.join(__dirname, '..', 'data', 'videos.json');

// ===== 工具：读取数据 =====
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch(e) {
    console.error('读取数据失败:', e.message);
    return { categories:[], banners:[], videos:[], speakers:[] };
  }
}

// ===== 工具：保存数据 =====
function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch(e) {
    console.error('保存数据失败:', e.message);
    return false;
  }
}

// ===== API: 获取全部数据 =====
app.get('/api/data', (req, res) => {
  const data = loadData();
  res.json({ success: true, data });
});

// ===== API: 获取视频列表（支持翻页、分类、搜索） =====
app.get('/api/videos', (req, res) => {
  const data = loadData();
  let videos = data.videos || [];
  const { category, search, page, limit, sort } = req.query;
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 20;

  // 按分类筛选
  if (category && category !== 'all') {
    videos = videos.filter(v => v.c === category);
  }

  // 搜索
  if (search) {
    const kw = search.toLowerCase();
    videos = videos.filter(v =>
      v.t.toLowerCase().includes(kw) ||
      (v.desc && v.desc.toLowerCase().includes(kw)) ||
      (v.tags && v.tags.some(t => t.toLowerCase().includes(kw)))
    );
  }

  // 排序
  if (sort === 'hot') {
    videos.sort((a, b) => parseInt((b.v||'0').replace(/[万w]/g,'000')) - parseInt((a.v||'0').replace(/[万w]/g,'000')));
  } else if (sort === 'new') {
    videos.sort((a, b) => b.id - a.id);
  }

  // 总条数
  const total = videos.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (pageNum - 1) * pageSize;
  const paged = videos.slice(start, start + pageSize);

  res.json({
    success: true,
    data: paged,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages,
      hasMore: pageNum < totalPages
    }
  });
});

// ===== API: 获取单个视频详情 =====
app.get('/api/videos/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const video = (data.videos || []).find(v => v.id === id);
  if (!video) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  // 相关推荐（同分类）
  const related = (data.videos || [])
    .filter(v => v.c === video.c && v.id !== video.id)
    .slice(0, 8);

  res.json({ success: true, data: video, related });
});

// ===== API: 获取分类列表 =====
app.get('/api/categories', (req, res) => {
  const data = loadData();
  res.json({ success: true, data: data.categories || [] });
});

// ===== API: 获取Banner =====
app.get('/api/banners', (req, res) => {
  const data = loadData();
  res.json({ success: true, data: data.banners || [] });
});

// ===== API: 获取讲员列表 =====
app.get('/api/speakers', (req, res) => {
  const data = loadData();
  res.json({ success: true, data: data.speakers || [] });
});

// ===== API: 获取推荐视频（热门/最新） =====
app.get('/api/recommend', (req, res) => {
  const data = loadData();
  const { type } = req.query;
  let videos = [...(data.videos || [])];

  if (type === 'hot') {
    videos.sort((a, b) => parseInt((b.v||'0').replace(/[万w]/g,'000')) - parseInt((a.v||'0').replace(/[万w]/g,'000')));
  } else {
    videos.sort((a, b) => b.id - a.id);
  }

  res.json({ success: true, data: videos.slice(0, 12) });
});

// ===== API: 搜索（合并视频+分类） =====
app.get('/api/search', (req, res) => {
  const data = loadData();
  const { q } = req.query;
  if (!q) {
    return res.json({ success: true, data: [], categories: [] });
  }

  const kw = q.toLowerCase();
  const videos = (data.videos || []).filter(v =>
    v.t.toLowerCase().includes(kw) ||
    (v.desc && v.desc.toLowerCase().includes(kw)) ||
    (v.tags && v.tags.some(t => t.toLowerCase().includes(kw)))
  );

  res.json({ success: true, data: videos.slice(0, 30) });
});

// ===== API: 添加视频（管理员） =====
app.post('/api/videos', (req, res) => {
  const data = loadData();
  const video = req.body;

  if (!video.t || !video.c) {
    return res.status(400).json({ success: false, message: '标题和分类不能为空' });
  }

  // 自动生成ID
  const maxId = (data.videos || []).reduce((max, v) => Math.max(max, v.id || 0), 0);
  video.id = maxId + 1;

  data.videos.push(video);
  saveData(data);

  res.json({ success: true, message: '添加成功', data: video });
});

// ===== API: 更新视频（管理员） =====
app.put('/api/videos/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const idx = (data.videos || []).findIndex(v => v.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  data.videos[idx] = { ...data.videos[idx], ...req.body, id };
  saveData(data);

  res.json({ success: true, message: '更新成功', data: data.videos[idx] });
});

// ===== API: 删除视频（管理员） =====
app.delete('/api/videos/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const idx = (data.videos || []).findIndex(v => v.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  data.videos.splice(idx, 1);
  saveData(data);

  res.json({ success: true, message: '删除成功' });
});

// ===== API: 批量导入视频（管理员） =====
app.post('/api/videos/batch', (req, res) => {
  const data = loadData();
  const { videos } = req.body;

  if (!videos || !Array.isArray(videos) || videos.length === 0) {
    return res.status(400).json({ success: false, message: '请提供视频数组' });
  }

  let maxId = (data.videos || []).reduce((max, v) => Math.max(max, v.id || 0), 0);
  const added = [];

  videos.forEach(v => {
    if (v.t && v.c) {
      maxId++;
      data.videos.push({ ...v, id: maxId });
      added.push(maxId);
    }
  });

  saveData(data);
  res.json({ success: true, message: `成功导入 ${added.length} 个视频`, count: added.length });
});

// ===== API: 统计数据 =====
app.get('/api/stats', (req, res) => {
  const data = loadData();
  const videos = data.videos || [];
  const categories = data.categories || [];
  
  const catStats = {};
  categories.forEach(c => { catStats[c.id] = 0; });
  videos.forEach(v => {
    if (catStats[v.c] !== undefined) catStats[v.c]++;
  });

  res.json({
    success: true,
    data: {
      totalVideos: videos.length,
      totalCategories: categories.length,
      totalSpeakers: (data.speakers || []).length,
      categoryStats: catStats
    }
  });
});

// ===== 管理员登录验证（简单） =====
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'szxfuyin888';

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, message: '登录成功', token: 'gospel-admin-token' });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// ===== API: 保存全部数据（管理员） =====
app.put('/api/data', (req, res) => {
  const newData = req.body;
  if (!newData || !newData.videos) {
    return res.status(400).json({ success: false, message: '数据格式不正确' });
  }
  if (saveData(newData)) {
    res.json({ success: true, message: '数据保存成功' });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// ============================================================
// ===== 🚀 B站(Bilibili)黑客破解代理 - 绕过防盗链 =====
// ============================================================
// 原理：服务器端代发请求，伪造Referer来源为bilibili.com，
// 从而绕过B站CDN的防盗链验证，让视频在szxfuyin.com正常播放
// ============================================================

// B站API请求通用函数 - 带Referer伪装
function biliFetch(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
        'Origin': 'https://www.bilibili.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 15000
    };
    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ===== API: 获取B站视频信息（cid等） =====
// 请求示例: /api/bili/view?bvid=BV1YJ411B7Nq
app.get('/api/bili/view', async (req, res) => {
  const { bvid } = req.query;
  if (!bvid) return res.status(400).json({ success: false, error: '缺少bvid参数' });
  try {
    const data = await biliFetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid);
    res.json(JSON.parse(data));
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===== API: 获取B站视频播放URL（破解防盗链核心！） =====
// 请求示例: /api/bili/playurl?bvid=BV1YJ411B7Nq&cid=123456
app.get('/api/bili/playurl', async (req, res) => {
  const { bvid, cid } = req.query;
  if (!bvid || !cid) return res.status(400).json({ success: false, error: '缺少参数' });
  try {
    // qn=80: 1080P, qn=64: 720P, qn=32: 480P, qn=16: 360P
    const data = await biliFetch('https://api.bilibili.com/x/player/playurl?bvid=' + bvid + '&cid=' + cid + '&qn=80&platform=html5&high_quality=1&type=mp4');
    res.json(JSON.parse(data));
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===== API: B站视频流代理 - 终极破解！ =====
// 直接在服务器端代理视频流，彻底绕过防盗链
// 请求示例: /api/bili/stream?url=https://upos-sz-mirrorcos.bilivideo.com/...
app.get('/api/bili/stream', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('缺少url参数');
  
  try {
    const decodedUrl = decodeURIComponent(url);
    const u = new URL(decodedUrl);
    const mod = u.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
        'Origin': 'https://www.bilibili.com',
        'Range': req.headers.range || '',
        'Accept': '*/*'
      }
    };
    
    const proxyReq = mod.request(options, (proxyRes) => {
      // 透传所有响应头（包括Content-Type, Content-Range等）
      const headers = { ...proxyRes.headers };
      // 移除会导致问题的头
      delete headers['content-encoding'];
      delete headers['transfer-encoding'];
      delete headers['connection'];
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (e) => {
      res.status(500).send('代理错误: ' + e.message);
    });
    proxyReq.end();
  } catch(e) {
    res.status(500).send('代理错误: ' + e.message);
  }
});

// ===== API: B站搜索 - 自动找福音视频 =====
app.get('/api/bili/search', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ success: false, error: '缺少keyword参数' });
  try {
    const data = await biliFetch('https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=' + encodeURIComponent(keyword + ' 福音'));
    res.json(JSON.parse(data));
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===== API: 智能一键获取B站视频流（组合接口） =====
// 一次调用自动获取cid和播放URL，前端无需分步请求
app.get('/api/bili/auto', async (req, res) => {
  const { bvid } = req.query;
  if (!bvid) return res.status(400).json({ success: false, error: '缺少bvid参数' });
  try {
    // Step1: 获取视频信息 => 得到cid
    const viewData = await biliFetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid);
    const view = JSON.parse(viewData);
    if (!view.data || !view.data.cid) {
      return res.json({ success: false, error: '无法获取视频信息', raw: view });
    }
    const cid = view.data.cid;
    const title = view.data.title || '';
    const pic = view.data.pic || '';
    const author = view.data.owner ? view.data.owner.name : '';
    
    // Step2: 获取播放URL
    const playData = await biliFetch('https://api.bilibili.com/x/player/playurl?bvid=' + bvid + '&cid=' + cid + '&qn=80&platform=html5&high_quality=1&type=mp4');
    const play = JSON.parse(playData);
    
    // Step3: 提取可用视频流URL
    let videoUrl = '';
    if (play.data && play.data.durl && play.data.durl.length > 0) {
      // 取最高画质的URL
      videoUrl = play.data.durl[0].url || play.data.durl[0].backup_url || '';
    }
    
    res.json({
      success: !!videoUrl,
      data: {
        bvid, cid, title, pic, author,
        videoUrl: videoUrl,
        // 构造代理URL - 通过我们的服务器播放
        proxyUrl: videoUrl ? ('/api/bili/stream?url=' + encodeURIComponent(videoUrl)) : ''
      }
    });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// ===== 🚀 福音TV(Fuyin.tv)视频代理 - 绕过GFW+防盗链 =====
// ============================================================
// 原理：服务器端代发请求到www.fuyin.tv获取视频地址，
// 让国内用户无需VPN即可观看福音TV视频
// ============================================================

// 福音TV API通用请求函数 - 带Referer伪装
function fuyinFetch(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.fuyin.tv/',
        'Origin': 'https://www.fuyin.tv',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 15000
    };
    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ===== API: 获取福音TV视频播放地址 =====
// 请求示例: /api/fuyin/url?movid=3932&urlid=66795
app.get('/api/fuyin/url', async (req, res) => {
  const { movid, urlid } = req.query;
  if (!movid || !urlid) return res.status(400).json({ success: false, error: '缺少movid或urlid参数' });
  try {
    const apiUrl = `https://www.fuyin.tv/api/api/tv.movie/url?movid=${movid}&urlid=${urlid}&type=1&lang=zh`;
    const data = await fuyinFetch(apiUrl);
    const parsed = JSON.parse(data);
    if (parsed.code === 1 && parsed.data && parsed.data.url) {
      res.json({ success: true, data: { url: parsed.data.url, title: parsed.data.movie_title } });
    } else {
      res.json({ success: false, error: '获取视频地址失败', raw: parsed });
    }
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===== API: 福音TV视频流代理 - 解决防盗链 =====
// 直接在服务器端代理视频流，绕过防盗链
// 请求示例: /api/fuyin/stream?url=https://vod-hls-pc.sanmanuela.com/...
app.get('/api/fuyin/stream', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('缺少url参数');
  
  try {
    const decodedUrl = decodeURIComponent(url);
    const u = new URL(decodedUrl);
    const mod = u.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.fuyin.tv/',
        'Origin': 'https://www.fuyin.tv',
        'Range': req.headers.range || '',
        'Accept': '*/*'
      }
    };
    
    const proxyReq = mod.request(options, (proxyRes) => {
      const headers = { ...proxyRes.headers };
      delete headers['content-encoding'];
      delete headers['transfer-encoding'];
      delete headers['connection'];
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (e) => {
      res.status(500).send('代理错误: ' + e.message);
    });
    proxyReq.end();
  } catch(e) {
    res.status(500).send('代理错误: ' + e.message);
  }
});

// ===== 首页路由 =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ===== 启动服务器 =====
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════╗
║  福音传播爱 - 完整视频平台       ║
║  ─────────────────              ║
║  前端:  http://localhost:${PORT}  ║
║  后台:  http://localhost:${PORT}/admin  ║
║  API:   http://localhost:${PORT}/api/data  ║
║  管理密码: admin / szxfuyin888   ║
╚══════════════════════════════════╝
  `);
});
