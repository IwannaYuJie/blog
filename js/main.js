// 由于模块导入问题，我们使用CDN方式加载Firebase
// Firebase将通过script标签在HTML中加载

// ========================================
// 横幅视差滚动和动画效果
// ========================================

// 视差滚动效果
function initParallaxEffects() {
    const hero = document.querySelector('.hero');
    const heroShapes = document.querySelectorAll('.hero-shape');
    const heroFloatingElements = document.querySelectorAll('.hero-floating-element');
    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual');
    
    if (!hero) return;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        const rateShapes = scrolled * -0.3;
        const rateFloating = scrolled * -0.2;
        
        // 主背景视差
        hero.style.transform = `translateY(${rate}px)`;
        
        // 几何图形视差
        heroShapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.1;
            shape.style.transform = `translateY(${rateShapes * speed}px) rotate(${scrolled * 0.05}deg)`;
        });
        
        // 浮动元素视差
        heroFloatingElements.forEach((element, index) => {
            const speed = (index + 1) * 0.15;
            element.style.transform = `translateY(${rateFloating * speed}px) rotate(${scrolled * 0.02}deg)`;
        });
        
        // 内容区域视差
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.1}px)`;
        }
        
        if (heroVisual) {
            heroVisual.style.transform = `translateY(${scrolled * 0.05}px)`;
        }
    }
    
    // 节流函数优化性能
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
            setTimeout(() => { ticking = false; }, 16); // 60fps
        }
    }
    
    // 监听滚动事件
    window.addEventListener('scroll', requestTick, { passive: true });
}

// 横幅元素进入动画
function initHeroAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // 观察需要动画的元素
    const animateElements = document.querySelectorAll('.hero-badge, .hero-title, .hero-subtitle, .hero-stats, .hero-buttons, .hero-visual');
    animateElements.forEach(el => observer.observe(el));
}

// 技术图标悬停效果
function initTechIconEffects() {
    const techIcons = document.querySelectorAll('.tech-icon');
    
    techIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.2) rotate(10deg)';
            icon.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = '';
            icon.style.boxShadow = '';
        });
    });
}

// CTA按钮点击波纹效果
function initButtonRippleEffect() {
    const ctaButtons = document.querySelectorAll('.hero-cta-primary, .hero-cta-secondary');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // 添加波纹动画CSS
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 滚动指示器点击效果
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');
    
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const postsSection = document.querySelector('#posts');
            if (postsSection) {
                postsSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
        
        scrollIndicator.style.cursor = 'pointer';
    }
}

// 全局变量
let currentUser = null;
let lastVisible = null;
let isLoading = false;
let currentCategory = 'all';

const postsPerPage = 6;

let db = null;
let auth = null;
let analytics = null;
let currentEditingPostId = null; // 当前编辑的文章ID
let deletePostId = null; // 待删除的文章ID

// 管理员邮箱配置
const ADMIN_EMAIL = '958656603@qq.com';

/**
 * 检查当前用户是否为管理员
 * @returns {boolean} 如果用户是管理员返回true，否则返回false
 */
function isAdmin() {
    const globalCurrentUser = currentUser;
    const authCurrentUser = auth?.currentUser;
    const effectiveUser = globalCurrentUser || authCurrentUser;
    
    if (!effectiveUser || !effectiveUser.email) {
        return false;
    }
    
    return effectiveUser.email === ADMIN_EMAIL;
}

// 等待Firebase加载完成（带超时机制）
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5秒超时
        
        function checkFirebase() {
            if (window.firebaseApp) {
                // Firebase服务已在firebase-config.js中初始化并声明为全局变量
                // Firebase服务加载成功
                resolve();
            } else if (attempts >= maxAttempts) {
                // Firebase加载超时
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

// 文章管理相关DOM元素
const addPostBtn = document.getElementById('add-post-btn');
const adminPanel = document.getElementById('admin-panel');
const postForm = document.getElementById('post-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const deleteModalClose = document.getElementById('delete-modal-close');

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化页面加载器
    initPageLoader();
    
    // 初始化主题管理器（优先初始化，避免闪烁）
    initThemeManager();
    
    // 初始化横幅效果
    initParallaxEffects();
    initHeroAnimations();
    initTechIconEffects();
    initButtonRippleEffect();
    initScrollIndicator();
    
    // 初始化滚动动画系统
    initScrollAnimations();
    initScrollProgress();
    initBackToTop();
    initSmoothScrolling();
    
    // 等待微交互系统初始化完成
    if (window.microInteractions) {
        // 微交互系统已就绪
    }
    
    await initializeApp();
    setupEventListeners();
    setupAdminEventListeners();
});

// 应用初始化
async function initializeApp() {
    // 显示骨架屏加载状态
    if (window.loadingErrorHandler) {
        window.loadingErrorHandler.showSkeletonPosts(postsContainer, 3);
    } else {
        postsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>正在加载文章...</p></div>';
    }
    
    try {
        // 等待Firebase加载（带超时）
        await waitForFirebase();
        
        // Firebase初始化成功
        
        // 从window.firebaseApp获取Firebase服务
        if (window.firebaseApp) {
            db = window.firebaseApp.db;
            auth = window.firebaseApp.auth;
            analytics = window.firebaseApp.analytics;
            
            // Firebase服务连接成功
            
            // 使用AuthManager的认证状态监听器
            // 检查AuthManager
            if (window.authManager) {
                window.authManager.addAuthStateListener((user) => {
                    currentUser = user;
                    updateUIPermissions(); // 更新UI权限
                    // 重新加载文章以更新按钮显示
                    if (postsContainer && postsContainer.children.length > 0) {
                        loadPosts(true); // 重新加载文章列表以更新权限显示
                    }
                    // 用户状态变化
                });
                // AuthManager监听器已设置
            } else {
                // AuthManager未找到，回退到直接监听auth
                // 回退方案：直接监听auth
                if (auth) {
                    auth.onAuthStateChanged((user) => {
                        currentUser = user;
                        updateUIPermissions();
                        // 重新加载文章以更新按钮显示
                        if (postsContainer && postsContainer.children.length > 0) {
                            loadPosts(true); // 重新加载文章列表以更新权限显示
                        }
                        // 用户状态变化(回退)
                    });
                }
            }
        }
        
        // 尝试连接Firestore
        if (db) {
            try {
                await loadPosts(true);
        
                updateUIPermissions(); // 初始化UI权限状态
            } catch (firestoreError) {
                // Firestore连接失败
                
                // 显示Firestore连接错误
                if (window.loadingErrorHandler) {
                    window.loadingErrorHandler.showErrorState(
                        postsContainer,
                        '数据库连接失败',
                        'Firestore数据库连接失败，请检查网络连接或稍后重试。',
                        true
                    );
                }
            }
        } else {
            // Firestore不可用
            
            // 显示服务不可用错误
            if (window.loadingErrorHandler) {
                window.loadingErrorHandler.showErrorState(
                    postsContainer,
                    '服务不可用',
                    '数据库服务暂时不可用，请稍后重试。',
                    true
                );
            }
        }
        
    } catch (error) {
        // Firebase初始化失败
        
        // 显示Firebase初始化错误
        if (window.loadingErrorHandler) {
            let errorMessage = 'Firebase服务初始化失败，请刷新页面重试。';
            if (error.message === 'Firebase加载超时') {
                errorMessage = 'Firebase服务加载超时，请检查网络连接后刷新页面。';
            }
            
            window.loadingErrorHandler.showErrorState(
                postsContainer,
                '初始化失败',
                errorMessage,
                true
            );
        } else {
            postsContainer.innerHTML = '<div class="error-message"><p>初始化失败，请刷新页面重试。</p></div>';
        }
    }
}





// 加载文章（优化版）
async function loadPosts(reset = false) {
    if (isLoading) return;
    
    isLoading = true;
    // 开始加载文章
    
    try {
        if (reset) {
            // 显示骨架屏而不是简单的加载提示
            if (window.loadingErrorHandler) {
                window.loadingErrorHandler.showSkeletonPosts(postsContainer, 3);
            } else {
                postsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>正在加载文章...</p></div>';
            }
            lastVisible = null;
        }
        
        // 检查数据库连接
        if (!db) {
            // Firestore未初始化
            return;
        }
        
        const postsRef = db.collection('posts');
        let q;
        
        // 构建查询（添加索引优化）
        // 根据分类筛选条件构建查询
        if (currentCategory === 'all') {
            // 显示所有文章
            q = postsRef
                .orderBy('createdAt', 'desc')
                .limit(postsPerPage);
        } else {
            // 按分类筛选
            q = postsRef
                .where('category', '==', currentCategory)
                .orderBy('createdAt', 'desc')
                .limit(postsPerPage);
        }
        
        if (lastVisible && !reset) {
            q = q.startAfter(lastVisible);
        }
        
        // 添加超时处理
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('查询超时')), 10000);
        });
        
        const snapshot = await Promise.race([q.get(), timeoutPromise]);
        
        if (reset) {
            postsContainer.innerHTML = '';
        }
        
        if (snapshot.empty && reset) {
            // 显示空状态而不是简单的文本
            if (window.loadingErrorHandler) {
                window.loadingErrorHandler.showEmptyState(
                    postsContainer, 
                    '暂无文章', 
                    '还没有发布任何文章，请稍后再来查看。',
                    true
                );
            } else {
                postsContainer.innerHTML = '<div class="no-posts"><p>暂无文章</p></div>';
            }
            loadMoreBtn.style.display = 'none';
            console.log('📄 数据库中暂无文章');
            return;
        }
        
        // console.log(`✅ 成功加载 ${snapshot.size} 篇文章`);
        
        // 批量处理文档数据
        const posts = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // 数据验证和清理
            const post = {
                id: doc.id,
                title: data.title || '无标题',
                excerpt: data.excerpt || '',
                content: data.content || '',
                category: data.category || 'life',
                author: data.author || '博主',
                authorId: data.authorId || '', // 确保包含authorId字段
                createdAt: data.createdAt,
                tags: Array.isArray(data.tags) ? data.tags : [],
                readTime: data.readTime || 5
            };
            posts.push(post);
        });
        
        // console.log('📋 文章数据处理完成，包含authorId字段:', posts.map(p => ({ id: p.id, authorId: p.authorId })));
        
        // 批量渲染文章
        posts.forEach(post => displayPost(post));
        
        // 增强新加载文章的动画效果
        setTimeout(() => {
            if (window.ScrollAnimations) {
                window.ScrollAnimations.enhancePostCardAnimations();
            }
        }, 100);
        
        // 更新lastVisible
        if (!snapshot.empty) {
            lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }
        
        // 控制加载更多按钮显示
        loadMoreBtn.style.display = snapshot.size < postsPerPage ? 'none' : 'block';
        // console.log('🎉 文章加载完成');
        
    } catch (error) {
        // console.error('❌ 加载文章失败:', error);
        
        // 根据错误类型提供不同的处理和显示
        let errorTitle = '加载失败';
        let errorMessage = '抱歉，文章加载失败。请检查网络连接后重试。';
        
        if (error.code === 'permission-denied') {
            errorTitle = '权限不足';
            errorMessage = '抱歉，您没有权限访问这些内容。';
            // console.warn('⚠️ 权限不足');
        } else if (error.code === 'unavailable') {
            errorTitle = '服务不可用';
            errorMessage = '服务暂时不可用，请稍后重试。';
            // console.warn('⚠️ 服务不可用');
        } else if (error.message === '查询超时') {
            errorTitle = '加载超时';
            errorMessage = '加载时间过长，请检查网络连接后重试。';
            // console.warn('⚠️ 查询超时');
        } else {
            // console.warn('⚠️ 网络错误');
        }
        
        // 显示错误状态
        if (reset && window.loadingErrorHandler) {
            window.loadingErrorHandler.showErrorState(
                postsContainer,
                errorTitle,
                errorMessage,
                true
            );
        } else if (reset) {
            postsContainer.innerHTML = `<div class="error-message"><p>${errorMessage}</p></div>`;
        }
        
        // 隐藏加载更多按钮
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    } finally {
        isLoading = false;
    }
}

// 显示文章
function displayPost(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card fade-in-up';
    
    // 增强权限检查逻辑 - 添加详细调试信息和多重验证
    const hasCurrentUser = !!currentUser;
    const hasAuthorId = !!post.authorId;
    const userUid = currentUser?.uid;
    const authorId = post.authorId;
    
    // 多重验证：检查全局currentUser和auth.currentUser
    const authCurrentUser = auth?.currentUser;
    const authUserUid = authCurrentUser?.uid;
    
    // 权限判断：优先使用全局currentUser，回退到auth.currentUser
    const effectiveUser = currentUser || authCurrentUser;
    const effectiveUid = userUid || authUserUid;
    const isAuthor = effectiveUser && hasAuthorId && effectiveUid === authorId;
    const isUserAdmin = isAdmin(); // 检查是否为管理员
    
    // 强制检查：如果没有有效用户但auth中有用户，更新全局currentUser
    if (!currentUser && authCurrentUser) {
        // console.log('🔄 检测到用户状态不同步，正在更新全局currentUser');
        window.currentUser = authCurrentUser;
    }
    
    // 详细的调试日志
    // console.log('🔍 权限检查详情:', {
    //     hasCurrentUser,
    //     hasAuthorId,
    //     userUid,
    //     authUserUid,
    //     effectiveUid,
    //     authorId,
    //     isAuthor,
    //     postTitle: post.title,
    //     currentUserEmail: currentUser?.email,
    //     authUserEmail: authCurrentUser?.email
    // });
    
    // 如果没有用户登录或没有作者ID，记录警告
    if (!effectiveUser) {
        // console.warn('⚠️ 用户未登录，无法显示编辑/删除按钮');
    }
    if (!hasAuthorId) {
        // console.warn('⚠️ 文章缺少作者ID，无法进行权限检查:', post.title);
    }
    
    // 如果用户已登录但不是作者，添加友好提示
    if (effectiveUser && hasAuthorId && !isAuthor) {
        // console.log('ℹ️ 当前用户不是文章作者，无编辑权限');
    }
    
    // 作者或管理员才显示编辑和删除按钮
    const actionButtons = (isAuthor || isUserAdmin) ? `
        <div class="post-actions">
            <button class="action-btn edit" onclick="editPost('${post.id}')" title="编辑文章">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" onclick="confirmDeletePost('${post.id}')" title="删除文章">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    ` : '';
    
    // 显示作者信息 - 优先使用authorDisplayName，然后是author字段，最后是email前缀
    const authorInfo = post.authorDisplayName || post.author || (post.authorEmail ? post.authorEmail.split('@')[0] : '匿名用户');
    
    postElement.innerHTML = `
        ${actionButtons}
        <div class="post-image">
            <i class="fas ${getCategoryIcon(post.category)}"></i>
        </div>
        <div class="post-content">
            <span class="post-category">${getCategoryName(post.category)}</span>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-excerpt">${post.excerpt}</p>
            <div class="post-meta">
                <span><i class="fas fa-user"></i> ${authorInfo}</span>
                <span><i class="fas fa-clock"></i> ${post.readTime || 5} 分钟阅读</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(post.createdAt)}</span>
            </div>
        </div>
    `;
    
    postElement.addEventListener('click', (e) => {
        // 如果点击的是操作按钮，不打开模态框
        if (e.target.closest('.post-actions')) {
            return;
        }
        openPostModal(post);
    });
    
    postsContainer.appendChild(postElement);
}

