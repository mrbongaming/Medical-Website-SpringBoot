import { Link } from "react-router-dom";
export default function DoctorCard({ doctor }) {
  return (
    <article className="doctor-card">
      <Link to={"/bac-si/" + doctor.slug}>
        <div className="doctor-image">
          <img src={doctor.image} alt={doctor.name} loading="lazy" />
        </div>
      </Link>
      <div className="card-body">
        <span className="eyebrow">{doctor.hospital}</span>
        <Link to={"/bac-si/" + doctor.slug}>
          <h3>{doctor.name}</h3>
        </Link>
        <p className="muted">{doctor.specialty}</p>
        <p className="price">{doctor.price}</p>
        <Link className="button outline full" to={"/bac-si/" + doctor.slug}>
          Tư vấn ngay
        </Link>
      </div>
    </article>
  );
}
