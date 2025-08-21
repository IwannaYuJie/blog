/**
 * 性能监控脚本
 * 整合所有性能优化功能，提供统一的性能监控和报告
 */

(function() {
    'use strict';
    
    // 性能监控管理器
    const PerformanceMonitor = {
        // 性能指标
        metrics: {
            // 页面加载时间
            pageLoadTime: 0,
            domContentLoadedTime: 0,
            firstPaintTime: 0,
            firstContentfulPaintTime: 0,
            largestContentfulPaintTime: 0,
            
            // 资源加载统计
            totalResources: 0,
            cssResources: 0,
            jsResources: 0,
            imageResources: 0,
            fontResources: 0,
            
            // 优化状态
            criticalCSSInlined: false,
            nonCriticalCSSDeferred: false,
            imagesOptimized: false,
            fontsPreloaded: false,
            
            // 用户体验指标
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            timeToInteractive: 0
        },
        
        // 性能观察器
        observers: {
            paint: null,
            lcp: null,
            fid: null,
            cls: null,
            resource: null
        },
        
        // 初始化性能监控
        init() {
            // console.log('初始化性能监控...');
            
            // 1. 设置性能观察器
            this.setupPerformanceObservers();
            
            // 2. 监控页面加载
            this.monitorPageLoad();
            
            // 3. 监控资源加载
            this.monitorResourceLoading();
            
            // 4. 监控用户交互
            this.monitorUserInteraction();
            
            // 5. 定期收集指标
            this.startMetricsCollection();
        },
        
        // 设置性能观察器
        setupPerformanceObservers() {
            if (!('PerformanceObserver' in window)) {
                // console.warn('PerformanceObserver不支持');
                return;
            }
            
            // Paint观察器
            try {
                this.observers.paint = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-paint') {
                            this.metrics.firstPaintTime = entry.startTime;
                        } else if (entry.name === 'first-contentful-paint') {
                            this.metrics.firstContentfulPaintTime = entry.startTime;
                        }
                    });
                });
                this.observers.paint.observe({ entryTypes: ['paint'] });
            } catch (e) {
                // console.warn('Paint观察器设置失败:', e);
            }
            
            // LCP观察器
            try {
                this.observers.lcp = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.largestContentfulPaintTime = lastEntry.startTime;
                });
                this.observers.lcp.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // console.warn('LCP观察器设置失败:', e);
            }
            
            // FID观察器
            try {
                this.observers.fid = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                    });
                });
                this.observers.fid.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                // console.warn('FID观察器设置失败:', e);
            }
            
            // CLS观察器
            try {
                this.observers.cls = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            this.metrics.cumulativeLayoutShift += entry.value;
                        }
                    });
                });
                this.observers.cls.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                // console.warn('CLS观察器设置失败:', e);
            }
            
            // 资源观察器
            try {
                this.observers.resource = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    this.processResourceEntries(entries);
                });
                this.observers.resource.observe({ entryTypes: ['resource'] });
            } catch (e) {
                // console.warn('资源观察器设置失败:', e);
            }
        },
        
        // 监控页面加载
        monitorPageLoad() {
            // DOM内容加载完成
            document.addEventListener('DOMContentLoaded', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.metrics.domContentLoadedTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
                }
            });
            
            // 页面完全加载
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.collectLoadMetrics();
                    this.generatePerformanceReport();
                }, 1000);
            });
        },
        
        // 收集加载指标
        collectLoadMetrics() {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
                this.metrics.domContentLoadedTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            }
            
            // 收集资源统计
            const resources = performance.getEntriesByType('resource');
            this.metrics.totalResources = resources.length;
            this.metrics.cssResources = resources.filter(r => r.name.includes('.css') || r.initiatorType === 'css').length;
            this.metrics.jsResources = resources.filter(r => r.name.includes('.js') || r.initiatorType === 'script').length;
            this.metrics.imageResources = resources.filter(r => r.initiatorType === 'img').length;
            this.metrics.fontResources = resources.filter(r => r.initiatorType === 'css' && r.name.includes('font')).length;
        },
        
        // 处理资源条目
        processResourceEntries(entries) {
            entries.forEach(entry => {
                // 分析慢加载资源
                if (entry.duration > 1000) {
                    // console.warn(`慢加载资源: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                }
                
                // 分析大文件
                if (entry.transferSize > 500000) { // 500KB
                    // console.warn(`大文件: ${entry.name} - ${(entry.transferSize / 1024).toFixed(2)}KB`);
                }
                
                // 分析缓存命中率
                if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
                    // console.log(`缓存命中: ${entry.name}`);
                }
            });
        },
        
        // 监控资源加载
        monitorResourceLoading() {
            // 监控CSS加载
            document.addEventListener('cssLoaded', (event) => {
                // console.log(`CSS加载完成: ${event.detail.href}`);
            });
            
            document.addEventListener('cssError', (event) => {
                // console.error(`CSS加载失败: ${event.detail.href}`);
            });
            
            // 监控图片加载
            document.addEventListener('imageLoaded', (event) => {
                // console.log(`图片加载完成: ${event.detail.src}`);
            });
            
            document.addEventListener('imageError', (event) => {
                // console.error(`图片加载失败: ${event.detail.img.src}`);
            });
            
            // 监控字体加载
            document.addEventListener('fontsloaded', (event) => {
                // console.log('字体加载完成');
                this.metrics.fontsPreloaded = true;
            });
        },
        
        // 监控用户交互
        monitorUserInteraction() {
            // 监控首次交互
            let firstInteraction = true;
            const interactionEvents = ['click', 'keydown', 'touchstart'];
            
            interactionEvents.forEach(eventType => {
                document.addEventListener(eventType, () => {
                    if (firstInteraction) {
                        firstInteraction = false;
                        this.metrics.timeToInteractive = performance.now();
                        // console.log(`首次交互时间: ${this.metrics.timeToInteractive.toFixed(2)}ms`);
                    }
                }, { once: true, passive: true });
            });
            
            // 监控滚动性能
            this.monitorScrollPerformance();
        },
        
        // 监控滚动性能
        monitorScrollPerformance() {
            let lastScrollTime = performance.now();
            let scrollCount = 0;
            let laggyScrolls = 0;
            
            const handleScroll = () => {
                const now = performance.now();
                const timeSinceLastScroll = now - lastScrollTime;
                
                scrollCount++;
                
                // 检测滚动卡顿
                if (timeSinceLastScroll > 16.67) { // 60fps = 16.67ms per frame
                    laggyScrolls++;
                }
                
                lastScrollTime = now;
                
                // 每100次滚动报告一次
                if (scrollCount % 100 === 0) {
                    const laggyPercentage = (laggyScrolls / scrollCount) * 100;
                    // console.log(`滚动性能: ${laggyPercentage.toFixed(1)}% 的滚动事件超过16.67ms`);
                }
            };
            
            window.addEventListener('scroll', handleScroll, { passive: true });
        },
        
        // 开始指标收集
        startMetricsCollection() {
            // 每30秒收集一次指标
            setInterval(() => {
                this.collectRuntimeMetrics();
            }, 30000);
        },
        
        // 收集运行时指标
        collectRuntimeMetrics() {
            // 内存使用情况
            if ('memory' in performance) {
                const memory = performance.memory;
                // console.log(`内存使用: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
            }
            
            // 检查优化状态
            this.checkOptimizationStatus();
        },
        
        // 检查优化状态
        checkOptimizationStatus() {
            // 检查关键CSS是否内联
            this.metrics.criticalCSSInlined = document.querySelector('style[data-critical]') !== null;
            
            // 检查非关键CSS是否延迟加载
            const deferredCSS = document.querySelectorAll('link[rel="stylesheet"][media="print"]');
            this.metrics.nonCriticalCSSDeferred = deferredCSS.length > 0;
            
            // 检查图片是否优化
            const lazyImages = document.querySelectorAll('img[data-src]');
            const loadedImages = document.querySelectorAll('img.lazy-loaded');
            this.metrics.imagesOptimized = lazyImages.length > 0 || loadedImages.length > 0;
        },
        
        // 生成性能报告
        generatePerformanceReport() {
            const report = {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                metrics: { ...this.metrics },
                
                // Core Web Vitals评分
                coreWebVitals: {
                    lcp: this.evaluateLCP(this.metrics.largestContentfulPaintTime),
                    fid: this.evaluateFID(this.metrics.firstInputDelay),
                    cls: this.evaluateCLS(this.metrics.cumulativeLayoutShift)
                },
                
                // 优化建议
                recommendations: this.generateRecommendations()
            };
            
            // console.log('性能报告:', report);
            
            // 发送到分析服务
            this.sendPerformanceReport(report);
            
            return report;
        },
        
        // 评估LCP
        evaluateLCP(lcp) {
            if (lcp <= 2500) return 'good';
            if (lcp <= 4000) return 'needs-improvement';
            return 'poor';
        },
        
        // 评估FID
        evaluateFID(fid) {
            if (fid <= 100) return 'good';
            if (fid <= 300) return 'needs-improvement';
            return 'poor';
        },
        
        // 评估CLS
        evaluateCLS(cls) {
            if (cls <= 0.1) return 'good';
            if (cls <= 0.25) return 'needs-improvement';
            return 'poor';
        },
        
        // 生成优化建议
        generateRecommendations() {
            const recommendations = [];
            
            // LCP优化建议
            if (this.metrics.largestContentfulPaintTime > 2500) {
                recommendations.push({
                    type: 'LCP',
                    message: '最大内容绘制时间过长，建议优化关键资源加载',
                    priority: 'high'
                });
            }
            
            // FID优化建议
            if (this.metrics.firstInputDelay > 100) {
                recommendations.push({
                    type: 'FID',
                    message: '首次输入延迟过长，建议减少JavaScript执行时间',
                    priority: 'medium'
                });
            }
            
            // CLS优化建议
            if (this.metrics.cumulativeLayoutShift > 0.1) {
                recommendations.push({
                    type: 'CLS',
                    message: '累积布局偏移过大，建议为图片和广告预留空间',
                    priority: 'medium'
                });
            }
            
            // 资源优化建议
            if (this.metrics.pageLoadTime > 3000) {
                recommendations.push({
                    type: 'Load Time',
                    message: '页面加载时间过长，建议优化资源大小和加载策略',
                    priority: 'high'
                });
            }
            
            // 优化状态建议
            if (!this.metrics.criticalCSSInlined) {
                recommendations.push({
                    type: 'CSS',
                    message: '建议内联关键CSS以提高首屏渲染速度',
                    priority: 'medium'
                });
            }
            
            if (!this.metrics.imagesOptimized) {
                recommendations.push({
                    type: 'Images',
                    message: '建议实现图片懒加载和现代格式支持',
                    priority: 'medium'
                });
            }
            
            return recommendations;
        },
        
        // 发送性能报告
        sendPerformanceReport(report) {
            // 这里可以发送到你的分析服务
            // console.log('发送性能报告到分析服务');
            
            // 示例：发送到Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'performance_report', {
                    custom_map: {
                        metric1: 'page_load_time',
                        metric2: 'first_contentful_paint',
                        metric3: 'largest_contentful_paint'
                    },
                    metric1: report.metrics.pageLoadTime,
                    metric2: report.metrics.firstContentfulPaintTime,
                    metric3: report.metrics.largestContentfulPaintTime
                });
            }
            
            // 示例：发送到自定义分析服务
            if (window.customAnalytics) {
                window.customAnalytics.track('performance', report);
            }
        },
        
        // 获取实时性能指标
        getRealTimeMetrics() {
            return {
                ...this.metrics,
                currentTime: performance.now(),
                memoryUsage: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null
            };
        },
        
        // 清理观察器
        cleanup() {
            Object.values(this.observers).forEach(observer => {
                if (observer) {
                    observer.disconnect();
                }
            });
        }
    };
    
    // 性能预算管理
    const PerformanceBudget = {
        budgets: {
            pageLoadTime: 3000, // 3秒
            firstContentfulPaint: 1500, // 1.5秒
            largestContentfulPaint: 2500, // 2.5秒
            firstInputDelay: 100, // 100ms
            cumulativeLayoutShift: 0.1, // 0.1
            totalResourceSize: 2000000, // 2MB
            imageResourceSize: 1000000, // 1MB
            cssResourceSize: 200000, // 200KB
            jsResourceSize: 500000 // 500KB
        },
        
        // 检查性能预算
        checkBudget(metrics) {
            const violations = [];
            
            Object.keys(this.budgets).forEach(key => {
                if (metrics[key] && metrics[key] > this.budgets[key]) {
                    violations.push({
                        metric: key,
                        actual: metrics[key],
                        budget: this.budgets[key],
                        overage: metrics[key] - this.budgets[key]
                    });
                }
            });
            
            if (violations.length > 0) {
                // console.warn('性能预算超标:', violations);
            }
            
            return violations;
        }
    };
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        PerformanceMonitor.init();
    });
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        PerformanceMonitor.cleanup();
    });
    
    // 导出到全局
    window.PerformanceMonitor = PerformanceMonitor;
    window.PerformanceBudget = PerformanceBudget;
    
})();