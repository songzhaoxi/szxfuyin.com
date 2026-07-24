// ===== 🚀 福音传播爱 - Cloudflare Workers 代理 =====
// 部署方式：
// 1. 注册 Cloudflare 账号（免费）→ https://dash.cloudflare.com
// 2. 进入 Workers & Pages → 创建 Worker
// 3. 把本文件全部代码复制粘贴进去 → 保存并部署
// 4. 获得地址如 https://fuyin-proxy.xxx.workers.dev
// 5. 修改 index.html 中 FUYIN_PROXY_BASE = 'https://你的地址.workers.dev'
// =====================================================

// ===== CORS头（允许跨域） =====
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

// ===== 请求头模板 - 伪装浏览器 =====
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

// ===== 入口：处理所有请求 =====
export default {
  async fetch(request, env, ctx) {
    // 处理OPTIONS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ===========================================
      // 🚀 福音TV API - 获取真实视频地址
      // GET /api/fuyin/url?movid=xxx&urlid=xxx
      // ===========================================
      if (path === '/api/fuyin/url') {
        const movid = url.searchParams.get('movid');
        const urlid = url.searchParams.get('urlid');
        if (!movid || !urlid) {
          return jsonResponse({ success: false, error: '缺少movid或urlid参数' });
        }

        const apiUrl = `https://www.fuyin.tv/api/api/tv.movie/url?movid=${movid}&urlid=${urlid}&type=1&lang=zh`;
        const data = await fetchWithHeaders(apiUrl, {
          'Referer': 'https://www.fuyin.tv/',
          'Origin': 'https://www.fuyin.tv',
        });

        const parsed = JSON.parse(data);
        if (parsed.code === 1 && parsed.data && parsed.data.url) {
          return jsonResponse({
            success: true,
            data: { url: parsed.data.url, title: parsed.data.movie_title }
          });
        } else {
          return jsonResponse({ success: false, error: '获取视频地址失败', raw: parsed });
        }
      }

      // ===========================================
      // 🚀 福音TV视频流代理 - 解决防盗链！
      // GET /api/fuyin/stream?url=https://vod-hls-pc.sanmanuela.com/...
      // ===========================================
      if (path === '/api/fuyin/stream') {
        const videoUrl = url.searchParams.get('url');
        if (!videoUrl) {
          return new Response('缺少url参数', { status: 400 });
        }
        return proxyStream(decodeURIComponent(videoUrl), {
          'Referer': 'https://www.fuyin.tv/',
          'Origin': 'https://www.fuyin.tv',
        }, request.headers.get('Range') || '');
      }

      // ===========================================
      // 🚀 B站视频信息获取
      // GET /api/bili/view?bvid=BVxxxx
      // ===========================================
      if (path === '/api/bili/view') {
        const bvid = url.searchParams.get('bvid');
        if (!bvid) return jsonResponse({ success: false, error: '缺少bvid参数' });
        const data = await fetchWithHeaders(
          `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
          { 'Referer': 'https://www.bilibili.com', 'Origin': 'https://www.bilibili.com' }
        );
        return jsonResponse(JSON.parse(data));
      }

      // ===========================================
      // 🚀 B站视频播放URL获取
      // GET /api/bili/playurl?bvid=BVxxx&cid=xxx
      // ===========================================
      if (path === '/api/bili/playurl') {
        const bvid = url.searchParams.get('bvid');
        const cid = url.searchParams.get('cid');
        if (!bvid || !cid) return jsonResponse({ success: false, error: '缺少参数' });
        const data = await fetchWithHeaders(
          `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=80&platform=html5&high_quality=1&type=mp4`,
          { 'Referer': 'https://www.bilibili.com', 'Origin': 'https://www.bilibili.com' }
        );
        return jsonResponse(JSON.parse(data));
      }

      // ===========================================
      // 🚀 B站视频流代理 - 解决防盗链！
      // GET /api/bili/stream?url=https://upos-sz-mirrorcos.bilivideo.com/...
      // ===========================================
      if (path === '/api/bili/stream') {
        const videoUrl = url.searchParams.get('url');
        if (!videoUrl) return new Response('缺少url参数', { status: 400 });
        return proxyStream(decodeURIComponent(videoUrl), {
          'Referer': 'https://www.bilibili.com',
          'Origin': 'https://www.bilibili.com',
        }, request.headers.get('Range') || '');
      }

      // ===========================================
      // 🚀 B站自动获取视频流
      // GET /api/bili/auto?bvid=BVxxx
      // ===========================================
      if (path === '/api/bili/auto') {
        const bvid = url.searchParams.get('bvid');
        if (!bvid) return jsonResponse({ success: false, error: '缺少bvid参数' });
        
        const viewData = await fetchWithHeaders(
          `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
          { 'Referer': 'https://www.bilibili.com', 'Origin': 'https://www.bilibili.com' }
        );
        const view = JSON.parse(viewData);
        if (!view.data || !view.data.cid) {
          return jsonResponse({ success: false, error: '无法获取视频信息', raw: view });
        }
        
        const cid = view.data.cid;
        const title = view.data.title || '';
        const pic = view.data.pic || '';
        const author = view.data.owner ? view.data.owner.name : '';
        
        const playData = await fetchWithHeaders(
          `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=80&platform=html5&high_quality=1&type=mp4`,
          { 'Referer': 'https://www.bilibili.com', 'Origin': 'https://www.bilibili.com' }
        );
        const play = JSON.parse(playData);
        
        let videoUrl = '';
        if (play.data && play.data.durl && play.data.durl.length > 0) {
          videoUrl = play.data.durl[0].url || play.data.durl[0].backup_url || '';
        }
        
        const myUrl = new URL(request.url);
        const baseUrl = `${myUrl.protocol}//${myUrl.host}`;
        
        return jsonResponse({
          success: !!videoUrl,
          data: {
            bvid, cid, title, pic, author,
            videoUrl: videoUrl,
            proxyUrl: videoUrl ? (`${baseUrl}/api/bili/stream?url=${encodeURIComponent(videoUrl)}`) : ''
          }
        });
      }

      // ===========================================
      // 🚀 健康检查
      // GET /api/health
      // ===========================================
      if (path === '/api/health') {
        return jsonResponse({
          success: true,
          message: '福音传播爱代理服务器运行正常 ✝',
          time: new Date().toISOString()
        });
      }

      // ===== 404 =====
      return jsonResponse({
        success: false,
        error: '未知API路径',
        available: ['/api/fuyin/url', '/api/fuyin/stream', '/api/bili/view', '/api/bili/playurl', '/api/bili/stream', '/api/bili/auto', '/api/health']
      }, 404);

    } catch (e) {
      return jsonResponse({ success: false, error: e.message }, 500);
    }
  }
};

// ===== 工具：JSON响应 =====
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

// ===== 工具：带自定义请求头的HTTP请求 =====
async function fetchWithHeaders(url, extraHeaders = {}) {
  const response = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      ...extraHeaders,
    },
    timeout: 15000,
  });
  return response.text();
}

// ===== 工具：视频流代理（核心！解决防盗链） =====
async function proxyStream(videoUrl, extraHeaders = {}, rangeHeader = '') {
  const headers = {
    ...BROWSER_HEADERS,
    ...extraHeaders,
    'Accept': '*/*',
  };
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  const response = await fetch(videoUrl, { headers });

  // 透传响应内容并添加CORS头
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // 删除可能影响代理的编码头
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');
  
  // 确保Content-Type正确
  if (!responseHeaders.has('Content-Type') || 
      responseHeaders.get('Content-Type').includes('text/html')) {
    // 自动检测类型
    if (videoUrl.includes('.m3u8')) {
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (videoUrl.includes('.mp4')) {
      responseHeaders.set('Content-Type', 'video/mp4');
    } else if (videoUrl.includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/MP2T');
    }
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
