# Bệnh viện Đa khoa An Tâm

Frontend React JavaScript dùng Tailwind CSS v4, giao diện xanh dương–trắng tham khảo cách tổ chức nội dung của Medpro. Bản demo chạy độc lập với Spring Boot, dùng dữ liệu liên kết lưu trong trình duyệt.

## Chạy và kiểm tra

Chạy trong thư mục `frontend`:

```powershell
npm ci
npm run dev
```

```powershell
npm run lint
npm run check:domain
npm run check:billing
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
5. Admin cơ sở Trung tâm mở lịch hẹn, tìm `AT-DEMO-EXAM` → **Chi phí & BHYT**, đối chiếu và chốt phí rồi ghi nhận thu tiền. Không được tạo hai phiếu thu gốc cho cùng lần khám.

## Dữ liệu mẫu và chuyển phiên bản

- Bốn cơ sở, sáu chuyên khoa, 12 bác sĩ, bốn gói khám và 16 bệnh nhân có tên riêng. Có chuỗi khám/tái khám, lịch tương lai, trạng thái khác nhau, nháp, sao đánh giá, khoản đã thu/chưa thu.
- Cơ sở → khoa → bác sĩ → lịch làm việc → lịch hẹn → bệnh án → phiếu thu liên kết bằng ID. Bộ kiểm thử kiểm tra quan hệ, khung giờ, điểm đánh giá và số liệu báo cáo.
- Phiên bản dữ liệu là **v3**, giữ khóa `antam-data-v1` để tự nâng cấp từ v1/v2. Nâng cấp giữ tài khoản, lịch hẹn, bệnh án và phiếu thu; thêm bảng phí tương đương giá cũ, không gán khuyến mãi hoặc BHYT cho lịch cũ. Dữ liệu nâng cấp bắt đầu với danh sách khuyến mãi trống và BHYT tắt để admin chủ động cấu hình, không thay dữ liệu người dùng bằng seed mới.
- Dữ liệu ngày tương đối được tạo lúc khởi tạo, không tự đổi sau mỗi lần tải lại. Muốn xem đầy đủ bộ mock mới hoặc làm mới lịch mẫu: đăng nhập admin tổng → “Dữ liệu demo” → “Khôi phục dữ liệu” → xác nhận. Thao tác này thay thế dữ liệu cục bộ.
- Dữ liệu lỗi không bị ghi đè tự động; các thao tác ghi bị chặn và có thông báo để admin khôi phục. Phiên đăng nhập nằm trong `sessionStorage`; dữ liệu đồng bộ qua sự kiện `storage` giữa các tab.
- Bệnh nhân chỉ xem hồ sơ hoàn tất của mình. Bác sĩ xem lịch sử tại cơ sở của bệnh nhân đã được phân công; chỉ sửa bản nháp của lịch mình phụ trách. Hồ sơ hoàn tất chỉ đọc. Admin không được xem nội dung bệnh án.
- Tiền thu tính theo ngày thu, khoản chưa thu tính trên buổi khám hoàn tất trong khoảng ngày khám. Biểu đồ và tổng số được tính từ cùng nguồn dữ liệu, theo quyền và bộ lọc.

## Cấu trúc

- `src/data/`: seed, nghiệp vụ, chuẩn hóa bản nháp đặt khám, nâng cấp dữ liệu và báo cáo.
- `src/helpers/`: tính phí, chọn khuyến mãi, kiểm tra BHYT và các hàm hỗ trợ giao diện. `data/billing.js` xử lý quyền, cập nhật dữ liệu và nhật ký tài chính.
- `src/state/`: Context dữ liệu và phiên demo.
- `src/pages/`: các trang công khai, bệnh nhân, lâm sàng và quản trị.
- `src/components/`: layout, thẻ ảnh, đánh giá sao, form, bảng, modal và biểu đồ.
- `src/index.css`: điểm nhập Tailwind CSS và theme màu thương hiệu tối thiểu; utility class được viết trực tiếp trong JSX của từng page/component.
- `public/images/`: ảnh minh họa AI lưu cục bộ; nguồn và prompt nằm trong `ASSETS.md`.

Dữ liệu, thương hiệu và ảnh đều minh họa; không lưu thông tin bệnh nhân thật. Khi triển khai static hosting cần fallback URL về `index.html`.

## Khuyến mãi, BHYT và thu ngân

- `/quan-tri/khuyen-mai`: admin tổng quản lý toàn hệ thống; admin cơ sở chỉ sửa chương trình giới hạn riêng tại cơ sở mình. Mỗi lịch tối đa một ưu đãi. Hệ thống chọn ưu đãi có số tiền giảm tốt nhất giữa mã hợp lệ được nhập và các chương trình tự động.
- Chương trình được xét theo **ngày khám**, cơ sở, dịch vụ, khách mới (chưa có lần khám hoàn tất), tổng dịch vụ tối thiểu, mức trần và hạn mức lượt. Lượt giữ khi đặt lịch, sử dụng khi thanh toán; hủy/từ chối/vắng mặt sẽ giải phóng. Mã hợp lệ nhưng không giảm được khoản nào không chiếm lượt. Hoàn tiền không tự hoàn lượt đã sử dụng.
- Dữ liệu mẫu mới có mã `ANTAM50` giảm tối đa 50.000đ, một lượt mỗi khách và ưu đãi gói khám tự động 5%. Lịch đã đặt giữ điều khoản của chương trình tại thời điểm đặt, kể cả khi admin sửa hoặc ngừng chương trình sau đó.
- `/quan-tri/bao-hiem`: xem biểu giá BHYT mô phỏng theo cơ sở; admin tổng ban hành phiên bản mới và sửa đơn giá dịch vụ bổ sung. Giá 0 nghĩa là không nằm trong phạm vi cấu hình. Phiên bản có số lớn nhất còn hiệu lực tại ngày khám được áp dụng khi xác minh; các hồ sơ đã xác minh giữ nguyên bản đã lưu. Gói khám không mặc định được hưởng BHYT.
- Các mức hưởng 80/95/100 và hệ số điều kiện 50/100 là các lựa chọn của **kịch bản mô phỏng**, do nhân viên chọn sau khi đối chiếu và ghi căn cứ. Không tự suy luận quyền lợi từ mã thẻ, không kết nối BHXH và không coi cấu hình mẫu là quy tắc pháp lý đầy đủ.
- Lịch hẹn → **Chi phí & BHYT**: admin cơ sở kiêm tiếp nhận và thu ngân. Tiếp nhận một lần trong ngày khám sau khi bác sĩ đã xác nhận lịch; kiểm tra thông tin người khám và BHYT. Không thể hủy hoặc đánh dấu vắng mặt sau khi đã tiếp nhận.
- Bác sĩ có thể lưu nháp; lịch mới phải được tiếp nhận trước khi hoàn tất khám. Ghi dịch vụ bổ sung đã thực hiện, số lượng và lý do thay đổi so với dự toán. Giá dịch vụ đã ghi nhận được giữ khi bảng giá thay đổi. Lịch cũ trước v3 được giữ luồng hoàn tất tương thích với dữ liệu cũ.
- BHYT chờ kiểm tra/cần bổ sung hiển thị **Chưa xác định**, chặn chốt phí. Bệnh nhân có thể bổ sung khi chưa chốt, kể cả đã khám xong. Nhân viên xác minh hoặc từ chối có lý do. Mỗi dòng dịch vụ tách giá trong phạm vi, quỹ chi trả, đồng chi trả và ngoài phạm vi. Khuyến mãi chỉ giảm phần ngoài phạm vi được cho phép; không giảm phần quỹ hoặc đồng chi trả.
- Hoàn tất khám → đối chiếu chi phí với khách → chốt phí → xác nhận đã thu tiền mặt/chuyển khoản mô phỏng. Giá và điều khoản không được sửa sau chốt. Nếu phải trả 0đ, chỉ ghi nhận hoàn tất nghĩa vụ, không tạo phiếu thu tiền 0đ.
- Điều chỉnh sau thu tạo chứng từ liên kết phiếu gốc, có tham chiếu duy nhất theo lịch, lý do, người xử lý, phương thức và thời gian. Hoàn tiền không vượt số khách thực trả còn lại. Thu bổ sung/hoàn tiền ở đây điều chỉnh khoản khách chịu và xác nhận giao dịch ngay; không sửa dịch vụ lâm sàng hay khoản BHYT đã chốt. Không hỗ trợ hoàn một phần BHYT hoặc hóa đơn điện tử thật.
- Khoản BHYT đã chốt theo dõi riêng ở trạng thái chờ quyết toán; có thao tác ghi nhận toàn bộ khoản đã thanh toán mô phỏng. Báo cáo tách tiền khách ròng (thu + bổ sung − hoàn), tổng giảm giá đã chốt, công nợ khách, BHYT chờ và BHYT đã nhận. Dự toán chưa chốt không cộng vào công nợ đã xác định.
- Mọi thao tác xác minh/tài chính có nhật ký trong cửa sổ chi phí. Các trang quản trị và biểu mẫu chuyển thành một cột trên màn hình nhỏ; bảng dài cuộn trong vùng bảng.

### Thử luồng BHYT với dữ liệu mẫu mới

1. Đăng nhập `admin1`, mở lịch `AT-TODAY` → **Chi phí & BHYT** → **Xác nhận tiếp nhận**. Lịch mẫu thuộc bệnh nhân `p11`, bác sĩ `u-dr1`, đã giữ ưu đãi `ANTAM50`.
2. Chọn kết quả đủ điều kiện, mức hưởng 80%, hệ số 100%, nhập căn cứ hồ sơ mẫu rồi lưu xác minh.
3. Sau giờ hẹn 08:00, đăng nhập `u-dr1`, mở **Ghi kết quả**. Nhập triệu chứng/chẩn đoán, chọn điện tâm đồ nếu đã thực hiện và nhập lý do bổ sung; hoàn tất khám.
4. Quay lại `admin1`, mở bảng phí, đối chiếu và chốt. Với dữ liệu mẫu ban đầu và một điện tâm đồ: tổng 350.000đ, BHYT 112.000đ, giảm 50.000đ, khách trả 188.000đ.
5. Xác nhận thu; có thể tạo chứng từ hoàn mẫu với tham chiếu riêng, rồi ghi nhận quyết toán BHYT mô phỏng. Đăng nhập `p11` → lịch đã qua để xem bảng phí và giao dịch.

Thẻ mẫu: `DEMO12345678901`. Dữ liệu mẫu dùng ngày tương đối lúc khởi tạo; lịch `AT-TODAY` không tự chuyển sang hôm sau. Dữ liệu đã lưu được giữ nguyên khi nâng cấp, nên quản trị có thể tự tạo chương trình/cấu hình thay vì khôi phục toàn bộ dữ liệu.

### Kiểm thử và giới hạn demo

`check:billing` kiểm tra quyền, quota, hoàn lượt, hiệu lực BHYT, định giá từng dịch vụ, bảo toàn điều khoản/phiếu, 0đ, thu trùng, hoàn tiền, điều chỉnh, quyết toán, báo cáo và migration. `check:browser` chạy Chrome ở 360, 390, 768, 1024, 1440px, kiểm tra tràn ngang cả trang lẫn dialog và toàn luồng qua các vai trò.

LocalStorage không phải cơ sở dữ liệu có giao dịch hoặc ranh giới bảo mật; các tab ghi đồng thời vẫn cần được thay bằng giao dịch và kiểm tra quyền phía server khi chuyển sang backend. Phiên bản này không thực hiện giao dịch tiền hoặc xác minh BHYT thật.
