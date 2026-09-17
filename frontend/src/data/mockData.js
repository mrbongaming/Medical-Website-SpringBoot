import reference from "./reference.json";

export const {
  hospitals,
  doctors,
  services,
  specialties,
  packages,
  banners,
  logo,
  hero,
  appImage,
} = reference;
export const hospitalTypes = [
  "Tất cả",
  "Bệnh viện công",
  "Bệnh viện tư",
  "Phòng khám",
  "Phòng mạch",
  "Xét nghiệm",
  "Y tế tại nhà",
  "Tiêm chủng",
];
export const guides = [
  ["cai-dat-ung-dung", "Cài đặt ứng dụng"],
  ["dat-lich-kham", "Đặt lịch khám"],
  ["tu-van-kham-benh-qua-video", "Tư vấn khám bệnh qua video"],
  ["quy-trinh-huy-phieu", "Quy trình hủy phiếu"],
  ["quy-trinh-hoan-phi", "Quy trình hoàn phí"],
  ["cau-hoi-thuong-gap", "Câu hỏi thường gặp"],
  ["quy-trinh-di-kham", "Quy trình đi khám"],
];
export const articles = [
  {
    slug: "chu-dong-cham-soc-suc-khoe",
    title: "Chủ động chăm sóc sức khỏe cho cả gia đình",
    category: "Tin y tế",
    image: banners[0],
    date: "17/09/2026",
    summary:
      "Sắp xếp lịch khám phù hợp và tìm hiểu các dịch vụ chăm sóc sức khỏe dành cho gia đình.",
  },
  {
    slug: "dat-kham-truc-tuyen",
    title: "Đặt khám trực tuyến: thuận tiện ngay từ bước đầu tiên",
    category: "Tin dịch vụ",
    image: banners[3],
    date: "16/09/2026",
    summary:
      "Tìm cơ sở y tế, lựa chọn chuyên khoa và xem lịch hẹn chỉ trong vài bước.",
  },
  {
    slug: "kham-suc-khoe-dinh-ky",
    title: "Chuẩn bị gì trước buổi khám sức khỏe định kỳ?",
    category: "Y học thường thức",
    image: services[0].banner,
    date: "15/09/2026",
    summary:
      "Chuẩn bị giấy tờ, thông tin lịch hẹn và các câu hỏi bạn muốn trao đổi với bác sĩ.",
  },
  {
    slug: "bac-si-tu-xa",
    title: "Kết nối với bác sĩ qua tư vấn video",
    category: "Tin dịch vụ",
    image: services[2].banner,
    date: "14/09/2026",
    summary:
      "Khám phá hình thức tư vấn từ xa và chọn thời gian phù hợp với lịch trình của bạn.",
  },
  {
    slug: "dich-vu-tai-nha",
    title: "Tìm hiểu dịch vụ chăm sóc y tế tại nhà",
    category: "Tin y tế",
    image: banners[2],
    date: "12/09/2026",
    summary:
      "Tham khảo các lựa chọn dịch vụ tại nhà cho người thân và gia đình.",
  },
  {
    slug: "hanh-trinh-di-kham",
    title: "Một lịch hẹn rõ ràng, một hành trình an tâm",
    category: "Y học thường thức",
    image: services[3].banner,
    date: "10/09/2026",
    summary:
      "Lưu lại thông tin cơ sở, thời gian và giấy tờ cần thiết trước ngày khám.",
  },
];
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}
