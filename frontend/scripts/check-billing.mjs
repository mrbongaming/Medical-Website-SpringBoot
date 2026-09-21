import assert from 'node:assert/strict';
import { createSeed, dateKey, relativeDate } from '../src/data/seed.js';
import { act } from '../src/data/domain.js';
import { migrateData } from '../src/data/storage.js';
import { report } from '../src/data/reports.js';
import { bookingQuote, calculatePrice, financialBalance } from '../src/helpers/PricingHelpers.js';

let db;
let count = 0;
const reset = () => {
  db = createSeed();
  db.promotionUses = [];
};
const run = (actor, action, payload) => {
  const result = act(db, actor, action, payload);
  db = result.db;
  count++;
  return result.result;
};
const deny = (actor, action, payload, pattern) => {
  const before = JSON.stringify(db);
  assert.throws(() => act(db, actor, action, payload), pattern);
  assert.equal(JSON.stringify(db), before, 'Failure must not mutate source');
  count++;
};
const form = (more = {}) => ({
  branchId: 'b1',
  specialtyId: 'sp1',
  doctorId: 'dr1',
  date: relativeDate(2),
  time: '08:00',
  patientName: 'Khách mẫu',
  phone: '0987654321',
  ...more,
});
const card = (more = {}) => ({
  enabled: true,
  cardNumber: 'DEMO12345678901',
  validFrom: relativeDate(-30),
  validTo: relativeDate(30),
  registeredFacility: 'An Tâm mẫu',
  ...more,
});
const booking = (more = {}) => run('p1', 'book', form(more));
const appointment = (id) => db.appointments.find((a) => a.id === id);
const complete = (id, more = {}) =>
  run('u-dr1', 'record', {
    appointmentId: id,
    finalized: true,
    symptoms: 'Mẫu',
    diagnosis: 'Kết quả mẫu',
    ...more,
  });
const intake = (id) => {
  run('u-dr1', 'appointment', { id, status: 'confirmed' });
  // Advance this fixture to the day of care without depending on the wall-clock hour.
  appointment(id).date = dateKey();
  appointment(id).time = '00:00';
  run('admin1', 'receive', { id });
};
const verify = (id, more = {}) =>
  run('admin1', 'insurance-verify', {
    id,
    status: 'verified',
    rate: 80,
    routeRate: 100,
    reason: 'Đã đối chiếu hồ sơ mẫu',
    ...more,
  });
const finalize = (id) =>
  run('admin1', 'bill-finalize', { id, reason: 'Đã đối chiếu từng dịch vụ với khách.' });

reset();
const basePromo = structuredClone(db.promotions[0]);
deny('p1', 'promotion-save', { values: basePromo }, /quyền/);
deny('admin2', 'promotion-save', { id: basePromo.id, values: basePromo }, /cơ sở/);
deny('root', 'promotion-save', { values: { ...basePromo, code: 'ANTAM50' } }, /tồn tại/);
deny('root', 'promotion-save', { values: { ...basePromo, code: 'NAN', value: 'NaN' } }, /hợp lệ/);
deny(
  'root',
  'promotion-save',
  { values: { ...basePromo, code: 'OVER', kind: 'percent', value: 101 } },
  /hợp lệ/,
);
deny(
  'root',
  'promotion-save',
  { values: { ...basePromo, code: 'BADDATE', startsOn: '2026-02-30' } },
  /Thời gian/,
);
run('admin1', 'promotion-save', { values: { ...basePromo, code: 'BRANCH', branchIds: ['b1'] } });
deny(
  'admin2',
  'promotion-save',
  { id: db.promotions.at(-1).id, values: { ...db.promotions.at(-1), branchIds: ['b2'] } },
  /cơ sở/,
);
deny('p1', 'book', form({ promotionCode: 'UNKNOWN' }), /tồn tại/);
run('root', 'promotion-save', {
  id: basePromo.id,
  values: { ...basePromo, endsOn: relativeDate(1) },
});
deny('p1', 'book', form({ promotionCode: 'ANTAM50' }), /thời gian/);
run('root', 'promotion-save', { id: basePromo.id, values: { ...basePromo, branchIds: ['b2'] } });
deny('p1', 'book', form({ promotionCode: 'ANTAM50' }), /cơ sở/);
run('root', 'promotion-save', { id: basePromo.id, values: { ...basePromo, serviceIds: ['ecg'] } });
deny('p1', 'book', form({ promotionCode: 'ANTAM50' }), /Dịch vụ/);
run('root', 'promotion-save', { id: basePromo.id, values: { ...basePromo, minimum: 900000 } });
deny('p1', 'book', form({ promotionCode: 'ANTAM50' }), /tối thiểu/);
run('root', 'promotion-save', { id: basePromo.id, values: { ...basePromo, audience: 'new' } });
deny('p1', 'book', form({ promotionCode: 'ANTAM50' }), /chưa có/);

