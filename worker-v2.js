// ============================================================
// szxfuyin.com - Cloudflare Worker v2 福音TV视频代理
// 修复：m3u8代理400错误，使用纯透传+强Referer
// ============================================================

// ===== 防盗链域名列表 =====
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

    // CORS 预检
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
      if (path === '/api/fuyin/url') {
        return await handleFuyinUrl(url);
      }

      // ===== 端点2: 🔥 纯透传代理（解决CDN 400问题） =====
      // GET /api/vod?url=编码后的视频地址
      if (path === '/api/vod') {
        return await handleVodProxy(url);
      }

      // ===== 端点3: 健康检查 =====
      if (path === '/api/health') {
        return jsonResponse({ success: true, worker: 'szxfuyin-proxy-v2' });
      }

      // ===== 根路径 =====
      return new Response(JSON.stringify({
        status: 'ok',
        message: '🔥 szxfuyin.com 视频代理v2运行中！',
        endpoints: {
          getUrl: '/api/fuyin/url?movid=xxx&urlid=yyy',
          playVod: '/api/vod?url=视频直链（编码）'
        }
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};

/**
 * 获取福音TV真实视频地址
 */
async function handleFuyinUrl(url) {
  const movid = url.searchParams.get('movid');
  const urlid = url.searchParams.get('urlid');

  if (!movid || !urlid) {
    return jsonResponse({ success: false, error: '缺少movid或urlid参数' }, 400);
  }

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
  if (data && data.code === 1 && data.data && data.data.url) {
    return jsonResponse({
      success: true,
      data: {
        url: data.data.url,
        title: data.data.movie_title || ''
      }
    });
  }

  return jsonResponse({ success: false, error: '无法获取视频地址', raw: data });
}

/**
 * 🔥 纯透传视频代理 - 解决CDN 400问题
 * 使用浏览器级别的请求头，模拟真实浏览器访问
 */
async function handleVodProxy(url) {
  const videoUrl = url.searchParams.get('url');
  if (!videoUrl) {
    return jsonResponse({ error: '缺少url参数' }, 400);
  }

  const decodedUrl = decodeURIComponent(videoUrl);

  // 构建浏览器级别的请求头
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://www.fuyin.tv/',
    'Origin': 'https://www.fuyin.tv',
    'Sec-Fetch-Dest': 'video',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'DNT': '1',
    'Connection': 'keep-alive',
  };

  // 如果是m3u8，特殊处理
  if (decodedUrl.includes('.m3u8')) {
    return await proxyM3u8(decodedUrl, headers);
  }

  // 直接代理MP4/TS等
  return await proxyDirect(decodedUrl, headers);
}

/**
 * 代理m3u8 - 获取内容后重写分片地址
 */
async function proxyM3u8(m3u8Url, baseHeaders) {
  // 先用最强请求头获取m3u8
  let response = await fetch(m3u8Url, { headers: baseHeaders });

  // 如果失败，尝试简化请求头
  if (!response.ok) {
    const simpleHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.fuyin.tv/',
      'Accept': '*/*',
    };
    response = await fetch(m3u8Url, { headers: simpleHeaders });
  }

  // 如果还失败，尝试不带Referer
  if (!response.ok) {
    const noRefHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
    };
    response = await fetch(m3u8Url, { headers: noRefHeaders });
  }

  // 最终尝试 - 纯裸请求
  if (!response.ok) {
    response = await fetch(m3u8Url);
  }

  if (!response.ok) {
    return new Response('无法获取视频流: ' + response.status, { status: 502 });
  }

  const contentType = response.headers.get('Content-Type') || '';
  
  // 如果是m3u8内容，重写分片地址
  if (contentType.includes('mpegurl') || contentType.includes('m3u8') || m3u8Url.includes('.m3u8')) {
    const content = await response.text();
    return processM3u8Content(content, m3u8Url);
  }

  // 直接返回
  const respHeaders = new Headers(response.headers);
  respHeaders.set('Access-Control-Allow-Origin', '*');
  return new Response(response.body, {
    status: response.status,
    headers: respHeaders
  });
}

/**
 * 重写m3u8中的分片地址
 */
function processM3u8Content(content, m3u8Url) {
  const lastSlash = m3u8Url.lastIndexOf('/');
  const baseDir = lastSlash >= 0 ? m3u8Url.substring(0, lastSlash + 1) : '';
  const host = new URL(m3u8Url).host;

  // 构建Worker自己的基础URL（用于代理分片）
  const proxyBase = `/api/vod?url=`;

  // 替换完整URL（防盗链域名的资源）
  for (const domain of PROXY_DOMAINS) {
    const regex = new RegExp(`https?://${domain.replace(/\./g, '\\.')}[^\\s"']+`, 'g');
    content = content.replace(regex, (match) => proxyBase + encodeURIComponent(match));
  }

  // 替换相对路径分片（.ts, .m3u8等）
  content = content.replace(/^([^#\n]*\.(ts|m3u8|aac|mp3|vtt|webvtt)(\?[^\s]*)?)$/gm, (match) => {
    const line = match.trim();
    if (!line || line.startsWith('http') || line.startsWith('#') || line.startsWith('<')) return match;
    const fullUrl = baseDir + line;
    return proxyBase + encodeURIComponent(fullUrl);
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

/**
 * 直接代理流
 */
async function proxyDirect(videoUrl, headers) {
  // 尝试带完整浏览器头
  let response = await fetch(videoUrl, { headers });

  // 失败则简化
  if (!response.ok) {
    response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.fuyin.tv/',
        'Accept': '*/*',
      }
    });
  }

  const respHeaders = new Headers(response.headers);
  respHeaders.set('Access-Control-Allow-Origin', '*');
  respHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // 修复Content-Type
  if (!respHeaders.has('Content-Type') || respHeaders.get('Content-Type').includes('text/html')) {
    if (videoUrl.includes('.mp4')) respHeaders.set('Content-Type', 'video/mp4');
    else if (videoUrl.includes('.ts')) respHeaders.set('Content-Type', 'video/MP2T');
    else if (videoUrl.includes('.m3u8')) respHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
  }

  return new Response(response.body, {
    status: response.status,
    headers: respHeaders
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
