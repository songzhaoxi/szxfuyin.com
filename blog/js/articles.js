// 兆西福音博客 - 文章功能

class ArticleSystem {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentCategory = 'all';
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.currentArticle = null;
    }
    
    initializeElements() {
        // 获取DOM元素
        this.articlesGrid = document.getElementById('articles-grid');
        this.articlesPagination = document.getElementById('articles-pagination');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.articleModal = document.getElementById('article-modal');
        this.modalClose = document.getElementById('modal-close');
        this.modalBody = document.getElementById('modal-body');
        this.startReadingBtn = document.getElementById('start-reading-btn');
    }
    
    bindEvents() {
        // 分类筛选
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCategoryFilter(e));
        });
        
        // 文章模态框
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeArticleModal());
        }
        
        if (this.articleModal) {
            this.articleModal.addEventListener('click', (e) => {
                if (e.target === this.articleModal) {
                    this.closeArticleModal();
                }
            });
        }
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.articleModal.classList.contains('active')) {
                this.closeArticleModal();
            }
        });
        
        // 开始阅读按钮
        if (this.startReadingBtn) {
            this.startReadingBtn.addEventListener('click', () => {
                document.getElementById('articles').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }
    
    handleCategoryFilter(e) {
        const category = e.target.dataset.category;
        
        // 更新激活状态
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // 重新加载文章
        this.currentCategory = category;
        this.currentPage = 1;
        this.loadArticles();
    }
    
    loadArticles() {
        this.showLoading();
        
        // 模拟加载延迟
        setTimeout(() => {
            const result = dataAPI.getArticles(this.currentCategory, this.currentPage, this.itemsPerPage);
            this.displayArticles(result.articles);
            this.displayPagination(result.total, result.page, result.totalPages);
            this.hideLoading();
        }, 300);
    }
    
    displayArticles(articles) {
        if (!this.articlesGrid) return;
        
        if (articles.length === 0) {
            this.articlesGrid.innerHTML = `
                <div class="empty-state">
                    <h3>暂无文章</h3>
                    <p>该分类下还没有发布任何文章</p>
                </div>
            `;
            return;
        }
        
        this.articlesGrid.innerHTML = articles.map(article => `
            <div class="article-card" onclick="openArticleModal(${article.id})">
                <div class="article-meta">
                    <span class="article-category">${this.getCategoryName(article.category)}</span>
                    <span>${article.date}</span>
                    <span>阅读 ${article.readTime}</span>
                </div>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-footer">
                    <div class="article-author">
                        <div class="author-avatar">${article.author.charAt(0)}</div>
                        <span>${article.author}</span>
                    </div>
                    <div class="article-stats">
                        <div class="stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>${article.views}</span>
                        </div>
                        <div class="stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${article.likes}</span>
                        </div>
                        <div class="stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>${article.comments}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    displayPagination(total, currentPage, totalPages) {
        if (!this.articlesPagination) return;
        
        this.articlesPagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // 上一页
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '上一页';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => this.goToPage(currentPage - 1));
        pagination.appendChild(prevBtn);
        
        // 页码按钮
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => this.goToPage(i));
            pagination.appendChild(pageBtn);
        }
        
        // 下一页
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = '下一页';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => this.goToPage(currentPage + 1));
        pagination.appendChild(nextBtn);
        
        this.articlesPagination.appendChild(pagination);
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.loadArticles();
        
        // 滚动到文章区域
        document.getElementById('articles').scrollIntoView({ behavior: 'smooth' });
    }
    
    openArticleModal(articleId) {
        const article = dataAPI.getArticle(articleId);
        if (!article) return;
        
        this.currentArticle = article;
        
        // 更新模态框内容
        this.modalBody.innerHTML = this.generateArticleHTML(article);
        
        // 显示模态框
        this.articleModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 更新页面标题
        document.title = `${article.title} - 兆西福音博客`;
        
        // 绑定评论相关事件
        this.bindCommentEvents();
    }
    
    closeArticleModal() {
        this.articleModal.classList.remove('active');
        document.body.style.overflow = '';
        document.title = '兆西福音博客 - 传递福音，启发生命';
        
        // 清理模态框内容
        setTimeout(() => {
            this.modalBody.innerHTML = '';
        }, 250);
    }
    
    generateArticleHTML(article) {
        return `
            <div class="article-modal-content">
                <div class="article-header">
                    <h1 class="article-detail-title">
                        <span class="first-letter">${article.title.charAt(0)}</span>${article.title.slice(1)}
                    </h1>
                    <div class="article-detail-meta">
                        <div class="article-meta">
                            <span class="article-category">${this.getCategoryName(article.category)}</span>
                            <span>${article.author}</span>
                            <span>${article.date}</span>
                            <span>阅读 ${article.readTime}</span>
                        </div>
                        <div class="article-stats">
                            <div class="stat-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <span>${article.views}</span>
                            </div>
                            <div class="stat-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                <span>${article.likes}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="article-content">
                    ${article.content}
                </div>
                
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                
                <!-- 评论区域 -->
                <div class="comments-section">
                    <div class="comments-header">
                        <h3 class="comments-title">评论</h3>
                        <span class="comments-count">${article.comments} 条评论</span>
                    </div>
                    
                    <!-- 评论表单 -->
                    <div class="comment-form">
                        <div class="form-group">
                            <textarea id="comment-content" placeholder="写下你的想法..." rows="4"></textarea>
                        </div>
                        <button class="btn btn-primary" onclick="articleSystem.submitComment()">发表评论</button>
                    </div>
                    
                    <!-- 评论列表 -->
                    <div class="comment-list" id="comment-list">
                        <!-- 评论内容将通过JavaScript动态加载 -->
                    </div>
                </div>
            </div>
        `;
    }
    
    bindCommentEvents() {
        // 加载评论
        this.loadComments();
        
        // 绑定评论相关事件
        this.bindCommentSubmit();
    }
    
    loadComments() {
        if (!this.currentArticle) return;
        
        const comments = dataAPI.getComments(this.currentArticle.id);
        const commentList = document.getElementById('comment-list');
        
        if (comments.length === 0) {
            commentList.innerHTML = `
                <div class="empty-state">
                    <p>还没有评论，来发表第一个评论吧！</p>
                </div>
            `;
            return;
        }
        
        commentList.innerHTML = comments.map(comment => this.generateCommentHTML(comment)).join('');
    }
    
    generateCommentHTML(comment) {
        const repliesHTML = comment.replies && comment.replies.length > 0 
            ? `<div class="comment-replies">
                ${comment.replies.map(reply => this.generateReplyHTML(reply)).join('')}
               </div>`
            : '';
        
        return `
            <div class="comment-item">
                <div class="comment-avatar">${comment.author.charAt(0)}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-date">${comment.date} ${comment.time}</span>
                    </div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-actions">
                        <button class="comment-action" onclick="articleSystem.likeComment(${comment.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            点赞 (${comment.likes})
                        </button>
                        <button class="comment-action" onclick="articleSystem.showReplyForm(${comment.id})">回复</button>
                    </div>
                    
                    <!-- 回复表单 -->
                    <div class="reply-form" id="reply-form-${comment.id}" style="display: none;">
                        <textarea placeholder="写下你的回复..." rows="3"></textarea>
                        <div style="margin-top: 8px;">
                            <button class="btn btn-small btn-primary" onclick="articleSystem.submitReply(${comment.id})">发表回复</button>
                            <button class="btn btn-small" onclick="articleSystem.hideReplyForm(${comment.id})">取消</button>
                        </div>
                    </div>
                    
                    ${repliesHTML}
                </div>
            </div>
        `;
    }
    
    generateReplyHTML(reply) {
        return `
            <div class="reply-item">
                <div class="reply-avatar">${reply.author.charAt(0)}</div>
                <div class="reply-content">
                    <div class="reply-header">
                        <span class="reply-author">${reply.author}</span>
                        <span class="reply-date">${reply.date} ${reply.time}</span>
                    </div>
                    <div class="reply-text">${reply.content}</div>
                </div>
            </div>
        `;
    }
    
    bindCommentSubmit() {
        // 评论表单提交已在HTML中绑定
    }
    
    submitComment() {
        if (!authSystem || !authSystem.isLoggedIn()) {
            if (confirm('请先登录后再发表评论，是否现在登录？')) {
                authSystem.showLoginModal();
            }
            return;
        }
        
        const commentContent = document.getElementById('comment-content');
        const content = commentContent.value.trim();
        
        if (!content) {
            alert('请输入评论内容');
            return;
        }
        
        const currentUser = authSystem.getCurrentUser();
        const newComment = dataAPI.addComment(
            this.currentArticle.id,
            currentUser.name,
            content
        );
        
        // 清空输入框
        commentContent.value = '';
        
        // 重新加载评论
        this.loadComments();
        
        // 显示成功消息
        if (authSystem && authSystem.showNotification) {
            authSystem.showNotification('评论发表成功！', 'success');
        }
        
        // 更新文章评论数
        this.currentArticle.comments++;
    }
    
    showReplyForm(commentId) {
        if (!authSystem || !authSystem.isLoggedIn()) {
            if (confirm('请先登录后再回复，是否现在登录？')) {
                authSystem.showLoginModal();
            }
            return;
        }
        
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
    }
    
    hideReplyForm(commentId) {
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        const textarea = replyForm.querySelector('textarea');
        textarea.value = '';
        replyForm.style.display = 'none';
    }
    
    submitReply(commentId) {
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        const textarea = replyForm.querySelector('textarea');
        const content = textarea.value.trim();
        
        if (!content) {
            alert('请输入回复内容');
            return;
        }
        
        const currentUser = authSystem.getCurrentUser();
        const newReply = dataAPI.addReply(commentId, currentUser.name, content);
        
        // 清空输入框
        textarea.value = '';
        replyForm.style.display = 'none';
        
        // 重新加载评论
        this.loadComments();
        
        // 显示成功消息
        if (authSystem && authSystem.showNotification) {
            authSystem.showNotification('回复发表成功！', 'success');
        }
    }
    
    likeComment(commentId) {
        // 这里可以实现点赞功能
        if (authSystem && authSystem.showNotification) {
            authSystem.showNotification('点赞功能即将推出！', 'info');
        }
    }
    
    showLoading() {
        if (this.articlesGrid) {
            this.articlesGrid.innerHTML = '<div class="loading">加载中...</div>';
        }
    }
    
    hideLoading() {
        // 加载状态会自动被替换
    }
    
    getCategoryName(category) {
        const categoryMap = {
            'devotional': '灵修',
            'sermon': '讲道',
            'testimony': '见证',
            'study': '查经'
        };
        return categoryMap[category] || category;
    }
}

// 全局文章实例
let articleSystem;

// 初始化文章系统
document.addEventListener('DOMContentLoaded', () => {
    articleSystem = new ArticleSystem();
});

// 全局函数供HTML调用
function openArticleModal(articleId) {
    if (articleSystem) {
        articleSystem.openArticleModal(articleId);
    }
}