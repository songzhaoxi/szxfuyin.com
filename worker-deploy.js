// szxfuyin.com - Cloudflare Worker 视频代理 (Service Worker格式)
const FUYIN_REFERER = 'https://www.fuyin.tv/';
const FUYIN_ORIGIN = 'https://www.fuyin.tv';
const PROXY_DOMAINS = ['vod-hls-pc.sanmanuela.com','vod-hls.sanmanuela.com','www.fuyin.tv','fuyin.tv'];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === 'OPTIONS') {
    return new Response(null, {headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'*','Access-Control-Max-Age':'86400'}});
  }
  try {
    if (path === '/proxy/fuyin/url') return await handleFuyinUrl(url);
    if (path === '/proxy/fuyin/stream') return await handleFuyinStream(url);
    if (path === '/proxy/fuyin/play') return await handleFuyinPlay(url);
    if (path === '/proxy/proxy') return await handleGenericProxy(url);
    if (path === '/proxy/health') {
      return new Response(JSON.stringify({success:true,message:'福音传播爱 Proxy Worker 运行正常 ✅',time:new Date().toISOString()}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    }
    return new Response(JSON.stringify({success:true,message:'🔥 福音传播爱 视频代理Worker运行中',status:'ok',time:new Date().toISOString(),endpoints:{getVideoUrl:'/proxy/fuyin/url?movid=xxx&urlid=xxx',proxyStream:'/proxy/fuyin/stream?url=xxx',playVideo:'/proxy/fuyin/play?movid=xxx&urlid=xxx',genericProxy:'/proxy/proxy?url=xxx',health:'/proxy/health'}}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  } catch (err) {
    return new Response(JSON.stringify({error:err.message}),{status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}

async function handleFuyinUrl(url) {
  const movid = url.searchParams.get('movid');
  const urlid = url.searchParams.get('urlid');
  if (!movid || !urlid) return json({success:false,error:'缺少movid或urlid参数'},400);
  const resp = await fetch(`https://www.fuyin.tv/api/api/tv.movie/url?movid=${movid}&urlid=${urlid}&type=1&lang=zh`,{headers:{Referer:FUYIN_REFERER,Origin:FUYIN_ORIGIN,'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
  if (!resp.ok) return json({success:false,error:'API请求失败: '+resp.status});
  const data = await resp.json();
  if (data && data.code===1 && data.data && data.data.url) return json({success:true,data:{url:data.data.url,title:data.data.movie_title||''}});
  return json({success:false,error:'无法获取视频地址',raw:data});
}

async function handleFuyinPlay(url) {
  const movid = url.searchParams.get('movid'), urlid = url.searchParams.get('urlid');
  if (!movid||!urlid) return json({success:false,error:'缺少参数'},400);
  const resp = await fetch(`https://www.fuyin.tv/api/api/tv.movie/url?movid=${movid}&urlid=${urlid}&type=1&lang=zh`,{headers:{Referer:FUYIN_REFERER,Origin:FUYIN_ORIGIN,'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
  if (!resp.ok) return json({success:false,error:'API失败'});
  const d = await resp.json();
  if (!d||d.code!==1||!d.data||!d.data.url) return json({success:false,error:'无视频地址'});
  const vu = d.data.url;
  if (vu.includes('.m3u8')) {
    const mr = await proxyM3u8Internal(vu, url);
    const h = new Headers(mr.headers); h.set('X-Video-Title',encodeURIComponent(d.data.movie_title||'')); h.set('X-MovId',movid);
    return new Response(mr.body,{status:mr.status,headers:h});
  }
  const sr = await proxyStream(vu,'');
  const sh = new Headers(sr.headers); sh.set('X-Video-Title',encodeURIComponent(d.data.movie_title||''));
  return new Response(sr.body,{status:sr.status,headers:sh});
}

async function proxyM3u8Internal(m3u8Url, myUrl) {
  const baseUrl = `${myUrl.protocol}//${myUrl.host}`;
  let r = await fetch(m3u8Url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*',Referer:FUYIN_REFERER,Origin:FUYIN_ORIGIN}});
  if (!r.ok) r = await fetch(m3u8Url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*'}});
  if (!r.ok) return new Response('无法获取视频流: '+r.status,{status:502});
  const c = await r.text();
  return processM3u8(c,m3u8Url,baseUrl);
}

async function handleFuyinStream(url) {
  const vu = url.searchParams.get('url');
  if (!vu) return json({success:false,error:'缺少 url 参数'},400);
  const du = decodeURIComponent(vu);
  if (du.includes('.m3u8')) return proxyAndRewrite(du, url);
  return proxyStream(du,'');
}

async function proxyAndRewrite(m3u8Url, myUrl) {
  const baseUrl = `${myUrl.protocol}//${myUrl.host}`;
  let r = await fetch(m3u8Url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*',Referer:FUYIN_REFERER,Origin:FUYIN_ORIGIN}});
  if (!r.ok) r = await fetch(m3u8Url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*'}});
  if (!r.ok) return new Response('无法获取视频流: '+r.status,{status:502});
  const c = await r.text();
  return processM3u8(c,m3u8Url,baseUrl);
}

function processM3u8(c,m3u8Url,baseUrl) {
  const ls = m3u8Url.lastIndexOf('/');
  const bd = ls>=0?m3u8Url.substring(0,ls+1):'';
  for (const d of PROXY_DOMAINS) {
    const re = new RegExp('https?://'+d.replace(/\./g,'\\.')+'[^\\s"\']+','g');
    c = c.replace(re,m=>baseUrl+'/proxy/fuyin/stream?url='+encodeURIComponent(m));
  }
  c = c.replace(/^([^#\n]*\.(ts|m3u8|aac|mp3|vtt)(\?[^\s]*)?)$/gm,m=>{
    const l=m.trim(); if(!l||l.startsWith('http')||l.startsWith('#')||l.startsWith('<')) return m;
    return baseUrl+'/proxy/fuyin/stream?url='+encodeURIComponent(bd+l);
  });
  const h = new Headers(); h.set('Content-Type','application/vnd.apple.mpegurl'); h.set('Access-Control-Allow-Origin','*');
  return new Response(c,{status:200,headers:h});
}

async function proxyStream(vu,rh='') {
  const h = {'User-Agent':'Mozilla/5.0','Referer':FUYIN_REFERER,'Origin':FUYIN_ORIGIN,'Accept':'*/*'};
  if (rh) h['Range']=rh;
  const r = await fetch(vu,{headers:h});
  const rh2 = new Headers(r.headers); rh2.set('Access-Control-Allow-Origin','*'); rh2.delete('content-encoding');
  return new Response(r.body,{status:r.status,headers:rh2});
}

async function handleGenericProxy(url) {
  const tu = url.searchParams.get('url');
  if (!tu) return json({error:'缺少 url 参数'},400);
  const r = await fetch(decodeURIComponent(tu),{headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*','Referer':FUYIN_REFERER}});
  const h = new Headers(r.headers); h.set('Access-Control-Allow-Origin','*');
  return new Response(r.body,{status:r.status,headers:h});
}

function json(d,s=200) {return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});}