// ===== 🚀 福音传播爱 - Cloudflare Workers 视频代理 =====
// 部署方法：
// 1. 注册 Cloudflare 账号（免费）
// 2. 进入 Workers & Pages → 创建 Worker
// 3. 粘贴本文件全部代码 → 部署
// 4. 获取 Worker 地址：https://你的项目名.workers.dev
// 5. 修改 index.html 中的 FUYIN_PROXY_BASE 为上述地址
// ========================================================

// 允许跨域
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ===== 健康检查 =====
    if (path === '/api/health') {
      return new Response(JSON.stringify({ success: true, message: '福音传播爱代理运行中' }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // ===== 🚀 福音TV API代理：获取视频真实地址 =====
    // GET /api/fuyin/url?movid=3932&urlid=66795
    if (path === '/api/fuyin/url') {
      const movid = url.searchParams.get('movid');
      const urlid = url.searchParams.get('urlid');
      if (!movid || !urlid) {
        return new Response(JSON.stringify({ success: false, error: '缺少movid或urlid参数' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }

      try {
        // 调用福音TV API获取真实视频地址
        const apiUrl = `https://www.fuyin.tv/api/api/tv.movie/url?movid=${movid}&urlid=${urlid}&type=1&lang=zh`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.fuyin.tv/',
            'Origin': 'https://www.fuyin.tv',
            'Accept': 'application/json, text/plain, */*'
          }
        });
        const data = await response.json();

        if (data.code === 1 && data.data && data.data.url) {
          return new Response(JSON.stringify({
            success: true,
            data: { url: data.data.url, title: data.data.movie_title || '' }
          }), {
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
          });
        } else {
          return new Response(JSON.stringify({ success: false, error: '获取视频地址失败', raw: data }), {
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
    }

    // ===== 🚀 福音TV视频流代理：绕过防盗链 =====
    // GET /api/fuyin/stream?url=https://vod-hls-pc.sanmanuela.com/...
    if (path === '/api/fuyin/stream') {
      const videoUrl = url.searchParams.get('url');
      if (!videoUrl) {
        return new Response('缺少url参数', {
          status: 400, headers: CORS_HEADERS
        });
      }

      try {
        const decodedUrl = decodeURIComponent(videoUrl);
        // 代理请求视频流，添加正确的Referer
        const response = await fetch(decodedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.fuyin.tv/',
            'Origin': 'https://www.fuyin.tv',
            'Range': request.headers.get('Range') || '',
            'Accept': '*/*'
          }
        });

        // 透传响应
        const responseHeaders = new Headers(response.headers);
        // 移除可能导致问题的头
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('transfer-encoding');
        // 添加CORS头
        for (const [key, value] of Object.entries(CORS_HEADERS)) {
          responseHeaders.set(key, value);
        }

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders
        });
      } catch (e) {
        return new Response('代理错误: ' + e.message, {
          status: 500, headers: CORS_HEADERS
        });
      }
    }

    // ===== 🚀 B站视频信息获取 =====
    // GET /api/bili/view?bvid=BV1MyqnBeEVo
    if (path === '/api/bili/view') {
      const bvid = url.searchParams.get('bvid');
      if (!bvid) {
        return new Response(JSON.stringify({ success: false, error: '缺少bvid参数' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      try {
        const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com'
          }
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
    }

    // ===== 🚀 B站智能一键获取视频流 =====
    // GET /api/bili/auto?bvid=BV1MyqnBeEVo
    if (path === '/api/bili/auto') {
      const bvid = url.searchParams.get('bvid');
      if (!bvid) {
        return new Response(JSON.stringify({ success: false, error: '缺少bvid参数' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      try {
        // Step1: 获取cid
        const viewRes = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com'
          }
        });
        const viewData = await viewRes.json();
        if (!viewData.data || !viewData.data.cid) {
          return new Response(JSON.stringify({ success: false, error: '无法获取视频信息' }), {
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
          });
        }
        const cid = viewData.data.cid;
        const title = viewData.data.title || '';
        const pic = viewData.data.pic || '';

        // Step2: 获取播放URL
        const playRes = await fetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=80&platform=html5&high_quality=1`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com'
          }
        });
        const playData = await playRes.json();
        let videoUrl = '';
        if (playData.data && playData.data.durl && playData.data.durl.length > 0) {
          videoUrl = playData.data.durl[0].url || '';
        }

        return new Response(JSON.stringify({
          success: !!videoUrl,
          data: { bvid, cid, title, pic, videoUrl }
        }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
    }

    // 404
    return new Response(JSON.stringify({ success: false, error: '未知路由' }), {
      status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
};
