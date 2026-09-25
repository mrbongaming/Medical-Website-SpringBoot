import {
  insuranceInput,
  insurancePolicy,
  deriveInsuranceCoverage,
  validInsuranceDate,
} from '../helpers/InsuranceHelpers.js';
import {
  bookingQuote,
  calculatePrice,
  appointmentPrice,
  financialBalance,
} from '../helpers/PricingHelpers.js';
import { selectPromotion } from '../helpers/PromotionHelpers.js';

const check = (ok, message) => {
  if (!ok) throw new Error(message);
};
const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const integer = (n) => Number.isSafeInteger(n) && n >= 0 && n <= 1000000000;
const admin = (u) => ['superAdmin', 'branchAdmin'].includes(u.role);
const branchAccess = (u, branchId) =>
  admin(u) && (u.role === 'superAdmin' || u.branchId === branchId);
export function audit(db, user, action, appointmentId, branchId, reason, details = {}) {
  db.auditLogs.push({
    id: id('audit'),
    actorId: user.id,
    action,
    appointmentId,
    branchId,
    reason,
    details,
    at: now(),
  });
}

export function attachBookingBilling(db, user, appointment, form) {
  const insurance = insuranceInput(form.insurance);
  const quote = bookingQuote(db, form, user.id);
  if (insurance.status !== 'none') {
    const policy = insurancePolicy(db, appointment.branchId, appointment.date);
    check(
      policy?.enabled &&
        quote.items.some((item) =>
          policy.services.some(
            (service) => service.serviceId === item.serviceId && service.tariff > 0,
          ),
        ),
      'Cơ sở hoặc dịch vụ chưa hỗ trợ BHYT cho ngày khám đã chọn.',
    );
  }
  check(!quote.error, quote.error);
  appointment.billing = {
    items: quote.items,
    insurance,
    promotion: quote.promotion ? structuredClone(quote.promotion) : null,
    estimate: quote.price,
    finalized: null,
    settledAt: '',
    settlementId: '',
    legacy: false,
  };
  if (quote.promotion)
    db.promotionUses.push({
      id: id('use'),
      promotionId: quote.promotion.id,
      appointmentId: appointment.id,
      patientId: user.id,
      branchId: appointment.branchId,
      status: 'reserved',
      at: now(),
    });
  audit(
    db,
    user,
    'booking',
    appointment.id,
    appointment.branchId,
    'Lưu dự toán và điều khoản ưu đãi.',
  );
}

export function releasePromotion(db, user, appointment) {
  for (const use of db.promotionUses.filter(
    (u) => u.appointmentId === appointment.id && u.status === 'reserved',
  )) {
    use.status = 'released';
    use.updatedAt = now();
  }
  audit(
    db,
    user,
    'appointment-status',
    appointment.id,
    appointment.branchId,
    appointment.reason || appointment.status,
  );
}

export function recordServices(db, user, appointment, payload) {
  const billing = appointment.billing;
  check(!billing.finalized && !billing.settledAt, 'Bảng phí đã chốt, không thể sửa dịch vụ.');
  if (payload.services !== undefined) {
    check(
      Array.isArray(payload.services) && payload.services.length <= 30,
      'Danh sách dịch vụ không hợp lệ.',
    );
    const seen = new Set();
    const extras = payload.services.map((line) => {
      const previous = billing.items.find((i) => i.serviceId === line.serviceId);
      const service = db.serviceCatalog.find(
        (s) => s.id === line.serviceId && (s.active || previous) && s.id !== 'consultation',
      );
      const quantity = Number(line.quantity);
      check(
        service &&
          Number.isInteger(quantity) &&
          quantity > 0 &&
          quantity <= 20 &&
          !seen.has(service.id),
        'Dịch vụ hoặc số lượng không hợp lệ.',
      );
      seen.add(service.id);
      return {
        serviceId: service.id,
        name: previous?.name ?? service.name,
        unitPrice: previous?.unitPrice ?? service.price,
        quantity,
        discountable: previous?.discountable ?? service.discountable,
      };
    });
    const baseItems = billing.items.filter(
      (item) => item.serviceId === 'consultation' || item.packageServiceId,
    );
    const next = [...baseItems, ...extras];
    check(
      integer(next.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)),
      'Tổng chi phí dịch vụ vượt giới hạn mô phỏng.',
    );
    if (JSON.stringify(next) !== JSON.stringify(billing.items)) {
      check(
        String(payload.serviceReason || '').trim(),
        'Nhập lý do thay đổi dịch vụ so với dự toán.',
      );
      billing.items = next;
      billing.serviceReason = String(payload.serviceReason).trim();
      audit(db, user, 'services', appointment.id, appointment.branchId, billing.serviceReason, {
        items: next,
      });
    }
  }
  if (payload.finalized && !billing.legacy)
    check(billing.receivedAt, 'Nhân viên cần tiếp nhận bệnh nhân trước khi hoàn tất khám.');
}