reset();
run('root', 'promotion-save', { id: basePromo.id, values: { ...basePromo, totalLimit: 1 } });
let id = booking({ promotionCode: ' antam50 ' });
assert.equal(appointment(id).billing.estimate.patientDue, 150000);
deny('p2', 'book', form({ time: '09:00', promotionCode: 'ANTAM50' }), /hết lượt/);
run('p1', 'appointment', { id, status: 'cancelled' });
assert.equal(db.promotionUses[0].status, 'released');
id = booking({ promotionCode: 'ANTAM50' });
run('u-dr1', 'appointment', { id, status: 'rejected', reason: 'Đổi lịch mẫu' });
assert.equal(db.promotionUses.at(-1).status, 'released');
id = booking({ promotionCode: 'ANTAM50' });
run('u-dr1', 'appointment', { id, status: 'confirmed' });
appointment(id).date = relativeDate(-1);
run('admin1', 'appointment', { id, status: 'absent' });
assert.equal(db.promotionUses.at(-1).status, 'released');

reset();
id = booking({ promotionCode: 'ANTAM50' });
deny('p1', 'book', form({ time: '09:00', promotionCode: 'ANTAM50' }), /hết lượt/);
run('root', 'promotion-save', {
  id: basePromo.id,
  values: { ...basePromo, value: 1, active: false },
});
assert.equal(appointment(id).billing.promotion.value, 50000, 'Booked terms must remain unchanged');
assert.equal(bookingQuote(db, form({ packageId: 'pkg1' }), 'p1').price.discount, 30000);
run('root', 'promotion-save', {
  values: {
    ...basePromo,
    mode: 'auto',
    code: '',
    name: 'Ưu đãi tự động tốt hơn',
    value: 100000,
    maxDiscount: 100000,
  },
});
assert.equal(bookingQuote(db, form(), 'p1').price.patientDue, 100000);
assert.equal(
  calculatePrice(
    [{ serviceId: 'x', quantity: 1, unitPrice: 20000, discountable: true }],
    { status: 'none' },
    { ...basePromo, minimum: 0 },
  ).patientDue,
  0,
  'Discount cannot exceed eligible fees',
);
assert.equal(
  calculatePrice(
    [{ serviceId: 'x', quantity: 1, unitPrice: 200000, discountable: false }],
    { status: 'none' },
    basePromo,
  ).discount,
  0,
);

