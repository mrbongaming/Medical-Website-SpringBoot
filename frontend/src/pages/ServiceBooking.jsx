import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { ServiceEmpty, SummaryRows } from "../components/ServiceUI";
import { PersonFields, ScheduleFields, ServiceOptions } from "../components/ServiceFlowFields";
import DemoVideoRoom from "../components/DemoVideoRoom";
import { demoDoctors, detailPath, formatPrice, getGroup, getItem } from "../data/serviceCatalog";
import { changeSelection, estimatedPrice, getSteps, initialSelection, selectionRows, validateStep } from "../data/serviceFlow";
import { mockUser } from "../data/mockAccount";

export default function ServiceBooking() {
  const { serviceSlug, itemSlug } = useParams();
  const group = getGroup(serviceSlug);
  const item = getItem(serviceSlug, itemSlug);
  if (!group || !item) return <ServiceEmpty missing />;
  return <BookingContent key={serviceSlug + "/" + itemSlug} group={group} item={item} />;
}
function BookingContent({ group, item }) {
  const [selection, setSelection] = useState(() => initialSelection(item, mockUser));
  const [stepIndex, setStepIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const headingRef = useRef(null);
  const steps = getSteps(item);
  const step = steps[stepIndex];
  const rows = selectionRows(item, selection);
  const total = estimatedPrice(item, selection);
  const doctor = demoDoctors.find((entry) => entry.id === item.doctorId);
  const requestMode = ["helper", "business"].includes(item.flow);
  function change(field, value) {
    setSelection((current) => changeSelection(current, field, value));
    setError("");
  }
  function goTo(index) {
    setStepIndex(index);
    setError("");
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }
  function submit(event) {
    event.preventDefault();
    const errorMessage = step.id === "review"
      ? steps.slice(0, -1).map((entry) => validateStep(item, selection, entry.id)).find(Boolean)
      : validateStep(item, selection, step.id);
    if (errorMessage) { setError(errorMessage); return; }
    if (step.id === "review") {
      setConfirmed(true);
      requestAnimationFrame(() => headingRef.current?.focus());
    } else goTo(stepIndex + 1);
  }
  return <div className="page-background service-booking-page">
    <PageHeader title={requestMode ? "Yêu cầu dịch vụ mẫu" : "Lựa chọn lịch hẹn"} subtitle={group.name} />
    <div className="container">
      <Link className="service-back" to={detailPath(item)}><FiArrowLeft /> Thông tin dịch vụ</Link>
      <ol className="flow-steps" aria-label="Tiến trình đặt dịch vụ">{steps.map((entry, index) => <li key={entry.id} className={index === stepIndex ? "current" : index < stepIndex ? "complete" : ""} aria-current={!confirmed && index === stepIndex ? "step" : undefined}><span>{index < stepIndex || confirmed ? <FiCheckCircle /> : index + 1}</span>{entry.title}</li>)}</ol>
      <div className="service-booking-layout">
        <section className="panel flow-panel">
          {confirmed ? <>
            <div className="flow-confirmation"><FiCheckCircle /><h2 ref={headingRef} tabIndex="-1">{requestMode ? "Yêu cầu mẫu của bạn" : "Lịch hẹn mẫu của bạn"}</h2><p role="status">Bạn đã hoàn tất bản xem trước. Chưa có thông tin nào được gửi tới đơn vị cung cấp.</p></div>
            <SummaryRows rows={[...rows, ["Chi phí minh họa", formatPrice(total)]]} />
            {item.promotionTerms && <p className="notice">{item.promotionTerms}</p>}
            {item.flow === "video" && <DemoVideoRoom doctorName={doctor?.name || item.name} image={item.image} />}
            <div className="flow-actions"><button className="button outline" type="button" onClick={() => { setConfirmed(false); goTo(0); }}>Chỉnh sửa thông tin</button><Link className="button" to={group.href}>Khám phá dịch vụ khác</Link></div>
          </> : <form onSubmit={submit}>
            <span className="service-kicker">BƯỚC {stepIndex + 1} / {steps.length}</span>
            <h2 ref={headingRef} tabIndex="-1" className="flow-heading">{step.title}</h2>
            {step.id === "options" && <ServiceOptions item={item} selection={selection} onChange={change} />}
            {step.id === "schedule" && <ScheduleFields item={item} selection={selection} onChange={change} />}
            {step.id === "person" && <PersonFields item={item} selection={selection} onChange={change} />}
            {step.id === "review" && <><p className="notice">Kiểm tra thông tin trước khi hoàn tất bản xem trước. Không phát sinh đặt lịch hay thanh toán.</p><SummaryRows rows={[...rows, ["Chi phí minh họa", formatPrice(total)]]} />{item.promotionTerms && <p>{item.promotionTerms}</p>}</>}
            {error && <p role="alert" className="form-error">{error}</p>}
            <div className="flow-actions">
              {stepIndex > 0 && <button type="button" className="button outline" onClick={() => goTo(stepIndex - 1)}>← Quay lại</button>}
              <button className="button" type="submit">{step.id === "review" ? "Hoàn tất bản xem trước" : "Tiếp tục →"}</button>
            </div>
          </form>}
        </section>
        <aside className="panel flow-aside">
          <span className="eyebrow">DỊCH VỤ ĐÃ CHỌN</span>
          <img src={item.image} alt="" />
          <h3>{item.name}</h3>
          {item.originalPrice && <del>{formatPrice(item.originalPrice)}</del>}
          <p className="service-price">{formatPrice(item.price)} <small>{item.priceUnit}</small></p>
          <SummaryRows rows={rows.filter(([label]) => ["Đơn vị", "Ngày", "Giờ", "Thời lượng", "Số người dự kiến"].includes(label))} />
          <div className="estimate-line"><span>Ước tính mẫu</span><strong>{formatPrice(total)}</strong></div>
          <p className="demo-caption">Dữ liệu chỉ lưu trong lần xem này. Tải lại trang sẽ khôi phục trạng thái mặc định.</p>
        </aside>
      </div>
    </div>
  </div>;
}
