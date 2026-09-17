import { services } from "../data/mockData";
import ServiceCard from "./ServiceCard";
export default function ServiceSection() {
  return (
    <section className="container service-grid" aria-label="Dịch vụ y tế">
      {services.map((service) => (
        <ServiceCard key={service.slug} service={service} />
      ))}
    </section>
  );
}
