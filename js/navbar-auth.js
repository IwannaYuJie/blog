/**
 * 导航栏认证状态管理
 * 处理主页导航栏中的用户认证状态显示、主题切换和用户交互
 * 与Firebase Auth集成，提供实时的用户状态更新
 */

class NavbarAuthManager {
    constructor() {
        this.authManager = null;
        this.currentUser = null;
        this.isInitialized = false;
        
        // DOM元素引用
        this.elements = {
            themeToggle: null,
            authGuest: null,
            authUser: null,
            userAvatar: null,
            userDropdown: null,
            userDropdownMenu: null,
            userName: null,
            userInfoName: null,
            userInfoEmail: null,
            userInfoAvatar: null,
            userInfoAvatarPlaceholder: null,
            logoutBtn: null
        };
        
        this.init();
    }
    
    /**
     * 初始化导航栏认证管理器
     */
    async init() {
        try {
            await this.waitForFirebase();
            await this.initializeElements();
            await this.initializeAuth();
            this.bindEvents();
            this.initializeTheme();
            this.isInitialized = true;
            // console.log('🎉 导航栏认证管理器初始化成功');
        } catch (error) {
            // console.error('❌ 导航栏认证管理器初始化失败:', error);
        }
    }
    
    /**
     * 等待Firebase加载完成
     */
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkFirebase = () => {
                attempts++;
                
                if (window.firebase && window.firebase.auth) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase加载超时'));
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            
            checkFirebase();
        });
    }
    
    /**
     * 初始化DOM元素引用
     */
    async initializeElements() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // 获取DOM元素
        this.elements.themeToggle = document.getElementById('theme-toggle');
        this.elements.authGuest = document.querySelector('.auth-guest');
        this.elements.authUser = document.querySelector('.auth-user');
        this.elements.userAvatar = document.querySelector('.user-avatar');
        this.elements.userDropdown = document.querySelector('.user-dropdown');
        this.elements.userDropdownMenu = document.querySelector('.user-dropdown-menu');
        this.elements.userName = document.querySelector('.user-name');
        this.elements.userInfoName = document.querySelector('.user-info-name');
        this.elements.userInfoEmail = document.querySelector('.user-info-email');
        this.elements.userInfoAvatar = document.querySelector('.user-info-avatar img');
        this.elements.userInfoAvatarPlaceholder = document.querySelector('.user-info-avatar-placeholder');
        this.elements.logoutBtn = document.querySelector('.logout-btn');
        
        // 验证关键元素是否存在
        if (!this.elements.themeToggle) {
            // console.warn('⚠️ 主题切换按钮未找到');
        }
        
        if (!this.elements.authGuest || !this.elements.authUser) {
            // console.warn('⚠️ 认证区域元素未找到');
        }
    }
    
    /**
     * 初始化认证管理器
     */
    async initializeAuth() {
        try {
            // 等待AuthManager加载
            if (typeof window.authManager !== 'undefined') {
                this.authManager = window.authManager;
                
                // 监听认证状态变化
                this.authManager.addAuthStateListener((user) => {
                    this.handleAuthStateChange(user);
                });
                
                // console.log('✅ 认证管理器初始化成功');
            } else {
                // console.warn('⚠️ AuthManager未加载，将在稍后重试');
                // 延迟重试
                setTimeout(() => this.initializeAuth(), 1000);
            }
        } catch (error) {
            // console.error('❌ 认证管理器初始化失败:', error);
        }
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 主题切换按钮
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // 用户头像下拉菜单
        if (this.elements.userAvatar) {
            this.elements.userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserDropdown();
            });
        }
        
        // 退出登录按钮
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleLogout();
            });
        }
        
        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (this.elements.userDropdown && 
                !this.elements.userDropdown.contains(e.target)) {
                this.closeUserDropdown();
            }
        });
        
        // ESC键关闭下拉菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUserDropdown();
            }
        });
    }
    
    /**
     * 初始化主题
     */
    initializeTheme() {
        // 从localStorage获取保存的主题
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const currentTheme = savedTheme || systemTheme;
        
        this.setTheme(currentTheme);
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    /**
     * 处理认证状态变化
     */
    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            this.showUserState(user);
        } else {
            this.showGuestState();
        }
    }
    
    /**
     * 显示已登录用户状态
     */
    showUserState(user) {
        if (!this.elements.authGuest || !this.elements.authUser) return;
        
        // 隐藏游客状态，显示用户状态
        this.elements.authGuest.style.display = 'none';
        this.elements.authUser.style.display = 'block';
        
        // 更新用户信息
        this.updateUserInfo(user);
        
        // console.log('👤 用户已登录:', user.email);
    }
    
    /**
     * 显示游客状态
     */
    showGuestState() {
        if (!this.elements.authGuest || !this.elements.authUser) return;
        
        // 显示游客状态，隐藏用户状态
        this.elements.authGuest.style.display = 'block';
        this.elements.authUser.style.display = 'none';
        
        // 关闭下拉菜单
        this.closeUserDropdown();
        
        // console.log('👋 用户已退出登录');
    }
    
    /**
     * 更新用户信息显示
     */
    updateUserInfo(user) {
        const displayName = user.displayName || user.email?.split('@')[0] || '用户';
        const email = user.email || '';
        const photoURL = user.photoURL;
        
        // 更新导航栏用户名
        if (this.elements.userName) {
            this.elements.userName.textContent = displayName;
        }
        
        // 更新下拉菜单中的用户信息
        if (this.elements.userInfoName) {
            this.elements.userInfoName.textContent = displayName;
        }
        
        if (this.elements.userInfoEmail) {
            this.elements.userInfoEmail.textContent = email;
        }
        
        // 更新头像
        this.updateUserAvatar(displayName, photoURL);
    }
    
    /**
     * 更新用户头像
     */
    updateUserAvatar(displayName, photoURL) {
        const avatarElements = [
            document.querySelector('.user-avatar-placeholder'),
            document.querySelector('.user-info-avatar-placeholder')
        ];
        
        const imgElements = [
            document.querySelector('.user-avatar img'),
            document.querySelector('.user-info-avatar img')
        ];
        
        if (photoURL) {
            // 显示用户头像图片
            imgElements.forEach(img => {
                if (img) {
                    img.src = photoURL;
                    img.style.display = 'block';
                }
            });
            
            avatarElements.forEach(placeholder => {
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
            });
        } else {
            // 显示用户名首字母
            const initial = displayName.charAt(0).toUpperCase();
            
            avatarElements.forEach(placeholder => {
                if (placeholder) {
                    placeholder.textContent = initial;
                    placeholder.style.display = 'flex';
                }
            });
            
            imgElements.forEach(img => {
                if (img) {
                    img.style.display = 'none';
                }
            });
        }
    }
    
    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    /**
     * 设置主题
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // 更新主题切换按钮的aria-label
        if (this.elements.themeToggle) {
            const label = theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题';
            this.elements.themeToggle.setAttribute('aria-label', label);
        }
        
        // // console.log(`🎨 主题已切换到: ${theme}`);
    }
    
    /**
     * 切换用户下拉菜单
     */
    toggleUserDropdown() {
        if (!this.elements.userDropdown) return;
        
        const isActive = this.elements.userDropdown.classList.contains('active');
        
        if (isActive) {
            this.closeUserDropdown();
        } else {
            this.openUserDropdown();
        }
    }
    
    /**
     * 打开用户下拉菜单
     */
    openUserDropdown() {
        if (!this.elements.userDropdown) return;
        
        this.elements.userDropdown.classList.add('active');
        
        // 设置焦点到第一个菜单项
        const firstItem = this.elements.userDropdownMenu?.querySelector('.dropdown-item');
        if (firstItem) {
            setTimeout(() => firstItem.focus(), 100);
        }
    }
    
    /**
     * 关闭用户下拉菜单
     */
    closeUserDropdown() {
        if (!this.elements.userDropdown) return;
        
        this.elements.userDropdown.classList.remove('active');
    }
    
    /**
     * 处理退出登录
     */
    async handleLogout() {
        if (!this.authManager) {
            // console.error('❌ 认证管理器未初始化');
            return;
        }
        
        try {
            // 显示加载状态
            if (this.elements.logoutBtn) {
                this.elements.logoutBtn.classList.add('auth-loading');
                this.elements.logoutBtn.disabled = true;
            }
            
            // 执行退出登录
            await this.authManager.logout();
            
            // 关闭下拉菜单
            this.closeUserDropdown();
            
            // // console.log('👋 用户已成功退出登录');
            
        } catch (error) {
            // console.error('❌ 退出登录失败:', error);
            
            // 显示错误提示
            this.showMessage('退出登录失败，请重试', 'error');
            
        } finally {
            // 恢复按钮状态
            if (this.elements.logoutBtn) {
                this.elements.logoutBtn.classList.remove('auth-loading');
                this.elements.logoutBtn.disabled = false;
            }
        }
    }
    
    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // 添加样式
        Object.assign(messageEl.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-out',
            backgroundColor: type === 'error' ? '#ef4444' : '#10b981'
        });
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 显示动画
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    /**
     * 销毁管理器
     */
    destroy() {
        // 移除事件监听器
        if (this.elements.themeToggle) {
            this.elements.themeToggle.removeEventListener('click', this.toggleTheme);
        }
        
        if (this.elements.userAvatar) {
            this.elements.userAvatar.removeEventListener('click', this.toggleUserDropdown);
        }
        
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.removeEventListener('click', this.handleLogout);
        }
        
        // 清理引用
        this.authManager = null;
        this.currentUser = null;
        this.elements = {};
        this.isInitialized = false;
        
        // // console.log('🧹 导航栏认证管理器已销毁');
    }
}

// 全局实例
let navbarAuthManager = null;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        navbarAuthManager = new NavbarAuthManager();
    });
} else {
    navbarAuthManager = new NavbarAuthManager();
}

// 导出到全局作用域
window.NavbarAuthManager = NavbarAuthManager;
window.navbarAuthManager = navbarAuthManager;

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (navbarAuthManager) {
        navbarAuthManager.destroy();
    }
});