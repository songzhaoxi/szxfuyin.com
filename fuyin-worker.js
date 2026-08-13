/**
 * 🚀 福音传播爱 - Cloudflare Workers 视频代理
 * 部署后访问: https://szxfuyin.com/?proxy=https://你的workers.workers.dev
 * 
 * 功能：
 * 1. /api/fuyin/url   → 代理福音TV API获取视频真实地址
 * 2. /api/fuyin/stream → 代理视频流（绕过防盗链）
 * 3. /api/health       → 健康检查
 * 4. /api/*             → 通用API代理
 */

// ===== 配置 =====
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ===== 入口 =====
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // ===== 路由分发 =====
    if (path === '/api/health') {
      return handleHealth();
    }
    if (path === '/api/fuyin/url') {
      return handleFuyinUrl(url);
    }
    if (path === '/api/fuyin/stream') {
      return handleFuyinStream(url);
    }
    // 通用API代理
    if (path.startsWith('/api/')) {
      return handleProxy(url);
    }

    return new Response('福音TV代理 Worker 运行中 🚀', { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}

// ===== 健康检查 =====
async function handleHealth() {
  return new Response(JSON.stringify({ success: true, message: '福音TV代理运行中 🚀' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ===== 1️⃣ 获取福音TV视频真实地址 =====
// 请求: /api/fuyin/url?movid=3932&urlid=66795
// 响应: { success: true, data: { url: "https://vod-hls-pc.sanmanuela.com/..." } }
async function handleFuyinUrl(url) {
  const movid = url.searchParams.get('movid');
  const urlid = url.searchParams.get('urlid');
  
  if (!movid || !urlid) {
    return new Response(JSON.stringify({ success: false, error: '缺少movid或urlid参数' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const apiUrl = `https://www.fuyin.tv/api/api/tv.movie/url?movid=${encodeURIComponent(movid)}&urlid=${encodeURIComponent(urlid)}&type=1&lang=zh`;
  
  const resp = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.fuyin.tv/',
      'Origin': 'https://www.fuyin.tv',
    }
  });

  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: '解析福音TV响应失败', raw: text }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // 福音TV API 返回格式: { code: 1, data: { url: "..." } } 或 { code: 0, msg: "..." }
  if (json && (json.code === 1 || json.success) && json.data && json.data.url) {
    return new Response(JSON.stringify({ success: true, data: { url: json.data.url } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // 重试: 尝试不同的type参数
  const apiUrl2 = `https://www.fuyin.tv/api/api/tv.movie/url?movid=${encodeURIComponent(movid)}&urlid=${encodeURIComponent(urlid)}&type=2&lang=zh`;
  const resp2 = await fetch(apiUrl2, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.fuyin.tv/',
      'Origin': 'https://www.fuyin.tv',
    }
  });
  const json2 = await resp2.json();
  
  if (json2 && (json2.code === 1 || json2.success) && json2.data && json2.data.url) {
    return new Response(JSON.stringify({ success: true, data: { url: json2.data.url } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  return new Response(JSON.stringify({ success: false, error: '福音TV API未返回有效地址', detail: json }), {
    status: 502,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ===== 2️⃣ 代理视频流（绕过防盗链） =====
// 请求: /api/fuyin/stream?url=https://vod-hls-pc.sanmanuela.com/...
// 响应: 视频流（直接透传）
async function handleFuyinStream(url) {
  const videoUrl = url.searchParams.get('url');
  
  if (!videoUrl) {
    return new Response('缺少url参数', { status: 400, headers: CORS_HEADERS });
  }

  const decodedUrl = decodeURIComponent(videoUrl);
  
  // 获取视频流
  const videoResp = await fetch(decodedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.fuyin.tv/',
      'Origin': 'https://www.fuyin.tv',
    }
  });

  if (!videoResp.ok) {
    return new Response(JSON.stringify({ success: false, error: `获取视频流失败: ${videoResp.status}` }), {
      status: videoResp.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // 透传视频流
  const contentType = videoResp.headers.get('Content-Type') || 'application/octet-stream';
  
  return new Response(videoResp.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

// ===== 3️⃣ 通用代理（备用） =====
async function handleProxy(url) {
  const target = url.searchParams.get('target') || 'https://www.fuyin.tv' + url.pathname.replace('/api', '') + '?' + url.searchParams.toString();
  
  const resp = await fetch(target, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.fuyin.tv/',
    }
  });

  const contentType = resp.headers.get('Content-Type') || 'application/octet-stream';
  const body = resp.body;

  return new Response(body, {
    status: resp.status,
    headers: {
      'Content-Type': contentType,
      ...CORS_HEADERS,
    },
  });
}
