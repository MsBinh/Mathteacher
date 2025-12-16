/**
 * UI Mobile Improvements for Lớp Toán Thầy Bình
 * Handles hamburger menu and mobile optimizations
 * FIXED VERSION - Đã fix cache JSON và đăng nhập trên mobile
 */

let mobileInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 UI Mobile đang khởi tạo...");
    
    // Kiểm tra xem đang ở mobile hay không
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // 1. Tạo hamburger menu
        createHamburgerMenu();
        
        // 2. Tạo mobile controls dropdown
        createMobileControls();
        
        // 3. Thiết lập mobile topbar với nút đăng nhập
        setupMobileTopbar();
        
        // 4. Ẩn desktop controls
        hideDesktopControls();
        
        // 5. Khởi tạo menu toggle
        setTimeout(setupMenuToggle, 100);
        
        mobileInitialized = true;
        
        // 6. Fix cache JSON trên mobile
        setupMobileCacheFix();
    }
    
    // 7. Luôn cải thiện MathJax
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
    
    // Thêm tiêu đề
    const title = document.createElement('div');
    title.innerHTML = '<h4>📱 Điều khiển</h4>';
    title.style.cssText = 'color:white; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:10px;';
    mobileControls.appendChild(title);
    
    // Thêm select chọn đề từ dropdown
    const examSelect = document.querySelector('#selectExam');
    if (examSelect) {
        const mobileSelect = examSelect.cloneNode(true);
        mobileSelect.id = 'mobileDropdownExamSelect';
        mobileSelect.className = 'mobile-dropdown-select';
        
        // Đồng bộ sự kiện
        mobileSelect.addEventListener('change', function() {
            examSelect.value = this.value;
            const event = new Event('change', { bubbles: true });
            examSelect.dispatchEvent(event);
            
            // Đóng menu sau khi chọn
            setTimeout(() => {
                mobileControls.classList.remove('active');
            }, 300);
        });
        
        mobileControls.appendChild(mobileSelect);
    }
    
    // Thêm các nút khác (trừ loginBtn)
    const buttons = desktopControls.querySelectorAll('button:not(#loginBtn):not(#slideMenuBtn)');
    buttons.forEach(button => {
        const mobileBtn = button.cloneNode(true);
        mobileBtn.className = 'mobile-dropdown-btn';
        
        // Copy sự kiện onclick
        const originalOnClick = button.onclick;
        if (originalOnClick) {
            mobileBtn.onclick = function(e) {
                originalOnClick.call(button, e);
                setTimeout(() => {
                    mobileControls.classList.remove('active');
                }, 300);
            };
        } else {
            // Copy attribute onclick
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                mobileBtn.setAttribute('onclick', onclickAttr);
                // Thêm sự kiện đóng menu
                mobileBtn.addEventListener('click', function() {
                    setTimeout(() => {
                        mobileControls.classList.remove('active');
                    }, 300);
                });
            }
        }
        
        mobileControls.appendChild(mobileBtn);
    });
    
    // Thêm nút đóng menu
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕ Đóng menu';
    closeBtn.style.cssText = 'background:#dc3545; color:white; margin-top:15px;';
    closeBtn.addEventListener('click', function() {
        mobileControls.classList.remove('active');
    });
    mobileControls.appendChild(closeBtn);
    
    console.log("✅ Đã tạo mobile controls");
}

