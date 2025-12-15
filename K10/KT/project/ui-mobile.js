/**
 * UI Mobile - Hamburger Menu Only
 * Không ảnh hưởng đến nội dung lời giải
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 UI Mobile - Hamburger Menu");
    
    // Kiểm tra mobile
    if (window.innerWidth <= 768) {
        setupMobileUI();
    }
    
    // Xử lý resize
    window.addEventListener('resize', handleResize);
});

function setupMobileUI() {
    // 1. Thêm hamburger button
    addHamburgerButton();
    
    // 2. Ẩn desktop controls
    hideDesktopControls();
    
    // 3. Tạo mobile controls dropdown
    createMobileDropdown();
    
    // 4. Hiển thị 2 nút trên topbar
    showMobileTopbarButtons();
    
    // 5. Setup toggle
    setupMenuToggle();
}

function addHamburgerButton() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    
    // Kiểm tra đã có chưa
    if (document.getElementById('hamburgerBtn')) return;
    
    // Tạo nút hamburger
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-menu';
    hamburgerBtn.innerHTML = '☰';
    hamburgerBtn.id = 'hamburgerBtn';
    hamburgerBtn.title = 'Mở menu điều khiển';
    
    // Thêm vào bên trái topbar
    const topbarTitle = document.querySelector('.topbar-title');
    if (topbarTitle) {
        topbar.insertBefore(hamburgerBtn, topbarTitle);
    }
}

function hideDesktopControls() {
    const desktopControls = document.querySelector('.desktop-controls');
    if (desktopControls) {
        desktopControls.style.display = 'none';
    }
}

function createMobileDropdown() {
    // Kiểm tra đã có chưa
    if (document.getElementById('mobileControls')) return;
    
    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.id = 'mobileControls';
    
    // Lấy các nút từ desktop controls (trừ login)
    const desktopControls = document.querySelector('.desktop-controls');
    if (desktopControls) {
        const buttons = desktopControls.querySelectorAll('button:not(#loginBtn)');
        
        buttons.forEach(button => {
            const mobileBtn = button.cloneNode(true);
            
            // Sao chép sự kiện onclick
            const originalOnclick = button.getAttribute('onclick');
            if (originalOnclick) {
                mobileBtn.setAttribute('onclick', originalOnclick);
            }
            
            // Đóng menu sau khi click
            mobileBtn.addEventListener('click', function() {
                setTimeout(() => {
                    mobileControls.classList.remove('active');
                }, 300);
            });
            
            mobileControls.appendChild(mobileBtn);
        });
    }
    
    // Nút đóng menu
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕ Đóng menu';
    closeBtn.style.background = '#dc3545';
    closeBtn.style.marginTop = '10px';
    closeBtn.addEventListener('click', function() {
        mobileControls.classList.remove('active');
    });
    mobileControls.appendChild(closeBtn);
    
    document.body.appendChild(mobileControls);
}

function showMobileTopbarButtons() {
    // Tạo container cho 2 nút
    const mobileActions = document.createElement('div');
    mobileActions.className = 'mobile-topbar-actions';
    mobileActions.id = 'mobileTopbarActions';
    
    // 1. Nút đăng nhập
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        const mobileLoginBtn = loginBtn.cloneNode(true);
        mobileLoginBtn.id = 'mobileLoginBtn';
        
        // Gán sự kiện mở modal
        mobileLoginBtn.onclick = function() {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.classList.add('active');
        };
        
        mobileActions.appendChild(mobileLoginBtn);
        loginBtn.style.display = 'none';
    }
    
    // 2. Select chọn đề
    const examSelect = document.getElementById('selectExam');
    if (examSelect) {
        const mobileExamSelect = examSelect.cloneNode(true);
        mobileExamSelect.id = 'mobileExamSelect';
        
        // Đồng bộ sự kiện
        mobileExamSelect.addEventListener('change', function() {
            examSelect.value = this.value;
            examSelect.dispatchEvent(new Event('change'));
        });
        
        mobileActions.appendChild(mobileExamSelect);
    }
    
    // Thêm vào topbar
    const topbar = document.querySelector('.topbar');
    if (topbar) {
        topbar.appendChild(mobileActions);
    }
}

function setupMenuToggle() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileControls = document.getElementById('mobileControls');
    
    if (hamburgerBtn && mobileControls) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileControls.classList.toggle('active');
        });
        
        // Đóng khi click bên ngoài
        document.addEventListener('click', function(e) {
            if (!mobileControls.contains(e.target) && 
                !hamburgerBtn.contains(e.target)) {
                mobileControls.classList.remove('active');
            }
        });
    }
}

function handleResize() {
    if (window.innerWidth > 768) {
        // Desktop: hiện lại controls gốc
        const desktopControls = document.querySelector('.desktop-controls');
        if (desktopControls) {
            desktopControls.style.display = 'flex';
        }
        
        // Ẩn mobile controls
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.remove('active');
        }
        
        // Hiện lại nút login gốc
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.style.display = 'inline-block';
        }
        
        // Xóa các phần tử mobile
        const elementsToRemove = [
            'hamburgerBtn',
            'mobileControls',
            'mobileTopbarActions'
        ];
        
        elementsToRemove.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        
    } else if (window.innerWidth <= 768) {
        // Mobile: setup lại nếu chưa có
        if (!document.getElementById('hamburgerBtn')) {
            setupMobileUI();
        }
    }
}