// 网络状态检测
// 网络状态检查功能已删除

// 网络状态指示器功能已删除

// 静态文章显示功能已删除

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
                    <span><i class="fas fa-user"></i> ${post.authorDisplayName || post.author || (post.authorEmail ? post.authorEmail.split('@')[0] : '匿名用户')}</span>
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
        
        // 防止背景滚动
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });
    
    // 点击菜单项时关闭移动端菜单
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
    
    // 设置导航和滚动效果
    setupNavigation();
    setupScrollEffects();
    
    // 监听网络恢复事件
    window.addEventListener('networkRestored', () => {
        // console.log('🌐 网络恢复，重新加载数据');
        loadPosts(true);
    });
    
    // 监听重试请求事件
    window.addEventListener('retryRequested', () => {
        // console.log('🔄 用户请求重试');
        loadPosts(true);
    });
}

// 处理联系表单
async function handleContactForm(e) {
    e.preventDefault();
    
    const submitBtn = contactForm.querySelector('.form-submit');
    const originalText = submitBtn.innerHTML;
    
    // 显示加载状态
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="btn-spinner"></div><span class="btn-text">发送中...</span>';
    
    // 微交互反馈
    if (window.microInteractions) {
        window.microInteractions.showLoadingState(submitBtn);
    }
    
    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        createdAt: new Date()
    };
    
    try {
        // 检查数据库连接
        if (!db) {
            throw new Error('数据库未初始化');
        }
        
        // 添加超时处理
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('发送超时')), 10000);
        });
        
        const sendPromise = db.collection('messages').add(data);
        await Promise.race([sendPromise, timeoutPromise]);
        
        // 显示成功状态
        submitBtn.innerHTML = '<i class="btn-success-icon fas fa-check"></i><span class="btn-text">发送成功</span>';
        
        // 微交互成功反馈
        if (window.microInteractions) {
            window.microInteractions.hideLoadingState(submitBtn);
            window.microInteractions.showSuccessFeedback(submitBtn, '消息发送成功');
        }
        
        // 显示成功提示
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showSuccessToast('消息发送成功！感谢您的留言。');
        } else {
            alert('✅ 消息发送成功！感谢您的留言。');
        }
        
        contactForm.reset();
        
        // 恢复按钮状态
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        // console.error('❌ 发送消息失败:', error);
        
        let errorMessage = '发送失败，请稍后重试。';
        if (error.code === 'permission-denied') {
            errorMessage = '权限不足，无法发送消息。';
        } else if (error.code === 'unavailable') {
            errorMessage = '服务暂时不可用，请稍后重试。';
        } else if (error.message === '发送超时') {
            errorMessage = '发送超时，请检查网络连接后重试。';
        } else if (error.message === '数据库未初始化') {
            errorMessage = '服务未就绪，请刷新页面后重试。';
        }
        
        // 微交互错误反馈
        if (window.microInteractions) {
            window.microInteractions.hideLoadingState(submitBtn);
            window.microInteractions.showErrorFeedback(submitBtn, errorMessage);
        }
        
        // 显示错误提示
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showErrorToast(errorMessage);
        } else {
            alert('❌ ' + errorMessage);
        }
        
        // 恢复按钮状态
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 更新UI权限控制
function updateUIPermissions() {
    // 根据用户登录状态控制添加文章按钮的显示
    if (addPostBtn) {
        const user = auth?.currentUser;
        if (user) {
            // 用户已登录，显示添加文章按钮
            addPostBtn.style.display = 'inline-flex';
            // console.log('👤 用户已登录，显示添加文章按钮:', user.email);
        } else {
            // 用户未登录，隐藏添加文章按钮
            addPostBtn.style.display = 'none';
            // console.log('🚫 用户未登录，隐藏添加文章按钮');
        }
    }
}

