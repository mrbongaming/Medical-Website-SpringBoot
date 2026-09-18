import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiMapPin } from "react-icons/fi";
import { detailPath, formatPrice, getProvider } from "../data/serviceCatalog";

export function ServiceEmpty({ missing = false, onReset }) {
  return <div className="empty-state">
    <h2>{missing ? "Không tìm thấy dịch vụ" : "Chưa có lựa chọn phù hợp"}</h2>
    <p>{missing ? "Dịch vụ hoặc đường dẫn này không có trong danh mục." : "Thử thay đổi từ khóa hoặc bộ lọc để xem thêm dịch vụ."}</p>
    {onReset ? <button className="button outline" onClick={onReset}>Xóa bộ lọc</button> : <Link className="button" to="/dich-vu-y-te">Xem tất cả dịch vụ</Link>}
  </div>;
}
export function OfferingCard({ item }) {
  return <Link className="offering-card" to={detailPath(item)}>
    <div className={"offering-visual " + (item.doctorId ? "portrait" : "")}>
      <img src={item.image} alt="" loading="lazy" />
      <span className="offering-tag">{item.originalPrice ? "Ưu đãi 20%" : item.category}</span>
    </div>
    <div className="offering-body">
      <span className="eyebrow">DỊCH VỤ THAM KHẢO</span>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <span className="offering-provider"><FiMapPin /> {getProvider(item.providerIds[0])?.name}{item.providerIds.length > 1 ? " +" + (item.providerIds.length - 1) : ""}</span>
      <div className="offering-bottom">
        <div>{item.originalPrice && <del>{formatPrice(item.originalPrice)}</del>}<strong>{formatPrice(item.price)} <small>{item.priceUnit}</small></strong></div>
        <span className="offering-arrow" aria-label="Xem chi tiết"><FiArrowRight /></span>
      </div>
    </div>
  </Link>;
}
export function Field({ label, children }) {
  return <label className="field">{label}{children}</label>;
}
export function SummaryRows({ rows }) {
  return <dl className="service-summary">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
export function IncludedItems({ items }) {
  return <ul className="included-list">{items.map((item) => <li key={item}><FiCheckCircle /><span>{item}</span></li>)}</ul>;
}
