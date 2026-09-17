import { useState } from "react";
import { Link } from "react-router-dom";
import { appImage, services } from "../data/mockData";
import PageHeader from "../components/PageHeader";

export default function Information({ mode = "contact" }) {
  const [sent, setSent] = useState(false);
  const titles = {
    contact: "Liên hệ hợp tác",
    business: "Khám sức khỏe doanh nghiệp",
    about: "Về Medpro",
    careers: "Tuyển dụng",
    terms: "Điều khoản dịch vụ",
    privacy: "Chính sách bảo mật",
    rules: "Quy định sử dụng",
  };
  const title = titles[mode];
  const form = mode === "contact" || mode === "business";
  return (
    <div className="page-background">
      <PageHeader title={title} />
      <div className="container">
        {form ? (
          <div className="contact-layout">
            <div className="contact-intro">
              <span className="eyebrow">ĐỒNG HÀNH CÙNG MEDPRO</span>
              <h2>
                {mode === "business"
                  ? "Chăm sóc nhân viên, phát triển doanh nghiệp"
                  : "Cùng kết nối, cùng chăm sóc sức khỏe"}
              </h2>
              <p>
                {mode === "business"
                  ? "Tham khảo các gói khám sức khỏe, lựa chọn cơ sở và kế hoạch phù hợp với đội ngũ của bạn."
                  : "Kết nối cơ sở y tế và các dịch vụ chăm sóc sức khỏe đến gần hơn với cộng đồng."}
              </p>
              <img src={services[0].banner} alt="Dịch vụ chăm sóc sức khỏe" />
              <div className="contact-details">
                <h3>Thông tin liên hệ</h3>
                <p>Tổng đài: 1900 2115</p>
                <p>Email: cskh@medpro.vn</p>
              </div>
            </div>
            <section className="panel">
              <h2>Thông tin liên hệ hợp tác</h2>
              <p className="muted">
                Điền thông tin để xem trước yêu cầu của bạn.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                onChange={() => setSent(false)}
              >
                <label className="field">
                  Tên đơn vị / Người liên hệ
                  <input required placeholder="Nhập tên đơn vị hoặc họ tên" />
                </label>
                <label className="field">
                  Email
                  <input
                    required
                    type="email"
                    placeholder="email@example.com"
                  />
                </label>
                <label className="field">
                  Số điện thoại
                  <input
                    required
                    type="tel"
                    pattern="[+0-9 ()-]{8,20}"
                    placeholder="Nhập số điện thoại"
                  />
                </label>
                <label className="field">
                  Nhu cầu hợp tác
                  <select>
                    <option>Cơ sở y tế</option>
                    <option>Phòng mạch</option>
                    <option>Khám sức khỏe doanh nghiệp</option>
                    <option>Quảng cáo</option>
                  </select>
                </label>
                <label className="field">
                  Nội dung
                  <textarea rows="4" placeholder="Chia sẻ nhu cầu của bạn..." />
                </label>
                <button className="button full">Xem trước yêu cầu</button>
                {sent && (
                  <p className="notice" role="status">
                    Thông tin mẫu đã được kiểm tra. Không có yêu cầu nào được
                    gửi đi.
                  </p>
                )}
              </form>
            </section>
          </div>
        ) : mode === "about" ? (
          <section className="panel about-layout">
            <div className="prose">
              <h2>Kết nối người dân với dịch vụ y tế</h2>
              <p>
                Medpro giúp người dùng tìm kiếm cơ sở y tế, tham khảo dịch vụ và
                chủ động lên kế hoạch chăm sóc sức khỏe.
              </p>
              <h3>Sức khỏe của bạn, sự quan tâm của chúng tôi</h3>
              <p>
                Khám phá các lựa chọn từ khám tại cơ sở đến tư vấn trực tuyến,
                khám chuyên khoa và các gói chăm sóc sức khỏe.
              </p>
              <Link className="button" to="/dich-vu-y-te">
                Khám phá dịch vụ
              </Link>
            </div>
            <img src={appImage} alt="Medpro" />
          </section>
        ) : (
          <section className="panel prose info-copy">
            <h2>{title}</h2>
            {mode === "careers" ? (
              <>
                <p>
                  Khám phá cơ hội đồng hành cùng đội ngũ xây dựng các trải
                  nghiệm chăm sóc sức khỏe.
                </p>
                <div className="notice">
                  Hiện chưa có vị trí tuyển dụng trong dữ liệu mẫu.
                </div>
                <Link to="/lien-he" className="button">
                  Thông tin liên hệ
                </Link>
              </>
            ) : (
              <>
                <p>
                  Trang này thuộc bản giao diện thực hành Medpro, sử dụng thông
                  tin và dữ liệu minh họa.
                </p>
                <h3>
                  {mode === "privacy" ? "Thông tin cá nhân" : "Phạm vi sử dụng"}
                </h3>
                <p>
                  Không có hệ thống đăng nhập, thanh toán hay đặt khám thực tế.
                  Thông tin nhập trong biểu mẫu chỉ dùng để xem trước trên trình
                  duyệt và không được gửi đến cơ sở y tế.
                </p>
                <h3>Thông tin dịch vụ</h3>
                <p>
                  Lịch khám, chi phí và nội dung mô tả chỉ mang tính minh họa.
                  Vui lòng tham khảo cơ sở cung cấp dịch vụ để biết thông tin
                  chính thức.
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
