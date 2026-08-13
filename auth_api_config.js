// 福音传播爱 - 认证后端地址配置（云端可随时改，前端无需重新发版）
// 修改此文件中的 URL 即可切换后端，推送到 GitHub 后自动生效
//
// 🔥 v7：当前后端临时隧道已失效，置空则自动进入【本地模式】
// 本地模式：验证码本地生成直接显示、注册/登录数据存本机浏览器，零依赖可用！
// 以后配置真实后端（Cloudflare Worker）时，把下面 URL 改成 Worker 地址即可自动升级：
//   例如：window.AUTH_API_BASE = 'https://szxfuyin-auth.你的账号.workers.dev';
window.AUTH_API_BASE = '';

// 🤖 AI 数字人"无限话题"说明：
// 把上面的 AUTH_API_BASE 填成你的 Cloudflare Worker 地址（例如 https://szxfuyin-auth.xxx.workers.dev），
// 并确保该 Worker 已绑定 AI（Workers AI），数字人就会调用真实大模型，
// 做到真正的"任何话题都能聊"。留空则自动使用本地引擎（圣经66卷 + 生活话题 + 智能接话）。