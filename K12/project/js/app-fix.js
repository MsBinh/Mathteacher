// js/app-fix.js - Fix tất cả lỗi
window.AppFix = {
    init: function() {
        console.log('🔧 Applying application fixes...');
        this.fixUtils();
        this.fixUI();
        this.fixQuiz();
        console.log('✅ All fixes applied');
    },
    
    fixUtils: function() {
        // Đảm bảo Utils có thể gọi độc lập
        if (window.Utils) {
            // Tạo backup functions
            window.safePlaySound = function(type) {
                const sounds = {
                    'correct': 'Chính xác!',
                    'wrong': 'Sai rồi!',
                    'partial': 'Gần đúng rồi'
                };
                
                if (!('speechSynthesis' in window)) return;
                const text = sounds[type] || '';
                if (!text) return;
                
                const utterance = new SpeechSynthesisUtterance();
                utterance.text = text;
                utterance.lang = 'vi-VN';
                utterance.volume = 0.7;
                utterance.rate = 1.2;
                
                speechSynthesis.speak(utterance);
            };
        }
    },
    
    fixUI: function() {
        // Fix UI manager context issues
        if (window.uiManager) {
            // Bind methods to maintain context
            window.uiManager.setupSlideMenu = window.uiManager.setupSlideMenu?.bind(window.uiManager) || function() {
                console.log('📋 Setting up slide menu...');
                const slideMenu = document.getElementById('slideMenu');
                if (slideMenu) {
                    window.uiManager.createSlideList();
                }
            };
        }
    },
    
    fixQuiz: function() {
        // Fix quiz manager context issues
        if (window.quizManager) {
            // Replace playSound calls with safe version
            const originalDisplayAnswerResult = window.quizManager.displayAnswerResult;
            if (originalDisplayAnswerResult) {
                window.quizManager.displayAnswerResult = function(container, questionId, userAnswer, correctAnswer, isCorrect) {
                    originalDisplayAnswerResult.call(this, container, questionId, userAnswer, correctAnswer, isCorrect);
                    
                    // Use safe play sound
                    if (window.safePlaySound) {
                        window.safePlaySound(isCorrect ? 'correct' : 'wrong');
                    }
                };
            }
        }
    }
};

// Apply fixes when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.AppFix.init();
    }, 100);
});