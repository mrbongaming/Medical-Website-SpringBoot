import { dateKey } from './seed.js';

const check = (ok, message) => {
  if (!ok) throw new Error(message);
};
const uid = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const branchAllowed = (user, branchId) => user.role === 'superAdmin' || user.branchId === branchId;
const branchOperator = (user) => ['branchAdmin', 'staff'].includes(user.role);

export const availableStock = (row) =>
  Math.max(0, Number(row?.quantity || 0) - Number(row?.reserved || 0));
export const inventoryRow = (db, branchId, medicineId) =>
  db.inventory.find((r) => r.branchId === branchId && r.medicineId === medicineId);
export const settingRow = (db, branchId, medicineId) =>
  db.inventorySettings.find((r) => r.branchId === branchId && r.medicineId === medicineId);

function vietnamWeekday() {
  const value = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
  }).format(new Date());
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(value);
}

function normalizeItems(db, items) {
  check(
    Array.isArray(items) && items.length > 0 && items.length <= 500,
    'Yêu cầu phải có từ 1 đến 500 dòng thuốc.',
  );
  const seen = new Set();
  return items.map((item, index) => {
    const medicine = db.medicines.find((m) => m.id === item.medicineId && m.active);
    const quantity = Number(item.quantity);
    const purchasePrice = Number(item.purchasePrice);
    check(medicine, `Dòng ${index + 1}: thuốc không tồn tại hoặc đã ngừng hoạt động.`);
    check(!seen.has(medicine.id), `Dòng ${index + 1}: thuốc bị trùng trong yêu cầu.`);
    check(
      Number.isSafeInteger(quantity) && quantity > 0,
      `Dòng ${index + 1}: số lượng phải là số nguyên dương.`,
    );
    check(
      Number.isSafeInteger(purchasePrice) && purchasePrice > 0,
      `Dòng ${index + 1}: đơn giá nhập không hợp lệ.`,
    );
    seen.add(medicine.id);
    return { medicineId: medicine.id, quantity, purchasePrice };
  });
}

function validateNormal(db, branchId, items, checkDay = true) {
  if (checkDay)
    check(
      db.stockSchedule.weekdays.includes(vietnamWeekday()),
      'Hôm nay không thuộc kỳ tạo yêu cầu nhập thuốc thường.',
    );
  for (const item of items) {
    const stock = inventoryRow(db, branchId, item.medicineId);
    const setting = settingRow(db, branchId, item.medicineId);
    check(stock && setting, 'Thuốc chưa được cấu hình tại cơ sở.');
    check(
      availableStock(stock) < setting.min,
      'Yêu cầu thường chỉ áp dụng khi tồn khả dụng dưới mức tối thiểu.',
    );
    check(
      stock.quantity + item.quantity <= setting.max,
      'Số lượng nhập làm tồn thực tế vượt mức tối đa.',
    );
  }
}

function duplicatePending(db, branchId, items, requestId = '') {
  const medicineIds = new Set(items.map((i) => i.medicineId));
  return db.stockRequests.some(
    (r) =>
      r.id !== requestId &&
      r.branchId === branchId &&
      r.status === 'pending' &&
      r.items.some((i) => medicineIds.has(i.medicineId)),
  );
}

