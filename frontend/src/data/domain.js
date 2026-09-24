import {
  attachBookingBilling,
  releasePromotion,
  recordServices,
  billingAction,
} from './billing.js';
import { dateKey } from './seed.js';
import { inventoryAction, validateAndReservePrescription } from './inventory.js';

export const isAdmin = (u) => ['superAdmin', 'branchAdmin'].includes(u?.role);
export const inBranch = (u, id) => u?.role === 'superAdmin' || (!!id && u?.branchId === id);
export const requireThat = (ok, message) => {
  if (!ok) throw new Error(message);
};
export const uid = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const live = (a) => ['pending', 'confirmed'].includes(a.status);
export const future = (date, time = '23:59') =>
  new Date(`${date}T${time}:00`).getTime() > Date.now();
export const normalize = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
export const availableSlots = (db, doctorId, date) =>
  db.schedules
    .filter((s) => s.doctorId === doctorId && s.date === date)
    .flatMap((s) => s.times)
    .sort()
    .map((time) => ({
      time,
      available:
        future(date, time) &&
        !db.appointments.some(
          (a) =>
            a.doctorId === doctorId &&
            a.date === date &&
            a.time === time &&
            (live(a) || a.status === 'completed'),
        ),
    }));
export function accessibleRecords(db, user) {
  if (user?.role === 'patient')
    return db.records.filter((r) => r.patientId === user.id && r.finalized);
  if (user?.role === 'doctor') {
    const ids = new Set(
      db.appointments.filter((a) => a.doctorId === user.doctorId).map((a) => a.patientId),
    );
    return db.records.filter(
      (r) => ids.has(r.patientId) && (r.finalized || r.doctorId === user.doctorId),
    );
  }
  return [];
}
export function scopedAppointments(db, user) {
  return db.appointments.filter((a) =>
    user?.role === 'patient'
      ? a.patientId === user.id
      : user?.role === 'doctor'
        ? a.doctorId === user.doctorId && a.branchId === user.branchId && a.status !== 'pending'
        : user?.role === 'staff'
          ? a.branchId === user.branchId
          : isAdmin(user) && inBranch(user, a.branchId),
  );
}
function phoneValid(phone) {
  return /^0\d{9}$/.test(phone || '');
}
function positive(n) {
  return Number.isInteger(Number(n)) && Number(n) > 0;
}
function branchPermission(db, user, id) {
  requireThat(isAdmin(user) && inBranch(user, id), 'Bạn không có quyền thao tác tại cơ sở này.');
  requireThat(
    db.branches.some((b) => b.id === id),
    'Không tìm thấy cơ sở.',
  );
}
function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value || '') && dateKey(new Date(value + 'T12:00:00')) === value
  );
}
function references(db, entity, id) {
  const fields = {
    branches: 'branchId',
    departments: 'departmentId',
    doctors: 'doctorId',
    specialties: 'specialtyId',
    packages: 'packageId',
    users: 'patientId',
  };
  const field = fields[entity];
  return Object.entries(db).some(
    ([key, rows]) =>
      key !== entity &&
      !(entity === 'doctors' && key === 'users') &&
      Array.isArray(rows) &&
      rows.some(
        (r) =>
          r[field] === id ||
          (entity === 'branches' && r.branchIds?.includes(id)) ||
          (entity === 'users' && r.createdBy === id),
      ),
  );
}

