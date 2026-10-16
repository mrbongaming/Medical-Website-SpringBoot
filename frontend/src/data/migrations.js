// Nâng cấp tuần tự dữ liệu đã lưu từ các phiên bản cũ lên schema hiện tại.
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

const migrationDateKey = (value = new Date()) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const migrationRelativeDate = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return migrationDateKey(date);
};

export function addV6Data(source) {
  const db = structuredClone(source);
  db.version = 6;
  db.campaigns ||= [
    {
      id: 'campaign-heart-2026',
      title: 'Chủ động tầm soát tim mạch trong tháng này',
      summary:
        'Tham khảo gói kiểm tra tim mạch, chuẩn bị thông tin sức khỏe và chọn cơ sở phù hợp trước khi đặt lịch.',
      image: '/images/hospital.jpg',
      startsAt: migrationRelativeDate(-15),
      endsAt: migrationRelativeDate(20),
      branchIds: db.branches.filter((branch) => branch.active).map((branch) => branch.id),
      packageIds: db.packages.filter((pack) => pack.specialtyId === 'sp2').map((pack) => pack.id),
      status: 'published',
      disclaimer: 'Nội dung giới thiệu trong dữ liệu demo; chi phí thực tế được xác nhận khi khám.',
    },
  ];
  db.healthFacts ||= [
    {
      id: 'fact-sleep',
      topic: 'Giấc ngủ',
      title: 'Giữ giờ ngủ đều đặn giúp hình thành thói quen nghỉ ngơi tốt hơn',
      content:
        'Theo dõi giờ đi ngủ và thức dậy trong vài tuần giúp bạn nhận ra những thay đổi ảnh hưởng đến chất lượng nghỉ ngơi.',
      source:
        'Thông tin giáo dục sức khỏe tổng quát — cần trao đổi bác sĩ khi triệu chứng kéo dài.',
      reviewedAt: migrationDateKey(),
      status: 'published',
    },
    {
      id: 'fact-checkup',
      topic: 'Khám định kỳ',
      title: 'Chuẩn bị danh sách thuốc đang dùng trước buổi khám',
      content:
        'Ghi tên thuốc, liều dùng và thời điểm sử dụng giúp buổi trao đổi với nhân viên y tế đầy đủ và chính xác hơn.',
      source: 'Hướng dẫn chuẩn bị khám của Bệnh viện An Tâm — nội dung mô phỏng.',
      reviewedAt: migrationDateKey(),
      status: 'published',
    },
    {
      id: 'fact-movement',
      topic: 'Vận động',
      title: 'Tăng vận động từng bước thường dễ duy trì hơn thay đổi quá nhanh',
      content:
        'Chọn hoạt động phù hợp thể trạng, tăng dần thời lượng và dừng lại nếu xuất hiện dấu hiệu bất thường.',
      source: 'Thông tin giáo dục sức khỏe tổng quát — không thay thế tư vấn cá nhân.',
      reviewedAt: migrationDateKey(),
      status: 'published',
    },
  ];
  db.branches = db.branches.map((branch) => ({
    amenities: ['Khu tiếp nhận', 'Phòng chờ', 'Quầy thuốc'],
    visitGuide:
      'Đến trước giờ hẹn 15 phút, mang theo giấy tờ tùy thân và hồ sơ khám hoặc đơn thuốc gần nhất nếu có.',
    mapQuery: branch.address,
    ...branch,
  }));
  db.packages = db.packages.map((pack) => ({
    suitableFor: 'Người muốn chủ động đánh giá sức khỏe theo chuyên khoa và nhận tư vấn phù hợp.',
    preparation: 'Mang theo giấy tờ tùy thân, hồ sơ khám gần nhất và danh sách thuốc đang sử dụng.',
    process: ['Tiếp nhận và xác nhận thông tin', 'Khám và thực hiện hạng mục', 'Tư vấn kết quả'],
    estimatedDuration: '60–120 phút tùy hạng mục và tình hình tại cơ sở',
    ...pack,
  }));
  db.auditLogs = db.auditLogs.map((row) => ({
    actorName: '',
    actorRole: '',
    module: 'billing',
    subjectType: row.appointmentId ? 'appointment' : 'billing',
    subjectId: row.appointmentId || '',
    result: 'success',
    severity: 'info',
    ...row,
  }));
  if (!db.auditLogs.length) {
    db.auditLogs = [
      {
        id: 'audit-demo-1',
        actorId: 'admin1',
        actorName: db.users.find((user) => user.id === 'admin1')?.name || 'Admin cơ sở',
        actorRole: 'branchAdmin',
        action: 'appointment',
        module: 'appointments',
        subjectType: 'appointment',
        subjectId: 'AT-DEMO-PENDING',
        appointmentId: 'AT-DEMO-PENDING',
        branchId: 'b1',
        reason: 'Kiểm tra lịch chờ xác nhận tại cơ sở.',
        result: 'success',
        severity: 'info',
        details: {},
        at: `${migrationDateKey()}T08:15:00+07:00`,
      },
      {
        id: 'audit-demo-2',
        actorId: 'root',
        actorName: db.users.find((user) => user.id === 'root')?.name || 'Admin tổng',
        actorRole: 'superAdmin',
        action: 'inventory-settings-save',
        module: 'inventory',
        subjectType: 'inventory',
        subjectId: 'med001',
        appointmentId: '',
        branchId: 'b1',
        reason: 'Rà soát ngưỡng tồn thuốc tại cơ sở.',
        result: 'success',
        severity: 'warning',
        details: {},
        at: `${migrationRelativeDate(-1)}T16:40:00+07:00`,
      },
      {
        id: 'audit-demo-3',
        actorId: 'admin2',
        actorName: db.users.find((user) => user.id === 'admin2')?.name || 'Admin cơ sở',
        actorRole: 'branchAdmin',
        action: 'stock-request-create',
        module: 'inventory',
        subjectType: 'inventory',
        subjectId:
          db.stockRequests.find((request) => request.branchId === 'b2')?.id || 'restock-demo',
        appointmentId: '',
        branchId: 'b2',
        reason: 'Tạo yêu cầu bổ sung thuốc theo ngưỡng tồn.',
        result: 'success',
        severity: 'info',
        details: {},
        at: `${migrationRelativeDate(-2)}T09:20:00+07:00`,
      },
    ];
  }
  return db;
}

