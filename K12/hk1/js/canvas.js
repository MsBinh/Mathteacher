// js/canvas-fixed.js - FIXED VERSION
window.CanvasManager = class {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.isDrawMode = false;
        this.history = [];
        this.currentTool = 'pen';
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
        
        console.log('🎨 Canvas Manager constructor called');
    }

    initialize() {
        console.log('🎨 Initializing Canvas Manager...');
        
        // Tạo canvas nếu chưa tồn tại
        this.createCanvasElement();
        
        // Tạo toolbar nếu chưa tồn tại
        this.createToolbarElement();
        
        // Thiết lập sự kiện
        this.setupEventListeners();
        
        console.log('✅ Canvas Manager initialized successfully');
    }

    createCanvasElement() {
        // Kiểm tra nếu canvas đã tồn tại
        this.canvas = document.getElementById('drawCanvas');
        
        if (!this.canvas) {
            console.log('📝 Creating new canvas element...');
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'drawCanvas';
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '10000';
            this.canvas.style.display = 'none';
            this.canvas.style.background = 'transparent';
            this.canvas.style.pointerEvents = 'none';
            document.body.appendChild(this.canvas);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }

    createToolbarElement() {
        // Kiểm tra nếu toolbar đã tồn tại
        let toolbar = document.getElementById('drawToolbar');
        
        if (!toolbar) {
            console.log('📝 Creating toolbar element...');
            toolbar = document.createElement('div');
            toolbar.id = 'drawToolbar';
            toolbar.style.position = 'fixed';
            toolbar.style.top = '10px';
            toolbar.style.left = '10px';
            toolbar.style.background = 'white';
            toolbar.style.padding = '10px';
            toolbar.style.borderRadius = '8px';
            toolbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            toolbar.style.zIndex = '10001';
            toolbar.style.display = 'none';
            
            toolbar.innerHTML = `
                <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                    <button id="toggleDrawMode" style="padding: 8px 12px; background: #6b21a8; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🎨 Bật vẽ
                    </button>
                    <button id="exitDrawMode" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">
                        ❌ Tắt vẽ
                    </button>
                    <select id="drawTool" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="pen">✏️ Bút</option>
                        <option value="line">📏 Đường thẳng</option>
                        <option value="rect">⬜ Hình chữ nhật</option>
                        <option value="circle">⭕ Hình tròn</option>
                        <option value="eraser">🧽 Xóa</option>
                    </select>
                    <input type="color" id="colorPicker" value="#6b21a8" style="width: 40px; height: 30px;">
                    <input type="range" id="drawWidth" min="1" max="20" value="3" style="width: 80px;">
                    <span id="brushSize" style="font-size: 12px;">3px</span>
                    <button id="clearCanvas" style="padding: 6px 10px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;">
                        🧹 Xóa
                    </button>
                    <button id="undoDraw" style="padding: 6px 10px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ↩️ Hoàn tác
                    </button>
                    <button id="saveCanvas" style="padding: 6px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        💾 Lưu
                    </button>
                </div>
            `;
            
            document.body.appendChild(toolbar);
        }
        
        this.setupToolbarEvents();
    }

    setupToolbarEvents() {
        const toggleBtn = document.getElementById('toggleDrawMode');
        const exitBtn = document.getElementById('exitDrawMode');
        const clearBtn = document.getElementById('clearCanvas');
        const undoBtn = document.getElementById('undoDraw');
        const saveBtn = document.getElementById('saveCanvas');
        const toolSelect = document.getElementById('drawTool');
        const brushSize = document.getElementById('drawWidth');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleDrawMode());
            console.log('✅ Toggle button event bound');
        }
        
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.toggleDrawMode());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCanvas());
        }
        
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCanvas());
        }
        
        if (toolSelect) {
            toolSelect.addEventListener('change', (e) => {
                this.currentTool = e.target.value;
                console.log('🛠️ Tool changed to:', this.currentTool);
            });
        }
        
        if (brushSize) {
            brushSize.addEventListener('input', (e) => {
                const sizeDisplay = document.getElementById('brushSize');
                if (sizeDisplay) {
                    sizeDisplay.textContent = e.target.value + 'px';
                }
            });
        }
    }

    setupEventListeners() {
        if (!this.canvas) return;

        console.log('🎯 Setting up canvas event listeners...');

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches[0]) {
                this.startDrawing(e.touches[0]);
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches[0]) {
                this.draw(e.touches[0]);
            }
        });
        
        this.canvas.addEventListener('touchend', () => this.stopDrawing());

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());

        console.log('✅ Canvas event listeners setup complete');
    }

    resizeCanvas() {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            console.log('📐 Canvas resized:', this.canvas.width, 'x', this.canvas.height);
        }
    }

    toggleDrawMode() {
        this.isDrawMode = !this.isDrawMode;
        
        const toggleBtn = document.getElementById('toggleDrawMode');
        const exitBtn = document.getElementById('exitDrawMode');
        const toolbar = document.getElementById('drawToolbar');
        
        if (this.canvas) {
            this.canvas.style.display = this.isDrawMode ? 'block' : 'none';
            this.canvas.style.pointerEvents = this.isDrawMode ? 'auto' : 'none';
        }
        
        if (toolbar) {
            toolbar.style.display = this.isDrawMode ? 'block' : 'none';
        }
        
        if (toggleBtn) {
            toggleBtn.style.display = this.isDrawMode ? 'none' : 'inline-block';
        }
        
        if (exitBtn) {
            exitBtn.style.display = this.isDrawMode ? 'inline-block' : 'none';
        }
        
        console.log(`🎨 Draw mode ${this.isDrawMode ? 'ENABLED' : 'DISABLED'}`);
        
        if (this.isDrawMode) {
            window.showNotification('🎨 Chế độ vẽ đã bật!', 'success');
        } else {
            window.showNotification('❌ Chế độ vẽ đã tắt!', 'info');
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        if (!this.isDrawMode) return;
        
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.startX = this.lastX = pos.x;
        this.startY = this.lastY = pos.y;
        
        // Lưu trạng thái hiện tại cho undo
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        
        console.log('✏️ Start drawing at:', pos.x, pos.y);
    }

    draw(e) {
        if (!this.isDrawing || !this.isDrawMode) return;

        const pos = this.getMousePos(e);
        const colorPicker = document.getElementById('colorPicker');
        const drawWidth = document.getElementById('drawWidth');
        
        this.ctx.strokeStyle = colorPicker ? colorPicker.value : '#6b21a8';
        this.ctx.lineWidth = drawWidth ? parseInt(drawWidth.value) : 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = drawWidth ? parseInt(drawWidth.value) * 2 : 6;
        }

        switch (this.currentTool) {
            case 'pen':
            case 'eraser':
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
                break;
                
            case 'line':
                // Redraw from start to current position
                this.ctx.putImageData(this.history[this.history.length - 1], 0, 0);
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
                break;
                
            case 'rect':
                this.ctx.putImageData(this.history[this.history.length - 1], 0, 0);
                this.ctx.strokeRect(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
                break;
                
            case 'circle':
                this.ctx.putImageData(this.history[this.history.length - 1], 0, 0);
                const radius = Math.sqrt(Math.pow(pos.x - this.startX, 2) + Math.pow(pos.y - this.startY, 2));
                this.ctx.beginPath();
                this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;
        }

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.beginPath();
            console.log('🛑 Stopped drawing');
        }
    }

    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.history = [];
            console.log('🧹 Canvas cleared');
            window.showNotification('🧹 Đã xóa bảng vẽ', 'info');
        }
    }

    undo() {
        if (this.history.length > 0) {
            const previousState = this.history.pop();
            this.ctx.putImageData(previousState, 0, 0);
            console.log('↩️ Undo performed');
            window.showNotification('↩️ Đã hoàn tác', 'info');
        } else {
            window.showNotification('❌ Không thể hoàn tác', 'warning');
        }
    }

    saveCanvas() {
        if (!this.canvas) return;
        
        try {
            const link = document.createElement('a');
            link.download = `ban-ve-${new Date().getTime()}.png`;
            link.href = this.canvas.toDataURL('image/png');
            link.click();
            console.log('💾 Canvas saved');
            window.showNotification('💾 Đã lưu bản vẽ', 'success');
        } catch (error) {
            console.error('Save error:', error);
            window.showNotification('❌ Lỗi khi lưu bản vẽ', 'error');
        }
    }
};

// Khởi tạo ngay lập tức
console.log('🚀 Loading Canvas Manager...');
window.canvasManager = new CanvasManager();

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Ready - Initializing Canvas...');
    setTimeout(() => {
        window.canvasManager.initialize();
    }, 1000);
});

// Export cho các module khác sử dụng
window.initCanvas = function() {
    if (window.canvasManager) {
        window.canvasManager.initialize();
    }
};