/*
 * 福音传递爱 · 独立应用入口配置
 *
 * 兆西福音博客与潼视 PoTV 使用独立的完整动态应用。
 * 在 Cloudflare 同域路由正式生效前，先指向已核验的 Manus 生产源站；
 * 同域路由完成后，可将下面两个地址切换为 /blog 与 /potv。
 */
window.SZXF_APP_LINKS = Object.freeze({
  blog: 'https://pulseblog-pv5p7urq.manus.space/',
  potv: 'https://pulseblog-pv5p7urq.manus.space/potv'
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
