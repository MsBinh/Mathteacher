# Hướng dẫn phát triển — JSONDL (phiên bản mẫu)

Mục tiêu: cung cấp cấu trúc thư mục và dữ liệu mẫu để `indext.html` có thể chạy thử cục bộ.

- Cấu trúc chính trong thư mục `JSONDL/` (mẫu này):
  - `matrix_exams.json` — danh sách đề và nhóm (được trang tải lúc khởi tạo)
  - `data/` — chứa các đề tĩnh dạng JSON (mẫu: `demo_practice.json`, `demo_exam.json`)
  - `theory/` — chứa tài liệu lý thuyết (mẫu: `demo_ham_so.json`)
  - `db_map.json` — (tùy chọn) ánh xạ khóa → file

Chạy thử nhanh:
1. Mở file `JSONDL/indext.html` trong trình duyệt (double-click hoặc `Ctrl+O`).
2. Trang cố gắng kết nối Firebase; nếu kết nối thất bại thì sẽ tự dùng dữ liệu mẫu từ `matrix_exams.json`.
3. Trên giao diện, chọn nhóm -> chọn đề (ví dụ `Đề Luyện Tập Demo`) để tải dữ liệu mẫu.

Quy ước định dạng dữ liệu:
- `matrix_exams.json` chứa hai trường chính: `exams` (mảng đề) và `groups` (mảng nhóm).
- Mỗi object trong `exams` nên có các thuộc tính tối thiểu: `id`, `name`, `group`, `file`, `type`.
  - `file` là đường dẫn tương đối tới file JSON (ví dụ `data/my_exam.json` hoặc `theory/my_theory.json`).
- Đề tĩnh (`type: "static"`) có thể là một mảng câu hỏi trực tiếp hoặc object chứa `questions`.
- Kiểu câu hỏi hỗ trợ (theo triển khai trong `indext.html`):
  - `multiple_choice` — cần `options` (object {"A":"..."}) và `correct` (ví dụ "A").
  - `true_false` — cần `statements` (mảng) và `answers` (mảng boolean hoặc JSON string).
  - `short_answer` — cần `answer` (chuỗi) để so khớp đơn giản.

Thêm đề mới:
1. Tạo file JSON trong `data/` theo mẫu câu hỏi trên.
2. Thêm một mục tương ứng vào `matrix_exams.json` (hoặc cập nhật `db_map.json` nếu bạn dùng ánh xạ động).

Lưu ý phát triển:
- Trang đã nhúng phần lớn JS/CSS nội tuyến; khi muốn tổ chức lại, tách `script` ra `js/main.js` và CSS ra `css/style.css`, sửa đường dẫn trong `indext.html`.
- MathJax được tải từ CDN — giữ cấu hình nếu cần render công thức LaTeX.
- Firebase settings có sẵn trong file; để sử dụng thật, đảm bảo cấu hình đúng và bật Realtime DB.

Muốn tôi tách JS/CSS ra file riêng hoặc tạo script chạy local server (ví dụ `http-server`), cho biết yêu cầu và tôi sẽ thực hiện tiếp.

---
Generated: mẫu để chạy thử `indext.html`.
