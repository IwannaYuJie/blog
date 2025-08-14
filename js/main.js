import {
    db,
    auth,
    signIn,
    loadPosts,
    handleContactForm,
    handlePostSubmit,
    fetchPostForEdit,
    deletePostFromDb
} from './modules/firebase.js';
import './modules/theme.js'; // Import to initialize theme manager
import { initAllAnimations } from './modules/animations.js';

// Animation-related functions have been moved to js/modules/animations.js

// UI-related state variables. Data-related state is now in the firebase module.
let currentUser = null; // Will be updated via auth state listener
let currentCategory = 'all';
let currentEditingPostId = null; // ID of the post being edited
let deletePostId = null; // ID of the post to be deleted

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
    // Initialize all animations and effects from the new module
    initAllAnimations();
    
    // 等待微交互系统初始化完成
    if (window.microInteractions) {
        console.log('✅ 微交互系统已就绪');
    }
    
    await initializeApp();
    setupEventListeners();
    setupAdminEventListeners();
});

// Refactored application initializer
async function initializeApp() {
    // Show loading state (this can be moved to a UI module later)
    if (window.loadingErrorHandler) {
        window.loadingErrorHandler.showSkeletonPosts(postsContainer, 3);
    } else {
        postsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>正在加载文章...</p></div>';
    }

    try {
        currentUser = await signIn(); // Sign in anonymously and get user state
        await loadInitialPosts(); // Load initial posts
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showErrorState(
                postsContainer,
                '初始化失败',
                `应用初始化失败: ${error.message}`,
                true
            );
        } else {
            postsContainer.innerHTML = `<div class="error-message"><p>初始化失败: ${error.message}</p></div>`;
        }
    }
}

// Helper to load initial set of posts
function loadInitialPosts() {
    const emptyCallback = () => {
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showEmptyState(postsContainer, '暂无文章', '还没有发布任何文章，请稍后再来查看。', true);
        } else {
            postsContainer.innerHTML = '<div class="no-posts"><p>暂无文章</p></div>';
        }
    };

    const errorCallback = (error) => {
        if (window.loadingErrorHandler) {
            window.loadingErrorHandler.showErrorState(postsContainer, '加载失败', `加载文章时出错: ${error.message}`, true);
        } else {
            postsContainer.innerHTML = `<div class="error-message"><p>加载文章时出错: ${error.message}</p></div>`;
        }
    };

    return loadPosts(true, currentCategory, postsContainer, loadMoreBtn, displayPost, emptyCallback, errorCallback);
}

// Shows a single post card in the UI
function displayPost(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card fade-in-up';
    postElement.innerHTML = `
        <div class="post-actions">
            <button class="action-btn edit" title="编辑文章">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" title="删除文章">
                <i class="fas fa-trash"></i>
            </button>
        </div>
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

    // Add event listeners instead of using onclick="..."
    postElement.querySelector('.edit').addEventListener('click', () => {
        editPost(post.id);
    });

    postElement.querySelector('.delete').addEventListener('click', () => {
        confirmDeletePost(post.id);
    });
    
    postElement.addEventListener('click', (e) => {
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
            loadInitialPosts();
        });
    });
    
    // 加载更多按钮
    loadMoreBtn.addEventListener('click', () => {
        const emptyCallback = () => { /* No-op on subsequent loads */ };
        const errorCallback = (error) => {
            if (window.loadingErrorHandler) {
                window.loadingErrorHandler.showErrorToast(`加载更多文章失败: ${error.message}`);
            }
        };
        loadPosts(false, currentCategory, postsContainer, loadMoreBtn, displayPost, emptyCallback, errorCallback);
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
        console.log('🌐 网络恢复，重新加载数据');
        loadInitialPosts();
    });
    
    // 监听重试请求事件
    window.addEventListener('retryRequested', () => {
        console.log('🔄 用户请求重试');
        loadInitialPosts();
    });
}

// Refactored admin event listeners
function setupAdminEventListeners() {
    if (addPostBtn) {
        addPostBtn.addEventListener('click', () => showPostForm());
    }
    
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            const success = await handlePostSubmit(e, currentEditingPostId);
            if (success) {
                hidePostForm();
                loadInitialPosts();
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hidePostForm);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (deletePostId) {
                const success = await deletePostFromDb(deletePostId);
                if (success) {
                    hideDeleteModal();
                    loadInitialPosts();
                }
                deletePostId = null;
            }
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    }
    
    if (deleteModalClose) {
        deleteModalClose.addEventListener('click', hideDeleteModal);
    }
    
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                hideDeleteModal();
            }
        });
    }
}

// UI function to show the post form
function showPostForm(post = null) {
    if (!adminPanel || !postForm) return;
    
    currentEditingPostId = post ? post.id : null;
    
    if (post) {
        formTitle.textContent = '编辑文章';
        submitBtn.textContent = '更新文章';
        document.getElementById('post-title').value = post.title || '';
        document.getElementById('post-excerpt').value = post.excerpt || '';
        document.getElementById('post-content').value = post.content || '';
        document.getElementById('post-category').value = post.category || 'tech';
        document.getElementById('post-tags').value = post.tags ? post.tags.join(', ') : '';
        document.getElementById('post-read-time').value = post.readTime || 5;
    } else {
        formTitle.textContent = '添加新文章';
        submitBtn.textContent = '发布文章';
        postForm.reset();
    }
    
    adminPanel.style.display = 'block';
}

// UI function to hide the post form
function hidePostForm() {
    if (!adminPanel) return;
    adminPanel.style.display = 'none';
    currentEditingPostId = null;
    if (postForm) postForm.reset();
}

// UI function to hide the delete modal
function hideDeleteModal() {
    if (deleteModal) {
        deleteModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    deletePostId = null;
}

// 隐藏删除模态框
function hideDeleteModal() {
    if (deleteModal) {
        deleteModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    deletePostId = null;
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

// These functions are called by the event listeners set up in displayPost
async function editPost(postId) {
    const post = await fetchPostForEdit(postId);
    if (post) {
        showPostForm(post);
    }
}

function confirmDeletePost(postId) {
    deletePostId = postId;
    if (deleteModal) {
        deleteModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

console.log('🚀 博客应用初始化完成');

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

console.log('🎬 滚动动画系统初始化完成');
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

// The ThemeManager is now in its own module and is imported.