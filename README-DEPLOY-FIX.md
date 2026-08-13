# 🔥 福音传播爱 - 最终部署方案

## 问题根因（一句话）
**你的网站在 GitHub Pages（纯静态托管）上，而 server.js（Node.js后端）没运行！**
所有 /api/ 请求（包括 /api/fuyin/url 和 /api/fuyin/stream）全部404，导致福音TV视频无法通过代理播放。

但好消息是：你的前端代码已经做好了**三重兜底**：
1️⃣ B站视频 → iframe嵌入 → ⚠️ 应该能播
2️⃣ YouTube视频 → iframe嵌入 → ⚠️ 应该能播  
3️⃣ 福音TV视频 → 直连+4个CORS代理轮询 → ⚠️ 可能不稳定
4️⃣ 福音TV视频 → iframe嵌入 → ⚠️ 部分浏览器限制

**所以核心问题出在福音TV视频（有movid/urlid的）的播放上！**

---

## 方案一（推荐）：部署后端到 Railway.app（免费，5分钟搞定）

### 步骤1：注册 Railway.app
1. 打开 https://railway.app
2. 用 GitHub 账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"

### 步骤2：部署 server.js
1. 在 Railway 选择你的 GitHub 仓库
2. Railway 会自动检测 package.json → 自动运行 `npm start`
3. 部署完成后，Railway 会给你一个 URL：`https://szxfuyin-backend.up.railway.app`

### 步骤3：配置前端指向这个后端
访问你的网站时，加参数：
```
https://szxfuyin.com/?proxy=https://szxfuyin-backend.up.railway.app
```
或者打开浏览器F12控制台，执行一次（永久保存）：
```javascript
localStorage.setItem('fuyin_proxy_base', 'https://szxfuyin-backend.up.railway.app');
```

### ✅ 效果
- 所有 /api 请求正常 ✅
- 福音TV视频通过代理播放 ✅
- 全球加速（Railway全球CDN）✅
- 国内访问正常 ✅
- 全功能：静态+动态全部真实可用 ✅

---

## 方案二（免费+国内快）：部署到 Zeabur（中国优化）

Zeabur 有国内CDN节点，访问更快：
1. 打开 https://zeabur.com
2. 用GitHub登录
3. 部署 server/ 目录
4. 获取 URL 后用同样的 ?proxy= 方式配置

---

## 方案三（如果不想部署后端）：修改前端加直连播放

如果暂时不想部署后端，我可以帮你修改 szxfuyin_home.html，在 `openPlayer` 函数里**直接使用 V 数组中的直链视频URL**（.m3u8地址）作为播放源。

优点是**零部署、零成本**，但直链URL的 auth_key 偶尔会过期。

**你要选哪个方案？我直接动手改！**
