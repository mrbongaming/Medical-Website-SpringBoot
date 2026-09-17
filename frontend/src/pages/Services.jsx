import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  services,
  specialties,
  doctors,
  packages,
  hospitals,
  normalize,
} from "../data/mockData";
import ServiceCard from "../components/ServiceCard";
import DoctorCard from "../components/DoctorCard";
import HospitalCard from "../components/HospitalCard";
import PageHeader from "../components/PageHeader";

export default function Services({ mode = "services" }) {
  const { slug } = useParams();
  const [query, setQuery] = useState("");
  const service = services.find((s) => s.slug === slug);
  const specialty = specialties.find((s) => s.slug === slug);
  if (slug && !service && !specialty)
    return (
      <div className="empty-state">
        <h1>Không tìm thấy dịch vụ</h1>
        <Link to="/dich-vu-y-te" className="button">
          Xem dịch vụ y tế
        </Link>
      </div>
    );
  const doctorMode =
    mode === "doctors" ||
    ["tu-van-kham-benh-tu-xa", "dat-kham-theo-bac-si"].includes(slug);
  const specialtyMode =
    mode === "specialties" || slug === "dat-kham-chuyen-khoa";
  const title =
    service?.name ||
    specialty?.name ||
    (doctorMode
      ? "Đội ngũ bác sĩ"
      : specialtyMode
        ? "Đặt khám theo chuyên khoa"
        : "Dịch vụ y tế");
  const hospitalMode =
    specialty || ["dat-kham-tai-co-so", "dat-kham-ngoai-gio"].includes(slug);
  return (
    <div className="page-background">
      <PageHeader
        title={title}
        subtitle="Lựa chọn dịch vụ chăm sóc sức khỏe phù hợp với bạn và gia đình"
      />
      <div className="container">
        {service?.banner && (
          <img
            className="service-banner"
            src={service.banner}
            alt={service.name}
          />
        )}
        {!slug && mode === "services" && (
          <div className="service-grid service-page-grid">
            {services.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        )}
        <div className="section-heading">
          <h2>
            {doctorMode
              ? "Chọn bác sĩ"
              : specialtyMode
                ? "Chọn chuyên khoa"
                : hospitalMode
                  ? "Cơ sở y tế"
                  : "Gói dịch vụ"}
          </h2>
          <input
            className="filter-input"
            aria-label="Tìm dịch vụ"
            placeholder="Tìm kiếm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {doctorMode ? (
          <div className="card-grid">
            {doctors
              .filter((d) =>
                normalize(d.name + d.specialty).includes(normalize(query)),
              )
              .map((d) => (
                <DoctorCard key={d.slug} doctor={d} />
              ))}
          </div>
        ) : specialtyMode && !specialty ? (
          <div className="specialty-grid">
            {specialties
              .filter((s) => normalize(s.name).includes(normalize(query)))
              .map((s) => (
                <Link key={s.slug} to={"/chuyen-khoa/" + s.slug}>
                  <img src={s.icon} alt="" />
                  <h3>{s.name}</h3>
                </Link>
              ))}
          </div>
        ) : hospitalMode ? (
          <>
            <p className="muted">Danh sách cơ sở tham khảo với dữ liệu mẫu.</p>
            <div className="card-grid">
              {hospitals
                .filter((h) => normalize(h.name).includes(normalize(query)))
                .slice(0, 8)
                .map((h) => (
                  <HospitalCard key={h.slug} hospital={h} />
                ))}
            </div>
          </>
        ) : (
          <div className="card-grid">
            {packages
              .filter((p) =>
                normalize(p.name + p.hospital).includes(normalize(query)),
              )
              .map((p) => (
                <Link
                  className="package-card"
                  key={p.slug}
                  to={"/goi-kham/" + p.slug}
                >
                  <img src={p.image} alt="" loading="lazy" />
                  <div className="card-body">
                    <span className="eyebrow">{p.hospital}</span>
                    <h3>{p.name}</h3>
                    <p className="price">{p.price}</p>
                    <span className="text-link">Xem chi tiết →</span>
                  </div>
                </Link>
              ))}
          </div>
        )}
        {query && (
          <p className="search-help">
            Không thấy lựa chọn phù hợp?{" "}
            <button className="text-link" onClick={() => setQuery("")}>
              Xóa tìm kiếm
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
