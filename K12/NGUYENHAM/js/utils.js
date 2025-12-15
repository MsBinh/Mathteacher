// js/utils.js - KHÔNG DÙNG ES6 MODULES
window.Utils = {
    showNotification: function(message, type = 'info') {
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    },

    playSound: function(type) {
        if (!('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance();
        utterance.text = this.getSoundText(type);
        utterance.lang = 'vi-VN';
        utterance.volume = 0.7;
        utterance.rate = 1.2;
        
        speechSynthesis.speak(utterance);
    },

    getSoundText: function(type) {
        const sounds = {
            'correct': 'Chính xác!',
            'wrong': 'Sai rồi!',
            'partial': 'Gần đúng rồi'
        };
        return sounds[type] || '';
    },

    getTimeAgo: function(timestamp) {
        if (!timestamp) return '--:--';
        
        const now = Date.now();
        const time = typeof timestamp === 'number' ? timestamp : timestamp;
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} ngày trước`;
    },

    hideLoading: function() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    },

    generateId: function(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    formatScore: function(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        return {
            score: score.toFixed(2),
            maxScore: maxScore.toFixed(2),
            percentage: percentage.toFixed(1)
        };
    },

    showError: function(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div style="color: #dc3545; text-align: center;">
                    <div style="font-size: 3em;">❌</div>
                    <div style="font-size: 1.2em; margin: 20px 0;">${message}</div>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Thử lại
                    </button>
                </div>
            `;
        }
    }
};

// Tạo alias cho các hàm thường dùng
window.showNotification = window.Utils.showNotification;
window.playSound = window.Utils.playSound;
window.hideLoading = window.Utils.hideLoading;