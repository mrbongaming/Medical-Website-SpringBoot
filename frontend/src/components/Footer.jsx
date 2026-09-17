import { Link } from "react-router-dom";
import { FiArrowUp, FiMessageCircle } from "react-icons/fi";
import { logo, guides } from "../data/mockData";
export default function Footer() {
  return (
    <>
      <div className="contact-strip">
        <div className="container">
          <div>
            <h3>Bạn cần hỗ trợ?</h3>
            <p>Khám phá hướng dẫn hoặc kết nối với Medpro</p>
          </div>
          <Link className="button white" to="/lien-he">
            Liên hệ hợp tác →
          </Link>
        </div>
      </div>
      <footer>
        <div className="container footer-grid">
          <div>
            <Link to="/">
              <img className="logo" src={logo} alt="Medpro" />
            </Link>
            <p>
              Nền tảng kết nối người dân với cơ sở y tế và các dịch vụ chăm sóc
              sức khỏe.
            </p>
            <p>
              <strong>CÔNG TY CỔ PHẦN ỨNG DỤNG PKH</strong>
            </p>
            <p>
              Hotline: <strong>1900 2115</strong>
              <br />
              Email: cskh@medpro.vn
            </p>
          </div>
          <div>
            <h3>Dịch vụ nổi bật</h3>
            <Link to="/co-so-y-te">Đặt khám tại cơ sở</Link>
            <Link to="/chuyen-khoa">Đặt khám chuyên khoa</Link>
            <Link to="/bac-si">Gọi video với bác sĩ</Link>
            <Link to="/kham-suc-khoe-doanh-nghiep">
              Khám sức khỏe doanh nghiệp
            </Link>
            <Link to="/dich-vu-y-te">Dịch vụ y tế</Link>
          </div>
          <div>
            <h3>Hướng dẫn & Hỗ trợ</h3>
            {guides.map(([slug, name]) => (
              <Link key={slug} to={"/huong-dan/" + slug}>
                {name}
              </Link>
            ))}
          </div>
          <div>
            <h3>Về Medpro</h3>
            <Link to="/ve-medpro">Giới thiệu</Link>
            <Link to="/dieu-khoan-dich-vu">Điều khoản dịch vụ</Link>
            <Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
            <Link to="/quy-dinh-su-dung">Quy định sử dụng</Link>
            <Link to="/lien-he">Liên hệ hợp tác</Link>
            <Link to="/tuyen-dung">Tuyển dụng</Link>
          </div>
        </div>
        <div className="container copyright">
          Medpro · Bản giao diện thực hành với dữ liệu mẫu. Không tiếp nhận lịch
          khám hoặc thanh toán thực tế.
        </div>
      </footer>
      <div className="floating-actions">
        <Link to="/huong-dan/cau-hoi-thuong-gap" aria-label="Hỗ trợ">
          <FiMessageCircle />
        </Link>
        <button
          aria-label="Về đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FiArrowUp />
        </button>
      </div>
    </>
  );
}
