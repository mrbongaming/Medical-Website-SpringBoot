# Kế hoạch cải thiện đồ án An Tâm

Kế hoạch được triển khai ngày 25/09/2026 theo sáu nhóm công việc đã thống nhất trong cuộc trò chuyện.

## Trạng thái triển khai

- [x] Chuẩn hóa stepper đặt lịch, tab báo cáo, khoảng cách và cách xuống dòng trong bảng quản trị.
- [x] Làm lại phân trang chung với tổng kết quả, số trang và lựa chọn 10/20/50 dòng.
- [x] Sửa phân trang danh mục 61 thuốc và nối bộ lọc tên, trạng thái, cơ sở vào tab cấu hình.
- [x] Bổ sung bộ lọc/phân trang danh mục dịch vụ trong cấu hình BHYT.
- [x] Thêm nhật ký theo phạm vi admin cơ sở/admin tổng và cảnh báo vận hành từ dữ liệu thực.
- [x] Thêm chương trình sức khỏe tháng này, kiến thức y tế và màn hình quản lý nội dung.
- [x] Hoàn thiện nội dung chi tiết bác sĩ, cơ sở, gói khám, mục lục sticky và khối đặt lịch sticky.
- [x] Chuyển danh sách public sang bộ lọc desktop sticky, giữ query string và phân trang.
- [x] Thêm migration schema v6 bảo toàn dữ liệu v1-v5.
- [x] Kiểm tra lint, format, domain, billing, inventory, build, browser và backend.

## Việc mở rộng sau bản này

- Chuyển dữ liệu và phân quyền sang Spring Boot/database để audit có tính bất biến phía server.
- Bổ sung workflow xác nhận/đóng cảnh báo nếu triển khai backend thật.
- Mở rộng quản lý phòng khám, đánh giá, nhà cung cấp, lô thuốc và hạn dùng khi có yêu cầu nghiệp vụ.
