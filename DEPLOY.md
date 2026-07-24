# 🚀 福音传播爱 - 全球播放部署教程

## 📋 当前进度（已完成）

| 项目 | 状态 |
|------|------|
| 前端首页 index.html | ✅ 已完成，含B站/YouTube/福音TV四源播放器 |
| 数据文件 data/videos.json | ✅ 已有227个福音TV视频数据 |
| Cloudflare Workers代理 worker.js | ✅ **已创建！** 福音TV+B站代理脚本 |
| 本地server.js | ✅ 已完成Node.js服务器 |
| **部署配置** | **👉 就差这一步！** |

---

## ⚡ 方案A：Cloudflare Workers 部署（推荐，免费，3分钟搞定）

### 工作原理
```
用户浏览器 → Cloudflare Workers（全球CDN） → 福音TV API → sanmanuela视频流
                 ↓ 伪造Referer绕过防盗链
             返回视频流 → 浏览器播放出画面 ✅
```

### 操作步骤

**第1步：注册/登录Cloudflare**
- 访问 https://dash.cloudflare.com 注册免费账号

**第2步：创建Worker**
- 左侧菜单 → `Workers & Pages` → `创建 Worker`
- 删除默认代码，把 `worker.js` 文件的**全部内容**复制粘贴进去
- 点击 `保存并部署`

**第3步：获取Worker地址**
- 部署后得到地址如 `https://fuyin-proxy.xxx.workers.dev`
- **测试地址是否可用**：访问 `https://你的地址.workers.dev/api/health`
- 如果显示 `{"success":true,"message":"福音传播爱代理服务器运行正常"}` 就说明成功了！

**第4步：修改index.html配置**
- 打开 `index.html`，找到第1288行
- 把 `const FUYIN_PROXY_BASE = '';` 改成：
  ```javascript
  const FUYIN_PROXY_BASE = 'https://你的地址.workers.dev';
  ```
  （替换成你的真实Worker地址）

**第5步：部署到GitHub Pages**
- 把整个项目推送到GitHub仓库
- 仓库 Settings → Pages → 选择 main 分支 → 保存
- 等待2分钟，访问 `https://你的用户名.github.io/仓库名/`

### 🎯 部署后效果
| 视频类型 | 播放方式 | 国内 | 国外 |
|----------|----------|------|------|
| B站视频（有bvid） | iframe嵌入B站播放器 | ✅ 流畅 | ✅ 流畅 |
| YouTube视频（有ytid） | iframe嵌入YouTube | ❌ 被墙 | ✅ 流畅 |
| 福音TV视频（有movid/urlid） | **通过Cloudflare代理**站内播放MP4 | ✅ 流畅 | ✅ 流畅 |
| 所有视频 | 福音TV原站打开（兜底） | ✅ 100% | ✅ 100% |

---

## ⚡ 方案B：Vercel 部署（免费，Node.js支持，自动HTTPS）

如果Cloudflare Workers在国内访问不稳定，可以用Vercel部署server.js：

1. 把整个项目推送到GitHub
2. 访问 https://vercel.com 用GitHub登录
3. 点击 `Add New` → `Project` → 导入仓库
4. **关键配置**：Build & Output Settings → 修改为：
   - Framework Preset: `Other`
   - Root Directory: `./server`
   - Build Command: `(留空)`
   - Output Directory: `.`
5. 部署后得到 `https://项目名.vercel.app`
6. 修改 index.html 中的 FUYIN_PROXY_BASE

---

## ⚡ 方案C：本地测试（不部署，仅开发用）

```bash
# 安装依赖
cd server
npm install express cors

# 启动服务器
node server.js

# 访问 http://localhost:3000
```

---

## ❓ 常见问题

**Q: 福音TV视频能播放吗？**
A: 部署Cloudflare Worker后，福音TV视频会通过代理在站内直接播放MP4出画面 ✅

**Q: 不部署代理能看吗？**
A: 能！FUYIN_PROXY_BASE留空时，福音TV视频会打开新窗口播放（100%可用）

**Q: B站视频能看吗？**
A: 有bvid的视频直接iframe嵌入B站播放器，国内流畅播放

**Q: 国内访问Cloudflare Workers会慢吗？**
A: Cloudflare有国内节点，访问速度尚可。如果不行，方案B的Vercel也有国内节点

---

## 📞 技术支持

如有部署问题，请联系网站管理员。
愿神的话语传遍世界各地！🙏 ✝️
