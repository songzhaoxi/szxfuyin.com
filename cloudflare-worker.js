// ============================================================
// 🚀 福音传播爱 - Cloudflare Workers 代理脚本
// 部署说明：
// 1. 登录 https://dash.cloudflare.com
// 2. 进入 Workers & Pages → 创建 Worker
// 3. 粘贴此代码 → 部署
// 4. 部署后你会得到一个 workers.dev 域名（如 szxfuyin-proxy.xxx.workers.dev）
// 5. 将域名填入前端的 FUYIN_PROXY_BASE（或手动设置 localStorage）
// ============================================================

// ===== 配置 =====
const CONFIG = {
  // Manus 动态应用正式源站；仅用于 /blog 与 /potv 同域转发
  APP_ORIGIN: 'https://pulseblog-pv5p7urq.manus.space',
  // 福音TV API 基础地址
  FUYIN_API_BASE: 'https://www.fuyin.tv/api/api/tv.movie',
  // 允许跨域的域名列表（你的网站域名）
  ALLOWED_ORIGINS: [
    'https://szxfuyin.com',
    'https://www.szxfuyin.com',
    // 本地开发用（可删除）
    'http://localhost:3000',
    'http://localhost:8080'
  ]
};

// ===== CORS 头 =====
function corsHeaders(origin) {
  // 如果请求来源在允许列表中，返回对应的 Origin；否则返回通配符
  const allowedOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// ===== 处理 OPTIONS 预检请求 =====
function handleOptions(request) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, {
    headers: {
      ...corsHeaders(origin),
      'Allow': 'GET, POST, OPTIONS',
    }
  });
}

