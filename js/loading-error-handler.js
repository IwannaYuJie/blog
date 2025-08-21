// ========================================
// 加载状态和错误处理UI管理器
// ========================================

class LoadingErrorHandler {
    constructor() {
        this.networkStatus = document.getElementById('network-status');
        this.networkBanner = document.getElementById('network-banner');
        this.offlineOverlay = document.getElementById('offline-overlay');
        this.reconnectIndicator = document.getElementById('reconnect-indicator');
        this.retryConnectionBtn = document.getElementById('retry-connection-btn');
        this.closeOfflineModalBtn = document.getElementById('close-offline-modal');
        
        this.isOnline = navigator.onLine;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkInitialNetworkStatus();
    }
    
    setupEventListeners() {
        // 网络状态监听
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // 重试按钮
        if (this.retryConnectionBtn) {
            this.retryConnectionBtn.addEventListener('click', () => this.retryConnection());
        }
        
        // 关闭离线模态框
        if (this.closeOfflineModalBtn) {
            this.closeOfflineModalBtn.addEventListener('click', () => this.hideOfflineModal());
        }
        
        // 点击模态框外部关闭
        if (this.offlineOverlay) {
            this.offlineOverlay.addEventListener('click', (e) => {
                if (e.target === this.offlineOverlay) {
                    this.hideOfflineModal();
                }
            });
        }
    }
    
    checkInitialNetworkStatus() {
        if (!navigator.onLine) {
            this.handleOffline();
        }
    }
    
    handleOnline() {
        // // console.log('🌐 网络连接已恢复');
        this.isOnline = true;
        this.reconnectAttempts = 0;
        
        // 隐藏网络状态指示器
        this.hideNetworkStatus();
        
        // 隐藏离线模态框
        this.hideOfflineModal();
        
        // 隐藏重连指示器
        this.hideReconnectIndicator();
        
        // 显示成功提示
        this.showSuccessToast('网络连接已恢复');
        
        // 停止重连尝试
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        
        // 触发重新加载数据
        this.triggerDataReload();
    }
    
    handleOffline() {
        // // console.log('❌ 网络连接已断开');
        this.isOnline = false;
        
        // 显示网络状态指示器
        this.showNetworkStatus(false);
        
        // 延迟显示离线模态框
        setTimeout(() => {
            if (!this.isOnline) {
                this.showOfflineModal();
            }
        }, 3000);
        
        // 开始自动重连尝试
        this.startAutoReconnect();
    }
    
    showNetworkStatus(isOnline = true) {
        if (!this.networkStatus || !this.networkBanner) return;
        
        const icon = this.networkBanner.querySelector('.network-icon');
        const text = this.networkBanner.querySelector('.network-text');
        
        if (isOnline) {
            this.networkBanner.classList.add('online');
            icon.className = 'network-icon fas fa-wifi';
            text.textContent = '网络连接已恢复';
        } else {
            this.networkBanner.classList.remove('online');
            icon.className = 'network-icon fas fa-wifi-slash';
            text.textContent = '网络连接已断开，请检查您的网络设置';
        }
        
        this.networkStatus.classList.add('show');
        
        // 如果是在线状态，3秒后自动隐藏
        if (isOnline) {
            setTimeout(() => {
                this.hideNetworkStatus();
            }, 3000);
        }
    }
    
    hideNetworkStatus() {
        if (this.networkStatus) {
            this.networkStatus.classList.remove('show');
        }
    }
    
