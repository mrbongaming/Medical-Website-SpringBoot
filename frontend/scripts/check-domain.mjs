import assert from 'node:assert/strict';
import { createSeed, dateKey, relativeDate } from '../src/data/seed.js';
import { act, availableSlots, accessibleRecords, scopedAppointments } from '../src/data/domain.js';
import { report } from '../src/data/reports.js';
import { migrateData } from '../src/data/storage.js';
import { bookingStartStep, initialBooking } from '../src/data/booking.js';

let db = createSeed();
let checks = 0;
function run(actor, type, payload) {
  const next = act(db, actor, type, payload);
  db = next.db;
  checks++;
  return next.result;
}
function deny(actor, type, payload, pattern) {
  const before = JSON.stringify(db);
  assert.throws(() => act(db, actor, type, payload), pattern);
  assert.equal(JSON.stringify(db), before, 'Rejected action must be atomic');
  checks++;
}
const user = (id) => db.users.find((u) => u.id === id);
assert.equal(db.branches.length, 4);
assert.equal(db.specialties.length, 6);
assert.equal(db.doctors.length, 12);
assert.equal(db.packages.length, 4);
for (const a of db.appointments) {
  const doctor = db.doctors.find((d) => d.id === a.doctorId);
  assert.equal(doctor.branchId, a.branchId);
  assert.ok(db.users.some((u) => u.id === a.patientId && u.role === 'patient'));
  assert.ok(
    db.schedules.some(
      (s) => s.doctorId === a.doctorId && s.date === a.date && s.times.includes(a.time),
    ),
  );
}
assert.equal(new Set(db.schedules.map((s) => s.doctorId + s.date)).size, db.schedules.length);
assert.equal(
  new Set(
    db.appointments
      .filter((a) => !['cancelled', 'rejected'].includes(a.status))
      .map((a) => a.doctorId + a.date + a.time),
  ).size,
  db.appointments.filter((a) => !['cancelled', 'rejected'].includes(a.status)).length,
);

// Appointment creation validates relationships, availability, role and duplicate submissions.
const form = {
  branchId: 'b1',
  specialtyId: 'sp1',
  doctorId: 'dr1',
  date: relativeDate(2),
  time: '08:00',
  patientName: 'Bệnh nhân thử',
  phone: '0987654321',
};
deny('root', 'book', form, /bệnh nhân/);
deny('p1', 'book', { ...form, branchId: 'b2' }, /Cơ sở/);
deny('p1', 'book', { ...form, packageId: 'pkg2' }, /Gói khám/);
deny('p1', 'book', { ...form, date: relativeDate(-1) }, /Khung giờ/);
deny('p1', 'book', { ...form, phone: '123' }, /Thông tin/);
const booking = run('p1', 'book', form);
deny('p1', 'book', form, /Khung giờ/);
deny('p1', 'book', { ...form, doctorId: 'dr2', specialtyId: 'sp2' }, /trùng thời gian/);
assert.ok(!availableSlots(db, 'dr1', form.date).find((s) => s.time === form.time).available);
assert.ok(scopedAppointments(db, user('admin1')).some((a) => a.id === booking));
assert.ok(!scopedAppointments(db, user('admin2')).some((a) => a.id === booking));
deny('u-dr4', 'appointment', { id: booking, status: 'rejected', reason: 'test' }, /nhân viên/);
deny('staff-b2', 'appointment', { id: booking, status: 'rejected', reason: 'test' }, /cơ sở/);
deny('staff-b1', 'appointment', { id: booking, status: 'rejected' }, /lý do/);
run('staff-b1', 'appointment', { id: booking, status: 'confirmed' });
deny(
  'u-dr1',
  'record',
  { appointmentId: booking, finalized: true, symptoms: 'A', diagnosis: 'B' },
  /tiếp nhận/,
);
deny('admin2', 'appointment', { id: booking, status: 'cancelled', reason: 'test' }, /Không thể/);
deny('admin1', 'appointment', { id: booking, status: 'cancelled' }, /lý do/);
run('p1', 'appointment', { id: booking, status: 'cancelled' });
assert.ok(availableSlots(db, 'dr1', form.date).find((s) => s.time === form.time).available);
const rejectBooking = run('p1', 'book', form);
run('staff-b1', 'appointment', {
  id: rejectBooking,
  status: 'rejected',
  reason: 'Hồ sơ cần đặt lại lịch',
});
assert.ok(availableSlots(db, 'dr1', form.date).find((s) => s.time === form.time).available);

