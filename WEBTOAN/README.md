# 🧮 Hệ thống Lớp Toán Thầy Bình

Hệ thống dạy học Toán trực tuyến với tính năng đầy đủ: đề thi ma trận, tương tác real-time, bảng vẽ, quản lý lớp học.

## 🚀 Khởi chạy nhanh

1. **Khởi động server:**
   ```bash
   cd WEBTOAN
   python -m http.server 8080
   ```

2. **Truy cập:**
   - Mở trình duyệt: `http://localhost:8080`
   - Đăng nhập với mã bất kỳ (ví dụ: `HS12345`)
   - Chọn đề thi từ dropdown menu

## 📁 Cấu trúc thư mục

```
WEBTOAN/
├── index.html              # Trang chính
├── css/
│   ├── style.css          # CSS chính
│   └── js/
│       ├── config.js      # Firebase config
│       └── main.js        # Logic chính
├── data/                  # Dữ liệu đề thi
│   ├── chuong_ham_so.json # Ngân hàng câu hỏi Hàm số
│   ├── d3.json           # Đề thi tĩnh mẫu
│   ├── demo_exam.json    # Đề demo đơn giản
│   └── lessons/          # Bài giảng lý thuyết
├── matrix_exams.json      # Cấu hình danh sách đề
├── ui-mobile.js          # UI mobile enhancements
└── favicon.svg           # Icon trang web
```

## 📚 Các loại đề thi

### 1. Đề thi tĩnh (Static)
- File: `data/demo_exam.json`, `data/d3.json`
- Cách hoạt động: Load trực tiếp file JSON
- Ví dụ: "Đề Demo - Hàm Số Cơ Bản"

### 2. Đề thi ma trận (Matrix-based)
- File nguồn: `data/chuong_ham_so.json`
- Cách hoạt động: Tự động chọn câu theo ma trận phân bổ
- Ma trận: `p1_nb: 12, p2_th: 4, p3_vd: 6`
- Ví dụ: "Đề Minh Họa 2025 (Chuẩn Ma Trận)"

## 🎯 Tính năng chính

- ✅ Đề thi ma trận tự động
- ✅ Tương tác học sinh real-time
- ✅ Bảng vẽ canvas
- ✅ Quản lý lớp học
- ✅ Thống kê điểm số
- ✅ Khảo sát nhanh (Poll)
- ✅ Xuất PDF
- ✅ Chế độ tối/sáng

## 🔧 Firebase Setup (Tùy chọn)

Nếu muốn sử dụng tính năng real-time:

1. Tạo Firebase project tại https://console.firebase.google.com/
2. Sao chép config vào `css/js/config.js`
3. Kích hoạt Realtime Database
4. Deploy và test

## 📱 Sử dụng

1. **Giáo viên:**
   - Nhấn "🏫 Quản lý Lớp" để tạo lớp
   - Nhấn "🎓 Cấp Mã HS" để tạo mã học sinh
   - Nhấn "👁️ Theo dõi" để monitor học sinh
   - Nhấn "🗳️ Poll" để khảo sát nhanh

2. **Học sinh:**
   - Nhập mã học sinh đã được cấp
   - Chọn đề thi từ menu
   - Làm bài và xem kết quả real-time

## 🛠️ Phát triển

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Backend:** Firebase Realtime Database
- **Math rendering:** MathJax 3
- **Charts:** Chart.js
- **PDF export:** html2pdf.js

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
- Console Browser (F12) để xem lỗi
- Đảm bảo server đang chạy trên cổng 8080
- File JSON có định dạng đúng không

---

**🎓 Chúc bạn học tập hiệu quả với hệ thống Lớp Toán Thầy Bình!**