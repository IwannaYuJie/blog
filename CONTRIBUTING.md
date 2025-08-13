# 贡献指南 🤝

感谢你对这个项目的兴趣！俺们欢迎各种形式的贡献。

## 🚀 如何贡献

### 报告Bug 🐛

如果你发现了bug，请创建一个issue并包含以下信息：

- **Bug描述**：清楚地描述问题
- **重现步骤**：详细的重现步骤
- **期望行为**：你期望发生什么
- **实际行为**：实际发生了什么
- **环境信息**：浏览器版本、操作系统等
- **截图**：如果适用的话

### 功能请求 ✨

如果你有新功能的想法：

1. 先检查是否已有相关issue
2. 创建新issue描述功能需求
3. 说明为什么这个功能有用
4. 如果可能，提供实现思路

### 代码贡献 💻

#### 开发环境设置

1. Fork这个仓库
2. 克隆你的fork：
   ```bash
   git clone https://github.com/你的用户名/blog.git
   cd blog
   ```

3. 安装依赖：
   ```bash
   npm install
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

#### 开发流程

1. **创建分支**：
   ```bash
   git checkout -b feature/你的功能名
   # 或者
   git checkout -b fix/bug修复名
   ```

2. **编写代码**：
   - 遵循现有的代码风格
   - 添加必要的注释
   - 确保代码可读性

3. **测试**：
   - 在多个浏览器中测试
   - 检查响应式设计
   - 验证Firebase功能

4. **提交代码**：
   ```bash
   git add .
   git commit -m "类型: 简短描述"
   ```

   提交信息格式：
   - `feat: 新功能`
   - `fix: bug修复`
   - `docs: 文档更新`
   - `style: 样式调整`
   - `refactor: 代码重构`
   - `test: 测试相关`

5. **推送并创建PR**：
   ```bash
   git push origin 你的分支名
   ```

#### Pull Request指南

- **标题**：清楚地描述你的更改
- **描述**：详细说明你做了什么以及为什么
- **测试**：说明你如何测试了这些更改
- **截图**：如果有UI更改，请提供截图

## 📝 代码规范

### JavaScript

- 使用ES6+语法
- 使用有意义的变量名
- 函数应该单一职责
- 添加适当的错误处理

```javascript
// 好的例子
async function loadArticles() {
    try {
        const articles = await fetchFromFirestore();
        displayArticles(articles);
    } catch (error) {
        console.error('加载文章失败:', error);
        showErrorMessage();
    }
}

// 避免
function load() {
    // 没有错误处理的代码
}
```

### CSS

- 使用CSS变量进行主题管理
- 遵循BEM命名规范
- 移动端优先的响应式设计

```css
/* 好的例子 */
.article-card {
    /* 样式 */
}

.article-card__title {
    /* 样式 */
}

.article-card--featured {
    /* 样式 */
}
```

### HTML

- 语义化标签
- 适当的ARIA属性
- 优化SEO

## 🧪 测试

在提交PR之前，请确保：

- [ ] 代码在Chrome、Firefox、Safari中正常工作
- [ ] 移动端显示正常
- [ ] Firebase功能正常
- [ ] 没有控制台错误
- [ ] 加载性能良好

## 📚 文档

如果你的更改影响了用户界面或API：

- 更新README.md
- 添加代码注释
- 更新相关文档

## 🎯 优先级

我们特别欢迎以下类型的贡献：

1. **性能优化** 🚀
2. **可访问性改进** ♿
3. **移动端体验优化** 📱
4. **新功能开发** ✨
5. **Bug修复** 🐛
6. **文档完善** 📖

## 💬 交流

- 通过GitHub Issues讨论
- 在PR中进行代码review
- 保持友好和建设性的交流

## 📄 许可证

通过贡献代码，你同意你的贡献将在MIT许可证下发布。

---

再次感谢你的贡献！每一个贡献都让这个项目变得更好 🙏