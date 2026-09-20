# Bệnh viện Đa khoa An Tâm

Frontend React JavaScript, giao diện xanh dương–trắng tham khảo cách tổ chức nội dung của Medpro. Bản demo chạy độc lập với Spring Boot, dùng dữ liệu liên kết lưu trong trình duyệt.

## Chạy và kiểm tra

Chạy trong thư mục `frontend`:

```powershell
npm ci
npm run dev
```

```powershell
npm run lint
npm run check:domain
npm run build
npm run check:browser
npm run format:check
```

Browser check cần Node 22+ và Chrome trên Windows. Có thể đặt `CHROME_PATH` nếu Chrome ở vị trí khác. Build trước khi chạy; script dùng Chrome headless với profile riêng, máy chủ localhost tạm và in đường dẫn ảnh chụp khi kết thúc. Kiểm tra tại 360, 390, 768, 1024, 1440px. Nếu sandbox chặn tiến trình con (`spawn EPERM`), chạy build/browser trong terminal có quyền tạo tiến trình.

## Chức năng

- Trang chủ tìm cơ sở, bác sĩ, chuyên khoa bằng từ khóa không dấu. Ảnh/tên cơ sở mở trang chi tiết; nút đặt khám chọn sẵn đúng cơ sở.
- Trang bác sĩ có học vị, chuyên khoa, khoa/phòng, kinh nghiệm, chuyên môn, số liên hệ đặt khám, cơ sở, phí và lịch còn trống. Sao trung bình và số lượt được tính từ điểm mẫu của các buổi khám hoàn tất; không có bình luận hoặc form đánh giá.
- Đặt khám gồm bốn bước; thẻ cơ sở dùng radio có ảnh. Lựa chọn phụ thuộc được kiểm tra lại khi đổi cơ sở, chuyên khoa, bác sĩ, ngày hoặc URL. Bản nháp được giữ khi chuyển qua đăng nhập.
- Bệnh nhân có lịch hẹn sắp tới/đã qua, lịch sử khám theo dòng thời gian, bộ lọc và trang kết quả riêng từng lần khám.
- Bác sĩ tiếp nhận lịch, xem lịch sử trong phạm vi được phép, ghi kết quả tại trang riêng, lưu nháp và hoàn tất. Rời trang khi chưa lưu có cảnh báo.
- Quản trị cơ sở/bác sĩ/lịch làm việc, thống kê khám và thu tiền mô phỏng. Không có kho thuốc, danh mục thuốc, restock hoặc chức năng nhập/xuất file.

## Tài khoản và đường dẫn

Vào `/dang-nhap`, chọn vai trò rồi tài khoản mẫu. Đây là đăng nhập demo, không có mật khẩu.

| Vai trò     | Tài khoản mẫu                          | Đường dẫn                                    |
| ----------- | -------------------------------------- | -------------------------------------------- |
| Bệnh nhân   | Nguyễn Hoàng An (`p1`)                 | `/lich-hen`, `/ho-so-kham`, `/tai-khoan`     |
| Bác sĩ      | BS. Nguyễn Minh Anh (`u-dr1`)          | `/bac-si-lam-viec`, `/bac-si-lam-viec/ho-so` |
| Admin cơ sở | Quản trị An Tâm · Trung tâm (`admin1`) | `/quan-tri`                                  |
| Admin tổng  | Quản trị hệ thống (`root`)             | `/quan-tri`, `/quan-tri/he-thong`            |

Chi tiết kết quả: `/ho-so-kham/:recordId` hoặc `/bac-si-lam-viec/ho-so/:recordId`. Ghi kết quả: `/bac-si-lam-viec/kham/:appointmentId`. Route kiểm tra quyền và dữ liệu trước khi hiển thị.

Thử một vòng khám:

1. Bệnh nhân chọn cơ sở/bác sĩ, ngày và khung giờ, gửi yêu cầu đặt khám.
2. Đổi sang bác sĩ phụ trách, chọn “Yêu cầu chờ duyệt” và chấp nhận lịch.
3. Bác sĩ Nguyễn Minh Anh có lịch `AT-DEMO-EXAM` vào hôm qua, kèm nháp để thử ghi kết quả ngay. Chọn “Tất cả lịch”, tìm mã, vào “Ghi kết quả”, nhập chẩn đoán và hoàn tất.
4. Đổi sang bệnh nhân Nguyễn Hoàng An, mở “Lịch sử khám” để xem đúng kết quả vừa hoàn tất.
5. Admin cơ sở Trung tâm mở lịch hẹn, tìm `AT-DEMO-EXAM` và ghi nhận thu tiền. Không được tạo hai phiếu thu cho cùng lần khám.

## Dữ liệu mẫu và chuyển phiên bản

- Bốn cơ sở, sáu chuyên khoa, 12 bác sĩ, bốn gói khám và 16 bệnh nhân có tên riêng. Có chuỗi khám/tái khám, lịch tương lai, trạng thái khác nhau, nháp, sao đánh giá, khoản đã thu/chưa thu.
- Cơ sở → khoa → bác sĩ → lịch làm việc → lịch hẹn → bệnh án → phiếu thu liên kết bằng ID. Bộ kiểm thử kiểm tra quan hệ, khung giờ, điểm đánh giá và số liệu báo cáo.
- Phiên bản dữ liệu là **v2**, giữ khóa `antam-data-v1` để tự nâng cấp dữ liệu đã lưu. Nâng cấp bỏ collection cũ, giữ tài khoản, lịch hẹn, bệnh án và phiếu thu; bổ sung thông tin ảnh/liên hệ còn thiếu, không thay dữ liệu người dùng bằng seed mới.
- Dữ liệu ngày tương đối được tạo lúc khởi tạo, không tự đổi sau mỗi lần tải lại. Muốn xem đầy đủ bộ mock mới hoặc làm mới lịch mẫu: đăng nhập admin tổng → “Dữ liệu demo” → “Khôi phục dữ liệu” → xác nhận. Thao tác này thay thế dữ liệu cục bộ.
- Dữ liệu lỗi không bị ghi đè tự động; các thao tác ghi bị chặn và có thông báo để admin khôi phục. Phiên đăng nhập nằm trong `sessionStorage`; dữ liệu đồng bộ qua sự kiện `storage` giữa các tab.
- Bệnh nhân chỉ xem hồ sơ hoàn tất của mình. Bác sĩ xem lịch sử tại cơ sở của bệnh nhân đã được phân công; chỉ sửa bản nháp của lịch mình phụ trách. Hồ sơ hoàn tất chỉ đọc. Admin không được xem nội dung bệnh án.
- Tiền thu tính theo ngày thu, khoản chưa thu tính trên buổi khám hoàn tất trong khoảng ngày khám. Biểu đồ và tổng số được tính từ cùng nguồn dữ liệu, theo quyền và bộ lọc.

## Cấu trúc

- `src/data/`: seed, nghiệp vụ, chuẩn hóa bản nháp đặt khám, nâng cấp dữ liệu và báo cáo.
- `src/state/`: Context dữ liệu và phiên demo.
- `src/pages/`: các trang công khai, bệnh nhân, lâm sàng và quản trị.
- `src/components/`: layout, thẻ ảnh, đánh giá sao, form, bảng, modal và biểu đồ.
- `src/index.css`: CSS thông thường và responsive, không dùng framework UI.
- `public/images/`: ảnh minh họa AI lưu cục bộ; nguồn và prompt nằm trong `ASSETS.md`.

Dữ liệu, thương hiệu và ảnh đều minh họa; không lưu thông tin bệnh nhân thật. Khi triển khai static hosting cần fallback URL về `index.html`.
