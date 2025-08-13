/**
 * 字体加载优化脚本
 * 优化字体显示性能，减少字体闪烁(FOIT/FOUT)
 */

(function() {
    'use strict';
    
    // 字体加载状态管理
    const FontLoader = {
        // 字体配置
        fonts: [
            {
                family: 'Inter',
                weights: [300, 400, 500, 600, 700, 800],
                display: 'swap'
            },
            {
                family: 'Noto Sans SC',
                weights: [300, 400, 500, 600, 700, 800],
                display: 'swap'
            }
        ],
        
        // 初始化字体加载
        init() {
            // 添加字体加载状态类
            document.documentElement.classList.add('fonts-loading');
            
            // 检查字体API支持
            if ('fonts' in document) {
                this.loadFontsWithAPI();
            } else {
                this.loadFontsWithFallback();
            }
            
            // 设置字体加载超时
            this.setLoadingTimeout();
        },
        
        // 使用Font Loading API加载字体
        loadFontsWithAPI() {
            const fontPromises = [];
            
            this.fonts.forEach(font => {
                font.weights.forEach(weight => {
                    const fontFace = new FontFace(
                        font.family,
                        `url(https://fonts.googleapis.com/css2?family=${font.family.replace(' ', '+')}:wght@${weight}&display=${font.display})`,
                        {
                            weight: weight.toString(),
                            display: font.display
                        }
                    );
                    
                    fontPromises.push(fontFace.load());
                });
            });
            
            Promise.all(fontPromises)
                .then(loadedFonts => {
                    loadedFonts.forEach(font => {
                        document.fonts.add(font);
                    });
                    this.onFontsLoaded();
                })
                .catch(error => {
                    console.warn('字体加载失败:', error);
                    this.onFontsError();
                });
        },
        
        // 回退字体加载方法
        loadFontsWithFallback() {
            // 创建测试元素检测字体加载
            const testElements = this.createTestElements();
            
            // 检查字体是否加载完成
            const checkFonts = () => {
                let allLoaded = true;
                
                testElements.forEach(element => {
                    const computedStyle = window.getComputedStyle(element);
                    const fontFamily = computedStyle.fontFamily;
                    
                    if (!fontFamily.includes(element.dataset.font)) {
                        allLoaded = false;
                    }
                });
                
                if (allLoaded) {
                    this.onFontsLoaded();
                    testElements.forEach(el => el.remove());
                } else {
                    setTimeout(checkFonts, 100);
                }
            };
            
            setTimeout(checkFonts, 100);
        },
        
        // 创建字体检测元素
        createTestElements() {
            const testElements = [];
            
            this.fonts.forEach(font => {
                const element = document.createElement('div');
                element.style.fontFamily = font.family;
                element.style.fontSize = '16px';
                element.style.position = 'absolute';
                element.style.left = '-9999px';
                element.style.top = '-9999px';
                element.style.visibility = 'hidden';
                element.textContent = 'Test';
                element.dataset.font = font.family;
                
                document.body.appendChild(element);
                testElements.push(element);
            });
            
            return testElements;
        },
        
        // 字体加载完成回调
        onFontsLoaded() {
            document.documentElement.classList.remove('fonts-loading');
            document.documentElement.classList.add('fonts-loaded');
            
            // 触发自定义事件
            const event = new CustomEvent('fontsloaded', {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(event);
            
            // 性能标记
            if ('performance' in window && 'mark' in performance) {
                performance.mark('fonts-loaded');
            }
            
            console.log('字体加载完成');
        },
        
        // 字体加载错误回调
        onFontsError() {
            document.documentElement.classList.remove('fonts-loading');
            document.documentElement.classList.add('fonts-error');
            
            console.warn('字体加载失败，使用系统字体');
        },
        
        // 设置字体加载超时
        setLoadingTimeout() {
            setTimeout(() => {
                if (document.documentElement.classList.contains('fonts-loading')) {
                    console.warn('字体加载超时，使用系统字体');
                    this.onFontsError();
                }
            }, 3000); // 3秒超时
        },
        
        // 预加载关键字体
        preloadCriticalFonts() {
            const criticalFonts = [
                {
                    family: 'Inter',
                    weights: [400, 600],
                    formats: ['woff2', 'woff'],
                    display: 'swap'
                },
                {
                    family: 'Noto Sans SC',
                    weights: [400, 600],
                    formats: ['woff2', 'woff'],
                    display: 'swap'
                }
            ];
            
            criticalFonts.forEach(font => {
                font.weights.forEach(weight => {
                    font.formats.forEach(format => {
                        const link = document.createElement('link');
                        link.rel = 'preload';
                        link.as = 'font';
                        link.type = `font/${format}`;
                        link.crossOrigin = 'anonymous';
                        
                        // 构建Google Fonts的实际字体文件URL
                        const fontFamily = font.family.replace(' ', '+');
                        link.href = `https://fonts.gstatic.com/s/${fontFamily.toLowerCase()}/v${this.getFontVersion(font.family)}/${this.getFontFileName(font.family, weight, format)}`;
                        
                        document.head.appendChild(link);
                    });
                });
            });
        },
        
        // 获取字体版本号（简化处理）
        getFontVersion(family) {
            const versions = {
                'Inter': '12',
                'Noto Sans SC': '35'
            };
            return versions[family] || '1';
        },
        
        // 获取字体文件名（简化处理）
        getFontFileName(family, weight, format) {
            const familyMap = {
                'Inter': 'inter',
                'Noto Sans SC': 'notosanssc'
            };
            
            const familyKey = familyMap[family] || family.toLowerCase().replace(' ', '');
            return `${familyKey}-v${this.getFontVersion(family)}-latin-${weight}-normal.${format}`;
        }
    };
    
    // 字体性能监控
    const FontPerformance = {
        // 监控字体加载性能
        monitor() {
            if (!('performance' in window)) return;
            
            // 监听字体加载完成事件
            document.addEventListener('fontsloaded', () => {
                this.measurePerformance();
            });
        },
        
        // 测量字体加载性能
        measurePerformance() {
            const navigation = performance.getEntriesByType('navigation')[0];
            const fontLoadTime = performance.getEntriesByName('fonts-loaded')[0];
            
            if (fontLoadTime) {
                const loadTime = fontLoadTime.startTime - navigation.startTime;
                console.log(`字体加载时间: ${loadTime.toFixed(2)}ms`);
                
                // 发送性能数据到分析服务
                this.sendPerformanceData({
                    fontLoadTime: loadTime,
                    timestamp: Date.now()
                });
            }
        },
        
        // 发送性能数据
        sendPerformanceData(data) {
            // 这里可以发送到你的分析服务
            console.log('字体性能数据:', data);
        }
    };
    
    // 字体优化工具
    const FontOptimizer = {
        // 优化字体渲染
        optimizeRendering() {
            // 检测设备像素比
            const pixelRatio = window.devicePixelRatio || 1;
            
            if (pixelRatio >= 2) {
                // 高分辨率屏幕优化
                document.body.style.webkitFontSmoothing = 'antialiased';
                document.body.style.mozOsxFontSmoothing = 'grayscale';
            } else {
                // 低分辨率屏幕优化
                document.body.style.webkitFontSmoothing = 'subpixel-antialiased';
                document.body.style.mozOsxFontSmoothing = 'auto';
            }
        },
        
        // 根据语言优化字体
        optimizeByLanguage() {
            const lang = document.documentElement.lang || 'en';
            
            if (lang.includes('zh')) {
                // 中文优化
                document.body.classList.add('chinese-text');
            } else {
                // 英文优化
                document.body.classList.add('english-text');
            }
        },
        
        // 优化数字显示
        optimizeNumbers() {
            const numberElements = document.querySelectorAll('.number, .price, .date, .time');
            numberElements.forEach(el => {
                el.classList.add('tabular-nums');
            });
        }
    };
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        FontLoader.init();
        FontPerformance.monitor();
        FontOptimizer.optimizeRendering();
        FontOptimizer.optimizeByLanguage();
        FontOptimizer.optimizeNumbers();
    });
    
    // 导出到全局
    window.FontLoader = FontLoader;
    window.FontPerformance = FontPerformance;
    window.FontOptimizer = FontOptimizer;
    
})();