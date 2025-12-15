// js/canvas-launcher.js - Easy Canvas Launcher
window.CanvasLauncher = {
    init: function() {
        console.log('🎯 Initializing Canvas Launcher...');
        
        // Thêm nút kích hoạt canvas vào trang
        this.addLaunchButton();
        
        // Kiểm tra và khởi tạo canvas manager
        this.checkAndInitCanvas();
    },
    
    addLaunchButton: function() {
        // Kiểm tra nếu nút đã tồn tại
        if (document.getElementById('canvasLauncherBtn')) return;
        
        const launchBtn = document.createElement('button');
        launchBtn.id = 'canvasLauncherBtn';
        launchBtn.innerHTML = '🎨 Bật Vẽ';
        launchBtn.style.position = 'fixed';
        launchBtn.style.bottom = '20px';
        launchBtn.style.right = '20px';
        launchBtn.style.zIndex = '10002';
        launchBtn.style.padding = '12px 16px';
        launchBtn.style.background = '#6b21a8';
        launchBtn.style.color = 'white';
        launchBtn.style.border = 'none';
        launchBtn.style.borderRadius = '25px';
        launchBtn.style.cursor = 'pointer';
        launchBtn.style.boxShadow = '0 4px 12px rgba(107, 33, 168, 0.3)';
        launchBtn.style.fontSize = '14px';
        launchBtn.style.fontWeight = 'bold';
        
        launchBtn.addEventListener('click', () => {
            this.toggleCanvas();
        });
        
        document.body.appendChild(launchBtn);
        console.log('✅ Canvas launcher button added');
    },
    
    checkAndInitCanvas: function() {
        // Kiểm tra canvas manager
        if (!window.canvasManager) {
            console.error('❌ Canvas Manager not found!');
            return false;
        }
        
        // Khởi tạo canvas manager
        setTimeout(() => {
            try {
                window.canvasManager.initialize();
                console.log('✅ Canvas Manager initialized via launcher');
            } catch (error) {
                console.error('❌ Canvas initialization failed:', error);
            }
        }, 2000);
        
        return true;
    },
    
    toggleCanvas: function() {
        if (!window.canvasManager) {
            window.showNotification('❌ Canvas Manager chưa sẵn sàng!', 'error');
            return;
        }
        
        window.canvasManager.toggleDrawMode();
        
        // Cập nhật text nút
        const launchBtn = document.getElementById('canvasLauncherBtn');
        if (launchBtn) {
            if (window.canvasManager.isDrawMode) {
                launchBtn.innerHTML = '❌ Tắt Vẽ';
                launchBtn.style.background = '#dc3545';
            } else {
                launchBtn.innerHTML = '🎨 Bật Vẽ';
                launchBtn.style.background = '#6b21a8';
            }
        }
    },
    
    // Hàm debug
    debug: function() {
        console.log('🔍 Canvas Debug Info:');
        console.log('- Canvas Manager:', !!window.canvasManager);
        console.log('- Canvas Element:', !!document.getElementById('drawCanvas'));
        console.log('- Toolbar Element:', !!document.getElementById('drawToolbar'));
        console.log('- Launcher Button:', !!document.getElementById('canvasLauncherBtn'));
        console.log('- Draw Mode:', window.canvasManager?.isDrawMode);
        console.log('- Is Drawing:', window.canvasManager?.isDrawing);
    }
};

// Tự động khởi chạy
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Ready - Starting Canvas Launcher...');
    setTimeout(() => {
        window.CanvasLauncher.init();
    }, 1500);
});

// Global function để debug
window.debugCanvas = function() {
    window.CanvasLauncher.debug();
};