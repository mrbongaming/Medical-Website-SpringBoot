import { Link } from "react-router-dom";
export default function ServiceCard({ service }) {
  return (
    <Link className="service-card" to={"/dich-vu-y-te/" + service.slug}>
      <img src={service.image} alt="" loading="lazy" />
      <span>{service.name}</span>
    </Link>
  );
}
