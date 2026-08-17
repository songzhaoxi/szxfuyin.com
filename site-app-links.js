/*
 * 福音传递爱 · 独立应用入口配置
 *
 * 重要：博客项目当前仍运行在独立应用环境，尚未绑定到 szxfuyin.com。
 * 因此默认不写入 /blog/ 或 /potv/ 这类尚未部署的路径，避免主站产生 404。
 * 正式部署两个应用后，将下面的空字符串替换为真实 HTTPS 地址，例如：
 *   blog: 'https://blog.szxfuyin.com/'
 *   potv: 'https://potv.szxfuyin.com/'
 */
window.SZXF_APP_LINKS = Object.freeze({
  blog: '',
  potv: ''
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
