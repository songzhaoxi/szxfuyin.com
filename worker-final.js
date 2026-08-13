// ============================================================
// szxfuyin.com - Cloudflare Worker 视频代理终极方案
// 功能：绕过福音TV防盗链，让你网站所有视频都能播放出画面！
// ============================================================

// 福音TV API 配置
const FUYIN_API = 'https://api.fuyin.tv';
const FUYIN_REFERER = 'https://www.fuyin.tv/';
const FUYIN_ORIGIN = 'https://www.fuyin.tv';

// 缓存视频URL，减少请求
const urlCache = new Map();
const CACHE_TTL = 600000; // 10分钟

// ===== 防盗链域名列表（需要代理的CDN） =====
const PROXY_DOMAINS = [
  'vod-hls-pc.sanmanuela.com',
  'vod-hls.sanmanuela.com',
  'www.fuyin.tv',
  'fuyin.tv',
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ===== CORS 预检请求 =====
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    try {
      // ===== 端点1: 获取福音TV真实视频地址 =====
      // 同时兼容 /proxy/fuyin/url 和 /api/fuyin/url
      if (path === '/proxy/fuyin/url' || path === '/api/fuyin/url') {
        return await handleFuyinUrl(url, request);
      }

      // ===== 端点2: 代理视频流（核心防盗链突破） =====
      // 同时兼容 /proxy/fuyin/stream 和 /api/fuyin/stream
      if (path === '/proxy/fuyin/stream' || path === '/api/fuyin/stream') {
        return await handleFuyinStream(url, request);
      }

      // ===== 🔥 端点2.5: 组合端点 - 一步获取并代理视频流（解决auth_key绑定IP问题） =====
      // GET /proxy/fuyin/play?movid=2942&urlid=52942
      // 同时兼容 /api/fuyin/play
      if (path === '/proxy/fuyin/play' || path === '/api/fuyin/play') {
        return await handleFuyinPlay(url, request);
      }

      // ===== 端点3: 直接代理任意URL =====
      // 同时兼容 /api/proxy
      if (path === '/proxy/proxy' || path === '/api/proxy') {
        return await handleGenericProxy(url, request);
      }

      // ===== 健康检查 - 供前端自动检测 =====
      // 同时兼容 /api/health（前端自动检测用）
      if (path === '/proxy/health' || path === '/api/health') {
        return jsonResponse({ success: true, worker: 'szxfuyin-proxy' });
      }

      // ===== 根路径 - 状态检查 =====
      return new Response(JSON.stringify({
        status: 'ok',
        message: '🔥 szxfuyin.com 视频代理Worker运行中！',
        endpoints: {
          getVideoUrl: '/proxy/fuyin/url?movid=视频ID&urlid=地址ID',
          proxyStream: '/proxy/fuyin/stream?url=视频直链',
          playVideo: '/proxy/fuyin/play?movid=视频ID&urlid=地址ID',
          genericProxy: '/proxy/proxy?url=任意URL'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({
        error: err.message,
        stack: err.stack
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};

/**
 * 处理获取福音TV真实视频地址的请求
 * 前端调用: /api/fuyin/url?movid=xxx&urlid=yyy
 */
async function handleFuyinUrl(url, request) {
  const movid = url.searchParams.get('movid');
  const urlid = url.searchParams.get('urlid');

  // ===== 🔥 必须同时有movid和urlid =====
  if (!movid || !urlid) {
    return jsonResponse({ success: false, error: '缺少movid或urlid参数' }, 400);
  }

  // 检查缓存
  const cacheKey = `url_${movid}_${urlid}`;
  const cached = urlCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return jsonResponse(cached.data);
  }

  // ===== 🚀 正确调用福音TV官方API获取视频真实地址 =====
  const apiUrl = `https://www.fuyin.tv/api/api/tv.movie/url?movid=${movid}&urlid=${urlid}&type=1&lang=zh`;
  const resp = await fetch(apiUrl, {
    headers: {
      'Referer': 'https://www.fuyin.tv/',
      'Origin': 'https://www.fuyin.tv',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
    }
  });

  if (!resp.ok) {
    return jsonResponse({
      success: false,
      error: `福音TV API请求失败: ${resp.status}`
    });
  }

  const data = await resp.json();

  // ===== 解析福音TV API返回格式: {code:1, data:{url:"...", movie_title:"..."}} =====
  if (data && data.code === 1 && data.data && data.data.url) {
    const videoUrl = data.data.url;
    const title = data.data.movie_title || '';

    // 存入缓存
    urlCache.set(cacheKey, {
      data: { success: true, data: { url: videoUrl, title: title } },
      time: Date.now()
    });

    return jsonResponse({
      success: true,
      data: { url: videoUrl, title: title }
    });
  }

  return jsonResponse({
    success: false,
    error: '无法获取视频地址',
    raw: data
  });
}

/**
 * 🔥 组合端点 - 在Worker内部一步完成：获取福音TV视频地址 → 代理m3u8流
 * 解决auth_key绑定Worker IP导致分步调用失败的问题！
 * 调用方式: /api/fuyin/play?movid=2942&urlid=52942
 */
async function handleFuyinPlay(url, request) {
  const movid = url.searchParams.get('movid');
  const urlid = url.searchParams.get('urlid');
  if (!movid || !urlid) {
    return jsonResponse({ success: false, error: '缺少movid或urlid参数' }, 400);
  }

  // 第一步：获取福音TV真实视频地址（同一个Worker IP）
  const apiUrl = `https://www.fuyin.tv/api/api/tv.movie/url?movid=${movid}&urlid=${urlid}&type=1&lang=zh`;
  const resp = await fetch(apiUrl, {
    headers: {
      'Referer': 'https://www.fuyin.tv/',
      'Origin': 'https://www.fuyin.tv',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
    }
  });

  if (!resp.ok) {
    return jsonResponse({ success: false, error: `福音TV API请求失败: ${resp.status}` });
  }

  const data = await resp.json();
  if (!data || data.code !== 1 || !data.data || !data.data.url) {
    return jsonResponse({ success: false, error: '无法获取视频地址', raw: data });
  }

  const videoUrl = data.data.url;
  const title = data.data.movie_title || '';

  // 第二步：立即用同一个Worker请求视频流（auth_key与IP匹配！）
  const decodedUrl = videoUrl; // 已经是真实URL

  if (decodedUrl.includes('.m3u8')) {
    // 代理m3u8并重写分片地址
    const m3u8Response = await proxyAndRewriteM3u8Internal(decodedUrl, url);
    // 把标题信息加到响应头中
    const headers = new Headers(m3u8Response.headers);
    headers.set('X-Video-Title', encodeURIComponent(title));
    headers.set('X-MovId', movid);
    headers.set('X-UrlId', urlid);
    return new Response(m3u8Response.body, {
      status: m3u8Response.status,
      headers: headers
    });
  }

  // MP4直接代理
  const streamResponse = await proxyStream(decodedUrl, '');
  const streamHeaders = new Headers(streamResponse.headers);
  streamHeaders.set('X-Video-Title', encodeURIComponent(title));
  return new Response(streamResponse.body, {
    status: streamResponse.status,
    headers: streamHeaders
  });
}

// proxyAndRewriteM3u8的内部版本，不依赖request对象
async function proxyAndRewriteM3u8Internal(m3u8Url, myUrl) {
  const baseUrl = `${myUrl.protocol}//${myUrl.host}`;

  let response = await fetch(m3u8Url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': FUYIN_REFERER,
      'Origin': FUYIN_ORIGIN,
    }
  });

  if (!response.ok) {
    response = await fetch(m3u8Url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      }
    });
    if (!response.ok) {
      return new Response('无法获取视频流: ' + response.status, { status: 502 });
    }
  }

  const content = await response.text();
  return processM3u8Response(content, m3u8Url, baseUrl, myUrl);
}

/**
 * 代理视频流 - 核心破解防盗链！🔥 m3u8分片重写+防盗链绕过
 * 调用方式: /api/fuyin/stream?url=https://vod-hls-pc.sanmanuela.com/...
 */
async function handleFuyinStream(url, request) {
  const videoUrl = url.searchParams.get('url');
  if (!videoUrl) {
    return jsonResponse({ error: '缺少 url 参数' }, 400);
  }

  // 解码URL
  const decodedUrl = decodeURIComponent(videoUrl);

  // ===== 🔥 m3u8流：获取并重写分片地址（核心防盗链破解！） =====
  if (decodedUrl.includes('.m3u8')) {
    return proxyAndRewriteM3u8(decodedUrl, request, url);
  }

  // ===== MP4/TS等：直接代理流式传输 =====
  return proxyStream(decodedUrl, request.headers.get('Range') || '');
}

// ===== 🔥 核心：代理m3u8并重写.ts分片地址（防盗链破解关键！） =====
async function proxyAndRewriteM3u8(m3u8Url, request, myUrl) {
  const baseUrl = `${myUrl.protocol}//${myUrl.host}`;

  // 先尝试带Referer请求
  let response = await fetch(m3u8Url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': FUYIN_REFERER,
      'Origin': FUYIN_ORIGIN,
    }
  });

  // 如果失败，尝试不带Referer
  if (!response.ok) {
    response = await fetch(m3u8Url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      }
    });
    if (!response.ok) {
      return new Response('无法获取视频流: ' + response.status, { status: 502 });
    }
  }

  const content = await response.text();
  return processM3u8Response(content, m3u8Url, baseUrl, myUrl);
}