// 设置管理员事件监听器
function setupAdminEventListeners() {
    // 添加文章按钮
    if (addPostBtn) {
        addPostBtn.addEventListener('click', () => {
            showPostForm();
        });
    }
    
    // 表单提交
    if (postForm) {
        postForm.addEventListener('submit', handlePostSubmit);
    }
    
    // 取消按钮
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hidePostForm();
        });
    }
    
    // 删除确认按钮
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            deletePost(deletePostId);
        });
    }
    
    // 取消删除按钮
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            hideDeleteModal();
        });
    }
    
    // 删除模态框关闭按钮
    if (deleteModalClose) {
        deleteModalClose.addEventListener('click', () => {
            hideDeleteModal();
        });
    }
    
    // 点击模态框外部关闭
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                hideDeleteModal();
            }
        });
    }
}

// 显示文章表单
function showPostForm(post = null) {
    if (!adminPanel || !postForm) return;
    
    currentEditingPostId = post ? post.id : null;
    
    if (post) {
        // 编辑模式
        formTitle.textContent = '编辑文章';
        submitBtn.textContent = '更新文章';
        
        // 填充表单数据
        document.getElementById('post-title').value = post.title || '';
        document.getElementById('post-excerpt').value = post.excerpt || '';
        document.getElementById('post-content').value = post.content || '';
        document.getElementById('post-category').value = post.category || 'tech';
        document.getElementById('post-tags').value = post.tags ? post.tags.join(', ') : '';
        document.getElementById('post-read-time').value = post.readTime || 5;
    } else {
        // 新建模式
        formTitle.textContent = '添加新文章';
        submitBtn.textContent = '发布文章';
        postForm.reset();
    }
    
    adminPanel.style.display = 'block';
}

// 隐藏文章表单
function hidePostForm() {
    if (!adminPanel) return;
    
    adminPanel.style.display = 'none';
    currentEditingPostId = null;
    if (postForm) postForm.reset();
}

// 处理文章表单提交
async function handlePostSubmit(e) {
    e.preventDefault();
    
    if (!db) {
        alert('❌ 数据库未初始化');
        return;
    }
    
    const formData = new FormData(postForm);
    
    // 数据验证
    const title = formData.get('title')?.trim();
    const excerpt = formData.get('excerpt')?.trim();
    const content = formData.get('content')?.trim();
    const category = formData.get('category');
    const tagsInput = formData.get('tags')?.trim() || '';
    
    if (!title || !excerpt || !content) {
        alert('❌ 请填写完整的文章信息');
        return;
    }
    
    if (title.length > 100) {
        alert('❌ 标题长度不能超过100个字符');
        return;
    }
    
    if (excerpt.length > 200) {
        alert('❌ 摘要长度不能超过200个字符');
        return;
    }
    
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag && tag.length <= 20);
    
    // 获取当前登录用户信息 - 使用全局currentUser变量
    console.log('🔍 调试信息 - currentUser:', currentUser);
    console.log('🔍 调试信息 - auth?.currentUser:', auth?.currentUser);
    console.log('🔍 详细调试 - displayName:', currentUser?.displayName);
    console.log('🔍 详细调试 - email:', currentUser?.email);
    console.log('🔍 详细调试 - uid:', currentUser?.uid);
    
    if (!currentUser) {
        alert('❌ 请先登录后再发布文章');
        return;
    }

    const postData = {
        title,
        excerpt,
        content,
        category,
        tags,
        readTime: Math.max(1, parseInt(formData.get('readTime')) || Math.ceil(content.length / 200)),
        // 作者信息字段
        authorId: currentUser.uid,
        authorEmail: currentUser.email,
        authorDisplayName: currentUser.displayName || currentUser.email?.split('@')[0] || '匿名用户',
        author: currentUser.displayName || currentUser.email?.split('@')[0] || '匿名用户', // 保持向后兼容
        updatedAt: firebase.firestore.Timestamp.now()
    };
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        
        // 添加超时处理
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('操作超时')), 15000);
        });
        
        if (currentEditingPostId) {
            // 更新文章
            const updatePromise = db.collection('posts').doc(currentEditingPostId).update(postData);
            await Promise.race([updatePromise, timeoutPromise]);
            console.log('✅ 文章更新成功');
            alert('✅ 文章更新成功！');
        } else {
            // 创建新文章
            postData.createdAt = firebase.firestore.Timestamp.now();
            const addPromise = db.collection('posts').add(postData);
            await Promise.race([addPromise, timeoutPromise]);
            console.log('✅ 文章创建成功');
            alert('✅ 文章发布成功！');
        }
        
        hidePostForm();
        loadPosts(true); // 重新加载文章列表
        
    } catch (error) {
        console.error('❌ 文章操作失败:', error);
        
        let errorMessage = '❌ 操作失败，请稍后重试';
        if (error.code === 'permission-denied') {
            errorMessage = '❌ 权限不足，无法执行此操作';
        } else if (error.code === 'unavailable') {
            errorMessage = '❌ 服务暂时不可用，请稍后重试';
        } else if (error.message === '操作超时') {
            errorMessage = '❌ 操作超时，请检查网络连接';
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentEditingPostId ? '更新文章' : '发布文章';
    }
}

// 编辑文章（优化版）
async function editPost(postId) {
    if (!db) {
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showErrorToast('数据库未初始化');
        } else {
            alert('❌ 数据库未初始化');
        }
        return;
    }
    
    if (!postId) {
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showErrorToast('文章ID无效');
        } else {
            alert('❌ 文章ID无效');
        }
        return;
    }

    // 多重验证用户登录状态
    const globalCurrentUser = currentUser;
    const authCurrentUser = auth?.currentUser;
    const effectiveUser = globalCurrentUser || authCurrentUser;
    
    // 强制同步用户状态
    if (!currentUser && authCurrentUser) {
        console.log('🔄 editPost: 同步用户状态');
        window.currentUser = authCurrentUser;
    }
    
    console.log('🔍 editPost权限检查:', {
        hasGlobalUser: !!globalCurrentUser,
        hasAuthUser: !!authCurrentUser,
        effectiveUser: !!effectiveUser,
        globalUserEmail: globalCurrentUser?.email,
        authUserEmail: authCurrentUser?.email
    });
    
    if (!effectiveUser) {
        alert('❌ 请先登录后再编辑文章');
        return;
    }
    
    let loadingToast = null;
    
    try {
        // 显示加载状态提示
        if (window.loadingErrorHandler) {
            loadingToast = window.loadingErrorHandler.showLoadingToast('正在加载文章...');
        }
        
        // 添加超时处理
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('加载超时')), 8000);
        });
        
        const docPromise = db.collection('posts').doc(postId).get();
        const doc = await Promise.race([docPromise, timeoutPromise]);
        
        // 隐藏加载提示
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.hideLoadingToast();
        }
        
        if (doc.exists) {
            const data = doc.data();
            
            // 检查权限：作者或管理员才能编辑文章
            const isAuthor = data.authorId === effectiveUser.uid;
            const isUserAdmin = isAdmin();
            
            console.log('🔍 editPost文章权限验证:', {
                articleAuthorId: data.authorId,
                effectiveUserUid: effectiveUser.uid,
                isAuthor: isAuthor,
                isAdmin: isUserAdmin,
                articleTitle: data.title
            });
            
            if (data.authorId && !isAuthor && !isUserAdmin) {
                if (window.loadingErrorHandler) {
                    window.loadingErrorHandler.showErrorToast('❌ 您只能编辑自己创建的文章');
                } else {
                    alert('❌ 您只能编辑自己创建的文章');
                }
                return;
            }
            
            const post = {
                id: doc.id,
                title: data.title || '',
                excerpt: data.excerpt || '',
                content: data.content || '',
                category: data.category || 'life',
                tags: Array.isArray(data.tags) ? data.tags : [],
                readTime: data.readTime || 5
            };
            showPostForm(post);
        } else {
            if (window.loadingErrorHandler) {
                window.loadingErrorHandler.showErrorToast('文章不存在或已被删除');
            } else {
                alert('❌ 文章不存在或已被删除');
            }
        }
    } catch (error) {
        // 确保隐藏加载提示
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.hideLoadingToast();
        }
        
        console.error('❌ 获取文章失败:', error);
        
        let errorMessage = '获取文章失败';
        if (error.code === 'permission-denied') {
            errorMessage = '权限不足，无法编辑此文章';
        } else if (error.code === 'unavailable') {
            errorMessage = '服务暂时不可用，请稍后重试';
        } else if (error.message === '加载超时') {
            errorMessage = '加载超时，请检查网络连接';
        } else if (error.code === 'not-found') {
            errorMessage = '文章不存在或已被删除';
        }
        
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showErrorToast(errorMessage);
        } else {
            alert('❌ ' + errorMessage);
        }
    }
}