reset();
deny('p1', 'book', form({ insurance: card({ validTo: '2026-02-30' }) }), /Thời hạn/);
deny('p1', 'book', form({ insurance: card({ cardNumber: '123' }) }), /mã thẻ/);
deny('p1', 'book', form({ packageId: 'pkg1', insurance: card() }), /hỗ trợ BHYT/);
id = booking({ insurance: card(), promotionCode: 'ANTAM50' });
assert.equal(appointment(id).billing.estimate.insurer, null);
assert.equal(appointment(id).billing.estimate.patientDue, null);
deny(
  'admin1',
  'insurance-verify',
  { id, status: 'verified', reason: 'x', rate: 80, routeRate: 100 },
  /tiếp nhận/,
);
deny('admin1', 'pay', { id }, /chốt phí/);
run('u-dr1', 'appointment', { id, status: 'confirmed' });
deny('admin1', 'receive', { id }, /ngày khám/);
appointment(id).date = dateKey();
appointment(id).time = '00:00';
deny(
  'u-dr1',
  'record',
  { appointmentId: id, finalized: true, symptoms: 'x', diagnosis: 'x' },
  /tiếp nhận/,
);
deny('admin2', 'receive', { id }, /quyền/);
run('admin1', 'receive', { id });
deny('admin1', 'receive', { id }, /một lần/);
deny('admin1', 'appointment', { id, status: 'absent' }, /vắng mặt/);
deny('admin1', 'appointment', { id, status: 'cancelled', reason: 'x' }, /hủy/);
deny('p1', 'insurance-verify', { id }, /quyền/);
deny('admin2', 'insurance-verify', { id }, /quyền/);
deny(
  'admin1',
  'insurance-verify',
  { id, status: 'verified', rate: 90, routeRate: 100, reason: 'x' },
  /Mức hưởng/,
);
run('admin1', 'insurance-verify', {
  id,
  status: 'supplement',
  reason: 'Bổ sung thông tin nơi đăng ký',
});
deny('p2', 'insurance-resubmit', { id, insurance: card() }, /Không thể/);
run('p1', 'insurance-resubmit', { id, insurance: card() });
verify(id);
assert.equal(financialBalance(db, appointment(id)).price.patientDue, 110000);
assert.equal(financialBalance(db, appointment(id)).price.copay, 10000);
assert.equal(financialBalance(db, appointment(id)).price.discount, 50000);
const policy = structuredClone(appointment(id).billing.insurance.policy);
deny('admin1', 'policy-save', { values: policy }, /admin tổng/);
run('root', 'policy-save', {
  values: {
    ...policy,
    note: 'Biểu giá mẫu mới',
    services: policy.services.map((s) => ({ ...s, tariff: 1 })),
  },
});
assert.deepEqual(appointment(id).billing.insurance.policy, policy);
deny(
  'u-dr1',
  'record',
  { appointmentId: id, finalized: false, services: [{ serviceId: 'missing', quantity: 1 }] },
  /Dịch vụ/,
);
deny(
  'u-dr1',
  'record',
  { appointmentId: id, finalized: false, services: [{ serviceId: 'ecg', quantity: -1 }] },
  /Dịch vụ/,
);
deny(
  'u-dr1',
  'record',
  { appointmentId: id, finalized: false, services: [{ serviceId: 'ecg', quantity: 1 }] },
  /lý do/,
);
deny('admin1', 'record', { appointmentId: id, finalized: true }, /bác sĩ/);
complete(id, {
  services: [{ serviceId: 'ecg', quantity: 1 }],
  serviceReason: 'Điện tâm đồ đã thực hiện và đối chiếu chi phí.',
});
assert.equal(financialBalance(db, appointment(id)).price.patientDue, 188000);
deny('p1', 'bill-finalize', { id, reason: 'x' }, /quyền/);
finalize(id);
const frozenBill = structuredClone(appointment(id).billing.finalized);
deny('admin1', 'bill-finalize', { id, reason: 'x' }, /một lần/);
deny('admin1', 'insurance-verify', { id, status: 'rejected', reason: 'x' }, /chốt phí/);
deny('admin2', 'pay', { id }, /quyền/);
run('admin1', 'pay', { id, amount: 1, method: 'transfer' });
assert.equal(db.payments.at(-1).amount, 188000, 'Ignore forged amount from UI');
assert.equal(db.promotionUses.find((u) => u.appointmentId === id).status, 'redeemed');
deny('admin1', 'pay', { id }, /chưa được thu/);
deny(
  'admin1',
  'bill-adjust',
  { id, kind: 'refund', amount: 188001, method: 'cash', reason: 'x', reference: 'R1' },
  /vượt/,
);
deny(
  'admin2',
  'bill-adjust',
  { id, kind: 'refund', amount: 1, method: 'cash', reason: 'x', reference: 'R1' },
  /quyền/,
);
run('admin1', 'bill-adjust', {
  id,
  kind: 'refund',
  amount: 20000,
  method: 'cash',
  reason: 'Điều chỉnh phần tự trả mẫu.',
  reference: 'R1',
});
deny(
  'admin1',
  'bill-adjust',
  { id, kind: 'refund', amount: 20000, method: 'cash', reason: 'x', reference: 'R1' },
  /tham chiếu/,
);
run('admin1', 'bill-adjust', {
  id,
  kind: 'additional',
  amount: 10000,
  method: 'cash',
  reason: 'Đối chiếu thiếu khoản tự trả.',
  reference: 'A1',
});
assert.equal(financialBalance(db, appointment(id)).paid, 178000);
assert.deepEqual(appointment(id).billing.finalized, frozenBill);
const filters = { from: dateKey(), to: dateKey() };
let summary = report(
  db,
  db.users.find((u) => u.id === 'admin1'),
  filters,
);
assert.equal(summary.revenue, 178000);
assert.equal(summary.refunds, 20000);
assert.equal(summary.insuranceDebt, 112000);
assert.equal(
  summary.finance.filter((f) => f.field === 'branchId').reduce((sum, f) => sum + f.amount, 0),
  summary.revenue,
);
run('admin1', 'insurance-settle', { id, reason: 'Quyết toán mẫu QT-01' });
deny('admin1', 'insurance-settle', { id, reason: 'Trùng' }, /đã quyết toán/);
summary = report(
  db,
  db.users.find((u) => u.id === 'admin1'),
  filters,
);
assert.equal(summary.revenue, 178000);
assert.equal(summary.insuranceDebt, 0);
assert.equal(summary.insuranceReceived, 112000);
assert.equal(
  report(
    db,
    db.users.find((u) => u.id === 'admin2'),
    filters,
  ).revenue,
  0,
);
assert.ok(
  db.auditLogs.filter((r) => r.appointmentId === id).every((r) => r.actorId && r.at && r.reason),
);

