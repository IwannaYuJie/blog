/**
 * 资源加载优化脚本
 * 实现关键CSS内联、非关键CSS异步加载、图片优化等
 */

(function() {
    'use strict';
    
    // 资源加载管理器
    const ResourceLoader = {
        // 配置选项
        config: {
            criticalCSSInlined: false,
            nonCriticalCSSLoaded: false,
            imagesOptimized: false,
            fontsPreloaded: false,
            loadTimeout: 5000
        },
        
        // 初始化资源加载优化
        init() {
            console.log('初始化资源加载优化...');
            
            // 1. 异步加载非关键CSS
            this.loadNonCriticalCSS();
            
            // 2. 优化图片加载
            this.optimizeImages();
            
            // 3. 预加载关键资源
            this.preloadCriticalResources();
            
            // 4. 优化字体加载
            this.optimizeFonts();
            
            // 5. 监控加载性能
            this.monitorPerformance();
        },
        
        // 异步加载非关键CSS
        loadNonCriticalCSS() {
            const nonCriticalCSS = [
                'css/styles.css'
            ];
            
            nonCriticalCSS.forEach((cssFile, index) => {
                // 延迟加载非关键CSS
                setTimeout(() => {
                    this.loadCSSAsync(cssFile);
                }, index * 100); // 错开加载时间
            });
        },
        
        // 异步加载CSS文件
        loadCSSAsync(href) {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.media = 'print'; // 先设置为print避免阻塞渲染
                
                link.onload = () => {
                    link.media = 'all'; // 加载完成后应用到所有媒体
                    this.config.nonCriticalCSSLoaded = true;
                    console.log(`非关键CSS加载完成: ${href}`);
                    resolve(link);
                };
                
                link.onerror = () => {
                    console.error(`CSS加载失败: ${href}`);
                    reject(new Error(`Failed to load CSS: ${href}`));
                };
                
                // 设置超时
                setTimeout(() => {
                    if (link.media === 'print') {
                        console.warn(`CSS加载超时: ${href}`);
                        link.media = 'all'; // 超时后也要应用样式
                    }
                }, this.config.loadTimeout);
                
                document.head.appendChild(link);
            });
        },
        
        // 优化图片加载
        optimizeImages() {
            // 1. 实现懒加载
            this.implementLazyLoading();
            
            // 2. 使用现代图片格式
            this.useModernImageFormats();
            
            // 3. 优化图片尺寸
            this.optimizeImageSizes();
            
            // 4. 预加载关键图片
            this.preloadCriticalImages();
        },
        
        // 实现图片懒加载
        implementLazyLoading() {
            // 检查浏览器是否支持Intersection Observer
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            this.loadImage(img);
                            observer.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px 0px', // 提前50px开始加载
                    threshold: 0.01
                });
                
                // 观察所有懒加载图片
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
                
                // 观察动态添加的图片
                this.observeNewImages(imageObserver);
            } else {
                // 回退方案：滚动事件
                this.fallbackLazyLoading();
            }
        },
        
        // 加载图片
        loadImage(img) {
            return new Promise((resolve, reject) => {
                const newImg = new Image();
                
                newImg.onload = () => {
                    // 使用现代图片格式
                    if (img.dataset.srcWebp && this.supportsWebP()) {
                        img.src = img.dataset.srcWebp;
                    } else if (img.dataset.srcAvif && this.supportsAVIF()) {
                        img.src = img.dataset.srcAvif;
                    } else {
                        img.src = img.dataset.src;
                    }
                    
                    img.classList.add('loaded');
                    img.removeAttribute('data-src');
                    resolve(img);
                };
                
                newImg.onerror = () => {
                    // 加载失败时使用占位图
                    img.src = this.getPlaceholderImage(img);
                    img.classList.add('error');
                    reject(new Error('Image load failed'));
                };
                
                // 开始加载
                newImg.src = img.dataset.src;
            });
        },
        
        // 检查WebP支持
        supportsWebP() {
            if (this._webpSupport !== undefined) {
                return this._webpSupport;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            return this._webpSupport;
        },
        
        // 检查AVIF支持
        supportsAVIF() {
            if (this._avifSupport !== undefined) {
                return this._avifSupport;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            try {
                this._avifSupport = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
            } catch (e) {
                this._avifSupport = false;
            }
            return this._avifSupport;
        },
        
        // 获取占位图
        getPlaceholderImage(img) {
            const width = img.dataset.width || 300;
            const height = img.dataset.height || 200;
            
            // 生成SVG占位图
            const svg = `
                <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f3f4f6"/>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="14">
                        图片加载失败
                    </text>
                </svg>
            `;
            
            return `data:image/svg+xml;base64,${btoa(svg)}`;
        },
        
        // 使用现代图片格式
        useModernImageFormats() {
            // 为支持的浏览器提供WebP/AVIF格式
            const images = document.querySelectorAll('img[src]');
            
            images.forEach(img => {
                const src = img.src;
                if (src && !src.startsWith('data:')) {
                    // 生成现代格式的URL
                    const baseName = src.replace(/\.[^/.]+$/, '');
                    
                    if (this.supportsAVIF()) {
                        img.dataset.srcAvif = `${baseName}.avif`;
                    }
                    
                    if (this.supportsWebP()) {
                        img.dataset.srcWebp = `${baseName}.webp`;
                    }
                }
            });
        },
        
        // 优化图片尺寸
        optimizeImageSizes() {
            const images = document.querySelectorAll('img');
            
            images.forEach(img => {
                // 根据设备像素比和容器大小优化图片
                const rect = img.getBoundingClientRect();
                const devicePixelRatio = window.devicePixelRatio || 1;
                
                const optimalWidth = Math.ceil(rect.width * devicePixelRatio);
                const optimalHeight = Math.ceil(rect.height * devicePixelRatio);
                
                // 设置srcset属性
                if (img.src && !img.srcset) {
                    const baseSrc = img.src.replace(/\.[^/.]+$/, '');
                    const ext = img.src.split('.').pop();
                    
                    img.srcset = `
                        ${baseSrc}_1x.${ext} 1x,
                        ${baseSrc}_2x.${ext} 2x,
                        ${baseSrc}_3x.${ext} 3x
                    `;
                }
                
                // 设置sizes属性
                if (!img.sizes) {
                    img.sizes = `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`;
                }
            });
        },
        
        // 预加载关键图片
        preloadCriticalImages() {
            const criticalImages = [
                // 首屏可见的重要图片
                'images/hero-bg.webp',
                'images/logo.webp'
            ];
            
            criticalImages.forEach(src => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = src;
                
                // 根据支持情况选择格式
                if (src.includes('.webp') && !this.supportsWebP()) {
                    link.href = src.replace('.webp', '.jpg');
                } else if (src.includes('.avif') && !this.supportsAVIF()) {
                    link.href = src.replace('.avif', '.jpg');
                }
                
                document.head.appendChild(link);
            });
        },
        
        // 观察新添加的图片
        observeNewImages(observer) {
            const mutationObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            const images = node.querySelectorAll ? 
                                node.querySelectorAll('img[data-src]') : [];
                            
                            images.forEach(img => observer.observe(img));
                            
                            if (node.tagName === 'IMG' && node.dataset.src) {
                                observer.observe(node);
                            }
                        }
                    });
                });
            });
            
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        // 回退懒加载方案
        fallbackLazyLoading() {
            let lazyImages = document.querySelectorAll('img[data-src]');
            
            const loadImagesInViewport = () => {
                lazyImages.forEach((img, index) => {
                    if (this.isInViewport(img)) {
                        this.loadImage(img);
                        lazyImages = Array.from(lazyImages).filter((_, i) => i !== index);
                    }
                });
            };
            
            // 节流滚动事件
            let ticking = false;
            const handleScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        loadImagesInViewport();
                        ticking = false;
                    });
                    ticking = true;
                }
            };
            
            window.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', handleScroll);
            
            // 初始检查
            loadImagesInViewport();
        },
        
        // 检查元素是否在视口内
        isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },
        
        // 预加载关键资源
        preloadCriticalResources() {
            const criticalResources = [
                { href: 'js/main.js', as: 'script' },
                { href: 'js/font-loader.js', as: 'script' },
                { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap', as: 'style' }
            ];
            
            criticalResources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.href;
                link.as = resource.as;
                
                if (resource.as === 'style') {
                    link.crossOrigin = 'anonymous';
                }
                
                document.head.appendChild(link);
            });
        },
        
        // 优化字体加载
        optimizeFonts() {
            // 1. 预连接到字体服务
            this.preconnectFontServices();
            
            // 2. 预加载关键字体
            this.preloadCriticalFonts();
            
            // 3. 优化字体显示
            this.optimizeFontDisplay();
        },
        
        // 预连接字体服务
        preconnectFontServices() {
            const fontServices = [
                'https://fonts.googleapis.com',
                'https://fonts.gstatic.com'
            ];
            
            fontServices.forEach(service => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = service;
                if (service.includes('gstatic')) {
                    link.crossOrigin = 'anonymous';
                }
                document.head.appendChild(link);
            });
        },
        
        // 预加载关键字体
        preloadCriticalFonts() {
            const criticalFonts = [
                {
                    family: 'Inter',
                    weight: '400',
                    format: 'woff2'
                },
                {
                    family: 'Inter',
                    weight: '600',
                    format: 'woff2'
                }
            ];
            
            criticalFonts.forEach(font => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'font';
                link.type = `font/${font.format}`;
                link.crossOrigin = 'anonymous';
                
                // 构建Google Fonts URL
                const fontUrl = `https://fonts.googleapis.com/css2?family=${font.family}:wght@${font.weight}&display=swap`;
                link.href = fontUrl;
                
                document.head.appendChild(link);
            });
        },
        
        // 优化字体显示
        optimizeFontDisplay() {
            // 添加font-display: swap到所有字体
            const style = document.createElement('style');
            style.textContent = `
                @font-face {
                    font-display: swap;
                }
            `;
            document.head.appendChild(style);
        },
        
        // 监控加载性能
        monitorPerformance() {
            if (!('performance' in window)) return;
            
            // 监控资源加载时间
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.reportPerformanceMetrics();
                }, 1000);
            });
            
            // 监控Core Web Vitals
            this.monitorCoreWebVitals();
        },
        
        // 报告性能指标
        reportPerformanceMetrics() {
            const navigation = performance.getEntriesByType('navigation')[0];
            const resources = performance.getEntriesByType('resource');
            
            const metrics = {
                // 页面加载时间
                pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint(),
                
                // 资源加载统计
                totalResources: resources.length,
                cssResources: resources.filter(r => r.name.includes('.css')).length,
                jsResources: resources.filter(r => r.name.includes('.js')).length,
                imageResources: resources.filter(r => r.initiatorType === 'img').length,
                
                // 字体加载时间
                fontLoadTime: this.getFontLoadTime(),
                
                // 配置状态
                config: this.config
            };
            
            console.log('性能指标:', metrics);
            
            // 发送到分析服务
            this.sendPerformanceData(metrics);
        },
        
        // 获取First Paint时间
        getFirstPaint() {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? firstPaint.startTime : null;
        },
        
        // 获取First Contentful Paint时间
        getFirstContentfulPaint() {
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            return fcp ? fcp.startTime : null;
        },
        
        // 获取字体加载时间
        getFontLoadTime() {
            const fontEntries = performance.getEntriesByName('fonts-loaded');
            return fontEntries.length > 0 ? fontEntries[0].startTime : null;
        },
        
        // 监控Core Web Vitals
        monitorCoreWebVitals() {
            // 这里可以集成web-vitals库
            // 或者实现简单的LCP、FID、CLS监控
            
            // 监控Largest Contentful Paint
            if ('PerformanceObserver' in window) {
                try {
                    const lcpObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        console.log('LCP:', lastEntry.startTime);
                    });
                    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                } catch (e) {
                    console.warn('LCP monitoring not supported');
                }
            }
        },
        
        // 发送性能数据
        sendPerformanceData(data) {
            // 这里可以发送到你的分析服务
            console.log('发送性能数据:', data);
            
            // 示例：发送到Google Analytics或其他分析服务
            if (typeof gtag !== 'undefined') {
                gtag('event', 'performance_metrics', {
                    custom_map: { metric1: 'page_load_time' },
                    metric1: data.pageLoadTime
                });
            }
        }
    };
    
    // CSS压缩和优化工具
    const CSSOptimizer = {
        // 移除未使用的CSS
        removeUnusedCSS() {
            // 这里可以实现CSS使用情况分析
            // 在生产环境中建议使用PurgeCSS等工具
            console.log('CSS优化：移除未使用的样式');
        },
        
        // 压缩CSS
        compressCSS() {
            // 在构建时进行CSS压缩
            console.log('CSS优化：压缩样式文件');
        }
    };
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        ResourceLoader.init();
    });
    
    // 导出到全局
    window.ResourceLoader = ResourceLoader;
    window.CSSOptimizer = CSSOptimizer;
    
})();