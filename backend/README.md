# Backend Spring Boot

Backend của hệ thống An Tâm dùng Java, Spring Boot, Spring Data JPA, Flyway, Spring Security và MySQL/MariaDB do XAMPP cung cấp. Phiên bản, host và cổng database do người chạy dự án cấu hình; Spring Boot không tự seed dữ liệu.

## Khởi tạo database một lần

1. Mở XAMPP Control Panel và bật **MySQL**.
2. Mở phpMyAdmin, chọn **Import** và nhập file [`database/antam_mysql.sql`](database/antam_mysql.sql).
3. Chỉ import vào database local trống. File đã gồm `CREATE DATABASE antam`, toàn bộ bảng, khóa ngoại và dữ liệu mock schema v7.

Nếu `mysql.exe` có trong PATH, có thể import bằng Command Prompt từ thư mục `backend`:

```bat
mysql -u root -p < database\antam_mysql.sql
```

Nếu tài khoản MySQL không có mật khẩu, bỏ tùy chọn `-p`. Không chạy lại file trên database đã phát sinh dữ liệu.

File SQL được tạo từ `frontend/src/data/mockData.js`. Khi mock data hoặc schema thay đổi, maintainer chạy `npm run export:mysql-bootstrap` trong `frontend/` rồi review lại file SQL. Đây là lệnh build artifact, không kết nối MySQL và không import dữ liệu.

## Chạy bằng Command Prompt

Mở **Command Prompt** (`cmd.exe`) tại thư mục gốc dự án rồi chạy:

```bat
cd /d C:\Users\Admin\Desktop\j2ee\website-Build-solo\backend
mvnw.cmd test
set "DB_URL=jdbc:mysql://localhost:3306/antam?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh"
set "DB_USERNAME=root"
set "DB_PASSWORD="
set "SERVER_PORT=8080"
set "CORS_ALLOWED_ORIGINS=http://localhost:5173"
mvnw.cmd spring-boot:run
```

Thay host, cổng, username và password bằng cấu hình XAMPP trên máy. Các lệnh `set` chỉ có hiệu lực trong cửa sổ Command Prompt hiện tại.

Biến môi trường hỗ trợ:

| Biến                   | Bắt buộc | Ý nghĩa                                    |
| ---------------------- | -------- | ------------------------------------------ |
| `DB_URL`               | Có       | JDBC URL tới MySQL/MariaDB của XAMPP       |
| `DB_USERNAME`          | Có       | Tài khoản database                         |
| `DB_PASSWORD`          | Tùy máy  | Mật khẩu database                          |
| `SERVER_PORT`          | Không    | Cổng HTTP của Spring Boot; mặc định `8080` |
| `CORS_ALLOWED_ORIGINS` | Không    | Danh sách origin, phân cách bằng dấu phẩy  |

Điền host, cổng và tài khoản theo cấu hình XAMPP trên máy của bạn. Dự án không cố định phiên bản hoặc cổng MySQL trong README.

## Đổi cổng

### Đổi cổng Spring Boot

Đặt `SERVER_PORT` trước khi chạy ứng dụng. Ví dụ chuyển backend sang cổng `8081`:

```bat
set "SERVER_PORT=8081"
mvnw.cmd spring-boot:run
```

Backend sau đó chạy tại `http://localhost:8081`. Có thể đổi giá trị mặc định trong `src/main/resources/application.properties` tại dòng:

```properties
server.port=${SERVER_PORT:8080}
```

### Đổi cổng MySQL/XAMPP

1. Trong XAMPP Control Panel, dừng MySQL.
2. Chọn **Config** của MySQL và mở `my.ini`.
3. Đổi giá trị `port` trong phần `[mysqld]`; nếu `[client]` có khai báo `port`, đổi sang cùng giá trị.
4. Lưu file và khởi động lại MySQL.
5. Cập nhật cổng tương ứng trong `DB_URL`.

Ví dụ MySQL dùng cổng `3307`:

```bat
set "DB_URL=jdbc:mysql://localhost:3307/antam?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh"
set "DB_USERNAME=root"
set "DB_PASSWORD="
mvnw.cmd spring-boot:run
```

Cổng MySQL nằm sau hostname trong JDBC URL (`localhost:3307`). Cổng Spring Boot được điều khiển riêng bằng `SERVER_PORT`; hai cổng không cần giống nhau.

Flyway quản lý schema cho database mới. `baseline-on-migrate=true` cho phép Spring Boot nhận database đã được tạo bằng file bootstrap mà không chạy lại migration V1. Hibernate chỉ dùng `ddl-auto=validate`.

Cột `password_hash` của tài khoản mock để `NULL`; file SQL không chứa mật khẩu dùng chung. Cần gán BCrypt hash bằng quy trình quản trị riêng trước khi dùng đăng nhập server.

## Cấu trúc source

Code được chia theo module nghiệp vụ. Mỗi module dùng các lớp con phù hợp:

```text
com.example.backend
├── appointment/{controller,dto,entity,repository,service}
├── auth/{controller,dto,model,service}
├── branch/{controller,dto,entity,repository,service}
├── doctor/{controller,dto,entity,repository,service}
├── specialty/{controller,dto,entity,repository,service}
├── exampackage/{controller,dto,entity,repository,service}
├── department/entity
├── medicalservice/entity
├── user/{entity,repository}
├── medicine/{entity,repository}
├── inventory/entity
├── schedule/entity
└── config
```

Mỗi aggregate có package riêng để có thể tìm controller, DTO, service, entity và repository theo đúng tên nghiệp vụ. Ví dụ, `BranchResponse` nằm trong `branch/dto`, còn `DoctorResponse` nằm trong `doctor/dto`; không dùng một package `facility` để gom các loại dữ liệu khác nhau.

- `controller`: nhận request, lấy principal và trả response.
- `dto`: request/response model của API, tách khỏi entity persistence.
- `service`: use case, nghiệp vụ và ranh giới transaction.
- `entity`: JPA entity ánh xạ database.
- `repository`: Spring Data repository.
- `model`: model xác thực hoặc model nội bộ không phải JPA entity.

## API hiện có

- `GET /api/public/branches`
- `GET /api/public/specialties`
- `GET /api/public/doctors`
- `GET /api/public/packages`
- `GET /api/auth/csrf`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/appointments`

Những endpoint ngoài `/api/public/**`, `/api/auth/csrf` và `/api/auth/login` yêu cầu session hợp lệ. API lịch hẹn lấy ID tài khoản từ principal phía server, không nhận `userId` từ query.

## Kiểm thử

```bat
mvnw.cmd test
```

Lệnh test biên dịch backend, khởi động HTTP server trên cổng ngẫu nhiên, kiểm tra API public, quyền truy cập, CSRF và tính đồng bộ giữa migration với file bootstrap. Test không kết nối hoặc ghi dữ liệu vào MySQL/XAMPP.