    showOfflineModal() {
        if (this.offlineOverlay) {
            this.offlineOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideOfflineModal() {
        if (this.offlineOverlay) {
            this.offlineOverlay.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }
    
    showReconnectIndicator() {
        if (this.reconnectIndicator) {
            this.reconnectIndicator.classList.add('show');
        }
    }
    
    hideReconnectIndicator() {
        if (this.reconnectIndicator) {
            this.reconnectIndicator.classList.remove('show');
        }
    }
    
    startAutoReconnect() {
        if (this.reconnectInterval) return;
        
        this.reconnectAttempts = 0;
        this.showReconnectIndicator();
        
        this.reconnectInterval = setInterval(() => {
            this.attemptReconnect();
        }, 5000); // 每5秒尝试一次
    }
    
    async attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.hideReconnectIndicator();
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
            // // console.log('🔄 已达到最大重连次数，停止自动重连');
            return;
        }
        
        this.reconnectAttempts++;
        // // console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        try {
            // 尝试发送一个简单的网络请求来检测连接
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            // 如果请求成功，触发在线事件
            if (navigator.onLine) {
                this.handleOnline();
            }
        } catch (error) {
            // // console.log(`❌ 重连失败 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        }
    }
    
    async retryConnection() {
        const btn = this.retryConnectionBtn;
        if (!btn) return;
        
        // 显示加载状态
        btn.classList.add('loading');
        btn.disabled = true;
        
        try {
            // 尝试连接
            await this.testConnection();
            
            if (navigator.onLine) {
                this.handleOnline();
            } else {
                throw new Error('网络仍然不可用');
            }
        } catch (error) {
            // // console.error('❌ 手动重连失败:', error);
            this.showErrorToast('重连失败，请检查网络设置');
        } finally {
            // 恢复按钮状态
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }
    
    async testConnection() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('连接超时'));
            }, 5000);
            
            fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            }).then(() => {
                clearTimeout(timeout);
                resolve();
            }).catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    
    triggerDataReload() {
        // 触发自定义事件，通知其他模块重新加载数据
        window.dispatchEvent(new CustomEvent('networkRestored'));
        
        // 如果存在全局的loadPosts函数，重新加载文章
        if (typeof loadPosts === 'function') {
            loadPosts(true);
        }
    }
    
    // 骨架屏相关方法
    createSkeletonPostCard() {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'skeleton-post-card';
        skeletonCard.innerHTML = `
            <div class="skeleton skeleton-post-image"></div>
            <div class="skeleton skeleton-post-category"></div>
            <div class="skeleton skeleton-post-title"></div>
            <div class="skeleton skeleton-post-title-short"></div>
            <div class="skeleton skeleton-post-excerpt"></div>
            <div class="skeleton skeleton-post-excerpt"></div>
            <div class="skeleton-post-meta">
                <div class="skeleton skeleton-post-meta-item"></div>
                <div class="skeleton skeleton-post-meta-item"></div>
            </div>
        `;
        return skeletonCard;
    }
    
    showSkeletonPosts(container, count = 3) {
        if (!container) return;
        
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.appendChild(this.createSkeletonPostCard());
        }
    }
    
    // 错误状态相关方法
    createErrorState(title = '加载失败', message = '抱歉，内容加载失败。请稍后重试。', showRetry = true) {
        const errorState = document.createElement('div');
        errorState.className = 'error-state';
        
        let retryButton = '';
        if (showRetry) {
            retryButton = `
                <button class="retry-btn" onclick="window.loadingErrorHandler.handleRetry()">
                    <span class="btn-text">
                        <i class="fas fa-redo"></i>
                        重试
                    </span>
                    <div class="retry-spinner"></div>
                </button>
            `;
        }
        
        errorState.innerHTML = `
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="error-title">${title}</h3>
            <p class="error-message">${message}</p>
            <div class="error-actions">
                ${retryButton}
                <button class="btn btn-secondary" onclick="window.location.reload()">
                    <i class="fas fa-refresh"></i>
                    刷新页面
                </button>
            </div>
        `;
        
        return errorState;
    }
    
    createEmptyState(title = '暂无内容', message = '这里还没有任何内容，稍后再来看看吧。', showAction = false) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        let actionButton = '';
        if (showAction) {
            actionButton = `
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-refresh"></i>
                    刷新页面
                </button>
            `;
        }
        
        emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-inbox"></i>
            </div>
            <h3 class="empty-title">${title}</h3>
            <p class="empty-message">${message}</p>
            ${actionButton}
        `;
        
        return emptyState;
    }
    
    showErrorState(container, title, message, showRetry = true) {
        if (!container) return;
        
        container.innerHTML = '';
        container.appendChild(this.createErrorState(title, message, showRetry));
    }
    
    showEmptyState(container, title, message, showAction = false) {
        if (!container) return;
        
        container.innerHTML = '';
        container.appendChild(this.createEmptyState(title, message, showAction));
    }
    
    // 处理重试操作
    handleRetry() {
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('retryRequested'));
        
        // 如果存在全局的loadPosts函数，重新加载文章
        if (typeof loadPosts === 'function') {
            loadPosts(true);
        }
    }
    
    // 提示消息相关方法
    showLoadingToast(message = '正在加载...') {
        const existingToast = document.querySelector('.loading-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'loading-toast';
        toast.innerHTML = `
            <i class="fas fa-spinner"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        return toast;
    }
    
    hideLoadingToast() {
        const toast = document.querySelector('.loading-toast');
        if (toast) {
            toast.remove();
        }
    }
    
    showSuccessToast(message = '操作成功') {
        const existingToast = document.querySelector('.success-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    showErrorToast(message = '操作失败') {
        const existingToast = document.querySelector('.error-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'success-toast error-toast';
        toast.style.background = 'linear-gradient(135deg, var(--error-500), var(--error-600))';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// 创建全局实例
window.loadingErrorHandler = new LoadingErrorHandler();

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingErrorHandler;
}