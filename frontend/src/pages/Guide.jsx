import { Link, NavLink, useParams } from "react-router-dom";
import { guides, appImage } from "../data/mockData";
import PageHeader from "../components/PageHeader";

const steps = {
  "dat-lich-kham": [
    "Chọn cơ sở y tế hoặc bác sĩ",
    "Lựa chọn chuyên khoa cần khám",
    "Chọn ngày và giờ phù hợp",
    "Xem lại thông tin lịch khám",
  ],
  "tu-van-kham-benh-qua-video": [
    "Tìm bác sĩ theo chuyên khoa",
    "Tham khảo thông tin bác sĩ",
    "Chọn khung giờ tư vấn",
    "Chuẩn bị thiết bị có camera và kết nối internet",
  ],
  "quy-trinh-huy-phieu": [
    "Mở thông tin phiếu khám",
    "Kiểm tra điều kiện hủy của cơ sở",
    "Liên hệ bộ phận hỗ trợ để được hướng dẫn",
  ],
  "quy-trinh-hoan-phi": [
    "Kiểm tra trạng thái phiếu khám",
    "Xem chính sách của cơ sở y tế",
    "Liên hệ hỗ trợ với thông tin phiếu khám",
  ],
  "quy-trinh-di-kham": [
    "Chuẩn bị giấy tờ và hồ sơ liên quan",
    "Kiểm tra địa chỉ và giờ hẹn",
    "Đến quầy hướng dẫn tại cơ sở",
    "Thực hiện khám theo hướng dẫn của nhân viên",
  ],
};
export default function Guide() {
  const { slug = "dat-lich-kham" } = useParams();
  const title = guides.find((g) => g[0] === slug)?.[1] || "Hướng dẫn";
  return (
    <div className="page-background">
      <PageHeader title="Hướng dẫn" />
      <div className="container directory-layout">
        <aside className="sidebar">
          <h3>Hướng dẫn & Hỗ trợ</h3>
          {guides.map(([id, name]) => (
            <NavLink key={id} to={"/huong-dan/" + id}>
              {name}
            </NavLink>
          ))}
        </aside>
        <article className="panel prose">
          <h1>{title}</h1>
          {slug === "cau-hoi-thuong-gap" ? (
            <div className="faq">
              {[
                [
                  "Có thể tìm cơ sở y tế theo khu vực không?",
                  "Có. Truy cập Cơ sở y tế và chọn khu vực ở thanh tìm kiếm.",
                ],
                [
                  "Làm thế nào để xem lịch khám?",
                  "Chọn một cơ sở hoặc bác sĩ, sau đó chọn lịch khám để xem các khung giờ mẫu.",
                ],
                [
                  "Giao diện này có tạo lịch hẹn thật không?",
                  "Không. Đây là bản giao diện thực hành, sử dụng dữ liệu mẫu và không kết nối hệ thống đặt khám.",
                ],
                [
                  "Có cần đăng nhập không?",
                  "Không cần tài khoản để sử dụng các trang và xem trước lịch khám trong bản này.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          ) : slug === "cai-dat-ung-dung" ? (
            <>
              <p>
                Khám phá dịch vụ y tế và chuẩn bị lịch hẹn ngay trên điện thoại
                của bạn.
              </p>
              <img
                className="guide-app"
                src={appImage}
                alt="Giao diện ứng dụng Medpro"
              />
              <h2>Cài đặt Medpro</h2>
              <p>
                Mở App Store hoặc Google Play trên điện thoại, tìm “Medpro” và
                kiểm tra nhà phát hành trước khi cài đặt.
              </p>
              <Link className="button" to="/dich-vu-y-te">
                Khám phá dịch vụ
              </Link>
            </>
          ) : (
            <>
              <p>
                Tham khảo các bước dưới đây để dễ dàng tìm kiếm và chuẩn bị lịch
                khám.
              </p>
              <div className="guide-steps">
                {(steps[slug] || steps["dat-lich-kham"]).map((step, i) => (
                  <div key={step}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>
                        Bước {i + 1}: {step}
                      </h3>
                      <p>
                        Kiểm tra thông tin và lựa chọn phù hợp với nhu cầu của
                        bạn.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link className="button" to="/co-so-y-te">
                Tìm cơ sở y tế →
              </Link>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