export function inventoryAction(db, user, type, payload) {
  const p = payload || {};
  if (type === 'stock-request-create') {
    check(user.role === 'branchAdmin', 'Chỉ admin cơ sở được tạo yêu cầu nhập thuốc.');
    const items = normalizeItems(db, p.items);
    check(
      !duplicatePending(db, user.branchId, items),
      'Đã có yêu cầu chờ duyệt chứa một hoặc nhiều thuốc này.',
    );
    check(['normal', 'urgent'].includes(p.kind), 'Loại yêu cầu không hợp lệ.');
    if (p.kind === 'normal') validateNormal(db, user.branchId, items);
    else check(String(p.reason || '').trim(), 'Yêu cầu khẩn phải có lý do.');
    const row = {
      id: uid('restock'),
      branchId: user.branchId,
      kind: p.kind,
      status: 'pending',
      reason: String(p.reason || '').trim(),
      items,
      createdBy: user.id,
      createdAt: now(),
      reviewedBy: '',
      reviewedAt: '',
      reviewReason: '',
    };
    db.stockRequests.push(row);
    return row.id;
  }
  if (type === 'stock-request-cancel') {
    const request = db.stockRequests.find((r) => r.id === p.id);
    check(
      request &&
        user.role === 'branchAdmin' &&
        request.branchId === user.branchId &&
        request.status === 'pending',
      'Chỉ được hủy yêu cầu đang chờ của cơ sở mình.',
    );
    request.status = 'cancelled';
    request.reviewReason = String(p.reason || '').trim();
    request.reviewedBy = user.id;
    request.reviewedAt = now();
    return request.id;
  }
  if (type === 'stock-request-review') {
    check(user.role === 'superAdmin', 'Chỉ admin tổng được phê duyệt yêu cầu nhập thuốc.');
    const request = db.stockRequests.find((r) => r.id === p.id);
    check(request?.status === 'pending', 'Yêu cầu không còn ở trạng thái chờ duyệt.');
    check(['approved', 'rejected'].includes(p.status), 'Kết quả duyệt không hợp lệ.');
    if (p.status === 'rejected')
      check(String(p.reason || '').trim(), 'Vui lòng nhập lý do từ chối.');
    if (p.status === 'approved') {
      const items = normalizeItems(db, request.items);
      check(
        !duplicatePending(db, request.branchId, items, request.id),
        'Có yêu cầu chờ duyệt khác trùng thuốc tại cơ sở này.',
      );
      if (request.kind === 'normal') validateNormal(db, request.branchId, items, false);
      for (const item of items) {
        const stock = inventoryRow(db, request.branchId, item.medicineId);
        stock.quantity += item.quantity;
        db.inventoryTransactions.push({
          id: uid('stock-in'),
          type: 'restock',
          branchId: request.branchId,
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.purchasePrice,
          requestId: request.id,
          appointmentId: '',
          actorId: user.id,
          at: now(),
        });
      }
    }
    request.status = p.status;
    request.reviewReason = String(p.reason || '').trim();
    request.reviewedBy = user.id;
    request.reviewedAt = now();
    return request.id;
  }
  if (type === 'inventory-settings-save') {
    check(user.role === 'superAdmin', 'Chỉ admin tổng được cấu hình kho thuốc.');
    if (Array.isArray(p.weekdays)) {
      const weekdays = [...new Set(p.weekdays.map(Number))].filter((d) => d >= 0 && d <= 6).sort();
      check(weekdays.length, 'Chọn ít nhất một ngày tạo yêu cầu nhập thường.');
      db.stockSchedule = {
        weekdays,
        timezone: 'Asia/Ho_Chi_Minh',
        updatedBy: user.id,
        updatedAt: now(),
      };
    }
    if (p.medicineId) {
      const row = settingRow(db, p.branchId, p.medicineId);
      const min = Number(p.min),
        max = Number(p.max);
      check(
        row && Number.isSafeInteger(min) && min >= 0 && Number.isSafeInteger(max) && max > min,
        'Ngưỡng tồn kho không hợp lệ.',
      );
      Object.assign(row, { min, max });
    }
    return true;
  }
  if (type === 'medicine-save') {
    check(user.role === 'superAdmin', 'Chỉ admin tổng được quản lý danh mục thuốc.');
    const row = db.medicines.find((m) => m.id === p.id);
    check(row, 'Không tìm thấy thuốc.');
    const salePrice = Number(p.salePrice);
    check(Number.isSafeInteger(salePrice) && salePrice > 0, 'Giá bán phải là số nguyên dương.');
    Object.assign(row, { salePrice, active: p.active === true });
    return row.id;
  }
  if (type === 'medicine-dispense' || type === 'medicine-cancel') {
    const appointment = db.appointments.find((a) => a.id === p.id);
    const record = db.records.find((r) => r.appointmentId === p.id);
    check(
      appointment &&
        record?.prescription?.length &&
        branchAllowed(user, appointment.branchId) &&
        (branchOperator(user) || user.role === 'superAdmin'),
      'Không có quyền xử lý đơn thuốc này.',
    );
    check(record.dispenseStatus === 'reserved', 'Đơn thuốc không còn ở trạng thái chờ cấp.');
    if (type === 'medicine-dispense') {
      check(appointment.billing.settledAt, 'Chỉ cấp thuốc sau khi đã hoàn tất thanh toán.');
      for (const item of record.prescription) {
        const stock = inventoryRow(db, appointment.branchId, item.medicineId);
        check(
          stock && stock.quantity >= item.quantity && stock.reserved >= item.quantity,
          'Tồn kho đã thay đổi, không thể cấp đủ đơn thuốc.',
        );
        stock.quantity -= item.quantity;
        stock.reserved -= item.quantity;
        db.inventoryTransactions.push({
          id: uid('stock-out'),
          type: 'dispense',
          branchId: appointment.branchId,
          medicineId: item.medicineId,
          quantity: -item.quantity,
          unitPrice: item.unitPrice,
          requestId: '',
          appointmentId: appointment.id,
          actorId: user.id,
          at: now(),
        });
      }
      record.dispenseStatus = 'dispensed';
      record.dispensedBy = user.id;
      record.dispensedAt = now();
    } else {
      check(
        !appointment.billing.finalized && !appointment.billing.settledAt,
        'Chỉ hủy cấp thuốc trước khi chốt phí hoặc thu tiền.',
      );
      check(String(p.reason || '').trim(), 'Vui lòng nhập lý do hủy cấp thuốc.');
      for (const item of record.prescription)
        inventoryRow(db, appointment.branchId, item.medicineId).reserved -= item.quantity;
      appointment.billing.medicineItems = [];
      record.dispenseStatus = 'cancelled';
      record.dispenseReason = String(p.reason).trim();
      record.dispensedBy = user.id;
      record.dispensedAt = now();
    }
    return record.id;
  }
  return null;
}