function savePromotion(db, user, p) {
  check(admin(user), 'Không có quyền quản lý khuyến mãi.');
  const old = db.promotions.find((r) => r.id === p.id);
  const v = p.values || {};
  const row = {
    id: old?.id || id('promo'),
    name: String(v.name || '').trim(),
    mode: v.mode,
    code: String(v.code || '')
      .trim()
      .toUpperCase(),
    kind: v.kind,
    value: Number(v.value),
    maxDiscount: Number(v.maxDiscount),
    minimum: Number(v.minimum),
    startsOn: v.startsOn,
    endsOn: v.endsOn,
    branchIds: [...new Set(v.branchIds || [])],
    serviceIds: [...new Set(v.serviceIds || [])],
    audience: v.audience,
    discountScope: v.discountScope || 'patient',
    totalLimit: Number(v.totalLimit),
    perPatientLimit: Number(v.perPatientLimit),
    active: v.active === true,
  };
  if (user.role !== 'superAdmin') {
    check(
      !old || (old.branchIds.length === 1 && old.branchIds[0] === user.branchId),
      'Chỉ sửa chương trình của cơ sở mình.',
    );
    check(
      row.branchIds.length === 1 && row.branchIds[0] === user.branchId,
      'Chương trình phải giới hạn tại cơ sở mình.',
    );
  }
  check(
    row.name &&
      ['auto', 'code'].includes(row.mode) &&
      ['fixed', 'percent'].includes(row.kind) &&
      ['all', 'new'].includes(row.audience) &&
      ['outside', 'patient'].includes(row.discountScope),
    'Thông tin chương trình không hợp lệ.',
  );
  check(
    row.mode !== 'code' || /^[A-Z0-9_-]{3,30}$/.test(row.code),
    'Mã gồm 3–30 chữ, số, dấu gạch ngang/gạch dưới.',
  );
  if (row.mode === 'auto') row.code = '';
  check(
    !row.code || !db.promotions.some((r) => r.id !== row.id && r.code === row.code),
    'Mã khuyến mãi đã tồn tại.',
  );
  check(
    validInsuranceDate(row.startsOn) &&
      validInsuranceDate(row.endsOn) &&
      row.startsOn <= row.endsOn,
    'Thời gian khuyến mãi không hợp lệ.',
  );
  check(
    [row.value, row.maxDiscount, row.minimum, row.totalLimit, row.perPatientLimit].every(integer) &&
      row.value > 0 &&
      row.maxDiscount > 0 &&
      row.totalLimit > 0 &&
      row.perPatientLimit > 0 &&
      (row.kind !== 'percent' || row.value <= 100),
    'Giá trị, giới hạn hoặc phần trăm không hợp lệ.',
  );
  check(
    row.branchIds.every((bid) => db.branches.some((b) => b.id === bid && b.active)),
    'Cơ sở áp dụng không hợp lệ.',
  );
  check(
    row.serviceIds.every(
      (sid) =>
        db.serviceCatalog.some((s) => s.id === sid) ||
        db.packages.some((s) => `package:${s.id}` === sid),
    ),
    'Dịch vụ áp dụng không hợp lệ.',
  );
  const uses = db.promotionUses.filter((u) => u.promotionId === row.id && u.status !== 'released');
  check(
    row.totalLimit >= uses.length &&
      uses.every(
        (use) => uses.filter((u) => u.patientId === use.patientId).length <= row.perPatientLimit,
      ),
    'Giới hạn mới thấp hơn số lượt đang giữ/đã dùng.',
  );
  if (old) Object.assign(old, row);
  else db.promotions.push(row);
  audit(db, user, 'promotion-save', '', row.branchIds[0] || '', row.name, { promotionId: row.id });
  return row.id;
}

