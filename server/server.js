// ===== 福音传播爱 - 完整后端服务器 =====
// 运行: node server/server.js
// 访问: http://localhost:3000

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