const asList = (value, fallback = []) =>
  Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : fallback;

export function addV7Data(source) {
  const db = structuredClone(source);
  db.version = 7;
  db.branches = db.branches.map((branch, index) => {
    const defaultEquipment = [
      'Phòng khám chuyên khoa',
      'Khu xét nghiệm',
      'Hệ thống chẩn đoán hình ảnh',
    ];
    return {
      facilityType: index === 0 ? 'Bệnh viện đa khoa' : 'Phòng khám đa khoa',
      establishedYear: 2012 + index * 2,
      email: `coso${index + 1}@antam.example`,
      website: 'https://antam.example',
      detailedIntroduction:
        'Cơ sở thuộc hệ thống An Tâm, phối hợp nhiều chuyên khoa và hỗ trợ người bệnh xuyên suốt từ đặt lịch đến theo dõi sau khám.',
      transportGuide:
        'Có khu vực gửi xe tại cơ sở. Người bệnh nên đến trước giờ hẹn 15 phút để được hướng dẫn.',
      accessibility: 'Có lối đi, thang máy và khu vực ưu tiên cho người cao tuổi, xe lăn.',
      ...branch,
      equipment: asList(branch.equipment, defaultEquipment),
    };
  });
  db.doctors = db.doctors.map((doctor, index) => {
    const defaultLanguages = ['Tiếng Việt', ...(index % 3 === 0 ? ['Tiếng Anh'] : [])];
    const defaultPatientGroups =
      index % 6 === 2 ? ['Trẻ em'] : ['Người trưởng thành', 'Người cao tuổi'];
    return {
      currentPosition: index % 4 === 0 ? 'Trưởng khoa' : 'Bác sĩ điều trị',
      education: 'Đào tạo chuyên khoa tại cơ sở y khoa trong nước.',
      career: 'Có kinh nghiệm khám, điều trị và theo dõi người bệnh tại hệ thống An Tâm.',
      achievements: 'Thường xuyên tham gia cập nhật kiến thức và hoạt động chuyên môn.',
      ...doctor,
      consultationLanguages: asList(doctor.consultationLanguages, defaultLanguages),
      patientGroups: asList(doctor.patientGroups, defaultPatientGroups),
      focusAreas: asList(doctor.focusAreas, asList(doctor.expertise)),
      certifications: asList(doctor.certifications, ['Chứng chỉ hành nghề khám bệnh, chữa bệnh']),
      memberships: asList(doctor.memberships, ['Hội chuyên ngành phù hợp với lĩnh vực công tác']),
    };
  });
  return db;
}