function savePolicy(db, user, p) {
  check(user.role === 'superAdmin', 'Chỉ admin tổng quản lý cấu hình BHYT.');
  const v = p.values || {};
  check(
    db.branches.some((b) => b.id === v.branchId && b.active),
    'Cơ sở không hợp lệ.',
  );
  check(
    validInsuranceDate(v.effectiveFrom) &&
      validInsuranceDate(v.effectiveTo) &&
      v.effectiveFrom <= v.effectiveTo,
    'Ngày hiệu lực không hợp lệ.',
  );
  check(Array.isArray(v.services) && v.services.length > 0, 'Nhập danh mục biểu giá BHYT.');
  const services = v.services.map((s) => ({ serviceId: s.serviceId, tariff: Number(s.tariff) }));
  check(
    new Set(services.map((s) => s.serviceId)).size === services.length &&
      services.every(
        (s) => db.serviceCatalog.some((r) => r.id === s.serviceId) && integer(s.tariff),
      ),
    'Biểu giá BHYT không hợp lệ.',
  );
  const version =
    1 +
    Math.max(
      0,
      ...db.insurancePolicies.filter((r) => r.branchId === v.branchId).map((r) => r.version),
    );
  const row = {
    id: id('policy'),
    branchId: v.branchId,
    version,
    enabled: v.enabled === true,
    effectiveFrom: v.effectiveFrom,
    effectiveTo: v.effectiveTo,
    services,
    note: String(v.note || '').trim(),
    createdBy: user.id,
    createdAt: now(),
  };
  check(row.note, 'Nhập lý do ban hành phiên bản cấu hình.');
  db.insurancePolicies.push(row);
  audit(db, user, 'policy-save', '', row.branchId, row.note, { version });
  return row.id;
}