reset();
id = booking({ insurance: card({ validTo: relativeDate(-1) }) });
intake(id);
deny(
  'admin1',
  'insurance-verify',
  { id, status: 'verified', rate: 80, routeRate: 100, reason: 'x' },
  /hiệu lực/,
);
complete(id);
deny('admin1', 'bill-finalize', { id, reason: 'x' }, /chưa được xác minh/);
run('admin1', 'insurance-verify', {
  id,
  status: 'rejected',
  reason: 'Thẻ mẫu hết hiệu lực vào ngày khám.',
});
finalize(id);
assert.equal(appointment(id).billing.finalized.price.patientDue, 200000);

// Missing papers can still be supplied after care, until the bill is finalized.
reset();
id = booking({ insurance: card() });
intake(id);
complete(id);
run('admin1', 'insurance-verify', {
  id,
  status: 'supplement',
  reason: 'Bổ sung giấy tờ sau khám.',
});
run('p1', 'insurance-resubmit', { id, insurance: card() });
assert.equal(appointment(id).billing.insurance.status, 'pending');
verify(id, { rate: 95, routeRate: 50 });
assert.equal(financialBalance(db, appointment(id)).price.insurer, 23750);
finalize(id);
deny('p1', 'insurance-resubmit', { id, insurance: card() }, /Không thể/);

// A service already performed retains its price and promotion flag after catalog changes.
reset();
id = booking();
intake(id);
run('u-dr1', 'record', {
  appointmentId: id,
  services: [{ serviceId: 'ecg', quantity: 1 }],
  serviceReason: 'Đã thực hiện điện tâm đồ.',
});
run('root', 'service-save', {
  id: 'ecg',
  price: 999000,
  active: false,
  discountable: false,
  reason: 'Ngừng sử dụng giá mẫu cũ.',
});
complete(id, {
  services: [{ serviceId: 'ecg', quantity: 1 }],
  serviceReason: 'Đã thực hiện điện tâm đồ.',
});
assert.equal(appointment(id).billing.items[1].unitPrice, 150000);
assert.equal(appointment(id).billing.items[1].discountable, true);

reset();
run('root', 'promotion-save', {
  id: basePromo.id,
  values: { ...basePromo, minimum: 0, value: 200000, maxDiscount: 200000 },
});
id = booking({ promotionCode: 'ANTAM50' });
intake(id);
complete(id);
finalize(id);
const beforePayments = db.payments.length;
run('admin1', 'pay', { id });
assert.equal(db.payments.length, beforePayments, 'Zero due must not create a cash receipt');
assert.equal(financialBalance(db, appointment(id)).settled, true);
assert.ok(
  !report(
    db,
    db.users.find((u) => u.id === 'root'),
    { from: '2000-01-01', to: '2099-12-31' },
  ).unpaid.some((a) => a.id === id),
);
deny('admin1', 'pay', { id }, /chưa được thu/);
deny(
  'admin1',
  'bill-adjust',
  { id, kind: 'refund', amount: 1, method: 'cash', reason: 'x', reference: 'R0' },
  /vượt/,
);

reset();
deny('admin1', 'service-save', { id: 'ecg', price: 100000, reason: 'x' }, /admin tổng/);
run('root', 'service-save', {
  id: 'ecg',
  price: 180000,
  active: true,
  discountable: false,
  reason: 'Giá mẫu mới',
});
assert.equal(db.serviceCatalog.find((s) => s.id === 'ecg').price, 180000);
const legacy = structuredClone(db);
legacy.version = 2;
for (const a of legacy.appointments) delete a.billing;
for (const key of [
  'promotions',
  'serviceCatalog',
  'insurancePolicies',
  'promotionUses',
  'adjustments',
  'auditLogs',
  'insuranceSettlements',
])
  delete legacy[key];
const migrated = migrateData(legacy);
assert.equal(migrated.version, 3);
assert.deepEqual(migrated.payments, legacy.payments);
assert.deepEqual(migrated.records, legacy.records);
assert.deepEqual(
  migrated.appointments.map(({ billing: _billing, ...a }) => a),
  legacy.appointments,
);
assert.ok(
  migrated.appointments.every(
    (a) => a.billing.insurance.status === 'none' && a.billing.estimate.discount === 0,
  ),
);
assert.equal(legacy.version, 2);
assert.deepEqual(migrateData(migrated), migrated);
assert.throws(() => migrateData({ ...migrated, adjustments: null }));
console.log(
  `PASS: ${count} billing actions/denials plus pricing, snapshot, migration and report reconciliation assertions.`,
);