// Facility-managed appointments do not reserve a doctor slot and can only finish after reception/time.
const facilityBooking = run('p1', 'book', {
  ...form,
  bookingMode: 'facility',
  doctorId: '',
  date: relativeDate(3),
  time: '',
});
let facilityAppointment = db.appointments.find((a) => a.id === facilityBooking);
assert.equal(facilityAppointment.bookingMode, 'facility');
assert.equal(facilityAppointment.doctorId, '');
assert.equal(
  facilityAppointment.price,
  db.serviceCatalog.find((s) => s.id === 'consultation').price,
);
deny(
  'staff-b2',
  'appointment',
  { id: facilityBooking, status: 'confirmed', time: '10:00' },
  /cơ sở/,
);
deny(
  'staff-b1',
  'appointment',
  { id: facilityBooking, status: 'confirmed', time: '19:00' },
  /giờ hoạt động/,
);
run('staff-b1', 'appointment', { id: facilityBooking, status: 'confirmed', time: '16:30' });
deny('staff-b1', 'appointment', { id: facilityBooking, status: 'completed' }, /sau giờ hẹn/);
facilityAppointment = db.appointments.find((a) => a.id === facilityBooking);
facilityAppointment.date = relativeDate(-1);
facilityAppointment.billing.receivedAt = new Date().toISOString();
deny('u-dr1', 'appointment', { id: facilityBooking, status: 'completed' }, /hoàn tất/);
run('staff-b1', 'appointment', { id: facilityBooking, status: 'completed' });
facilityAppointment = db.appointments.find((a) => a.id === facilityBooking);
assert.equal(facilityAppointment.status, 'completed');

// Clinical records remain limited to the patient's own records and assigned doctor/branch.
db.appointments.find((a) => a.id === 'AT-DEMO-EXAM').billing.receivedAt = new Date().toISOString();
deny('admin1', 'record', { appointmentId: 'AT-DEMO-EXAM', diagnosis: 'x' }, /bác sĩ/);
deny('u-dr1', 'record', { appointmentId: 'AT-DEMO-EXAM', finalized: true }, /triệu chứng/);
run('u-dr1', 'record', {
  appointmentId: 'AT-DEMO-EXAM',
  symptoms: 'Mệt',
  diagnosis: 'Mẫu',
  notes: 'Theo dõi',
  finalized: false,
});
assert.ok(!accessibleRecords(db, user('p1')).some((r) => r.appointmentId === 'AT-DEMO-EXAM'));
run('u-dr1', 'record', {
  appointmentId: 'AT-DEMO-EXAM',
  symptoms: 'Mệt',
  diagnosis: 'Mẫu',
  finalized: true,
});
deny('u-dr1', 'record', { appointmentId: 'AT-DEMO-EXAM', diagnosis: 'Sửa lại' }, /bác sĩ/);
assert.ok(accessibleRecords(db, user('p1')).some((r) => r.appointmentId === 'AT-DEMO-EXAM'));
assert.ok(accessibleRecords(db, user('u-dr1')).every((r) => r.finalized || r.doctorId === 'dr1'));
assert.equal(accessibleRecords(db, user('admin1')).length, 0);
deny('admin2', 'pay', { id: 'AT-DEMO-EXAM' }, /quyền/);
run('admin1', 'bill-finalize', { id: 'AT-DEMO-EXAM', reason: 'Đối chiếu phí khám.' });
run('admin1', 'pay', { id: 'AT-DEMO-EXAM' });
deny('admin1', 'pay', { id: 'AT-DEMO-EXAM' }, /chưa được thu/);
deny('p1', 'appointment', { id: 'AT-DEMO-EXAM', status: 'cancelled' }, /Không thể/);
deny('admin1', 'appointment', { id: 'AT-DEMO-PENDING', status: 'absent' }, /sau giờ/);

