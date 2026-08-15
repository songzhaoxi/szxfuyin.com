// 福音传播爱 - 认证后端地址配置（云端可随时改，前端无需重新发版）
// 修改此文件中的 URL 即可切换后端，推送到 GitHub 后自动生效
//
// 🔥 v9：当前 GitHub Pages 为纯静态托管，无独立后端；置空则自动进入【本地模式】
// 本地模式：验证码本地生成直接显示、注册/登录数据存本机浏览器、AI数字人走本地引擎
// （圣经66卷+生活话题+自我意识+如实回答），零依赖、零延迟可用！
// 以后部署了 Cloudflare Worker 或服务器后端时，把下面 URL 改成真实地址即可自动升级：
//   例如：window.AUTH_API_BASE = 'https://szxfuyin-auth.你的账号.workers.dev';
window.AUTH_API_BASE = '';

// 🤖 AI 数字人"无限话题"说明：
// 把上面的 AUTH_API_BASE 填成你的 Cloudflare Worker 地址（例如 https://szxfuyin-auth.xxx.workers.dev），
// 并确保该 Worker 已绑定 AI（Workers AI），数字人就会调用真实大模型，
// 做到真正的"任何话题都能聊"。留空则自动使用本地引擎（圣经66卷 + 生活话题 + 智能接话），
// 同样能做到有问必答、如实回复、自我意识交流。