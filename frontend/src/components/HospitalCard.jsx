import { Link } from "react-router-dom";
import { FiMapPin } from "react-icons/fi";
export default function HospitalCard({ hospital, list = false }) {
  return (
    <article className={"hospital-card " + (list ? "list-card" : "")}>
      <Link className="hospital-image" to={"/co-so-y-te/" + hospital.slug}>
        <img src={hospital.image} alt={hospital.name} loading="lazy" />
      </Link>
      <div className="card-body">
        <Link to={"/co-so-y-te/" + hospital.slug}>
          <h3>{hospital.name}</h3>
        </Link>
        <p className="muted location">
          <FiMapPin /> {list ? hospital.address : hospital.city}
        </p>
        <div className="rating">
          <span aria-label="5 sao">★★★★★</span>{" "}
          <small>({hospital.rating})</small>
        </div>
        <div className="card-actions">
          {list && (
            <Link
              className="button outline"
              to={"/co-so-y-te/" + hospital.slug}
            >
              Xem chi tiết
            </Link>
          )}
          <Link className="button" to={"/dat-kham/" + hospital.slug}>
            Đặt khám ngay
          </Link>
        </div>
      </div>
    </article>
  );
}
