# API 文档 📚

本文档描述了博客项目中的主要API和函数接口。

## 🔥 Firebase 配置

### firebase-config.js

#### 配置对象

```javascript
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

#### 全局对象

```javascript
window.firebaseApp = {
  analytics,  // Firebase Analytics实例
  db,        // Firestore数据库实例
  auth,      // Firebase Auth实例
  firebase   // Firebase核心实例
};
```

## 📖 主要函数 API

### main.js

#### 初始化函数

##### `waitForFirebase()`

等待Firebase服务加载完成。

```javascript
function waitForFirebase(): Promise<void>
```

**返回值：** Promise，Firebase加载完成时resolve

**超时：** 5秒（50次尝试 × 100ms）

**示例：**
```javascript
try {
    await waitForFirebase();
    console.log('Firebase加载成功');
} catch (error) {
    console.error('Firebase加载超时');
}
```

##### `initializeApp()`

初始化整个应用。

```javascript
async function initializeApp(): Promise<void>
```

**功能：**
- 显示加载状态
- 等待Firebase加载
- 执行匿名登录
- 设置认证状态监听
- 加载文章列表

#### 文章管理

##### `loadPosts(reset?)`

从Firestore加载文章。

```javascript
async function loadPosts(reset: boolean = false): Promise<void>
```

**参数：**
- `reset` (boolean): 是否重置文章列表

**功能：**
- 支持分页加载
- 支持分类筛选
- 自动错误处理
- 加载状态管理

**Firestore查询：**
```javascript
// 全部文章
db.collection('posts')
  .orderBy('createdAt', 'desc')
  .limit(postsPerPage)

// 分类筛选
db.collection('posts')
  .where('category', '==', currentCategory)
  .orderBy('createdAt', 'desc')
  .limit(postsPerPage)
```

##### `displayPost(post)`

显示单篇文章。

```javascript
function displayPost(post: Object): void
```

**参数：**
```javascript
post = {
  id: string,
  title: string,
  content: string,
  excerpt: string,
  category: string,
  createdAt: Timestamp,
  readTime: number
}
```



#### 用户交互

##### `handleContactForm(e)`

处理联系表单提交。

```javascript
async function handleContactForm(e: Event): Promise<void>
```

**表单数据结构：**
```javascript
{
  name: string,
  email: string,
  message: string,
  timestamp: Timestamp
}
```

**Firestore存储：**
```javascript
db.collection('messages').add(data)
```

#### 工具函数

##### `getCategoryIcon(category)`

获取分类图标。

```javascript
function getCategoryIcon(category: string): string
```

**映射关系：**
- `tech` → `fa-code`
- `life` → `fa-heart`
- `thoughts` → `fa-lightbulb`
- 默认 → `fa-file-alt`

##### `getCategoryName(category)`

获取分类中文名称。

```javascript
function getCategoryName(category: string): string
```

**映射关系：**
- `tech` → `技术`
- `life` → `生活`
- `thoughts` → `思考`
- 默认 → `其他`

##### `formatDate(date)`

格式化日期显示。

```javascript
function formatDate(date: Date | Timestamp): string
```

**返回格式：** `YYYY年MM月DD日`

## 🌐 全局变量

```javascript
// 应用状态
let currentUser = null;      // 当前用户
let lastVisible = null;      // 分页游标
let isLoading = false;       // 加载状态
let currentCategory = 'all'; // 当前分类
const postsPerPage = 6;      // 每页文章数

// Firebase服务实例
let db, auth, analytics;
```

## 📱 DOM 元素引用

```javascript
const postsContainer = document.getElementById('posts-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const contactForm = document.getElementById('contact-form');
const backToTopBtn = document.getElementById('back-to-top');
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');
```

## 🎯 事件监听

### 文章筛选

```javascript
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentCategory = e.target.dataset.category;
        loadPosts(true);
    });
});
```

### 加载更多

```javascript
loadMoreBtn.addEventListener('click', () => {
    loadPosts(false);
});
```

### 联系表单

```javascript
contactForm.addEventListener('submit', handleContactForm);
```

## 🔒 错误处理

所有异步函数都包含try-catch错误处理：

```javascript
try {
    // 主要逻辑
} catch (error) {
    console.error('操作失败:', error);
    // 备用方案或用户提示
}
```

## 📊 性能优化

- **分页加载**：每次只加载6篇文章
- **图片懒加载**：使用CSS和JavaScript优化
- **防抖处理**：避免重复请求
- **缓存策略**：利用Firebase缓存

## 🔧 调试

开发模式下，控制台会输出详细日志：

```javascript
console.log('🔥 Firebase服务加载成功');
console.log('📖 开始加载文章...');
console.log('✅ 成功加载 X 篇文章');
console.log('🎉 文章加载完成');
```

---

更多技术细节请参考源代码注释 📝