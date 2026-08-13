# 🔥 福音传播爱 - 验证码系统部署指南（5分钟搞定）

## ✅ 已完成（本次修复）

| 文件 | 说明 |
|------|------|
| `server/auth-api.js` | **全新认证后端**：图形验证码 + 邮箱验证码(SMTP/Resend) + 手机短信验证码(阿里云/腾讯云) + 注册/登录/会话/管理配置 |
| `server/server.js` | 已挂载 `/api/auth/*` 认证路由 |
| 本地测试 | ✅ 图形验证码 → 发送验证码 → 注册 → 登录 → 获取用户，全流程通过 |

## 🚀 第1步：部署后端到你的服务器（2分钟）

```bash
# ① 把工作区这两个文件上传到服务器项目目录：
#    server/auth-api.js
#    server/server.js

# ② SSH 到服务器，进入项目目录，重启 Node 服务
cd /var/www/szxfuyin   # 换成你的实际项目路径
pm2 restart server     # 如果用了 pm2
# 或
pkill -f "node server/server.js" && nohup node server/server.js > server.log 2>&1 &
```

> 你的 nginx 已配好 `/api/` → `127.0.0.1:3000` 反代，**无需改 nginx**！

## ✅ 第2步：验证后端上线（1分钟）

浏览器访问：
```
https://szxfuyin.com/api/auth/health
```
返回 `{"success":true,"message":"认证系统运行正常 ✝"}` = 成功！

再访问 `https://szxfuyin.com/auth.html` → 点「注册」→ **图形验证码立即显示**！

## 📧 第3步：配置邮箱验证码（真实收到！2分钟）

用你自己的 QQ 邮箱（或163）就能发验证码，**免费、无需第三方平台**：

1. QQ邮箱 → 设置 → 账户 → 开启「SMTP服务」→ 生成**授权码**（16位字母）
2. 调用配置接口（把下面命令发给服务器，或后台配置页）：
```bash
curl -X POST https://szxfuyin.com/api/auth/admin/config \
  -H "X-Admin-Key: admin888" -H "Content-Type: application/json" \
  -d '{"smtp":{"host":"smtp.qq.com","port":465,"user":"你的QQ邮箱@qq.com","pass":"你的16位授权码","fromName":"福音传播爱"}}'
```
3. 完成后注册页输入邮箱 → 点「获取验证码」→ **QQ邮箱立即收到验证码** ✅

> 163邮箱：host 换成 `smtp.163.com`；Gmail：`smtp.gmail.com`

## 📱 第4步：配置手机短信验证码（真实收到）

需要**阿里云短信**（或腾讯云）：
1. 注册/登录 https://dysms.console.aliyun.com （需实名）
2. 申请签名「福音传播爱」+ 验证码模板 `您的验证码是${code}`
3. 获取 AccessKey ID / Secret（RAM用户，只给短信权限）
4. 调用配置接口：
```bash
curl -X POST https://szxfuyin.com/api/auth/admin/config \
  -H "X-Admin-Key: admin888" -H "Content-Type: application/json" \
  -d '{"sms_provider":"aliyun","aliyun":{"accessKeyId":"LTAI...","accessKeySecret":"...","signName":"福音传播爱","templateCode":"SMS_123456"}}'
```
5. 注册页输入手机号 → 点「获取验证码」→ **手机短信立即收到** ✅

## 🔍 检查配置状态

```bash
curl -X GET https://szxfuyin.com/api/auth/admin/config -H "X-Admin-Key: admin888"
```

## 🛠 管理接口速查

| 接口 | 说明 |
|------|------|
| `GET /api/auth/health` | 健康检查 |
| `GET /api/auth/captcha` | 图形验证码 |
| `POST /api/auth/send-code` | 发送验证码（body: type/target/captchaId/captchaCode） |
| `POST /api/auth/register` | 注册（body: account/type/password/code/nickname） |
| `POST /api/auth/login` | 登录（body: account/password） |
| `GET /api/auth/me` | 当前用户（Header: Authorization: Bearer token） |
| `POST /api/auth/admin/config` | 配置短信/邮箱密钥（X-Admin-Key: admin888） |
| `GET /api/auth/dev-code` | 开发模式查验证码 |

愿神的爱传遍天下！✝
