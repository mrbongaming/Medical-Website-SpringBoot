export const roles = {
  patient: 'Bệnh nhân',
  doctor: 'Bác sĩ',
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
export function createSeed() {
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
  return {
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
  };
}
