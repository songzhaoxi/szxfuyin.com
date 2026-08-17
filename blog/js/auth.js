// 兆西福音博客 - 认证系统

class AuthSystem {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkAuthStatus();
    }
    
    initializeElements() {
        // 获取DOM元素
        this.authModal = document.getElementById('auth-modal');
        this.loginBtn = document.getElementById('login-btn');
        this.registerBtn = document.getElementById('register-btn');
        this.authModalClose = document.getElementById('auth-modal-close');
        this.loginForm = document.getElementById('login-form-element');
        this.registerForm = document.getElementById('register-form-element');
        this.switchToRegister = document.getElementById('switch-to-register');
        this.switchToLogin = document.getElementById('switch-to-login');
        this.loginFormContainer = document.getElementById('login-form');
        this.registerFormContainer = document.getElementById('register-form');
        this.userMenu = document.getElementById('user-menu');
        
        // 表单字段
        this.loginEmail = document.getElementById('login-email');
        this.loginPassword = document.getElementById('login-password');
        this.registerName = document.getElementById('register-name');
        this.registerEmail = document.getElementById('register-email');
        this.registerPassword = document.getElementById('register-password');
        this.registerConfirm = document.getElementById('register-confirm');
    }
    
    bindEvents() {
        // 绑定事件监听器
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        if (this.registerBtn) {
            this.registerBtn.addEventListener('click', () => this.showRegisterModal());
        }
        
        if (this.authModalClose) {
            this.authModalClose.addEventListener('click', () => this.hideAuthModal());
        }
        
        if (this.switchToRegister) {
            this.switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }
        
        if (this.switchToLogin) {
            this.switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
        
        // 表单提交
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // 点击模态框外部关闭
        if (this.authModal) {
            this.authModal.addEventListener('click', (e) => {
                if (e.target === this.authModal) {
                    this.hideAuthModal();
                }
            });
        }
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.authModal.classList.contains('active')) {
                this.hideAuthModal();
            }
        });
    }
    
    checkAuthStatus() {
        // 检查当前用户登录状态
        const currentUser = storage.getCurrentUser();
        if (currentUser) {
            this.updateUserInterface(currentUser);
        }
    }
    
    showLoginModal() {
        this.showAuthModal();
        this.showLoginForm();
    }
    
    showRegisterModal() {
        this.showAuthModal();
        this.showRegisterForm();
    }
    
    showAuthModal() {
        if (this.authModal) {
            this.authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideAuthModal() {
        if (this.authModal) {
            this.authModal.classList.remove('active');
            document.body.style.overflow = '';
            this.clearForms();
        }
    }
    
    showLoginForm() {
        if (this.loginFormContainer && this.registerFormContainer) {
            this.loginFormContainer.style.display = 'block';
            this.registerFormContainer.style.display = 'none';
        }
    }
    
    showRegisterForm() {
        if (this.loginFormContainer && this.registerFormContainer) {
            this.loginFormContainer.style.display = 'none';
            this.registerFormContainer.style.display = 'block';
        }
    }
    
    clearForms() {
        if (this.loginForm) this.loginForm.reset();
        if (this.registerForm) this.registerForm.reset();
        
        // 清除错误状态
        this.clearFormErrors();
    }
    
    clearFormErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => element.remove());
        
        const errorFields = document.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = '#EF4444';
        errorElement.style.fontSize = '14px';
        errorElement.style.marginTop = '4px';
        
        field.parentNode.appendChild(errorElement);
    }
    
    validateLoginForm() {
        this.clearFormErrors();
        let isValid = true;
        
        // 验证邮箱
        if (!this.loginEmail.value.trim()) {
            this.showFieldError(this.loginEmail, '请输入邮箱地址');
            isValid = false;
        } else if (!this.isValidEmail(this.loginEmail.value)) {
            this.showFieldError(this.loginEmail, '请输入有效的邮箱地址');
            isValid = false;
        }
        
        // 验证密码
        if (!this.loginPassword.value.trim()) {
            this.showFieldError(this.loginPassword, '请输入密码');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateRegisterForm() {
        this.clearFormErrors();
        let isValid = true;
        
        // 验证姓名
        if (!this.registerName.value.trim()) {
            this.showFieldError(this.registerName, '请输入姓名');
            isValid = false;
        }
        
        // 验证邮箱
        if (!this.registerEmail.value.trim()) {
            this.showFieldError(this.registerEmail, '请输入邮箱地址');
            isValid = false;
        } else if (!this.isValidEmail(this.registerEmail.value)) {
            this.showFieldError(this.registerEmail, '请输入有效的邮箱地址');
            isValid = false;
        }
        
        // 验证密码
        if (!this.registerPassword.value.trim()) {
            this.showFieldError(this.registerPassword, '请输入密码');
            isValid = false;
        } else if (this.registerPassword.value.length < 6) {
            this.showFieldError(this.registerPassword, '密码长度至少6位');
            isValid = false;
        }
        
        // 验证确认密码
        if (!this.registerConfirm.value.trim()) {
            this.showFieldError(this.registerConfirm, '请确认密码');
            isValid = false;
        } else if (this.registerPassword.value !== this.registerConfirm.value) {
            this.showFieldError(this.registerConfirm, '两次输入的密码不一致');
            isValid = false;
        }
        
        return isValid;
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    handleLogin(e) {
        e.preventDefault();
        
        if (!this.validateLoginForm()) {
            return;
        }
        
        // 显示加载状态
        const submitBtn = this.loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';
        submitBtn.disabled = true;
        
        // 模拟登录过程
        setTimeout(() => {
            const result = dataAPI.login(this.loginEmail.value, this.loginPassword.value);
            
            if (result) {
                // 登录成功
                storage.setCurrentUser(result);
                this.updateUserInterface(result);
                this.hideAuthModal();
                this.showNotification('登录成功！', 'success');
            } else {
                // 登录失败
                this.showFieldError(this.loginPassword, '邮箱或密码错误');
                this.showNotification('登录失败，请检查邮箱和密码', 'error');
            }
            
            // 恢复按钮状态
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1000);
    }
    
    handleRegister(e) {
        e.preventDefault();
        
        if (!this.validateRegisterForm()) {
            return;
        }
        
        // 显示加载状态
        const submitBtn = this.registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '注册中...';
        submitBtn.disabled = true;
        
        // 模拟注册过程
        setTimeout(() => {
            const result = dataAPI.register(
                this.registerName.value,
                this.registerEmail.value,
                this.registerPassword.value
            );
            
            if (result.success) {
                // 注册成功
                storage.setCurrentUser(result.user);
                this.updateUserInterface(result.user);
                this.hideAuthModal();
                this.showNotification('注册成功！欢迎加入兆西福音博客！', 'success');
            } else {
                // 注册失败
                this.showFieldError(this.registerEmail, result.message);
                this.showNotification(result.message, 'error');
            }
            
            // 恢复按钮状态
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1000);
    }
    
    updateUserInterface(user) {
        if (!this.userMenu) return;
        
        // 更新用户菜单
        this.userMenu.innerHTML = `
            <div class="user-info" style="display: flex; align-items: center; gap: 12px;">
                <div class="user-avatar" style="
                    width: 32px; 
                    height: 32px; 
                    border-radius: 50%; 
                    background: #3B82F6; 
                    color: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: 600;
                    font-size: 14px;
                ">${user.avatar}</div>
                <span style="color: #374151; font-size: 14px;">${user.name}</span>
                <button class="auth-btn" id="logout-btn" style="padding: 6px 12px; font-size: 12px;">退出</button>
            </div>
        `;
        
        // 绑定退出事件
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    logout() {
        storage.setCurrentUser(null);
        
        // 重置用户菜单
        if (this.userMenu) {
            this.userMenu.innerHTML = `
                <button class="auth-btn" id="login-btn">登录</button>
                <button class="auth-btn primary" id="register-btn">注册</button>
            `;
            
            // 重新绑定事件
            document.getElementById('login-btn').addEventListener('click', () => this.showLoginModal());
            document.getElementById('register-btn').addEventListener('click', () => this.showRegisterModal());
        }
        
        this.showNotification('已退出登录', 'info');
    }
    
    isLoggedIn() {
        return storage.getCurrentUser() !== null;
    }
    
    getCurrentUser() {
        return storage.getCurrentUser();
    }
    
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span>${message}</span>
                <button class="notification-close" style="
                    background: none; 
                    border: none; 
                    cursor: pointer; 
                    color: #525252;
                    font-size: 18px;
                    line-height: 1;
                ">&times;</button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 绑定关闭事件
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hideNotification(notification));
        
        // 自动关闭
        setTimeout(() => this.hideNotification(notification), 5000);
    }
    
    hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 250);
    }
}

// 全局认证实例
let authSystem;

// 初始化认证系统
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
});