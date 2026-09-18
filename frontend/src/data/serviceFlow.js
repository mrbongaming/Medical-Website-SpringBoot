import { demoDoctors, demoSpecialties, getProvider } from "./serviceCatalog";
import { getSlots, firstBookingDate } from "./mockSchedule";

export const examTypes = ["Khám tiêu chuẩn", "Khám và tư vấn chuyên sâu"];
export function getSteps(item) {
  return [
    { id: "options", title: item.flow === "business" ? "Nhu cầu doanh nghiệp" : item.flow === "helper" ? "Gói hỗ trợ" : "Lựa chọn dịch vụ" },
    { id: "schedule", title: item.flow === "business" ? "Thời gian dự kiến" : "Chọn lịch" },
    { id: "person", title: ["business", "helper"].includes(item.flow) ? "Người liên hệ" : "Thông tin người sử dụng" },
    { id: "review", title: "Xem lại" },
  ];
}
export function availableProviders(item, specialtyId) {
  return item.providerIds.map(getProvider).filter((provider) => provider && (!specialtyId || provider.specialtyIds.includes(specialtyId)));
}
export function availableDoctors(item, providerId, specialtyId) {
  if (item.doctorId) return demoDoctors.filter((doctor) => doctor.id === item.doctorId);
  return demoDoctors.filter((doctor) => doctor.providerId === providerId && (!specialtyId || doctor.specialtyId === specialtyId));
}
export function initialSelection(item, user) {
  return {
    specialtyId: item.specialtyIds[0] || "", providerId: "", doctorId: item.doctorId || "",
    examType: examTypes[0], location: item.flow === "home" || item.flow === "helper" ? "home" : "facility",
    address: "", duration: "2", documents: false, company: "", staff: "",
    date: "", time: "", name: user.name, phone: user.phone, email: user.email,
    birthDate: user.birthDate, notes: "",
  };
}
// Changing a parent selection invalidates its dependent choices and availability.
export function changeSelection(current, field, value) {
  const next = { ...current, [field]: value };
  if (field === "specialtyId") Object.assign(next, { providerId: "", doctorId: "", date: "", time: "" });
  if (field === "providerId") Object.assign(next, { doctorId: "", date: "", time: "" });
  if (["doctorId", "location", "duration"].includes(field)) Object.assign(next, { date: "", time: "" });
  if (field === "location" && value === "facility") next.address = "";
  if (field === "date") next.time = "";
  return next;
}
export function validateStep(item, selection, step) {
  if (step === "options") {
    if (!availableProviders(item, selection.specialtyId).some((provider) => provider.id === selection.providerId)) return "Vui lòng chọn đơn vị cung cấp phù hợp.";
    if (item.specialtyIds.length && !item.specialtyIds.includes(selection.specialtyId)) return "Vui lòng chọn chuyên khoa.";
    if (selection.location === "home" && !selection.address.trim()) return "Vui lòng nhập địa chỉ sử dụng dịch vụ.";
    if (item.flow === "certificate" && !selection.documents) return "Vui lòng xác nhận đã xem thông tin giấy tờ mẫu.";
    if (item.flow === "business" && (!selection.company.trim() || !Number.isInteger(Number(selection.staff)) || Number(selection.staff) < 1)) return "Vui lòng nhập tên doanh nghiệp và số người dự kiến hợp lệ.";
  }
  if (step === "schedule") {
    if (!selection.date || selection.date < firstBookingDate()) return "Vui lòng chọn ngày từ ngày mai.";
    if (!getSlots(item.flow, selection.date, selection.providerId, selection.doctorId || item.doctorId).some((slot) => slot.time === selection.time && slot.available)) return "Vui lòng chọn một khung giờ còn trống.";
  }
  if (step === "person") {
    if (!selection.name.trim() || !/^0[0-9]{9}$/.test(selection.phone)) return "Vui lòng nhập họ tên và số điện thoại 10 số bắt đầu bằng 0.";
    if (item.flow === "video" && !selection.notes.trim()) return "Vui lòng mô tả nhu cầu tư vấn.";
  }
  return "";
}
export function selectionRows(item, selection) {
  const provider = getProvider(selection.providerId);
  const doctor = demoDoctors.find((entry) => entry.id === (selection.doctorId || item.doctorId));
  return [
    ["Dịch vụ", item.name],
    ["Chuyên khoa", demoSpecialties.find((entry) => entry.id === selection.specialtyId)?.name],
    ["Đơn vị", provider?.name],
    ["Bác sĩ", doctor?.name],
    ["Hình thức", selection.location === "home" ? (item.flow === "business" ? "Tại doanh nghiệp" : "Tại địa chỉ của bạn") : item.flow === "video" ? "Tư vấn video" : "Tại cơ sở"],
    ["Địa chỉ", selection.location === "home" ? selection.address : item.flow === "video" ? "" : provider?.address],
    ["Dịch vụ khám", ["hospital", "specialty", "doctor", "afterHours"].includes(item.flow) ? selection.examType : ""],
    ["Thời lượng", item.flow === "helper" ? selection.duration + " giờ" : ""],
    ["Doanh nghiệp", item.flow === "business" ? selection.company : ""],
    ["Số người dự kiến", item.flow === "business" ? selection.staff : ""],
    ["Giấy tờ mẫu", item.flow === "certificate" && selection.documents ? "Đã xem thông tin minh họa" : ""],
    ["Ngày", selection.date ? selection.date.split("-").reverse().join("/") : ""],
    ["Giờ", selection.time],
    ["Họ tên", selection.name],
    ["Điện thoại", selection.phone],
    ["Email", selection.email],
    ["Ngày sinh", !["business", "helper"].includes(item.flow) && selection.birthDate ? selection.birthDate.split("-").reverse().join("/") : ""],
    ["Ghi chú", selection.notes],
  ].filter(([, value]) => value);
}
export function estimatedPrice(item, selection) {
  return item.price * (item.flow === "helper" ? Number(selection.duration) / 2 : item.flow === "business" ? Number(selection.staff || 1) : 1);
}