export function validateAndReservePrescription(db, appointment, payload) {
  const prescription = payload.prescription === undefined ? [] : payload.prescription;
  check(Array.isArray(prescription) && prescription.length <= 20, 'Đơn thuốc không hợp lệ.');
  const seen = new Set();
  const snapshot = prescription.map((line, index) => {
    const medicine = db.medicines.find((m) => m.id === line.medicineId && m.active);
    const stock = inventoryRow(db, appointment.branchId, line.medicineId);
    const quantity = Number(line.quantity);
    check(
      medicine && stock && !seen.has(medicine.id),
      `Dòng thuốc ${index + 1} không hợp lệ hoặc bị trùng.`,
    );
    check(
      Number.isSafeInteger(quantity) && quantity > 0 && quantity <= 1000,
      `Dòng thuốc ${index + 1} có số lượng không hợp lệ.`,
    );
    check(
      [line.dosage, line.route, line.frequency, line.duration].every((v) => String(v || '').trim()),
      `Dòng thuốc ${index + 1} chưa đủ hướng dẫn sử dụng.`,
    );
    check(availableStock(stock) >= quantity, `${medicine.name} không đủ tồn khả dụng.`);
    seen.add(medicine.id);
    return {
      medicineId: medicine.id,
      code: medicine.code,
      name: medicine.name,
      activeIngredient: medicine.activeIngredient,
      strength: medicine.name.replace(/^.*?(\d.*)$/, '$1'),
      form: medicine.form,
      unit: medicine.unit,
      quantity,
      dosage: String(line.dosage).trim(),
      route: String(line.route).trim(),
      frequency: String(line.frequency).trim(),
      duration: String(line.duration).trim(),
      instructions: String(line.instructions || '').trim(),
      unitPrice: medicine.salePrice,
    };
  });
  for (const item of snapshot)
    inventoryRow(db, appointment.branchId, item.medicineId).reserved += item.quantity;
  return snapshot;
}

export function inventorySummary(db, branchId = '') {
  const stocks = db.inventory.filter((r) => !branchId || r.branchId === branchId);
  const requests = db.stockRequests.filter((r) => !branchId || r.branchId === branchId);
  const transactions = db.inventoryTransactions.filter((r) => !branchId || r.branchId === branchId);
  const low = stocks.filter(
    (r) => availableStock(r) < settingRow(db, r.branchId, r.medicineId).min,
  );
  return {
    stocks,
    low,
    out: stocks.filter((r) => availableStock(r) === 0),
    requests,
    pending: requests.filter((r) => r.status === 'pending').length,
    importValue: transactions
      .filter((r) => r.type === 'restock')
      .reduce((s, r) => s + r.quantity * r.unitPrice, 0),
    dispensed: transactions
      .filter((r) => r.type === 'dispense')
      .reduce((s, r) => s + Math.abs(r.quantity), 0),
    asOf: dateKey(),
  };
}