// Catalog and schedule mutations are checked even without the UI.
deny('admin1', 'save', { entity: 'branches', id: 'b2', values: { name: 'Khác' } }, /quyền/);
deny('admin1', 'save', { entity: 'users', values: { role: 'superAdmin', name: 'X' } }, /tài khoản/);
deny(
  'root',
  'save',
  { entity: 'users', id: 'root', values: { role: 'superAdmin' } },
  /admin cơ sở/,
);
deny(
  'admin1',
  'save',
  { entity: 'doctors', id: 'dr1', values: { branchId: 'b2' } },
  /chuyển cơ sở/,
);
deny('root', 'save', { entity: 'branches', id: 'b1', values: { active: false } }, /lịch hẹn/);
deny('admin1', 'save', { entity: 'departments', id: 'dep1', values: { active: false } }, /bác sĩ/);
deny('root', 'remove', { entity: 'branches', id: 'b1' }, /liên kết/);
const openId = run('p2', 'book', { ...form, time: '09:00' });
const schedule = db.schedules.find((s) => s.doctorId === 'dr1' && s.date === form.date);
deny(
  'admin1',
  'save',
  { entity: 'schedules', id: schedule.id, values: { times: ['10:00'] } },
  /khung giờ/,
);
deny('admin1', 'remove', { entity: 'schedules', id: schedule.id }, /lịch hẹn/);
deny(
  'admin1',
  'save',
  {
    entity: 'schedules',
    values: { branchId: 'b1', doctorId: 'dr1', date: relativeDate(30), times: ['08:00', '08:15'] },
  },
  /30 phút/,
);
const sId = run('admin1', 'save', {
  entity: 'schedules',
  values: { branchId: 'b1', doctorId: 'dr1', date: relativeDate(30), times: ['08:00', '08:30'] },
});
run('admin1', 'remove', { entity: 'schedules', id: sId });
const newBranch = run('root', 'save', {
  entity: 'branches',
  values: { name: 'Cơ sở thử', active: true },
});
run('root', 'remove', { entity: 'branches', id: newBranch });
const newDoc = run('admin1', 'save', {
  entity: 'doctors',
  values: { name: 'BS. Thử', branchId: 'b1', departmentId: 'dep1', price: 200000, active: true },
});
assert.ok(db.users.some((u) => u.doctorId === newDoc));
run('admin1', 'remove', { entity: 'doctors', id: newDoc });
assert.ok(!db.users.some((u) => u.doctorId === newDoc));

const filters = { from: relativeDate(-120), to: relativeDate(30), group: 'day' };
const all = report(db, user('root'), filters);
const branch = report(db, user('admin1'), filters);
assert.ok(branch.appointments.every((a) => a.branchId === 'b1'));
assert.equal(report(db, user('admin1'), { ...filters, branchId: 'b2' }).appointments.length, 0);
assert.throws(() => report(db, user('p1'), filters), /quyền/);
assert.equal(
  all.revenue,
  db.payments.reduce((s, p) => s + p.amount, 0),
);
assert.equal(
  all.trend.reduce((s, t) => s + t.count, 0),
  all.appointments.length,
);
assert.equal(
  Object.values(all.breakdown).reduce((a, b) => a + b, 0),
  all.appointments.length,
);
const today = report(db, user('root'), { from: dateKey(), to: dateKey() });
assert.ok(today.payments.some((p) => p.appointmentId === 'AT-DEMO-EXAM'));
assert.ok(!today.appointments.some((a) => a.id === 'AT-DEMO-EXAM'));
assert.equal(
  report(db, user('root'), { from: '1990-01-01', to: '1990-01-02' }).appointments.length,
  0,
);

const registered = run(null, 'register', { name: 'Hồ sơ mới', phone: '0991112223' });
assert.equal(user(registered).role, 'patient');
assert.ok(!('password' in user(registered)));
run(registered, 'profile', { name: 'Đã sửa', phone: '0991112223', address: 'TP.HCM' });
deny(registered, 'profile', { name: 'X', phone: 'abc' }, /hợp lệ/);
assert.ok(db.appointments.some((a) => a.id === openId));
console.log(
  `PASS: ${checks} domain actions/permission checks; seed relations, clinical workflow, migration, booking initialization, reporting reconciliation and profiles.`,
);

// Storage upgrade preserves business data and strips retired collections.
const legacy = {
  ...structuredClone(db),
  version: 1,
  medicines: [{ id: 'old' }],
  lots: [],
  transactions: [],
  restocks: [],
};
legacy.branches[0].description = 'Nội dung đã chỉnh sửa';
delete legacy.doctors[0].image;
const upgraded = migrateData(legacy);
assert.equal(upgraded.version, 7);
assert.ok(upgraded.branches.every((branch) => Array.isArray(branch.equipment)));
assert.ok(upgraded.doctors.every((doctor) => Array.isArray(doctor.consultationLanguages)));
assert.equal(upgraded.branches[0].description, legacy.branches[0].description);
for (const key of ['payments']) assert.deepEqual(upgraded[key], legacy[key]);
assert.deepEqual(
  upgraded.appointments.map(({ billing: _billing, ...a }) => a),
  legacy.appointments.map(({ billing: _billing, ...a }) => a),
);
for (const key of ['lots', 'transactions', 'restocks']) assert.ok(!(key in upgraded));
assert.equal(upgraded.medicines.length, 61);
assert.ok(upgraded.doctors[0].image);
assert.equal(legacy.version, 1);
assert.deepEqual(migrateData(upgraded), upgraded);
assert.throws(() => migrateData({ version: 3 }));
assert.throws(() => migrateData({ ...legacy, records: null }));

