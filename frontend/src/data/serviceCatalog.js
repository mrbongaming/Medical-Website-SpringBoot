import reference from "./reference.json";

// All providers, affiliations, prices and availability below are demonstration data.
export const demoSpecialties = [
  { id: "general", name: "Nội tổng quát" },
  { id: "skin", name: "Da liễu" },
  { id: "heart", name: "Tim mạch" },
  { id: "children", name: "Nhi khoa" },
];
export const providers = [
  { id: "an-tam", name: "Trung tâm An Tâm", city: "TP.HCM", address: "12 Đường Hoa Mai, TP.HCM (địa chỉ mẫu)", specialtyIds: ["general", "skin", "heart"], image: reference.hospitals[0].image },
  { id: "binh-an", name: "Phòng khám Bình An", city: "Hà Nội", address: "28 Đường Hoa Sen, Hà Nội (địa chỉ mẫu)", specialtyIds: ["general", "children", "skin"], image: reference.hospitals[1].image },
  { id: "gia-dinh", name: "Trung tâm Sức Khỏe Gia Đình", city: "TP.HCM", address: "45 Đường Hoa Đào, TP.HCM (địa chỉ mẫu)", specialtyIds: ["general", "heart", "children"], image: reference.hospitals[2].image },
  { id: "hanh-phuc", name: "Phòng khám Hạnh Phúc", city: "Đà Nẵng", address: "16 Đường Hoa Lan, Đà Nẵng (địa chỉ mẫu)", specialtyIds: ["skin", "heart", "children"], image: reference.hospitals[3].image },
];
export const demoDoctors = demoSpecialties.map((specialty, index) => ({
  id: "doctor-" + (index + 1),
  name: ["BS. Nguyễn Minh Anh", "BS. Trần Hoài An", "BS. Lê Quốc Bảo", "BS. Phạm Ngọc Mai"][index],
  specialtyId: specialty.id,
  providerId: providers[index].id,
  image: reference.doctors[index].image,
  experience: [12, 9, 15, 10][index] + " năm kinh nghiệm (hồ sơ mẫu)",
}));

const definitions = [
  ["hospital", "Chọn cơ sở, chuyên khoa và lịch khám phù hợp.", "Cơ sở y tế"],
  ["specialty", "Tìm dịch vụ theo chuyên khoa bạn quan tâm.", "Chuyên khoa"],
  ["video", "Gặp bác sĩ qua giao diện tư vấn video mẫu.", "Chuyên khoa"],
  ["test", "Các gói xét nghiệm tại cơ sở và lấy mẫu tại nhà.", "Nhóm xét nghiệm"],
  ["afterHours", "Lựa chọn lịch khám buổi tối, thuận tiện sau giờ làm.", "Chuyên khoa"],
  ["helper", "Hỗ trợ sinh hoạt và chăm sóc người thân.", "Loại hỗ trợ"],
  ["certificate", "Chọn gói khám theo mục đích sử dụng giấy khám.", "Mục đích khám"],
  ["doctor", "Tìm bác sĩ theo chuyên khoa và cơ sở.", "Chuyên khoa"],
  ["package", "Gói khám rõ hạng mục, dễ chọn theo nhu cầu.", "Nhu cầu"],
  ["home", "Chăm sóc sức khỏe tại địa chỉ của bạn.", "Loại dịch vụ"],
  ["vaccine", "Tham khảo vaccine và gói tiêm chủng.", "Đối tượng"],
  ["external", "Khám phá sản phẩm tại website Nhà thuốc An Khang.", ""],
  ["business", "Chọn giải pháp khám sức khỏe cho đội ngũ.", "Quy mô"],
  ["imaging", "Tìm gói chẩn đoán hình ảnh và nội soi.", "Kỹ thuật"],
  ["aesthetic", "Đặt lịch trao đổi nhu cầu với bác sĩ.", "Nhu cầu tư vấn"],
  ["promotion", "Khám phá các gói có giá ưu đãi minh họa.", "Loại dịch vụ"],
];
export const serviceCatalog = reference.services.map((service, index) => ({
  ...service,
  flow: definitions[index][0],
  description: definitions[index][1],
  filterLabel: definitions[index][2],
  href: index === 11 ? "https://www.nhathuocankhang.com/" : index === 12 ? "/kham-suc-khoe-doanh-nghiep" : "/dich-vu-y-te/" + service.slug,
  external: index === 11,
}));

