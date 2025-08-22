# 安全配置部署指南

本文档详细说明了如何部署和配置项目的安全设置，包括Firebase控制台配置和安全规则部署。

## 🔒 已完成的安全配置

### 1. CSP（内容安全策略）✅
- **位置**: `netlify.toml`
- **功能**: 防止XSS攻击，限制资源加载来源
- **配置**: 已添加完整的CSP策略，允许Firebase相关域名

### 2. HSTS（HTTP严格传输安全）✅
- **位置**: `netlify.toml`
- **功能**: 防止HTTP降级攻击，强制HTTPS连接
- **配置**: `max-age=31536000; includeSubDomains; preload`

### 3. Permissions Policy ✅
- **位置**: `netlify.toml`
- **功能**: 限制浏览器API访问权限
- **配置**: 禁用摄像头、麦克风、地理位置等敏感权限

### 4. Firestore安全规则 ✅
- **位置**: `firestore.rules`
- **功能**: 控制数据库访问权限
- **配置**: 已创建完整的安全规则文件

## 🚀 需要手动配置的项目

### Firebase控制台配置

#### 1. API密钥域名限制

**步骤**:
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的Firebase项目
3. 导航到 **API和服务** > **凭据**
4. 找到你的API密钥（通常名为"Browser key"或"Web API key"）
5. 点击编辑API密钥
6. 在**应用限制**部分选择**HTTP引荐来源网址**
7. 添加以下域名限制：
   ```
   https://your-domain.com/*
   https://your-domain.netlify.app/*
   http://localhost:8000/*
   http://127.0.0.1:8000/*
   ```
8. 在**API限制**部分，选择**限制密钥**并启用以下API：
   - Identity Toolkit API
   - Firebase Authentication API
   - Cloud Firestore API

#### 2. 部署Firestore安全规则

**方法一：使用Firebase CLI**
```bash
# 安装Firebase CLI（如果尚未安装）
npm install -g firebase-tools

# 登录Firebase
firebase login

# 初始化项目（如果尚未初始化）
firebase init firestore

# 部署安全规则
firebase deploy --only firestore:rules
```

**方法二：通过Firebase控制台**
1. 访问 [Firebase控制台](https://console.firebase.google.com/)
2. 选择你的项目
3. 导航到 **Firestore Database** > **规则**
4. 复制 `firestore.rules` 文件的内容
5. 粘贴到规则编辑器中
6. 点击**发布**

#### 3. Firebase Authentication设置

**启用App Check（推荐）**:
1. 在Firebase控制台中导航到 **App Check**
2. 为你的Web应用注册App Check
3. 选择reCAPTCHA v3作为证明提供方
4. 配置reCAPTCHA站点密钥

**配置登录方法**:
1. 导航到 **Authentication** > **Sign-in method**
2. 启用所需的登录方法（邮箱/密码、Google等）
3. 配置授权域名，添加你的生产域名

## 🔍 安全规则说明

### Firestore安全规则特性

- **用户数据隔离**: 用户只能访问自己的数据
- **文章权限控制**: 
  - 公开文章：所有人可读
  - 私有文章：只有作者可读
  - 创建/编辑：只有认证用户
- **评论系统**: 认证用户可评论，只能编辑自己的评论
- **管理员权限**: 独立的管理员访问控制
- **数据验证**: 严格的数据格式验证

### CSP策略说明

当前CSP策略允许：
- **脚本**: 自身域名 + Firebase相关域名
- **样式**: 自身域名 + Google Fonts
- **字体**: 自身域名 + Google Fonts
- **图片**: 自身域名 + data: + HTTPS
- **连接**: Firebase API端点
- **禁止**: iframe嵌入、对象嵌入

## ⚠️ 重要提醒

1. **测试环境**: 在生产环境部署前，请在测试环境验证所有配置
2. **备份**: 部署前备份现有的Firebase规则
3. **监控**: 部署后监控应用日志，确保没有权限错误
4. **更新**: 定期检查和更新安全配置

## 🔧 故障排除

### 常见问题

1. **CSP违规错误**:
   - 检查浏览器控制台的CSP错误
   - 根据需要调整CSP策略

2. **Firestore权限被拒绝**:
   - 确认用户已正确认证
   - 检查安全规则是否正确部署
   - 验证数据结构符合规则要求

3. **API密钥错误**:
   - 确认域名限制配置正确
   - 检查API是否已启用

### 验证部署

部署完成后，可以通过以下方式验证：

1. **检查HTTP头部**:
   ```bash
   curl -I https://your-domain.com
   ```

2. **测试Firestore规则**:
   - 在Firebase控制台的规则模拟器中测试

3. **验证CSP**:
   - 检查浏览器开发者工具的安全选项卡

---

**配置完成后，你的应用将具备企业级的安全防护能力！** 🛡️