// ===== 健康检查 =====
async function handleHealth() {
  return new Response(JSON.stringify({
    success: true,
    message: '福音传播爱 Proxy Worker 运行正常 ✅',
    time: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// ===== 获取福音TV视频地址 =====
async function handleFuyinUrl(urlParams) {
  const movid = urlParams.get('movid');
  const urlid = urlParams.get('urlid');
  
  if (!movid || !urlid) {
    return new Response(JSON.stringify({
      success: false,
      message: '缺少参数 movid 或 urlid'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 请求福音TV API
    const apiUrl = `${CONFIG.FUYIN_API_BASE}/url?movid=${encodeURIComponent(movid)}&urlid=${encodeURIComponent(urlid)}&type=1&lang=zh`;
    console.log(`📡 请求福音TV API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.fuyin.tv/'
      }
    });

    if (!response.ok) {
      throw new Error(`福音TV API 返回 ${response.status}`);
    }

    const data = await response.json();
    console.log(`📡 福音TV API 响应:`, JSON.stringify(data).substring(0, 200));

    // 解析响应数据（兼容不同格式）
    let videoUrl = null;
    if (data && data.data && data.data.url) {
      videoUrl = data.data.url;
    } else if (data && data.url) {
      videoUrl = data.url;
    } else if (data && data.data && data.data.path) {
      videoUrl = data.data.path;
    }

    if (!videoUrl) {
      return new Response(JSON.stringify({
        success: false,
        message: '未能从福音TV获取视频地址',
        rawData: data
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 返回视频地址
    return new Response(JSON.stringify({
      success: true,
      data: {
        url: videoUrl,
        movid: movid,
        urlid: urlid
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`❌ 获取福音TV视频地址失败:`, error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '获取视频地址失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ===== 🔥 极速播代理视频流（优化响应头 → OPPO浏览器自动识别弹出极速播按钮！） =====
async function handleFuyinStream(request, urlParams) {
  const videoUrl = urlParams.get('url');
  
  if (!videoUrl) {
    return new Response(JSON.stringify({
      success: false,
      message: '缺少参数 url'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解码 URL
    const decodedUrl = decodeURIComponent(videoUrl);
    console.log(`📡 极速播代理视频流: ${decodedUrl}`);

    // ===== 🔥🔥🔥 满配请求头——突破防盗链，让源服务器返回完整视频流 =====
    const reqHeaders = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; OPPO Find X7 Ultra) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'video/mp4,video/*,*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://www.fuyin.tv/',
      'Origin': 'https://www.fuyin.tv',
    };
    // 只有客户端有Range头才传递（否则源服务器用200返回完整文件，避免206分片问题）
    const clientRange = request.headers.get('Range');
    if (clientRange) reqHeaders['Range'] = clientRange;

    // 发起视频请求
    const videoResponse = await fetch(decodedUrl, { headers: reqHeaders });

    // ===== 🔥🔥🔥 极速播优化响应头——确保OPPO浏览器识别视频流并弹出极速播按钮！ =====
    const responseHeaders = new Headers(videoResponse.headers);
    
    // ===== CORS 头——极速播跨域需要 =====
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, If-Range, Accept-Encoding');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
    
    // ===== 🔥 删除可能干扰视频播放的响应头 =====
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('x-frame-options');
    responseHeaders.delete('x-content-type-options');
    responseHeaders.delete('x-robots-tag');
    responseHeaders.delete('x-download-options');
    
    // ===== 🔥🔥🔥 核心：强制Content-Type为video/mp4——极速播靠它识别视频！ =====
    if (decodedUrl.includes('.m3u8')) {
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (decodedUrl.includes('.mp4') || decodedUrl.includes('.mp4/')) {
      responseHeaders.set('Content-Type', 'video/mp4');
    } else if (decodedUrl.includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/MP2T');
    } else {
      responseHeaders.set('Content-Type', 'video/mp4');
    }
    
    // ===== 🔥 强制Accept-Ranges=bytes——浏览器识别视频可拖拽，极速播可叠加 =====
    responseHeaders.set('Accept-Ranges', 'bytes');
    
    // ===== 🔥 删除任何可能混淆的Content-Disposition =====
    responseHeaders.delete('Content-Disposition');
    
    // ===== 缓存控制——视频流缓存1小时 =====
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    return new Response(videoResponse.body, {
      status: videoResponse.status,
      statusText: videoResponse.statusText,
      headers: responseHeaders
    });

  } catch (error) {
    console.error(`❌ 极速播代理视频流失败:`, error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '代理视频流失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ===== 博客 / PoTV 同域反向代理 =====
function appRoutePrefix(path) {
  if (path === '/blog' || path.startsWith('/blog/')) return '/blog';
  if (path === '/potv' || path.startsWith('/potv/')) return '/potv';
  return '';
}

function appTargetPath(path, prefix) {
  if (prefix === '/blog') return path === prefix ? '/' : path.slice(prefix.length) || '/';
  if (prefix === '/potv') {
    const suffix = path.slice(prefix.length);
    if (!suffix) return '/potv';
    // 静态资源与 API 在 Manus 源站根路径；PoTV 页面路由保留 /potv 前缀。
    if (/^\/(api|assets|src|manifest\.json|sw\.js|favicon)/.test(suffix)) return suffix;
    return path;
  }
  return path;
}

function rewriteAppHtml(html, prefix) {
  return html.replace(/(\b(?:href|src|action)=["'])\/(?!\/)/g, `$1${prefix}/`);
}

async function handleAppProxy(request, url, prefix) {
  if (!CONFIG.APP_ORIGIN) {
    return new Response(JSON.stringify({ success: false, message: '动态应用源站尚未配置' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const target = new URL(appTargetPath(url.pathname, prefix) + url.search, CONFIG.APP_ORIGIN);
  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Prefix', prefix);
  const init = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;
  const upstream = await fetch(new Request(target, init));
  const responseHeaders = new Headers(upstream.headers);
  const location = responseHeaders.get('Location');
  if (location) {
    const rewritten = location.startsWith(CONFIG.APP_ORIGIN)
      ? location.slice(CONFIG.APP_ORIGIN.length) || '/'
      : location;
    if (rewritten.startsWith('/') && !rewritten.startsWith(prefix)) {
      responseHeaders.set('Location', `${prefix}${rewritten}`);
    }
  }
  const contentType = responseHeaders.get('Content-Type') || '';
  if (contentType.includes('text/html')) {
    const html = await upstream.text();
    responseHeaders.delete('Content-Length');
    return new Response(rewriteAppHtml(html, prefix), {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

// ===== 主路由 =====
async function handleRequest(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  
  // OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // 路由分发
  const path = url.pathname;
  const appPrefix = appRoutePrefix(path);
  if (appPrefix) {
    try {
      return await handleAppProxy(request, url, appPrefix);
    } catch (error) {
      console.error('动态应用代理失败:', error);
      return new Response(JSON.stringify({ success: false, message: '动态应用源站暂时不可用' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 健康检查（支持 /api/health 和 /proxy/health 和 /proxy/）
  if (path === '/api/health' || path === '/proxy/health' || path === '/proxy/') {
    return handleHealth();
  }

  // 获取视频地址（支持 /api/fuyin/url 和 /proxy/fuyin/url）
  if (path === '/api/fuyin/url' || path === '/proxy/fuyin/url') {
    return handleFuyinUrl(url.searchParams);
  }

  // 代理视频流（支持 /api/fuyin/stream 和 /proxy/fuyin/stream）
  if (path === '/api/fuyin/stream' || path === '/proxy/fuyin/stream') {
    return handleFuyinStream(request, url.searchParams);
  }

  // 🔥 一站式播放路由：接收movid+urlid，内部获取真实URL后代理视频流
  if (path === '/proxy/fuyin/play') {
    const movid = url.searchParams.get('movid');
    const urlid = url.searchParams.get('urlid');
    if (!movid || !urlid) {
      return new Response(JSON.stringify({success:false,message:'缺少movid或urlid'}),{status:400,headers:{'Content-Type':'application/json'}});
    }
    try {
      // 第一步：从福音TV获取真实视频URL
      const apiUrl = `${CONFIG.FUYIN_API_BASE}/url?movid=${encodeURIComponent(movid)}&urlid=${encodeURIComponent(urlid)}&type=1&lang=zh`;
      const apiResp = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.fuyin.tv/'
        }
      });
      const data = await apiResp.json();
      let videoUrl = null;
      if (data && data.data && data.data.url) videoUrl = data.data.url;
      else if (data && data.url) videoUrl = data.url;
      else if (data && data.data && data.data.path) videoUrl = data.data.path;
      
      if (!videoUrl) {
        return new Response(JSON.stringify({success:false,message:'未获取到视频地址'}),{headers:{'Content-Type':'application/json'}});
      }
      
      // 第二步：代理视频流
      const decodedUrl = decodeURIComponent(videoUrl);
      const reqHeaders = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
        'Accept': 'video/mp4,video/*,*/*',
        'Referer': 'https://www.fuyin.tv/',
        'Origin': 'https://www.fuyin.tv',
      };
      const clientRange = request.headers.get('Range');
      if (clientRange) reqHeaders['Range'] = clientRange;
      
      const videoResp = await fetch(decodedUrl, { headers: reqHeaders });
      const respHeaders = new Headers(videoResp.headers);
      respHeaders.set('Access-Control-Allow-Origin', '*');
      respHeaders.set('Access-Control-Expose-Headers', 'Content-Length,Content-Range,Accept-Ranges');
      respHeaders.delete('content-encoding');
      respHeaders.delete('transfer-encoding');
      
      if (decodedUrl.includes('.m3u8')) respHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      else respHeaders.set('Content-Type', 'video/mp4');
      respHeaders.set('Accept-Ranges', 'bytes');
      respHeaders.set('Cache-Control', 'public, max-age=3600');
      
      return new Response(videoResp.body, { status: videoResp.status, headers: respHeaders });
    } catch(e) {
      return new Response(JSON.stringify({success:false,message:e.message}),{status:500,headers:{'Content-Type':'application/json'}});
    }
  }

  // 支持直接 /proxy?url=xxx 的简化代理方式
  if (path === '/proxy') {
    return handleFuyinStream(request, url.searchParams);
  }

  // 404 - 未匹配路由
  return new Response(JSON.stringify({
    success: false,
    message: '未知路由: ' + path,
    availableRoutes: [
      'GET /blog and /blog/* → Manus blog app',
      'GET /potv and /potv/* → Manus PoTV app',
      'GET /proxy/health',
      'GET /proxy/fuyin/url?movid=xxx&urlid=xxx',
      'GET /proxy/fuyin/stream?url=xxx',
      'GET /proxy?url=xxx'
    ]
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ===== 注册 Fetch 事件监听 =====
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
