// js/app.js - FIXED VERSION
window.AppManager = {
    init: function() {
        console.log('🚀 Starting application...');
        
        // Khởi tạo các component
        this.initUtils();
        this.initFirebase();
        this.initManagers();
        this.initUI();
        
        // Tải câu hỏi SAU KHI UI đã khởi tạo
        setTimeout(() => {
            this.loadQuestions();
        }, 500);
    },
    
    initUtils: function() {
        console.log('📦 Initializing utilities...');
        if (window.Utils) {
            console.log('✅ Utilities ready');
        }
    },
    
    initFirebase: function() {
        console.log('🔥 Initializing Firebase...');
        if (window.firebaseService) {
            console.log('✅ Firebase ready');
        }
    },
    
    initManagers: function() {
        console.log('👨‍🏫 Initializing managers...');
        if (window.quizManager && window.teacherManager && window.canvasManager) {
            console.log('✅ Managers ready');
        }
    },
    
    initUI: function() {
        console.log('🎨 Initializing UI...');
        if (window.uiManager) {
            window.uiManager.initialize();
            console.log('✅ UI ready');
        }
    },
    
    loadQuestions: function() {
        if (window.quizManager) {
            console.log('📝 Loading questions...');
            window.quizManager.loadQuestions('gk1de1.html').then(questions => {
                console.log(`✅ Loaded ${questions.length} questions`);
                
                const container = document.getElementById('slides-container');
                if (container && questions.length > 0) {
                    window.quizManager.renderQuestions(container);
                    console.log('✅ Questions rendered');
                    
                    // Khởi tạo Reveal.js SAU KHI có nội dung
                    this.safeRevealInit();
                } else {
                    console.warn('No container or questions found');
                }
            }).catch(error => {
                console.error('❌ Error loading questions:', error);
            });
        } else {
            console.error('❌ QuizManager not found');
        }
    },
    
    safeRevealInit: function() {
        if (typeof Reveal === 'undefined') {
            console.error('Reveal.js not loaded');
            return;
        }
        
        // Chỉ khởi tạo nếu chưa được khởi tạo
        if (!Reveal.isReady || !Reveal.isReady()) {
            try {
                // Sử dụng config đơn giản, không dùng plugins gây lỗi
                Reveal.initialize({
                    hash: true,
                    controls: true,
                    progress: true,
                    center: true,
                    transition: 'slide',
                    // Tạm thời không dùng plugins để tránh lỗi
                    plugins: []
                });
                
                console.log('✅ Reveal.js safely initialized');
            } catch (error) {
                console.error('❌ Error initializing Reveal.js:', error);
            }
        } else {
            console.log('✅ Reveal.js already initialized');
            
            // Force update nếu Reveal đã được khởi tạo
            try {
                Reveal.sync();
                console.log('✅ Reveal.js synced');
            } catch (e) {
                console.log('Reveal sync not needed');
            }
        }
    },
    
    hideLoading: function() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
            console.log('✅ Loading hidden');
        }
    }
};

// Khởi động ứng dụng khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded');
    window.AppManager.init();
    
    // Ẩn loading sau 3 giây (fallback)
    setTimeout(() => {
        window.AppManager.hideLoading();
    }, 3000);
});