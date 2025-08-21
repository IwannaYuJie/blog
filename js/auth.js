/**
 * 用户认证模块
 * 集成Firebase Authentication服务
 * 提供登录、注册、密码重置等功能
 * 支持安全的用户状态管理
 */

// 认证状态管理
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.isInitialized = false;
        
        // 等待Firebase初始化完成
        this.initializeAuth();
    }

    /**
     * 初始化认证服务
     */
    async initializeAuth() {
        try {
            // 等待Firebase配置加载完成
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase未加载，请检查Firebase SDK');
                return;
            }

            // 监听认证状态变化
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                this.notifyAuthStateListeners(user);
                
                if (user) {
                    console.log('✅ 用户已登录:', user.email);
                    this.handleUserLogin(user);
                } else {
                    console.log('👋 用户已登出');
                    this.handleUserLogout();
                }
            });

            this.isInitialized = true;
            console.log('🔐 认证服务初始化完成');
        } catch (error) {
            console.error('❌ 认证服务初始化失败:', error);
        }
    }

    /**
     * 添加认证状态监听器
     * @param {Function} listener 监听器函数
     */
    addAuthStateListener(listener) {
        this.authStateListeners.push(listener);
    }

    /**
     * 移除认证状态监听器
     * @param {Function} listener 监听器函数
     */
    removeAuthStateListener(listener) {
        const index = this.authStateListeners.indexOf(listener);
        if (index > -1) {
            this.authStateListeners.splice(index, 1);
        }
    }

    /**
     * 通知所有认证状态监听器
     * @param {Object} user 用户对象
     */
    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(listener => {
            try {
                listener(user);
            } catch (error) {
                console.error('❌ 认证状态监听器错误:', error);
            }
        });
    }

    /**
     * 处理用户登录
     * @param {Object} user Firebase用户对象
     */
    handleUserLogin(user) {
        // 存储用户信息到localStorage（仅存储必要信息）
        const userInfo = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            lastLoginAt: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.setItem('isLoggedIn', 'true');
        } catch (error) {
            console.warn('⚠️ 无法存储用户信息到localStorage:', error);
        }

        // 更新UI
        this.updateUIForLoggedInUser(userInfo);
    }

    /**
     * 处理用户登出
     */
    handleUserLogout() {
        // 清除本地存储的用户信息
        try {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('isLoggedIn');
        } catch (error) {
            console.warn('⚠️ 无法清除localStorage:', error);
        }

        // 更新UI
        this.updateUIForLoggedOutUser();
    }

    /**
     * 更新已登录用户的UI
     * @param {Object} userInfo 用户信息
     */
    updateUIForLoggedInUser(userInfo) {
        // 这个方法将在导航栏集成时实现
        console.log('🎨 更新UI - 用户已登录:', userInfo.displayName);
    }

    /**
     * 更新已登出用户的UI
     */
    updateUIForLoggedOutUser() {
        // 这个方法将在导航栏集成时实现
        console.log('🎨 更新UI - 用户已登出');
    }

    /**
     * 用户登录
     * @param {string} email 邮箱
     * @param {string} password 密码
     * @param {boolean} rememberMe 是否记住登录状态
     * @returns {Promise<Object>} 登录结果
     */
    async login(email, password, rememberMe = false) {
        try {
            // 设置持久化类型
            const persistence = rememberMe 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;
            
            await firebase.auth().setPersistence(persistence);

            // 执行登录
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log('✅ 登录成功:', user.email);
            
            return {
                success: true,
                user: user,
                message: '登录成功！'
            };
        } catch (error) {
            console.error('❌ 登录失败:', error);
            console.error('❌ 错误码:', error.code);
            console.error('❌ 错误信息:', error.message);
            const errorMessage = this.getErrorMessage(error);
            console.error('❌ 处理后的错误信息:', errorMessage);
            return {
                success: false,
                error: error,
                message: errorMessage
            };
        }
    }

    /**
     * 用户注册
     * @param {string} email 邮箱
     * @param {string} password 密码
     * @param {string} displayName 显示名称
     * @returns {Promise<Object>} 注册结果
     */
    async register(email, password, displayName) {
        try {
            // 创建用户账户
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 更新用户资料
            await user.updateProfile({
                displayName: displayName
            });

            // 发送邮箱验证
            await user.sendEmailVerification();

            console.log('✅ 注册成功:', user.email);
            
            return {
                success: true,
                user: user,
                message: '注册成功！请查收邮箱验证邮件。'
            };
        } catch (error) {
            console.error('❌ 注册失败:', error);
            return {
                success: false,
                error: error,
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Google登录
     * @returns {Promise<Object>} 登录结果
     */
    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;

            console.log('✅ Google登录成功:', user.email);
            
            return {
                success: true,
                user: user,
                message: 'Google登录成功！'
            };
        } catch (error) {
            console.error('❌ Google登录失败:', error);
            return {
                success: false,
                error: error,
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * 发送密码重置邮件
     * @param {string} email 邮箱地址
     * @returns {Promise<Object>} 重置结果
     */
    async resetPassword(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            
            console.log('✅ 密码重置邮件已发送:', email);
            
            return {
                success: true,
                message: '密码重置邮件已发送，请查收邮箱。'
            };
        } catch (error) {
            console.error('❌ 发送密码重置邮件失败:', error);
            return {
                success: false,
                error: error,
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * 用户登出
     * @returns {Promise<Object>} 登出结果
     */
    async logout() {
        try {
            await firebase.auth().signOut();
            
            console.log('✅ 登出成功');
            
            return {
                success: true,
                message: '已成功登出！'
            };
        } catch (error) {
            console.error('❌ 登出失败:', error);
            return {
                success: false,
                error: error,
                message: '登出失败，请重试。'
            };
        }
    }

    /**
     * 获取当前用户
     * @returns {Object|null} 当前用户对象
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 检查用户是否已登录
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * 获取用户信息
     * @returns {Object|null} 用户信息
     */
    getUserInfo() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            console.warn('⚠️ 无法获取用户信息:', error);
            return null;
        }
    }

    /**
     * 转换Firebase错误为用户友好的消息
     * @param {Object} error Firebase错误对象
     * @returns {string} 错误消息
     */
    getErrorMessage(error) {
        const errorMessages = {
            'auth/user-not-found': '用户不存在，请检查邮箱地址。',
            'auth/wrong-password': '密码错误，请重试。',
            'auth/invalid-credential': '邮箱或密码错误，请检查后重试。', // 🐕 新增：处理无效凭据错误
            'auth/email-already-in-use': '该邮箱已被注册，请使用其他邮箱。',
            'auth/weak-password': '密码强度不够，请使用至少6位字符。',
            'auth/invalid-email': '邮箱格式不正确，请检查输入。',
            'auth/user-disabled': '该账户已被禁用，请联系管理员。',
            'auth/too-many-requests': '请求过于频繁，请稍后再试。',
            'auth/network-request-failed': '网络连接失败，请检查网络设置。',
            'auth/popup-closed-by-user': '登录窗口被关闭，请重试。',
            'auth/cancelled-popup-request': '登录请求被取消。',
            'auth/popup-blocked': '登录弹窗被阻止，请允许弹窗并重试。'
        };

        return errorMessages[error.code] || `登录失败：${error.message}`;
    }
}

// 创建全局认证管理器实例
const authManager = new AuthManager();

// 登录页面逻辑
class LoginPageManager {
    constructor() {
        this.currentCard = 'login'; // 'login', 'signup', 'forgot'
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
    }

    /**
     * 初始化DOM元素
     */
    initializeElements() {
        // 卡片元素
        this.loginCard = document.getElementById('loginForm')?.closest('.login-card');
        this.signupCard = document.getElementById('signupCard');
        this.forgotCard = document.getElementById('forgotCard');

        // 表单元素
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.forgotForm = document.getElementById('forgotForm');

        // 按钮元素
        this.loginBtn = document.getElementById('loginBtn');
        this.signupBtn = document.getElementById('signupBtn');
        this.forgotBtn = document.getElementById('forgotBtn');
        this.googleLoginBtn = document.getElementById('googleLoginBtn');

        // 链接元素
        this.signupLink = document.getElementById('signupLink');
        this.loginLink = document.getElementById('loginLink');
        this.forgotPasswordLink = document.getElementById('forgotPasswordLink');
        this.backToLoginLink = document.getElementById('backToLoginLink');

        // 密码切换按钮
        this.passwordToggles = document.querySelectorAll('.password-toggle');

        // 消息元素
        this.formMessage = document.getElementById('formMessage');
        this.signupFormMessage = document.getElementById('signupFormMessage');
        this.forgotFormMessage = document.getElementById('forgotFormMessage');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 表单提交事件
        this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.signupForm?.addEventListener('submit', (e) => this.handleSignup(e));
        this.forgotForm?.addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Google登录
        this.googleLoginBtn?.addEventListener('click', () => this.handleGoogleLogin());

        // 卡片切换链接
        this.signupLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchCard('signup');
        });
        
        this.loginLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchCard('login');
        });
        
        this.forgotPasswordLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchCard('forgot');
        });
        
        this.backToLoginLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchCard('login');
        });

        // 密码显示/隐藏切换
        this.passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.togglePasswordVisibility(toggle));
        });

        // 实时表单验证（将在validation.js中实现）
        this.setupFormValidation();
    }

    /**
     * 设置表单验证
     */
    setupFormValidation() {
        // 这个方法将在login-validation.js中扩展
        console.log('🔍 表单验证设置完成');
    }

    /**
     * 处理登录
     * @param {Event} event 表单提交事件
     */
    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(this.loginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';

        this.setLoading(this.loginBtn, true);
        this.clearMessage(this.formMessage);

        try {
            console.log('🔍 handleLogin开始执行');
            const result = await authManager.login(email, password, rememberMe);
            console.log('🔍 login方法返回结果:', result);
            console.log('🔍 result.success值:', result.success);
            
            if (result.success) {
                console.log('🔍 登录成功分支');
                this.showMessage(this.formMessage, result.message, 'success');
                
                // 延迟跳转到主页
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                console.log('🔍 登录失败分支，显示错误信息:', result.message);
                this.showMessage(this.formMessage, result.message, 'error');
            }
        } catch (error) {
            console.error('❌ 登录处理错误:', error);
            this.showMessage(this.formMessage, '登录失败，请重试。', 'error');
        } finally {
            this.setLoading(this.loginBtn, false);
        }
    }

    /**
     * 处理注册
     * @param {Event} event 表单提交事件
     */
    async handleSignup(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(this.signupForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // 验证密码匹配
        if (password !== confirmPassword) {
            this.showMessage(this.signupFormMessage, '两次输入的密码不一致。', 'error');
            return;
        }

        this.setLoading(this.signupBtn, true);
        this.clearMessage(this.signupFormMessage);

        try {
            const result = await authManager.register(email, password, name);
            
            if (result.success) {
                this.showMessage(this.signupFormMessage, result.message, 'success');
                
                // 延迟切换到登录卡片
                setTimeout(() => {
                    this.switchCard('login');
                    this.showMessage(this.formMessage, '注册成功！请登录您的账户。', 'info');
                }, 2000);
            } else {
                this.showMessage(this.signupFormMessage, result.message, 'error');
            }
        } catch (error) {
            console.error('❌ 注册处理错误:', error);
            this.showMessage(this.signupFormMessage, '注册失败，请重试。', 'error');
        } finally {
            this.setLoading(this.signupBtn, false);
        }
    }

    /**
     * 处理忘记密码
     * @param {Event} event 表单提交事件
     */
    async handleForgotPassword(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(this.forgotForm);
        const email = formData.get('email');

        this.setLoading(this.forgotBtn, true);
        this.clearMessage(this.forgotFormMessage);

        try {
            const result = await authManager.resetPassword(email);
            
            if (result.success) {
                this.showMessage(this.forgotFormMessage, result.message, 'success');
                
                // 延迟切换到登录卡片
                setTimeout(() => {
                    this.switchCard('login');
                    this.showMessage(this.formMessage, '密码重置邮件已发送，请查收。', 'info');
                }, 3000);
            } else {
                this.showMessage(this.forgotFormMessage, result.message, 'error');
            }
        } catch (error) {
            console.error('❌ 密码重置处理错误:', error);
            this.showMessage(this.forgotFormMessage, '发送失败，请重试。', 'error');
        } finally {
            this.setLoading(this.forgotBtn, false);
        }
    }

    /**
     * 处理Google登录
     */
    async handleGoogleLogin() {
        if (this.isLoading) return;
        
        this.setLoading(this.googleLoginBtn, true);
        this.clearMessage(this.formMessage);

        try {
            const result = await authManager.loginWithGoogle();
            
            if (result.success) {
                this.showMessage(this.formMessage, result.message, 'success');
                
                // 延迟跳转到主页
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.showMessage(this.formMessage, result.message, 'error');
            }
        } catch (error) {
            console.error('❌ Google登录处理错误:', error);
            this.showMessage(this.formMessage, 'Google登录失败，请重试。', 'error');
        } finally {
            this.setLoading(this.googleLoginBtn, false);
        }
    }

    /**
     * 切换卡片
     * @param {string} cardType 卡片类型：'login', 'signup', 'forgot'
     */
    switchCard(cardType) {
        // 隐藏所有卡片
        [this.loginCard, this.signupCard, this.forgotCard].forEach(card => {
            if (card) {
                card.style.display = 'none';
            }
        });

        // 显示目标卡片
        let targetCard;
        switch (cardType) {
            case 'signup':
                targetCard = this.signupCard;
                break;
            case 'forgot':
                targetCard = this.forgotCard;
                break;
            default:
                targetCard = this.loginCard;
        }

        if (targetCard) {
            targetCard.style.display = 'block';
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        this.currentCard = cardType;
        
        // 清除所有消息
        this.clearMessage(this.formMessage);
        this.clearMessage(this.signupFormMessage);
        this.clearMessage(this.forgotFormMessage);
    }

    /**
     * 切换密码可见性
     * @param {HTMLElement} toggle 切换按钮
     */
    togglePasswordVisibility(toggle) {
        const input = toggle.parentElement.querySelector('input');
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
            toggle.setAttribute('aria-label', '隐藏密码');
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
            toggle.setAttribute('aria-label', '显示密码');
        }
    }

    /**
     * 设置按钮加载状态
     * @param {HTMLElement} button 按钮元素
     * @param {boolean} loading 是否加载中
     */
    setLoading(button, loading) {
        if (!button) return;
        
        this.isLoading = loading;
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    /**
     * 显示消息
     * @param {HTMLElement} messageElement 消息元素
     * @param {string} message 消息内容
     * @param {string} type 消息类型：'success', 'error', 'info'
     */
    showMessage(messageElement, message, type = 'info') {
        console.log('🔍 showMessage被调用:', { messageElement, message, type });
        
        if (!messageElement) {
            console.warn('⚠️ 消息元素不存在');
            return;
        }
        
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
        messageElement.style.display = 'block';
        
        console.log('🔍 消息已设置:', messageElement.textContent, '显示状态:', messageElement.style.display);
        
        // 自动隐藏成功消息
        if (type === 'success') {
            setTimeout(() => {
                this.clearMessage(messageElement);
            }, 5000);
        }
    }

    /**
     * 清除消息
     * @param {HTMLElement} messageElement 消息元素
     */
    clearMessage(messageElement) {
        if (!messageElement) return;
        
        messageElement.textContent = '';
        messageElement.className = 'form-message';
        messageElement.style.display = 'none';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在登录页面
    if (document.getElementById('loginForm')) {
        console.log('🚀 初始化登录页面管理器');
        new LoginPageManager();
    }
    
    // 检查用户是否已登录（用于其他页面）
    if (authManager.isLoggedIn()) {
        console.log('👤 用户已登录');
    }
});

// 导出给其他模块使用
if (typeof window !== 'undefined') {
    window.authManager = authManager;
    window.LoginPageManager = LoginPageManager;
}