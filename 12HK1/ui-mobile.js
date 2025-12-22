/**
 * UI Mobile Tối Giản cho Lớp Toán Thầy Bình
 * Tạo một thanh công cụ cố định ở cuối màn hình với 3 chức năng chính:
 * 1. Đăng nhập
 * 2. Chọn đề
 * 3. Tính điểm
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 Khởi tạo UI Mobile Tối Giản...");

    // Chỉ chạy trên thiết bị di động
    if (window.innerWidth > 768) {
        return;
    }

    // Ẩn các thành phần không cần thiết của phiên bản máy tính
    hideDesktopComponents();
    
    // Tạo thanh công cụ di động
    createMobileToolbar();

    // Lắng nghe các thay đổi để cập nhật giao diện
    observeLoginChanges();
});

/**
 * Ẩn các nút và thanh công cụ của phiên bản máy tính
 */
function hideDesktopComponents() {
    const desktopControls = document.querySelector('.desktop-controls');
    if (desktopControls) {
        desktopControls.style.display = 'none';
    }

    const topbarTitle = document.querySelector('.topbar-title');
    if (topbarTitle) {
        topbarTitle.style.fontSize = '1.1rem'; // Thu nhỏ tiêu đề cho gọn
    }
}

/**
 * Tạo thanh công cụ cố định ở cuối màn hình
 */
function createMobileToolbar() {
    // Kiểm tra xem thanh công cụ đã tồn tại chưa
    if (document.getElementById('mobile-toolbar')) {
        return;
    }
    
    const toolbar = document.createElement('div');
    toolbar.id = 'mobile-toolbar';
    
    // CSS cho thanh công cụ
    toolbar.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 60px;
        background-color: #1a237e;
        color: white;
        display: flex;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
        z-index: 999;
    `;
    
    // === NÚT 1: ĐĂNG NHẬP / THÔNG TIN NGƯỜI DÙNG ===
    const loginButton = document.createElement('button');
    loginButton.id = 'mobile-login-btn';
    loginButton.innerHTML = '🔑<br><span>Đăng nhập</span>';
    loginButton.onclick = () => {
        // Gọi trực tiếp hàm hiển thị modal đăng nhập đã có trong indexb.html
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('active');
        }
    };
    
    // === NÚT 2: CHỌN ĐỀ ===
    // Nút này sẽ là một select dropdown
    const examSelect = document.createElement('select');
    examSelect.id = 'mobile-exam-select';
    examSelect.innerHTML = '<option value="">📚 Chọn đề</option>';
    examSelect.onchange = () => {
        // Tìm đến select gốc và kích hoạt sự kiện change
        const originalSelect = document.getElementById('selectExam');
        if (originalSelect) {
            originalSelect.value = examSelect.value;
            originalSelect.dispatchEvent(new Event('change'));
        }
    };
    
    // === NÚT 3: TÍNH ĐIỂM ===
    const scoreButton = document.createElement('button');
    scoreButton.id = 'mobile-score-btn';
    scoreButton.innerHTML = '📊<br><span>Tính điểm</span>';
    scoreButton.onclick = () => {
        // Gọi trực tiếp hàm tính điểm đã có trong indexb.html
        if (window.calculateFinalScore) {
            window.calculateFinalScore();
        } else {
            alert("Lỗi: Không tìm thấy chức năng tính điểm.");
        }
    };
    
    // CSS chung cho các nút trên thanh công cụ
    [loginButton, scoreButton, examSelect].forEach(el => {
        el.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 10px;
            text-align: center;
            flex: 1;
            height: 100%;
            cursor: pointer;
            padding: 5px;
        `;
        if (el.tagName === 'BUTTON') {
             el.style.fontSize = '20px'; // Icon to hơn
        }
        if (el.tagName === 'SELECT') {
            el.style.backgroundColor = '#3949ab';
            el.style.borderRadius = '5px';
            el.style.fontSize = '14px';
            el.style.maxWidth = '40%';
        }
    });
    
    toolbar.appendChild(loginButton);
    toolbar.appendChild(examSelect);
    toolbar.appendChild(scoreButton);
    
    document.body.appendChild(toolbar);
    
    // Thêm khoảng đệm ở cuối trang để nội dung không bị thanh công cụ che mất
    document.body.style.paddingBottom = '70px';

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
        setTimeout(updateMobileExamList, 500); // Thử lại sau 0.5s
        return;
    }
    
    // Chờ cho danh sách đề thi gốc được tải xong
    if (originalSelect.options.length <= 1) {
        setTimeout(updateMobileExamList, 500); // Thử lại
        return;
    }
    
    // Sao chép tất cả các tùy chọn
    mobileSelect.innerHTML = ''; // Xóa các tùy chọn cũ
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
    
    // Sử dụng MutationObserver để theo dõi sự thay đổi nội dung của nút gốc
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mobileLoginBtn) {
                // Lấy tên người dùng từ nút gốc (ví dụ: "👨‍🏫 Thầy Bình" hoặc "👤 Nguyễn Văn A")
                const userNameText = loginBtn.innerText;
                if (userNameText && userNameText.length > 2) {
                    // Cập nhật nút mobile với tên và icon
                    mobileLoginBtn.innerHTML = `👤<br><span style="font-size: 10px;">${userNameText.substring(2)}</span>`;
                    mobileLoginBtn.onclick = null; // Vô hiệu hóa việc mở lại modal
                    mobileLoginBtn.style.cursor = 'default';
                }
            }
        });
    });
    
    observer.observe(loginBtn, { childList: true, characterData: true, subtree: true });
}