export function billingAction(db, user, type, p, today) {
  if (type === 'service-save') {
    check(user.role === 'superAdmin', 'Chỉ admin tổng được sửa danh mục dịch vụ.');
    const service = db.serviceCatalog.find((s) => s.id === p.id);
    const price = Number(p.price);
    check(
      service && service.id !== 'consultation' && integer(price) && price > 0,
      'Dịch vụ hoặc đơn giá không hợp lệ.',
    );
    check(String(p.reason || '').trim(), 'Nhập lý do thay đổi đơn giá dịch vụ.');
    Object.assign(service, {
      price,
      active: p.active === true,
      discountable: p.discountable === true,
    });
    audit(db, user, type, '', '', String(p.reason).trim(), { serviceId: service.id, price });
    return service.id;
  }
  if (type === 'promotion-save') return savePromotion(db, user, p);
  if (type === 'policy-save') return savePolicy(db, user, p);
  const a = db.appointments.find((r) => r.id === p.id);
  check(a, 'Không tìm thấy lịch hẹn.');
  const b = a.billing;
  if (type === 'insurance-resubmit') {
    check(
      user.role === 'patient' &&
        a.patientId === user.id &&
        ['pending', 'confirmed', 'completed'].includes(a.status) &&
        !b.finalized,
      'Không thể bổ sung BHYT cho lịch này.',
    );
    check(
      ['pending', 'supplement', 'rejected'].includes(b.insurance.status),
      'Hồ sơ không ở trạng thái được bổ sung.',
    );
    b.insurance = insuranceInput({ ...p.insurance, enabled: true });
    audit(db, user, type, a.id, a.branchId, 'Bệnh nhân bổ sung thông tin BHYT.');
    return;
  }
  const branchStaff = user.role === 'staff' && user.branchId === a.branchId;
  check(
    branchAccess(user, a.branchId) ||
      (branchStaff &&
        [
          'receive',
          'insurance-verify',
          'billing-services',
          'promotion-apply',
          'bill-finalize',
          'pay',
        ].includes(type) &&
        (a.bookingMode === 'facility' || type === 'receive')),
    'Không có quyền xử lý tại cơ sở này.',
  );
  if (type === 'receive') {
    check(
      a.status === 'confirmed' && a.date === today && !b.receivedAt,
      'Chỉ tiếp nhận một lần cho lịch đã xác nhận trong ngày khám.',
    );
    b.receivedAt = now();
    b.receivedBy = user.id;
    audit(db, user, type, a.id, a.branchId, 'Đã kiểm tra thông tin người khám.');
  } else if (type === 'billing-services') {
    check(
      a.bookingMode === 'facility' && a.status === 'confirmed' && b.receivedAt && !b.finalized,
      'Chỉ ghi dịch vụ cho lịch không chọn bác sĩ đã tiếp nhận và chưa chốt phí.',
    );
    recordServices(db, user, a, p);
  } else if (type === 'promotion-apply') {
    check(!b.finalized && !b.settledAt, 'Bảng phí đã chốt, không thể đổi ưu đãi.');
    const items = [...b.items, ...(b.medicineItems || [])];
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const selected = selectPromotion(
      db,
      {
        date: a.date,
        branchId: a.branchId,
        patientId: a.patientId,
        ignoreAppointmentId: a.id,
        items: calculatePrice(items, b.insurance).items,
        subtotal,
      },
      String(p.code || ''),
    );
    check(!selected.error, selected.error);
    for (const use of db.promotionUses.filter(
      (item) => item.appointmentId === a.id && item.status === 'reserved',
    ))
      use.status = 'released';
    b.promotion = selected.promotion ? structuredClone(selected.promotion) : null;
    if (selected.promotion)
      db.promotionUses.push({
        id: id('use'),
        promotionId: selected.promotion.id,
        appointmentId: a.id,
        patientId: a.patientId,
        branchId: a.branchId,
        status: 'reserved',
        at: now(),
      });
    audit(db, user, type, a.id, a.branchId, selected.promotion?.name || 'Không áp dụng ưu đãi');
  } else if (type === 'insurance-verify') {
    check(
      ['confirmed', 'completed'].includes(a.status) && !b.finalized && b.receivedAt,
      'Cần tiếp nhận và chưa chốt phí để xác minh BHYT.',
    );
    check(b.insurance.status !== 'none', 'Lịch chưa đăng ký BHYT.');
    check(
      ['verified', 'supplement', 'rejected'].includes(p.status) && String(p.reason || '').trim(),
      'Chọn kết quả và nhập căn cứ xác minh.',
    );
    let insurance = {
      ...b.insurance,
      status: p.status,
      reason: String(p.reason).trim(),
      verifiedBy: user.id,
      verifiedAt: now(),
    };
    if (p.status === 'verified') {
      const policy = insurancePolicy(db, a.branchId, a.date);
      check(
        policy?.enabled &&
          b.items.some((i) =>
            policy.services.some((s) => s.serviceId === i.serviceId && s.tariff > 0),
          ),
        'Cơ sở/dịch vụ không hỗ trợ BHYT tại ngày khám.',
      );
      check(
        insurance.validFrom <= a.date && insurance.validTo >= a.date,
        'BHYT không có hiệu lực tại ngày khám.',
      );
      const coverage = deriveInsuranceCoverage(db, a, p);
      insurance = {
        ...insurance,
        ...coverage,
        policy: structuredClone(policy),
      };
    }
    b.insurance = insurance;
    audit(db, user, type, a.id, a.branchId, insurance.reason, {
      status: p.status,
      rate: insurance.rate,
      policyId: insurance.policy?.id,
    });
  } else if (type === 'bill-finalize') {
    check(
      a.status === 'completed' && !b.finalized && !b.settledAt,
      'Chỉ chốt một lần sau khi hoàn tất khám.',
    );
    const price = calculatePrice(
      [...b.items, ...(b.medicineItems || [])],
      b.insurance,
      b.promotion,
    );
    check(!price.unresolved, 'BHYT chưa được xác minh hoặc cần bổ sung.');
    check(String(p.reason || '').trim(), 'Nhập ghi chú đối chiếu chi phí với khách.');
    b.finalized = { price, by: user.id, at: now(), reason: String(p.reason).trim() };
    audit(db, user, type, a.id, a.branchId, b.finalized.reason, { price });
  } else if (type === 'pay') {
    check(
      a.status === 'completed' && b.finalized && !financialBalance(db, a).settled,
      'Lịch phải hoàn tất, đã chốt phí và chưa được thu tiền.',
    );
    const price = appointmentPrice(a);
    check(price.patientDue !== null && integer(price.patientDue), 'Số tiền cần thu không hợp lệ.');
    check(['cash', 'transfer'].includes(p.method || 'cash'), 'Phương thức thu không hợp lệ.');
    const receiptId = id(price.patientDue ? 'pay' : 'settlement');
    if (price.patientDue > 0)
      db.payments.push({
        id: receiptId,
        appointmentId: a.id,
        branchId: a.branchId,
        amount: price.patientDue,
        date: today,
        createdAt: now(),
        createdBy: user.id,
        method: p.method || 'cash',
        price: structuredClone(price),
      });
    b.settledAt = now();
    b.settlementId = receiptId;
    for (const use of db.promotionUses.filter(
      (u) => u.appointmentId === a.id && u.status === 'reserved',
    )) {
      use.status = price.discount > 0 ? 'redeemed' : 'released';
      use.updatedAt = now();
    }
    audit(
      db,
      user,
      type,
      a.id,
      a.branchId,
      price.patientDue ? 'Ghi nhận thu tiền mô phỏng.' : 'Hoàn tất nghĩa vụ thanh toán 0đ.',
      { amount: price.patientDue, receiptId },
    );
  } else if (type === 'bill-adjust') {
    const balance = financialBalance(db, a);
    const amount = Number(p.amount);
    check(
      balance.settled && ['refund', 'additional'].includes(p.kind),
      'Chỉ điều chỉnh phiếu đã thanh toán.',
    );
    check(
      integer(amount) && amount > 0 && String(p.reason || '').trim(),
      'Nhập số tiền nguyên dương và lý do điều chỉnh.',
    );
    check(
      p.kind !== 'refund' || amount <= balance.paid,
      'Số tiền hoàn vượt quá số tiền khách đã trả còn lại.',
    );
    check(['cash', 'transfer'].includes(p.method), 'Chọn phương thức giao dịch.');
    const reference = String(p.reference || '').trim();
    check(
      reference &&
        !db.adjustments.some((r) => r.appointmentId === a.id && r.reference === reference),
      'Nhập tham chiếu mới; chứng từ điều chỉnh này đã được xử lý hoặc chưa có tham chiếu.',
    );
    check(
      p.kind !== 'additional' || integer(balance.patientDue + amount),
      'Tổng điều chỉnh vượt giới hạn.',
    );
    const row = {
      id: id('adjustment'),
      appointmentId: a.id,
      branchId: a.branchId,
      receiptId: b.settlementId,
      reference,
      kind: p.kind,
      amount,
      method: p.method,
      reason: String(p.reason).trim(),
      createdBy: user.id,
      date: today,
      at: now(),
    };
    db.adjustments.push(row);
    audit(db, user, type, a.id, a.branchId, row.reason, row);
  } else if (type === 'insurance-settle') {
    check(
      b.finalized &&
        b.finalized.price.insurer > 0 &&
        !db.insuranceSettlements.some((s) => s.appointmentId === a.id),
      'Khoản BHYT chưa sẵn sàng hoặc đã quyết toán.',
    );
    check(String(p.reason || '').trim(), 'Nhập tham chiếu quyết toán mô phỏng.');
    db.insuranceSettlements.push({
      id: id('claim'),
      appointmentId: a.id,
      branchId: a.branchId,
      amount: b.finalized.price.insurer,
      date: today,
      at: now(),
      createdBy: user.id,
      reason: String(p.reason).trim(),
    });
    audit(db, user, type, a.id, a.branchId, String(p.reason).trim());
  } else throw new Error('Thao tác tài chính không hợp lệ.');
}
