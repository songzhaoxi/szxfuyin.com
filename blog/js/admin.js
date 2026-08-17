// 兆西福音博客 - 管理员功能
// 处理模版管理、文件上传、链接管理和删除功能

// 管理员功能初始化
function initAdmin() {
    setupTemplateManagement();
    setupUploadManagement();
    setupLinkManagement();
    setupDeleteFunctions();
}

// 模版管理
function setupTemplateManagement() {
    // 模版模态框
    const templateModal = document.getElementById('template-modal');
    const templateBtn = document.getElementById('add-template-btn');
    const templateForm = document.getElementById('template-form');
    const templateClose = document.getElementById('template-close');

    // 打开模版模态框
    if (templateBtn) {
        templateBtn.addEventListener('click', () => {
            templateModal.style.display = 'block';
            document.getElementById('template-name').value = '';
            document.getElementById('template-category').value = 'devotional';
            document.getElementById('template-description').value = '';
            document.getElementById('template-content').value = '';
        });
    }

    // 关闭模版模态框
    if (templateClose) {
        templateClose.addEventListener('click', () => {
            templateModal.style.display = 'none';
        });
    }

    // 点击模态框外部关闭
    if (templateModal) {
        templateModal.addEventListener('click', (e) => {
            if (e.target === templateModal) {
                templateModal.style.display = 'none';
            }
        });
    }

    // 提交模版表单
    if (templateForm) {
        templateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleTemplateSubmit();
        });
    }
}

// 处理模版提交
function handleTemplateSubmit() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    const name = document.getElementById('template-name').value;
    const category = document.getElementById('template-category').value;
    const description = document.getElementById('template-description').value;
    const content = document.getElementById('template-content').value;

    if (!name || !content) {
        alert('请填写模版名称和内容！');
        return;
    }

    const newTemplate = dataAPI.addTemplate(name, category, content, description, currentUser.id);
    if (newTemplate) {
        alert('模版创建成功！');
        document.getElementById('template-modal').style.display = 'none';
        renderTemplates();
    }
}

// 渲染模版列表
function renderTemplates() {
    const templateList = document.getElementById('template-list');
    if (!templateList) return;

    const templates = dataAPI.getTemplates();
    
    templateList.innerHTML = templates.map(template => `
        <div class="template-item">
            <div class="template-header">
                <h4>${template.name}</h4>
                <span class="template-category">${getCategoryName(template.category)}</span>
            </div>
            <p class="template-description">${template.description}</p>
            <div class="template-actions">
                <button class="btn btn-sm btn-primary" onclick="useTemplate(${template.id})">使用模版</button>
                ${getCurrentUser() && (template.authorId === getCurrentUser().id || dataAPI.isAdmin(getCurrentUser().id)) ? 
                    `<button class="btn btn-sm btn-danger" onclick="deleteTemplate(${template.id})">删除</button>` : ''}
            </div>
        </div>
    `).join('');
}

// 使用模版
function useTemplate(templateId) {
    const template = dataAPI.getTemplates().find(t => t.id === templateId);
    if (template) {
        // 复制模版内容到编辑器
        document.getElementById('article-title').value = '';
        document.getElementById('article-category').value = template.category;
        document.getElementById('article-excerpt').value = '';
        document.getElementById('article-tags').value = template.tags ? template.tags.join(',') : '';
        document.getElementById('article-content').value = template.content;
        
        alert('模版内容已加载到编辑器！');
    }
}

// 删除模版
function deleteTemplate(id) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    if (confirm('确定要删除这个模版吗？')) {
        const success = dataAPI.deleteTemplate(id, currentUser.id);
        if (success) {
            alert('模版已删除！');
            renderTemplates();
        } else {
            alert('删除失败！');
        }
    }
}