// 确认删除文章
function confirmDeletePost(postId) {
    // 检查用户登录状态
    if (!currentUser) {
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showErrorToast('请先登录后再删除文章');
        } else {
            alert('❌ 请先登录后再删除文章');
        }
        return;
    }
    
    deletePostId = postId;
    if (deleteModal) {
        deleteModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// 删除文章（优化版）
async function deletePost(postId) {
    if (!db || !postId) {
        alert('❌ 删除失败：数据库未初始化或文章ID无效');
        return;
    }
    
    try {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 删除中...';
        
        // 添加超时处理
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('删除超时')), 10000);
        });
        
        // 先检查文章是否存在
        const docRef = db.collection('posts').doc(postId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            alert('❌ 文章不存在或已被删除');
            hideDeleteModal();
            loadPosts(true);
            return;
        }
        
        // 检查权限：只有作者才能删除自己的文章
        const data = doc.data();
        const globalCurrentUser = currentUser;
        const authCurrentUser = auth?.currentUser;
        const effectiveUser = globalCurrentUser || authCurrentUser;
        
        // 强制同步用户状态
        if (!currentUser && authCurrentUser) {
            console.log('🔄 deletePost: 同步用户状态');
            window.currentUser = authCurrentUser;
        }
        
        console.log('🔍 deletePost权限检查:', {
            hasGlobalUser: !!globalCurrentUser,
            hasAuthUser: !!authCurrentUser,
            effectiveUser: !!effectiveUser,
            articleAuthorId: data.authorId,
            effectiveUserUid: effectiveUser?.uid,
            isAuthor: data.authorId === effectiveUser?.uid,
            articleTitle: data.title
        });
        
        if (!effectiveUser) {
            alert('❌ 请先登录后再删除文章');
            hideDeleteModal();
            return;
        }
        
        const isAuthor = data.authorId === effectiveUser.uid;
        const isUserAdmin = isAdmin();
        
        if (data.authorId && !isAuthor && !isUserAdmin) {
            alert('❌ 您只能删除自己创建的文章');
            hideDeleteModal();
            return;
        }
        
        // 执行删除操作
        const deletePromise = docRef.delete();
        await Promise.race([deletePromise, timeoutPromise]);
        
        console.log('✅ 文章删除成功');
        alert('✅ 文章删除成功！');
        
        hideDeleteModal();
        loadPosts(true); // 重新加载文章列表
        
    } catch (error) {
        console.error('❌ 删除文章失败:', error);
        
        let errorMessage = '❌ 删除失败，请稍后重试';
        if (error.code === 'permission-denied') {
            errorMessage = '❌ 权限不足，无法删除此文章';
        } else if (error.code === 'unavailable') {
            errorMessage = '❌ 服务暂时不可用，请稍后重试';
        } else if (error.message === '删除超时') {
            errorMessage = '❌ 删除超时，请检查网络连接';
        } else if (error.code === 'not-found') {
            errorMessage = '❌ 文章不存在或已被删除';
            hideDeleteModal();
            loadPosts(true);
            return;
        }
        
        alert(errorMessage);
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> 确认删除';
    }
}

