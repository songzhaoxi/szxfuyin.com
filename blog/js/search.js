// 兆西福音博客 - 搜索功能

class SearchSystem {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.searchResults = [];
        this.currentPage = 1;
        this.itemsPerPage = 6;
    }
    
    initializeElements() {
        // 获取DOM元素
        this.searchToggle = document.getElementById('search-toggle');
        this.searchContainer = document.getElementById('search-container');
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.searchResults = document.getElementById('search-results');
        this.searchResultsSection = document.getElementById('search-results-section');
        this.resultsGrid = document.getElementById('results-grid');
        this.searchPagination = document.getElementById('search-pagination');
    }
    
    bindEvents() {
        // 搜索切换
        if (this.searchToggle) {
            this.searchToggle.addEventListener('click', () => this.toggleSearchContainer());
        }
        
        // 搜索按钮
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        // 搜索输入框
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                } else if (e.key === 'Escape') {
                    this.hideSearchContainer();
                }
            });
        }
        
        // 点击页面其他地方关闭搜索
        document.addEventListener('click', (e) => {
            if (!this.searchContainer.contains(e.target) && !this.searchToggle.contains(e.target)) {
                this.hideSearchContainer();
            }
        });
    }
    
    toggleSearchContainer() {
        if (this.searchContainer.classList.contains('active')) {
            this.hideSearchContainer();
        } else {
            this.showSearchContainer();
        }
    }
    
    showSearchContainer() {
        this.searchContainer.classList.add('active');
        this.searchInput.focus();
    }
    
    hideSearchContainer() {
        this.searchContainer.classList.remove('active');
    }
    
    handleSearchInput(e) {
        const query = e.target.value.trim();
        
        // 如果输入为空，隐藏搜索结果
        if (query === '') {
            this.clearSearchResults();
            return;
        }
        
        // 实时搜索（防抖）
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performRealTimeSearch(query);
        }, 300);
    }
    
    performRealTimeSearch(query) {
        if (query.length < 2) {
            this.clearSearchResults();
            return;
        }
        
        // 执行搜索
        this.searchArticles(query, true);
    }
    
    performSearch() {
        const query = this.searchInput.value.trim();
        
        if (query === '') {
            return;
        }
        
        // 执行完整搜索
        this.searchArticles(query);
    }
    
    searchArticles(query, isRealTime = false) {
        // 显示加载状态
        this.showSearchLoading();
        
        // 模拟搜索延迟
        setTimeout(() => {
            const results = dataAPI.searchArticles(query);
            this.searchResults = results;
            this.currentPage = 1;
            
            if (isRealTime) {
                this.displaySearchResults(results.slice(0, 5)); // 只显示前5个结果
            } else {
                this.showFullSearchResults();
            }
            
            this.hideSearchLoading();
        }, 500);
    }
    
    showSearchLoading() {
        if (this.searchResults) {
            this.searchResults.innerHTML = '<div class="loading">搜索中...</div>';
        }
    }
    
    hideSearchLoading() {
        // 加载状态会自动被替换
    }
    
    clearSearchResults() {
        if (this.searchResults) {
            this.searchResults.innerHTML = '';
        }
    }
    
    displaySearchResults(results) {
        this.clearSearchResults();
        
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="empty-state">
                    <p>没有找到相关结果</p>
                </div>
            `;
            return;
        }
        
        const resultsHTML = results.map(article => `
            <div class="search-result-item" onclick="openArticleModal(${article.id})">
                <h4 class="search-result-title">${this.highlightSearchTerm(article.title)}</h4>
                <p class="search-result-excerpt">${this.highlightSearchTerm(this.truncateText(article.excerpt, 100))}</p>
                <div class="search-result-meta">
                    <span class="article-category">${this.getCategoryName(article.category)}</span>
                    <span>${article.author}</span>
                    <span>${article.date}</span>
                    <span>阅读 ${article.readTime}</span>
                </div>
            </div>
        `).join('');
        
        this.searchResults.innerHTML = resultsHTML;
    }
    
    showFullSearchResults() {
        // 隐藏搜索容器
        this.hideSearchContainer();
        
        // 显示搜索结果区域
        this.searchResultsSection.style.display = 'block';
        
        // 滚动到结果区域
        this.searchResultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // 更新页面标题
        document.title = `搜索结果 - ${this.searchInput.value} - 兆西福音博客`;
        
        // 显示搜索结果
        this.displayFullSearchResults();
    }
    
    displayFullSearchResults() {
        const totalItems = this.searchResults.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageResults = this.searchResults.slice(start, end);
        
        // 显示结果数量
        const resultsCount = document.createElement('div');
        resultsCount.className = 'search-results-count';
        resultsCount.innerHTML = `
            <p style="text-align: center; color: #525252; margin-bottom: 24px;">
                找到 ${totalItems} 个相关结果，第 ${this.currentPage} 页，共 ${totalPages} 页
            </p>
        `;
        
        // 显示结果网格
        if (pageResults.length === 0) {
            this.resultsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>没有找到相关结果</h3>
                    <p>请尝试使用其他关键词搜索</p>
                    <button class="btn btn-primary" onclick="searchSystem.clearSearch()">清除搜索</button>
                </div>
            `;
        } else {
            this.resultsGrid.innerHTML = pageResults.map(article => `
                <div class="article-card" onclick="openArticleModal(${article.id})">
                    <div class="article-meta">
                        <span class="article-category">${this.getCategoryName(article.category)}</span>
                        <span>${article.date}</span>
                        <span>阅读 ${article.readTime}</span>
                    </div>
                    <h3 class="article-title">${this.highlightSearchTerm(article.title)}</h3>
                    <p class="article-excerpt">${this.highlightSearchTerm(this.truncateText(article.excerpt, 150))}</p>
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
        
        // 显示分页
        this.displayPagination(totalPages);
    }
    
    displayPagination(totalPages) {
        this.searchPagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // 上一页
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '上一页';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        pagination.appendChild(prevBtn);
        
        // 页码按钮
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => this.goToPage(i));
            pagination.appendChild(pageBtn);
        }
        
        // 下一页
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = '下一页';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        pagination.appendChild(nextBtn);
        
        this.searchPagination.appendChild(pagination);
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.displayFullSearchResults();
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.searchResults = [];
        this.searchResultsSection.style.display = 'none';
        document.title = '兆西福音博客 - 传递福音，启发生命';
        
        // 清空搜索区域
        this.resultsGrid.innerHTML = '';
        this.searchPagination.innerHTML = '';
    }
    
    highlightSearchTerm(text) {
        const searchTerm = this.searchInput.value.trim();
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark style="background: #FEF3C7; padding: 2px 4px; border-radius: 3px;">$1</mark>');
    }
    
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
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
    
    // 公开方法用于外部调用
    search(query) {
        this.searchInput.value = query;
        this.performSearch();
    }
    
    isSearchActive() {
        return this.searchContainer.classList.contains('active');
    }
}

// 全局搜索实例
let searchSystem;

// 初始化搜索系统
document.addEventListener('DOMContentLoaded', () => {
    searchSystem = new SearchSystem();
});

// 全局函数供HTML调用
function openSearchResults() {
    if (searchSystem) {
        const query = searchSystem.searchInput.value.trim();
        if (query) {
            searchSystem.performSearch();
        }
    }
}