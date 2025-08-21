/**
 * 图片优化工具
 * 处理图片懒加载、现代格式支持、响应式图片等
 */

(function() {
    'use strict';
    
    // 图片优化管理器
    const ImageOptimizer = {
        // 配置选项
        config: {
            lazyLoadOffset: 50, // 提前加载的距离
            placeholderQuality: 10, // 占位图质量
            retryAttempts: 3, // 重试次数
            retryDelay: 1000, // 重试延迟
            enableWebP: true,
            enableAVIF: true,
            enableProgressiveJPEG: true
        },
        
        // 支持的现代图片格式
        supportedFormats: {
            webp: null,
            avif: null,
            heic: null
        },
        
        // 初始化图片优化
        init() {
            // console.log('初始化图片优化...');
            
            // 1. 检测浏览器支持的图片格式
            this.detectFormatSupport();
            
            // 2. 设置懒加载
            this.setupLazyLoading();
            
            // 3. 优化现有图片
            this.optimizeExistingImages();
            
            // 4. 设置响应式图片
            this.setupResponsiveImages();
            
            // 5. 监听新添加的图片
            this.observeNewImages();
        },
        
        // 检测浏览器支持的图片格式
        async detectFormatSupport() {
            // 检测WebP支持
            this.supportedFormats.webp = await this.checkWebPSupport();
            
            // 检测AVIF支持
            this.supportedFormats.avif = await this.checkAVIFSupport();
            
            // 检测HEIC支持
            this.supportedFormats.heic = await this.checkHEICSupport();
            
            // console.log('支持的图片格式:', this.supportedFormats);
        },
        
        // 检测WebP支持
        checkWebPSupport() {
            return new Promise(resolve => {
                const webP = new Image();
                webP.onload = webP.onerror = () => {
                    resolve(webP.height === 2);
                };
                webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            });
        },
        
        // 检测AVIF支持
        checkAVIFSupport() {
            return new Promise(resolve => {
                const avif = new Image();
                avif.onload = avif.onerror = () => {
                    resolve(avif.height === 2);
                };
                avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
            });
        },
        
        // 检测HEIC支持
        checkHEICSupport() {
            return new Promise(resolve => {
                // HEIC支持检测比较复杂，这里简化处理
                resolve(false);
            });
        },
        
        // 设置懒加载
        setupLazyLoading() {
            if ('IntersectionObserver' in window) {
                this.setupIntersectionObserver();
            } else {
                this.setupScrollBasedLazyLoading();
            }
        },
        
        // 设置Intersection Observer懒加载
        setupIntersectionObserver() {
            const options = {
                root: null,
                rootMargin: `${this.config.lazyLoadOffset}px`,
                threshold: 0.01
            };
            
            this.lazyImageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, options);
            
            // 观察所有懒加载图片
            this.observeLazyImages();
        },
        
        // 观察懒加载图片
        observeLazyImages() {
            const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
            lazyImages.forEach(img => {
                this.lazyImageObserver.observe(img);
                this.addPlaceholder(img);
            });
        },
        
        // 添加占位图
        addPlaceholder(img) {
            if (img.src || img.dataset.placeholderAdded) return;
            
            const width = img.dataset.width || img.width || 300;
            const height = img.dataset.height || img.height || 200;
            
            // 生成低质量占位图
            const placeholder = this.generatePlaceholder(width, height, img.alt || '加载中...');
            img.src = placeholder;
            img.dataset.placeholderAdded = 'true';
            
            // 添加加载样式
            img.classList.add('lazy-loading');
        },
        
        // 生成占位图
        generatePlaceholder(width, height, text) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = width;
            canvas.height = height;
            
            // 渐变背景
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#f3f4f6');
            gradient.addColorStop(1, '#e5e7eb');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // 添加文本
            ctx.fillStyle = '#9ca3af';
            ctx.font = '14px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, height / 2);
            
            return canvas.toDataURL('image/jpeg', this.config.placeholderQuality / 100);
        },
        
        // 加载图片
        async loadImage(img) {
            try {
                const src = await this.getBestImageSrc(img);
                await this.loadImageWithRetry(img, src);
                
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
                
                // 触发加载完成事件
                const event = new CustomEvent('imageLoaded', {
                    detail: { img, src }
                });
                img.dispatchEvent(event);
                
            } catch (error) {
                // console.error('图片加载失败:', error);
                this.handleImageError(img, error);
            }
        },
        
        // 获取最佳图片源
        async getBestImageSrc(img) {
            const originalSrc = img.dataset.src;
            if (!originalSrc) return img.src;
            
            // 根据支持的格式选择最佳源
            if (this.config.enableAVIF && this.supportedFormats.avif && img.dataset.srcAvif) {
                return img.dataset.srcAvif;
            }
            
            if (this.config.enableWebP && this.supportedFormats.webp && img.dataset.srcWebp) {
                return img.dataset.srcWebp;
            }
            
            return originalSrc;
        },
        
        // 带重试的图片加载
        loadImageWithRetry(img, src, attempt = 1) {
            return new Promise((resolve, reject) => {
                const newImg = new Image();
                
                newImg.onload = () => {
                    // 使用渐进式加载
                    this.applyImageWithTransition(img, newImg.src);
                    resolve(newImg);
                };
                
                newImg.onerror = () => {
                    if (attempt < this.config.retryAttempts) {
                        // console.warn(`图片加载失败，重试 ${attempt}/${this.config.retryAttempts}: ${src}`);
                        setTimeout(() => {
                            this.loadImageWithRetry(img, src, attempt + 1)
                                .then(resolve)
                                .catch(reject);
                        }, this.config.retryDelay * attempt);
                    } else {
                        reject(new Error(`图片加载失败: ${src}`));
                    }
                };
                
                // 设置srcset如果存在
                if (img.dataset.srcset) {
                    newImg.srcset = img.dataset.srcset;
                }
                
                newImg.src = src;
            });
        },
        
        // 应用图片过渡效果
        applyImageWithTransition(img, src) {
            // 创建新的图片元素用于过渡
            const newImg = img.cloneNode(true);
            newImg.src = src;
            newImg.style.opacity = '0';
            newImg.style.transition = 'opacity 0.3s ease-out';
            
            // 插入到原图片后面
            img.parentNode.insertBefore(newImg, img.nextSibling);
            
            // 淡入新图片
            requestAnimationFrame(() => {
                newImg.style.opacity = '1';
            });
            
            // 移除原图片
            setTimeout(() => {
                if (img.parentNode) {
                    img.parentNode.removeChild(img);
                }
                newImg.style.transition = '';
            }, 300);
        },
        
        // 处理图片加载错误
        handleImageError(img, error) {
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');
            
            // 显示错误占位图
            const errorPlaceholder = this.generateErrorPlaceholder(
                img.dataset.width || 300,
                img.dataset.height || 200
            );
            img.src = errorPlaceholder;
            
            // 触发错误事件
            const event = new CustomEvent('imageError', {
                detail: { img, error }
            });
            img.dispatchEvent(event);
        },
        
        // 生成错误占位图
        generateErrorPlaceholder(width, height) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = width;
            canvas.height = height;
            
            // 错误背景
            ctx.fillStyle = '#fef2f2';
            ctx.fillRect(0, 0, width, height);
            
            // 错误图标和文本
            ctx.fillStyle = '#ef4444';
            ctx.font = '16px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠️ 图片加载失败', width / 2, height / 2);
            
            return canvas.toDataURL('image/png');
        },
        
        // 设置基于滚动的懒加载（回退方案）
        setupScrollBasedLazyLoading() {
            let lazyImages = Array.from(document.querySelectorAll('img[data-src]'));
            
            const loadImagesInViewport = () => {
                lazyImages = lazyImages.filter(img => {
                    if (this.isInViewport(img, this.config.lazyLoadOffset)) {
                        this.loadImage(img);
                        return false; // 从数组中移除
                    }
                    return true;
                });
                
                // 如果所有图片都加载完了，移除事件监听器
                if (lazyImages.length === 0) {
                    window.removeEventListener('scroll', throttledLoadImages);
                    window.removeEventListener('resize', throttledLoadImages);
                }
            };
            
            // 节流处理
            const throttledLoadImages = this.throttle(loadImagesInViewport, 200);
            
            window.addEventListener('scroll', throttledLoadImages);
            window.addEventListener('resize', throttledLoadImages);
            
            // 初始检查
            loadImagesInViewport();
        },
        
        // 检查元素是否在视口内
        isInViewport(element, offset = 0) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= -offset &&
                rect.left >= -offset &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
            );
        },
        
        // 节流函数
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // 优化现有图片
        optimizeExistingImages() {
            const images = document.querySelectorAll('img:not([data-src])');
            
            images.forEach(img => {
                // 添加现代格式支持
                this.addModernFormatSupport(img);
                
                // 优化图片尺寸
                this.optimizeImageSize(img);
                
                // 添加加载状态
                this.addLoadingState(img);
            });
        },
        
        // 添加现代格式支持
        addModernFormatSupport(img) {
            if (!img.src || img.src.startsWith('data:')) return;
            
            const src = img.src;
            const baseName = src.replace(/\.[^/.]+$/, '');
            const extension = src.split('.').pop().toLowerCase();
            
            // 只为常见格式添加现代格式支持
            if (['jpg', 'jpeg', 'png'].includes(extension)) {
                if (this.supportedFormats.avif) {
                    img.dataset.srcAvif = `${baseName}.avif`;
                }
                
                if (this.supportedFormats.webp) {
                    img.dataset.srcWebp = `${baseName}.webp`;
                }
            }
        },
        
        // 优化图片尺寸
        optimizeImageSize(img) {
            const rect = img.getBoundingClientRect();
            const devicePixelRatio = window.devicePixelRatio || 1;
            
            if (rect.width > 0 && rect.height > 0) {
                const optimalWidth = Math.ceil(rect.width * devicePixelRatio);
                const optimalHeight = Math.ceil(rect.height * devicePixelRatio);
                
                // 设置建议的尺寸属性
                img.dataset.optimalWidth = optimalWidth;
                img.dataset.optimalHeight = optimalHeight;
                
                // 如果图片明显过大，添加警告
                if (img.naturalWidth > optimalWidth * 2) {
                    // console.warn(`图片尺寸过大: ${img.src}, 建议尺寸: ${optimalWidth}x${optimalHeight}`);
                }
            }
        },
        
        // 添加加载状态
        addLoadingState(img) {
            if (img.complete && img.naturalHeight !== 0) {
                img.classList.add('loaded');
            } else {
                img.classList.add('loading');
                
                img.addEventListener('load', () => {
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                });
                
                img.addEventListener('error', () => {
                    img.classList.remove('loading');
                    img.classList.add('error');
                });
            }
        },
        
        // 设置响应式图片
        setupResponsiveImages() {
            const images = document.querySelectorAll('img:not([srcset])');
            
            images.forEach(img => {
                if (img.src && !img.src.startsWith('data:')) {
                    this.generateResponsiveSrcset(img);
                }
            });
        },
        
        // 生成响应式srcset
        generateResponsiveSrcset(img) {
            const src = img.src;
            const baseName = src.replace(/\.[^/.]+$/, '');
            const extension = src.split('.').pop();
            
            // 生成不同尺寸的srcset
            const sizes = [480, 768, 1024, 1280, 1920];
            const srcsetEntries = sizes.map(size => `${baseName}_${size}w.${extension} ${size}w`);
            
            // 添加原始尺寸
            srcsetEntries.push(`${src} 2000w`);
            
            img.srcset = srcsetEntries.join(', ');
            
            // 设置sizes属性
            if (!img.sizes) {
                img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
            }
        },
        
        // 监听新添加的图片
        observeNewImages() {
            if (!('MutationObserver' in window)) return;
            
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            // 检查新添加的图片
                            const images = node.tagName === 'IMG' ? [node] : 
                                          node.querySelectorAll ? Array.from(node.querySelectorAll('img')) : [];
                            
                            images.forEach(img => {
                                if (img.dataset.src || img.dataset.srcset) {
                                    // 懒加载图片
                                    if (this.lazyImageObserver) {
                                        this.lazyImageObserver.observe(img);
                                        this.addPlaceholder(img);
                                    }
                                } else {
                                    // 普通图片优化
                                    this.addModernFormatSupport(img);
                                    this.optimizeImageSize(img);
                                    this.addLoadingState(img);
                                }
                            });
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        // 预加载关键图片
        preloadCriticalImages(imageUrls) {
            imageUrls.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = url;
                
                // 根据格式支持选择最佳格式
                if (url.includes('.jpg') || url.includes('.jpeg')) {
                    if (this.supportedFormats.avif) {
                        link.href = url.replace(/\.(jpg|jpeg)$/i, '.avif');
                    } else if (this.supportedFormats.webp) {
                        link.href = url.replace(/\.(jpg|jpeg)$/i, '.webp');
                    }
                }
                
                document.head.appendChild(link);
            });
        },
        
        // 获取性能统计
        getPerformanceStats() {
            const images = document.querySelectorAll('img');
            const stats = {
                total: images.length,
                loaded: document.querySelectorAll('img.loaded, img.lazy-loaded').length,
                loading: document.querySelectorAll('img.loading, img.lazy-loading').length,
                error: document.querySelectorAll('img.error, img.lazy-error').length,
                lazy: document.querySelectorAll('img[data-src]').length,
                supportedFormats: this.supportedFormats
            };
            
            return stats;
        }
    };
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        ImageOptimizer.init();
    });
    
    // 导出到全局
    window.ImageOptimizer = ImageOptimizer;
    
})();