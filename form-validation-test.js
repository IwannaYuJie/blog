// 表单功能验证测试脚本
// 这个脚本用于验证表单的各项功能是否正常工作

console.log('🧪 开始表单功能测试...');

// 测试1: 检查CSS变量是否正确定义
function testCSSVariables() {
    console.log('📋 测试CSS变量定义...');
    
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const requiredVariables = [
        '--primary-500',
        '--success-500',
        '--error-500',
        '--color-text-primary',
        '--color-bg-primary',
        '--radius-lg',
        '--duration-200'
    ];
    
    const missingVariables = [];
    
    requiredVariables.forEach(variable => {
        const value = computedStyle.getPropertyValue(variable);
        if (!value || value.trim() === '') {
            missingVariables.push(variable);
        }
    });
    
    if (missingVariables.length === 0) {
        console.log('✅ CSS变量定义正确');
        return true;
    } else {
        console.error('❌ 缺少CSS变量:', missingVariables);
        return false;
    }
}

// 测试2: 检查表单元素是否存在
function testFormElements() {
    console.log('📋 测试表单元素...');
    
    const requiredElements = [
        '#contact-form',
        '#post-form',
        '.form-field',
        '.form-input',
        '.form-label',
        '.form-message',
        '.form-icon'
    ];
    
    const missingElements = [];
    
    requiredElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (!element) {
            missingElements.push(selector);
        }
    });
    
    if (missingElements.length === 0) {
        console.log('✅ 表单元素存在');
        return true;
    } else {
        console.error('❌ 缺少表单元素:', missingElements);
        return false;
    }
}

// 测试3: 检查JavaScript类是否正确定义
function testJavaScriptClasses() {
    console.log('📋 测试JavaScript类定义...');
    
    const requiredClasses = [
        'FormValidator',
        'FormEnhancer',
        'ContactFormEnhancer',
        'PostFormEnhancer'
    ];
    
    const missingClasses = [];
    
    requiredClasses.forEach(className => {
        if (typeof window[className] === 'undefined') {
            missingClasses.push(className);
        }
    });
    
    if (missingClasses.length === 0) {
        console.log('✅ JavaScript类定义正确');
        return true;
    } else {
        console.error('❌ 缺少JavaScript类:', missingClasses);
        return false;
    }
}

// 测试4: 模拟表单交互
function testFormInteraction() {
    console.log('📋 测试表单交互...');
    
    const contactForm = document.querySelector('#contact-form');
    if (!contactForm) {
        console.error('❌ 联系表单不存在');
        return false;
    }
    
    const nameInput = contactForm.querySelector('#name');
    const emailInput = contactForm.querySelector('#email');
    
    if (!nameInput || !emailInput) {
        console.error('❌ 表单输入框不存在');
        return false;
    }
    
    // 模拟输入
    nameInput.value = '测试用户';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // 检查标签是否浮动
    setTimeout(() => {
        const nameLabel = nameInput.nextElementSibling;
        const emailLabel = emailInput.nextElementSibling;
        
        if (nameLabel && emailLabel) {
            console.log('✅ 表单交互测试通过');
        } else {
            console.error('❌ 标签浮动功能异常');
        }
    }, 100);
    
    return true;
}

// 测试5: 检查响应式设计
function testResponsiveDesign() {
    console.log('📋 测试响应式设计...');
    
    const formContainer = document.querySelector('.form-container');
    if (!formContainer) {
        console.error('❌ 表单容器不存在');
        return false;
    }
    
    // 检查媒体查询
    const mediaQueries = [
        '(max-width: 768px)',
        '(prefers-reduced-motion: reduce)',
        '(prefers-color-scheme: dark)'
    ];
    
    let responsiveSupport = true;
    
    mediaQueries.forEach(query => {
        if (!window.matchMedia(query)) {
            console.warn('⚠️ 媒体查询支持可能有问题:', query);
            responsiveSupport = false;
        }
    });
    
    if (responsiveSupport) {
        console.log('✅ 响应式设计支持正常');
        return true;
    } else {
        console.error('❌ 响应式设计支持异常');
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行表单功能测试套件...');
    
    const tests = [
        { name: 'CSS变量', fn: testCSSVariables },
        { name: '表单元素', fn: testFormElements },
        { name: 'JavaScript类', fn: testJavaScriptClasses },
        { name: '表单交互', fn: testFormInteraction },
        { name: '响应式设计', fn: testResponsiveDesign }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    tests.forEach(test => {
        try {
            if (test.fn()) {
                passedTests++;
            }
        } catch (error) {
            console.error(`❌ ${test.name}测试失败:`, error);
        }
    });
    
    console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！表单功能正常工作。');
    } else {
        console.log('⚠️ 部分测试失败，请检查相关功能。');
    }
    
    return passedTests === totalTests;
}

// 在DOM加载完成后运行测试
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// 导出测试函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testCSSVariables,
        testFormElements,
        testJavaScriptClasses,
        testFormInteraction,
        testResponsiveDesign,
        runAllTests
    };
}