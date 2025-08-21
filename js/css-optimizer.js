/**
 * CSS优化工具
 * 处理CSS压缩、未使用样式移除、关键CSS提取等
 */

(function() {
    'use strict';
    
    // CSS优化管理器
    const CSSOptimizer = {
        // 配置选项
        config: {
            removeUnusedCSS: true,
            minifyCSS: true,
            extractCriticalCSS: true,
            inlineCriticalCSS: true,
            deferNonCriticalCSS: true
        },
        
        // 已使用的CSS选择器
        usedSelectors: new Set(),
        
        // 关键CSS选择器
        criticalSelectors: new Set([
            // 页面结构
            'html', 'body', '*', '*::before', '*::after',
            
            // 导航栏
            '.navbar', '.nav-container', '.nav-logo', '.nav-menu', '.nav-item', '.nav-link',
            '.nav-toggle', '.bar',
            
            // 首页横幅
            '.hero', '.hero-container', '.hero-content', '.hero-title', '.hero-subtitle',
            '.hero-buttons', '.btn', '.btn-primary', '.btn-secondary',
            
            // 页面加载器
            '.page-loader', '.loader-content', '.loader-spinner', '.loader-text',
            
            // 容器
            '.container',
            
            // 字体加载状态
            '.fonts-loading', '.fonts-loaded',
            
            // 响应式
            '@media (max-width: 768px)',
            '@media (prefers-reduced-motion: reduce)'
        ]),
        
        // 初始化CSS优化
        init() {
            // console.log('初始化CSS优化...');
            
            // 1. 分析页面使用的CSS
            this.analyzeUsedCSS();
            
            // 2. 提取关键CSS
            if (this.config.extractCriticalCSS) {
                this.extractCriticalCSS();
            }
            
            // 3. 延迟加载非关键CSS
            if (this.config.deferNonCriticalCSS) {
                this.deferNonCriticalCSS();
            }
            
            // 4. 监控CSS性能
            this.monitorCSSPerformance();
        },
        
        // 分析页面使用的CSS
        analyzeUsedCSS() {
            // 获取所有元素
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach(element => {
                // 记录元素的标签名
                this.usedSelectors.add(element.tagName.toLowerCase());
                
                // 记录类名
                if (element.className && typeof element.className === 'string') {
                    element.className.split(' ').forEach(className => {
                        if (className.trim()) {
                            this.usedSelectors.add(`.${className.trim()}`);
                        }
                    });
                }
                
                // 记录ID
                if (element.id) {
                    this.usedSelectors.add(`#${element.id}`);
                }
                
                // 记录伪类状态
                if (element.matches(':hover')) {
                    this.usedSelectors.add(`${element.tagName.toLowerCase()}:hover`);
                }
                
                if (element.matches(':focus')) {
                    this.usedSelectors.add(`${element.tagName.toLowerCase()}:focus`);
                }
                
                if (element.matches(':active')) {
                    this.usedSelectors.add(`${element.tagName.toLowerCase()}:active`);
                }
            });
            
            // console.log(`分析完成，发现 ${this.usedSelectors.size} 个使用的选择器`);
        },
        
        // 提取关键CSS
        extractCriticalCSS() {
            const criticalCSS = [];
            const stylesheets = Array.from(document.styleSheets);
            
            stylesheets.forEach(stylesheet => {
                try {
                    const rules = Array.from(stylesheet.cssRules || stylesheet.rules || []);
                    
                    rules.forEach(rule => {
                        if (this.isCriticalRule(rule)) {
                            criticalCSS.push(rule.cssText);
                        }
                    });
                } catch (e) {
                    // 跨域样式表无法访问
                    // console.warn('无法访问样式表:', stylesheet.href);
                }
            });
            
            // 创建关键CSS样式块
            if (criticalCSS.length > 0 && this.config.inlineCriticalCSS) {
                this.inlineCriticalCSS(criticalCSS.join('\n'));
            }
        },
        
        // 判断是否为关键CSS规则
        isCriticalRule(rule) {
            if (!rule.selectorText) return false;
            
            // 检查是否为关键选择器
            const selectors = rule.selectorText.split(',').map(s => s.trim());
            
            return selectors.some(selector => {
                // 检查是否在关键选择器列表中
                if (this.criticalSelectors.has(selector)) {
                    return true;
                }
                
                // 检查是否匹配关键选择器模式
                for (const criticalSelector of this.criticalSelectors) {
                    if (selector.includes(criticalSelector) || 
                        criticalSelector.includes(selector)) {
                        return true;
                    }
                }
                
                // 检查是否为首屏可见元素的样式
                try {
                    const elements = document.querySelectorAll(selector);
                    return Array.from(elements).some(el => this.isAboveFold(el));
                } catch (e) {
                    return false;
                }
            });
        },
        
        // 检查元素是否在首屏
        isAboveFold(element) {
            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            
            return rect.top < viewportHeight && rect.bottom > 0;
        },
        
        // 内联关键CSS
        inlineCriticalCSS(css) {
            // 压缩CSS
            const minifiedCSS = this.minifyCSS(css);
            
            // 创建内联样式
            const style = document.createElement('style');
            style.textContent = minifiedCSS;
            style.setAttribute('data-critical', 'true');
            
            // 插入到head的开始位置
            const firstLink = document.head.querySelector('link[rel="stylesheet"]');
            if (firstLink) {
                document.head.insertBefore(style, firstLink);
            } else {
                document.head.appendChild(style);
            }
            
            // console.log(`内联关键CSS: ${minifiedCSS.length} 字符`);
        },
        
        // 延迟加载非关键CSS
        deferNonCriticalCSS() {
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
            
            stylesheets.forEach(link => {
                // 将样式表标记为非关键
                link.media = 'print';
                link.onload = function() {
                    this.media = 'all';
                    this.onload = null;
                };
                
                // 添加noscript回退
                const noscript = document.createElement('noscript');
                const fallbackLink = link.cloneNode(true);
                fallbackLink.media = 'all';
                noscript.appendChild(fallbackLink);
                link.parentNode.insertBefore(noscript, link.nextSibling);
            });
        },
        
        // CSS压缩
        minifyCSS(css) {
            return css
                // 移除注释
                .replace(/\/\*[\s\S]*?\*\//g, '')
                // 移除多余的空白
                .replace(/\s+/g, ' ')
                // 移除分号前的空格
                .replace(/\s*;\s*/g, ';')
                // 移除大括号前后的空格
                .replace(/\s*{\s*/g, '{')
                .replace(/\s*}\s*/g, '}')
                // 移除冒号后的空格
                .replace(/:\s+/g, ':')
                // 移除逗号后的空格
                .replace(/,\s+/g, ',')
                // 移除开头和结尾的空格
                .trim();
        },
        
        // 移除未使用的CSS
        removeUnusedCSS() {
            const stylesheets = Array.from(document.styleSheets);
            const unusedRules = [];
            
            stylesheets.forEach(stylesheet => {
                try {
                    const rules = Array.from(stylesheet.cssRules || stylesheet.rules || []);
                    
                    rules.forEach((rule, index) => {
                        if (rule.selectorText && !this.isSelectorUsed(rule.selectorText)) {
                            unusedRules.push({
                                stylesheet,
                                rule,
                                index
                            });
                        }
                    });
                } catch (e) {
                    // console.warn('无法分析样式表:', stylesheet.href);
                }
            });
            
            // 移除未使用的规则（从后往前移除以保持索引正确）
            unusedRules.reverse().forEach(({ stylesheet, index }) => {
                try {
                    stylesheet.deleteRule(index);
                } catch (e) {
                    // console.warn('无法删除CSS规则:', e);
                }
            });
            
            // console.log(`移除了 ${unusedRules.length} 个未使用的CSS规则`);
        },
        
        // 检查选择器是否被使用
        isSelectorUsed(selectorText) {
            const selectors = selectorText.split(',').map(s => s.trim());
            
            return selectors.some(selector => {
                // 检查是否在已使用选择器列表中
                if (this.usedSelectors.has(selector)) {
                    return true;
                }
                
                // 检查是否有匹配的元素
                try {
                    return document.querySelector(selector) !== null;
                } catch (e) {
                    // 无效选择器，保留以防万一
                    return true;
                }
            });
        },
        
        // 优化CSS加载顺序
        optimizeCSSLoadOrder() {
            const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            
            // 按优先级排序
            const sortedStylesheets = stylesheets.sort((a, b) => {
                const priorityA = this.getCSSPriority(a);
                const priorityB = this.getCSSPriority(b);
                return priorityB - priorityA; // 高优先级在前
            });
            
            // 重新排列DOM中的顺序
            const head = document.head;
            sortedStylesheets.forEach(link => {
                head.appendChild(link); // 移动到末尾
            });
        },
        
        // 获取CSS优先级
        getCSSPriority(link) {
            const href = link.href.toLowerCase();
            
            // 关键CSS优先级最高
            if (link.hasAttribute('data-critical')) return 100;
            
            // 内联样式
            if (href.startsWith('data:')) return 90;
            
            // 本地CSS文件
            if (!href.startsWith('http') || href.includes(location.hostname)) return 80;
            
            // 字体CSS
            if (href.includes('fonts.googleapis.com')) return 70;
            
            // 图标CSS
            if (href.includes('font-awesome') || href.includes('icons')) return 60;
            
            // 其他外部CSS
            return 50;
        },
        
        // 监控CSS性能
        monitorCSSPerformance() {
            if (!('performance' in window)) return;
            
            // 监控样式表加载时间
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach(entry => {
                    if (entry.initiatorType === 'css' || entry.name.includes('.css')) {
                        // console.log(`CSS加载时间: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });
            
            try {
                observer.observe({ entryTypes: ['resource'] });
            } catch (e) {
                // console.warn('无法监控CSS性能');
            }
            
            // 监控样式重计算
            this.monitorStyleRecalculation();
        },
        
        // 监控样式重计算
        monitorStyleRecalculation() {
            let lastRecalcTime = performance.now();
            
            const checkRecalculation = () => {
                const now = performance.now();
                const timeSinceLastCheck = now - lastRecalcTime;
                
                // 如果时间间隔异常长，可能发生了样式重计算
                if (timeSinceLastCheck > 50) {
                    // console.warn(`可能的样式重计算: ${timeSinceLastCheck.toFixed(2)}ms`);
                }
                
                lastRecalcTime = now;
                requestAnimationFrame(checkRecalculation);
            };
            
            requestAnimationFrame(checkRecalculation);
        },
        
        // 生成CSS使用报告
        generateUsageReport() {
            const report = {
                totalSelectors: this.usedSelectors.size,
                criticalSelectors: this.criticalSelectors.size,
                stylesheets: document.styleSheets.length,
                inlineStyles: document.querySelectorAll('style').length,
                externalStyles: document.querySelectorAll('link[rel="stylesheet"]').length,
                config: this.config
            };
            
            // console.log('CSS使用报告:', report);
            return report;
        },
        
        // 优化CSS变量
        optimizeCSSVariables() {
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            
            // 获取所有CSS变量
            const cssVariables = {};
            for (let i = 0; i < computedStyle.length; i++) {
                const property = computedStyle[i];
                if (property.startsWith('--')) {
                    cssVariables[property] = computedStyle.getPropertyValue(property);
                }
            }
            
            // console.log(`发现 ${Object.keys(cssVariables).length} 个CSS变量`);
            
            // 这里可以添加变量优化逻辑
            // 例如：合并相似的变量、移除未使用的变量等
        }
    };
    
    // CSS加载状态管理
    const CSSLoadManager = {
        loadedStylesheets: new Set(),
        
        // 跟踪CSS加载状态
        trackCSSLoading() {
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
            
            stylesheets.forEach(link => {
                if (!this.loadedStylesheets.has(link.href)) {
                    link.addEventListener('load', () => {
                        this.loadedStylesheets.add(link.href);
                        this.onCSSLoaded(link);
                    });
                    
                    link.addEventListener('error', () => {
                        this.onCSSError(link);
                    });
                }
            });
        },
        
        // CSS加载完成回调
        onCSSLoaded(link) {
            // console.log(`CSS加载完成: ${link.href}`);
            
            // 触发自定义事件
            const event = new CustomEvent('cssLoaded', {
                detail: { link, href: link.href }
            });
            document.dispatchEvent(event);
        },
        
        // CSS加载错误回调
        onCSSError(link) {
            // console.error(`CSS加载失败: ${link.href}`);
            
            // 触发自定义事件
            const event = new CustomEvent('cssError', {
                detail: { link, href: link.href }
            });
            document.dispatchEvent(event);
        }
    };
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        CSSOptimizer.init();
        CSSLoadManager.trackCSSLoading();
    });
    
    // 导出到全局
    window.CSSOptimizer = CSSOptimizer;
    window.CSSLoadManager = CSSLoadManager;
    
})();