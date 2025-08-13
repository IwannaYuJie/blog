// ========================================
// 微交互和细节优化 JavaScript
// ========================================

class MicroInteractions {
    constructor() {
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.audioContext = null;
        this.sounds = {};
        this.init();
    }

    init() {
        this.setupRippleEffects();
        this.setupMagneticButtons();
        this.setupParticleEffects();
        this.setupSoundToggle();
        this.setupFormValidation();
        this.setupCounterAnimations();
        this.setupProgressBars();
        this.setupTypewriterEffect();
        this.setupAccessibilityFeatures();
        this.initAudioContext();
    }

    // ========================================
    // 1. 波纹点击效果
    // ========================================
    setupRippleEffects() {
        const rippleElements = document.querySelectorAll('.btn, .filter-btn, .social-link, .post-card');
        
        rippleElements.forEach(element => {
            element.classList.add('ripple-effect');
            element.addEventListener('click', (e) => {
                this.createRipple(e, element);
                this.playSound('click');
            });
        });
    }

    createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.classList.add('ripple');
        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;

        element.appendChild(ripple);

        // 移除波纹元素
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 500);
    }

    // ========================================
    // 2. 磁性按钮效果
    // ========================================
    setupMagneticButtons() {
        const magneticButtons = document.querySelectorAll('.btn-primary, .hero-cta-primary');
        
        magneticButtons.forEach(button => {
            button.classList.add('magnetic-btn');
            
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                const distance = Math.sqrt(x * x + y * y);
                const maxDistance = 50;
                
                if (distance < maxDistance) {
                    const strength = (maxDistance - distance) / maxDistance;
                    const moveX = x * strength * 0.3;
                    const moveY = y * strength * 0.3;
                    
                    button.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
                }
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
            });
        });
    }

    // ========================================
    // 3. 粒子效果
    // ========================================
    setupParticleEffects() {
        const particleElements = document.querySelectorAll('.hero-cta-primary');
        
        particleElements.forEach(element => {
            element.classList.add('particle-effect');
            element.addEventListener('click', (e) => {
                this.createParticles(e, element);
            });
        });
    }

    createParticles(event, element) {
        const rect = element.getBoundingClientRect();
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            const angle = (360 / particleCount) * i;
            const velocity = 30 + Math.random() * 20;
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                --angle: ${angle}deg;
                --velocity: ${velocity}px;
            `;
            
            element.appendChild(particle);
            
            // 移除粒子
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }
    }

    // ========================================
    // 4. 音效系统
    // ========================================
    initAudioContext() {
        if (this.soundEnabled) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.generateSounds();
            } catch (error) {
                console.warn('音频上下文初始化失败:', error);
                this.soundEnabled = false;
            }
        }
    }

    generateSounds() {
        if (!this.audioContext) return;

        // 点击音效
        this.sounds.click = this.createTone(800, 0.1, 'sine');
        // 悬停音效
        this.sounds.hover = this.createTone(600, 0.05, 'sine');
        // 成功音效
        this.sounds.success = this.createTone(1000, 0.2, 'triangle');
        // 错误音效
        this.sounds.error = this.createTone(300, 0.3, 'sawtooth');
    }

    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.audioContext || !this.soundEnabled) return;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    playSound(soundName) {
        if (this.sounds[soundName] && this.soundEnabled) {
            this.sounds[soundName]();
        }
    }

    setupSoundToggle() {
        // 创建音效切换按钮
        const soundToggle = document.createElement('button');
        soundToggle.className = 'sound-toggle';
        soundToggle.innerHTML = `<i class="fas fa-volume-up"></i>`;
        soundToggle.title = '切换音效';
        soundToggle.setAttribute('aria-label', '切换音效开关');
        
        document.body.appendChild(soundToggle);

        // 更新按钮状态
        this.updateSoundToggle(soundToggle);

        soundToggle.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            localStorage.setItem('soundEnabled', this.soundEnabled);
            this.updateSoundToggle(soundToggle);
            
            if (this.soundEnabled && !this.audioContext) {
                this.initAudioContext();
            }
            
            this.playSound('click');
        });

        // 添加悬停音效
        const hoverElements = document.querySelectorAll('.btn, .nav-link, .social-link');
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.playSound('hover');
            });
        });
    }

    updateSoundToggle(button) {
        if (this.soundEnabled) {
            button.classList.remove('muted');
            button.innerHTML = '<i class="fas fa-volume-up"></i>';
            button.title = '关闭音效';
        } else {
            button.classList.add('muted');
            button.innerHTML = '<i class="fas fa-volume-mute"></i>';
            button.title = '开启音效';
        }
    }

    // ========================================
    // 5. 表单验证微交互
    // ========================================
    setupFormValidation() {
        const formFields = document.querySelectorAll('.form-field');
        
        formFields.forEach(field => {
            const input = field.querySelector('.form-input, .form-textarea, .form-select');
            const icon = field.querySelector('.form-icon');
            const message = field.querySelector('.form-message');
            
            if (!input) return;

            // 实时验证
            input.addEventListener('input', () => {
                this.validateField(field, input, icon, message);
            });

            input.addEventListener('blur', () => {
                this.validateField(field, input, icon, message);
            });

            // 焦点动画
            input.addEventListener('focus', () => {
                field.classList.add('focused');
                this.playSound('hover');
            });

            input.addEventListener('blur', () => {
                field.classList.remove('focused');
            });
        });
    }

    validateField(field, input, icon, message) {
        const value = input.value.trim();
        const isRequired = input.hasAttribute('required');
        const type = input.type;
        const maxLength = input.getAttribute('data-max-length');
        
        let isValid = true;
        let errorMessage = '';

        // 必填验证
        if (isRequired && !value) {
            isValid = false;
            errorMessage = '此字段为必填项';
        }
        // 邮箱验证
        else if (type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = '请输入有效的邮箱地址';
        }
        // 长度验证
        else if (maxLength && value.length > parseInt(maxLength)) {
            isValid = false;
            errorMessage = `内容长度不能超过${maxLength}个字符`;
        }

        // 更新UI状态
        if (isValid && value) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            if (message) message.textContent = '';
            this.playSound('success');
        } else if (!isValid) {
            field.classList.remove('valid');
            field.classList.add('invalid');
            if (message) message.textContent = errorMessage;
            this.playSound('error');
        } else {
            field.classList.remove('valid', 'invalid');
            if (message) message.textContent = '';
        }

        // 更新字符计数
        this.updateCharacterCount(field, input);
    }

    updateCharacterCount(field, input) {
        const counter = field.querySelector('.form-counter');
        if (counter) {
            const current = counter.querySelector('.current');
            const max = counter.querySelector('.max');
            if (current) {
                current.textContent = input.value.length;
                
                // 接近限制时的警告样式
                const maxLength = parseInt(max.textContent);
                const currentLength = input.value.length;
                const percentage = (currentLength / maxLength) * 100;
                
                if (percentage > 90) {
                    counter.style.color = 'var(--error-500)';
                } else if (percentage > 75) {
                    counter.style.color = 'var(--warning-500)';
                } else {
                    counter.style.color = 'var(--color-text-tertiary)';
                }
            }
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ========================================
    // 6. 数字计数动画
    // ========================================
    setupCounterAnimations() {
        const counters = document.querySelectorAll('.hero-stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            observer.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.textContent.replace(/\D/g, ''));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        element.classList.add('counter');

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            const suffix = element.textContent.replace(/\d/g, '').replace(/\+/g, '');
            element.textContent = Math.floor(current) + (target >= 100 ? '+' : '') + suffix;
        }, 16);
    }

    // ========================================
    // 7. 进度条动画
    // ========================================
    setupProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target.querySelector('.progress-fill');
                    const percentage = entry.target.getAttribute('data-percentage') || '100';
                    
                    setTimeout(() => {
                        fill.style.width = percentage + '%';
                    }, 200);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        progressBars.forEach(bar => {
            observer.observe(bar);
        });
    }

    // ========================================
    // 8. 打字机效果
    // ========================================
    setupTypewriterEffect() {
        const typewriterElements = document.querySelectorAll('.typewriter');
        
        typewriterElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            element.style.width = '0';
            
            let i = 0;
            const timer = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    element.style.width = ((i + 1) / text.length * 100) + '%';
                    i++;
                } else {
                    clearInterval(timer);
                    // 移除光标
                    setTimeout(() => {
                        element.style.borderRight = 'none';
                    }, 1000);
                }
            }, 100);
        });
    }

    // ========================================
    // 9. 可访问性增强
    // ========================================
    setupAccessibilityFeatures() {
        // 添加跳过链接
        this.addSkipLink();
        
        // 键盘导航增强
        this.enhanceKeyboardNavigation();
        
        // 屏幕阅读器支持
        this.enhanceScreenReaderSupport();
        
        // 高对比度模式检测
        this.detectHighContrastMode();
    }

    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.className = 'skip-link';
        skipLink.textContent = '跳转到主要内容';
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    enhanceKeyboardNavigation() {
        // 为所有交互元素添加键盘支持
        const interactiveElements = document.querySelectorAll('.post-card, .filter-btn');
        
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                }
            });
        });

        // 焦点陷阱（用于模态框）
        this.setupFocusTrap();
    }

    setupFocusTrap() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.post-modal:not([style*="display: none"])');
                if (modal) {
                    const focusableElements = modal.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            }
        });
    }

    enhanceScreenReaderSupport() {
        // 为动态内容添加aria-live区域
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        
        document.body.appendChild(liveRegion);

        // 状态变化通知
        this.announceToScreenReader = (message) => {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        };

        // 为按钮添加状态描述
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.textContent.trim();
                this.announceToScreenReader(`${action} 已执行`);
            });
        });
    }

    detectHighContrastMode() {
        // 检测高对比度模式
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.classList.add('high-contrast');
        }

        // 监听对比度偏好变化
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('high-contrast');
            } else {
                document.documentElement.classList.remove('high-contrast');
            }
        });
    }

    // ========================================
    // 10. 工具方法
    // ========================================
    
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
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 添加成功反馈
    showSuccessFeedback(element, message = '操作成功') {
        element.classList.add('success-state');
        this.playSound('success');
        
        if (this.announceToScreenReader) {
            this.announceToScreenReader(message);
        }
        
        setTimeout(() => {
            element.classList.remove('success-state');
        }, 2000);
    }

    // 添加错误反馈
    showErrorFeedback(element, message = '操作失败') {
        element.classList.add('error-state');
        this.playSound('error');
        
        if (this.announceToScreenReader) {
            this.announceToScreenReader(message);
        }
        
        setTimeout(() => {
            element.classList.remove('error-state');
        }, 2000);
    }

    // 添加加载状态
    showLoadingState(element) {
        element.classList.add('loading-state');
        element.disabled = true;
    }

    // 移除加载状态
    hideLoadingState(element) {
        element.classList.remove('loading-state');
        element.disabled = false;
    }
}

// 初始化微交互系统
document.addEventListener('DOMContentLoaded', () => {
    window.microInteractions = new MicroInteractions();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MicroInteractions;
}