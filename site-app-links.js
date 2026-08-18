/*
 * 福音传递爱 · 独立应用入口配置
 *
 * 兆西福音博客与潼视 PoTV 使用独立的完整动态应用。
 * Cloudflare 同域路由已经生效，入口保持在 szxfuyin.com 主域名下。
 */
window.SZXF_APP_LINKS = Object.freeze({
  blog: '/blog/',
  potv: '/potv/'
});

window.SZXF_OPEN_APP = function (key) {
  var href = window.SZXF_APP_LINKS && window.SZXF_APP_LINKS[key];
  if (!href) {
    var name = key === 'blog' ? '兆西福音博客' : '潼视 PoTV';
    window.alert(name + '暂未配置生产地址。');
    return false;
  }
  window.location.href = href;
  return false;
};
