// ===== 🚀 福音传播爱 - Cloudflare Workers 视频代理 =====
// 部署方法：
// 1. 注册 Cloudflare 账号（免费）
// 2. 进入 Workers & Pages → 创建 Worker
// 3. 粘贴本文件全部代码 → 部署
// 4. 获取 Worker 地址：https://你的项目名.workers.dev
// 5. 访问你的网站时加 ?proxy=Worker地址 配置前端
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

    // ===== 🚀 福音TV视频流代理：绕过防盗链 + 自动重写m3u8中的ts分片地址 =====
    // GET /api/fuyin/stream?url=https://vod-hls-pc.sanmanuela.com/...
    // 🔥【2025-07-25 HLS全链路修复】自动检测m3u8内容，重写其中所有ts分片URL
    // 使得浏览器请求ts分片时也走Worker代理，彻底解决国内无法访问sanmanuela.com的问题！
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

        // 🔥 检测是否为m3u8/HLS播放列表内容
        const contentType = response.headers.get('Content-Type') || '';
        const isM3U8 = contentType.includes('mpegurl') || contentType.includes('octet-stream') ||
                       contentType.includes('text/plain') || decodedUrl.includes('.m3u8');

        if (isM3U8) {
          // 读取m3u8完整内容
          const m3u8Text = await response.text();
          // 获取stream基地址（用于构建代理后的ts分片URL）
          const streamBase = url.origin + '/api/fuyin/stream?url=';
          const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf('/') + 1);

          // 🔥 重写m3u8中的每一行：
          // - 绝对URL（https://...ts）→ /api/fuyin/stream?url=https://...ts
          // - 相对URL（segment-1.ts）→ /api/fuyin/stream?url=baseUrl/segment-1.ts
          const rewrittenM3U8 = m3u8Text.split('\n').map(function(line) {
            const trimmed = line.trim();
            // 只重写.ts/.m3u8/.m4s等媒体分片URL行（跳过注释、空行、标签行）
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
              var tsUrl = trimmed;
              // 相对路径 → 拼成绝对路径
              if (!tsUrl.startsWith('http://') && !tsUrl.startsWith('https://')) {
                tsUrl = baseUrl + tsUrl;
              }
              // 转为Worker代理URL
              return streamBase + encodeURIComponent(tsUrl);
            }
            return line;
          }).join('\n');

          const responseHeaders = new Headers();
          responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
          responseHeaders.set('Access-Control-Allow-Origin', '*');
          responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
          responseHeaders.set('Access-Control-Allow-Headers', '*');
          responseHeaders.set('Cache-Control', 'no-cache');

          return new Response(rewrittenM3U8, {
            status: 200,
            headers: responseHeaders
          });
        }

        // 透传非m3u8响应（MP4等）
        const responseHeaders = new Headers(response.headers);
        // 移除可能导致问题的头
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('transfer-encoding');
        responseHeaders.delete('x-frame-options');
        responseHeaders.delete('x-content-type-options');
        // 添加CORS头
        for (const [key, value] of Object.entries(CORS_HEADERS)) {
          responseHeaders.set(key, value);
        }
        
        // 🔥🔥🔥 极速播/迅雷极速播优化响应头
        // 原理：OPPO浏览器检测<video>加载mp4视频流→自动弹出"极速播"按钮
        const ct = responseHeaders.get('Content-Type') || '';
        if (!ct.includes('mpegurl') && !ct.includes('m3u8')) {
          if (decodedUrl.includes('.mp4') || decodedUrl.includes('.mp4/')) {
            responseHeaders.set('Content-Type', 'video/mp4');
          } else if (decodedUrl.includes('.ts')) {
            responseHeaders.set('Content-Type', 'video/MP2T');
          } else {
            responseHeaders.set('Content-Type', 'video/mp4');
          }
        }
        responseHeaders.set('Accept-Ranges', 'bytes');
        responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
        responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, If-Range, Accept-Encoding');
        responseHeaders.delete('Content-Disposition');

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