# Hướng dẫn thiết lập Firebase

## Vấn đề hiện tại
Firebase project hiện tại (`daytoantructuyen-149d9`) có vẻ đã bị xóa hoặc config không đúng, gây ra lỗi:
- `CONFIGURATION_NOT_FOUND`
- Không thể kết nối Firebase Auth

## Giải pháp: Tạo Firebase project mới

### Bước 1: Tạo Firebase project mới
1. Truy cập https://console.firebase.google.com/
2. Nhấn "Create a project" hoặc "Tạo dự án"
3. Đặt tên project (ví dụ: `lop-toan-thay-binh-2025`)
4. Chọn "Continue" và cấu hình Google Analytics nếu muốn

### Bước 2: Thêm Web App
1. Trong project mới, nhấn biểu tượng `</>` (Add Web App)
2. Đặt tên app (ví dụ: `Lop Toan Thay Binh`)
3. **Quan trọng**: Đừng tích chọn "Also set up Firebase Hosting"
4. Nhấn "Register app"

### Bước 3: Sao chép Firebase config
Sau khi tạo app, bạn sẽ thấy Firebase config như sau:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // API key mới
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "your-project-id", // Project ID mới
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### Bước 4: Cập nhật config.js
1. Mở file `css/js/config.js`
2. Thay thế `firebaseConfig` cũ bằng config mới từ Bước 3
3. Lưu file

### Bước 5: Kích hoạt Realtime Database
1. Trong Firebase Console, chọn "Realtime Database" từ menu bên trái
2. Nhấn "Create database"
3. Chọn "Start in test mode" (để cho phép truy cập công khai tạm thời)
4. Chọn region "asia-southeast1" (Singapore) để tối ưu performance
5. Nhấn "Done"

### Bước 6: Kích hoạt Authentication (tùy chọn)
1. Chọn "Authentication" từ menu bên trái
2. Nhấn "Get started"
3. Chọn "Email/Password" làm phương thức đăng nhập
4. Nhấn "Enable"

### Bước 7: Test kết nối
1. Mở `http://127.0.0.1:5500/test.html` để test
2. Nếu thấy "✅ Firebase Database đã kết nối thành công!" thì thành công

## Cấu trúc Database Firebase

Sau khi kết nối thành công, Database sẽ có cấu trúc như sau:
```
your-project-id-default-rtdb/
├── classes/          # Thông tin lớp học
├── students/         # Thông tin học sinh
├── exams/           # Bài thi và kết quả
├── polls/           # Khảo sát
├── interactions/    # Tương tác real-time
└── progress/        # Tiến độ học tập
```

## Lưu ý quan trọng
- **Bảo mật**: Trong production, nên cấu hình Security Rules cho Database thay vì "test mode"
- **Backup**: Thường xuyên backup dữ liệu quan trọng
- **Monitoring**: Theo dõi usage trong Firebase Console để tránh vượt quota free

## Troubleshooting
- Nếu vẫn gặp lỗi, kiểm tra Console Browser (F12) để xem lỗi chi tiết
- Đảm bảo API key và project ID chính xác
- Kiểm tra kết nối internet