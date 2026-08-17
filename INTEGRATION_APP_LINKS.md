# 福音传递爱 · 双应用导航接入说明

## 空间边界

福音传递爱主站继续负责首页、福音TV视频、分类、频道、阅读、圣经、课程、认证和既有 `/proxy/*` 视频代理。兆西福音博客与潼视 PoTV 是两个独立应用空间，不作为福音TV分类，不复制主站内容，也不混用博客与 PoTV 的文章、视频、评论、粉丝、审核和统计数据。

主站桌面顶栏和移动侧栏已经增加两个独立入口：`兆西福音博客` 与 `潼视 PoTV`。入口由 `site-app-links.js` 统一控制；在同域路由真正上线前保持空配置，避免访问者跳到 404 或临时地址。

## 已确认的生产源站

pulse-blog 已发布到：

```text
https://pulseblog-pv5p7urq.manus.space
```

该源站的 `/` 已核验为兆西福音博客，`/potv` 已核验为独立潼视 PoTV。pulse-blog 已加入 `/blog` 子路径的路由、tRPC API 和 OAuth 回调前缀兼容；PoTV 保留 `/potv` 路由并支持主域名下的 `/potv/api` 请求前缀。

## Cloudflare Worker 部署

主站仓库中的 `cloudflare-worker.js` 已加入动态应用代理，并保留原有福音TV视频代理分支。Worker 配置中的 `APP_ORIGIN` 为上述 Manus 正式源站。需要在 Cloudflare 的 `szxfuyin-proxy` Worker 的代码编辑器中同步该文件并点击部署；如果 Cloudflare 使用 GitHub 自动部署，则让该 Worker 重新部署主分支提交。

## Cloudflare 路由

在 `szxfuyin.com` 与 `www.szxfuyin.com` 的 Worker Routes 中，将以下八条路径指向同一个 `szxfuyin-proxy` Worker：

```text
szxfuyin.com/blog
szxfuyin.com/blog/*
szxfuyin.com/potv
szxfuyin.com/potv/*
www.szxfuyin.com/blog
www.szxfuyin.com/blog/*
www.szxfuyin.com/potv
www.szxfuyin.com/potv/*
```

现有的下列路由必须保留，不要删除：

```text
szxfuyin.com/proxy/*
www.szxfuyin.com/proxy/*
```

Worker 会将 `/blog` 请求转发到 Manus 源站 `/`，将 `/blog/*` 转发到对应根路径；`/potv` 和 `/potv/*` 保留 PoTV 页面路径，并将 `/api`、静态资源和服务工作线程请求转发到源站根路径。HTML 的根绝对资源链接和重定向会加上当前子路径前缀，避免资源或登录跳出同域空间。

## 主站入口切换

只有在上述 Worker 已部署且八条路径都能返回 200 后，才将 `site-app-links.js` 的配置切换为：

```js
window.SZXF_APP_LINKS = Object.freeze({
  blog: '/blog',
  potv: '/potv'
});
```

在切换前，空配置是安全状态；它不会破坏福音TV，也不会制造 404。切换后应验证主站首页、`/proxy/health`、博客首页、PoTV 首页、博客/PoTV API、登录回调、静态资源、媒体访问和移动端导航。

## 安全边界

两个应用的数据、权限、审核和内容空间继续独立。主站只提供导航，不共享跨域 Cookie。正式上线前应确认 OAuth 回调白名单同时包含 `/blog/api/oauth/callback` 与 `/potv/api/oauth/callback`，并使用真实 HTTPS 访问完成回归测试。
