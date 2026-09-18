import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiClock, FiMapPin } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { IncludedItems, ServiceEmpty } from "../components/ServiceUI";
import { bookingPath, demoDoctors, formatPrice, getGroup, getItem, getProvider } from "../data/serviceCatalog";

export default function ServiceDetail() {
  const { serviceSlug, itemSlug } = useParams();
  const group = getGroup(serviceSlug);
  const item = getItem(serviceSlug, itemSlug);
  if (!group || !item) return <ServiceEmpty missing />;
  const doctor = demoDoctors.find((entry) => entry.id === item.doctorId);
  return <div className="page-background">
    <PageHeader title={item.name} subtitle={group.name} />
    <div className="container">
      <Link className="service-back" to={group.href}><FiArrowLeft /> Quay lại {group.name.toLowerCase()}</Link>
      <div className="detail-layout">
        <div>
          <section className="panel service-detail-heading">
            <img className={doctor ? "portrait" : ""} src={item.image} alt={item.name} />
            <div><span className="badge">{item.category}</span><h2>{item.name}</h2><p>{item.description}</p><p className="muted"><FiClock /> {item.duration}</p>{doctor && <p>{doctor.experience}</p>}</div>
          </section>
          <section className="panel"><h2>Hạng mục dịch vụ</h2><IncludedItems items={item.contents} /><p className="notice">{item.note}</p></section>
          <section className="panel"><h2>Đơn vị cung cấp mẫu</h2><div className="provider-options">{item.providerIds.map((id) => { const provider = getProvider(id); return <article key={id}><FiMapPin /><div><h3>{provider.name}</h3><p>{provider.address}</p></div></article>; })}</div></section>
          {item.flow === "certificate" && <section className="panel"><h2>Giấy tờ minh họa</h2><IncludedItems items={["Giấy tờ tùy thân", "Ảnh chân dung theo yêu cầu của cơ sở", "Thông tin mục đích sử dụng giấy khám"]} /><p className="muted">Không cần tải tài liệu lên trong bản demo.</p></section>}
          {item.flow === "vaccine" && <section className="panel"><h2>Thông tin trước buổi hẹn</h2><p>Gói dành cho nhóm: {item.category.toLowerCase()}. Lịch hiển thị là lịch hẹn tư vấn và sàng lọc mẫu tại điểm tiêm.</p></section>}
        </div>
        <aside className="panel booking-summary">
          <span className="eyebrow">CHI PHÍ THAM KHẢO</span>{item.originalPrice && <del>{formatPrice(item.originalPrice)}</del>}<p className="service-price">{formatPrice(item.price)} <small>{item.priceUnit}</small></p>
          {item.promotionTerms && <p className="notice">{item.promotionTerms}</p>}
          {item.homeSupported && <p className="badge">Có lựa chọn lấy mẫu tại nhà</p>}
          <Link className="button full" to={bookingPath(item)}>{item.flow === "business" || item.flow === "helper" ? "Tạo yêu cầu mẫu" : "Chọn lịch phù hợp"} →</Link>
          <p className="demo-caption">Chỉ xem trước thông tin. Không tạo lịch hẹn hoặc thanh toán thực tế.</p>
        </aside>
      </div>
    </div>
  </div>;
}