// 文件上传管理
function setupUploadManagement() {
    // 上传模态框
    const uploadModal = document.getElementById('upload-modal');
    const uploadBtn = document.getElementById('add-upload-btn');
    const uploadForm = document.getElementById('upload-form');
    const uploadClose = document.getElementById('upload-close');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            uploadModal.style.display = 'block';
            document.getElementById('upload-name').value = '';
            document.getElementById('upload-type').value = 'image';
            document.getElementById('upload-category').value = 'general';
            document.getElementById('upload-description').value = '';
        });
    }

    if (uploadClose) {
        uploadClose.addEventListener('click', () => {
            uploadModal.style.display = 'none';
        });
    }

    if (uploadModal) {
        uploadModal.addEventListener('click', (e) => {
            if (e.target === uploadModal) {
                uploadModal.style.display = 'none';
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleUploadSubmit();
        });
    }

    // 文件选择处理
    const fileInput = document.getElementById('upload-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// 处理文件选择
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 自动填充文件名
    const nameInput = document.getElementById('upload-name');
    if (nameInput && !nameInput.value) {
        nameInput.value = file.name;
    }

    // 自动设置文件类型
    const typeSelect = document.getElementById('upload-type');
    if (typeSelect) {
        if (file.type.startsWith('image/')) {
            typeSelect.value = 'image';
        } else if (file.type.startsWith('video/')) {
            typeSelect.value = 'video';
        } else if (file.type.startsWith('audio/')) {
            typeSelect.value = 'audio';
        }
    }
}

// 处理上传提交
function handleUploadSubmit() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    const fileInput = document.getElementById('upload-file');
    const name = document.getElementById('upload-name').value;
    const type = document.getElementById('upload-type').value;
    const category = document.getElementById('upload-category').value;
    const description = document.getElementById('upload-description').value;

    if (!fileInput.files[0] || !name) {
        alert('请选择文件并填写文件名称！');
        return;
    }

    const file = fileInput.files[0];
    const url = URL.createObjectURL(file); // 模拟文件URL
    const size = formatFileSize(file.size);

    const newUpload = dataAPI.addUpload(name, type, url, size, category, description, currentUser.id);
    if (newUpload) {
        alert('文件上传成功！');
        document.getElementById('upload-modal').style.display = 'none';
        renderUploads();
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 渲染上传文件列表
function renderUploads() {
    const uploadList = document.getElementById('upload-list');
    if (!uploadList) return;

    const uploads = dataAPI.getUploads();
    
    uploadList.innerHTML = uploads.map(upload => `
        <div class="upload-item">
            <div class="upload-preview">
                ${upload.type === 'image' ? 
                    `<img src="${upload.url}" alt="${upload.name}" onerror="this.style.display='none'">` :
                    `<div class="upload-icon">${upload.type === 'video' ? '🎥' : upload.type === 'audio' ? '🎵' : '📄'}</div>`
                }
            </div>
            <div class="upload-info">
                <h4>${upload.name}</h4>
                <p>${upload.description}</p>
                <span class="upload-meta">${upload.size} | ${upload.category} | ${upload.uploadDate}</span>
            </div>
            <div class="upload-actions">
                <button class="btn btn-sm btn-primary" onclick="previewUpload(${upload.id})">预览</button>
                ${getCurrentUser() && (upload.uploadedBy === getCurrentUser().id || dataAPI.isAdmin(getCurrentUser().id)) ? 
                    `<button class="btn btn-sm btn-danger" onclick="deleteUpload(${upload.id})">删除</button>` : ''}
            </div>
        </div>
    `).join('');
}

// 预览上传文件
function previewUpload(id) {
    const upload = dataAPI.getUploads().find(u => u.id === id);
    if (upload) {
        if (upload.type === 'image') {
            // 图片预览
            const modal = document.createElement('div');
            modal.className = 'preview-modal';
            modal.innerHTML = `
                <div class="preview-content">
                    <img src="${upload.url}" alt="${upload.name}">
                    <p>${upload.name}</p>
                    <button onclick="this.parentElement.parentElement.remove()">关闭</button>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            alert(`文件类型：${upload.type}\n大小：${upload.size}\n描述：${upload.description}`);
        }
    }
}

// 删除上传文件
function deleteUpload(id) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    if (confirm('确定要删除这个文件吗？')) {
        const success = dataAPI.deleteUpload(id, currentUser.id);
        if (success) {
            alert('文件已删除！');
            renderUploads();
        } else {
            alert('删除失败！');
        }
    }
}

// 链接管理
function setupLinkManagement() {
    const linkModal = document.getElementById('link-modal');
    const linkBtn = document.getElementById('add-link-btn');
    const linkForm = document.getElementById('link-form');
    const linkClose = document.getElementById('link-close');

    if (linkBtn) {
        linkBtn.addEventListener('click', () => {
            linkModal.style.display = 'block';
            document.getElementById('link-title').value = '';
            document.getElementById('link-url').value = '';
            document.getElementById('link-category').value = 'resources';
            document.getElementById('link-description').value = '';
            document.getElementById('link-tags').value = '';
        });
    }

    if (linkClose) {
        linkClose.addEventListener('click', () => {
            linkModal.style.display = 'none';
        });
    }

    if (linkModal) {
        linkModal.addEventListener('click', (e) => {
            if (e.target === linkModal) {
                linkModal.style.display = 'none';
            }
        });
    }

    if (linkForm) {
        linkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLinkSubmit();
        });
    }
}

// 处理链接提交
function handleLinkSubmit() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    const title = document.getElementById('link-title').value;
    const url = document.getElementById('link-url').value;
    const category = document.getElementById('link-category').value;
    const description = document.getElementById('link-description').value;
    const tags = document.getElementById('link-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);

    if (!title || !url) {
        alert('请填写链接标题和URL！');
        return;
    }

    // 验证URL格式
    try {
        new URL(url);
    } catch {
        alert('请输入有效的URL！');
        return;
    }

    const newLink = dataAPI.addLink(title, url, description, category, tags, currentUser.id);
    if (newLink) {
        alert('链接添加成功！');
        document.getElementById('link-modal').style.display = 'none';
        renderLinks();
    }
}

// 渲染链接列表
function renderLinks() {
    const linkList = document.getElementById('link-list');
    if (!linkList) return;

    const links = dataAPI.getLinks();
    
    linkList.innerHTML = links.map(link => `
        <div class="link-item">
            <div class="link-info">
                <h4><a href="${link.url}" target="_blank">${link.title}</a></h4>
                <p>${link.description}</p>
                <div class="link-tags">
                    ${link.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <span class="link-meta">${link.category} | ${link.addedDate}</span>
            </div>
            <div class="link-actions">
                <button class="btn btn-sm btn-primary" onclick="window.open('${link.url}', '_blank')">访问</button>
                ${getCurrentUser() && (link.addedBy === getCurrentUser().id || dataAPI.isAdmin(getCurrentUser().id)) ? 
                    `<button class="btn btn-sm btn-danger" onclick="deleteLink(${link.id})">删除</button>` : ''}
            </div>
        </div>
    `).join('');
}

// 删除链接
function deleteLink(id) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    if (confirm('确定要删除这个链接吗？')) {
        const success = dataAPI.deleteLink(id, currentUser.id);
        if (success) {
            alert('链接已删除！');
            renderLinks();
        } else {
            alert('删除失败！');
        }
    }
}

// 删除功能设置
function setupDeleteFunctions() {
    // 在文章列表中添加删除按钮
    const articleContainer = document.querySelector('.article-list');
    if (articleContainer) {
        // 添加删除按钮到文章卡片
        setupArticleDeleteButtons();
    }

    // 在评论区域添加删除按钮
    setupCommentDeleteButtons();
}

// 设置文章删除按钮
function setupArticleDeleteButtons() {
    // 监听文章列表更新
    const observer = new MutationObserver(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        document.querySelectorAll('.article-card').forEach(card => {
            const articleId = parseInt(card.dataset.articleId);
            const article = dataAPI.getArticle(articleId);
            
            if (article && (article.authorId === currentUser.id || dataAPI.isAdmin(currentUser.id))) {
                // 检查是否已有删除按钮
                if (!card.querySelector('.delete-article-btn')) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-sm btn-danger delete-article-btn';
                    deleteBtn.innerHTML = '删除';
                    deleteBtn.onclick = () => deleteArticle(articleId);
                    
                    // 添加到文章卡片
                    const actionContainer = card.querySelector('.article-actions') || createActionContainer(card);
                    actionContainer.appendChild(deleteBtn);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// 创建操作容器
function createActionContainer(card) {
    const container = document.createElement('div');
    container.className = 'article-actions';
    card.appendChild(container);
    return container;
}

// 删除文章
function deleteArticle(id) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    if (confirm('确定要删除这篇文章吗？此操作不可撤销！')) {
        const success = dataAPI.deleteArticle(id, currentUser.id);
        if (success) {
            alert('文章已删除！');
            // 重新渲染文章列表
            if (window.renderArticles) {
                window.renderArticles();
            }
        } else {
            alert('删除失败！');
        }
    }
}

// 设置评论删除按钮
function setupCommentDeleteButtons() {
    // 监听评论区域更新
    const observer = new MutationObserver(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || !dataAPI.isAdmin(currentUser.id)) return;

        document.querySelectorAll('.comment-item').forEach(comment => {
            const commentId = parseInt(comment.dataset.commentId);
            
            // 检查是否已有删除按钮
            if (!comment.querySelector('.delete-comment-btn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-danger delete-comment-btn';
                deleteBtn.innerHTML = '删除';
                deleteBtn.onclick = () => deleteComment(commentId);
                
                // 添加到评论操作区域
                const actions = comment.querySelector('.comment-actions');
                if (actions) {
                    actions.appendChild(deleteBtn);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// 删除评论
function deleteComment(id) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    if (!dataAPI.isAdmin(currentUser.id)) {
        alert('只有管理员可以删除评论！');
        return;
    }

    if (confirm('确定要删除这条评论吗？')) {
        const success = dataAPI.deleteComment(id, currentUser.id);
        if (success) {
            alert('评论已删除！');
            // 重新渲染评论
            if (window.renderComments) {
                const articleId = document.querySelector('.article-detail-modal')?.dataset.articleId;
                if (articleId) {
                    window.renderComments(parseInt(articleId));
                }
            }
        } else {
            alert('删除失败！');
        }
    }
}

// 辅助函数
function getCategoryName(category) {
    const categories = {
        'devotional': '灵修',
        'sermon': '讲道',
        'testimony': '见证',
        'bible-study': '查经',
        'prayer': '祷告',
        'worship': '赞美',
        'event': '活动',
        'general': '一般',
        'resources': '资源',
        'bible': '圣经'
    };
    return categories[category] || category;
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

// 导出函数供其他文件使用
window.initAdmin = initAdmin;
window.renderTemplates = renderTemplates;
window.renderUploads = renderUploads;
window.renderLinks = renderLinks;
window.deleteArticle = deleteArticle;
window.deleteComment = deleteComment;
window.deleteTemplate = deleteTemplate;
window.deleteUpload = deleteUpload;
window.deleteLink = deleteLink;
window.useTemplate = useTemplate;
window.previewUpload = previewUpload;