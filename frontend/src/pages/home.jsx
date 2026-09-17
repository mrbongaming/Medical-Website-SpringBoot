import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Hero from "../components/Hero";
import ServiceSection from "../components/ServiceSection";
import HospitalSection from "../components/HospitalSection";
import DoctorSection from "../components/DoctorSection";
import {
  hospitals,
  banners,
  specialties,
  articles,
  appImage,
  packages,
} from "../data/mockData";

export default function Home() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setSlide((s) => (s + 1) % banners.length),
      6000,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <Hero />
      <ServiceSection />
      <section className="container partners">
        <h2>
          Được tin tưởng hợp tác
          <br />
          <span>và đồng hành</span>
        </h2>
        <div className="partner-logos">
          {hospitals.slice(0, 6).map((h) => (
            <Link key={h.slug} to={"/co-so-y-te/" + h.slug} title={h.name}>
              <img src={h.logo} alt={h.name} />
              <span>{h.name}</span>
            </Link>
          ))}
        </div>
        <Link className="text-link" to="/co-so-y-te">
          Xem tất cả →
        </Link>
      </section>
      <section className="container carousel" aria-label="Thông tin dịch vụ">
        <Link to="/dich-vu-y-te">
          <img
            src={banners[slide]}
            alt={"Dịch vụ chăm sóc sức khỏe " + (slide + 1)}
          />
        </Link>
        <button
          className="carousel-prev"
          aria-label="Ảnh trước"
          onClick={() =>
            setSlide((slide - 1 + banners.length) % banners.length)
          }
        >
          <FiChevronLeft />
        </button>
        <button
          className="carousel-next"
          aria-label="Ảnh tiếp theo"
          onClick={() => setSlide((slide + 1) % banners.length)}
        >
          <FiChevronRight />
        </button>
        <div className="dots">
          {banners.map((_, i) => (
            <button
              key={i}
              aria-label={"Banner " + (i + 1)}
              aria-current={slide === i ? "true" : undefined}
              className={slide === i ? "selected" : ""}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>
      </section>
      <HospitalSection />
      <DoctorSection />
      <section className="section pale">
        <div className="container">
          <div className="section-heading">
            <h2>
              Đặt khám <span>theo chuyên khoa</span>
            </h2>
            <Link to="/chuyen-khoa">Xem tất cả →</Link>
          </div>
          <div className="specialty-grid">
            {specialties.slice(0, 8).map((s) => (
              <Link key={s.slug} to={"/chuyen-khoa/" + s.slug}>
                <img src={s.icon} alt="" />
                <h3>{s.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <h2>
            Dịch vụ y tế <span>nổi bật</span>
          </h2>
          <Link to="/dich-vu-y-te">Xem tất cả →</Link>
        </div>
        <div className="card-grid">
          {packages.slice(0, 4).map((p) => (
            <Link
              className="package-card"
              key={p.slug}
              to={"/goi-kham/" + p.slug}
            >
              <img src={p.image} alt="" />
              <div className="card-body">
                <span className="eyebrow">{p.hospital}</span>
                <h3>{p.name}</h3>
                <p className="price">{p.price}</p>
                <span className="text-link">Xem chi tiết →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="app-section">
        <div className="container app-layout">
          <img src={appImage} alt="Ứng dụng Medpro" loading="lazy" />
          <div>
            <span className="eyebrow">MEDPRO · ĐẶT KHÁM NHANH</span>
            <h2>
              Chăm sóc sức khỏe
              <br />
              ngay trong tầm tay
            </h2>
            <p>
              Tìm cơ sở y tế, lựa chọn bác sĩ và lên kế hoạch khám cho cả gia
              đình ở bất cứ đâu.
            </p>
            <div className="stats">
              <div>
                <strong>100+</strong>Bệnh viện
              </div>
              <div>
                <strong>300+</strong>Cơ sở y tế
              </div>
              <div>
                <strong>2.500+</strong>Bác sĩ
              </div>
            </div>
            <Link className="button" to="/huong-dan/cai-dat-ung-dung">
              Khám phá ứng dụng →
            </Link>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <h2>
            Tin tức <span>& kiến thức</span>
          </h2>
          <Link to="/tin-tuc">Xem tất cả →</Link>
        </div>
        <div className="news-grid">
          {articles.slice(0, 3).map((a) => (
            <Link className="news-card" to={"/tin-tuc/" + a.slug} key={a.slug}>
              <img src={a.image} alt="" />
              <div className="card-body">
                <span className="eyebrow">
                  {a.category} · {a.date}
                </span>
                <h3>{a.title}</h3>
                <p>{a.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
