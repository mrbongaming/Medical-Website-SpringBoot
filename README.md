# Đồ án website đặt lịch khám

Giao diện React tham khảo Medpro và backend Spring Boot đang chờ triển khai nghiệp vụ y tế.

- [Kế hoạch hoàn thiện, danh sách chức năng còn thiếu, service, API và database](docs/KE_HOACH_DO_AN.md)
- [Chạy frontend](frontend/README.md)
- [Chạy backend](backend/README.md)

## Hiện trạng

Frontend có các trang cơ sở y tế, bác sĩ, dịch vụ, đặt khám mẫu, tin tức, hướng dẫn và liên hệ. Dữ liệu hiện là local/mock; chưa tạo lịch hẹn hay gửi yêu cầu thực tế.

Backend còn application, cấu hình CORS và test khởi động. Bộ API Product mẫu đã xóa; chưa có API nghiệp vụ hoặc database.

## Chạy nhanh

Frontend:

```powershell
cd frontend
npm ci
npm run dev
```

Backend, mở terminal riêng:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Chạy npm trong frontend, Maven trong backend. Không có package npm ở thư mục gốc.

Phạm vi đề xuất tiếp theo: danh mục từ DB → lịch khả dụng → đặt/tra cứu/hủy phiếu → quản trị. Bệnh nhân không cần đăng nhập; xác thực quản trị là phần đề xuất, chưa triển khai.
