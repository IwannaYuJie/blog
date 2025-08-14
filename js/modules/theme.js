// ========================================
// 暗色主题切换功能
// ========================================

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeToggle = null;
        this.sunIcon = null;
        this.moonIcon = null;
    }

    init() {
        this.createThemeToggle();
        this.loadSavedTheme();
        this.setupEventListeners();
        this.applyThemeTransitions();
        console.log('🎨 主题管理器初始化完成');
    }

    createThemeToggle() {
        if (document.querySelector('.theme-toggle')) {
            this.themeToggle = document.querySelector('.theme-toggle');
            this.sunIcon = this.themeToggle.querySelector('.theme-icon.sun');
            this.moonIcon = this.themeToggle.querySelector('.theme-icon.moon');
            return;
        }

        this.themeToggle = document.createElement('button');
        this.themeToggle.className = 'theme-toggle';
        this.themeToggle.setAttribute('aria-label', '切换主题');
        this.themeToggle.setAttribute('title', '切换暗色/亮色主题');

        this.sunIcon = document.createElement('i');
        this.sunIcon.className = 'theme-icon sun fas fa-sun';

        this.moonIcon = document.createElement('i');
        this.moonIcon.className = 'theme-icon moon fas fa-moon';

        this.themeToggle.appendChild(this.sunIcon);
        this.themeToggle.appendChild(this.moonIcon);

        document.body.appendChild(this.themeToggle);
    }

    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme) {
                this.currentTheme = savedTheme;
            } else if (systemPrefersDark) {
                this.currentTheme = 'dark';
            } else {
                this.currentTheme = 'light';
            }

            this.applyTheme(this.currentTheme, false);

        } catch (error) {
            console.warn('⚠️ 加载主题偏好失败:', error);
            this.currentTheme = 'light';
            this.applyTheme('light', false);
        }
    }

    setupEventListeners() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme, true);
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme, true);
    }

    applyTheme(theme, animate = true) {
        const oldTheme = this.currentTheme;
        this.currentTheme = theme;

        if (animate && this.themeToggle) {
            this.themeToggle.classList.add('switching');
            setTimeout(() => {
                this.themeToggle.classList.remove('switching');
            }, 500);
        }

        document.documentElement.setAttribute('data-theme', theme);

        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.warn('⚠️ 保存主题偏好失败:', error);
        }

        this.updateToggleButton();
        this.dispatchThemeChangeEvent(oldTheme, theme);
        this.updateMetaThemeColor(theme);
    }

    updateToggleButton() {
        if (!this.themeToggle) return;
        const isDark = this.currentTheme === 'dark';
        this.themeToggle.setAttribute('title', isDark ? '切换到亮色主题' : '切换到暗色主题');
        this.themeToggle.setAttribute('aria-label', isDark ? '当前为暗色主题，点击切换到亮色主题' : '当前为亮色主题，点击切换到暗色主题');
    }

    dispatchThemeChangeEvent(oldTheme, newTheme) {
        const event = new CustomEvent('themeChanged', {
            detail: { oldTheme, newTheme, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    updateMetaThemeColor(theme) {
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.content = theme === 'dark' ? '#0f0f0f' : '#ffffff';
    }

    applyThemeTransitions() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const elementsToTransition = [
            'body', '.navbar', '.hero', '.post-card', '.btn', '.form-input',
            '.form-textarea', '.form-select', '.contact-info-item', '.hero-stat',
            '.hero-code-window', '.back-to-top', '.social-link'
        ];

        elementsToTransition.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.classList.add('theme-transition');
            });
        });
    }

    getCurrentTheme() { return this.currentTheme; }
    isDarkTheme() { return this.currentTheme === 'dark'; }
    setTheme(theme, animate = true) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme, animate);
        }
    }
    resetToSystemTheme() {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        localStorage.removeItem('theme');
        this.applyTheme(systemPrefersDark ? 'dark' : 'light', true);
    }
}

const themeManager = new ThemeManager();
themeManager.init();

export default themeManager;

// Generic theme change listener
window.addEventListener('themeChanged', (event) => {
    const { newTheme } = event.detail;
    console.log(`🎨 Theme changed to ${newTheme}. Other modules can listen to this event.`);
    // Example: if a charting library needs a theme update
    // if (window.updateChartsTheme) {
    //     window.updateChartsTheme(newTheme);
    // }
});
