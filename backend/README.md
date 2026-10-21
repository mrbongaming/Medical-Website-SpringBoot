# Backend microservice - Bệnh viện An Tâm

Backend dùng Java 25, Spring Boot 4.1, Spring Cloud Gateway, Spring Security,
Spring Data JPA, Spring Email và MySQL/MariaDB của XAMPP.

## Kiến trúc

| Service | Cổng | Database | Trách nhiệm |
| --- | ---: | --- | --- |
| `api-gateway` | 8080 | Không | Điểm vào duy nhất, route API và xử lý CORS |
| `auth-service` | 8081 | `antam_auth` | Đăng ký, đăng nhập, Google/Facebook OAuth2, phát JWT |
| `core-service` | 8082 | `antam_core` | Cơ sở, chuyên khoa, bác sĩ, gói khám và lịch khám |
| `notification-service` | 8083 | `antam_notification` | Gửi email bằng Spring Email và lưu trạng thái gửi |

Mỗi service nghiệp vụ sở hữu schema riêng trên cùng MySQL XAMPP. JWT được ký tại
`auth-service` và xác minh tại `core-service`. Khi đăng ký, `auth-service` gọi API
nội bộ của `notification-service` bằng khóa `X-Internal-Key` để gửi email chào mừng.

## 1. Cấu hình `.env` cho XAMPP

Bật **MySQL** trong XAMPP Control Panel. Tất cả câu lệnh trong tài liệu này được
thực hiện bằng **Command Prompt (`cmd.exe`)**, không phải PowerShell. Mở Command
Prompt rồi chuyển đến thư mục backend:

```bat
cd /d C:\Users\Admin\Desktop\practic\springboot\backend
copy .env.example .env
```

Với XAMPP mặc định (`root`, không có mật khẩu, cổng 3306), phần database trong
`.env` giữ nguyên như sau:

```dotenv
DB_USERNAME=root
DB_PASSWORD=
HIBERNATE_DIALECT=org.hibernate.dialect.MariaDBDialect
CORE_DB_URL=jdbc:mysql://localhost:3306/antam_core?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh
AUTH_DB_URL=jdbc:mysql://localhost:3306/antam_auth?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh
NOTIFICATION_DB_URL=jdbc:mysql://localhost:3306/antam_notification?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh
```

XAMPP hiển thị nút **MySQL** nhưng các bản hiện nay thường chạy MariaDB. Vì vậy ví
dụ đặt `HIBERNATE_DIALECT=org.hibernate.dialect.MariaDBDialect`; điều này cũng xử lý
đúng các cột JSON mà MariaDB biểu diễn dưới dạng `LONGTEXT`. Nếu bạn tự cài MySQL 8
thật, đổi thành `org.hibernate.dialect.MySQLDialect`.

Ví dụ nếu MySQL dùng cổng `3307`, tài khoản `antam_user`, mật khẩu `123456`, hãy đổi:

```dotenv
DB_USERNAME=antam_user
DB_PASSWORD=123456
CORE_DB_URL=jdbc:mysql://localhost:3307/antam_core?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh
AUTH_DB_URL=jdbc:mysql://localhost:3307/antam_auth?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh
NOTIFICATION_DB_URL=jdbc:mysql://localhost:3307/antam_notification?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh
```

Chạy duy nhất [`database/antam_mysql.sql`](database/antam_mysql.sql) trước khi
khởi động các service. Với XAMPP mặc định, chạy trong Command Prompt tại thư mục
`backend`:

```bat
C:\xampp\mysql\bin\mysql.exe -u root < database\antam_mysql.sql
```

File tạo ba schema `antam_core`, `antam_auth`, `antam_notification`, dữ liệu demo,
bác sĩ và quy tắc lịch làm việc nếu database còn trống.
Với MySQL, cần phiên bản 5.7.8 trở lên vì schema sử dụng kiểu `JSON` và cột sinh;
MySQL 8.0.16 trở lên thực thi các ràng buộc `CHECK`.

Nếu database đã có dữ liệu, chạy lại chính file này để cập nhật cấu trúc hồ sơ và
bổ sung đăng nhập mẫu còn thiếu. Phần khởi tạo dữ liệu demo sẽ được bỏ qua;
tài khoản và mật khẩu hiện có được giữ nguyên. Nên sao lưu database trước khi nâng cấp.
Nếu `notification-service` đã tạo `antam_notification.email_deliveries` bằng Flyway,
bảng đó cũng được giữ nguyên.