// All user initiated writes go through this function. Browser storage remains a demo, not a security boundary.
export function act(source, actorId, type, payload = {}) {
  const db = structuredClone(source);
  const user = db.users.find((u) => u.id === actorId && u.active);
  const p = payload;
  const today = dateKey();
  let result;
  if (type === 'register') {
    requireThat(
      p.name?.trim() && phoneValid(p.phone),
      'Nhập họ tên và số điện thoại 10 số bắt đầu bằng 0.',
    );
    requireThat(!db.users.some((u) => u.phone === p.phone), 'Số điện thoại đã có hồ sơ demo.');
    const row = {
      id: uid('patient'),
      role: 'patient',
      name: p.name.trim(),
      phone: p.phone,
      address: '',
      birthDate: '',
      active: true,
    };
    db.users.push(row);
    return { db, result: row.id };
  }
  requireThat(user, 'Vui lòng đăng nhập bằng tài khoản đang hoạt động.');
  if (user.branchId)
    requireThat(
      db.branches.some((b) => b.id === user.branchId && b.active),
      'Cơ sở đã ngừng hoạt động.',
    );
  if (type.startsWith('stock-') || type.startsWith('inventory-') || type.startsWith('medicine-')) {
    result = inventoryAction(db, user, type, p);
    requireThat(result !== null, 'Thao tác kho thuốc không hợp lệ.');
    return { db, result };
  }
  if (
    [
      'service-save',
      'promotion-save',
      'policy-save',
      'receive',
      'insurance-verify',
      'insurance-resubmit',
      'bill-finalize',
      'pay',
      'bill-adjust',
      'insurance-settle',
    ].includes(type)
  ) {
    result = billingAction(db, user, type, p, today);
    return { db, result };
  }
  if (type === 'profile') {
    requireThat(p.name?.trim() && phoneValid(p.phone), 'Họ tên và số điện thoại chưa hợp lệ.');
    requireThat(
      !db.users.some((u) => u.id !== user.id && u.phone === p.phone),
      'Số điện thoại đã được dùng.',
    );
    requireThat(
      !p.birthDate || (validDate(p.birthDate) && p.birthDate <= today),
      'Ngày sinh không hợp lệ.',
    );
    Object.assign(user, {
      name: p.name.trim(),
      phone: p.phone,
      address: p.address || '',
      birthDate: p.birthDate || '',
    });
    if (user.role === 'doctor') {
      const doctor = db.doctors.find((d) => d.id === user.doctorId);
      if (doctor) doctor.name = user.name;
    }
  } else if (type === 'book') {
    requireThat(user.role === 'patient', 'Chỉ tài khoản bệnh nhân được đặt lịch.');
    const branch = db.branches.find((b) => b.id === p.branchId && b.active);
    const doctor = db.doctors.find(
      (d) =>
        d.id === p.doctorId &&
        d.active &&
        d.branchId === branch?.id &&
        d.specialtyId === p.specialtyId,
    );
    requireThat(
      branch &&
        doctor &&
        db.departments.some((d) => d.id === doctor.departmentId && d.active) &&
        db.specialties.some((s) => s.id === p.specialtyId && s.active),
      'Cơ sở, chuyên khoa hoặc bác sĩ không còn nhận khám.',
    );
    const pack = p.packageId
      ? db.packages.find(
          (k) =>
            k.id === p.packageId &&
            k.active &&
            k.branchIds.includes(branch.id) &&
            k.specialtyId === doctor.specialtyId,
        )
      : null;
    requireThat(!p.packageId || pack, 'Gói khám không áp dụng cho lựa chọn này.');
    requireThat(
      availableSlots(db, doctor.id, p.date).some((s) => s.time === p.time && s.available),
      'Khung giờ không còn trống hoặc đã qua.',
    );
    requireThat(
      !db.appointments.some(
        (a) =>
          a.patientId === user.id &&
          a.date === p.date &&
          live(a) &&
          Math.abs(
            +a.time.slice(0, 2) * 60 +
              +a.time.slice(3) -
              (+p.time.slice(0, 2) * 60 + +p.time.slice(3)),
          ) < 30,
      ),
      'Bạn đã có lịch khám trùng thời gian này.',
    );
    requireThat(p.patientName?.trim() && phoneValid(p.phone), 'Thông tin người khám chưa hợp lệ.');
    const row = {
      id: uid('AT'),
      patientId: user.id,
      branchId: branch.id,
      doctorId: doctor.id,
      departmentId: doctor.departmentId,
      specialtyId: doctor.specialtyId,
      packageId: pack?.id || '',
      serviceName:
        pack?.name || 'Khám ' + db.specialties.find((s) => s.id === doctor.specialtyId).name,
      price: pack?.price || doctor.price,
      duration: 30,
      date: p.date,
      time: p.time,
      patientName: p.patientName.trim(),
      phone: p.phone,
      notes: p.notes || '',
      status: 'pending',
      reason: '',
      createdAt: new Date().toISOString(),
    };
    attachBookingBilling(db, user, row, p);
    db.appointments.push(row);
    result = row.id;
  } else if (type === 'appointment') {
    const a = db.appointments.find((a) => a.id === p.id);
    requireThat(a, 'Không tìm thấy lịch hẹn.');
    if (p.status === 'confirmed' || p.status === 'rejected') {
      requireThat(
        ((user.role === 'staff' && user.branchId === a.branchId) ||
          (isAdmin(user) && inBranch(user, a.branchId))) &&
          a.status === 'pending',
        'Chỉ nhân viên hoặc quản trị đúng cơ sở được duyệt hồ sơ đang chờ.',
      );
      requireThat(p.status !== 'rejected' || p.reason?.trim(), 'Vui lòng nhập lý do từ chối.');
    } else if (p.status === 'cancelled') {
      requireThat(
        live(a) &&
          !a.billing.receivedAt &&
          ((user.role === 'patient' && a.patientId === user.id && future(a.date, a.time)) ||
            (isAdmin(user) && inBranch(user, a.branchId))),
        'Không thể hủy lịch hẹn này.',
      );
      requireThat(!isAdmin(user) || p.reason?.trim(), 'Vui lòng nhập lý do hủy.');
    } else if (p.status === 'absent') {
      requireThat(
        isAdmin(user) &&
          inBranch(user, a.branchId) &&
          a.status === 'confirmed' &&
          !a.billing.receivedAt &&
          !future(a.date, a.time),
        'Chỉ ghi nhận vắng mặt sau giờ hẹn đã xác nhận.',
      );
    } else throw new Error('Chuyển trạng thái không hợp lệ.');
    a.status = p.status;
    a.reason = p.reason?.trim() || '';
    a.updatedAt = new Date().toISOString();
    if (['confirmed', 'rejected'].includes(a.status)) {
      a.reviewedBy = user.id;
      a.reviewedAt = a.updatedAt;
    }
    if (['cancelled', 'rejected', 'absent'].includes(a.status)) releasePromotion(db, user, a);
  } else if (type === 'record') {
    const a = db.appointments.find((a) => a.id === p.appointmentId);
    requireThat(
      user.role === 'doctor' &&
        a?.doctorId === user.doctorId &&
        a.branchId === user.branchId &&
        a.status === 'confirmed' &&
        a.billing.receivedAt,
      'Chỉ bác sĩ phụ trách được ghi kết quả lịch đã xác nhận và đã tiếp nhận.',
    );
    requireThat(
      !p.finalized || (p.symptoms?.trim() && p.diagnosis?.trim()),
      'Nhập triệu chứng và chẩn đoán trước khi hoàn tất.',
    );
    requireThat(
      !p.followUp || (validDate(p.followUp) && p.followUp > a.date),
      'Ngày tái khám phải sau ngày khám.',
    );
    const old = db.records.find((r) => r.appointmentId === a.id);
    requireThat(!old?.finalized, 'Hồ sơ hoàn tất không thể chỉnh sửa.');
    const prescription = p.finalized
      ? validateAndReservePrescription(db, a, p)
      : Array.isArray(p.prescription)
        ? structuredClone(p.prescription)
        : old?.prescription || [];
    const row = {
      id: old?.id || uid('record'),
      appointmentId: a.id,
      branchId: a.branchId,
      doctorId: a.doctorId,
      patientId: a.patientId,
      date: a.date,
      symptoms: p.symptoms || '',
      diagnosis: p.diagnosis || '',
      notes: p.notes || '',
      followUp: p.followUp || '',
      finalized: !!p.finalized,
      prescription,
      dispenseStatus:
        p.finalized && prescription.length ? 'reserved' : old?.dispenseStatus || 'none',
    };
    recordServices(db, user, a, p);
    if (p.finalized)
      a.billing.medicineItems = prescription.map((item) => ({
        serviceId: `medicine:${item.medicineId}`,
        medicineId: item.medicineId,
        name: `${item.name} · ${item.unit}`,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountable: false,
      }));
    if (old) Object.assign(old, row);
    else db.records.push(row);
    if (p.finalized) a.status = 'completed';
  } else if (type === 'save' || type === 'remove') {
    const { entity } = p;
    const allowed = [
      'branches',
      'departments',
      'doctors',
      'users',
      'specialties',
      'packages',
      'schedules',
    ];
    requireThat(isAdmin(user) && allowed.includes(entity), 'Không có quyền quản lý danh mục này.');
    const old = db[entity].find((r) => r.id === p.id);
    const row = { ...(old || {}), ...p.values, id: old?.id || uid(entity) };
    if (
      ['specialties', 'packages'].includes(entity) ||
      (entity === 'users' && row.role === 'branchAdmin') ||
      (entity === 'branches' && !old)
    )
      requireThat(user.role === 'superAdmin', 'Chỉ admin tổng quản lý danh mục này.');
    if (entity === 'users')
      requireThat(
        (!old || ['branchAdmin', 'staff'].includes(old.role)) &&
          ['branchAdmin', 'staff'].includes(row.role),
        'Chỉ quản lý tài khoản admin cơ sở hoặc nhân viên tại đây.',
      );
    if (entity === 'users' && row.role === 'branchAdmin')
      requireThat(user.role === 'superAdmin', 'Chỉ admin tổng quản lý tài khoản admin cơ sở.');
    if (['departments', 'doctors', 'schedules', 'users'].includes(entity)) {
      branchPermission(db, user, old?.branchId || row.branchId);
      if (old)
        requireThat(
          old.branchId === row.branchId,
          'Không chuyển cơ sở của dữ liệu đã tạo; hãy tạo hồ sơ mới.',
        );
      requireThat(
        db.branches.some((b) => b.id === row.branchId && b.active),
        'Cơ sở phải đang hoạt động.',
      );
    }
    if (entity === 'branches') {
      requireThat(
        user.role === 'superAdmin' || (old && inBranch(user, old.id)),
        'Không có quyền quản lý cơ sở.',
      );
      if (user.role !== 'superAdmin')
        requireThat(
          type === 'save' && old && row.active === old.active,
          'Admin cơ sở chỉ sửa thông tin liên hệ và giới thiệu.',
        );
    }
    if (type === 'remove') {
      requireThat(old, 'Không tìm thấy dữ liệu.');
      if (entity === 'schedules')
        requireThat(
          !db.appointments.some(
            (a) =>
              a.doctorId === old.doctorId &&
              a.date === old.date &&
              a.time &&
              (live(a) || a.status === 'completed'),
          ),
          'Lịch làm việc đã có lịch hẹn, không thể xóa.',
        );
      else
        requireThat(
          !references(db, entity, old.id),
          'Dữ liệu đã có liên kết. Hãy ngừng hoạt động thay vì xóa.',
        );
      db[entity] = db[entity].filter((r) => r.id !== old.id);
      if (entity === 'doctors') db.users = db.users.filter((u) => u.doctorId !== old.id);
    } else {
      if (entity !== 'schedules') requireThat(row.name?.trim(), 'Vui lòng nhập tên.');
      if (row.active === undefined) row.active = true;
      if (['branches', 'doctors'].includes(entity)) {
        row.slug = old?.slug || row.id;
        if (!row.active)
          requireThat(
            !db.appointments.some(
              (a) =>
                live(a) &&
                future(a.date, a.time) &&
                (entity === 'branches' ? a.branchId === row.id : a.doctorId === row.id),
            ),
            'Còn lịch hẹn tương lai chưa xử lý.',
          );
      }
      if (['departments', 'packages'].includes(entity))
        requireThat(
          db.specialties.some((s) => s.id === row.specialtyId && s.active),
          'Chọn chuyên khoa đang hoạt động.',
        );
      if (entity === 'doctors') {
        const dep = db.departments.find(
          (d) => d.id === row.departmentId && d.branchId === row.branchId && d.active,
        );
        requireThat(dep, 'Khoa/phòng không thuộc cơ sở hoặc đã ngừng hoạt động.');
        requireThat(
          !old ||
            old.departmentId === row.departmentId ||
            !db.appointments.some((a) => a.doctorId === old.id),
          'Bác sĩ đã có lịch sử khám phải giữ khoa/phòng để bảo toàn thống kê.',
        );
        row.specialtyId = dep.specialtyId;
        row.price = Number(row.price);
        requireThat(positive(row.price), 'Phí khám phải là số nguyên dương.');
        row.experience = Number(row.experience || 0);
        requireThat(
          Number.isInteger(row.experience) && row.experience >= 0,
          'Số năm kinh nghiệm phải là số nguyên không âm.',
        );
        requireThat(
          !row.contactPhone || /^0[0-9]{9,10}$/.test(row.contactPhone),
          'Số liên hệ đặt khám không hợp lệ.',
        );
      }
      if (entity === 'departments' && old && (row.specialtyId !== old.specialtyId || !row.active))
        requireThat(
          !db.doctors.some((d) => d.departmentId === old.id && d.active),
          'Khoa/phòng còn bác sĩ hoạt động.',
        );
      if (entity === 'specialties' && !row.active)
        requireThat(
          !db.departments.some((d) => d.specialtyId === row.id && d.active) &&
            !db.packages.some((k) => k.specialtyId === row.id && k.active),
          'Chuyên khoa còn khoa/phòng hoặc gói khám hoạt động.',
        );
      if (entity === 'packages') {
        row.price = Number(row.price);
        requireThat(positive(row.price) && row.branchIds?.length, 'Nhập giá hợp lệ và chọn cơ sở.');
        requireThat(
          row.branchIds.every(
            (id) =>
              db.branches.some((b) => b.id === id && b.active) &&
              db.departments.some(
                (d) => d.branchId === id && d.specialtyId === row.specialtyId && d.active,
              ),
          ),
          'Cơ sở áp dụng phải có chuyên khoa tương ứng.',
        );
      }
      if (entity === 'packages') row.slug = old?.slug || row.id;
      if (entity === 'users') {
        requireThat(phoneValid(row.phone), 'Số điện thoại không hợp lệ.');
        requireThat(
          !db.users.some((u) => u.id !== row.id && u.phone === row.phone),
          'Số điện thoại đã được dùng.',
        );
      }
      if (entity === 'schedules') {
        const doctor = db.doctors.find(
          (d) => d.id === row.doctorId && d.branchId === row.branchId && d.active,
        );
        requireThat(
          doctor && validDate(row.date) && row.date >= today && row.times?.length,
          'Chọn bác sĩ, ngày và khung giờ hợp lệ.',
        );
        row.times = [...new Set(row.times)].sort();
        requireThat(
          row.times.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t) && future(row.date, t)) &&
            row.times.every(
              (t, i) =>
                !i ||
                +t.slice(0, 2) * 60 +
                  +t.slice(3) -
                  (+row.times[i - 1].slice(0, 2) * 60 + +row.times[i - 1].slice(3)) >=
                  30,
            ),
          'Khung giờ phải ở tương lai và cách nhau ít nhất 30 phút.',
        );
        requireThat(
          !db.schedules.some(
            (s) => s.id !== row.id && s.doctorId === row.doctorId && s.date === row.date,
          ),
          'Bác sĩ đã có lịch làm việc ngày này. Hãy sửa lịch đó.',
        );
        if (old)
          requireThat(
            !db.appointments.some(
              (a) =>
                a.doctorId === old.doctorId &&
                a.date === old.date &&
                (live(a) || a.status === 'completed') &&
                (row.doctorId !== old.doctorId ||
                  row.date !== old.date ||
                  !row.times.includes(a.time)),
            ),
            'Không thể thay đổi khung giờ đã có lịch hẹn.',
          );
      }
      if (old) Object.assign(old, row);
      else db[entity].push(row);
      if (entity === 'doctors') {
        const account = db.users.find((u) => u.doctorId === row.id);
        if (account) Object.assign(account, { name: row.name, active: row.active });
        else
          db.users.push({
            id: uid('doctor-user'),
            doctorId: row.id,
            branchId: row.branchId,
            name: row.name,
            role: 'doctor',
            phone: '',
            active: true,
          });
      }
      result = row.id;
    }
  } else throw new Error('Thao tác không hợp lệ.');
  return { db, result };
}
