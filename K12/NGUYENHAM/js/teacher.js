// js/teacher.js - KHÔNG DÙNG IMPORT/EXPORT
window.TeacherManager = class {
    constructor() {
        this.currentSession = null;
        this.studentListeners = new Map();
        this.pollChart = null;
    }

    generateSessionCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    async createSession(teacherName) {
        try {
            const sessionCode = this.generateSessionCode();
            await window.firebaseService.createSession(sessionCode, teacherName);
            
            this.currentSession = sessionCode;
            window.showNotification(`✅ Đã tạo lớp học! Mã lớp: ${sessionCode}`, 'success');
            
            this.startMonitoringSession();
            return sessionCode;
        } catch (error) {
            console.error('Error creating session:', error);
            window.showNotification('Lỗi tạo lớp học!', 'error');
            throw error;
        }
    }

    startMonitoringSession() {
        if (!this.currentSession) return;

        window.firebaseService.on(`sessions/${this.currentSession}/students`, (students) => {
            this.updateStudentMonitor(students);
        });

        window.firebaseService.on(`sessions/${this.currentSession}/interactions`, (interactions) => {
            this.handleStudentInteractions(interactions);
        });
    }

    updateStudentMonitor(students) {
        const tbody = document.getElementById('student-results-body');
        if (!tbody) return;

        if (!students || Object.keys(students).length === 0) {
            tbody.innerHTML = this.getEmptyStateHTML('Chưa có học sinh nào tham gia.');
            this.updateStatistics(0, 0, 0, 0);
            return;
        }

        let html = '';
        let total = 0, completed = 0, totalScore = 0, failed = 0;

        Object.entries(students).forEach(([studentId, student]) => {
            total++;
            const studentScore = student.score || 0;
            
            if (student.status === 'finished') {
                completed++;
                totalScore += studentScore;
            }
            
            if (studentScore < 1) failed++;

            html += this.renderStudentRow(studentId, student);
        });

        tbody.innerHTML = html;
        this.updateStatistics(total, completed, totalScore, failed);
    }

    renderStudentRow(studentId, student) {
        const timeSpent = student.joined && student.finished ? 
            this.calculateTimeSpent(student.joined, student.finished) : '--:--';
        
        const statusBadge = this.getStatusBadge(student.status);
        const scoreColor = this.getScoreColor(student.score || 0);

        return `
            <tr>
                <td>
                    <strong>${student.name}</strong><br>
                    <small>${student.code}</small>
                </td>
                <td style="text-align: center;">${statusBadge}</td>
                <td style="text-align: center; font-weight: bold; color: ${scoreColor}">
                    ${student.score > 0 ? student.score.toFixed(2) : '-'}
                </td>
                <td style="text-align: center;">${timeSpent}</td>
                <td style="text-align: center;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${student.progress || 0}%"></div>
                    </div>
                    <small>${student.progress || 0}%</small>
                </td>
                <td style="text-align: center;">
                    <button onclick="teacherManager.viewStudentDetail('${studentId}')" class="btn-info">
                        📊 Chi tiết
                    </button>
                </td>
            </tr>
        `;
    }

    getStatusBadge(status) {
        const badges = {
            'active': '<span class="status-active">🟢 Đang làm</span>',
            'finished': '<span class="status-finished">✅ Đã nộp</span>',
            'not-started': '<span class="status-not-started">⏳ Chưa bắt đầu</span>'
        };
        return badges[status] || '<span class="status-not-started">❓ Không xác định</span>';
    }

    getScoreColor(score) {
        if (score >= 8) return '#28a745';
        if (score >= 5) return '#ffc107';
        return '#dc3545';
    }

    calculateTimeSpent(startTime, endTime) {
        const diff = endTime - startTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateStatistics(total, completed, totalScore, failed) {
        const elements = {
            total: document.getElementById('stats-total'),
            completed: document.getElementById('stats-completed'),
            average: document.getElementById('stats-average'),
            failed: document.getElementById('stats-failed')
        };

        if (elements.total) elements.total.textContent = total;
        if (elements.completed) elements.completed.textContent = completed;
        if (elements.average) {
            elements.average.textContent = completed > 0 ? (totalScore / completed).toFixed(1) : '0.0';
        }
        if (elements.failed) elements.failed.textContent = failed;
    }

    getEmptyStateHTML(message) {
        return `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 1.5em; margin-bottom: 10px;">📊</div>
                    ${message}
                </td>
            </tr>
        `;
    }

    handleStudentInteractions(interactions) {
        if (!interactions) return;

        Object.values(interactions).forEach(interaction => {
            this.showInteractionAlert(interaction);
        });
    }

    showInteractionAlert(interaction) {
        let message = '';
        let type = 'info';

        switch(interaction.type) {
            case 'hand_raised':
                message = `✋ ${interaction.student} đang giơ tay!`;
                type = 'info';
                break;
            case 'question':
                message = `❓ ${interaction.student}: ${interaction.content}`;
                type = 'warning';
                break;
            case 'need_help':
                message = `🆘 ${interaction.student} cần hỗ trợ gấp!`;
                type = 'error';
                break;
            default:
                return;
        }

        window.showNotification(message, type);
    }

    async startPoll(question, options) {
        if (!this.currentSession) {
            window.showNotification('Vui lòng tạo lớp học trước!', 'error');
            return;
        }

        const pollData = {
            question,
            options: options.map(opt => opt.trim()),
            active: true,
            created: window.firebaseService.serverTimestamp(),
            responses: {}
        };

        try {
            await window.firebaseService.set(`sessions/${this.currentSession}/poll`, pollData);
            window.showNotification('✅ Khảo sát đã bắt đầu!', 'success');
        } catch (error) {
            console.error('Error starting poll:', error);
            window.showNotification('Lỗi tạo khảo sát!', 'error');
        }
    }

    syncSlides(slideIndex) {
        if (!this.currentSession) return;

        window.firebaseService.set(`sessions/${this.currentSession}/currentSlide`, slideIndex)
            .then(() => window.showNotification(`✅ Đã đồng bộ slide ${slideIndex + 1}`, 'success'))
            .catch(error => window.showNotification('Lỗi đồng bộ slide!', 'error'));
    }

    viewStudentDetail(studentId) {
        window.showNotification('Tính năng xem chi tiết học sinh đang được phát triển.', 'info');
    }
};

// Tạo global instance
window.teacherManager = new TeacherManager();