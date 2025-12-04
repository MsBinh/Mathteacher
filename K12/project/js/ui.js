// js/ui.js - KHÔNG DÙNG IMPORT/EXPORT
window.UIManager = class {
    constructor() {
        this.currentUser = null;
        this.isTeacherLoggedIn = false;
        this.sessionCode = '';
        this.activeModal = null;
        this.isDarkMode = false;
    }

    initialize() {
        this.setupEventListeners();
        this.setupRevealJS();
        this.setupModals();
        this.checkAuthentication();
        window.hideLoading();
    }

    setupEventListeners() {
        // Authentication
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.addEventListener('click', () => this.showLoginModal());
        
        // Navigation
        const slideMenuBtn = document.getElementById('slideMenuBtn');
        if (slideMenuBtn) slideMenuBtn.addEventListener('click', () => this.toggleSlideMenu());
        
        const selectExam = document.getElementById('selectExam');
        if (selectExam) selectExam.addEventListener('change', (e) => this.handleExamChange(e));
        
        // Teacher controls
        const teacherMonitorBtn = document.getElementById('teacherMonitorBtn');
        if (teacherMonitorBtn) teacherMonitorBtn.addEventListener('click', () => this.showTeacherMonitor());
        
        const classManagementBtn = document.getElementById('classManagementBtn');
        if (classManagementBtn) classManagementBtn.addEventListener('click', () => this.showClassManagement());
        
        // Student controls
        const studentInteractBtn = document.getElementById('studentInteractBtn');
        if (studentInteractBtn) studentInteractBtn.addEventListener('click', () => this.showStudentInteraction());
        
        const scoreBtn = document.getElementById('scoreBtn');
        if (scoreBtn) scoreBtn.addEventListener('click', () => this.calculateScore());
        
        // UI controls
        const toggleStyleBtn = document.getElementById('toggleStyleBtn');
        if (toggleStyleBtn) toggleStyleBtn.addEventListener('click', () => this.toggleDarkMode());
        
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // Trong hàm setupRevealJS, sửa phần event listeners
setupRevealJS() {
    // Kiểm tra xem Reveal đã được khởi tạo chưa
    if (typeof Reveal === 'undefined') {
        console.warn('Reveal.js not loaded yet');
        return false;
    }

    // Nếu Reveal đã ready, không làm gì cả
    if (Reveal.isReady && Reveal.isReady()) {
        console.log('✅ Reveal.js is already ready');
        return true;
    }

    try {
        // SỬA LỖI: Sử dụng arrow function hoặc bind để giữ context
        Reveal.addEventListener('ready', (event) => {
            console.log('🎉 Reveal.js is ready - Setting up slide menu');
            this.setupSlideMenu();
        });

        Reveal.addEventListener('slidechanged', (event) => {
            this.handleSlideChange(event);
        });

        console.log('✅ Reveal.js event listeners added');
        return true;
        
    } catch (error) {
        console.error('❌ Error setting up Reveal.js:', error);
        return false;
    }
},

// THÊM HÀM setupSlideMenu nếu chưa có
setupSlideMenu: function() {
    console.log('📋 Setting up slide menu...');
    const slideMenu = document.getElementById('slideMenu');
    if (!slideMenu) {
        console.warn('Slide menu element not found');
        return;
    }
    
    // Tạo danh sách slide
    this.createSlideList();
    console.log('✅ Slide menu setup completed');
},
    setupModals() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('menu-overlay')) {
                this.hideModal(e.target);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.hideModal(this.activeModal);
            }
        });
    }

    async showLoginModal() {
        const modalHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="uiManager.hideModal(this.closest('.modal'))">×</button>
                <h3>🔐 Đăng nhập hệ thống</h3>
                <form id="login-form">
                    <div class="form-group">
                        <label>Mã đăng nhập:</label>
                        <input id="login-code" placeholder="Nhập mã học sinh/giáo viên" required type="text"/>
                    </div>
                    <div class="form-group">
                        <label>Họ tên:</label>
                        <input id="user-name" placeholder="Nhập họ tên của bạn" type="text"/>
                    </div>
                    <div class="form-actions">
                        <button type="submit">🚀 Đăng nhập</button>
                    </div>
                </form>
                <div class="login-help">
                    <p><strong>Hướng dẫn:</strong></p>
                    <p>• Giáo viên: Nhập mã admin79</p>
                    <p>• Học sinh: Nhập mã được cấp</p>
                </div>
            </div>
        `;

        this.showModal('login-modal', modalHTML);

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    async handleLogin() {
        const code = document.getElementById('login-code').value.trim();
        const name = document.getElementById('user-name').value.trim() || 'Người dùng';

        try {
            if (code === 'admin79') {
                this.currentUser = await window.firebaseService.loginAsTeacher(name);
                this.isTeacherLoggedIn = true;
                window.showNotification(`✅ Đăng nhập thành công - GV: ${name}`, 'success');
            } else if (code.startsWith('HS')) {
                this.currentUser = await window.firebaseService.loginAsStudent(code, name);
                this.isTeacherLoggedIn = false;
                window.showNotification(`✅ Đăng nhập thành công - HS: ${name}`, 'success');
            } else {
                throw new Error('Mã đăng nhập không hợp lệ');
            }

            this.updateUIAfterLogin();
            this.hideModal(document.getElementById('login-modal'));
        } catch (error) {
            window.showNotification(`❌ ${error.message}`, 'error');
        }
    }

    updateUIAfterLogin() {
        const loginBtn = document.getElementById('loginBtn');
        if (!loginBtn) return;
        
        if (this.isTeacherLoggedIn) {
            loginBtn.innerHTML = `👨‍🏫 ${this.currentUser.name}`;
            loginBtn.style.background = '#28a745';
            
            const teacherMonitorBtn = document.getElementById('teacherMonitorBtn');
            if (teacherMonitorBtn) teacherMonitorBtn.style.display = 'inline-block';
            
            const classManagementBtn = document.getElementById('classManagementBtn');
            if (classManagementBtn) classManagementBtn.style.display = 'inline-block';
        } else {
            loginBtn.innerHTML = `👤 ${this.currentUser.name}`;
            
            const studentInteractBtn = document.getElementById('studentInteractBtn');
            if (studentInteractBtn) studentInteractBtn.style.display = 'inline-block';
            
            this.promptSessionCode();
        }
    }

    async promptSessionCode() {
        const sessionCode = prompt("Nhập mã lớp học để tham gia:");
        if (sessionCode) {
            this.sessionCode = sessionCode.toUpperCase();
            await this.joinSession();
        }
    }

    async joinSession() {
        try {
            await window.firebaseService.joinSession(this.sessionCode, this.currentUser);
            window.showNotification(`✅ Đã tham gia lớp học: ${this.sessionCode}`, 'success');
            this.listenToSessionChanges();
        } catch (error) {
            window.showNotification('❌ Lỗi tham gia lớp học!', 'error');
        }
    }

    listenToSessionChanges() {
        window.firebaseService.on(`sessions/${this.sessionCode}/currentSlide`, (slideIndex) => {
            if (slideIndex !== null && slideIndex !== undefined && Reveal) {
                Reveal.slide(slideIndex);
            }
        });

        window.firebaseService.on(`sessions/${this.sessionCode}/poll`, (pollData) => {
            if (pollData && pollData.active) {
                this.showPoll(pollData);
            } else {
                this.hidePoll();
            }
        });
    }

    toggleSlideMenu() {
        const slideMenu = document.getElementById('slideMenu');
        const overlay = document.getElementById('menuOverlay');
        
        if (slideMenu && overlay) {
            slideMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            
            if (slideMenu.classList.contains('active')) {
                this.createSlideList();
            }
        }
    }

    createSlideList() {
        const slideList = document.getElementById('slideList');
        const slides = document.querySelectorAll('.reveal .slides section');
        
        if (!slideList) return;

        slideList.innerHTML = Array.from(slides).map((slide, index) => {
            const title = slide.querySelector('h2')?.textContent.substring(0, 30) || `Slide ${index + 1}`;
            return `
                <div class="slide-item" data-slide-index="${index}">
                    <span class="slide-number">${index + 1}</span>${title}
                </div>
            `;
        }).join('');

        slideList.querySelectorAll('.slide-item').forEach(item => {
            item.addEventListener('click', () => {
                if (Reveal) {
                    Reveal.slide(parseInt(item.dataset.slideIndex));
                }
                this.toggleSlideMenu();
            });
        });
    }

    handleSlideChange(event) {
        this.updateActiveSlideInMenu();
        this.updateGlobalProgress();
        
        if (!this.isTeacherLoggedIn && this.sessionCode) {
            this.updateStudentProgress(Reveal.getIndices().h);
        }
    }

    updateActiveSlideInMenu() {
        if (!Reveal) return;
        
        const currentIndex = Reveal.getIndices().h;
        document.querySelectorAll('.slide-item').forEach((item, index) => {
            item.classList.toggle('active', index === currentIndex);
        });
    }

    updateGlobalProgress() {
        // Implementation for progress bar
    }

    async updateStudentProgress(slideIndex) {
        if (!this.sessionCode || !this.currentUser) return;
        
        const totalSlides = document.querySelectorAll('.reveal .slides section').length;
        const progress = Math.round((slideIndex / (totalSlides - 1)) * 100);
        
        try {
            await window.firebaseService.update(`sessions/${this.sessionCode}/students/${this.currentUser.uid}`, {
                currentSlide: slideIndex,
                progress: progress,
                lastActivity: window.firebaseService.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating student progress:', error);
        }
    }

    showTeacherMonitor() {
        if (!this.isTeacherLoggedIn) {
            window.showNotification('Chỉ giáo viên mới có quyền truy cập!', 'error');
            return;
        }

        window.showNotification('Chức năng Teacher Monitor đang được phát triển', 'info');
    }

    showClassManagement() {
        if (!this.isTeacherLoggedIn) {
            window.showNotification('Chỉ giáo viên mới có quyền quản lý lớp!', 'error');
            return;
        }

        window.showNotification('Chức năng Quản lý Lớp đang được phát triển', 'info');
    }

    showStudentInteraction() {
        if (!this.currentUser || !this.sessionCode) {
            window.showNotification('Vui lòng đăng nhập và vào lớp!', 'error');
            return;
        }

        const choice = prompt(`Chọn tương tác:\n1-✋ Giơ tay\n2-❓ Đặt câu hỏi\n3-🆘 Cần hỗ trợ`);
        
        if (choice === '1') {
            this.sendInteraction('hand_raised');
        } else if (choice === '2') {
            const question = prompt('Nhập câu hỏi của bạn:');
            if (question) this.sendInteraction('question', question);
        } else if (choice === '3') {
            this.sendInteraction('need_help');
        }
    }

    async sendInteraction(type, content = '') {
        const interactionData = {
            student: this.currentUser.name,
            type: type,
            timestamp: window.firebaseService.serverTimestamp()
        };
        
        if (content) interactionData.content = content;

        try {
            await window.firebaseService.push(`sessions/${this.sessionCode}/interactions`, interactionData);
            window.showNotification('✅ Đã gửi tương tác!', 'success');
        } catch (error) {
            window.showNotification('❌ Lỗi gửi tương tác!', 'error');
        }
    }

    showPoll(pollData) {
        const pollHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="uiManager.hidePoll()">×</button>
                <h3>🗳️ ${pollData.question}</h3>
                <div id="poll-options">
                    ${pollData.options.map((option, index) => `
                        <div class="poll-option" data-index="${index}">
                            ${String.fromCharCode(65 + index)}. ${option}
                        </div>
                    `).join('')}
                </div>
                <div class="poll-actions">
                    <button onclick="uiManager.submitPollResponse()">✅ Gửi phản hồi</button>
                </div>
            </div>
        `;

        this.showModal('poll-modal', pollHTML);

        document.querySelectorAll('.poll-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.poll-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }

    hidePoll() {
        this.hideModal(document.getElementById('poll-modal'));
    }

    async submitPollResponse() {
        const selectedOption = document.querySelector('.poll-option.selected');
        if (!selectedOption) {
            window.showNotification('Vui lòng chọn một phương án!', 'warning');
            return;
        }

        if (!this.sessionCode || !this.currentUser) {
            window.showNotification('Vui lòng đăng nhập!', 'error');
            return;
        }

        const responseIndex = parseInt(selectedOption.dataset.index);
        
        try {
            await window.firebaseService.set(`sessions/${this.sessionCode}/poll/responses/${this.currentUser.uid}`, {
                name: this.currentUser.name,
                choice: responseIndex
            });
            
            window.showNotification('✅ Đã gửi phản hồi!', 'success');
            this.hidePoll();
        } catch (error) {
            window.showNotification('❌ Lỗi gửi phản hồi!', 'error');
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.classList.toggle('dark-mode', this.isDarkMode);
        
        const toggleBtn = document.getElementById('toggleStyleBtn');
        if (toggleBtn) {
            toggleBtn.textContent = this.isDarkMode ? '☀️ Chế độ sáng' : '🌙 Chế độ tối';
        }

        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    showModal(modalId, content = null) {
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        if (content) {
            modal.innerHTML = content;
        }

        modal.classList.add('active');
        this.activeModal = modal;
    }

    hideModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            if (modal === this.activeModal) {
                this.activeModal = null;
            }
        }
    }

    handleExamChange(e) {
        const selectedExam = e.target.value;
        if (selectedExam && selectedExam !== 'mm') {
            window.location.href = selectedExam;
        }
    }

    async calculateScore() {
        if (this.isTeacherLoggedIn) {
            window.showNotification("Giáo viên không tính điểm.", "info");
            return;
        }

        if (!this.currentUser || !this.sessionCode) {
            window.showNotification("Vui lòng đăng nhập và tham gia lớp học.", "warning");
            return;
        }

        try {
            if (window.quizManager) {
                const scoreResult = window.quizManager.calculateTotalScore();
                await this.saveFinalScore(scoreResult);
                this.showScoreResult(scoreResult);
            }
        } catch (error) {
            window.showNotification('❌ Lỗi tính điểm!', 'error');
        }
    }

    async saveFinalScore(scoreResult) {
        const attemptData = {
            code: this.currentUser.code,
            name: this.currentUser.name,
            testId: window.quizManager.currentTest,
            score: scoreResult.score,
            answers: window.quizManager.studentAnswers,
            percentage: scoreResult.percentage
        };

        await window.firebaseService.saveAttempt(this.sessionCode, this.currentUser.uid, attemptData);
        
        await window.firebaseService.update(`sessions/${this.sessionCode}/students/${this.currentUser.uid}`, {
            score: scoreResult.score,
            status: 'finished',
            finished: window.firebaseService.serverTimestamp()
        });
    }

    showScoreResult(scoreResult) {
        const resultBox = document.createElement('div');
        resultBox.id = 'score-result';
        resultBox.className = 'score-result';
        
        const scoreColor = scoreResult.percentage >= 80 ? '#28a745' : 
                          scoreResult.percentage >= 50 ? '#ffc107' : '#dc3545';
        const scoreEmoji = scoreResult.percentage >= 80 ? '🏆' : 
                          scoreResult.percentage >= 50 ? '✅' : '❌';

        resultBox.innerHTML = `
            <div class="score-header">
                <div class="score-emoji">${scoreEmoji}</div>
                <div class="score-value" style="color: ${scoreColor}">
                    ${scoreResult.score.toFixed(2)} / ${scoreResult.maxScore.toFixed(2)}
                </div>
                <div class="score-percentage">${scoreResult.percentage.toFixed(1)}%</div>
            </div>
            <div class="score-message">
                ${this.getScoreMessage(scoreResult.percentage)}
            </div>
        `;

        document.body.appendChild(resultBox);

        setTimeout(() => {
            if (resultBox.parentNode) {
                resultBox.parentNode.removeChild(resultBox);
            }
        }, 10000);
    }

    getScoreMessage(percentage) {
        if (percentage >= 80) return 'Xuất sắc! 🎉';
        if (percentage >= 50) return 'Đạt yêu cầu! 👍';
        return 'Cần cố gắng thêm! 💪';
    }

    checkAuthentication() {
        // Check if user was previously logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isTeacherLoggedIn = this.currentUser.role === 'teacher';
            this.updateUIAfterLogin();
        }
    }
};

// Tạo global instance
window.uiManager = new UIManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager.initialize();
});

// Thêm vào global
window.appManager = window.uiManager;