Nếu lần nhập trước dừng tại lỗi tạo `branch_stocks` hoặc lỗi Safe Updates 1175 ở
`medical_records`, chạy lại toàn bộ file sau khi cập nhật sẽ tiếp tục từ chỗ đó.
File chỉ tạm tắt Safe Updates cho lệnh chuyển đổi dữ liệu này rồi khôi phục thiết lập
của phiên kết nối. Với các kiểu gián đoạn khác, file báo
`antam_core is incomplete` thay vì bỏ qua các bảng còn thiếu. Khi đó, kiểm tra
và sao lưu dữ liệu trước; chỉ xóa schema tạo dở khi chắc chắn không chứa dữ liệu cần giữ.

Lịch bác sĩ không được seed thành từng ngày hoặc từng ô giờ trống. Bảng
`doctor_availability_rules` lưu ca làm định kỳ theo thứ, khoảng giờ, thời lượng
mỗi lượt và giai đoạn áp dụng. Bảng `doctor_schedule_exceptions` chỉ lưu ngày
nghỉ hoặc ca đặc biệt. API tính các khung giờ có thể đặt từ hai bảng này và trừ
các lịch hẹn đang giữ chỗ; một bản ghi `appointments` chỉ được tạo khi có người
thực sự đặt khám.

File `.env` đã được `.gitignore`, không được commit credential thật.

### Tài khoản mẫu và cập nhật database cũ

File `database/antam_mysql.sql` tạo tài khoản đăng nhập cho mọi người dùng mẫu trong
`antam_core.user_accounts`. Tên đăng nhập là email `<id>@demo.antam.local`, mật khẩu
chung là `Demo@123456`. Ví dụ: `p1@demo.antam.local`, `u-dr1@demo.antam.local`,
`staff-b1@demo.antam.local`, `admin1@demo.antam.local`, `root@demo.antam.local`.
Thông tin đăng nhập và mã băm mật khẩu nằm ở `antam_auth.auth_users`;
`antam_core.user_accounts` chỉ là hồ sơ nghiệp vụ có cùng `id`.
Chỉ dùng các thông tin này trong môi trường thử nghiệm; đổi mật khẩu trước khi dùng dữ liệu mẫu ở nơi khác.

Với database đã import từ trước, chạy lại `database/antam_mysql.sql` trước khi khởi
động phiên bản mới. File cho phép hồ sơ mới chưa có số điện thoại và bổ sung
đăng nhập cho các tài khoản mẫu còn thiếu.

## 2. `.env` backend không cấu hình frontend

Hai biến sau vẫn thuộc backend:

```dotenv
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080
```

- `FRONTEND_URL` là nơi backend chuyển trình duyệt về sau khi OAuth thành công.
- `CORS_ALLOWED_ORIGINS` là danh sách origin được backend cho phép gọi API.

Chúng **không** đặt URL API cho mã frontend. Frontend phải gọi gateway tại
`http://localhost:8080`. Nếu frontend dùng Vite và được viết để đọc biến môi
trường, biến đó phải nằm trong file riêng của frontend, ví dụ:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

Frontend đã đọc biến này từ `frontend/.env`; file `.env` của backend không truyền
biến sang frontend. Tạo file bằng Command Prompt:

```bat
cd /d C:\Users\Admin\Desktop\practic\springboot\frontend
copy .env.example .env
```

## 3. Đăng nhập Google và Facebook

### Client ID và Client Secret là gì, cần nhập gì?

`Client ID` và `Client Secret` không phải tên đăng nhập hoặc mật khẩu Gmail/Facebook,
và cũng không phải giá trị tự nghĩ ra. Đây là hai mã do Google hoặc Facebook cấp sau
khi bạn đăng ký ứng dụng OAuth:

- `Client ID`: mã nhận diện ứng dụng.
- `Client Secret`: khóa bí mật của ứng dụng; chỉ lưu trong `backend/.env`, không đưa
  vào frontend và không commit lên Git.

#### Trường hợp 1: chỉ muốn chạy thử backend

Nếu chưa tạo ứng dụng trên Google Cloud hoặc Meta for Developers, nhập tạm đúng như
sau:

```dotenv
GOOGLE_CLIENT_ID=replace-me
GOOGLE_CLIENT_SECRET=replace-me
FACEBOOK_CLIENT_ID=replace-me
FACEBOOK_CLIENT_SECRET=replace-me
```

