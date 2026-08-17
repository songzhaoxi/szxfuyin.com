// 兆西福音博客 - 多媒体功能

class MultimediaSystem {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentTab = 'videos';
        this.currentAudio = null;
        this.audioInterval = null;
    }
    
    initializeElements() {
        // 获取DOM元素
        this.mediaTabs = document.querySelectorAll('.media-tab');
        this.videosGrid = document.getElementById('videos-grid');
        this.audiosGrid = document.getElementById('audios-grid');
        this.imagesGrid = document.getElementById('images-grid');
    }
    
    bindEvents() {
        // 媒体标签切换
        this.mediaTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabSwitch(e));
        });
    }
    
    handleTabSwitch(e) {
        const targetType = e.target.dataset.type;
        
        // 更新激活状态
        this.mediaTabs.forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        
        // 更新当前标签
        this.currentTab = targetType;
        
        // 显示对应内容
        this.showMediaContent(targetType);
    }
    
    showMediaContent(type) {
        // 隐藏所有内容
        document.querySelectorAll('.media-grid').forEach(grid => {
            grid.classList.remove('active');
        });
        
        // 显示对应内容
        switch (type) {
            case 'videos':
                this.loadVideos();
                document.getElementById('videos-grid').classList.add('active');
                break;
            case 'audios':
                this.loadAudios();
                document.getElementById('audios-grid').classList.add('active');
                break;
            case 'images':
                this.loadImages();
                document.getElementById('images-grid').classList.add('active');
                break;
        }
    }
    
    loadVideos() {
        if (!this.videosGrid) return;
        
        const videos = dataAPI.getVideos();
        
        this.videosGrid.innerHTML = videos.map(video => `
            <div class="video-card" onclick="multimediaSystem.playVideo(${video.id})">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="video-play-overlay" style="
                        position: absolute; 
                        top: 50%; 
                        left: 50%; 
                        transform: translate(-50%, -50%);
                        width: 64px;
                        height: 64px;
                        background: rgba(59, 130, 246, 0.9);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        transition: all 250ms ease;
                    ">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                <div class="video-info">
                    <h4 class="video-title">${video.title}</h4>
                    <p class="video-description">${video.description}</p>
                    <div class="video-meta">
                        <span>${video.duration}</span>
                        <span>${video.views} 观看</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    playVideo(videoId) {
        const video = dataAPI.getVideos().find(v => v.id === videoId);
        if (!video) return;
        
        // 创建视频播放器
        this.showVideoPlayer(video);
    }
    
    showVideoPlayer(video) {
        // 创建模态框显示视频播放器
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                <div class="video-player-container" style="padding: 24px;">
                    <h3 style="margin-bottom: 20px;">${video.title}</h3>
                    <div class="video-player" style="
                        width: 100%;
                        height: 450px;
                        background: #000;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        margin-bottom: 20px;
                        position: relative;
                    ">
                        <div class="video-placeholder" style="text-align: center;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="margin-bottom: 16px; opacity: 0.7;">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            <p>视频播放器</p>
                            <p style="font-size: 14px; opacity: 0.7;">${video.duration}</p>
                        </div>
                    </div>
                    <div class="video-description">
                        <p>${video.description}</p>
                        <div class="video-tags" style="margin-top: 16px;">
                            ${video.tags.map(tag => `<span class="tag" style="margin-right: 8px;">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });
    }
    
    loadAudios() {
        if (!this.audiosGrid) return;
        
        const audios = dataAPI.getAudios();
        
        this.audiosGrid.innerHTML = audios.map(audio => `
            <div class="audio-player" data-audio-id="${audio.id}">
                <div class="audio-header">
                    <div class="audio-thumbnail" style="background: ${audio.coverColor};">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                    </div>
                    <div class="audio-info">
                        <h4>${audio.title}</h4>
                        <p>${audio.artist} • ${audio.album}</p>
                    </div>
                </div>
                <div class="audio-controls">
                    <button class="audio-play-btn" onclick="multimediaSystem.toggleAudio(${audio.id})" id="audio-btn-${audio.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <div class="audio-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-${audio.id}"></div>
                        </div>
                        <div class="progress-text">
                            <span id="current-time-${audio.id}">0:00</span>
                            <span id="duration-${audio.id}">${audio.duration}</span>
                        </div>
                    </div>
                    <button class="audio-control-btn" onclick="multimediaSystem.stopAudio(${audio.id})" title="停止">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12"/>
                        </svg>
                    </button>
                </div>
                <div class="audio-description" style="margin-top: 16px; color: #525252; font-size: 14px;">
                    ${audio.description}
                </div>
            </div>
        `).join('');
    }
    
    toggleAudio(audioId) {
        const audioData = dataAPI.getAudios().find(a => a.id === audioId);
        if (!audioData) return;
        
        const btn = document.getElementById(`audio-btn-${audioId}`);
        
        // 如果正在播放当前音频，暂停
        if (this.currentAudio === audioId) {
            this.pauseAudio();
            return;
        }
        
        // 暂停当前播放的音频
        if (this.currentAudio !== null) {
            this.stopAudio(this.currentAudio);
        }
        
        // 开始播放新音频
        this.currentAudio = audioId;
        this.updateAudioUI(audioId, true);
        this.startAudioProgress(audioId, audioData.duration);
        
        // 显示播放通知
        if (authSystem && authSystem.showNotification) {
            authSystem.showNotification(`正在播放：${audioData.title}`, 'info');
        }
    }
    
    pauseAudio() {
        if (this.currentAudio === null) return;
        
        this.updateAudioUI(this.currentAudio, false);
        this.stopAudioProgress();
        
        if (authSystem && authSystem.showNotification) {
            authSystem.showNotification('已暂停播放', 'info');
        }
    }
    
    stopAudio(audioId) {
        if (audioId === this.currentAudio) {
            this.currentAudio = null;
        }
        
        this.updateAudioUI(audioId, false);
        this.resetAudioProgress(audioId);
        this.stopAudioProgress();
    }
    
    updateAudioUI(audioId, isPlaying) {
        const btn = document.getElementById(`audio-btn-${audioId}`);
        if (!btn) return;
        
        if (isPlaying) {
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                </svg>
            `;
            btn.style.background = '#EF4444';
        } else {
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
            btn.style.background = '#3B82F6';
        }
    }
    
    startAudioProgress(audioId, duration) {
        this.stopAudioProgress(); // 清除之前的定时器
        
        // 解析持续时间
        const durationSeconds = this.parseDuration(duration);
        let currentTime = 0;
        
        this.audioInterval = setInterval(() => {
            currentTime += 1;
            const progress = (currentTime / durationSeconds) * 100;
            
            // 更新进度条
            const progressFill = document.getElementById(`progress-${audioId}`);
            if (progressFill) {
                progressFill.style.width = `${Math.min(progress, 100)}%`;
            }
            
            // 更新当前时间
            const currentTimeEl = document.getElementById(`current-time-${audioId}`);
            if (currentTimeEl) {
                currentTimeEl.textContent = this.formatTime(currentTime);
            }
            
            // 播放完成
            if (currentTime >= durationSeconds) {
                this.stopAudio(audioId);
            }
        }, 1000);
    }
    
    stopAudioProgress() {
        if (this.audioInterval) {
            clearInterval(this.audioInterval);
            this.audioInterval = null;
        }
    }
    
    resetAudioProgress(audioId) {
        const progressFill = document.getElementById(`progress-${audioId}`);
        const currentTimeEl = document.getElementById(`current-time-${audioId}`);
        
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        
        if (currentTimeEl) {
            currentTimeEl.textContent = '0:00';
        }
    }
    
    parseDuration(duration) {
        const parts = duration.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    loadImages() {
        if (!this.imagesGrid) return;
        
        const images = dataAPI.getImages();
        
        this.imagesGrid.innerHTML = `
            <div class="image-gallery">
                ${images.map(image => `
                    <div class="image-item" onclick="multimediaSystem.showImageModal(${image.id})">
                        <img src="${image.src}" alt="${image.title}">
                        <div class="image-overlay">
                            <div class="image-title">${image.title}</div>
                            <div class="image-description">${image.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    showImageModal(imageId) {
        const image = dataAPI.getImages().find(img => img.id === imageId);
        if (!image) return;
        
        // 创建图片查看器
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                <div style="padding: 24px; text-align: center;">
                    <img src="${image.src}" alt="${image.title}" style="
                        max-width: 100%; 
                        max-height: 70vh; 
                        object-fit: contain;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    ">
                    <h3 style="margin-bottom: 8px;">${image.title}</h3>
                    <p style="color: #525252; margin-bottom: 16px;">${image.description}</p>
                    <div class="image-tags">
                        ${image.tags.map(tag => `<span class="tag" style="margin-right: 8px;">${tag}</span>`).join('')}
                    </div>
                    <div style="margin-top: 16px; font-size: 14px; color: #525252;">
                        上传时间：${image.uploadDate}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });
        
        // 键盘事件
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }
    
    // 初始化方法
    init() {
        // 加载默认内容
        this.loadVideos();
    }
}

// 全局多媒体实例
let multimediaSystem;

// 初始化多媒体系统
document.addEventListener('DOMContentLoaded', () => {
    multimediaSystem = new MultimediaSystem();
    multimediaSystem.init();
});