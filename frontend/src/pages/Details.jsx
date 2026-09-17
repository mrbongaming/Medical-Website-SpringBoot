import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiMapPin, FiClock, FiCheckCircle } from "react-icons/fi";
import { hospitals, doctors, packages, specialties } from "../data/mockData";
import PageHeader from "../components/PageHeader";

export default function Details({ kind = "hospital" }) {
  const { slug } = useParams();
  const [tab, setTab] = useState("Giới thiệu");
  const items =
    kind === "doctor" ? doctors : kind === "package" ? packages : hospitals;
  const item = items.find((x) => x.slug === slug);
  if (!item)
    return (
      <div className="empty-state">
        <h1>Không tìm thấy thông tin</h1>
        <Link className="button" to="/co-so-y-te">
          Xem cơ sở y tế
        </Link>
      </div>
    );
  return (
    <div className="page-background">
      <PageHeader title={item.name} />
      <div className="container detail-layout">
        <div>
          <section className="panel provider-heading">
            <img src={item.image} alt={item.name} />
            <div>
              <span className="badge">
                <FiCheckCircle />{" "}
                {kind === "hospital"
                  ? "Cơ sở y tế"
                  : kind === "doctor"
                    ? "Tư vấn trực tuyến"
                    : "Gói khám sức khỏe"}
              </span>
              <h2>{item.name}</h2>
              <p className="muted">
                <FiMapPin /> {item.address || item.hospital}
              </p>
              {item.specialty && <p>Chuyên khoa: {item.specialty}</p>}
              {item.price && <p className="price">{item.price}</p>}
              <div className="rating">
                <span>★★★★★</span>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="tabs">
              {["Giới thiệu", "Chuyên khoa", "Hướng dẫn đi khám"].map((t) => (
                <button
                  className={tab === t ? "selected" : ""}
                  onClick={() => setTab(t)}
                  key={t}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === "Giới thiệu" ? (
              <div className="prose">
                <h2>Thông tin chung</h2>
                <p>
                  {item.name} là một trong những lựa chọn bạn có thể tham khảo
                  trên nền tảng Medpro. Xem thông tin dịch vụ và lựa chọn lịch
                  hẹn phù hợp với nhu cầu của bạn.
                </p>
                <h3>Dịch vụ chăm sóc sức khỏe</h3>
                <p>
                  Khám chuyên khoa, tư vấn sức khỏe và các gói khám theo nhu
                  cầu. Thông tin lịch khám và chi phí trên bản giao diện này là
                  dữ liệu minh họa.
                </p>
                <h3>Thời gian làm việc</h3>
                <p>
                  <FiClock /> Thứ Hai – Thứ Bảy: 07:00 – 16:30 (lịch mẫu)
                </p>
              </div>
            ) : tab === "Chuyên khoa" ? (
              <div className="specialty-grid small">
                {specialties.slice(0, 8).map((s) => (
                  <Link key={s.slug} to={"/chuyen-khoa/" + s.slug}>
                    <img src={s.icon} alt="" />
                    <span>{s.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="prose">
                <h2>Chuẩn bị trước khi đến khám</h2>
                <ol>
                  <li>
                    Kiểm tra ngày, giờ và địa chỉ trên thông tin lịch hẹn.
                  </li>
                  <li>
                    Mang theo giấy tờ tùy thân và hồ sơ khám trước đó nếu có.
                  </li>
                  <li>Đến quầy hướng dẫn để được hỗ trợ.</li>
                </ol>
                <Link className="text-link" to="/huong-dan/dat-lich-kham">
                  Xem hướng dẫn chi tiết →
                </Link>
              </div>
            )}
          </section>
        </div>
        <aside className="panel booking-summary">
          <h3>Thông tin đặt khám</h3>
          <p>Chọn ngày và khung giờ phù hợp với bạn.</p>
          <div className="info-line">
            <FiClock />
            <span>
              Chủ động lịch hẹn
              <br />
              <small>Xem trước thông tin dễ dàng</small>
            </span>
          </div>
          <Link
            className="button full"
            to={"/dat-kham/" + item.slug + "?kind=" + kind}
          >
            Chọn lịch khám
          </Link>
          <p className="muted small-text">
            Lịch và giá minh họa cho bản giao diện.
          </p>
        </aside>
      </div>
    </div>
  );
}
