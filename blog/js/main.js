// 兆西福音博客 - 主控制器

class BlogApplication {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
    }
    
    initializeElements() {
        // 获取主要DOM元素
        this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.searchToggle = document.getElementById('search-toggle');
        this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    }
    
    bindEvents() {
        // 移动端菜单切换
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // 导航链接点击
        this.bindNavigationLinks();
        
        // 滚动事件
        this.bindScrollEvents();
        
        // 窗口大小变化
        this.bindResizeEvents();
        
        // 键盘快捷键
        this.bindKeyboardEvents();
        
        // 页面加载完成
        window.addEventListener('load', () => this.onPageLoad());
    }
    
    bindNavigationLinks() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                this.setActiveNavLink(link);
                
                // 移动端关闭菜单
                if (this.navMenu.classList.contains('active')) {
                    this.toggleMobileMenu();
                }
            });
        });
    }
    
    bindScrollEvents() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    bindResizeEvents() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }
    
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K 打开搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (searchSystem) {
                    searchSystem.showSearchContainer();
                }
            }
            
            // ESC 关闭各种弹窗
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    initializeApp() {
        // 初始化各个系统
        this.initializeNavigation();
        this.setupScrollEffects();
        this.loadInitialContent();
    }
    
    initializeNavigation() {
        // 设置初始激活导航链接
        this.setActiveNavLinkByScroll();
    }
    
    setActiveNavLink(link) {
        // 移除所有激活状态
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        
        // 设置当前链接为激活状态
        link.classList.add('active');
    }
    
    setActiveNavLinkByScroll() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    toggleMobileMenu() {
        if (this.navMenu) {
            this.navMenu.classList.toggle('active');
            
            // 切换汉堡菜单图标
            const spans = this.mobileMenuToggle.querySelectorAll('span');
            if (this.navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        }
    }
    
    scrollToSection(sectionId) {
        // 处理管理员功能页面
        if (['templates', 'uploads', 'links'].includes(sectionId)) {
            this.showAdminSection(sectionId);
            return;
        }

        const section = document.getElementById(sectionId);
        if (section) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = section.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // 显示管理员功能区域
    showAdminSection(sectionId) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        if (!currentUser) {
            alert('请先登录以使用管理员功能！');
            return;
        }

        // 隐藏所有区域
        const adminSection = document.getElementById('admin-section');
        if (adminSection) {
            adminSection.style.display = 'block';
            
            // 滚动到管理员区域
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = adminSection.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // 初始化管理员功能
            if (window.initAdmin) {
                window.initAdmin();
            }

            // 渲染对应的内容
            switch (sectionId) {
                case 'templates':
                    if (window.renderTemplates) {
                        window.renderTemplates();
                    }
                    break;
                case 'uploads':
                    if (window.renderUploads) {
                        window.renderUploads();
                    }
                    break;
                case 'links':
                    if (window.renderLinks) {
                        window.renderLinks();
                    }
                    break;
            }
        }
    }
    
    handleScroll() {
        // 更新导航链接状态
        this.setActiveNavLinkByScroll();
        
        // 添加导航栏滚动效果
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.pageYOffset > 50) {
                navbar.style.background = 'rgba(248, 250, 252, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.background = '#F8FAFC';
                navbar.style.backdropFilter = 'none';
            }
        }
        
        // 懒加载实现
        this.handleLazyLoading();
    }
    
    handleResize() {
        // 移动端菜单重置
        if (window.innerWidth > 1023) {
            if (this.navMenu) {
                this.navMenu.classList.remove('active');
            }
            
            // 重置汉堡菜单图标
            const spans = this.mobileMenuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
        
        // 关闭搜索容器
        if (searchSystem && searchSystem.isSearchActive() && window.innerWidth > 1023) {
            searchSystem.hideSearchContainer();
        }
    }
    
    setupScrollEffects() {
        // 创建Intersection Observer用于动画
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // 观察需要动画的元素
        document.querySelectorAll('.article-card, .video-card, .audio-player, .image-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
    
    handleLazyLoading() {
        // 简单的图片懒加载实现
        const images = document.querySelectorAll('img[data-src]');
        
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
    }
    
    closeAllModals() {
        // 关闭所有模态框
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // 恢复页面滚动
        document.body.style.overflow = '';
        
        // 重置页面标题
        document.title = '兆西福音博客 - 传递福音，启发生命';
        
        // 关闭移动端菜单
        if (this.navMenu && this.navMenu.classList.contains('active')) {
            this.toggleMobileMenu();
        }
        
        // 关闭搜索容器
        if (searchSystem && searchSystem.isSearchActive()) {
            searchSystem.hideSearchContainer();
        }
    }
    
    loadInitialContent() {
        // 页面加载时自动加载文章
        if (articleSystem) {
            articleSystem.loadArticles();
        }
    }
    
    onPageLoad() {
        // 页面完全加载后的处理
        this.hidePageLoader();
        this.initializeTooltips();
        this.setupImageLightbox();
    }
    
    hidePageLoader() {
        // 隐藏加载指示器（如果存在）
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
            }, 300);
        }
    }
    
    initializeTooltips() {
        // 为带有data-tooltip属性的元素添加工具提示
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.classList.add('tooltip');
        });
    }
    
    setupImageLightbox() {
        // 为图片添加点击放大功能
        document.querySelectorAll('.article-content img').forEach(img => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => {
                this.showImageLightbox(img.src, img.alt);
            });
        });
    }
    
    showImageLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.className = 'modal active';
        lightbox.innerHTML = `
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                <div style="text-align: center; padding: 24px;">
                    <img src="${src}" alt="${alt}" style="
                        max-width: 100%; 
                        max-height: 80vh; 
                        object-fit: contain;
                    ">
                    ${alt ? `<p style="margin-top: 16px; color: #525252;">${alt}</p>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';
        
        // 点击外部关闭
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.remove();
                document.body.style.overflow = '';
            }
        });
    }
    
    // 实用方法
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
    
    // 性能监控
    measurePerformance() {
        if (window.performance && window.performance.mark) {
            window.performance.mark('app-init-start');
            
            window.addEventListener('load', () => {
                window.performance.mark('app-init-end');
                window.performance.measure('app-init', 'app-init-start', 'app-init-end');
                
                const measure = window.performance.getEntriesByName('app-init')[0];
                console.log(`应用初始化耗时: ${measure.duration.toFixed(2)}ms`);
            });
        }
    }
    
    // 错误处理
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('应用错误:', e.error);
            // 这里可以添加错误报告逻辑
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('未处理的Promise拒绝:', e.reason);
            // 这里可以添加错误报告逻辑
        });
    }
}

// 全局应用实例
let blogApp;

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化应用
    blogApp = new BlogApplication();
    
    // 设置性能监控
    blogApp.measurePerformance();
    
    // 设置错误处理
    blogApp.setupErrorHandling();
    
    console.log('兆西福音博客应用已初始化');
});

// 页面卸载时的清理工作
window.addEventListener('beforeunload', () => {
    // 清理定时器和事件监听器
    if (multimediaSystem && multimediaSystem.audioInterval) {
        clearInterval(multimediaSystem.audioInterval);
    }
});

// 导出全局函数供HTML调用
window.openArticleModal = function(articleId) {
    if (articleSystem) {
        articleSystem.openArticleModal(articleId);
    }
};

window.openSearchResults = function() {
    if (searchSystem) {
        const query = searchSystem.searchInput.value.trim();
        if (query) {
            searchSystem.performSearch();
        }
    }
};

// 错误兜底函数
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise错误:', e.reason);
});