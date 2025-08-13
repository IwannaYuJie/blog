// 由于模块导入问题，我们使用CDN方式加载Firebase
// Firebase将通过script标签在HTML中加载

// 全局变量
let currentUser = null;
let lastVisible = null;
let isLoading = false;
let currentCategory = 'all';
const postsPerPage = 6;
let db, auth, analytics; // 这些将从window.firebaseApp获取

// 等待Firebase加载完成（带超时机制）
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5秒超时
        
        function checkFirebase() {
            if (window.firebaseApp) {
                db = window.firebaseApp.db;
                auth = window.firebaseApp.auth;
                analytics = window.firebaseApp.analytics;
                console.log('🔥 Firebase服务加载成功');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.warn('⚠️ Firebase加载超时，使用静态内容');
                reject(new Error('Firebase加载超时'));
            } else {
                attempts++;
                setTimeout(checkFirebase, 100);
            }
        }
        
        checkFirebase();
    });
}

// DOM元素
const postsContainer = document.getElementById('posts-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const contactForm = document.getElementById('contact-form');
const backToTopBtn = document.getElementById('back-to-top');
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    setupNavigation();
    setupScrollEffects();
});

// 应用初始化
async function initializeApp() {
    // 显示加载状态
    postsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>正在加载文章...</p></div>';
    
    try {
        // 等待Firebase加载（带超时）
        await waitForFirebase();
        
        // 匿名登录Firebase
        await auth.signInAnonymously();
        console.log('✅ Firebase初始化成功');
        
        // 监听认证状态
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                // 创建示例文章（如果数据库为空）
                await createSamplePosts();
                // 加载文章
                await loadPosts(true);
            }
        });
        
    } catch (error) {
        console.error('❌ Firebase初始化失败:', error);
        // 如果Firebase失败，显示静态内容
        displayStaticPosts();
    }
}

// 创建示例文章
async function createSamplePosts() {
    try {
        const postsRef = db.collection('posts');
        const snapshot = await postsRef.limit(1).get();
        
        // 如果没有文章，创建示例文章
        if (snapshot.empty) {
            const samplePosts = [
                {
                    title: '欢迎来到我的博客！🎉',
                    excerpt: '这是我的第一篇博客文章，分享我的技术学习之路和生活感悟。',
                    content: '欢迎来到我的个人博客！在这里，我会分享我的技术学习心得、项目经验和生活感悟。希望我的文章能够对你有所帮助。',
                    category: 'life',
                    author: '博主',
                    createdAt: new Date(),
                    tags: ['欢迎', '介绍', '博客'],
                    readTime: 2
                },
                {
                    title: 'JavaScript ES6+ 新特性详解',
                    excerpt: '深入了解JavaScript ES6+的新特性，包括箭头函数、解构赋值、模板字符串等。',
                    content: 'ES6+为JavaScript带来了许多强大的新特性，让代码更加简洁和优雅。本文将详细介绍这些新特性的使用方法。',
                    category: 'tech',
                    author: '博主',
                    createdAt: new Date(Date.now() - 86400000), // 1天前
                    tags: ['JavaScript', 'ES6', '前端'],
                    readTime: 8
                },
                {
                    title: '如何构建现代化的Web应用',
                    excerpt: '从项目规划到部署上线，全面介绍现代Web应用的开发流程和最佳实践。',
                    content: '现代Web应用开发涉及多个方面，包括前端框架选择、后端架构设计、数据库优化等。本文将分享我的经验和心得。',
                    category: 'tech',
                    author: '博主',
                    createdAt: new Date(Date.now() - 172800000), // 2天前
                    tags: ['Web开发', '架构', '最佳实践'],
                    readTime: 12
                },
                {
                    title: '程序员的自我修养',
                    excerpt: '作为程序员，除了技术能力，还需要培养哪些软技能？分享我的思考和建议。',
                    content: '技术能力固然重要，但作为程序员，我们还需要具备良好的沟通能力、学习能力和解决问题的思维方式。',
                    category: 'thoughts',
                    author: '博主',
                    createdAt: new Date(Date.now() - 259200000), // 3天前
                    tags: ['程序员', '成长', '思考'],
                    readTime: 6
                },
                {
                    title: '我的编程学习之路',
                    excerpt: '回顾我从编程小白到现在的学习历程，分享一些学习心得和踩过的坑。',
                    content: '学习编程是一个漫长而充实的过程。在这篇文章中，我想分享我的学习经历，希望能给初学者一些启发。',
                    category: 'life',
                    author: '博主',
                    createdAt: new Date(Date.now() - 345600000), // 4天前
                    tags: ['学习', '经验', '分享'],
                    readTime: 10
                },
                {
                    title: 'Firebase实战：构建实时Web应用',
                    excerpt: '使用Firebase构建实时Web应用的完整指南，包括认证、数据库和部署。',
                    content: 'Firebase是Google提供的强大后端服务平台，可以帮助开发者快速构建高质量的Web和移动应用。',
                    category: 'tech',
                    author: '博主',
                    createdAt: new Date(Date.now() - 432000000), // 5天前
                    tags: ['Firebase', '实时应用', '后端'],
                    readTime: 15
                }
            ];
            
            for (const post of samplePosts) {
                await postsRef.add(post);
            }
            
            console.log('✅ 示例文章创建成功');
        }
    } catch (error) {
        console.error('❌ 创建示例文章失败:', error);
    }
}

