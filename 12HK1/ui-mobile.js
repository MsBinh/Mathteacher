/**
 * UI Mobile Improvements for Lớp Toán Thầy Bình
 * Handles hamburger menu and mobile optimizations
 * FIXED VERSION - Hiển thị đúng hamburger và 2 nút trên mobile
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 UI Mobile đang khởi tạo...");
    
    // Kiểm tra xem đang ở mobile hay không
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // 1. Tạo hamburger menu
        createHamburgerMenu();
        
        // 2. Tạo mobile controls dropdown
        createMobileControls();
        
        // 3. Di chuyển các nút cần thiết lên topbar mobile
        setupMobileTopbar();
        
        // 4. Ẩn desktop controls
        hideDesktopControls();
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
    if (!topbar) {
        console.error("❌ Không tìm thấy .topbar");
        return;
    }
    
    // Kiểm tra xem đã có hamburger chưa
    if (document.getElementById('hamburgerBtn')) {
        console.log("✅ Hamburger đã tồn tại");
        return;
    }
    
    // Tạo nút hamburger
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-menu';
    hamburgerBtn.innerHTML = '☰';
    hamburgerBtn.id = 'hamburgerBtn';
    hamburgerBtn.title = 'Mở menu điều khiển';
    hamburgerBtn.style.display = 'block';
    
    // Thêm vào bên trái topbar (trước title)
    const topbarTitle = document.querySelector('.topbar-title');
    if (topbarTitle) {
        topbar.insertBefore(hamburgerBtn, topbarTitle);
    } else {
        topbar.insertBefore(hamburgerBtn, topbar.firstChild);
    }
    
    console.log("✅ Đã thêm hamburger button");
}

// ===== MOBILE CONTROLS DROPDOWN =====
function createMobileControls() {
    console.log("📱 Tạo mobile controls...");
    
    // Kiểm tra đã có chưa
    if (document.getElementById('mobileControls')) {
        console.log("✅ Mobile controls đã tồn tại");
        return;
    }
    
    // Lấy các nút từ desktop controls
    const desktopControls = document.querySelector('.desktop-controls');
    if (!desktopControls) {
        console.error("❌ Không tìm thấy .desktop-controls");
        return;
    }
    
    // Tạo container mobile controls
    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.id = 'mobileControls';
    
    // Thêm vào body (không phải topbar)
    document.body.appendChild(mobileControls);
    
    // Clone và thêm các nút từ desktop controls
    const buttons = desktopControls.querySelectorAll('button');
    const selects = desktopControls.querySelectorAll('select');
    
    // Thêm select chọn đề
    const examSelect = desktopControls.querySelector('#selectExam');
    if (examSelect) {
        const mobileSelect = examSelect.cloneNode(true);
        mobileSelect.id = 'mobileDropdownExamSelect';
        mobileSelect.className = 'mobile-dropdown-select';
        
        // Đồng bộ sự kiện
        mobileSelect.addEventListener('change', function() {
            examSelect.value = this.value;
            const event = new Event('change');
            examSelect.dispatchEvent(event);
        });
        
        mobileControls.appendChild(mobileSelect);
    }
    
    // Thêm các nút khác (trừ loginBtn - sẽ có riêng trên topbar)
    buttons.forEach(button => {
        if (button.id !== 'loginBtn' && button.id !== 'slideMenuBtn') {
            const mobileBtn = button.cloneNode(true);
            mobileBtn.className = 'mobile-dropdown-btn';
            
            // Copy sự kiện onclick
            const originalOnClick = button.onclick;
            if (originalOnClick) {
                mobileBtn.onclick = originalOnClick;
            } else {
                // Copy attribute onclick
                const onclickAttr = button.getAttribute('onclick');
                if (onclickAttr) {
                    mobileBtn.setAttribute('onclick', onclickAttr);
                }
            }
            
            // Thêm sự kiện đóng menu sau khi click
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
    closeBtn.style.background = '#dc3545';
    closeBtn.style.marginTop = '10px';
    closeBtn.addEventListener('click', function() {
        mobileControls.classList.remove('active');
    });
    mobileControls.appendChild(closeBtn);
    
    console.log("✅ Đã tạo mobile controls với " + (buttons.length + selects.length) + " phần tử");
}

// ===== MOBILE TOPBAR (2 NÚT) =====
// Thay toàn bộ hàm setupMobileTopbar bằng:

function setupMobileTopbar() {
    console.log("📱 Setting up mobile topbar...");
    
    // Tạo container
    const mobileActions = document.createElement('div');
    mobileActions.className = 'mobile-topbar-actions';
    mobileActions.id = 'mobileTopbarActions';
    
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        const mobileLoginBtn = loginBtn.cloneNode(true);
        mobileLoginBtn.id = 'mobileLoginBtn';
        mobileActions.appendChild(mobileLoginBtn);
        loginBtn.style.display = 'none';
    }
    
    // QUAN TRỌNG: Tạo select nhưng ĐỂ TRỐNG
    const mobileExamSelect = document.createElement('select');
    mobileExamSelect.id = 'mobileExamSelect';
    mobileExamSelect.className = 'mobile-exam-select';
    mobileExamSelect.innerHTML = '<option>Đang tải...</option>';
    mobileExamSelect.disabled = true;
    
    mobileActions.appendChild(mobileExamSelect);
    
    // Thêm vào topbar
    const topbar = document.querySelector('.topbar');
    if (topbar) topbar.appendChild(mobileActions);
    
    // QUAN TRỌNG: Chờ exam data load xong RỒI mới populate
    setTimeout(() => populateMobileExamSelect(), 1000);
    
    console.log("✅ Mobile topbar setup (select sẽ được update sau)");
}

function populateMobileExamSelect() {
    const examSelect = document.getElementById('selectExam');
    const mobileSelect = document.getElementById('mobileExamSelect');
    
    if (!examSelect || !mobileSelect) return;
    
    // Kiểm tra xem examSelect đã có data chưa
    if (examSelect.options.length <= 1) {
        console.log('⏳ Chưa có data, thử lại sau...');
        setTimeout(populateMobileExamSelect, 500);
        return;
    }
    
    // Clear mobile select
    mobileSelect.innerHTML = '';
    mobileSelect.disabled = false;
    
    // Copy options từ examSelect
    Array.from(examSelect.options).forEach(option => {
        const newOption = new Option(option.text, option.value);
        newOption.selected = option.selected;
        mobileSelect.appendChild(newOption);
    });
    
    // Đồng bộ sự kiện
    mobileSelect.addEventListener('change', function() {
        examSelect.value = this.value;
        examSelect.dispatchEvent(new Event('change'));
    });
    
    // Đồng bộ ngược lại
    examSelect.addEventListener('change', function() {
        mobileSelect.value = this.value;
    });
    
    console.log(`✅ Mobile select populated with ${examSelect.options.length} options`);
}
// ===== ẨN DESKTOP CONTROLS =====
function hideDesktopControls() {
    const desktopControls = document.querySelector('.desktop-controls');
    if (desktopControls) {
        desktopControls.style.display = 'none';
        console.log("✅ Đã ẩn desktop controls");
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
        
        // Đóng menu khi click bên ngoài
        document.addEventListener('click', function(e) {
            if (!mobileControls.contains(e.target) && 
                !hamburgerBtn.contains(e.target) &&
                mobileControls.classList.contains('active')) {
                mobileControls.classList.remove('active');
            }
        });
        
        // Ngăn click trong menu lan ra ngoài
        mobileControls.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        console.log("✅ Đã thiết lập toggle menu");
    }
}

// ===== HANDLE RESIZE =====
function handleResize() {
    const isMobileNow = window.innerWidth <= 768;
    const wasMobile = document.getElementById('hamburgerBtn') !== null;
    
    if (isMobileNow && !wasMobile) {
        // Chuyển sang mobile
        console.log("📱 Chuyển sang chế độ mobile");
        createHamburgerMenu();
        createMobileControls();
        setupMobileTopbar();
        hideDesktopControls();
        setupMenuToggle();
    } else if (!isMobileNow && wasMobile) {
        // Chuyển sang desktop
        console.log("🖥️ Chuyển sang chế độ desktop");
        
        // Hiện lại desktop controls
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
        
        // Xóa mobile topbar actions
        const mobileActions = document.getElementById('mobileTopbarActions');
        if (mobileActions) {
            mobileActions.remove();
        }
        
        // Xóa hamburger button
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        if (hamburgerBtn) {
            hamburgerBtn.remove();
        }
    }
}

// ===== IMPROVE MATHJAX MOBILE DISPLAY =====
function improveMathJaxMobile() {
    // Hàm xử lý MathJax overflow
    function handleMathJaxOverflow() {
        // Chờ MathJax render xong
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise().then(() => {
                // Thêm class cho các container MathJax
                document.querySelectorAll('mjx-container').forEach(container => {
                    if (container.scrollWidth > container.clientWidth) {
                        container.style.overflowX = 'auto';
                        container.style.overflowY = 'hidden';
                        container.style.maxWidth = '100%';
                        container.style.display = 'block !important';
                    }
                });
                
                // Xử lý solution boxes
                document.querySelectorAll('.solution-content').forEach(solution => {
                    solution.style.overflowX = 'auto';
                    solution.style.maxWidth = '100%';
                    
                    // Thêm indicator scroll cho mobile
                    if (window.innerWidth <= 768) {
                        solution.setAttribute('data-scrollable', 'true');
                    }
                });
            });
        }
    }
    
    // Gọi khi trang load xong
    window.addEventListener('load', handleMathJaxOverflow);
    
    // Gọi khi resize window
    window.addEventListener('resize', function() {
        setTimeout(handleMathJaxOverflow, 300);
    });
    
    // Gọi khi có thay đổi nội dung
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

// Khởi tạo menu toggle sau khi tạo xong các phần tử
setTimeout(() => {
    if (window.innerWidth <= 768) {
        setupMenuToggle();
    }
}, 100);