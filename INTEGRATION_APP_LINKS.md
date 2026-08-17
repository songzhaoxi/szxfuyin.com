# 福音传递爱 · 双应用导航接入说明

## 当前已完成

`index.html` 的桌面顶栏和移动侧栏已经增加两个独立入口：`兆西福音博客` 与 `潼视 PoTV`。原首页、视频分类、频道、阅读、圣经、课程、认证和播放器逻辑未被删除或替换。

链接由 `site-app-links.js` 统一配置。为了避免产生 404，当前默认值为空；用户点击时会看到“等待正式域名接入”的明确提示，而不会跳到不存在的 `/blog/` 或 `/potv/`。

## 正式接入步骤

两个应用需要先各自部署到可访问的 HTTPS 地址，再编辑 `site-app-links.js`：

```js
window.SZXF_APP_LINKS = Object.freeze({
  blog: 'https://blog.example.com/',
  potv: 'https://potv.example.com/'
});
```

如果使用同一主域名的子路径，需要先把应用构建与服务端路由配置为对应 base path，并确认静态资源、OAuth 回调、API 和 Cookie 的路径/域名设置；不能只把链接改成 `/blog/` 或 `/potv/`。当前博客应用根路径是 `/`，PoTV 是 `/potv`，它们尚未被证明已部署在 `szxfuyin.com` 下。

## 安全边界

两个应用的数据、权限、审核和内容空间继续独立。福音传递爱主站只负责导航，不复制博客或 PoTV 数据，也不共享跨域 Cookie。正式上线前应使用真实 HTTPS 地址、检查 OAuth 回调白名单、验证移动端导航和对原站视频播放/认证流程做回归测试。