// Each row is an individual offering: name, category, price, included items.
const seeds = {
  test: [
    ["Xét nghiệm tổng quát cơ bản", "Tổng quát", 390000, ["Công thức máu", "Đường huyết", "Chức năng gan"]],
    ["Gói xét nghiệm chuyển hóa", "Chuyển hóa", 650000, ["HbA1c", "Bộ mỡ máu", "Tư vấn kết quả"]],
    ["Gói xét nghiệm chức năng gan", "Gan mật", 480000, ["AST và ALT", "Bilirubin", "Tư vấn kết quả"]],
    ["Gói xét nghiệm chức năng thận", "Thận", 420000, ["Ure", "Creatinine", "Tổng phân tích nước tiểu"]],
  ],
  helper: [
    ["Hỗ trợ sinh hoạt người cao tuổi", "Người cao tuổi", 280000, ["Hỗ trợ sinh hoạt", "Chuẩn bị bữa ăn", "Đồng hành tại nhà"]],
    ["Đồng hành khi đi khám", "Đi khám", 320000, ["Đón tại địa chỉ hẹn", "Hỗ trợ thủ tục", "Đồng hành tại cơ sở"]],
    ["Hỗ trợ gia đình ban ngày", "Gia đình", 250000, ["Dọn khu vực sinh hoạt", "Chuẩn bị bữa ăn", "Hỗ trợ việc thường ngày"]],
    ["Hỗ trợ người cần nghỉ dưỡng", "Nghỉ dưỡng", 350000, ["Hỗ trợ sinh hoạt", "Sắp xếp không gian nghỉ", "Đồng hành cùng người thân"]],
  ],
  certificate: [
    ["Khám sức khỏe xin việc", "Xin việc", 450000, ["Khám tổng quát", "Hạng mục theo gói", "Giấy khám minh họa"]],
    ["Khám sức khỏe nhập học", "Nhập học", 350000, ["Khám thể lực", "Khám tổng quát", "Giấy khám minh họa"]],
    ["Khám sức khỏe lái xe", "Lái xe", 500000, ["Khám mắt", "Khám chuyên khoa theo gói", "Giấy khám minh họa"]],
    ["Khám sức khỏe lao động", "Lao động", 850000, ["Khám tổng quát", "Xét nghiệm theo gói", "Giấy khám minh họa"]],
  ],
  package: [
    ["Khám sức khỏe cơ bản", "Tổng quát", 890000, ["Khám nội", "Xét nghiệm cơ bản", "Siêu âm bụng"]],
    ["Khám sức khỏe chuyên sâu", "Chuyên sâu", 1890000, ["Khám chuyên khoa", "Xét nghiệm mở rộng", "Tư vấn kết quả"]],
    ["Gói sức khỏe phụ nữ", "Phụ nữ", 1290000, ["Khám tổng quát", "Tư vấn sức khỏe phụ nữ", "Xét nghiệm theo gói"]],
    ["Gói sức khỏe người cao tuổi", "Người cao tuổi", 1590000, ["Khám nội", "Đánh giá vận động", "Tư vấn dinh dưỡng"]],
  ],
  home: [
    ["Khám tổng quát tại nhà", "Khám tại nhà", 650000, ["Khám tổng quát", "Đo chỉ số cơ bản", "Tư vấn kết quả"]],
    ["Chăm sóc điều dưỡng tại nhà", "Điều dưỡng", 450000, ["Đánh giá nhu cầu", "Chăm sóc theo lịch mẫu", "Hướng dẫn người thân"]],
    ["Vật lý trị liệu tại nhà", "Phục hồi chức năng", 550000, ["Đánh giá vận động", "Buổi hỗ trợ vận động", "Hướng dẫn theo dõi"]],
    ["Tư vấn dinh dưỡng tại nhà", "Dinh dưỡng", 500000, ["Trao đổi chế độ ăn", "Đánh giá nhu cầu", "Tư vấn thói quen"]],
  ],
  vaccine: [
    ["Tư vấn và tiêm vaccine cúm", "Người lớn", 350000, ["Khám sàng lọc tại cơ sở", "Vaccine theo gói mẫu", "Theo dõi sau tiêm"]],
    ["Gói vaccine cho trẻ em", "Trẻ em", 1450000, ["Tư vấn lịch tiêm tại cơ sở", "Vaccine theo gói mẫu", "Theo dõi sau tiêm"]],
    ["Tư vấn vaccine HPV", "Thanh thiếu niên", 1850000, ["Tư vấn tại cơ sở", "Vaccine theo gói mẫu", "Theo dõi sau tiêm"]],
    ["Gói vaccine gia đình", "Gia đình", 2150000, ["Tư vấn nhu cầu gia đình", "Danh mục vaccine mẫu", "Theo dõi tại cơ sở"]],
  ],
  business: [
    ["Gói khởi đầu", "Dưới 50 người", 490000, ["Khám tổng quát", "Xét nghiệm cơ bản", "Báo cáo tổng hợp mẫu"]],
    ["Gói doanh nghiệp tiêu chuẩn", "50–100 người", 790000, ["Khám chuyên khoa", "Xét nghiệm theo gói", "Điều phối lịch mẫu"]],
    ["Gói doanh nghiệp nâng cao", "100–300 người", 1190000, ["Khám chuyên sâu", "Tư vấn kết quả", "Báo cáo tổng hợp mẫu"]],
    ["Gói linh hoạt theo nhu cầu", "Trên 300 người", 1490000, ["Trao đổi nhu cầu", "Danh mục khám tùy chọn", "Kế hoạch triển khai mẫu"]],
  ],
  imaging: [
    ["Gói siêu âm ổ bụng", "Siêu âm", 250000, ["Siêu âm theo gói", "Kết quả hình ảnh", "Trao đổi tại cơ sở"]],
    ["Gói chụp X-quang", "X-quang", 300000, ["Kỹ thuật theo gói", "Kết quả hình ảnh", "Trao đổi tại cơ sở"]],
    ["Gói chụp cộng hưởng từ", "MRI", 2200000, ["Trao đổi trước thực hiện", "Kỹ thuật theo gói", "Kết quả hình ảnh"]],
    ["Gói tư vấn nội soi tiêu hóa", "Nội soi", 1500000, ["Khám tư vấn", "Kỹ thuật theo gói", "Trao đổi kết quả"]],
  ],
  aesthetic: [
    ["Tư vấn chăm sóc da", "Làn da", 300000, ["Trao đổi nhu cầu", "Đánh giá tại cơ sở", "Tư vấn phương án"]],
    ["Tư vấn thẩm mỹ khuôn mặt", "Khuôn mặt", 450000, ["Trao đổi mong muốn", "Gặp bác sĩ tư vấn", "Thông tin dịch vụ"]],
    ["Tư vấn chăm sóc vóc dáng", "Vóc dáng", 400000, ["Trao đổi nhu cầu", "Đánh giá tại cơ sở", "Tư vấn phương án"]],
    ["Tư vấn phục hồi da", "Phục hồi da", 350000, ["Trao đổi tình trạng", "Gặp bác sĩ tư vấn", "Hướng dẫn từ cơ sở"]],
  ],
};

