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

Khi triển khai lên Vercel, đặt **Root Directory** là `frontend` và triển khai lại
sau khi cập nhật mã. File `frontend/vercel.json` chuyển các đường dẫn ứng dụng như
`/lich-hen` và `/tai-khoan` về `index.html` để React Router xử lý khi tải lại trang.

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
- Đọc cơ sở, chuyên khoa, khoa/phòng, bác sĩ và gói khám từ MySQL qua `core-service`.
- Đọc lịch hẹn của bệnh nhân đã đăng nhập từ `GET /api/appointments`.

Trang đăng nhập hiển thị trạng thái backend. Khi gateway, service hoặc database
không kết nối được, các trang danh mục công khai hiển thị lỗi và nút thử lại thay
vì hiển thị dữ liệu demo. Nếu backend phản hồi nhưng các danh mục đều rỗng, giao
diện báo chưa có dữ liệu trong database.
Các kết quả thao tác thành công hoặc thất bại được hiển thị bằng toast ở góc trên
bên phải; toast có thể đóng thủ công và tự biến mất sau vài giây.

Đặt lịch và cập nhật hồ sơ đã gọi API backend. Các API ghi bệnh án, kho thuốc và
quản trị vẫn chưa được triển khai; những thao tác đó sẽ báo rõ là chưa có API thay
vì ghi dữ liệu giả vào trình duyệt. Frontend không còn seed hoặc fallback sang dữ
liệu mock khi backend/database không khả dụng.

## Kiểm tra frontend

Chạy trong Command Prompt:

```bat
cd /d C:\Users\Admin\Desktop\practic\springboot\frontend
npm run lint
npm run build
npm run format:check
```

Không đưa file `.env` hoặc thông tin bí mật lên Git.
