const dateKey = (value = new Date()) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};
const relativeDate = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateKey(date);
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
      startsAt: relativeDate(-15),
      endsAt: relativeDate(20),
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
      reviewedAt: dateKey(),
      status: 'published',
    },
    {
      id: 'fact-checkup',
      topic: 'Khám định kỳ',
      title: 'Chuẩn bị danh sách thuốc đang dùng trước buổi khám',
      content:
        'Ghi tên thuốc, liều dùng và thời điểm sử dụng giúp buổi trao đổi với nhân viên y tế đầy đủ và chính xác hơn.',
      source: 'Hướng dẫn chuẩn bị khám của Bệnh viện An Tâm — nội dung mô phỏng.',
      reviewedAt: dateKey(),
      status: 'published',
    },
    {
      id: 'fact-movement',
      topic: 'Vận động',
      title: 'Tăng vận động từng bước thường dễ duy trì hơn thay đổi quá nhanh',
      content:
        'Chọn hoạt động phù hợp thể trạng, tăng dần thời lượng và dừng lại nếu xuất hiện dấu hiệu bất thường.',
      source: 'Thông tin giáo dục sức khỏe tổng quát — không thay thế tư vấn cá nhân.',
      reviewedAt: dateKey(),
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
        at: `${dateKey()}T08:15:00+07:00`,
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
        at: `${relativeDate(-1)}T16:40:00+07:00`,
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
        at: `${relativeDate(-2)}T09:20:00+07:00`,
      },
    ];
  }
  return db;
}
