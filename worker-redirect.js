// ============================================================
// szxfuyin.com - Cloudflare Worker 视频代理（302重定向方案）
// 由于sanmanuela.com屏蔽Cloudflare Workers IP，改为重定向方案
// ============================================================

// 福音TV API 配置
const FUYIN_REFERER = 'https://www.fuyin.tv/';

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
      // ===== 获取福音TV真实视频地址并302重定向 =====
      if (path === '/api/fuyin/play') {
        const movid = url.searchParams.get('movid');
        const urlid = url.searchParams.get('urlid');
        if (!movid || !urlid) {
          return jsonResponse({ success: false, error: '缺少movid或urlid参数' }, 400);
        }

        // 请求福音TV API获取真实视频地址
        const apiUrl = `https://www.fuyin.tv/api/api/tv.movie/url?movid=${movid}&urlid=${urlid}&type=1&lang=zh`;
        const resp = await fetch(apiUrl, {
          headers: {
            'Referer': FUYIN_REFERER,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
          }
        });

        if (!resp.ok) {
          return jsonResponse({ success: false, error: `福音TV API请求失败: ${resp.status}` });
        }

        const data = await resp.json();
        if (data && data.code === 1 && data.data && data.data.url) {
          const videoUrl = data.data.url;
          const title = data.data.movie_title || '';

          // 302重定向到原始视频地址（让用户浏览器直接请求）
          return new Response(null, {
            status: 302,
            headers: {
              'Location': videoUrl,
              'Access-Control-Allow-Origin': '*',
              'X-Video-Title': encodeURIComponent(title),
              'X-MovId': movid,
              'X-UrlId': urlid,
            }
          });
        }

        return jsonResponse({ success: false, error: '无法获取视频地址', raw: data });
      }

      // ===== 健康检查 =====
      if (path === '/api/health') {
        return jsonResponse({ success: true, worker: 'szxfuyin-proxy-redirect' });
      }

      // ===== 根路径 =====
      return new Response(JSON.stringify({
        status: 'ok',
        message: '🚀 szxfuyin.com 视频代理（重定向方案）运行中！',
        endpoints: {
          playVideo: '/api/fuyin/play?movid=视频ID&urlid=地址ID'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
