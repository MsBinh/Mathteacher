/**
 * UI Mobile Tối Giản cho Lớp Toán Thầy Bình (V6 - Top Bar)
 * - Phiên bản hoạt động tốt, đã được di chuyển lên top bar.
 * - Xóa tiêu đề và đặt 3 nút chức năng chính lên trên cùng.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 Khởi tạo UI Mobile Tối Giản (Top Bar)...");

    // Chỉ chạy trên thiết bị di động
    if (window.innerWidth > 768) {
        return;
    }

    // Ẩn các thành phần không cần thiết của phiên bản máy tính
    hideDesktopComponents();
    
    // Tạo thanh công cụ di động mới trên top bar
    createMobileTopbar();

    // Lắng nghe các thay đổi để cập nhật giao diện
    observeLoginChanges();
});

/**
 * Ẩn các nút và thanh công cụ của phiên bản máy tính
 */
function hideDesktopComponents() {
    // Ẩn toàn bộ top bar gốc để thay thế bằng cái mới
    const originalTopbar = document.querySelector('.topbar');
    if (originalTopbar) {
        originalTopbar.style.display = 'none';
    }
}

/**
 * Tạo thanh công cụ cố định mới ở đầu màn hình
 */
function createMobileTopbar() {
    // Kiểm tra xem thanh công cụ đã tồn tại chưa
    if (document.getElementById('mobile-topbar')) {
        return;
    }
    
    const topbar = document.createElement('div');
    topbar.id = 'mobile-topbar';
    
    // === CSS ĐÃ SỬA ĐỔI ĐỂ NẰM TRÊN CÙNG ===
    topbar.style.cssText = `
        position: fixed;
        top: 0; /* THAY ĐỔI TỪ 'bottom' SANG 'top' */
        left: 0;
        width: 100%;
        height: 55px; /* Giảm chiều cao một chút cho gọn */
        background-color: #1a237e;
        color: white;
        display: flex;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); /* Đổi hướng shadow */
        z-index: 999;
        gap: 10px; /* Thêm khoảng cách giữa các nút */
        padding: 0 10px; /* Thêm padding ngang */
    `;
    
    // === NÚT 1: ĐĂNG NHẬP / THÔNG TIN NGƯỜI DÙNG ===
    const loginButton = document.createElement('button');
    loginButton.id = 'mobile-login-btn';
    loginButton.innerHTML = '🔑<br><span style="font-size: 10px;">Đ.Nhập</span>';
    loginButton.onclick = () => {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('active');
        }
    };
    
    // === NÚT 2: CHỌN ĐỀ ===
    const examSelect = document.createElement('select');
    examSelect.id = 'mobile-exam-select';
    examSelect.innerHTML = '<option value="">📚 Chọn đề</option>';
    examSelect.onchange = () => {
        const originalSelect = document.getElementById('selectExam');
        if (originalSelect) {
            originalSelect.value = examSelect.value;
            originalSelect.dispatchEvent(new Event('change'));
        }
    };
    
    // === NÚT 3: TÍNH ĐIỂM ===
    const scoreButton = document.createElement('button');
    scoreButton.id = 'mobile-score-btn';
    scoreButton.innerHTML = '📊<br><span style="font-size: 10px;">Tính Điểm</span>';
    scoreButton.onclick = () => {
        if (window.calculateFinalScore) {
            window.calculateFinalScore();
        } else {
            alert("Lỗi: Không tìm thấy chức năng tính điểm.");
        }
    };
    
    // CSS chung cho các nút trên thanh công cụ
    [loginButton, scoreButton].forEach(el => {
        el.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            text-align: center;
            height: 100%;
            cursor: pointer;
            padding: 5px;
            flex-shrink: 0; /* Không bị co lại */
        `;
    });
    
    examSelect.style.cssText = `
        background-color: #3949ab;
        color: white;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        font-size: 14px;
        padding: 8px;
        height: 40px;
        flex-grow: 1; /* Chiếm không gian còn lại */
        text-align: center;
    `;
    
    topbar.appendChild(loginButton);
    topbar.appendChild(examSelect);
    topbar.appendChild(scoreButton);
    
    // Thêm top bar mới vào body
    document.body.prepend(topbar); // Dùng prepend để nó nằm ở đầu
    
    // === THAY ĐỔI QUAN TRỌNG: THÊM PADDING-TOP CHO BODY ===
    // Thêm khoảng đệm ở đầu trang để nội dung không bị top bar mới che mất
    document.body.style.paddingTop = '60px';

    // Cập nhật danh sách đề thi cho select mobile
    updateMobileExamList();
}

/**
 * Đồng bộ danh sách đề thi từ select gốc sang select mobile
 */
function updateMobileExamList() {
    const originalSelect = document.getElementById('selectExam');
    const mobileSelect = document.getElementById('mobile-exam-select');

    if (!originalSelect || !mobileSelect) {
        setTimeout(updateMobileExamList, 500);
        return;
    }
    
    if (originalSelect.options.length <= 1) {
        setTimeout(updateMobileExamList, 500);
        return;
    }
    
    mobileSelect.innerHTML = '';
    for (const option of originalSelect.options) {
        mobileSelect.add(option.cloneNode(true));
    }
    
    console.log("✅ Danh sách đề thi trên di động đã được cập nhật.");
}

/**
 * Theo dõi trạng thái đăng nhập để cập nhật nút "Đăng nhập"
 */
function observeLoginChanges() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) {
        setTimeout(observeLoginChanges, 500);
        return;
    }
    
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    
    const observer = new MutationObserver(() => {
        if (mobileLoginBtn) {
            const userNameText = loginBtn.innerText;
            if (userNameText && (userNameText.includes('👨‍🏫') || userNameText.includes('👤'))) {
                mobileLoginBtn.innerHTML = `👤<br><span style="font-size: 10px;">${userNameText.substring(2)}</span>`;
                mobileLoginBtn.onclick = null;
                mobileLoginBtn.style.cursor = 'default';
            }
        }
    });
    
    observer.observe(loginBtn, { childList: true, characterData: true, subtree: true });
}