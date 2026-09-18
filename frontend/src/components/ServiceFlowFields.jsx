import { Field } from "./ServiceUI";
import { demoDoctors, demoSpecialties } from "../data/serviceCatalog";
import { availableDoctors, availableProviders, examTypes } from "../data/serviceFlow";
import { firstBookingDate, getSlots, localDate } from "../data/mockSchedule";

export function ServiceOptions({ item, selection, onChange }) {
  const choices = availableProviders(item, selection.specialtyId);
  const doctors = availableDoctors(item, selection.providerId, selection.specialtyId);
  const fixedDoctor = demoDoctors.find((doctor) => doctor.id === item.doctorId);
  const fieldProps = (name) => ({ value: selection[name], onChange: (event) => onChange(name, event.target.value) });
  return <>
    <p className="muted">{item.description}</p>
    {item.specialtyIds.length > 0 && <Field label="Chuyên khoa"><select {...fieldProps("specialtyId")}>{demoSpecialties.filter((specialty) => item.specialtyIds.includes(specialty.id)).map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></Field>}
    <Field label={item.flow === "vaccine" ? "Điểm tiêm" : "Đơn vị cung cấp"}><select required {...fieldProps("providerId")}><option value="">Chọn đơn vị</option>{choices.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} · {provider.city}</option>)}</select></Field>
    {fixedDoctor && <p className="notice">Bác sĩ đã chọn: <strong>{fixedDoctor.name}</strong></p>}
    {!fixedDoctor && ["specialty", "afterHours"].includes(item.flow) && <Field label="Bác sĩ"><select {...fieldProps("doctorId")} disabled={!selection.providerId}><option value="">Cơ sở sắp xếp bác sĩ phù hợp</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select></Field>}
    {["hospital", "specialty", "doctor", "afterHours"].includes(item.flow) && <Field label="Dịch vụ khám"><select {...fieldProps("examType")}>{examTypes.map((type) => <option key={type}>{type}</option>)}</select><small>Hai lựa chọn có cùng mức giá minh họa.</small></Field>}
    {(item.homeSupported || item.flow === "business") && <Field label="Địa điểm sử dụng dịch vụ"><select {...fieldProps("location")}><option value="facility">Tại cơ sở</option><option value="home">{item.flow === "business" ? "Tại doanh nghiệp" : "Lấy mẫu tại nhà"}</option></select></Field>}
    {item.flow === "helper" && <Field label="Thời lượng hỗ trợ"><select {...fieldProps("duration")}>{[2, 4, 8].map((hours) => <option value={hours} key={hours}>{hours} giờ</option>)}</select></Field>}
    {item.flow === "business" && <div className="form-two-columns"><Field label="Tên doanh nghiệp"><input required {...fieldProps("company")} placeholder="Nhập tên doanh nghiệp" /></Field><Field label="Số người dự kiến"><input required type="number" min="1" step="1" {...fieldProps("staff")} placeholder="Ví dụ: 50" /></Field></div>}
    {selection.location === "home" && <Field label={item.flow === "business" ? "Địa chỉ doanh nghiệp" : "Địa chỉ sử dụng dịch vụ"}><textarea required rows="3" {...fieldProps("address")} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" /></Field>}
    {item.flow === "certificate" && <div className="notice"><p>Mục đích: <strong>{item.category}</strong>. Giấy tờ mẫu gồm giấy tờ tùy thân, ảnh chân dung và thông tin mục đích khám. Không tải tài liệu lên.</p><label className="check-field"><input type="checkbox" required checked={selection.documents} onChange={(event) => onChange("documents", event.target.checked)} /> Tôi đã xem thông tin giấy tờ minh họa</label></div>}
    {item.flow === "vaccine" && <p className="notice">Buổi hẹn mẫu gồm tư vấn và sàng lọc tại điểm tiêm. Nhóm tham khảo: {item.category}.</p>}
    {item.promotionTerms && <p className="notice">{item.promotionTerms}</p>}
  </>;
}
export function ScheduleFields({ item, selection, onChange }) {
  const slots = getSlots(item.flow, selection.date, selection.providerId, selection.doctorId || item.doctorId);
  return <>
    <p className="muted">{item.flow === "afterHours" ? "Lịch buổi tối dành cho dịch vụ khám ngoài giờ." : item.flow === "business" ? "Chọn thời gian dự kiến để trao đổi kế hoạch với đơn vị cung cấp." : "Chọn ngày và khung giờ thuận tiện cho bạn."}</p>
    <Field label={item.flow === "business" ? "Ngày dự kiến" : "Ngày sử dụng dịch vụ"}><input required type="date" min={firstBookingDate()} value={selection.date} onChange={(event) => onChange("date", event.target.value)} /></Field>
    <fieldset className="slot-fieldset"><legend>Khung giờ mẫu</legend>
      {!selection.date ? <p className="notice">Chọn ngày để xem các khung giờ.</p> : <div className="time-grid">{slots.map((slot) => <button type="button" key={slot.time} disabled={!slot.available} aria-pressed={selection.time === slot.time} className={selection.time === slot.time ? "selected" : ""} onClick={() => onChange("time", slot.time)}>{slot.time}{!slot.available && <small>Hết chỗ</small>}</button>)}</div>}
    </fieldset>
    <p className="demo-caption">Tất cả lịch và tình trạng còn chỗ là dữ liệu minh họa.</p>
  </>;
}
export function PersonFields({ item, selection, onChange }) {
  const fieldProps = (name) => ({ value: selection[name], onChange: (event) => onChange(name, event.target.value) });
  return <>
    <p className="muted">Thông tin được điền từ hồ sơ mẫu. Bạn có thể chỉnh sửa cho lần xem trước này.</p>
    <div className="form-two-columns">
      <Field label={["business", "helper"].includes(item.flow) ? "Họ tên người liên hệ" : "Họ tên người sử dụng"}><input required autoComplete="name" {...fieldProps("name")} /></Field>
      <Field label="Số điện thoại"><input required type="tel" inputMode="tel" pattern="0[0-9]{9}" title="10 số, bắt đầu bằng 0" {...fieldProps("phone")} /></Field>
      <Field label="Email"><input type="email" {...fieldProps("email")} /></Field>
      {!["business", "helper"].includes(item.flow) && <Field label="Ngày sinh người sử dụng"><input required type="date" max={localDate(new Date())} {...fieldProps("birthDate")} /></Field>}
    </div>
    <Field label={item.flow === "video" ? "Nhu cầu tư vấn" : "Ghi chú thêm"}><textarea rows="4" required={item.flow === "video"} {...fieldProps("notes")} placeholder={item.flow === "video" ? "Bạn muốn trao đổi điều gì với bác sĩ?" : "Thông tin cần lưu ý cho buổi hẹn..."} /></Field>
  </>;
}
