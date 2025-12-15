// js/quick-test.js - Quick Functionality Test
window.QuickTest = {
    runAllTests: function() {
        console.log('🧪 Running Quick Tests...');
        
        this.testCanvas();
        this.testLogin();
        this.testQuiz();
        this.testTeacher();
        
        console.log('✅ Quick tests completed');
    },
    
    testCanvas: function() {
        console.log('🎨 Testing Canvas...');
        console.log('- Canvas Manager:', !!window.canvasManager);
        console.log('- Canvas Element:', !!document.getElementById('drawCanvas'));
        console.log('- Draw Mode:', window.canvasManager?.isDrawMode);
    },
    
    testLogin: function() {
        console.log('🔐 Testing Login...');
        console.log('- Firebase Service:', !!window.firebaseService);
        console.log('- UI Manager:', !!window.uiManager);
        console.log('- Current User:', window.uiManager?.currentUser);
    },
    
    testQuiz: function() {
        console.log('📝 Testing Quiz...');
        console.log('- Quiz Manager:', !!window.quizManager);
        console.log('- Questions:', window.quizManager?.questions?.length || 0);
    },
    
    testTeacher: function() {
        console.log('👨‍🏫 Testing Teacher...');
        console.log('- Teacher Manager:', !!window.teacherManager);
        console.log('- Current Session:', window.teacherManager?.currentSession);
    }
};

// Chạy test khi tải trang
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.QuickTest.runAllTests();
    }, 3000);
});

// Global function để test
window.testApp = function() {
    window.QuickTest.runAllTests();
};