// ===== 🔥 处理m3u8内容，重写分片地址 =====
function processM3u8Response(content, m3u8Url, baseUrl, myUrl) {
  const lastSlash = m3u8Url.lastIndexOf('/');
  const baseDir = lastSlash >= 0 ? m3u8Url.substring(0, lastSlash + 1) : '';

  // 1. 替换所有指向防盗链域名的完整URL（如 sanmanuela.com 的.ts）
  for (const domain of PROXY_DOMAINS) {
    const regex = new RegExp(`https?://${domain.replace(/\./g, '\\.')}[^\\s"']+`, 'g');
    content = content.replace(regex, function(match) {
      return baseUrl + '/proxy/fuyin/stream?url=' + encodeURIComponent(match);
    });
  }

  // 2. 替换相对路径的.ts/.m3u8分片（如 index-00028.ts?auth_key=xxx）
  content = content.replace(/^([^#\n]*\.(ts|m3u8|aac|mp3|vtt|webvtt)(\?[^\s]*)?)$/gm, function(match) {
    const line = match.trim();
    if (!line || line.startsWith('http') || line.startsWith('#') || line.startsWith('<')) return match;
    const fullUrl = baseDir + line;
    return baseUrl + '/proxy/fuyin/stream?url=' + encodeURIComponent(fullUrl);
  });

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  responseHeaders.set('Cache-Control', 'no-cache');

  return new Response(content, {
    status: 200,
    headers: responseHeaders,
  });
}

// ===== 工具：直接代理视频流（MP4/TS等） =====
async function proxyStream(videoUrl, rangeHeader = '') {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': FUYIN_REFERER,
    'Origin': FUYIN_ORIGIN,
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };
  if (rangeHeader) headers['Range'] = rangeHeader;

  const response = await fetch(videoUrl, { headers });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('x-frame-options');
  responseHeaders.delete('x-content-type-options');

  // 🔥🔥🔥 极速播/迅雷极速播优化响应头（2025终极版）
  // 原理：OPPO自带浏览器检测<video>加载mp4视频流→自动弹出"极速播/迅雷极速播"按钮
  // 必须确保：Content-Type=video/mp4, Content-Length存在, Accept-Ranges=bytes, CORS全开
  const currentCt = responseHeaders.get('Content-Type') || '';
  
  // 🔥 强制覆盖Content-Type为video/mp4——浏览器靠它识别视频弹出极速播！
  if (videoUrl.includes('.m3u8')) {
    responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
  } else if (videoUrl.includes('.mp4') || videoUrl.includes('.mp4/')) {
    responseHeaders.set('Content-Type', 'video/mp4');
  } else if (videoUrl.includes('.ts')) {
    responseHeaders.set('Content-Type', 'video/MP2T');
  } else {
    responseHeaders.set('Content-Type', 'video/mp4');
  }
  
  // 🔥 强制Accept-Ranges=bytes——浏览器识别为可拖拽视频，极速播才能叠加！
  responseHeaders.set('Accept-Ranges', 'bytes');
  
  // 🔥 强制移除可能干扰极速播识别的头
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('x-frame-options');
  responseHeaders.delete('x-content-type-options');
  
  // 🔥 极速播需要完整的CORS跨域头
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
  responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, If-Range, Accept-Encoding');
  
  // 🔥 Content-Length必须有——浏览器需要知道视频大小
  // 如果源服务器没返回，尝试从响应体中获取（但流式传输无法预知长度，保持原样）
  
  // 🔥 删除任何可能混淆的Content-Disposition
  responseHeaders.delete('Content-Disposition');

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

/**
 * 通用代理 - 用于代理任意资源
 */
async function handleGenericProxy(url, request) {
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return jsonResponse({ error: '缺少 url 参数' }, 400);
  }

  const decodedUrl = decodeURIComponent(targetUrl);
  const targetHost = new URL(decodedUrl).hostname;

  const resp = await fetch(decodedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Referer': FUYIN_REFERER,
    }
  });

  const responseHeaders = new Headers(resp.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(resp.body, {
    status: resp.status,
    headers: responseHeaders
  });
}

/**
 * 工具函数：返回JSON响应
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
