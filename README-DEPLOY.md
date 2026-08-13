# 🚀 福音传播爱 - 全球视频播放部署方案

## 方案：Cloudflare Workers 代理（免费、全球加速、国内外都能访问）

---

## 第一步：部署 Workers 代理

1. 打开 https://dash.cloudflare.com 登录你的 Cloudflare 账号
2. 进入 **Workers & Pages** → **创建 Worker**
3. 把 `cloudflare-worker.js` 的内容全部复制粘贴进去
4. 点击 **部署**，你会得到一个域名：`你的子域名.workers.dev`
   - 例如：`szxfuyin-proxy.xxxx.workers.dev`

---

## 第二步：配置前端（二选一）

### 方式A：访问一次带参数的URL（推荐，最方便）
直接访问你的网站加 `?proxy=` 参数：
```
https://szxfuyin.com/?proxy=https://你的子域名.workers.dev
```
前端会自动保存 Workers 地址，以后访问无需再加参数！

### 方式B：手动设置（如果方式A不管用）
打开浏览器 F12 控制台，输入：
```javascript
localStorage.setItem('fuyin_proxy_base', 'https://你的子域名.workers.dev')
```
然后刷新页面即可。

---

## 第三步：测试视频播放

访问网站，点击任意视频 → 视频应该通过 Workers 代理正常播放！

---

## 已自带的功能（代码里都写好了）

✅ **B站嵌入播放** - 有B站源的视频直接iframe播放  
✅ **YouTube嵌入播放** - 有YouTube源的视频直接iframe播放  
✅ **福音TV iframe嵌入** - 无需后端，直接嵌入fuyin.tv页面  
✅ **福音TV代理播放** - 通过Workers获取视频地址并代理流  
✅ **自动故障转移** - 一种方式失败自动切换下一种  
✅ **直连播放** - 通过第三方CORS代理获取视频地址  
✅ **多源切换按钮** - 用户可手动切换播放源  

---

## 进阶：绑定自己的域名

1. 在 Workers 设置中 → **触发器** → **自定义域名**
2. 输入 `api.szxfuyin.com`（你的子域名）
3. 在 DNS 设置中添加 CNAME 记录
4. 然后前端用：`https://szxfuyin.com/?proxy=https://api.szxfuyin.com`

---

## 如果你有自己的服务器（终极方案）

你已经有 `server.js` 和 `nginx-proxy.conf`，部署到服务器：
1. 把前端文件放在 `/var/www/szxfuyin/`
2. 运行 `node server.js`（端口3000）
3. 启动 nginx
4. 前端自动检测到同域 nginx 反代 → 视频正常播放
