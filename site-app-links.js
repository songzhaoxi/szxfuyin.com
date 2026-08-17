/*
 * 福音传递爱 · 独立应用入口配置
 *
 * 已部署：博客 /blog/ 与 PoTV /potv/ 已上线到 szxfuyin.com（GitHub Pages 子目录），
 * 与主站同域，无需跨域配置，直接跳转即可。
 */
window.SZXF_APP_LINKS = Object.freeze({
  blog: '/blog/',
  potv: '/potv/'
});

window.SZXF_OPEN_APP = function (key) {
  var href = window.SZXF_APP_LINKS && window.SZXF_APP_LINKS[key];
  if (!href) {
    var name = key === 'blog' ? '兆西福音博客' : '潼视 PoTV';
    window.alert(name + '正在等待正式域名接入。请先在 site-app-links.js 配置真实 HTTPS 地址，避免跳转到临时或失效页面。');
    return false;
  }
  window.location.href = href;
  return false;
};