function createItems(group) {
  if (group.external || group.flow === "promotion") return [];
  return Array.from({ length: 4 }, (_, index) => {
    const specialty = demoSpecialties[index];
    const doctor = demoDoctors[index];
    const provider = providers[index];
    const row = seeds[group.flow]?.[index];
    let name = row?.[0];
    let category = row?.[1] || specialty.name;
    let providerIds = providers.filter((p) => p.specialtyIds.includes(specialty.id)).map((p) => p.id);
    let specialtyIds = [specialty.id];
    let doctorId;
    let image = group.image;
    if (group.flow === "hospital") {
      name = "Khám tại " + provider.name;
      category = provider.city;
      providerIds = [provider.id];
      specialtyIds = provider.specialtyIds;
      image = provider.image;
    } else if (["doctor", "video"].includes(group.flow)) {
      name = doctor.name;
      doctorId = doctor.id;
      providerIds = [doctor.providerId];
      image = doctor.image;
    } else if (group.flow === "specialty") {
      name = "Khám " + specialty.name.toLowerCase();
    } else if (group.flow === "afterHours") {
      name = "Khám " + specialty.name.toLowerCase() + " ngoài giờ";
    } else {
      providerIds = [provider.id, providers[(index + 1) % 4].id];
      specialtyIds = [];
    }
    const contents = row?.[3] || ["Trao đổi nhu cầu", "Khám " + category.toLowerCase(), "Tư vấn sau buổi khám"];
    return {
      slug: group.flow + "-" + (index + 1), serviceSlug: group.slug, flow: group.flow,
      name, category, image, providerIds, specialtyIds, doctorId,
      price: row?.[2] || 200000 + index * 50000,
      priceUnit: group.flow === "business" ? "/ người" : group.flow === "helper" ? "/ 2 giờ" : "",
      description: name + ". " + group.description,
      contents,
      homeSupported: group.flow === "test" && index < 2,
      duration: ["doctor", "video"].includes(group.flow) ? "30 phút" : "Theo gói dịch vụ",
      note: group.flow === "vaccine"
        ? "Danh mục và giá chỉ để minh họa. Nội dung phù hợp và lịch tiêm được trao đổi với cơ sở."
        : group.flow === "certificate"
          ? "Giấy tờ và hạng mục hiển thị chỉ là mẫu giao diện, không phải hướng dẫn hồ sơ pháp lý."
          : "Cơ sở, lịch, hình ảnh và giá được dùng để minh họa giao diện.",
    };
  });
}
const regularItems = serviceCatalog.flatMap(createItems);
const promotionGroup = serviceCatalog.find((group) => group.flow === "promotion");
const promotions = ["package", "test", "vaccine", "home"].map((flow, index) => {
  const original = regularItems.find((item) => item.flow === flow);
  return {
    ...original,
    slug: "promotion-" + (index + 1),
    serviceSlug: promotionGroup.slug,
    category: serviceCatalog.find((group) => group.flow === flow).name,
    originalPrice: original.price,
    price: Math.round(original.price * 0.8),
    promotionTerms: "Ưu đãi mẫu 20% cho gói đã chọn, không cộng dồn với ưu đãi khác.",
  };
});
export const serviceItems = [...regularItems, ...promotions];
export const getGroup = (slug) => serviceCatalog.find((group) => group.slug === slug);
export const getItems = (slug) => serviceItems.filter((item) => item.serviceSlug === slug);
export const getItem = (groupSlug, itemSlug) => getItems(groupSlug).find((item) => item.slug === itemSlug);
export const getProvider = (id) => providers.find((provider) => provider.id === id);
export const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
export const detailPath = (item) => "/dich-vu-y-te/" + item.serviceSlug + "/chi-tiet/" + item.slug;
export const bookingPath = (item) => "/dich-vu-y-te/" + item.serviceSlug + "/dat-lich/" + item.slug;
