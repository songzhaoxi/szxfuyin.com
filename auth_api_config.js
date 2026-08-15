// 福音传播爱 - 认证后端地址配置（云端可随时改，前端无需重新发版）
// 修改此文件中的 URL 即可切换后端，推送到 GitHub 后自动生效
//
// 🔥 v8：已配置真实 Cloudflare Worker 后端（认证 + 无限话题AI大模型）
// 验证码/注册/登录/AI聊天全部走真实后端，数字人可聊任何话题！
window.AUTH_API_BASE = 'https://szxfuyin-auth.songzhaoxi.workers.dev';

// 🤖 AI 数字人"无限话题"说明：
// 上面的 AUTH_API_BASE 已填成 Cloudflare Worker 地址，
// 该 Worker 已绑定 AI（Workers AI），数字人会调用真实大模型，
// 做到真正的"任何话题都能聊"。若 Worker 暂时不可用，则自动使用本地引擎（圣经66卷 + 生活话题 + 智能接话）。