const seed = createSeed();
const params = new URLSearchParams('doctorId=dr1');
const deepLink = initialBooking(seed, params, { branchId: 'b2', doctorId: 'dr4' });
assert.equal(deepLink.branchId, 'b1');
assert.equal(deepLink.doctorId, 'dr1');
assert.equal(bookingStartStep(deepLink), 2);
const conflicting = initialBooking(seed, new URLSearchParams('branchId=b2&doctorId=dr1'));
assert.equal(conflicting.branchId, 'b2');
assert.equal(conflicting.doctorId, '');
assert.equal(initialBooking(seed, new URLSearchParams('doctorId=missing')).doctorId, '');
const facilityLink = initialBooking(
  seed,
  new URLSearchParams('branchId=b1&specialtyId=sp1&bookingMode=facility'),
);
assert.equal(facilityLink.doctorId, '');
assert.equal(bookingStartStep(facilityLink), 2);
const saved = {
  branchId: 'b1',
  specialtyId: 'sp1',
  doctorId: 'dr1',
  date: relativeDate(2),
  time: '08:00',
};
assert.deepEqual(initialBooking(seed, new URLSearchParams(), saved), {
  ...saved,
  bookingMode: 'doctor',
  insurance: { enabled: false },
  promotionCode: '',
  packageId: '',
  patientName: '',
  phone: '',
  notes: '',
});
assert.equal(
  initialBooking(seed, new URLSearchParams(), { ...saved, date: relativeDate(-2) }).time,
  '',
);
const resumedDoctor = initialBooking(seed, params, {
  ...saved,
  notes: 'Giữ dữ liệu khi đăng nhập quay lại',
});
assert.equal(resumedDoctor.date, saved.date);
assert.equal(resumedDoctor.time, saved.time);
assert.equal(resumedDoctor.notes, 'Giữ dữ liệu khi đăng nhập quay lại');
assert.equal(bookingStartStep(resumedDoctor), 3);
for (const a of seed.appointments) {
  const d = seed.doctors.find((d) => d.id === a.doctorId);
  assert.equal(a.specialtyId, d.specialtyId);
  assert.equal(a.departmentId, d.departmentId);
  const patient = seed.users.find((u) => u.id === a.patientId);
  assert.equal(a.patientName, patient.name);
  assert.equal(a.phone, patient.phone);
  if (a.rating !== undefined) {
    assert.equal(a.status, 'completed');
    assert.ok(Number.isInteger(a.rating) && a.rating >= 1 && a.rating <= 5);
  }
  if (a.status === 'completed')
    assert.equal(seed.records.filter((r) => r.appointmentId === a.id && r.finalized).length, 1);
}
for (const r of seed.records) {
  const a = seed.appointments.find((a) => a.id === r.appointmentId);
  assert.ok(a);
  for (const key of ['patientId', 'doctorId', 'branchId', 'date']) assert.equal(r[key], a[key]);
  assert.equal(r.finalized, a.status === 'completed');
  if (r.followUp) assert.ok(r.followUp > r.date);
}
assert.equal(new Set(seed.payments.map((p) => p.appointmentId)).size, seed.payments.length);
for (const p of seed.payments) {
  const a = seed.appointments.find((a) => a.id === p.appointmentId);
  assert.equal(a.status, 'completed');
  assert.equal(a.price, p.amount);
  assert.equal(a.branchId, p.branchId);
}
assert.equal(new Set(seed.users.filter((u) => u.role === 'patient').map((u) => u.name)).size, 16);
assert.ok(
  seed.doctors.some((d) => !seed.appointments.some((a) => a.doctorId === d.id && a.rating)),
);
console.log(
  'PASS: v1-v6 to v7 migration, draft/deep-link normalization, linked histories and rating integrity.',
);
