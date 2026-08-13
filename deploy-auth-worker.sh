#!/bin/bash
# ============================================================
# 福音传播爱 - 认证系统一键部署脚本 (Cloudflare Workers)
# 只需三步（每步约2分钟）：
#   1) 注册 Cloudflare 账号: https://dash.cloudflare.com/sign-up (免费)
#   2) 本机执行: npx wrangler login  (浏览器授权一次)
#   3) 执行: bash deploy-auth-worker.sh
# ============================================================
set -u
cd "$(dirname "$0")"

echo "=== 1/3 检查登录状态 ==="
npx wrangler whoami || { echo "❌ 请先运行: npx wrangler login"; exit 1; }

echo "=== 2/3 检查/创建 KV 命名空间 ==="
KV_ID=$(grep -oE 'id = "[^"]+"' wrangler.toml | head -1 | sed 's/id = "//;s/"//')
if [ -z "$KV_ID" ] || [ "$KV_ID" = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID" ]; then
  echo "创建 KV 命名空间 AUTH_KV ..."
  npx wrangler kv namespace create AUTH_KV | tee /tmp/kv_out.txt
  NEW_ID=$(grep -oE 'id = "[^"]+"' /tmp/kv_out.txt | head -1 | sed 's/id = "//;s/"//')
  if [ -z "$NEW_ID" ]; then echo "KV创建失败，请手动创建"; exit 1; fi
  sed -i "s/REPLACE_WITH_YOUR_KV_NAMESPACE_ID/$NEW_ID/" wrangler.toml
  echo "KV ID: $NEW_ID 已写入 wrangler.toml"
fi

echo "=== 3/3 部署 Worker ==="
npx wrangler deploy

echo ""
echo "==========================================="
echo "✅ 部署完成！"
echo "   后端地址: https://szxfuyin-auth.<你的账号>.workers.dev"
echo ""
echo "🔍 验证: 访问 https://szxfuyin-auth.<你的账号>.workers.dev/api/auth/health"
echo "   应返回: {\"success\":true,...认证系统运行正常}"
echo ""
echo "🔑 配置真实验证码（部署后执行一次）:"
echo "   ① 邮箱验证码: 注册 https://resend.com 免费拿 API Key (re_xxx)"
echo "   ② 手机短信: 阿里云 https://dysms.console.aliyun.com 实名+签名+模板"
echo "   ③ 调用配置接口:"
echo '     curl -X POST https://szxfuyin-auth.<你的账号>.workers.dev/api/auth/admin/config \'
echo '       -H "X-Admin-Key: admin888" -H "Content-Type: application/json" \'
echo '       -d \'{"resend_api_key":"re_xxx","sms_provider":"aliyun","aliyun":{"accessKeyId":"LTAI...","accessKeySecret":"...","signName":"福音传播爱","templateCode":"SMS_123456"}}\''
echo ""
echo "   ④ 前端登录页加参数指向后端:"
echo "     https://szxfuyin.com/auth.html?auth_api=https://szxfuyin-auth.<你的账号>.workers.dev/api/auth"
echo "==========================================="