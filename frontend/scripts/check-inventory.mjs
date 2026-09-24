import assert from 'node:assert/strict';
import { createSeed, dateKey } from '../src/data/seed.js';
import { act } from '../src/data/domain.js';
import { availableStock, inventoryRow } from '../src/data/inventory.js';
import { migrateData } from '../src/data/storage.js';

let db = createSeed();
assert.equal(db.version, 4);
assert.equal(db.medicines.length, 60);
assert.equal(db.inventory.length, db.branches.length * db.medicines.length);
assert.equal(db.users.filter((u) => u.role === 'staff').length, db.branches.length);

function run(actorId, type, payload) {
  const result = act(db, actorId, type, payload);
  db = result.db;
  return result.result;
}
function deny(actorId, type, payload, message) {
  assert.throws(() => act(db, actorId, type, payload), message);
}

const staffId = run('admin1', 'save', {
  entity: 'users',
  values: {
    name: 'Nhân viên kho mẫu',
    role: 'staff',
    branchId: 'b1',
    phone: '0940000001',
    active: true,
  },
});
assert.equal(db.users.find((u) => u.id === staffId).role, 'staff');
deny(
  'admin1',
  'save',
  {
    entity: 'users',
    values: {
      name: 'Admin mới',
      role: 'branchAdmin',
      branchId: 'b1',
      phone: '0940000002',
      active: true,
    },
  },
  /admin tổng/,
);

const urgentId = run('admin1', 'stock-request-create', {
  kind: 'urgent',
  reason: 'Bổ sung khẩn để phục vụ buổi khám mô phỏng.',
  items: [{ medicineId: 'med002', quantity: 500, purchasePrice: 1000 }],
});
deny(
  'admin1',
  'stock-request-create',
  {
    kind: 'urgent',
    reason: 'Phiếu trùng',
    items: [{ medicineId: 'med002', quantity: 1, purchasePrice: 1000 }],
  },
  /chờ duyệt/,
);
const beforeImport = inventoryRow(db, 'b1', 'med002').quantity;
run('root', 'stock-request-review', { id: urgentId, status: 'approved', reason: '' });
assert.equal(inventoryRow(db, 'b1', 'med002').quantity, beforeImport + 500);
deny('root', 'stock-request-review', { id: urgentId, status: 'approved' }, /không còn/);

const appointment = db.appointments.find((a) => a.id === 'AT-TODAY');
appointment.status = 'pending';
appointment.date = dateKey();
appointment.billing.receivedAt = '';
appointment.billing.insurance = { status: 'none' };
run('staff-b1', 'appointment', { id: appointment.id, status: 'confirmed' });
assert.equal(db.appointments.find((a) => a.id === appointment.id).reviewedBy, 'staff-b1');
run('staff-b1', 'receive', { id: appointment.id });
const stockBeforeReserve = availableStock(inventoryRow(db, 'b1', 'med002'));
run('u-dr1', 'record', {
  appointmentId: appointment.id,
  symptoms: 'Đau đầu nhẹ',
  diagnosis: 'Theo dõi đau đầu',
  notes: 'Theo dõi diễn biến.',
  followUp: '',
  finalized: true,
  services: [],
  serviceReason: 'Giữ nguyên dịch vụ khám.',
  prescription: [
    {
      medicineId: 'med002',
      quantity: 4,
      dosage: '1 viên/lần',
      route: 'Đường uống',
      frequency: '2 lần/ngày',
      duration: '2 ngày',
      instructions: 'Dùng sau ăn',
    },
  ],
});
const record = db.records.find((r) => r.appointmentId === appointment.id);
assert.equal(record.dispenseStatus, 'reserved');
assert.equal(availableStock(inventoryRow(db, 'b1', 'med002')), stockBeforeReserve - 4);
run('admin1', 'bill-finalize', { id: appointment.id, reason: 'Đã đối chiếu chi phí.' });
run('admin1', 'pay', { id: appointment.id, method: 'cash' });
const physicalBefore = inventoryRow(db, 'b1', 'med002').quantity;
run('staff-b1', 'medicine-dispense', { id: appointment.id });
assert.equal(inventoryRow(db, 'b1', 'med002').quantity, physicalBefore - 4);
assert.equal(
  db.records.find((r) => r.appointmentId === appointment.id).dispenseStatus,
  'dispensed',
);
deny('staff-b1', 'medicine-dispense', { id: appointment.id }, /không còn/);
deny('staff-b2', 'medicine-dispense', { id: appointment.id }, /quyền/);

const old = structuredClone(createSeed());
old.version = 3;
delete old.medicines;
delete old.inventorySettings;
delete old.inventory;
delete old.stockRequests;
delete old.inventoryTransactions;
delete old.stockSchedule;
const migrated = migrateData(old);
assert.equal(migrated.version, 4);
assert.equal(migrateData(migrated).medicines.length, 60);

console.log(
  'PASS: inventory schema, branch scope, restock approval, appointment review, prescription reservation, payment and dispensing.',
);
