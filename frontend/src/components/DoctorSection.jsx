import { Link } from "react-router-dom";
import { doctors } from "../data/mockData";
import DoctorCard from "./DoctorCard";
export default function DoctorSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <h2>
            Tư vấn trực tuyến <span>cùng bác sĩ</span>
          </h2>
          <Link to="/bac-si">Xem tất cả →</Link>
        </div>
        <div className="card-grid">
          {doctors.slice(0, 4).map((d) => (
            <DoctorCard key={d.slug} doctor={d} />
          ))}
        </div>
      </div>
    </section>
  );
}
