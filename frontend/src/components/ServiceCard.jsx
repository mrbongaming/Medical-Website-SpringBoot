import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { getGroup } from "../data/serviceCatalog";

export default function ServiceCard({ service }) {
  const entry = getGroup(service.slug) || service;
  const content = <><img src={entry.image} alt="" loading="lazy" /><span>{entry.name}{entry.external && <FiArrowUpRight className="external-service-icon" />}</span>{entry.description && <small className="service-card-description">{entry.description}</small>}</>;
  return entry.external
    ? <a className="service-card" href={entry.href} target="_blank" rel="noopener noreferrer" aria-label={entry.name + " (mở tab mới)"}>{content}</a>
    : <Link className="service-card" to={entry.href || "/dich-vu-y-te/" + entry.slug}>{content}</Link>;
}