// 隐藏删除模态框
function hideDeleteModal() {
    if (deleteModal) {
        deleteModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    deletePostId = null;
}

/**
 * 设置导航功能
 * 修复说明：解决登录链接无法跳转的问题
 * 
 * 问题原因：之前对所有.nav-link都执行preventDefault()，阻止了外部链接的默认跳转行为
 * 解决方案：只对页面内锚点链接（以#开头）执行preventDefault()和平滑滚动，
 *          对外部链接（如login.html）保持默认跳转行为
 * 
 * 功能说明：
 * 1. 页面内导航：对#home、#posts、#about等锚点链接进行平滑滚动
 * 2. 外部链接：对login.html等页面链接保持正常跳转
 * 3. 移动端适配：自动关闭移动端菜单
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // 检查是否为外部链接或页面链接（如login.html）
            // 如果href不是以#开头的锚点链接，则允许默认行为
            if (!href || !href.startsWith('#')) {
                // 对于外部链接（如login.html），不阻止默认行为，直接返回
                return;
            }
            
            // 只对页面内锚点链接进行preventDefault和平滑滚动处理
            e.preventDefault();
            
            // 移除所有active类
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加active类到当前链接
            link.classList.add('active');
            
            // 滚动到目标部分
            const targetId = href.substring(1);
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
    let ticking = false;
    
    function updateNavbar() {
        const scrollTop = window.pageYOffset;
        const navbar = document.querySelector('.navbar');
        
        // 返回顶部按钮
        if (scrollTop > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
        
        // 导航栏动态背景变化效果
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        ticking = false;
    }
    
    // 使用requestAnimationFrame优化滚动性能
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    });
    
    // 返回顶部
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 网络状态监听
    window.addEventListener('online', () => {
        // 网络状态检查已删除
        console.log('🌐 网络已连接');
        // 可以在这里添加重新连接Firebase的逻辑
    });
    
    // 离线事件监听已删除
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
    formatDate,
    editPost,
    confirmDeletePost,
    deletePost
};

// 将函数添加到全局作用域，供HTML中的onclick使用
window.editPost = editPost;
window.confirmDeletePost = confirmDeletePost;
window.deletePost = deletePost;
window.openPostModal = openPostModal;

// 博客应用初始化完成

// ========================================
// 现代化按钮交互系统 - 涟漪效果和微交互
// ========================================

// 初始化按钮交互系统
function initButtonInteractions() {
    // 为所有按钮添加涟漪效果
    initRippleEffect();
    
    // 初始化按钮状态管理
    initButtonStates();
    
    // 初始化表单控件交互
    initFormInteractions();
    
    // 初始化按钮组交互
    initButtonGroups();
    
    console.log('✅ 按钮交互系统初始化完成');
}

// 涟漪效果实现
function initRippleEffect() {
    // 为所有按钮添加涟漪效果类
    const buttons = document.querySelectorAll('.btn, .filter-btn, .action-btn');
    
    buttons.forEach(button => {
        // 添加涟漪效果类
        if (!button.classList.contains('btn-ripple')) {
            button.classList.add('btn-ripple');
        }
        
        // 移除旧的事件监听器（如果存在）
        button.removeEventListener('click', handleRippleClick);
        
        // 添加涟漪点击事件
        button.addEventListener('click', handleRippleClick);
        
        // 添加键盘支持
        button.addEventListener('keydown', handleRippleKeydown);
    });
}

// 处理涟漪点击效果
function handleRippleClick(e) {
    const button = e.currentTarget;
    
    // 如果按钮被禁用，不显示涟漪效果
    if (button.disabled || button.classList.contains('btn-disabled')) {
        return;
    }
    
    createRipple(button, e);
}

// 处理键盘涟漪效果
function handleRippleKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const button = e.currentTarget;
        
        if (button.disabled || button.classList.contains('btn-disabled')) {
            return;
        }
        
        // 为键盘操作创建中心涟漪效果
        const rect = button.getBoundingClientRect();
        const fakeEvent = {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
        };
        
        createRipple(button, fakeEvent);
    }
}

// 创建涟漪效果
function createRipple(button, event) {
    // 移除之前的涟漪效果
    const existingRipple = button.querySelector('.ripple-effect');
    if (existingRipple) {
        existingRipple.remove();
    }
    
    // 创建涟漪元素
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    // 计算涟漪位置和大小
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    // 设置涟漪样式
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleAnimation 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
    `;
    
    // 确保按钮有相对定位
    if (getComputedStyle(button).position === 'static') {
        button.style.position = 'relative';
    }
    
    // 确保按钮有overflow hidden
    button.style.overflow = 'hidden';
    
    // 添加涟漪到按钮
    button.appendChild(ripple);
    
    // 移除涟漪元素
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.remove();
        }
    }, 600);
}

// 初始化按钮状态管理
function initButtonStates() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        // 添加悬停状态
        button.addEventListener('mouseenter', handleButtonHover);
        button.addEventListener('mouseleave', handleButtonLeave);
        
        // 添加焦点状态
        button.addEventListener('focus', handleButtonFocus);
        button.addEventListener('blur', handleButtonBlur);
        
        // 添加按下状态
        button.addEventListener('mousedown', handleButtonPress);
        button.addEventListener('mouseup', handleButtonRelease);
        button.addEventListener('mouseleave', handleButtonRelease);
    });
}

// 按钮悬停处理
function handleButtonHover(e) {
    const button = e.currentTarget;
    if (button.disabled || button.classList.contains('btn-disabled')) return;
    
    button.style.transform = 'translateY(-2px)';
    
    // 图标动画
    const icon = button.querySelector('.btn-icon');
    if (icon) {
        if (button.classList.contains('btn-outline') || button.classList.contains('btn-secondary')) {
            icon.style.transform = 'scale(1.1)';
        } else {
            icon.style.transform = 'translateX(2px)';
        }
    }
}

// 按钮离开处理
function handleButtonLeave(e) {
    const button = e.currentTarget;
    if (button.disabled || button.classList.contains('btn-disabled')) return;
    
    button.style.transform = '';
    
    // 重置图标
    const icon = button.querySelector('.btn-icon');
    if (icon) {
        icon.style.transform = '';
    }
}

// 按钮焦点处理
function handleButtonFocus(e) {
    const button = e.currentTarget;
    if (button.disabled || button.classList.contains('btn-disabled')) return;
    
    button.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
}

// 按钮失焦处理
function handleButtonBlur(e) {
    const button = e.currentTarget;
    button.style.boxShadow = '';
}

// 按钮按下处理
function handleButtonPress(e) {
    const button = e.currentTarget;
    if (button.disabled || button.classList.contains('btn-disabled')) return;
    
    button.style.transform = 'translateY(0)';
}

// 按钮释放处理
function handleButtonRelease(e) {
    const button = e.currentTarget;
    if (button.disabled || button.classList.contains('btn-disabled')) return;
    
    // 如果鼠标仍在按钮上，恢复悬停状态
    if (e.type === 'mouseup') {
        button.style.transform = 'translateY(-2px)';
    }
}

// 初始化表单控件交互
function initFormInteractions() {
    // 浮动标签效果
    initFloatingLabels();
    
    // 输入框聚焦效果
    initInputFocusEffects();
    
    // 表单验证视觉反馈
    initFormValidation();
    
    // 文件上传交互
    initFileUploadInteractions();
}

// 浮动标签效果
function initFloatingLabels() {
    const floatingGroups = document.querySelectorAll('.form-group-floating');
    
    floatingGroups.forEach(group => {
        const input = group.querySelector('input, textarea');
        const label = group.querySelector('label');
        
        if (!input || !label) return;
        
        // 检查初始值
        function checkValue() {
            if (input.value.trim() !== '' || input === document.activeElement) {
                label.classList.add('floating');
            } else {
                label.classList.remove('floating');
            }
        }
        
        // 监听事件
        input.addEventListener('focus', checkValue);
        input.addEventListener('blur', checkValue);
        input.addEventListener('input', checkValue);
        
        // 初始检查
        checkValue();
    });
}

// 输入框聚焦效果
function initInputFocusEffects() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('focus', (e) => {
            const formGroup = e.target.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('focused');
            }
        });
        
        input.addEventListener('blur', (e) => {
            const formGroup = e.target.closest('.form-group');
            if (formGroup) {
                formGroup.classList.remove('focused');
            }
        });
    });
}

// 表单验证视觉反馈
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', validateInput);
            input.addEventListener('input', clearValidation);
        });
    });
}

// 验证单个输入框
function validateInput(e) {
    const input = e.target;
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    
    // 移除之前的验证状态
    formGroup.classList.remove('success', 'error');
    
    // 移除之前的消息
    const existingMessage = formGroup.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 验证逻辑
    let isValid = true;
    let message = '';
    
    if (input.required && !input.value.trim()) {
        isValid = false;
        message = '此字段为必填项';
    } else if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
        isValid = false;
        message = '请输入有效的邮箱地址';
    } else if (input.minLength && input.value.length < input.minLength) {
        isValid = false;
        message = `至少需要 ${input.minLength} 个字符`;
    } else if (input.maxLength && input.value.length > input.maxLength) {
        isValid = false;
        message = `不能超过 ${input.maxLength} 个字符`;
    }
    
    // 应用验证状态
    if (input.value.trim()) {
        if (isValid) {
            formGroup.classList.add('success');
            showFormMessage(formGroup, 'success', '✓ 输入正确');
        } else {
            formGroup.classList.add('error');
            showFormMessage(formGroup, 'error', message);
        }
    }
}

// 清除验证状态
function clearValidation(e) {
    const input = e.target;
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    
    formGroup.classList.remove('success', 'error');
    
    const existingMessage = formGroup.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// 显示表单消息
function showFormMessage(formGroup, type, message) {
    const messageElement = document.createElement('div');
    messageElement.className = `form-message ${type}`;
    messageElement.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    formGroup.appendChild(messageElement);
}

// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 文件上传交互
function initFileUploadInteractions() {
    const fileInputs = document.querySelectorAll('.form-file input[type="file"]');
    
    fileInputs.forEach(input => {
        const label = input.nextElementSibling;
        if (!label) return;
        
        input.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                const fileName = files.length === 1 ? files[0].name : `${files.length} 个文件`;
                label.innerHTML = `<i class="fas fa-check"></i> ${fileName}`;
                label.style.color = 'var(--primary-600)';
                label.style.borderColor = 'var(--primary-600)';
            } else {
                label.innerHTML = '<i class="fas fa-upload"></i> 选择文件';
                label.style.color = '';
                label.style.borderColor = '';
            }
        });
        
        // 拖拽上传效果
        label.addEventListener('dragover', (e) => {
            e.preventDefault();
            label.style.backgroundColor = 'var(--primary-50)';
            label.style.borderColor = 'var(--primary-400)';
        });
        
        label.addEventListener('dragleave', (e) => {
            e.preventDefault();
            label.style.backgroundColor = '';
            label.style.borderColor = '';
        });
        
        label.addEventListener('drop', (e) => {
            e.preventDefault();
            label.style.backgroundColor = '';
            label.style.borderColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                input.dispatchEvent(new Event('change'));
            }
        });
    });
}

// 初始化按钮组交互
function initButtonGroups() {
    const buttonGroups = document.querySelectorAll('.btn-group');
    
    buttonGroups.forEach(group => {
        const buttons = group.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除其他按钮的激活状态
                buttons.forEach(btn => btn.classList.remove('active'));
                
                // 添加当前按钮的激活状态
                button.classList.add('active');
            });
        });
    });
}

// 按钮加载状态管理
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        
        // 保存原始内容
        if (!button.dataset.originalContent) {
            button.dataset.originalContent = button.innerHTML;
        }
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        
        // 恢复原始内容
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
            delete button.dataset.originalContent;
        }
    }
}

// 按钮成功状态
function setButtonSuccess(button, message = '成功', duration = 2000) {
    const originalContent = button.innerHTML;
    const originalClass = button.className;
    
    button.innerHTML = `<i class="fas fa-check"></i> ${message}`;
    button.className = button.className.replace(/btn-\w+/g, '') + ' btn-success';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalContent;
        button.className = originalClass;
        button.disabled = false;
    }, duration);
}

// 按钮错误状态
function setButtonError(button, message = '错误', duration = 2000) {
    const originalContent = button.innerHTML;
    const originalClass = button.className;
    
    button.innerHTML = `<i class="fas fa-times"></i> ${message}`;
    button.className = button.className.replace(/btn-\w+/g, '') + ' btn-danger';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalContent;
        button.className = originalClass;
        button.disabled = false;
    }, duration);
}

// 添加涟漪动画CSS（如果不存在）
function addRippleStyles() {
    if (document.querySelector('#ripple-animation-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'ripple-animation-styles';
    style.textContent = `
        @keyframes rippleAnimation {
            0% {
                transform: scale(0);
                opacity: 0.6;
            }
            100% {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .form-group.focused .form-icon {
            color: var(--primary-600) !important;
        }
        
        .form-group-floating label.floating {
            transform: translateY(-20px) scale(0.875);
            color: var(--primary-600);
            font-weight: var(--font-medium);
        }
        
        .loading-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-bg-primary);
            color: var(--color-text-primary);
            padding: var(--space-4) var(--space-6);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: var(--space-2);
            font-weight: var(--font-medium);
            border: 1px solid var(--color-border);
        }
        
        .loading-toast i {
            color: var(--primary-600);
        }
    `;
    
    document.head.appendChild(style);
}

// 在DOM加载完成后初始化按钮交互系统
document.addEventListener('DOMContentLoaded', () => {
    // 添加必要的样式
    addRippleStyles();
    
    // 初始化按钮交互系统
    initButtonInteractions();
});

// 导出函数供其他模块使用
window.ButtonInteractions = {
    setButtonLoading,
    setButtonSuccess,
    setButtonError,
    createRipple
};

// ========================================
// 页面滚动和动画效果系统
// ========================================

// 1. 页面加载器
function initPageLoader() {
    const pageLoader = document.getElementById('page-loader');
    
    if (!pageLoader) return;
    
    // 页面加载完成后隐藏加载器
    window.addEventListener('load', () => {
        setTimeout(() => {
            pageLoader.classList.add('fade-out');
            
            // 动画完成后移除元素
            setTimeout(() => {
                if (pageLoader.parentNode) {
                    pageLoader.parentNode.removeChild(pageLoader);
                }
                
                // 触发内容渐进显示
                initProgressiveContentDisplay();
            }, 500);
        }, 800); // 最少显示800ms
    });
    
    // 如果页面已经加载完成（缓存情况）
    if (document.readyState === 'complete') {
        setTimeout(() => {
            pageLoader.classList.add('fade-out');
            setTimeout(() => {
                if (pageLoader.parentNode) {
                    pageLoader.parentNode.removeChild(pageLoader);
                }
                initProgressiveContentDisplay();
            }, 500);
        }, 300);
    }
}

// 2. 渐进式内容显示
function initProgressiveContentDisplay() {
    const contentSections = document.querySelectorAll('.content-section');
    
    contentSections.forEach((section, index) => {
        setTimeout(() => {
            section.classList.add('loaded');
        }, index * 200); // 每个区域延迟200ms显示
    });
}

// 3. 滚动动画系统 - 元素进入视口时的淡入动画
function initScrollAnimations() {
    // 创建Intersection Observer
    const observerOptions = {
        threshold: 0.1, // 元素10%可见时触发
        rootMargin: '0px 0px -50px 0px' // 提前50px触发
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 添加动画类
                entry.target.classList.add('animate-in');
                
                // 对于文章卡片，添加交错动画
                if (entry.target.classList.contains('post-card')) {
                    const cards = document.querySelectorAll('.post-card');
                    const index = Array.from(cards).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 100}ms`;
                }
                
                // 动画完成后停止观察（性能优化）
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 观察所有需要动画的元素
    const animateElements = document.querySelectorAll(`
        .fade-in-element,
        .fade-in-up,
        .fade-in-down,
        .fade-in-left,
        .fade-in-right,
        .fade-in-scale,
        .fade-in-rotate,
        .section-title,
        .hero-buttons,
        .hero-stats,
        .contact-form,
        .contact-info,
        .about-text,
        .about-image,
        .footer,
        .posts-filter
    `);
    
    animateElements.forEach(el => {
        observer.observe(el);
    });
    
    // 存储observer以便后续使用
    window.scrollAnimationObserver = observer;
}

// 4. 滚动进度条
function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    
    if (!progressBar) return;
    
    let ticking = false;
    
    function updateScrollProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
        
        ticking = false;
    }
    
    function requestScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateScrollProgress);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
}

// 5. 返回顶部按钮增强
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (!backToTopBtn) return;
    
    let isVisible = false;
    let ticking = false;
    
    function updateBackToTopVisibility() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldShow = scrollTop > 300; // 滚动超过300px时显示
        
        if (shouldShow && !isVisible) {
            backToTopBtn.classList.add('show');
            isVisible = true;
        } else if (!shouldShow && isVisible) {
            backToTopBtn.classList.remove('show');
            isVisible = false;
        }
        
        ticking = false;
    }
    
    function requestBackToTopUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateBackToTopVisibility);
            ticking = true;
        }
    }
    
    // 滚动监听
    window.addEventListener('scroll', requestBackToTopUpdate, { passive: true });
    
    // 点击事件增强
    backToTopBtn.addEventListener('click', () => {
        // 平滑滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // 添加点击动画效果
        backToTopBtn.style.transform = 'translateY(-1px) scale(1.05)';
        setTimeout(() => {
            backToTopBtn.style.transform = '';
        }, 150);
        
        // 添加涟漪效果
        createRipple(backToTopBtn, {
            clientX: backToTopBtn.getBoundingClientRect().left + 25,
            clientY: backToTopBtn.getBoundingClientRect().top + 25
        });
    });
}

// 6. 平滑滚动优化
function initSmoothScrolling() {
    // 为所有锚点链接添加平滑滚动
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // 跳过空锚点
            if (href === '#' || href === '#!') return;
            
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                e.preventDefault();
                
                // 计算目标位置（考虑固定导航栏）
                const navHeight = document.querySelector('.navbar')?.offsetHeight || 70;
                const targetPosition = targetElement.offsetTop - navHeight - 20;
                
                // 平滑滚动
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 更新URL（可选）
                if (history.pushState) {
                    history.pushState(null, null, href);
                }
                
                // 添加目标元素的高亮效果
                targetElement.style.transition = 'background-color 0.3s ease';
                targetElement.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                setTimeout(() => {
                    targetElement.style.backgroundColor = '';
                }, 1000);
            }
        });
    });
}

// 7. 导航栏滚动隐藏/显示
function initNavbarScrollBehavior() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    let lastScrollTop = 0;
    let ticking = false;
    
    function updateNavbarVisibility() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // 向下滚动，隐藏导航栏
            navbar.classList.add('scroll-up');
            navbar.classList.remove('scroll-down');
        } else {
            // 向上滚动，显示导航栏
            navbar.classList.remove('scroll-up');
            navbar.classList.add('scroll-down');
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
    }
    
    function requestNavbarUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateNavbarVisibility);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestNavbarUpdate, { passive: true });
}

// 8. 文章卡片动画增强
function enhancePostCardAnimations() {
    // 为新加载的文章卡片添加动画观察
    const observer = window.scrollAnimationObserver;
    
    if (!observer) return;
    
    // 观察新添加的文章卡片
    const newCards = document.querySelectorAll('.post-card:not(.animate-in)');
    newCards.forEach(card => {
        observer.observe(card);
    });
}

// 9. 滚动性能监控和优化
function initScrollPerformanceOptimization() {
    let scrollTimeout;
    let isScrolling = false;
    
    function handleScrollStart() {
        if (!isScrolling) {
            isScrolling = true;
            document.body.classList.add('is-scrolling');
        }
        
        clearTimeout(scrollTimeout);
    }
    
    function handleScrollEnd() {
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            document.body.classList.remove('is-scrolling');
        }, 150);
    }
    
    window.addEventListener('scroll', () => {
        handleScrollStart();
        handleScrollEnd();
    }, { passive: true });
}

// 10. 响应式动画调整
function initResponsiveAnimations() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    function handleMediaQueryChange(e) {
        const animatedElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
        
        if (e.matches) {
            // 移动端：将左右动画改为上下动画
            animatedElements.forEach(el => {
                el.classList.remove('fade-in-left', 'fade-in-right');
                el.classList.add('fade-in-up');
            });
        } else {
            // 桌面端：恢复原始动画
            animatedElements.forEach(el => {
                if (el.classList.contains('about-text') || el.classList.contains('contact-info')) {
                    el.classList.remove('fade-in-up');
                    el.classList.add('fade-in-left');
                } else if (el.classList.contains('about-image') || el.classList.contains('contact-form')) {
                    el.classList.remove('fade-in-up');
                    el.classList.add('fade-in-right');
                }
            });
        }
    }
    
    mediaQuery.addListener(handleMediaQueryChange);
    handleMediaQueryChange(mediaQuery); // 初始检查
}

// 11. 滚动到元素
function scrollToElement(element, offset = 0) {
    if (!element) return;
    
    const navHeight = document.querySelector('.navbar')?.offsetHeight || 70;
    const targetPosition = element.offsetTop - navHeight - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

// 12. 批量动画触发
function triggerBatchAnimations(elements, delay = 100) {
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animate-in');
        }, index * delay);
    });
}

// 13. 动画完成回调
function onAnimationComplete(element, callback) {
    const handleTransitionEnd = (e) => {
        if (e.target === element) {
            element.removeEventListener('transitionend', handleTransitionEnd);
            callback();
        }
    };
    
    element.addEventListener('transitionend', handleTransitionEnd);
}

// 14. 清理函数（用于页面卸载时清理事件监听器）
function cleanupScrollAnimations() {
    if (window.scrollAnimationObserver) {
        window.scrollAnimationObserver.disconnect();
    }
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanupScrollAnimations);

// 导出滚动动画相关函数
window.ScrollAnimations = {
    scrollToElement,
    triggerBatchAnimations,
    onAnimationComplete,
    enhancePostCardAnimations
};

// 滚动动画系统初始化完成
// ========================================
// 现代化表单系统
// ========================================

class FormValidator {
    constructor() {
        this.rules = {
            required: (value) => value.trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            minLength: (value, min) => value.length >= min,
            maxLength: (value, max) => value.length <= max,
            number: (value) => !isNaN(value) && value > 0
        };
        
        this.messages = {
            required: '这个字段是必填的',
            email: '请输入有效的邮箱地址',
            minLength: (min) => `至少需要 ${min} 个字符`,
            maxLength: (max) => `不能超过 ${max} 个字符`,
            number: '请输入有效的数字'
        };
    }
    
    validate(field, rules) {
        const value = field.value.trim();
        const errors = [];
        
        for (const rule of rules) {
            if (rule.type === 'required' && !this.rules.required(value)) {
                errors.push(this.messages.required);
                break;
            }
            
            if (value && rule.type === 'email' && !this.rules.email(value)) {
                errors.push(this.messages.email);
            }
            
            if (value && rule.type === 'minLength' && !this.rules.minLength(value, rule.value)) {
                errors.push(this.messages.minLength(rule.value));
            }
            
            if (rule.type === 'maxLength' && !this.rules.maxLength(value, rule.value)) {
                errors.push(this.messages.maxLength(rule.value));
            }
            
            if (value && rule.type === 'number' && !this.rules.number(value)) {
                errors.push(this.messages.number);
            }
        }
        
        return errors;
    }
}

class FormEnhancer {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        this.validator = new FormValidator();
        this.fields = new Map();
        
        if (this.form) {
            this.init();
        }
    }
    
    init() {
        this.setupFields();
        this.setupEventListeners();
        this.setupProgressBar();
    }
    
    setupFields() {
        const formFields = this.form.querySelectorAll('.form-field');
        
        formFields.forEach(fieldContainer => {
            const input = fieldContainer.querySelector('.form-input, .form-textarea, .form-select');
            const label = fieldContainer.querySelector('.form-label');
            const message = fieldContainer.querySelector('.form-message');
            const icon = fieldContainer.querySelector('.form-icon');
            const counter = fieldContainer.querySelector('.form-counter');
            
            if (input) {
                const fieldData = {
                    container: fieldContainer,
                    input,
                    label,
                    message,
                    icon,
                    counter,
                    rules: this.getValidationRules(input),
                    isValid: false
                };
                
                this.fields.set(input.id, fieldData);
                this.setupFieldEvents(fieldData);
            }
        });
    }
    
    getValidationRules(input) {
        const rules = [];
        
        if (input.required) {
            rules.push({ type: 'required' });
        }
        
        if (input.type === 'email') {
            rules.push({ type: 'email' });
        }
        
        if (input.type === 'number') {
            rules.push({ type: 'number' });
        }
        
        // 从data属性获取规则
        if (input.dataset.minLength) {
            rules.push({ type: 'minLength', value: parseInt(input.dataset.minLength) });
        }
        
        if (input.dataset.maxLength) {
            rules.push({ type: 'maxLength', value: parseInt(input.dataset.maxLength) });
        }
        
        return rules;
    }
    
    setupFieldEvents(fieldData) {
        const { input, counter } = fieldData;
        
        // 实时验证
        input.addEventListener('input', () => {
            this.validateField(fieldData);
            this.updateCounter(fieldData);
            this.updateProgress();
        });
        
        input.addEventListener('blur', () => {
            this.validateField(fieldData);
        });
        
        input.addEventListener('focus', () => {
            this.clearFieldState(fieldData);
        });
        
        // 字符计数器
        if (counter) {
            this.updateCounter(fieldData);
        }
    }
    
    validateField(fieldData) {
        const { input, container, message, icon, rules } = fieldData;
        const errors = this.validator.validate(input, rules);
        
        // 清除之前的状态
        container.classList.remove('success', 'error');
        
        if (errors.length > 0) {
            container.classList.add('error');
            message.textContent = errors[0];
            fieldData.isValid = false;
        } else if (input.value.trim() !== '') {
            container.classList.add('success');
            message.textContent = '输入正确';
            fieldData.isValid = true;
        } else {
            fieldData.isValid = false;
        }
        
        return fieldData.isValid;
    }
    
    clearFieldState(fieldData) {
        const { container } = fieldData;
        container.classList.remove('error');
    }
    
    updateCounter(fieldData) {
        const { input, counter } = fieldData;
        
        if (!counter) return;
        
        const current = counter.querySelector('.current');
        const max = counter.querySelector('.max');
        
        if (current && max) {
            const currentLength = input.value.length;
            const maxLength = parseInt(max.textContent);
            
            current.textContent = currentLength;
            
            // 更新计数器颜色
            counter.classList.remove('warning', 'error');
            
            if (currentLength > maxLength * 0.8) {
                counter.classList.add('warning');
            }
            
            if (currentLength > maxLength) {
                counter.classList.add('error');
            }
        }
    }
    
    setupProgressBar() {
        const progressBar = this.form.querySelector('.form-progress-bar');
        if (progressBar) {
            this.progressBar = progressBar;
        }
    }
    
    updateProgress() {
        if (!this.progressBar) return;
        
        const totalFields = this.fields.size;
        const validFields = Array.from(this.fields.values()).filter(field => field.isValid).length;
        const progress = totalFields > 0 ? (validFields / totalFields) * 100 : 0;
        
        this.progressBar.style.width = `${progress}%`;
    }
    
    validateForm() {
        let isValid = true;
        
        this.fields.forEach(fieldData => {
            if (!this.validateField(fieldData)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }
    
    async handleSubmit() {
        if (!this.validateForm()) {
            this.showFormError('请检查并修正表单中的错误');
            return;
        }
        
        const submitBtn = this.form.querySelector('.form-submit');
        const formData = new FormData(this.form);
        
        try {
            this.setSubmitState(submitBtn, 'loading');
            
            // 模拟提交延迟
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 这里应该是实际的提交逻辑
            await this.submitForm(formData);
            
            this.setSubmitState(submitBtn, 'success');
            this.showFormSuccess('提交成功！');
            
            // 重置表单
            setTimeout(() => {
                this.resetForm();
                this.setSubmitState(submitBtn, 'default');
            }, 2000);
            
        } catch (error) {
            this.setSubmitState(submitBtn, 'default');
            this.showFormError('提交失败，请重试');
            console.error('表单提交错误:', error);
        }
    }
    
    async submitForm(formData) {
        // 这里实现具体的提交逻辑
        // 可以是发送到服务器或保存到数据库
        console.log('提交表单数据:', Object.fromEntries(formData));
        return true;
    }
    
    setSubmitState(button, state) {
        button.classList.remove('loading', 'success');
        
        if (state === 'loading') {
            button.classList.add('loading');
            button.disabled = true;
        } else if (state === 'success') {
            button.classList.add('success');
            button.disabled = false;
        } else {
            button.disabled = false;
        }
    }
    
    showFormError(message) {
        this.showFormMessage(message, 'error');
    }
    
    showFormSuccess(message) {
        this.showFormMessage(message, 'success');
    }
    
    showFormMessage(message, type) {
        // 创建消息提示
        const messageEl = document.createElement('div');
        messageEl.className = `form-notification ${type}`;
        messageEl.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // 添加样式
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-500)' : 'var(--error-500)'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(messageEl);
        
        // 自动移除
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    }
    
    resetForm() {
        this.form.reset();
        
        // 重置所有字段状态
        this.fields.forEach(fieldData => {
            fieldData.container.classList.remove('success', 'error');
            fieldData.message.textContent = '';
            fieldData.isValid = false;
            this.updateCounter(fieldData);
        });
        
        this.updateProgress();
    }
}

// 联系表单增强
class ContactFormEnhancer extends FormEnhancer {
    constructor() {
        super('#contact-form');
    }
    
    async submitForm(formData) {
        // 联系表单的特殊提交逻辑
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message'),
            timestamp: new Date().toISOString()
        };
        
        console.log('联系表单数据:', contactData);
        
        // 这里可以集成邮件服务或保存到数据库
        return true;
    }
}

// 文章表单增强
class PostFormEnhancer extends FormEnhancer {
    constructor() {
        super('#post-form');
        this.setupCategoryIcons();
    }
    
    setupCategoryIcons() {
        const categorySelect = this.form?.querySelector('#post-category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.updateCategoryIcon(e.target.value);
            });
        }
    }
    
    updateCategoryIcon(category) {
        const icons = {
            tech: 'fas fa-code',
            life: 'fas fa-heart',
            thoughts: 'fas fa-lightbulb'
        };
        
        // 这里可以更新UI显示相应的图标
        console.log(`选择分类: ${category}, 图标: ${icons[category]}`);
    }
    
    async submitForm(formData) {
        // 文章表单的特殊提交逻辑
        const postData = {
            title: formData.get('title'),
            category: formData.get('category'),
            excerpt: formData.get('excerpt'),
            content: formData.get('content'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            readTime: parseInt(formData.get('readTime')),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        console.log('文章表单数据:', postData);
        
        // 这里可以保存到Firebase或其他数据库
        if (window.db) {
            try {
                await window.db.collection('posts').add(postData);
                console.log('文章保存成功');
                
                // 重新加载文章列表
                if (window.loadPosts) {
                    window.loadPosts(true);
                }
                
                // 隐藏管理面板
                const adminPanel = document.getElementById('admin-panel');
                if (adminPanel) {
                    adminPanel.style.display = 'none';
                }
                
                return true;
            } catch (error) {
                console.error('保存文章失败:', error);
                throw error;
            }
        }
        
        return true;
    }
}

// 添加动画样式
function addFormAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .form-notification {
            animation: slideInRight 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}

// 初始化表单系统
function initFormSystem() {
    // 添加动画样式
    addFormAnimationStyles();
    
    // 初始化联系表单
    const contactForm = new ContactFormEnhancer();
    
    // 初始化文章表单
    const postForm = new PostFormEnhancer();
    
    // 设置字符限制
    setupCharacterLimits();
    
    console.log('✅ 表单系统初始化完成');
}

// 设置字符限制
function setupCharacterLimits() {
    const limits = {
        'post-title': 100,
        'post-excerpt': 200,
        'post-content': 5000,
        'message': 500
    };
    
    Object.entries(limits).forEach(([id, limit]) => {
        const input = document.getElementById(id);
        if (input) {
            input.dataset.maxLength = limit;
        }
    });
}

// 在DOM加载完成后初始化表单系统
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他系统已经加载
    setTimeout(initFormSystem, 100);
});

// ========================================
// 暗色主题切换功能
// ========================================

// 主题管理类
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeToggle = null;
        this.sunIcon = null;
        this.moonIcon = null;
        this.init();
    }
    
    // 初始化主题管理器
    init() {
        this.createThemeToggle();
        this.loadSavedTheme();
        this.setupEventListeners();
        this.applyThemeTransitions();
        console.log('🎨 主题管理器初始化完成');
    }
    
    // 创建主题切换按钮
    createThemeToggle() {
        // 检查是否已存在主题切换按钮
        if (document.querySelector('.theme-toggle')) {
            this.themeToggle = document.querySelector('.theme-toggle');
            this.sunIcon = this.themeToggle.querySelector('.theme-icon.sun');
            this.moonIcon = this.themeToggle.querySelector('.theme-icon.moon');
            return;
        }
        
        // 创建主题切换按钮
        this.themeToggle = document.createElement('button');
        this.themeToggle.className = 'theme-toggle';
        this.themeToggle.setAttribute('aria-label', '切换主题');
        this.themeToggle.setAttribute('title', '切换暗色/亮色主题');
        
        // 创建图标
        this.sunIcon = document.createElement('i');
        this.sunIcon.className = 'theme-icon sun fas fa-sun';
        
        this.moonIcon = document.createElement('i');
        this.moonIcon.className = 'theme-icon moon fas fa-moon';
        
        // 添加图标到按钮
        this.themeToggle.appendChild(this.sunIcon);
        this.themeToggle.appendChild(this.moonIcon);
        
        // 添加到页面
        document.body.appendChild(this.themeToggle);
        
        console.log('🌓 主题切换按钮创建成功');
    }
    
    // 加载保存的主题偏好
    loadSavedTheme() {
        try {
            // 优先级：localStorage > 系统偏好 > 默认亮色
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme) {
                this.currentTheme = savedTheme;
                console.log(`🎨 加载保存的主题: ${savedTheme}`);
            } else if (systemPrefersDark) {
                this.currentTheme = 'dark';
                console.log('🎨 使用系统暗色主题偏好');
            } else {
                this.currentTheme = 'light';
                console.log('🎨 使用默认亮色主题');
            }
            
            this.applyTheme(this.currentTheme, false);
            
        } catch (error) {
            console.warn('⚠️ 加载主题偏好失败:', error);
            this.currentTheme = 'light';
            this.applyTheme('light', false);
        }
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 主题切换按钮点击事件
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // 只有在用户没有手动设置主题时才跟随系统
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                console.log(`🎨 系统主题变化: ${newTheme}`);
                this.applyTheme(newTheme, true);
            }
        });
        
        // 键盘快捷键支持 (Ctrl/Cmd + Shift + D)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
        
        console.log('🎨 主题事件监听器设置完成');
    }
    
    // 切换主题
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme, true);
        console.log(`🎨 主题切换: ${this.currentTheme} -> ${newTheme}`);
    }
    
    // 应用主题
    applyTheme(theme, animate = true) {
        const oldTheme = this.currentTheme;
        this.currentTheme = theme;
        
        // 添加切换动画类
        if (animate && this.themeToggle) {
            this.themeToggle.classList.add('switching');
            setTimeout(() => {
                this.themeToggle.classList.remove('switching');
            }, 500);
        }
        
        // 应用主题到文档
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        // 保存主题偏好
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.warn('⚠️ 保存主题偏好失败:', error);
        }
        
        // 更新按钮状态
        this.updateToggleButton();
        
        // 触发主题变化事件
        this.dispatchThemeChangeEvent(oldTheme, theme);
        
        // 更新meta标签颜色
        this.updateMetaThemeColor(theme);
        
        console.log(`🎨 主题应用成功: ${theme}`);
    }
    
    // 更新切换按钮状态
    updateToggleButton() {
        if (!this.themeToggle) return;
        
        const isDark = this.currentTheme === 'dark';
        
        // 更新按钮标题
        this.themeToggle.setAttribute('title', 
            isDark ? '切换到亮色主题' : '切换到暗色主题'
        );
        
        // 更新ARIA标签
        this.themeToggle.setAttribute('aria-label', 
            isDark ? '当前为暗色主题，点击切换到亮色主题' : '当前为亮色主题，点击切换到暗色主题'
        );
    }
    
    // 触发主题变化事件
    dispatchThemeChangeEvent(oldTheme, newTheme) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                oldTheme,
                newTheme,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
    }
    
    // 更新meta标签主题颜色
    updateMetaThemeColor(theme) {
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }
        
        // 设置主题颜色
        const themeColors = {
            light: '#ffffff',
            dark: '#0f0f0f'
        };
        
        themeColorMeta.content = themeColors[theme] || themeColors.light;
    }
    
    // 为所有元素添加主题切换过渡动画
    applyThemeTransitions() {
        // 检查用户是否偏好减少动画
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            console.log('🎨 用户偏好减少动画，跳过主题过渡动画');
            return;
        }
        
        // 为需要过渡的元素添加类
        const elementsToTransition = [
            'body',
            '.navbar',
            '.hero',
            '.post-card',
            '.btn',
            '.form-input',
            '.form-textarea',
            '.form-select',
            '.contact-info-item',
            '.hero-stat',
            '.hero-code-window',
            '.back-to-top',
            '.social-link'
        ];
        
        elementsToTransition.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.classList.add('theme-transition');
            });
        });
        
        console.log('🎨 主题过渡动画应用完成');
    }
    
    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    // 检查是否为暗色主题
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }
    
    // 强制设置主题（用于外部调用）
    setTheme(theme, animate = true) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn('⚠️ 无效的主题值:', theme);
            return;
        }
        
        this.applyTheme(theme, animate);
    }
    
    // 重置主题到系统偏好
    resetToSystemTheme() {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = systemPrefersDark ? 'dark' : 'light';
        
        // 清除保存的偏好
        try {
            localStorage.removeItem('theme');
        } catch (error) {
            console.warn('⚠️ 清除主题偏好失败:', error);
        }
        
        this.applyTheme(systemTheme, true);
        console.log(`🎨 重置到系统主题: ${systemTheme}`);
    }
}

// 全局主题管理器实例
let themeManager = null;

// 初始化主题管理器
function initThemeManager() {
    if (!themeManager) {
        themeManager = new ThemeManager();
        
        // 将主题管理器暴露到全局作用域（用于调试和外部调用）
        window.themeManager = themeManager;
        
        console.log('🎨 全局主题管理器初始化完成');
    }
    
    return themeManager;
}

// 监听主题变化事件（用于其他组件响应主题变化）
window.addEventListener('themeChanged', (event) => {
    const { oldTheme, newTheme } = event.detail;
    
    // 更新图表颜色（如果有的话）
    if (window.updateChartsTheme) {
        window.updateChartsTheme(newTheme);
    }
    
    // 更新代码高亮主题（如果有的话）
    if (window.updateCodeHighlightTheme) {
        window.updateCodeHighlightTheme(newTheme);
    }
    
    // 更新地图主题（如果有的话）
    if (window.updateMapTheme) {
        window.updateMapTheme(newTheme);
    }
    
    console.log(`🎨 主题变化事件处理完成: ${oldTheme} -> ${newTheme}`);
});

// 主题工具函数
const ThemeUtils = {
    // 获取当前主题
    getCurrentTheme() {
        return themeManager ? themeManager.getCurrentTheme() : 'light';
    },
    
    // 检查是否为暗色主题
    isDark() {
        return themeManager ? themeManager.isDarkTheme() : false;
    },
    
    // 切换主题
    toggle() {
        if (themeManager) {
            themeManager.toggleTheme();
        }
    },
    
    // 设置主题
    setTheme(theme) {
        if (themeManager) {
            themeManager.setTheme(theme);
        }
    },
    
    // 重置到系统主题
    resetToSystem() {
        if (themeManager) {
            themeManager.resetToSystemTheme();
        }
    }
};

// 将主题工具函数暴露到全局作用域
window.ThemeUtils = ThemeUtils;