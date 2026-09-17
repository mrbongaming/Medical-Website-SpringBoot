import { Link } from "react-router-dom";
import { hospitals } from "../data/mockData";
import HospitalCard from "./HospitalCard";
export default function HospitalSection() {
  return (
    <section className="section pale">
      <div className="container">
        <div className="section-heading">
          <h2>
            Cơ sở y tế <span>nổi bật trong tháng</span>
          </h2>
          <Link to="/co-so-y-te">Xem tất cả →</Link>
        </div>
        <div className="card-grid">
          {hospitals.slice(0, 4).map((h) => (
            <HospitalCard key={h.slug} hospital={h} />
          ))}
        </div>
      </div>
    </section>
  );
}
