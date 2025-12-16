/**
 * UI Mobile Improvements for Lớp Toán Thầy Bình
 * FINAL VERSION - Single source of truth cho #selectExam
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 UI Mobile đang khởi tạo...");
    
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // 1. Tạo hamburger menu
        createHamburgerMenu();
        
        // 2. Tạo mobile controls dropdown (KHÔNG có select)
        createMobileControls();
        
        // 3. Tạo mobile topbar (chỉ clone login button)
        createMobileTopbar();
        
        // 4. Thiết lập toggle menu
        setupMenuToggle();
    }
    
    // 5. Luôn cải thiện MathJax
    improveMathJaxMobile();
    
    console.log("✅ UI Mobile đã sẵn sàng");
    
    // Xử lý khi resize window
    window.addEventListener('resize', handleResize);
});

// ===== HAMBURGER MENU =====
function createHamburgerMenu() {
    console.log("🍔 Tạo hamburger menu...");
    
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    
    if (document.getElementById('hamburgerBtn')) return;
    
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-menu';
    hamburgerBtn.innerHTML = '☰';
    hamburgerBtn.id = 'hamburgerBtn';
    hamburgerBtn.title = 'Mở menu điều khiển';
    
    const topbarTitle = document.querySelector('.topbar-title');
    if (topbarTitle) {
        topbar.insertBefore(hamburgerBtn, topbarTitle);
    } else {
        topbar.insertBefore(hamburgerBtn, topbar.firstChild);
    }
}

// ===== MOBILE CONTROLS DROPDOWN (KHÔNG CÓ SELECT) =====
function createMobileControls() {
    console.log("📱 Tạo mobile controls...");
    
    if (document.getElementById('mobileControls')) return;
    
    const desktopControls = document.querySelector('.desktop-controls');
    if (!desktopControls) return;
    
    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.id = 'mobileControls';
    
    document.body.appendChild(mobileControls);
    
    // Lấy các nút từ desktop controls (TRỪ loginBtn và select)
    const buttons = desktopControls.querySelectorAll('button');
    
    buttons.forEach(button => {
        if (button.id !== 'loginBtn' && button.id !== 'slideMenuBtn') {
            const mobileBtn = button.cloneNode(true);
            mobileBtn.className = 'mobile-dropdown-btn';
            
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                mobileBtn.setAttribute('onclick', onclickAttr);
            }
            
            mobileBtn.addEventListener('click', function() {
                setTimeout(() => {
                    mobileControls.classList.remove('active');
                }, 300);
            });
            
            mobileControls.appendChild(mobileBtn);
        }
    });
    
    // Thêm nút đóng menu
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕ Đóng menu';
    closeBtn.className = 'mobile-menu-close';
    closeBtn.addEventListener('click', function() {
        mobileControls.classList.remove('active');
    });
    mobileControls.appendChild(closeBtn);
}

// ===== MOBILE TOPBAR (CHỈ CLONE LOGIN BUTTON) =====
function createMobileTopbar() {
    console.log("📱 Thiết lập topbar mobile...");
    
    if (document.getElementById('mobileTopbarActions')) return;
    
    const mobileActions = document.createElement('div');
    mobileActions.className = 'mobile-topbar-actions';
    mobileActions.id = 'mobileTopbarActions';
    
    // CHỈ CLONE LOGIN BUTTON
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        const mobileLoginBtn = loginBtn.cloneNode(true);
        mobileLoginBtn.id = 'mobileLoginBtn';
        mobileLoginBtn.innerHTML = '🔑';
        mobileLoginBtn.title = 'Đăng nhập';
        
        // Giữ nguyên sự kiện mở modal
        mobileLoginBtn.onclick = function() {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.classList.add('active');
            }
        };
        
        mobileActions.appendChild(mobileLoginBtn);
        
        // Ẩn login gốc
        loginBtn.style.display = 'none';
    }
    
    // KHÔNG CLONE SELECT - CSS sẽ hiển thị #selectExam gốc
    
    const topbar = document.querySelector('.topbar');
    if (topbar) {
        topbar.appendChild(mobileActions);
    }
}

// ===== TOGGLE MOBILE MENU =====
function setupMenuToggle() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileControls = document.getElementById('mobileControls');
    
    if (hamburgerBtn && mobileControls) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileControls.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!mobileControls.contains(e.target) && 
                !hamburgerBtn.contains(e.target) &&
                mobileControls.classList.contains('active')) {
                mobileControls.classList.remove('active');
            }
        });
        
        mobileControls.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

// ===== HANDLE RESIZE =====
function handleResize() {
    const isMobileNow = window.innerWidth <= 768;
    const wasMobile = document.getElementById('hamburgerBtn') !== null;
    
    if (isMobileNow && !wasMobile) {
        console.log("📱 Chuyển sang mobile");
        location.reload();
    } else if (!isMobileNow && wasMobile) {
        console.log("🖥️ Chuyển sang desktop");
        location.reload();
    }
}

// ===== IMPROVE MATHJAX MOBILE DISPLAY =====
function improveMathJaxMobile() {
    if (typeof MathJax === 'undefined') return;
    
    function handleMathJaxOverflow() {
        if (MathJax.typesetPromise) {
            MathJax.typesetPromise().then(() => {
                document.querySelectorAll('mjx-container').forEach(container => {
                    if (container.scrollWidth > container.clientWidth) {
                        container.style.overflowX = 'auto';
                        container.style.maxWidth = '100%';
                    }
                });
                
                document.querySelectorAll('.solution-content').forEach(solution => {
                    solution.style.overflowX = 'auto';
                    solution.style.maxWidth = '100%';
                });
            });
        }
    }
    
    window.addEventListener('load', handleMathJaxOverflow);
    window.addEventListener('resize', function() {
        setTimeout(handleMathJaxOverflow, 300);
    });
    
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            let shouldUpdate = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    shouldUpdate = true;
                }
            });
            if (shouldUpdate) {
                setTimeout(handleMathJaxOverflow, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
}

// Khởi tạo menu toggle
setTimeout(() => {
    if (window.innerWidth <= 768) {
        setupMenuToggle();
    }
}, 100);