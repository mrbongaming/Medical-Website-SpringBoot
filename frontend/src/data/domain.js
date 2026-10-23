import {
  attachBookingBilling,
  releasePromotion,
  recordServices,
  billingAction,
} from './billing.js';
import { dateKey } from '../helpers/FormatHelpers.js';
import { inventoryAction, validatePrescription } from './inventory.js';
import { isFacilityAssignedPackage } from './packageRules.js';

export const isAdmin = (u) => ['superAdmin', 'branchAdmin'].includes(u?.role);
export const inBranch = (u, id) => u?.role === 'superAdmin' || (!!id && u?.branchId === id);
export const requireThat = (ok, message) => {
  if (!ok) throw new Error(message);
};
export const uid = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const live = (a) =>
  ['pending', 'confirmed'].includes(a.status) ||
  (a.status === 'awaiting_payment' &&
    (!a.paymentExpiresAt || new Date(a.paymentExpiresAt).getTime() > Date.now()));
export const future = (date, time = '23:59') =>
  new Date(`${date}T${time || '23:59'}:00+07:00`).getTime() > Date.now();
export const normalize = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
const timeMinutes = (value) => +value.slice(0, 2) * 60 + +value.slice(3);
const minutesTime = (value) =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const weekday = (date) => {
  const day = new Date(`${date}T12:00:00+07:00`).getUTCDay();
  return day || 7;
};
const nextDate = (offset) => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return dateKey(value);
};
export const scheduledSlots = (db, doctorId, date) => {
  const preview = (db.schedulePreviews || []).find(
    (row) => row.doctorId === doctorId && row.date === date,
  );
  if (preview) return [...new Set(preview.times || [])].sort();

  const exceptions = (db.scheduleExceptions || []).filter(
    (row) => row.doctorId === doctorId && row.date === date,
  );
  if (exceptions.some((row) => row.kind === 'unavailable')) return [];
  const custom = exceptions.filter((row) => row.kind === 'custom');
  const intervals = custom.length
    ? custom
    : db.schedules.filter(
        (rule) =>
          rule.active !== false &&
          rule.doctorId === doctorId &&
          rule.weekdays?.includes(weekday(date)) &&
          (!rule.effectiveFrom || rule.effectiveFrom <= date) &&
          (!rule.effectiveTo || rule.effectiveTo >= date),
      );
  return [
    ...new Set(
      intervals.flatMap((rule) => {
        const start = timeMinutes(rule.startTime);
        const end = timeMinutes(rule.endTime);
        const step = Number(rule.slotMinutes || 30);
        const result = [];
        for (let cursor = start; cursor + step <= end; cursor += step)
          result.push(minutesTime(cursor));
        return result;
      }),
    ),
  ].sort();
};
export const availableSlots = (db, doctorId, date) =>
  scheduledSlots(db, doctorId, date).map((time) => ({
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
export const availableDates = (db, doctorId, limit = 8) => {
  const previewDates = (db.schedulePreviews || [])
    .filter((row) => row.doctorId === doctorId)
    .map((row) => row.date);
  const candidates = previewDates.length
    ? [...new Set(previewDates)]
    : Array.from({ length: 120 }, (_, offset) => nextDate(offset));
  return candidates
    .filter(
      (date) => future(date) && availableSlots(db, doctorId, date).some((slot) => slot.available),
    )
    .sort()
    .slice(0, limit);
};
export const upcomingSchedules = (db, doctorId, limit = 8) =>
  availableDates(db, doctorId, limit).map((date) => ({
    id: `preview-${doctorId}-${date}`,
    doctorId,
    branchId: db.doctors.find((doctor) => doctor.id === doctorId)?.branchId || '',
    date,
    times: scheduledSlots(db, doctorId, date),
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
        ? a.doctorId === user.doctorId &&
          a.branchId === user.branchId &&
          !['awaiting_payment', 'pending'].includes(a.status)
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
      key !== 'auditLogs' &&
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
  const auditCount = db.auditLogs?.length || 0;
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
      'billing-services',
      'promotion-apply',
      'bill-finalize',
      'pay',
      'bill-adjust',
      'insurance-settle',
    ].includes(type)
  ) {
    result = billingAction(db, user, type, p, today);
    return { db, result };
  }
  if (type === 'pricing-settings-save') {
    requireThat(user.role === 'superAdmin', 'Chỉ admin tổng được quản lý giá đặt khám.');
    const doctorSelectionFee = Number(p.doctorSelectionFee);
    requireThat(
      Number.isSafeInteger(doctorSelectionFee) && doctorSelectionFee > 0,
      'Phụ phí chọn bác sĩ phải là số nguyên dương.',
    );
    const doctorOverrides = Object.fromEntries(
      Object.entries(p.doctorOverrides || {})
        .map(([doctorId, amount]) => [doctorId, Number(amount)])
        .filter(
          ([doctorId, amount]) =>
            db.doctors.some((doctor) => doctor.id === doctorId) &&
            Number.isSafeInteger(amount) &&
            amount > 0,
        ),
    );
    requireThat(String(p.reason || '').trim(), 'Nhập lý do thay đổi giá.');
    db.pricingSettings = {
      doctorSelectionFee,
      doctorOverrides,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
      reason: String(p.reason).trim(),
    };
    result = true;
  } else if (type === 'vnpay-ipn-demo') {
    requireThat(
      user.role === 'superAdmin',
      'Chỉ bộ giả lập callback quản trị được dùng thao tác này.',
    );
    const appointment = db.appointments.find((row) => row.id === p.id);
    requireThat(
      appointment?.status === 'awaiting_payment' && appointment.paymentStatus === 'pending',
      'Lịch không ở trạng thái chờ thanh toán.',
    );
    const attempt = db.paymentAttempts.find(
      (row) => row.appointmentId === appointment.id && row.status === 'pending',
    );
    requireThat(attempt, 'Không tìm thấy yêu cầu thanh toán.');
    attempt.status = 'paid';
    attempt.providerTransactionId = String(p.providerTransactionId || uid('VNP'));
    attempt.updatedAt = new Date().toISOString();
    appointment.paymentStatus = 'paid';
    appointment.status = 'pending';
    appointment.billing.prepaidAmount = appointment.prepaymentAmount;
    db.payments.push({
      id: uid('pay-booking'),
      appointmentId: appointment.id,
      branchId: appointment.branchId,
      amount: appointment.prepaymentAmount,
      date: today,
      createdAt: new Date().toISOString(),
      createdBy: 'vnpay-ipn',
      method: 'vnpay',
      purpose: 'booking_prepayment',
      reference: attempt.providerTransactionId,
    });
    result = appointment.id;
  } else if (type === 'profile') {
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
    const specialty = db.specialties.find((s) => s.id === p.specialtyId && s.active);
    const department = db.departments.find(
      (d) => d.branchId === branch?.id && d.specialtyId === specialty?.id && d.active,
    );
    const doctor = db.doctors.find(
      (d) =>
        d.id === p.doctorId &&
        d.active &&
        d.branchId === branch?.id &&
        d.specialtyId === p.specialtyId,
    );
    const pack = p.packageId
      ? db.packages.find(
          (k) =>
            k.id === p.packageId &&
            k.active &&
            k.branchIds.includes(branch?.id) &&
            k.specialtyId === specialty?.id,
        )
      : null;
    requireThat(!p.packageId || pack, 'Gói khám không áp dụng cho lựa chọn này.');
    const bookingMode =
      isFacilityAssignedPackage(pack) || p.bookingMode === 'facility' ? 'facility' : 'doctor';
    requireThat(
      branch &&
        specialty &&
        department &&
        (bookingMode === 'facility' ||
          (doctor && db.departments.some((d) => d.id === doctor.departmentId && d.active))),
      'Cơ sở, chuyên khoa hoặc bác sĩ không còn nhận khám.',
    );
    if (bookingMode === 'doctor')
      requireThat(
        availableSlots(db, doctor.id, p.date).some((s) => s.time === p.time && s.available),
        'Khung giờ không còn trống hoặc đã qua.',
      );
    else requireThat(validDate(p.date) && future(p.date), 'Ngày khám không hợp lệ hoặc đã qua.');
    requireThat(
      bookingMode === 'facility' ||
        !p.time ||
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
    const recipientType = p.recipientType === 'relative' ? 'relative' : 'self';
    const patientName = p.patientName?.trim();
    const patientPhone = p.phone;
    const patientBirthDate = p.patientBirthDate || '';
    const patientAddress = p.patientAddress?.trim() || '';
    requireThat(patientName && phoneValid(patientPhone), 'Thông tin người khám chưa hợp lệ.');
    requireThat(
      recipientType === 'self' ||
        (p.relationship?.trim() &&
          validDate(patientBirthDate) &&
          patientBirthDate <= today &&
          patientAddress),
      'Nhập đầy đủ quan hệ, ngày sinh và địa chỉ của người thân.',
    );
    const row = {
      id: uid('AT'),
      patientId: user.id,
      branchId: branch.id,
      bookingMode,
      doctorId: bookingMode === 'doctor' ? doctor.id : '',
      departmentId: bookingMode === 'doctor' ? doctor.departmentId : department.id,
      specialtyId: specialty.id,
      packageId: pack?.id || '',
      serviceName: pack?.name || 'Khám ' + specialty.name,
      price: 0,
      duration: 30,
      date: p.date,
      time: bookingMode === 'doctor' ? p.time : '',
      recipientType,
      relationship: recipientType === 'relative' ? p.relationship.trim() : '',
      patientName,
      phone: patientPhone,
      patientBirthDate,
      patientAddress,
      notes: p.notes || '',
      status: 'awaiting_payment',
      paymentStatus: 'pending',
      reason: '',
      createdAt: new Date().toISOString(),
    };
    attachBookingBilling(db, user, row, p);
    row.price = row.billing.estimate.subtotal;
    row.prepaymentAmount = row.billing.prepaidAmount;
    row.paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    db.paymentAttempts.push({
      id: uid('vnpay'),
      appointmentId: row.id,
      provider: 'vnpay',
      amount: row.prepaymentAmount,
      status: 'pending',
      paymentUrl: '',
      createdAt: new Date().toISOString(),
      expiresAt: row.paymentExpiresAt,
      configurationStatus: 'not_configured',
    });
    db.appointments.push(row);
    result = row.id;
  } else if (type === 'appointment') {
    const a = db.appointments.find((a) => a.id === p.id);
    requireThat(a, 'Không tìm thấy lịch hẹn.');
    if (p.status === 'confirmed' || p.status === 'rejected') {
      requireThat(
        ((user.role === 'staff' && user.branchId === a.branchId) ||
          (isAdmin(user) && inBranch(user, a.branchId))) &&
          a.status === 'pending' &&
          a.paymentStatus === 'paid',
        'Chỉ nhân viên hoặc quản trị đúng cơ sở được duyệt hồ sơ đang chờ.',
      );
      requireThat(p.status !== 'rejected' || p.reason?.trim(), 'Vui lòng nhập lý do từ chối.');
      if (p.status === 'confirmed' && a.bookingMode === 'facility') {
        const branch = db.branches.find((b) => b.id === a.branchId);
        const open = branch?.serviceHours?.open || '07:30';
        const close = branch?.serviceHours?.close || '17:00';
        requireThat(
          /^\d{2}:\d{2}$/.test(p.time || '') && p.time >= open && p.time <= close,
          'Giờ tiếp nhận phải nằm trong giờ hoạt động của cơ sở.',
        );
        requireThat(future(a.date, p.time), 'Giờ tiếp nhận phải ở tương lai.');
        requireThat(
          !db.appointments.some(
            (other) =>
              other.id !== a.id &&
              other.patientId === a.patientId &&
              other.date === a.date &&
              other.time &&
              live(other) &&
              Math.abs(
                +other.time.slice(0, 2) * 60 +
                  +other.time.slice(3) -
                  (+p.time.slice(0, 2) * 60 + +p.time.slice(3)),
              ) < 30,
          ),
          'Bệnh nhân đã có lịch trùng thời gian này.',
        );
        a.time = p.time;
        a.scheduledBy = user.id;
        a.scheduledAt = new Date().toISOString();
      }
    } else if (p.status === 'cancelled') {
      requireThat(
        live(a) &&
          !a.billing.receivedAt &&
          ((user.role === 'patient' && a.patientId === user.id && future(a.date, a.time)) ||
            (isAdmin(user) && inBranch(user, a.branchId))),
        'Không thể hủy lịch hẹn này.',
      );
      requireThat(!isAdmin(user) || p.reason?.trim(), 'Vui lòng nhập lý do hủy.');
    } else if (p.status === 'completed') {
      requireThat(
        a.bookingMode === 'facility' &&
          ((user.role === 'staff' && user.branchId === a.branchId) ||
            (isAdmin(user) && inBranch(user, a.branchId))) &&
          a.status === 'confirmed' &&
          a.billing.receivedAt &&
          a.time &&
          !future(a.date, a.time),
        'Chỉ hoàn tất lịch không chọn bác sĩ sau giờ hẹn và khi đã tiếp nhận.',
      );
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
      ? validatePrescription(db, a, p)
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
      purchaseChoice: ['hospital', 'outside'].includes(p.purchaseChoice)
        ? p.purchaseChoice
        : old?.purchaseChoice || 'undecided',
      dispenseStatus: prescription.length ? 'not_managed' : 'none',
    };
    recordServices(db, user, a, p);
    if (old) Object.assign(old, row);
    else db.records.push(row);
    if (p.finalized) a.status = 'completed';
  } else if (type === 'content-save') {
    requireThat(isAdmin(user), 'Chỉ quản trị viên được cập nhật nội dung.');
    const collection = p.collection;
    requireThat(['campaigns', 'healthFacts'].includes(collection), 'Loại nội dung không hợp lệ.');
    requireThat(
      collection !== 'healthFacts' || user.role === 'superAdmin',
      'Chỉ admin tổng quản lý kiến thức y tế.',
    );
    const old = db[collection].find((row) => row.id === p.id);
    requireThat(old, 'Không tìm thấy nội dung.');
    if (user.role === 'branchAdmin')
      requireThat(
        old.branchIds?.length === 1 && old.branchIds[0] === user.branchId,
        'Admin cơ sở chỉ sửa chương trình dành riêng cho cơ sở mình.',
      );
    const values = p.values || {};
    requireThat(String(values.title || '').trim(), 'Vui lòng nhập tiêu đề.');
    requireThat(
      ['draft', 'published', 'hidden'].includes(values.status),
      'Trạng thái không hợp lệ.',
    );
    Object.assign(old, {
      title: String(values.title).trim(),
      summary: String(values.summary || old.summary || '').trim(),
      content: String(values.content || old.content || '').trim(),
      status: values.status,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    });
    result = old.id;
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
      if (entity !== 'schedules')
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
      if (entity === 'branches') {
        row.name = row.name.trim();
        row.address = String(row.address || '').trim();
        row.phone = String(row.phone || '').trim();
        requireThat(row.address, 'Vui lòng nhập địa chỉ cơ sở.');
        requireThat(/^0\d{9,10}$/.test(row.phone), 'Số điện thoại cơ sở không hợp lệ.');
        const open = row.serviceHours?.open;
        const close = row.serviceHours?.close;
        requireThat(
          /^([01]\d|2[0-3]):[0-5]\d$/.test(open || '') &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(close || '') &&
            open < close,
          'Giờ tiếp nhận của cơ sở không hợp lệ.',
        );
        row.hours = `Thứ 2 – Chủ nhật · ${open} – ${close}`;
        row.establishedYear = Number(row.establishedYear || 0);
        requireThat(
          !row.establishedYear ||
            (Number.isInteger(row.establishedYear) &&
              row.establishedYear >= 1900 &&
              row.establishedYear <= new Date().getFullYear()),
          'Năm thành lập không hợp lệ.',
        );
        requireThat(
          !row.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email),
          'Email cơ sở không hợp lệ.',
        );
        requireThat(
          !row.website || /^https?:\/\/[^\s]+$/i.test(row.website),
          'Website phải bắt đầu bằng http:// hoặc https://.',
        );
        requireThat(
          !row.image || /^(\/|https?:\/\/)/i.test(row.image),
          'Đường dẫn ảnh cơ sở không hợp lệ.',
        );
        for (const key of ['equipment', 'amenities']) {
          requireThat(
            row[key] === undefined ||
              (Array.isArray(row[key]) && row[key].every((item) => typeof item === 'string')),
            'Danh sách tiện ích hoặc trang thiết bị không hợp lệ.',
          );
          row[key] = [...new Set((row[key] || []).map((item) => item.trim()).filter(Boolean))];
        }
      }
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
        row.price =
          user.role === 'superAdmin'
            ? Number(row.price)
            : Number(
                old?.price ||
                  db.serviceCatalog.find((service) => service.id === 'consultation')?.price,
              );
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
        row.weekdays = [...new Set((row.weekdays || []).map(Number))].sort();
        row.slotMinutes = Number(row.slotMinutes || 30);
        requireThat(
          doctor &&
            row.weekdays.length &&
            row.weekdays.every((day) => day >= 1 && day <= 7) &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(row.startTime || '') &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(row.endTime || '') &&
            timeMinutes(row.startTime) < timeMinutes(row.endTime) &&
            [15, 20, 30, 45, 60].includes(row.slotMinutes),
          'Chọn bác sĩ, thứ làm việc, giờ bắt đầu/kết thúc và thời lượng khám hợp lệ.',
        );
        requireThat(
          !row.effectiveFrom || !row.effectiveTo || row.effectiveFrom <= row.effectiveTo,
          'Khoảng ngày áp dụng không hợp lệ.',
        );
        requireThat(
          !db.schedules.some(
            (rule) =>
              rule.id !== row.id &&
              rule.doctorId === row.doctorId &&
              rule.active !== false &&
              row.active !== false &&
              rule.weekdays?.some((day) => row.weekdays.includes(day)) &&
              timeMinutes(rule.startTime) < timeMinutes(row.endTime) &&
              timeMinutes(row.startTime) < timeMinutes(rule.endTime) &&
              (!rule.effectiveTo || !row.effectiveFrom || rule.effectiveTo >= row.effectiveFrom) &&
              (!row.effectiveTo || !rule.effectiveFrom || row.effectiveTo >= rule.effectiveFrom),
          ),
          'Quy tắc lịch làm việc bị trùng thứ, thời gian và giai đoạn áp dụng.',
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
  if (user && Array.isArray(db.auditLogs) && db.auditLogs.length === auditCount) {
    const appointment = db.appointments.find(
      (row) => row.id === p.id || row.id === p.appointmentId,
    );
    const request = db.stockRequests?.find((row) => row.id === p.id);
    const entityRow = p.entity && db[p.entity]?.find((row) => row.id === (result || p.id));
    const branchId =
      p.branchId ||
      appointment?.branchId ||
      request?.branchId ||
      entityRow?.branchId ||
      (p.entity === 'branches' ? entityRow?.id : '') ||
      user.branchId ||
      '';
    const warning = /(remove|cancel|reject|refund|policy|medicine|inventory-settings)/.test(type);
    const module =
      type === 'content-save'
        ? 'content'
        : type.startsWith('stock') || type.startsWith('inventory') || type.startsWith('medicine')
          ? 'inventory'
          : type === 'save' || type === 'remove'
            ? 'catalog'
            : type === 'appointment'
              ? 'appointments'
              : type === 'record'
                ? 'clinical'
                : type === 'book'
                  ? 'booking'
                  : 'system';
    db.auditLogs.push({
      id: uid('audit'),
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: type,
      module,
      subjectType: p.entity || module,
      subjectId: String(result || p.id || p.appointmentId || ''),
      appointmentId: appointment?.id || p.appointmentId || '',
      branchId,
      reason: String(p.reason || p.values?.name || `Đã thực hiện ${type}.`).trim(),
      result: 'success',
      severity: warning ? 'warning' : 'info',
      details: {},
      at: new Date().toISOString(),
    });
  }
  return { db, result };
}
