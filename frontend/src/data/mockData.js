import { calculatePrice } from '../helpers/PricingHelpers.js';
import { addV5Data, addV6Data, addV7Data } from './migrations.js';
export const roles = {
  patient: 'Bệnh nhân',
  doctor: 'Bác sĩ',
  staff: 'Nhân viên tiếp nhận',
  branchAdmin: 'Admin cơ sở',
  superAdmin: 'Admin tổng',
};
export const statuses = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn tất',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
  absent: 'Vắng mặt',
  draft: 'Nháp',
};
export const dateKey = (value = new Date()) => {
  const d = new Date(value);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(d)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};
export const relativeDate = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dateKey(d);
};
export const money = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
export const hospital = {
  name: 'Bệnh viện Đa khoa An Tâm',
  phone: '1900 1234',
  email: 'lienhe@antam.example',
  tagline: 'Một hệ thống. Trọn vẹn an tâm.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Thanh toán, ưu đãi và BHYT (dữ liệu mô phỏng)
// ─────────────────────────────────────────────────────────────────────────────
export function addBillingData(source, demo = false) {
  const db = structuredClone(source);
  db.version = 3;
  db.promotions = demo
    ? [
        {
          id: 'promo-welcome',
          name: 'Ưu đãi đặt khám An Tâm',
          mode: 'code',
          code: 'ANTAM50',
          kind: 'fixed',
          value: 50000,
          maxDiscount: 50000,
          minimum: 150000,
          startsOn: '2020-01-01',
          endsOn: '2099-12-31',
          branchIds: [],
          serviceIds: [],
          audience: 'all',
          totalLimit: 500,
          perPatientLimit: 1,
          active: true,
        },
        {
          id: 'promo-package',
          name: 'Ưu đãi gói khám 5%',
          mode: 'auto',
          code: '',
          kind: 'percent',
          value: 5,
          maxDiscount: 100000,
          minimum: 500000,
          startsOn: '2020-01-01',
          endsOn: '2099-12-31',
          branchIds: [],
          serviceIds: db.packages.map((item) => `package:${item.id}`),
          audience: 'all',
          totalLimit: 1000,
          perPatientLimit: 3,
          active: true,
        },
      ]
    : [];
  db.serviceCatalog = [
    {
      id: 'consultation',
      name: 'Khám chuyên khoa',
      price: 200000,
      discountable: true,
      active: true,
    },
    {
      id: 'blood-test',
      name: 'Xét nghiệm công thức máu',
      price: 120000,
      discountable: true,
      active: true,
    },
    { id: 'ecg', name: 'Điện tâm đồ', price: 150000, discountable: true, active: true },
    { id: 'ultrasound', name: 'Siêu âm bụng', price: 250000, discountable: true, active: true },
  ];
  db.insurancePolicies = db.branches.map((branch) => ({
    id: `policy-${branch.id}-1`,
    branchId: branch.id,
    version: 1,
    enabled: demo,
    effectiveFrom: '2020-01-01',
    effectiveTo: '2099-12-31',
    note: 'Biểu giá giả lập phục vụ demo, không phải biểu giá BHYT pháp định.',
    services: [
      { serviceId: 'consultation', tariff: 50000 },
      { serviceId: 'blood-test', tariff: 80000 },
      { serviceId: 'ecg', tariff: 90000 },
      { serviceId: 'ultrasound', tariff: 160000 },
    ],
  }));
  db.promotionUses = [];
  db.adjustments = [];
  db.auditLogs = [];
  db.insuranceSettlements = [];
  for (const appointment of db.appointments) {
    const items = [
      {
        serviceId: appointment.packageId ? `package:${appointment.packageId}` : 'consultation',
        name: appointment.serviceName,
        unitPrice: appointment.price,
        quantity: 1,
        discountable: true,
      },
    ];
    const payment = db.payments.find((item) => item.appointmentId === appointment.id);
    appointment.billing = {
      items,
      insurance: { status: 'none' },
      promotion: null,
      estimate: calculatePrice(items),
      finalized:
        appointment.status === 'completed'
          ? {
              price: calculatePrice(items),
              at: appointment.createdAt || appointment.date,
              by: payment?.createdBy || 'migration',
              reason: 'Bảo toàn phí của lịch trước phiên bản 3.',
            }
          : null,
      settledAt: payment?.date || '',
      settlementId: payment?.id || '',
      legacy: true,
    };
  }
  if (demo) {
    const appointment = db.appointments.find((item) => item.id === 'AT-TODAY');
    if (appointment) {
      appointment.billing.legacy = false;
      appointment.billing.insurance = {
        status: 'pending',
        cardNumber: 'DEMO12345678901',
        validFrom: '2020-01-01',
        validTo: '2099-12-31',
        registeredFacility: 'An Tâm · Trung tâm (mẫu)',
        referral: '',
      };
      appointment.billing.promotion = structuredClone(db.promotions[0]);
      appointment.billing.estimate = calculatePrice(
        appointment.billing.items,
        appointment.billing.insurance,
        appointment.billing.promotion,
      );
      db.promotionUses.push({
        id: 'use-demo-today',
        promotionId: db.promotions[0].id,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        branchId: appointment.branchId,
        status: 'reserved',
        at: appointment.createdAt,
      });
    }
  }
  return db;
}

// ─────────────────────────────────────────────────────────────────────────────
// Danh mục thuốc và tồn kho (dữ liệu mô phỏng)
// ─────────────────────────────────────────────────────────────────────────────
const medicineRows = [
  ['MED001', 'Paracetamol 500 mg', 'Paracetamol', 'Giảm đau - hạ sốt', 'Viên nén', 'viên', 1200],
  ['MED002', 'Ibuprofen 400 mg', 'Ibuprofen', 'Giảm đau - kháng viêm', 'Viên nén', 'viên', 1800],
  ['MED003', 'Aspirin 81 mg', 'Acetylsalicylic acid', 'Tim mạch', 'Viên nén', 'viên', 900],
  ['MED004', 'Amoxicillin 500 mg', 'Amoxicillin', 'Kháng sinh', 'Viên nang', 'viên', 2400],
  ['MED005', 'Azithromycin 500 mg', 'Azithromycin', 'Kháng sinh', 'Viên nén', 'viên', 9500],
  ['MED006', 'Cefuroxime 500 mg', 'Cefuroxime', 'Kháng sinh', 'Viên nén', 'viên', 12500],
  ['MED007', 'Metronidazole 250 mg', 'Metronidazole', 'Kháng sinh', 'Viên nén', 'viên', 1100],
  ['MED008', 'Doxycycline 100 mg', 'Doxycycline', 'Kháng sinh', 'Viên nang', 'viên', 1700],
  ['MED009', 'Cetirizine 10 mg', 'Cetirizine', 'Dị ứng', 'Viên nén', 'viên', 1300],
  ['MED010', 'Loratadine 10 mg', 'Loratadine', 'Dị ứng', 'Viên nén', 'viên', 1600],
  ['MED011', 'Chlorpheniramine 4 mg', 'Chlorpheniramine', 'Dị ứng', 'Viên nén', 'viên', 500],
  ['MED012', 'Salbutamol 2 mg', 'Salbutamol', 'Hô hấp', 'Viên nén', 'viên', 800],
  ['MED013', 'Salbutamol 100 mcg', 'Salbutamol', 'Hô hấp', 'Bình xịt', 'bình', 78000],
  ['MED014', 'Budesonide 0,5 mg/2 ml', 'Budesonide', 'Hô hấp', 'Ống khí dung', 'ống', 13500],
  ['MED015', 'Acetylcysteine 200 mg', 'Acetylcysteine', 'Hô hấp', 'Gói bột', 'gói', 2200],
  ['MED016', 'Dextromethorphan 15 mg', 'Dextromethorphan', 'Hô hấp', 'Viên nén', 'viên', 900],
  ['MED017', 'Omeprazole 20 mg', 'Omeprazole', 'Tiêu hóa', 'Viên nang', 'viên', 1400],
  ['MED018', 'Esomeprazole 40 mg', 'Esomeprazole', 'Tiêu hóa', 'Viên nén', 'viên', 5200],
  ['MED019', 'Domperidone 10 mg', 'Domperidone', 'Tiêu hóa', 'Viên nén', 'viên', 1000],
  ['MED020', 'Smectite 3 g', 'Diosmectite', 'Tiêu hóa', 'Gói bột', 'gói', 4200],
  ['MED021', 'Loperamide 2 mg', 'Loperamide', 'Tiêu hóa', 'Viên nang', 'viên', 900],
  ['MED022', 'Lactulose 10 g/15 ml', 'Lactulose', 'Tiêu hóa', 'Gói dung dịch', 'gói', 6500],
  ['MED023', 'Amlodipine 5 mg', 'Amlodipine', 'Tim mạch', 'Viên nén', 'viên', 1200],
  ['MED024', 'Losartan 50 mg', 'Losartan', 'Tim mạch', 'Viên nén', 'viên', 2100],
  ['MED025', 'Bisoprolol 2,5 mg', 'Bisoprolol', 'Tim mạch', 'Viên nén', 'viên', 2500],
  ['MED026', 'Atorvastatin 20 mg', 'Atorvastatin', 'Tim mạch', 'Viên nén', 'viên', 2600],
  ['MED027', 'Clopidogrel 75 mg', 'Clopidogrel', 'Tim mạch', 'Viên nén', 'viên', 4200],
  ['MED028', 'Furosemide 40 mg', 'Furosemide', 'Tim mạch', 'Viên nén', 'viên', 700],
  ['MED029', 'Metformin 500 mg', 'Metformin', 'Nội tiết', 'Viên nén', 'viên', 900],
  ['MED030', 'Gliclazide MR 30 mg', 'Gliclazide', 'Nội tiết', 'Viên nén', 'viên', 2800],
  ['MED031', 'Levothyroxine 50 mcg', 'Levothyroxine', 'Nội tiết', 'Viên nén', 'viên', 1800],
  [
    'MED032',
    'Vitamin D3 1000 IU',
    'Cholecalciferol',
    'Vitamin - khoáng chất',
    'Viên nang',
    'viên',
    1300,
  ],
  [
    'MED033',
    'Calcium 500 mg',
    'Calcium carbonate',
    'Vitamin - khoáng chất',
    'Viên nén',
    'viên',
    1700,
  ],
  [
    'MED034',
    'Vitamin C 500 mg',
    'Ascorbic acid',
    'Vitamin - khoáng chất',
    'Viên sủi',
    'viên',
    3500,
  ],
  ['MED035', 'Kẽm 10 mg', 'Zinc gluconate', 'Vitamin - khoáng chất', 'Viên nén', 'viên', 1500],
  [
    'MED036',
    'Sắt fumarate 200 mg',
    'Ferrous fumarate',
    'Vitamin - khoáng chất',
    'Viên nang',
    'viên',
    2200,
  ],
  ['MED037', 'Diclofenac gel 1%', 'Diclofenac', 'Cơ xương khớp', 'Gel bôi', 'tuýp', 42000],
  ['MED038', 'Meloxicam 7,5 mg', 'Meloxicam', 'Cơ xương khớp', 'Viên nén', 'viên', 1800],
  ['MED039', 'Glucosamine 500 mg', 'Glucosamine', 'Cơ xương khớp', 'Viên nang', 'viên', 3200],
  ['MED040', 'Eperisone 50 mg', 'Eperisone', 'Cơ xương khớp', 'Viên nén', 'viên', 2600],
  ['MED041', 'Hydrocortisone cream 1%', 'Hydrocortisone', 'Da liễu', 'Kem bôi', 'tuýp', 28000],
  ['MED042', 'Clotrimazole cream 1%', 'Clotrimazole', 'Da liễu', 'Kem bôi', 'tuýp', 32000],
  ['MED043', 'Mupirocin ointment 2%', 'Mupirocin', 'Da liễu', 'Thuốc mỡ', 'tuýp', 58000],
  ['MED044', 'Ketoconazole shampoo 2%', 'Ketoconazole', 'Da liễu', 'Dầu gội', 'chai', 95000],
  [
    'MED045',
    'Nước muối NaCl 0,9% 500 ml',
    'Sodium chloride',
    'Dung dịch',
    'Dung dịch',
    'chai',
    14000,
  ],
  ['MED046', 'Nước muối nhỏ mắt 0,9%', 'Sodium chloride', 'Mắt', 'Dung dịch nhỏ mắt', 'chai', 9000],
  ['MED047', 'Tobramycin 0,3%', 'Tobramycin', 'Mắt', 'Dung dịch nhỏ mắt', 'chai', 38000],
  [
    'MED048',
    'Artificial tears 0,5%',
    'Carboxymethylcellulose',
    'Mắt',
    'Dung dịch nhỏ mắt',
    'chai',
    48000,
  ],
  ['MED049', 'Ofloxacin 0,3%', 'Ofloxacin', 'Tai Mũi Họng', 'Dung dịch nhỏ tai', 'chai', 42000],
  [
    'MED050',
    'Xylometazoline 0,05%',
    'Xylometazoline',
    'Tai Mũi Họng',
    'Dung dịch nhỏ mũi',
    'chai',
    26000,
  ],
  ['MED051', 'Povidone iodine 10%', 'Povidone iodine', 'Sát khuẩn', 'Dung dịch', 'chai', 28000],
  ['MED052', 'Chlorhexidine 0,05%', 'Chlorhexidine', 'Sát khuẩn', 'Dung dịch', 'chai', 35000],
  ['MED053', 'ORS chuẩn WHO', 'Glucose + điện giải', 'Bù nước điện giải', 'Gói bột', 'gói', 3200],
  ['MED054', 'Probiotic 1 tỷ CFU', 'Bacillus clausii', 'Tiêu hóa', 'Ống uống', 'ống', 7500],
  ['MED055', 'Menthol lozenge', 'Menthol', 'Tai Mũi Họng', 'Viên ngậm', 'viên', 1800],
  [
    'MED056',
    'Methylprednisolone 4 mg',
    'Methylprednisolone',
    'Kháng viêm',
    'Viên nén',
    'viên',
    1600,
  ],
  ['MED057', 'Prednisolone 5 mg', 'Prednisolone', 'Kháng viêm', 'Viên nén', 'viên', 800],
  ['MED058', 'Gabapentin 300 mg', 'Gabapentin', 'Thần kinh', 'Viên nang', 'viên', 3500],
  ['MED059', 'Betahistine 16 mg', 'Betahistine', 'Thần kinh', 'Viên nén', 'viên', 2300],
  [
    'MED060',
    'Magnesium B6',
    'Magnesium + Vitamin B6',
    'Vitamin - khoáng chất',
    'Viên nén',
    'viên',
    1900,
  ],
  [
    'MED061',
    'Cetuximab 100 mg/20 ml',
    'Cetuximab',
    'Điều trị ung thư',
    'Dung dịch tiêm truyền',
    'lọ',
    4500000,
  ],
];

export function addInventoryData(source, demo = false) {
  const db = structuredClone(source);
  db.version = 4;
  db.medicines = medicineRows.map(
    ([code, name, activeIngredient, group, form, unit, salePrice]) => ({
      id: code.toLowerCase(),
      code,
      name,
      activeIngredient,
      group,
      form,
      unit,
      salePrice,
      active: true,
    }),
  );
  db.inventorySettings = db.branches.flatMap((branch, branchIndex) =>
    db.medicines.map((medicine, medicineIndex) => ({
      id: `setting-${branch.id}-${medicine.id}`,
      branchId: branch.id,
      medicineId: medicine.id,
      min: 20 + ((medicineIndex + branchIndex) % 4) * 10,
      max: 160 + ((medicineIndex + branchIndex) % 5) * 40,
    })),
  );
  db.inventory = db.inventorySettings.map((setting, index) => {
    const pattern = index % 13;
    const quantity =
      pattern === 0
        ? 0
        : pattern <= 2
          ? Math.max(1, setting.min - 5)
          : pattern === 12
            ? setting.max + 20
            : setting.min + 35 + (index % 70);
    return {
      id: `stock-${setting.branchId}-${setting.medicineId}`,
      branchId: setting.branchId,
      medicineId: setting.medicineId,
      quantity,
      reserved: 0,
    };
  });
  db.stockRequests = demo
    ? [
        {
          id: 'restock-demo-1',
          branchId: 'b1',
          kind: 'normal',
          status: 'pending',
          reason: 'Bổ sung các thuốc đã xuống dưới ngưỡng tối thiểu.',
          items: [
            { medicineId: 'med001', quantity: 100, purchasePrice: 700 },
            { medicineId: 'med014', quantity: 40, purchasePrice: 9000 },
          ],
          createdBy: 'admin1',
          createdAt: new Date().toISOString(),
          reviewedBy: '',
          reviewedAt: '',
          reviewReason: '',
        },
      ]
    : [];
  db.inventoryTransactions = [];
  db.stockSchedule = {
    weekdays: [1, 4],
    timezone: 'Asia/Ho_Chi_Minh',
    updatedBy: 'root',
    updatedAt: new Date().toISOString(),
  };
  for (const branch of db.branches) {
    if (!db.users.some((user) => user.id === `staff-${branch.id}`)) {
      db.users.push({
        id: `staff-${branch.id}`,
        name: `Nhân viên tiếp nhận ${branch.name}`,
        role: 'staff',
        branchId: branch.id,
        phone: `093000000${Number(branch.id.slice(1))}`,
        active: true,
      });
    }
  }
  for (const record of db.records) {
    if (!Array.isArray(record.prescription)) record.prescription = [];
  }
  for (const appointment of db.appointments) {
    if (appointment.status === 'confirmed' || appointment.status === 'completed') {
      appointment.reviewedAt ||= appointment.createdAt;
      appointment.reviewedBy ||= '';
    }
  }
  return db;
}

export function createSeed() {
  // Cơ sở, chuyên khoa và khoa/phòng
  const specialties = [
    'Nội tổng quát',
    'Tim mạch',
    'Nhi khoa',
    'Da liễu',
    'Tai Mũi Họng',
    'Cơ xương khớp',
  ].map((name, i) => ({ id: `sp${i + 1}`, name, active: true }));
  const branches = ['Trung tâm', 'Thủ Đức', 'Bình Thạnh', 'Tân Bình'].map((name, i) => ({
    id: `b${i + 1}`,
    slug: ['trung-tam', 'thu-duc', 'binh-thanh', 'tan-binh'][i],
    name: `An Tâm · ${name}`,
    address: `${20 + i * 12} Đường An Tâm, ${name}, TP.HCM (địa chỉ mẫu)`,
    phone: '0281234567' + i,
    image: '/images/hospital.jpg',
    hours: 'Thứ 2 – Chủ nhật · 07:30 – 17:00',
    description:
      i === 0
        ? 'Cơ sở chính, kết nối chuyên môn cho toàn hệ thống.'
        : 'Chăm sóc sức khỏe gần nhà, cùng tiêu chuẩn của Bệnh viện An Tâm.',
    active: true,
  }));
  const departments = branches.flatMap((b, bi) =>
    [0, 1, 2].map((n) => ({
      id: `dep${bi * 3 + n + 1}`,
      branchId: b.id,
      specialtyId: specialties[(bi * 3 + n) % 6].id,
      name: 'Khoa ' + specialties[(bi * 3 + n) % 6].name,
      active: true,
    })),
  );
  // Bác sĩ và tài khoản người dùng
  const names = [
    'Nguyễn Minh Anh',
    'Trần Quốc Bảo',
    'Lê Thu Hà',
    'Phạm Hoàng Nam',
    'Võ Ngọc Mai',
    'Đặng Minh Khang',
    'Bùi Thanh Tâm',
    'Nguyễn Hải Yến',
    'Trần Đức Huy',
    'Lê Bảo Châu',
    'Phạm Anh Tú',
    'Võ Thùy Linh',
  ];
  const doctors = departments.map((d, i) => ({
    id: `dr${i + 1}`,
    slug: `bac-si-${i + 1}`,
    name: `BS. ${names[i]}`,
    branchId: d.branchId,
    departmentId: d.id,
    specialtyId: d.specialtyId,
    experience: 8 + i,
    qualification: i % 3 === 0 ? 'Thạc sĩ · Bác sĩ chuyên khoa II' : 'Bác sĩ chuyên khoa I',
    expertise: [
      'Khám nội tổng quát, theo dõi sức khỏe định kỳ',
      'Thăm khám tim mạch, theo dõi huyết áp',
      'Khám và tư vấn sức khỏe trẻ em',
      'Thăm khám da liễu và chăm sóc da',
      'Khám tai, mũi, họng và tư vấn phòng bệnh',
      'Khám vận động và cơ xương khớp',
    ][i % 6],
    contactPhone: branches.find((b) => b.id === d.branchId).phone,
    image: '/images/doctor-' + ([0, 2, 4, 7, 9, 11].includes(i) ? 'female' : 'male') + '.jpg',
    bio:
      names[i] +
      ' có ' +
      (8 + i) +
      ' năm kinh nghiệm trong lĩnh vực ' +
      specialties.find((s) => s.id === d.specialtyId).name.toLowerCase() +
      '. Ưu tiên thăm khám kỹ lưỡng, giải thích rõ kết quả và theo dõi tiến triển của người bệnh.',
    price: 200000 + (i % 3) * 50000,
    active: true,
  }));
  const users = [
    {
      id: 'root',
      name: 'Quản trị hệ thống',
      role: 'superAdmin',
      phone: '0900000000',
      active: true,
    },
    ...branches.map((b, i) => ({
      id: `admin${i + 1}`,
      name: `Quản trị ${b.name}`,
      role: 'branchAdmin',
      branchId: b.id,
      phone: `090000001${i}`,
      active: true,
    })),
    ...doctors.map((d, i) => ({
      id: `u-dr${i + 1}`,
      name: d.name,
      role: 'doctor',
      doctorId: d.id,
      branchId: d.branchId,
      phone: `09100000${String(i).padStart(2, '0')}`,
      address: 'TP.HCM',
      active: true,
    })),
    ...Array.from({ length: 16 }, (_, i) => ({
      id: `p${i + 1}`,
      name: [
        'Nguyễn Hoàng An',
        'Trần Thanh Lan',
        'Lê Gia Hân',
        'Phạm Đức Minh',
        'Võ Ngọc Ánh',
        'Đỗ Quang Huy',
        'Bùi Kim Ngân',
        'Ngô Tuấn Kiệt',
        'Phan Hải Đăng',
        'Đặng Thảo Vy',
        'Trịnh Minh Châu',
        'Lý Thanh Bình',
        'Hoàng Bảo Ngọc',
        'Hồ Anh Khoa',
        'Vũ Thu Trang',
        'Mai Đức Phúc',
      ][i],
      role: 'patient',
      phone: `09200000${String(i).padStart(2, '0')}`,
      birthDate:
        [
          1995, 1982, 2018, 1976, 1990, 1968, 1988, 2015, 1993, 1985, 2000, 1972, 1997, 2016, 1980,
          1965,
        ][i] + '-05-20',
      address: 'TP.HCM',
      active: true,
    })),
  ];
  // Gói khám, lịch làm việc và lịch hẹn
  const packages = [
    'Khám tổng quát',
    'Tầm soát tim mạch',
    'Chăm sóc sức khỏe trẻ em',
    'Khám da chuyên sâu',
  ].map((name, i) => ({
    id: `pkg${i + 1}`,
    slug: `goi-kham-${i + 1}`,
    name,
    specialtyId: `sp${i + 1}`,
    branchIds: [
      ...new Set(departments.filter((d) => d.specialtyId === `sp${i + 1}`).map((d) => d.branchId)),
    ],
    price: 600000 + i * 200000,
    contents: 'Khám chuyên khoa, đánh giá sức khỏe và tư vấn kết quả.',
    active: true,
  }));
  const slots = ['08:00', '09:00', '10:00', '13:30', '14:30', '15:30'];
  const schedules = doctors.flatMap((d) =>
    Array.from({ length: 105 }, (_, n) => ({
      id: `sch-${d.id}-${n}`,
      branchId: d.branchId,
      doctorId: d.id,
      date: relativeDate(n - 89),
      times: slots,
    })),
  );
  const appointments = [];
  function appointment(id, patientIndex, doctorIndex, offset, time, status, packageId = '') {
    const doctor = doctors[doctorIndex];
    const patient = users.find((u) => u.id === 'p' + (patientIndex + 1));
    const pack = packages.find((p) => p.id === packageId);
    return {
      id,
      patientId: patient.id,
      branchId: doctor.branchId,
      doctorId: doctor.id,
      departmentId: doctor.departmentId,
      specialtyId: doctor.specialtyId,
      packageId,
      date: relativeDate(offset),
      time,
      status,
      patientName: patient.name,
      phone: patient.phone,
      serviceName:
        pack?.name || 'Khám ' + specialties.find((s) => s.id === doctor.specialtyId).name,
      price: pack?.price || doctor.price,
      duration: 30,
      createdAt: relativeDate(offset - 3) + 'T09:00:00',
      reason:
        status === 'cancelled'
          ? 'Người bệnh thay đổi lịch cá nhân.'
          : status === 'rejected'
            ? 'Bác sĩ có lịch công tác, vui lòng chọn ngày khác.'
            : '',
    };
  }
  // Each patient has a coherent sequence of visits with their assigned specialty.
  const assignments = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 0, 1, 3, 8, 9, 10];
  for (let i = 0; i < 16; i++) {
    const di = assignments[i];
    for (let visit = 0; visit < 3; visit++) {
      const offset = -75 + visit * 25 + i;
      const status =
        visit < 2
          ? 'completed'
          : ['completed', 'completed', 'cancelled', 'absent', 'rejected', 'completed'][i % 6];
      const a = appointment(
        'AT-' + (1000 + i * 3 + visit),
        i,
        di,
        offset,
        slots[i % 6],
        status,
        i === 0 && visit === 0 ? 'pkg1' : '',
      );
      if (status === 'completed' && di !== 11) a.rating = [5, 4, 5, 4, 3][(i + visit) % 5];
      appointments.push(a);
    }
    if (i > 0)
      appointments.push(
        appointment(
          'AT-NEXT-' + i,
          i,
          di,
          3 + (i % 10),
          slots[i % 6],
          i % 2 ? 'confirmed' : 'pending',
        ),
      );
  }
  appointments.push(appointment('AT-DEMO-EXAM', 0, 0, -1, '13:30', 'confirmed'));
  appointments.push(appointment('AT-DEMO-PENDING', 0, 0, 1, '10:00', 'pending'));
  appointments.push(appointment('AT-TODAY', 10, 0, 0, '08:00', 'confirmed'));
  const examples = [
    [
      'Mệt mỏi sau thời gian làm việc kéo dài',
      'Theo dõi sức khỏe tổng quát',
      'Duy trì lịch sinh hoạt đều đặn. Mang theo kết quả khám trước khi tái khám.',
    ],
    [
      'Đánh trống ngực từng lúc',
      'Theo dõi tình trạng tim mạch',
      'Ghi nhận thời điểm xuất hiện triệu chứng để trao đổi trong lần tái khám.',
    ],
    [
      'Hắt hơi và sổ mũi',
      'Theo dõi sức khỏe hô hấp của trẻ',
      'Phụ huynh theo dõi diễn biến và liên hệ cơ sở nếu triệu chứng thay đổi.',
    ],
    [
      'Da khô, ngứa tái diễn',
      'Theo dõi kích ứng da',
      'Ghi lại sản phẩm tiếp xúc với da và diễn biến triệu chứng.',
    ],
    [
      'Nghẹt mũi, khó chịu vùng họng',
      'Theo dõi tai mũi họng',
      'Tái khám để đánh giá lại triệu chứng theo lịch hẹn.',
    ],
    [
      'Đau vai sau vận động',
      'Theo dõi vận động khớp vai',
      'Ghi nhận hoạt động gây khó chịu và trao đổi với bác sĩ khi tái khám.',
    ],
  ];
  // Hồ sơ khám và thanh toán
  const records = appointments
    .filter((a) => a.status === 'completed')
    .map((a) => {
      const [symptoms, diagnosis, notes] = examples[Number(a.specialtyId.slice(2)) - 1];
      const next = appointments
        .filter((n) => n.patientId === a.patientId && n.doctorId === a.doctorId && n.date > a.date)
        .sort((x, y) => x.date.localeCompare(y.date))[0];
      return {
        id: 'rec-' + a.id,
        appointmentId: a.id,
        patientId: a.patientId,
        branchId: a.branchId,
        doctorId: a.doctorId,
        date: a.date,
        symptoms,
        diagnosis,
        notes,
        followUp: next?.date || '',
        finalized: true,
      };
    });
  records.push({
    id: 'rec-demo-draft',
    appointmentId: 'AT-DEMO-EXAM',
    patientId: 'p1',
    branchId: 'b1',
    doctorId: 'dr1',
    date: relativeDate(-1),
    symptoms: 'Tái khám sức khỏe tổng quát',
    diagnosis: '',
    notes: '',
    followUp: '',
    finalized: false,
  });
  const payments = appointments
    .filter((a, i) => a.status === 'completed' && i % 4 !== 0)
    .map((a) => ({
      id: `pay-${a.id}`,
      appointmentId: a.id,
      branchId: a.branchId,
      amount: a.price,
      date: a.date,
      createdBy: 'root',
    }));
  return addV7Data(
    addV6Data(
      addV5Data(
        addInventoryData(
          addBillingData(
            {
              version: 2,
              seededAt: dateKey(),
              branches,
              specialties,
              departments,
              doctors,
              users,
              packages,
              schedules,
              appointments,
              records,
              payments,
            },
            true,
          ),
          true,
        ),
      ),
    ),
  );
}