Backend vẫn khởi động và đăng nhập bằng email/mật khẩu vẫn dùng được, nhưng nút đăng
nhập Google/Facebook sẽ chưa hoạt động.

#### Trường hợp 2: muốn đăng nhập Google/Facebook hoạt động

Bạn phải tạo OAuth Application trên Google Cloud và/hoặc Meta for Developers. Sau
đó sao chép nguyên văn các mã họ cấp vào `.env`. Ví dụ hình dạng của giá trị:

```dotenv
GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
FACEBOOK_CLIENT_ID=123456789012345
FACEBOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Các chuỗi trên chỉ là ví dụ minh họa và không đăng nhập được. Không nhập địa chỉ
Gmail, mật khẩu Gmail, tên Facebook hoặc mật khẩu Facebook vào bốn biến này.

Callback URL cần khai báo ở trang quản trị của nhà cung cấp:

- Google: `http://localhost:8080/login/oauth2/code/google`
- Facebook: `http://localhost:8080/login/oauth2/code/facebook`

Frontend bắt đầu đăng nhập bằng một trong hai URL:

- `http://localhost:8080/oauth2/authorization/google`
- `http://localhost:8080/oauth2/authorization/facebook`

Đăng nhập thành công sẽ đặt cookie JWT `ANTAM_TOKEN` dạng `HttpOnly` và chuyển về
`http://localhost:5173/oauth/callback`. Khi triển khai bằng HTTPS, đặt
`JWT_COOKIE_SECURE=true`.

## 4. Gửi email Gmail

Bật xác minh hai bước cho tài khoản Google và tạo **App Password**. Sau đó thay ví
dụ trong `.env` bằng tài khoản thật; không dùng mật khẩu đăng nhập Gmail thông thường:

```dotenv
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-account@gmail.com
MAIL_PASSWORD=your-16-character-app-password
MAIL_FROM=your-account@gmail.com
```

Mỗi lần gửi được ghi vào bảng `email_deliveries` với trạng thái `PENDING`, `SENT`
hoặc `FAILED`.

## 5. Build, test và chạy

Mở **Command Prompt** tại thư mục `backend`, chạy test toàn bộ reactor:

```bat
mvnw.cmd test
```

Mở bốn cửa sổ **Command Prompt**, chạy lệnh sau trong từng cửa sổ. Nếu cửa sổ mới
chưa ở đúng thư mục thì chạy `cd /d C:\Users\Admin\Desktop\practic\springboot\backend`
trước:

```bat
mvnw.cmd -pl notification-service spring-boot:run
mvnw.cmd -pl auth-service spring-boot:run
mvnw.cmd -pl core-service spring-boot:run
mvnw.cmd -pl api-gateway spring-boot:run
```

Không chạy `mvnw.cmd spring-boot:run` trực tiếp trên POM gốc vì POM gốc chỉ là
reactor (`packaging=pom`), không có class `main`. Frontend chỉ gọi gateway cổng 8080.

## API chính

### Xác thực

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /oauth2/authorization/google`
- `GET /oauth2/authorization/facebook`

Body đăng nhập mẫu:

```json
{ "email": "p1@demo.antam.local", "password": "Demo@123456" }
```

### Nghiệp vụ

- `GET /api/public/branches`
- `GET /api/public/specialties`
- `GET /api/public/doctors`
- `GET /api/public/packages`
- `GET /api/appointments` - yêu cầu JWT
- `POST /api/appointments` - tạo lịch giữ chỗ cho bệnh nhân (bác sĩ hoặc gói khám)
- `GET /api/profile` - tạo hồ sơ nghiệp vụ nếu tài khoản mới chưa có
- `PUT /api/profile` - cập nhật số điện thoại, ngày sinh và địa chỉ

Client ngoài trình duyệt có thể gửi JWT qua `Authorization: Bearer <token>`. Trình
duyệt dùng cookie `HttpOnly` và cần đặt `credentials: "include"` khi gọi khác origin.

## Lưu ý bảo mật

- Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên ít nhất 32 byte khi triển khai thật và giữ
  cùng giá trị giữa `auth-service` và `core-service`.
- Đổi `INTERNAL_API_KEY`; không công khai cổng `notification-service` ra Internet.
- Không đưa `.env`, OAuth secret hay Gmail App Password vào Git.