export function addV8Data(source) {
  const db = structuredClone(source);
  db.version = 8;
  db.pricingSettings ||= {
    doctorSelectionFee: 100000,
    doctorOverrides: {},
    updatedBy: 'migration',
    updatedAt: new Date().toISOString(),
    reason: 'Khởi tạo phụ phí chọn bác sĩ cho dữ liệu demo.',
  };
  db.paymentAttempts ||= [];
  for (const appointment of db.appointments) {
    const paid = db.payments.some((payment) => payment.appointmentId === appointment.id);
    appointment.paymentStatus ||= paid || appointment.billing?.settledAt ? 'paid' : 'legacy_unpaid';
    appointment.prepaymentAmount ??= paid
      ? db.payments
          .filter((payment) => payment.appointmentId === appointment.id)
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      : 0;
  }
  for (const record of db.records) {
    record.purchaseChoice ||= 'undecided';
    if (record.dispenseStatus === 'reserved') record.dispenseStatus = 'not_managed';
  }
  return db;
}

const ADDITIONAL_DOCTOR_NAMES = [
  'Đỗ Minh Quân',
  'Nguyễn Ngọc Hân',
  'Trần Gia Bảo',
  'Lê Phương Thảo',
  'Phạm Tuấn Kiệt',
  'Võ Thanh Trúc',
  'Bùi Hoàng Long',
  'Đặng Mỹ Linh',
  'Ngô Đức Thành',
  'Phan Khánh Vy',
  'Hồ Nhật Minh',
  'Vũ Thu Hương',
];

export function addV9Data(source) {
  const db = structuredClone(source);
  db.version = 9;

  db.departments.forEach((department, index) => {
    const doctorId = `dr${index + 13}`;
    if (db.doctors.some((doctor) => doctor.id === doctorId)) return;
    const branch = db.branches.find((item) => item.id === department.branchId);
    const name = ADDITIONAL_DOCTOR_NAMES[index] || `Bác sĩ ${index + 13}`;
    const specialty = db.specialties.find((item) => item.id === department.specialtyId);
    db.doctors.push({
      id: doctorId,
      slug: `bac-si-${index + 13}`,
      name: `BS. ${name}`,
      branchId: department.branchId,
      departmentId: department.id,
      specialtyId: department.specialtyId,
      experience: 6 + (index % 9),
      qualification: index % 2 ? 'Bác sĩ chuyên khoa I' : 'Thạc sĩ Y khoa',
      expertise: `Khám và tư vấn ${String(specialty?.name || 'chuyên khoa').toLowerCase()}`,
      contactPhone: branch?.phone || '',
      image: `/images/doctor-${index % 2 ? 'female' : 'male'}.jpg`,
      bio: `${name} có ${6 + (index % 9)} năm kinh nghiệm, đang công tác tại ${branch?.name || 'Bệnh viện An Tâm'}.`,
      price: 200000 + (index % 3) * 50000,
      active: true,
    });
  });

  db.doctors.forEach((doctor, index) => {
    if (db.users.some((user) => user.doctorId === doctor.id)) return;
    db.users.push({
      id: `u-${doctor.id}`,
      name: doctor.name,
      role: 'doctor',
      doctorId: doctor.id,
      branchId: doctor.branchId,
      phone: `09110000${String(index).padStart(2, '0')}`,
      address: 'TP.HCM',
      active: true,
    });
  });

  return db;
}

export function addV10Data(source) {
  const db = structuredClone(source);
  db.version = 10;
  db.scheduleExceptions ||= [];
  const alreadyRuleBased =
    db.schedules.length > 0 && db.schedules.every((rule) => Array.isArray(rule.weekdays));
  if (!alreadyRuleBased) {
    db.schedules = db.doctors
      .filter((doctor) => doctor.active)
      .flatMap((doctor) => [
        {
          id: `rule-${doctor.id}-morning`,
          branchId: doctor.branchId,
          doctorId: doctor.id,
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          startTime: '07:30',
          endTime: '11:30',
          slotMinutes: 30,
          effectiveFrom: '2020-01-01',
          effectiveTo: '',
          active: true,
        },
        {
          id: `rule-${doctor.id}-afternoon`,
          branchId: doctor.branchId,
          doctorId: doctor.id,
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          startTime: '13:00',
          endTime: '17:00',
          slotMinutes: 30,
          effectiveFrom: '2020-01-01',
          effectiveTo: '',
          active: true,
        },
      ]);
  }
  return db;
}
