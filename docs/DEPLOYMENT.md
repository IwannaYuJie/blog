# 部署指南 🚀

本指南将帮助你将博客项目部署到生产环境。

## 📋 部署前准备

### 1. 环境检查

确保你已经完成：

- [ ] Firebase项目配置
- [ ] 本地开发测试通过
- [ ] 代码提交到Git仓库
- [ ] Firebase配置文件已正确设置

### 2. 构建检查

```bash
# 安装依赖
npm install

# 本地测试
npm run dev

# 构建检查
npm run build
```

## 🔥 Firebase 配置

### 1. 创建Firebase项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击「创建项目」
3. 输入项目名称
4. 选择是否启用Google Analytics
5. 等待项目创建完成

### 2. 启用服务

#### Firestore数据库

1. 在Firebase控制台选择「Firestore Database」
2. 点击「创建数据库」
3. 选择「测试模式」（开发阶段）
4. 选择数据库位置（推荐：asia-east1）

#### Authentication

1. 选择「Authentication」
2. 点击「开始使用」
3. 在「Sign-in method」中启用「匿名」登录

#### Analytics（可选）

1. 选择「Analytics」
2. 按提示配置Google Analytics

### 3. 获取配置信息

1. 在项目设置中找到「您的应用」
2. 点击「Web应用」图标
3. 注册应用并获取配置对象
4. 复制配置信息到 `js/firebase-config.js`

```javascript
// js/firebase-config.js
const firebaseConfig = {
  apiKey: "你的API密钥",
  authDomain: "项目ID.firebaseapp.com",
  projectId: "项目ID",
  storageBucket: "项目ID.firebasestorage.app",
  messagingSenderId: "发送者ID",
  appId: "应用ID",
  measurementId: "测量ID"
};
```

### 4. 安全规则配置

#### Firestore规则

```javascript
// 开发环境（测试模式）
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

// 生产环境（推荐）
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 文章只读
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 留言需要认证
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## 🌐 Netlify 部署

### 方法一：Git集成（推荐）

#### 1. 准备仓库

```bash
# 确保代码已推送到GitHub
git add .
git commit -m "准备部署"
git push origin main
```

#### 2. 连接Netlify

1. 访问 [Netlify](https://www.netlify.com/)
2. 注册/登录账户
3. 点击「New site from Git」
4. 选择GitHub并授权
5. 选择你的博客仓库

#### 3. 配置构建设置

```yaml
# 构建设置
Build command: npm run build
Publish directory: ./
Node version: 18
```

#### 4. 环境变量（如果需要）

在Netlify控制台的「Site settings」→「Environment variables」中添加：

```
NODE_ENV=production
```

#### 5. 部署

点击「Deploy site」，Netlify会自动：
- 克隆仓库
- 安装依赖
- 执行构建
- 部署到CDN

### 方法二：手动部署

#### 1. 准备文件

```bash
# 创建部署包
zip -r blog-deploy.zip . -x "node_modules/*" ".git/*" "*.md"
```

#### 2. 手动上传

1. 在Netlify控制台选择「Sites」
2. 拖拽zip文件到部署区域
3. 等待部署完成

### 3. 自定义域名（可选）

#### 1. 添加域名

1. 在Site settings中选择「Domain management」
2. 点击「Add custom domain」
3. 输入你的域名

#### 2. 配置DNS

```
# A记录
Type: A
Name: @
Value: 75.2.60.5

# CNAME记录
Type: CNAME
Name: www
Value: 你的站点名.netlify.app
```

#### 3. 启用HTTPS

Netlify会自动为自定义域名提供免费SSL证书。

## 📊 性能优化

### 1. 构建优化

创建 `netlify.toml` 配置文件：

```toml
[build]
  command = "npm run build"
  publish = "."

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### 2. 图片优化

```bash
# 安装图片优化工具
npm install --save-dev imagemin imagemin-webp
```

### 3. 缓存策略

```javascript
// 在main.js中添加Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW注册成功:', registration);
    })
    .catch(error => {
      console.log('SW注册失败:', error);
    });
}
```

## 🔍 监控和分析

### 1. Google Analytics

如果启用了Firebase Analytics，数据会自动同步到Google Analytics。

### 2. Netlify Analytics

在Netlify控制台启用Analytics可以获得：
- 页面访问统计
- 带宽使用情况
- 表单提交数据

### 3. 性能监控

```javascript
// 添加性能监控
window.addEventListener('load', () => {
  if ('performance' in window) {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log('页面加载时间:', loadTime + 'ms');
    
    // 发送到Analytics（如果需要）
    if (window.gtag) {
      gtag('event', 'page_load_time', {
        value: loadTime
      });
    }
  }
});
```

## 🚨 故障排除

### 常见问题

#### 1. Firebase连接失败

**症状：** 页面显示静态内容，控制台有Firebase错误

**解决方案：**
- 检查Firebase配置是否正确
- 确认Firebase服务已启用
- 检查网络连接
- 验证API密钥有效性

#### 2. 部署后样式丢失

**症状：** 页面布局混乱，CSS未加载

**解决方案：**
- 检查文件路径是否正确
- 确认所有CSS文件已上传
- 检查MIME类型设置

#### 3. 表单提交失败

**症状：** 联系表单无法提交

**解决方案：**
- 检查Firestore权限设置
- 确认用户已通过匿名认证
- 查看浏览器控制台错误信息

### 调试工具

```javascript
// 添加调试信息
function debugInfo() {
  console.log('🔍 调试信息:');
  console.log('- Firebase状态:', window.firebaseApp ? '已连接' : '未连接');
  console.log('- 当前用户:', currentUser ? '已认证' : '未认证');
  console.log('- 网络状态:', navigator.onLine ? '在线' : '离线');
  console.log('- 用户代理:', navigator.userAgent);
}

// 在控制台调用
// debugInfo();
```

## 📈 部署后检查清单

部署完成后，请检查：

- [ ] 网站可以正常访问
- [ ] 所有页面加载正常
- [ ] Firebase功能正常工作
- [ ] 表单可以正常提交
- [ ] 移动端显示正常
- [ ] 图片和资源加载正常
- [ ] HTTPS证书有效
- [ ] SEO标签正确
- [ ] 性能指标良好

## 🔄 持续部署

Netlify支持自动部署：

1. **推送触发**：每次推送到main分支自动部署
2. **预览部署**：PR会创建预览链接
3. **回滚功能**：可以快速回滚到之前版本

```bash
# 部署新版本
git add .
git commit -m "更新功能"
git push origin main
# Netlify会自动检测并部署
```

---

恭喜！你的博客现在已经成功部署到生产环境 🎉

如果遇到问题，请查看 [故障排除指南](./TROUBLESHOOTING.md) 或提交issue。