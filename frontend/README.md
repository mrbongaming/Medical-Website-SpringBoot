# Frontend Bệnh viện An Tâm

Frontend React/Vite gọi backend thông qua API Gateway tại `http://localhost:8080`.

## Cấu hình `.env`

Mọi câu lệnh dưới đây đều chạy bằng **Command Prompt (`cmd.exe`)**.

```bat
cd /d C:\Users\Admin\Desktop\practic\springboot\frontend
copy .env.example .env
```

Với cấu hình chạy trên máy hiện tại, nội dung `frontend\.env` là:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

Biến này chỉ cho frontend biết địa chỉ API Gateway. Thông tin MySQL, Gmail,
Google/Facebook Client ID và Client Secret nằm trong `backend\.env`, không đặt ở
frontend.

Sau khi sửa `.env`, dừng Vite bằng `Ctrl + C` rồi chạy lại `npm run dev`.

## Chạy hệ thống

Trước tiên bật MySQL trong XAMPP và chạy đủ bốn service backend theo hướng dẫn tại
[`backend/README.md`](../backend/README.md). Sau đó mở một cửa sổ Command Prompt
mới và chạy:

```bat
cd /d C:\Users\Admin\Desktop\practic\springboot\frontend
npm ci
npm run dev
```

Mở địa chỉ Vite in trên màn hình, thông thường là `http://localhost:5173`.

`npm ci` cài đúng phiên bản thư viện trong `package-lock.json`. Chỉ cần chạy lần
đầu, sau khi tải mã mới, hoặc khi `package-lock.json` thay đổi. Những lần chạy hằng
ngày, nếu thư mục `node_modules` đã có, chỉ cần:

```bat
cd /d C:\Users\Admin\Desktop\practic\springboot\frontend
npm run dev
```

## Phần đã kết nối backend

- Đăng ký và đăng nhập bằng email/mật khẩu.
- Đăng nhập Google/Facebook khi đã điền OAuth Client ID/Client Secret hợp lệ trong
  `backend\.env`.
- Khôi phục phiên đăng nhập bằng cookie `ANTAM_TOKEN`.
- Đọc cơ sở, chuyên khoa, bác sĩ và gói khám từ MySQL qua `core-service`.
- Đọc lịch hẹn của bệnh nhân đã đăng nhập từ `GET /api/appointments`.

Trang đăng nhập hiển thị trạng thái backend. Khi gateway hoặc service không chạy,
giao diện báo không kết nối được và giữ dữ liệu demo cục bộ làm phương án dự phòng.

Backend hiện chưa có API ghi lịch hẹn, cập nhật hồ sơ, bệnh án, kho thuốc và quản
trị. Các thao tác này không được giả vờ lưu vào MySQL. Khu vực **Nhân sự demo** vẫn
dùng `localStorage` để có thể xem giao diện bác sĩ/admin trong lúc các API đó chưa
được xây dựng.

## Kiểm tra frontend

Chạy trong Command Prompt:

```bat
cd /d C:\Users\Admin\Desktop\practic\springboot\frontend
npm run lint
npm run check:domain
npm run check:billing
npm run check:inventory
npm run build
npm run format:check
```

Browser check cần Chrome và Node.js 22 trở lên:

```bat
npm run check:browser
```

Không đưa file `.env` hoặc thông tin bí mật lên Git.