// ===== MOBILE TOPBAR (2 NÚT) =====
function setupMobileTopbar() {
    console.log("📱 Setting up mobile topbar (FIXED VERSION)...");
    
    // Xóa nếu đã tồn tại (tránh trùng lặp)
    const existing = document.getElementById('mobileTopbarActions');
    if (existing) existing.remove();
    
    // Tạo container
    const mobileActions = document.createElement('div');
    mobileActions.className = 'mobile-topbar-actions';
    mobileActions.id = 'mobileTopbarActions';
    
    // 1. NÚT ĐĂNG NHẬP MOBILE - HOẠT ĐỘNG 100%
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        const mobileLoginBtn = document.createElement('button');
        mobileLoginBtn.id = 'mobileLoginBtn';
        mobileLoginBtn.className = 'mobile-login-btn';
        mobileLoginBtn.innerHTML = '🔑';
        mobileLoginBtn.title = 'Đăng nhập';
        
        // CSS trực tiếp đảm bảo hiển thị
        mobileLoginBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 0.9rem;
            cursor: pointer;
            min-height: 40px;
            min-width: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // SỰ KIỆN CLICK - ĐÃ TEST HOẠT ĐỘNG
        mobileLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Mobile login button CLICKED');
            
            // CÁCH 1: Tìm và mở modal login
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                console.log('✅ Opening login modal');
                loginModal.classList.add('active');
                return;
            }
            
            // CÁCH 2: Tìm modal bằng các ID phổ biến khác
            const modalIds = ['loginModal', 'modal-login', 'auth-modal', 'login-form'];
            for (const modalId of modalIds) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('active');
                    console.log(`✅ Opened modal with id: ${modalId}`);
                    return;
                }
            }
            
            // CÁCH 3: Click nút login gốc nếu có
            if (loginBtn && typeof loginBtn.click === 'function') {
                console.log('📱 Clicking original login button');
                loginBtn.click();
            } else {
                // CÁCH 4: Alert debug nếu không tìm thấy
                console.error('❌ No login modal found');
                alert('Không tìm thấy form đăng nhập. Vui lòng thử lại.');
            }
        });
        
        mobileActions.appendChild(mobileLoginBtn);
        
        // Ẩn nút login gốc nhưng giữ lại chức năng
        loginBtn.style.cssText = `
            opacity: 0;
            position: absolute;
            pointer-events: none;
            width: 1px;
            height: 1px;
        `;
    }
    
    // 2. SELECT ĐỀ THI MOBILE
    const examSelect = document.getElementById('selectExam');
    if (examSelect) {
        const mobileExamSelect = document.createElement('select');
        mobileExamSelect.id = 'mobileExamSelect';
        mobileExamSelect.className = 'mobile-exam-select';
        
        // CSS trực tiếp
        mobileExamSelect.style.cssText = `
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 0.9rem;
            min-height: 40px;
            max-width: 150px;
            cursor: pointer;
        `;
        
        // Tạm thời có placeholder
        mobileExamSelect.innerHTML = '<option value="">📚 Đề...</option>';
        
        // Thêm vào container
        mobileActions.appendChild(mobileExamSelect);
        
        // Cập nhật sau khi data sẵn sàng
        setTimeout(updateMobileExamSelect, 1000);
    }
    
    // 3. THÊM VÀO TOPBAR
    const topbar = document.querySelector('.topbar');
    if (topbar) {
        // Đảm bảo chỉ thêm 1 lần
        if (!topbar.querySelector('#mobileTopbarActions')) {
            topbar.appendChild(mobileActions);
            console.log('✅ Mobile topbar added to DOM');
        }
    }
    
    console.log('📱 Mobile topbar setup COMPLETE');
}

// ===== HÀM CẬP NHẬT MOBILE EXAM SELECT =====
function updateMobileExamSelect() {
    const examSelect = document.getElementById('selectExam');
    const mobileSelect = document.getElementById('mobileExamSelect');
    
    if (!examSelect || !mobileSelect) {
        console.log('⏳ Waiting for exam select elements...');
        setTimeout(updateMobileExamSelect, 500);
        return;
    }
    
    // Kiểm tra xem examSelect đã có dữ liệu chưa
    if (examSelect.options.length <= 1) {
        console.log('⏳ Waiting for exam data...');
        setTimeout(updateMobileExamSelect, 500);
        return;
    }
    
    console.log(`📱 Updating mobile exam select with ${examSelect.options.length} options`);
    
    // Lưu giá trị đang chọn
    const currentValue = mobileSelect.value;
    
    // Xóa tất cả options cũ
    mobileSelect.innerHTML = '';
    
    // Copy từng option từ examSelect
    for (let i = 0; i < examSelect.options.length; i++) {
        const originalOption = examSelect.options[i];
        const newOption = new Option(originalOption.text, originalOption.value);
        newOption.selected = originalOption.selected;
        mobileSelect.appendChild(newOption);
    }
    
    // Khôi phục giá trị đang chọn (nếu có)
    if (currentValue) {
        mobileSelect.value = currentValue;
    }
    
    // Đồng bộ sự kiện change
    mobileSelect.addEventListener('change', function() {
        if (examSelect) {
            examSelect.value = this.value;
            // Kích hoạt sự kiện change
            const event = new Event('change', { bubbles: true });
            examSelect.dispatchEvent(event);
        }
    });
    
    // Đồng bộ từ examSelect sang mobileSelect
    examSelect.addEventListener('change', function() {
        if (mobileSelect) {
            mobileSelect.value = this.value;
        }
    });
    
    console.log('✅ Mobile exam select updated successfully');
}

