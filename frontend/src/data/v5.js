const defaultPackageParts = [
  ['consultation', 'Khám chuyên khoa', 200000],
  ['blood-test', 'Xét nghiệm công thức máu', 120000],
  ['ultrasound', 'Siêu âm bụng', 250000],
];

export function addV5Data(source) {
  const db = structuredClone(source);
  db.version = 5;
  db.insuranceRules ||= [
    {
      id: 'bhyt-rules-2025',
      effectiveFrom: '2025-07-01',
      effectiveTo: '2026-06-30',
      lowCostThreshold: 351000,
      annualCopayThreshold: 14040000,
      source: 'Nghị định 188/2025/NĐ-CP',
    },
    {
      id: 'bhyt-rules-2026',
      effectiveFrom: '2026-07-01',
      effectiveTo: '2099-12-31',
      lowCostThreshold: 379500,
      annualCopayThreshold: 15180000,
      source: 'VBHN 40/VBHN-VPQH; Nghị định 188/2025/NĐ-CP; Nghị định 161/2026/NĐ-CP',
    },
  ];
  db.branches = db.branches.map((branch) => ({
    serviceHours: { open: '07:30', close: '17:00' },
    careLevel: 'basic',
    legacyLevel: 'district',
    insuranceContract: true,
    about: branch.description || '',
    services: [],
    ...branch,
  }));
  db.doctors = db.doctors.map((doctor) => ({
    education: doctor.qualification || 'Đang cập nhật',
    career: `${doctor.experience || 0} năm thăm khám tại các cơ sở y tế (thông tin minh họa).`,
    achievements: 'Thông tin thành tựu đang được cập nhật.',
    ...doctor,
  }));
  db.packages = db.packages.map((pack) => {
    if (Array.isArray(pack.components) && pack.components.length) return pack;
    const selected = defaultPackageParts.slice(0, pack.id === 'pkg1' ? 3 : 2);
    const base = selected.reduce((sum, item) => sum + item[2], 0);
    return {
      ...pack,
      components: selected.map(([serviceId, name, amount], index) => ({
        serviceId,
        packageServiceId: `package:${pack.id}`,
        name,
        unitPrice: index === selected.length - 1 ? amount + pack.price - base : amount,
        quantity: 1,
        discountable: true,
      })),
    };
  });
  const coveredMedicines = new Map([
    ['med001', ['Thông tư 20/2022/TT-BYT', 100, '']],
    ['med004', ['Thông tư 20/2022/TT-BYT', 100, '']],
    ['med017', ['Thông tư 20/2022/TT-BYT', 100, '']],
    ['med023', ['Thông tư 20/2022/TT-BYT', 100, '']],
    ['med029', ['Thông tư 20/2022/TT-BYT', 100, '']],
    [
      'med039',
      [
        'Thông tư 20/2022/TT-BYT',
        100,
        'Chỉ thanh toán điều trị thoái hóa khớp gối mức độ nhẹ và trung bình.',
      ],
    ],
    [
      'med061',
      [
        'Thông tư 20/2022/TT-BYT và văn bản sửa đổi, bổ sung hiện hành',
        50,
        'Chỉ thanh toán theo chỉ định, bệnh và cơ sở đáp ứng điều kiện trong danh mục.',
      ],
    ],
  ]);
  db.medicines = db.medicines.map((medicine) => {
    const mapping = coveredMedicines.get(medicine.id);
    return {
      ...medicine,
      insurance: mapping
        ? {
            covered: true,
            paymentRate: mapping[1],
            tariff: medicine.salePrice,
            condition: mapping[2],
            source: mapping[0],
            effectiveFrom: '2023-03-01',
          }
        : {
            covered: false,
            paymentRate: 0,
            tariff: 0,
            condition: 'Chưa có mapping đủ căn cứ trong dữ liệu demo.',
            source: 'Chưa xác minh',
            effectiveFrom: '2023-03-01',
          },
    };
  });
  db.promotions = db.promotions.map((promotion) => ({
    discountScope: 'outside',
    ...promotion,
  }));
  db.appointments = db.appointments.map((appointment) => ({
    bookingMode: appointment.doctorId ? 'doctor' : 'facility',
    ...appointment,
  }));
  return db;
}