// 加载文章
async function loadPosts(reset = false) {
    if (isLoading) return;
    
    isLoading = true;
    console.log('📖 开始加载文章...');
    
    try {
        if (reset) {
            postsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>正在加载文章...</p></div>';
            lastVisible = null;
        }
        
        const postsRef = db.collection('posts');
        let q;
        
        if (currentCategory === 'all') {
            q = postsRef
                .orderBy('createdAt', 'desc')
                .limit(postsPerPage);
        } else {
            q = postsRef
                .where('category', '==', currentCategory)
                .orderBy('createdAt', 'desc')
                .limit(postsPerPage);
        }
        
        if (lastVisible && !reset) {
            q = q.startAfter(lastVisible);
        }
        
        const snapshot = await q.get();
        
        if (reset) {
            postsContainer.innerHTML = '';
        }
        
        if (snapshot.empty && reset) {
            postsContainer.innerHTML = '<div class="no-posts"><p>暂无文章</p></div>';
            loadMoreBtn.style.display = 'none';
            console.log('📄 数据库中暂无文章');
            return;
        }
        
        console.log(`✅ 成功加载 ${snapshot.size} 篇文章`);
        
        snapshot.forEach((doc) => {
            const post = { id: doc.id, ...doc.data() };
            displayPost(post);
        });
        
        // 更新lastVisible
        if (!snapshot.empty) {
            lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }
        
        // 控制加载更多按钮显示
        loadMoreBtn.style.display = snapshot.size < postsPerPage ? 'none' : 'block';
        console.log('🎉 文章加载完成');
        
    } catch (error) {
        console.error('❌ 加载文章失败:', error);
        if (reset) {
            displayStaticPosts();
        }
    } finally {
        isLoading = false;
    }
}

// 显示文章
function displayPost(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card fade-in-up';
    postElement.innerHTML = `
        <div class="post-image">
            <i class="fas ${getCategoryIcon(post.category)}"></i>
        </div>
        <div class="post-content">
            <span class="post-category">${getCategoryName(post.category)}</span>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-excerpt">${post.excerpt}</p>
            <div class="post-meta">
                <span><i class="fas fa-clock"></i> ${post.readTime || 5} 分钟阅读</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(post.createdAt)}</span>
            </div>
        </div>
    `;
    
    postElement.addEventListener('click', () => {
        openPostModal(post);
    });
    
    postsContainer.appendChild(postElement);
}

// 显示静态文章（Firebase失败时的备用方案）
function displayStaticPosts() {
    const staticPosts = [
        {
            id: '1',
            title: '欢迎来到我的博客！🎉',
            excerpt: '这是我的第一篇博客文章，分享我的技术学习之路和生活感悟。',
            category: 'life',
            readTime: 2,
            createdAt: new Date()
        },
        {
            id: '2',
            title: 'JavaScript ES6+ 新特性详解',
            excerpt: '深入了解JavaScript ES6+的新特性，包括箭头函数、解构赋值、模板字符串等。',
            category: 'tech',
            readTime: 8,
            createdAt: new Date(Date.now() - 86400000)
        },
        {
            id: '3',
            title: '程序员的自我修养',
            excerpt: '作为程序员，除了技术能力，还需要培养哪些软技能？分享我的思考和建议。',
            category: 'thoughts',
            readTime: 6,
            createdAt: new Date(Date.now() - 172800000)
        }
    ];
    
    postsContainer.innerHTML = '';
    staticPosts.forEach(post => displayPost(post));
    loadMoreBtn.style.display = 'none';
}

// 打开文章模态框
function openPostModal(post) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'post-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${post.title}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="post-meta">
                    <span class="post-category">${getCategoryName(post.category)}</span>
                    <span><i class="fas fa-clock"></i> ${post.readTime || 5} 分钟阅读</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(post.createdAt)}</span>
                </div>
                <div class="post-content">
                    <p>${post.content || post.excerpt}</p>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .post-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 20px;
        }
        .modal-content {
            background: white;
            border-radius: 8px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .modal-body {
            padding: 20px;
        }
        .modal-body .post-meta {
            margin-bottom: 20px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        .modal-body .post-content {
            line-height: 1.8;
            font-size: 16px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // 关闭模态框
    const closeModal = () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 文章过滤器
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            loadPosts(true);
        });
    });
    
    // 加载更多按钮
    loadMoreBtn.addEventListener('click', () => {
        loadPosts(false);
    });
    
    // 联系表单
    contactForm.addEventListener('submit', handleContactForm);
    
    // 移动端菜单
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// 处理联系表单
async function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        createdAt: new Date()
    };
    
    try {
        await db.collection('messages').add(data);
        alert('✅ 消息发送成功！感谢您的留言。');
        contactForm.reset();
    } catch (error) {
        console.error('❌ 发送消息失败:', error);
        alert('❌ 发送失败，请稍后重试。');
    }
}

// 设置导航
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 移除所有active类
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加active类到当前链接
            link.classList.add('active');
            
            // 滚动到目标部分
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 70; // 考虑导航栏高度
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
            
            // 关闭移动端菜单
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// 设置滚动效果
function setupScrollEffects() {
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        
        // 返回顶部按钮
        if (scrollTop > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
        
        // 导航栏背景
        const navbar = document.querySelector('.navbar');
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
    
    // 返回顶部
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 工具函数
function getCategoryIcon(category) {
    const icons = {
        tech: 'fa-code',
        life: 'fa-heart',
        thoughts: 'fa-lightbulb',
        default: 'fa-file-alt'
    };
    return icons[category] || icons.default;
}

function getCategoryName(category) {
    const names = {
        tech: '技术',
        life: '生活',
        thoughts: '思考',
        default: '其他'
    };
    return names[category] || names.default;
}

function formatDate(date) {
    if (!date) return '未知时间';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    
    return d.toLocaleDateString('zh-CN');
}

// 导出函数供其他模块使用
window.blogApp = {
    loadPosts,
    displayPost,
    getCategoryName,
    formatDate
};

console.log('🚀 博客应用初始化完成');