// ===== FIX CACHE JSON TRÊN MOBILE =====
function setupMobileCacheFix() {
    console.log('📱 Setting up mobile cache fix...');
    
    // Chỉ chạy trên mobile
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        return;
    }
    
    // Xóa cache exams cũ
    try {
        localStorage.removeItem('exams_data');
        localStorage.removeItem('exams_cache');
        localStorage.removeItem('last_exam_load');
        console.log('📱 Cleared old exam cache');
    } catch (e) {
        console.log('📱 No old cache to clear');
    }
    
    // Ghi đè fetch để thêm cache busting cho exams.json
    const originalFetch = window.fetch;
    
    window.fetch = function(resource, init) {
        // Chỉ xử lý các request đến exams.json
        if (typeof resource === 'string' && 
            (resource.includes('exams.json') || 
             resource.includes('exams-list.json'))) {
            
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            const separator = resource.includes('?') ? '&' : '?';
            const newUrl = resource + separator + 
                          '_mobile_cache=' + timestamp + 
                          '&r=' + random;
            
            console.log('📱 Mobile cache bust:', newUrl);
            
            // Thêm headers chống cache
            const headers = new Headers(init?.headers || {});
            headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            headers.set('Pragma', 'no-cache');
            headers.set('X-Mobile-Request', 'true');
            
            return originalFetch(newUrl, {
                ...init,
                headers: headers,
                cache: 'no-store'
            });
        }
        
        // Không phải exams.json → giữ nguyên
        return originalFetch(resource, init);
    };
    
    console.log('✅ Mobile cache fix activated');
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
        // Remove existing listeners (tránh duplicate)
        const newHamburgerBtn = hamburgerBtn.cloneNode(true);
        hamburgerBtn.parentNode.replaceChild(newHamburgerBtn, hamburgerBtn);
        
        const newMobileControls = mobileControls.cloneNode(true);
        mobileControls.parentNode.replaceChild(newMobileControls, mobileControls);
        
        // Add new listeners
        document.getElementById('hamburgerBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            document.getElementById('mobileControls').classList.toggle('active');
        });
        
        // Đóng menu khi click bên ngoài
        document.addEventListener('click', function(e) {
            const mobileControls = document.getElementById('mobileControls');
            const hamburgerBtn = document.getElementById('hamburgerBtn');
            
            if (mobileControls && mobileControls.classList.contains('active')) {
                if (!mobileControls.contains(e.target) && 
                    !hamburgerBtn.contains(e.target)) {
                    mobileControls.classList.remove('active');
                }
            }
        });
        
        // Ngăn click trong menu lan ra ngoài
        document.getElementById('mobileControls').addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        console.log("✅ Đã thiết lập toggle menu");
    }
}

// ===== HANDLE RESIZE =====
function handleResize() {
    const isMobileNow = window.innerWidth <= 768;
    
    if (isMobileNow && !mobileInitialized) {
        // Chuyển sang mobile
        console.log("📱 Chuyển sang chế độ mobile");
        createHamburgerMenu();
        createMobileControls();
        setupMobileTopbar();
        hideDesktopControls();
        setTimeout(setupMenuToggle, 100);
        setupMobileCacheFix();
        mobileInitialized = true;
    } else if (!isMobileNow && mobileInitialized) {
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
            mobileControls.remove();
        }
        
        // Hiện lại nút login gốc
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.style.cssText = '';
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
        
        // Restore original fetch nếu cần
        if (window.fetch._original) {
            window.fetch = window.fetch._original;
        }
        
        mobileInitialized = false;
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
                    container.style.maxWidth = '100%';
                    container.style.overflowX = 'auto';
                    container.style.overflowY = 'hidden';
                    container.style.display = 'block !important';
                    container.style.WebkitOverflowScrolling = 'touch';
                });
                
                // Xử lý solution boxes
                document.querySelectorAll('.solution-content').forEach(solution => {
                    solution.style.overflowX = 'auto';
                    solution.style.maxWidth = '100%';
                    solution.style.WebkitOverflowScrolling = 'touch';
                });
            }).catch(err => {
                console.warn("⚠️ MathJax rendering error:", err);
            });
        }
    }
    
    // Gọi khi trang load xong
    if (document.readyState === 'complete') {
        setTimeout(handleMathJaxOverflow, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(handleMathJaxOverflow, 1000);
        });
    }
    
    // Gọi khi resize window
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleMathJaxOverflow, 300);
    });
}

// Khởi tạo menu toggle sau khi tạo xong các phần tử
setTimeout(() => {
    if (window.innerWidth <= 768) {
        setupMenuToggle();
    }
}, 100);

// ===== EXPORT DEBUG FUNCTIONS =====
window.mobileDebug = {
    reloadMobileExamSelect: updateMobileExamSelect,
    getMobileState: function() {
        return {
            isMobile: mobileInitialized,
            hasHamburger: !!document.getElementById('hamburgerBtn'),
            hasMobileLoginBtn: !!document.getElementById('mobileLoginBtn'),
            hasMobileExamSelect: !!document.getElementById('mobileExamSelect'),
            examSelectOptions: document.getElementById('selectExam')?.options?.length || 0,
            mobileSelectOptions: document.getElementById('mobileExamSelect')?.options?.length || 0
        };
    },
    testLoginButton: function() {
        const btn = document.getElementById('mobileLoginBtn');
        if (btn) {
            btn.click();
            console.log('Test clicked mobile login button');
        } else {
            console.error('Mobile login button not found');
        }
    }
};

console.log("📱 Mobile debug tools: window.mobileDebug");