// ========================================
// Animation and Effects Module
// ========================================

function initParallaxEffects() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const heroShapes = document.querySelectorAll('.hero-shape');
    const heroFloatingElements = document.querySelectorAll('.hero-floating-element');
    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual');

    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        hero.style.transform = `translateY(${scrolled * -0.5}px)`;
        heroShapes.forEach((shape, index) => {
            shape.style.transform = `translateY(${scrolled * -0.3 * (index * 0.1 + 1)}px) rotate(${scrolled * 0.05}deg)`;
        });
        heroFloatingElements.forEach((element, index) => {
            element.style.transform = `translateY(${scrolled * -0.2 * (index * 0.15 + 1)}px) rotate(${scrolled * 0.02}deg)`;
        });
        if (heroContent) heroContent.style.transform = `translateY(${scrolled * 0.1}px)`;
        if (heroVisual) heroVisual.style.transform = `translateY(${scrolled * 0.05}px)`;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });
}

function initHeroAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.hero-badge, .hero-title, .hero-subtitle, .hero-stats, .hero-buttons, .hero-visual').forEach(el => observer.observe(el));
}

function initTechIconEffects() {
    document.querySelectorAll('.tech-icon').forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.2) rotate(10deg)';
            icon.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = '';
            icon.style.boxShadow = '';
        });
    });
}

function initButtonRippleEffect() {
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `@keyframes ripple { to { transform: scale(2); opacity: 0; } }`;
        document.head.appendChild(style);
    }

    document.querySelectorAll('.hero-cta-primary, .hero-cta-secondary').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;background:rgba(255,255,255,0.3);border-radius:50%;transform:scale(0);animation:ripple .6s ease-out;pointer-events:none;`;
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            document.querySelector('#posts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        scrollIndicator.style.cursor = 'pointer';
    }
}

function initPageLoader() {
    const pageLoader = document.getElementById('page-loader');
    if (!pageLoader) return;
    window.addEventListener('load', () => {
        setTimeout(() => {
            pageLoader.classList.add('fade-out');
            setTimeout(() => pageLoader.remove(), 500);
        }, 300);
    });
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in-up, .section-title, .contact-form, .about-text, .footer').forEach(el => observer.observe(el));
}

function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollPercent = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                backToTopBtn.classList.toggle('show', window.pageYOffset > 300);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 70;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });
}

function setupScrollEffects() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                navbar.classList.toggle('scrolled', window.pageYOffset > 50);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}


export function initAllAnimations() {
    initParallaxEffects();
    initHeroAnimations();
    initTechIconEffects();
    initButtonRippleEffect();
    initScrollIndicator();
    initPageLoader();
    initScrollAnimations();
    initScrollProgress();
    initBackToTop();
    setupNavigation();
    setupScrollEffects();
    console.log('🎬 All animations initialized.');
}
