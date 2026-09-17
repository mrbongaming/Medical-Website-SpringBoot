# Backend Spring Boot

Hiện có Spring Boot application, cấu hình CORS và test contextLoads. Chưa có API y tế, repository, database hoặc xác thực. API /products mẫu đã được xóa.

## Yêu cầu và chạy

pom.xml hiện sử dụng Java 25 và Spring Boot 4.1.0. Dùng Maven wrapper của dự án; lần chạy đầu có thể cần mạng để tải dependency.

Windows:

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Linux/macOS:

```sh
./mvnw test
./mvnw spring-boot:run
```

Mặc định server ở cổng 8080. Truy cập / hiện có thể trả 404 vì chưa có controller nghiệp vụ; frontend vẫn chạy độc lập.

CORS hiện chỉ cho http://localhost:5173. Khi nối API cần bổ sung origin thực tế nếu sử dụng 127.0.0.1 hoặc môi trường triển khai.

## Bước tiếp theo

Xem [kế hoạch hoàn thiện](../docs/KE_HOACH_DO_AN.md): chốt schema, thêm migration/seed, triển khai FacilityService trước rồi ScheduleService và AppointmentService.

Test contextLoads chỉ kiểm tra application khởi động; chưa có kiểm thử nghiệp vụ đặt lịch.
