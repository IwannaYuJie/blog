/**
 * 登录表单验证模块
 * 提供实时表单验证、输入安全检查和用户体验优化
 * 支持邮箱格式验证、密码强度检查、防止恶意输入等功能
 */

// 表单验证管理器
// 检查是否已经定义过FormValidator
if (typeof window.FormValidator === 'undefined') {

class FormValidator {
    constructor() {
        this.validationRules = {
            email: {
                required: true,
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                minLength: 5,
                maxLength: 254,
                message: '请输入有效的邮箱地址'
            },
            password: {
                required: true,
                minLength: 6,
                maxLength: 128,
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
                message: '密码至少6位，包含字母和数字'
            },
            name: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/,
                message: '姓名只能包含中文、英文和空格'
            }
        };
        
        this.debounceTimers = new Map();
        this.validationStates = new Map();
        
        this.initializeValidation();
    }

    /**
     * 初始化表单验证
     */
    initializeValidation() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupValidation());
        } else {
            this.setupValidation();
        }
    }

    /**
     * 设置表单验证
     */
    setupValidation() {
        // 获取所有需要验证的输入框
        const inputs = document.querySelectorAll('input[data-validate]');
        
        inputs.forEach(input => {
            this.setupInputValidation(input);
        });

        // 设置表单提交验证
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.setupFormValidation(form);
        });

        // // console.log('✅ 表单验证初始化完成');
    }

    /**
     * 设置单个输入框验证
     * @param {HTMLElement} input 输入框元素
     */
    setupInputValidation(input) {
        const fieldName = input.getAttribute('data-validate');
        
        // 实时验证（防抖）
        input.addEventListener('input', (e) => {
            this.debounceValidation(input, fieldName, 300);
        });

        // 失焦验证
        input.addEventListener('blur', (e) => {
            this.validateField(input, fieldName);
        });

        // 获得焦点时清除错误状态
        input.addEventListener('focus', (e) => {
            this.clearFieldError(input);
        });

        // 特殊处理：密码确认
        if (fieldName === 'confirmPassword') {
            const passwordInput = document.querySelector('input[data-validate="password"]');
            if (passwordInput) {
                passwordInput.addEventListener('input', () => {
                    if (input.value) {
                        this.debounceValidation(input, fieldName, 300);
                    }
                });
            }
        }
    }

    /**
     * 设置表单提交验证
     * @param {HTMLElement} form 表单元素
     */
    setupFormValidation(form) {
        form.addEventListener('submit', (e) => {
            if (!this.validateForm(form)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    /**
     * 防抖验证
     * @param {HTMLElement} input 输入框元素
     * @param {string} fieldName 字段名
     * @param {number} delay 延迟时间（毫秒）
     */
    debounceValidation(input, fieldName, delay) {
        const timerId = this.debounceTimers.get(input);
        if (timerId) {
            clearTimeout(timerId);
        }

        const newTimerId = setTimeout(() => {
            this.validateField(input, fieldName);
        }, delay);

        this.debounceTimers.set(input, newTimerId);
    }

    /**
     * 验证单个字段
     * @param {HTMLElement} input 输入框元素
     * @param {string} fieldName 字段名
     * @returns {boolean} 验证结果
     */
    validateField(input, fieldName) {
        const value = input.value.trim();
        const rules = this.validationRules[fieldName];
        
        if (!rules) {
            // // console.warn(`⚠️ 未找到字段 ${fieldName} 的验证规则`);
            return true;
        }

        // 清除之前的错误状态
        this.clearFieldError(input);

        // 验证逻辑
        const validationResult = this.performValidation(value, rules, fieldName, input);
        
        // 更新验证状态
        this.validationStates.set(input, validationResult.isValid);
        
        if (!validationResult.isValid) {
            this.showFieldError(input, validationResult.message);
        } else {
            this.showFieldSuccess(input);
        }

        return validationResult.isValid;
    }

    /**
     * 执行验证逻辑
     * @param {string} value 输入值
     * @param {Object} rules 验证规则
     * @param {string} fieldName 字段名
     * @param {HTMLElement} input 输入框元素
     * @returns {Object} 验证结果
     */
    performValidation(value, rules, fieldName, input) {
        // 必填验证
        if (rules.required && !value) {
            return {
                isValid: false,
                message: this.getFieldDisplayName(fieldName) + '不能为空'
            };
        }

        // 如果值为空且非必填，则通过验证
        if (!value && !rules.required) {
            return { isValid: true };
        }

        // 长度验证
        if (rules.minLength && value.length < rules.minLength) {
            return {
                isValid: false,
                message: `${this.getFieldDisplayName(fieldName)}至少需要${rules.minLength}个字符`
            };
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            return {
                isValid: false,
                message: `${this.getFieldDisplayName(fieldName)}不能超过${rules.maxLength}个字符`
            };
        }

        // 格式验证
        if (rules.pattern && !rules.pattern.test(value)) {
            return {
                isValid: false,
                message: rules.message || `${this.getFieldDisplayName(fieldName)}格式不正确`
            };
        }

        // 特殊验证
        const specialValidation = this.performSpecialValidation(value, fieldName, input);
        if (!specialValidation.isValid) {
            return specialValidation;
        }

        // 安全检查
        const securityCheck = this.performSecurityCheck(value, fieldName);
        if (!securityCheck.isValid) {
            return securityCheck;
        }

        return { isValid: true };
    }

    /**
     * 执行特殊验证
     * @param {string} value 输入值
     * @param {string} fieldName 字段名
     * @param {HTMLElement} input 输入框元素
     * @returns {Object} 验证结果
     */
    performSpecialValidation(value, fieldName, input) {
        switch (fieldName) {
            case 'email':
                return this.validateEmail(value);
            
            case 'password':
                return this.validatePassword(value);
            
            case 'confirmPassword':
                return this.validateConfirmPassword(value, input);
            
            default:
                return { isValid: true };
        }
    }

    /**
     * 验证邮箱
     * @param {string} email 邮箱地址
     * @returns {Object} 验证结果
     */
    validateEmail(email) {
        // 基本格式验证已在pattern中完成
        
        // 检查常见的邮箱域名拼写错误
        const commonDomains = ['gmail.com', 'qq.com', '163.com', '126.com', 'sina.com', 'hotmail.com', 'outlook.com'];
        const domain = email.split('@')[1];
        
        if (domain) {
            // 检查是否有相似的域名（简单的拼写检查）
            const suggestion = this.suggestEmailDomain(domain, commonDomains);
            if (suggestion && suggestion !== domain) {
                return {
                    isValid: false,
                    message: `您是否想输入 ${email.split('@')[0]}@${suggestion}？`
                };
            }
        }

        return { isValid: true };
    }

    /**
     * 验证密码强度
     * @param {string} password 密码
     * @returns {Object} 验证结果
     */
    validatePassword(password) {
        const strength = this.calculatePasswordStrength(password);
        
        if (strength.score < 2) {
            return {
                isValid: false,
                message: `密码强度太弱，${strength.feedback}`
            };
        }

        return { isValid: true };
    }

    /**
     * 验证确认密码
     * @param {string} confirmPassword 确认密码
     * @param {HTMLElement} input 输入框元素
     * @returns {Object} 验证结果
     */
    validateConfirmPassword(confirmPassword, input) {
        const passwordInput = input.form.querySelector('input[data-validate="password"]');
        const password = passwordInput ? passwordInput.value : '';
        
        if (confirmPassword !== password) {
            return {
                isValid: false,
                message: '两次输入的密码不一致'
            };
        }

        return { isValid: true };
    }

    /**
     * 执行安全检查
     * @param {string} value 输入值
     * @param {string} fieldName 字段名
     * @returns {Object} 验证结果
     */
    performSecurityCheck(value, fieldName) {
        // XSS防护：检查潜在的脚本注入
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi
        ];

        for (const pattern of xssPatterns) {
            if (pattern.test(value)) {
                return {
                    isValid: false,
                    message: '输入包含不安全的内容，请重新输入'
                };
            }
        }

        // SQL注入防护：检查潜在的SQL注入
        const sqlPatterns = [
            /('|(\-\-)|(;)|(\||\|)|(\*|\*))/gi,
            /(union|select|insert|delete|update|drop|create|alter|exec|execute)/gi
        ];

        if (fieldName !== 'password') { // 密码可能包含特殊字符
            for (const pattern of sqlPatterns) {
                if (pattern.test(value)) {
                    return {
                        isValid: false,
                        message: '输入包含不安全的字符，请重新输入'
                    };
                }
            }
        }

        return { isValid: true };
    }

    /**
     * 计算密码强度
     * @param {string} password 密码
     * @returns {Object} 强度信息
     */
    calculatePasswordStrength(password) {
        let score = 0;
        const feedback = [];

        // 长度检查
        if (password.length >= 8) score += 1;
        else feedback.push('至少8个字符');

        if (password.length >= 12) score += 1;

        // 字符类型检查
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('包含小写字母');

        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('包含大写字母');

        if (/\d/.test(password)) score += 1;
        else feedback.push('包含数字');

        if (/[^a-zA-Z\d]/.test(password)) score += 1;
        else feedback.push('包含特殊字符');

        // 常见密码检查
        const commonPasswords = ['123456', 'password', '123456789', 'qwerty', 'abc123'];
        if (commonPasswords.includes(password.toLowerCase())) {
            score = 0;
            feedback.push('避免使用常见密码');
        }

        return {
            score,
            feedback: feedback.join('、')
        };
    }

    /**
     * 建议邮箱域名
     * @param {string} domain 输入的域名
     * @param {Array} commonDomains 常见域名列表
     * @returns {string|null} 建议的域名
     */
    suggestEmailDomain(domain, commonDomains) {
        const threshold = 2; // 编辑距离阈值
        
        for (const commonDomain of commonDomains) {
            const distance = this.calculateEditDistance(domain, commonDomain);
            if (distance <= threshold && distance > 0) {
                return commonDomain;
            }
        }
        
        return null;
    }

    /**
     * 计算编辑距离（Levenshtein距离）
     * @param {string} str1 字符串1
     * @param {string} str2 字符串2
     * @returns {number} 编辑距离
     */
    calculateEditDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * 验证整个表单
     * @param {HTMLElement} form 表单元素
     * @returns {boolean} 验证结果
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input[data-validate]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            const fieldName = input.getAttribute('data-validate');
            const isFieldValid = this.validateField(input, fieldName);
            
            if (!isFieldValid) {
                isFormValid = false;
            }
        });

        // 如果表单无效，滚动到第一个错误字段
        if (!isFormValid) {
            const firstErrorField = form.querySelector('.form-group.error input');
            if (firstErrorField) {
                firstErrorField.focus();
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return isFormValid;
    }

    /**
     * 显示字段错误
     * @param {HTMLElement} input 输入框元素
     * @param {string} message 错误消息
     */
    showFieldError(input, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.add('error');
        formGroup.classList.remove('success');
        
        let errorElement = formGroup.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // 添加错误图标
        this.updateFieldIcon(input, 'error');
    }

    /**
     * 显示字段成功状态
     * @param {HTMLElement} input 输入框元素
     */
    showFieldSuccess(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.add('success');
        formGroup.classList.remove('error');
        
        const errorElement = formGroup.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // 添加成功图标
        this.updateFieldIcon(input, 'success');
    }

    /**
     * 清除字段错误状态
     * @param {HTMLElement} input 输入框元素
     */
    clearFieldError(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error', 'success');
        
        const errorElement = formGroup.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // 移除状态图标
        this.updateFieldIcon(input, 'none');
    }

    /**
     * 更新字段图标
     * @param {HTMLElement} input 输入框元素
     * @param {string} state 状态：'success', 'error', 'none'
     */
    updateFieldIcon(input, state) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        let iconElement = formGroup.querySelector('.field-icon');
        if (!iconElement) {
            iconElement = document.createElement('div');
            iconElement.className = 'field-icon';
            formGroup.appendChild(iconElement);
        }

        iconElement.innerHTML = '';
        
        switch (state) {
            case 'success':
                iconElement.innerHTML = '<i class="fas fa-check-circle"></i>';
                iconElement.className = 'field-icon success';
                break;
            case 'error':
                iconElement.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
                iconElement.className = 'field-icon error';
                break;
            default:
                iconElement.className = 'field-icon';
        }
    }

    /**
     * 获取字段显示名称
     * @param {string} fieldName 字段名
     * @returns {string} 显示名称
     */
    getFieldDisplayName(fieldName) {
        const displayNames = {
            email: '邮箱',
            password: '密码',
            confirmPassword: '确认密码',
            name: '姓名'
        };
        
        return displayNames[fieldName] || fieldName;
    }

    /**
     * 重置表单验证状态
     * @param {HTMLElement} form 表单元素
     */
    resetFormValidation(form) {
        const inputs = form.querySelectorAll('input[data-validate]');
        
        inputs.forEach(input => {
            this.clearFieldError(input);
            this.validationStates.delete(input);
        });
    }

    /**
     * 获取表单验证状态
     * @param {HTMLElement} form 表单元素
     * @returns {boolean} 表单是否有效
     */
    getFormValidationState(form) {
        const inputs = form.querySelectorAll('input[data-validate]');
        
        for (const input of inputs) {
            const isValid = this.validationStates.get(input);
            if (isValid === false) {
                return false;
            }
        }
        
        return true;
    }
}

// 密码强度指示器
class PasswordStrengthIndicator {
    constructor(passwordInput, indicatorElement) {
        this.passwordInput = passwordInput;
        this.indicatorElement = indicatorElement;
        
        this.setupIndicator();
    }

    /**
     * 设置密码强度指示器
     */
    setupIndicator() {
        if (!this.passwordInput || !this.indicatorElement) return;

        this.passwordInput.addEventListener('input', () => {
            this.updateStrengthIndicator();
        });

        this.passwordInput.addEventListener('focus', () => {
            this.indicatorElement.style.display = 'block';
        });

        this.passwordInput.addEventListener('blur', () => {
            if (!this.passwordInput.value) {
                this.indicatorElement.style.display = 'none';
            }
        });
    }

    /**
     * 更新密码强度指示器
     */
    updateStrengthIndicator() {
        const password = this.passwordInput.value;
        const strength = this.calculateStrength(password);
        
        this.indicatorElement.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill ${strength.level}" style="width: ${strength.percentage}%"></div>
            </div>
            <div class="strength-text">
                密码强度: <span class="${strength.level}">${strength.text}</span>
            </div>
            ${strength.suggestions ? `<div class="strength-suggestions">${strength.suggestions}</div>` : ''}
        `;
    }

    /**
     * 计算密码强度
     * @param {string} password 密码
     * @returns {Object} 强度信息
     */
    calculateStrength(password) {
        if (!password) {
            return { level: 'none', percentage: 0, text: '请输入密码' };
        }

        let score = 0;
        const suggestions = [];

        // 长度评分
        if (password.length >= 8) score += 25;
        else suggestions.push('至少8个字符');

        if (password.length >= 12) score += 25;

        // 字符类型评分
        if (/[a-z]/.test(password)) score += 10;
        else suggestions.push('包含小写字母');

        if (/[A-Z]/.test(password)) score += 10;
        else suggestions.push('包含大写字母');

        if (/\d/.test(password)) score += 15;
        else suggestions.push('包含数字');

        if (/[^a-zA-Z\d]/.test(password)) score += 15;
        else suggestions.push('包含特殊字符');

        // 确定强度等级
        let level, text;
        if (score < 30) {
            level = 'weak';
            text = '弱';
        } else if (score < 60) {
            level = 'medium';
            text = '中等';
        } else if (score < 90) {
            level = 'strong';
            text = '强';
        } else {
            level = 'very-strong';
            text = '很强';
        }

        return {
            level,
            percentage: Math.min(score, 100),
            text,
            suggestions: suggestions.length > 0 ? `建议: ${suggestions.join('、')}` : null
        };
    }
}

// 创建全局验证器实例
const formValidator = new FormValidator();

// 页面加载完成后初始化密码强度指示器
document.addEventListener('DOMContentLoaded', function() {
    // 初始化密码强度指示器
    const passwordInput = document.querySelector('input[data-validate="password"]');
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (passwordInput && strengthIndicator) {
        new PasswordStrengthIndicator(passwordInput, strengthIndicator);
    }

    // // console.log('🔍 表单验证模块初始化完成');
});

// 导出给其他模块使用
if (typeof window !== 'undefined') {
    window.formValidator = formValidator;
    window.FormValidator = FormValidator;
    window.PasswordStrengthIndicator = PasswordStrengthIndicator;
}

} // 结束FormValidator类定义检查